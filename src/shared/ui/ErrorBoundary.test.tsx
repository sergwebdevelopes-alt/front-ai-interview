import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary.tsx'

let shouldThrow = true

function Bomb() {
  if (shouldThrow) throw new Error('kaboom')
  return <p>All good</p>
}

beforeEach(() => {
  shouldThrow = true
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    shouldThrow = false
    render(
      <ErrorBoundary message="Couldn't display">
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('shows the message and the error text in an alert', () => {
    render(
      <ErrorBoundary message="Couldn't display products">
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't display products: kaboom")
  })

  it('renders the children again on Retry', async () => {
    render(
      <ErrorBoundary message="Couldn't display">
        <Bomb />
      </ErrorBoundary>,
    )

    shouldThrow = false
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('resets when resetKey changes', () => {
    const { rerender } = render(
      <ErrorBoundary message="Couldn't display" resetKey="page-1">
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()

    shouldThrow = false
    rerender(
      <ErrorBoundary message="Couldn't display" resetKey="page-2">
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('stays in the error state while resetKey is the same', () => {
    const { rerender } = render(
      <ErrorBoundary message="Couldn't display" resetKey="page-1">
        <Bomb />
      </ErrorBoundary>,
    )

    shouldThrow = false
    rerender(
      <ErrorBoundary message="Couldn't display" resetKey="page-1">
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
