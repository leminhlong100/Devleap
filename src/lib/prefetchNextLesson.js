/**
 * Precache "buổi kế tiếp" để offline vẫn học được buổi CHƯA từng mở (Bước 3.3).
 *
 * Nội dung bài học được Vite nhúng thẳng vào chunk JS qua
 * `import.meta.glob(..., { eager: true })` (xem src/data/course.js,
 * src/data/courseIelts.js) — KHÔNG fetch file .md rời lúc chạy. Vì vậy
 * "precache buổi kế" thực chất là **nạp trước (warm) chunk route của trang buổi
 * học**: lần `import()` đầu tiên tải chunk về, service worker
 * (stale-while-revalidate, xem public/sw.js) tự giữ lại → mở buổi đó lần sau
 * chạy được cả khi offline, dù trước đó chưa mở lần nào.
 *
 * Chỉ chạy khi máy đang RẢNH (requestIdleCallback) và ĐANG online, đúng một lần
 * mỗi phiên. Là tối ưu thuần: mọi lỗi đều nuốt im, không được ảnh hưởng app.
 *
 * `user.nextLesson` là getter Pinia trả THẲNG mảng (truy cập như thuộc tính,
 * không gọi như hàm) — xem src/stores/user/progressSlice.js.
 */
let done = false

function whenIdle(fn) {
  if (typeof window === 'undefined') return
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 5000 })
  else setTimeout(fn, 1500)
}

/**
 * @param {object} user store user đã khởi tạo (cần getter `nextLesson()`).
 */
export function prefetchNextLesson(user) {
  if (done || typeof window === 'undefined') return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return
  done = true

  whenIdle(() => {
    try {
      const lessons = Array.isArray(user?.nextLesson) ? user.nextLesson : []
      const courses = new Set(lessons.map((l) => l.course))
      // `nextLesson()` chỉ trả buổi cho khóa đang học dở → khách mới / đã xong
      // hết sẽ ra rỗng, không warm gì (đúng: chưa có gì để học offline).
      if (courses.has('ielts')) import('@/views/IeltsDayView.vue').catch(() => {})
      if (courses.has('java')) import('@/views/DayView.vue').catch(() => {})
    } catch {
      /* prefetch chỉ là tối ưu — lỗi không được nổi lên app */
    }
  })
}
