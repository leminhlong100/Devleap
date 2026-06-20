/**
 * Dữ liệu khóa học & lộ trình.
 * Bản đồ tuần và chi tiết ngày được parse runtime từ Markdown:
 *   - Java  → weeks/*.md         (xem ./course.js)
 *   - IELTS → Base_English/*.md  (xem ./courseIelts.js)
 * File này giữ phần biên tập (banner, mô tả khóa, giai đoạn, kỹ năng IELTS).
 * Lưu ý: nội dung trang chủ (features/steps) tách sang ./home.js để trang chủ
 * không phải tải các chunk MD nặng.
 */
import { javaWeeks, javaTotals } from './course'
import { ieltsWeeks, ieltsTotals } from './courseIelts'

export { javaWeeks, ieltsWeeks }

// -------------------- Thư viện khóa học --------------------
export const courses = [
  {
    id: 'java',
    routeName: 'java',
    emoji: '☕',
    name: 'Java + Tiếng Anh 12 Tuần Bứt Phá',
    desc: 'Từ OOP đến Microservices, Spring AI & System Design — kèm từ vựng IT mỗi ngày.',
    weeks: javaTotals.weeks,
    lessons: javaTotals.lessons,
    level: 'Trung cấp',
    levelColor: '#FFB020',
    banner: 'linear-gradient(135deg,#6C5CE7,#4b3bc4)',
    tag: '🔥 ĐANG HỌC',
    progress: 28,
    active: true,
    locked: false,
    cta: 'Tiếp tục học →',
  },
  {
    id: 'ielts',
    routeName: 'ielts',
    emoji: '🎯',
    name: 'IELTS Cơ Bản',
    desc: 'Nền tảng 4 kỹ năng Listening, Reading, Writing & Speaking — hiểu nhanh, học 15 phút/ngày, không nản.',
    weeks: ieltsTotals.weeks,
    lessons: ieltsTotals.lessons,
    level: 'Cơ bản',
    levelColor: '#00C281',
    banner: 'linear-gradient(135deg,#00D68F,#00a86f)',
    tag: '✨ MỚI',
    progress: 0,
    active: true,
    locked: false,
    cta: 'Bắt đầu học →',
  },
  {
    id: 'comm',
    routeName: null,
    emoji: '💬',
    name: 'Tiếng Anh Giao Tiếp',
    desc: 'Phản xạ nói tự nhiên qua tình huống thực tế nơi công sở và đời sống hằng ngày.',
    weeks: 6,
    lessons: 36,
    level: 'Cơ bản',
    levelColor: '#00C281',
    banner: 'linear-gradient(135deg,#FFB020,#f59000)',
    tag: 'SẮP RA MẮT',
    progress: 0,
    active: false,
    locked: true,
    cta: '',
  },
]

// -------------------- Bản đồ Java 12 tuần --------------------
// `javaWeeks` được parse từ weeks/*.md (re-export ở đầu file).

export const javaStages = {
  1: { icon: '🧱', label: 'Giai đoạn 1 · Java Core', range: 'Tuần 1–3' },
  4: { icon: '🌱', label: 'Giai đoạn 2 · Spring & Backend', range: 'Tuần 4–7' },
  8: { icon: '🤖', label: 'Giai đoạn 3 · Hệ thống & AI', range: 'Tuần 8–10' },
  11: { icon: '🎯', label: 'Giai đoạn 4 · Sẵn sàng đi làm', range: 'Tuần 11–12' },
}

// Phần biên tập tĩnh của banner. Tiến độ (tuần hiện tại, %, ngày tiếp theo) được
// tính động trong JavaCourseView từ store, nên không để ở đây nữa.
export const javaMeta = {
  badge: '☕ JAVA BACKEND · TRUNG CẤP',
  title: 'Lộ Trình Java + Tiếng Anh\n12 Tuần Bứt Phá',
  desc: 'Bản đồ chinh phục từng tuần. Hoàn thành một chặng để mở khóa chặng tiếp theo, giữ streak và leo bảng xếp hạng.',
  totalWeeks: javaTotals.weeks,
  goalTitle: 'Đích đến: sẵn sàng đi làm Backend!',
  goalSub: 'Hoàn thành 12 tuần để mở huy hiệu Java Master 🏆',
  bannerGrad: 'linear-gradient(150deg,#6C5CE7,#4b3bc4)',
}

