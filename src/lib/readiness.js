/**
 * "Readiness meter" — gộp bestScore mock + tỉ lệ coding đã giải + % chủ đề đã
 * nắm thành MỘT chỉ số 0-100, trả lời câu "đã sẵn sàng phỏng vấn chưa?".
 * Thuần (không Vue/store) để test dễ — nhận state đã trích từ javaPrep.
 */
import { CODING_CHALLENGES, topicLabel } from '@/data/javaInterview'

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)))

/** Ngưỡng coi một chủ đề là "đã nắm" (đủ chắc để không cần ưu tiên ôn lại). */
const TOPIC_MASTERED_AT = 70

/**
 * @param {{ bestScore?: number, topicScores?: Record<string, number>, solvedChallenges?: string[] }} input
 * @returns {{ score: number, mockPart: number, codingPart: number, topicPart: number, weakestTopic: string|null, tips: string[] }}
 */
export function computeReadiness({ bestScore = 0, topicScores = {}, solvedChallenges = [] } = {}) {
  const mockPart = clamp(bestScore)

  const totalChallenges = CODING_CHALLENGES.length
  const solvedCount = Array.isArray(solvedChallenges) ? solvedChallenges.length : 0
  const codingPart = totalChallenges ? clamp((solvedCount / totalChallenges) * 100) : 0

  const topicEntries = Object.entries(topicScores || {})
  const topicPart = topicEntries.length
    ? clamp((topicEntries.filter(([, s]) => s >= TOPIC_MASTERED_AT).length / topicEntries.length) * 100)
    : 0

  const score = clamp(mockPart * 0.4 + codingPart * 0.3 + topicPart * 0.3)

  const weakest = topicEntries.length ? [...topicEntries].sort((a, b) => a[1] - b[1])[0] : null
  const weakestTopic = weakest ? weakest[0] : null

  const tips = []
  if (mockPart < 60) tips.push('Làm một buổi Mock Interview đầy đủ để có điểm tổng đáng tin cậy hơn.')
  if (codingPart < 50) tips.push(`Giải thêm bài coding — mới xong ${solvedCount}/${totalChallenges} bài.`)
  if (weakest) tips.push(`Ôn thêm chủ đề "${topicLabel(weakest[0])}" (đang thấp nhất, ${weakest[1]} điểm).`)
  if (!tips.length) tips.push('Đã khá sẵn sàng — thử thêm buổi mock có giờ để quen áp lực thời gian thật.')

  return { score, mockPart, codingPart, topicPart, weakestTopic, tips: tips.slice(0, 3) }
}

/** Nhãn ngắn theo mốc điểm — dùng hiển thị màu/trạng thái. */
export function readinessLabel(score) {
  if (score >= 80) return 'Sẵn sàng'
  if (score >= 60) return 'Gần sẵn sàng'
  if (score >= 35) return 'Cần ôn thêm'
  return 'Mới bắt đầu'
}
