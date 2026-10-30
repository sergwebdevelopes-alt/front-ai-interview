import { useRequest } from '@/shared/hooks/useRequest.ts'
import { ProductNotFoundError } from '@/features/products/domain/errors.ts'
import { productsRepository, useProductSelection } from '@/features/products/infrastructure/index.ts'

export function useProductDetails() {
  const { isOpen, productId, open, close } = useProductSelection()

  const { data, error, isLoading, retry } = useRequest(
    productId === null
      ? null
      : { key: `product:${productId}`, run: (signal) => productsRepository.getById(productId, signal) },
  )

  const isNotFound = (isOpen && productId === null) || error instanceof ProductNotFoundError

  return {
    isOpen,
    product: data,
    isLoading,
    error: isNotFound ? null : error,
    isNotFound,
    open,
    close,
    retry,
  }
}
