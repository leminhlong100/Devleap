import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildErrorDrillPrompt } from '../netlify/functions/_llm.js'

// Bước 5.4 KE_HOACH_CAI_TIEN_WEBSITE.md — "Trợ lý ôn sổ lỗi": prompt builder mới
// buildErrorDrillPrompt() + nhánh mode:'errorDrill' trong runChat() (netlify/functions/_llm.js).
describe('netlify/functions/_llm.js — buildErrorDrillPrompt', () => {
  it('nhúng đúng danh sách lỗi (wrong -> right + note) vào prompt', () => {
    const p = buildErrorDrillPrompt({
      errors: [
        { wrong: 'He go home.', right: 'He goes home.', note: 'ngôi 3 số ít' },
        { wrong: 'I has a cat.', right: 'I have a cat.', note: '' },
      ],
    })
    expect(p).toContain('He go home.')
    expect(p).toContain('He goes home.')
    expect(p).toContain('ngôi 3 số ít')
    expect(p).toContain('I has a cat.')
    expect(p).toContain('EXACTLY 5')
    expect(p).toContain('"questions"')
  })

  it('không có lỗi -> vẫn ra prompt hợp lệ, nhắc AI tự bịa lỗi phổ biến', () => {
    const p = buildErrorDrillPrompt({ errors: [] })
    expect(p).toMatch(/invent common/i)
    expect(p).toContain('"questions"')
  })

  it('an toàn khi context.errors thiếu/không phải mảng', () => {
    expect(() => buildErrorDrillPrompt({})).not.toThrow()
    expect(() => buildErrorDrillPrompt({ errors: 'not array' })).not.toThrow()
  })
})

describe('netlify/functions/_llm.js — runChat() mode errorDrill', () => {
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

  it('parse đúng JSON { questions: [...] } từ AI', async () => {
    stubFetch(
      JSON.stringify({
        questions: [{ type: 'cloze', q: 'I ___ happy.', answer: ['am'], ex: 'to be' }],
      }),
    )
    const { runChat } = await import('../netlify/functions/_llm.js')
    const { reply } = await runChat(
      { messages: [{ role: 'user', text: 'go' }], context: { errors: [{ wrong: 'a', right: 'b', note: '' }] }, mode: 'errorDrill' },
      'key',
    )
    expect(reply.questions).toEqual([{ type: 'cloze', q: 'I ___ happy.', answer: ['am'], ex: 'to be' }])
  })

  it('AI kèm chữ thừa quanh JSON -> vẫn bóc được khối JSON đầu tiên', async () => {
    stubFetch('Here you go:\n' + JSON.stringify({ questions: [{ type: 'error', q: 'x', answer: ['y'], ex: 'z' }] }) + '\nThanks!')
    const { runChat } = await import('../netlify/functions/_llm.js')
    const { reply } = await runChat({ messages: [], context: {}, mode: 'errorDrill' }, 'key')
    expect(reply.questions[0]).toEqual({ type: 'error', q: 'x', answer: ['y'], ex: 'z' })
  })

  it('AI trả về JSON không phải object -> ném AiError upstream', async () => {
    stubFetch('"just a string"')
    const { runChat, AiError } = await import('../netlify/functions/_llm.js')
    await expect(runChat({ messages: [], context: {}, mode: 'errorDrill' }, 'key')).rejects.toBeInstanceOf(AiError)
  })
})
