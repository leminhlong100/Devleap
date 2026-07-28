/**
 * Lịch ôn ngắt quãng (Leitner) cho "sổ lỗi" — thuần, không đụng state/Date ngầm
 * (truyền `nowMs` để test được). Mỗi câu sai có `box` (0..5) và `due` (mốc ms nên
 * ôn lại). Trả lời đúng → lên box (giãn cách xa hơn); sai → về box 0 (ôn lại sớm).
 */
const DAY_MS = 86400000
// Khoảng cách (ngày) tới lần ôn kế theo box. box 0 = ôn ngay lần tới.
export const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 16, 30]
const MAX_BOX = REVIEW_INTERVALS_DAYS.length - 1

/** Tính box + hạn ôn kế sau một lần ôn. mastered=true khi đã lên hết box mà vẫn đúng. */
export function reviewNext(box = 0, correct = true, nowMs = Date.now()) {
  const nextBox = correct ? Math.min(box + 1, MAX_BOX) : 0
  return {
    box: nextBox,
    due: nowMs + REVIEW_INTERVALS_DAYS[nextBox] * DAY_MS,
    mastered: correct && box >= MAX_BOX,
  }
}

/** Câu đã tới hạn ôn chưa? */
export function isDue(item, nowMs = Date.now()) {
  return (item?.due ?? 0) <= nowMs
}
