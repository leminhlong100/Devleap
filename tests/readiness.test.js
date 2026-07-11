import { describe, it, expect } from 'vitest'
import { computeReadiness, readinessLabel } from '../src/lib/readiness.js'
import { CODING_CHALLENGES } from '../src/data/javaInterview.js'

describe('lib/readiness — computeReadiness', () => {
  it('đầu vào rỗng -> điểm 0, có gợi ý', () => {
    const r = computeReadiness({})
    expect(r.score).toBe(0)
    expect(r.tips.length).toBeGreaterThan(0)
  })

  it('đầu vào cố định -> điểm cố định (công thức 40/30/30)', () => {
    const half = CODING_CHALLENGES.slice(0, Math.round(CODING_CHALLENGES.length / 2)).map((c) => c.id)
    const r = computeReadiness({
      bestScore: 80,
      topicScores: { jpa: 80, core: 40 }, // 1/2 topic >= 70 -> topicPart = 50
      solvedChallenges: half,
    })
    const expectedCoding = Math.round((half.length / CODING_CHALLENGES.length) * 100)
    const expectedScore = Math.round(80 * 0.4 + expectedCoding * 0.3 + 50 * 0.3)
    expect(r.mockPart).toBe(80)
    expect(r.topicPart).toBe(50)
    expect(r.codingPart).toBe(expectedCoding)
    expect(r.score).toBe(expectedScore)
  })

  it('chỉ ra chủ đề yếu nhất', () => {
    const r = computeReadiness({ topicScores: { jpa: 90, core: 30, spring: 60 } })
    expect(r.weakestTopic).toBe('core')
    expect(r.tips.some((t) => t.includes('core'.toUpperCase()) || t.toLowerCase().includes('core') || t.includes('Core'))).toBe(
      true,
    )
  })

  it('điểm cao mọi mặt -> không còn gợi ý "làm thêm", chỉ còn khích lệ', () => {
    const allIds = CODING_CHALLENGES.map((c) => c.id)
    const r = computeReadiness({ bestScore: 90, topicScores: { jpa: 90, core: 85 }, solvedChallenges: allIds })
    expect(r.score).toBeGreaterThanOrEqual(85)
    expect(r.tips).toHaveLength(1)
  })

  it('tips tối đa 3 dòng', () => {
    const r = computeReadiness({ bestScore: 0, topicScores: { jpa: 10 }, solvedChallenges: [] })
    expect(r.tips.length).toBeLessThanOrEqual(3)
  })
})

describe('lib/readiness — readinessLabel', () => {
  it('map điểm sang nhãn đúng mốc', () => {
    expect(readinessLabel(90)).toBe('Sẵn sàng')
    expect(readinessLabel(80)).toBe('Sẵn sàng')
    expect(readinessLabel(65)).toBe('Gần sẵn sàng')
    expect(readinessLabel(40)).toBe('Cần ôn thêm')
    expect(readinessLabel(10)).toBe('Mới bắt đầu')
  })
})
