/**
 * Helper thuần cho Mock Interview (tách khỏi useMockInterview.js để test được
 * không cần Vue) — chọn bài coding chèn vào buổi, format câu trả lời coding gửi
 * AI chấm, format đồng hồ đếm ngược, và các preset buổi phỏng vấn.
 */
import { CODING_CHALLENGES } from '@/data/javaInterview'

/** Chọn `count` bài coding để chèn vào buổi mock (mặc định tránh mức 'hard' cho vừa giờ). */
export function pickCodingChallenges(count, { level } = {}) {
  const n = Math.max(0, Math.floor(Number(count) || 0))
  if (!n) return []
  const pool = CODING_CHALLENGES.filter((c) => (level ? c.level === level : c.level !== 'hard'))
  const source = pool.length >= n ? pool : CODING_CHALLENGES
  return source.slice(0, n)
}

/** "MM:SS", không âm. */
export function formatRemaining(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

/** Đóng gói code + kết quả chạy thành văn bản để gửi AI chấm như một câu trả lời. */
export function buildCodingAnswerText(challenge, code, result) {
  const status = result?.ok ? 'Chạy thành công' : result?.stage === 'compile' ? 'Lỗi biên dịch' : 'Lỗi khi chạy'
  const lines = [
    `[Bài coding: ${challenge.title}]`,
    'Code:',
    code,
    '',
    `Kết quả chạy (${status}):`,
    result?.stdout?.trim() || '(không có stdout)',
  ]
  if (result?.stderr?.trim()) lines.push(result.stderr.trim())
  return lines.join('\n')
}

/** Preset buổi phỏng vấn — dùng ở màn thiết lập MockInterviewView. */
export const MOCK_PRESETS = [
  { key: 'phone-screen', label: '⚡ Phone screen nhanh', blurb: '5 câu · 20 phút · không code', count: 5, durationMin: 20, codingCount: 0 },
  { key: 'full-loop', label: '🧩 Full loop', blurb: '10 câu · 45 phút · có 2 bài code', count: 10, durationMin: 45, codingCount: 2 },
]
