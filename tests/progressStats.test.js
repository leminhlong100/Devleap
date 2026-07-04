import { describe, it, expect } from 'vitest'
import { writingSeries, writingSummary, speakingWeeklyMinutes, srsRetention } from '@/lib/progressStats'

describe('progressStats — writingSeries', () => {
  it('chỉ lấy bài đã done + có review, đúng course', () => {
    const writings = {
      'ielts:1:1': { done: true, review: { score: 60, cefr: 'A1' }, at: '2026-1-5' },
      'ielts:1:2': { done: false, review: { score: 70, cefr: 'A1' }, at: '2026-1-6' }, // chưa done
      'ielts:2:1': { done: true, review: null, at: '2026-1-10' }, // chưa chữa
      'java:1:1': { done: true, review: { score: 90, cefr: 'B1' }, at: '2026-1-1' }, // khác course
    }
    const rows = writingSeries(writings, 'ielts')
    expect(rows).toEqual([{ key: 'ielts:1:1', week: 1, day: 1, at: '2026-1-5', score: 60, cefr: 'A1' }])
  })
  it('sắp theo tuần/ngày (thứ tự buổi học), không theo ngày nộp thật', () => {
    const writings = {
      'ielts:3:1': { done: true, review: { score: 80, cefr: 'A2' }, at: '2026-1-1' }, // nộp sớm nhất nhưng buổi sau
      'ielts:1:2': { done: true, review: { score: 50, cefr: 'A1' }, at: '2026-1-20' },
      'ielts:1:1': { done: true, review: { score: 40, cefr: 'A1' }, at: '2026-1-25' },
    }
    const rows = writingSeries(writings, 'ielts')
    expect(rows.map((r) => r.key)).toEqual(['ielts:1:1', 'ielts:1:2', 'ielts:3:1'])
  })
  it('bỏ qua key sai định dạng và score không phải số', () => {
    const writings = {
      'ielts:x:1': { done: true, review: { score: 50 } },
      'ielts:2:2': { done: true, review: { score: 'oops' } },
    }
    expect(writingSeries(writings, 'ielts')).toEqual([])
  })
  it('rỗng khi không có writings', () => {
    expect(writingSeries({}, 'ielts')).toEqual([])
    expect(writingSeries(undefined, 'ielts')).toEqual([])
  })
})

describe('progressStats — writingSummary', () => {
  it('rỗng khi chưa có bài nào', () => {
    expect(writingSummary([])).toEqual({ latest: null, first: null, delta: null, count: 0 })
  })
  it('1 bài: có latest/first nhưng delta null (chưa đủ so sánh)', () => {
    const s = [{ key: 'ielts:1:1', week: 1, day: 1, score: 60, cefr: 'A1' }]
    const sum = writingSummary(s)
    expect(sum.count).toBe(1)
    expect(sum.delta).toBeNull()
    expect(sum.latest).toBe(s[0])
    expect(sum.first).toBe(s[0])
  })
  it('nhiều bài: delta = điểm mới nhất - điểm đầu tiên', () => {
    const s = [
      { key: 'ielts:1:1', week: 1, day: 1, score: 50 },
      { key: 'ielts:2:1', week: 2, day: 1, score: 55 },
      { key: 'ielts:3:1', week: 3, day: 1, score: 72 },
    ]
    const sum = writingSummary(s)
    expect(sum.delta).toBe(22)
    expect(sum.latest.score).toBe(72)
    expect(sum.first.score).toBe(50)
    expect(sum.count).toBe(3)
  })
})

describe('progressStats — speakingWeeklyMinutes', () => {
  it('gộp đúng theo tuần (mốc Thứ Hai) và sắp tăng dần', () => {
    // 2026-01-05 là Thứ Hai; 2026-01-06 cùng tuần; 2026-01-12 là Thứ Hai tuần sau.
    const log = { '2026-1-5': 120, '2026-1-6': 60, '2026-1-12': 300 }
    expect(speakingWeeklyMinutes(log)).toEqual([
      { weekStart: '2026-01-05', minutes: 3 },
      { weekStart: '2026-01-12', minutes: 5 },
    ])
  })
  it('bỏ qua giá trị 0/rỗng và ngày không parse được', () => {
    const log = { '2026-1-5': 0, 'bad-date': 100, '2026-1-6': 90 }
    expect(speakingWeeklyMinutes(log)).toEqual([{ weekStart: '2026-01-05', minutes: 2 }])
  })
  it('rỗng khi không có dữ liệu', () => {
    expect(speakingWeeklyMinutes({})).toEqual([])
  })
})

describe('progressStats — srsRetention', () => {
  it('null khi chưa đủ thẻ đã ôn thật (dưới minCards)', () => {
    const srs = {
      a: { reps: 2, lapses: 0, last: '2026-1-1' },
      b: { reps: 0, lapses: 0, last: null }, // chỉ mới "gieo" tự động, chưa ai đụng tới
    }
    expect(srsRetention(srs, 5)).toBeNull()
  })
  it('tính đúng % thẻ đang nhớ tốt (reps > 0) trong số thẻ đã ôn thật', () => {
    const srs = {
      a: { reps: 3, lapses: 0, last: '2026-1-1' }, // nhớ tốt
      b: { reps: 0, lapses: 1, last: '2026-1-1' }, // vừa quên
      c: { reps: 1, lapses: 1, last: '2026-1-2' }, // đã quên rồi ôn lại thành công
      d: { reps: 0, lapses: 0, last: null }, // chưa ai đụng tới — không tính
      e: { reps: 2, lapses: 0, last: '2026-1-3' },
    }
    const r = srsRetention(srs, 4)
    expect(r).toEqual({ pct: 75, total: 4 })
  })
  it('rỗng/không có srs -> null', () => {
    expect(srsRetention({}, 1)).toBeNull()
    expect(srsRetention(undefined, 1)).toBeNull()
  })
})
