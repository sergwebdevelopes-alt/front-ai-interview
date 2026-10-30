import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedCallback } from './useDebouncedCallback.ts'

beforeEach(() => {
  vi.useFakeTimers()
})

describe('useDebouncedCallback', () => {
  it('calls the callback once the delay has passed', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 200))

    result.current.debounced('a')
    vi.advanceTimersByTime(199)
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledExactlyOnceWith('a')
  })

  it('only calls with the last arguments when called repeatedly', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 200))

    result.current.debounced('p')
    vi.advanceTimersByTime(100)
    result.current.debounced('ph')
    vi.advanceTimersByTime(100)
    result.current.debounced('pho')
    vi.advanceTimersByTime(200)

    expect(callback).toHaveBeenCalledExactlyOnceWith('pho')
  })

  it('uses the latest callback passed by a re-render', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(({ callback }) => useDebouncedCallback(callback, 200), {
      initialProps: { callback: first },
    })

    result.current.debounced('x')
    rerender({ callback: second })
    vi.advanceTimersByTime(200)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledExactlyOnceWith('x')
  })

  it('drops a pending call on cancel', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 200))

    result.current.debounced('a')
    result.current.cancel()
    vi.advanceTimersByTime(200)

    expect(callback).not.toHaveBeenCalled()
  })

  it('drops a pending call on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 200))

    result.current.debounced('a')
    unmount()
    vi.advanceTimersByTime(200)

    expect(callback).not.toHaveBeenCalled()
  })
})
