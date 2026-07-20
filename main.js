const { app, BrowserWindow, dialog, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const isDev = !app.isPackaged;

// ---------------------------------------------------------------------------
// Download management (module-level so IPC handlers are always registered)
// ---------------------------------------------------------------------------
let downloadPath = app.getPath('downloads'); // default = OS Downloads folder
let mainWin = null;

function setupDownloadHandler(win) {
  win.webContents.session.on('will-download', (event, item) => {
    // Prompt the user for a save location instead of auto-saving
    const defaultPath = path.join(downloadPath, item.getFilename());
    const savePath = dialog.showSaveDialogSync(win, {
      title: 'Save File',
      defaultPath: defaultPath,
    });

    if (!savePath) {
      item.cancel();
      return; // User canceled the download
    }

    item.setSavePath(savePath);

    const downloadId = Date.now().toString();
    const fileSize = item.getTotalBytes();

    // Tell the renderer a download has started
    win.webContents.send('download-started', {
      id: downloadId,
      name: path.basename(savePath),
      totalSize: fileSize > 0 ? `${(fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
      savePath,
    });

    let lastReceived = 0;
    let lastTime = Date.now();

    item.on('updated', (event, state) => {
      if (state === 'progressing') {
        const received = item.getReceivedBytes();
        const total = item.getTotalBytes();
        const progress = total > 0 ? Math.round((received / total) * 100) : 0;

        // Calculate speed in MB/s
        const now = Date.now();
        const elapsed = (now - lastTime) / 1000;
        const bytesPerSec = elapsed > 0 ? (received - lastReceived) / elapsed : 0;
        lastReceived = received;
        lastTime = now;
        const speedStr = bytesPerSec > 0
          ? bytesPerSec > 1024 * 1024
            ? `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`
            : `${(bytesPerSec / 1024).toFixed(0)} KB/s`
          : '...';

        win.webContents.send('download-progress', {
          id: downloadId,
          progress,
          speed: speedStr,
        });
      }
    });

    item.once('done', (event, state) => {
      win.webContents.send('download-done', {
        id: downloadId,
        status: state === 'completed' ? 'completed' : 'failed',
        savePath,
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Auto-updater configuration
// ---------------------------------------------------------------------------
function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.logger = console;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version of NetGlide (v${info.version}) is available.`,
      detail: 'Would you like to download it now?',
      buttons: ['Download', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }).then(({ response }) => {
      if (response === 0) autoUpdater.downloadUpdate();
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'The update has been downloaded.',
      detail: 'NetGlide will restart to install the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.checkForUpdates();
}

// ---------------------------------------------------------------------------
// Menu configuration
// ---------------------------------------------------------------------------
function createMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ---------------------------------------------------------------------------
// IPC handlers (registered at module level — always available)
// ---------------------------------------------------------------------------

// Open the current downloads folder in the OS file explorer
ipcMain.on('open-download-folder', () => {
  shell.openPath(downloadPath).catch(console.error);
});

// Show a specific downloaded file highlighted in Explorer / Finder
ipcMain.on('show-in-folder', (event, filePath) => {
  shell.showItemInFolder(filePath);
});

// Return the current download path to the renderer
ipcMain.handle('get-download-path', () => downloadPath);

// ---------------------------------------------------------------------------
// Search results proxy — fetches and parses search engine HTML server-side
// to avoid CORS restrictions. Returns structured SearchResult[] to renderer.
// ---------------------------------------------------------------------------
ipcMain.handle('search-query', async (_event, { query, engine }) => {
  const https = require('https');
  const http = require('http');

  function httpGet(url) {
    return new Promise((resolve, reject) => {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 5000,
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          httpGet(res.headers.location).then(resolve).catch(reject);
          return;
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
  }

  function decodeHtmlEntities(str) {
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

  function stripTags(str) {
    return str.replace(/<[^>]*>/g, '').trim();
  }

  async function scrapeDuckDuckGo(q) {
    const results = [];
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      const html = await httpGet(url);
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

  async function scrapeBing(q) {
    const results = [];
    try {
      const url = `https://www.bing.com/search?q=${encodeURIComponent(q)}&count=10`;
      const html = await httpGet(url);
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

  async function scrapeGoogle(q) {
    const results = [];
    try {
      const url = `https://www.google.com/search?q=${encodeURIComponent(q)}&num=10&hl=en`;
      const html = await httpGet(url);
      const linkRegex = /<a[^>]*href="\/url\?q=([^&"]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      const seenUrls = new Set();

      while ((match = linkRegex.exec(html)) !== null) {
        const resultUrl = decodeURIComponent(match[1]);
        if (seenUrls.has(resultUrl)) continue;
        if (!resultUrl.startsWith('http')) continue;

        try {
          const host = new URL(resultUrl).hostname;
          if (host.includes('google.com') || host.includes('google.co')) continue;
        } catch { continue; }

        seenUrls.add(resultUrl);
        const h3Match = match[2].match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
        const title = h3Match ? decodeHtmlEntities(stripTags(h3Match[1])) : '';
        if (!title) continue;

        const afterMatch = html.slice(match.index + match[0].length, match.index + match[0].length + 1500);
        const snippetCandidates = afterMatch.match(/<span[^>]*>([\s\S]{30,300}?)<\/span>/);
        let snippet = '';
        if (snippetCandidates) {
          snippet = decodeHtmlEntities(stripTags(snippetCandidates[1]));
        }

        let displayUrl = resultUrl;
        try { displayUrl = new URL(resultUrl).hostname.replace('www.', ''); } catch {}

        results.push({
          title,
          url: resultUrl,
          displayUrl,
          snippet,
          favicon: `https://www.google.com/s2/favicons?domain=${displayUrl}&sz=32`,
        });

        if (results.length >= 10) break;
      }
    } catch (e) {
      console.error('[NetGlide] Google scrape error:', e);
    }
    return results;
  }

  // ── Engine Dispatcher ──
  async function runScrape(targetEngine) {
    if (targetEngine === 'duckduckgo') return scrapeDuckDuckGo(query);
    if (targetEngine === 'bing') return scrapeBing(query);
    return scrapeGoogle(query);
  }

  // ── Run with fallback cascade ──
  let results = [];
  try {
    results = await runScrape(engine);
    
    // Auto-fallback chain if primary choice fails or is CAPTCHA'd/blocked
    if (results.length === 0 && engine !== 'google') {
      console.log(`[NetGlide] Native Search ${engine} returned empty. Falling back to Google...`);
      results = await runScrape('google');
    }
    if (results.length === 0 && engine !== 'duckduckgo') {
      console.log(`[NetGlide] Native Search fallback returned empty. Trying DuckDuckGo...`);
      results = await runScrape('duckduckgo');
    }
    if (results.length === 0 && engine !== 'bing') {
      console.log(`[NetGlide] Native Search fallback returned empty. Trying Bing...`);
      results = await runScrape('bing');
    }
  } catch (err) {
    console.error('[NetGlide] Primary search query execute error:', err);
  }

  return results;
});

// Let the user choose a new download folder via native dialog
ipcMain.handle('choose-download-path', async () => {
  if (!mainWin) return null;
  const result = await dialog.showOpenDialog(mainWin, {
    title: 'Choose Download Folder',
    defaultPath: downloadPath,
    properties: ['openDirectory', 'createDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    downloadPath = result.filePaths[0];
    return downloadPath;
  }
  return null;
});

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
    },
  });

  mainWin = win;
  setupDownloadHandler(win);

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.netglide.app');
  }
  
  // Provide a basic context menu for all web contents (including <webview> tags)
  app.on('web-contents-created', (e, contents) => {
    contents.on('context-menu', (event, params) => {
      const { Menu, MenuItem, clipboard } = require('electron');
      const menu = new Menu();

      if (params.linkURL) {
        menu.append(new MenuItem({
          label: 'Copy Link Address',
          click: () => clipboard.writeText(params.linkURL)
        }));
        menu.append(new MenuItem({ type: 'separator' }));
      }

      if (params.hasImageContents) {
        menu.append(new MenuItem({
          label: 'Copy Image',
          click: () => contents.copyImageAt(params.x, params.y)
        }));
        menu.append(new MenuItem({ type: 'separator' }));
      }

      if (params.isEditable) {
        menu.append(new MenuItem({ role: 'undo' }));
        menu.append(new MenuItem({ role: 'redo' }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({ role: 'cut' }));
        menu.append(new MenuItem({ role: 'copy' }));
        menu.append(new MenuItem({ role: 'paste' }));
        menu.append(new MenuItem({ role: 'selectAll' }));
      } else if (params.selectionText) {
        menu.append(new MenuItem({ role: 'copy' }));
      }

      // If user clicked on an empty area, show normal browser navigation
      if (!params.linkURL && !params.hasImageContents && !params.isEditable && !params.selectionText) {
        menu.append(new MenuItem({
          label: 'Back',
          enabled: contents.canGoBack(),
          click: () => contents.goBack()
        }));
        menu.append(new MenuItem({
          label: 'Forward',
          enabled: contents.canGoForward(),
          click: () => contents.goForward()
        }));
        menu.append(new MenuItem({
          label: 'Reload',
          click: () => contents.reload()
        }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: 'Save As...',
          click: () => {
            // Initiate a download for the current page
            if (params.pageURL) {
              contents.downloadURL(params.pageURL);
            }
          }
        }));
        menu.append(new MenuItem({
          label: 'Print...',
          click: () => contents.print()
        }));
      }

      // Allow developers to inspect element
      if (isDev) {
        if (menu.items.length > 0) menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: 'Inspect Element',
          click: () => contents.inspectElement(params.x, params.y)
        }));
      }

      // If nothing is applicable, don't show an empty menu
      if (menu.items.length > 0) {
        menu.popup();
      }
    });
  });

  createMenu();
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});