import { describe, it, expect } from 'vitest'
import {
  commBadgeStats,
  earnedCommBadges,
  commBossScores,
  commSrsSummary,
  commRevengeScene,
  commMetricsSummary,
  COMM_SAVE_TOPIC,
} from '@/lib/commStats'
import { COMM_BADGES } from '@/data/badges'
import { COMM_MILESTONES, commMilestoneOf } from '@/data/milestones'

/**
 * Mock tối giản các getter store mà commStats dùng — không cần Pinia:
 *   quizPassed(course, scope) · quizOf(course, scope) · isDone(course, w, d)
 *   savedWordList (mảng) · srsOf(srsId).
 */
function mockUser({ passed = [], scores = {}, done = [], saved = [], srs = {} } = {}) {
  return {
    quizPassed: (course, scope) => passed.includes(`${course}:${scope}`),
    quizOf: (course, scope) => scores[`${course}:${scope}`] || null,
    isDone: (course, w, d) => done.includes(`${course}:${w}:${d}`),
    savedWordList: saved,
    srsOf: (id) => srs[id] || null,
  }
}

describe('commBadgeStats — cột mốc khóa Giao Tiếp', () => {
  it('mới bắt đầu: chưa Boss nào, chưa Marathon, chưa mock interview', () => {
    const s = commBadgeStats(mockUser())
    expect(s).toEqual({ bossesPassed: 0, marathonDone: false, mockInterviewDone: false })
    expect(earnedCommBadges(mockUser())).toHaveLength(0)
  })

  it('đếm đúng số Boss đã đạt', () => {
    const s = commBadgeStats(mockUser({ passed: ['comm:boss:1', 'comm:boss:2', 'comm:boss:7'] }))
    expect(s.bossesPassed).toBe(3)
    expect(s.mockInterviewDone).toBe(true) // Boss 7 = mock interview
  })

  it('Marathon = hoàn thành buổi 8.4', () => {
    expect(commBadgeStats(mockUser({ done: ['comm:8:4'] })).marathonDone).toBe(true)
  })

  it('huy hiệu "Qua Boss đầu tiên" bật khi có ≥ 1 Boss đạt', () => {
    const earned = earnedCommBadges(mockUser({ passed: ['comm:boss:1'] }))
    expect(earned.map((b) => b.key)).toContain('comm-first-boss')
  })

  it('đủ 3 điều kiện -> đạt cả 3 huy hiệu', () => {
    const user = mockUser({ passed: ['comm:boss:1', 'comm:boss:7'], done: ['comm:8:4'] })
    expect(earnedCommBadges(user)).toHaveLength(COMM_BADGES.length)
  })
})

describe('commBossScores — bảng điểm 8 Boss', () => {
  it('trả đủ 8 tuần, kèm điểm khi có', () => {
    const rows = commBossScores(mockUser({ scores: { 'comm:boss:1': { pct: 85, passed: true } } }))
    expect(rows).toHaveLength(8)
    expect(rows[0]).toMatchObject({ week: 1, pct: 85, passed: true })
    expect(rows[1]).toMatchObject({ week: 2, pct: null, passed: false })
  })
})

describe('commSrsSummary — vốn cụm "nhớ"', () => {
  it('đếm cụm chủ đề comm và số đã ở trạng thái nhớ (reps ≥ 2)', () => {
    const saved = [
      { term: 'a', srsId: 'saved:a', topic: COMM_SAVE_TOPIC },
      { term: 'b', srsId: 'saved:b', topic: COMM_SAVE_TOPIC },
      { term: 'x', srsId: 'saved:x', topic: 'Khác' }, // chủ đề khác -> bỏ qua
    ]
    const srs = { 'saved:a': { reps: 3 }, 'saved:b': { reps: 1 } }
    const out = commSrsSummary(mockUser({ saved, srs }))
    expect(out).toEqual({ total: 2, remembered: 1, pct: 50 })
  })

  it('không có cụm nào -> pct 0 an toàn', () => {
    expect(commSrsSummary(mockUser())).toEqual({ total: 0, remembered: 0, pct: 0 })
  })
})

describe('commRevengeScene — 🔁 Cảnh phục thù ở buổi mission', () => {
  it('chưa tạch Boss nào -> null', () => {
    expect(commRevengeScene(mockUser(), 5)).toBeNull()
  })
  it('có Boss tuần trước tạch (<70%) -> trả về tuần đó', () => {
    const user = mockUser({ scores: { 'comm:boss:2': { pct: 55, passed: false } } })
    const r = commRevengeScene(user, 4)
    expect(r).toMatchObject({ week: 2, day: 7, pct: 55 })
  })
  it('chọn Boss điểm THẤP NHẤT trong các tuần trước', () => {
    const user = mockUser({
      scores: {
        'comm:boss:1': { pct: 65, passed: false },
        'comm:boss:2': { pct: 40, passed: false },
        'comm:boss:3': { pct: 90, passed: true },
      },
    })
    expect(commRevengeScene(user, 5).week).toBe(2)
  })
  it('bỏ qua Boss đã ĐẠT và Boss của tuần hiện tại/tương lai', () => {
    const user = mockUser({
      scores: {
        'comm:boss:2': { pct: 95, passed: true }, // đã đạt -> bỏ
        'comm:boss:5': { pct: 30, passed: false }, // >= tuần hiện tại -> bỏ
      },
    })
    expect(commRevengeScene(user, 5)).toBeNull()
  })
})

describe('commMetricsSummary — WPM & phát âm gom từ các buổi', () => {
  const withMetrics = (commMetrics) => ({ convoPrefs: { commMetrics } })
  it('chưa có gì -> sessions 0, các số null', () => {
    expect(commMetricsSummary(withMetrics({}))).toEqual({ sessions: 0, avgWpm: null, bestWpm: null, avgPron: null })
    expect(commMetricsSummary({})).toEqual({ sessions: 0, avgWpm: null, bestWpm: null, avgPron: null })
  })
  it('tính trung bình WPM/phát âm + WPM nhanh nhất, bỏ mẫu thiếu', () => {
    const s = commMetricsSummary(
      withMetrics({
        '1:2': { wpm: 60, pron: 80 },
        '1:4': { wpm: 100, pron: 90 },
        '2:2': { wpm: 0, pron: null }, // nhiễu -> bỏ khỏi cả hai
      }),
    )
    expect(s.sessions).toBe(3)
    expect(s.avgWpm).toBe(80)
    expect(s.bestWpm).toBe(100)
    expect(s.avgPron).toBe(85)
  })
})

describe('COMM_MILESTONES — 3 mốc ghi âm cố định', () => {
  it('đúng 3 mốc 1.1 / 4.7 / 8.7 với recId khớp quy ước comm:W:D', () => {
    expect(COMM_MILESTONES.map((m) => m.recId)).toEqual(['comm:1:1', 'comm:4:7', 'comm:8:7'])
  })

  it('commMilestoneOf tra đúng buổi mốc và trả null cho buổi thường', () => {
    expect(commMilestoneOf(4, 7)?.tag).toBe('Giữa khóa')
    expect(commMilestoneOf('8', '7')?.recId).toBe('comm:8:7') // nhận cả chuỗi
    expect(commMilestoneOf(1, 2)).toBeNull()
  })
})
