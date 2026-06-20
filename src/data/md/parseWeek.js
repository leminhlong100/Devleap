/**
 * Parser Markdown -> dữ liệu khóa học có cấu trúc.
 *
 * Mỗi file weeks/tuan-NN.md có khung chung:
 *   # {emoji} Tuần {N} · {tiêu đề} · {khoảng ngày}
 *   ## {…} {phần tổng quan — chứa bảng lịch học}
 *   ## {emoji} Ngày {N} · {tiêu đề ngày}      (một hoặc nhiều)
 *   ## {…} Tổng Kết Tuần {N}                  (phần tổng kết)
 *
 * Thân mỗi ngày có format hơi khác nhau giữa các tuần, nên parser tách theo
 * mốc nhận diện được (dòng meta, blockquote tiếng Anh, code fence, câu hỏi
 * phỏng vấn, khối LeetCode/AI/Resource) rồi phần còn lại render thành HTML.
 */
import { marked } from 'marked'
import { parseQuiz } from './quiz'

marked.setOptions({ breaks: false, gfm: true })

const md = (src) => (src && src.trim() ? marked.parse(src.trim()) : '')

// Nhận diện dòng bắt đầu một câu hỏi phỏng vấn: **Dễ · …**, **Trung 3 · …**,
// **Khó 5 · …**, **Mock EN · …**, **Cực khó · …**
// Lưu ý: KHÔNG dùng \b sau nhãn — chữ có dấu (Dễ, Khó) không phải ký tự \w nên
// \b sẽ không khớp và làm rớt câu hỏi. Dấu "·" đã đủ phân tách.
const Q_RE = /^\*\*\s*(Cực khó|Cực Khó|Mock EN|Dễ|Trung|Khó|Mock)\s*\d*\s*·\s*([\s\S]+?)\*\*\s*$/

// Nhận diện mốc bắt đầu khối LeetCode / AI Tool / Resource ở cuối mỗi ngày.
// Bỏ qua emoji/markup đứng đầu để khớp được mọi biến thể format giữa các tuần
// ("- **🧩 LeetCode:**", "- **🛠️ AI Tools:**", "- **📖 Resource:**", "LeetCode").
const LEAD_EMOJI = /^[\p{Extended_Pictographic}️‍]+\s*/u
function head(line) {
  return line
    .trim()
    .replace(/^[-*>\s]+/, '')
    .replace(/\*\*/g, '')
    .replace(LEAD_EMOJI, '')
    .trimStart()
}
const isLeetStart = (l) => /^LeetCode\b/i.test(head(l))
const isAiStart = (l) => /^AI Tools?\b/i.test(head(l))
const isResStart = (l) => /^(Resources?|Tài Nguyên|Tài Liệu)\b/i.test(head(l))
// Dòng giải thích quiz bắt đầu bằng 💡 — không phải khối tài nguyên cuối ngày.
// (head() strip emoji nên "💡 Resource…" dễ bị nhầm là "Resource:".)
const isQuizExpl = (l) => /^\s*💡/u.test(l)
const isTrailingStart = (l) => !isQuizExpl(l) && (isLeetStart(l) || isAiStart(l) || isResStart(l))

// Bỏ nhãn ("LeetCode:", "AI Tools:", "Resource:") để lấy phần nội dung.
function stripLabel(line) {
  return head(line)
    .replace(/^(LeetCode|AI Tools?|Resources?|Tài Nguyên|Tài Liệu)\s*:?\s*/i, '')
    .trim()
}

/** Tách toàn bộ file theo các heading cấp 2 (## …). */
function splitSections(raw) {
  const lines = raw.split(/\r?\n/)
  const sections = []
  let cur = null
  let inFence = false
  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence
    const h2 = !inFence && /^##\s+(.+)$/.exec(line)
    if (h2) {
      cur = { heading: h2[1].trim(), lines: [] }
      sections.push(cur)
    } else if (cur) {
      cur.lines.push(line)
    }
    // dòng trước heading ## đầu tiên (gồm cả tiêu đề # ) được xử lý riêng.
  }
  return sections
}

