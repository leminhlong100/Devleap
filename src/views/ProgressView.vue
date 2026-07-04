<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { writingSeries, writingSummary, speakingWeeklyMinutes, srsRetention } from '@/lib/progressStats'

/**
 * Trang "Tiến độ" — biểu đồ điểm viết theo buổi + phút nói theo tuần, dựng
 * trên dữ liệu THẬT đã lưu (state.writings/.speakingLog/.srs trong stores/user.js).
 * Vẽ bằng SVG thuần (không cài chart lib) — xem docs/KE_HOACH_CAI_TIEN_WEBSITE.md Bước 2.5.
 */
const router = useRouter()
const user = useUserStore()

const series = computed(() => writingSeries(user.writings, 'ielts'))
const summary = computed(() => writingSummary(series.value))
const weeklyMinutes = computed(() => speakingWeeklyMinutes(user.speakingLog))
const totalSpeakingMinutes = computed(() => weeklyMinutes.value.reduce((n, w) => n + w.minutes, 0))
const retention = computed(() => srsRetention(user.srs))

function fmtDelta(d) {
  if (d === null || d === undefined) return null
  if (d > 0) return `▲ +${d}`
  if (d < 0) return `▼ ${d}`
  return '— 0'
}

// —— Biểu đồ đường: điểm viết theo buổi ——
const LINE_W = 640
const LINE_H = 220
const LINE_PAD = { top: 16, right: 16, bottom: 30, left: 34 }
const linePlot = computed(() => {
  const pts = series.value
  const innerW = LINE_W - LINE_PAD.left - LINE_PAD.right
  const innerH = LINE_H - LINE_PAD.top - LINE_PAD.bottom
  const n = pts.length
  const x = (i) => LINE_PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (score) => LINE_PAD.top + innerH * (1 - Math.max(0, Math.min(100, score)) / 100)
  const points = pts.map((p, i) => ({ ...p, cx: x(i), cy: y(p.score) }))
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(' ')
  // Chỉ hiện nhãn trục X ở điểm đầu/giữa/cuối để đỡ rối khi có nhiều buổi.
  const labelIdx = new Set(n <= 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1])
  return { points, path, labelIdx, innerH, gridY: [0, 20, 40, 60, 80, 100].map((s) => ({ score: s, y: y(s) })) }
})

// —— Biểu đồ cột: phút nói theo tuần ——
const BAR_W = 640
const BAR_H = 200
const BAR_PAD = { top: 16, right: 16, bottom: 30, left: 34 }
const barPlot = computed(() => {
  const rows = weeklyMinutes.value
  const innerW = BAR_W - BAR_PAD.left - BAR_PAD.right
  const innerH = BAR_H - BAR_PAD.top - BAR_PAD.bottom
  const max = Math.max(1, ...rows.map((r) => r.minutes))
  const n = rows.length
  const gap = 10
  const barW = n ? Math.max(6, innerW / n - gap) : 0
  const bars = rows.map((r, i) => {
    const h = (r.minutes / max) * innerH
    const x = BAR_PAD.left + i * (innerW / n) + (innerW / n - barW) / 2
    const label = r.weekStart.slice(5).split('-').reverse().join('/') // 'MM/DD' -> 'DD/MM'
    return { ...r, x, y: BAR_PAD.top + innerH - h, w: barW, h, label }
  })
  return { bars, innerH }
})
</script>

