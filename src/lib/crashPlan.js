// Logic thuần cho "Lộ trình 2 tuần" của khóa Java Phỏng Vấn: biến mỗi ngày
// (CRASH_PLAN) thành các mục tiêu ĐO ĐƯỢC rồi tự tính "ngày đã hoàn thành chưa",
// "hôm nay là ngày mấy" và tiến độ toàn khóa — KHÔNG phụ thuộc Vue/Pinia nên
// test được bằng vitest. Xem cách dùng trong src/views/JavaPrepView.vue.
import { CRASH_PLAN, QUESTION_BANK, topicLabel } from '@/data/javaInterview'

// topic -> danh sách id câu hỏi (tính một lần khi module tải).
const IDS_BY_TOPIC = QUESTION_BANK.reduce((acc, item) => {
  ;(acc[item.topic] ||= []).push(item.id)
  return acc
}, {})

/**
 * Bối cảnh tiến độ dùng để chấm mục tiêu.
 * @typedef {Object} PlanCtx
 * @property {Set<string>} studied     id câu đã ôn (mở đọc trong Ngân hàng)
 * @property {number} solvedCount      số bài coding đã giải (đếm dồn)
 * @property {number} mockCount        số buổi Mock Interview đã hoàn thành (đếm dồn)
 */

/**
 * Nở các mục tiêu thô của một ngày thành mục tiêu đã-giải-nghĩa (kèm nhãn, tổng,
 * và thông tin để điều hướng tới đúng chỗ làm).
 * @param {{ goals?: Array }} day một phần tử CRASH_PLAN
 * @returns {Array<{ k:string, label:string, total:number, ids?:string[], topics?:string[], n?:number, jump:{tab:string, topic?:string} }>}
 */
export function dayGoals(day) {
  const out = []
  for (const g of day?.goals || []) {
    if (g.k === 'q') {
      const topics = Array.isArray(g.topics) ? g.topics : []
      const ids = topics.flatMap((t) => IDS_BY_TOPIC[t] || [])
      out.push({
        k: 'q',
        topics,
        ids,
        total: ids.length,
        label: `Ôn ${ids.length} câu — ${topics.map(topicLabel).join(', ')}`,
        jump: { tab: 'bank', topic: topics[0] },
      })
    } else if (g.k === 'code') {
      const n = g.n || 1
      out.push({ k: 'code', n, total: n, label: `Giải ${n} bài coding (chạy pass)`, jump: { tab: 'coding' } })
    } else if (g.k === 'mock') {
      const n = g.n || 1
      out.push({ k: 'mock', n, total: n, label: n > 1 ? `Hoàn thành ${n} buổi Mock Interview` : 'Hoàn thành 1 buổi Mock Interview', jump: { tab: 'mock' } })
    }
  }
  return out
}

/**
 * Chấm tiến độ một mục tiêu theo bối cảnh.
 * @param {object} goal   phần tử trả về từ dayGoals()
 * @param {PlanCtx} ctx
 * @returns {{ done:boolean, cur:number, total:number }}
 */
export function goalStatus(goal, ctx) {
  if (goal.k === 'q') {
    const cur = goal.ids.filter((id) => ctx.studied.has(id)).length
    return { done: goal.total > 0 && cur >= goal.total, cur, total: goal.total }
  }
  if (goal.k === 'code') {
    const cur = Math.min(ctx.solvedCount || 0, goal.n)
    return { done: (ctx.solvedCount || 0) >= goal.n, cur, total: goal.n }
  }
  if (goal.k === 'mock') {
    const cur = Math.min(ctx.mockCount || 0, goal.n)
    return { done: (ctx.mockCount || 0) >= goal.n, cur, total: goal.n }
  }
  return { done: false, cur: 0, total: goal.total || 1 }
}

/** Một ngày coi là HOÀN THÀNH khi mọi mục tiêu của nó đã done. */
export function isDayDone(day, ctx) {
  const goals = dayGoals(day)
  if (!goals.length) return false
  return goals.every((g) => goalStatus(g, ctx).done)
}

/**
 * Tiến độ toàn lộ trình.
 * @param {PlanCtx} ctx
 * @returns {{ days:Array<{day:number, done:boolean}>, doneCount:number, total:number, today:number|null, allDone:boolean }}
 *   today = ngày ĐẦU TIÊN chưa xong (tự do theo nhịp); null khi đã xong hết.
 */
export function planStatus(ctx) {
  const days = CRASH_PLAN.map((d) => ({ day: d.day, done: isDayDone(d, ctx) }))
  const doneCount = days.filter((d) => d.done).length
  const firstUndone = days.find((d) => !d.done)
  return {
    days,
    doneCount,
    total: CRASH_PLAN.length,
    today: firstUndone ? firstUndone.day : null,
    allDone: !firstUndone,
  }
}
