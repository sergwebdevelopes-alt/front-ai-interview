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

function lastPage(total: number): number {
  return Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)
}

export function clampPage(page: number, total: number | null): number {
  return Math.min(page, total === null ? 0 : lastPage(total))
}

export function lastPageSkip(total: number): number {
  return pageToSkip(lastPage(total))
}

export function isPastLastPage(skip: number, total: number): boolean {
  return skip > lastPageSkip(total)
}
