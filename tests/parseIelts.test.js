import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parseIeltsWeek } from '@/data/md/parseIelts'

const DIR = path.resolve(process.cwd(), 'Base_English')
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8')
const files = fs
  .readdirSync(DIR)
  .filter((f) => /^NenTang_Tuan\d+\.md$/.test(f))
  .sort()

describe('parseIeltsWeek() — fixtures thật', () => {
  it('đọc đúng tiêu đề tuần (num/title/subtitle)', () => {
    const w = parseIeltsWeek(read('NenTang_Tuan1.md'))
    expect(w.num).toBe(1)
    expect(w.title).toContain('Reset')
    expect(w.subtitle).toContain('Khởi động') // phần trong ngoặc
  })

  it('tách nội dung cấp tuần: ngữ pháp / từ vựng / kỹ năng / lesson / quiz', () => {
    const w = parseIeltsWeek(read('NenTang_Tuan1.md'))
    expect(w.grammar.length).toBeGreaterThanOrEqual(3) // Backbone, Be, Do/Does/Did
    expect(w.vocabThemes.length).toBeGreaterThanOrEqual(2)
    expect(w.lessonScripts.length).toBeGreaterThanOrEqual(3)
    expect(w.weekQuiz.length).toBeGreaterThan(0)
    // mỗi mục có html đã render
    expect(w.grammar[0].html).toContain('<')
  })

  it('phòng từ vựng rút được danh sách "Từ chính"', () => {
    const w = parseIeltsWeek(read('NenTang_Tuan1.md'))
    const withWords = w.vocabThemes.find((t) => t.words.length > 0)
    expect(withWords).toBeTruthy()
    expect(withWords.words.length).toBeGreaterThanOrEqual(3)
  })

  it('IELTS là tuần-trung-tâm: mỗi ngày là checklist, đánh số tuần tự', () => {
    const w = parseIeltsWeek(read('NenTang_Tuan1.md'))
    expect(w.days.length).toBeGreaterThanOrEqual(7)
    w.days.forEach((d, i) => {
      expect(d.n).toBe(i + 1)
      expect(Array.isArray(d.checklist)).toBe(true)
    })
  })

  it('tổng số ngày 8 tuần = 63 (khớp khóa học, tuần 8 = 14 ngày)', () => {
    const total = files.reduce((s, f) => s + parseIeltsWeek(read(f)).days.length, 0)
    expect(files).toHaveLength(8)
    expect(total).toBe(63)
  })

  it('REGRESSION: nội dung tuần không lọt thẻ HTML generic thô', () => {
    for (const f of files) {
      const w = parseIeltsWeek(read(f))
      const html = [
        w.goalsHtml,
        w.quizHtml,
        ...w.grammar.map((g) => g.html),
        ...w.vocabThemes.map((v) => v.html),
        ...w.skills.map((s) => s.html),
        ...w.lessonScripts.map((l) => l.html),
      ].join('\n')
      const outsideCode = html
        .replace(/<code[^>]*>[\s\S]*?<\/code>/g, '')
        .replace(/<pre[\s\S]*?<\/pre>/g, '')
      // chỉ cho phép thẻ cấu trúc Markdown hợp lệ
      const stray = (outsideCode.match(/<\/?[A-Za-z][A-Za-z0-9]*>/g) || []).filter(
        (t) => !/^<\/?(p|ul|ol|li|h[1-6]|blockquote|strong|em|table|thead|tbody|tr|th|td|hr|br|del|code|pre)>$/i.test(t),
      )
      expect(stray, `${f}: ${stray.join(' ')}`).toEqual([])
    }
  })
})
