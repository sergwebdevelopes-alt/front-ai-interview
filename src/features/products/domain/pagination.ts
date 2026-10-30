export const PAGE_SIZE = 20

export function normalizeSkip(value: number): number {
  if (!Number.isInteger(value) || value < 0) return 0
  return Math.floor(value / PAGE_SIZE) * PAGE_SIZE
}

export function pageToSkip(page: number): number {
  return page * PAGE_SIZE
}

export function skipToPage(skip: number): number {
  return Math.floor(skip / PAGE_SIZE)
}

export function clampPage(page: number, total: number | null): number {
  const lastPage = total === null ? 0 : Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)
  return Math.min(page, lastPage)
}
