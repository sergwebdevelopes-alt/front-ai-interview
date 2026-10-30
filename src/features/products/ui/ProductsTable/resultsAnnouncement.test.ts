import { describe, expect, it } from 'vitest'
import { describeResults } from './resultsAnnouncement.ts'

describe('describeResults', () => {
  it('describes the catalog with the page', () => {
    expect(describeResults({ total: 194, page: 1, pageSize: 20, query: '' })).toBe(
      '194 products, page 2 of 10',
    )
  })

  it('describes search results with the query', () => {
    expect(describeResults({ total: 23, page: 0, pageSize: 20, query: 'phone' })).toBe(
      '23 results for “phone”, page 1 of 2',
    )
  })

  it('uses the singular for one item', () => {
    expect(describeResults({ total: 1, page: 0, pageSize: 20, query: '' })).toBe('1 product, page 1 of 1')
    expect(describeResults({ total: 1, page: 0, pageSize: 20, query: 'rolex' })).toBe(
      '1 result for “rolex”, page 1 of 1',
    )
  })

  it('describes an empty catalog and an empty search', () => {
    expect(describeResults({ total: 0, page: 0, pageSize: 20, query: '' })).toBe('No products')
    expect(describeResults({ total: 0, page: 0, pageSize: 20, query: 'zzzz' })).toBe('No results for “zzzz”')
  })

  it('counts a partial last page as a page', () => {
    expect(describeResults({ total: 201, page: 10, pageSize: 20, query: '' })).toBe(
      '201 products, page 11 of 11',
    )
  })
})
