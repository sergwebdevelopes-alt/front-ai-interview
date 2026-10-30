import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { productsRepository } from '@/features/products/infrastructure/index.ts'
import { formatPrice } from '@/features/products/ui/utils.ts'
import { makeCatalog } from '@/test/inMemoryProductsRepository.ts'
import App from './App.tsx'

vi.mock('@/features/products/infrastructure/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/products/infrastructure/index.ts')>()
  const { createInMemoryProductsRepository, makeCatalog } = await import('@/test/inMemoryProductsRepository.ts')
  return { ...actual, productsRepository: createInMemoryProductsRepository(makeCatalog(45)) }
})

const repository = vi.mocked(productsRepository)

const prices = makeCatalog(45).map((item) => item.price)
const lowestPrice = formatPrice(Math.min(...prices))
const highestPrice = formatPrice(Math.max(...prices))

function urlParams() {
  return new URLSearchParams(window.location.search)
}

function bodyRows() {
  const [, body] = within(screen.getByRole('table', { name: 'Products' })).getAllByRole('rowgroup')
  return within(body).getAllByRole('row')
}

async function waitForResults(text: string) {
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(text))
}

beforeEach(() => {
  repository.getCatalog.mockClear()
  repository.search.mockClear()
  repository.getById.mockClear()
})

describe('App', () => {
  it('shows the first page of the catalog', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument()
    await waitForResults('45 products, page 1 of 3')

    expect(bodyRows()).toHaveLength(20)
    expect(within(bodyRows()[0]).getByText('Product 01')).toBeInTheDocument()
  })

  it('pages through the catalog and back', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitForResults('page 1 of 3')

    await user.click(screen.getByRole('button', { name: 'Go to next page' }))

    await waitForResults('45 products, page 2 of 3')
    expect(urlParams().get('skip')).toBe('20')
    expect(within(bodyRows()[0]).getByText('Product 21')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Go to previous page' }))

    await waitForResults('page 1 of 3')
    expect(urlParams().has('skip')).toBe(false)
  })

  it('sorts by price ascending, then descending, and resets the page', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/?skip=20')
    render(<App />)
    await waitForResults('page 2 of 3')

    await user.click(screen.getByRole('button', { name: 'Price' }))

    await waitForResults('page 1 of 3')
    expect(urlParams().get('sortBy')).toBe('price')
    expect(urlParams().get('order')).toBe('asc')
    expect(within(bodyRows()[0]).getByText(lowestPrice)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Price' }))

    await waitFor(() => expect(within(bodyRows()[0]).getByText(highestPrice)).toBeInTheDocument())
    expect(screen.getByRole('columnheader', { name: /Price/ })).toHaveAttribute('aria-sort', 'descending')
  })

  it('searches after typing and clears an empty search', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitForResults('45 products')

    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'watch')

    await waitForResults('11 results for “watch”, page 1 of 1')
    expect(urlParams().get('q')).toBe('watch')
    expect(repository.search).toHaveBeenCalledTimes(1)
    expect(bodyRows()).toHaveLength(11)

    await user.clear(screen.getByRole('searchbox', { name: 'Search products' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'zzzz')
    await waitForResults('No results for “zzzz”')

    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    await waitForResults('45 products, page 1 of 3')
    expect(screen.getByRole('searchbox', { name: 'Search products' })).toHaveValue('')
    expect(urlParams().has('q')).toBe(false)
  })

  it('opens a product with its full data and closes it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitForResults('45 products')

    await user.click(screen.getByText('Product 03'))

    const dialog = await screen.findByRole('dialog', { name: /Product 03/ })
    expect(urlParams().get('productId')).toBe('3')
    expect(within(dialog).getByText('Full details of Product 03')).toBeInTheDocument()
    expect(repository.getById).toHaveBeenCalledWith(3, expect.any(AbortSignal))

    await user.click(within(dialog).getAllByRole('button', { name: 'Close' })[0])

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(urlParams().has('productId')).toBe(false)
    expect(bodyRows()).toHaveLength(20)
  })

  it('restores the whole state from the URL', async () => {
    window.history.replaceState(null, '', '/?q=watch&sortBy=price&order=desc&productId=4')
    render(<App />)

    expect(await screen.findByRole('dialog', { name: /Product 04/ })).toBeInTheDocument()

    const behindDialog = { hidden: true }
    expect(screen.getByRole('searchbox', { name: 'Search products', ...behindDialog })).toHaveValue('watch')
    await waitFor(() =>
      expect(screen.getByRole('status', behindDialog)).toHaveTextContent('11 results for “watch”'),
    )
    expect(repository.search).toHaveBeenCalledWith(
      { q: 'watch', skip: 0, limit: 20, sort: { sortBy: 'price', order: 'desc' } },
      expect.any(AbortSignal),
    )
  })

  it('shows not found for an unknown product', async () => {
    window.history.replaceState(null, '', '/?productId=999')
    render(<App />)

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Product not found')).toBeInTheDocument()
  })

  it('recovers from a failed catalog request with Retry', async () => {
    const user = userEvent.setup()
    repository.getCatalog.mockRejectedValueOnce(new Error('Service Unavailable'))
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load products: Service Unavailable")
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    await waitForResults('45 products, page 1 of 3')
  })
})
