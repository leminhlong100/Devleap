/**
 * Chỉ mục tìm kiếm toàn cục — gom toàn bộ nội dung Java + IELTS + Giao Tiếp Thực
 * Chiến thành một mảng phẳng các "entry" để tra cứu nhanh ở client. Với ~170 ngày
 * học, không có search thì gần như không điều hướng được.
 *
 * Mỗi entry thuộc một trong ba loại:
 *   lesson — một ngày/buổi học (điều hướng tới java-day / ielts-day / comm-day)
 *   vocab  — một từ vựng tiếng Anh (gộp trùng theo từng khóa)
 *   term   — thuật ngữ / chủ đề (câu hỏi phỏng vấn Java, ngữ pháp & chủ đề IELTS)
 *
 * Tìm kiếm bỏ dấu tiếng Việt nên gõ "ke thua" vẫn ra "kế thừa".
 */
import { javaWeeksData } from './course'
import { ieltsBookDays, IELTS_BOOK_WEEK } from './ieltsBook'
import { commWeeksData } from './courseComm'

/** Bỏ dấu tiếng Việt + thường hóa để so khớp không phân biệt dấu/hoa-thường. */
export function normalize(str) {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // dấu thanh + dấu mũ
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Gỡ thẻ HTML + giải mã vài entity để lấy đoạn xem trước thuần văn bản. */
function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#3?9;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const clean = (s) => (s || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
const clip = (s, n = 140) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

/** Hoàn thiện một entry: thêm trường chuẩn hóa để chấm điểm nhanh lúc tìm. */
function finalize(entry) {
  entry.titleNorm = normalize(entry.title)
  entry.hayNorm = normalize([entry.title, entry.subtitle, ...(entry.keywords || [])].join(' '))
  delete entry.keywords
  return entry
}

/** Dựng toàn bộ chỉ mục từ dữ liệu khóa học đã parse. */
export function buildSearchIndex() {
  const entries = []

  // -------------------- JAVA --------------------
  // Một entry per bài học/câu hỏi, gộp trùng câu hỏi theo nội dung trong khóa.
  const termSeen = new Map()

  for (const week of javaWeeksData) {
    for (const day of week.days) {
      const ctx = `Tuần ${week.num} · Ngày ${day.n}`
      const route = { name: 'java-day', params: { week: week.num, day: day.n } }
      const snippet = clip(stripHtml(day.contentHtml))

      entries.push(
        finalize({
          id: `java-l-${week.num}-${day.n}`,
          type: 'lesson',
          course: 'java',
          courseLabel: 'Java',
          icon: day.emoji || '📄',
          title: clean(day.title) || `Ngày ${day.n}`,
          subtitle: `${ctx} · ${clean(week.title)}`,
          snippet,
          week: week.num,
          day: day.n,
          route,
          keywords: [
            clean(week.title),
            ...day.exercises.map(clean),
            ...day.questions.map((q) => clean(q.prompt)),
          ],
        }),
      )

      // Câu hỏi phỏng vấn = thuật ngữ/chủ đề Java.
      for (const q of day.questions) {
        const prompt = clean(q.prompt)
        const key = normalize(prompt)
        if (!key || termSeen.has(key)) continue
        const e = finalize({
          id: `java-t-${week.num}-${day.n}-${termSeen.size}`,
          type: 'term',
          course: 'java',
          courseLabel: 'Java',
          icon: '💬',
          title: clip(prompt, 90),
          subtitle: `Câu hỏi phỏng vấn (${q.level}) · ${ctx}`,
          snippet: clip(stripHtml(q.answerHtml)),
          week: week.num,
          day: day.n,
          route,
          keywords: [clean(week.title)],
        })
        termSeen.set(key, e)
        entries.push(e)
      }
    }
  }

  // -------------------- IELTS (theo sách — 15 buổi) --------------------
  const ivVocabSeen = new Map()
  const itTermSeen = new Map()

  for (const day of ieltsBookDays) {
    const dctx = `IELTS · Day ${day.day}`
    const route = { name: 'ielts-day', params: { week: IELTS_BOOK_WEEK, day: day.day } }

    entries.push(
      finalize({
        id: `ielts-l-${day.day}`,
        type: 'lesson',
        course: 'ielts',
        courseLabel: 'IELTS',
        icon: '🎧',
        title: clean(day.title) || `Day ${day.day}`,
        subtitle: `${dctx}${day.topicVocabulary ? ' · ' + clean(day.topicVocabulary) : ''}`,
        snippet: clip((day.grammar || []).map((g) => clean(g.title)).join(' · ')),
        week: IELTS_BOOK_WEEK,
        day: day.day,
        route,
        keywords: [clean(day.title), clean(day.topicVocabulary), ...(day.grammar || []).map((g) => clean(g.title))],
      }),
    )

    // Từ vựng của buổi -> điều hướng tới đúng buổi (dedup theo từ).
    for (const word of day.vocab?.words || []) {
      const key = normalize(word.term)
      if (!key) continue
      const hit = ivVocabSeen.get(key)
      if (hit) {
        hit._count++
        continue
      }
      const e = finalize({
        id: `ielts-v-${day.day}-${key}`,
        type: 'vocab',
        course: 'ielts',
        courseLabel: 'IELTS',
        icon: '🔤',
        title: clean(word.term),
        subtitle: `Từ vựng · ${clean(day.topicVocabulary)} · ${dctx}`,
        snippet: clean(word.vi),
        week: IELTS_BOOK_WEEK,
        day: day.day,
        route,
        keywords: [clean(word.vi), clean(day.topicVocabulary)],
      })
      e._count = 1
      ivVocabSeen.set(key, e)
      entries.push(e)
    }

    // Ngữ pháp = thuật ngữ IELTS.
    for (const g of day.grammar || []) {
      const title = clean(g.title)
      const key = normalize(title)
      if (!key || itTermSeen.has(key)) continue
      const e = finalize({
        id: `ielts-t-${day.day}-${itTermSeen.size}`,
        type: 'term',
        course: 'ielts',
        courseLabel: 'IELTS',
        icon: '📖',
        title,
        subtitle: `Ngữ pháp · ${dctx}`,
        snippet: '',
        week: IELTS_BOOK_WEEK,
        day: day.day,
        route,
        keywords: [clean(day.title)],
      })
      itTermSeen.set(key, e)
      entries.push(e)
    }
  }

  // -------------------- GIAO TIẾP THỰC CHIẾN (comm) --------------------
  // Cùng khuôn IELTS (parseCommWeek bọc parseIeltsWeek) + section 🎭 tình huống
  // roleplay -> mỗi tình huống thành một "term" điều hướng tới đúng buổi.
  for (const week of commWeeksData) {
    const wctx = `Giao tiếp · Tuần ${week.num}`

    week.days.forEach((day, idx) => {
      const rhythm = week.rhythm[idx] || null
      const title = clean(rhythm?.task?.replace(/\s*\.?\s*$/, '')) || `Buổi ${day.n}`
      const route = { name: 'comm-day', params: { week: week.num, day: day.n } }
      const snippet = clip([rhythm?.product, ...(day.checklist || [])].filter(Boolean).map(clean).join(' · '))

      entries.push(
        finalize({
          id: `comm-l-${week.num}-${day.n}`,
          type: 'lesson',
          course: 'comm',
          courseLabel: 'Giao tiếp',
          icon: '🎭',
          title,
          subtitle: `${wctx} · Buổi ${day.n} · ${clean(week.title)}`,
          snippet,
          week: week.num,
          day: day.n,
          route,
          keywords: [
            clean(week.title),
            clean(week.subtitle),
            clean(rhythm?.product),
            ...(day.checklist || []).map(clean),
          ],
        }),
      )
    })

    // Tình huống roleplay = thuật ngữ/chủ đề của khóa comm -> tới đúng buổi N.D.
    for (const sc of week.scenarios || []) {
      const title = clean(sc.title)
      if (!title) continue
      entries.push(
        finalize({
          id: `comm-s-${week.num}-${sc.day}`,
          type: 'term',
          course: 'comm',
          courseLabel: 'Giao tiếp',
          icon: '🎭',
          title,
          subtitle: `Tình huống ${sc.id} · ${wctx}`,
          snippet: clip(clean([sc.setting, ...(sc.tasks || [])].filter(Boolean).join(' · '))),
          week: week.num,
          day: sc.day,
          route: { name: 'comm-day', params: { week: week.num, day: sc.day } },
          keywords: [clean(week.title), clean(sc.role)],
        }),
      )
    }
  }

  return entries
}

/** Chỉ mục dựng sẵn một lần (dữ liệu khóa học là tĩnh trong suốt phiên). */
export const searchEntries = buildSearchIndex()

const TYPE_WEIGHT = { lesson: 6, vocab: 3, term: 1 }

/** Chấm điểm một entry với truy vấn đã chuẩn hóa + danh sách token (AND). */
function scoreEntry(entry, qNorm, tokens) {
  const { titleNorm, hayNorm } = entry
  let score = 0
  for (const tok of tokens) {
    if (!hayNorm.includes(tok)) return 0 // mọi token phải xuất hiện
    if (titleNorm === tok) score += 100
    else if (titleNorm.startsWith(tok)) score += 45
    else if (new RegExp(`\\b${escapeReg(tok)}`).test(titleNorm)) score += 30
    else if (titleNorm.includes(tok)) score += 18
    else score += 6 // chỉ khớp ở từ khóa/phụ đề
  }
  if (qNorm && titleNorm.includes(qNorm)) score += 25 // khớp nguyên cụm
  score += TYPE_WEIGHT[entry.type] || 0
  return score
}

const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Tìm toàn cục. Trả về mảng entry (đã loại trường nội bộ) kèm `score`,
 * sắp theo điểm giảm dần. `limit` mặc định 40.
 */
export function searchAll(query, { limit = 40, index = searchEntries } = {}) {
  const qNorm = normalize(query)
  if (!qNorm) return []
  const tokens = qNorm.split(' ').filter(Boolean)

  const scored = []
  for (const entry of index) {
    const score = scoreEntry(entry, qNorm, tokens)
    if (score > 0) scored.push({ entry, score })
  }
  scored.sort((a, b) => b.score - a.score || a.entry.title.length - b.entry.title.length)

  return scored.slice(0, limit).map(({ entry, score }) => ({
    id: entry.id,
    type: entry.type,
    course: entry.course,
    courseLabel: entry.courseLabel,
    icon: entry.icon,
    title: entry.title,
    subtitle: entry.subtitle,
    snippet: entry.snippet,
    week: entry.week,
    day: entry.day,
    route: entry.route,
    count: entry._count || 1,
    score,
  }))
}
