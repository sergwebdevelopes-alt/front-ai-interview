import type { ComponentProps } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeListItem } from '@/test/productFixtures.ts'
import { ProductsTable } from './ProductsTable.tsx'

type Props = ComponentProps<typeof ProductsTable>

function renderTable(overrides: Partial<Props> = {}) {
  const props: Props = {
    products: [
      makeListItem({ id: 1, brand: 'Apple', title: 'iPhone 9', price: 549 }),
      makeListItem({ id: 2, brand: undefined, title: 'Green Earring', category: 'womens-jewellery', price: 19.5 }),
    ],
    total: 194,
    page: 0,
    pageSize: 20,
    sort: null,
    query: '',
    isLoading: false,
    error: null,
    onPageChange: vi.fn(),
    onSortChange: vi.fn(),
    onRetry: vi.fn(),
    onRowClick: vi.fn(),
    onClearSearch: vi.fn(),
    ...overrides,
  }
  render(<ProductsTable {...props} />)
  return props
}

function bodyRows() {
  const [, body] = screen.getAllByRole('rowgroup')
  return within(body).getAllByRole('row')
}

describe('ProductsTable data', () => {
  it('renders the column headers', () => {
    renderTable()
    for (const name of ['Brand', 'Model', 'Description', 'Category', 'Price']) {
      expect(screen.getByRole('columnheader', { name })).toBeInTheDocument()
    }
  })

  it('renders one row per product with formatted values', () => {
    renderTable()
    const [first, second] = bodyRows()

    expect(within(first).getByText('Apple')).toBeInTheDocument()
    expect(within(first).getByText('iPhone 9')).toBeInTheDocument()
    expect(within(first).getByText('$549.00')).toBeInTheDocument()
    expect(within(second).getByText('—')).toBeInTheDocument()
    expect(within(second).getByText('$19.50')).toBeInTheDocument()
  })

  it('puts the full text of short cells into the title', () => {
    renderTable({ products: [makeListItem({ title: 'A very long product title' })] })
    expect(screen.getByText('A very long product title')).toHaveAttribute('title', 'A very long product title')
  })
})

describe('ProductsTable states', () => {
  it('shows one skeleton row per page item while loading', () => {
    renderTable({ isLoading: true, products: [] })
    expect(bodyRows()).toHaveLength(20)
    expect(screen.queryByText('No products')).not.toBeInTheDocument()
  })

  it('shows "No products" for an empty catalog', () => {
    renderTable({ products: [], total: 0 })
    expect(screen.getByText('No products')).toBeInTheDocument()
  })

  it('shows "No results" with Clear search for an empty search', async () => {
    const props = renderTable({ products: [], total: 0, query: 'zzzz' })

    expect(screen.getByText('No results for “zzzz”')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(props.onClearSearch).toHaveBeenCalledOnce()
  })

  it('shows the error with Retry instead of the table', async () => {
    const props = renderTable({ error: new Error('Service Unavailable') })

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load products: Service Unavailable")
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(props.onRetry).toHaveBeenCalledOnce()
  })
})

describe('ProductsTable sorting', () => {
  it('calls onSortChange with the column field', async () => {
    const props = renderTable()

    await userEvent.click(screen.getByRole('button', { name: 'Model' }))

    expect(props.onSortChange).toHaveBeenCalledWith('title')
  })

  it('marks the sorted column with aria-sort', () => {
    renderTable({ sort: { sortBy: 'price', order: 'desc' } })

    expect(screen.getByRole('columnheader', { name: /Price/ })).toHaveAttribute('aria-sort', 'descending')
    expect(screen.getByRole('columnheader', { name: 'Brand' })).not.toHaveAttribute('aria-sort')
  })
})

describe('ProductsTable rows', () => {
  it('opens a product on click', async () => {
    const props = renderTable()
    await userEvent.click(screen.getByText('iPhone 9'))
    expect(props.onRowClick).toHaveBeenCalledWith(1)
  })

  it.each(['{Enter}', ' '])('opens a focused row with %s', async (key) => {
    const props = renderTable()
    const user = userEvent.setup()

    bodyRows()[1]?.focus()
    await user.keyboard(key)

    expect(props.onRowClick).toHaveBeenCalledWith(2)
  })

  it('makes rows reachable with Tab', () => {
    renderTable()
    expect(bodyRows()[0]).toHaveAttribute('tabindex', '0')
  })
})

describe('ProductsTable pagination', () => {
  it('shows the range and total', () => {
    renderTable({ page: 1 })
    expect(screen.getByText('21–40 of 194')).toBeInTheDocument()
  })

  it('calls onPageChange with the next page', async () => {
    const props = renderTable({ page: 1 })
    await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(props.onPageChange).toHaveBeenCalledWith(2)
  })

  it('is hidden while the total is unknown', () => {
    renderTable({ total: null, isLoading: true, products: [] })
    expect(screen.queryByRole('button', { name: 'Go to next page' })).not.toBeInTheDocument()
  })
})
