import type { ReactNode } from 'react'
import { Divider, Stack, Typography } from '@mui/material'

type SectionProps = {
  title: string
  children: ReactNode
}

export function Section({ title, children }: SectionProps) {
  return (
    <Stack spacing={1}>
      <Divider />
      <Typography variant="subtitle1" component="h3">
        {title}
      </Typography>
      {children}
    </Stack>
  )
}

type InfoRowProps = {
  label: string
  value: ReactNode
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <Stack direction="row" spacing={2}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  )
}
