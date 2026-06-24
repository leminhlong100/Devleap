import { describe, it, expect } from 'vitest'
import { getIeltsDay, getIeltsWeek, computeIeltsStatuses } from '@/data/courseIelts'

describe('getIeltsDay() — ngữ pháp chia theo ngày', () => {
  const week = getIeltsWeek(1)
  const G = week.grammar
  const totalDays = week.days.length

  it('ngày học mới: mỗi ngày MỘT điểm ngữ pháp, theo thứ tự', () => {
    const d1 = getIeltsDay(1, 1)
    const d2 = getIeltsDay(1, 2)
    expect(d1.grammarMode).toBe('new')
    expect(d1.grammar).toHaveLength(1)
    expect(d1.grammar[0].title).toBe(G[0].title)
    expect(d2.grammar[0].title).toBe(G[1].title)
    expect(d2.grammar[0].title).not.toBe(d1.grammar[0].title) // KHÔNG lặp như cũ
  })

  it('ngày cuối tuần: tổng hợp lại toàn bộ điểm ngữ pháp', () => {
    const last = getIeltsDay(1, totalDays)
    expect(last.grammarMode).toBe('final')
    expect(last.grammar.length).toBe(G.length)
    expect(last.grammar.every((g) => g.isReview)).toBe(true)
  })

  it('ngày giữa là ngày ÔN xoay vòng MỘT điểm (mỗi ngày một điểm khác)', () => {
    // tuần 1 có 3 điểm ngữ pháp -> ngày 4 (idx 3) ôn lại điểm idx%n = 0
    if (totalDays > G.length + 1) {
      const review = getIeltsDay(1, G.length + 1)
      expect(review.grammarMode).toBe('review')
      expect(review.grammar.length).toBe(1) // chỉ một điểm trọng tâm, không lặp cả tuần
      expect(review.grammar[0].title).toBe(G[3 % G.length].title)
    }
  })

  it('MỖI NGÀY đều có bài tập (luyện ngữ pháp + bài viết) — không ngày nào trống', () => {
    for (let n = 1; n <= totalDays; n++) {
      const d = getIeltsDay(1, n)
      expect(d.grammarDrills.length, `ngày ${n} thiếu bài luyện`).toBeGreaterThan(0)
      expect(d.grammarDrills.length).toBeLessThanOrEqual(12)
      expect(d.writingTask, `ngày ${n} thiếu bài viết`).toBeTruthy()
      expect(d.writingTask.prompt.length, `ngày ${n} đề viết rỗng`).toBeGreaterThan(5)
    }
  })

  it('đề bài viết KHÔNG còn yêu cầu "gạch chân" (không làm được trong ô viết)', () => {
    for (let n = 1; n <= totalDays; n++) {
      expect(getIeltsDay(1, n).writingTask.prompt.toLowerCase()).not.toContain('gạch chân')
    }
  })
})

describe('computeIeltsStatuses() — pass hết mới mở tuần kế', () => {
  const w1 = getIeltsWeek(1)
  const allDaysW1 = w1.days.map((d) => `1:${d.n}`)

  it('xong hết ngày nhưng CHƯA đạt bài kiểm tra tuần -> tuần 2 vẫn khóa', () => {
    const st = computeIeltsStatuses(allDaysW1, () => false) // chưa đạt test tuần nào
    expect(st[1]).toBe('current') // tuần 1 chưa "done" vì chưa đạt test
    expect(st[2]).toBe('locked')
  })

  it('xong hết ngày VÀ đạt bài kiểm tra tuần 1 -> tuần 2 mở', () => {
    const st = computeIeltsStatuses(allDaysW1, (n) => n === 1)
    expect(st[1]).toBe('done')
    expect(st[2]).toBe('current')
  })
})
