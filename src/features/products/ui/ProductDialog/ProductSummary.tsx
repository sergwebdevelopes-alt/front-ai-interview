import { Rating, Stack, Typography } from '@mui/material'
import type { Product } from '@/features/products/domain/product.ts'
import { formatPrice } from '@/features/products/ui/utils.ts'

type ProductSummaryProps = {
  product: Product
}

export function ProductSummary({ product }: ProductSummaryProps) {
  return (
    <Stack direction="row" spacing={3} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
      <Typography variant="h5">{formatPrice(product.price)}</Typography>
      <Typography color="success.main">−{product.discountPercentage}%</Typography>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Rating value={product.rating} precision={0.1} readOnly size="small" />
        <Typography variant="body2">{product.rating}</Typography>
      </Stack>
      <Typography variant="body2">{product.stock} in stock</Typography>
      <Typography variant="body2">Min. order: {product.minimumOrderQuantity}</Typography>
    </Stack>
  )
}
