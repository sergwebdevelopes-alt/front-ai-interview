import { useCallback, useSyncExternalStore } from 'react'

const URL_CHANGE_EVENT = 'urlchange'

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  window.addEventListener(URL_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(URL_CHANGE_EVENT, onChange)
  }
}

type UpdateOptions = {
  replace?: boolean
}

export function updateQueryParams(
  updates: Record<string, string | null>,
  { replace = false }: UpdateOptions = {},
): void {
  const url = new URL(window.location.href)
  for (const [name, value] of Object.entries(updates)) {
    if (value === null) url.searchParams.delete(name)
    else url.searchParams.set(name, value)
  }
  if (replace) window.history.replaceState(null, '', url)
  else window.history.pushState(null, '', url)
  window.dispatchEvent(new Event(URL_CHANGE_EVENT))
}

export function useQueryParam(name: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(subscribe, () =>
    new URLSearchParams(window.location.search).get(name),
  )

  const setValue = useCallback(
    (next: string | null) => updateQueryParams({ [name]: next }),
    [name],
  )

  return [value, setValue]
}
