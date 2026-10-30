import { useState } from 'react'
import { useDebouncedCallback } from '@/shared/hooks/useDebouncedCallback.ts'
import { normalizeQuery } from '@/features/products/domain/search.ts'
import { useCatalogState } from '@/features/products/infrastructure/index.ts'

const SEARCH_DEBOUNCE_MS = 200

export function useProductSearch() {
  const { params, update } = useCatalogState()
  const { query } = params

  const [input, setInput] = useState(query)
  const [syncedQuery, setSyncedQuery] = useState(query)
  if (query !== syncedQuery) {
    setSyncedQuery(query)
    if (query !== normalizeQuery(input)) setInput(query)
  }

  const applyQuery = (text: string) => {
    if (text === query) return
    update({ query: text, skip: 0 }, { history: 'replace' })
  }
  const applyPendingQuery = (text: string, queryWhenScheduled: string) => {
    if (query !== queryWhenScheduled) return
    applyQuery(text)
  }
  const { debounced: applyQueryDebounced } = useDebouncedCallback(
    applyPendingQuery,
    SEARCH_DEBOUNCE_MS,
  )

  const setSearch = (text: string) => {
    setInput(text)
    applyQueryDebounced(normalizeQuery(text), query)
  }

  return { input, setSearch }
}
