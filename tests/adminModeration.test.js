import { describe, it, expect, vi } from 'vitest'
import {
  computeFeedbackStats,
  parseRecordingName,
  buildLeaderboardList,
  assertValidRecordingPath,
  actionGetFeedbackStats,
  actionClearLeaderboardName,
  actionDeleteRecording,
} from '../netlify/functions/_adminModeration.js'

/** Đợt 4 — Kiểm duyệt & phản hồi. Phần thuần + vài dòng chảy action + audit. */

describe('computeFeedbackStats — gộp cảm nhận theo khóa × tuần', () => {
  const rows = [
    { week_feedback: { 'java:1': { rating: 'hard' }, 'comm:2': { rating: 'ok' } } },
    { week_feedback: { 'java:1': { rating: 'easy' }, 'java:2': { rating: 'skipped' } } },
    { week_feedback: { 'java:1': { rating: 'hard' }, 'bad': { rating: 'hard' }, 'java:9': { rating: 'nope' } } },
  ]
  const fb = computeFeedbackStats(rows)

  it('java tuần 1: easy1/hard2, tỉ lệ khó 67%, sắp theo tuần', () => {
    expect(fb.java[0]).toEqual({ week: 1, easy: 1, ok: 0, hard: 2, skipped: 0, total: 3, hardPct: 67 })
    expect(fb.java[1]).toMatchObject({ week: 2, skipped: 1, total: 0, hardPct: 0 })
  })
  it('comm tuần 2 có 1 "vừa"; ielts rỗng; bỏ key/rating rác', () => {
    expect(fb.comm).toEqual([{ week: 2, easy: 0, ok: 1, hard: 0, skipped: 0, total: 1, hardPct: 0 }])
    expect(fb.ielts).toEqual([])
    expect(fb.java.find((r) => r.week === 9)).toBeUndefined()
  })
})

describe('parseRecordingName — bóc metadata + nhãn mốc', () => {
  it('comm mốc giữa khóa 4:7', () => {
    expect(parseRecordingName('u1', 'comm_4_7.webm')).toMatchObject({
      path: 'u1/comm_4_7.webm',
      recId: 'comm:4:7',
      course: 'comm',
      week: 4,
      day: 7,
      tag: 'Giữa khóa',
      label: 'Giao tiếp · Tuần 4 · Buổi 7 · Giữa khóa',
    })
  })
  it('comm 1:1 = Đầu khóa; ielts không có tag', () => {
    expect(parseRecordingName('u1', 'comm_1_1.webm').tag).toBe('Đầu khóa')
    expect(parseRecordingName('u1', 'ielts_1_1.webm')).toMatchObject({ tag: '', label: 'IELTS · Tuần 1 · Buổi 1' })
  })
})

describe('buildLeaderboardList — chỉ opt-in, gắn email, sắp XP giảm dần', () => {
  const rows = [
    { user_id: 'a', leaderboard_opt_in: true, leaderboard_name: 'Cool', week_xp: 50 },
    { user_id: 'b', leaderboard_opt_in: false, leaderboard_name: 'x', week_xp: 999 },
    { user_id: 'c', leaderboard_opt_in: true, leaderboard_name: '  ', week_xp: 80 },
  ]
  const authUsers = [{ id: 'a', email: 'a@x.com' }, { id: 'c', email: 'c@x.com' }]
  const list = buildLeaderboardList(rows, authUsers)

  it('loại người không opt-in, sắp theo weekXp', () => {
    expect(list.map((e) => e.id)).toEqual(['c', 'a'])
  })
  it('gắn email + trim tên (rỗng nếu chỉ khoảng trắng)', () => {
    expect(list[0]).toMatchObject({ id: 'c', email: 'c@x.com', displayName: '', weekXp: 80 })
    expect(list[1]).toMatchObject({ id: 'a', displayName: 'Cool' })
  })
})

describe('assertValidRecordingPath — chặn path xấu', () => {
  it('path hợp lệ đi qua', () => {
    expect(assertValidRecordingPath('u1/comm_4_7.webm')).toBe('u1/comm_4_7.webm')
  })
  it('sai định dạng / leo thư mục / sai đuôi -> 400', () => {
    for (const bad of ['bad', 'u1/x.mp3', 'u1/../y.webm', 'a/b/c.webm', 42, null]) {
      expect(() => assertValidRecordingPath(bad)).toThrowError(expect.objectContaining({ status: 400 }))
    }
  })
})

// —— Dòng chảy action ——

describe('actionGetFeedbackStats', () => {
  it('đọc week_feedback rồi tổng hợp', async () => {
    const service = { from: vi.fn(() => ({ select: async () => ({ data: [{ week_feedback: { 'java:1': { rating: 'hard' } } }], error: null }) })) }
    const { feedback } = await actionGetFeedbackStats(service)
    expect(feedback.java[0]).toMatchObject({ week: 1, hard: 1, hardPct: 100 })
  })
})

describe('actionClearLeaderboardName', () => {
  it('update tên rỗng + ghi audit', async () => {
    const audits = []
    const update = vi.fn(() => ({ eq: async () => ({ error: null }) }))
    const service = {
      from: vi.fn((t) => (t === 'admin_audit' ? { insert: async (r) => (audits.push(r), { error: null }) } : { update })),
    }
    const res = await actionClearLeaderboardName(service, { userId: 'admin1' }, { userId: 'u2' })
    expect(res).toMatchObject({ ok: true, userId: 'u2' })
    expect(update).toHaveBeenCalledWith({ leaderboard_name: '' })
    expect(audits[0]).toMatchObject({ action: 'clearLeaderboardName', target_id: 'u2' })
  })
  it('thiếu userId -> 400', async () => {
    await expect(actionClearLeaderboardName({}, { userId: 'a' }, {})).rejects.toThrowError(
      expect.objectContaining({ status: 400 }),
    )
  })
})

describe('actionDeleteRecording', () => {
  it('path xấu -> 400, không đụng storage', async () => {
    const remove = vi.fn()
    const service = { storage: { from: () => ({ remove }) } }
    await expect(actionDeleteRecording(service, { userId: 'a' }, { path: 'bad' })).rejects.toThrowError(
      expect.objectContaining({ status: 400 }),
    )
    expect(remove).not.toHaveBeenCalled()
  })
  it('path tốt -> remove + audit', async () => {
    const audits = []
    const remove = vi.fn(async () => ({ error: null }))
    const service = {
      storage: { from: () => ({ remove }) },
      from: vi.fn(() => ({ insert: async (r) => (audits.push(r), { error: null }) })),
    }
    const res = await actionDeleteRecording(service, { userId: 'a' }, { path: 'u2/comm_1_1.webm' })
    expect(res).toMatchObject({ ok: true, path: 'u2/comm_1_1.webm' })
    expect(remove).toHaveBeenCalledWith(['u2/comm_1_1.webm'])
    expect(audits[0]).toMatchObject({ action: 'deleteRecording', detail: { path: 'u2/comm_1_1.webm' } })
  })
})
