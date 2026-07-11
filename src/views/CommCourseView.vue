<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ConquestMap from '@/components/course/ConquestMap.vue'
import { computeCommWeeks, computeCommProgress, commTotals } from '@/data/courseComm'

const router = useRouter()
const user = useUserStore()

// Soft gating: tuần "xong" khi đủ buổi + đạt quiz tuần (nếu có) -> mở tuần kế.
const weekPassed = (num) => user.quizPassed('comm', `week:${num}`)
const weeks = computed(() => computeCommWeeks(user.completed.comm || [], weekPassed))
const prog = computed(() => computeCommProgress(user.completed.comm || [], weekPassed))

const continueLabel = computed(() =>
  prog.value.allDone
    ? '🎉 Đã hoàn thành khóa'
    : prog.value.doneDays === 0
      ? '▶ Bắt đầu nhập vai'
      : `▶ Tiếp tục Tuần ${prog.value.currentWeek}`,
)
const fillPct = computed(() => Math.max(prog.value.pct, 3))
const progressText = computed(() =>
  prog.value.doneDays === 0
    ? `0 / ${prog.value.totalWeeks} tuần · Mới bắt đầu`
    : `${prog.value.doneWeeks} / ${prog.value.totalWeeks} tuần · ${prog.value.pct}%`,
)

// Bản đồ giai đoạn: 4 khối × 2 tuần (chỉ hiện những mốc có tuần thật để tránh lệch
// khi mới có Tuần 1).
const commStages = {
  1: { icon: '🛒', label: 'Khối 1 · Đời sống hằng ngày', range: 'Tuần 1–2' },
  3: { icon: '🤝', label: 'Khối 2 · Kết bạn quốc tế', range: 'Tuần 3–4' },
  5: { icon: '💻', label: 'Khối 3 · Công việc IT/văn phòng', range: 'Tuần 5–6' },
  7: { icon: '🎯', label: 'Khối 4 · Phỏng vấn & sự nghiệp', range: 'Tuần 7–8' },
}

const pillars = [
  { icon: '🎭', title: 'Nhập vai là trục', desc: 'Mỗi buổi bạn nói với AI trong một tình huống thật, không học lý thuyết rời.' },
  { icon: '🌀', title: 'Hai hiệp mỗi trận', desc: 'Hiệp 1 bám kịch bản vừa học; hiệp 2 AI tung twist bất ngờ để ép phản xạ.' },
  { icon: '🎤', title: 'Nói là mặc định', desc: 'Mic mở sẵn + đồng hồ 10s. Gõ chữ chỉ là phương án dự phòng.' },
  { icon: '🌍', title: 'Có trận thật', desc: 'Mỗi tuần 1 mission ngoài app + Boss cuối tuần chấm theo rubric.' },
]

function openDay(w) {
  const day = w.num === prog.value.currentWeek ? prog.value.continue.day : 1
  router.push({ name: 'comm-day', params: { week: w.num, day } })
}
function start() {
  router.push({ name: 'comm-day', params: prog.value.continue })
}
</script>

<template>
  <div>
    <!-- BANNER -->
    <section class="banner">
      <div class="banner-emoji">🎭</div>
      <div class="banner-inner">
        <span class="back" @click="router.push({ name: 'courses' })">← Tất cả khóa học</span>
        <div class="banner-head">
          <div class="banner-text">
            <span class="badge">🎭 GIAO TIẾP · THỰC CHIẾN · 8 TUẦN</span>
            <h1 class="title">Giao Tiếp Thực Chiến —<br />Nói được, không chỉ hiểu</h1>
            <p class="desc">
              Khóa độc lập cho người A2 trở lên. 8 tuần, 4 bối cảnh (đời sống · kết bạn · công sở · phỏng vấn).
              Mỗi buổi nhập vai với AI cho tới khi phản xạ đầu tiên là <b>nói</b>, không phải dịch thầm trong đầu.
            </p>
          </div>
          <button class="continue-btn" @click="start">{{ continueLabel }}</button>
        </div>

        <div class="strip">
          <div class="strip-main">
            <div class="strip-main-top"><span>Tiến độ khóa</span><span>{{ progressText }}</span></div>
            <div class="strip-track"><div class="strip-fill" :style="{ width: fillPct + '%' }"></div></div>
          </div>
          <div class="strip-stat"><div class="sv">🎭 56</div><div class="sl">buổi nhập vai</div></div>
          <div class="strip-stat"><div class="sv">⏱ 60'</div><div class="sl">mỗi buổi</div></div>
          <div class="strip-stat"><div class="sv">👑 8</div><div class="sl">Boss tuần</div></div>
        </div>
      </div>
    </section>

    <!-- 4 NGUYÊN TẮC -->
    <section class="container narrow section-top">
      <div class="section-head">
        <h2 class="sh-title">Khóa này khác gì?</h2>
        <p class="sh-sub">Học để nhập vai — không phải học rồi (may ra) mới nhập vai</p>
      </div>
      <div class="pillar-grid">
        <div v-for="p in pillars" :key="p.title" class="pillar-card">
          <div class="pillar-icon">{{ p.icon }}</div>
          <h3>{{ p.title }}</h3>
          <p>{{ p.desc }}</p>
        </div>
      </div>
    </section>

    <!-- MAP -->
    <div class="map-head">
      <h2 class="sh-title">Bản đồ {{ commTotals.weeks }} tuần của bạn</h2>
      <p class="sh-sub">Vượt Boss cuối tuần để mở khóa tuần tiếp theo</p>
    </div>
    <ConquestMap :weeks="weeks" :stages="commStages" theme="green" @select="openDay">
      <template #footer>
        <div class="goal-wrap">
          <div class="goal">
            <div class="goal-icon">🏆</div>
            <div class="goal-title">Đích đến: phản xạ tình huống thật không cần chuẩn bị trước</div>
            <div class="goal-sub">Vượt 8 Boss + Marathon Tuần 8 để mở huy hiệu "Sống sót thực chiến" 🎖️</div>
            <button class="goal-btn" @click="router.push({ name: 'comm-summary' })">🏆 Xem tổng kết khóa →</button>
          </div>
        </div>
      </template>
    </ConquestMap>
  </div>
