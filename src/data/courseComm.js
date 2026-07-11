/**
 * Dữ liệu khóa "Giao Tiếp Thực Chiến" — nạp & parse từ Comm_English/*.md lúc chạy.
 *
 * TÁI DÙNG tối đa hạ tầng IELTS: parseCommWeek (= parseIeltsWeek + scenarios) và
 * getIeltsDay() (nhận `weeksData` nên dùng lại được cho khóa comm). File này chỉ
 * thêm phần RIÊNG của khóa: bản đồ tuần, tiến độ, và getCommDay() — ghép ngày học
 * IELTS-style với TÌNH HUỐNG roleplay của buổi theo quy ước `N.D` (Tuần N · Buổi D).
 */
import { parseCommWeek } from './md/parseComm'
import { getIeltsDay } from './courseIelts'

const rawFiles = import.meta.glob('../../Comm_English/*.md', { query: '?raw', import: 'default', eager: true })

export const commWeeksData = Object.values(rawFiles)
  .map((raw) => parseCommWeek(raw))
  .filter((w) => w.num > 0)
  .sort((a, b) => a.num - b.num)

export const commTotals = {
  weeks: commWeeksData.length,
  lessons: commWeeksData.reduce((sum, w) => sum + w.days.length, 0),
}

// Icon biên tập cho từng tuần (MD không có emoji ở tiêu đề tuần).
const ICONS = ['🗣️', '✈️', '🤝', '💬', '💻', '📊', '🎯', '🏆']

// -------------------- Cấu trúc tuần (để suy ra tiến độ) --------------------
export const commWeekStructure = commWeeksData.map((w, i) => ({
  num: w.num,
  icon: ICONS[i % ICONS.length],
  title: w.title,
  sub: w.subtitle || `${w.days.length} buổi`,
  dayNums: w.days.map((d) => d.n),
}))

const isWeekDone = (wk, completed) => wk.dayNums.every((d) => completed.includes(`${wk.num}:${d}`))

/**
 * Trạng thái mỗi tuần (done/current/locked). Tuần "done" (để mở tuần kế) khi ĐÃ
 * XONG HẾT BUỔI **và** ĐẠT bài kiểm tra tuần. `isWeekPassed` do view truyền vào
 * (đọc store); mặc định luôn true để tương thích ngược (soft gating).
 */
export function computeCommStatuses(completed = [], isWeekPassed = () => true) {
  const map = {}
  let prevDone = true
  for (const wk of commWeekStructure) {
    const done = isWeekDone(wk, completed) && isWeekPassed(wk.num)
    map[wk.num] = done ? 'done' : prevDone ? 'current' : 'locked'
    prevDone = done
  }
  return map
}

/** Dựng mảng tuần kèm trạng thái mở khóa theo tiến độ hiện tại. */
export function computeCommWeeks(completed = [], isWeekPassed = () => true) {
  const statuses = computeCommStatuses(completed, isWeekPassed)
  return commWeekStructure.map((w) => ({ num: w.num, icon: w.icon, title: w.title, sub: w.sub, status: statuses[w.num] }))
}

/** Tóm tắt tiến độ: số tuần xong, % theo buổi, tuần hiện tại & buổi tiếp theo. */
export function computeCommProgress(completed = [], isWeekPassed = () => true) {
  const statuses = computeCommStatuses(completed, isWeekPassed)
  const doneWeeks = commWeekStructure.filter((w) => statuses[w.num] === 'done').length
  const cur = commWeekStructure.find((w) => statuses[w.num] === 'current')
  let next
  if (cur) {
    const firstUndone = cur.dayNums.find((d) => !completed.includes(`${cur.num}:${d}`))
    next = { week: cur.num, day: firstUndone ?? cur.dayNums[cur.dayNums.length - 1] }
  } else {
    const last = commWeekStructure[commWeekStructure.length - 1]
    next = last ? { week: last.num, day: last.dayNums[0] } : { week: 1, day: 1 }
  }
  const totalDays = commWeekStructure.reduce((s, w) => s + w.dayNums.length, 0)
  return {
    doneWeeks,
    totalWeeks: commWeekStructure.length,
    currentWeek: cur ? cur.num : commWeekStructure.length,
    continue: next,
    allDone: !cur,
    doneDays: completed.length,
    totalDays,
    pct: totalDays ? Math.round((completed.length / totalDays) * 100) : 0,
  }
}

