<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AgendaRail from '@/components/day/AgendaRail.vue'
import VocabCard from '@/components/day/VocabCard.vue'
import ProgressRing from '@/components/common/ProgressRing.vue'
import { getIeltsDay } from '@/data/courseIelts'

const props = defineProps({ week: [String, Number], day: [String, Number] })
const router = useRouter()
const user = useUserStore()

const d = computed(() => getIeltsDay(props.week, props.day))

// Tiến độ thật: số buổi đã hoàn thành trong tuần & trạng thái buổi hiện tại.
const isDone = (n) => !!d.value && user.isDone('ielts', d.value.week, n)
const done = computed(() => !!d.value && isDone(d.value.n))
const weekDoneCount = computed(() => (d.value ? d.value.days.filter((dd) => isDone(dd.n)).length : 0))
const ringPct = computed(() => (d.value ? Math.round((weekDoneCount.value / d.value.totalDays) * 100) : 0))

function markDone() {
  if (d.value && !done.value) user.toggleDay('ielts', d.value.week, d.value.n, d.value.totalDays)
}
function unmark() {
  if (d.value && done.value) user.toggleDay('ielts', d.value.week, d.value.n, d.value.totalDays)
}

const agenda = computed(() => {
  if (!d.value) return []
  const a = []
  if (d.value.checklist.length) a.push({ title: 'Việc cần làm hôm nay', meta: `${d.value.checklist.length} mục` })
  if (d.value.grammar.length) a.push({ title: 'Ngữ pháp tuần này', meta: `${d.value.grammar.length} điểm` })
  if (d.value.vocab.length) a.push({ title: 'Phòng từ vựng', meta: `${d.value.vocab.length} từ` })
  if (d.value.lessonScript) a.push({ title: 'Kịch bản bài học', meta: d.value.lessonScript.title })
  if (d.value.quizHtml) a.push({ title: 'Quiz tuần', meta: 'checkpoint' })
  return a
})

function goDay(n) {
  if (n) router.push({ name: 'ielts-day', params: { week: props.week, day: n } })
}
function goTool(tool) {
  // Mang theo ngữ cảnh buổi học để Flashcard nạp đúng từ vựng của tuần này.
  const query = d.value ? { c: 'ielts', w: d.value.week, d: d.value.n } : undefined
  router.push({ name: 'tools-tab', params: { tool }, query })
}
function goWeekTest() {
  if (d.value) router.push({ name: 'assessment', params: { course: 'ielts', scope: `week-${d.value.week}` } })
}
// Kết quả bài kiểm tra tuần (nếu đã làm) để hiện trên thẻ CTA.
const weekTest = computed(() => (d.value ? user.quizOf('ielts', `week:${d.value.week}`) : null))
</script>

