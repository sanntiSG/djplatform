import { useEffect, useState } from 'react'

export type PointerKind = 'coarse' | 'fine'

export function usePointerKind(): PointerKind {
  const [kind, setKind] = useState<PointerKind>(() =>
    window.matchMedia('(pointer: coarse)').matches ? 'coarse' : 'fine',
  )

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const handler = (e: MediaQueryListEvent) => setKind(e.matches ? 'coarse' : 'fine')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return kind
}
