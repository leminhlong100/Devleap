import { describe, it, expect } from 'vitest'
import { pickCodingChallenges, formatRemaining, buildCodingAnswerText, MOCK_PRESETS } from '../src/lib/mockInterview.js'
import { CODING_CHALLENGES } from '../src/data/javaInterview.js'

describe('lib/mockInterview — pickCodingChallenges', () => {
  it('trả đúng số lượng, mặc định tránh mức hard', () => {
    const picked = pickCodingChallenges(3)
    expect(picked.length).toBe(3)
    expect(picked.every((c) => c.level !== 'hard')).toBe(true)
  })

  it('count = 0 hoặc âm -> mảng rỗng', () => {
    expect(pickCodingChallenges(0)).toEqual([])
    expect(pickCodingChallenges(-2)).toEqual([])
  })

  it('lọc theo level khi truyền vào', () => {
    const picked = pickCodingChallenges(2, { level: 'easy' })
    expect(picked.every((c) => c.level === 'easy')).toBe(true)
  })

  it('count lớn hơn pool phù hợp -> vẫn trả đủ (rơi về toàn bộ CODING_CHALLENGES)', () => {
    const picked = pickCodingChallenges(999)
    expect(picked.length).toBe(CODING_CHALLENGES.length)
  })
})

describe('lib/mockInterview — formatRemaining', () => {
  it('format mm:ss có padding', () => {
    expect(formatRemaining(65)).toBe('01:05')
    expect(formatRemaining(5)).toBe('00:05')
    expect(formatRemaining(600)).toBe('10:00')
  })

  it('không âm', () => {
    expect(formatRemaining(-10)).toBe('00:00')
    expect(formatRemaining(0)).toBe('00:00')
  })
})

describe('lib/mockInterview — buildCodingAnswerText', () => {
  const challenge = { title: 'FizzBuzz' }

  it('gồm tên bài, code, và stdout khi chạy thành công', () => {
    const text = buildCodingAnswerText(challenge, 'System.out.println(1);', { ok: true, stdout: '1\n', stderr: '' })
    expect(text).toContain('FizzBuzz')
    expect(text).toContain('System.out.println(1);')
    expect(text).toContain('Chạy thành công')
    expect(text).toContain('1')
  })

  it('báo lỗi biên dịch/runtime kèm stderr khi thất bại', () => {
    const text = buildCodingAnswerText(challenge, 'bad code', { ok: false, stage: 'compile', stdout: '', stderr: 'error: x' })
    expect(text).toContain('Lỗi biên dịch')
    expect(text).toContain('error: x')
  })
})

describe('lib/mockInterview — MOCK_PRESETS', () => {
  it('có phone-screen và full-loop với cấu hình hợp lý', () => {
    const keys = MOCK_PRESETS.map((p) => p.key)
    expect(keys).toContain('phone-screen')
    expect(keys).toContain('full-loop')
    const phone = MOCK_PRESETS.find((p) => p.key === 'phone-screen')
    expect(phone.count).toBe(5)
    expect(phone.durationMin).toBe(20)
    expect(phone.codingCount).toBe(0)
    const full = MOCK_PRESETS.find((p) => p.key === 'full-loop')
    expect(full.codingCount).toBeGreaterThan(0)
  })
})