<template>
  <div class="container day">
    <span class="back" @click="router.push({ name: 'ielts' })">← Lộ trình IELTS · Tuần {{ week }}</span>

    <template v-if="d">
      <!-- HEADER CARD -->
      <div class="head-card">
        <div class="head-glow"></div>
        <div class="head-text">
          <div class="head-tags">
            <span class="pill">TUẦN {{ d.week }} · BUỔI {{ d.n }} / {{ d.totalDays }}</span>
            <span class="date">{{ d.subtitle }}</span>
          </div>
          <h1 class="head-title">{{ d.title }}</h1>
          <p class="head-intro">Tuần {{ d.week }} · {{ d.weekTitle }}</p>
          <div class="head-meta">
            <span v-if="d.checklist.length" class="meta-chip">✅ {{ d.checklist.length }} việc</span>
            <span v-if="d.vocab.length" class="meta-chip">🗣️ {{ d.vocab.length }} từ</span>
            <span class="meta-chip">🎯 Mục tiêu Band 6.5</span>
          </div>
        </div>
        <div class="head-ring">
          <ProgressRing :pct="ringPct" track-color="rgba(255,255,255,.25)">
            <div class="ring-pct">{{ weekDoneCount }}</div>
            <div class="ring-label">/ {{ d.totalDays }} buổi</div>
          </ProgressRing>
          <div class="ring-foot">Tuần {{ d.week }} đã xong {{ ringPct }}%</div>
        </div>
      </div>

      <!-- DAY NAV -->
      <div class="day-nav">
        <button
          v-for="dd in d.days"
          :key="dd.n"
          class="day-chip"
          :class="{ on: dd.n === d.n, done: isDone(dd.n) }"
          @click="goDay(dd.n)"
        >
          <span v-if="isDone(dd.n)" class="chip-tick">✓</span>Buổi {{ dd.n }}
        </button>
      </div>

      <!-- TWO COLUMN -->
      <div class="two-col">
        <AgendaRail title="Buổi học hôm nay" subtitle="Nhẹ nhàng, làm lần lượt nhé" :items="agenda" />

        <div class="main">
          <!-- CHECKLIST -->
          <section v-if="d.checklist.length" class="step-card current">
            <div class="step-head">
              <div>
                <div class="eyebrow green">VIỆC CẦN LÀM HÔM NAY</div>
                <h2 class="step-title">✅ Checklist buổi {{ d.n }}</h2>
              </div>
            </div>
            <ul class="check-list">
              <li v-for="(c, i) in d.checklist" :key="i"><span class="tick">○</span>{{ c }}</li>
            </ul>
            <div v-if="d.rhythm" class="rhythm">
              <div v-if="d.rhythm.product"><b>Sản phẩm nhỏ:</b> {{ d.rhythm.product }}</div>
              <div v-if="d.rhythm.review"><b>Ôn tập:</b> {{ d.rhythm.review }}</div>
            </div>
          </section>

          <!-- GRAMMAR (week) -->
          <section v-if="d.grammar.length" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">NGỮ PHÁP TUẦN NÀY</div>
                <h2 class="step-title">📖 Điểm ngữ pháp trọng tâm</h2>
              </div>
            </div>
            <div v-for="(g, i) in d.grammar" :key="i" class="grammar-block">
              <h3 class="grammar-title">{{ g.title }}</h3>
              <div class="prose" v-html="g.html"></div>
            </div>
          </section>

          <!-- VOCAB (week) -->
          <section v-if="d.vocab.length" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">PHÒNG TỪ VỰNG</div>
                <h2 class="step-title">🗣️ {{ d.vocab.length }} từ thông dụng</h2>
              </div>
            </div>
            <div class="vocab-grid">
              <VocabCard v-for="v in d.vocab" :key="v.term" :vocab="v" />
            </div>
            <button class="ghost-btn" @click="goTool('flashcard')">🃏 Luyện lại bằng Flashcard →</button>
          </section>

          <!-- LESSON SCRIPT -->
          <section v-if="d.lessonScript" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">KỊCH BẢN BÀI HỌC</div>
                <h2 class="step-title">📝 {{ d.lessonScript.title }}</h2>
              </div>
            </div>
            <div class="prose" v-html="d.lessonScript.html"></div>
          </section>

          <!-- QUIZ -->
          <section v-if="d.quizHtml" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">CHECKPOINT</div>
                <h2 class="step-title">✅ Quiz tuần {{ d.week }}</h2>
              </div>
            </div>
            <p class="quiz-intro">Làm quiz cuối tuần để tự soi lại phần đã học.</p>
            <button class="ghost-btn" @click="goTool('quiz')">❓ Mở quiz →</button>
          </section>

          <!-- BÀI KIỂM TRA TUẦN (lưu điểm) -->
          <section class="step-card week-test">
            <div class="step-head">
              <div>
                <div class="eyebrow">KIỂM TRA CUỐI TUẦN</div>
                <h2 class="step-title">🎯 Bài kiểm tra Tuần {{ d.week }}</h2>
              </div>
              <span v-if="weekTest" class="wt-badge" :class="{ ok: weekTest.passed }">
                {{ weekTest.passed ? '✅ Đã đạt' : 'Cao nhất' }} {{ weekTest.pct }}%
              </span>
            </div>
            <p class="quiz-intro">Đạt từ 70% để nhận <b>+100 XP</b> và huy hiệu. Điểm được lưu lại.</p>
            <button class="green-btn" @click="goWeekTest">🎯 {{ weekTest ? 'Làm lại bài kiểm tra' : 'Làm bài kiểm tra tuần' }} →</button>
          </section>

          <!-- CHECKPOINT NAV -->
          <section class="checkpoint" :class="{ done }">
            <div class="cp-emoji">{{ done ? '✅' : '🎯' }}</div>
            <div class="cp-text">
              <h3>{{ done ? `Đã hoàn thành buổi ${d.n}!` : `Hoàn thành buổi ${d.n} 🎉` }}</h3>
              <p v-if="!done">Làm hết checklist, học từ vựng và ôn ngữ pháp, rồi đánh dấu hoàn thành để nhận <b>+50 XP</b> và giữ streak.</p>
              <p v-else>Tuần {{ d.week }}: đã xong {{ weekDoneCount }}/{{ d.totalDays }} buổi. Xong cả tuần sẽ mở khóa tuần kế tiếp 🔓</p>
            </div>
            <div class="cp-cta">
              <button v-if="d.prevDay" class="outline-btn" @click="goDay(d.prevDay)">← Buổi {{ d.prevDay }}</button>
              <button v-if="!done" class="green-btn" @click="markDone">✓ Đánh dấu hoàn thành</button>
              <template v-else>
                <button class="outline-btn" @click="unmark">↩ Bỏ đánh dấu</button>
                <button v-if="d.nextDay" class="green-btn" @click="goDay(d.nextDay)">Buổi {{ d.nextDay }} →</button>
                <button v-else class="green-btn" @click="router.push({ name: 'ielts' })">Về bản đồ →</button>
              </template>
            </div>
          </section>
        </div>
      </div>
    </template>

    <div v-else class="empty">
      <h2>Chưa có nội dung cho buổi này</h2>
      <p>Tuần {{ week }} · Buổi {{ day }} không tìm thấy trong dữ liệu khóa học.</p>
      <button class="green-btn" @click="router.push({ name: 'ielts' })">← Về bản đồ IELTS</button>
    </div>
  </div>
