<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ConquestMap from '@/components/course/ConquestMap.vue'
import { ieltsStages, ieltsMeta, ieltsExplain, ieltsSkills, bandLadder } from '@/data/courses'
import { computeIeltsWeeks, computeIeltsProgress } from '@/data/courseIelts'

const router = useRouter()
const user = useUserStore()

// Tuần chỉ "xong" khi đã đạt bài kiểm tra tuần -> mới mở tuần kế (pass hết mới qua).
const weekPassed = (num) => user.quizPassed('ielts', `week:${num}`)
const weeks = computed(() => computeIeltsWeeks(user.completed.ielts, weekPassed))
const prog = computed(() => computeIeltsProgress(user.completed.ielts, weekPassed))
const continueLabel = computed(() =>
  prog.value.allDone
    ? '🎉 Đã hoàn thành lộ trình'
    : prog.value.doneDays === 0
      ? '▶ Bắt đầu Tuần 1'
      : `▶ Tiếp tục Tuần ${prog.value.currentWeek}`,
)
const fillPct = computed(() => Math.max(prog.value.pct, 3)) // luôn nhìn thấy thanh dù mới bắt đầu
const progressText = computed(() =>
  prog.value.doneDays === 0
    ? `0 / ${prog.value.totalWeeks} tuần · Mới bắt đầu`
    : `${prog.value.doneWeeks} / ${prog.value.totalWeeks} tuần · ${prog.value.pct}%`,
)

function openDay(w) {
  const day = w.num === prog.value.currentWeek ? prog.value.continue.day : 1
  router.push({ name: 'ielts-day', params: { week: w.num, day } })
}
function start() {
  router.push({ name: 'ielts-day', params: prog.value.continue })
}
function goFinal() {
  if (!prog.value.allDone) return // chưa học xong thì chưa cho thi cuối khóa
  router.push({ name: 'assessment', params: { course: 'ielts', scope: 'final' } })
}
const finalResult = computed(() => user.quizOf('ielts', 'final'))
const finalLocked = computed(() => !prog.value.allDone)

// Gợi ý "ngày ôn bù": tuần hiện tại đã làm bài kiểm tra nhưng chưa đạt 70% ->
// nhắc ôn lại câu sai TRƯỚC khi khuyến nghị học tiếp (soft gating, không chặn).
const currentWeekQuiz = computed(() => user.quizOf('ielts', `week:${prog.value.currentWeek}`))
const remedial = computed(() =>
  currentWeekQuiz.value && !currentWeekQuiz.value.passed && currentWeekQuiz.value.wrong?.length
    ? currentWeekQuiz.value
    : null,
)
function goRemedial() {
  router.push({ name: 'assessment', params: { course: 'ielts', scope: `week-${prog.value.currentWeek}` } })
}

function chooseTrack(track) {
  if (track === user.ieltsTrack) return
  const label = track === 'A' ? 'Work & Life English' : 'IELTS Bridge'
  if (!confirm(`Đổi Tuần 6–8 sang lộ trình "${label}"? Trang sẽ tải lại.`)) return
  user.setIeltsTrack(track)
}
</script>

