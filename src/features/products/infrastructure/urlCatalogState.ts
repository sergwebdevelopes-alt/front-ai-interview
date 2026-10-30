import { useCallback } from 'react'
import { updateQueryParams, useQueryParam } from '@/shared/url/useQueryParam.ts'
import type { CatalogParams, CatalogState, CatalogUpdateOptions } from '@/features/products/domain/catalogState.ts'
import { normalizeSkip } from '@/features/products/domain/pagination.ts'
import { normalizeQuery } from '@/features/products/domain/search.ts'
import { isSortField, isSortOrder } from '@/features/products/domain/sort.ts'
import type { ProductSort } from '@/features/products/domain/sort.ts'

function parseSort(rawSortBy: string | null, rawOrder: string | null): ProductSort | null {
  if (!isSortField(rawSortBy) || !isSortOrder(rawOrder)) return null
  return { sortBy: rawSortBy, order: rawOrder }
}

function toQueryParams(patch: Partial<CatalogParams>): Record<string, string | null> {
  const updates: Record<string, string | null> = {}
  if (patch.skip !== undefined) updates.skip = patch.skip === 0 ? null : String(patch.skip)
  if (patch.sort !== undefined) {
    updates.sortBy = patch.sort?.sortBy ?? null
    updates.order = patch.sort?.order ?? null
  }
  if (patch.query !== undefined) updates.q = patch.query || null
  return updates
}

export function useUrlCatalogState(): CatalogState {
  const [rawSkip] = useQueryParam('skip')
  const [rawSortBy] = useQueryParam('sortBy')
  const [rawOrder] = useQueryParam('order')
  const [rawQuery] = useQueryParam('q')

  const params: CatalogParams = {
    skip: normalizeSkip(Number(rawSkip)),
    sort: parseSort(rawSortBy, rawOrder),
    query: normalizeQuery(rawQuery ?? ''),
  }

  const update = useCallback(
    (patch: Partial<CatalogParams>, { history = 'push' }: CatalogUpdateOptions = {}) => {
      updateQueryParams(toQueryParams(patch), { replace: history === 'replace' })
    },
    [],
  )

  return { params, update }
}
