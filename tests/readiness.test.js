import { describe, it, expect } from 'vitest'
import { computeReadiness, readinessLabel } from '../src/lib/readiness.js'
import { CODING_CHALLENGES, QUESTION_BANK } from '../src/data/javaInterview.js'
import { PROFILE_QUESTIONS } from '../src/data/profileQuestions.js'

describe('lib/readiness — computeReadiness', () => {
  it('đầu vào rỗng -> điểm 0, có gợi ý', () => {
    const r = computeReadiness({})
    expect(r.score).toBe(0)
    expect(r.tips.length).toBeGreaterThan(0)
  })

  it('đầu vào cố định -> điểm cố định (công thức mới: câu ôn 40% + coding 25% + mock 25% + hồ sơ 10%)', () => {
    const halfCoding = CODING_CHALLENGES.slice(0, Math.round(CODING_CHALLENGES.length / 2)).map((c) => c.id)
    const halfQuestions = QUESTION_BANK.slice(0, Math.round(QUESTION_BANK.length / 2)).map((q) => q.id)
    const halfProfile = PROFILE_QUESTIONS.slice(0, Math.round(PROFILE_QUESTIONS.length / 2)).map((q) => q.id)
    const r = computeReadiness({
      bestScore: 80,
      topicScores: { jpa: 80, core: 40 },
      solvedChallenges: halfCoding,
      studiedQuestions: halfQuestions,
      mocksTaken: 1, // mục tiêu toàn khóa = 2 (Ngày 14) -> 50%
      profilePrepared: halfProfile,
    })
    const expectedReviewed = Math.round((halfQuestions.length / QUESTION_BANK.length) * 100)
    const expectedCoding = Math.round((halfCoding.length / CODING_CHALLENGES.length) * 100)
    const expectedProfile = Math.round((halfProfile.length / PROFILE_QUESTIONS.length) * 100)
    const expectedScore = Math.round(expectedReviewed * 0.4 + expectedCoding * 0.25 + 50 * 0.25 + expectedProfile * 0.1)
    expect(r.reviewedPart).toBe(expectedReviewed)
    expect(r.codingPart).toBe(expectedCoding)
    expect(r.mockPart).toBe(50)
    expect(r.profilePart).toBe(expectedProfile)
    expect(r.score).toBe(expectedScore)
  })

  it('chỉ ra chủ đề yếu nhất (khi 4 phần công thức đã ổn, tip còn lại nhắc đúng chủ đề yếu)', () => {
    const r = computeReadiness({
      topicScores: { jpa: 90, core: 30, spring: 60 },
      studiedQuestions: QUESTION_BANK.map((q) => q.id),
      solvedChallenges: CODING_CHALLENGES.map((c) => c.id),
      mocksTaken: 2,
      profilePrepared: PROFILE_QUESTIONS.map((q) => q.id),
    })
    expect(r.weakestTopic).toBe('core')
    expect(r.tips.some((t) => t.toLowerCase().includes('core'))).toBe(true)
  })

  it('điểm cao mọi mặt -> không còn gợi ý "làm thêm", chỉ còn khích lệ', () => {
    const allCoding = CODING_CHALLENGES.map((c) => c.id)
    const allQuestions = QUESTION_BANK.map((q) => q.id)
    const allProfile = PROFILE_QUESTIONS.map((q) => q.id)
    const r = computeReadiness({
      bestScore: 90,
      topicScores: { jpa: 90, core: 85 },
      solvedChallenges: allCoding,
      studiedQuestions: allQuestions,
      mocksTaken: 2,
      profilePrepared: allProfile,
    })
    expect(r.score).toBe(100)
    expect(r.tips).toHaveLength(1)
  })

  it('tips tối đa 3 dòng', () => {
    const r = computeReadiness({ bestScore: 0, topicScores: { jpa: 10 }, solvedChallenges: [] })
    expect(r.tips.length).toBeLessThanOrEqual(3)
  })

  it('mock đã làm đủ mục tiêu toàn khóa (2 buổi) -> mockPart 100%, thêm buổi nữa không vượt quá 100', () => {
    expect(computeReadiness({ mocksTaken: 2 }).mockPart).toBe(100)
    expect(computeReadiness({ mocksTaken: 5 }).mockPart).toBe(100)
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
