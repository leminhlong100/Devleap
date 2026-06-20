<script setup>
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

/**
 * Bộ chọn bài học để làm lại Flashcard/Quiz. Liệt kê các ngày học ĐÃ HOÀN THÀNH
 * (từ store tiến độ); chọn một bài sẽ mở tool với ngữ cảnh bài đó (?c&w&d).
 * Chỉ hiện bài có dữ liệu phù hợp: flashcard cần từ vựng, quiz cần câu hỏi.
 */
const props = defineProps({ tool: { type: String, required: true } }) // 'flashcard' | 'quiz'

const router = useRouter()
const user = useUserStore()

const loading = ref(true)
const lessons = ref([])

const COURSES = [
  { id: 'java', name: 'Java', emoji: '☕', label: 'Ngày', loader: () => import('@/data/course'), getter: 'getJavaDay' },
  { id: 'ielts', name: 'IELTS', emoji: '🎯', label: 'Buổi', loader: () => import('@/data/courseIelts'), getter: 'getIeltsDay' },
]

// Lessons được rebuild khi tiến độ hoặc tool thay đổi.
watchEffect(async () => {
  loading.value = true
  const out = []
  for (const c of COURSES) {
    const keys = user.completed[c.id] || []
    if (!keys.length) continue
    const mod = await c.loader()
    const getDay = mod[c.getter]
    for (const key of keys) {
      const [w, d] = key.split(':')
      const day = getDay(w, d)
      if (!day) continue
      const hasData = props.tool === 'quiz' ? day.quiz?.length : day.vocab?.length
      if (!hasData) continue
      out.push({
        course: c.id,
        courseName: c.name,
        emoji: c.emoji,
        week: day.week,
        day: day.n,
        label: `Tuần ${day.week} · ${c.label} ${day.n}`,
        title: day.title,
        count: props.tool === 'quiz' ? day.quiz.length : day.vocab.length,
        unit: props.tool === 'quiz' ? 'câu' : 'từ',
      })
    }
  }
  out.sort((a, b) => (a.course < b.course ? -1 : a.course > b.course ? 1 : a.week - b.week || a.day - b.day))
  lessons.value = out
  loading.value = false
})

function pick(l) {
  router.push({ name: 'tools-tab', params: { tool: props.tool }, query: { c: l.course, w: l.week, d: l.day } })
}
</script>

<template>
  <div class="picker">
    <div class="picker-head">
      <h2 class="ptitle">{{ tool === 'quiz' ? '❓ Chọn bài để làm quiz lại' : '🃏 Chọn bài để ôn flashcard' }}</h2>
      <p class="psub">Làm lại từ các bài bạn đã hoàn thành — củng cố lại bất cứ lúc nào.</p>
    </div>

    <div v-if="loading" class="pstate">Đang tải danh sách bài học…</div>

    <div v-else-if="!lessons.length" class="pstate empty">
      <div class="pemoji">🌱</div>
      <h3>Chưa có bài hoàn thành</h3>
      <p>Hoàn thành một ngày học (đánh dấu ✓ ở cuối bài) để mở lại {{ tool === 'quiz' ? 'quiz' : 'flashcard' }} ở đây.</p>
      <button class="go-courses" @click="router.push({ name: 'courses' })">Tới khóa học →</button>
    </div>

    <div v-else class="lesson-grid">
      <button v-for="l in lessons" :key="l.course + l.week + ':' + l.day" class="lesson-card" @click="pick(l)">
        <span class="lc-emoji">{{ l.emoji }}</span>
        <div class="lc-body">
          <div class="lc-top">
            <span class="lc-course">{{ l.courseName }}</span>
            <span class="lc-meta">{{ l.label }}</span>
          </div>
          <div class="lc-title">{{ l.title }}</div>
          <div class="lc-count">{{ l.count }} {{ l.unit }}</div>
        </div>
        <span class="lc-go">→</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.picker {
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 18px 50px rgba(108, 92, 231, 0.1);
}
.picker-head {
  margin-bottom: 22px;
}
.ptitle {
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.psub {
  font-size: 14.5px;
  color: #7a7a92;
  margin-top: 6px;
}
.pstate {
  text-align: center;
  padding: 40px 10px;
  color: var(--muted);
  font-size: 15px;
}
.pstate.empty {
  padding: 36px 10px;
}
.pemoji {
  font-size: 50px;
}
.pstate.empty h3 {
  font-size: 20px;
  font-weight: 800;
  margin-top: 10px;
  color: var(--ink);
}
.pstate.empty p {
  margin-top: 8px;
  line-height: 1.6;
}
.go-courses {
  margin-top: 18px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  padding: 12px 24px;
  border-radius: 13px;
  background: var(--grad-purple);
}
.lesson-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.lesson-card {
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  cursor: pointer;
  background: var(--bg);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 16px;
  padding: 16px 18px;
  transition: all 0.15s;
}
.lesson-card:hover {
  background: var(--purple-soft);
  border-color: var(--purple);
  transform: translateY(-2px);
}
.lc-emoji {
  font-size: 26px;
  flex: none;
}
.lc-body {
  flex: 1;
  min-width: 0;
}
.lc-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lc-course {
  font-size: 11px;
  font-weight: 800;
  color: var(--purple);
}
.lc-meta {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.lc-title {
  font-size: 14.5px;
  font-weight: 800;
  color: var(--ink);
  margin-top: 3px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.lc-count {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  margin-top: 4px;
}
.lc-go {
  font-size: 20px;
  color: var(--purple);
  font-weight: 800;
  flex: none;
}
@media (max-width: 640px) {
  .lesson-grid {
    grid-template-columns: 1fr;
  }
}
</style>
