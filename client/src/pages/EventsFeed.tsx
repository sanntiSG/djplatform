import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEventsFeed } from '../hooks/useEvents.js'
import { EventCard } from '../components/events/EventCard.js'
import { Button } from '../components/ui/Button.js'

gsap.registerPlugin(ScrollTrigger)

export default function EventsFeed() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useEventsFeed()
  const gridRef = useRef<HTMLDivElement>(null)

  const allEvents = data?.pages.flat() ?? []

  useEffect(() => {
    if (!gridRef.current || allEvents.length === 0) return
    const ctx = gsap.context(() => {
      gsap.from('.event-card-item', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 80%',
        },
      })
    }, gridRef)
    return () => ctx.revert()
  }, [allEvents.length])

  return (
    <div className="min-h-screen bg-[var(--bg)] px-6 pt-24 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <h1
              className="font-display font-semibold text-[var(--text)]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            >
              Eventos
            </h1>
            <p className="font-sans text-sm text-[var(--text-muted)] mt-2">
              Lo que esta pasando en la escena electronica argentina
            </p>
          </div>
          <Link to="/events/new">
            <Button variant="primary" size="md">Publicar evento</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="font-sans text-[var(--text-muted)] text-base">
              Todavia no hay eventos publicados.
            </p>
            <Link to="/events/new">
              <Button variant="outline" size="md">Se el primero en publicar</Button>
            </Link>
          </div>
        ) : (
          <>
            <div
              ref={gridRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {allEvents.map((event) => (
                <div key={event.id} className="event-card-item">
                  <EventCard event={event} />
                </div>
              ))}
            </div>

            {hasNextPage && (
              <div className="flex justify-center mt-12">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => fetchNextPage()}
                  loading={isFetchingNextPage}
                >
                  Cargar mas
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
