import { describe, it, expect } from 'vitest'
import { ieltsInput, getIeltsInput } from '@/data/ieltsInput'
import { getIeltsDay } from '@/data/courseIelts'

const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length

// Mọi câu hỏi (reading/listening) phải đúng định dạng QuizTool: { q, opts, correct }.
function expectValidQuestions(qs) {
  expect(Array.isArray(qs)).toBe(true)
  expect(qs.length).toBeGreaterThanOrEqual(2)
  expect(qs.length).toBeLessThanOrEqual(3)
  for (const q of qs) {
    expect(typeof q.q).toBe('string')
    expect(q.q.length).toBeGreaterThan(0)
    expect(Array.isArray(q.opts)).toBe(true)
    expect(q.opts.length).toBeGreaterThanOrEqual(3)
    expect(Number.isInteger(q.correct)).toBe(true)
    expect(q.correct).toBeGreaterThanOrEqual(0)
    expect(q.correct).toBeLessThan(q.opts.length) // index hợp lệ
  }
}

describe('ieltsInput — nguồn nhập thật (reading + listening)', () => {
  it('mỗi mục input có cấu trúc hợp lệ', () => {
    for (const [key, entry] of Object.entries(ieltsInput)) {
      if (entry.reading) {
        const r = entry.reading
        expect(r.text, `${key} reading thiếu text`).toBeTruthy()
        const wc = wordCount(r.text)
        expect(wc, `${key} reading ${wc} từ — ngoài khoảng 60–80`).toBeGreaterThanOrEqual(60)
        expect(wc).toBeLessThanOrEqual(80)
        expectValidQuestions(r.questions)
      }
      if (entry.listening) {
        const l = entry.listening
        // phải có nguồn phát: script (TTS) hoặc audioUrl (file thu thật)
        expect(l.script || l.audioUrl, `${key} listening thiếu nguồn phát`).toBeTruthy()
        expectValidQuestions(l.questions)
      }
    }
  })

  it('getIeltsInput() trả về null khi chưa có buổi', () => {
    expect(getIeltsInput(99, 99)).toBeNull()
  })
})

describe('getIeltsDay() gắn input của buổi', () => {
  it.each([1, 2, 3, 4, 5, 6, 7])('Tuần 1 · Buổi %i có cả bài đọc và bài nghe', (n) => {
    const d = getIeltsDay(1, n)
    expect(d.reading).toBeTruthy()
    expect(d.reading.questions.length).toBeGreaterThanOrEqual(2)
    expect(d.listening).toBeTruthy()
    expect(d.listening.questions.length).toBeGreaterThanOrEqual(2)
  })

  it('Tuần 1 nạp input ở CẢ 7 buổi (cân bằng 4 kỹ năng mỗi ngày)', () => {
    const withInput = [1, 2, 3, 4, 5, 6, 7].filter((n) => getIeltsDay(1, n).reading || getIeltsDay(1, n).listening)
    expect(withInput).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('buổi chưa curate input -> reading/listening = null (không vỡ)', () => {
    // Tuần 2+ chưa soạn nguồn nhập -> phải trả null an toàn, không ném lỗi.
    const d = getIeltsDay(2, 1)
    expect(d.reading).toBeNull()
    expect(d.listening).toBeNull()
  })
})
