import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from './httpError.ts'
import { httpProvider } from './httpProvider.ts'

vi.mock('@/shared/config.ts', () => ({ config: { apiBaseUrl: 'https://api.test' } }))

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

  it('passes the abort signal to fetch', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))
    const controller = new AbortController()

    await httpProvider.get('/products/1', { signal: controller.signal })

    expect(fetchMock.mock.calls[0]?.[1]).toEqual({ signal: controller.signal })
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
