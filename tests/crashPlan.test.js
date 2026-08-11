import { describe, it, expect } from 'vitest'
import { dayGoals, goalStatus, isDayDone, planStatus, computeJavaPrepProgress } from '../src/lib/crashPlan.js'
import { CRASH_PLAN, QUESTION_BANK, CODING_CHALLENGES } from '../src/data/javaInterview.js'

const idsOfTopics = (...topics) => QUESTION_BANK.filter((q) => topics.includes(q.topic)).map((q) => q.id)
const emptyCtx = () => ({ studied: new Set(), solvedCount: 0, solvedIds: new Set(), mockCount: 0, preparedProfileCount: 0 })

// Bối cảnh "đã làm hết mọi mục tiêu" — suy ra trực tiếp từ CRASH_PLAN nên không
// cần biết trước cấu trúc từng ngày (tránh test giòn khi rebalance lại nội dung).
function fullCtx() {
  const studied = new Set()
  const solvedIds = new Set()
  let codeN = 0
  let mockN = 0
  let profileN = 0
  for (const d of CRASH_PLAN) {
    for (const g of dayGoals(d)) {
      if (g.k === 'q') g.ids.forEach((id) => studied.add(id))
      if (g.k === 'code') {
        if (g.ids) g.ids.forEach((id) => solvedIds.add(id))
        else codeN = Math.max(codeN, g.n)
      }
      if (g.k === 'mock') mockN = Math.max(mockN, g.n)
      if (g.k === 'profile') profileN = Math.max(profileN, g.n)
    }
  }
  return { studied, solvedIds, solvedCount: Math.max(solvedIds.size, codeN), mockCount: mockN, preparedProfileCount: profileN }
}

describe('lib/crashPlan — dayGoals', () => {
  it('mọi ngày đều khai báo ít nhất 1 mục tiêu đo được', () => {
    for (const d of CRASH_PLAN) {
      expect(dayGoals(d).length, `Ngày ${d.day}`).toBeGreaterThan(0)
    }
  })

  it('mục tiêu "q" gom đúng id câu hỏi theo topic', () => {
    const day1 = CRASH_PLAN.find((d) => d.day === 1) // topics: ['oop']
    const g = dayGoals(day1).find((x) => x.k === 'q')
    expect(g.total).toBe(idsOfTopics('oop').length)
    expect(g.total).toBeGreaterThan(0)
    expect(g.jump).toEqual({ tab: 'bank', topic: 'oop' })
  })

  it('mục tiêu "q" với ids tường minh (SQL tách Ngày 8/9) không trùng và không mất câu', () => {
    const day8 = CRASH_PLAN.find((d) => d.day === 8)
    const day9 = CRASH_PLAN.find((d) => d.day === 9)
    const sqlIn8 = dayGoals(day8).find((g) => g.jump?.topic === 'sql')
    const sqlIn9 = dayGoals(day9).find((g) => g.jump?.topic === 'sql')
    const all = [...sqlIn8.ids, ...sqlIn9.ids]
    expect(new Set(all).size).toBe(all.length) // không trùng
    expect(all.length).toBe(idsOfTopics('sql').length) // không mất câu nào
  })

  it('topic không có câu hỏi -> total 0 và không bao giờ done (tránh tự xong ảo)', () => {
    const g = { k: 'q', ids: [], total: 0 }
    expect(goalStatus(g, emptyCtx()).done).toBe(false)
  })

  it('mục tiêu "code" với ids gán đúng bài coding tồn tại trong CODING_CHALLENGES', () => {
    const allChallengeIds = new Set(CODING_CHALLENGES.map((c) => c.id))
    for (const d of CRASH_PLAN) {
      for (const g of dayGoals(d)) {
        if (g.k === 'code' && g.ids) {
          for (const id of g.ids) expect(allChallengeIds.has(id), `Ngày ${d.day}: ${id}`).toBe(true)
        }
      }
    }
  })

  it('27 bài coding được rải hết vào lộ trình, không trùng, không thiếu', () => {
    const assigned = CRASH_PLAN.flatMap((d) => dayGoals(d).flatMap((g) => (g.k === 'code' && g.ids ? g.ids : [])))
    expect(new Set(assigned).size).toBe(assigned.length)
    expect(assigned.length).toBe(CODING_CHALLENGES.length)
  })

  it('mỗi ngày từ 1-13 có ít nhất 1 bài coding gắn kèm', () => {
    for (const d of CRASH_PLAN.filter((x) => x.day <= 13)) {
      const codeIds = dayGoals(d).flatMap((g) => (g.k === 'code' && g.ids ? g.ids : []))
      expect(codeIds.length, `Ngày ${d.day}`).toBeGreaterThan(0)
    }
  })

  it('không ngày nào có tổng số câu hỏi vượt quá 24', () => {
    for (const d of CRASH_PLAN) {
      const total = dayGoals(d).filter((g) => g.k === 'q').reduce((sum, g) => sum + g.total, 0)
      expect(total, `Ngày ${d.day}`).toBeLessThanOrEqual(24)
    }
  })
})

