/**
 * Parser cho khóa IELTS mới — theo SÁCH "IELTS 4 kỹ năng cho người bắt đầu từ
 * con số âm — Tập 1" (Smart English). Mỗi Day là một file `IELTS/day-NN.md` do
 * skill `ielts-book-to-md` số hóa từ ảnh sách (xem .claude/skills/ielts-book-to-md).
 *
 * Khác khóa nền tảng cũ (tổ chức theo TUẦN, parseIelts.js): ở đây mỗi Day là một
 * buổi độc lập với các mục cố định của sách — Basic Grammar, Basic Vocabulary,
 * Listening/Reading/Writing/Speaking Skills, Homework — mục nào có thì parse mục đó.
 *
 * Đầu ra là dữ liệu CÓ CẤU TRÚC để view dựng hoạt động tương tác (VocabCard,
 * QuizTool, PronunciationDrill, flashcard…) chứ không chỉ HTML để đọc.
 */
import { md } from './render'

/** Tách theo heading cấp `level` (## hoặc ###), bỏ qua code fence. */
function splitByLevel(lines, level) {
  const prefix = '#'.repeat(level) + ' '
  const out = []
  let cur = null
  let inFence = false
  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence
    if (!inFence && line.startsWith(prefix)) {
      cur = { heading: line.slice(prefix.length).trim(), lines: [] }
      out.push(cur)
    } else if (cur) {
      cur.lines.push(line)
    }
  }
  return out
}

/** Parse frontmatter YAML tối giản (đủ cho schema của skill: scalar, [inline list], - {inline obj}). */
function parseFrontmatter(raw) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(raw)
  if (!m) return { data: {}, body: raw }
  const data = {}
  let curKey = null
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim()) continue
    const itemM = /^\s*-\s*(.+)$/.exec(line)
    if (itemM && curKey) {
      ;(data[curKey] = data[curKey] || []).push(parseInlineObject(itemM[1]))
      continue
    }
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line)
    if (!kv) continue
    const key = kv[1]
    const val = kv[2].trim()
    if (val === '') {
      curKey = key
      data[key] = []
    } else if (/^\[.*\]$/.test(val)) {
      curKey = null
      data[key] = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    } else {
      curKey = null
      data[key] = val.replace(/^["']|["']$/g, '')
    }
  }
  return { data, body: raw.slice(m[0].length) }
}

/** "{ file: "a.mp3", label: "X", url: "/y" }" -> object. */
function parseInlineObject(s) {
  const t = s.trim().replace(/^\{|\}$/g, '')
  const obj = {}
  const re = /([A-Za-z0-9_]+)\s*:\s*("(?:[^"\\]|\\.)*"|'[^']*'|[^,}]+)/g
  let m
  while ((m = re.exec(t))) {
    obj[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return obj
}

/** Lấy các hàng dữ liệu của bảng Markdown trong `lines` -> mảng mảng-ô (bỏ header + hàng ---). */
function parseTable(lines) {
  const rows = []
  let seenHeader = false
  for (const raw of lines) {
    const t = raw.trim()
    if (!t.startsWith('|')) {
      if (rows.length || seenHeader) break // hết bảng
      continue
    }
    const cells = t.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.every((c) => /^:?-+:?$/.test(c.replace(/\s/g, '')) || c === '')) continue // hàng ---
    if (!seenHeader) {
      seenHeader = true
      continue // bỏ hàng tiêu đề
    }
    rows.push(cells)
  }
  return rows
}

/** Tách câu song ngữ "English. (Tiếng Việt.)" -> { en, vi }. */
function splitBilingual(text) {
  const m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(text.trim())
  if (m) return { en: m[1].trim(), vi: m[2].trim() }
  return { en: text.trim(), vi: '' }
}

/** "Account (n)" -> { term:'Account', pos:'n' }. */
function splitTerm(cell) {
  const m = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(cell.trim())
  if (m) return { term: m[1].trim(), pos: m[2].trim() }
  return { term: cell.trim(), pos: '' }
}

// ————————————————————————— Grammar —————————————————————————
function parseGrammar(lines) {
  return splitByLevel(lines, 3).map((s) => ({
    title: s.heading.replace(/^\d+\.\s*/, '').trim(),
    html: md(s.lines.join('\n')),
  }))
}

