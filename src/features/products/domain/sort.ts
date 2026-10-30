export const SORT_FIELDS = ['brand', 'title', 'description', 'category', 'price'] as const

export type SortField = (typeof SORT_FIELDS)[number]

export type SortOrder = 'asc' | 'desc'

export type ProductSort = {
  sortBy: SortField
  order: SortOrder
}

export function isSortField(value: unknown): value is SortField {
  return SORT_FIELDS.some((field) => field === value)
}

export function isSortOrder(value: unknown): value is SortOrder {
  return value === 'asc' || value === 'desc'
}

export function nextSort(current: ProductSort | null, field: SortField): ProductSort | null {
  if (current?.sortBy !== field) return { sortBy: field, order: 'asc' }
  if (current.order === 'asc') return { sortBy: field, order: 'desc' }
  return null
}
