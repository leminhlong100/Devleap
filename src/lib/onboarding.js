// Bước 3.1 — Onboarding: tour ngắn ở trang chủ + checklist khởi động sau đăng
// nhập đầu tiên. Logic thuần (test được) tách khỏi localStorage/DOM, cùng
// pattern src/lib/installPrompt.js.

const TOUR_SEEN_KEY = 'devleap:onboarding-tour-seen'
const COURSE_PICKED_KEY = 'devleap:onboarding-course-picked'
const CHECKLIST_DISMISSED_KEY = 'devleap:onboarding-checklist-dismissed'

export const TOUR_SLIDES = [
  {
    emoji: '👋',
    title: 'Chào mừng đến Devleap!',
    text: 'Học lập trình & tiếng Anh như chơi một game — lộ trình rõ ràng, có tiến độ và streak giữ lửa mỗi ngày.',
  },
  {
    emoji: '📚',
    title: 'Học theo buổi ngắn',
    text: 'Mỗi buổi ~15–30 phút. Đánh dấu hoàn thành để lên streak, XP và mở khóa buổi tiếp theo.',
  },
  {
    emoji: '🧠',
    title: 'Ôn từ vựng đúng lúc',
    text: 'Flashcard SRS tự nhắc bạn ôn lại từ sắp quên — không cần tự nhớ lịch ôn.',
  },
  {
    emoji: '🗣️',
    title: 'Luyện nói thật với AI',
    text: 'Roleplay hội thoại, chấm phát âm và sửa lỗi từng lượt nói — luyện đến khi thành phản xạ.',
  },
]

function readFlag(key) {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key) {
  try {
    localStorage.setItem(key, '1')
  } catch {
    /* riêng tư/quota đầy — bỏ qua, chỉ mất lựa chọn giữa các phiên */
  }
}

export function hasSeenTour() {
  return readFlag(TOUR_SEEN_KEY)
}

export function markTourSeen() {
  writeFlag(TOUR_SEEN_KEY)
}

/** Đã từng vào trang lộ trình của 1 khóa (java/ielts/comm/java-prep) chưa. */
export function hasPickedCourse() {
  return readFlag(COURSE_PICKED_KEY)
}

export function markCoursePicked() {
  writeFlag(COURSE_PICKED_KEY)
}

export function isChecklistDismissed() {
  return readFlag(CHECKLIST_DISMISSED_KEY)
}

export function dismissChecklist() {
  writeFlag(CHECKLIST_DISMISSED_KEY)
}

/** Thuần — 3 bước khởi động, để component chỉ hiển thị. */
export function computeChecklist({ coursePicked, sessionsDone, reminderEnabled }) {
  return [
    { key: 'course', label: 'Chọn 1 khóa học phù hợp mục tiêu', done: !!coursePicked },
    { key: 'session', label: 'Hoàn thành buổi học đầu tiên', done: sessionsDone > 0 },
    { key: 'reminder', label: 'Bật nhắc học hằng ngày', done: !!reminderEnabled },
  ]
}
