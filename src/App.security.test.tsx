import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { productsRepository } from '@/features/products/infrastructure/index.ts'
import App from './App.tsx'

const SCRIPT = '<script>window.__xss = true</script>'
const IMG = '<img src="x" onerror="window.__xss = true">'

vi.mock('@/features/products/infrastructure/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/products/infrastructure/index.ts')>()
  const { createInMemoryProductsRepository, makeCatalog } = await import('@/test/inMemoryProductsRepository.ts')
  const { makeListItem } = await import('@/test/productFixtures.ts')
  const hostile = makeListItem({
    id: 1,
    title: '<img src="x" onerror="window.__xss = true">',
    brand: '<b>Brand</b>',
    description: '<script>window.__xss = true</script>',
    category: '"><svg onload="window.__xss = true">',
  })
  return {
    ...actual,
    productsRepository: createInMemoryProductsRepository([hostile, ...makeCatalog(45).slice(1)]),
  }
})

const repository = vi.mocked(productsRepository)

type XssWindow = Window & { __xss?: boolean }

function setUrl(url: string) {
  window.history.replaceState(null, '', url)
}

function expectNoInjectedMarkup(container: ParentNode = document) {
  expect(container.querySelector('script')).toBeNull()
  expect(container.querySelector('img[src="x"]')).toBeNull()
  expect(container.querySelector('[onerror], [onload]')).toBeNull()
  expect(container.querySelector('b, svg[onload]')).toBeNull()
  expect((window as XssWindow).__xss).toBeUndefined()
}

beforeEach(() => {
  repository.getCatalog.mockClear()
  repository.search.mockClear()
  repository.getById.mockClear()
})

afterEach(() => {
  delete (window as XssWindow).__xss
})

describe('App with hostile input in the URL', () => {
  it('shows a script in ?q with no results only as text', async () => {
    const payload = '<script>window.__xss = true</script>nothing-matches'
    setUrl(`/?q=${encodeURIComponent(payload)}`)
    render(<App />)

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(`No results for “${payload}”`))
    expect(within(screen.getByRole('table')).getByText(`No results for “${payload}”`)).toBeInTheDocument()
    expectNoInjectedMarkup()
  })

  it('shows a script in ?q only as text', async () => {
    setUrl(`/?q=${encodeURIComponent(SCRIPT)}`)
    render(<App />)

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(`1 result for “${SCRIPT}”, page 1 of 1`),
    )
    expect(screen.getByRole('searchbox', { name: 'Search products' })).toHaveValue(SCRIPT)
    expect(within(screen.getByRole('table')).getByText(SCRIPT)).toBeInTheDocument()
    expect(repository.search).toHaveBeenCalledWith(expect.objectContaining({ q: SCRIPT }), expect.any(AbortSignal))
    expectNoInjectedMarkup()
  })

  it('shows a script typed into the search box only as text', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('45 products'))

    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), IMG)

    await waitFor(() => expect(new URLSearchParams(window.location.search).get('q')).toBe(IMG))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(`1 result for “${IMG}”`))
    expect(within(screen.getByRole('table')).getByText(IMG)).toBeInTheDocument()
    expectNoInjectedMarkup()
  })

  it('treats a script in ?productId as not found without a request', async () => {
    setUrl(`/?productId=${encodeURIComponent(SCRIPT)}`)
    render(<App />)

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Product not found')).toBeInTheDocument()
    expect(repository.getById).not.toHaveBeenCalled()
    expectNoInjectedMarkup()
  })

  it('ignores a script in ?sortBy', async () => {
    setUrl(`/?sortBy=${encodeURIComponent(SCRIPT)}&order=asc`)
    render(<App />)

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('45 products'))
    expect(repository.getCatalog).toHaveBeenCalledWith(expect.objectContaining({ sort: null }), expect.any(AbortSignal))
    expect(screen.getByRole('columnheader', { name: 'Price' })).not.toHaveAttribute('aria-sort')
  })
})

describe('App with hostile data from the API', () => {
  it('renders markup in list data as text', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('45 products'))

    const table = screen.getByRole('table', { name: 'Products' })
    expect(within(table).getByText(IMG)).toHaveAttribute('title', IMG)
    expect(within(table).getByText('<b>Brand</b>')).toBeInTheDocument()
    expect(within(table).getByText(SCRIPT)).toBeInTheDocument()
    expect(within(table).getByText('"><svg onload="window.__xss = true">')).toBeInTheDocument()
    expectNoInjectedMarkup(table)
  })

  it('renders markup in product details as text', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('45 products'))

    await user.click(within(screen.getByRole('table')).getByText(IMG))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(IMG)).toBeInTheDocument()
    expect(within(dialog).getByText(`Full details of ${IMG}`)).toBeInTheDocument()
    expectNoInjectedMarkup(dialog)
    expectNoInjectedMarkup()
  })

  it('renders markup in an API error message as text', async () => {
    repository.getCatalog.mockRejectedValueOnce(new Error(`<b>Call +1 555</b>${SCRIPT}`))
    render(<App />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(`Couldn't load products: <b>Call +1 555</b>${SCRIPT}`)
    expectNoInjectedMarkup(alert)
  })
})