// ————————————————————————— Vocabulary —————————————————————————
function parseVocabulary(lines) {
  const subs = splitByLevel(lines, 3)
  let topic = ''
  let words = []
  let phrasals = []
  let wordForms = []
  for (const s of subs) {
    if (/topic vocabulary/i.test(s.heading)) {
      topic = s.heading.replace(/topic vocabulary:\s*/i, '').trim()
      words = parseTable(s.lines).map((r) => {
        const { term, pos } = splitTerm(r[0] || '')
        const ex = splitBilingual(r[2] || '')
        return { term, pos, vi: (r[1] || '').trim(), exEn: ex.en, exVi: ex.vi }
      })
    } else if (/phrasal/i.test(s.heading)) {
      phrasals = parseTable(s.lines).map((r) => {
        const ex = splitBilingual(r[2] || '')
        return { term: (r[0] || '').trim(), vi: (r[1] || '').trim(), exEn: ex.en, exVi: ex.vi }
      })
    } else if (/word formation/i.test(s.heading)) {
      wordForms = parseTable(s.lines).map((r) => ({
        base: (r[0] || '').replace(/\s*\([^)]*\)\s*$/, '').trim(),
        baseVi: (/\(([^)]*)\)/.exec(r[0] || '') || [])[1] || '',
        noun: cleanForm(r[1]),
        verb: cleanForm(r[2]),
        adj: cleanForm(r[3]),
        adv: cleanForm(r[4]),
      }))
    }
  }
  return { topic, words, phrasals, wordForms }
}
const cleanForm = (c) => {
  const t = (c || '').trim()
  return t === '—' || t === '-' || t === '' ? '' : t
}

// ————————————————————————— Listening —————————————————————————
function parseListening(lines) {
  const subs = splitByLevel(lines, 3)
  let alphabet = []
  let intro = ''
  let practice = []
  let practiceIntro = ''
  for (const s of subs) {
    if (/alphabet/i.test(s.heading)) {
      // Bảng chữ cái xếp 3 cặp (Chữ|IPA) mỗi hàng -> tách thành từng cặp.
      for (const r of parseTable(s.lines)) {
        for (let i = 0; i + 1 < r.length; i += 2) {
          const letter = (r[i] || '').trim()
          const ipa = (r[i + 1] || '').trim()
          if (letter) alphabet.push({ letter, ipa })
        }
      }
      // Phần văn xuôi (không phải bảng) -> intro.
      intro = md(s.lines.filter((l) => !l.trim().startsWith('|')).join('\n'))
    } else if (/practice/i.test(s.heading)) {
      // Đề nằm TRƯỚC nhãn "Answer Key"; đáp án (họ được đánh vần) nằm sau.
      const before = takeBeforeKey(s.lines)
      const key = collectAnswerKey(s.lines)
      practiceIntro = before.filter((l) => !/^\s*\d+\.\s/.test(l)).join('\n').trim()
      for (const l of before) {
        const m = /^\s*(\d+)\.\s+(.+)$/.exec(l)
        if (m) practice.push({ n: Number(m[1]), prompt: m[2].trim(), answer: key[Number(m[1])] || '' })
      }
    }
  }
  return { alphabet, intro, practice, practiceIntro: md(practiceIntro) }
}

// ————————————————————————— Homework —————————————————————————
// Nhãn đáp án — khoan dung với biến thể "**Answer Key**", "**Answer Key:**",
// "**Answer Key** (ghi chú)": khớp miễn có cụm "answer key" nằm trong cặp **…**.
const ANSWER_KEY_RE = /\*\*\s*answer key\s*:?\s*\*\*/i

/** Gom "Answer Key" -> map{ số câu -> dòng đáp án } cho phần nằm sau nhãn. */
function collectAnswerKey(lines) {
  const map = {}
  let inKey = false
  for (const raw of lines) {
    if (ANSWER_KEY_RE.test(raw)) {
      inKey = true
      continue
    }
    if (!inKey) continue
    const m = /^\s*(\d+)\.\s+(.+)$/.exec(raw)
    if (m) map[Number(m[1])] = m[2].trim()
  }
  return map
}