export const commWeeks = computeCommWeeks([])

export function getCommWeek(num) {
  return commWeeksData.find((w) => w.num === Number(num)) || null
}

/**
 * Dựng "brief" tiếng Anh cho AI đóng vai đúng kịch bản buổi. Bao gồm cả TWIST:
 * hiệp 1 bám kịch bản (nói chậm, câu ngắn), hiệp 2 tung twist sau ~4–5 lượt mà
 * không báo trước — tái dùng nguyên buildRoleplayPrompt ở backend (không cần sửa).
 *
 * COLD OPEN (Đợt B — "nâng tỷ lệ cold-open" nửa sau khóa): với `opts.coldOpen`
 * (Tuần 5–8), BỎ hiệp 1 chậm rãi bám kịch bản — AI vào vai ngay ở nhịp thật và
 * tung twist sớm hơn (~2–3 lượt). `opts.strong` (Tuần 7–8) cho AI thêm biến cố bất
 * ngờ tự do → dịch dần từ "fluency thuộc lòng" sang "ứng biến thời gian thực".
 */
function scenarioBrief(sc, opts = {}) {
  const { coldOpen = false, strong = false } = opts
  const parts = []
  if (sc.role) parts.push(`You play this role: ${sc.role}`)
  if (sc.setting) parts.push(`Setting: ${sc.setting}`)
  if (sc.tasks?.length) parts.push(`The learner must accomplish: ${sc.tasks.join('; ')}.`)
  if (coldOpen) {
    parts.push(
      'COLD OPEN (second half of the course): from your very first line, drop straight into the situation at a natural, realistic pace — no slow scripted warm-up round. Use normal but still clear sentences, and only slow down or help if the learner clearly freezes. The goal is to move them from memorized fluency toward real-time adaptation.',
    )
  } else {
    parts.push(
      'Round 1: stay on the expected script, speak slowly with short simple sentences, and help if the learner goes quiet.',
    )
  }
  if (sc.twist) {
    const when = coldOpen ? 'After about 2-3 exchanges' : 'After about 4-5 exchanges (Round 2)'
    parts.push(
      `${when}, WITHOUT warning introduce this twist and make the learner react: ${sc.twist}`,
    )
  }
  if (strong) {
    parts.push(
      'Since this is late in the course, feel free to add further small unexpected complications or shift direction the way a real conversation does — keep the learner adapting rather than reciting.',
    )
  }
  if (sc.surprise) {
    parts.push(
      'SURPRISE MODE: the learner does NOT know which situation this is. Jump straight into your role from the very first line without announcing or naming the scenario, and let them figure out the context and react.',
    )
  }
  parts.push('Stay fully in character. Do not describe or explain the exercise.')
  return parts.join(' ')
}

// Cảnh "ôn xoáy" mỗi Boss kéo lại (theo khối trước). vi: nhãn UI; en: mớm cho AI.
const RECALL_SCENE = {
  2: { vi: 'một cảnh nơi công cộng ở Tuần 1 (gọi món, hỏi đường)', en: 'an everyday public situation (ordering food, asking directions)' },
  3: { vi: 'một cảnh du lịch – dịch vụ ở Khối 1', en: 'a travel/service situation (airport, hotel)' },
  4: { vi: 'một cảnh đời sống hằng ngày ở Khối 1', en: 'an everyday-life situation from Block 1 (café, shopping, directions)' },
  5: { vi: 'một cảnh làm quen – kết bạn ở Khối 2', en: 'a making-friends situation from Block 2 (small talk, self-intro)' },
  6: { vi: 'một cảnh giữ tình bạn ở Khối 2', en: 'a keeping-friends situation from Block 2 (messaging, sharing opinions)' },
  7: { vi: 'một cảnh công việc ở Khối 3', en: 'a workplace situation from Block 3 (standup, meeting, asking for help)' },
}

