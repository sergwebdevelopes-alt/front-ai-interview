import { Container, Stack, Typography } from '@mui/material'
import { ProductDialogContainer } from './features/products/containers/ProductDialogContainer.tsx'
import { ProductsSearchContainer } from './features/products/containers/ProductsSearchContainer.tsx'
import { ProductsTableContainer } from './features/products/containers/ProductsTableContainer.tsx'

export default function App() {
  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Products
        </Typography>
        <ProductsSearchContainer />
        <ProductsTableContainer />
      </Stack>
      <ProductDialogContainer />
    </Container>
  )
}
