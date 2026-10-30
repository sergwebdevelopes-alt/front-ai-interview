import type { ComponentProps } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeProduct } from '@/test/productFixtures.ts'
import { LazyProductDialog } from './LazyProductDialog.tsx'
import { ProductDialog } from './ProductDialog.tsx'

type Props = ComponentProps<typeof ProductDialog>

function dialogProps(overrides: Partial<Props> = {}): Props {
  return {
    open: true,
    product: null,
    isLoading: false,
    error: null,
    isNotFound: false,
    onClose: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  }
}

describe('ProductDialog states', () => {
  it('shows a generic title while loading', () => {
    render(<ProductDialog {...dialogProps({ isLoading: true })} />)
    expect(screen.getByRole('dialog', { name: 'Product' })).toBeInTheDocument()
  })

  it('shows "Product not found"', () => {
    render(<ProductDialog {...dialogProps({ isNotFound: true })} />)
    expect(screen.getByText('Product not found')).toBeInTheDocument()
  })

  it('shows the error with Retry', async () => {
    const props = dialogProps({ error: new Error('Service Unavailable') })
    render(<ProductDialog {...props} />)

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the product: Service Unavailable")
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(props.onRetry).toHaveBeenCalledOnce()
  })
})

describe('ProductDialog content', () => {
  it('renders all sections of the product', () => {
    render(<ProductDialog {...dialogProps({ product: makeProduct() })} />)

    expect(screen.getByRole('dialog', { name: /Rolex Submariner/ })).toBeInTheDocument()
    expect(screen.getByText('Low Stock')).toBeInTheDocument()
    expect(screen.getByText('$9,999.99')).toBeInTheDocument()
    expect(screen.getByText('−7.5%')).toBeInTheDocument()
    expect(screen.getByText('3 in stock')).toBeInTheDocument()
    expect(screen.getByText('A classic diving watch')).toBeInTheDocument()
    expect(screen.getByText('luxury')).toBeInTheDocument()
    expect(screen.getByText('RLX-SUB-001')).toBeInTheDocument()
    expect(screen.getByText('4.1 × 1.3 × 4.1')).toBeInTheDocument()
    expect(screen.getByText('Ships in 1 week')).toBeInTheDocument()
    expect(screen.getByText('30 days return policy')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Reviews (1)' })).toBeInTheDocument()
    expect(screen.getByText('Perfect!')).toBeInTheDocument()
    expect(screen.getByText('1234567890123')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: /Rolex Submariner, image/ })).toHaveLength(2)
    expect(screen.getByRole('img', { name: 'Product QR code' })).toBeInTheDocument()
  })

  it('leaves out the brand when the product has none', () => {
    render(<ProductDialog {...dialogProps({ product: makeProduct({ brand: undefined }) })} />)
    expect(screen.queryByText('· Rolex')).not.toBeInTheDocument()
  })
})

describe('ProductDialog closing', () => {
  it('closes with the ✕ and the Close buttons', async () => {
    const props = dialogProps({ product: makeProduct() })
    render(<ProductDialog {...props} />)

    for (const button of screen.getAllByRole('button', { name: 'Close' })) {
      await userEvent.click(button)
    }

    expect(props.onClose).toHaveBeenCalledTimes(2)
  })

  it('closes with Escape', async () => {
    const props = dialogProps({ product: makeProduct() })
    render(<ProductDialog {...props} />)

    await userEvent.keyboard('{Escape}')

    expect(props.onClose).toHaveBeenCalled()
  })

  it('keeps the last content while closing', () => {
    const product = makeProduct()
    const { rerender } = render(<ProductDialog {...dialogProps({ product })} />)

    rerender(<ProductDialog {...dialogProps({ open: false, product: null })} />)

    expect(screen.getByText('A classic diving watch')).toBeInTheDocument()
  })
})

describe('LazyProductDialog', () => {
  it('renders nothing before the first open, then loads the dialog', async () => {
    const { rerender } = render(<LazyProductDialog {...dialogProps({ open: false })} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    rerender(<LazyProductDialog {...dialogProps({ product: makeProduct() })} />)

    expect(await screen.findByRole('dialog', { name: /Rolex Submariner/ })).toBeInTheDocument()
  })

  it('stays mounted after closing', async () => {
    const { rerender } = render(<LazyProductDialog {...dialogProps({ product: makeProduct() })} />)
    await screen.findByRole('dialog')

    rerender(<LazyProductDialog {...dialogProps({ open: false })} />)

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    rerender(<LazyProductDialog {...dialogProps({ isLoading: true })} />)
    expect(screen.getByRole('dialog', { name: 'Product' })).toBeInTheDocument()
  })
})
