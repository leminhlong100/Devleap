<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AgendaRail from '@/components/day/AgendaRail.vue'
import VocabCard from '@/components/day/VocabCard.vue'
import ProgressRing from '@/components/common/ProgressRing.vue'
import CodeEditor from '@/components/tools/CodeEditor.vue'
import { getJavaDay } from '@/data/course'

const props = defineProps({ week: [String, Number], day: [String, Number] })
const router = useRouter()
const user = useUserStore()

// Chi tiết ngày được parse từ weeks/tuan-NN.md lúc chạy.
const d = computed(() => getJavaDay(props.week, props.day))

// Tiến độ thật: số ngày đã hoàn thành trong tuần & trạng thái ngày hiện tại.
const isDone = (n) => !!d.value && user.isDone('java', d.value.week, n)
const done = computed(() => !!d.value && isDone(d.value.n))
const weekDoneCount = computed(() => (d.value ? d.value.days.filter((dd) => isDone(dd.n)).length : 0))
const ringPct = computed(() => (d.value ? Math.round((weekDoneCount.value / d.value.totalDays) * 100) : 0))

function markDone() {
  if (d.value && !done.value) user.toggleDay('java', d.value.week, d.value.n, d.value.totalDays)
}
function unmark() {
  if (d.value && done.value) user.toggleDay('java', d.value.week, d.value.n, d.value.totalDays)
}

// Lộ trình hôm nay: dựng từ các khối nội dung thật sự có trong ngày.
const agenda = computed(() => {
  if (!d.value) return []
  const a = []
  if (d.value.englishHtml) a.push({ title: 'Khởi động tiếng Anh', meta: 'Vocalmax + nghe' })
  if (d.value.vocab.length) a.push({ title: 'Từ vựng IT', meta: `${d.value.vocab.length} từ` })
  if (d.value.contentHtml) a.push({ title: 'Lý thuyết cốt lõi', meta: 'Đọc & gõ tay' })
  if (d.value.code) a.push({ title: 'Code mẫu', meta: d.value.code.file })
  if (d.value.exercises.length) a.push({ title: 'Bài tập thực hành', meta: `${d.value.exercises.length} bài` })
  if (d.value.questions.length) a.push({ title: 'Câu hỏi phỏng vấn', meta: `${d.value.questions.length} câu` })
  return a
})

function goDay(n) {
  if (n) router.push({ name: 'java-day', params: { week: props.week, day: n } })
}
function goTool(tool) {
  // Mang theo ngữ cảnh ngày để tool nạp đúng từ vựng / code mẫu của ngày này.
  const query = d.value ? { c: 'java', w: d.value.week, d: d.value.n } : undefined
  router.push({ name: 'tools-tab', params: { tool }, query })
}
function goWeekTest() {
  if (d.value) router.push({ name: 'assessment', params: { course: 'java', scope: `week-${d.value.week}` } })
}
// Kết quả bài kiểm tra tuần (nếu đã làm) để hiện trên thẻ CTA.
const weekTest = computed(() => (d.value ? user.quizOf('java', `week:${d.value.week}`) : null))
</script>

