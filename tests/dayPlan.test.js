import { describe, it, expect } from 'vitest'
import { planFromChecklist, requiredSentencesFor } from '@/lib/dayPlan'
import { getIeltsDay, getIeltsWeek } from '@/data/courseIelts'

describe('planFromChecklist() — chia tải theo kế hoạch ngày (hết quá tải)', () => {
  it('checklist rỗng -> hiện đầy đủ (an toàn ngược)', () => {
    const p = planFromChecklist([])
    expect(Object.values(p).every(Boolean)).toBe(true)
  })

  it('Tuần 1 Ngày 1 GỌN: ngữ pháp + viết, KHÔNG từ vựng/quiz/nghe', () => {
    const p = planFromChecklist(getIeltsDay(1, 1).checklist)
    expect(p.grammar).toBe(true)
    expect(p.writing).toBe(true)
    expect(p.vocab).toBe(false)
    expect(p.quiz).toBe(false)
    expect(p.listening).toBe(false)
    expect(p.flashcards).toBe(false)
  })

  it('Tuần 1 Ngày 4 (phòng từ vựng) MỞ từ vựng + flashcard', () => {
    const p = planFromChecklist(getIeltsDay(1, 4).checklist)
    expect(p.vocab).toBe(true)
    expect(p.flashcards).toBe(true)
  })

  it('không ngày nào của Tuần 1 hiện trọn 10 khối — đã giảm tải thật sự', () => {
    const week = getIeltsWeek(1)
    for (const day of week.days) {
      const p = planFromChecklist(getIeltsDay(1, day.n).checklist)
      const on = Object.values(p).filter(Boolean).length
      expect(on, `ngày ${day.n} vẫn quá tải`).toBeLessThan(10)
      expect(on, `ngày ${day.n} trống rỗng`).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('requiredSentencesFor() — số câu bắt buộc rút từ đề bài viết', () => {
  it('rút đúng số câu trong đề', () => {
    expect(requiredSentencesFor('Viết 10 câu về bản thân em.')).toBe(10)
    expect(requiredSentencesFor('Viết 5 câu.')).toBe(5)
  })
  it('kẹp trong khoảng 3..20', () => {
    expect(requiredSentencesFor('Viết 1 câu.')).toBe(3)
    expect(requiredSentencesFor('Viết 99 câu.')).toBe(20)
  })
  it('không có số câu trong đề -> mặc định 3', () => {
    expect(requiredSentencesFor('Viết về bản thân em.')).toBe(3)
    expect(requiredSentencesFor('')).toBe(3)
    expect(requiredSentencesFor(undefined)).toBe(3)
  })
})