<template>
  <div>
    <!-- BANNER -->
    <section class="banner" :style="{ background: ieltsMeta.bannerGrad }">
      <div class="banner-emoji">🎯</div>
      <div class="banner-inner">
        <span class="back" @click="router.push({ name: 'courses' })">← Tất cả khóa học</span>
        <div class="track-switch">
          <span class="track-label">Tuần 6–8:</span>
          <button class="track-btn" :class="{ active: user.ieltsTrack === 'A' }" @click="chooseTrack('A')">
            🧑‍💼 Work & Life
          </button>
          <button class="track-btn" :class="{ active: user.ieltsTrack === 'B' }" @click="chooseTrack('B')">
            🎯 IELTS Bridge
          </button>
          <button class="track-btn" @click="router.push({ name: 'milestones' })">📊 So sánh mốc</button>
        </div>
        <div class="banner-head">
          <div class="banner-text">
            <span class="badge">{{ ieltsMeta.badge }}</span>
            <h1 class="title">
              <template v-for="(line, i) in ieltsMeta.title.split('\n')" :key="i">{{ line }}<br /></template>
            </h1>
            <p class="desc">{{ ieltsMeta.desc }}</p>
          </div>
          <button class="continue-btn" @click="start">{{ continueLabel }}</button>
        </div>

        <div v-if="remedial" class="remedial-hint" @click="goRemedial">
          🩹 Bài kiểm tra Tuần {{ prog.currentWeek }} mới đạt {{ remedial.pct }}% — ôn lại {{ remedial.wrong.length }} câu sai trước khi học tiếp →
        </div>

        <div class="strip">
          <div class="strip-main">
            <div class="strip-main-top"><span>Tiến độ lộ trình</span><span>{{ progressText }}</span></div>
            <div class="strip-track"><div class="strip-fill" :style="{ width: fillPct + '%' }"></div></div>
          </div>
          <div class="strip-stat"><div class="sv">🎯 6.5</div><div class="sl">band mục tiêu</div></div>
          <div class="strip-stat"><div class="sv">⏱ 15'</div><div class="sl">mỗi ngày</div></div>
          <div class="strip-stat"><div class="sv">🗓 8</div><div class="sl">tuần</div></div>
        </div>
      </div>
    </section>

    <!-- HIỂU NHANH -->
    <section class="container narrow section-top">
      <div class="section-head">
        <h2 class="sh-title">Hiểu nhanh về IELTS trong 1 phút</h2>
        <p class="sh-sub">Trước khi học, nắm 4 điều này là bạn đã tự tin hơn nhiều rồi</p>
      </div>
      <div class="explain-grid">
        <div v-for="f in ieltsExplain" :key="f.title" class="explain-card">
          <div class="explain-icon" :style="{ background: f.bg }">{{ f.icon }}</div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 4 KỸ NĂNG + BAND -->
    <section class="container narrow skills-section">
      <div class="two-col">
        <div class="skills-box">
          <h3 class="box-title">Bài thi gồm 4 kỹ năng</h3>
          <p class="box-sub">Khóa cơ bản đi qua lần lượt từng kỹ năng, từ dễ đến khó.</p>
          <div class="skills-grid">
            <div v-for="s in ieltsSkills" :key="s.name" class="skill">
              <div class="skill-icon" :style="{ background: s.bg }">{{ s.icon }}</div>
              <div class="skill-meta">
                <div class="skill-name">{{ s.name }}</div>
                <div class="skill-desc">{{ s.desc }} · {{ s.time }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="band-box">
          <h3 class="band-title">Thang điểm band</h3>
          <p class="band-sub">Mục tiêu của khóa: chạm Band <b>6.5</b></p>
          <div class="band-chart">
            <div v-for="b in bandLadder" :key="b.band" class="band-col">
              <div class="band-flag">{{ b.target ? '🎯' : '' }}</div>
              <div class="band-bar" :style="{ height: b.pct + '%', background: b.target ? 'linear-gradient(180deg,#00D68F,#00a86f)' : '#E6E6F0' }"></div>
              <div class="band-num" :style="{ color: b.target ? '#00A86F' : '#6a6a82', fontWeight: b.target ? 800 : 700 }">{{ b.band }}</div>
              <div class="band-label" :style="{ color: b.target ? '#00A86F' : '#9a9ab0' }">{{ b.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MAP -->
    <div class="map-head">
      <h2 class="sh-title">Bản đồ 8 tuần của bạn</h2>
      <p class="sh-sub">Hoàn thành một chặng để mở chặng tiếp theo</p>
    </div>
    <ConquestMap :weeks="weeks" :stages="ieltsStages" theme="green" @select="openDay">
      <template #footer>
        <div class="goal-wrap">
          <div class="goal">
            <div class="goal-icon">🏆</div>
            <div class="goal-title">{{ ieltsMeta.goalTitle }}</div>
            <div class="goal-sub">{{ ieltsMeta.goalSub }}</div>
            <button class="final-btn" :class="{ locked: finalLocked }" :disabled="finalLocked" @click="goFinal">
              {{ finalLocked ? '🔒 Thi cuối khóa' : '🎯 Thi cuối khóa' }}
              <span v-if="finalResult" class="final-pct">· {{ finalResult.passed ? '✅' : '' }} {{ finalResult.pct }}%</span>
            </button>
            <div v-if="finalLocked" class="final-hint">
              Hoàn thành cả {{ prog.totalWeeks }} tuần để mở khóa ({{ prog.doneWeeks }}/{{ prog.totalWeeks }} tuần)
            </div>
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
}
.banner-emoji {
  position: absolute;
  top: -60px;
  right: 6%;
  font-size: 230px;
  opacity: 0.13;
}
.banner-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 30px 28px 44px;
  position: relative;
}
.back {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.track-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.track-label {
  color: rgba(255, 255, 255, 0.75);
  font-size: 12.5px;
  font-weight: 700;
}
.track-btn {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 12.5px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 99px;
  cursor: pointer;
  transition: background 0.15s;
}
.track-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}
.track-btn.active {
  background: #fff;
  color: #00966a;
  border-color: #fff;
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
  max-width: 580px;
}
.badge {
  background: rgba(255, 255, 255, 0.2);
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
  color: #e2fff3;
  font-size: 16px;
  line-height: 1.6;
  margin-top: 14px;
}
.continue-btn {
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  color: #00966a;
  padding: 16px 26px;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
  white-space: nowrap;
  transition: transform 0.18s;
}
.continue-btn:hover {
  transform: translateY(-2px);
}
.remedial-hint {
  margin-top: 18px;
  background: rgba(255, 214, 102, 0.22);
  border: 1px solid rgba(255, 214, 102, 0.5);
  color: #fff;
  font-size: 13.5px;
  font-weight: 700;
  padding: 12px 18px;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.remedial-hint:hover {
  background: rgba(255, 214, 102, 0.32);
}
.strip {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 16px;
  margin-top: 30px;
}
.strip-main,
.strip-stat {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
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
  background: rgba(255, 255, 255, 0.25);
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
  color: #e2fff3;
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
  color: #7a7a92;
  margin-top: 8px;
}
.explain-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.explain-card {
  background: #fff;
  border: 1px solid var(--line-soft);
  border-radius: 20px;
  padding: 24px 20px;
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.06);
  transition: all 0.18s;
}
.explain-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(108, 92, 231, 0.12);
}
.explain-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.explain-card h3 {
  font-size: 17px;
  font-weight: 800;
  margin: 16px 0 7px;
  letter-spacing: -0.2px;
}
.explain-card p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
}

