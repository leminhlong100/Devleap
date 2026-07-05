<script setup>
import ProgressRing from '@/components/common/ProgressRing.vue'

defineProps({
  day: { type: Object, required: true },
  plan: { type: Object, required: true },
  isDiagnostic: { type: Boolean, default: false },
  agendaCount: { type: Number, default: 0 },
  weekDoneCount: { type: Number, default: 0 },
  ringPct: { type: Number, default: 0 },
  isDone: { type: Function, required: true },
  dayUnlocked: { type: Function, required: true },
})
defineEmits(['go-day'])
</script>

<template>
  <!-- HEADER CARD -->
  <div class="head-card">
    <div class="head-glow"></div>
    <div class="head-text">
      <div class="head-tags">
        <span class="pill">TUẦN {{ day.week }} · BUỔI {{ day.n }} / {{ day.totalDays }}</span>
        <span class="date">{{ day.subtitle }}</span>
      </div>
      <h1 class="head-title">{{ day.title }}</h1>
      <p class="head-intro">Tuần {{ day.week }} · {{ day.weekTitle }}</p>
      <div class="head-meta">
        <span class="meta-chip">🧱 Tuần nền tảng</span>
        <span v-if="agendaCount" class="meta-chip">✅ {{ agendaCount }} hoạt động</span>
        <span v-if="plan.vocab && day.vocab.length" class="meta-chip">🗣️ {{ day.vocab.length + day.reviewVocab.length }} từ</span>
        <span v-if="day.milestone" class="meta-chip">🎯 Mốc tuần: {{ day.milestone }}</span>
      </div>
    </div>
    <div class="head-ring">
      <ProgressRing :pct="ringPct" track-color="rgba(255,255,255,.25)">
        <div class="ring-pct">{{ weekDoneCount }}</div>
        <div class="ring-label">/ {{ day.totalDays }} buổi</div>
      </ProgressRing>
      <div class="ring-foot">Tuần {{ day.week }} đã xong {{ ringPct }}%</div>
    </div>
  </div>

  <!-- DAY NAV -->
  <div class="day-nav">
    <button
      v-for="dd in day.days"
      :key="dd.n"
      class="day-chip"
      :class="{ on: dd.n === day.n, done: isDone(dd.n), locked: !dayUnlocked(dd.n) }"
      :disabled="!dayUnlocked(dd.n)"
      @click="$emit('go-day', dd.n)"
    >
      <span v-if="isDone(dd.n)" class="chip-tick">✓</span>
      <span v-else-if="!dayUnlocked(dd.n)" class="chip-tick">🔒</span>Buổi {{ dd.n }}
    </button>
  </div>

  <!-- BANNER CHẨN ĐOÁN ĐẦU VÀO — chỉ ở Tuần 1 · Buổi 1 -->
  <section v-if="isDiagnostic" class="diag-card">
    <div class="diag-ico">🩺</div>
    <div class="diag-body">
      <h3>Buổi chẩn đoán đầu vào — "mốc 0"</h3>
      <p>
        Hôm nay <b>không phải để lấy điểm cao</b>, mà để ghi lại <b>điểm xuất phát</b> của em. Hãy làm thật hai việc:
        (1) <b>viết</b> bài về bản thân rồi nhờ AI chấm — điểm &amp; trình độ <b>CEFR</b> AI đưa ra chính là mốc 0;
        (2) <b>ghi âm</b> đọc to 5 câu để giữ lại. Cuối khóa em sẽ mở lại "mốc 0" này và thấy mình tiến bộ tới đâu.
      </p>
    </div>
  </section>
</template>

<style scoped>
/* banner chẩn đoán đầu vào (Tuần 1 · Buổi 1) */
.diag-card {
  margin-top: 18px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: linear-gradient(135deg, #fff7e8, #fff1f1);
  border: 1px solid rgba(255, 176, 32, 0.35);
  border-left: 4px solid #ffb020;
  border-radius: 18px;
  padding: 18px 22px;
}
.diag-ico {
  font-size: 30px;
  line-height: 1;
  flex: none;
}
.diag-body h3 {
  font-size: 16.5px;
  font-weight: 800;
  color: #7a5200;
  letter-spacing: -0.3px;
}
.diag-body p {
  font-size: 14.5px;
  line-height: 1.6;
  color: #6a5a3a;
  margin-top: 6px;
}
.diag-body b {
  color: #5a4300;
}
[data-theme='dark'] .diag-card {
  background: var(--bg-warning);
}
[data-theme='dark'] .diag-body h3 {
  color: var(--text-warning);
}
[data-theme='dark'] .diag-body p,
[data-theme='dark'] .diag-body b {
  color: var(--amber-ink);
}

/* header */
.head-card {
  margin-top: 16px;
  background: linear-gradient(135deg, #00d68f, #00966a);
  border-radius: 28px;
  padding: 34px 36px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  flex-wrap: wrap;
}
.head-glow {
  position: absolute;
  top: -60px;
  right: 140px;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.28), transparent 70%);
}
.head-text {
  position: relative;
  max-width: 620px;
}
.head-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pill {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  padding: 6px 13px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 800;
}
.date {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 600;
}
.head-title {
  color: #fff;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.14;
  margin: 14px 0 0;
  letter-spacing: -0.6px;
}
.head-intro {
  color: #e2fff3;
  font-size: 15.5px;
  line-height: 1.6;
  margin-top: 11px;
}
.head-meta {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap;
}
.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
}
.head-ring {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: none;
}
.ring-pct {
  font-size: 30px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}
.ring-label {
  font-size: 11px;
  color: #e2fff3;
  font-weight: 600;
}
.ring-foot {
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

/* day nav */
.day-nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 18px;
}
.day-chip {
  border: 1px solid rgba(0, 214, 143, 0.28);
  background: var(--surface);
  color: #3a8a66;
  font-size: 13px;
  font-weight: 700;
  padding: 9px 15px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
@media (hover: hover) {
  .day-chip:hover {
    background: #e6fbf2;
  }
}
.day-chip:active {
  background: #e6fbf2;
}
.day-chip.on {
  background: linear-gradient(135deg, #00d68f, #00a86f);
  border-color: transparent;
  color: #fff;
}
.day-chip.done {
  border-color: rgba(0, 214, 143, 0.5);
  background: rgba(0, 214, 143, 0.12);
  color: #00966a;
}
.day-chip.done.on {
  background: linear-gradient(135deg, #00d68f, #00a86f);
  color: #fff;
  border-color: transparent;
}
.day-chip.locked {
  border-color: rgba(0, 0, 0, 0.08);
  background: var(--bg-muted);
  color: var(--muted-3);
  cursor: not-allowed;
}
@media (hover: hover) {
  .day-chip.locked:hover {
    background: var(--bg-muted);
  }
}
.chip-tick {
  font-weight: 900;
  margin-right: 5px;
}
</style>
