import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase dùng chung cho toàn app.
 *
 * Đọc cấu hình từ biến môi trường Vite (.env.local). Nếu thiếu cấu hình,
 * `supabase` = null và app chạy ở "chế độ khách": tiến độ chỉ lưu localStorage,
 * không đăng nhập, không đồng bộ. Nhờ vậy app vẫn chạy được khi chưa dựng backend.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isCloudEnabled = Boolean(url && anonKey)

export const supabase = isCloudEnabled
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true, // giữ phiên đăng nhập qua các lần mở app
        autoRefreshToken: true,
        detectSessionInUrl: true, // xử lý redirect callback của OAuth
      },
    })
  : null
