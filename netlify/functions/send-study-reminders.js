/**
 * Netlify Scheduled Function (Bước 3.3): nhắc học qua Web Push THẬT — gửi được
 * cả khi app đã đóng (khác Notification cục bộ ở `useStudyReminder`, chỉ chạy
 * lúc tab mở). Chạy tự động mỗi giờ (xem `config.schedule` cuối file), không
 * gọi trực tiếp từ client.
 *
 * Giả định đơn giản hóa: TOÀN BỘ người dùng ở múi giờ Việt Nam (UTC+7) — sản
 * phẩm chỉ phục vụ người học Việt, không lưu timezone riêng từng người. Nếu
 * sau này có người dùng ở múi giờ khác, cần thêm cột timezone vào
 * `push_subscriptions` và tính lại `localHour`/`localDateKey` theo đó.
 *
 * Env cần ở Netlify: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (đã có sẵn cho
 * /admin), VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (sinh bằng `npx web-push
 * generate-vapid-keys`, public key phải TRÙNG với VITE_VAPID_PUBLIC_KEY phía
 * client — nếu không subscription cũ sẽ không nhận được push).
 */
import webpush from 'web-push'
import { getServiceClient } from './_adminAuth.js'

const VN_OFFSET_HOURS = 7

/** Giờ & ngày hiện tại theo giờ Việt Nam (UTC+7), suy từ đồng hồ UTC của server. */
function vnNow() {
  const now = new Date()
  const vn = new Date(now.getTime() + VN_OFFSET_HOURS * 60 * 60 * 1000)
  return {
    hour: vn.getUTCHours(),
    dateKey: `${vn.getUTCFullYear()}-${vn.getUTCMonth() + 1}-${vn.getUTCDate()}`,
  }
}

/** Có nên gửi nhắc học cho subscription này ngay bây giờ không? Thuần — test trực tiếp. */
export function shouldSendReminder({ streak, lastStudyDate, preferredHour }, { hour, dateKey }) {
  return streak > 0 && lastStudyDate !== dateKey && hour === preferredHour
}

async function sendOrCleanup(service, row, payload) {
  const subscription = {
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth_key },
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return 'sent'
  } catch (err) {
    // 404/410 = subscription hết hạn hoặc bị thu hồi -> dọn để lần sau khỏi thử lại vô ích.
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      await service.from('push_subscriptions').delete().eq('user_id', row.user_id)
      return 'expired'
    }
    return 'failed'
  }
}

export default async () => {
  const vapidPublic = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (!vapidPublic || !vapidPrivate) {
    return new Response(JSON.stringify({ skipped: 'VAPID keys chưa cấu hình' }), { status: 200 })
  }
  webpush.setVapidDetails('mailto:support@devleap.app', vapidPublic, vapidPrivate)

  const service = getServiceClient()
  // push_subscriptions & progress không có khóa ngoại trực tiếp với nhau (cả
  // 2 chỉ tham chiếu auth.users) nên PostgREST không embed được — tự join ở JS.
  const { data: subs, error: subsErr } = await service
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth_key, preferred_hour')
  if (subsErr) return new Response(JSON.stringify({ error: subsErr.message }), { status: 500 })
  if (!subs?.length) return new Response(JSON.stringify({ sent: 0, expired: 0, failed: 0, skipped: 0 }), { status: 200 })

  const { data: progressRows, error: progressErr } = await service
    .from('progress')
    .select('user_id, streak, last_study_date')
    .in('user_id', subs.map((s) => s.user_id))
  if (progressErr) return new Response(JSON.stringify({ error: progressErr.message }), { status: 500 })
  const progressByUser = new Map(progressRows.map((p) => [p.user_id, p]))

  const now = vnNow()
  const results = { sent: 0, expired: 0, failed: 0, skipped: 0 }
  const payload = {
    title: '🔥 Đừng để đứt streak!',
    body: 'Học 1 buổi 15 phút hôm nay để giữ lửa nhé.',
  }

  for (const row of subs) {
    const progress = progressByUser.get(row.user_id)
    const eligible = shouldSendReminder(
      { streak: progress?.streak || 0, lastStudyDate: progress?.last_study_date, preferredHour: row.preferred_hour },
      now,
    )
    if (!eligible) {
      results.skipped += 1
      continue
    }
    const outcome = await sendOrCleanup(service, row, payload)
    results[outcome] = (results[outcome] || 0) + 1
  }

  return new Response(JSON.stringify(results), { status: 200 })
}

export const config = { schedule: '0 * * * *' }
