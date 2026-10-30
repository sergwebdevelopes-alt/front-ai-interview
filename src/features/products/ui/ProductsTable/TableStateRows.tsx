import { Button, Skeleton, Stack, TableCell, TableRow, Typography } from '@mui/material'

type SkeletonRowsProps = {
  rows: number
  columns: number
}

export function SkeletonRows({ rows, columns }: SkeletonRowsProps) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <TableRow key={rowIndex}>
      {Array.from({ length: columns }, (_, columnIndex) => (
        <TableCell key={columnIndex}>
          <Typography
            variant="body2"
            component="div"
            sx={{ height: '2lh', display: 'flex', alignItems: 'center' }}
          >
            <Skeleton sx={{ flex: 1 }} />
          </Typography>
        </TableCell>
      ))}
    </TableRow>
  ))
}

type EmptyRowProps = {
  columns: number
  query: string
  onClearSearch: () => void
}

export function EmptyRow({ columns, query, onClearSearch }: EmptyRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={columns} align="center">
        {query ? (
          <Stack spacing={1} sx={{ alignItems: 'center', py: 2 }}>
            <Typography>No results for “{query}”</Typography>
            <Button variant="outlined" size="small" onClick={onClearSearch}>
              Clear search
            </Button>
          </Stack>
        ) : (
          'No products'
        )}
      </TableCell>
    </TableRow>
  )
}
