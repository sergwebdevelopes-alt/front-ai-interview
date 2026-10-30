import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateQueryParams } from '@/shared/url/useQueryParam.ts'
import { useProductSearch } from './useProductSearch.ts'

function setUrl(url: string) {
  window.history.replaceState(null, '', url)
}

function urlParams() {
  return new URLSearchParams(window.location.search)
}

beforeEach(() => {
  vi.useFakeTimers()
})

describe('useProductSearch', () => {
  it('starts with the query from the URL', () => {
    setUrl('/?q=phone')
    expect(renderHook(() => useProductSearch()).result.current.input).toBe('phone')
  })

  it('updates the input at once and the URL after 200 ms, trimmed, without a history entry', () => {
    setUrl('/?skip=40')
    const { result } = renderHook(() => useProductSearch())
    const length = window.history.length

    act(() => result.current.setSearch('  phone '))
    expect(result.current.input).toBe('  phone ')
    expect(urlParams().has('q')).toBe(false)

    act(() => vi.advanceTimersByTime(199))
    expect(urlParams().has('q')).toBe(false)

    act(() => vi.advanceTimersByTime(1))
    expect(urlParams().get('q')).toBe('phone')
    expect(urlParams().has('skip')).toBe(false)
    expect(window.history.length).toBe(length)
  })

  it('writes only the last value while typing', () => {
    const { result } = renderHook(() => useProductSearch())

    act(() => result.current.setSearch('p'))
    act(() => vi.advanceTimersByTime(100))
    act(() => result.current.setSearch('ph'))
    act(() => vi.advanceTimersByTime(200))

    expect(urlParams().get('q')).toBe('ph')
  })

  it('does not reset the page when the trimmed query is unchanged', () => {
    setUrl('/?q=phone&skip=20')
    const { result } = renderHook(() => useProductSearch())

    act(() => result.current.setSearch('phone '))
    act(() => vi.advanceTimersByTime(200))

    expect(urlParams().get('skip')).toBe('20')
  })

  it('removes q when the input is cleared', () => {
    setUrl('/?q=phone')
    const { result } = renderHook(() => useProductSearch())

    act(() => result.current.setSearch(''))
    act(() => vi.advanceTimersByTime(200))

    expect(urlParams().has('q')).toBe(false)
  })

  it('shows a query restored by Back and skips the pending write', () => {
    setUrl('/?q=old')
    const { result } = renderHook(() => useProductSearch())

    act(() => result.current.setSearch('new'))
    act(() => {
      window.history.pushState(null, '', '/?q=back')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(result.current.input).toBe('back')

    act(() => vi.advanceTimersByTime(200))
    expect(urlParams().get('q')).toBe('back')
  })

  it('syncs the input when q is cleared elsewhere', () => {
    setUrl('/?q=zzzz')
    const { result } = renderHook(() => useProductSearch())

    act(() => updateQueryParams({ q: null }, { replace: true }))

    expect(result.current.input).toBe('')
  })
})
