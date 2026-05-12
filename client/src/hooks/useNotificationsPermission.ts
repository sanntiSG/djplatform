import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore.js'
import { useToastStore } from '../store/useToastStore.js'
import * as pushService from '../services/pushService.js'
import { reasonToMessage } from '../utils/pushReasons.js'

export function useNotificationsPermission() {
  const { user, setAuth, token } = useAuthStore()
  const { show: showToast } = useToastStore()
  const [open, setOpen] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const hasAsked = user?.notificationsAsked ?? true

  useEffect(() => {
    if (!user || !token) return
    if (hasAsked) return
    if (!user.profileId) return
    if (!('Notification' in window) || !('PushManager' in window)) return

    const timer = setTimeout(() => setOpen(true), 1200)
    return () => clearTimeout(timer)
  }, [user?.id, hasAsked, !!user?.profileId, !!token])

  async function handleActivate() {
    const result = await pushService.subscribe()
    if (result.ok) {
      showToast('Listo. Te avisaremos de lo que importa.', 'success')
    } else {
      if (result.reason === 'ios-needs-pwa') {
        setOpen(false)
        setShowInstallPrompt(true)
        return
      }
      showToast(reasonToMessage(result.reason), 'error')
    }
    if (user && token) {
      setAuth(token, {
        ...user,
        notificationsAsked: true,
        pushOptIn: result.ok,
      })
    }
    setOpen(false)
  }

  async function handleDismiss() {
    await pushService.dismissAsk().catch(() => { /* silent */ })
    showToast('Podes activarlas cuando quieras desde tu perfil > Notificaciones.', 'info')
    if (user && token) {
      setAuth(token, { ...user, notificationsAsked: true })
    }
    setOpen(false)
  }

  return { open, handleActivate, handleDismiss, showInstallPrompt, setShowInstallPrompt }
}