describe('lib/crashPlan — goalStatus', () => {
  it('q: done khi đã ôn hết câu của topic', () => {
    const day1 = CRASH_PLAN.find((d) => d.day === 1)
    const g = dayGoals(day1).find((x) => x.k === 'q')
    const ctx = { ...emptyCtx(), studied: new Set(g.ids) }
    const s = goalStatus(g, ctx)
    expect(s).toEqual({ done: true, cur: g.total, total: g.total })
  })

  it('q: ôn thiếu 1 câu -> chưa done, đếm đúng cur', () => {
    const day1 = CRASH_PLAN.find((d) => d.day === 1)
    const g = dayGoals(day1).find((x) => x.k === 'q')
    const ctx = { ...emptyCtx(), studied: new Set(g.ids.slice(0, -1)) }
    const s = goalStatus(g, ctx)
    expect(s.done).toBe(false)
    expect(s.cur).toBe(g.total - 1)
  })

  it('code (n cũ, đếm dồn): done khi solvedCount >= n, cur bị chặn trần ở n', () => {
    const g = { k: 'code', n: 1 }
    expect(goalStatus(g, { ...emptyCtx(), solvedCount: 0 }).done).toBe(false)
    expect(goalStatus(g, { ...emptyCtx(), solvedCount: 3 })).toEqual({ done: true, cur: 1, total: 1 })
  })

  it('code (ids tường minh): done khi đã giải đúng các bài được gán cho ngày', () => {
    const g = { k: 'code', ids: ['a', 'b'], total: 2 }
    expect(goalStatus(g, { ...emptyCtx(), solvedIds: new Set(['a']) })).toEqual({ done: false, cur: 1, total: 2 })
    expect(goalStatus(g, { ...emptyCtx(), solvedIds: new Set(['a', 'b', 'z']) })).toEqual({ done: true, cur: 2, total: 2 })
  })

  it('profile: done khi đã chuẩn bị >= n câu hồ sơ', () => {
    const g = { k: 'profile', n: 15 }
    expect(goalStatus(g, { ...emptyCtx(), preparedProfileCount: 14 }).done).toBe(false)
    expect(goalStatus(g, { ...emptyCtx(), preparedProfileCount: 15 }).done).toBe(true)
  })

  it('mock: cần đủ n buổi (ngày 14 cần 2)', () => {
    const g = { k: 'mock', n: 2 }
    expect(goalStatus(g, { ...emptyCtx(), mockCount: 1 }).done).toBe(false)
    expect(goalStatus(g, { ...emptyCtx(), mockCount: 2 }).done).toBe(true)
  })
})

