<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ieltsBookMap, computeIeltsBookProgress, isBookDayUnlocked, IELTS_BOOK_WEEK, ieltsBookDays } from '@/data/ieltsBook'
import { estimateIeltsBand } from '@/lib/ieltsBand'
import { ieltsMeta } from '@/data/courses'

const router = useRouter()
const user = useUserStore()

const completed = computed(() => user.completed.ielts || [])
const progress = computed(() => computeIeltsBookProgress(completed.value))

// Band ước lượng (thô) + kỹ năng yếu nhất — tổng hợp điểm các hoạt động đã chấm.
const availableDayNums = ieltsBookDays.map((d) => d.day)
const band = computed(() =>
  estimateIeltsBand(
    { quizOf: user.quizOf, writingOf: user.writingOf },
    availableDayNums,
    IELTS_BOOK_WEEK,
  ),
)

const days = computed(() =>
  ieltsBookMap().map((d) => {
    const isDone = user.isDone('ielts', IELTS_BOOK_WEEK, d.day)
    const unlocked = d.hasContent && isBookDayUnlocked(d.day, completed.value)
    let status = 'coming' // chưa số hóa
    if (d.hasContent) {
      if (isDone) status = 'done'
      else if (unlocked) status = 'current'
      else status = 'locked'
    }
    return { ...d, status }
  }),
)

function openDay(d) {
  if (d.status === 'done' || d.status === 'current') {
    router.push({ name: 'ielts-day', params: { week: IELTS_BOOK_WEEK, day: d.day } })
  }
}
function continueLearning() {
  router.push({ name: 'ielts-day', params: { week: IELTS_BOOK_WEEK, day: progress.value.continue.day } })
}
</script>

