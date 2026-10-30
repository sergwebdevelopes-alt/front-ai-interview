import { describe, expect, it } from 'vitest'
import { SORT_FIELDS, isSortField, isSortOrder, nextSort } from './sort.ts'

describe('isSortField', () => {
  it.each(SORT_FIELDS)('accepts %s', (field) => {
    expect(isSortField(field)).toBe(true)
  })

  it.each([null, undefined, '', 'rating', 'PRICE', 42])('rejects %s', (value) => {
    expect(isSortField(value)).toBe(false)
  })
})

describe('isSortOrder', () => {
  it('accepts asc and desc', () => {
    expect(isSortOrder('asc')).toBe(true)
    expect(isSortOrder('desc')).toBe(true)
  })

  it.each([null, '', 'ASC', 'up'])('rejects %s', (value) => {
    expect(isSortOrder(value)).toBe(false)
  })
})

describe('nextSort', () => {
  it('starts an unsorted table at asc', () => {
    expect(nextSort(null, 'price')).toEqual({ sortBy: 'price', order: 'asc' })
  })

  it('goes from asc to desc on the same column', () => {
    expect(nextSort({ sortBy: 'price', order: 'asc' }, 'price')).toEqual({
      sortBy: 'price',
      order: 'desc',
    })
  })

  it('turns sorting off after desc on the same column', () => {
    expect(nextSort({ sortBy: 'price', order: 'desc' }, 'price')).toBeNull()
  })

  it('starts another column at asc', () => {
    expect(nextSort({ sortBy: 'price', order: 'desc' }, 'brand')).toEqual({
      sortBy: 'brand',
      order: 'asc',
    })
  })
})
