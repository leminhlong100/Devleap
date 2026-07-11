import { describe, it, expect } from 'vitest'
import { dayGoals, goalStatus, isDayDone, planStatus } from '../src/lib/crashPlan.js'
import { CRASH_PLAN, QUESTION_BANK } from '../src/data/javaInterview.js'

const idsOfTopics = (...topics) => QUESTION_BANK.filter((q) => topics.includes(q.topic)).map((q) => q.id)
const emptyCtx = () => ({ studied: new Set(), solvedCount: 0, mockCount: 0 })

describe('lib/crashPlan — dayGoals', () => {
  it('mọi ngày đều khai báo ít nhất 1 mục tiêu đo được', () => {
    for (const d of CRASH_PLAN) {
      expect(dayGoals(d).length, `Ngày ${d.day}`).toBeGreaterThan(0)
    }
  })

  it('mục tiêu "q" gom đúng id câu hỏi theo topic', () => {
    const day1 = CRASH_PLAN.find((d) => d.day === 1) // topics: ['oop']
    const [g] = dayGoals(day1)
    expect(g.k).toBe('q')
    expect(g.total).toBe(idsOfTopics('oop').length)
    expect(g.total).toBeGreaterThan(0)
    expect(g.jump).toEqual({ tab: 'bank', topic: 'oop' })
  })

  it('topic không có câu hỏi -> total 0 và không bao giờ done (tránh tự xong ảo)', () => {
    const g = { k: 'q', ids: [], total: 0 }
    expect(goalStatus(g, emptyCtx()).done).toBe(false)
  })
})

describe('lib/crashPlan — goalStatus', () => {
  it('q: done khi đã ôn hết câu của topic', () => {
    const day1 = CRASH_PLAN.find((d) => d.day === 1)
    const [g] = dayGoals(day1)
    const ctx = { ...emptyCtx(), studied: new Set(g.ids) }
    const s = goalStatus(g, ctx)
    expect(s).toEqual({ done: true, cur: g.total, total: g.total })
  })

  it('q: ôn thiếu 1 câu -> chưa done, đếm đúng cur', () => {
    const day1 = CRASH_PLAN.find((d) => d.day === 1)
    const [g] = dayGoals(day1)
    const ctx = { ...emptyCtx(), studied: new Set(g.ids.slice(0, -1)) }
    const s = goalStatus(g, ctx)
    expect(s.done).toBe(false)
    expect(s.cur).toBe(g.total - 1)
  })

  it('code: done khi solvedCount >= n, cur bị chặn trần ở n', () => {
    const g = { k: 'code', n: 1 }
    expect(goalStatus(g, { ...emptyCtx(), solvedCount: 0 }).done).toBe(false)
    expect(goalStatus(g, { ...emptyCtx(), solvedCount: 3 })).toEqual({ done: true, cur: 1, total: 1 })
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
    // Xong hết câu của ngày 1, bỏ trống ngày 2 -> hôm nay vẫn là ngày 2
    const day1 = CRASH_PLAN.find((d) => d.day === 1)
    const ctx = { ...emptyCtx(), studied: new Set(dayGoals(day1)[0].ids) }
    expect(isDayDone(day1, ctx)).toBe(true)
    const p = planStatus(ctx)
    expect(p.doneCount).toBe(1)
    expect(p.today).toBe(2)
  })

  it('làm đủ mọi mục tiêu mọi ngày -> allDone, today = null', () => {
    const allQ = new Set(QUESTION_BANK.map((q) => q.id))
    const ctx = { studied: allQ, solvedCount: 5, mockCount: 2 }
    const p = planStatus(ctx)
    expect(p.allDone).toBe(true)
    expect(p.today).toBe(null)
    expect(p.doneCount).toBe(CRASH_PLAN.length)
  })

  it('ngày 7 chỉ cần 1 mock; ngày 4 cần cả ôn stream lẫn 1 coding', () => {
    const day7 = CRASH_PLAN.find((d) => d.day === 7)
    expect(isDayDone(day7, { ...emptyCtx(), mockCount: 1 })).toBe(true)

    const day4 = CRASH_PLAN.find((d) => d.day === 4)
    const streamIds = new Set(idsOfTopics('stream'))
    expect(isDayDone(day4, { ...emptyCtx(), studied: streamIds, solvedCount: 0 })).toBe(false) // thiếu coding
    expect(isDayDone(day4, { ...emptyCtx(), studied: streamIds, solvedCount: 1 })).toBe(true)
  })
})
