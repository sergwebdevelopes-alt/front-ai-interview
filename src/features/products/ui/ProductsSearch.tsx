import { TextField } from '@mui/material'

type ProductsSearchProps = {
  value: string
  onChange: (value: string) => void
}

export function ProductsSearch({ value, onChange }: ProductsSearchProps) {
  return (
    <TextField
      type="search"
      label="Search products"
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={{ maxWidth: 360 }}
      fullWidth
    />
  )
}
