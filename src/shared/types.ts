export interface ErpProductId { gidNumer: number; gidTyp: number }
export interface ProductUnitInfo { baseUnit: string; displayUnit: string; conversionNumerator: number | null; conversionDenominator: number | null; conversionFactor: number | null; hasAlternativeUnit: boolean }
export interface Product { id: string; erpGidNumer: number; erpGidTyp: number; code: string; ean: string | null; name: string; manufacturer: string | null; brand: string | null; category: string | null; unit: ProductUnitInfo; weight: number | null; itemsPerBox: number | null; vatRate: number | null; image: string | null; stock: number | null; active: boolean }
export interface ProductFilter { query?: string; manufacturer?: string; category?: string; page?: number; pageSize?: number }
export interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number }
export type PageType = 'COVER' | 'TABLE_OF_CONTENTS' | 'PRODUCT_GRID_12' | 'PRODUCT_GRID_16' | 'BRANDS' | 'CONTACTS' | 'PROMOTION' | 'CUSTOM'
export interface CatalogPageItem { id: string; pageId: string; slotKey: string; erpProductGidNumer: number; erpProductGidTyp: number; sortOrder: number; customData: Record<string, unknown>; product?: Product | null }
export interface CatalogPage { id: string; catalogId: string; pageType: PageType; templateCode: string; sortOrder: number; manufacturerRef: string | null; configuration: Record<string, unknown>; enabled: boolean; items: CatalogPageItem[] }
export interface Catalog { id: string; name: string; title: string; subtitle: string; validFrom: string | null; validTo: string | null; status: 'draft' | 'published'; createdAt: string; updatedAt: string; pages: CatalogPage[] }
export interface CatalogInput { id?: string; name: string; title: string; subtitle: string; validFrom: string | null; validTo: string | null }
export interface ErpConfig { server: string; database: string; authenticationType: 'sql'; username: string; password?: string; encrypt: boolean; trustServerCertificate: boolean }
export interface ErpConnectionResult { connected: boolean; server: string; database: string; message: string }
export interface MediaAsset { id: string; filename: string; originalFilename: string; mimeType: string; path: string; width: number | null; height: number | null; fileSize: number; createdAt: string; url: string }
export interface QrCodeRecord { id: string; name: string; url: string; label: string; svg: string; createdAt: string }
export interface LechtomApi {
  erp: { getConfig(): Promise<Omit<ErpConfig, 'password'>>; saveConfig(input: ErpConfig): Promise<void>; testConnection(input: ErpConfig): Promise<ErpConnectionResult>; getProducts(filter: ProductFilter): Promise<PagedResult<Product>>; getProduct(id: ErpProductId): Promise<Product | null>; searchProducts(query: string): Promise<Product[]>; getManufacturers(): Promise<string[]>; getCategories(): Promise<string[]> }
  catalog: { list(): Promise<Catalog[]>; get(id: string): Promise<Catalog | null>; save(input: CatalogInput): Promise<Catalog>; delete(id: string): Promise<void>; savePage(page: CatalogPage): Promise<void>; deletePage(id: string): Promise<void>; reorderPages(catalogId: string, pageIds: string[]): Promise<void>; setPageItems(pageId: string, items: CatalogPageItem[]): Promise<void> }
  media: { list(): Promise<MediaAsset[]>; selectFile(kind: 'products' | 'logos' | 'backgrounds'): Promise<MediaAsset | null> }
  qr: { list(): Promise<QrCodeRecord[]>; create(input: { name: string; url: string; label: string }): Promise<QrCodeRecord>; delete(id: string): Promise<void> }
  pdf: { export(catalogId: string): Promise<string | null> }
}