// -------------------- Bản đồ IELTS --------------------
// `ieltsWeeks` được parse từ Base_English/*.md (re-export ở đầu file).

export const ieltsStages = {
  1: { icon: '🚀', label: 'Giai đoạn 1 · Khởi động', range: 'Tuần 1' },
  2: { icon: '👂', label: 'Giai đoạn 2 · Nghe & Đọc', range: 'Tuần 2–3' },
  4: { icon: '✍️', label: 'Giai đoạn 3 · Viết', range: 'Tuần 4–5' },
  6: { icon: '🗣️', label: 'Giai đoạn 4 · Nói', range: 'Tuần 6–7' },
  8: { icon: '🏁', label: 'Về đích', range: 'Tuần 8' },
}

export const ieltsExplain = [
  { icon: '🎯', bg: 'rgba(0,214,143,.14)', title: 'IELTS là gì?', desc: 'Kỳ thi đo 4 kỹ năng tiếng Anh, dùng để du học, định cư hay xin việc. Đừng lo — mình bắt đầu từ con số 0.' },
  { icon: '🎧', bg: 'rgba(108,92,231,.12)', title: '4 kỹ năng', desc: 'Nghe · Đọc · Viết · Nói. Mỗi kỹ năng chấm riêng rồi lấy trung bình ra band tổng.' },
  { icon: '📊', bg: 'rgba(255,176,32,.16)', title: 'Thang điểm 0–9', desc: 'Band 5.0 là trung bình, 6.5 đủ đi du học phần lớn. Khóa này nhắm mục tiêu Band 6.5.' },
  { icon: '⏱️', bg: 'rgba(0,184,217,.14)', title: 'Chỉ 15–20 phút/ngày', desc: 'Học từng chút mỗi ngày và giữ streak. Không cần cày 3 tiếng mới giỏi đâu!' },
]

export const ieltsSkills = [
  { icon: '🎧', name: 'Listening', time: '~30 phút', desc: '4 phần · 40 câu', bg: 'linear-gradient(135deg,#6C5CE7,#8B7CF0)' },
  { icon: '📖', name: 'Reading', time: '60 phút', desc: '3 đoạn · 40 câu', bg: 'linear-gradient(135deg,#00B8D9,#3dd7f0)' },
  { icon: '✍️', name: 'Writing', time: '60 phút', desc: '2 bài (Task 1 & 2)', bg: 'linear-gradient(135deg,#FF7A59,#ff9f85)' },
  { icon: '🗣️', name: 'Speaking', time: '11–14 phút', desc: 'Phỏng vấn 3 phần', bg: 'linear-gradient(135deg,#00D68F,#34e0a8)' },
]

export const bandLadder = [
  { band: '4.0', label: 'Sơ cấp', pct: 38 },
  { band: '5.0', label: 'Trung bình', pct: 56 },
  { band: '5.5', label: 'Khá', pct: 66 },
  { band: '6.5', label: 'Mục tiêu', pct: 82, target: true },
  { band: '7.5', label: 'Giỏi', pct: 96 },
]

export const ieltsMeta = {
  bannerGrad: 'linear-gradient(150deg,#00D68F,#00966a)',
  badge: '🎯 IELTS · CƠ BẢN · 8 TUẦN',
  title: 'IELTS Cơ Bản —\n8 Tuần Tự Tin Đầu Tiên',
  desc: 'Bắt đầu từ con số 0, mỗi ngày chỉ 15–20 phút. Lộ trình chia nhỏ theo từng kỹ năng để bạn luôn thấy tiến bộ — học vui, không nản.',
  continueLabel: '▶ Bắt đầu Tuần 1',
  continue: { week: 1, day: 1 },
  goalTitle: 'Đích đến: tự tin bước vào phòng thi IELTS!',
  goalSub: 'Hoàn thành 8 tuần để mở huy hiệu IELTS Starter 🎖️',
}
