export const ROLE_OPTIONS = [
  { id: 'dj',            label: 'DJ' },
  { id: 'producer',      label: 'Productor' },
  { id: 'vocalist',      label: 'Vocalista' },
  { id: 'designer',      label: 'Disenador' },
  { id: 'organizer',     label: 'Organizador' },
  { id: 'visuals',       label: 'Visuales' },
  { id: 'vj',            label: 'VJ' },
  { id: 'photographer',  label: 'Fotografo' },
  { id: 'videographer',  label: 'Videografo' },
  { id: 'manager',       label: 'Manager' },
  { id: 'mc',            label: 'MC' },
  { id: 'drummer',       label: 'Baterista' },
  { id: 'guitarist',     label: 'Guitarrista' },
  { id: 'bassist',       label: 'Bajista' },
  { id: 'keyboardist',   label: 'Tecladista' },
  { id: 'songwriter',    label: 'Compositor' },
  { id: 'sound_engineer',label: 'Ing. de Sonido' },
  { id: 'lighting',      label: 'Iluminacion' },
  { id: 'promoter',      label: 'Promotor' },
  { id: 'booking',       label: 'Booking' },
  { id: 'label',         label: 'Sello' },
  { id: 'mastering',     label: 'Mastering' },
  { id: 'dancer',        label: 'Bailarin' },
  { id: 'model',         label: 'Modelo' },
] as const

export type RoleId = (typeof ROLE_OPTIONS)[number]['id']

export const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((r) => [r.id, r.label])
)

export function roleLabel(id: string): string {
  return ROLE_LABEL[id] ?? id
}
