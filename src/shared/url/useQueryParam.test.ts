import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { updateQueryParams, useQueryParam } from './useQueryParam.ts'

function setUrl(url: string) {
  window.history.replaceState(null, '', url)
}

describe('updateQueryParams', () => {
  it('sets and removes params, keeping the others', () => {
    setUrl('/?skip=20&q=phone')

    updateQueryParams({ skip: null, sortBy: 'price' })

    const params = new URLSearchParams(window.location.search)
    expect(params.get('skip')).toBeNull()
    expect(params.get('q')).toBe('phone')
    expect(params.get('sortBy')).toBe('price')
  })

  it('adds a history entry by default', () => {
    const length = window.history.length
    updateQueryParams({ q: 'phone' })
    expect(window.history.length).toBe(length + 1)
  })

  it('replaces the current entry with replace: true', () => {
    const length = window.history.length
    updateQueryParams({ q: 'phone' }, { replace: true })
    expect(window.history.length).toBe(length)
    expect(window.location.search).toBe('?q=phone')
  })
})

describe('useQueryParam', () => {
  it('reads the current value, or null when missing', () => {
    setUrl('/?q=phone')
    expect(renderHook(() => useQueryParam('q')).result.current[0]).toBe('phone')
    expect(renderHook(() => useQueryParam('skip')).result.current[0]).toBeNull()
  })

  it('updates after its own write', () => {
    const { result } = renderHook(() => useQueryParam('q'))

    act(() => result.current[1]('laptop'))
    expect(result.current[0]).toBe('laptop')
    expect(window.location.search).toBe('?q=laptop')

    act(() => result.current[1](null))
    expect(result.current[0]).toBeNull()
    expect(window.location.search).toBe('')
  })

  it('updates after another hook writes the same param', () => {
    const reader = renderHook(() => useQueryParam('q'))
    act(() => updateQueryParams({ q: 'watch' }))
    expect(reader.result.current[0]).toBe('watch')
  })

  it('updates on Back/Forward (popstate)', () => {
    setUrl('/?q=old')
    const { result } = renderHook(() => useQueryParam('q'))

    act(() => {
      window.history.pushState(null, '', '/?q=new')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(result.current[0]).toBe('new')
  })
})
