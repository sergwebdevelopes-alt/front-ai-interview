import { beforeEach, describe, expect, it, vi } from 'vitest'

type RequestCache = (typeof import('./requestCache.ts'))['requestCache']

const FIVE_MINUTES = 5 * 60 * 1000

let requestCache: RequestCache

beforeEach(async () => {
  vi.resetModules()
  ;({ requestCache } = await import('./requestCache.ts'))
})

describe('requestCache', () => {
  it('returns null for an unknown key', () => {
    expect(requestCache.peek('missing')).toBeNull()
    expect(requestCache.isFresh('missing')).toBe(false)
  })

  it('stores and returns data', () => {
    requestCache.set('a', { value: 1 })
    expect(requestCache.peek('a')).toEqual({ value: 1 })
  })

  it('is fresh for 5 minutes after the last write', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000)
    requestCache.set('a', 'data')

    now.mockReturnValue(1_000 + FIVE_MINUTES - 1)
    expect(requestCache.isFresh('a')).toBe(true)

    now.mockReturnValue(1_000 + FIVE_MINUTES)
    expect(requestCache.isFresh('a')).toBe(false)
    expect(requestCache.peek('a')).toBe('data')
  })

  it('keeps at most 50 entries and drops the oldest', () => {
    for (let index = 0; index <= 50; index += 1) requestCache.set(`key-${index}`, index)

    expect(requestCache.peek('key-0')).toBeNull()
    expect(requestCache.peek('key-1')).toBe(1)
    expect(requestCache.peek('key-50')).toBe(50)
  })

  it('treats a rewritten entry as the newest', () => {
    for (let index = 0; index < 50; index += 1) requestCache.set(`key-${index}`, index)
    requestCache.set('key-0', 'updated')
    requestCache.set('key-50', 50)

    expect(requestCache.peek('key-0')).toBe('updated')
    expect(requestCache.peek('key-1')).toBeNull()
  })

  it('clears all entries', () => {
    requestCache.set('a', 1)
    requestCache.set('b', 2)
    requestCache.clear()
    expect(requestCache.peek('a')).toBeNull()
    expect(requestCache.peek('b')).toBeNull()
  })

  it('invalidates an entry', () => {
    requestCache.set('a', 'data')
    requestCache.invalidate('a')
    expect(requestCache.peek('a')).toBeNull()
    expect(requestCache.isFresh('a')).toBe(false)
  })
})
