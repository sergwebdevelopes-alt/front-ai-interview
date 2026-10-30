import { describe, expect, it } from 'vitest'
import { PAGE_SIZE, clampPage, normalizeSkip, pageToSkip, skipToPage } from './pagination.ts'

describe('normalizeSkip', () => {
  it.each([
    [0, 0],
    [20, 20],
    [40, 40],
    [7, 0],
    [39, 20],
    [500, 500],
  ])('%i → %i', (value, expected) => {
    expect(normalizeSkip(value)).toBe(expected)
  })

  it.each([-5, -20, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('falls back to 0 for %s', (value) => {
    expect(normalizeSkip(value)).toBe(0)
  })
})

describe('pageToSkip / skipToPage', () => {
  it('converts both ways using the page size', () => {
    expect(PAGE_SIZE).toBe(20)
    expect(pageToSkip(0)).toBe(0)
    expect(pageToSkip(3)).toBe(60)
    expect(skipToPage(60)).toBe(3)
    expect(skipToPage(0)).toBe(0)
  })
})

describe('clampPage', () => {
  it('keeps a page inside the range', () => {
    expect(clampPage(2, 194)).toBe(2)
  })

  it('clamps to the last page when past the end', () => {
    expect(clampPage(25, 194)).toBe(9)
  })

  it('uses page 0 when the total is unknown or empty', () => {
    expect(clampPage(3, null)).toBe(0)
    expect(clampPage(3, 0)).toBe(0)
  })

  it('treats an exact multiple of the page size correctly', () => {
    expect(clampPage(5, 40)).toBe(1)
  })
})
