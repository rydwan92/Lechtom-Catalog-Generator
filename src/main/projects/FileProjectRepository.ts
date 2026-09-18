import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { catalogSchema } from '../../shared/schemas'
import type { Catalog, CatalogInput, CatalogPage, CatalogPageItem } from '../../shared/types'
import type { SettingsService } from '../services/SettingsService'

export class FileProjectRepository {
  constructor(private settings: SettingsService) {}
  private folder(id: string): string { return join(this.settings.get().projectsFolder, id) }
  private file(id: string): string { return join(this.folder(id), 'project.json') }
  private persist(catalog: Catalog): void {
    const checked = catalogSchema.parse(catalog)
    const folder = this.folder(checked.id)
    mkdirSync(join(folder, 'assets'), { recursive: true })
    const temp = join(folder, 'project.json.tmp')
    writeFileSync(temp, JSON.stringify(checked, null, 2), 'utf8')
    renameSync(temp, this.file(checked.id))
  }
  list(): Catalog[] {
    const root = this.settings.get().projectsFolder
    if (!existsSync(root)) return []
    return readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).flatMap((entry) => {
      try { const value = this.get(entry.name); return value ? [value] : [] } catch (error) { console.error(`Nie można odczytać projektu ${entry.name}`, error); return [] }
    }).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }
  get(id: string): Catalog | null {
    if (!/^[0-9a-f-]{36}$/i.test(id) || !existsSync(this.file(id))) return null
    return catalogSchema.parse(JSON.parse(readFileSync(this.file(id), 'utf8')))
  }
  save(input: CatalogInput): Catalog {
    const now = new Date().toISOString()
    if (input.id) {
      const current = this.required(input.id)
      const updated = { ...current, ...input, updatedAt: now }
      this.persist(updated)
      return updated
    }
    const id = randomUUID()
    const catalog: Catalog = { schemaVersion: 1, ...input, id, status: 'draft', createdAt: now, updatedAt: now, settings: { pageFormat: 'A4', defaultBackground: null }, pages: [
      { id: randomUUID(), catalogId: id, pageType: 'COVER', templateCode: 'COVER', sortOrder: 0, manufacturerRef: null, configuration: {}, enabled: true, items: [] },
      { id: randomUUID(), catalogId: id, pageType: 'TABLE_OF_CONTENTS', templateCode: 'TABLE_OF_CONTENTS', sortOrder: 1, manufacturerRef: null, configuration: {}, enabled: true, items: [] },
      { id: randomUUID(), catalogId: id, pageType: 'PROMOTION', templateCode: 'PROMOTION', sortOrder: 2, manufacturerRef: null, configuration: { title: 'ezamshop', url: '' }, enabled: true, items: [] },
      { id: randomUUID(), catalogId: id, pageType: 'CONTACTS', templateCode: 'CONTACTS', sortOrder: 3, manufacturerRef: null, configuration: { branches: '', phones: '' }, enabled: true, items: [] }
    ] }
    this.persist(catalog)
    return catalog
  }
  delete(id: string): void { if (this.get(id)) rmSync(this.folder(id), { recursive: true }) }
  duplicate(id: string): Catalog {
    const source = this.required(id)
    const nextId = randomUUID()
    const now = new Date().toISOString()
    const pages = source.pages.map((page) => {
      const pageId = randomUUID()
      return { ...page, id: pageId, catalogId: nextId, items: page.items.map((item) => ({ ...item, id: randomUUID(), pageId })) }
    })
    const copy: Catalog = { ...source, id: nextId, name: `Kopia – ${source.name}`, status: 'draft', createdAt: now, updatedAt: now, pages }
    this.persist(copy)
    return copy
  }
  savePage(page: CatalogPage): void {
    const catalog = this.required(page.catalogId)
    const index = catalog.pages.findIndex((value) => value.id === page.id)
    if (index >= 0) catalog.pages[index] = { ...page, items: catalog.pages[index].items }
    else if (page.pageType === 'BRAND_PRODUCTS' || page.pageType === 'PRODUCTS' || page.pageType.startsWith('PRODUCT_GRID')) catalog.pages.splice(Math.max(2, catalog.pages.length - 2), 0, page)
    else catalog.pages.push(page)
    catalog.pages.forEach((value, index) => { value.sortOrder = index })
    this.touch(catalog)
  }
  deletePage(id: string): void {
    const catalog = this.list().find((value) => value.pages.some((page) => page.id === id))
    if (!catalog) return
    catalog.pages = catalog.pages.filter((page) => page.id !== id)
    this.touch(catalog)
  }
  reorderPages(catalogId: string, ids: string[]): void {
    const catalog = this.required(catalogId)
    if (ids.length !== catalog.pages.length || new Set(ids).size !== ids.length || ids.some((id) => !catalog.pages.some((page) => page.id === id)) || ids[0] !== catalog.pages[0].id || ids[1] !== catalog.pages[1].id || ids.at(-2) !== catalog.pages.at(-2)?.id || ids.at(-1) !== catalog.pages.at(-1)?.id) throw new Error('Okładka, spis treści i ostatnie strony mają stałe pozycje')
    catalog.pages = ids.map((id, index) => ({ ...catalog.pages.find((page) => page.id === id)!, sortOrder: index }))
    this.touch(catalog)
  }
  setPageItems(pageId: string, items: CatalogPageItem[]): void {
    const catalog = this.list().find((value) => value.pages.some((page) => page.id === pageId))
    if (!catalog) throw new Error('Nie znaleziono strony')
    const page = catalog.pages.find((value) => value.id === pageId)!
    if (items.some((item) => item.pageId !== pageId || !item.product)) throw new Error('Produkt musi zawierać zapisany snapshot')
    page.items = items.sort((a, b) => a.sortOrder - b.sortOrder)
    this.touch(catalog)
  }
  private required(id: string): Catalog { const value = this.get(id); if (!value) throw new Error('Nie znaleziono katalogu'); return value }
  private touch(catalog: Catalog): void { catalog.updatedAt = new Date().toISOString(); this.persist(catalog) }
}
