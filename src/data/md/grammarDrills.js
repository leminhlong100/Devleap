/**
 * Sinh BÀI TẬP CHỦ ĐỘNG cho từng điểm ngữ pháp — để người học vận dụng ngay
 * thay vì chỉ đọc lý thuyết rồi quên.
 *
 * Nguồn dữ liệu: bảng "Lỗi thường gặp" có sẵn trong mỗi mục ngữ pháp
 * (Base_English/*.md), dạng:  | Câu sai | Câu đúng |
 *
 * Từ mỗi cặp (sai → đúng) sinh MỘT bài tập, chọn dạng tự động:
 *  - cloze (điền chỗ trống): khi khác biệt là THÊM/THAY một cụm liền mạch
 *    ngắn (vd "She very kind." → "She is very kind." ⇒ "She ___ very kind." = is)
 *  - error (sửa câu sai): khi câu bị đảo/viết lại nhiều chỗ, không tách được
 *    một chỗ trống gọn (vd "I like very much music." → gõ lại cho đúng)
 *
 * Hình dạng trả về dùng chung với QuizTool:
 *   cloze/error -> { type, q, answer: [chuỗi chấp nhận], ex }
 */

/** Chuẩn hoá một token để so khớp: bỏ dấu, viết thường, bỏ ký tự không phải chữ (giữ '). */
function normTok(t) {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w']/g, '')
}

/** Đánh dấu token nào của A và B nằm trong chuỗi con chung dài nhất (LCS). */
function lcsKeep(a, b) {
  const n = a.length
  const m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const keepB = new Array(m).fill(false)
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      keepB[j] = true
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++
    } else {
      j++
    }
  }
  return keepB
}

/**
 * Thử tạo chỗ trống từ cặp (câu sai → câu đúng). Trả về { sentence, answer }
 * nếu khác biệt là một cụm liền mạch ≤ 3 từ trong câu đúng; ngược lại null.
 */
function buildCloze(wrong, correct) {
  const wTok = wrong.split(/\s+/).filter(Boolean)
  const cTok = correct.split(/\s+/).filter(Boolean)
  if (cTok.length < 3) return null
  const keepB = lcsKeep(wTok.map(normTok), cTok.map(normTok))

  const changed = []
  keepB.forEach((kept, idx) => {
    if (!kept) changed.push(idx)
  })
  if (!changed.length) return null

  const start = changed[0]
  const end = changed[changed.length - 1]
  // Chỉ nhận khi các từ khác biệt liền mạch (1 cụm) và ngắn — để chỗ trống rõ ràng.
  if (changed.length !== end - start + 1 || changed.length > 3) return null

  const ansTokens = cTok.slice(start, end + 1)
  const answer = ansTokens.join(' ').replace(/[.,!?;:]+$/, '').trim()
  if (!answer) return null

  const blanked = cTok.slice()
  blanked.splice(start, ansTokens.length, '_____')
  return { sentence: blanked.join(' '), answer }
}

/**
 * Lấy các cặp { wrong, correct } từ bảng "Lỗi thường gặp": nhận diện bằng
 * hàng tiêu đề chứa cả "sai" và "đúng", rồi gom các hàng kế tiếp cho tới khi
 * hết bảng. Bỏ qua các bảng khác (vd bảng chia động từ) để không lẫn.
 */
function extractErrorRows(lines) {
  const rows = []
  let inTable = false
  for (const raw of lines) {
    const t = raw.trim()
    if (!t.startsWith('|')) {
      inTable = false
      continue
    }
    const cells = t.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length < 2) continue
    if (/^-+$/.test(cells[0].replace(/\s/g, ''))) continue // hàng phân cách ---
    if (!inTable) {
      // chỉ mở bảng khi tiêu đề đúng là "Câu sai | Câu đúng"
      if (/sai/i.test(cells[0]) && /đúng/i.test(cells[1])) inTable = true
      continue
    }
    const wrong = cells[0].replace(/\*\*/g, '').trim()
    const correct = cells[1].replace(/\*\*/g, '').trim()
    if (wrong && correct) rows.push({ wrong, correct })
  }
  return rows
}

/**
 * Sinh danh sách bài tập cho một mục ngữ pháp từ các dòng MD của mục đó.
 * Mỗi cặp lỗi → một bài (ưu tiên cloze, không tách được thì cho sửa câu).
 */
/** Tách các đáp án thay thế trong ô "Câu đúng" (ngăn bởi " / "), bỏ trùng/rỗng. */
function splitAlternatives(s) {
  return [...new Set(s.split(/\s+\/\s+/).map((p) => p.trim()).filter(Boolean))]
}

export function buildGrammarDrills(lines) {
  const rows = extractErrorRows(lines)
  const drills = []
  for (const { wrong, correct } of rows) {
    const cz = buildCloze(wrong, correct)
    if (cz) {
      drills.push({
        type: 'cloze',
        q: cz.sentence,
        answer: splitAlternatives(cz.answer),
        ex: `Đáp án: “${cz.answer}”. Câu đúng: “${correct}”.`,
      })
    } else {
      drills.push({
        type: 'error',
        q: wrong,
        answer: splitAlternatives(correct),
        ex: `Câu đúng: “${correct}”.`,
      })
    }
    if (drills.length >= 12) break
  }
  return drills
}
