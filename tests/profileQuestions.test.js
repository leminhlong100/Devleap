import { describe, it, expect } from 'vitest'
import { PROFILE_QUESTIONS } from '../src/data/profileQuestions.js'

describe('data/profileQuestions — tủ câu hỏi hồ sơ của tôi', () => {
  it('15 câu, id duy nhất, đủ các phần hiển thị trong UI', () => {
    expect(PROFILE_QUESTIONS.length).toBe(15)
    const ids = PROFILE_QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const q of PROFILE_QUESTIONS) {
      expect(['critical', 'high', 'medium'], `priority ${q.id}`).toContain(q.priority)
      for (const k of ['question', 'whyAsked', 'placeholder']) {
        expect(typeof q[k], `${q.id}.${k}`).toBe('string')
        expect(q[k].length, `${q.id}.${k}`).toBeGreaterThan(0)
      }
      expect(Array.isArray(q.answerFramework) && q.answerFramework.length > 0, `${q.id}.answerFramework`).toBe(true)
    }
  })

  // `myFacts` = chất liệu thật lấy từ docs/me, để lúc viết câu trả lời không phải
  // ngồi nhớ lại số liệu. Mọi câu phải có, nếu không thì câu đó lại thành chung chung.
  it('mọi câu đều có chất liệu thật (myFacts) không rỗng', () => {
    for (const q of PROFILE_QUESTIONS) {
      expect(Array.isArray(q.myFacts), `${q.id}.myFacts`).toBe(true)
      expect(q.myFacts.length, `${q.id}.myFacts`).toBeGreaterThanOrEqual(3)
      for (const f of q.myFacts) {
        expect(typeof f).toBe('string')
        expect(f.length).toBeGreaterThan(20)
      }
    }
  })

  it('chất liệu thật có neo được vào ticket/số liệu tra lại được ở docs/me', () => {
    const blob = PROFILE_QUESTIONS.flatMap((q) => q.myFacts).join(' ')
    for (const fact of ['#41518', '#41421', '#41714', '4.151.927', '−1,1%', '171,5']) {
      expect(blob.includes(fact), `thiếu neo: ${fact}`).toBe(true)
    }
  })

  it('chỗ chưa có dữ liệu thì ghi rõ [Cần xác nhận: …] chứ không đoán số', () => {
    const withGap = PROFILE_QUESTIONS.filter((q) => q.myFacts.some((f) => f.includes('[')))
    expect(withGap.length).toBeGreaterThan(0)
    for (const q of withGap) {
      for (const f of q.myFacts.filter((x) => x.includes('['))) {
        expect(f, `${q.id} nhãn thiếu dữ liệu`).toMatch(/\[Cần xác nhận:/)
      }
    }
  })
})
