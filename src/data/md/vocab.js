/**
 * Trang trí danh sách từ vựng cho VocabCard.
 * MD chỉ có danh sách từ (không IPA / nghĩa / ví dụ), nên ta gắn illo + gradient
 * xoay vòng cho sinh động, rồi bổ sung IPA / nghĩa / ví dụ từ glossary biên soạn
 * sẵn (vocabGlossary). Từ nào không có trong glossary thì để trống (VocabCard ẩn).
 */
import { lookupVocab } from '../vocabGlossary'
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
  return terms.map((term, i) => {
    const g = lookupVocab(term) || {}
    return {
      term,
      illo: VOCAB_ILLOS[i % VOCAB_ILLOS.length],
      g1: VOCAB_GRADS[i % VOCAB_GRADS.length][0],
      g2: VOCAB_GRADS[i % VOCAB_GRADS.length][1],
      ipa: g.ipa || '',
      vi: g.vi || '',
      ex: g.ex || '',
      exVi: g.exVi || '',
      vidLen: '',
    }
  })
}
