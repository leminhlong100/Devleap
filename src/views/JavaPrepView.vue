<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { runJavaCode, friendlyRunError } from '@/lib/runJava'
import { speak, canSpeak } from '@/lib/speak'
import CodeEditor from '@/components/tools/CodeEditor.vue'
import {
  INTERVIEW_TOPICS,
  QUESTION_BANK,
  CHEATSHEET,
  CRASH_PLAN,
  CODING_CHALLENGES,
  INTERVIEW_SKILLS,
  INTERVIEW_TOTALS,
  topicLabel,
  challengePatterns,
  javaSrsId,
} from '@/data/javaInterview'
import { computeReadiness, readinessLabel } from '@/lib/readiness'
import { dayGoals, goalStatus, planStatus } from '@/lib/crashPlan'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const { isOnline } = useOnlineStatus()

const TABS = [
  { key: 'plan', label: '🗓️ Lộ trình 2 tuần' },
  { key: 'skills', label: '🗣️ Kỹ năng PV' },
  { key: 'cheat', label: '📋 Cheat-sheet' },
  { key: 'bank', label: '📚 Ngân hàng câu hỏi' },
  { key: 'coding', label: '💻 Coding' },
]
const tab = ref(TABS.some((t) => t.key === route.query.tab) ? route.query.tab : 'plan')
watch(tab, (t) => router.replace({ query: { ...route.query, tab: t } }))

// —— Ngân hàng câu hỏi: lọc + mở đáp án ——
const LEVELS = [
  { key: '', label: 'Mọi mức' },
  { key: 'easy', label: 'Dễ' },
  { key: 'medium', label: 'Trung bình' },
  { key: 'hard', label: 'Khó' },
]
const filterTopic = ref(typeof route.query.topic === 'string' ? route.query.topic : '')
const filterLevel = ref('')
const search = ref('')
const opened = ref(new Set())
const onlyReview = ref(false)
const onlyDue = ref(false)

// Câu hỏi tự đánh dấu "cần ôn lại" — giờ có lịch ôn SM-2 thật (tái dùng map
// `srs` chung, namespace 'javaq:'), ép active-recall đúng lúc sắp quên thay vì
// chỉ lọc tĩnh. Xem user.toggleReviewQuestion/reviewJavaQuestion.
const reviewSet = computed(() => new Set(user.javaPrep?.reviewQuestions || []))
const reviewCount = computed(() => reviewSet.value.size)
const dueSet = computed(() => new Set([...reviewSet.value].filter((id) => user.isCardDue(javaSrsId(id)))))
const dueCount = computed(() => dueSet.value.size)
function isMarked(id) {
  return reviewSet.value.has(id)
}
function isDueForReview(id) {
  return dueSet.value.has(id)
}
function toggleReview(id) {
  user.toggleReviewQuestion(id)
}
function gradeReview(id, grade) {
  user.reviewJavaQuestion(id, grade)
}

const filteredQuestions = computed(() => {
  const q = search.value.trim().toLowerCase()
  return QUESTION_BANK.filter((item) => {
    if (onlyDue.value && !dueSet.value.has(item.id)) return false
    if (onlyReview.value && !reviewSet.value.has(item.id)) return false
    if (filterTopic.value && item.topic !== filterTopic.value) return false
    if (filterLevel.value && item.level !== filterLevel.value) return false
    if (q && !item.q.toLowerCase().includes(q) && !item.answer.toLowerCase().includes(q)) return false
    return true
  })
})
function toggleOpen(id) {
  const s = new Set(opened.value)
  if (s.has(id)) s.delete(id)
  else {
    s.add(id)
    // Mở đọc đáp án = đã ôn câu này → nạp cho tiến độ Lộ trình 2 tuần.
    user.markQuestionStudied(id)
  }
  opened.value = s
}

// Điểm theo chủ đề từ lần phỏng vấn gần nhất (gợi ý ôn chỗ yếu).
const topicScores = computed(() => user.javaPrep?.topicScores || {})
const bestScore = computed(() => user.javaPrep?.bestScore || 0)

// —— Readiness meter: 1 chỉ số 0-100 trả lời "đã sẵn sàng phỏng vấn chưa?" ——
const readiness = computed(() =>
  computeReadiness({
    bestScore: bestScore.value,
    topicScores: topicScores.value,
    solvedChallenges: user.javaPrep?.solvedChallenges || [],
  }),
)
const readinessColor = computed(() => {
  const s = readiness.value.score
  if (s >= 80) return '#00c281'
  if (s >= 60) return '#FFB020'
  return '#ff5f57'
})

