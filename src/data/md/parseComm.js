/**
 * Parser cho khóa "Giao Tiếp Thực Chiến" — Comm_English/ThucChien_TuanN.md.
 *
 * TÁI DÙNG parseIeltsWeek() nguyên vẹn cho các section cũ (mục tiêu, ngữ pháp,
 * từ vựng, lịch 7 ngày, quiz tuần) — file MD giữ đúng khuôn IELTS. Khóa này CHỈ
 * thêm 1 section mới:
 *
 *   ## 🎭 Tình huống thực chiến
 *   ### Tình huống 1.2 — Gọi món ở quán cà phê
 *   **Vai AI:** Nhân viên quán cà phê thân thiện nhưng nói hơi nhanh.
 *   **Bối cảnh:** Bạn vào quán lần đầu, muốn gọi 1 đồ uống + 1 món ăn nhẹ, mang đi.
 *   **Nhiệm vụ của bạn:**
 *   - Gọi được món với 1 yêu cầu đặc biệt
 *   - Hỏi giá và xác nhận lại đơn
 *   **Twist hiệp 2:** Món bạn gọi đã hết — nhân viên gợi ý món khác và hỏi ngược lại.
 *   **Rubric:** hoàn thành nhiệm vụ · dùng ≥ 3 cụm đã học · phản xạ twist · lịch sự đúng mức
 *   **Hội thoại mẫu:**
 *   - A: Hi there! What can I get you today?
 *   - B: Could I get a latte, please? Less sugar if possible.
 *
 * Quy ước map buổi ↔ tình huống: `Tình huống N.D` = Tuần N, Buổi D. Ngày không có
 * roleplay (mission/boss) thì không cần khai báo tình huống — getCommDay tự trả null.
 */
import { parseIeltsWeek } from './parseIelts'

/** Tách theo heading cấp `level` (## hoặc ###), bỏ qua code fence. (bản gọn của parseIelts) */
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

/** Lấy giá trị một trường "**Nhãn:** nội dung" (một dòng) trong khối tình huống. */
function fieldValue(lines, label) {
  const re = new RegExp(`^\\s*\\*\\*\\s*${label}\\s*:?\\s*\\*\\*\\s*(.*)$`, 'i')
  for (const l of lines) {
    const m = re.exec(l)
    if (m) return m[1].replace(/\*\*/g, '').trim()
  }
  return ''
}

/**
 * Lấy danh sách bullet nằm NGAY SAU một nhãn "**Nhãn:**" (đến khi gặp nhãn kế
 * tiếp hoặc hết khối). Dùng cho "**Nhiệm vụ của bạn:**" và "**Hội thoại mẫu:**".
 */
function bulletsAfter(lines, label) {
  const out = []
  let collecting = false
  const labelRe = new RegExp(`^\\s*\\*\\*\\s*${label}\\s*:?\\s*\\*\\*`, 'i')
  for (const raw of lines) {
    const t = raw.trim()
    if (labelRe.test(t)) {
      collecting = true
      continue
    }
    if (!collecting) continue
    if (/^\*\*/.test(t)) break // gặp nhãn kế tiếp -> dừng
    const bm = /^[-*]\s+(.+)$/.exec(t)
    if (bm) out.push(bm[1].trim())
    else if (t) break // dòng chữ thường không phải bullet -> hết danh sách
  }
  return out
}

