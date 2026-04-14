import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Loader2, CheckCircle } from 'lucide-react';

interface DirectNavigationViewProps {
  url: string;
  onTitleChange: (title: string) => void;
}

function isElectronRuntime() {
  return typeof window !== 'undefined' && !!(window as any).process?.versions?.electron;
}

export function DirectNavigationView({ url, onTitleChange }: DirectNavigationViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [tabId] = useState(() => Date.now().toString());
  const [loadError, setLoadError] = useState<string | null>(null);

  const isElectron = useMemo(() => isElectronRuntime(), []);

  const hostnameOrUrl = useMemo(() => {
    if (!url) return '';
    try {
      return new URL(url).hostname || url;
    } catch {
      return url;
    }
  }, [url]);

  useEffect(() => {
    if (!url) return;

    setLoadError(null);
    onTitleChange(hostnameOrUrl || 'Loading...');

    // Electron path: open in the user's default browser using electron.shell.
    if (isElectron) {
      setIsCreating(true);
      setCreated(false);

      try {
        const electron = (window as any).require?.('electron');
        const shell = electron?.shell;
        if (shell && typeof shell.openExternal === 'function') {
          shell.openExternal(url);
        }
        setIsCreating(false);
        setCreated(true);
      } catch (err: any) {
        console.error('Electron shell openExternal failed:', err);
        setIsCreating(false);
        setCreated(false);
        setLoadError(err?.message || 'Failed to open in browser');
      }

      // We don't manage a child window's lifecycle here; Electron/browser
      // handles the external tab. Nothing to clean up on unmount.
      return;
    }

    // Unknown runtime: don't hang forever.
    setIsCreating(false);
    setCreated(false);
    setLoadError('Navigation runtime not available (Electron not detected).');
  }, [hostnameOrUrl, isElectron, onTitleChange, tabId, url]);

  if (!url) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/10 to-blue-900/10">
        <div className="text-center px-8 max-w-2xl">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <div className="text-7xl mb-6">🚀</div>
          </motion.div>
          <h3 className="text-3xl text-white font-bold mb-3">Welcome to NetGlide</h3>
          <p className="text-gray-400 mb-8">A real browser - Fast, native, and unrestricted</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-sm text-purple-300 font-semibold">Lightning Fast</p>
              <p className="text-xs text-gray-500 mt-1">Native performance</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4">
              <div className="text-3xl mb-2">🔓</div>
              <p className="text-sm text-blue-300 font-semibold">No Restrictions</p>
              <p className="text-xs text-gray-500 mt-1">Works with all sites</p>
            </div>
            <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-4">
              <div className="text-3xl mb-2">🛡️</div>
              <p className="text-sm text-green-300 font-semibold">Secure</p>
              <p className="text-xs text-gray-500 mt-1">Built with Rust</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-2xl p-6">
            <p className="text-sm text-gray-300">
              Enter any URL or search term above to start browsing
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isElectron) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-8">
        <div className="max-w-xl text-center">
          {loadError ? (
            <>
              <h3 className="text-2xl text-white font-bold mb-3">Couldn’t open page</h3>
              <p className="text-gray-300 break-words mb-2">{hostnameOrUrl}</p>
              <p className="text-gray-500 text-sm break-words">{loadError}</p>
            </>
          ) : (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl text-white font-bold mb-2">Opened in your browser</h3>
              <p className="text-gray-300 break-words">
                We opened <span className="font-semibold">{hostnameOrUrl}</span> in your default browser.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-8"
    >
      {isCreating ? (
        <div className="text-center">
          <Loader2 className="w-20 h-20 text-purple-400 animate-spin mx-auto mb-6" />
          <h3 className="text-2xl text-white font-bold mb-2">Launching Browser...</h3>
          <p className="text-gray-400">
            {hostnameOrUrl}
          </p>
        </div>
      ) : created ? (
        <div className="max-w-3xl text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
          </motion.div>

          <h2 className="text-4xl text-white font-bold mb-4">Browser Window Opened! 🎉</h2>

          <div className="bg-black/50 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <ExternalLink className="w-6 h-6 text-purple-400" />
              <p className="text-2xl text-purple-400 font-semibold">
                {hostnameOrUrl}
              </p>
            </div>
            <p className="text-gray-400 text-sm">is now open in a native window</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-2xl p-6 text-left">
              <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                <span>✅</span> Real Browser Engine
              </h4>
              <ul className="text-xs text-gray-400 space-y-2">
                <li>• Native WebView (no iframes)</li>
                <li>• Works with Google, YouTube, GitHub</li>
                <li>• Full JavaScript & cookies support</li>
                <li>• Just like Firefox or Opera</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/20 rounded-2xl p-6 text-left">
              <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                <span>⚡</span> Performance
              </h4>
              <ul className="text-xs text-gray-400 space-y-2">
                <li>• Lightweight Rust backend</li>
                <li>• Native OS integration</li>
                <li>• Faster than Electron</li>
                <li>• Lower memory usage</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-gray-600">
            The browser window opened separately. You can close this tab or search for something else.
          </p>
        </div>
      ) : null}
    </motion.div>
  );
}