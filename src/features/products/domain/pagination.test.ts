import { describe, expect, it } from 'vitest'
import {
  PAGE_SIZE,
  clampPage,
  isPastLastPage,
  lastPageSkip,
  normalizeSkip,
  pageToSkip,
  skipToPage,
} from './pagination.ts'

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

describe('lastPageSkip', () => {
  it.each([
    [194, 180],
    [200, 180],
    [201, 200],
    [20, 0],
    [1, 0],
    [0, 0],
  ])('total %i → last page starts at %i', (total, expected) => {
    expect(lastPageSkip(total)).toBe(expected)
  })
})

describe('isPastLastPage', () => {
  it('is false on and before the last page', () => {
    expect(isPastLastPage(0, 194)).toBe(false)
    expect(isPastLastPage(180, 194)).toBe(false)
  })

  it('is true after the last page', () => {
    expect(isPastLastPage(200, 194)).toBe(true)
    expect(isPastLastPage(500, 194)).toBe(true)
  })

  it('treats any page after the first as past the end of an empty result', () => {
    expect(isPastLastPage(0, 0)).toBe(false)
    expect(isPastLastPage(20, 0)).toBe(true)
  })
})
