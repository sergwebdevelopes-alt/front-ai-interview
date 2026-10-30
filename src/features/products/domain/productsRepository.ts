import type { Product, ProductListPage } from './product.ts'
import type { ProductSort } from './sort.ts'

export type CatalogPageQuery = {
  skip: number
  limit: number
  sort: ProductSort | null
}

export type SearchQuery = CatalogPageQuery & {
  q: string
}

export interface ProductsRepository {
  getCatalog(page: CatalogPageQuery, signal?: AbortSignal): Promise<ProductListPage>
  search(query: SearchQuery, signal?: AbortSignal): Promise<ProductListPage>
  getById(id: number, signal?: AbortSignal): Promise<Product>
}
