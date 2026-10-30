import { Box, Stack } from '@mui/material'

type ProductGalleryProps = {
  title: string
  images: string[]
}

export function ProductGallery({ title, images }: ProductGalleryProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto' }}>
      {images.map((src, index) => (
        <Box
          key={src}
          component="img"
          src={src}
          alt={`${title}, image ${index + 1}`}
          loading="lazy"
          sx={{ height: 160, flexShrink: 0, objectFit: 'contain', bgcolor: 'grey.100', borderRadius: 1 }}
        />
      ))}
    </Stack>
  )
}
