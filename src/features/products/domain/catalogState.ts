import type { ProductSort } from './sort.ts'

export type CatalogParams = {
  skip: number
  sort: ProductSort | null
  query: string
}

export type CatalogUpdateOptions = {
  history?: 'push' | 'replace'
}

export interface CatalogState {
  params: CatalogParams
  update(patch: Partial<CatalogParams>, options?: CatalogUpdateOptions): void
}
