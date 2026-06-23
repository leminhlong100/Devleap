/**
 * Chấm điểm shadowing bằng cách so khớp VĂN BẢN: lấy câu người học nói (do
 * Web Speech API nhận dạng) so với câu gốc, tính % từ đọc đúng.
 *
 * Lưu ý: cách này chỉ đánh giá ĐÚNG TỪ, không đánh giá ngữ điệu/trọng âm.
 * Dùng thuật toán dãy con chung dài nhất (LCS) trên mảng từ để bỏ qua từ thừa/
 * thiếu mà vẫn giữ đúng thứ tự.
 */

/** Chuẩn hóa một từ: thường hóa, bỏ ký tự không phải chữ/số (giữ dấu nháy). */
export function normWord(w) {
  return String(w).toLowerCase().replace(/[^a-z0-9']/g, '')
}

/** Tách câu thành mảng từ đã chuẩn hóa (bỏ từ rỗng). */
export function normalizeWords(text) {
  return String(text)
    .split(/\s+/)
    .map(normWord)
    .filter(Boolean)
}

/** Trả về Set chỉ số (trong mảng `target`) các từ thuộc LCS với `heard`. */
function lcsMatchedIndices(target, heard) {
  const n = target.length
  const m = heard.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = target[i - 1] === heard[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  const matched = new Set()
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    if (target[i - 1] === heard[j - 1]) {
      matched.add(i - 1)
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  return matched
}

/**
 * @param {string} targetText câu gốc (giữ nguyên hoa/thường để hiển thị)
 * @param {string} heardText câu nhận dạng được từ giọng người học
 * @returns {{score:number, hit:number, total:number, heard:string,
 *            words:Array<{word:string, ok:boolean}>}}
 */
export function scoreTranscript(targetText, heardText) {
  const displayWords = String(targetText).split(/\s+/).filter(Boolean)
  const normTarget = displayWords.map(normWord)
  const normHeard = normalizeWords(heardText)
  const total = normTarget.filter(Boolean).length

  if (!total) return { score: 0, hit: 0, total: 0, heard: heardText || '', words: [] }

  const matched = lcsMatchedIndices(normTarget, normHeard)
  const words = displayWords.map((word, idx) => ({ word, ok: matched.has(idx) }))
  const hit = matched.size
  const score = Math.round((hit / total) * 100)
  return { score, hit, total, heard: heardText || '', words }
}

/** Nhãn động viên theo điểm. */
export function scoreVerdict(score) {
  if (score >= 90) return { label: 'Tuyệt vời!', kind: 'great' }
  if (score >= 75) return { label: 'Tốt lắm', kind: 'good' }
  if (score >= 50) return { label: 'Khá ổn, thử lại nhé', kind: 'ok' }
  return { label: 'Nghe lại rồi nói chậm hơn', kind: 'low' }
}
