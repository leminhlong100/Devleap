/**
 * "Readiness meter" — gộp % câu đã ôn + % coding đã giải + % mock đã làm + %
 * tủ hồ sơ cá nhân đã chuẩn bị thành MỘT chỉ số 0-100, trả lời câu "đã sẵn
 * sàng phỏng vấn chưa?". Thuần (không Vue/store) để test dễ — nhận state đã
 * trích từ javaPrep.
 *
 * Công thức (P1-3 — spec docs/devleap-spec-bo-sung.md):
 *   score = %câu đã ôn ×40 + %coding đã giải ×25 + %mock đã làm ×25 + %tủ hồ sơ ×10
 * Trước đây chỉ tính mock + coding (bỏ qua phần lớn công sức ôn câu hỏi lý
 * thuyết và chuẩn bị hồ sơ cá nhân — hai phần chiếm nhiều thời gian nhất).
 */
import { CODING_CHALLENGES, QUESTION_BANK, CRASH_PLAN, topicLabel } from '@/data/javaInterview'
import { PROFILE_QUESTIONS } from '@/data/profileQuestions'
import { dayGoals } from './crashPlan'

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)))
const pct = (cur, total) => (total ? clamp((cur / total) * 100) : 0)

/** Ngưỡng coi một chủ đề là "đã nắm" (đủ chắc để không cần ưu tiên ôn lại) — dùng cho tip gợi ý, không nằm trong công thức điểm. */
const TOPIC_MASTERED_AT = 70

// Mục tiêu mock "toàn khóa" = n LỚN NHẤT trong các mục tiêu {k:'mock', n} của
// CRASH_PLAN (Ngày 14 cần 2 buổi, cao nhất) — mocksTaken đếm dồn nên đạt mốc
// này coi như 100% phần mock.
const MOCK_TARGET = Math.max(1, ...CRASH_PLAN.flatMap((d) => dayGoals(d).filter((g) => g.k === 'mock').map((g) => g.n)))

/**
 * @param {{
 *   bestScore?: number, topicScores?: Record<string, number>,
 *   solvedChallenges?: string[], studiedQuestions?: string[],
 *   mocksTaken?: number, profilePrepared?: string[],
 * }} input
 * @returns {{ score:number, reviewedPart:number, codingPart:number, mockPart:number, profilePart:number, weakestTopic:string|null, tips:string[] }}
 */
export function computeReadiness({
  bestScore = 0,
  topicScores = {},
  solvedChallenges = [],
  studiedQuestions = [],
  mocksTaken = 0,
  profilePrepared = [],
} = {}) {
  const reviewedPart = pct((studiedQuestions || []).length, QUESTION_BANK.length)
  const codingPart = pct((solvedChallenges || []).length, CODING_CHALLENGES.length)
  const mockPart = pct(mocksTaken || 0, MOCK_TARGET)
  const profilePart = pct((profilePrepared || []).length, PROFILE_QUESTIONS.length)

  const score = clamp(reviewedPart * 0.4 + codingPart * 0.25 + mockPart * 0.25 + profilePart * 0.1)

  const topicEntries = Object.entries(topicScores || {})
  const weakest = topicEntries.length ? [...topicEntries].sort((a, b) => a[1] - b[1])[0] : null
  const weakestTopic = weakest ? weakest[0] : null

  const tips = []
  if (reviewedPart < 60) tips.push(`Ôn thêm câu hỏi trong Ngân hàng — mới ôn ${studiedQuestions.length}/${QUESTION_BANK.length} câu.`)
  if (codingPart < 50) tips.push(`Giải thêm bài coding — mới xong ${solvedChallenges.length}/${CODING_CHALLENGES.length} bài.`)
  if (mockPart < 100) tips.push(`Làm thêm buổi Mock Interview — mới ${mocksTaken}/${MOCK_TARGET} buổi.`)
  if (profilePart < 100) tips.push(`Chuẩn bị thêm câu hỏi hồ sơ cá nhân — mới ${profilePrepared.length}/${PROFILE_QUESTIONS.length} câu.`)
  if (weakest && weakest[1] < TOPIC_MASTERED_AT) tips.push(`Ôn thêm chủ đề "${topicLabel(weakest[0])}" (đang thấp nhất, ${weakest[1]} điểm).`)
  if (!tips.length) tips.push('Đã khá sẵn sàng — thử thêm buổi mock có giờ để quen áp lực thời gian thật.')

  return { score, reviewedPart, codingPart, mockPart, profilePart, bestScore: clamp(bestScore), weakestTopic, tips: tips.slice(0, 3) }
}

/** Nhãn ngắn theo mốc điểm — dùng hiển thị màu/trạng thái. */
export function readinessLabel(score) {
  if (score >= 80) return 'Sẵn sàng'
  if (score >= 60) return 'Gần sẵn sàng'
  if (score >= 35) return 'Cần ôn thêm'
  return 'Mới bắt đầu'
}
