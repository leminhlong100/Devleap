import { ref } from 'vue'
import {
  eligibleToShowInstallCard,
  getDismissedAt,
  markInstallDismissed,
  isStandaloneDisplay,
  isIosDevice,
} from '@/lib/installPrompt'

// Singleton module-level, cùng pattern useOnlineStatus.js/useTheme.js — chỉ 1
// listener `beforeinstallprompt` cho toàn app dù nhiều component gọi composable.
const canInstall = ref(false)
const isStandalone = ref(isStandaloneDisplay())
const isIos = isIosDevice()
let deferredEvent = null
let attached = false

function attach() {
  if (attached || typeof window === 'undefined') return
  attached = true
  window.addEventListener('beforeinstallprompt', (ev) => {
    ev.preventDefault()
    deferredEvent = ev
    canInstall.value = true
  })
  window.addEventListener('appinstalled', () => {
    isStandalone.value = true
    canInstall.value = false
    deferredEvent = null
  })
}

export function useInstallPrompt() {
  attach()

  /** Đủ điều kiện hiện thẻ mời (chưa cài + đã học ≥1 buổi + chưa "Để sau" gần đây) + có cách để cài (Android/desktop có prompt, hoặc iOS luôn hướng dẫn tay được). */
  function shouldShowInstallCard(totalSessions) {
    if (isStandalone.value) return false
    if (!canInstall.value && !isIos) return false
    return eligibleToShowInstallCard({ totalSessions, dismissedAt: getDismissedAt(), now: Date.now() })
  }

  async function promptInstall() {
    if (!deferredEvent) return null
    deferredEvent.prompt()
    const choice = await deferredEvent.userChoice
    deferredEvent = null
    canInstall.value = false
    return choice
  }

  function dismissInstall() {
    markInstallDismissed(Date.now())
  }

  return { canInstall, isStandalone, isIos, shouldShowInstallCard, promptInstall, dismissInstall }
}