/** Lấy giá trị sau nhãn in đậm "**Nhãn:** giá trị" (khoan dung dấu `-` đầu dòng). */
function pullField(lines, labelRe) {
  for (const raw of lines) {
    const m = labelRe.exec(raw)
    if (m) return raw.slice(m.index + m[0].length).trim()
  }
  return ''
}

/**
 * Bài tập ĐỌC HIỂU (Day 2+): mỗi "### Bài tập N — …" gồm câu hỏi song ngữ, đoạn văn
 * song ngữ, từ khóa gợi ý, đáp án ngắn (chấm được, biến thể tách bằng "|") và
 * answer key (đáp án mẫu đầy đủ). Trả về mảng object cho ReadingHomework.vue.
 */
function parseReadingExercise(sec) {
  const nm = /(\d+)/.exec(sec.heading)
  const dashM = /^\s*bài tập\s*\d+\s*[—–-]\s*(.+)$/i.exec(sec.heading)
  const answerRaw = pullField(sec.lines, /(?:-\s*)?\*\*\s*đáp án ngắn\s*:?\s*\*\*/i)
  const keywordsRaw = pullField(sec.lines, /(?:-\s*)?\*\*\s*từ khóa gợi ý\s*:?\s*\*\*/i)
  return {
    n: nm ? Number(nm[1]) : 0,
    title: dashM ? dashM[1].trim() : sec.heading.trim(),
    question: pullField(sec.lines, /(?:-\s*)?\*\*\s*câu hỏi\s*\(en\)\s*:?\s*\*\*/i),
    questionVi: pullField(sec.lines, /(?:-\s*)?\*\*\s*câu hỏi\s*\(vi\)\s*:?\s*\*\*/i),
    passage: pullField(sec.lines, /(?:-\s*)?\*\*\s*đoạn văn\s*\(en\)\s*:?\s*\*\*/i),
    passageVi: pullField(sec.lines, /(?:-\s*)?\*\*\s*đoạn văn\s*\(vi\)\s*:?\s*\*\*/i),
    keywords: keywordsRaw
      .split(/[·|]/)
      .map((k) => k.trim())
      .filter(Boolean),
    answer: answerRaw
      .split('|')
      .map((a) => a.trim())
      .filter(Boolean),
    model: pullField(sec.lines, ANSWER_KEY_RE),
  }
}

function parseHomework(lines) {
  const subs = splitByLevel(lines, 3)
  const hw = { translate: [], mcq: [], cloze: [], reading: [] }
  for (const s of subs) {
    const key = collectAnswerKey(s.lines)
    if (/bài tập/i.test(s.heading)) {
      hw.reading.push(parseReadingExercise(s))
    } else if (/^i\./i.test(s.heading) || /dịch/i.test(s.heading)) {
      // "1. Cô ấy tạo một tài khoản. (account)"
      const beforeKey = takeBeforeKey(s.lines)
      for (const raw of beforeKey) {
        const m = /^\s*(\d+)\.\s+(.+)$/.exec(raw)
        if (!m) continue
        const n = Number(m[1])
        const hintM = /\(([^)]*)\)\s*$/.exec(m[2])
        const vi = m[2].replace(/\s*\([^)]*\)\s*$/, '').trim()
        hw.translate.push({ n, vi, hint: hintM ? hintM[1].trim() : '', answer: key[n] || '' })
      }
    } else if (/chọn đáp án|^ii\./i.test(s.heading)) {
      hw.mcq = parseMcq(takeBeforeKey(s.lines), key)
    } else if (/điền vào|^iii\./i.test(s.heading)) {
      hw.cloze = parseCloze(takeBeforeKey(s.lines), key)
    }
  }
  return hw
}

/** Lấy các dòng TRƯỚC nhãn "**Answer Key**" (phần đề bài). */
function takeBeforeKey(lines) {
  const i = lines.findIndex((l) => ANSWER_KEY_RE.test(l))
  return i === -1 ? lines : lines.slice(0, i)
}

