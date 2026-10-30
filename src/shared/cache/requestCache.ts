const MAX_ENTRIES = 50
const STALE_AFTER_MS = 5 * 60 * 1000

type CacheEntry = {
  data: unknown
  updatedAt: number
}

const entries = new Map<string, CacheEntry>()

function peek<T>(key: string): T | null {
  const entry = entries.get(key)
  return entry ? (entry.data as T) : null
}

function isFresh(key: string): boolean {
  const entry = entries.get(key)
  return entry !== undefined && Date.now() - entry.updatedAt < STALE_AFTER_MS
}

function set(key: string, data: unknown): void {
  entries.delete(key)
  entries.set(key, { data, updatedAt: Date.now() })
  if (entries.size > MAX_ENTRIES) {
    const oldestKey = entries.keys().next().value
    if (oldestKey !== undefined) entries.delete(oldestKey)
  }
}

function invalidate(key: string): void {
  entries.delete(key)
}

function clear(): void {
  entries.clear()
}

export const requestCache = { peek, isFresh, set, invalidate, clear }
