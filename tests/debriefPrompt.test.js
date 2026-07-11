import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildDebriefPrompt } from '../netlify/functions/_llm.js'

// Đợt 2 KE_HOACH_GIAO_TIEP_THUC_CHIEN.md — chế độ DEBRIEF: sau khi nhập vai,
// AI nhận transcript + rubric của tình huống -> JSON { score, rubric, errors, upgrades, summary }.
describe('netlify/functions/_llm.js — buildDebriefPrompt', () => {
  it('nhúng đúng các tiêu chí rubric của buổi vào prompt', () => {
    const p = buildDebriefPrompt({
      title: 'Gọi món ở quán cà phê',
      rubric: ['hoàn thành nhiệm vụ', 'dùng ≥ 3 cụm đã học', 'phản xạ twist'],
    })
    expect(p).toContain('hoàn thành nhiệm vụ')
    expect(p).toContain('dùng ≥ 3 cụm đã học')
    expect(p).toContain('phản xạ twist')
    // Khuôn JSON trả về
    expect(p).toContain('"score"')
    expect(p).toContain('"rubric"')
    expect(p).toContain('"errors"')
    expect(p).toContain('"upgrades"')
    expect(p).toContain('"summary"')
  })

  it('không có rubric -> vẫn ra prompt hợp lệ, chấm giao tiếp tổng thể', () => {
    const p = buildDebriefPrompt({})
    expect(p).toMatch(/no specific rubric/i)
    expect(p).toContain('"score"')
  })

  it('an toàn khi context.rubric thiếu/không phải mảng', () => {
    expect(() => buildDebriefPrompt({})).not.toThrow()
    expect(() => buildDebriefPrompt({ rubric: 'not array' })).not.toThrow()
  })
})

describe('netlify/functions/_llm.js — runChat() mode debrief', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  function stubFetch(content) {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ choices: [{ message: { content } }] }),
        }),
      ),
    )
  }

  it('parse đúng JSON tổng kết từ AI', async () => {
    const payload = {
      score: 80,
      rubric: [{ criterion: 'hoàn thành nhiệm vụ', met: true }],
      errors: [{ wrong: 'I want coffee.', right: 'Could I get a coffee, please?', note: 'lịch sự hơn' }],
      upgrades: [{ en: 'For here or to go?', vi: 'Uống tại chỗ hay mang đi?' }],
      summary: 'Tốt! Nhớ dùng câu lịch sự hơn.',
    }
    stubFetch(JSON.stringify(payload))
    const { runChat } = await import('../netlify/functions/_llm.js')
    const { reply } = await runChat(
      { messages: [{ role: 'user', text: 'hi' }], context: { rubric: ['hoàn thành nhiệm vụ'] }, mode: 'debrief' },
      'key',
    )
    expect(reply.score).toBe(80)
    expect(reply.rubric[0].met).toBe(true)
    expect(reply.upgrades[0].en).toBe('For here or to go?')
  })
})
