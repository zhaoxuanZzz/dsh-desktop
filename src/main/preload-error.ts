import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('saddle', {
  quit: () => ipcRenderer.send('saddle:quit'),
  reload: () => ipcRenderer.send('saddle:reload'),
  restart: () => ipcRenderer.send('saddle:restart'),
})
