/// <reference types="vite/client" />

interface ElectronAPI {
  platform: NodeJS.Platform
  selectFolder(): Promise<string | null>
  readFile(filePath: string): Promise<string>
  writeFile(filePath: string, content: string): Promise<void>
  ensureDir(dirPath: string): Promise<void>
  listFiles(dirPath: string): Promise<string[]>
  fileExists(filePath: string): Promise<boolean>
  minimizeWindow(): Promise<void>
  toggleMaximizeWindow(): Promise<void>
  closeWindow(): Promise<void>
  isWindowMaximized(): Promise<boolean>
  onMaximizedChanged(cb: (isMaximized: boolean) => void): () => void
}

interface Window {
  electronAPI: ElectronAPI
}
