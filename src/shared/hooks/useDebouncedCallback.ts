import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
) {
  const timerRef = useRef<number | undefined>(undefined)
  const callbackRef = useRef(callback)

  useLayoutEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const cancel = useCallback(() => window.clearTimeout(timerRef.current), [])

  const debounced = useCallback(
    (...args: Args) => {
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => callbackRef.current(...args), delay)
    },
    [delay],
  )

  return { debounced, cancel }
}