</template>

<style scoped>
.day {
  padding: 26px 28px 70px;
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #00a86f;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
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
  background: #fff;
  color: #3a8a66;
  font-size: 13px;
  font-weight: 700;
  padding: 9px 15px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.day-chip:hover {
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
.chip-tick {
  font-weight: 900;
  margin-right: 5px;
}

/* two col */
.two-col {
  display: grid;
  grid-template-columns: 268px 1fr;
  gap: 28px;
  margin-top: 24px;
  align-items: start;
}
/* Cho phép cột co lại để nội dung dài (bảng/script) cuộn bên trong thay vì tràn. */
.two-col > * {
  min-width: 0;
}
.main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}
.step-card {
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 22px;
  padding: 26px 28px;
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.06);
}
.step-card.current {
  border: 2px solid var(--green);
  box-shadow: 0 18px 44px rgba(0, 214, 143, 0.16);
}
.step-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.eyebrow {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--muted-2);
}
.eyebrow.green {
  color: #00a86f;
}
.step-title {
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.4px;
  margin-top: 5px;
}

/* checklist */
.check-list {
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.check-list li {
  display: flex;
  gap: 11px;
  align-items: flex-start;
  font-size: 15px;
  line-height: 1.55;
  color: #4a4a62;
}
.tick {
  color: #00a86f;
  font-weight: 800;
  font-size: 17px;
  line-height: 1.4;
  flex: none;
}
.rhythm {
  margin-top: 18px;
  background: #e6fbf2;
  border: 1px solid rgba(0, 214, 143, 0.2);
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 14px;
  line-height: 1.6;
  color: #3a6a56;
}
.rhythm b {
  color: #00966a;
}

/* grammar */
.grammar-block + .grammar-block {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(108, 92, 231, 0.08);
}
.grammar-title {
  font-size: 16.5px;
  font-weight: 800;
  color: var(--ink);
  margin-top: 14px;
}

/* prose */
.prose {
  font-size: 15px;
  line-height: 1.72;
  color: #4a4a62;
  margin-top: 12px;
}
.prose :deep(p) {
  margin-top: 12px;
}
.prose :deep(p:first-child) {
  margin-top: 0;
}
.prose :deep(b),
.prose :deep(strong) {
  color: var(--ink);
}
.prose :deep(ul),
.prose :deep(ol) {
  margin-top: 12px;
  padding-left: 22px;
}
.prose :deep(li) {
  margin-top: 6px;
}
.prose :deep(code) {
  background: rgba(0, 214, 143, 0.1);
  color: #00966a;
  padding: 2px 7px;
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 700;
}
.prose :deep(table) {
  /* Bảng rộng tự cuộn ngang thay vì tràn trang trên mobile. */
  display: block;
  width: max-content;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
  margin-top: 14px;
  font-size: 13.5px;
}
.prose :deep(th),
.prose :deep(td) {
  border: 1px solid rgba(0, 214, 143, 0.18);
  padding: 8px 11px;
  text-align: left;
}
.prose :deep(th) {
  background: #e6fbf2;
  font-weight: 800;
  color: var(--ink);
}
.prose :deep(blockquote) {
  border-left: 3px solid var(--green);
  padding-left: 14px;
  color: var(--muted);
  margin-top: 12px;
}

.vocab-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 20px;
}
.ghost-btn {
  margin-top: 18px;
  border: 1px solid rgba(0, 214, 143, 0.3);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  color: #00966a;
  padding: 11px 18px;
  border-radius: 12px;
  background: #fff;
  transition: background 0.15s;
}
.ghost-btn:hover {
  background: #e6fbf2;
}
.quiz-intro {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--muted);
  margin-top: 12px;
}
.week-test {
  border: 1.5px solid rgba(0, 214, 143, 0.25);
}
.wt-badge {
  background: rgba(0, 150, 106, 0.1);
  color: #00966a;
  font-size: 12.5px;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 99px;
  white-space: nowrap;
}
.wt-badge.ok {
  background: rgba(0, 214, 143, 0.16);
  color: #00a86f;
}

