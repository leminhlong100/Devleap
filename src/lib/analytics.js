// Bước 4.1 — Analytics tôn trọng riêng tư. Logic thuần tách khỏi Supabase/Vue,
// cùng pattern src/lib/webPush.js. KHÔNG PII: chỉ tên sự kiện + vài số/chuỗi
// mô tả (khóa/tuần/buổi/route) — không email, không tên hiển thị, không nội
// dung câu trả lời.

const OPT_OUT_KEY = 'devleap:analytics-opt-out:v1'

/** Người dùng đã tắt analytics ở thiết bị này chưa (mặc định: chưa tắt). */
export function isOptedOut() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1'
  } catch {
    return false
  }
}

/** Bật/tắt analytics ở thiết bị này. */
export function setOptedOut(value) {
  try {
    if (value) localStorage.setItem(OPT_OUT_KEY, '1')
    else localStorage.removeItem(OPT_OUT_KEY)
  } catch {
    /* ignore */
  }
}

// Chỉ giữ lại các giá trị nguyên thủy (string/number/boolean) — loại bỏ object
// lồng nhau, hàm, hoặc bất cứ thứ gì có thể vô tình mang PII.
export function sanitizeProps(props) {
  const out = {}
  if (!props || typeof props !== 'object') return out
  for (const [key, value] of Object.entries(props)) {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value
    }
  }
  return out
}

/** Dựng 1 dòng để insert vào bảng `events`. */
export function buildEventRow(name, props, userId, now = new Date()) {
  return {
    user_id: userId || null,
    name: String(name || '').slice(0, 64),
    props: sanitizeProps(props),
    created_at: now.toISOString(),
  }
}
