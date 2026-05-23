import { useEffect, useState } from 'react'

/**
 * Returns true only after isPending has been true for at least delayMs without resolving.
 * Cleans up immediately if isPending resolves before the delay elapses.
 */
export function useDelayedPending(isPending: boolean, delayMs: number): boolean {
  const [delayed, setDelayed] = useState(false)

  useEffect(() => {
    if (!isPending) {
      setDelayed(false)
      return
    }
    const id = setTimeout(() => setDelayed(true), delayMs)
    return () => clearTimeout(id)
  }, [isPending, delayMs])

  return delayed
}
