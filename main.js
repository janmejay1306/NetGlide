const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const isDev = !app.isPackaged;

// ---------------------------------------------------------------------------
// Auto-updater configuration
// ---------------------------------------------------------------------------
function setupAutoUpdater() {
  // Only check for updates in production (packaged) builds
  if (isDev) {
    console.log('[AutoUpdater] Skipping — running in development mode.');
    return;
  }

  // Log every major lifecycle event for easier debugging
  autoUpdater.logger = console;
  autoUpdater.autoDownload = false; // We'll prompt the user first
  autoUpdater.autoInstallOnAppQuit = true;

  // ------- Events -------

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates…');
  });

  autoUpdater.on('update-available', (info) => {
    console.log(`[AutoUpdater] Update available — v${info.version}`);
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `A new version of NetGlide (v${info.version}) is available.`,
        detail: 'Would you like to download it now?',
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate();
        } else {
          console.log('[AutoUpdater] User chose to update later.');
        }
      });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log(`[AutoUpdater] Already on the latest version (v${info.version}).`);
  });

  autoUpdater.on('download-progress', (progress) => {
    const pct = progress.percent.toFixed(1);
    console.log(
      `[AutoUpdater] Downloading: ${pct}%  (${(progress.bytesPerSecond / 1024).toFixed(0)} KB/s)`
    );
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[AutoUpdater] Update downloaded — v${info.version}`);
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'The update has been downloaded.',
        detail: 'NetGlide will restart to install the update. Any unsaved work will be lost.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
        // If "Later", the update will be applied on next quit
        // (autoInstallOnAppQuit = true)
      });
  });

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Error:', err.message || err);
  });

  // Kick off the first check
  autoUpdater.checkForUpdates();
}

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173'); // Vite dev server
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html')); // built version
  }

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});