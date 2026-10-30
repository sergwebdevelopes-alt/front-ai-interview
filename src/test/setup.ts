import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { requestCache } from '@/shared/cache/requestCache.ts'

afterEach(() => {
  cleanup()
  requestCache.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
  window.history.replaceState(null, '', '/')
})
