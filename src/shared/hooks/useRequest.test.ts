import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useRequest } from './useRequest.ts'
import type { RequestDescriptor } from './useRequest.ts'

let keyCounter = 0

function uniqueKey(name: string): string {
  keyCounter += 1
  return `test:${name}:${keyCounter}`
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {}
  let reject: (reason: unknown) => void = () => {}
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  return { promise, resolve, reject }
}

function renderRequest<T>(request: RequestDescriptor<T> | null) {
  return renderHook(({ current }) => useRequest(current), { initialProps: { current: request } })
}

function shiftClock() {
  const realNow = Date.now.bind(Date)
  let offset = 0
  vi.spyOn(Date, 'now').mockImplementation(() => realNow() + offset)
  return (ms: number) => {
    offset += ms
  }
}

describe('useRequest', () => {
  it('stays idle without a request', () => {
    const { result } = renderRequest(null)
    expect(result.current).toMatchObject({ data: null, error: null, isLoading: false })
  })

  it('loads data', async () => {
    const run = vi.fn(() => Promise.resolve('value'))
    const { result } = renderRequest({ key: uniqueKey('load'), run })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data).toBe('value'))
    expect(result.current.isLoading).toBe(false)
    expect(run).toHaveBeenCalledOnce()
  })

  it('exposes errors as Error objects', async () => {
    const { result } = renderRequest({ key: uniqueKey('error'), run: () => Promise.reject('boom') })

    await waitFor(() => expect(result.current.error?.message).toBe('boom'))
    expect(result.current).toMatchObject({ data: null, isLoading: false })
  })

  it('aborts the previous request and ignores its late response', async () => {
    const first = deferred<string>()
    let firstSignal: AbortSignal | undefined
    const { result, rerender } = renderRequest<string>({
      key: uniqueKey('first'),
      run: (signal) => {
        firstSignal = signal
        return first.promise
      },
    })

    rerender({ current: { key: uniqueKey('second'), run: () => Promise.resolve('second') } })
    await waitFor(() => expect(result.current.data).toBe('second'))
    expect(firstSignal?.aborted).toBe(true)

    await act(async () => first.resolve('first'))
    expect(result.current.data).toBe('second')
  })

  it('serves a fresh cached response without a new request', async () => {
    const key = uniqueKey('cached')
    const first = renderRequest({ key, run: () => Promise.resolve('cached') })
    await waitFor(() => expect(first.result.current.data).toBe('cached'))
    first.unmount()

    const run = vi.fn(() => Promise.resolve('new'))
    const second = renderRequest({ key, run })

    expect(second.result.current).toMatchObject({ data: 'cached', isLoading: false })
    expect(run).not.toHaveBeenCalled()
  })

  it('shows stale cached data while refreshing in the background', async () => {
    const advanceClock = shiftClock()
    const key = uniqueKey('stale')
    const first = renderRequest({ key, run: () => Promise.resolve('old') })
    await waitFor(() => expect(first.result.current.data).toBe('old'))
    first.unmount()

    advanceClock(6 * 60 * 1000)
    const refresh = deferred<string>()
    const second = renderRequest({ key, run: () => refresh.promise })

    expect(second.result.current).toMatchObject({ data: 'old', isLoading: false })
    await act(async () => refresh.resolve('new'))
    expect(second.result.current.data).toBe('new')
  })

  it('keeps stale cached data when the background refresh fails', async () => {
    const advanceClock = shiftClock()
    const key = uniqueKey('refresh-fails')
    const first = renderRequest({ key, run: () => Promise.resolve('old') })
    await waitFor(() => expect(first.result.current.data).toBe('old'))
    first.unmount()

    advanceClock(6 * 60 * 1000)
    const refresh = deferred<string>()
    const second = renderRequest({ key, run: () => refresh.promise })

    await act(async () => refresh.reject(new Error('offline')))
    expect(second.result.current).toMatchObject({ data: 'old', error: null, isLoading: false })
  })

  it('does not cache errors and retries on demand', async () => {
    const run = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce('ok')
    const { result } = renderRequest({ key: uniqueKey('retry'), run })

    await waitFor(() => expect(result.current.error?.message).toBe('down'))
    act(() => result.current.retry())

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data).toBe('ok'))
    expect(run).toHaveBeenCalledTimes(2)
  })

  it('bypasses a fresh cache entry on retry', async () => {
    const run = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')
    const { result } = renderRequest({ key: uniqueKey('retry-cache'), run })

    await waitFor(() => expect(result.current.data).toBe('first'))
    act(() => result.current.retry())

    await waitFor(() => expect(result.current.data).toBe('second'))
    expect(run).toHaveBeenCalledTimes(2)
  })
})
