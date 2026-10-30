export type QueryParams = Record<string, string | number | undefined>

export type GetOptions = {
  params?: QueryParams
  signal?: AbortSignal
  timeoutMs?: number
}

export interface HttpProvider {
  get<T>(path: string, options?: GetOptions): Promise<T>
}
