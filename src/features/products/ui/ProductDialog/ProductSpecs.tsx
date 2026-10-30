import type { Product } from '@/features/products/domain/product.ts'
import { InfoRow, Section } from './Section.tsx'

type ProductSpecsProps = {
  product: Product
}

export function ProductSpecs({ product }: ProductSpecsProps) {
  const { dimensions } = product

  return (
    <>
      <Section title="Specifications">
        <InfoRow label="Category" value={product.category} />
        <InfoRow label="SKU" value={product.sku} />
        <InfoRow label="Weight" value={product.weight} />
        <InfoRow
          label="Dimensions (W × H × D)"
          value={`${dimensions.width} × ${dimensions.height} × ${dimensions.depth}`}
        />
      </Section>
      <Section title="Shipping and returns">
        <InfoRow label="Shipping" value={product.shippingInformation} />
        <InfoRow label="Warranty" value={product.warrantyInformation} />
        <InfoRow label="Return policy" value={product.returnPolicy} />
      </Section>
    </>
  )
}