/* checkpoint */
.checkpoint {
  background: linear-gradient(135deg, #1e1e2e, #23203a);
  border-radius: 24px;
  padding: 28px 30px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}
.checkpoint.done {
  background: linear-gradient(135deg, #00966a, #007a55);
}
.cp-emoji {
  position: absolute;
  bottom: -40px;
  right: -10px;
  font-size: 130px;
  opacity: 0.12;
}
.cp-text {
  position: relative;
}
.cp-text h3 {
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.4px;
}
.cp-text p {
  color: #b3b0c9;
  font-size: 14px;
  line-height: 1.55;
  margin-top: 6px;
  max-width: 440px;
}
.cp-cta {
  position: relative;
  display: flex;
  gap: 10px;
  flex: none;
}
.outline-btn {
  border: 1px solid rgba(255, 255, 255, 0.25);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  padding: 13px 18px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.08);
}
.green-btn {
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  padding: 13px 24px;
  border-radius: 14px;
  background: linear-gradient(135deg, #00d68f, #00a86f);
  box-shadow: 0 12px 26px rgba(0, 214, 143, 0.3);
  white-space: nowrap;
  transition: transform 0.18s;
}
.green-btn:hover {
  transform: translateY(-2px);
}

.empty {
  text-align: center;
  padding: 80px 20px;
}
.empty h2 {
  font-size: 24px;
  font-weight: 800;
}
.empty p {
  color: var(--muted);
  margin: 10px 0 22px;
}

@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
  .vocab-grid {
    grid-template-columns: 1fr;
  }
}
</style>
