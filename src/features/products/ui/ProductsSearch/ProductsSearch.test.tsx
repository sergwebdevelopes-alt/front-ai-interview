import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProductsSearch } from './ProductsSearch.tsx'

describe('ProductsSearch', () => {
  it('is a labelled search field showing the value', () => {
    render(<ProductsSearch value="phone" onChange={vi.fn()} />)
    expect(screen.getByRole('searchbox', { name: 'Search products' })).toHaveValue('phone')
  })

  it('reports typed text', async () => {
    const onChange = vi.fn()
    render(<ProductsSearch value="" onChange={onChange} />)

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search products' }), 'a')

    expect(onChange).toHaveBeenCalledWith('a')
  })
})
