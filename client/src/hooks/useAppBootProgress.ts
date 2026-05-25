import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface BootFlags {
  artistsDone: boolean
  eventsDone: boolean
}

export function useAppBootProgress({ artistsDone, eventsDone }: BootFlags): number {
  const objRef = useRef({ val: 15 })
  const [smoothed, setSmoothed] = useState(15)
  const paintRef = useRef(false)
  const [paintDone, setPaintDone] = useState(false)

  useEffect(() => {
    if (!artistsDone || !eventsDone || paintRef.current) return
    requestAnimationFrame(() => {
      paintRef.current = true
      setPaintDone(true)
    })
  }, [artistsDone, eventsDone])

  const raw = Math.min(
    15 +
    (artistsDone ? 45 : 0) +
    (eventsDone ? 30 : 0) +
    (paintDone ? 10 : 0),
    100,
  )

  useEffect(() => {
    if (raw <= objRef.current.val) return
    gsap.killTweensOf(objRef.current)
    gsap.to(objRef.current, {
      val: raw,
      duration: raw >= 100 ? 0.32 : 0.8,
      ease: raw >= 100 ? 'power2.out' : 'power2.inOut',
      onUpdate: () => setSmoothed(Math.round(objRef.current.val)),
    })
    return () => { gsap.killTweensOf(objRef.current) }
  }, [raw])

  return smoothed
}
