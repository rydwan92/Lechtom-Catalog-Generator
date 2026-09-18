import type { ErpProductId, PagedResult, Product, ProductFilter } from '../../shared/types'

export interface ProductProvider {
  getProducts(filter?: ProductFilter): Promise<PagedResult<Product>>
  getProduct(id: ErpProductId): Promise<Product | null>
  searchProducts(query: string): Promise<Product[]>
  getProductsByManufacturer(id: string): Promise<Product[]>
}
