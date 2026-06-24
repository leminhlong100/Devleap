import { describe, it, expect } from 'vitest'
import { buildGrammarDrills } from '@/data/md/grammarDrills'

describe('buildGrammarDrills()', () => {
  const lines = `
**Lỗi thường gặp của người học Việt Nam:**

| Câu sai | Câu đúng |
| --- | --- |
| She very kind. | She is very kind. |
| She doesn't likes it. | She doesn't like it. |
| In my city has many cafés. | There are many cafés in my city. |
| many information | a lot of information / much information |
`.split('\n')

  it('sinh cloze khi khác biệt là một cụm liền mạch', () => {
    const drills = buildGrammarDrills(lines)
    const cloze = drills.find((d) => d.q.includes('She _____ very kind'))
    expect(cloze.type).toBe('cloze')
    expect(cloze.answer).toContain('is')
  })

  it('cloze cho cả trường hợp thay từ (likes → like)', () => {
    const drills = buildGrammarDrills(lines)
    const cz = drills.find((d) => d.type === 'cloze' && /doesn't _____ it/.test(d.q))
    expect(cz.answer).toContain('like')
  })

  it('câu bị đảo nhiều chỗ → bài sửa câu (error)', () => {
    const drills = buildGrammarDrills(lines)
    const err = drills.find((d) => d.type === 'error' && d.q.includes('In my city has'))
    expect(err.answer).toContain('There are many cafés in my city.')
  })

  it('tách đáp án thay thế ngăn bởi " / "', () => {
    const drills = buildGrammarDrills(lines)
    const err = drills.find((d) => d.q === 'many information')
    expect(err.answer).toEqual(expect.arrayContaining(['a lot of information', 'much information']))
  })

  it('chỉ đọc bảng "Câu sai | Câu đúng", bỏ qua bảng khác', () => {
    const other = `
| Thì | Ví dụ |
| --- | --- |
| Hiện tại | I go |
`.split('\n')
    expect(buildGrammarDrills(other)).toHaveLength(0)
  })
})
