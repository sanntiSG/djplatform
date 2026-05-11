export type RainbowColor = 'pink' | 'purple' | 'orange' | 'teal' | 'yellow' | 'red' | 'blue'

const GENRE_COLOR_MAP: Record<string, RainbowColor> = {
  Techno:           'purple',
  House:            'orange',
  'Deep House':     'blue',
  'Tech House':     'teal',
  'Melodic Techno': 'pink',
  Minimal:          'teal',
  'Afro House':     'orange',
  'Organic House':  'teal',
  Trance:           'blue',
  'Drum & Bass':    'pink',
  Ambient:          'teal',
  Electronic:       'purple',
  Progressive:      'blue',
  'Nu Disco':       'pink',
  Industrial:       'red',
  EBM:              'red',
  Remix:            'yellow',
  Cumbia:           'yellow',
  Enganche:         'orange',
}

const FALLBACK_COLORS: RainbowColor[] = ['pink', 'purple', 'orange', 'teal', 'yellow', 'red', 'blue']

export function genreToColor(genre: string): RainbowColor {
  if (GENRE_COLOR_MAP[genre]) return GENRE_COLOR_MAP[genre]
  const idx = genre.charCodeAt(0) % FALLBACK_COLORS.length
  return FALLBACK_COLORS[idx]
}

export const COLOR_VAR: Record<RainbowColor, string> = {
  pink:   'var(--c-pink)',
  purple: 'var(--c-purple)',
  orange: 'var(--c-orange)',
  teal:   'var(--c-teal)',
  yellow: 'var(--c-yellow)',
  red:    'var(--c-red)',
  blue:   'var(--c-blue)',
}

export const COLOR_MUTED_VAR: Record<RainbowColor, string> = {
  pink:   'var(--c-pink-muted)',
  purple: 'var(--c-purple-muted)',
  orange: 'var(--c-orange-muted)',
  teal:   'var(--c-teal-muted)',
  yellow: 'var(--c-yellow-muted)',
  red:    'var(--c-red-muted)',
  blue:   'var(--c-blue-muted)',
}

/* Deterministic color for any arbitrary string (used for event types, locations, etc.) */
export function stringToColor(str: string): RainbowColor {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}
