<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toolDefs, cardsFromTerms } from '@/data/tools'
import FlashcardTool from '@/components/tools/FlashcardTool.vue'
import CodePlayground from '@/components/tools/CodePlayground.vue'
import QuizTool from '@/components/tools/QuizTool.vue'
import DictionaryTool from '@/components/tools/DictionaryTool.vue'
import LessonPicker from '@/components/tools/LessonPicker.vue'
import { useUserStore } from '@/stores/user'

const props = defineProps({ tool: { type: String, default: '' } })
const route = useRoute()
const router = useRouter()
const user = useUserStore()

const componentMap = {
  flashcard: FlashcardTool,
  playground: CodePlayground,
  quiz: QuizTool,
  dictionary: DictionaryTool,
}

const active = computed(() => {
  const t = props.tool || route.params.tool
  return componentMap[t] ? t : 'flashcard'
})

// Flashcard & Quiz chỉ chạy theo bài học — khi chưa có ngữ cảnh thì hiện bộ chọn
// bài đã hoàn thành để làm lại.
const lessonOnly = (id) => id === 'flashcard' || id === 'quiz'

// -------- Ngữ cảnh bài học (mở tool từ một ngày học qua query ?c&w&d) --------
// Dữ liệu khóa học là chunk nặng nên chỉ nạp động khi thực sự có ngữ cảnh,
// giữ trang /tools nhẹ khi dùng độc lập.
const ctx = ref(null)

// Cấu hình theo khóa, dùng chung cho cả chế độ ngày & cả tuần.
const COURSE_CFG = {
  java: { name: 'Java', route: 'java-day', label: 'Ngày', loader: () => import('@/data/course'), dayGetter: 'getJavaDay', weekGetter: 'getJavaWeek' },
  ielts: { name: 'IELTS', route: 'ielts-day', label: 'Buổi', loader: () => import('@/data/courseIelts'), dayGetter: 'getIeltsDay', weekGetter: 'getIeltsWeek' },
}

// Gom cả tuần: nối từ vựng (cardsFromTerms tự khử trùng) & câu quiz — CHỈ các ngày
// đã hoàn thành (đồng bộ với bộ chọn bài; không lôi nội dung ngày chưa học vào ôn).
function buildWeekCtx(c, cfg, week) {
  const completed = user.completed[c] || []
  const days = (week.days || []).filter((d) => completed.includes(`${week.num}:${d.n}`))
  const terms = []
  const quiz = []
  for (const day of days) {
    // Raw vocab của tuần là mảng chuỗi; bản theo ngày (decorate) là object {term}.
    for (const v of day.vocab || []) terms.push(typeof v === 'string' ? v : v.term)
    if (day.quiz) quiz.push(...day.quiz)
  }
  return {
    course: c,
    courseName: cfg.name,
    scope: 'week',
    route: c === 'ielts' ? 'ielts' : 'java',
    label: cfg.label,
    week: week.num,
    day: null,
    title: week.title,
    dayCount: days.length,
    terms,
    code: null,
    quiz,
  }
}

watchEffect(async () => {
  const { c, w, d } = route.query
  if (!c || !w || !d) {
    ctx.value = null
    return
  }
  const cfg = COURSE_CFG[c]
  if (!cfg) {
    ctx.value = null
    return
  }
  try {
    const mod = await cfg.loader()
    if (d === 'all') {
      const week = mod[cfg.weekGetter](w)
      ctx.value = week ? buildWeekCtx(c, cfg, week) : null
    } else {
      const day = mod[cfg.dayGetter](w, d)
      ctx.value = day
        ? { course: c, courseName: cfg.name, scope: 'day', route: cfg.route, label: cfg.label, week: day.week, day: day.n, title: day.title, terms: day.vocab.map((v) => v.term), code: c === 'java' ? day.code : null, quiz: day.quiz }
        : null
    }
  } catch {
    ctx.value = null
  }
})

// Props truyền vào tool theo ngữ cảnh (null -> tool dùng dữ liệu mẫu chung).
const flashCards = computed(() =>
  ctx.value?.terms?.length ? cardsFromTerms(ctx.value.terms, ctx.value.course) : null,
)
const codeInit = computed(() => ctx.value?.code || null)
const quizQs = computed(() => ctx.value?.quiz || null)

// Props của tool đang mở — computed để cập nhật ngay khi ngữ cảnh nạp xong.
// Mỗi tool tự watch prop của mình để reset, nên KHÔNG remount theo ngữ cảnh
// (tránh kẹt instance cũ khi ctx nạp bất đồng bộ).
const activeProps = computed(() => {
  if (active.value === 'flashcard') return { cards: flashCards.value }
  if (active.value === 'playground') return { initial: codeInit.value }
  if (active.value === 'quiz') return { questions: quizQs.value }
  return {}
})

function select(id) {
  router.push({ name: 'tools-tab', params: { tool: id }, query: route.query })
}
function exitContext() {
  router.push({ name: 'tools-tab', params: { tool: active.value } })
}
function backToDay() {
  if (!ctx.value) return
  if (ctx.value.scope === 'week') router.push({ name: ctx.value.route })
  else router.push({ name: ctx.value.route, params: { week: ctx.value.week, day: ctx.value.day } })
}
</script>

