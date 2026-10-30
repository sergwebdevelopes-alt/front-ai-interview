import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError, RequestTimeoutError } from './httpError.ts'
import { httpProvider } from './httpProvider.ts'

vi.mock('@/shared/config.ts', () => ({
  config: { apiBaseUrl: 'https://api.test', httpTimeoutMs: 50 },
}))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), init)
}

function hangUntilAborted(): typeof fetch {
  return (_input, init) =>
    new Promise((_resolve, reject) => {
      const signal = init?.signal
      signal?.addEventListener('abort', () => reject(signal.reason), { once: true })
    })
}

function requestSignal(): AbortSignal | null | undefined {
  return fetchMock.mock.calls[0]?.[1]?.signal
}

describe('httpProvider.get', () => {
  it('builds the URL from the base URL, path and params', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))

    await httpProvider.get('/products', { params: { limit: 20, skip: 0, q: 'red phone' } })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/products?limit=20&skip=0&q=red+phone',
      expect.anything(),
    )
  })

  it('leaves out undefined params', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))

    await httpProvider.get('/products', { params: { sortBy: undefined, limit: 20 } })

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.test/products?limit=20')
  })

  it('returns the parsed JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1, title: 'iPhone' }))
    await expect(httpProvider.get('/products/1')).resolves.toEqual({ id: 1, title: 'iPhone' })
  })

  it('throws HttpError with the API message on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Not found' }, { status: 404 }))

    const request = httpProvider.get('/products/999')

    await expect(request).rejects.toBeInstanceOf(HttpError)
    await expect(request).rejects.toMatchObject({ status: 404, message: 'Not found' })
  })

  it('lets fetch errors through', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(httpProvider.get('/products')).rejects.toThrow('Failed to fetch')
  })
})

describe('httpProvider.get cancelation', () => {
  it('always passes a signal to fetch, even without a caller signal', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))

    await httpProvider.get('/products')

    expect(requestSignal()).toBeInstanceOf(AbortSignal)
  })

  it('aborts the request when the caller aborts', async () => {
    fetchMock.mockImplementation(hangUntilAborted())
    const controller = new AbortController()

    const request = httpProvider.get('/products', { signal: controller.signal })
    controller.abort()

    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
    expect(requestSignal()?.aborted).toBe(true)
  })

  it('does not report a caller abort as a timeout', async () => {
    fetchMock.mockImplementation(hangUntilAborted())
    const controller = new AbortController()

    const request = httpProvider.get('/products', { signal: controller.signal, timeoutMs: 1_000 })
    controller.abort()

    await expect(request).rejects.not.toBeInstanceOf(RequestTimeoutError)
  })
})

describe('httpProvider.get timeout', () => {
  it('times out after the default from config', async () => {
    fetchMock.mockImplementation(hangUntilAborted())

    const request = httpProvider.get('/products')

    await expect(request).rejects.toBeInstanceOf(RequestTimeoutError)
    await expect(request).rejects.toMatchObject({
      timeoutMs: 50,
      message: 'Request timed out after 0.05 s',
    })
  })

  it('uses a per-call timeout', async () => {
    fetchMock.mockImplementation(hangUntilAborted())

    await expect(httpProvider.get('/products', { timeoutMs: 20 })).rejects.toMatchObject({
      name: 'RequestTimeoutError',
      timeoutMs: 20,
    })
  })

  it('times out together with a caller signal that is still active', async () => {
    fetchMock.mockImplementation(hangUntilAborted())
    const controller = new AbortController()

    const request = httpProvider.get('/products', { signal: controller.signal, timeoutMs: 20 })

    await expect(request).rejects.toBeInstanceOf(RequestTimeoutError)
    expect(controller.signal.aborted).toBe(false)
  })

  it('does not time out a response that arrives in time', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
    await expect(httpProvider.get('/products', { timeoutMs: 1_000 })).resolves.toEqual({ ok: true })
  })
})