/** Đọc tiêu đề tuần: "# 📗 Tuần 1 · Java Core: … · 11/05–17/05/2025" */
function parseTitle(raw) {
  const m = /^#\s+(.+)$/m.exec(raw)
  if (!m) return { emoji: '📘', num: 0, title: '', dateRange: '' }
  const text = m[1].trim()
  const em = /^(\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*)\s*/u.exec(text)
  const emoji = em ? em[1] : '📘'
  const rest = em ? text.slice(em[0].length) : text
  const parts = rest.split('·').map((s) => s.trim())
  const numM = /Tuần\s+(\d+)/i.exec(parts[0] || '')
  const num = numM ? Number(numM[1]) : 0
  // khoảng ngày = phần cuối nếu trông giống ngày tháng
  let dateRange = ''
  if (parts.length > 1 && /\d{1,2}\/\d{1,2}/.test(parts[parts.length - 1])) {
    dateRange = parts.pop()
  }
  const title = parts.slice(1).join(' · ').trim()
  return { emoji, num, title, dateRange }
}

/** Bảng lịch học trong phần tổng quan -> [{date, weekday, mode, time, topic}] */
function parseSchedule(sectionLines) {
  const rows = []
  let headerSeen = false
  for (const line of sectionLines) {
    const t = line.trim()
    if (!/^\|/.test(t)) {
      if (headerSeen && rows.length) break // hết bảng
      continue
    }
    const cells = t.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length < 5) continue
    if (/^-+$/.test(cells[0].replace(/\s/g, ''))) continue // dòng phân cách | --- |
    if (!headerSeen) {
      headerSeen = true
      if (/ngày/i.test(cells[0]) && /thứ/i.test(cells[1])) continue // dòng tiêu đề
    }
    rows.push({ date: cells[0], weekday: cells[1], mode: cells[2], time: cells[3], topic: cells[4] })
  }
  return rows
}

/** Dòng meta của ngày: "**01/06 · Thứ 2** · **LIGHT** · 1.5h" */
function parseDayMeta(lines) {
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (!t.startsWith('**')) continue
    const bolds = [...t.matchAll(/\*\*(.+?)\*\*/g)].map((m) => m[1].trim())
    if (bolds.length < 2) continue
    // date · weekday
    const dm = /^([\d/]+)\s*[·—-]\s*(.+)$/.exec(bolds[0])
    const date = dm ? dm[1].trim() : bolds[0]
    const weekday = dm ? dm[2].trim() : ''
    const mode = bolds[1]
    // phần thời gian = đoạn sau bold thứ 2
    const after = t.split(/\*\*/).slice(4).join('').trim()
    const time = after.replace(/^[·\s⏱]+/, '').trim()
    return { metaIndex: i, date, weekday, mode, time }
  }
  return { metaIndex: -1, date: '', weekday: '', mode: '', time: '' }
}

