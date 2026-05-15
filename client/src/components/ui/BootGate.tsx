import { useState, useEffect, type ReactNode } from 'react'
import SplashScreen from './SplashScreen.js'

const MIN_DURATION = 1800
const SAFETY_TIMEOUT = 4000

export default function BootGate({ children }: { children: ReactNode }) {
  const [booted, setBooted] = useState(false)
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    let resolved = false
    const resolve = () => {
      if (resolved) return
      resolved = true
      setBooted(true)
    }

    const safety = setTimeout(resolve, SAFETY_TIMEOUT)

    Promise.all([
      document.fonts.ready,
      new Promise<void>((r) => setTimeout(r, MIN_DURATION)),
    ]).then(resolve)

    return () => clearTimeout(safety)
  }, [])

  if (!splashDone) {
    return <SplashScreen ready={booted} onExited={() => setSplashDone(true)} />
  }
  return <>{children}</>
}
