import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { requestCache } from '@/shared/cache/requestCache.ts'
import { toError } from '@/shared/errors/toError.ts'

export type RequestDescriptor<T> = {
  key: string
  run: (signal: AbortSignal) => Promise<T>
}

type RequestResult<T> = {
  key: string
  data: T | null
  error: Error | null
}

export function useRequest<T>(request: RequestDescriptor<T> | null) {
  const [reloadCount, setReloadCount] = useState(0)
  const cacheKey = request?.key ?? null
  const requestKey = cacheKey === null ? null : `${cacheKey}#${reloadCount}`
  const [result, setResult] = useState<RequestResult<T> | null>(null)
  const runRef = useRef(request?.run)

  useLayoutEffect(() => {
    runRef.current = request?.run
  })

  useEffect(() => {
    const run = runRef.current
    if (requestKey === null || cacheKey === null || !run) return
    if (requestCache.isFresh(cacheKey)) return
    const controller = new AbortController()

    run(controller.signal)
      .then((data) => {
        requestCache.set(cacheKey, data)
        setResult({ key: requestKey, data, error: null })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setResult({ key: requestKey, data: null, error: toError(err) })
      })

    return () => controller.abort()
  }, [requestKey, cacheKey])

  const current = requestKey !== null && result?.key === requestKey ? result : null
  const cachedData = cacheKey === null ? null : requestCache.peek<T>(cacheKey)
  const data = current?.data ?? cachedData

  const retry = useCallback(() => {
    if (cacheKey !== null) requestCache.invalidate(cacheKey)
    setReloadCount((count) => count + 1)
  }, [cacheKey])

  return {
    data,
    error: data === null ? (current?.error ?? null) : null,
    isLoading: requestKey !== null && data === null && current === null,
    retry,
  }
}
