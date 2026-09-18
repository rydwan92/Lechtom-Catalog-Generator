import { app, BrowserWindow, net, protocol } from 'electron'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createDatabase } from './db/sqlite/database'
import { CatalogRepository } from './db/sqlite/CatalogRepository'
import { ErpConnection } from './integrations/erp/ErpConnection'
import { ErpConfigStore } from './integrations/erp/ErpConfigStore'
import { ErpReadOnlyExecutor } from './integrations/erp/ErpReadOnlyExecutor'
import { ErpProductRepository } from './integrations/erp/ErpProductRepository'
import { ErpProductProvider } from './integrations/erp/ErpProductProvider'
import { MediaService } from './services/MediaService'
import { QrService } from './services/QrService'
import { PdfService } from './services/PdfService'
import { registerHandlers } from './ipc/handlers'

protocol.registerSchemesAsPrivileged([{ scheme: 'lechtom-media', privileges: { secure: true, standard: true, supportFetchAPI: true } }])
const trustedIds = new Set<number>()
const preload = join(__dirname, '../preload/index.js')
function allowWindow(window: BrowserWindow): void { trustedIds.add(window.webContents.id); window.on('closed', () => trustedIds.delete(window.webContents.id)); window.webContents.setWindowOpenHandler(() => ({ action: 'deny' })) }

app.whenReady().then(async () => {
  const db = createDatabase()
  const catalogs = new CatalogRepository(db)
  const media = new MediaService(db)
  const qr = new QrService(db)
  const erpStore = new ErpConfigStore()
  const erpConnection = new ErpConnection()
  const erpExecutor = new ErpReadOnlyExecutor(erpConnection)
  const erpProvider = new ErpProductProvider(new ErpProductRepository(erpExecutor, () => erpStore.get()))
  protocol.handle('lechtom-media', (request) => { const id = new URL(request.url).pathname.split('/').filter(Boolean)[0]; const path = id ? media.getPath(id) : null; return path ? net.fetch(pathToFileURL(path).toString()) : new Response('Not found', { status: 404 }) })
  registerHandlers({ catalogs, media, qr, erpStore, erpConnection, erpExecutor, erpProvider, pdf: new PdfService(catalogs, preload, allowWindow), trustedIds })
  const window = new BrowserWindow({ width: 1500, height: 940, minWidth: 1120, minHeight: 720, backgroundColor: '#f6f8fb', title: 'LECHTOM Catalog Generator', webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: false } })
  allowWindow(window)
  if (process.env.ELECTRON_RENDERER_URL) await window.loadURL(process.env.ELECTRON_RENDERER_URL)
  else await window.loadFile(join(__dirname, '../renderer/index.html'))
  app.on('before-quit', () => { void erpConnection.close() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
