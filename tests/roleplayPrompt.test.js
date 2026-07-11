import { describe, it, expect } from 'vitest'
import { buildRoleplayPrompt, buildDebriefPrompt } from '../netlify/functions/_llm.js'

// Kế hoạch "Nói Tự Tin" Trục D — "communicate now, correct later": khi
// context.deferCorrection, roleplay KHÔNG soi từng câu (evaluation luôn null).
describe('buildRoleplayPrompt — deferCorrection', () => {
  it('mặc định (không defer): vẫn có khối evaluation để chấm từng câu', () => {
    const p = buildRoleplayPrompt({ scenario: 'You are a barista.' })
    expect(p).toContain('"evaluation"')
    expect(p).toContain('"corrected"')
    expect(p).toContain('"cefr"')
  })

  it('defer bật: evaluation LUÔN null, không có trường chấm', () => {
    const p = buildRoleplayPrompt({ scenario: 'You are a barista.', deferCorrection: true })
    expect(p).toContain('"evaluation": null')
    expect(p).not.toContain('"corrected"')
    expect(p).not.toContain('"cefr"')
    // vẫn giữ vai + tiếp tục hội thoại
    expect(p).toContain('"message"')
    expect(p.toLowerCase()).toContain('do not correct')
  })

  it('defer vẫn nhúng kịch bản + gợi ý từ khi bật', () => {
    const p = buildRoleplayPrompt({ scenario: 'You are a hotel receptionist.', suggestWords: true })
    expect(p).toContain('hotel receptionist')
  })
})

// Trục A/B/D — debrief giàu hơn: độ dễ hiểu, trôi chảy (số khách quan), mẹo vượt lo âu.
describe('buildDebriefPrompt — chiều dễ hiểu / trôi chảy / vượt lo âu', () => {
  it('có các field mới trong khuôn JSON', () => {
    const p = buildDebriefPrompt({ rubric: ['xong việc'] })
    expect(p).toContain('"intelligibility"')
    expect(p).toContain('"fluency"')
    expect(p).toContain('"confidenceTip"')
  })

  it('đưa số phát âm khách quan vào khi có pronScore', () => {
    const p = buildDebriefPrompt({ pronScore: 85, confusions: 2 })
    expect(p).toContain('85%')
    expect(p.toLowerCase()).toContain('pronunciation')
  })

  it('đưa số trôi chảy khách quan vào khi có wpm', () => {
    const p = buildDebriefPrompt({ wpm: 95, latency: 3.2 })
    expect(p).toContain('95 words per minute')
  })

  it('không có số khách quan -> không bịa dòng dữ liệu', () => {
    const p = buildDebriefPrompt({})
    expect(p).not.toContain('words per minute')
    expect(p).not.toMatch(/recognized correctly/i)
  })
})
