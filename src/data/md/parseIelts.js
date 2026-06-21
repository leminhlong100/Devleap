/**
 * Parser cho khóa IELTS nền tảng — Base_English/NenTang_TuanN.md.
 *
 * Khác với khóa Java (mỗi ngày là một section đầy đủ), IELTS tổ chức nội dung
 * theo CHỦ ĐỀ ở cấp tuần:
 *   # Tuần N — Title (phụ đề tiếng Việt)
 *   ## 🎯 Mục tiêu & Trọng tâm tuần  (+ ### Nhịp học hằng ngày = bảng theo ngày)
 *   ## 📖 Ngữ pháp trọng tâm         (### từng điểm ngữ pháp)
 *   ## 🗂️ Phòng từ vựng             (### từng nhóm: **Từ chính:** a, b, c …)
 *   ## 🛠️/🏋️ Kỹ năng & Khung mẫu / Ngân hàng luyện tập
 *   ## 📅 Lịch học 7 ngày            (### Day N = checklist [ ])
 *   ## 📝 Kịch bản bài học           (### Bài học N.M)
 *   ## ✅ Quiz tuần N
 *
 * "Ngày" IELTS chỉ là checklist; nội dung học nằm ở cấp tuần (grammar/vocab),
 * nên getIeltsDay (ở courseIelts.js) ghép checklist của ngày + ngữ cảnh tuần.
 */
import { parseQuiz } from './quiz'
import { md } from './render'

/** Tách theo heading cấp `level` (## hoặc ###), bỏ qua code fence. */
function splitByLevel(lines, level) {
  const prefix = '#'.repeat(level) + ' '
  const sections = []
  let cur = null
  let inFence = false
  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence
    if (!inFence && line.startsWith(prefix)) {
      cur = { heading: line.slice(prefix.length).trim(), lines: [] }
      sections.push(cur)
    } else if (cur) {
      cur.lines.push(line)
    }
  }
  return sections
}

/** Tiêu đề tuần: "# Tuần 1 — Reset & Diagnostic (Khởi động và kiểm tra nền)" */
function parseTitle(raw) {
  const m = /^#\s+(.+)$/m.exec(raw)
  if (!m) return { num: 0, title: '', subtitle: '' }
  const text = m[1].trim()
  const numM = /Tuần\s+(\d+)/i.exec(text)
  const num = numM ? Number(numM[1]) : 0
  let rest = text.replace(/^Tuần\s+\d+\s*[—–-]\s*/i, '')
  let subtitle = ''
  const par = /\(([^)]+)\)\s*$/.exec(rest)
  if (par) {
    subtitle = par[1].trim()
    rest = rest.slice(0, par.index).trim()
  }
  return { num, title: rest.trim(), subtitle }
}

/** Bảng "Nhịp học hằng ngày": | Day | Nhiệm vụ chính | Sản phẩm nhỏ | Ôn tập | */
function parseRhythm(lines) {
  const rows = []
  let headerSeen = false
  for (const line of lines) {
    const t = line.trim()
    if (!/^\|/.test(t)) {
      if (headerSeen && rows.length) break
      continue
    }
    const cells = t.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length < 2) continue
    if (/^-+$/.test(cells[0].replace(/\s/g, ''))) continue
    if (!headerSeen) {
      headerSeen = true
      if (/day/i.test(cells[0]) && /nhiệm/i.test(cells[1] || '')) continue
    }
    rows.push({ day: cells[0], task: cells[1] || '', product: cells[2] || '', review: cells[3] || '' })
  }
  return rows
}

/** Lấy danh sách từ trong "**Từ chính:** a, b, c, …" của một nhóm từ vựng. */
function parseThemeWords(lines) {
  const text = lines.join('\n')
  const m = /(?:\*\*)?Từ chính:(?:\*\*)?\s*([^\n]+)/i.exec(text)
  if (!m) return []
  return m[1]
    .split(',')
    .map((w) => w.trim().replace(/[.*`]+$/g, '').replace(/^[.*`]+/, '').trim())
    .filter((w) => w && w.length <= 40 && w.split(/\s+/).length <= 4)
}

/** Checklist của một ngày: các dòng "- [ ] …". */
function parseChecklist(lines) {
  const items = []
  for (const l of lines) {
    const m = /^\s*[-*]\s*\[[ xX]?\]\s*(.+)$/.exec(l)
    if (m) items.push(m[1].trim())
  }
  return items
}

export function parseIeltsWeek(raw) {
  const lines = raw.split(/\r?\n/)
  const meta = parseTitle(raw)

  // intro = blockquote đầu tiên (trước ## đầu tiên)
  let intro = ''
  for (const l of lines) {
    if (l.startsWith('## ')) break
    if (l.trim().startsWith('>')) intro += l.replace(/^\s*>\s?/, '') + '\n'
  }

  const h2 = splitByLevel(lines, 2)

  const grammar = []
  const vocabThemes = []
  const skills = []
  const lessonScripts = []
  let goalsHtml = ''
  let rhythm = []
  let quizHtml = ''

  for (const sec of h2) {
    const h = sec.heading
    if (/Mục tiêu|Trọng tâm tuần/i.test(h)) {
      const subs = splitByLevel(sec.lines, 3)
      const rhythmSub = subs.find((s) => /Nhịp học/i.test(s.heading))
      if (rhythmSub) rhythm = parseRhythm(rhythmSub.lines)
      // phần bullet mục tiêu nằm trước ### đầu tiên
      const top = []
      for (const l of sec.lines) {
        if (l.startsWith('### ')) break
        top.push(l)
      }
      goalsHtml = md(top.join('\n'))
    } else if (/Ngữ pháp/i.test(h)) {
      for (const s of splitByLevel(sec.lines, 3)) {
        grammar.push({ title: s.heading, html: md(s.lines.join('\n')) })
      }
    } else if (/từ vựng|Phòng từ vựng/i.test(h)) {
      for (const s of splitByLevel(sec.lines, 3)) {
        vocabThemes.push({ title: s.heading, words: parseThemeWords(s.lines), html: md(s.lines.join('\n')) })
      }
    } else if (/Kỹ năng|Khung mẫu|luyện tập/i.test(h)) {
      skills.push({ title: h.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '').trim(), html: md(sec.lines.join('\n')) })
    } else if (/Quiz/i.test(h)) {
      quizHtml = md(sec.lines.join('\n'))
    }
    // các section khác (Lịch học, Kịch bản, Mini-mock) xử lý qua quét ### bên dưới
  }

  // Days, lesson scripts & quiz trắc nghiệm: quét toàn bộ ### theo thứ tự.
  const allH3 = splitByLevel(lines, 3)
  const days = []
  let weekQuiz = []
  for (const s of allH3) {
    const dm = /^Day\s+(\d+)/i.exec(s.heading)
    if (dm) {
      days.push({
        rawDay: Number(dm[1]),
        n: days.length + 1,
        checklist: parseChecklist(s.lines),
        html: md(s.lines.join('\n')),
      })
    } else if (/Quiz\s*Nhanh/i.test(s.heading)) {
      // Khối MCQ (### 🧠 Quiz Nhanh) bên trong "## ✅ Quiz tuần N".
      weekQuiz = parseQuiz(s.lines)
    } else if (/^Bài học/i.test(s.heading)) {
      lessonScripts.push({ title: s.heading.replace(/^Bài học\s*[\d.]*\s*[—–-]?\s*/i, '').trim(), html: md(s.lines.join('\n')) })
    }
  }

  return { ...meta, intro: md(intro), goalsHtml, rhythm, grammar, vocabThemes, skills, days, lessonScripts, quizHtml, weekQuiz }
}