<template>
  <div class="container page">
    <div class="page-head">
      <h1 class="title">Khu công cụ học</h1>
      <p class="sub">Dùng chung cho mọi khóa. Luyện tập là cách nhanh nhất để lên level.</p>
    </div>

    <!-- Banner ngữ cảnh: khi mở tool từ một ngày học cụ thể -->
    <div v-if="ctx" class="ctx-banner">
      <div class="ctx-info">
        <span class="ctx-emoji">{{ ctx.course === 'java' ? '☕' : '🎯' }}</span>
        <div>
          <div class="ctx-eyebrow">{{ ctx.scope === 'week' ? 'ĐANG ÔN CẢ TUẦN' : 'ĐANG LUYỆN THEO BÀI HỌC' }}</div>
          <div v-if="ctx.scope === 'week'" class="ctx-title">{{ ctx.courseName }} · Cả Tuần {{ ctx.week }} ({{ ctx.dayCount }} {{ ctx.label.toLowerCase() }}) — {{ ctx.title }}</div>
          <div v-else class="ctx-title">{{ ctx.courseName }} · Tuần {{ ctx.week }} · {{ ctx.label }} {{ ctx.day }} — {{ ctx.title }}</div>
        </div>
      </div>
      <div class="ctx-cta">
        <button class="ctx-back" @click="backToDay">{{ ctx.scope === 'week' ? '← Về khóa học' : '← Về bài học' }}</button>
        <button v-if="lessonOnly(active)" class="ctx-exit" @click="exitContext">↺ Chọn bài khác</button>
        <button v-else class="ctx-exit" @click="exitContext">Dùng bộ chung ✕</button>
      </div>
    </div>

    <div class="tool-grid">
      <div
        v-for="t in toolDefs"
        :key="t.id"
        class="tool-card"
        :class="{ on: active === t.id }"
        @click="select(t.id)"
      >
        <span v-if="active === t.id" class="open-tag">ĐANG MỞ</span>
        <div class="tool-icon" :style="{ background: t.iconBg }">{{ t.icon }}</div>
        <h3>{{ t.title }}</h3>
        <p>{{ t.desc }}</p>
      </div>
    </div>

    <!-- Từ điển dùng chung -->
    <p v-if="ctx && active === 'dictionary'" class="ctx-note">
      Từ điển tra cứu chung cho cả khóa — không gắn riêng theo ngày học.
    </p>

    <!-- Flashcard/Quiz chưa có ngữ cảnh -> bộ chọn bài đã hoàn thành -->
    <LessonPicker v-if="lessonOnly(active) && !ctx" :key="'picker-' + active" :tool="active" />
    <Transition v-else name="fade" mode="out-in">
      <component :is="componentMap[active]" :key="active" v-bind="activeProps" />
    </Transition>
  </div>
</template>

<style scoped>
.page {
  padding: 48px 28px 70px;
  max-width: 1080px;
}
.page-head {
  text-align: center;
  max-width: 620px;
  margin: 0 auto 32px;
}
.title {
  font-size: 40px;
  font-weight: 800;
  letter-spacing: -1px;
}
.sub {
  font-size: 17px;
  color: #7a7a92;
  margin-top: 12px;
}
.ctx-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: linear-gradient(135deg, #f5f3ff, #eef6ff);
  border: 1px solid rgba(108, 92, 231, 0.18);
  border-radius: 18px;
  padding: 16px 20px;
  margin-bottom: 24px;
}
.ctx-info {
  display: flex;
  align-items: center;
  gap: 14px;
}
.ctx-emoji {
  font-size: 30px;
}
.ctx-eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--purple);
}
.ctx-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
  margin-top: 3px;
}
.ctx-cta {
  display: flex;
  gap: 10px;
  flex: none;
}
.ctx-back,
.ctx-exit {
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 700;
  padding: 9px 15px;
  border-radius: 11px;
}
.ctx-back {
  border: none;
  color: #fff;
  background: var(--grad-purple);
}
.ctx-exit {
  border: 1px solid rgba(108, 92, 231, 0.2);
  color: #6a6a82;
  background: #fff;
}
.ctx-note {
  text-align: center;
  font-size: 13.5px;
  color: var(--muted);
  margin-bottom: 18px;
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}
.tool-card {
  background: #fff;
  border: 1.5px solid rgba(108, 92, 231, 0.1);
  border-radius: 20px;
  padding: 22px 20px;
  cursor: pointer;
  position: relative;
  transition: all 0.15s;
}
.tool-card:hover {
  transform: translateY(-4px);
}
.tool-card.on {
  background: linear-gradient(135deg, #f5f3ff, #ffffff);
  border-color: var(--purple);
}
.tool-card.on h3 {
  color: var(--purple);
}
.open-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--green);
  color: #fff;
  font-size: 10.5px;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 99px;
  white-space: nowrap;
}
.tool-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.tool-card h3 {
  font-size: 16px;
  font-weight: 800;
  margin: 14px 0 5px;
  color: var(--ink);
}
.tool-card p {
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);
}
@media (max-width: 760px) {
  .tool-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .title {
    font-size: 32px;
  }
}
@media (max-width: 460px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>