<template>
  <div class="container narrow section-top">
    <span class="back" @click="router.push({ name: 'ielts' })">← Khóa IELTS nền tảng</span>
    <h1 class="page-title">📈 Tiến độ học tập</h1>
    <p class="page-sub">Nhìn lại chặng đường viết và nói của em — số liệu lấy từ chính các buổi đã học, không phải ước lượng.</p>

    <!-- TỔNG QUAN -->
    <section class="block">
      <div class="overview-grid">
        <div class="ov-card">
          <div class="ov-label">Điểm viết mới nhất</div>
          <div v-if="summary.latest" class="ov-value">
            {{ summary.latest.score }}<span class="ov-unit">/100</span>
            <span v-if="summary.latest.cefr" class="ov-badge">{{ summary.latest.cefr }}</span>
          </div>
          <div v-else class="ov-empty">Chưa có bài nào được chữa</div>
          <div v-if="summary.delta !== null" class="ov-sub" :class="{ up: summary.delta > 0, down: summary.delta < 0 }">
            {{ fmtDelta(summary.delta) }} so với bài đầu tiên
          </div>
        </div>
        <div class="ov-card">
          <div class="ov-label">Tổng phút luyện nói</div>
          <div v-if="totalSpeakingMinutes > 0" class="ov-value">{{ totalSpeakingMinutes }}<span class="ov-unit">phút</span></div>
          <div v-else class="ov-empty">Chưa ghi nhận phút nói nào</div>
        </div>
        <div class="ov-card">
          <div class="ov-label">Từ vựng đến hạn ôn</div>
          <div class="ov-value">{{ user.dueTodayCount }}<span class="ov-unit">thẻ</span></div>
        </div>
        <div class="ov-card" v-if="retention">
          <div class="ov-label">Tỉ lệ nhớ từ (ước tính)</div>
          <div class="ov-value">{{ retention.pct }}<span class="ov-unit">%</span></div>
          <div class="ov-sub">Trên {{ retention.total }} thẻ đã ôn thật</div>
        </div>
      </div>
    </section>

    <!-- ĐIỂM VIẾT THEO BUỔI -->
    <section class="block">
      <h2 class="block-title">✍️ Điểm viết theo buổi</h2>
      <div v-if="!series.length" class="empty">
        Chưa có bài viết nào được AI chữa xong — hoàn thành phần "Luyện viết" trong một buổi học và chờ AI chấm để bắt đầu thấy biểu đồ ở đây.
      </div>
      <div v-else class="chart-wrap">
        <svg :viewBox="`0 0 ${LINE_W} ${LINE_H}`" class="chart-svg" preserveAspectRatio="xMidYMid meet">
          <line
            v-for="g in linePlot.gridY"
            :key="'g' + g.score"
            :x1="LINE_PAD.left"
            :x2="LINE_W - LINE_PAD.right"
            :y1="g.y"
            :y2="g.y"
            class="grid-line"
          />
          <text v-for="g in linePlot.gridY" :key="'gl' + g.score" :x="LINE_PAD.left - 6" :y="g.y + 3" class="axis-label y">
            {{ g.score }}
          </text>
          <path :d="linePlot.path" class="line-path" fill="none" />
          <template v-for="(p, i) in linePlot.points" :key="p.key">
            <circle :cx="p.cx" :cy="p.cy" r="4" class="line-dot" :class="{ ok: p.score >= 70, bad: p.score < 50 }">
              <title>Tuần {{ p.week }} · Buổi {{ p.day }} — {{ p.score }}/100{{ p.cefr ? ` (${p.cefr})` : '' }}</title>
            </circle>
            <text v-if="linePlot.labelIdx.has(i)" :x="p.cx" :y="LINE_H - 8" class="axis-label x">T{{ p.week }}·B{{ p.day }}</text>
          </template>
        </svg>
      </div>
    </section>

    <!-- PHÚT NÓI THEO TUẦN -->
    <section class="block">
      <h2 class="block-title">🎙️ Phút luyện nói theo tuần</h2>
      <div v-if="!weeklyMinutes.length" class="empty">
        Chưa ghi nhận phút nói nào — luyện nói qua Chat AI, Shadowing hoặc Luyện phát âm trong buổi học để tích lũy số liệu.
      </div>
      <div v-else class="chart-wrap">
        <svg :viewBox="`0 0 ${BAR_W} ${BAR_H}`" class="chart-svg" preserveAspectRatio="xMidYMid meet">
          <rect v-for="b in barPlot.bars" :key="b.weekStart" :x="b.x" :y="b.y" :width="b.w" :height="b.h" class="bar-rect" rx="4">
            <title>Tuần bắt đầu {{ b.label }} — {{ b.minutes }} phút nói</title>
          </rect>
          <text v-for="b in barPlot.bars" :key="'bl' + b.weekStart" :x="b.x + b.w / 2" :y="BAR_H - 8" class="axis-label x">
            {{ b.label }}
          </text>
        </svg>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section-top {
  padding-top: 32px;
  padding-bottom: 60px;
}
.back {
  font-size: 14px;
  font-weight: 700;
  color: var(--purple);
  cursor: pointer;
}
.page-title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.6px;
  margin: 14px 0 8px;
}
.page-sub {
  font-size: 15.5px;
  color: var(--muted);
  line-height: 1.6;
  max-width: 640px;
}
.block {
  margin-top: 36px;
}
.block-title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 14px;
}
.empty {
  font-size: 14.5px;
  color: var(--muted);
  background: var(--bg);
  border-radius: 14px;
  padding: 16px 18px;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.ov-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
}
.ov-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.ov-value {
  font-size: 26px;
  font-weight: 800;
  margin-top: 6px;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.ov-unit {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted-2);
}
.ov-badge {
  font-size: 12px;
  font-weight: 800;
  color: var(--purple);
  background: var(--purple-soft);
  border-radius: 8px;
  padding: 2px 7px;
}
.ov-empty {
  font-size: 13.5px;
  color: var(--muted-2);
  font-style: italic;
  margin-top: 8px;
}
.ov-sub {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 6px;
}
.ov-sub.up {
  color: var(--text-success);
}
.ov-sub.down {
  color: var(--red);
}
.chart-wrap {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 14px;
}
.chart-svg {
  width: 100%;
  height: auto;
  display: block;
}
.grid-line {
  stroke: var(--line);
  stroke-width: 1;
}
.axis-label {
  font-size: 10px;
  fill: var(--muted-2);
}
.axis-label.y {
  text-anchor: end;
}
.axis-label.x {
  text-anchor: middle;
}
.line-path {
  stroke: var(--purple);
  stroke-width: 2.5;
}
.line-dot {
  fill: var(--purple);
  stroke: var(--surface);
  stroke-width: 1.5;
}
.line-dot.ok {
  fill: var(--green-2);
}
.line-dot.bad {
  fill: var(--red);
}
.bar-rect {
  fill: var(--purple);
}

@media (max-width: 800px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
