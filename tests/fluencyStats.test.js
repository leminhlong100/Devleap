import { describe, it, expect } from 'vitest'
import { countWords, computeWpm, answerSecondsForWeek, summarizeFluency } from '@/lib/fluencyStats'

describe('fluencyStats — countWords', () => {
  it('đếm từ tách theo khoảng trắng, bỏ rỗng/thừa', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
    expect(countWords('hello')).toBe(1)
    expect(countWords('I want a coffee')).toBe(4)
    expect(countWords('  a   b\tc\n d ')).toBe(4)
    expect(countWords(null)).toBe(0)
  })
})

describe('fluencyStats — computeWpm', () => {
  it('WPM = số từ / (giây/60), làm tròn', () => {
    expect(computeWpm(30, 30)).toBe(60) // 30 từ trong 30s = 60 wpm
    expect(computeWpm(45, 30)).toBe(90)
    expect(computeWpm(10, 12)).toBe(50)
  })
  it('thiếu dữ liệu -> 0 (để nơi gọi bỏ mẫu nhiễu)', () => {
    expect(computeWpm(0, 30)).toBe(0)
    expect(computeWpm(10, 0)).toBe(0)
    expect(computeWpm(10, -5)).toBe(0)
    expect(computeWpm(undefined, undefined)).toBe(0)
  })
})

describe('fluencyStats — answerSecondsForWeek (thang trượt)', () => {
  it('khóa comm: Tuần 1–2 = 15s, 3–5 = 12s, 6–8 = 8s', () => {
    expect(answerSecondsForWeek(1, 'comm')).toBe(15)
    expect(answerSecondsForWeek(2, 'comm')).toBe(15)
    expect(answerSecondsForWeek(3, 'comm')).toBe(12)
    expect(answerSecondsForWeek(5, 'comm')).toBe(12)
    expect(answerSecondsForWeek(6, 'comm')).toBe(8)
    expect(answerSecondsForWeek(8, 'comm')).toBe(8)
  })
  it('giảm dần không tăng qua các tuần', () => {
    let prev = Infinity
    for (let w = 1; w <= 8; w++) {
      const s = answerSecondsForWeek(w, 'comm')
      expect(s).toBeLessThanOrEqual(prev)
      prev = s
    }
  })
  it('khóa khác (không comm) giữ 10s như cũ', () => {
    expect(answerSecondsForWeek(1)).toBe(10)
    expect(answerSecondsForWeek(8, 'ielts')).toBe(10)
    expect(answerSecondsForWeek(4, '')).toBe(10)
  })
})

describe('fluencyStats — summarizeFluency', () => {
  it('không có mẫu hợp lệ -> null', () => {
    expect(summarizeFluency([])).toBeNull()
    expect(summarizeFluency([{ wpm: 0, latency: 2 }])).toBeNull()
    expect(summarizeFluency(null)).toBeNull()
  })
  it('tính avgWpm, bestWpm, avgLatency và số lượt', () => {
    const s = summarizeFluency([
      { wpm: 60, latency: 2 },
      { wpm: 90, latency: 4 },
      { wpm: 0, latency: 1 }, // bỏ (nhiễu)
    ])
    expect(s.turns).toBe(2)
    expect(s.avgWpm).toBe(75)
    expect(s.bestWpm).toBe(90)
    expect(s.avgLatency).toBe(3)
  })
  it('không có latency đo được -> avgLatency null', () => {
    const s = summarizeFluency([{ wpm: 70, latency: null }])
    expect(s.avgWpm).toBe(70)
    expect(s.avgLatency).toBeNull()
  })
})
