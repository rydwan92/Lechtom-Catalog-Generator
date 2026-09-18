import { app, BrowserWindow, dialog } from 'electron'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CatalogRepository } from '../db/sqlite/CatalogRepository'

export class PdfService {
  constructor(private catalogs: CatalogRepository, private preload: string, private allowWindow: (window: BrowserWindow) => void) {}
  async export(catalogId: string): Promise<string | null> {
    const catalog = this.catalogs.get(catalogId)
    if (!catalog) throw new Error('Nie znaleziono katalogu')
    await mkdir(join(app.getPath('userData'), 'exports'), { recursive: true })
    const suggested = `Oferta_LECHTOM_${catalog.validFrom ?? 'od'}_${catalog.validTo ?? 'do'}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const selection = await dialog.showSaveDialog({ defaultPath: join(app.getPath('userData'), 'exports', suggested), filters: [{ name: 'PDF', extensions: ['pdf'] }] })
    if (selection.canceled || !selection.filePath) return null
    const window = new BrowserWindow({ show: false, webPreferences: { preload: this.preload, contextIsolation: true, nodeIntegration: false, sandbox: false } })
    this.allowWindow(window)
    try {
      if (process.env.ELECTRON_RENDERER_URL) await window.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/print/${catalogId}`)
      else await window.loadFile(join(__dirname, '../renderer/index.html'), { hash: `/print/${catalogId}` })
      const deadline = Date.now() + 30000
      while (Date.now() < deadline) {
        const ready = await window.webContents.executeJavaScript('Boolean(window.__CATALOG_PRINT_READY__)') as boolean
        if (ready) break
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
      if (!(await window.webContents.executeJavaScript('Boolean(window.__CATALOG_PRINT_READY__)'))) throw new Error('Nie udało się przygotować podglądu PDF')
      const pdf = await window.webContents.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true, margins: { top: 0, right: 0, bottom: 0, left: 0 } })
      await writeFile(selection.filePath, pdf)
      return selection.filePath
    } finally { window.destroy() }
  }
}
