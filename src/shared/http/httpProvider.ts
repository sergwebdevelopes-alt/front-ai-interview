import { config } from '@/shared/config.ts'
import { RequestTimeoutError, toHttpError } from './httpError.ts'
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

async function get<T>(
  path: string,
  { params, signal, timeoutMs = config.httpTimeoutMs }: GetOptions = {},
): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

  try {
    const response = await fetch(buildUrl(path, params), { signal: requestSignal })
    if (!response.ok) throw await toHttpError(response)
    return (await response.json()) as T
  } catch (error) {
    if (timeoutSignal.aborted && !signal?.aborted) throw new RequestTimeoutError(timeoutMs)
    throw error
  }
}

export const httpProvider: HttpProvider = { get }
