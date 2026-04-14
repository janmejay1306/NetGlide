import { useEffect, useRef } from 'react';

interface BrowserWebviewProps {
  tab: { id: string; url: string; isActive: boolean };
  onTitleChange: (tabId: string, title: string) => void;
  isDarkMode?: boolean;
}

export function BrowserWebview({ tab, onTitleChange, isDarkMode = false }: BrowserWebviewProps) {
  const webviewRef = useRef<any>(null);
  const cssKeyRef = useRef<string | null>(null);
  
  const onTitleChangeRef = useRef(onTitleChange);
  useEffect(() => {
    onTitleChangeRef.current = onTitleChange;
  }, [onTitleChange]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handlePageTitleUpdated = (e: any) => {
      onTitleChangeRef.current(tab.id, e.title);
    };

    webview.addEventListener('page-title-updated', handlePageTitleUpdated);

    const applyDarkMode = async () => {
      if (!webview) return;
      if (typeof webview.insertCSS !== 'function') return;
      
      if (isDarkMode) {
        if (!cssKeyRef.current) {
          try {
              const css = `
                @media (prefers-color-scheme: light) {
                  html {
                    background-color: #121212 !important;
                    filter: invert(1) hue-rotate(180deg) !important;
                  }
                  img, video, iframe, canvas, object, embed, picture {
                    filter: invert(1) hue-rotate(180deg) !important;
                  }
                }
              `;
            cssKeyRef.current = await webview.insertCSS(css);
          } catch (err) {
            console.error('Failed to insert dark mode CSS:', err);
          }
        }
      } else {
        if (cssKeyRef.current) {
          try {
            if (typeof webview.removeInsertedCSS === 'function') {
              await webview.removeInsertedCSS(cssKeyRef.current);
            }
          } catch (err) {
            console.error('Failed to remove dark mode CSS:', err);
          }
          cssKeyRef.current = null;
        }
      }
    };

    const injectScrollbar = async () => {
      if (!webview || typeof webview.insertCSS !== 'function') return;
      try {
        await webview.insertCSS(`
          ::-webkit-scrollbar { width: 12px; height: 12px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.4); border-radius: 6px; border: 3px solid transparent; background-clip: content-box; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(128, 128, 128, 0.6); }
          ::-webkit-scrollbar-corner { background: transparent; }
        `);
      } catch (err) {}
    };

    const handleDidFinishLoad = () => {
      // Always clear the ref on a new page load
      cssKeyRef.current = null;
      applyDarkMode();
    };

    webview.addEventListener('did-finish-load', handleDidFinishLoad);

    const handleDomReady = () => {
      applyDarkMode();
      injectScrollbar();
    };

    // Attempt to apply styles immediately. Gracefully fails if not fully ready.
    applyDarkMode();
    injectScrollbar();
    webview.addEventListener('dom-ready', handleDomReady);

    return () => {
      webview.removeEventListener('page-title-updated', handlePageTitleUpdated);
      webview.removeEventListener('did-finish-load', handleDidFinishLoad);
      webview.removeEventListener('dom-ready', handleDomReady);
    };
  }, [tab.id, isDarkMode]);

  return (
    <webview
      ref={webviewRef}
      src={tab.url}
      className={`absolute top-0 left-0 ${tab.isActive ? 'block' : 'hidden'}`}
      style={{ width: '100%', height: '100%', display: tab.isActive ? 'flex' : 'none' }}
      {...({ allowpopups: "true" } as any)}
    />
  );
}
