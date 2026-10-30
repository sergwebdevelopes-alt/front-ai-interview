import { ErrorBoundary } from '@/shared/ui/ErrorBoundary.tsx'
import { useOpenProduct } from '@/features/products/application/useOpenProduct.ts'
import { useProductsList } from '@/features/products/application/useProductsList.ts'
import { PAGE_SIZE } from '@/features/products/domain/pagination.ts'
import { ProductsTable } from './ProductsTable.tsx'

export function ProductsTableContainer() {
  const list = useProductsList()
  const openProduct = useOpenProduct()

  return (
    <ErrorBoundary
      message="Couldn't display products"
      resetKey={JSON.stringify([list.query, list.page, list.sort?.sortBy, list.sort?.order])}
    >
      <ProductsTable
        products={list.products}
        total={list.total}
        page={list.page}
        pageSize={PAGE_SIZE}
        sort={list.sort}
        query={list.query}
        isLoading={list.isLoading}
        error={list.error}
        onPageChange={list.setPage}
        onSortChange={list.toggleSort}
        onRetry={list.retry}
        onRowClick={openProduct}
        onClearSearch={list.clearSearch}
      />
    </ErrorBoundary>
  )
}
