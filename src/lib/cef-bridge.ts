/**
 * CEF Bridge for NetGlide
 * 
 * Provides a drop-in IPC compatibility layer for Chromium Embedded Framework (CEF),
 * mimicking electron's `ipcRenderer` and connecting to `window.cefQuery` and C++ backend events.
 */

interface CefQueryArgs {
  request: string;
  persistent?: boolean;
  onSuccess?: (response: string) => void;
  onFailure?: (errorCode: number, errorMessage: string) => void;
}

declare global {
  interface Window {
    cefQuery?: (args: CefQueryArgs) => number;
    cefQueryCancel?: (queryId: number) => void;
    __netglide_emit?: (event: string, data: any) => void;
    ipcRenderer?: any;
  }
}

type EventCallback = (...args: any[]) => void;
const listeners = new Map<string, Set<EventCallback>>();

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

async function scrapeDuckDuckGo(q: string) {
  const results: any[] = [];
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
    const resp = await fetch(url);
    const html = await resp.text();
    const resultBlocks = html.split(/class="result\s/g).slice(1);
    for (const block of resultBlocks.slice(0, 10)) {
      const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
      const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);

      if (titleMatch) {
        let resultUrl = decodeHtmlEntities(titleMatch[1]);
        const uddgMatch = resultUrl.match(/uddg=([^&]+)/);
        if (uddgMatch) resultUrl = decodeURIComponent(uddgMatch[1]);

        const title = decodeHtmlEntities(stripTags(titleMatch[2]));
        const snippet = snippetMatch ? decodeHtmlEntities(stripTags(snippetMatch[1])) : '';

        if (resultUrl.startsWith('http')) {
          let displayUrl = resultUrl;
          try { displayUrl = new URL(resultUrl).hostname.replace('www.', ''); } catch {}
          results.push({
            title: title || displayUrl,
            url: resultUrl,
            displayUrl,
            snippet,
            favicon: `https://www.google.com/s2/favicons?domain=${displayUrl}&sz=32`,
          });
        }
      }
    }
  } catch (e) {
    console.error('[NetGlide] DDG scrape error:', e);
  }
  return results;
}

async function scrapeBing(q: string) {
  const results: any[] = [];
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(q)}&count=10`;
    const resp = await fetch(url);
    const html = await resp.text();
    const blocks = html.split(/<li class="b_algo">/g).slice(1);
    for (const block of blocks.slice(0, 10)) {
      const linkMatch = block.match(/<h2>\s*<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/);
      const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/);

      if (linkMatch) {
        const resultUrl = decodeHtmlEntities(linkMatch[1]);
        const title = decodeHtmlEntities(stripTags(linkMatch[2]));
        const snippet = snippetMatch ? decodeHtmlEntities(stripTags(snippetMatch[1])) : '';
        let displayUrl = resultUrl;
        try { displayUrl = new URL(resultUrl).hostname.replace('www.', ''); } catch {}
        results.push({
          title,
          url: resultUrl,
          displayUrl,
          snippet,
          favicon: `https://www.google.com/s2/favicons?domain=${displayUrl}&sz=32`,
        });
      }
    }
  } catch (e) {
    console.error('[NetGlide] Bing scrape error:', e);
  }
  return results;
}

export const cefIpc = {
  on(channel: string, callback: EventCallback) {
    if (!listeners.has(channel)) {
      listeners.set(channel, new Set());
    }
    listeners.get(channel)!.add(callback);
  },

  removeListener(channel: string, callback: EventCallback) {
    listeners.get(channel)?.delete(callback);
  },

  send(channel: string, ...args: any[]) {
    if (typeof window !== 'undefined' && window.cefQuery) {
      if (channel === 'open-download-folder') {
        window.cefQuery({ request: 'open-download-folder' });
      } else if (channel === 'show-in-folder') {
        window.cefQuery({ request: `show-in-folder:${args[0]}` });
      } else if (channel === 'open-external') {
        window.cefQuery({ request: `open-external:${args[0]}` });
      }
    } else {
      console.log(`[CEF Bridge] send: ${channel}`, args);
    }
  },

  async invoke(channel: string, ...args: any[]): Promise<any> {
    if (channel === 'get-download-path') {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined' && window.cefQuery) {
          window.cefQuery({
            request: 'get-download-path',
            onSuccess: (res) => resolve(res),
            onFailure: () => resolve('C:\\Downloads'),
          });
        } else {
          resolve('C:\\Downloads');
        }
      });
    }

    if (channel === 'choose-download-path') {
      return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && window.cefQuery) {
          window.cefQuery({
            request: 'choose-download-path',
            onSuccess: (res) => resolve(res),
            onFailure: (_code, msg) => reject(new Error(msg)),
          });
        } else {
          resolve(null);
        }
      });
    }

    if (channel === 'search-query') {
      const { query, engine } = args[0] || {};
      if (!query) return [];
      
      let results: any[] = [];
      if (engine === 'bing') {
        results = await scrapeBing(query);
      } else {
        results = await scrapeDuckDuckGo(query);
      }

      if (results.length === 0 && engine !== 'bing') {
        results = await scrapeBing(query);
      }
      return results;
    }

    return null;
  },
};

// Dispatch events from C++ / Electron
if (typeof window !== 'undefined') {
  let nativeElectronIpc: any = null;
  try {
    if (typeof (window as any).require === 'function') {
      const electron = (window as any).require('electron');
      if (electron && electron.ipcRenderer) {
        nativeElectronIpc = electron.ipcRenderer;
      }
    }
  } catch (_e) {
    // Not running inside Electron with nodeIntegration
  }

  if (nativeElectronIpc) {
    // In Electron environment, use native Electron ipcRenderer
    window.ipcRenderer = nativeElectronIpc;
  } else {
    // In CEF or browser environment, provide CEF IPC bridge
    window.__netglide_emit = (event: string, data: any) => {
      const callbacks = listeners.get(event);
      if (callbacks) {
        callbacks.forEach((cb) => {
          try {
            cb({}, data);
          } catch (e) {
            console.error(`[CEF Bridge] Error in listener for ${event}:`, e);
          }
        });
      }
    };

    window.ipcRenderer = cefIpc;
  }
}
