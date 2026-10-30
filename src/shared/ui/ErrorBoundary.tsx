import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { toError } from '@/shared/errors/toError.ts'
import { ErrorAlert } from './ErrorAlert.tsx'

type ErrorBoundaryProps = {
  message: string
  resetKey?: string
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
  resetKey?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { error: toError(error) }
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    if (props.resetKey === state.resetKey) return null
    return { error: null, resetKey: props.resetKey }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(error, info.componentStack)
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (error) {
      return <ErrorAlert message={`${this.props.message}: ${error.message}`} onRetry={this.reset} />
    }
    return this.props.children
  }
}
