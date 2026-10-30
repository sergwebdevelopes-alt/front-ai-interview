import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useUrlCatalogState } from './urlCatalogState.ts'

function setUrl(url: string) {
  window.history.replaceState(null, '', url)
}

function urlParams() {
  return new URLSearchParams(window.location.search)
}

describe('useUrlCatalogState params', () => {
  it('uses defaults for an empty URL', () => {
    const { result } = renderHook(() => useUrlCatalogState())
    expect(result.current.params).toEqual({ skip: 0, sort: null, query: '' })
  })

  it('reads skip, sort and query', () => {
    setUrl('/?skip=40&sortBy=price&order=desc&q=%20phone%20')
    const { result } = renderHook(() => useUrlCatalogState())
    expect(result.current.params).toEqual({
      skip: 40,
      sort: { sortBy: 'price', order: 'desc' },
      query: 'phone',
    })
  })

  it.each([
    ['abc', 0],
    ['-20', 0],
    ['7', 0],
    ['45', 40],
  ])('normalizes skip=%s to %i', (raw, expected) => {
    setUrl(`/?skip=${raw}`)
    expect(renderHook(() => useUrlCatalogState()).result.current.params.skip).toBe(expected)
  })

  it.each([
    '/?sortBy=bogus&order=asc',
    '/?sortBy=price&order=up',
    '/?sortBy=price',
    '/?order=asc',
  ])('ignores an invalid sort in %s', (url) => {
    setUrl(url)
    expect(renderHook(() => useUrlCatalogState()).result.current.params.sort).toBeNull()
  })
})

describe('useUrlCatalogState update', () => {
  it('writes only the fields in the patch', () => {
    setUrl('/?q=phone&skip=20')
    const { result } = renderHook(() => useUrlCatalogState())

    act(() => result.current.update({ skip: 40 }))

    expect(urlParams().get('skip')).toBe('40')
    expect(urlParams().get('q')).toBe('phone')
    expect(result.current.params.skip).toBe(40)
  })

  it('removes skip for the first page and q for an empty query', () => {
    setUrl('/?q=phone&skip=20')
    const { result } = renderHook(() => useUrlCatalogState())

    act(() => result.current.update({ skip: 0, query: '' }))

    expect(window.location.search).toBe('')
  })

  it('writes and removes both sort params', () => {
    const { result } = renderHook(() => useUrlCatalogState())

    act(() => result.current.update({ sort: { sortBy: 'brand', order: 'asc' } }))
    expect(urlParams().get('sortBy')).toBe('brand')
    expect(urlParams().get('order')).toBe('asc')

    act(() => result.current.update({ sort: null }))
    expect(urlParams().has('sortBy')).toBe(false)
    expect(urlParams().has('order')).toBe(false)
  })

  it('writes several fields as one history entry', () => {
    const { result } = renderHook(() => useUrlCatalogState())
    const length = window.history.length

    act(() => result.current.update({ sort: { sortBy: 'price', order: 'asc' }, skip: 0 }))

    expect(window.history.length).toBe(length + 1)
  })

  it('replaces the history entry with history: replace', () => {
    const { result } = renderHook(() => useUrlCatalogState())
    const length = window.history.length

    act(() => result.current.update({ query: 'phone' }, { history: 'replace' }))

    expect(window.history.length).toBe(length)
    expect(urlParams().get('q')).toBe('phone')
  })
})
