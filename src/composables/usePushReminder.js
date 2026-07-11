import { ref } from 'vue'
import { supabase, isCloudEnabled } from '@/lib/supabase'
import { isPushSupported, urlBase64ToUint8Array, subscriptionToRow } from '@/lib/webPush'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

/**
 * Nhắc học qua Web Push thật (Bước 3.3) — hoạt động cả khi app đã đóng, khác
 * Notification cục bộ ở `useStudyReminder` (chỉ chạy khi tab đang mở). Cần
 * VAPID_PUBLIC_KEY + Supabase (bảng `push_subscriptions`) + Edge Function
 * `send-study-reminders` chạy theo lịch (xem docs/SUPABASE_SETUP.md).
 */
export function usePushReminder() {
  const supported = isPushSupported() && !!VAPID_PUBLIC_KEY && isCloudEnabled
  const permission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const subscribed = ref(false)
  const busy = ref(false)

  async function ensureRegistration() {
    const existing = await navigator.serviceWorker.getRegistration()
    return existing || navigator.serviceWorker.register('/sw.js')
  }

  /** Gọi khi mở trang Hồ sơ để biết thiết bị này đã đăng ký push chưa. */
  async function checkSubscribed() {
    if (!supported) return
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    subscribed.value = !!sub
  }

  async function enable(userId, preferredHour) {
    if (!supported || busy.value) return { error: 'Thiết bị hoặc trình duyệt này chưa hỗ trợ nhắc học qua push.' }
    busy.value = true
    try {
      const perm = await Notification.requestPermission()
      permission.value = perm
      if (perm !== 'granted') return { error: 'Bạn chưa cấp quyền thông báo.' }

      const reg = await ensureRegistration()
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const row = subscriptionToRow(sub, userId, preferredHour)
      const { error } = await supabase.from('push_subscriptions').upsert(row)
      if (error) return { error: 'Không lưu được đăng ký nhắc học, thử lại sau.' }
      subscribed.value = true
      return { error: null }
    } catch {
      return { error: 'Không bật được nhắc học qua push.' }
    } finally {
      busy.value = false
    }
  }

  async function disable(userId) {
    busy.value = true
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      if (isCloudEnabled) await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      subscribed.value = false
      return { error: null }
    } finally {
      busy.value = false
    }
  }

  return { supported, permission, subscribed, busy, checkSubscribed, enable, disable }
}
