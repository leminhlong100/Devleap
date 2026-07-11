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

// Đợt B — "Ứng biến & Tương tác thật" (vá #3/#4): repair 2 chiều + backchannel/luân phiên.
describe('buildRoleplayPrompt — repair 2 chiều & conversation dynamics', () => {
  it('mặc định: có hướng dẫn repair ("didn\'t catch") + backchannel', () => {
    const p = buildRoleplayPrompt({ scenario: 'You are a barista.' })
    expect(p).toContain('TWO-WAY REPAIR')
    expect(p.toLowerCase()).toContain("didn't catch")
    expect(p).toContain('CONVERSATION DYNAMICS')
    expect(p.toLowerCase()).toContain('backchannel')
  })

  it('repair bật cả trong chế độ deferCorrection (chỉ trò chuyện)', () => {
    const p = buildRoleplayPrompt({ scenario: 'You are a barista.', deferCorrection: true })
    expect(p).toContain('"evaluation": null')
    expect(p).toContain('TWO-WAY REPAIR')
    expect(p).toContain('CONVERSATION DYNAMICS')
  })

  it('tắt được qua context.repair=false / context.dynamics=false', () => {
    const p = buildRoleplayPrompt({ scenario: 'You are a barista.', repair: false, dynamics: false })
    expect(p).not.toContain('TWO-WAY REPAIR')
    expect(p).not.toContain('CONVERSATION DYNAMICS')
  })

  it('tần suất repair dày hơn ở nửa sau khóa (Tuần 5+)', () => {
    const early = buildRoleplayPrompt({ scenario: 'x', week: 2 })
    const late = buildRoleplayPrompt({ scenario: 'x', week: 6 })
    expect(early).toContain('1 in 6')
    expect(late).toContain('1 in 4')
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
