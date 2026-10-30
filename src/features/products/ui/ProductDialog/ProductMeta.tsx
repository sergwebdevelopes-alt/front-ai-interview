import { Box } from '@mui/material'
import type { Product } from '@/features/products/domain/product.ts'
import { formatDate } from '@/features/products/ui/utils.ts'
import { InfoRow, Section } from './Section.tsx'

type ProductMetaProps = {
  meta: Product['meta']
}

export function ProductMeta({ meta }: ProductMetaProps) {
  return (
    <Section title="Meta">
      <InfoRow label="Barcode" value={meta.barcode} />
      <InfoRow label="Created" value={formatDate(meta.createdAt)} />
      <InfoRow label="Updated" value={formatDate(meta.updatedAt)} />
      <Box component="img" src={meta.qrCode} alt="Product QR code" sx={{ width: 96, height: 96 }} />
    </Section>
  )
}
