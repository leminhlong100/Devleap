<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import ConquestMap from '@/components/course/ConquestMap.vue'
import { javaStages, javaMeta } from '@/data/courses'
import { computeJavaWeeks, computeJavaProgress } from '@/data/course'

const router = useRouter()
const user = useUserStore()
const { xp, streak, badges } = storeToRefs(user)

// Tiến độ thật suy từ danh sách ngày đã hoàn thành (store).
const weeks = computed(() => computeJavaWeeks(user.completed.java))
const prog = computed(() => computeJavaProgress(user.completed.java))
const continueLabel = computed(() =>
  prog.value.allDone
    ? '🎉 Đã hoàn thành lộ trình'
    : prog.value.doneDays === 0
      ? '▶ Bắt đầu Tuần 1'
      : `▶ Tiếp tục Tuần ${prog.value.currentWeek}`,
)

function openDay(w) {
  // Tuần đang học -> mở đúng ngày học tiếp theo; tuần đã xong -> mở ngày 1.
  const day = w.num === prog.value.currentWeek ? prog.value.continue.day : 1
  router.push({ name: 'java-day', params: { week: w.num, day } })
}
function startContinue() {
  router.push({ name: 'java-day', params: prog.value.continue })
}
function goFinal() {
  if (!prog.value.allDone) return // chưa học xong thì chưa cho thi cuối khóa
  router.push({ name: 'assessment', params: { course: 'java', scope: 'final' } })
}
const finalResult = computed(() => user.quizOf('java', 'final'))
const finalLocked = computed(() => !prog.value.allDone)
</script>

<template>
  <div>
    <!-- BANNER -->
    <section class="banner" :style="{ background: javaMeta.bannerGrad }">
      <div class="banner-emoji">☕</div>
      <div class="banner-inner">
        <span class="back" @click="router.push({ name: 'courses' })">← Tất cả khóa học</span>
        <div class="banner-head">
          <div class="banner-text">
            <span class="badge">{{ javaMeta.badge }}</span>
            <h1 class="title">
              <template v-for="(line, i) in javaMeta.title.split('\n')" :key="i">{{ line }}<br /></template>
            </h1>
            <p class="desc">{{ javaMeta.desc }}</p>
          </div>
          <button class="continue-btn" @click="startContinue">{{ continueLabel }}</button>
        </div>

        <div class="strip">
          <div class="strip-main">
            <div class="strip-main-top">
              <span>Tổng tiến độ lộ trình</span>
              <span>{{ prog.doneWeeks }} / {{ prog.totalWeeks }} tuần · {{ prog.pct }}%</span>
            </div>
            <div class="strip-track"><div class="strip-fill" :style="{ width: prog.pct + '%' }"></div></div>
          </div>
          <div class="strip-stat"><div class="sv">🔥 {{ streak }}</div><div class="sl">ngày streak</div></div>
          <div class="strip-stat"><div class="sv">{{ xp }}</div><div class="sl">XP kiếm được</div></div>
          <div class="strip-stat"><div class="sv">🏅 {{ badges }}</div><div class="sl">huy hiệu</div></div>
        </div>
      </div>
    </section>

    <!-- MAP -->
    <ConquestMap :weeks="weeks" :stages="javaStages" theme="purple" @select="openDay">
      <template #footer>
        <div class="goal-wrap">
          <div class="goal">
            <div class="goal-icon">🎓</div>
            <div class="goal-title">{{ javaMeta.goalTitle }}</div>
            <div class="goal-sub">{{ javaMeta.goalSub }}</div>
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
  opacity: 0.12;
}
.banner-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 30px 28px 44px;
  position: relative;
}
.back {
  color: rgba(255, 255, 255, 0.8);
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
  max-width: 560px;
}
.badge {
  background: rgba(255, 255, 255, 0.18);
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
  color: #d9d4f5;
  font-size: 16px;
  line-height: 1.6;
  margin-top: 14px;
}
.continue-btn {
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  color: var(--purple);
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
.strip {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 16px;
  margin-top: 30px;
}
.strip-main,
.strip-stat {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
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
  background: rgba(255, 255, 255, 0.2);
}
.strip-fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #00d68f, #7ef0c4);
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
  color: #d9d4f5;
  font-weight: 600;
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
  background: linear-gradient(135deg, #fff3dd, #ffe8c2);
  border: 1px solid rgba(255, 176, 32, 0.3);
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
}
.goal-sub {
  font-size: 13.5px;
  color: var(--amber-ink);
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
  background: var(--grad-purple, linear-gradient(135deg, #6c5ce7, #4b3bc4));
  transition: transform 0.18s;
}
.final-btn:hover {
  transform: translateY(-2px);
}
.final-btn.locked {
  background: var(--disabled-bg);
  cursor: not-allowed;
}
.final-btn.locked:hover {
  transform: none;
}
.final-hint {
  font-size: 12.5px;
  color: var(--amber-ink);
  font-weight: 700;
}
.final-pct {
  font-weight: 700;
  opacity: 0.9;
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
</style>
