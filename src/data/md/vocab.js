/**
 * Trang trí danh sách từ vựng cho VocabCard.
 * MD chỉ có danh sách từ (không IPA / nghĩa / ví dụ), nên ta gắn illo + gradient
 * xoay vòng để thẻ trông sinh động; các trường còn thiếu để trống (VocabCard ẩn).
 */
const VOCAB_ILLOS = ['📍', '📤', '📥', '🎛️', '🗺️', '🏷️', '⚙️', '🔑', '🧩', '🧠', '💡', '📚']
const VOCAB_GRADS = [
  ['#6C5CE7', '#8B7CF0'],
  ['#00B8D9', '#3dd7f0'],
  ['#00D68F', '#34e0a8'],
  ['#FF7A59', '#ff9f85'],
  ['#FFB020', '#ffc659'],
  ['#A55EEA', '#c089f5'],
]

export function decorateVocab(terms) {
  return terms.map((term, i) => ({
    term,
    illo: VOCAB_ILLOS[i % VOCAB_ILLOS.length],
    g1: VOCAB_GRADS[i % VOCAB_GRADS.length][0],
    g2: VOCAB_GRADS[i % VOCAB_GRADS.length][1],
    ipa: '',
    vi: '',
    ex: '',
    exVi: '',
    vidLen: '',
  }))
}
