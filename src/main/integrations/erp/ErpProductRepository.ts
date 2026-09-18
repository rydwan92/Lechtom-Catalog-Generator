import type { ErpConfig, ErpProductId, PagedResult, Product, ProductFilter } from '../../../shared/types'
import { mapProduct } from './ErpMapper'
import type { ErpProductRow } from './ErpTypes'
import { ErpReadOnlyExecutor } from './ErpReadOnlyExecutor'

const escapeLike = (value: string) => value.replace(/[\\%_[]/g, '\\$&')
export class ErpProductRepository {
  constructor(private executor: ErpReadOnlyExecutor, private getConfig: () => ErpConfig | null) {}
  private config(): ErpConfig { const config = this.getConfig(); if (!config) throw new Error('Skonfiguruj połączenie z ERP'); return config }
  async getProducts(filter: ProductFilter = {}): Promise<PagedResult<Product>> {
    const config = this.config()
    const page = Math.max(1, filter.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 25))
    const query = filter.query?.trim() ?? ''
    const inputs = { query, pattern: `%${escapeLike(query)}%`, brand: filter.manufacturer ?? '', category: filter.category ?? '', type: filter.type ?? '', offset: (page - 1) * pageSize, pageSize }
    const [rows, counts] = await Promise.all([this.executor.executeErpReadQuery<ErpProductRow>(config, 'products', inputs), this.executor.executeErpReadQuery<{ Total: number }>(config, 'productCount', inputs)])
    return { items: rows.map(mapProduct), total: Number(counts[0]?.Total ?? 0), page, pageSize }
  }
  async getProduct(id: ErpProductId): Promise<Product | null> { const rows = await this.executor.executeErpReadQuery<ErpProductRow>(this.config(), 'productById', { gidNumer: id.gidNumer }); return rows[0] ? mapProduct(rows[0]) : null }
  async getBrands(): Promise<string[]> { return (await this.executor.executeErpReadQuery<{ Value: string }>(this.config(), 'brands')).map((row) => row.Value) }
  async getCategories(): Promise<string[]> { return (await this.executor.executeErpReadQuery<{ Value: string }>(this.config(), 'categories')).map((row) => row.Value) }
  async getTypes(): Promise<string[]> { return (await this.executor.executeErpReadQuery<{ Value: string }>(this.config(), 'types')).map((row) => row.Value) }
}
