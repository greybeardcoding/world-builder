// Preload script - securely expose only safe APIs to renderer
const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations (if needed in future)
  // saveFile: (data) => ipcRenderer.invoke('save-file', data),
  // loadFile: () => ipcRenderer.invoke('load-file'),
  
  // Application info
  getVersion: () => process.versions.electron,
  
  // Safe logging
  log: (message) => console.log('[Renderer]:', message)
});

// Block any attempts to access Node.js APIs directly
window.eval = global.eval = () => {
  throw new Error('eval() is disabled for security');
};