.skills-section {
  padding-top: 30px;
  padding-bottom: 10px;
}
.two-col {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 24px;
  align-items: stretch;
}
.skills-box {
  background: #fff;
  border: 1px solid var(--line-soft);
  border-radius: 24px;
  padding: 26px 26px 28px;
  box-shadow: 0 12px 34px rgba(108, 92, 231, 0.07);
}
.box-title {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.3px;
}
.box-sub {
  font-size: 14px;
  color: var(--muted);
  margin-top: 5px;
}
.skills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 20px;
}
.skill {
  display: flex;
  gap: 13px;
  align-items: center;
  background: var(--bg);
  border: 1px solid rgba(108, 92, 231, 0.07);
  border-radius: 16px;
  padding: 14px 16px;
}
.skill-icon {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex: none;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
}
.skill-name {
  font-size: 15.5px;
  font-weight: 800;
  letter-spacing: -0.2px;
}
.skill-desc {
  font-size: 12.5px;
  color: var(--muted-2);
  font-weight: 600;
}
.band-box {
  background: linear-gradient(135deg, #1e1e2e, #23203a);
  border-radius: 24px;
  padding: 26px;
  position: relative;
  overflow: hidden;
  color: #fff;
}
.band-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.3px;
}
.band-sub {
  font-size: 13px;
  color: #b3b0c9;
  margin-top: 4px;
}
.band-sub b {
  color: var(--green);
}
.band-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  height: 150px;
  margin-top: 24px;
}
.band-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}
.band-flag {
  font-size: 13px;
  margin-bottom: 5px;
}
.band-bar {
  width: 100%;
  max-width: 34px;
  border-radius: 9px 9px 0 0;
}
.band-num {
  font-size: 14px;
  margin-top: 8px;
}
.band-label {
  font-size: 10.5px;
  font-weight: 600;
}

.map-head {
  text-align: center;
  margin: 36px 0 -20px;
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
  background: linear-gradient(135deg, #e6fbf2, #d2f7e7);
  border: 1px solid rgba(0, 214, 143, 0.3);
  padding: 22px 34px;
  border-radius: 22px;
}
.goal-icon {
  font-size: 38px;
}
.goal-title {
  font-weight: 800;
  font-size: 17px;
  color: var(--ink);
}
.goal-sub {
  font-size: 13.5px;
  color: #3a8a66;
  font-weight: 600;
}
.final-btn {
  margin-top: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  padding: 11px 22px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00d68f, #00a86f);
  transition: transform 0.18s;
}
.final-btn:hover {
  transform: translateY(-2px);
}
.final-btn.locked {
  background: #b5d8c9;
  cursor: not-allowed;
}
.final-btn.locked:hover {
  transform: none;
}
.final-hint {
  font-size: 12.5px;
  color: #3a8a66;
  font-weight: 700;
}
.final-pct {
  font-weight: 700;
  opacity: 0.95;
}
@media (max-width: 900px) {
  .explain-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .two-col {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 760px) {
  .strip {
    grid-template-columns: 1fr 1fr;
  }
  .strip-main-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .title {
    font-size: 30px;
  }
}
@media (max-width: 560px) {
  .explain-grid,
  .skills-grid {
    grid-template-columns: 1fr;
  }
}
</style>
