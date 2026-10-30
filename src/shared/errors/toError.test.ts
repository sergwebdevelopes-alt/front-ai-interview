import { describe, expect, it } from 'vitest'
import { toError } from './toError.ts'

describe('toError', () => {
  it('returns an Error unchanged', () => {
    const error = new TypeError('broken')
    expect(toError(error)).toBe(error)
  })

  it('wraps a string', () => {
    const error = toError('boom')
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('boom')
  })

  it('wraps other values using their string form', () => {
    expect(toError(42).message).toBe('42')
    expect(toError(null).message).toBe('null')
  })
})
