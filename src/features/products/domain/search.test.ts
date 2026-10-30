import { describe, expect, it } from 'vitest'
import { normalizeQuery } from './search.ts'

describe('normalizeQuery', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeQuery('  phone \n')).toBe('phone')
  })

  it('keeps inner spaces', () => {
    expect(normalizeQuery('red  phone')).toBe('red  phone')
  })

  it('turns whitespace-only input into an empty query', () => {
    expect(normalizeQuery('   ')).toBe('')
  })
})
