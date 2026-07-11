import { supabase, isCloudEnabled } from '@/lib/supabase'

/**
 * Lớp truy cập bảng `site_config` (Đợt 3 — docs/KE_HOACH_TRANG_ADMIN.md mục 4.2).
 *
 * Lớp phủ cấu hình ở DB, sửa được từ /admin/content mà KHÔNG cần deploy lại.
 * Cùng mô hình `shadowing_clips`: ai cũng ĐỌC được (áp lúc khởi động), chỉ admin
 * GHI được (RLS `is_admin()` chặn phía DB — không cần cổng function riêng).
 *
 * Repo cố tình "ngu": chỉ đọc raw các dòng thành map `{ key: value }` và ghi 1
 * key. Việc trộn với mặc định + chuẩn hóa nằm ở store `siteConfig` để test được.
 */

/** Đọc toàn bộ cấu hình -> map { key: value }. Rỗng nếu chưa cấu hình cloud/chưa có dòng. */
export async function fetchSiteConfig() {
  if (!isCloudEnabled) return {}
  const { data, error } = await supabase.from('site_config').select('key, value')
  if (error) throw error
  const out = {}
  for (const row of data || []) out[row.key] = row.value
  return out
}

/** Ghi (upsert) 1 key cấu hình. Chỉ admin gọi được (RLS chặn người thường). */
export async function saveSiteConfig(key, value) {
  if (!isCloudEnabled) throw new Error('Chưa cấu hình Supabase — không thể lưu cấu hình.')
  const { error } = await supabase
    .from('site_config')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw error
}

/**
 * Đọc các khóa 'restricted' mà NGƯỜI DÙNG HIỆN TẠI được cấp quyền vào → mảng
 * course_id. RLS `course_access` chỉ trả dòng của chính mình, nên client thường
 * chỉ thấy quyền của mình (không lộ ai khác được cấp). Rỗng nếu chưa đăng nhập /
 * chưa cấu hình cloud.
 */
export async function fetchMyCourseAccess() {
  if (!isCloudEnabled) return []
  const { data, error } = await supabase.from('course_access').select('course_id')
  if (error) throw error
  return (data || []).map((r) => r.course_id)
}
