import { useProductDetails } from '@/features/products/application/useProductDetails.ts'
import { LazyProductDialog } from './LazyProductDialog.tsx'

export function ProductDialogContainer() {
  const details = useProductDetails()

  return (
    <LazyProductDialog
      open={details.isOpen}
      product={details.product}
      isLoading={details.isLoading}
      error={details.error}
      isNotFound={details.isNotFound}
      onClose={details.close}
      onRetry={details.retry}
    />
  )
}
