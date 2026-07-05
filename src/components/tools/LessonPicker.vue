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
const groups = ref([]) // [{ course, courseName, emoji, week, label, days:[...], weekCount, unit }]

const COURSES = [
  { id: 'java', name: 'Java', emoji: '☕', label: 'Ngày', loader: () => import('@/data/course'), getter: 'getJavaDay' },
  { id: 'ielts', name: 'IELTS', emoji: '🎯', label: 'Buổi', loader: () => import('@/data/courseIelts'), getter: 'getIeltsDay' },
]

const unit = () => (props.tool === 'quiz' ? 'câu' : 'từ')

// Gom theo tuần khi rebuild (tiến độ / tool thay đổi). Mỗi tuần có tổng số liệu
// (flashcard khử trùng từ giống lúc ôn thật; quiz cộng dồn số câu).
watchEffect(async () => {
  loading.value = true
  const byWeek = new Map() // key: course+':'+week
  for (const c of COURSES) {
    const keys = user.completed[c.id] || []
    if (!keys.length) continue
    const mod = await c.loader()
    const getDay = mod[c.getter]
    for (const key of keys) {
      const [w, d] = key.split(':')
      const day = getDay(w, d)
      if (!day) continue
      // getDay fallback về ngày đầu khi không tìm thấy -> bỏ key cũ/không hợp lệ.
      if (String(day.n) !== String(d)) continue
      const hasData = props.tool === 'quiz' ? day.quiz?.length : day.vocab?.length
      if (!hasData) continue
      const gKey = `${c.id}:${day.week}`
      if (!byWeek.has(gKey)) {
        byWeek.set(gKey, {
          course: c.id, courseName: c.name, emoji: c.emoji, week: day.week,
          weekLabel: `Tuần ${day.week}`, days: [], terms: new Set(), quizCount: 0,
        })
      }
      const g = byWeek.get(gKey)
      g.days.push({
        day: day.n,
        label: `${c.label} ${day.n}`,
        title: day.title,
        count: props.tool === 'quiz' ? day.quiz.length : day.vocab.length + (day.reviewVocab?.length || 0),
      })
      if (props.tool === 'quiz') g.quizCount += day.quiz.length
      else for (const v of [...day.vocab, ...(day.reviewVocab || [])]) g.terms.add(String(v.term).trim().toLowerCase())
    }
  }
  const out = [...byWeek.values()]
  for (const g of out) {
    g.days.sort((a, b) => a.day - b.day)
    g.weekCount = props.tool === 'quiz' ? g.quizCount : g.terms.size
  }
  out.sort((a, b) => (a.course < b.course ? -1 : a.course > b.course ? 1 : a.week - b.week))
  groups.value = out
  loading.value = false
})

const hasAny = () => groups.value.some((g) => g.days.length)

// Mỗi tuần thu gọn mặc định; nhấn vào tiêu đề tuần mới xổ danh sách bài.
const openWeeks = ref(new Set())
const gkey = (g) => `${g.course}:${g.week}`
const isOpen = (g) => openWeeks.value.has(gkey(g))
function toggleWeek(g) {
  const s = new Set(openWeeks.value)
  s.has(gkey(g)) ? s.delete(gkey(g)) : s.add(gkey(g))
  openWeeks.value = s
}

function pickDay(g, d) {
  router.push({ name: 'tools-tab', params: { tool: props.tool }, query: { c: g.course, w: g.week, d: d.day } })
}
function pickWeek(g) {
  router.push({ name: 'tools-tab', params: { tool: props.tool }, query: { c: g.course, w: g.week, d: 'all' } })
}
function pickSaved() {
  router.push({ name: 'tools-tab', params: { tool: 'flashcard' }, query: { deck: 'saved' } })
}
</script>

