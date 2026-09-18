import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { z } from 'zod'
import type { FileProjectRepository } from '../projects/FileProjectRepository'
import type { ErpConfigStore } from '../integrations/erp/ErpConfigStore'
import type { ErpReadOnlyExecutor } from '../integrations/erp/ErpReadOnlyExecutor'
import type { ErpProductProvider } from '../integrations/erp/ErpProductProvider'
import type { ErpConnection } from '../integrations/erp/ErpConnection'
import type { AssetLibraryService } from '../assets/AssetLibraryService'
import type { SettingsService } from '../services/SettingsService'
import type { QrService } from '../services/QrService'
import type { PdfService } from '../services/PdfService'
import { catalogInputSchema, catalogPageItemSchema, catalogPageSchema, erpConfigSchema, productFilterSchema, productIdSchema, qrInputSchema } from '../../shared/schemas'

export function registerHandlers(deps: { catalogs: FileProjectRepository; erpStore: ErpConfigStore; erpExecutor: ErpReadOnlyExecutor; erpProvider: ErpProductProvider; erpConnection: ErpConnection; media: AssetLibraryService; qr: QrService; pdf: PdfService; settings: SettingsService; trustedIds: Set<number> }): void {
  const on = (channel: string, handler: (...args: unknown[]) => unknown) => ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
    if (!deps.trustedIds.has(event.sender.id) || event.senderFrame !== event.sender.mainFrame) throw new Error('Niedozwolone wywołanie IPC')
    return handler(...args)
  })
  on('erp:getConfig', () => deps.erpStore.getPublic())
  on('erp:saveConfig', async (raw) => { const config = erpConfigSchema.parse(raw); deps.erpStore.save(config); await deps.erpConnection.close() })
  on('erp:testConnection', async (raw) => { const config = erpConfigSchema.parse(raw); const saved = deps.erpStore.get(); const resolved = { ...config, password: config.password || saved?.password }; if (!resolved.password) throw new Error('Podaj hasło ERP'); const result = await deps.erpExecutor.executeErpReadQuery<{ ConnectionOk: number; DatabaseName: string; ServerName: string }>(resolved, 'connectionTest'); return { connected: result[0]?.ConnectionOk === 1, server: result[0]?.ServerName ?? config.server, database: result[0]?.DatabaseName ?? config.database, message: 'Połączono' } })
  on('erp:getProducts', (raw) => deps.erpProvider.getProducts(productFilterSchema.parse(raw ?? {})))
  on('erp:getProduct', (raw) => deps.erpProvider.getProduct(productIdSchema.parse(raw)))
  on('erp:searchProducts', (raw) => deps.erpProvider.searchProducts(z.string().max(100).parse(raw)))
  on('erp:getManufacturers', () => deps.erpProvider.getBrands())
  on('erp:getBrands', () => deps.erpProvider.getBrands())
  on('erp:getCategories', () => deps.erpProvider.getCategories())
  on('erp:getTypes', () => deps.erpProvider.getTypes())
  on('catalog:list', () => deps.catalogs.list())
  on('catalog:get', (raw) => deps.catalogs.get(z.string().uuid().parse(raw)))
  on('catalog:save', (raw) => deps.catalogs.save(catalogInputSchema.parse(raw)))
  on('catalog:duplicate', (raw) => deps.catalogs.duplicate(z.string().uuid().parse(raw)))
  on('catalog:delete', (raw) => deps.catalogs.delete(z.string().uuid().parse(raw)))
  on('catalog:savePage', (raw) => deps.catalogs.savePage(catalogPageSchema.parse(raw)))
  on('catalog:deletePage', (raw) => deps.catalogs.deletePage(z.string().uuid().parse(raw)))
  on('catalog:reorderPages', (id, ids) => deps.catalogs.reorderPages(z.string().uuid().parse(id), z.array(z.string().uuid()).parse(ids)))
  on('catalog:setPageItems', (id, items) => deps.catalogs.setPageItems(z.string().uuid().parse(id), z.array(catalogPageItemSchema).max(16).parse(items)))
  on('media:list', () => deps.media.list())
  on('media:selectFile', (raw) => deps.media.selectFile(z.enum(['products', 'logos', 'backgrounds']).parse(raw)))
  on('media:resolveBrandLogo', (raw) => deps.media.resolveBrandLogo(z.string().max(100).parse(raw)))
  on('qr:list', () => deps.qr.list())
  on('qr:create', (raw) => deps.qr.create(qrInputSchema.parse(raw)))
  on('qr:delete', (raw) => deps.qr.delete(z.string().uuid().parse(raw)))
  on('pdf:export', (raw) => deps.pdf.export(z.string().uuid().parse(raw)))
  on('settings:get', () => deps.settings.get())
  on('settings:selectProjectsFolder', () => deps.settings.selectProjectsFolder())
}
