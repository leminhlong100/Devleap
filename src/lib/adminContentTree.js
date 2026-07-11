import { javaWeeksData } from '@/data/course'
import { ieltsWeeksData } from '@/data/courseIelts'
import { commWeeksData } from '@/data/courseComm'

/**
 * Cây nội dung tĩnh (read-only) cho /admin/content — Đợt 3, mục 4.1.
 *
 * Gộp dữ liệu ĐÃ PARSE của 3 khóa (Java/IELTS/Giao tiếp) thành cây gọn:
 *   Khóa → Tuần → Buổi (+ vài chỉ số: số từ, câu hỏi, quiz, mục checklist…).
 * Mục đích: admin thấy TOÀN CẢNH nội dung để tra cứu & biết buổi nào tồn tại mà
 * gắn lớp phủ. KHÔNG sửa ở đây — nội dung lõi sửa qua file .md + PR (xem `file`).
 *
 * `buildContentTree` nhận dữ liệu tuần qua tham số (mặc định = bản parse thật) để
 * test được với fixture nhẹ.
 */

// Các mảng ở cấp BUỔI đáng đếm (khác nhau giữa khóa: Java giàu, IELTS/Comm là checklist).
const DAY_BADGES = [
  ['vocab', 'từ'],
  ['questions', 'câu hỏi'],
  ['quiz', 'quiz'],
  ['exercises', 'bài tập'],
  ['checklist', 'mục'],
]
// Các mảng ở cấp TUẦN (IELTS/Comm gom nội dung học ở cấp tuần).
const WEEK_BADGES = [
  ['scenarios', 'tình huống'],
  ['vocabThemes', 'nhóm từ'],
  ['skills', 'kỹ năng'],
  ['lessonScripts', 'bài học'],
]

function countBadges(obj, specs) {
  const out = []
  for (const [field, label] of specs) {
    const arr = obj?.[field]
    if (Array.isArray(arr) && arr.length) out.push({ label, n: arr.length })
  }
  return out
}

function buildWeek(w) {
  return {
    num: w.num,
    title: w.title || '',
    badges: countBadges(w, WEEK_BADGES),
    days: (w.days || []).map((d) => ({
      n: d.n,
      title: d.title || '',
      emoji: d.emoji || '',
      badges: countBadges(d, DAY_BADGES),
    })),
  }
}

function buildCourse(key, label, file, weeksData) {
  const weeks = (weeksData || []).map(buildWeek)
  return {
    key,
    label,
    file,
    weeks,
    totals: { weeks: weeks.length, days: weeks.reduce((s, w) => s + w.days.length, 0) },
  }
}

/** Cây nội dung 3 khóa. Truyền dữ liệu để test; mặc định dùng bản parse thật. */
export function buildContentTree({
  java = javaWeeksData,
  ielts = ieltsWeeksData,
  comm = commWeeksData,
} = {}) {
  return [
    buildCourse('java', 'Java 12 Tuần', 'weeks/*.md', java),
    buildCourse('ielts', 'IELTS Cơ Bản', 'Base_English/*.md', ielts),
    buildCourse('comm', 'Giao Tiếp Thực Chiến', 'Comm_English/*.md', comm),
  ]
}
