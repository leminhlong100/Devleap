import { ref } from 'vue'

/**
 * Trạng thái thanh tiến trình điều hướng — dùng chung cho cả app (một nguồn
 * duy nhất, giống useOnlineStatus). Router gọi navStart khi bắt đầu chuyển
 * trang và navDone khi xong (hoặc lỗi); NavigationProgress.vue hiển thị.
 *
 * Vì sao cần: mọi route đều lazy-load (() => import(...)). Khi bấm, trình duyệt
 * phải tải chunk JS mới — có độ trễ mà không có dấu hiệu gì nên người dùng
 * tưởng app bị đơ/lag. Thanh này hiện ngay lúc bấm để phản hồi tức thì.
 */
const visible = ref(false)
const finishing = ref(false)
let hideTimer = null

/** Bắt đầu một lượt điều hướng — hiện thanh và chạy hoạt ảnh "chảy" tới ~90%. */
export function navStart() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  finishing.value = false
  visible.value = true
}

/** Điều hướng xong — đẩy thanh tới 100% rồi mờ dần và ẩn. */
export function navDone() {
  if (!visible.value) return
  finishing.value = true
  hideTimer = setTimeout(() => {
    visible.value = false
    finishing.value = false
    hideTimer = null
  }, 320)
}

export function useNavProgress() {
  return { visible, finishing }
}
