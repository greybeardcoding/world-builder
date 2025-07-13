import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Add any API methods you want to expose to the renderer process here
});