/** "a) Log in · b) Set up · c) Turn on" + key "c) Turn on" -> {q,opts,correct,ex}. */
function parseMcq(lines, key) {
  const out = []
  let cur = null
  for (const raw of lines) {
    const qm = /^\s*(\d+)\.\s+(.+)$/.exec(raw)
    const om = /^\s{2,}([a-c]\).+)$/.exec(raw) || /^\s*([a-c]\)\s.+·.+)$/.exec(raw)
    if (qm) {
      if (cur) out.push(finishMcq(cur, key))
      cur = { n: Number(qm[1]), q: qm[2].trim(), optLine: '' }
    } else if (cur && /[a-c]\)/.test(raw)) {
      cur.optLine += (cur.optLine ? ' ' : '') + raw.trim()
    }
  }
  if (cur) out.push(finishMcq(cur, key))
  return out.filter(Boolean)
}
function finishMcq(cur, key) {
  const opts = cur.optLine
    .split('·')
    .map((s) => s.trim().replace(/^[a-c]\)\s*/, '').trim())
    .filter(Boolean)
  const ans = key[cur.n] || ''
  const letterM = /^([a-c])\)/.exec(ans)
  let correct = 0
  if (letterM) correct = letterM[1].charCodeAt(0) - 97
  else {
    const txt = ans.replace(/^[a-c]\)\s*/, '').trim().toLowerCase()
    const idx = opts.findIndex((o) => o.toLowerCase() === txt)
    if (idx >= 0) correct = idx
  }
  if (!opts.length) return null
  return { q: cur.q, opts, correct, ex: ans ? `Đáp án: ${ans}` : '' }
}

/** "1. She usually _____ (go) ..." + key "goes" -> {type:'cloze', q, answer[], ex}. */
function parseCloze(lines, key) {
  const out = []
  for (const raw of lines) {
    const m = /^\s*(\d+)\.\s+(.+)$/.exec(raw)
    if (!m) continue
    const n = Number(m[1])
    const ansRaw = key[n] || ''
    // "does not understand (doesn't understand)" -> ['does not understand','doesn't understand']
    const variants = []
    const parenM = /\(([^)]*)\)\s*$/.exec(ansRaw)
    variants.push(ansRaw.replace(/\s*\([^)]*\)\s*$/, '').trim())
    if (parenM) variants.push(parenM[1].trim())
    out.push({ type: 'cloze', q: m[2].trim(), answer: variants.filter(Boolean), ex: ansRaw ? `Đáp án: ${ansRaw}` : '' })
  }
  return out
}

// ————————————————————————— Entry —————————————————————————
export function parseIeltsBookDay(raw) {
  const { data, body } = parseFrontmatter(raw)
  const lines = body.split(/\r?\n/)

  // Tiêu đề + Aims (blockquote đầu, trước ## đầu tiên).
  const titleM = /^#\s+(.+)$/m.exec(body)
  const title = data.title || (titleM ? titleM[1].trim() : `Day ${data.day || ''}`)
  let aims = ''
  for (const l of lines) {
    if (l.startsWith('## ')) break
    if (l.trim().startsWith('>')) aims += l.replace(/^\s*>\s?/, '') + '\n'
  }

  const h2 = splitByLevel(lines, 2)
  let grammar = []
  let vocab = { topic: '', words: [], phrasals: [], wordForms: [] }
  let listening = null
  let reading = ''
  let writing = ''
  let speaking = ''
  let homework = { translate: [], mcq: [], cloze: [], reading: [] }

  for (const sec of h2) {
    const h = sec.heading
    if (/basic grammar/i.test(h)) grammar = parseGrammar(sec.lines)
    else if (/basic vocabulary/i.test(h)) vocab = parseVocabulary(sec.lines)
    else if (/listening/i.test(h)) listening = parseListening(sec.lines)
    else if (/reading/i.test(h)) reading = md(sec.lines.join('\n'))
    else if (/writing/i.test(h)) writing = md(sec.lines.join('\n'))
    else if (/speaking/i.test(h)) speaking = md(sec.lines.join('\n'))
    else if (/homework/i.test(h)) homework = parseHomework(sec.lines)
  }

  return {
    day: Number(data.day) || 0,
    title,
    aims: md(aims),
    topicVocabulary: data.topicVocabulary || vocab.topic || '',
    audio: Array.isArray(data.audio) ? data.audio : [],
    sections: Array.isArray(data.sections) ? data.sections : [],
    grammar,
    vocab,
    listening,
    reading,
    writing,
    speaking,
    homework,
  }
}
