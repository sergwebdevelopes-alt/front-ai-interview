import { vi } from 'vitest'
import type { ProductsRepository } from '@/features/products/domain/productsRepository.ts'

export function createFakeProductsRepository() {
  return {
    getCatalog: vi.fn<ProductsRepository['getCatalog']>(),
    search: vi.fn<ProductsRepository['search']>(),
    getById: vi.fn<ProductsRepository['getById']>(),
  }
}

export function deferred<T>() {
  let resolve: (value: T) => void = () => {}
  let reject: (reason: unknown) => void = () => {}
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  return { promise, resolve, reject }
}
