/**
 * SVG icons hardcodeados para el selector de publicacion de avance de proyecto.
 * Todos usan currentColor para heredar el color del contexto (acento, texto, etc.)
 */

interface SvgIconProps {
  size?: number
}

function NoteIcon({ size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function MicIcon({ size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function WaveIcon({ size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="2 12 7 2 12 22 17 2 22 12" />
    </svg>
  )
}

function HeadphonesIcon({ size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  )
}

function RocketIcon({ size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  )
}

function StarIcon({ size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function FireIcon({ size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

function HandsIcon({ size = 40 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6"/>
      <path d="M18 5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5l1 1h1l1-1z"/>
    </svg>
  )
}

/** Map de todos los SVG icons disponibles */
export const PROGRESS_SVG_MAP: Record<string, (size?: number) => JSX.Element> = {
  note:       (size) => <NoteIcon size={size} />,
  mic:        (size) => <MicIcon size={size} />,
  wave:       (size) => <WaveIcon size={size} />,
  headphones: (size) => <HeadphonesIcon size={size} />,
  rocket:     (size) => <RocketIcon size={size} />,
  star:       (size) => <StarIcon size={size} />,
  fire:       (size) => <FireIcon size={size} />,
  hands:      (size) => <HandsIcon size={size} />,
}

export const PROGRESS_SVGS: Array<{ key: string; label: string }> = [
  { key: 'note',       label: 'Musical' },
  { key: 'mic',        label: 'Grabando' },
  { key: 'wave',       label: 'Audio' },
  { key: 'headphones', label: 'Escuchando' },
  { key: 'rocket',     label: 'Lanzamiento' },
  { key: 'star',       label: 'Destacado' },
  { key: 'fire',       label: 'En llamas' },
  { key: 'hands',      label: 'Colaborando' },
]

/** Renderiza el icon de un svgKey */
export function ProgressIcon({ svgKey, size = 40 }: { svgKey: string; size?: number }) {
  const renderer = PROGRESS_SVG_MAP[svgKey]
  if (!renderer) return <StarIcon size={size} />
  return <>{renderer(size)}</>
}
