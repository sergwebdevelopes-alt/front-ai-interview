import { useProductSearch } from '@/features/products/application/useProductSearch.ts'
import { ProductsSearch } from './ProductsSearch.tsx'

export function ProductsSearchContainer() {
  const search = useProductSearch()
  return <ProductsSearch value={search.input} onChange={search.setSearch} />
}
