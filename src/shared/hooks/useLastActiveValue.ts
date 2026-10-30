import { useState } from 'react'

export function useLastActiveValue<T>(value: T, isActive: boolean): T {
  const [lastActiveValue, setLastActiveValue] = useState(value)
  if (isActive && !Object.is(lastActiveValue, value)) setLastActiveValue(value)
  return isActive ? value : lastActiveValue
}