<template>
  <div class="picker">
    <div class="picker-head">
      <h2 class="ptitle">{{ tool === 'quiz' ? '❓ Chọn bài để làm quiz lại' : '🃏 Chọn bài để ôn flashcard' }}</h2>
      <p class="psub">Làm lại từ các bài bạn đã hoàn thành — củng cố lại bất cứ lúc nào.</p>
    </div>

    <!-- Bộ từ cá nhân: lưu khi trò chuyện với AI (chỉ cho flashcard) -->
    <button v-if="tool === 'flashcard' && user.savedCount" class="saved-entry" @click="pickSaved">
      <span class="se-emoji">📚</span>
      <span class="se-body">
        <span class="se-title">Từ vựng đã lưu</span>
        <span class="se-sub">{{ user.savedCount }} từ bạn lưu khi chat với AI</span>
      </span>
      <span class="se-go">→</span>
    </button>

    <div v-if="loading" class="pstate">Đang tải danh sách bài học…</div>

    <div v-else-if="!hasAny()" class="pstate empty">
      <div class="pemoji">🌱</div>
      <h3>Chưa có bài hoàn thành</h3>
      <p>Hoàn thành một ngày học (đánh dấu ✓ ở cuối bài) để mở lại {{ tool === 'quiz' ? 'quiz' : 'flashcard' }} ở đây.</p>
      <button class="go-courses" @click="router.push({ name: 'courses' })">Tới khóa học →</button>
    </div>

    <div v-else class="week-list">
      <section v-for="g in groups" :key="g.course + ':' + g.week" class="week-group" :class="{ open: isOpen(g) }">
        <div class="wg-head">
          <button class="wg-toggle" @click="toggleWeek(g)">
            <span class="wg-chevron">▸</span>
            <span class="wg-emoji">{{ g.emoji }}</span>
            <span class="wg-course">{{ g.courseName }}</span>
            <span class="wg-week">{{ g.weekLabel }}</span>
            <span class="wg-badge">{{ g.days.length }} bài · {{ g.weekCount }} {{ unit() }}</span>
          </button>
          <!-- Ôn cả tuần: chỉ hữu ích khi có từ 2 ngày trở lên -->
          <button v-if="g.days.length > 1" class="wg-all" @click.stop="pickWeek(g)">
            🗂 Ôn cả tuần <span class="wg-arrow">→</span>
          </button>
        </div>

        <div v-if="isOpen(g)" class="lesson-grid">
          <button v-for="d in g.days" :key="d.day" class="lesson-card" @click="pickDay(g, d)">
            <span class="lc-emoji">{{ g.emoji }}</span>
            <div class="lc-body">
              <div class="lc-top">
                <span class="lc-meta">{{ d.label }}</span>
              </div>
              <div class="lc-title">{{ d.title }}</div>
              <div class="lc-count">{{ d.count }} {{ unit() }}</div>
            </div>
            <span class="lc-go">→</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.picker {
  background: var(--surface);
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
  color: var(--slate);
  margin-top: 6px;
}
.saved-entry {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  cursor: pointer;
  background: linear-gradient(135deg, #eafff6, #eef6ff);
  border: 1px solid rgba(0, 214, 143, 0.28);
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 22px;
  transition: all 0.15s;
}
[data-theme='dark'] .saved-entry {
  background: var(--bg-success);
}
@media (hover: hover) {
  .saved-entry:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(0, 214, 143, 0.18);
  }
}
.saved-entry:active {
  transform: scale(0.99);
  box-shadow: 0 10px 24px rgba(0, 214, 143, 0.18);
}
.se-emoji {
  font-size: 26px;
  flex: none;
}
.se-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.se-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
}
.se-sub {
  font-size: 12.5px;
  color: var(--text-success);
  font-weight: 600;
  margin-top: 2px;
}
.se-go {
  font-size: 20px;
  color: var(--text-success);
  font-weight: 800;
  flex: none;
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
.week-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.week-group {
  border: 1px solid rgba(108, 92, 231, 0.12);
  border-radius: 16px;
  padding: 8px 10px;
  transition: border-color 0.15s;
}
.week-group.open {
  border-color: rgba(108, 92, 231, 0.28);
  background: rgba(108, 92, 231, 0.02);
}
.wg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.wg-toggle {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 8px 6px;
  min-height: 44px;
  text-align: left;
}
.wg-chevron {
  font-size: 13px;
  color: var(--purple);
  transition: transform 0.18s;
  flex: none;
}
.week-group.open .wg-chevron {
  transform: rotate(90deg);
}
.wg-badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  background: rgba(108, 92, 231, 0.08);
  padding: 3px 10px;
  border-radius: 99px;
  margin-left: 4px;
}
.wg-emoji {
  font-size: 18px;
}
.wg-course {
  font-size: 12px;
  font-weight: 800;
  color: var(--purple);
}
.wg-week {
  font-size: 16px;
  font-weight: 800;
  color: var(--ink);
}
.wg-all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  border: none;
  color: #fff;
  background: var(--grad-purple);
  font-size: 13px;
  font-weight: 800;
  padding: 9px 15px;
  min-height: 44px;
  border-radius: 11px;
  transition: transform 0.12s, box-shadow 0.15s;
}
@media (hover: hover) {
  .wg-all:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(108, 92, 231, 0.3);
  }
}
.wg-all:active {
  transform: scale(0.97);
  box-shadow: 0 8px 20px rgba(108, 92, 231, 0.3);
}
.wg-arrow {
  font-weight: 800;
}
.lesson-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 12px;
  padding: 0 4px 8px;
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
@media (hover: hover) {
  .lesson-card:hover {
    background: var(--purple-soft);
    border-color: var(--purple);
    transform: translateY(-2px);
  }
}
.lesson-card:active {
  background: var(--purple-soft);
  border-color: var(--purple);
  transform: scale(0.99);
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
