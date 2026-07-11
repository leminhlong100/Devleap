/**
 * Đợt 2 — Dashboard & thống kê (docs/KE_HOACH_TRANG_ADMIN.md mục 3).
 *
 * Phần THUẦN: nhận các dòng `progress` thô + danh sách `auth.users` + mốc thời
 * gian `now`, trả về TOÀN BỘ số liệu tổng hợp (không PII) cho dashboard. Tách
 * riêng để test được độc lập với Supabase (xem tests/adminStats.test.js) — đúng
 * nếp các module *Stats.js sẵn có trong repo.
 *
 * Ghi chú lựa chọn: kế hoạch gợi ý RPC `security definer` cho số tổng hợp, nhưng
 * hai chỗ nặng nhất (phễu theo tuần đọc mảng jsonb `completed` "week:day", và tỉ
 * lệ đậu quiz lọc theo key trong jsonb `quiz_scores`) rất rối khi viết bằng
 * PL/pgSQL và không test được. Vì cổng `admin` (Đợt 0) đã đọc `progress` bằng
 * service key và CHỈ trả số gộp (không lộ PII), ta gộp mọi tính toán vào 1 action
 * `getStats` chạy JS thuần — không cần thêm migration SQL thủ công.
 */

const COURSES = ['java', 'ielts', 'comm']
const DAY_MS = 86400000

/** 'YYYY-M-D' (không pad) -> số ngày UTC kể từ epoch; null nếu rỗng/không hợp lệ. */
export function ymdToDayNum(s) {
  if (!s || typeof s !== 'string') return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS)
}

/** Số nguyên tuần từ key "week:day" (vd "3:1" -> 3); NaN nếu hỏng. */
function weekOf(key) {
  return Number(String(key).split(':')[0])
}

/** Key quiz "thật" (bài kiểm tra tuần/cuối khóa), bỏ cổng luyện theo ngày. */
function isRealQuizKey(key) {
  return !key.includes(':gday:') && !key.includes(':vday:')
}

/** So sánh scope quiz để sắp xếp: week:1..N rồi 'final' ở cuối. */
function quizScopeOrder(scope) {
  if (scope === 'final') return 100000
  const n = Number(String(scope).replace('week:', ''))
  return Number.isFinite(n) ? n : 99999
}

/**
 * Tính toàn bộ số liệu dashboard.
 * @param {Array} progressRows  dòng bảng progress (snake_case: xp, last_study_date, completed, quiz_scores)
 * @param {Array} authUsers     dòng auth.users (created_at)
 * @param {number} now          Date.now() (ms) — truyền vào để test tất định
 */
export function computeStats(progressRows = [], authUsers = [], now = 0) {
  const rows = progressRows || []
  const nowDays = Math.floor(now / DAY_MS)

  // —— 3.1 Tổng quan ——
  let totalXp = 0
  let totalCompleted = 0
  let totalQuizzesTaken = 0
  let active7 = 0
  let active30 = 0
  for (const p of rows) {
    totalXp += p.xp || 0
    const c = p.completed || {}
    for (const course of COURSES) totalCompleted += (c[course] || []).length
    const q = p.quiz_scores || {}
    totalQuizzesTaken += Object.keys(q).filter(isRealQuizKey).length
    const dn = ymdToDayNum(p.last_study_date)
    if (dn != null) {
      const ago = nowDays - dn
      if (ago <= 7) active7 += 1
      if (ago <= 30) active30 += 1
    }
  }

  let newUsers7 = 0
  let newUsers30 = 0
  for (const u of authUsers || []) {
    const t = u.created_at ? Date.parse(u.created_at) : NaN
    if (!Number.isNaN(t)) {
      const ago = (now - t) / DAY_MS
      if (ago <= 7) newUsers7 += 1
      if (ago <= 30) newUsers30 += 1
    }
  }

  const overview = {
    totalUsers: (authUsers || []).length,
    withProgress: rows.length,
    newUsers7,
    newUsers30,
    active7,
    active30,
    totalXp,
    totalCompleted,
    totalQuizzesTaken,
  }

  // —— 3.2 Phễu hoàn thành theo khóa (số người chạm tới từng tuần) ——
  // + 3.3 buổi phổ biến/ít: đếm lượt hoàn thành theo "course:week:day".
  const funnels = {}
  const lessonCount = new Map() // "course:week:day" -> số người hoàn thành
  for (const course of COURSES) {
    const reached = new Map() // week -> số người chạm tới
    let maxWeek = 0
    let touchedCourse = 0
    for (const p of rows) {
      const days = (p.completed || {})[course] || []
      if (!days.length) continue
      touchedCourse += 1
      const weeks = new Set()
      for (const k of days) {
        const w = weekOf(k)
        if (Number.isFinite(w) && w > 0) {
          weeks.add(w)
          if (w > maxWeek) maxWeek = w
        }
        const lk = `${course}:${k}`
        lessonCount.set(lk, (lessonCount.get(lk) || 0) + 1)
      }
      for (const w of weeks) reached.set(w, (reached.get(w) || 0) + 1)
    }
    const steps = []
    for (let w = 1; w <= maxWeek; w++) steps.push({ week: w, users: reached.get(w) || 0 })
    funnels[course] = { touched: touchedCourse, steps }
  }

  // —— 3.2 Thống kê quiz theo khóa (takers / tỉ lệ đậu / điểm TB) ——
  const quizAgg = new Map() // "course:scope" -> { course, scope, takers, pass, sumPct }
  for (const p of rows) {
    const q = p.quiz_scores || {}
    for (const [key, v] of Object.entries(q)) {
      if (!isRealQuizKey(key)) continue
      const idx = key.indexOf(':')
      const course = key.slice(0, idx)
      const scope = key.slice(idx + 1)
      if (!COURSES.includes(course)) continue
      const cur = quizAgg.get(key) || { course, scope, takers: 0, pass: 0, sumPct: 0 }
      cur.takers += 1
      if (v?.passed) cur.pass += 1
      cur.sumPct += v?.pct || 0
      quizAgg.set(key, cur)
    }
  }
  const quizList = [...quizAgg.values()].map((x) => ({
    course: x.course,
    scope: x.scope,
    takers: x.takers,
    passRate: x.takers ? Math.round((x.pass / x.takers) * 100) : 0,
    avgPct: x.takers ? Math.round(x.sumPct / x.takers) : 0,
  }))
  const quizzes = {}
  for (const course of COURSES) {
    quizzes[course] = quizList
      .filter((q) => q.course === course)
      .sort((a, b) => quizScopeOrder(a.scope) - quizScopeOrder(b.scope))
  }

  // —— 3.3 Nội dung phổ biến / cần chú ý ——
  const lessons = [...lessonCount.entries()].map(([k, count]) => {
    const [course, week, day] = k.split(':')
    return { course, week: Number(week), day: Number(day), count }
  })
  const topLessons = [...lessons].sort((a, b) => b.count - a.count).slice(0, 8)
  // Quiz khó: tỉ lệ đậu thấp nhất (chỉ xét bài có người làm & chưa đậu 100%).
  const hardestQuizzes = quizList
    .filter((q) => q.takers > 0 && q.passRate < 100)
    .sort((a, b) => a.passRate - b.passRate || b.takers - a.takers)
    .slice(0, 5)

  return { overview, funnels, quizzes, content: { topLessons, hardestQuizzes } }
}
