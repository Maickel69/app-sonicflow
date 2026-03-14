/**
 * Preload script – runs in the renderer (browser) context
 * with access to a limited, safe set of Node/Electron APIs.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),

  // Open a folder in Explorer
  openFolder: (path) => ipcRenderer.invoke('app:open-folder', path),

  // Native folder picker (alternative to the PowerShell one)
  pickFolder: () => ipcRenderer.invoke('dialog:openFolder'),
});
