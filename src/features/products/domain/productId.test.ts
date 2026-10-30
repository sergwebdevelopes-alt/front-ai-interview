import { describe, expect, it } from 'vitest'
import { isValidProductId } from './productId.ts'

describe('isValidProductId', () => {
  it.each([1, 12, 194, 999])('accepts %i', (value) => {
    expect(isValidProductId(value)).toBe(true)
  })

  it.each([0, -1, 1.5, Number.NaN])('rejects %s', (value) => {
    expect(isValidProductId(value)).toBe(false)
  })
})
