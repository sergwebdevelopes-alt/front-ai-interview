import { Suspense, lazy, useState } from 'react'
import type { ComponentProps } from 'react'
import { Backdrop, CircularProgress } from '@mui/material'
import type { ProductDialog as ProductDialogComponent } from './ProductDialog.tsx'

const ProductDialog = lazy(() =>
  import('./ProductDialog.tsx').then((module) => ({ default: module.ProductDialog })),
)

type LazyProductDialogProps = ComponentProps<typeof ProductDialogComponent>

export function LazyProductDialog(props: LazyProductDialogProps) {
  const [hasOpened, setHasOpened] = useState(props.open)
  if (props.open && !hasOpened) setHasOpened(true)

  if (!hasOpened) return null

  return (
    <Suspense
      fallback={
        <Backdrop open>
          <CircularProgress color="inherit" />
        </Backdrop>
      }
    >
      <ProductDialog {...props} />
    </Suspense>
  )
}
