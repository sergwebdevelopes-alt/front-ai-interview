import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LazyProductDialog } from './LazyProductDialog.tsx'

describe('LazyProductDialog first open', () => {
  it('shows a spinner while the dialog code loads, then the dialog', async () => {
    render(
      <LazyProductDialog
        open
        product={null}
        isLoading
        error={null}
        isNotFound={false}
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    expect(await screen.findByRole('dialog', { name: 'Product' })).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
