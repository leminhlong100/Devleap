import { describe, it, expect } from 'vitest'
import { buildContentTree } from '@/lib/adminContentTree'

/**
 * Đợt 3 — Cây nội dung tĩnh (read-only). Kiểm tra bộ dựng cây với fixture nhẹ:
 * gộp Khóa → Tuần → Buổi, đếm đúng chỉ số ở cấp buổi (Java giàu) và cấp tuần
 * (Comm có tình huống). Truyền dữ liệu nên không phụ thuộc bản parse thật.
 */
const javaFix = [
  {
    num: 1,
    title: 'Java Core',
    days: [
      { n: 1, title: 'OOP', emoji: '☕', vocab: ['a', 'b'], quiz: [{}], questions: [{}] },
      { n: 2, title: 'Collections', exercises: [{}, {}] },
    ],
  },
]
const commFix = [
  {
    num: 1,
    title: 'Đời sống',
    scenarios: [{}, {}],
    days: [{ n: 1, title: 'Chào hỏi', checklist: [{}, {}, {}] }],
  },
]

describe('buildContentTree', () => {
  const tree = buildContentTree({ java: javaFix, ielts: [], comm: commFix })

  it('3 khóa đúng thứ tự java/ielts/comm + đường dẫn file', () => {
    expect(tree.map((c) => c.key)).toEqual(['java', 'ielts', 'comm'])
    expect(tree[0].file).toBe('weeks/*.md')
    expect(tree[2].file).toBe('Comm_English/*.md')
  })

  it('tổng số tuần/buổi', () => {
    expect(tree[0].totals).toEqual({ weeks: 1, days: 2 })
    expect(tree[1].totals).toEqual({ weeks: 0, days: 0 })
  })

  it('badges cấp buổi (Java): đếm từ/quiz/câu hỏi, bỏ mảng rỗng', () => {
    const d1 = tree[0].weeks[0].days[0]
    expect(d1.badges).toEqual([
      { label: 'từ', n: 2 },
      { label: 'câu hỏi', n: 1 },
      { label: 'quiz', n: 1 },
    ])
    expect(tree[0].weeks[0].days[1].badges).toEqual([{ label: 'bài tập', n: 2 }])
  })

  it('badges cấp tuần (Comm): tình huống; buổi: mục checklist', () => {
    expect(tree[2].weeks[0].badges).toEqual([{ label: 'tình huống', n: 2 }])
    expect(tree[2].weeks[0].days[0].badges).toEqual([{ label: 'mục', n: 3 }])
  })
})
