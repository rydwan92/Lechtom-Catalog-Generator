const { app, BrowserWindow, ipcMain } = require('electron')
const { randomUUID } = require('node:crypto')
const path = require('node:path')

const id = randomUUID()
const page = (type, sortOrder, extras = {}) => ({ id: randomUUID(), catalogId: id, pageType: type, templateCode: type === 'BRAND_PRODUCTS' ? 'PRODUCT_GRID_12' : type, sortOrder, manufacturerRef: null, configuration: {}, enabled: true, items: [], ...extras })
const catalog = { schemaVersion: 1, id, name: 'PDF smoke', title: 'Test', subtitle: '', validFrom: null, validTo: null, status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), settings: { pageFormat: 'A4', defaultBackground: null }, pages: [page('COVER', 0), page('TABLE_OF_CONTENTS', 1), page('BRAND_PRODUCTS', 2, { manufacturerRef: 'Hortex' }), page('PROMOTION', 3), page('CONTACTS', 4)] }

app.whenReady().then(async () => {
  ipcMain.handle('catalog:get', () => catalog)
  ipcMain.handle('erp:getConfig', () => null)
  const window = new BrowserWindow({ show: false, webPreferences: { preload: path.join(__dirname, '..', 'out', 'preload', 'index.js'), contextIsolation: true, nodeIntegration: false, sandbox: false } })
  try {
    await window.loadFile(path.join(__dirname, '..', 'out', 'renderer', 'index.html'), { hash: `/print/${id}` })
    const deadline = Date.now() + 30000
    while (Date.now() < deadline && !(await window.webContents.executeJavaScript('Boolean(window.__CATALOG_PRINT_READY__)'))) await new Promise((resolve) => setTimeout(resolve, 200))
    if (!(await window.webContents.executeJavaScript('Boolean(window.__CATALOG_PRINT_READY__)'))) throw new Error('Print view not ready')
    const pdf = await window.webContents.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true, margins: { top: 0, right: 0, bottom: 0, left: 0 } })
    if (!pdf.subarray(0, 4).equals(Buffer.from('%PDF')) || pdf.length < 1000) throw new Error('Invalid PDF')
    console.log(`Electron PDF smoke passed (${pdf.length} bytes)`)
  } catch (error) { console.error(error); process.exitCode = 1 }
  finally { window.destroy(); app.quit() }
}).catch((error) => { console.error(error); process.exitCode = 1; app.quit() })
