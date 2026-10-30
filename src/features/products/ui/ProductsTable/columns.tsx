import type { ReactNode } from 'react'
import { Typography } from '@mui/material'
import type { ProductListItem } from '@/features/products/domain/product.ts'
import type { SortField } from '@/features/products/domain/sort.ts'
import { formatPrice } from '@/features/products/ui/utils.ts'
import { SingleLineText } from './SingleLineText.tsx'

export type ProductColumn = {
  field: SortField
  label: string
  width?: number
  align?: 'left' | 'right'
  render: (product: ProductListItem) => ReactNode
}

const DESCRIPTION_MIN_WIDTH = 320

export const PRODUCT_COLUMNS: ProductColumn[] = [
  {
    field: 'brand',
    label: 'Brand',
    width: 160,
    render: (product) => <SingleLineText text={product.brand ?? '—'} />,
  },
  {
    field: 'title',
    label: 'Model',
    width: 220,
    render: (product) => <SingleLineText text={product.title} />,
  },
  {
    field: 'description',
    label: 'Description',
    render: (product) => (
      <Typography
        variant="body2"
        title={product.description}
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2lh',
        }}
      >
        {product.description}
      </Typography>
    ),
  },
  {
    field: 'category',
    label: 'Category',
    width: 140,
    render: (product) => <SingleLineText text={product.category} />,
  },
  {
    field: 'price',
    label: 'Price',
    width: 110,
    align: 'right',
    render: (product) => <SingleLineText text={formatPrice(product.price)} />,
  },
]

export const PRODUCT_TABLE_MIN_WIDTH = PRODUCT_COLUMNS.reduce(
  (sum, column) => sum + (column.width ?? DESCRIPTION_MIN_WIDTH),
  0,
)
