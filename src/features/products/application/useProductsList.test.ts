import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductListItem, ProductListPage } from '@/features/products/domain/product.ts'
import { productsRepository } from '@/features/products/infrastructure/index.ts'
import { deferred } from '@/test/fakeProductsRepository.ts'
import { useProductsList } from './useProductsList.ts'

vi.mock('@/features/products/infrastructure/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/products/infrastructure/index.ts')>()
  const { createFakeProductsRepository } = await import('@/test/fakeProductsRepository.ts')
  return { ...actual, productsRepository: createFakeProductsRepository() }
})

const repository = vi.mocked(productsRepository)

const item: ProductListItem = { id: 1, title: 'iPhone 9', description: 'Phone', category: 'smartphones', price: 549 }

function page(total: number, items: ProductListItem[] = [item]): ProductListPage {
  return { items, total }
}

function setUrl(url: string) {
  window.history.replaceState(null, '', url)
}

function urlParams() {
  return new URLSearchParams(window.location.search)
}

beforeEach(() => {
  repository.getCatalog.mockReset().mockResolvedValue(page(194))
  repository.search.mockReset().mockResolvedValue(page(23))
  repository.getById.mockReset()
})

describe('useProductsList loading', () => {
  it('loads the first catalog page without a query', async () => {
    const { result } = renderHook(() => useProductsList())

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.products).toEqual([item]))

    expect(repository.getCatalog).toHaveBeenCalledWith(
      { skip: 0, limit: 20, sort: null },
      expect.any(AbortSignal),
    )
    expect(repository.search).not.toHaveBeenCalled()
    expect(result.current).toMatchObject({ total: 194, page: 0, query: '', sort: null, isLoading: false })
  })

  it('searches when the URL has a query, with page and sort', async () => {
    setUrl('/?q=phone&skip=20&sortBy=price&order=asc')
    const { result } = renderHook(() => useProductsList())

    await waitFor(() => expect(result.current.total).toBe(23))

    expect(repository.search).toHaveBeenCalledWith(
      { q: 'phone', skip: 20, limit: 20, sort: { sortBy: 'price', order: 'asc' } },
      expect.any(AbortSignal),
    )
    expect(repository.getCatalog).not.toHaveBeenCalled()
    expect(result.current).toMatchObject({ page: 1, query: 'phone' })
  })

  it('exposes an error and retries', async () => {
    repository.getCatalog.mockReset().mockRejectedValueOnce(new Error('down')).mockResolvedValue(page(194))
    const { result } = renderHook(() => useProductsList())

    await waitFor(() => expect(result.current.error?.message).toBe('down'))
    act(() => result.current.retry())

    await waitFor(() => expect(result.current.products).toEqual([item]))
    expect(result.current.error).toBeNull()
    expect(repository.getCatalog).toHaveBeenCalledTimes(2)
  })
})

describe('useProductsList paging', () => {
  it('moves to another page with a new history entry', async () => {
    const { result } = renderHook(() => useProductsList())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const length = window.history.length

    act(() => result.current.setPage(2))

    expect(urlParams().get('skip')).toBe('40')
    expect(window.history.length).toBe(length + 1)
    await waitFor(() =>
      expect(repository.getCatalog).toHaveBeenLastCalledWith(
        { skip: 40, limit: 20, sort: null },
        expect.any(AbortSignal),
      ),
    )
  })

  it('keeps the total while the next page loads', async () => {
    const { result } = renderHook(() => useProductsList())
    await waitFor(() => expect(result.current.total).toBe(194))

    const next = deferred<ProductListPage>()
    repository.getCatalog.mockReturnValueOnce(next.promise)
    act(() => result.current.setPage(1))

    expect(result.current).toMatchObject({ isLoading: true, total: 194, products: [] })
    await act(async () => next.resolve(page(194)))
    expect(result.current.isLoading).toBe(false)
  })

  it('clamps the page when skip is past the end', async () => {
    setUrl('/?skip=500')
    const { result } = renderHook(() => useProductsList())

    await waitFor(() => expect(result.current.total).toBe(194))
    expect(result.current.page).toBe(9)
  })
})

describe('useProductsList sorting and search', () => {
  it('cycles the sort and goes back to the first page in one history entry', async () => {
    setUrl('/?skip=40')
    const { result } = renderHook(() => useProductsList())
    const length = window.history.length

    act(() => result.current.toggleSort('price'))
    expect(result.current.sort).toEqual({ sortBy: 'price', order: 'asc' })
    expect(urlParams().has('skip')).toBe(false)
    expect(window.history.length).toBe(length + 1)

    act(() => result.current.toggleSort('price'))
    expect(result.current.sort).toEqual({ sortBy: 'price', order: 'desc' })

    act(() => result.current.toggleSort('price'))
    expect(result.current.sort).toBeNull()
    expect(urlParams().has('sortBy')).toBe(false)
  })

  it('clears the search without a new history entry', async () => {
    setUrl('/?q=zzzz&skip=20')
    const { result } = renderHook(() => useProductsList())
    const length = window.history.length

    act(() => result.current.clearSearch())

    expect(window.location.search).toBe('')
    expect(window.history.length).toBe(length)
    expect(result.current.query).toBe('')
  })
})
