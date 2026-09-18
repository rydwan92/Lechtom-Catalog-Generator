import type { ProductProvider } from '../../../domain/products/ProductProvider'
import type { ErpProductId, PagedResult, Product, ProductFilter } from '../../../shared/types'
import { ErpProductRepository } from './ErpProductRepository'

export class ErpProductProvider implements ProductProvider {
  constructor(private repository: ErpProductRepository) {}
  getProducts(filter?: ProductFilter): Promise<PagedResult<Product>> { return this.repository.getProducts(filter) }
  getProduct(id: ErpProductId): Promise<Product | null> { return this.repository.getProduct(id) }
  async searchProducts(query: string): Promise<Product[]> { return (await this.repository.getProducts({ query, pageSize: 25 })).items }
  async getProductsByManufacturer(id: string): Promise<Product[]> { void id; throw new Error('Mapowanie producenta wymaga weryfikacji schematu ERP') }
}
