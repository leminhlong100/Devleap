import { describe, it, expect } from 'vitest'
import {
  commWeeksData,
  commTotals,
  getCommWeek,
  getCommDay,
  computeCommProgress,
  computeCommStatuses,
} from '@/data/courseComm'

describe('courseComm — nạp Comm_English/*.md', () => {
  it('nạp được ít nhất Tuần 1 với 7 buổi', () => {
    expect(commWeeksData.length).toBeGreaterThanOrEqual(1)
    const w1 = getCommWeek(1)
    expect(w1).toBeTruthy()
    expect(w1.days.length).toBe(7)
    expect(w1.scenarios.length).toBe(6)
    expect(commTotals.lessons).toBeGreaterThanOrEqual(7)
  })

  it('nạp trọn 8 tuần, mỗi tuần 7 buổi + 6 scenario (5 roleplay + Boss)', () => {
    expect(commWeeksData.length).toBe(8)
    for (let w = 1; w <= 8; w++) {
      const wk = getCommWeek(w)
      expect(wk, `Tuần ${w}`).toBeTruthy()
      expect(wk.days.length, `Tuần ${w} buổi`).toBe(7)
      expect(wk.scenarios.length, `Tuần ${w} scenario`).toBe(6)
    }
    expect(commTotals.lessons).toBe(56)
  })
})

describe('getCommDay() — ghép ngày + tình huống theo N.D', () => {
  it('buổi có roleplay: gắn scenario đúng buổi + brief cho AI (kèm twist)', () => {
    const d = getCommDay(1, 2)
    expect(d).toBeTruthy()
    expect(d.scenario).toBeTruthy()
    expect(d.scenario.id).toBe('1.2')
    expect(d.scenario.title).toContain('Gọi món')
    expect(d.scenario.brief).toContain('role')
    expect(d.scenario.brief.toLowerCase()).toContain('twist')
    expect(d.isBoss).toBe(false)
    expect(d.isMission).toBe(false)
  })

  it('buổi mission (6): không có scenario, cờ isMission bật', () => {
    const d = getCommDay(1, 6)
    expect(d.scenario).toBeNull()
    expect(d.isMission).toBe(true)
  })

  it('buổi Boss (7): scenario 1.7 + cờ isBoss bật', () => {
    const d = getCommDay(1, 7)
    expect(d.scenario?.id).toBe('1.7')
    expect(d.isBoss).toBe(true)
  })

  it('buổi không tồn tại -> null', () => {
    expect(getCommDay(99, 1)).toBeNull()
  })

  it('Boss khối sau kéo lại "cảnh ôn xoáy" (spiral): Tuần 4 có recall + brief', () => {
    const d = getCommDay(4, 7)
    expect(d.isBoss).toBe(true)
    expect(d.scenario.recall).toBeTruthy()
    expect(d.scenario.brief).toContain('SPIRAL REVIEW')
  })

  it('Boss Tuần 1 KHÔNG có cảnh ôn (chưa có khối trước)', () => {
    const d = getCommDay(1, 7)
    expect(d.isBoss).toBe(true)
    expect(d.scenario.recall).toBeFalsy()
    expect(d.scenario.brief).not.toContain('SPIRAL REVIEW')
  })

  it('Surprise mode (Tuần 8): scenario 8.1/8.2/8.4 bật cờ surprise + brief lệnh vào vai ngay', () => {
    for (const day of [1, 2, 4]) {
      const d = getCommDay(8, day)
      expect(d.scenario?.surprise, `8.${day} surprise`).toBe(true)
      expect(d.scenario.brief).toContain('SURPRISE MODE')
    }
    // Buổi thường (không surprise) -> cờ tắt.
    expect(getCommDay(1, 1).scenario.surprise).toBe(false)
  })
})

describe('tiến độ khóa comm', () => {
  it('chưa học gì -> tuần 1 current, phần còn lại locked', () => {
    const st = computeCommStatuses([])
    expect(st[1]).toBe('current')
  })

  it('computeCommProgress: buổi tiếp theo = 1:1 khi mới bắt đầu', () => {
    const p = computeCommProgress([])
    expect(p.continue).toEqual({ week: 1, day: 1 })
    expect(p.allDone).toBe(false)
    expect(p.doneDays).toBe(0)
  })

  it('xong buổi 1 -> tiếp theo là buổi 2', () => {
    const p = computeCommProgress(['1:1'])
    expect(p.continue).toEqual({ week: 1, day: 2 })
    expect(p.doneDays).toBe(1)
  })
})