/** Tách rubric "a · b · c" (hoặc dấu ; , |) thành mảng tiêu chí nhị phân. */
function splitRubric(text) {
  return String(text || '')
    .split(/[·•;|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Đọc section "## 🎭 Tình huống thực chiến" -> mảng scenario.
 * Trả về [] khi file không có section này (an toàn — file IELTS/Java không đổi).
 * @param {string} raw  nội dung markdown thô của tuần.
 */
export function parseScenarios(raw) {
  const lines = String(raw || '').split(/\r?\n/)
  const h2 = splitByLevel(lines, 2)
  const sec = h2.find((s) => /Tình huống thực chiến/i.test(s.heading))
  if (!sec) return []

  const out = []
  for (const s of splitByLevel(sec.lines, 3)) {
    const m = /^Tình huống\s+(\d+)\.(\d+)\s*[—–-]?\s*(.*)$/i.exec(s.heading)
    if (!m) continue
    const week = Number(m[1])
    const day = Number(m[2])
    const title = m[3].trim()
    out.push({
      id: `${week}.${day}`,
      week,
      day,
      title,
      role: fieldValue(s.lines, 'Vai AI'),
      setting: fieldValue(s.lines, 'Bối cảnh'),
      tasks: bulletsAfter(s.lines, 'Nhiệm vụ của bạn'),
      twist: fieldValue(s.lines, 'Twist hiệp 2'),
      rubric: splitRubric(fieldValue(s.lines, 'Rubric')),
      sample: bulletsAfter(s.lines, 'Hội thoại mẫu'),
      // Surprise mode (Tuần 8): buổi "không biết trước gặp cảnh nào" — view che
      // bối cảnh/nhiệm vụ cụ thể để người học tự nhận diện. Cờ bật khi có
      // "**Surprise:** Có/Yes/…" trong khối tình huống (mặc định false).
      surprise: /^\s*(có|co|yes|true|1|✓)/i.test(fieldValue(s.lines, 'Surprise')),
    })
  }
  return out
}

/**
 * Đọc section "## 🗣️ Phát âm trọng tâm" (micro-lesson phát âm theo khối) -> object
 * { title, intro, tips[] } hoặc null khi vắng. Chỉ vài tuần đầu khối khai báo
 * section này (Tuần 1/3/7 = Khối 1 / 2-3 / 4) nên CommDayView hiện nó 1 lần/khối.
 * Khuôn MD:
 *
 *   ## 🗣️ Phát âm trọng tâm
 *   **Khối 1 — Âm cuối & trọng âm từ.** Đoạn dẫn ngắn giải thích vì sao quan trọng.
 *   - **Âm cuối -s/-ed:** mẹo cụ thể…
 *   - **Trọng âm từ:** COFfee (không phải cofFEE)…
 *
 * An toàn ngược: file không có section này -> null (parser cũ bỏ qua).
 * @param {string} raw  nội dung markdown thô của tuần.
 */
export function parsePronunciation(raw) {
  const lines = String(raw || '').split(/\r?\n/)
  const sec = splitByLevel(lines, 2).find((s) => /Phát âm trọng tâm/i.test(s.heading))
  if (!sec) return null

  const tips = []
  const introParts = []
  for (const raw2 of sec.lines) {
    const t = raw2.trim()
    if (!t) continue
    const bm = /^[-*]\s+(.+)$/.exec(t)
    if (bm) tips.push(bm[1].trim())
    else if (!tips.length) introParts.push(t) // đoạn dẫn nằm trước danh sách bullet
  }
  const introRaw = introParts.join(' ').replace(/\*\*/g, '').trim()
  // Tách "Tiêu đề. Phần còn lại" nếu đoạn dẫn mở đầu bằng "**Tiêu đề — ….**".
  const titleMatch = /^([^.]*?[—–-][^.]*?)\.\s*(.*)$/.exec(introRaw)
  const title = titleMatch ? titleMatch[1].trim() : ''
  const intro = titleMatch ? titleMatch[2].trim() : introRaw
  if (!tips.length && !intro) return null
  return { title, intro, tips }
}

/**
 * Đọc section "## 🎧 Nghe" -> { dictation[], comprehension } hoặc null khi vắng.
 * Rèn tai bắt âm (Trục C, kế hoạch "Nói Tự Tin"). Khuôn MD:
 *
 *   ## 🎧 Nghe
 *   **Nghe–chép:**
 *   - Could I get a flat white, please? To go.
 *   - That comes to four fifty.
 *   **Đoạn hội thoại:** Nghe cuộc gọi đặt bàn rồi trả lời.
 *   > A: Good evening, Rossi's. B: Hi, I'd like a table for two at seven. ...
 *   **Câu hỏi:**
 *   - How many people is the table for? | *Two | Three | Four
 *   - What time do they want it? | Six | *Seven | Eight
 *
 * - `dictation`: câu để nghe-chép (ListeningDictation), mọi buổi có thể dùng.
 * - `comprehension`: { title, script, questions[] } cho buổi Boss (ListeningComprehension);
 *   `questions` theo khuôn QuizTool: { q, opts[], correct(index), ex? }. Đáp án đúng là
 *   phương án có dấu `*` ở đầu.
 * An toàn ngược: không có section -> null.
 */
export function parseListening(raw) {
  const lines = String(raw || '').split(/\r?\n/)
  const sec = splitByLevel(lines, 2).find((s) => /🎧|^Nghe\b/i.test(s.heading))
  if (!sec) return null

  const dictation = bulletsAfter(sec.lines, 'Nghe.?chép')
  const title = fieldValue(sec.lines, 'Đoạn hội thoại')
  const script = sec.lines
    .map((l) => l.trim())
    .filter((l) => /^>/.test(l))
    .map((l) => l.replace(/^>\s?/, '').trim())
    .join(' ')
    .trim()

  const questions = []
  for (const b of bulletsAfter(sec.lines, 'Câu hỏi')) {
    const parts = b.split('|').map((s) => s.trim()).filter(Boolean)
    if (parts.length < 2) continue
    const q = parts[0]
    const rawOpts = parts.slice(1)
    let correct = rawOpts.findIndex((o) => /^\*/.test(o))
    if (correct < 0) correct = 0
    const opts = rawOpts.map((o) => o.replace(/^\*\s*/, '').trim())
    questions.push({ q, opts, correct })
  }

  const comprehension =
    questions.length && script ? { title: title || 'Nghe đoạn hội thoại rồi trả lời', script, questions } : null
  if (!dictation.length && !comprehension) return null
  return { dictation, comprehension }
}

/**
 * Parse một tuần khóa Giao Tiếp = toàn bộ dữ liệu IELTS-style + `scenarios[]` +
 * `pronunciation` (micro-lesson phát âm theo khối) + `listening` (nghe-chép +
 * nghe-hiểu), mọi phần null nếu tuần không khai báo.
 * @param {string} raw
 */
export function parseCommWeek(raw) {
  const week = parseIeltsWeek(raw)
  return {
    ...week,
    scenarios: parseScenarios(raw),
    pronunciation: parsePronunciation(raw),
    listening: parseListening(raw),
  }
}
