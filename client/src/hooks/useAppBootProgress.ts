import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface BootFlags {
  artistsDone: boolean
  eventsDone: boolean
}

function asymptoticCap(raw: number): number {
  if (raw <= 15) return 57
  if (raw <= 60) return 87
  if (raw <= 90) return 97
  return 100
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
    const obj = objRef.current
    if (raw <= obj.val && raw < 100) return

    gsap.killTweensOf(obj)
    const onUpdate = () => setSmoothed(Math.round(obj.val))

    const tl = gsap.timeline()
    tl.to(obj, {
      val: raw,
      duration: raw >= 100 ? 0.32 : 0.6,
      ease: raw >= 100 ? 'power2.out' : 'power2.inOut',
      onUpdate,
    })

    if (raw < 100) {
      const cap = asymptoticCap(raw)
      if (cap > raw) {
        tl.to(obj, { val: cap, duration: 8, ease: 'power1.out', onUpdate })
      }
    }

    return () => { tl.kill() }
  }, [raw])

  return smoothed
}
