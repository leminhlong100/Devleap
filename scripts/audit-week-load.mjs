/**
 * KIỂM KÊ TẢI HỌC mỗi tuần IELTS (Base_English/*.md) — hỗ trợ Đợt 1 của
 * docs/KE_HOACH_DO_KHO_KHOA_HOC.md: đo số điểm ngữ pháp mới, số từ vựng mới,
 * số ngày mỗi tuần, rồi so với bảng tải mục tiêu (mục 3 trong kế hoạch) để
 * phát hiện tuần lệch chuẩn (quá tải hoặc quá nhẹ).
 *
 * Đọc trực tiếp bằng regex trên markdown (KHÔNG import parseIelts.js vì file đó
 * dùng import.meta.glob — chỉ chạy được trong Vite, không chạy được ở Node thường).
 *
 * Dùng:
 *   node scripts/audit-week-load.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'Base_English')

// Bảng tải mục tiêu — mục 3 của docs/KE_HOACH_DO_KHO_KHOA_HOC.md.
// grammarMax = số điểm ngữ pháp MỚI tối đa nên dạy trong tuần (### heading dưới
// "Ngữ pháp trọng tâm"); vocabMax = số từ mới tối đa/tuần (chỉ mang tính tham khảo,
// vì nhiều tuần gộp nhiều nhóm chủ đề).
const TARGET = {
  1: { cefr: 'A1', grammarMax: 3, vocabMax: 30 },
  2: { cefr: 'A1', grammarMax: 2, vocabMax: 30 },
  3: { cefr: 'A1+', grammarMax: 2, vocabMax: 35 },
  4: { cefr: 'A2', grammarMax: 2, vocabMax: 35 },
  5: { cefr: 'A2', grammarMax: 2, vocabMax: 35 },
  6: { cefr: 'A2', grammarMax: 2, vocabMax: 30 },
  7: { cefr: 'A2+', grammarMax: 2, vocabMax: 30 },
  8: { cefr: 'A2+/B1-', grammarMax: 2, vocabMax: 20 },
}

function section(lines, level, matchHeading) {
  const prefix = '#'.repeat(level) + ' '
  const out = []
  let collecting = false
  let buf = []
  for (const line of lines) {
    if (line.startsWith(prefix)) {
      if (collecting) out.push(buf)
      collecting = matchHeading(line.slice(prefix.length).trim())
      buf = []
      continue
    }
    if (line.startsWith('#') && !line.startsWith(prefix.slice(0, 1) + prefix.slice(0, 1))) {
      // gặp heading cấp cao hơn/khác -> dừng nếu đang gom cấp con của một mục cụ thể
    }
    if (collecting) buf.push(line)
  }
  if (collecting) out.push(buf)
  return out.flat()
}

function countH3(lines) {
  return lines.filter((l) => /^### /.test(l)).length
}

function countVocabWords(lines) {
  let total = 0
  for (const l of lines) {
    const m = /\*\*Từ chính:\*\*\s*(.+)/.exec(l) || /^Từ chính:\s*(.+)/.exec(l)
    if (m) total += m[1].split(',').filter((w) => w.trim()).length
  }
  return total
}

function countDays(lines) {
  const set = new Set()
  for (const l of lines) {
    const m = /^### Day\s+(\d+)/.exec(l)
    if (m) set.add(Number(m[1]))
  }
  return set.size
}

function auditFile(file) {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8')
  const lines = raw.split(/\r?\n/)
  const titleM = /^#\s+Tuần\s+(\d+)\s*[—–-]\s*(.+)$/m.exec(raw)
  const num = titleM ? Number(titleM[1]) : 0
  const title = titleM ? titleM[2].trim() : file

  const grammarLines = section(lines, 2, (h) => /Ngữ pháp/i.test(h))
  const vocabLines = section(lines, 2, (h) => /Phòng từ vựng|từ vựng/i.test(h))

  return {
    file,
    num,
    title,
    grammarPoints: countH3(grammarLines),
    vocabWords: countVocabWords(vocabLines),
    days: countDays(lines),
  }
}

const files = fs.readdirSync(DIR).filter((f) => /^NenTang_Tuan\d+(_Work)?\.md$/.test(f))
const rows = files.map(auditFile).sort((a, b) => a.num - b.num || a.file.localeCompare(b.file))

console.log('\nTuần | File | Ngữ pháp mới | Chuẩn tối đa | Từ vựng | Ngày | Ghi chú\n' + '-'.repeat(90))
for (const r of rows) {
  const t = TARGET[r.num]
  const overGrammar = t && r.grammarPoints > t.grammarMax
  const flags = []
  if (overGrammar) flags.push(`QUÁ TẢI ngữ pháp (${r.grammarPoints} > ${t.grammarMax})`)
  if (t && r.vocabWords > t.vocabMax * 1.5) flags.push(`từ vựng nhiều bất thường (${r.vocabWords})`)
  console.log(
    `${String(r.num).padEnd(4)} | ${r.file.padEnd(24)} | ${String(r.grammarPoints).padEnd(13)} | ${String(t?.grammarMax ?? '-').padEnd(12)} | ${String(r.vocabWords).padEnd(7)} | ${String(r.days).padEnd(4)} | ${flags.join('; ')}`,
  )
}

const totalDays = rows.filter((r) => !/_Work/.test(r.file)).reduce((s, r) => s + r.days, 0)
console.log(`\nTổng số ngày (track B / IELTS Bridge, không tính *_Work): ${totalDays} (khóa chuẩn = 63)`)

const overloaded = rows.filter((r) => TARGET[r.num] && r.grammarPoints > TARGET[r.num].grammarMax)
if (overloaded.length) {
  console.log(`\n⚠️  ${overloaded.length} tuần vượt chuẩn ngữ pháp: ${overloaded.map((r) => r.file).join(', ')}`)
  process.exitCode = 1
} else {
  console.log('\n✅ Không tuần nào vượt chuẩn ngữ pháp đã đặt.')
}
