import { config } from '@/shared/config.ts'
import { toHttpError } from './httpError.ts'
import type { GetOptions, HttpProvider, QueryParams } from './types.ts'

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(path, config.apiBaseUrl)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function get<T>(path: string, { params, signal }: GetOptions = {}): Promise<T> {
  const response = await fetch(buildUrl(path, params), { signal })
  if (!response.ok) throw await toHttpError(response)
  return (await response.json()) as T
}

export const httpProvider: HttpProvider = { get }