<template>
  <div class="container day">
    <span class="back" @click="router.push({ name: 'java' })">← Lộ trình Java · Tuần {{ week }}</span>

    <template v-if="d">
      <!-- HEADER CARD -->
      <div class="head-card">
        <div class="head-glow"></div>
        <div class="head-text">
          <div class="head-tags">
            <span class="pill">TUẦN {{ d.week }} · NGÀY {{ d.n }} / {{ d.totalDays }}</span>
            <span v-if="d.mode" class="mode">{{ d.mode }}</span>
            <span class="date">{{ [d.weekday, d.date].filter(Boolean).join(' · ') }}</span>
          </div>
          <h1 class="head-title">{{ d.emoji }} {{ d.title }}</h1>
          <p class="head-intro">Tuần {{ d.week }} · {{ d.weekTitle }}</p>
          <div class="head-meta">
            <span v-if="d.time" class="meta-chip">⏱ {{ d.time }}</span>
            <span v-if="d.vocab.length" class="meta-chip">🗣️ {{ d.vocab.length }} từ vựng</span>
            <span v-if="d.questions.length" class="meta-chip">🎤 {{ d.questions.length }} câu phỏng vấn</span>
          </div>
        </div>
        <div class="head-ring">
          <ProgressRing :pct="ringPct">
            <div class="ring-pct">{{ weekDoneCount }}</div>
            <div class="ring-label">/ {{ d.totalDays }} ngày</div>
          </ProgressRing>
          <div class="ring-foot">Tuần {{ d.week }} đã xong {{ ringPct }}%</div>
        </div>
      </div>

      <!-- DAY NAV (danh sách ngày trong tuần) -->
      <div class="day-nav">
        <button
          v-for="dd in d.days"
          :key="dd.n"
          class="day-chip"
          :class="{ on: dd.n === d.n, done: isDone(dd.n) }"
          :title="dd.title"
          @click="goDay(dd.n)"
        >
          <span v-if="isDone(dd.n)" class="chip-tick">✓</span>Ngày {{ dd.n }}
        </button>
      </div>

      <!-- TWO COLUMN -->
      <div class="two-col">
        <AgendaRail :items="agenda" />

        <div class="main">
          <!-- ENGLISH WARM-UP -->
          <section v-if="d.englishHtml" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">KHỞI ĐỘNG TIẾNG ANH</div>
                <h2 class="step-title">🌏 Học tiếng Anh trước</h2>
              </div>
            </div>
            <div class="prose" v-html="d.englishHtml"></div>
          </section>

          <!-- VOCAB -->
          <section v-if="d.vocab.length" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">TỪ VỰNG IT</div>
                <h2 class="step-title">🗣️ {{ d.vocab.length }} từ vựng hôm nay</h2>
              </div>
            </div>
            <div class="vocab-grid">
              <VocabCard v-for="v in d.vocab" :key="v.term" :vocab="v" @play="goTool('flashcard')" />
            </div>
            <button class="ghost-btn" @click="goTool('flashcard')">🃏 Luyện lại bằng Flashcard →</button>
          </section>

          <!-- THEORY -->
          <section v-if="d.contentHtml" class="step-card current">
            <div class="step-head">
              <div>
                <div class="eyebrow purple">LÝ THUYẾT CỐT LÕI</div>
                <h2 class="step-title">📖 {{ d.title }}</h2>
              </div>
            </div>
            <div class="prose theory" v-html="d.contentHtml"></div>
          </section>

          <!-- CODE -->
          <section v-if="d.code" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">CODE MẪU · GÕ TAY KHÔNG COPY</div>
                <h2 class="step-title">💻 {{ d.code.file }}</h2>
              </div>
            </div>
            <div class="code-box">
              <div class="code-bar">
                <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
                <span class="code-file">{{ d.code.file }}</span>
              </div>
              <CodeEditor :model-value="d.code.code" readonly class="code" />
            </div>
            <button class="ghost-btn" @click="goTool('playground')">💻 Mở trong Code Playground →</button>
          </section>

          <!-- EXERCISES -->
          <section v-if="d.exercises.length" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">THỰC HÀNH</div>
                <h2 class="step-title">✍️ Bài tập ({{ d.exercises.length }})</h2>
              </div>
            </div>
            <ol class="ex-list">
              <li v-for="(ex, i) in d.exercises" :key="i">{{ ex }}</li>
            </ol>
          </section>

          <!-- INTERVIEW Q&A -->
          <section v-if="d.questions.length" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">LUYỆN PHỎNG VẤN</div>
                <h2 class="step-title">🎤 Câu hỏi phỏng vấn ({{ d.questions.length }})</h2>
              </div>
            </div>
            <div class="qa-list">
              <details v-for="(q, i) in d.questions" :key="i" class="qa" :open="i === 0">
                <summary>
                  <span class="qa-level" :class="q.level.toLowerCase().replace(/\s+/g, '-')">{{ q.level }}</span>
                  <span class="qa-q">{{ q.prompt }}</span>
                </summary>
                <div class="prose qa-a" v-html="q.answerHtml"></div>
              </details>
            </div>
          </section>

          <!-- QUIZ -->
          <section v-if="d.quiz && d.quiz.length" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">KIỂM TRA NHANH</div>
                <h2 class="step-title">❓ Quiz {{ d.quiz.length }} câu</h2>
              </div>
            </div>
            <p class="quiz-cta-text">Trả lời nhanh để tự chốt kiến thức của ngày trước khi đánh dấu hoàn thành.</p>
            <button class="ghost-btn" @click="goTool('quiz')">❓ Làm quiz bài này →</button>
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
            <p class="quiz-cta-text">Tổng hợp câu hỏi cả tuần. Đạt từ 70% để nhận <b>+100 XP</b> và huy hiệu. Điểm được lưu lại.</p>
            <button class="green-btn" @click="goWeekTest">🎯 {{ weekTest ? 'Làm lại bài kiểm tra' : 'Làm bài kiểm tra tuần' }} →</button>
          </section>

          <!-- RESOURCES STRIP -->
          <section v-if="d.leetcode || d.aiTool || d.resource" class="foot-strip">
            <div v-if="d.leetcode" class="foot-row"><span class="foot-ic">🧩</span><b>LeetCode</b> · {{ d.leetcode }}</div>
            <div v-if="d.aiTool" class="foot-row"><span class="foot-ic">🤖</span><b>AI Tool</b> · {{ d.aiTool }}</div>
            <div v-if="d.resource" class="foot-row"><span class="foot-ic">📚</span><b>Tài nguyên</b> · {{ d.resource }}</div>
          </section>

          <!-- CHECKPOINT -->
          <section class="checkpoint" :class="{ done }">
            <div class="cp-emoji">{{ done ? '✅' : '🏁' }}</div>
            <div class="cp-text">
              <h3>{{ done ? `Đã hoàn thành Ngày ${d.n}!` : `Hoàn thành Ngày ${d.n} 🎯` }}</h3>
              <p v-if="!done">Gõ tay code mẫu, làm bài tập và tự trả lời câu phỏng vấn, rồi đánh dấu hoàn thành để nhận <b>+50 XP</b>.</p>
              <p v-else>Tuần {{ d.week }}: đã xong {{ weekDoneCount }}/{{ d.totalDays }} ngày. Xong cả tuần sẽ mở khóa tuần kế tiếp 🔓</p>
            </div>
            <div class="cp-cta">
              <button v-if="d.prevDay" class="outline-btn" @click="goDay(d.prevDay)">← Ngày {{ d.prevDay }}</button>
              <button v-if="!done" class="green-btn" @click="markDone">✓ Đánh dấu hoàn thành</button>
              <template v-else>
                <button class="outline-btn" @click="unmark">↩ Bỏ đánh dấu</button>
                <button v-if="d.nextDay" class="green-btn" @click="goDay(d.nextDay)">Ngày {{ d.nextDay }} →</button>
                <button v-else class="green-btn" @click="router.push({ name: 'java' })">Về bản đồ →</button>
              </template>
            </div>
          </section>
        </div>
      </div>
    </template>

    <div v-else class="empty">
      <h2>Chưa có nội dung cho ngày này</h2>
      <p>Tuần {{ week }} · Ngày {{ day }} không tìm thấy trong dữ liệu khóa học.</p>
      <button class="green-btn" @click="router.push({ name: 'java' })">← Về bản đồ Java</button>
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
  color: var(--purple);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

