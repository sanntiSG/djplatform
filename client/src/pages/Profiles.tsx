import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { useProfiles, type ProfileFilters } from '../hooks/useProfile.js'
import { useCatalogs } from '../hooks/useCatalogs.js'
import { ProfileCard } from '../components/profile/ProfileCard.js'
import { Button } from '../components/ui/Button.js'
import { Input } from '../components/ui/Input.js'
import { cn } from '../utils/cn.js'

const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'dj', label: 'DJs' },
  { value: 'producer', label: 'Productores' },
  { value: 'other', label: 'Artistas' },
]

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'available', label: 'Disponible' },
  { value: 'contact', label: 'Consultar' },
]

function FilterChips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all duration-150',
            value === opt.value
              ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]'
              : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-white/30 hover:text-[var(--text)]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function MultiFilterChips({
  options,
  value,
  onChange,
  max = 3,
}: {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  max?: number
}) {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? options : options.slice(0, 8)

  function toggle(v: string) {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v))
    } else {
      if (value.length >= max) return
      onChange([...value, v])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {displayed.map((opt) => {
        const active = value.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all duration-150',
              active
                ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]'
                : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-white/30 hover:text-[var(--text)]',
            )}
          >
            {opt}
          </button>
        )
      })}
      {options.length > 8 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="px-3 py-1.5 rounded-full text-xs font-sans border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150"
        >
          {showAll ? 'Ver menos' : `+${options.length - 8} mas`}
        </button>
      )}
    </div>
  )
}

