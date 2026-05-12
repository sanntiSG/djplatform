export type SubscribeReason =
  | 'unsupported-browser'
  | 'ios-needs-pwa'
  | 'permission-denied'
  | 'sw-not-ready'
  | 'vapid-missing'
  | 'subscribe-failed'
  | 'network-error'

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: SubscribeReason; detail?: string }

export function reasonToMessage(reason: SubscribeReason): string {
  switch (reason) {
    case 'ios-needs-pwa':
      return 'En iPhone, agrega REsonar a tu pantalla de inicio para recibir notificaciones.'
    case 'unsupported-browser':
      return 'Tu navegador no soporta notificaciones push.'
    case 'permission-denied':
      return 'Permiti las notificaciones en la configuracion del navegador.'
    case 'sw-not-ready':
      return 'El sitio aun no esta listo. Recarga la pagina e intentalo de nuevo.'
    case 'vapid-missing':
      return 'Servicio temporalmente no disponible. Probalo mas tarde.'
    case 'subscribe-failed':
      return 'No pudimos completar la suscripcion. Recarga e intentalo de nuevo.'
    case 'network-error':
      return 'Error de red. Verifica tu conexion e intentalo de nuevo.'
  }
}
