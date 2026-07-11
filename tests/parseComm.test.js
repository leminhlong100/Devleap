import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parseCommWeek, parseScenarios, parsePronunciation, parseListening } from '@/data/md/parseComm'
import { parseIeltsWeek } from '@/data/md/parseIelts'

const DIR = path.resolve(process.cwd(), 'Comm_English')
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8')

describe('parseScenarios() — section 🎭 Tình huống thực chiến', () => {
  const raw = read('ThucChien_Tuan1.md')

  it('bóc được đủ các tình huống có khai báo (1.1–1.5 + Boss 1.7)', () => {
    const s = parseScenarios(raw)
    const ids = s.map((x) => x.id)
    expect(ids).toEqual(['1.1', '1.2', '1.3', '1.4', '1.5', '1.7'])
  })

  it('map buổi đúng quy ước N.D (week/day)', () => {
    const s = parseScenarios(raw)
    const boss = s.find((x) => x.id === '1.7')
    expect(boss.week).toBe(1)
    expect(boss.day).toBe(7)
  })

  it('mỗi tình huống có đủ vai/bối cảnh/nhiệm vụ/twist/rubric/hội thoại mẫu', () => {
    const s = parseScenarios(raw)
    const order = s.find((x) => x.id === '1.2')
    expect(order.title).toContain('Gọi món')
    expect(order.role).toContain('Nhân viên')
    expect(order.setting).toContain('quán')
    expect(order.tasks.length).toBeGreaterThanOrEqual(2)
    expect(order.twist).toContain('hết')
    expect(order.rubric.length).toBeGreaterThanOrEqual(3) // tách theo "·"
    expect(order.sample.length).toBeGreaterThanOrEqual(2)
  })

  it('file KHÔNG có section 🎭 -> trả mảng rỗng (an toàn ngược)', () => {
    expect(parseScenarios('# Tuần 9\n\n## 📖 Ngữ pháp\n\nnội dung')).toEqual([])
  })
})

describe('parseCommWeek() — bọc parseIeltsWeek + scenarios', () => {
  const raw = read('ThucChien_Tuan1.md')

  it('giữ nguyên dữ liệu IELTS-style (num, days, vocab, quiz)', () => {
    const w = parseCommWeek(raw)
    expect(w.num).toBe(1)
    expect(w.title).toContain('Phản xạ sống còn')
    expect(w.days.length).toBe(7)
    expect(w.vocabThemes.length).toBeGreaterThanOrEqual(5)
    expect(w.weekQuiz.length).toBeGreaterThanOrEqual(6)
  })

  it('gắn thêm scenarios[] không phá cấu trúc parseIeltsWeek', () => {
    const w = parseCommWeek(raw)
    const base = parseIeltsWeek(raw)
    expect(Array.isArray(w.scenarios)).toBe(true)
    expect(w.scenarios.length).toBe(6)
    // các khóa của parseIeltsWeek vẫn còn nguyên
    expect(Object.keys(base).every((k) => k in w)).toBe(true)
  })
})

describe('parsePronunciation() — section 🗣️ Phát âm trọng tâm (micro-lesson theo khối)', () => {
  it('bóc được title + intro + tips ở tuần đầu khối (Tuần 1)', () => {
    const p = parsePronunciation(read('ThucChien_Tuan1.md'))
    expect(p).not.toBeNull()
    expect(p.title).toContain('Khối 1')
    expect(p.intro.length).toBeGreaterThan(0)
    expect(p.tips.length).toBeGreaterThanOrEqual(3)
    // giữ nguyên **bold** trong tip để view tự render inline
    expect(p.tips.some((t) => t.includes('**'))).toBe(true)
  })

  it('Tuần 3 & 7 cũng có micro-lesson (Khối 2–3, Khối 4)', () => {
    expect(parsePronunciation(read('ThucChien_Tuan3.md')).title).toContain('Khối 2')
    expect(parsePronunciation(read('ThucChien_Tuan7.md')).title).toContain('Khối 4')
  })

  it('tuần KHÔNG có section -> null (an toàn ngược)', () => {
    expect(parsePronunciation(read('ThucChien_Tuan2.md'))).toBeNull()
    expect(parsePronunciation('# Tuần 9\n\n## 📖 Ngữ pháp\n\nnội dung')).toBeNull()
  })

  it('parseCommWeek gắn pronunciation (Tuần 1 có, Tuần 2 null)', () => {
    expect(parseCommWeek(read('ThucChien_Tuan1.md')).pronunciation).not.toBeNull()
    expect(parseCommWeek(read('ThucChien_Tuan2.md')).pronunciation).toBeNull()
  })
})

describe('parseListening() — section 🎧 Nghe (nghe-chép + nghe-hiểu)', () => {
  it('bóc được câu nghe-chép + đoạn hội thoại + câu hỏi (Tuần 1)', () => {
    const l = parseListening(read('ThucChien_Tuan1.md'))
    expect(l).not.toBeNull()
    expect(l.dictation.length).toBeGreaterThanOrEqual(2)
    expect(l.comprehension).not.toBeNull()
    expect(l.comprehension.script.length).toBeGreaterThan(20)
    expect(l.comprehension.questions.length).toBeGreaterThanOrEqual(2)
  })

  it('câu hỏi đúng khuôn QuizTool (q, opts[], correct index)', () => {
    const q = parseListening(read('ThucChien_Tuan1.md')).comprehension.questions[0]
    expect(typeof q.q).toBe('string')
    expect(Array.isArray(q.opts)).toBe(true)
    expect(q.opts.length).toBeGreaterThanOrEqual(2)
    expect(Number.isInteger(q.correct)).toBe(true)
    // đáp án đúng là phương án đánh dấu * -> "A flat white"
    expect(q.opts[q.correct]).toBe('A flat white')
    // dấu * đã được gỡ khỏi mọi phương án
    expect(q.opts.some((o) => o.startsWith('*'))).toBe(false)
  })

  it('cả 7 tuần khối 1–7 đều có bài nghe-hiểu ở Boss', () => {
    for (let w = 1; w <= 7; w++) {
      const l = parseListening(read(`ThucChien_Tuan${w}.md`))
      expect(l?.comprehension, `Tuần ${w}`).toBeTruthy()
    }
  })

  it('file không có section 🎧 -> null', () => {
    expect(parseListening('# Tuần 9\n\n## 📖 Ngữ pháp\n\nx')).toBeNull()
  })
})
