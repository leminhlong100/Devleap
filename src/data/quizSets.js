/**
 * Bộ đề kiểm tra cuối tuần / cuối khóa.
 *
 * Chiến lược "kết hợp": ưu tiên ngân hàng đề riêng nếu đã soạn trong MD
 * (`week.weekTest` cho Java, `week.weekQuiz` cho IELTS); nếu chưa có thì GOM
 * các câu "Quiz Nhanh" của mọi ngày trong tuần thành một bài kiểm tra. Nhờ vậy
 * tính năng chạy được ngay với nội dung hiện có, đồng thời chừa sẵn chỗ nâng cấp
 * sang đề chuyên biệt bám mục tiêu tuần sau này.
 *
 * Hình dạng câu hỏi giống parseQuiz: { q, opts, correct, ex }.
 */
import { javaWeeksData } from './course'
import { ieltsWeeksData } from './courseIelts'
import { commWeeksData } from './courseComm'

const dataOf = (course) =>
  course === 'ielts' ? ieltsWeeksData : course === 'comm' ? commWeeksData : javaWeeksData
const courseLabel = (course) => (course === 'ielts' ? 'IELTS' : course === 'comm' ? 'Giao Tiếp' : 'Java')

// Gom các câu quiz nhanh của mọi ngày trong tuần thành một danh sách.
const aggregateDayQuizzes = (week) => week.days.flatMap((d) => d.quiz || [])

// Mục tiêu tuần hiển thị trên đầu bài kiểm tra (chỉ để định hướng người học).
function objectivesOf(course, week) {
  if (course === 'java') return week.days.map((d) => d.title).filter(Boolean)
  const skills = (week.skills || []).map((s) => s.title)
  const grammar = (week.grammar || []).map((g) => g.title)
  return [...skills, ...grammar].filter(Boolean)
}

/** Đề kiểm tra một tuần (null nếu tuần không tồn tại hoặc chưa có câu hỏi nào). */
export function getWeekQuiz(course, weekNum) {
  const week = dataOf(course).find((w) => w.num === Number(weekNum))
  if (!week) return null
  // Ngân hàng đề riêng nếu đã soạn (Java: weekTest; IELTS/Giao Tiếp: weekQuiz);
  // nếu chưa thì gom quiz các ngày.
  const dedicated = week.weekTest?.length ? week.weekTest : week.weekQuiz?.length ? week.weekQuiz : null
  const questions = dedicated || aggregateDayQuizzes(week)
  if (!questions.length) return null
  return {
    course,
    scope: `week:${week.num}`,
    weekNum: week.num,
    title: `Kiểm tra Tuần ${week.num}`,
    subtitle: week.title,
    objectives: objectivesOf(course, week),
    questions,
  }
}

/** Đề thi cuối khóa: gom câu hỏi của tất cả các tuần. */
export function getFinalQuiz(course) {
  const weeks = dataOf(course)
  const questions = weeks.flatMap((w) => getWeekQuiz(course, w.num)?.questions || [])
  if (!questions.length) return null
  return {
    course,
    scope: 'final',
    weekNum: null,
    title: `Thi cuối khóa ${courseLabel(course)}`,
    subtitle: `Tổng hợp ${weeks.length} tuần`,
    objectives: [],
    questions,
  }
}

/**
 * Lấy đề theo định danh scope dùng trên URL: "week-3" hoặc "final".
 * (Store dùng scope dạng "week:3"/"final" — xem thuộc tính `scope` trả về.)
 */
export function getQuizSet(course, scope) {
  if (scope === 'final') return getFinalQuiz(course)
  const m = /^week-(\d+)$/.exec(scope || '')
  return m ? getWeekQuiz(course, m[1]) : null
}

/** Số tuần có đề kiểm tra của một khóa. */
export function weekQuizCount(course) {
  return dataOf(course).filter((w) => getWeekQuiz(course, w.num)).length
}
