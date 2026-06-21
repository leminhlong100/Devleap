import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parseWeek } from '@/data/md/parseWeek'

const WEEKS_DIR = path.resolve(process.cwd(), 'weeks')
const read = (f) => fs.readFileSync(path.join(WEEKS_DIR, f), 'utf8')
const weekFiles = fs
  .readdirSync(WEEKS_DIR)
  .filter((f) => /^tuan-\d+\.md$/.test(f))
  .sort()

describe('parseWeek() — fixtures thật', () => {
  it('đọc đúng tiêu đề tuần (num/emoji/title/dateRange)', () => {
    const w = parseWeek(read('tuan-01.md'))
    expect(w.num).toBe(1)
    expect(w.emoji).toBeTruthy()
    expect(w.title.length).toBeGreaterThan(0)
    expect(w.dateRange).toMatch(/\d{1,2}\/\d{1,2}/)
  })

  it('parse bảng lịch học (>= 3 dòng, đủ cột)', () => {
    const w = parseWeek(read('tuan-01.md'))
    expect(w.schedule.length).toBeGreaterThanOrEqual(3)
    for (const row of w.schedule) {
      expect(row).toHaveProperty('date')
      expect(row).toHaveProperty('topic')
    }
  })

  it('mỗi ngày có cấu trúc tối thiểu & đánh số tuần tự 1..K', () => {
    const w = parseWeek(read('tuan-01.md'))
    expect(w.days.length).toBeGreaterThanOrEqual(6)
    w.days.forEach((d, i) => {
      expect(d.n).toBe(i + 1)
      expect(d.title.length).toBeGreaterThan(0)
      expect(d.emoji).toBeTruthy()
    })
  })

  it('tổng số ngày 12 tuần = 84 (khớp khóa học)', () => {
    const total = weekFiles.reduce((s, f) => s + parseWeek(read(f)).days.length, 0)
    expect(weekFiles).toHaveLength(12)
    expect(total).toBe(84)
  })

  it('REGRESSION: generic một-token trong prose được escape, không lọt thẻ HTML', () => {
    // tuan-02 chứa "List<String>", "List<Student>" trong văn xuôi/bài tập.
    const w = parseWeek(read('tuan-02.md'))
    const allHtml = w.days
      .flatMap((d) => [d.contentHtml, d.englishHtml, ...d.questions.map((q) => q.answerHtml)])
      .join('\n')
    expect(allHtml).toContain('&lt;String&gt;')
    // Không còn thẻ generic thô (loại trừ nội dung trong <code>/<pre> đã escape sẵn)
    const outsideCode = allHtml
      .replace(/<code[^>]*>[\s\S]*?<\/code>/g, '')
      .replace(/<pre[\s\S]*?<\/pre>/g, '')
    expect(outsideCode).not.toMatch(/<(String|Student|Integer|T)>/)
  })
})

describe('parseWeek() — synthetic (kiểm tra trích xuất chi tiết)', () => {
  const SRC = `# 📗 Tuần 9 · Demo Parser · 01/06–07/06/2025

## 📅 Lịch Học Tuần 9 — Tổng Quan
| Ngày | Thứ | Chế độ | Thời gian | Chủ đề |
| --- | --- | --- | --- | --- |
| 01/06 | Thứ 2 | LIGHT | 1.5h | Chủ đề A |
| 02/06 | Thứ 3 | FULL | 2.5h | Chủ đề B |
| 03/06 | Thứ 4 | FULL | 2.5h | Chủ đề C |

## ⚡ Ngày 1 · Chủ Đề A

**01/06 — Thứ 2** · **LIGHT** · ⏱ 1.5h

> 🌏 **TIẾNG ANH** · Học 10 từ trên **Vocalmax**: *alpha, beta, gamma, delta*.

### 📖 Lý Thuyết

Dùng \`List<String>\` để lưu. Generic Stack<T> bị xóa lúc runtime.

### 💻 Code Mẫu

\`\`\`java
class Demo {
    void run() { System.out.println("hi"); }
}
\`\`\`

### ✏️ Bài tập

1. Viết hàm tính tổng.
2. Cài Generic Stack<T>.

### ❓ Q&A

**Dễ · Generics tồn tại ở đâu?**

Compile-time. Runtime bị type erasure.

**Khó 3 · Giải thích PECS.**

Producer extends, Consumer super.

### 🧠 Quiz Nhanh

1. HashMap thread-safe?
   - [x] Không
   - [ ] Có
   💡 Cần ConcurrentHashMap.

- **🧩 LeetCode:** Two Sum
- **🛠️ AI Tools:** Copilot
- **📖 Resource:** Effective Java

## 🏁 Tổng Kết Tuần 9

Ôn lại toàn bộ chủ đề.
`

  const w = parseWeek(SRC)

  it('tiêu đề & lịch học', () => {
    expect(w.num).toBe(9)
    expect(w.title).toBe('Demo Parser')
    expect(w.dateRange).toMatch(/01\/06/)
    expect(w.schedule).toHaveLength(3)
    expect(w.summaryHtml).toContain('Ôn lại')
  })

  it('một ngày, đầy đủ meta', () => {
    expect(w.days).toHaveLength(1)
    const d = w.days[0]
    expect(d.date).toBe('01/06')
    expect(d.mode).toBe('LIGHT')
    expect(d.title).toContain('Chủ')
  })

  it('khối tiếng Anh + từ vựng', () => {
    const d = w.days[0]
    expect(d.englishHtml).toContain('Vocalmax')
    expect(d.vocab).toEqual(['alpha', 'beta', 'gamma', 'delta'])
  })

  it('trích code fence đầu tiên', () => {
    const { code } = w.days[0]
    expect(code).toBeTruthy()
    expect(code.lang).toBe('java')
    expect(code.code).toContain('class Demo')
    expect(code.file).toBe('Demo.java')
  })

  it('câu hỏi phỏng vấn (level + prompt + answer)', () => {
    const qs = w.days[0].questions
    expect(qs).toHaveLength(2)
    expect(qs[0].level).toBe('Dễ')
    expect(qs[0].prompt).toContain('Generics')
    expect(qs[1].level).toBe('Khó')
    expect(qs[1].answerHtml).toContain('Producer')
  })

  it('quiz tách riêng, không nuốt LeetCode/Resource', () => {
    const d = w.days[0]
    expect(d.quiz).toHaveLength(1)
    expect(d.quiz[0].correct).toBe(0)
    expect(d.leetcode).toContain('Two Sum')
    expect(d.aiTool).toContain('Copilot')
    expect(d.resource).toContain('Effective Java')
  })

  it('escape generic trong nội dung ngày (regression)', () => {
    const d = w.days[0]
    expect(d.contentHtml).toContain('Stack&lt;T&gt;')
    expect(d.contentHtml).not.toMatch(/<T>/)
  })
})