/* header card */
.head-card {
  margin-top: 16px;
  background: linear-gradient(135deg, #6c5ce7, #4b3bc4);
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
  background: radial-gradient(circle, rgba(0, 214, 143, 0.3), transparent 70%);
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
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  padding: 6px 13px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 800;
}
.mode {
  background: rgba(0, 214, 143, 0.22);
  color: #d6fff0;
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.3px;
}
.date {
  color: rgba(255, 255, 255, 0.78);
  font-size: 13px;
  font-weight: 600;
}
.head-title {
  color: #fff;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.14;
  margin: 14px 0 0;
  letter-spacing: -0.6px;
}
.head-intro {
  color: #d9d4f5;
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
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
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
  color: #d9d4f5;
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
  border: 1px solid rgba(108, 92, 231, 0.18);
  background: #fff;
  color: #6a6a82;
  font-size: 13px;
  font-weight: 700;
  padding: 9px 15px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.day-chip:hover {
  background: var(--purple-soft);
}
.day-chip.on {
  background: var(--grad-purple);
  border-color: transparent;
  color: #fff;
}
.day-chip.done {
  border-color: rgba(0, 214, 143, 0.4);
  color: #00a86f;
  background: rgba(0, 214, 143, 0.08);
}
.day-chip.done.on {
  background: var(--grad-purple);
  color: #fff;
  border-color: transparent;
}
.chip-tick {
  font-weight: 900;
  margin-right: 5px;
}

/* two column */
.two-col {
  display: grid;
  grid-template-columns: 268px 1fr;
  gap: 28px;
  margin-top: 24px;
  align-items: start;
}
/* Cho phép cột co lại để code/bảng dài cuộn ngang bên trong thay vì tràn trang. */
.two-col > * {
  min-width: 0;
}
.main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/* step cards */
.step-card {
  background: #fff;
  border-radius: 22px;
  padding: 26px 28px;
  border: 1px solid rgba(108, 92, 231, 0.1);
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.06);
}
.step-card.current {
  border: 2px solid var(--purple);
  box-shadow: 0 18px 44px rgba(108, 92, 231, 0.16);
}
.step-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.eyebrow {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--muted-2);
}
.eyebrow.purple {
  color: var(--purple);
}
.step-title {
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.4px;
  margin-top: 5px;
}
.vocab-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 20px;
}
.ghost-btn {
  margin-top: 18px;
  border: 1px solid rgba(108, 92, 231, 0.2);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  color: var(--purple);
  padding: 11px 18px;
  border-radius: 12px;
  background: #fff;
  transition: background 0.15s;
}
.ghost-btn:hover {
  background: var(--purple-soft);
}

