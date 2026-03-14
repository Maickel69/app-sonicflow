import {
  app, BrowserWindow, shell, ipcMain,
  dialog, nativeImage, Tray, Menu
} from 'electron';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';
import * as net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── Paths ──────────────────────────────────────────────────────────────────
//
// With asar:false, electron-builder puts ALL files as real filesystem files:
//   resources/
//     app/
//       electron/   ← main.js lives here (__dirname)
//       server/
//       dist/
//       public/
//       node_modules/
//       package.json
//
// In dev, __dirname is SonicFlow/electron/, so ROOT = SonicFlow/
// In packaged, __dirname is resources/app/electron/, so ROOT = resources/app/
//
const ROOT   = join(__dirname, '..');    // works for both dev and packaged!
const SERVER = join(ROOT, 'server', 'index.js');
const DIST   = join(ROOT, 'dist');
const PORT   = 3000;

let mainWindow = null;
let tray       = null;

// ── Wait for Express ────────────────────────────────────────────────────────
function waitForServer(port, timeout = 25000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    const tryConnect = () => {
      const socket = new net.Socket();
      socket.setTimeout(500);
      socket.on('connect', () => { socket.destroy(); resolve(); });
      socket.on('error',   () => { socket.destroy(); retry(); });
      socket.on('timeout', () => { socket.destroy(); retry(); });
      socket.connect(port, '127.0.0.1');
    };
    const retry = () => {
      if (Date.now() >= deadline) {
        reject(new Error(`Server did not start on port ${port} within ${timeout}ms`));
      } else {
        setTimeout(tryConnect, 400);
      }
    };
    tryConnect();
  });
}

// ── Start server ────────────────────────────────────────────────────────────
// We use dynamic import() (in-process) instead of fork() because fork()
// can struggle with ESM modules in certain environments.
// All paths are REAL filesystem files (asar:false), so imports resolve correctly.
async function startServer() {
  process.env.ELECTRON_APP      = 'true';
  process.env.ELECTRON_DIST_DIR = DIST;
  process.env.SONICFLOW_CONFIG_DIR = app.getPath('userData');

  console.log('[Electron] ROOT  :', ROOT);
  console.log('[Electron] SERVER:', SERVER, '| exists:', fs.existsSync(SERVER));
  console.log('[Electron] DIST  :', DIST,   '| exists:', fs.existsSync(DIST));

  const serverUrl = pathToFileURL(SERVER).href;
  await import(serverUrl);

  await waitForServer(PORT, 25000);
  console.log('[Electron] ✅ Server ready on port', PORT);
}

// ── Create window ───────────────────────────────────────────────────────────
function createWindow() {
  const iconPath = join(ROOT, 'public', 'icon.png');
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : undefined;

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 800,
    minHeight: 600,
    title: 'SonicFlow',
    icon,
    show: false,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    frame: true,
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Open DevTools in dev mode to debug any issues
    if (!app.isPackaged) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ── Tray ────────────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = join(ROOT, 'public', 'icon.png');
  if (!fs.existsSync(iconPath)) return;

  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setToolTip('SonicFlow – Music Downloader');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir SonicFlow', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Salir', click: () => { app.isQuitting = true; app.quit(); } },
  ]));
  tray.on('double-click', () => mainWindow?.show());
}

// ── IPC ─────────────────────────────────────────────────────────────────────
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:open-folder', async (_, folderPath) => {
  if (fs.existsSync(folderPath)) shell.openPath(folderPath);
});
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Selecciona carpeta de descarga',
  });
  return result.canceled ? null : result.filePaths[0];
});

// ── Lifecycle ────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
    createTray();
  } catch (err) {
    console.error('[Electron] Fatal:', err);
    dialog.showErrorBox(
      'SonicFlow – Error de inicio',
      `No se pudo iniciar el servidor.\n\n${err.message}`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && app.isQuitting) app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else mainWindow?.show();
});
app.on('before-quit', () => { app.isQuitting = true; });
