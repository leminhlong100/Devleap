// Bước 3.3 — Web Push thật (nhắc học khi app đã đóng). Logic thuần tách khỏi
// PushManager/Supabase, cùng pattern src/lib/installPrompt.js.

/** VAPID public key (base64url) -> Uint8Array cần cho PushManager.subscribe(). */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

/** Trình duyệt có hỗ trợ Web Push không (Service Worker + PushManager + Notification). */
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined'
  )
}

/** Chuyển PushSubscription (đối tượng trình duyệt) sang payload lưu ở Supabase. */
export function subscriptionToRow(subscription, userId, preferredHour, now = new Date()) {
  const json = subscription.toJSON()
  return {
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth_key: json.keys?.auth,
    preferred_hour: preferredHour,
    updated_at: now.toISOString(),
  }
}
