import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductNotFoundError } from '@/features/products/domain/errors.ts'
import type { Product } from '@/features/products/domain/product.ts'
import { productsRepository } from '@/features/products/infrastructure/index.ts'
import { useOpenProduct } from './useOpenProduct.ts'
import { useProductDetails } from './useProductDetails.ts'

vi.mock('@/features/products/infrastructure/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/products/infrastructure/index.ts')>()
  const { createFakeProductsRepository } = await import('@/test/fakeProductsRepository.ts')
  return { ...actual, productsRepository: createFakeProductsRepository() }
})

const repository = vi.mocked(productsRepository)

const product = { id: 12, title: 'Watch' } as Product

function setUrl(url: string) {
  window.history.replaceState(null, '', url)
}

beforeEach(() => {
  repository.getById.mockReset().mockResolvedValue(product)
})

describe('useProductDetails', () => {
  it('does nothing while closed', () => {
    const { result } = renderHook(() => useProductDetails())

    expect(result.current).toMatchObject({
      isOpen: false,
      product: null,
      isLoading: false,
      error: null,
      isNotFound: false,
    })
    expect(repository.getById).not.toHaveBeenCalled()
  })

  it('loads the selected product', async () => {
    setUrl('/?productId=12')
    const { result } = renderHook(() => useProductDetails())

    expect(result.current).toMatchObject({ isOpen: true, isLoading: true })
    await waitFor(() => expect(result.current.product).toBe(product))

    expect(repository.getById).toHaveBeenCalledWith(12, expect.any(AbortSignal))
    expect(result.current.isLoading).toBe(false)
  })

  it('shows not found for an invalid id without a request', () => {
    setUrl('/?productId=abc')
    const { result } = renderHook(() => useProductDetails())

    expect(result.current).toMatchObject({ isOpen: true, isNotFound: true, isLoading: false, error: null })
    expect(repository.getById).not.toHaveBeenCalled()
  })

  it('shows not found when the product does not exist', async () => {
    repository.getById.mockRejectedValue(new ProductNotFoundError(999))
    setUrl('/?productId=999')
    const { result } = renderHook(() => useProductDetails())

    await waitFor(() => expect(result.current.isNotFound).toBe(true))
    expect(result.current.error).toBeNull()
  })

  it('exposes other errors and retries', async () => {
    repository.getById.mockRejectedValueOnce(new Error('down'))
    setUrl('/?productId=12')
    const { result } = renderHook(() => useProductDetails())

    await waitFor(() => expect(result.current.error?.message).toBe('down'))
    expect(result.current.isNotFound).toBe(false)

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.product).toBe(product))
  })

  it('opens and closes through the URL', async () => {
    const { result } = renderHook(() => useProductDetails())

    act(() => result.current.open(12))
    expect(window.location.search).toBe('?productId=12')
    await waitFor(() => expect(result.current.product).toBe(product))

    act(() => result.current.close())
    expect(window.location.search).toBe('')
    expect(result.current).toMatchObject({ isOpen: false, product: null })
  })
})

describe('useOpenProduct', () => {
  it('opens a product by id', () => {
    setUrl('/?skip=20')
    const { result } = renderHook(() => useOpenProduct())

    act(() => result.current(5))

    expect(window.location.search).toBe('?skip=20&productId=5')
  })
})
