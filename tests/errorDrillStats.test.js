import { describe, it, expect, beforeEach } from 'vitest'
import {
  writingErrorsOfWeek,
  manualErrorsOfWeek,
  quizErrorsOfWeek,
  collectWeekErrors,
  sanitizeDrillQuestions,
} from '@/lib/errorDrillStats'

// Bước 5.4 KE_HOACH_CAI_TIEN_WEBSITE.md — gom lỗi thật của tuần (bài viết đã
// chữa + Sổ lỗi + câu quiz sai) để làm đầu vào cho AI sinh bài tập cá nhân hóa.
describe('errorDrillStats.js', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('writingErrorsOfWeek', () => {
    it('chỉ lấy lỗi (!ok) đúng course:week, bỏ qua tuần/khóa khác + câu đã đúng', () => {
      const writings = {
        'ielts:2:1': { review: { lines: [
          { original: 'I go to school yesterday.', corrected: 'I went to school yesterday.', ok: false, note: 'quá khứ' },
          { original: 'She is happy.', corrected: 'She is happy.', ok: true, note: '' },
        ] } },
        'ielts:2:3': { review: { lines: [
          { original: 'He dont like it.', corrected: 'He doesn\'t like it.', ok: false, note: 'ngôi 3' },
        ] } },
        'ielts:3:1': { review: { lines: [{ original: 'X', corrected: 'Y', ok: false, note: '' }] } },
        'java:2:1': { review: { lines: [{ original: 'X', corrected: 'Y', ok: false, note: '' }] } },
      }
      const out = writingErrorsOfWeek(writings, 'ielts', 2)
      expect(out).toEqual([
        { wrong: 'I go to school yesterday.', right: 'I went to school yesterday.', note: 'quá khứ' },
        { wrong: 'He dont like it.', right: "He doesn't like it.", note: 'ngôi 3' },
      ])
    })

    it('bỏ qua khi corrected trùng original hoặc thiếu review', () => {
      const writings = {
        'ielts:1:1': { review: { lines: [{ original: 'Same.', corrected: 'Same.', ok: false, note: '' }] } },
        'ielts:1:2': {},
        'ielts:1:3': { review: null },
      }
      expect(writingErrorsOfWeek(writings, 'ielts', 1)).toEqual([])
    })

    it('rỗng an toàn khi thiếu writings', () => {
      expect(writingErrorsOfWeek(undefined, 'ielts', 1)).toEqual([])
    })
  })

  describe('manualErrorsOfWeek', () => {
    it('gom qua nhiều buổi bằng hàm đọc tiêm vào, bỏ mục thiếu wrong/right', () => {
      const store = {
        '1:1': [{ wrong: 'a', right: 'b', note: 'n1' }, { wrong: '', right: 'c' }],
        '1:2': [{ wrong: 'd', right: 'e' }],
        '1:3': [],
      }
      const readManualDay = (week, day) => store[`${week}:${day}`] || []
      const out = manualErrorsOfWeek(1, 3, readManualDay)
      expect(out).toEqual([
        { wrong: 'a', right: 'b', note: 'n1' },
        { wrong: 'd', right: 'e', note: '' },
      ])
    })

    it('không lỗi khi totalDays = 0/undefined', () => {
      expect(manualErrorsOfWeek(1, 0, () => [{ wrong: 'a', right: 'b' }])).toEqual([])
      expect(manualErrorsOfWeek(1, undefined, () => [{ wrong: 'a', right: 'b' }])).toEqual([])
    })

    it('mặc định đọc thật từ localStorage theo khóa error-ledger-w{week}-d{day}', () => {
      localStorage.setItem('error-ledger-w4-d1', JSON.stringify([{ wrong: 'x', right: 'y', note: 'z' }]))
      expect(manualErrorsOfWeek(4, 1)).toEqual([{ wrong: 'x', right: 'y', note: 'z' }])
    })
  })

  describe('quizErrorsOfWeek', () => {
    it('gom đúng scope week/gday/vday của ĐÚNG tuần, bỏ qua tuần khác + khóa khác', () => {
      const quizScores = {
        'ielts:week:5': { wrong: [{ q: 'Fill: I ___ happy.', correct: 'am', ex: 'to be' }] },
        'ielts:gday:5:2': { wrong: [{ q: 'She ___ (go) home.', correct: 'goes', ex: 'ngôi 3' }] },
        'ielts:vday:5:3': { wrong: [{ q: 'Meaning of "brief"?', correct: 'ngắn gọn', ex: '' }] },
        'ielts:week:6': { wrong: [{ q: 'other week', correct: 'x', ex: '' }] },
        'ielts:gday:6:1': { wrong: [{ q: 'other week gday', correct: 'x', ex: '' }] },
        'java:week:5': { wrong: [{ q: 'other course', correct: 'x', ex: '' }] },
      }
      const out = quizErrorsOfWeek(quizScores, 'ielts', 5)
      expect(out).toEqual([
        { wrong: 'Fill: I ___ happy.', right: 'am', note: 'to be' },
        { wrong: 'She ___ (go) home.', right: 'goes', note: 'ngôi 3' },
        { wrong: 'Meaning of "brief"?', right: 'ngắn gọn', note: '' },
      ])
    })

    it('bỏ qua mục wrong thiếu q hoặc correct', () => {
      const quizScores = { 'ielts:week:1': { wrong: [{ q: '', correct: 'x' }, { q: 'y', correct: '' }, {}] } }
      expect(quizErrorsOfWeek(quizScores, 'ielts', 1)).toEqual([])
    })
  })

  describe('collectWeekErrors', () => {
    it('gộp cả 3 nguồn, khử trùng lặp (wrong+right giống nhau, không phân biệt hoa/thường)', () => {
      const writings = {
        'ielts:1:1': { review: { lines: [{ original: 'He go home.', corrected: 'He goes home.', ok: false, note: 'n' }] } },
      }
      const quizScores = {
        // trùng đúng cặp wrong/right (khác hoa/thường) với lỗi viết -> chỉ giữ 1
        'ielts:week:1': { wrong: [{ q: 'HE GO HOME.', correct: 'he goes home.', ex: 'trùng' }] },
      }
      const readManualDay = (week, day) => (day === 1 ? [{ wrong: 'She go.', right: 'She goes.', note: '' }] : [])
      const out = collectWeekErrors({ writings, quizScores, course: 'ielts', week: 1, totalDays: 2, readManualDay })
      expect(out).toHaveLength(2)
      expect(out[0]).toEqual({ wrong: 'He go home.', right: 'He goes home.', note: 'n' })
      expect(out[1]).toEqual({ wrong: 'She go.', right: 'She goes.', note: '' })
    })

    it('cắt tối đa 15 mục dù nguồn có nhiều hơn', () => {
      const writings = {}
      const lines = Array.from({ length: 20 }, (_, i) => ({
        original: `Wrong ${i}`,
        corrected: `Right ${i}`,
        ok: false,
        note: '',
      }))
      writings['ielts:1:1'] = { review: { lines } }
      const out = collectWeekErrors({ writings, quizScores: {}, course: 'ielts', week: 1, totalDays: 0 })
      expect(out).toHaveLength(15)
    })
  })

  describe('sanitizeDrillQuestions', () => {
    it('giữ đúng câu cloze/error hợp lệ, bỏ mục hỏng, cắt tối đa 5', () => {
      const raw = [
        { type: 'cloze', q: 'I ___ a student.', answer: ['am'], ex: 'to be' },
        { type: 'error', q: 'She dont like it.', answer: ["She doesn't like it."], ex: 'ngôi 3' },
        { type: 'mcq', q: 'invalid type', answer: ['x'] }, // sai type -> bỏ
        { type: 'cloze', q: '', answer: ['x'] }, // q rỗng -> bỏ
        { type: 'cloze', q: 'no answer', answer: [] }, // answer rỗng -> bỏ
        { type: 'cloze', q: 'bad answer', answer: [123, ''] }, // answer không phải string hợp lệ -> bỏ
        { type: 'cloze', q: '3', answer: ['a'] },
        { type: 'cloze', q: '4', answer: ['a'] },
        { type: 'cloze', q: '5', answer: ['a'] },
        { type: 'cloze', q: '6 (thừa, phải bị cắt)', answer: ['a'] },
      ]
      const out = sanitizeDrillQuestions(raw)
      expect(out).toHaveLength(5)
      expect(out[0]).toEqual({ type: 'cloze', q: 'I ___ a student.', answer: ['am'], ex: 'to be' })
      expect(out[1]).toEqual({ type: 'error', q: 'She dont like it.', answer: ["She doesn't like it."], ex: 'ngôi 3' })
      expect(out.some((q) => q.q.includes('thừa'))).toBe(false)
    })

    it('rỗng an toàn khi AI trả về không phải mảng', () => {
      expect(sanitizeDrillQuestions(null)).toEqual([])
      expect(sanitizeDrillQuestions('not an array')).toEqual([])
      expect(sanitizeDrillQuestions(undefined)).toEqual([])
    })
  })
})
