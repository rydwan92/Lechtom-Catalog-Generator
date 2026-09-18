import { contextBridge, ipcRenderer } from 'electron'
import type { LechtomApi } from '../shared/types'

const api: LechtomApi = {
  erp: { getConfig: () => ipcRenderer.invoke('erp:getConfig'), saveConfig: (input) => ipcRenderer.invoke('erp:saveConfig', input), testConnection: (input) => ipcRenderer.invoke('erp:testConnection', input), getProducts: (filter) => ipcRenderer.invoke('erp:getProducts', filter), getProduct: (id) => ipcRenderer.invoke('erp:getProduct', id), searchProducts: (query) => ipcRenderer.invoke('erp:searchProducts', query), getManufacturers: () => ipcRenderer.invoke('erp:getManufacturers'), getBrands: () => ipcRenderer.invoke('erp:getBrands'), getCategories: () => ipcRenderer.invoke('erp:getCategories'), getTypes: () => ipcRenderer.invoke('erp:getTypes') },
  catalog: { list: () => ipcRenderer.invoke('catalog:list'), get: (id) => ipcRenderer.invoke('catalog:get', id), save: (input) => ipcRenderer.invoke('catalog:save', input), duplicate: (id) => ipcRenderer.invoke('catalog:duplicate', id), delete: (id) => ipcRenderer.invoke('catalog:delete', id), savePage: (page) => ipcRenderer.invoke('catalog:savePage', page), deletePage: (id) => ipcRenderer.invoke('catalog:deletePage', id), reorderPages: (id, ids) => ipcRenderer.invoke('catalog:reorderPages', id, ids), setPageItems: (id, items) => ipcRenderer.invoke('catalog:setPageItems', id, items) },
  media: { list: () => ipcRenderer.invoke('media:list'), selectFile: (kind) => ipcRenderer.invoke('media:selectFile', kind), resolveBrandLogo: (brand) => ipcRenderer.invoke('media:resolveBrandLogo', brand) },
  qr: { list: () => ipcRenderer.invoke('qr:list'), create: (input) => ipcRenderer.invoke('qr:create', input), delete: (id) => ipcRenderer.invoke('qr:delete', id) },
  pdf: { export: (catalogId) => ipcRenderer.invoke('pdf:export', catalogId) },
  settings: { get: () => ipcRenderer.invoke('settings:get'), selectProjectsFolder: () => ipcRenderer.invoke('settings:selectProjectsFolder') }
}
contextBridge.exposeInMainWorld('lechtom', api)
