import { describe, it, expect } from 'vitest'
import { computeStats, ymdToDayNum } from '../netlify/functions/_adminStats.js'

/**
 * Đợt 2 — Dashboard. Kiểm tra phần thuần `computeStats` với mốc thời gian cố
 * định (tất định): tổng quan, phễu theo tuần, thống kê quiz, nội dung nổi bật.
 */
const NOW = Date.UTC(2026, 6, 11) // 2026-07-11

const authUsers = [
  { id: 'u1', created_at: '2026-07-10T00:00:00Z' }, // 1 ngày trước
  { id: 'u2', created_at: '2026-06-20T00:00:00Z' }, // 21 ngày trước
  { id: 'u3', created_at: '2026-01-01T00:00:00Z' }, // cũ
]
const progressRows = [
  {
    xp: 300,
    last_study_date: '2026-7-11', // hôm nay
    completed: { java: ['1:1', '1:2', '2:1'], ielts: [], comm: [] },
    quiz_scores: { 'java:week:1': { passed: true, pct: 90 }, 'java:gday:1:1': { passed: true, pct: 100 } },
  },
  {
    xp: 100,
    last_study_date: '2026-6-20', // 21 ngày trước
    completed: { java: ['1:1'], comm: ['1:1'] },
    quiz_scores: { 'java:week:1': { passed: false, pct: 40 } },
  },
  { xp: 50, last_study_date: '2026-5-1', completed: {}, quiz_scores: {} }, // cũ
]

describe('ymdToDayNum', () => {
  it('đổi "YYYY-M-D" không pad thành số ngày UTC', () => {
    expect(ymdToDayNum('2026-7-11')).toBe(Math.floor(Date.UTC(2026, 6, 11) / 86400000))
  })
  it('rỗng/hỏng -> null', () => {
    expect(ymdToDayNum('')).toBeNull()
    expect(ymdToDayNum(null)).toBeNull()
    expect(ymdToDayNum('abc')).toBeNull()
  })
})

describe('computeStats — tổng quan', () => {
  const { overview } = computeStats(progressRows, authUsers, NOW)
  it('đếm user / mới / hoạt động đúng cửa sổ 7-30 ngày', () => {
    expect(overview).toMatchObject({
      totalUsers: 3,
      withProgress: 3,
      newUsers7: 1,
      newUsers30: 2,
      active7: 1,
      active30: 2,
    })
  })
  it('tổng XP / buổi / lượt kiểm tra (bỏ cổng gday)', () => {
    expect(overview.totalXp).toBe(450)
    expect(overview.totalCompleted).toBe(5)
    expect(overview.totalQuizzesTaken).toBe(2)
  })
})

describe('computeStats — phễu theo tuần', () => {
  const { funnels } = computeStats(progressRows, authUsers, NOW)
  it('java: tuần 1 có 2 người, tuần 2 có 1 người', () => {
    expect(funnels.java.touched).toBe(2)
    expect(funnels.java.steps).toEqual([
      { week: 1, users: 2 },
      { week: 2, users: 1 },
    ])
  })
  it('comm: 1 người tới tuần 1; ielts: không có bước', () => {
    expect(funnels.comm.steps).toEqual([{ week: 1, users: 1 }])
    expect(funnels.ielts.steps).toEqual([])
  })
})

describe('computeStats — quiz & nội dung', () => {
  const { quizzes, content } = computeStats(progressRows, authUsers, NOW)
  it('quiz java week:1 gộp 2 lượt: tỉ lệ đậu 50%, điểm TB 65%', () => {
    expect(quizzes.java).toEqual([{ course: 'java', scope: 'week:1', takers: 2, passRate: 50, avgPct: 65 }])
  })
  it('buổi phổ biến nhất là java 1:1 (2 lượt)', () => {
    expect(content.topLessons[0]).toMatchObject({ course: 'java', week: 1, day: 1, count: 2 })
  })
  it('quiz trượt cao gồm java week:1 (đậu 50%)', () => {
    expect(content.hardestQuizzes[0]).toMatchObject({ course: 'java', scope: 'week:1', passRate: 50 })
  })
})

describe('computeStats — rỗng an toàn', () => {
  it('không có dữ liệu -> số 0, mảng rỗng', () => {
    const s = computeStats([], [], NOW)
    expect(s.overview.totalUsers).toBe(0)
    expect(s.funnels.java.steps).toEqual([])
    expect(s.content.topLessons).toEqual([])
    expect(s.content.hardestQuizzes).toEqual([])
  })
})
