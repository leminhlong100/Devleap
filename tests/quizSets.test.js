import { describe, it, expect } from 'vitest'
import { getWeekQuiz, getFinalQuiz, getQuizSet, weekQuizCount } from '@/data/quizSets'

// Các bài kiểm tra này chạy trên dữ liệu thật (parse từ weeks/*.md & Base_English/*.md
// qua import.meta.glob), nên chỉ kiểm tra bất biến về cấu trúc, không hard-code nội dung.

const isQuestion = (q) =>
  q && typeof q.q === 'string' && Array.isArray(q.opts) && typeof q.correct === 'number'

describe('quizSets — getWeekQuiz', () => {
  it('Java tuần 1: gom câu hỏi các ngày thành bộ đề có scope "week:1"', () => {
    const set = getWeekQuiz('java', 1)
    expect(set).toBeTruthy()
    expect(set.scope).toBe('week:1')
    expect(set.course).toBe('java')
    expect(set.questions.length).toBeGreaterThan(0)
    expect(set.questions.every(isQuestion)).toBe(true)
    expect(set.objectives.length).toBeGreaterThan(0) // tiêu đề các ngày
  })

  it('IELTS tuần 1: dùng ngân hàng đề cấp tuần (weekQuiz)', () => {
    const set = getWeekQuiz('ielts', 1)
    expect(set).toBeTruthy()
    expect(set.scope).toBe('week:1')
    expect(set.questions.every(isQuestion)).toBe(true)
  })

  it('Giao Tiếp tuần 1: dùng ngân hàng đề cấp tuần (weekQuiz)', () => {
    const set = getWeekQuiz('comm', 1)
    expect(set).toBeTruthy()
    expect(set.scope).toBe('week:1')
    expect(set.course).toBe('comm')
    expect(set.questions.every(isQuestion)).toBe(true)
  })

  it('tuần không tồn tại -> null', () => {
    expect(getWeekQuiz('java', 999)).toBeNull()
  })
})

describe('quizSets — getFinalQuiz & getQuizSet', () => {
  it('đề cuối khóa gom nhiều hơn một tuần', () => {
    const final = getFinalQuiz('java')
    const wk1 = getWeekQuiz('java', 1)
    expect(final).toBeTruthy()
    expect(final.scope).toBe('final')
    expect(final.questions.length).toBeGreaterThanOrEqual(wk1.questions.length)
  })

  it('getQuizSet ánh xạ scope dạng URL "week-1" và "final"', () => {
    expect(getQuizSet('java', 'week-1')?.scope).toBe('week:1')
    expect(getQuizSet('java', 'final')?.scope).toBe('final')
    expect(getQuizSet('java', 'bậy-bạ')).toBeNull()
  })

  it('getQuizSet ánh xạ scope khóa comm "week-1"', () => {
    expect(getQuizSet('comm', 'week-1')?.scope).toBe('week:1')
    expect(getQuizSet('comm', 'week-1')?.course).toBe('comm')
  })

  it('weekQuizCount đếm được số tuần có đề', () => {
    expect(weekQuizCount('java')).toBeGreaterThan(0)
    expect(weekQuizCount('ielts')).toBeGreaterThan(0)
    expect(weekQuizCount('comm')).toBeGreaterThan(0)
  })
})
