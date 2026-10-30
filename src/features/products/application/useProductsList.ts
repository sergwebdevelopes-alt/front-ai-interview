import { useState } from 'react'
import { useRequest } from '@/shared/hooks/useRequest.ts'
import { PAGE_SIZE, clampPage, pageToSkip, skipToPage } from '@/features/products/domain/pagination.ts'
import { nextSort } from '@/features/products/domain/sort.ts'
import type { SortField } from '@/features/products/domain/sort.ts'
import { productsRepository, useCatalogState } from '@/features/products/infrastructure/index.ts'

export function useProductsList() {
  const { params, update } = useCatalogState()
  const { skip, sort, query } = params

  const { data, error, isLoading, retry } = useRequest({
    key: `products:${JSON.stringify([query, skip, sort?.sortBy ?? null, sort?.order ?? null])}`,
    run: (signal) => {
      const page = { skip, limit: PAGE_SIZE, sort }
      return query
        ? productsRepository.search({ q: query, ...page }, signal)
        : productsRepository.getCatalog(page, signal)
    },
  })

  const [total, setTotal] = useState<number | null>(null)
  if (data && data.total !== total) setTotal(data.total)

  const setPage = (page: number) => update({ skip: pageToSkip(page) })

  const toggleSort = (field: SortField) => update({ sort: nextSort(sort, field), skip: 0 })

  const clearSearch = () => update({ query: '', skip: 0 }, { history: 'replace' })

  return {
    products: data?.items ?? [],
    total,
    page: clampPage(skipToPage(skip), total),
    sort,
    query,
    isLoading,
    error,
    retry,
    setPage,
    toggleSort,
    clearSearch,
  }
}
