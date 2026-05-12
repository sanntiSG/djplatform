import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore.js'
import { useToastStore } from '../store/useToastStore.js'
import * as pushService from '../services/pushService.js'

export function useNotificationsPermission() {
  const { user, setAuth, token } = useAuthStore()
  const { show: showToast } = useToastStore()
  const [open, setOpen] = useState(false)
  const hasAsked = user?.notificationsAsked ?? true

  useEffect(() => {
    // Only show if: authenticated, has profile, hasn't been asked, browser supports push
    if (!user || !token) return
    if (hasAsked) return
    if (!user.profileId) return
    if (!('Notification' in window) || !('PushManager' in window)) return

    // Small delay so the page has time to render first
    const timer = setTimeout(() => setOpen(true), 1200)
    return () => clearTimeout(timer)
  }, [user?.id, hasAsked, !!user?.profileId, !!token])

  async function handleActivate() {
    const success = await pushService.subscribe()
    if (success) {
      showToast('Listo. Te avisaremos de lo que importa.', 'success')
    } else {
      showToast('No pudimos activar las notificaciones. Revisá los permisos del navegador.', 'error')
    }
    // Sync user state locally so the modal doesn't reappear
    if (user && token) {
      setAuth(token, {
        ...user,
        notificationsAsked: true,
        pushOptIn: success,
      })
    }
    setOpen(false)
  }

  async function handleDismiss() {
    await pushService.dismissAsk().catch(() => { /* silent */ })
    showToast('Podés activarlas cuando quieras desde tu perfil › Notificaciones.', 'info')
    if (user && token) {
      setAuth(token, { ...user, notificationsAsked: true })
    }
    setOpen(false)
  }

  return { open, handleActivate, handleDismiss }
}
