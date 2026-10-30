import { Box, Rating, Stack, Typography } from '@mui/material'
import type { Review } from '@/features/products/domain/product.ts'
import { formatDate } from '@/features/products/ui/utils.ts'
import { Section } from './Section.tsx'

type ProductReviewsProps = {
  reviews: Review[]
}

export function ProductReviews({ reviews }: ProductReviewsProps) {
  return (
    <Section title={`Reviews (${reviews.length})`}>
      {reviews.map((review) => (
        <Box key={`${review.reviewerEmail}-${review.date}`}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Rating value={review.rating} readOnly size="small" />
            <Typography variant="subtitle2">{review.reviewerName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {review.reviewerEmail} · {formatDate(review.date)}
            </Typography>
          </Stack>
          <Typography variant="body2">{review.comment}</Typography>
        </Box>
      ))}
    </Section>
  )
}
