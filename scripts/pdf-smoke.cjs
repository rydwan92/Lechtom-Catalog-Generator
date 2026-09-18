const { app, BrowserWindow, ipcMain } = require('electron')
const { randomUUID } = require('node:crypto')
const path = require('node:path')

const id = randomUUID()
const page = (type, sortOrder, extras = {}) => ({ id: randomUUID(), catalogId: id, pageType: type, templateCode: type === 'BRAND_PRODUCTS' ? 'PRODUCT_GRID_12' : type, sortOrder, manufacturerRef: null, configuration: {}, enabled: true, items: [], ...extras })
const product = { id: '0:42', erpGidNumer: 42, erpGidTyp: 0, code: 'X', ean: '5901234123457', name: 'Produkt', type: 'Gastro', group: null, manufacturer: 'Hortex', brand: 'Hortex', category: 'Owoce', unit: { baseUnit: 'kg', displayUnit: 'kg', conversionNumerator: null, conversionDenominator: null, conversionFactor: null, hasAlternativeUnit: false }, weight: null, itemsPerBox: null, vatRate: 23, image: 'http://127.0.0.1:1/missing.jpg', stock: null, active: true }
const productPage = page('BRAND_PRODUCTS', 2, { manufacturerRef: 'Hortex', templateCode: 'PRODUCT_GRID_15_REFERENCE' })
productPage.items = Array.from({ length: 15 }, (_, index) => ({ id: randomUUID(), pageId: productPage.id, slotKey: `product${String(index + 1).padStart(2, '0')}`, erpId: 42 + index, erpProductGidNumer: 42 + index, erpProductGidTyp: 0, sortOrder: index, customData: {}, overrides: { displayName: null, weightLabel: null, boxLabel: null, customImage: null, hiddenFields: [] }, product: { ...product, id: `0:${42 + index}`, erpGidNumer: 42 + index, name: `Produkt testowy ${index + 1}`, image: index === 0 ? product.image : null } }))
const catalog = { schemaVersion: 1, id, name: 'PDF smoke', title: 'Test', subtitle: '', validFrom: null, validTo: null, status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), settings: { pageFormat: 'A4', defaultBackground: null }, pages: [page('COVER', 0), page('TABLE_OF_CONTENTS', 1), productPage, page('PROMOTION', 3), page('CONTACTS', 4)] }

app.whenReady().then(async () => {
  ipcMain.handle('catalog:get', () => catalog)
  ipcMain.handle('erp:getConfig', () => null)
  const window = new BrowserWindow({ show: false, webPreferences: { preload: path.join(__dirname, '..', 'out', 'preload', 'index.js'), contextIsolation: true, nodeIntegration: false, sandbox: false } })
  try {
    await window.loadFile(path.join(__dirname, '..', 'out', 'renderer', 'index.html'), { hash: `/print/${id}` })
    const deadline = Date.now() + 30000
    while (Date.now() < deadline && !(await window.webContents.executeJavaScript('Boolean(window.__CATALOG_PRINT_READY__)'))) await new Promise((resolve) => setTimeout(resolve, 200))
    if (!(await window.webContents.executeJavaScript('Boolean(window.__CATALOG_PRINT_READY__)'))) throw new Error('Print view not ready')
    if (!(await window.webContents.executeJavaScript('Boolean(document.querySelector(".product-picture-fallback"))'))) throw new Error('Missing image fallback not rendered')
    if (!(await window.webContents.executeJavaScript('Boolean(document.querySelector(".ean13-barcode rect"))'))) throw new Error('EAN-13 vector barcode not rendered')
    if (!(await window.webContents.executeJavaScript('document.querySelectorAll(".product-grid-15 .product-tile").length === 15'))) throw new Error('15-product grid not rendered')
    if (!(await window.webContents.executeJavaScript('document.querySelector(".product-grid-15 .product-tile:last-child").getBoundingClientRect().bottom < document.querySelector(".product-grid-15").closest(".print-content").querySelector(".print-footer").getBoundingClientRect().top'))) throw new Error('Product grid overlaps footer')
    const pdf = await window.webContents.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true, margins: { top: 0, right: 0, bottom: 0, left: 0 } })
    if (!pdf.subarray(0, 4).equals(Buffer.from('%PDF')) || pdf.length < 1000) throw new Error('Invalid PDF')
    if (process.env.CATALOG_SMOKE_PDF) require('node:fs').writeFileSync(process.env.CATALOG_SMOKE_PDF, pdf)
    console.log(`Electron PDF smoke passed (${pdf.length} bytes)`)
  } catch (error) { console.error(error); process.exitCode = 1 }
  finally { window.destroy(); app.quit() }
}).catch((error) => { console.error(error); process.exitCode = 1; app.quit() })
