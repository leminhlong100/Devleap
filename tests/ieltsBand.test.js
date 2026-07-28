import { describe, it, expect } from 'vitest'
import { estimateIeltsBand, pctToBand } from '@/lib/ieltsBand'

describe('pctToBand', () => {
  it('ánh xạ % -> band (làm tròn 0.5), đơn điệu, kẹp 3.5..8.5', () => {
    expect(pctToBand(0)).toBe(3.5)
    expect(pctToBand(100)).toBe(8.5)
    expect(pctToBand(70)).toBe(7)
    expect(pctToBand(50)).toBe(6)
    expect(pctToBand(120)).toBe(8.5) // kẹp trên
    expect(pctToBand(-5)).toBe(3.5) // kẹp dưới
  })
})

describe('estimateIeltsBand', () => {
  const makeAcc = (quiz = {}, writings = {}) => ({
    quizOf: (course, scope) => quiz[`${course}:${scope}`] || null,
    writingOf: (course, week, day) => writings[`${course}:${week}:${day}`] || null,
  })

  it('chưa có điểm -> hasData=false, overall=null', () => {
    const r = estimateIeltsBand(makeAcc(), [1, 2, 3], 1)
    expect(r.hasData).toBe(false)
    expect(r.overall).toBe(null)
    expect(r.weakest).toBe(null)
    expect(r.skills.every((s) => !s.has)).toBe(true)
  })

  it('tổng hợp nghe/đọc/viết/nói + chọn kỹ năng yếu nhất trong 4 kỹ năng cốt lõi', () => {
    const acc = makeAcc(
      {
        'ielts:day:1:listen': { pct: 80 },
        'ielts:day:2:listen': { pct: 90 }, // Nghe avg 85
        'ielts:day:1:reading': { pct: 40 }, // Đọc 40 (yếu nhất)
        'ielts:gday:1:1': { pct: 100 }, // NP&TV (không tính weakest)
      },
      {
        'ielts:1:1': { review: { score: 60 } }, // Viết 60
        'ielts-speak:1:2': { review: { score: 70 } }, // Nói 70
      },
    )
    const r = estimateIeltsBand(acc, [1, 2], 1)
    expect(r.hasData).toBe(true)
    const byKey = Object.fromEntries(r.skills.map((s) => [s.key, s]))
    expect(byKey.listening.pct).toBe(85)
    expect(byKey.reading.pct).toBe(40)
    expect(byKey.writing.pct).toBe(60)
    expect(byKey.speaking.pct).toBe(70)
    expect(byKey.grammar.has).toBe(true)
    // yếu nhất = Đọc (40), dù NP&TV có điểm cao/thấp cũng không được chọn
    expect(r.weakest.key).toBe('reading')
    expect(r.overall).toBe(pctToBand((85 + 40 + 60 + 70 + 100) / 5))
  })

  it('kỹ năng chưa làm không kéo band xuống (chỉ tính kỹ năng có dữ liệu)', () => {
    const acc = makeAcc({ 'ielts:day:1:reading': { pct: 100 } }, {})
    const r = estimateIeltsBand(acc, [1], 1)
    expect(r.overall).toBe(8.5) // chỉ Đọc có điểm 100 -> band 8.5, không bị 0 của kỹ năng khác kéo xuống
    expect(r.weakest.key).toBe('reading')
  })
})