/**
 * Chi tiết một buổi khóa comm = ngày học IELTS-style (checklist + cụm + quiz) +
 * TÌNH HUỐNG roleplay của buổi (nếu có) đã đóng gói sẵn cho useChatEngine.
 */
export function getCommDay(weekNum, dayNum) {
  const base = getIeltsDay(weekNum, dayNum, commWeeksData)
  if (!base) return null
  const week = getCommWeek(weekNum)
  const sc = (week?.scenarios || []).find((s) => s.day === base.n) || null

  // Cold-open (Đợt B): Tuần 5–8 bỏ hiệp-1-bám-kịch-bản, vào nhịp thật ngay; Tuần
  // 7–8 mạnh hơn (thêm biến cố tự do). Buổi surprise (Tuần 8) vốn đã vào vai ngay
  // nên không cần gắn cờ này (giữ nguyên hành vi surprise). → nửa sau khóa chuyển
  // dần từ thuộc lòng sang ứng biến.
  const coldOpen = !!sc && weekNum >= 5 && !sc.surprise
  const strongColdOpen = coldOpen && weekNum >= 7

  const scenario = sc
    ? {
        key: `comm-${sc.week}-${sc.day}`,
        id: sc.id,
        label: `🎭 ${sc.title}`,
        title: sc.title,
        role: sc.role,
        setting: sc.setting,
        tasks: sc.tasks,
        twist: sc.twist,
        rubric: sc.rubric,
        sample: sc.sample,
        surprise: !!sc.surprise,
        coldOpen,
        brief: scenarioBrief(sc, { coldOpen, strong: strongColdOpen }),
      }
    : null

  const isBoss = /👑|boss/i.test(sc?.title || '') || (!base.nextDay && !!scenario)
  const isMission = !scenario && (base.checklist || []).some((c) => /🌍|mission/i.test(c))

  // Xoáy lại (spiral, kế hoạch "Nói Tự Tin" Trục E): Boss mỗi khối kéo lại 1 cảnh
  // của khối trước để người học TÁI DÙNG cụm cũ. Chỉ thêm "cảnh ôn" vào brief +
  // nhãn UI; không đổi cấu trúc buổi. Tuần 1 (chưa có gì trước) & Tuần 8 (Final Boss
  // vốn đã ôn tất cả) không cần.
  if (isBoss && scenario && RECALL_SCENE[weekNum]) {
    const r = RECALL_SCENE[weekNum]
    scenario.recall = r.vi
    scenario.brief +=
      ` SPIRAL REVIEW: near the end of Round 2, briefly bring back ${r.en} so the learner has to reuse phrases from an earlier block, then wrap up.`
  }

  // Micro-lesson phát âm theo khối — chỉ hiện ở buổi 1 của tuần có khai báo
  // (Tuần 1/3/7), nên gắn vào day 1; các buổi khác trả null.
  const pronunciation = base.n === 1 ? week?.pronunciation || null : null

  // Micro-lesson nối âm (connected speech) + bộ hiện ngữ điệu theo KHỐI (Đợt A):
  // khai báo ở tuần đầu mỗi khối (1/3/5/7), hiện 1 lần/khối ở buổi 1.
  const connectedSpeech = base.n === 1 ? week?.connectedSpeech || null : null
  const intonation = base.n === 1 ? week?.intonation || null : null

  // Nghe-chép + nghe-hiểu của tuần (ListeningDictation/Comprehension); view tự
  // chọn dictation (mọi buổi có scenario) và comprehension (buổi Boss).
  const listening = week?.listening || null

  return { ...base, scenario, isBoss, isMission, pronunciation, connectedSpeech, intonation, listening }
}
