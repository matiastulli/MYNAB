import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'pwa_install_dismissed'

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1'
  )

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    const onBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    const onInstalled = () => {
      setInstallPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setIsDismissed(true)
  }

  return {
    canInstall: !!installPrompt && !isInstalled && !isDismissed,
    isInstalled,
    handleInstall,
    handleDismiss,
  }
}
