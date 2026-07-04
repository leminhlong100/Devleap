/**
 * Lịch ôn tập giãn cách (Spaced Repetition) kiểu Anki — thuật toán SM-2 rút gọn.
 *
 * Mỗi flashcard giữ một "lịch" (schedule card):
 *   ease     — hệ số dễ (EF), bắt đầu 2.5, sàn 1.3; càng quên càng giảm.
 *   interval — số ngày tới lần ôn kế (0 = ôn lại ngay trong phiên).
 *   reps     — số lần trả lời đúng liên tiếp (đặt lại 0 khi "Quên").
 *   lapses   — số lần quên (để thống kê).
 *   due      — ngày đến hạn ôn, dạng 'YYYY-MM-DD' (so sánh chuỗi an toàn).
 *   last     — ngày ôn gần nhất, dạng 'YYYY-MM-DD' (dùng để hợp nhất đa thiết bị).
 *
 * Tách thành module thuần (không phụ thuộc store/Vue) để dễ kiểm thử & tái dùng.
 */

export const GRADES = ['again', 'hard', 'good', 'easy']

const MS_DAY = 86400000
const EASE_DEFAULT = 2.5
const EASE_MIN = 1.3

const clampEase = (e) => Math.max(EASE_MIN, Math.round(e * 100) / 100)

// —————————————————————— tiện ích ngày (theo giờ địa phương) ——————————————————————

/** Ngày hôm nay dạng 'YYYY-MM-DD' (có đệm 0 để so sánh chuỗi). */
export function todayISO(now = new Date()) {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const parseLocal = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
const startOfDay = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())

/** Cộng `days` ngày vào một chuỗi 'YYYY-MM-DD', trả lại chuỗi cùng định dạng. */
export function addDaysISO(iso, days) {
  const dt = parseLocal(iso)
  dt.setDate(dt.getDate() + days)
  return todayISO(dt)
}

/** Số ngày từ hôm nay tới `iso` (âm nếu đã quá hạn). */
export function daysUntil(iso, now = new Date()) {
  if (!iso) return 0
  return Math.round((parseLocal(iso) - startOfDay(now)) / MS_DAY)
}

/** Thẻ có đến hạn ôn chưa? Thẻ mới (chưa có lịch) luôn coi là đến hạn. */
export function isDue(card, now = new Date()) {
  if (!card || !card.due) return true
  return daysUntil(card.due, now) <= 0
}

// —————————————————————— thuật toán xếp lịch ——————————————————————

/**
 * Tính lịch mới sau khi người học chấm độ nhớ một thẻ.
 * @param {object|null} card  Lịch hiện tại (null = thẻ mới).
 * @param {'again'|'hard'|'good'|'easy'} grade  Mức độ nhớ vừa chấm.
 * @returns {object} Lịch mới { ease, interval, reps, lapses, due, last }.
 */
export function schedule(card, grade, now = new Date()) {
  let ease = card?.ease ?? EASE_DEFAULT
  let reps = card?.reps ?? 0
  let lapses = card?.lapses ?? 0
  let interval = card?.interval ?? 0

  if (grade === 'again') {
    ease = clampEase(ease - 0.2)
    lapses += 1
    reps = 0
    interval = 0 // ôn lại ngay trong phiên (đến hạn hôm nay)
  } else {
    if (grade === 'hard') ease = clampEase(ease - 0.15)
    else if (grade === 'easy') ease = clampEase(ease + 0.15)
    reps += 1
    if (reps === 1) interval = grade === 'easy' ? 4 : 1
    else if (reps === 2) interval = grade === 'hard' ? 3 : 6
    else {
      const mult = grade === 'hard' ? 1.2 : grade === 'easy' ? ease * 1.3 : ease
      interval = Math.max(1, Math.round(interval * mult))
    }
  }

  const today = todayISO(now)
  return { ease, interval, reps, lapses, due: addDaysISO(today, interval), last: today }
}

/** Khoảng ôn kế (số ngày) nếu chấm `grade` — để xem trước trên nút bấm. */
export function previewInterval(card, grade, now = new Date()) {
  return schedule(card, grade, now).interval
}

/**
 * Lịch mặc định cho một thẻ vừa "gieo" tự động (học xong buổi nhưng chưa từng
 * tự lật flashcard) — due sau 3 ngày, `reps`/`last` để nguyên vì đây KHÔNG phải
 * một lần ôn thật. Card thật (khi người học lật & chấm) sẽ ghi đè qua `schedule`.
 */
export function seedSchedule(now = new Date()) {
  return { ease: EASE_DEFAULT, interval: 3, reps: 0, lapses: 0, due: addDaysISO(todayISO(now), 3), last: null }
}

/** Nhãn người-đọc-được cho một khoảng `days` ngày. */
export function intervalLabel(days) {
  if (days <= 0) return 'ôn lại'
  if (days === 1) return '1 ngày'
  if (days < 30) return `${days} ngày`
  if (days < 365) return `${Math.round(days / 30)} tháng`
  return `${Math.round(days / 365)} năm`
}