// —— Lộ trình 2 tuần: tự đánh dấu ngày hoàn thành theo KẾT QUẢ ——
// Bối cảnh chấm mục tiêu: câu đã ôn (mở đọc), số bài coding đã giải, số mock.
const planCtx = computed(() => ({
  studied: new Set(user.javaPrep?.studiedQuestions || []),
  solvedCount: (user.javaPrep?.solvedChallenges || []).length,
  mockCount: user.javaPrep?.mocksTaken || 0,
}))
const plan = computed(() => planStatus(planCtx.value))
// Ngày -> danh sách mục tiêu kèm trạng thái (đủ để render checklist).
function goalsForDay(d) {
  return dayGoals(d).map((g) => ({ ...g, ...goalStatus(g, planCtx.value) }))
}
function isDayComplete(day) {
  return plan.value.days.find((x) => x.day === day)?.done || false
}
// Nhảy tới đúng chỗ để làm mục tiêu (đổi tab / mở filter / vào phòng mock).
function goToGoal(jump) {
  if (!jump) return
  if (jump.tab === 'mock') {
    router.push({ name: 'java-mock' })
    return
  }
  if (jump.tab === 'bank') {
    filterTopic.value = jump.topic || ''
    filterLevel.value = ''
    onlyReview.value = false
    onlyDue.value = false
  }
  tab.value = jump.tab
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// —— Kỹ năng phỏng vấn ——
const skills = INTERVIEW_SKILLS
const openStar = ref(new Set())
const openHr = ref(new Set())
const ttsOn = canSpeak() // speak() dùng giọng tiếng Anh → chỉ đọc bản EN self-intro
// Lưu ý: trong template ref bị auto-unwrap nên không truyền ref vào hàm chung được;
// dùng hai hàm toggle riêng thao tác thẳng trên ref (như toggleOpen của tab Ngân hàng).
function toggleStar(id) {
  const s = new Set(openStar.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  openStar.value = s
}
function toggleHr(i) {
  const s = new Set(openHr.value)
  if (s.has(i)) s.delete(i)
  else s.add(i)
  openHr.value = s
}
function speakIntroEn() {
  speak(skills.selfIntro.en)
}

const levelLabel = { easy: 'Dễ', medium: 'TB', hard: 'Khó' }

// —— Coding challenge ——
const challenge = ref(CODING_CHALLENGES[0])
const code = ref(CODING_CHALLENGES[0].starter)
const output = ref(null)
const running = ref(false)
const runError = ref('')
const showSolution = ref(false)
const filterPattern = ref('')
const patterns = challengePatterns()
const filteredChallenges = computed(() =>
  filterPattern.value ? CODING_CHALLENGES.filter((c) => c.pattern === filterPattern.value) : CODING_CHALLENGES,
)

function pickChallenge(c) {
  challenge.value = c
  code.value = c.starter
  output.value = null
  runError.value = ''
  showSolution.value = false
}
async function run() {
  if (running.value || !isOnline.value) return
  running.value = true
  runError.value = ''
  output.value = null
  try {
    output.value = await runJavaCode(code.value)
    if (output.value.ok) {
      user.addXp(10)
      user.markChallengeSolved(challenge.value.id)
    }
  } catch (e) {
    runError.value = friendlyRunError(e)
  } finally {
    running.value = false
  }
}

onMounted(() => {
  if (route.query.topic && typeof route.query.topic === 'string') {
    tab.value = 'bank'
    filterTopic.value = route.query.topic
  }
})
</script>

<template>
  <div class="container page">
    <!-- Banner -->
    <div class="banner">
      <div class="banner-txt">
        <span class="badge">🎯 JAVA BACKEND · PHỎNG VẤN CẤP TỐC · 2 TUẦN</span>
        <h1>Ôn Cấp Tốc<br />Sẵn Sàng Phỏng Vấn</h1>
        <p>{{ INTERVIEW_TOTALS.questions }} câu hỏi · {{ INTERVIEW_TOTALS.topics }} chủ đề · {{ INTERVIEW_TOTALS.challenges }} bài coding — Java backend là chính, kèm frontend, SQL sâu, stack thực tế &amp; kỹ năng phỏng vấn.</p>
        <button class="cta" @click="router.push({ name: 'java-mock' })">🎤 Bắt đầu Mock Interview →</button>
        <span v-if="bestScore" class="best">🏆 Điểm phỏng vấn cao nhất: {{ bestScore }}/100</span>
      </div>
    </div>

    <!-- Readiness meter -->
    <div class="readiness">
      <div class="r-gauge" :style="{ '--c': readinessColor }">
        <span class="r-big">{{ readiness.score }}</span><span class="r-unit">/100</span>
      </div>
      <div class="r-body">
        <div class="r-head">
          <b>Độ sẵn sàng phỏng vấn</b>
          <span class="r-verdict" :style="{ color: readinessColor }">{{ readinessLabel(readiness.score) }}</span>
        </div>
        <ul class="r-tips">
          <li v-for="(t, i) in readiness.tips" :key="i">{{ t }}</li>
        </ul>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button v-for="t in TABS" :key="t.key" class="tab" :class="{ on: tab === t.key }" @click="tab = t.key">
        {{ t.label }}
      </button>
    </div>

    <!-- ===== Lộ trình 2 tuần ===== -->
    <section v-if="tab === 'plan'" class="plan">
      <!-- Tổng quan tiến độ + "hôm nay làm gì" -->
      <div class="plan-hero">
        <div class="ph-top">
          <div>
            <b class="ph-title">Tiến độ lộ trình</b>
            <span class="ph-sub">Ngày tự đánh dấu ✓ khi bạn ôn hết câu / giải coding / xong mock — không cần tick tay.</span>
          </div>
          <span class="ph-count">{{ plan.doneCount }}/{{ plan.total }} ngày</span>
        </div>
        <div class="ph-bar"><span :style="{ width: (plan.doneCount / plan.total) * 100 + '%' }"></span></div>
        <p v-if="plan.today" class="ph-today">
          👉 <b>Hôm nay: Ngày {{ plan.today }}</b> — {{ CRASH_PLAN[plan.today - 1].topic }}
        </p>
        <p v-else class="ph-today done">🎉 Bạn đã hoàn thành cả 14 ngày. Ôn lại chỗ điểm thấp &amp; luyện thêm Mock Interview nhé!</p>
      </div>

      <div
        v-for="d in CRASH_PLAN"
        :key="d.day"
        class="plan-day"
        :class="{ wk2: d.day > 7, done: isDayComplete(d.day), today: d.day === plan.today }"
      >
        <span class="day-no">
          <span class="day-mark">{{ isDayComplete(d.day) ? '✓' : d.day }}</span>
          <small>Ngày {{ d.day }}</small>
        </span>
        <div class="day-body">
          <div class="day-head">
            <h3>{{ d.topic }}</h3>
            <span v-if="isDayComplete(d.day)" class="pill ok">✓ Hoàn thành</span>
            <span v-else-if="d.day === plan.today" class="pill now">Hôm nay</span>
          </div>

          <!-- Mục tiêu đo được (app tự chấm) -->
          <ul class="goals">
            <li v-for="(g, gi) in goalsForDay(d)" :key="gi" :class="{ ok: g.done }">
              <span class="gk">{{ g.done ? '✅' : '⬜' }}</span>
              <span class="gl">{{ g.label }}</span>
              <span class="gc">{{ g.cur }}/{{ g.total }}</span>
              <button v-if="!g.done" class="go" @click="goToGoal(g.jump)">
                {{ g.k === 'mock' ? 'Vào mock →' : g.k === 'code' ? 'Mở coding →' : 'Ôn ngay →' }}
              </button>
            </li>
          </ul>

          <!-- Gợi ý luyện tay (không tự chấm) -->
          <details class="hand">
            <summary>✍️ Luyện tay (gợi ý, không tính điểm)</summary>
            <ul><li v-for="(t, i) in d.tasks" :key="i">{{ t }}</li></ul>
          </details>
        </div>
      </div>
    </section>

    <!-- ===== Kỹ năng phỏng vấn ===== -->
    <section v-else-if="tab === 'skills'" class="skills">
      <!-- Giới thiệu bản thân -->
      <div class="sk-block">
        <h2 class="sk-h">👋 Giới thiệu bản thân (~60 giây)</h2>
        <div class="intro-grid">
          <div class="intro-card">
            <div class="intro-head"><span class="flag">🇻🇳 Tiếng Việt</span></div>
            <p>{{ skills.selfIntro.vi }}</p>
          </div>
          <div class="intro-card">
            <div class="intro-head">
              <span class="flag">🇬🇧 English</span>
              <button v-if="ttsOn" class="tts" title="Nghe bản tiếng Anh" @click="speakIntroEn">🔊 Nghe</button>
            </div>
            <p>{{ skills.selfIntro.en }}</p>
          </div>
        </div>
      </div>

      <!-- Kể dự án theo STAR -->
      <div class="sk-block">
        <h2 class="sk-h">🌟 Kể dự án theo STAR</h2>
        <p class="sk-note">Situation → Task → Action → Result. Nhấn “<b>TÔI làm gì</b>” và kết quả đo được.</p>
        <div
          v-for="s in skills.starStories"
          :key="s.id"
          class="star"
          :class="{ open: openStar.has(s.id) }"
          @click="toggleStar(s.id)"
        >
          <div class="star-head">
            <span class="star-title">{{ s.title }}</span>
            <span class="caret">{{ openStar.has(s.id) ? '−' : '+' }}</span>
          </div>
          <div class="tags"><span v-for="t in s.tags" :key="t" class="tg">{{ t }}</span></div>
          <div v-if="openStar.has(s.id)" class="star-body" @click.stop>
            <p><b class="st s">S · Bối cảnh</b>{{ s.situation }}</p>
            <p><b class="st t">T · Nhiệm vụ</b>{{ s.task }}</p>
            <p><b class="st a">A · Hành động</b>{{ s.action }}</p>
            <p><b class="st r">R · Kết quả</b>{{ s.result }}</p>
          </div>
        </div>
      </div>

      <!-- Câu hỏi HR -->
      <div class="sk-block">
        <h2 class="sk-h">💬 Câu hỏi HR hay gặp</h2>
        <div
          v-for="(h, i) in skills.hrQuestions"
          :key="i"
          class="qitem"
          :class="{ open: openHr.has(i) }"
          @click="toggleHr(i)"
        >
          <div class="qitem-head">
            <span class="qtxt">{{ h.q }}</span>
            <span class="caret">{{ openHr.has(i) ? '−' : '+' }}</span>
          </div>
          <div v-if="openHr.has(i)" class="qbody" @click.stop>
            <p class="tip">💡 <b>Mẹo:</b> {{ h.tip }}</p>
            <p class="ans"><b>Gợi ý trả lời:</b> {{ h.sample }}</p>
          </div>
        </div>
      </div>

      <!-- Hỏi ngược + đàm phán lương -->
      <div class="two-col">
        <div class="sk-block">
          <h2 class="sk-h">❓ Câu hỏi nên hỏi lại</h2>
          <ul class="sk-list"><li v-for="(q, i) in skills.askThem" :key="i">{{ q }}</li></ul>
        </div>
        <div class="sk-block">
          <h2 class="sk-h">💰 Đàm phán lương</h2>
          <ul class="sk-list"><li v-for="(n, i) in skills.negotiation" :key="i">{{ n }}</li></ul>
        </div>
      </div>

      <!-- Nên / Không nên -->
      <div class="two-col">
        <div class="sk-block do">
          <h2 class="sk-h">✅ Nên</h2>
          <ul class="sk-list"><li v-for="(d, i) in skills.dosDonts.dos" :key="i">{{ d }}</li></ul>
        </div>
        <div class="sk-block dont">
          <h2 class="sk-h">🚫 Không nên</h2>
          <ul class="sk-list"><li v-for="(d, i) in skills.dosDonts.donts" :key="i">{{ d }}</li></ul>
        </div>
      </div>
    </section>

    <!-- ===== Cheat-sheet ===== -->
    <section v-else-if="tab === 'cheat'" class="cheat">
      <div v-for="c in CHEATSHEET" :key="c.title" class="cheat-card">
        <h3>{{ c.icon }} {{ c.title }}</h3>
        <ul><li v-for="(it, i) in c.items" :key="i">{{ it }}</li></ul>
      </div>
    </section>

    <!-- ===== Ngân hàng câu hỏi ===== -->
    <section v-else-if="tab === 'bank'" class="bank">
      <div class="filters">
        <input v-model="search" class="search" placeholder="🔍 Tìm câu hỏi…" />
        <div class="chips">
          <button class="chip" :class="{ on: filterTopic === '' }" @click="filterTopic = ''">Tất cả</button>
          <button
            v-for="t in INTERVIEW_TOPICS"
            :key="t.key"
            class="chip"
            :class="{ on: filterTopic === t.key }"
            @click="filterTopic = t.key"
          >
            {{ t.icon }} {{ t.label }}
            <span v-if="topicScores[t.key] != null" class="mini-score">{{ topicScores[t.key] }}</span>
          </button>
        </div>
        <div class="seg small">
          <button v-for="l in LEVELS" :key="l.key" :class="{ on: filterLevel === l.key }" @click="filterLevel = l.key">
            {{ l.label }}
          </button>
          <button class="review-toggle" :class="{ on: onlyReview }" @click="onlyReview = !onlyReview">
            ⭐ Cần ôn lại{{ reviewCount ? ` (${reviewCount})` : '' }}
          </button>
          <button class="review-toggle due" :class="{ on: onlyDue }" @click="onlyDue = !onlyDue">
            ⏰ Ôn theo lịch{{ dueCount ? ` (${dueCount})` : '' }}
          </button>
        </div>
      </div>

      <p class="count">{{ filteredQuestions.length }} câu</p>
      <div
        v-for="item in filteredQuestions"
        :key="item.id"
        class="qitem"
        :class="{ open: opened.has(item.id) }"
        @click="toggleOpen(item.id)"
      >
        <div class="qitem-head">
          <span class="lvl" :data-lvl="item.level">{{ levelLabel[item.level] }}</span>
          <span class="qtxt">{{ item.q }}</span>
          <button
            class="star-btn"
            :class="{ on: isMarked(item.id) }"
            :title="isMarked(item.id) ? 'Bỏ đánh dấu' : 'Đánh dấu cần ôn lại'"
            @click.stop="toggleReview(item.id)"
          >{{ isMarked(item.id) ? '⭐' : '☆' }}</button>
          <span class="caret">{{ opened.has(item.id) ? '−' : '+' }}</span>
        </div>
        <div v-if="opened.has(item.id)" class="qbody" @click.stop>
          <ul class="points"><li v-for="(p, i) in item.points" :key="i">{{ p }}</li></ul>
          <p class="ans"><b>Trả lời:</b> {{ item.answer }}</p>
          <span class="tag">{{ topicLabel(item.topic) }}</span>
          <span v-if="isMarked(item.id) && isDueForReview(item.id)" class="tag due-tag">⏰ Đến hạn ôn</span>
          <div v-if="isMarked(item.id)" class="grade-row">
            <span class="grade-lbl">Bạn nhớ tới đâu?</span>
            <button class="grade again" @click="gradeReview(item.id, 'again')">Quên</button>
            <button class="grade hard" @click="gradeReview(item.id, 'hard')">Khó</button>
            <button class="grade good" @click="gradeReview(item.id, 'good')">Tốt</button>
            <button class="grade easy" @click="gradeReview(item.id, 'easy')">Dễ</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Coding ===== -->
    <section v-else class="coding">
      <div class="chips ch-filters">
        <button class="chip" :class="{ on: filterPattern === '' }" @click="filterPattern = ''">Tất cả dạng</button>
        <button
          v-for="p in patterns"
          :key="p"
          class="chip"
          :class="{ on: filterPattern === p }"
          @click="filterPattern = p"
        >
          {{ p }}
        </button>
      </div>
      <div class="ch-list">
        <button
          v-for="c in filteredChallenges"
          :key="c.id"
          class="ch"
          :class="{ on: challenge.id === c.id }"
          @click="pickChallenge(c)"
        >
          {{ c.title }}
        </button>
      </div>

      <div class="ch-prompt">
        <h3>{{ challenge.title }}</h3>
        <p>{{ challenge.prompt }}</p>
        <details v-if="challenge.hints?.length" class="hints">
          <summary>💡 Gợi ý</summary>
          <ul><li v-for="(h, i) in challenge.hints" :key="i">{{ h }}</li></ul>
        </details>
      </div>

      <CodeEditor v-model="code" />
      <div class="ch-actions">
        <button class="run" :disabled="running || !isOnline" @click="run">
          {{ running ? 'Đang chạy…' : '▶ Chạy' }}
        </button>
        <button class="ghost" @click="pickChallenge(challenge)">↺ Reset</button>
        <button class="ghost" @click="showSolution = !showSolution">
          {{ showSolution ? 'Ẩn lời giải' : '👁 Lời giải' }}
        </button>
      </div>
      <p v-if="!isOnline" class="warn">⚠️ Cần kết nối mạng để chạy code.</p>
      <p v-if="runError" class="err">{{ runError }}</p>

      <div v-if="output" class="out" :class="{ bad: !output.ok }">
        <div class="out-head">{{ output.ok ? '✅ Chạy thành công' : output.stage === 'compile' ? '❌ Lỗi biên dịch' : '❌ Lỗi khi chạy' }}</div>
        <pre v-if="output.stdout">{{ output.stdout }}</pre>
        <pre v-if="output.stderr" class="stderr">{{ output.stderr }}</pre>
      </div>

      <div v-if="showSolution" class="solution">
        <h4>Lời giải tham khảo</h4>
        <CodeEditor :model-value="challenge.solution" readonly />
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  padding: 28px 24px 80px;
  max-width: 900px;
}
.banner {
  border-radius: 22px;
  padding: 34px 30px;
  background: linear-gradient(150deg, #6c5ce7, #4b3bc4);
  color: #fff;
  margin-bottom: 22px;
}
.badge {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
  opacity: 0.9;
}
.banner h1 {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.2;
  margin: 12px 0;
  letter-spacing: -0.5px;
}
.readiness {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 18px;
  padding: 16px 20px;
  margin-bottom: 22px;
}
.r-gauge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  width: 74px;
  height: 74px;
  border-radius: 50%;
  border: 6px solid var(--c);
  color: var(--c);
}
.r-big {
  font-size: 22px;
  font-weight: 800;
}
.r-unit {
  font-size: 11px;
  font-weight: 700;
}
.r-body {
  flex: 1;
  min-width: 0;
}
.r-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.r-verdict {
  font-weight: 800;
  font-size: 13px;
}
.r-tips {
  padding-left: 18px;
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.5;
}
.banner p {
  opacity: 0.92;
  font-size: 14.5px;
}
.cta {
  margin-top: 18px;
  border: none;
  cursor: pointer;
  font-weight: 800;
  font-size: 15px;
  color: #4b3bc4;
  background: #fff;
  padding: 13px 22px;
  border-radius: 12px;
}
.best {
  display: block;
  margin-top: 12px;
  font-weight: 700;
  font-size: 13.5px;
}
.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.tab {
  padding: 10px 16px;
  border-radius: 99px;
  border: 1px solid var(--line-soft);
  background: var(--surface);
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
  color: var(--slate);
}
.tab.on {
  background: var(--grad-purple);
  color: #fff;
  border-color: transparent;
}
/* Plan */
.plan-hero {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 16px;
}
.ph-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.ph-title {
  font-size: 15px;
  font-weight: 800;
  display: block;
}
.ph-sub {
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.5;
}
.ph-count {
  flex-shrink: 0;
  font-weight: 800;
  font-size: 13.5px;
  color: var(--purple);
  background: var(--purple-soft);
  padding: 4px 12px;
  border-radius: 99px;
  white-space: nowrap;
}
.ph-bar {
  height: 8px;
  border-radius: 99px;
  background: var(--line-soft);
  overflow: hidden;
  margin: 12px 0 10px;
}
.ph-bar span {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #6c5ce7, #00c281);
  transition: width 0.35s ease;
}
.ph-today {
  font-size: 13.5px;
  color: var(--slate);
  line-height: 1.5;
}
.ph-today.done {
  color: #00a86f;
  font-weight: 600;
}
.plan-day {
  display: flex;
  gap: 14px;
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-left: 3px solid var(--purple);
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 12px;
}
.plan-day.wk2 {
  border-left-color: #00c281;
}
.plan-day.done {
  border-left-color: #00c281;
  background: rgba(0, 194, 129, 0.05);
}
.plan-day.today {
  border-color: var(--purple);
  box-shadow: 0 0 0 2px var(--purple-soft);
}
.day-no {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  min-width: 52px;
}
.day-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-weight: 800;
  font-size: 15px;
  color: var(--purple);
  background: var(--purple-soft);
}
.plan-day.wk2 .day-mark {
  color: #00a86f;
  background: rgba(0, 194, 129, 0.14);
}
.plan-day.done .day-mark {
  color: #fff;
  background: #00c281;
}
.day-no small {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted-2);
}
.day-body {
  flex: 1;
  min-width: 0;
}
.day-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.day-head h3 {
  font-size: 15.5px;
  font-weight: 800;
}
.pill {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 99px;
  white-space: nowrap;
}
.pill.ok {
  color: #00a86f;
  background: rgba(0, 194, 129, 0.15);
}
.pill.now {
  color: var(--purple);
  background: var(--purple-soft);
}
.goals {
  list-style: none;
  padding: 0;
  margin: 0 0 10px;
}
.goals li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--bg-soft, rgba(127, 127, 127, 0.05));
  margin-bottom: 6px;
  font-size: 13px;
}
.goals li.ok {
  opacity: 0.7;
}
.goals .gk {
  flex-shrink: 0;
  font-size: 13px;
}
.goals .gl {
  flex: 1;
  font-weight: 600;
  color: var(--slate);
  line-height: 1.4;
}
.goals li.ok .gl {
  text-decoration: line-through;
  text-decoration-color: var(--muted-2);
}
.goals .gc {
  flex-shrink: 0;
  font-size: 11.5px;
  font-weight: 800;
  color: var(--muted-2);
  font-variant-numeric: tabular-nums;
}
.goals .go {
  flex-shrink: 0;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 11.5px;
  color: #fff;
  background: var(--purple);
  padding: 5px 11px;
  border-radius: 8px;
}
.hand {
  font-size: 13px;
}
.hand summary {
  cursor: pointer;
  font-weight: 700;
  font-size: 12.5px;
  color: var(--muted);
}
.hand ul {
  padding-left: 18px;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--muted);
}
/* Cheat */
.cheat {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.cheat-card {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 18px;
}
.cheat-card h3 {
  font-size: 15.5px;
  font-weight: 800;
  margin-bottom: 10px;
}
.cheat-card ul {
  padding-left: 18px;
  line-height: 1.6;
  font-size: 13.5px;
  color: var(--slate);
}
.cheat-card li {
  margin: 5px 0;
}
/* Bank */
.filters {
  margin-bottom: 14px;
}
.search {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line-soft);
  background: var(--surface);
  font: inherit;
  color: var(--slate);
  margin-bottom: 12px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 10px;
}
.chip {
  padding: 7px 12px;
  border-radius: 99px;
  border: 1px solid var(--line-soft);
  background: var(--surface);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  color: var(--slate);
}
.chip.on {
  background: var(--purple-soft);
  border-color: var(--purple);
  color: var(--purple);
}
.mini-score {
  background: var(--purple);
  color: #fff;
  border-radius: 99px;
  padding: 1px 6px;
  font-size: 10.5px;
  margin-left: 4px;
}
.seg.small {
  display: flex;
  gap: 8px;
}
.seg.small button {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--line-soft);
  background: var(--surface);
  font-weight: 700;
  font-size: 12.5px;
  cursor: pointer;
  color: var(--slate);
}
.seg.small button.on {
  background: var(--grad-purple);
  color: #fff;
  border-color: transparent;
}
.review-toggle.on {
  background: rgba(255, 176, 32, 0.2);
  border-color: #d98700;
  color: #d98700;
}
.review-toggle.due.on {
  background: rgba(108, 92, 231, 0.15);
  border-color: var(--purple);
  color: var(--purple);
}
.due-tag {
  background: var(--purple-soft);
  color: var(--purple);
  margin-left: 8px;
}
.grade-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.grade-lbl {
  font-size: 12.5px;
  color: var(--muted-2);
  font-weight: 600;
}
.grade {
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
}
.grade.again {
  background: #ff5f57;
}
.grade.hard {
  background: #FFB020;
}
.grade.good {
  background: #00c281;
}
.grade.easy {
  background: #6c5ce7;
}
.count {
  color: var(--muted-2);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.qitem {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 13px;
  padding: 14px 16px;
  margin-bottom: 9px;
  cursor: pointer;
}
.qitem.open {
  border-color: var(--purple);
}
.qitem-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.lvl {
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 99px;
  white-space: nowrap;
}
.lvl[data-lvl='easy'] {
  background: rgba(0, 194, 129, 0.15);
  color: #00a86f;
}
.lvl[data-lvl='medium'] {
  background: rgba(255, 176, 32, 0.18);
  color: #d98700;
}
.lvl[data-lvl='hard'] {
  background: rgba(255, 95, 87, 0.15);
  color: #e0433a;
}
.qtxt {
  flex: 1;
  font-weight: 700;
  font-size: 14.5px;
  line-height: 1.45;
}
.caret {
  font-size: 20px;
  font-weight: 800;
  color: var(--muted-2);
}
.star-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 2px;
  color: var(--muted-2);
}
.star-btn.on {
  color: #d98700;
}
.qbody {
  margin-top: 12px;
  border-top: 1px dashed var(--line-soft);
  padding-top: 12px;
  cursor: default;
}
.points {
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--muted);
  margin-bottom: 10px;
}
.ans {
  font-size: 14px;
  line-height: 1.6;
  color: var(--slate);
}
.tag {
  display: inline-block;
  margin-top: 10px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--purple);
  background: var(--purple-soft);
  padding: 3px 10px;
  border-radius: 99px;
}
/* Coding */
.ch-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.ch {
  padding: 8px 13px;
  border-radius: 10px;
  border: 1px solid var(--line-soft);
  background: var(--surface);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: var(--slate);
}
.ch.on {
  background: var(--grad-purple);
  color: #fff;
  border-color: transparent;
}
.ch-prompt {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 14px;
}
.ch-prompt h3 {
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 6px;
}
.ch-prompt p {
  font-size: 14px;
  line-height: 1.55;
  color: var(--muted);
}
.hints {
  margin-top: 10px;
  font-size: 13.5px;
}
.hints summary {
  cursor: pointer;
  font-weight: 700;
  color: var(--purple);
}
.hints ul {
  padding-left: 18px;
  margin-top: 6px;
  line-height: 1.5;
  color: var(--muted);
}
.ch-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.run {
  border: none;
  cursor: pointer;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #00d68f, #00a86f);
  padding: 11px 22px;
  border-radius: 11px;
}
.run:disabled {
  opacity: 0.5;
  cursor: default;
}
.ghost {
  border: 1px solid var(--line-soft);
  background: var(--surface);
  color: var(--slate);
  font-weight: 700;
  padding: 11px 18px;
  border-radius: 11px;
  cursor: pointer;
}
.warn {
  color: var(--muted-2);
  font-size: 13px;
  margin-top: 10px;
}
.err {
  color: #ff5f57;
  font-weight: 600;
  margin-top: 10px;
}
.out {
  margin-top: 14px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--line-soft);
}
.out-head {
  padding: 9px 14px;
  font-weight: 800;
  font-size: 13px;
  background: rgba(0, 194, 129, 0.12);
  color: #00a86f;
}
.out.bad .out-head {
  background: rgba(255, 95, 87, 0.12);
  color: #e0433a;
}
.out pre {
  margin: 0;
  padding: 12px 14px;
  font-family: var(--mono);
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
  background: #1e1e2e;
  color: #e6e6f0;
}
.out pre.stderr {
  color: #ffb4ae;
}
.solution {
  margin-top: 16px;
}
.solution h4 {
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 8px;
}
/* Kỹ năng phỏng vấn */
.sk-block {
  margin-bottom: 22px;
}
.sk-h {
  font-size: 17px;
  font-weight: 800;
  margin-bottom: 10px;
  letter-spacing: -0.3px;
}
.sk-note {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 12px;
}
.intro-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.intro-card {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 16px 18px;
}
.intro-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.flag {
  font-weight: 800;
  font-size: 13px;
  color: var(--purple);
}
.tts {
  border: 1px solid var(--line-soft);
  background: var(--purple-soft);
  color: var(--purple);
  font-weight: 700;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 99px;
  cursor: pointer;
}
.intro-card p {
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--slate);
}
.star {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 10px;
  cursor: pointer;
}
.star.open {
  border-color: var(--purple);
}
.star-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.star-title {
  flex: 1;
  font-weight: 800;
  font-size: 14.5px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.tg {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  background: var(--purple-soft);
  padding: 2px 9px;
  border-radius: 99px;
}
.star-body {
  margin-top: 12px;
  border-top: 1px dashed var(--line-soft);
  padding-top: 12px;
  cursor: default;
}
.star-body p {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--slate);
  margin: 8px 0;
}
.st {
  display: block;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 2px;
}
.st.s { color: #6c5ce7; }
.st.t { color: #0984e3; }
.st.a { color: #d98700; }
.st.r { color: #00a86f; }
.tip {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--muted);
  margin-bottom: 8px;
}
.two-col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.sk-list {
  padding-left: 18px;
  line-height: 1.65;
  font-size: 13.5px;
  color: var(--slate);
}
.sk-list li {
  margin: 6px 0;
}
.sk-block.do,
.sk-block.dont {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 16px 18px;
}
.sk-block.do {
  border-left: 3px solid #00c281;
}
.sk-block.dont {
  border-left: 3px solid #ff5f57;
}
@media (max-width: 700px) {
  .cheat {
    grid-template-columns: 1fr;
  }
  .intro-grid,
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
