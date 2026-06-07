/**
 * projectCoverAssets — registry de ilustraciones del puzzle disponibles como portada de proyecto.
 *
 * Estas ilustraciones son full-bleed (coloreadas, con gradientes y branding RESONAR) y solo pueden
 * usarse para la portada del proyecto. NO aparecen en el selector de "publicar avance" (ProjectPublishSheet).
 *
 * Las keys se almacenan en el campo `coverSvgKey` de Project con el prefijo `puzzle:`.
 * Las URLs se resuelven en runtime via `new URL(...)` para que Vite las hashee correctamente en build.
 */

export interface PuzzleCoverItem {
  key: string
  url: string
  label: string
}

const BOOTSTRAP_COVERS: PuzzleCoverItem[] = [
  { key: 'puzzle:b1',  url: new URL('../../assets/puzzle/bootstrap/b1.svg',  import.meta.url).href, label: 'Portada 1'  },
  { key: 'puzzle:b2',  url: new URL('../../assets/puzzle/bootstrap/b2.svg',  import.meta.url).href, label: 'Portada 2'  },
  { key: 'puzzle:b3',  url: new URL('../../assets/puzzle/bootstrap/b3.svg',  import.meta.url).href, label: 'Portada 3'  },
  { key: 'puzzle:b4',  url: new URL('../../assets/puzzle/bootstrap/b4.svg',  import.meta.url).href, label: 'Portada 4'  },
  { key: 'puzzle:b5',  url: new URL('../../assets/puzzle/bootstrap/b5.svg',  import.meta.url).href, label: 'Portada 5'  },
  { key: 'puzzle:b6',  url: new URL('../../assets/puzzle/bootstrap/b6.svg',  import.meta.url).href, label: 'Portada 6'  },
  { key: 'puzzle:b7',  url: new URL('../../assets/puzzle/bootstrap/b7.svg',  import.meta.url).href, label: 'Portada 7'  },
  { key: 'puzzle:b8',  url: new URL('../../assets/puzzle/bootstrap/b8.svg',  import.meta.url).href, label: 'Portada 8'  },
  { key: 'puzzle:b9',  url: new URL('../../assets/puzzle/bootstrap/b9.svg',  import.meta.url).href, label: 'Portada 9'  },
]

const LOCAL_COVERS: PuzzleCoverItem[] = [
  { key: 'puzzle:local-01', url: new URL('../../assets/puzzle/local/local-01.svg', import.meta.url).href, label: 'Ilustracion 1'  },
  { key: 'puzzle:local-02', url: new URL('../../assets/puzzle/local/local-02.svg', import.meta.url).href, label: 'Ilustracion 2'  },
  { key: 'puzzle:local-03', url: new URL('../../assets/puzzle/local/local-03.svg', import.meta.url).href, label: 'Ilustracion 3'  },
  { key: 'puzzle:local-04', url: new URL('../../assets/puzzle/local/local-04.svg', import.meta.url).href, label: 'Ilustracion 4'  },
  { key: 'puzzle:local-05', url: new URL('../../assets/puzzle/local/local-05.svg', import.meta.url).href, label: 'Ilustracion 5'  },
  { key: 'puzzle:local-06', url: new URL('../../assets/puzzle/local/local-06.svg', import.meta.url).href, label: 'Ilustracion 6'  },
  { key: 'puzzle:local-07', url: new URL('../../assets/puzzle/local/local-07.svg', import.meta.url).href, label: 'Ilustracion 7'  },
  { key: 'puzzle:local-08', url: new URL('../../assets/puzzle/local/local-08.svg', import.meta.url).href, label: 'Ilustracion 8'  },
  { key: 'puzzle:local-09', url: new URL('../../assets/puzzle/local/local-09.svg', import.meta.url).href, label: 'Ilustracion 9'  },
  { key: 'puzzle:local-10', url: new URL('../../assets/puzzle/local/local-10.svg', import.meta.url).href, label: 'Ilustracion 10' },
  { key: 'puzzle:local-11', url: new URL('../../assets/puzzle/local/local-11.svg', import.meta.url).href, label: 'Ilustracion 11' },
  { key: 'puzzle:local-12', url: new URL('../../assets/puzzle/local/local-12.svg', import.meta.url).href, label: 'Ilustracion 12' },
]

/** Lista completa de portadas de puzzle (bootstrap + local). */
export const PUZZLE_COVERS: PuzzleCoverItem[] = [...BOOTSTRAP_COVERS, ...LOCAL_COVERS]

/** Lookup por key para renders O(1). */
const PUZZLE_COVER_MAP = new Map<string, string>(PUZZLE_COVERS.map(({ key, url }) => [key, url]))

/** Devuelve true si la key corresponde a una ilustracion del puzzle. */
export function isPuzzleCoverKey(key?: string | null): boolean {
  return typeof key === 'string' && key.startsWith('puzzle:')
}

/**
 * Dada una `coverSvgKey` con prefijo `puzzle:`, devuelve la URL del asset.
 * Devuelve `null` para keys de iconos normales o undefined.
 */
export function getPuzzleCoverUrl(key?: string | null): string | null {
  if (!key || !isPuzzleCoverKey(key)) return null
  return PUZZLE_COVER_MAP.get(key) ?? null
}
