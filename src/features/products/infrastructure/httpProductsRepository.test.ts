import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '@/shared/http/httpError.ts'
import { httpProvider } from '@/shared/http/httpProvider.ts'
import { ProductNotFoundError } from '@/features/products/domain/errors.ts'
import { httpProductsRepository } from './httpProductsRepository.ts'

vi.mock('@/shared/http/httpProvider.ts', () => ({ httpProvider: { get: vi.fn() } }))

const getMock = vi.mocked(httpProvider.get)

const LIST_FIELDS = 'brand,title,description,category,price'

const listResponse = {
  products: [{ id: 1, title: 'iPhone 9', description: 'Phone', category: 'smartphones', price: 549 }],
  total: 194,
  skip: 0,
  limit: 20,
}

beforeEach(() => {
  getMock.mockReset()
})

describe('httpProductsRepository.getCatalog', () => {
  it('requests a page of /products with the list fields and sort', async () => {
    getMock.mockResolvedValue(listResponse)
    const signal = new AbortController().signal

    await httpProductsRepository.getCatalog(
      { skip: 40, limit: 20, sort: { sortBy: 'price', order: 'desc' } },
      signal,
    )

    expect(getMock).toHaveBeenCalledWith('/products', {
      params: { skip: 40, limit: 20, select: LIST_FIELDS, sortBy: 'price', order: 'desc' },
      signal,
    })
  })

  it('sends no sort params without a sort', async () => {
    getMock.mockResolvedValue(listResponse)

    await httpProductsRepository.getCatalog({ skip: 0, limit: 20, sort: null })

    expect(getMock.mock.calls[0]?.[1]?.params).toMatchObject({ sortBy: undefined, order: undefined })
  })

  it('maps the API response to a domain page', async () => {
    getMock.mockResolvedValue(listResponse)

    await expect(httpProductsRepository.getCatalog({ skip: 0, limit: 20, sort: null })).resolves.toEqual({
      items: listResponse.products,
      total: 194,
    })
  })
})

describe('httpProductsRepository.search', () => {
  it('requests /products/search with the query, page, fields and sort', async () => {
    getMock.mockResolvedValue(listResponse)

    await httpProductsRepository.search({
      q: 'phone',
      skip: 20,
      limit: 20,
      sort: { sortBy: 'title', order: 'asc' },
    })

    expect(getMock).toHaveBeenCalledWith('/products/search', {
      params: { q: 'phone', skip: 20, limit: 20, select: LIST_FIELDS, sortBy: 'title', order: 'asc' },
      signal: undefined,
    })
  })

  it('maps an empty result', async () => {
    getMock.mockResolvedValue({ products: [], total: 0, skip: 0, limit: 0 })

    await expect(
      httpProductsRepository.search({ q: 'zzzz', skip: 0, limit: 20, sort: null }),
    ).resolves.toEqual({ items: [], total: 0 })
  })
})

describe('httpProductsRepository.getById', () => {
  it('requests a single product', async () => {
    const product = { id: 12, title: 'Watch' }
    getMock.mockResolvedValue(product)
    const signal = new AbortController().signal

    await expect(httpProductsRepository.getById(12, signal)).resolves.toBe(product)
    expect(getMock).toHaveBeenCalledWith('/products/12', { signal })
  })

  it('turns a 404 into ProductNotFoundError', async () => {
    getMock.mockRejectedValue(new HttpError(404, "Product with id '999' not found"))

    const request = httpProductsRepository.getById(999)

    await expect(request).rejects.toBeInstanceOf(ProductNotFoundError)
    await expect(request).rejects.toMatchObject({ productId: 999 })
  })

  it('passes other errors through', async () => {
    const serverError = new HttpError(500, 'Server error')
    getMock.mockRejectedValue(serverError)

    await expect(httpProductsRepository.getById(1)).rejects.toBe(serverError)
  })
})
