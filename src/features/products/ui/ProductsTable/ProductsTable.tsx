import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import { ErrorAlert } from '@/shared/ui/ErrorAlert.tsx'
import { focusRing } from '@/shared/ui/focusRing.ts'
import { visuallyHidden } from '@/shared/ui/visuallyHidden.ts'
import type { ProductListItem } from '@/features/products/domain/product.ts'
import type { ProductSort, SortField } from '@/features/products/domain/sort.ts'
import { PRODUCT_COLUMNS, PRODUCT_TABLE_MIN_WIDTH } from './columns.tsx'
import { describeResults } from './resultsAnnouncement.ts'
import { EmptyRow, SkeletonRows } from './TableStateRows.tsx'

type ProductsTableProps = {
  products: ProductListItem[]
  total: number | null
  page: number
  pageSize: number
  sort: ProductSort | null
  query: string
  isLoading: boolean
  error: Error | null
  onPageChange: (page: number) => void
  onSortChange: (field: SortField) => void
  onRetry: () => void
  onRowClick: (productId: number) => void
  onClearSearch: () => void
}

export function ProductsTable({
  products,
  total,
  page,
  pageSize,
  sort,
  query,
  isLoading,
  error,
  onPageChange,
  onSortChange,
  onRetry,
  onRowClick,
  onClearSearch,
}: ProductsTableProps) {
  if (error) {
    return <ErrorAlert message={`Couldn't load products: ${error.message}`} onRetry={onRetry} />
  }

  return (
    <Paper>
      <Box role="status" sx={visuallyHidden}>
        {isLoading || total === null ? '' : describeResults({ total, page, pageSize, query })}
      </Box>
      <TableContainer>
        <Table
          aria-label="Products"
          aria-busy={isLoading}
          sx={{ tableLayout: 'fixed', minWidth: PRODUCT_TABLE_MIN_WIDTH }}
        >
          <TableHead>
            <TableRow>
              {PRODUCT_COLUMNS.map(({ field, label, align, width }) => {
                const isActive = sort?.sortBy === field
                return (
                  <TableCell
                    key={field}
                    align={align}
                    sortDirection={isActive ? sort.order : false}
                    sx={{ width }}
                  >
                    <TableSortLabel
                      active={isActive}
                      direction={isActive ? sort.order : 'asc'}
                      onClick={() => onSortChange(field)}
                      sx={{
                        borderRadius: 1,
                        '&.Mui-focusVisible': focusRing(2),
                      }}
                    >
                      {label}
                    </TableSortLabel>
                  </TableCell>
                )
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <SkeletonRows rows={pageSize} columns={PRODUCT_COLUMNS.length} />
            ) : (
              products.map((product) => (
                <TableRow
                  key={product.id}
                  hover
                  tabIndex={0}
                  onClick={() => onRowClick(product.id)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    onRowClick(product.id)
                  }}
                  sx={{
                    cursor: 'pointer',
                    '&:focus-visible': { ...focusRing(-2), bgcolor: 'action.hover' },
                  }}
                >
                  {PRODUCT_COLUMNS.map((column) => (
                    <TableCell key={column.field} align={column.align}>
                      {column.render(product)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
            {!isLoading && products.length === 0 && (
              <EmptyRow columns={PRODUCT_COLUMNS.length} query={query} onClearSearch={onClearSearch} />
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {total !== null && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[]}
          onPageChange={(_, nextPage) => onPageChange(nextPage)}
        />
      )}
    </Paper>
  )
}
