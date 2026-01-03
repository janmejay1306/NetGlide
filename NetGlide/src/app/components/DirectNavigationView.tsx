import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Globe, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface DirectNavigationViewProps {
  url: string;
  onTitleChange?: (title: string) => void;
}

export function DirectNavigationView({ url, onTitleChange }: DirectNavigationViewProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const loadingTimerRef = useRef<NodeJS.Timeout>();
  const lastUrlRef = useRef<string>('');
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    // Only process if URL changed
    if (lastUrlRef.current === url || !url) {
      if (!url) {
        setIsNavigating(false);
        setHasTimedOut(false);
        setLoadingTime(0);
        hasNavigatedRef.current = false;
      }
      return;
    }

    lastUrlRef.current = url;
    hasNavigatedRef.current = false;

    // Reset states
    setIsNavigating(true);
    setHasTimedOut(false);
    setLoadingTime(0);

    // Extract domain for title
    try {
      const domain = new URL(url).hostname;
      if (onTitleChange) {
        onTitleChange(domain);
      }
    } catch {
      if (onTitleChange) {
        onTitleChange('Loading...');
      }
    }

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);

    // Loading time counter
    let seconds = 0;
    loadingTimerRef.current = setInterval(() => {
      seconds += 1;
      setLoadingTime(seconds);
    }, 1000);

    // Show loading screen for 2 seconds, then navigate
    const navigationTimer = setTimeout(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        // Direct navigation - opens URL in current window
        window.location.href = url;
      }
    }, 2000);

    // 30-second hard timeout (in case something goes wrong)
    timeoutRef.current = setTimeout(() => {
      if (isNavigating && !hasNavigatedRef.current) {
        setHasTimedOut(true);
        setIsNavigating(false);
        if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      }
    }, 30000);

    return () => {
      clearTimeout(navigationTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    };
  }, [url]);

  const handleRetry = () => {
    setIsNavigating(true);
    setHasTimedOut(false);
    setLoadingTime(0);
    hasNavigatedRef.current = false;
    
    setTimeout(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        window.location.href = url;
      }
    }, 500);
  };

  const handleOpenNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full" style={{
        background: 'linear-gradient(to bottom right, var(--theme-bg-gradient-from, rgb(88, 28, 135)), var(--theme-bg-gradient-to, rgb(30, 58, 138)))',
        opacity: 0.2,
      }}>
        <div className="text-center" style={{ color: 'var(--theme-text-secondary, rgb(209, 213, 219))' }}>
          <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">Enter a URL or search query to get started</p>
          <p className="text-sm mt-2 opacity-70">Use the search bar above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{
      background: 'linear-gradient(to bottom right, var(--theme-bg-gradient-from, rgb(88, 28, 135)), var(--theme-bg-gradient-to, rgb(30, 58, 138)))',
      opacity: 0.4,
    }}>
      {/* Loading Overlay */}
      <AnimatePresence>
        {isNavigating && !hasTimedOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center backdrop-blur-xl z-20"
            style={{
              background: 'linear-gradient(to bottom right, var(--theme-bg-gradient-from, rgb(88, 28, 135)), var(--theme-bg-gradient-to, rgb(30, 58, 138)))',
              opacity: 0.6,
            }}
          >
            <div className="text-center">
              {/* Neon Glowing Spinner */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <Loader2 
                  className="w-20 h-20 mx-auto mb-6" 
                  style={{ 
                    color: 'var(--theme-primary, rgb(168, 85, 247))',
                    filter: `drop-shadow(0 0 20px var(--theme-glow, rgba(168, 85, 247, 0.5))) drop-shadow(0 0 40px var(--theme-glow, rgba(168, 85, 247, 0.3)))`,
                  }} 
                />
                {/* Outer glow ring */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, var(--theme-glow, rgba(168, 85, 247, 0.3)) 0%, transparent 70%)`,
                  }}
                />
              </motion.div>

              <motion.h2 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl mb-3 bg-clip-text text-transparent font-bold"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--theme-primary, rgb(168, 85, 247)), var(--theme-secondary, rgb(59, 130, 246)))`,
                }}
              >
                Navigating to your page...
              </motion.h2>

              <div 
                className="mb-6 px-6 py-4 rounded-2xl backdrop-blur-xl border inline-block mx-4 max-w-2xl"
                style={{
                  background: 'var(--theme-card-bg, rgba(17, 24, 39, 0.95))',
                  borderColor: 'var(--theme-card-border, rgba(168, 85, 247, 0.3))',
                  boxShadow: `0 0 30px var(--theme-glow, rgba(168, 85, 247, 0.2))`,
                }}
              >
                <p className="text-sm mb-2" style={{ color: 'var(--theme-text-secondary, rgb(209, 213, 219))' }}>
                  Destination:
                </p>
                <p className="break-all text-lg" style={{ color: 'var(--theme-text, #ffffff)' }}>
                  {url}
                </p>
              </div>

              {loadingTime > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm"
                  style={{ color: 'var(--theme-text-secondary, rgb(209, 213, 219))' }}
                >
                  Loading... ({loadingTime}s)
                </motion.p>
              )}

              {/* Technical annotation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 p-5 rounded-2xl backdrop-blur-xl border max-w-2xl mx-auto"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                }}
              >
                <p className="text-sm" style={{ color: 'rgb(147, 197, 253)' }}>
                  <span className="text-2xl">⚡</span> <strong>Direct Navigation Active</strong>
                  <br />
                  <span className="text-xs opacity-80">
                    All sites load in current tab to bypass iframe restrictions (X-Frame-Options, CSP headers)
                  </span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeout Overlay */}
      <AnimatePresence>
        {hasTimedOut && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex items-center justify-center backdrop-blur-xl z-20 p-8"
            style={{
              background: 'linear-gradient(to bottom right, var(--theme-bg-gradient-from, rgb(88, 28, 135)), var(--theme-bg-gradient-to, rgb(30, 58, 138)))',
              opacity: 0.6,
            }}
          >
            <div 
              className="max-w-lg w-full p-8 rounded-3xl backdrop-blur-xl shadow-2xl text-center border"
              style={{
                background: 'var(--theme-card-bg, rgba(17, 24, 39, 0.95))',
                borderColor: 'rgba(251, 191, 36, 0.3)',
                boxShadow: '0 0 50px rgba(251, 191, 36, 0.2)',
              }}
            >
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-full border flex items-center justify-center"
                style={{
                  background: 'rgba(251, 191, 36, 0.2)',
                  borderColor: 'rgba(251, 191, 36, 0.4)',
                }}
              >
                <AlertCircle className="w-10 h-10" style={{ color: 'rgb(251, 191, 36)' }} />
              </div>
              
              <h3 className="text-3xl mb-4" style={{ color: 'rgb(251, 191, 36)' }}>
                Connection Timeout
              </h3>
              
              <p className="mb-6 leading-relaxed" style={{ color: 'var(--theme-text-secondary, rgb(209, 213, 219))' }}>
                The page took too long to respond. This could be due to a slow connection or the website being unavailable.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleRetry}
                  className="text-white text-lg py-6 shadow-lg"
                  style={{
                    background: `linear-gradient(to right, var(--theme-primary, rgb(168, 85, 247)), var(--theme-secondary, rgb(59, 130, 246)))`,
                    boxShadow: `0 0 30px var(--theme-glow, rgba(168, 85, 247, 0.3))`,
                  }}
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={handleOpenNewTab}
                  variant="outline"
                  className="text-lg py-6"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'var(--theme-text, #ffffff)',
                  }}
                >
                  Open in New Tab
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
