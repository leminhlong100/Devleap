import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../netlify/functions/_llm.js'

describe('buildSystemPrompt — chế độ explain (vì sao) & equiv (paraphrase)', () => {
  it("mode 'explain': tutor giải thích bằng tiếng Việt, ngắn gọn", () => {
    const p = buildSystemPrompt({ mode: 'explain' })
    expect(typeof p).toBe('string')
    expect(p).toMatch(/VIETNAMESE/i)
    expect(p).toMatch(/why the correct answer/i)
  })

  it("mode 'equiv': chỉ trả YES/NO, chấp nhận paraphrase", () => {
    const p = buildSystemPrompt({ mode: 'equiv' })
    expect(p).toMatch(/YES or NO/i)
    expect(p).toMatch(/paraphrase|synonyms/i)
  })

  it('hai chế độ cho prompt khác nhau và khác các chế độ cũ', () => {
    const explain = buildSystemPrompt({ mode: 'explain' })
    const equiv = buildSystemPrompt({ mode: 'equiv' })
    const word = buildSystemPrompt({ mode: 'word' })
    expect(explain).not.toBe(equiv)
    expect(explain).not.toBe(word)
  })
})