/** Blockquote tiếng Anh ngay sau dòng meta -> {html, vocab[], endIndex} */
function parseEnglishBlock(lines, start) {
  let i = start
  while (i < lines.length && lines[i].trim() === '') i++
  if (i >= lines.length || !lines[i].trim().startsWith('>')) return { html: '', vocab: [], endIndex: start }
  const buf = []
  while (i < lines.length && (lines[i].trim().startsWith('>') || (buf.length && lines[i].trim() === '' && lines[i + 1] && lines[i + 1].trim().startsWith('>')))) {
    buf.push(lines[i].replace(/^\s*>\s?/, ''))
    i++
  }
  const text = buf.join('\n')
  // Lấy danh sách từ vựng: cụm in nghiêng *a, b, c* có dấu phẩy.
  // Bỏ ** (in đậm) trước để tránh dính sao của "**Vocalmax**: *từ, từ*".
  let vocab = []
  const clean = text.replace(/\*\*/g, '')
  const ital = [...clean.matchAll(/\*([^*]+)\*/g)].map((m) => m[1])
  const list = ital.find((s) => (s.match(/,/g) || []).length >= 2)
  if (list) {
    vocab = list
      .split(',')
      .map((w) => w.trim().replace(/[."'`]+$/g, '').replace(/^["'`]+/g, '').trim())
      .filter((w) => w && w.length <= 40 && w.split(/\s+/).length <= 4 && !/\s{2,}/.test(w))
    if (vocab.length < 3) vocab = [] // có thể là câu shadowing, không phải danh sách từ
  }
  // Bỏ cụm in đậm/nghiêng rỗng "****" "**" còn sót trong nguồn.
  const display = text.replace(/\*\*\s*\*\*/g, '').replace(/(^|\s)\*\*(\s|$)/g, '$1$2')
  return { html: md(display), vocab, endIndex: i }
}

/** Tách khối LeetCode/AI/Resource ở cuối; trả về {leetcode, aiTool, resource, bodyEnd} */
function parseTrailing(lines, qaEnd) {
  let start = -1
  for (let i = qaEnd; i < lines.length; i++) {
    if (isTrailingStart(lines[i])) {
      start = i
      break
    }
  }
  if (start === -1) return { leetcode: '', aiTool: '', resource: '', bodyEnd: lines.length }
  const result = { leetcode: '', aiTool: '', resource: '' }
  let bucket = null
  const flush = []
  const lump = []
  for (let i = start; i < lines.length; i++) {
    const raw = lines[i]
    const t = raw.trim()
    if (t === '') continue
    let label = null
    if (isLeetStart(t)) label = 'leetcode'
    else if (isAiStart(t)) label = 'aiTool'
    else if (isResStart(t)) label = 'resource'
    if (label) {
      bucket = label
      const inline = stripLabel(t)
      lump.push([label, inline])
    } else if (bucket) {
      lump.push([bucket, t])
    }
  }
  for (const [b, txt] of lump) {
    if (!txt) continue
    result[b] = result[b] ? `${result[b]} ${txt}` : txt
  }
  void flush
  return { ...result, bodyEnd: start }
}

/** Tách câu hỏi phỏng vấn trong khoảng [start, end). */
function parseQuestions(lines, start, end) {
  const questions = []
  let qStart = -1
  for (let i = start; i < end; i++) {
    if (Q_RE.test(lines[i].trim())) {
      qStart = i
      break
    }
  }
  if (qStart === -1) return { questions, qaStart: end }
  let i = qStart
  while (i < end) {
    const m = Q_RE.exec(lines[i].trim())
    if (!m) {
      i++
      continue
    }
    const level = m[1] === 'Mock' ? 'Mock EN' : m[1]
    const prompt = m[2].replace(/\s+/g, ' ').trim()
    // gom câu trả lời tới câu hỏi kế tiếp / hết khoảng
    const ans = []
    let j = i + 1
    for (; j < end; j++) {
      if (Q_RE.test(lines[j].trim())) break
      ans.push(lines[j])
    }
    questions.push({ level, prompt, answerHtml: md(ans.join('\n')) })
    i = j
  }
  return { questions, qaStart: qStart }
}

/** Lấy code fence đầu tiên trong các dòng body. */
function extractFirstCode(bodyLines) {
  let open = -1
  let lang = ''
  for (let i = 0; i < bodyLines.length; i++) {
    const fm = /^```(\w*)/.exec(bodyLines[i].trim())
    if (fm) {
      open = i
      lang = fm[1] || ''
      break
    }
  }
  if (open === -1) return { code: null, rest: bodyLines }
  let close = -1
  for (let i = open + 1; i < bodyLines.length; i++) {
    if (/^```/.test(bodyLines[i].trim())) {
      close = i
      break
    }
  }
  if (close === -1) return { code: null, rest: bodyLines }
  const codeText = bodyLines.slice(open + 1, close).join('\n')
  const rest = [...bodyLines.slice(0, open), ...bodyLines.slice(close + 1)]
  // đoán tên file
  let file = ''
  const fileM = /(?:\/\/|#)\s*([\w.-]+\.(?:java|yml|yaml|properties|xml|json|sql))/i.exec(codeText)
  const classM = /\b(?:public\s+)?(?:final\s+)?(?:class|interface|enum|record)\s+(\w+)/.exec(codeText)
  if (fileM) file = fileM[1]
  else if (classM) file = `${classM[1]}.java`
  else if (lang) file = `snippet.${lang === 'java' ? 'java' : lang}`
  else file = 'Code mẫu'
  return { code: { lang: lang || 'java', file, code: codeText }, rest }
}

/** Parse một section ngày -> object chi tiết. */
function parseDay(section, n) {
  const lines = section.lines
  const em = /^(\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*)\s*/u.exec(section.heading)
  const emoji = em ? em[1] : '📄'
  let title = (em ? section.heading.slice(em[0].length) : section.heading).trim()
  title = title.replace(/^Ngày\s+\d+\s*·?\s*/i, '').trim()

  const { metaIndex, date, weekday, mode, time } = parseDayMeta(lines)
  const eng = parseEnglishBlock(lines, metaIndex === -1 ? 0 : metaIndex + 1)

  const contentStart = eng.endIndex
  // Vị trí câu hỏi đầu tiên (nếu có) để khoanh vùng quét khối LeetCode/AI/Resource.
  let qFirst = -1
  for (let i = contentStart; i < lines.length; i++) {
    if (Q_RE.test(lines[i].trim())) {
      qFirst = i
      break
    }
  }
  const scanFrom = qFirst === -1 ? contentStart : qFirst
  const { leetcode, aiTool, resource, bodyEnd } = parseTrailing(lines, scanFrom)

  // Khối quiz (### … Quiz …) nằm trước khối trailing; tách riêng để không lẫn
  // vào câu trả lời phỏng vấn / lý thuyết / bài tập.
  let quizStart = -1
  for (let i = contentStart; i < bodyEnd; i++) {
    if (/^###\s+.*quiz/i.test(lines[i].trim())) {
      quizStart = i
      break
    }
  }
  const quiz = quizStart === -1 ? [] : parseQuiz(lines, quizStart + 1, bodyEnd)
  const contentEnd = quizStart === -1 ? bodyEnd : quizStart

  // câu trả lời chỉ chạy tới đầu khối quiz/trailing, không nuốt quiz/LeetCode/Resource.
  const { questions } = parseQuestions(lines, contentStart, contentEnd)

  // body = từ sau blockquote tới đầu khối câu hỏi (hoặc quiz/trailing nếu không có hỏi)
  const bodyTo = qFirst === -1 ? contentEnd : qFirst
  const bodyLines = lines.slice(contentStart, bodyTo)
  const { code, rest } = extractFirstCode(bodyLines)

  // exercises: bắt các mục danh sách "1." hoặc "- " trong body (loại bỏ trailing)
  const exercises = []
  for (const l of rest) {
    const t = l.trim()
    const m = /^(?:\d+\.|[-*])\s+(.+)$/.exec(t)
    if (m && !isTrailingStart(t)) {
      exercises.push(m[1].replace(/\*\*/g, '').trim())
    }
  }

  return {
    n,
    emoji,
    title,
    date,
    weekday,
    mode,
    time,
    englishHtml: eng.html,
    vocab: eng.vocab,
    contentHtml: md(rest.join('\n')),
    code,
    exercises,
    questions,
    quiz,
    leetcode,
    aiTool,
    resource,
  }
}

/** Đầu vào: nội dung 1 file tuần. Đầu ra: object tuần có cấu trúc. */
export function parseWeek(raw) {
  const meta = parseTitle(raw)
  const sections = splitSections(raw)

  let schedule = []
  let scheduleIdx = -1
  for (let i = 0; i < sections.length; i++) {
    const rows = parseSchedule(sections[i].lines)
    if (rows.length >= 3) {
      schedule = rows
      scheduleIdx = i
      break
    }
  }

  const candidates = []
  let summaryHtml = ''
  sections.forEach((s, i) => {
    if (i === scheduleIdx) return
    // Ưu tiên nhận diện ngày trước: tiêu đề "Ngày N" vẫn là ngày dù có chữ "Tổng kết".
    if (/Ngày\s+\d+/i.test(s.heading)) {
      candidates.push(parseDay(s, candidates.length + 1))
      return
    }
    if (/Tổng\s*[Kk]ết/i.test(s.heading)) {
      summaryHtml += md(s.lines.join('\n'))
    }
  })

  // Bỏ section ngày rỗng (vd. heading "Ngày 9 · Review" chỉ là chỗ trống),
  // rồi đánh số lại tuần tự 1..K.
  const days = candidates
    .filter((d) => d.contentHtml || d.questions.length || d.code || d.exercises.length || d.quiz.length)
    .map((d, idx) => ({ ...d, n: idx + 1 }))

  return { ...meta, schedule, days, summaryHtml }
}