<template>
  <div class="container course">
    <span class="back" @click="router.push({ name: 'courses' })">← Thư viện khóa học</span>

    <!-- BANNER -->
    <header class="banner" :style="{ background: ieltsMeta.bannerGrad }">
      <div class="b-badge">{{ ieltsMeta.badge }}</div>
      <h1 class="b-title">{{ ieltsMeta.title }}</h1>
      <p class="b-desc">{{ ieltsMeta.desc }}</p>
      <div class="b-progress">
        <div class="b-bar"><div class="b-fill" :style="{ width: progress.pct + '%' }"></div></div>
        <span class="b-pct">{{ progress.doneDays }}/{{ progress.totalDays }} buổi · {{ progress.pct }}%</span>
      </div>
      <button class="b-cta" @click="continueLearning">
        {{ progress.doneDays ? '▶ Học tiếp' : ieltsMeta.continueLabel }}
      </button>
    </header>

    <!-- BAND ƯỚC LƯỢNG + KỸ NĂNG YẾU (hiện khi đã có điểm) -->
    <section v-if="band.hasData" class="band-card">
      <div class="band-head">
        <div>
          <div class="band-eyebrow">BAND ƯỚC LƯỢNG (THÔ)</div>
          <div class="band-score">~{{ band.overall.toFixed(1) }}</div>
        </div>
        <p v-if="band.weakest" class="band-weak">
          Yếu nhất: <b>{{ band.weakest.icon }} {{ band.weakest.label }}</b> (~{{ band.weakest.band.toFixed(1) }}) — nên luyện thêm.
        </p>
      </div>
      <ul class="band-skills">
        <li v-for="s in band.skills" :key="s.key" :class="{ off: !s.has }">
          <span class="bs-label">{{ s.icon }} {{ s.label }}</span>
          <span class="bs-bar"><span class="bs-fill" :style="{ width: (s.pct || 0) + '%' }"></span></span>
          <span class="bs-band">{{ s.has ? '~' + s.band.toFixed(1) : '—' }}</span>
        </li>
      </ul>
      <p class="band-note">Chỉ là ước lượng từ điểm luyện tập trên web — không phải band thi thật.</p>
    </section>

    <!-- LƯỚI 15 BUỔI -->
    <h2 class="sec-title">Lộ trình 15 buổi theo sách</h2>
    <p class="sec-sub">Mỗi buổi bám sát một Day trong sách “IELTS 4 kỹ năng cho người bắt đầu từ con số âm — Tập 1”. Hoàn thành buổi để mở buổi kế.</p>

    <div class="day-grid">
      <button
        v-for="d in days"
        :key="d.day"
        class="day-node"
        :class="d.status"
        :disabled="d.status === 'coming' || d.status === 'locked'"
        @click="openDay(d)"
      >
        <div class="dn-top">
          <span class="dn-num">DAY {{ String(d.day).padStart(2, '0') }}</span>
          <span class="dn-ico">
            {{ d.status === 'done' ? '✅' : d.status === 'current' ? '🎯' : d.status === 'locked' ? '🔒' : '🕓' }}
          </span>
        </div>
        <div class="dn-title">{{ d.hasContent ? d.title : 'Sắp có' }}</div>
        <div v-if="d.topic" class="dn-topic">🎯 {{ d.topic }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.course {
  padding: 26px var(--space-page-x) 90px;
  max-width: 960px;
  margin: 0 auto;
}
.band-card {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px 20px;
  margin-bottom: 26px;
  background: var(--surface-1, var(--surface));
}
.band-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.band-eyebrow {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--muted-2);
}
.band-score {
  font-size: 34px;
  font-weight: 900;
  color: #6c5ce7;
  line-height: 1.1;
}
.band-weak {
  font-size: 13.5px;
  color: var(--slate);
  background: rgba(255, 176, 32, 0.12);
  border: 1px solid rgba(255, 176, 32, 0.28);
  border-radius: 12px;
  padding: 8px 13px;
}
.band-weak b {
  color: #b5730b;
}
.band-skills {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.band-skills li {
  display: grid;
  grid-template-columns: 140px 1fr 44px;
  align-items: center;
  gap: 10px;
}
.band-skills li.off {
  opacity: 0.5;
}
.bs-label {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}
.bs-bar {
  height: 8px;
  border-radius: 99px;
  background: var(--track-bg, rgba(0, 0, 0, 0.08));
  overflow: hidden;
}
.bs-fill {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #6c5ce7, #00d68f);
  transition: width 0.4s;
}
.bs-band {
  font-size: 13px;
  font-weight: 800;
  color: #00966a;
  text-align: right;
}
.band-note {
  margin-top: 12px;
  font-size: 12px;
  color: var(--muted-2);
}
@media (max-width: 560px) {
  .band-skills li {
    grid-template-columns: 110px 1fr 40px;
  }
}
.back {
  display: inline-flex;
  gap: 6px;
  color: #00a86f;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.banner {
  margin: 16px 0 30px;
  border-radius: 24px;
  padding: 30px 30px 26px;
  color: #fff;
  position: relative;
  overflow: hidden;
}
.b-badge {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  opacity: 0.92;
}
.b-title {
  font-size: 27px;
  font-weight: 900;
  letter-spacing: -0.6px;
  margin: 10px 0;
  white-space: pre-line;
}
.b-desc {
  font-size: 14.5px;
  line-height: 1.55;
  opacity: 0.94;
  max-width: 560px;
}
.b-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0 16px;
  max-width: 460px;
}
.b-bar {
  flex: 1;
  height: 9px;
  background: rgba(255, 255, 255, 0.28);
  border-radius: 99px;
  overflow: hidden;
}
.b-fill {
  height: 100%;
  background: #fff;
  border-radius: 99px;
  transition: width 0.4s;
}
.b-pct {
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}
.b-cta {
  border: none;
  cursor: pointer;
  background: #fff;
  color: #00966a;
  font-weight: 800;
  font-size: 15px;
  padding: 12px 22px;
  border-radius: 14px;
}
.sec-title {
  font-size: 20px;
  font-weight: 900;
  color: var(--ink);
}
.sec-sub {
  color: var(--muted);
  font-size: 14px;
  margin: 6px 0 20px;
  max-width: 620px;
  line-height: 1.55;
}
.day-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}
.day-node {
  text-align: left;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 18px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.12s, border-color 0.15s, box-shadow 0.15s;
  min-height: 108px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.day-node:not(:disabled):hover {
  transform: translateY(-3px);
  border-color: rgba(0, 214, 143, 0.5);
  box-shadow: 0 14px 30px rgba(0, 150, 106, 0.12);
}
.day-node.done {
  border-color: rgba(0, 214, 143, 0.4);
  background: rgba(0, 214, 143, 0.06);
}
.day-node.current {
  border-color: #00d68f;
  box-shadow: 0 0 0 2px rgba(0, 214, 143, 0.25);
}
.day-node.coming,
.day-node.locked {
  opacity: 0.55;
  cursor: not-allowed;
}
.dn-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dn-num {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.5px;
  color: var(--muted);
}
.dn-ico {
  font-size: 16px;
}
.dn-title {
  font-size: 14.5px;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.35;
}
.dn-topic {
  font-size: 12px;
  color: #00966a;
  font-weight: 700;
  margin-top: auto;
}
</style>
