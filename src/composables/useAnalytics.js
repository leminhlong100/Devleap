import { supabase, isCloudEnabled } from '@/lib/supabase'
import { isOptedOut, buildEventRow } from '@/lib/analytics'
import { useAuthStore } from '@/stores/auth'

/**
 * Ghi sự kiện analytics (Bước 4.1) — bắn-và-quên (fire-and-forget), không bao
 * giờ throw hay chặn luồng UI. Không hoạt động khi: chưa cấu hình Supabase
 * (chế độ khách), hoặc người dùng đã tắt ở trang Hồ sơ. Gọi được cả trong
 * component lẫn ngoài (router guard, store action) vì không dùng ref/lifecycle.
 */
export function useAnalytics() {
  function track(name, props) {
    if (!isCloudEnabled || isOptedOut()) return
    try {
      const auth = useAuthStore()
      const row = buildEventRow(name, props, auth.user?.id)
      Promise.resolve(supabase.from('events').insert(row)).then(
        () => {},
        () => {},
      )
    } catch {
      /* best-effort: không bao giờ được làm hỏng luồng chính vì lỗi ghi log */
    }
  }
  return { track }
}
