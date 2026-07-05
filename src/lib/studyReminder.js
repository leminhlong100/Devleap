// Nhắc học hằng ngày (Bước 4.4).
// Mức 1: banner trong app khi tối rồi mà chưa học — logic quyết định (thuần,
// test được) tách khỏi phần đọc "giờ ưa thích" từ localStorage.
// Mức 2: Notification API khi tab còn mở (không server push) — xin quyền đúng
// 1 lần sau buổi học thứ 3, không hỏi lại dù được cấp hay bị từ chối.

const HOUR_KEY = 'devleap:reminder-hour'
const ASKED_KEY = 'devleap:notify-asked'
const NOTIFIED_KEY = 'devleap:notify-last'
const DEFAULT_HOUR = 20
const ASK_AFTER_SESSIONS = 3

/** Giờ "quen thuộc" người học muốn được nhắc (0–23), mặc định 20h. */
export function getPreferredHour() {
  try {
    const raw = localStorage.getItem(HOUR_KEY)
    const n = raw === null ? DEFAULT_HOUR : Number(raw)
    return Number.isInteger(n) && n >= 0 && n <= 23 ? n : DEFAULT_HOUR
  } catch {
    return DEFAULT_HOUR
  }
}

export function setPreferredHour(hour) {
  try {
    localStorage.setItem(HOUR_KEY, String(hour))
  } catch {
    /* riêng tư/quota đầy — bỏ qua, chỉ mất lựa chọn giữa các phiên */
  }
}

/** Có nên hiện banner "sắp đứt streak" ngay bây giờ? Thuần — test trực tiếp bằng cách truyền hour. */
export function shouldShowEveningReminder({ streak, studiedToday, hour, preferredHour }) {
  return streak > 0 && !studiedToday && hour >= preferredHour
}

function hasAskedNotificationPermission() {
  try {
    return localStorage.getItem(ASKED_KEY) === '1'
  } catch {
    return true // không ghi được thì coi như đã hỏi, tránh hỏi lặp lại lỗi mỗi lần
  }
}

function markNotificationAsked() {
  try {
    localStorage.setItem(ASKED_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** Đủ điều kiện xin quyền thông báo chưa (từ buổi thứ 3, chưa từng hỏi)? Thuần. */
export function eligibleForNotificationPrompt(totalSessions, alreadyAsked) {
  return totalSessions >= ASK_AFTER_SESSIONS && !alreadyAsked
}

/**
 * Xin quyền Notification đúng 1 lần khi vừa đủ (hoặc vượt) buổi thứ 3 — gọi từ
 * `progressSlice#toggleDay` ngay lúc đánh dấu hoàn thành. Không hỏi lại ở các
 * buổi sau dù người học đồng ý hay từ chối (đánh dấu "đã hỏi" ngay cả khi
 * permission hiện tại không phải 'default', để không thử lại vô ích).
 */
export function maybeRequestNotificationPermission(totalSessions) {
  if (typeof Notification === 'undefined') return
  if (!eligibleForNotificationPrompt(totalSessions, hasAskedNotificationPermission())) return
  markNotificationAsked()
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }
}

function lastNotifiedDate() {
  try {
    return localStorage.getItem(NOTIFIED_KEY)
  } catch {
    return null
  }
}

function markNotifiedToday(today) {
  try {
    localStorage.setItem(NOTIFIED_KEY, today)
  } catch {
    /* ignore */
  }
}

/**
 * Gửi thông báo nhắc học nếu đã có quyền, tối rồi, chưa học hôm nay, và chưa
 * nhắc trong ngày hôm nay. Gọi khi mở app / tab quay lại foreground (không có
 * server push nên chỉ hoạt động lúc tab còn mở). Trả về đã gửi hay chưa.
 */
export function maybeSendReminderNotification({ streak, studiedToday, hour, preferredHour }) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false
  if (!shouldShowEveningReminder({ streak, studiedToday, hour, preferredHour })) return false
  const today = new Date().toDateString()
  if (lastNotifiedDate() === today) return false
  markNotifiedToday(today)
  new Notification('🔥 Đừng để đứt streak!', {
    body: `Streak ${streak} ngày đang chờ — học 1 buổi 15 phút để giữ lửa nhé.`,
    icon: '/icons/icon-192.png',
  })
  return true
}