/* prose — nội dung render từ Markdown */
.prose {
  font-size: 15px;
  line-height: 1.72;
  color: #4a4a62;
  margin-top: 14px;
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
.prose :deep(h3),
.prose :deep(h4) {
  font-size: 15.5px;
  font-weight: 800;
  color: var(--ink);
  margin-top: 20px;
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
  background: var(--purple-soft);
  color: var(--purple);
  padding: 2px 7px;
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 700;
}
.prose :deep(pre) {
  background: #1e1e2e;
  color: #e6e6f0;
  padding: 16px 18px;
  border-radius: 14px;
  overflow: auto;
  margin-top: 14px;
}
.prose :deep(pre code) {
  background: none;
  color: #e6e6f0;
  padding: 0;
  font-weight: 500;
  font-size: 13px;
}
.prose :deep(table) {
  /* Bảng rộng (vd. cột chứa token dài) sẽ tự cuộn ngang thay vì tràn trang
     trên mobile — công thức max-content + max-width:100% + overflow-x. */
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
  border: 1px solid rgba(108, 92, 231, 0.14);
  padding: 8px 11px;
  text-align: left;
}
.prose :deep(th) {
  background: var(--purple-soft);
  font-weight: 800;
  color: var(--ink);
}
.prose :deep(blockquote) {
  border-left: 3px solid var(--purple);
  padding-left: 14px;
  color: var(--muted);
  margin-top: 12px;
}

/* code box */
.code-box {
  margin-top: 18px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #2a2a3e;
  background: #1e1e2e;
}
.code-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 16px;
  background: #15151f;
  border-bottom: 1px solid #2a2a3e;
}
.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.dot.r {
  background: #ff5f57;
}
.dot.y {
  background: #febc2e;
}
.dot.g {
  background: #28c840;
}
.code-file {
  margin-left: 8px;
  color: var(--muted-2);
  font-size: 12.5px;
  font-weight: 600;
}
.code {
  padding: 6px 8px;
  background: #1e1e2e;
}

.quiz-cta-text {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--muted);
  margin-top: 12px;
}
.week-test {
  border: 1.5px solid rgba(108, 92, 231, 0.22);
}
.wt-badge {
  background: rgba(108, 92, 231, 0.1);
  color: var(--purple);
  font-size: 12.5px;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 99px;
  white-space: nowrap;
}
.wt-badge.ok {
  background: rgba(0, 214, 143, 0.12);
  color: #00a86f;
}

/* exercises */
.ex-list {
  margin: 16px 0 0;
  padding-left: 22px;
}
.ex-list li {
  font-size: 14.5px;
  line-height: 1.6;
  color: #4a4a62;
  margin-top: 9px;
}
.ex-list li::marker {
  color: var(--purple);
  font-weight: 800;
}

/* interview Q&A */
.qa-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qa {
  border: 1px solid rgba(108, 92, 231, 0.14);
  border-radius: 14px;
  padding: 4px 16px;
  background: #fafafe;
}
.qa summary {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  padding: 12px 0;
  list-style: none;
  font-weight: 700;
}
.qa summary::-webkit-details-marker {
  display: none;
}
.qa-level {
  flex: none;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 99px;
  background: rgba(0, 214, 143, 0.14);
  color: #00a86f;
}
.qa-level.trung {
  background: rgba(255, 176, 32, 0.16);
  color: #b8770a;
}
.qa-level.khó,
.qa-level.cực-khó {
  background: rgba(255, 122, 89, 0.16);
  color: #d6512b;
}
.qa-level.mock-en {
  background: rgba(108, 92, 231, 0.14);
  color: var(--purple);
}
.qa-q {
  font-size: 14.5px;
  color: var(--ink);
  line-height: 1.45;
}
.qa-a {
  margin-top: 0;
  padding-bottom: 14px;
  font-size: 14px;
}

/* resources strip */
.foot-strip {
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 18px;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.foot-row {
  font-size: 13.5px;
  color: #4a4a62;
  line-height: 1.5;
}
.foot-row b {
  color: var(--ink);
}
.foot-ic {
  margin-right: 7px;
}

/* checkpoint */
.checkpoint {
  background: linear-gradient(135deg, #1e1e2e, #2c2545);
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
  border-radius: 13px;
  background: var(--grad-green);
  box-shadow: 0 12px 28px rgba(0, 214, 143, 0.3);
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
