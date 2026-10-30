import { Chip, Stack, Typography } from '@mui/material'
import type { ChipProps } from '@mui/material'
import type { AvailabilityStatus, Product } from '@/features/products/domain/product.ts'

const AVAILABILITY_COLORS: Record<AvailabilityStatus, ChipProps['color']> = {
  'In Stock': 'success',
  'Low Stock': 'warning',
  'Out of Stock': 'error',
}

type ProductHeaderProps = {
  product: Product
}

export function ProductHeader({ product }: ProductHeaderProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <span>{product.title}</span>
      {product.brand && (
        <Typography component="span" color="text.secondary">
          · {product.brand}
        </Typography>
      )}
      <Chip
        size="small"
        label={product.availabilityStatus}
        color={AVAILABILITY_COLORS[product.availabilityStatus]}
      />
    </Stack>
  )
}
