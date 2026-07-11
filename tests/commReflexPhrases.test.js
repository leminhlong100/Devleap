import { describe, it, expect } from 'vitest'
import { commReflexGroups, flatReflexPhrases } from '@/data/commReflexPhrases'

// Đợt B — bộ cụm "phản hồi khi nghe" + tín hiệu luân phiên lượt lời.
describe('commReflexPhrases — backchannel & luân phiên lượt lời', () => {
  it('đủ 4 nhóm: backchannel / hold / yield / take', () => {
    const keys = commReflexGroups.map((g) => g.key)
    expect(keys).toEqual(['backchannel', 'hold', 'yield', 'take'])
  })

  it('mỗi nhóm có nhãn, gợi ý và ≥ 4 cụm { en, vi }', () => {
    for (const g of commReflexGroups) {
      expect(g.label, g.key).toBeTruthy()
      expect(g.hint, g.key).toBeTruthy()
      expect(g.phrases.length, g.key).toBeGreaterThanOrEqual(4)
      for (const p of g.phrases) {
        expect(p.en.trim(), `${g.key} en`).toBeTruthy()
        expect(p.vi.trim(), `${g.key} vi`).toBeTruthy()
      }
    }
  })

  it('backchannel gồm những cụm nghe-đang-theo-dõi kinh điển', () => {
    const bc = commReflexGroups.find((g) => g.key === 'backchannel').phrases.map((p) => p.en)
    expect(bc).toContain('I see.')
    expect(bc).toContain('Go on.')
  })

  it('flatReflexPhrases() gom hết cụm tiếng Anh, không trùng', () => {
    const all = flatReflexPhrases()
    const total = commReflexGroups.reduce((s, g) => s + g.phrases.length, 0)
    expect(all.length).toBe(total)
    expect(new Set(all).size).toBe(all.length)
  })
})