export default function Profiles() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [type, setType] = useState(searchParams.get('type') ?? '')
  const [location, setLocation] = useState(searchParams.get('location') ?? '')
  const [availability, setAvailability] = useState(searchParams.get('availability') ?? '')
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    searchParams.get('genres') ? (searchParams.get('genres') as string).split(',') : [],
  )
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(
    searchParams.get('eventTypes') ? (searchParams.get('eventTypes') as string).split(',') : [],
  )

  const [activeFilters, setActiveFilters] = useState<ProfileFilters>({
    q: searchParams.get('q') ?? undefined,
    type: searchParams.get('type') ?? undefined,
    location: searchParams.get('location') ?? undefined,
    availability: searchParams.get('availability') ?? undefined,
    genres: searchParams.get('genres') ? (searchParams.get('genres') as string).split(',') : undefined,
    eventTypes: searchParams.get('eventTypes') ? (searchParams.get('eventTypes') as string).split(',') : undefined,
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useProfiles(activeFilters)

  const { genres: genresCatalog, eventTypes: eventTypesCatalog } = useCatalogs()
  const genreNames = genresCatalog.data?.map((g) => g.name) ?? []
  const eventTypeNames = eventTypesCatalog.data?.map((e) => e.name) ?? []

  const profiles = data?.pages.flat() ?? []

  const animateGrid = useCallback(() => {
    if (!gridRef.current) return
    const cards = gridRef.current.querySelectorAll('.profile-card-item')
    if (cards.length === 0) return
    gsap.fromTo(
      cards,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'expo.out', clearProps: 'all' },
    )
  }, [])

  useEffect(() => {
    if (!isLoading && profiles.length > 0) animateGrid()
  }, [isLoading, profiles.length, animateGrid])

  function applyFilters() {
    const filters: ProfileFilters = {}
    if (q.trim()) filters.q = q.trim()
    if (type) filters.type = type
    if (location.trim()) filters.location = location.trim()
    if (availability) filters.availability = availability
    if (selectedGenres.length) filters.genres = selectedGenres
    if (selectedEventTypes.length) filters.eventTypes = selectedEventTypes
    setActiveFilters(filters)

    const qs = new URLSearchParams()
    if (filters.q) qs.set('q', filters.q)
    if (filters.type) qs.set('type', filters.type)
    if (filters.location) qs.set('location', filters.location)
    if (filters.availability) qs.set('availability', filters.availability)
    if (filters.genres?.length) qs.set('genres', filters.genres.join(','))
    if (filters.eventTypes?.length) qs.set('eventTypes', filters.eventTypes.join(','))
    setSearchParams(qs)
  }

  function clearFilters() {
    setQ('')
    setType('')
    setLocation('')
    setAvailability('')
    setSelectedGenres([])
    setSelectedEventTypes([])
    setActiveFilters({})
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters =
    !!activeFilters.q ||
    !!activeFilters.type ||
    !!activeFilters.location ||
    !!activeFilters.availability ||
    (activeFilters.genres?.length ?? 0) > 0 ||
    (activeFilters.eventTypes?.length ?? 0) > 0

  return (
    <div className="min-h-screen bg-[var(--bg)] px-6 pb-24 pt-20 md:pt-28">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1
            className="font-display font-semibold text-[var(--text)]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Encontra tu artista
          </h1>
          <p className="font-sans text-sm text-[var(--text-muted)]">
            Perfiles de DJs, productores y artistas en Argentina
          </p>
        </div>

        {/* Search bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); applyFilters() }}
          className="flex gap-3"
        >
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre o bio..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Buscar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={filtersOpen ? 'border-[var(--accent)] text-[var(--accent)]' : ''}
          >
            Filtros
            {hasActiveFilters && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block" />
            )}
          </Button>
        </form>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <span className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  Tipo
                </span>
                <FilterChips options={TYPE_OPTIONS} value={type} onChange={setType} />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  Disponibilidad
                </span>
                <FilterChips
                  options={AVAILABILITY_OPTIONS}
                  value={availability}
                  onChange={setAvailability}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
                Ubicacion
              </span>
              <input
                type="text"
                placeholder="Ej: CABA, Cordoba, Rosario..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={cn(
                  'w-full max-w-xs bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md px-3 py-2',
                  'font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]',
                  'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-150',
                )}
              />
            </div>

            {genreNames.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  Generos {selectedGenres.length > 0 && `(${selectedGenres.length})`}
                </span>
                <MultiFilterChips
                  options={genreNames}
                  value={selectedGenres}
                  onChange={setSelectedGenres}
                  max={5}
                />
              </div>
            )}

            {eventTypeNames.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  Tipos de evento {selectedEventTypes.length > 0 && `(${selectedEventTypes.length})`}
                </span>
                <MultiFilterChips
                  options={eventTypeNames}
                  value={selectedEventTypes}
                  onChange={setSelectedEventTypes}
                  max={3}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
              <Button type="button" variant="primary" size="sm" onClick={applyFilters}>
                Aplicar filtros
              </Button>
              {hasActiveFilters && (
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Active filter tags */}
        {hasActiveFilters && !filtersOpen && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-xs text-[var(--text-muted)]">Filtros activos:</span>
            {activeFilters.q && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/20">
                "{activeFilters.q}"
              </span>
            )}
            {activeFilters.type && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]">
                {TYPE_OPTIONS.find((o) => o.value === activeFilters.type)?.label}
              </span>
            )}
            {activeFilters.availability && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]">
                {AVAILABILITY_OPTIONS.find((o) => o.value === activeFilters.availability)?.label}
              </span>
            )}
            {activeFilters.location && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]">
                {activeFilters.location}
              </span>
            )}
            {activeFilters.genres?.map((g) => (
              <span key={g} className="px-2.5 py-1 rounded-full text-xs bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]">
                {g}
              </span>
            ))}
            {activeFilters.eventTypes?.map((e) => (
              <span key={e} className="px-2.5 py-1 rounded-full text-xs bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]">
                {e}
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="font-sans text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline transition-colors"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="font-display text-[var(--text-muted)] text-lg">
              No se encontraron perfiles
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div
              ref={gridRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {profiles.map((profile) => (
                <div key={profile.id} className="profile-card-item">
                  <ProfileCard profile={profile} />
                </div>
              ))}
            </div>

            {hasNextPage && (
              <div className="flex justify-center pt-4">
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
