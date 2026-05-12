import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa-install-dismissed-at'
const DISMISS_COOLDOWN_DAYS = 7

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function wasDismissedRecently(): boolean {
  const ts = localStorage.getItem(DISMISSED_KEY)
  if (!ts) return false
  const days = (Date.now() - Number(ts)) / (1000 * 60 * 60 * 24)
  return days < DISMISS_COOLDOWN_DAYS
}

export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const installNow = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredEvent) return 'unavailable'
    await deferredEvent.prompt()
    const choice = await deferredEvent.userChoice
    setDeferredEvent(null)
    return choice.outcome
  }, [deferredEvent])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
  }, [])

  return {
    canInstallNative: !!deferredEvent,
    isIOS: isIOS(),
    isStandalone: isStandalone(),
    wasDismissedRecently: wasDismissedRecently(),
    installNow,
    dismiss,
  }
}