</template>

<style scoped>
.banner {
  position: relative;
  overflow: hidden;
  background: linear-gradient(150deg, #ffb020, #f08a00);
}
.banner-emoji {
  position: absolute;
  top: -50px;
  right: 6%;
  font-size: 230px;
  opacity: 0.14;
}
.banner-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 30px var(--space-page-x) 44px;
  position: relative;
}
.back {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.banner-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  margin-top: 18px;
  flex-wrap: wrap;
}
.banner-text {
  max-width: 600px;
}
.badge {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  padding: 6px 13px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 800;
}
.title {
  color: #fff;
  font-size: 40px;
  font-weight: 800;
  line-height: 1.1;
  margin: 16px 0 0;
  letter-spacing: -1px;
}
.desc {
  color: #fff6e6;
  font-size: 16px;
  line-height: 1.6;
  margin-top: 14px;
}
.continue-btn {
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  color: #b25f00;
  padding: 16px 26px;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
  white-space: nowrap;
  transition: transform 0.18s;
}
@media (hover: hover) {
  .continue-btn:hover {
    transform: translateY(-2px);
  }
}
.continue-btn:active {
  transform: translateY(0) scale(0.98);
}
.strip {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 16px;
  margin-top: 30px;
}
.strip-main,
.strip-stat {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
}
.strip-main {
  padding: 18px 20px;
}
.strip-main-top {
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 9px;
}
.strip-track {
  height: 10px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.3);
}
.strip-fill {
  height: 100%;
  border-radius: 99px;
  background: #fff;
}
.strip-stat {
  padding: 14px 18px;
  text-align: center;
}
.sv {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
}
.sl {
  font-size: 12px;
  color: #fff6e6;
  font-weight: 600;
}

.narrow {
  max-width: 1080px;
}
.section-top {
  padding-top: 42px;
  padding-bottom: 6px;
}
.section-head {
  text-align: center;
  margin-bottom: 26px;
}
.sh-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.sh-sub {
  font-size: 15.5px;
  color: var(--muted);
  margin-top: 8px;
}
.pillar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.pillar-card {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 20px;
  padding: 24px 20px;
  box-shadow: 0 10px 30px rgba(255, 176, 32, 0.08);
  transition: all 0.18s;
}
@media (hover: hover) {
  .pillar-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 40px rgba(255, 176, 32, 0.16);
  }
}
.pillar-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  background: rgba(255, 176, 32, 0.16);
}
.pillar-card h3 {
  font-size: 17px;
  font-weight: 800;
  margin: 16px 0 7px;
  letter-spacing: -0.2px;
}
.pillar-card p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
}

.map-head {
  text-align: center;
  margin: 40px 0 -20px;
}
.goal-wrap {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-top: 24px;
}
.goal {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #fff3dc, #ffe7bd);
  border: 1px solid rgba(255, 176, 32, 0.35);
  padding: 22px 34px;
  border-radius: 22px;
}
[data-theme='dark'] .goal {
  background: var(--bg-warning);
}
.goal-icon {
  font-size: 38px;
}
.goal-title {
  font-weight: 800;
  font-size: 17px;
  color: var(--ink);
  max-width: 520px;
}
.goal-sub {
  font-size: 13.5px;
  color: var(--text-warning, #b25f00);
  font-weight: 600;
}
.goal-btn {
  margin-top: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #ffb020, #f08a00);
  padding: 11px 20px;
  border-radius: 12px;
  box-shadow: 0 10px 22px rgba(255, 176, 32, 0.28);
}
@media (max-width: 900px) {
  .pillar-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 760px) {
  .strip {
    grid-template-columns: 1fr 1fr;
  }
  .title {
    font-size: 30px;
  }
}
@media (max-width: 560px) {
  .pillar-grid {
    grid-template-columns: 1fr;
  }
}
</style>
