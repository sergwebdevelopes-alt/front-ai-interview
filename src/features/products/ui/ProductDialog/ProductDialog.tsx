import { useMemo } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useLastActiveValue } from '@/shared/hooks/useLastActiveValue.ts'
import { CloseIcon } from '@/shared/ui/CloseIcon.tsx'
import { ErrorAlert } from '@/shared/ui/ErrorAlert.tsx'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary.tsx'
import type { Product } from '@/features/products/domain/product.ts'
import { ProductDescription } from './ProductDescription.tsx'
import { ProductGallery } from './ProductGallery.tsx'
import { ProductHeader } from './ProductHeader.tsx'
import { ProductMeta } from './ProductMeta.tsx'
import { ProductReviews } from './ProductReviews.tsx'
import { ProductSpecs } from './ProductSpecs.tsx'
import { ProductSummary } from './ProductSummary.tsx'

type ProductDialogProps = {
  open: boolean
  product: Product | null
  isLoading: boolean
  error: Error | null
  isNotFound: boolean
  onClose: () => void
  onRetry: () => void
}

export function ProductDialog({
  open,
  product,
  isLoading,
  error,
  isNotFound,
  onClose,
  onRetry,
}: ProductDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const currentView = useMemo(
    () => ({ product, isLoading, error, isNotFound }),
    [product, isLoading, error, isNotFound],
  )
  const view = useLastActiveValue(currentView, open)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      aria-labelledby="product-dialog-title"
    >
      <DialogTitle id="product-dialog-title" sx={{ pr: 7 }}>
        {view.product ? <ProductHeader product={view.product} /> : 'Product'}
      </DialogTitle>
      <IconButton
        aria-label="Close"
        onClick={onClose}
        sx={{ position: 'absolute', top: 8, right: 8 }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        <ErrorBoundary
          message="Couldn't display the product"
          resetKey={String(view.product?.id ?? '')}
        >
          {view.isLoading && <ProductSkeleton />}
          {view.isNotFound && <Alert severity="info">Product not found</Alert>}
          {view.error && (
            <ErrorAlert message={`Couldn't load the product: ${view.error.message}`} onRetry={onRetry} />
          )}
          {view.product && (
            <Stack spacing={3}>
              <ProductGallery title={view.product.title} images={view.product.images} />
              <ProductSummary product={view.product} />
              <ProductDescription description={view.product.description} tags={view.product.tags} />
              <ProductSpecs product={view.product} />
              <ProductReviews reviews={view.product.reviews} />
              <ProductMeta meta={view.product.meta} />
            </Stack>
          )}
        </ErrorBoundary>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

function ProductSkeleton() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="rectangular" height={160} />
      <Skeleton width="40%" />
      <Skeleton />
      <Skeleton />
      <Skeleton width="60%" />
    </Stack>
  )
}
