import { ref } from 'vue'
import {
  getPreferredHour,
  setPreferredHour as persistPreferredHour,
  shouldShowEveningReminder,
  maybeSendReminderNotification,
} from '@/lib/studyReminder'

// Singleton module-level, cùng pattern useTheme.js/useOnlineStatus.js: mọi nơi
// gọi useStudyReminder() dùng chung 1 đồng hồ tick + 1 giờ ưa thích, chỉ đăng
// ký timer/listener 1 lần dù có nhiều component dùng.
const now = ref(new Date())
const preferredHour = ref(getPreferredHour())
let attached = false

function tick() {
  now.value = new Date()
}

function attach() {
  if (attached || typeof window === 'undefined') return
  attached = true
  setInterval(tick, 60_000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick()
  })
  window.addEventListener('focus', tick)
}

export function useStudyReminder() {
  attach()

  function setPreferredHour(hour) {
    preferredHour.value = hour
    persistPreferredHour(hour)
  }

  /** Mức 1: đủ điều kiện hiện banner "sắp đứt streak" ngay bây giờ chưa? */
  function eveningReminderDue(streak, studiedToday) {
    return shouldShowEveningReminder({
      streak,
      studiedToday,
      hour: now.value.getHours(),
      preferredHour: preferredHour.value,
    })
  }

  /** Mức 2: gọi lúc mở app/tab quay lại — gửi Notification nếu đủ điều kiện. */
  function checkReminderNotification(streak, studiedToday) {
    maybeSendReminderNotification({
      streak,
      studiedToday,
      hour: now.value.getHours(),
      preferredHour: preferredHour.value,
    })
  }

  return { now, preferredHour, setPreferredHour, eveningReminderDue, checkReminderNotification }
}
