import { Chip, Stack, Typography } from '@mui/material'
import { Section } from './Section.tsx'

type ProductDescriptionProps = {
  description: string
  tags: string[]
}

export function ProductDescription({ description, tags }: ProductDescriptionProps) {
  return (
    <Section title="Description">
      <Typography variant="body2">{description}</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        {tags.map((tag) => (
          <Chip key={tag} label={tag} size="small" variant="outlined" />
        ))}
      </Stack>
    </Section>
  )
}
