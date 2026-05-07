import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('select-folder'),

  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('read-file', filePath),

  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('write-file', filePath, content),

  ensureDir: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke('ensure-dir', dirPath),

  listFiles: (dirPath: string): Promise<string[]> =>
    ipcRenderer.invoke('list-files', dirPath),

  fileExists: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('file-exists', filePath),

  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window-minimize'),

  toggleMaximizeWindow: (): Promise<void> =>
    ipcRenderer.invoke('window-maximize-toggle'),

  closeWindow: (): Promise<void> => ipcRenderer.invoke('window-close'),

  isWindowMaximized: (): Promise<boolean> =>
    ipcRenderer.invoke('window-is-maximized'),

  onMaximizedChanged: (cb: (isMaximized: boolean) => void): (() => void) => {
    const listener = (_e: IpcRendererEvent, isMaximized: boolean) =>
      cb(isMaximized)
    ipcRenderer.on('window-maximized-changed', listener)
    return () => ipcRenderer.removeListener('window-maximized-changed', listener)
  },
})
