import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useUrlProductSelection, useUrlProductSelectionActions } from './urlProductSelection.ts'

function setUrl(url: string) {
  window.history.replaceState(null, '', url)
}

describe('useUrlProductSelection', () => {
  it('is closed without productId', () => {
    const { result } = renderHook(() => useUrlProductSelection())
    expect(result.current).toMatchObject({ isOpen: false, productId: null })
  })

  it('reads a valid productId', () => {
    setUrl('/?productId=12')
    const { result } = renderHook(() => useUrlProductSelection())
    expect(result.current).toMatchObject({ isOpen: true, productId: 12 })
  })

  it.each(['abc', '-1', '0', '1.5', ''])('is open with no id for productId=%s', (raw) => {
    setUrl(`/?productId=${raw}`)
    const { result } = renderHook(() => useUrlProductSelection())
    expect(result.current).toMatchObject({ isOpen: true, productId: null })
  })

  it.each(['<script>alert(1)</script>', '12abc', '12; DROP TABLE', 'javascript:alert(1)', '1e3x'])(
    'treats the hostile productId %s as invalid',
    (raw) => {
      setUrl(`/?productId=${encodeURIComponent(raw)}`)
      const { result } = renderHook(() => useUrlProductSelection())
      expect(result.current).toMatchObject({ isOpen: true, productId: null })
    },
  )

  it('opens with a new history entry and closes', () => {
    setUrl('/?skip=20')
    const { result } = renderHook(() => useUrlProductSelection())
    const length = window.history.length

    act(() => result.current.open(5))
    expect(result.current).toMatchObject({ isOpen: true, productId: 5 })
    expect(window.location.search).toBe('?skip=20&productId=5')
    expect(window.history.length).toBe(length + 1)

    act(() => result.current.close())
    expect(result.current).toMatchObject({ isOpen: false, productId: null })
    expect(window.location.search).toBe('?skip=20')
  })
})

describe('useUrlProductSelectionActions', () => {
  it('does not re-render when the selection changes', () => {
    let renders = 0
    const { result } = renderHook(() => {
      renders += 1
      return useUrlProductSelectionActions()
    })

    act(() => result.current.open(7))
    act(() => result.current.close())

    expect(renders).toBe(1)
  })

  it('returns the same actions object every time', () => {
    const first = renderHook(() => useUrlProductSelectionActions()).result.current
    const second = renderHook(() => useUrlProductSelectionActions()).result.current
    expect(first).toBe(second)
  })
})
