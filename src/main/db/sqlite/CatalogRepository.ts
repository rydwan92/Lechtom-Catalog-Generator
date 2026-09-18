import { randomUUID } from 'node:crypto'
import { asc, eq, inArray } from 'drizzle-orm'
import type { AppDatabase } from './database'
import { catalogs, catalogPageItems, catalogPages } from './schema'
import type { Catalog, CatalogInput, CatalogPage, CatalogPageItem, PageType } from '../../../shared/types'

export class CatalogRepository {
  constructor(private db: AppDatabase) {}

  list(): Catalog[] { return this.db.select().from(catalogs).orderBy(asc(catalogs.createdAt)).all().map((row) => this.hydrate(row)) }
  get(id: string): Catalog | null { const row = this.db.select().from(catalogs).where(eq(catalogs.id, id)).get(); return row ? this.hydrate(row) : null }
  save(input: CatalogInput): Catalog {
    const now = new Date().toISOString()
    if (input.id) {
      this.db.update(catalogs).set({ name: input.name, title: input.title, subtitle: input.subtitle, validFrom: input.validFrom, validTo: input.validTo, updatedAt: now }).where(eq(catalogs.id, input.id)).run()
      const updated = this.get(input.id)
      if (!updated) throw new Error('Nie znaleziono katalogu')
      return updated
    }
    const id = randomUUID()
    this.db.insert(catalogs).values({ ...input, id, status: 'draft', createdAt: now, updatedAt: now }).run()
    this.db.insert(catalogPages).values({ id: randomUUID(), catalogId: id, pageType: 'COVER', templateCode: 'COVER', sortOrder: 0, manufacturerRef: null, configuration: {}, enabled: true }).run()
    return this.get(id)!
  }
  delete(id: string): void { this.db.delete(catalogs).where(eq(catalogs.id, id)).run() }
  savePage(page: CatalogPage): void {
    this.db.insert(catalogPages).values({ id: page.id, catalogId: page.catalogId, pageType: page.pageType, templateCode: page.templateCode, sortOrder: page.sortOrder, manufacturerRef: page.manufacturerRef, configuration: page.configuration, enabled: page.enabled }).onConflictDoUpdate({ target: catalogPages.id, set: { pageType: page.pageType, templateCode: page.templateCode, sortOrder: page.sortOrder, manufacturerRef: page.manufacturerRef, configuration: page.configuration, enabled: page.enabled } }).run()
  }
  deletePage(id: string): void { this.db.delete(catalogPages).where(eq(catalogPages.id, id)).run() }
  reorderPages(catalogId: string, ids: string[]): void {
    const actual = this.db.select({ id: catalogPages.id }).from(catalogPages).where(eq(catalogPages.catalogId, catalogId)).all().map((x) => x.id)
    if (ids.length !== actual.length || ids.some((id) => !actual.includes(id))) throw new Error('Nieprawidłowa lista stron')
    this.db.transaction((tx) => ids.forEach((id, index) => tx.update(catalogPages).set({ sortOrder: index }).where(eq(catalogPages.id, id)).run()))
  }
  setPageItems(pageId: string, items: CatalogPageItem[]): void {
    this.db.transaction((tx) => {
      tx.delete(catalogPageItems).where(eq(catalogPageItems.pageId, pageId)).run()
      if (items.length) tx.insert(catalogPageItems).values(items.map((item) => ({ id: item.id, pageId, slotKey: item.slotKey, erpProductGidNumer: item.erpProductGidNumer, erpProductGidTyp: item.erpProductGidTyp, sortOrder: item.sortOrder, customData: item.customData }))).run()
    })
  }
  private hydrate(row: typeof catalogs.$inferSelect): Catalog {
    const pages = this.db.select().from(catalogPages).where(eq(catalogPages.catalogId, row.id)).orderBy(asc(catalogPages.sortOrder)).all()
    const pageIds = pages.map((p) => p.id)
    const items = pageIds.length ? this.db.select().from(catalogPageItems).where(inArray(catalogPageItems.pageId, pageIds)).orderBy(asc(catalogPageItems.sortOrder)).all() : []
    return { ...row, status: row.status as Catalog['status'], pages: pages.map((page) => ({ ...page, pageType: page.pageType as PageType, items: items.filter((item) => item.pageId === page.id) })) }
  }
}
