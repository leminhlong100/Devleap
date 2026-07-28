/**
 * Dữ liệu khóa học & lộ trình.
 * Bản đồ tuần và chi tiết ngày được parse runtime từ Markdown:
 *   - Java  → weeks/*.md      (xem ./course.js)
 *   - IELTS → IELTS/day-*.md  (xem ./ieltsBook.js)
 * File này giữ phần biên tập (banner, mô tả khóa, giai đoạn, kỹ năng IELTS).
 * Lưu ý: nội dung trang chủ (features/steps) tách sang ./home.js để trang chủ
 * không phải tải các chunk MD nặng.
 */
import { javaWeeks, javaTotals } from './course'
import { ieltsBookTotals } from './ieltsBook'
import { commTotals } from './courseComm'
import { INTERVIEW_TOTALS } from './javaInterview'

export { javaWeeks }

// -------------------- Thư viện khóa học --------------------
export const courses = [
  {
    id: 'java',
    category: '💻 Lập trình',
    routeName: 'java',
    emoji: '☕',
    name: 'Java 12 Tuần Bứt Phá',
    desc: 'Từ OOP đến Microservices, Spring AI & System Design — sẵn sàng đi làm Backend.',
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
    id: 'java-prep',
    category: '💻 Lập trình',
    routeName: 'java-prep',
    emoji: '🎯',
    name: 'Java Phỏng Vấn Cấp Tốc',
    desc: 'Ôn 2 tuần cho phỏng vấn Java backend: ngân hàng câu hỏi (Java, SQL sâu, frontend, stack thực tế), kỹ năng phỏng vấn, AI phỏng vấn thử chấm điểm, coding chạy thật.',
    weeks: 2,
    lessons: INTERVIEW_TOTALS.questions,
    level: 'Junior 2 năm',
    levelColor: '#6C5CE7',
    banner: 'linear-gradient(135deg,#8B7CF0,#6C5CE7)',
    tag: '🎤 MỚI',
    progress: 0,
    active: true,
    locked: false,
    cta: 'Vào ôn thi →',
  },
  {
    id: 'ielts',
    category: '🗣️ Tiếng Anh',
    routeName: 'ielts',
    emoji: '🎯',
    name: 'IELTS Cơ Bản',
    desc: 'Học theo sách “IELTS 4 kỹ năng cho người bắt đầu từ con số âm” — 15 buổi: ngữ pháp, từ vựng, nghe/nói/đọc/viết, có AI luyện tập.',
    weeks: ieltsBookTotals.days,
    unit: 'buổi',
    lessons: ieltsBookTotals.days,
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
    category: '🗣️ Tiếng Anh',
    routeName: 'comm',
    emoji: '💬',
    name: 'Giao Tiếp Thực Chiến',
    desc: 'Nhập vai nói với AI qua tình huống thật: đời sống, kết bạn, công sở, phỏng vấn. Học để phản xạ, không học rồi mới (may ra) nói được.',
    weeks: commTotals.weeks,
    lessons: commTotals.lessons,
    level: 'A2 trở lên',
    levelColor: '#FFB020',
    banner: 'linear-gradient(135deg,#FFB020,#f59000)',
    tag: '🎭 MỚI',
    progress: 0,
    active: true,
    locked: false,
    cta: 'Bắt đầu nhập vai →',
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
  title: 'Lộ Trình Java\n12 Tuần Bứt Phá',
  desc: 'Bản đồ chinh phục từng tuần. Hoàn thành một chặng để mở khóa chặng tiếp theo, giữ streak và leo bảng xếp hạng.',
  totalWeeks: javaTotals.weeks,
  goalTitle: 'Đích đến: sẵn sàng đi làm Backend!',
  goalSub: 'Hoàn thành 12 tuần để mở huy hiệu Java Master 🏆',
  bannerGrad: 'linear-gradient(150deg,#6C5CE7,#4b3bc4)',
}

// -------------------- Bản đồ IELTS --------------------
// Khóa IELTS theo sách tổ chức theo BUỔI (15 Day) — bản đồ dựng ở ./ieltsBook.js.

export const ieltsMeta = {
  bannerGrad: 'linear-gradient(150deg,#00D68F,#00966a)',
  badge: '🎯 IELTS · CƠ BẢN · THEO SÁCH · 15 BUỔI',
  title: 'IELTS Cơ Bản —\nTừ Con Số Âm',
  desc: 'Bám sát sách “IELTS 4 kỹ năng cho người bắt đầu từ con số âm — Tập 1”. Mỗi buổi một Day: ngữ pháp, từ vựng, nghe/nói/đọc/viết, có flashcard, luyện phát âm và AI trợ giảng.',
  continueLabel: '▶ Bắt đầu Day 1',
  continue: { week: 1, day: 1 },
  goalTitle: 'Đích đến: nền tảng 4 kỹ năng vững vàng!',
  goalSub: 'Hoàn thành 15 buổi để mở huy hiệu IELTS Starter 🎖️',
}
