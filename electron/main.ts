import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import * as fileHandlers from './fileHandlers'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('read-file', (_event, filePath: string) =>
    fileHandlers.readFile(filePath),
  )

  ipcMain.handle('write-file', (_event, filePath: string, content: string) =>
    fileHandlers.writeFile(filePath, content),
  )

  ipcMain.handle('ensure-dir', (_event, dirPath: string) =>
    fileHandlers.ensureDir(dirPath),
  )

  ipcMain.handle('list-files', (_event, dirPath: string) =>
    fileHandlers.listFiles(dirPath),
  )

  ipcMain.handle('file-exists', (_event, filePath: string) =>
    fileHandlers.fileExists(filePath),
  )
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