describe('lib/crashPlan — isDayDone & planStatus', () => {
  it('ctx rỗng -> chưa ngày nào xong, hôm nay = Ngày 1', () => {
    const p = planStatus(emptyCtx())
    expect(p.doneCount).toBe(0)
    expect(p.total).toBe(CRASH_PLAN.length)
    expect(p.today).toBe(1)
    expect(p.allDone).toBe(false)
  })

  it('hôm nay = ngày ĐẦU TIÊN chưa xong (tự do theo nhịp, không cần liên tục)', () => {
    // Xong hết mọi mục tiêu của ngày 1, bỏ trống ngày 2 -> hôm nay vẫn là ngày 2
    const day1 = CRASH_PLAN.find((d) => d.day === 1)
    const goals1 = dayGoals(day1)
    const studied = new Set(goals1.filter((g) => g.k === 'q').flatMap((g) => g.ids))
    const solvedIds = new Set(goals1.filter((g) => g.k === 'code' && g.ids).flatMap((g) => g.ids))
    const ctx = { ...emptyCtx(), studied, solvedIds }
    expect(isDayDone(day1, ctx)).toBe(true)
    const p = planStatus(ctx)
    expect(p.doneCount).toBe(1)
    expect(p.today).toBe(2)
  })

  it('làm đủ mọi mục tiêu mọi ngày -> allDone, today = null', () => {
    const p = planStatus(fullCtx())
    expect(p.allDone).toBe(true)
    expect(p.today).toBe(null)
    expect(p.doneCount).toBe(CRASH_PLAN.length)
  })

  it('ngày 7 chỉ cần 1 mock + 2 bài coding ôn lại', () => {
    const day7 = CRASH_PLAN.find((d) => d.day === 7)
    const codeIds = dayGoals(day7).find((g) => g.k === 'code').ids
    expect(isDayDone(day7, { ...emptyCtx(), mockCount: 1 })).toBe(false) // thiếu coding
    expect(isDayDone(day7, { ...emptyCtx(), mockCount: 1, solvedIds: new Set(codeIds) })).toBe(true)
  })

  it('ngày 4 cần cả ôn Stream lẫn 3 bài coding', () => {
    const day4 = CRASH_PLAN.find((d) => d.day === 4)
    const streamIds = new Set(idsOfTopics('stream'))
    const codeIds = dayGoals(day4).find((g) => g.k === 'code').ids
    expect(isDayDone(day4, { ...emptyCtx(), studied: streamIds })).toBe(false) // thiếu coding
    expect(isDayDone(day4, { ...emptyCtx(), studied: streamIds, solvedIds: new Set(codeIds) })).toBe(true)
  })
})

describe('lib/crashPlan — computeJavaPrepProgress', () => {
  it('state rỗng / undefined -> 0%', () => {
    expect(computeJavaPrepProgress().pct).toBe(0)
    expect(computeJavaPrepProgress({}).pct).toBe(0)
    expect(computeJavaPrepProgress({}).total).toBe(CRASH_PLAN.length)
  })

  it('làm hết mọi mục tiêu -> 100%', () => {
    const day13 = CRASH_PLAN.find((d) => d.day === 13)
    const profileN = dayGoals(day13).find((g) => g.k === 'profile').n
    const p = computeJavaPrepProgress({
      studiedQuestions: QUESTION_BANK.map((q) => q.id),
      solvedChallenges: CODING_CHALLENGES.map((c) => c.id),
      mocksTaken: 2,
      profilePrepared: Array.from({ length: profileN }, (_, i) => `pq-${i}`),
    })
    expect(p.pct).toBe(100)
    expect(p.doneCount).toBe(CRASH_PLAN.length)
  })

  it('xong 1 ngày -> % = round(1/total*100), cập nhật (không kẹt ở 0)', () => {
    const day1 = CRASH_PLAN.find((d) => d.day === 1)
    const goals1 = dayGoals(day1)
    const p = computeJavaPrepProgress({
      studiedQuestions: goals1.find((g) => g.k === 'q').ids,
      solvedChallenges: goals1.find((g) => g.k === 'code').ids,
    })
    expect(p.doneCount).toBe(1)
    expect(p.pct).toBe(Math.round((1 / CRASH_PLAN.length) * 100))
    expect(p.pct).toBeGreaterThan(0)
  })
})
