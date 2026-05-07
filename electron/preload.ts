import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
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
})
