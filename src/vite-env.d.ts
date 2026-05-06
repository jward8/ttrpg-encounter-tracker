/// <reference types="vite/client" />

interface ElectronAPI {
  selectFolder(): Promise<string | null>
  readFile(filePath: string): Promise<string>
  writeFile(filePath: string, content: string): Promise<void>
  ensureDir(dirPath: string): Promise<void>
  listFiles(dirPath: string): Promise<string[]>
  fileExists(filePath: string): Promise<boolean>
}

interface Window {
  electronAPI: ElectronAPI
}
