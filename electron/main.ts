import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import electronUpdater from 'electron-updater'
import * as fileHandlers from './fileHandlers'

const { autoUpdater } = electronUpdater
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const isMac = process.platform === 'darwin'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    ...(isMac
      ? { titleBarStyle: 'hiddenInset' as const }
      : { frame: false }),
    webPreferences: {
      preload: join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  win.on('maximize', () => win.webContents.send('window-maximized-changed', true))
  win.on('unmaximize', () => win.webContents.send('window-maximized-changed', false))
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

  ipcMain.handle('window-minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.handle('window-maximize-toggle', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })

  ipcMain.handle('window-close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle('window-is-maximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })
}

app.whenReady().then(() => {
  if (!isMac) Menu.setApplicationMenu(null)
  registerIpcHandlers()
  createWindow()
  autoUpdater.checkForUpdatesAndNotify()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})
