import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigationType, Routes } from 'react-router-dom'
import gsap from 'gsap'

interface TransitionContextValue {
  arm: () => void
}

const TransitionContext = createContext<TransitionContextValue>({ arm: () => {} })

export function useTransition(): TransitionContextValue {
  return useContext(TransitionContext)
}

interface Props {
  children: ReactNode
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function TransitionProvider({ children }: Props) {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [displayedLocation, setDisplayedLocation] = useState(location)
  const svgRef = useRef<SVGSVGElement>(null)
  const pathsRef = useRef<SVGPathElement[]>([])
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const isAnimating = useRef(false)
  const armedRef = useRef(false)

  function arm() {
    armedRef.current = true
  }

  // Init path dasharray from their actual total length
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    pathsRef.current = Array.from(svg.querySelectorAll('path'))
    pathsRef.current.forEach((path) => {
      const len = path.getTotalLength()
      path.style.strokeDasharray = String(len)
      path.style.strokeDashoffset = String(len)
    })
  }, [])

  useEffect(() => {
    // Same page — no transition
    if (location.pathname === displayedLocation.pathname) {
      setDisplayedLocation(location)
      return
    }

    // Back/forward navigation — swap instantly, no animation
    if (navigationType === 'POP') {
      armedRef.current = false
      setDisplayedLocation(location)
      window.scrollTo(0, 0)
      return
    }

    // Not armed — this navigation came from a card/link inside a page, not the menu
    if (!armedRef.current) {
      setDisplayedLocation(location)
      window.scrollTo(0, 0)
      return
    }

    // Consume the arm flag
    armedRef.current = false

    if (prefersReducedMotion()) {
      setDisplayedLocation(location)
      window.scrollTo(0, 0)
      return
    }

    if (isAnimating.current) {
      tlRef.current?.kill()
    }
    isAnimating.current = true

    const paths = pathsRef.current

    // Leave: draw the strokes (offset → 0, width → 700)
    const leaveTl = gsap.timeline({
      onComplete: () => {
        setDisplayedLocation(location)
        window.scrollTo(0, 0)

        // Enter: erase the strokes (offset → length, width → 200)
        const enterTl = gsap.timeline({
          onComplete: () => {
            isAnimating.current = false
          },
        })
        paths.forEach((path) => {
          const len = path.getTotalLength()
          enterTl.to(
            path,
            {
              strokeDashoffset: len,
              attr: { 'stroke-width': 200 },
              duration: 1,
              ease: 'power1.in',
            },
            0,
          )
        })
        tlRef.current = enterTl
      },
    })

    paths.forEach((path) => {
      leaveTl.to(
        path,
        {
          strokeDashoffset: 0,
          attr: { 'stroke-width': 700 },
          duration: 1,
          ease: 'power1.out',
        },
        0,
      )
    })

    tlRef.current = leaveTl

    return () => {
      leaveTl.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <TransitionContext.Provider value={{ arm }}>
      {/* SVG overlay — always mounted, paths hidden initially */}
      <div className="transition-svg">
        <svg
          ref={svgRef}
          viewBox="0 0 2453 2535"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%' }}
        >
          <path
            d="M227.549 1818.76C227.549 1818.76 406.016 2207.75 569.049 2130.26C843.431 1999.85 -264.104 1002.3 227.549 876.262C552.918 792.849 773.647 2456.11 1342.05 2130.26C1885.43 1818.76 14.9644 455.772 760.548 137.262C1342.05 -111.152 1663.5 2266.35 2209.55 1972.76C2755.6 1679.18 1536.63 384.467 1826.55 137.262C2013.5 -22.1463 2209.55 381.262 2209.55 381.262"
            stroke="var(--transition-stroke-1)"
            strokeWidth="200"
            strokeLinecap="round"
          />
          <path
            d="M1661.28 2255.51C1661.28 2255.51 2311.09 1960.37 2111.78 1817.01C1944.47 1696.67 718.456 2870.17 499.781 2255.51C308.969 1719.17 2457.51 1613.83 2111.78 963.512C1766.05 313.198 427.949 2195.17 132.281 1455.51C-155.219 736.292 2014.78 891.514 1708.78 252.012C1437.81 -314.29 369.471 909.169 132.281 566.512C18.1772 401.672 244.781 193.012 244.781 193.012"
            stroke="var(--transition-stroke-2)"
            strokeWidth="200"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Render routes with the lagging displayed location */}
      <Routes location={displayedLocation}>
        {children}
      </Routes>
    </TransitionContext.Provider>
  )
}
