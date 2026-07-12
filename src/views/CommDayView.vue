<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import VocabCard from '@/components/day/VocabCard.vue'
import InlineFlashcards from '@/components/day/InlineFlashcards.vue'
import AiChat from '@/components/day/AiChat.vue'
import IntonationTrainer from '@/components/day/IntonationTrainer.vue'
import ShadowingBeat from '@/components/day/ShadowingBeat.vue'
import FluencyRetell from '@/components/day/FluencyRetell.vue'
import MonologueTask from '@/components/day/MonologueTask.vue'
import ListeningDictation from '@/components/day/ListeningDictation.vue'
import ListeningComprehension from '@/components/day/ListeningComprehension.vue'
import ErrorLedger from '@/components/day/ErrorLedger.vue'
import QuizTool from '@/components/tools/QuizTool.vue'
import VoiceRecorder from '@/components/day/VoiceRecorder.vue'
import { getCommDay } from '@/data/courseComm'
import { commReflexGroups } from '@/data/commReflexPhrases'
import { commRevengeScene } from '@/lib/commStats'
import { commMilestoneOf } from '@/data/milestones'
import { speak } from '@/lib/speak'
import { hapticSuccess } from '@/lib/haptics'

const props = defineProps({ week: [String, Number], day: [String, Number] })
const router = useRouter()
const user = useUserStore()

const d = computed(() => getCommDay(props.week, props.day))
const say = (t) => speak(t)

// Bold nội tuyến cho mẹo phát âm (nội dung từ MD của repo, đã tin cậy): escape
// HTML rồi biến **x** -> <strong>x</strong>.
function mdInline(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

// —— Chiến lợi phẩm buổi (debrief) ——
// AI tổng kết cuối buổi -> 3 lỗi vào SỔ LỖI (tự sửa) + điểm rubric buổi Boss lưu
// vào store (tái dùng quizScores, khóa "comm:boss:N" — tự đồng bộ Supabase).
// Lỗi debrief lưu localStorage theo buổi để tải lại vẫn còn bài tự sửa.
const DEBRIEF_KEY = (w, n) => `comm-debrief-w${w}-d${n}`
const debriefErrors = ref([])
function loadDebriefErrors() {
  if (!d.value) {
    debriefErrors.value = []
    return
  }
  try {
    const raw = localStorage.getItem(DEBRIEF_KEY(d.value.week, d.value.n))
    debriefErrors.value = raw ? JSON.parse(raw) : []
  } catch {
    debriefErrors.value = []
  }
}
watch(d, loadDebriefErrors, { immediate: true })

function onDebrief(result) {
  if (!d.value || !result) return
  // 3 lỗi -> sổ lỗi (bền hóa localStorage + hiện thành bài tự sửa).
  debriefErrors.value = Array.isArray(result.errors) ? result.errors.slice(0, 3) : []
  try {
    localStorage.setItem(DEBRIEF_KEY(d.value.week, d.value.n), JSON.stringify(debriefErrors.value))
  } catch {
    /* ignore */
  }
  // Buổi Boss: lưu điểm rubric như một "bài kiểm tra" (đạt ≥ 70%).
  if (d.value.isBoss && Number.isFinite(result.score)) {
    user.recordQuiz('comm', `boss:${d.value.week}`, result.score, 100, 0.7)
  }
  // Lưu số khách quan của buổi (WPM + % phát âm) để trang Tổng kết hiện tiến bộ.
  const wpm = Number(result.wpm)
  const pron = Number(result.pron)
  if ((Number.isFinite(wpm) && wpm > 0) || Number.isFinite(pron)) {
    const key = `${d.value.week}:${d.value.n}`
    const cur = user.convoPrefs.commMetrics || {}
    user.setConvoPrefs({
      commMetrics: {
        ...cur,
        [key]: {
          wpm: Number.isFinite(wpm) && wpm > 0 ? wpm : cur[key]?.wpm ?? null,
          pron: Number.isFinite(pron) ? pron : cur[key]?.pron ?? null,
        },
      },
    })
  }
}

// —— Tiến độ tuần ——
const isDone = (n) => !!d.value && user.isDone('comm', d.value.week, n)
const done = computed(() => !!d.value && isDone(d.value.n))

// Surprise mode (Tuần 8): che bối cảnh/nhiệm vụ cụ thể để người học tự nhận diện
// tình huống khi vào vai. Sau khi đã hoàn thành buổi thì lộ ra để xem lại.
const masked = computed(() => !!d.value?.scenario?.surprise && !done.value)
const weekDoneCount = computed(() => (d.value ? d.value.days.filter((dd) => isDone(dd.n)).length : 0))
const ringPct = computed(() => (d.value ? Math.round((weekDoneCount.value / d.value.totalDays) * 100) : 0))

// Mở khóa tuần tự: buổi chỉ mở khi buổi liền trước đã xong.
const dayUnlocked = (n) => {
  if (!d.value) return false
  const i = d.value.days.findIndex((dd) => dd.n === n)
  return i <= 0 || isDone(d.value.days[i - 1].n)
}
watch(
  d,
  (cur) => {
    if (cur && !dayUnlocked(cur.n)) {
      const target = cur.days.find((dd) => !isDone(dd.n)) || cur.days[0]
      if (target && target.n !== cur.n)
        router.replace({ name: 'comm-day', params: { week: props.week, day: target.n } })
    }
  },
  { immediate: true },
)

function goDay(n) {
  if (n && dayUnlocked(n)) router.push({ name: 'comm-day', params: { week: props.week, day: n } })
}
function goTool(tool) {
  const query = d.value ? { c: 'comm', w: d.value.week, d: d.value.n } : undefined
  router.push({ name: 'tools-tab', params: { tool }, query })
}

// —— Bài kiểm tra tuần (soft gating: đủ buổi + đạt quiz mới mở tuần kế) ——
const weekComplete = computed(() => !!d.value && weekDoneCount.value >= d.value.totalDays)
const weekTest = computed(() => (d.value ? user.quizOf('comm', `week:${d.value.week}`) : null))
function goWeekTest() {
  if (weekComplete.value && d.value)
    router.push({ name: 'assessment', params: { course: 'comm', scope: `week-${d.value.week}` } })
}

function markDone() {
  if (d.value && !done.value) {
    const vocabTerms = [...d.value.vocab, ...d.value.reviewVocab].map((v) => v.term)
    user.toggleDay('comm', d.value.week, d.value.n, d.value.totalDays, vocabTerms)
    hapticSuccess()
  }
}
function unmark() {
  if (d.value && done.value) user.toggleDay('comm', d.value.week, d.value.n, d.value.totalDays)
}

// —— Quiz nhanh (không bắt buộc) ——
const vocabQuiz = computed(() => d.value?.quiz || [])
function onVocabComplete(r) {
  if (d.value) user.recordVocabDay('comm', d.value.week, d.value.n, r.score, r.total, 0.7)
}

// —— Shadowing chấm nhịp (Đợt A #3): 1 câu/buổi, ưu tiên câu người học sẽ NÓI
// (dòng "B:" trong hội thoại mẫu), bỏ tiền tố người nói; rơi về câu mẫu/cụm nếu vắng.
function stripSpeaker(line) {
  return String(line || '').replace(/^\s*[A-B]\s*:\s*/, '').trim()
}
const shadowSentence = computed(() => {
  if (!d.value?.scenario) return ''
  const sample = d.value.scenario.sample || []
  const bLine = sample.find((s) => /^\s*B\s*:/.test(s))
  const pick = bLine || sample[0] || d.value.sentences?.[0] || d.value.phrases?.[0] || ''
  return stripSpeaker(pick)
})

// —— Nghe hiểu (Trục C) ——
// Nghe-chép: dùng câu chốt khai báo trong "🎧 Nghe" của tuần, nếu vắng thì rơi về
// hội thoại mẫu của tình huống -> mọi buổi roleplay đều có phần luyện nghe.
const dictationSentences = computed(() => {
  if (!d.value) return []
  const fromMd = d.value.listening?.dictation || []
  const src = fromMd.length ? fromMd : d.value.scenario?.sample || []
  return src.slice(0, 2)
})
// Nghe thật hóa dần (Đợt A #1): buổi Boss các khối có clip curate (Tuần 4–8) kéo
// clip giọng bản xứ THẬT thay vì TTS; không có clip -> tự rơi về câu TTS của buổi.
const realListen = computed(() => !!d.value?.isBoss && Number(d.value.week) >= 4)
// Nghe-hiểu: đoạn dài + câu hỏi, chỉ ở buổi Boss (nếu tuần có khai báo).
const comprehension = computed(() => (d.value?.isBoss ? d.value.listening?.comprehension || null : null))

// 🔁 Cảnh phục thù (Trục E): buổi mission gợi roleplay lại 1 Boss tuần trước từng tạch.
const revenge = computed(() => (d.value?.isMission ? commRevengeScene(user, d.value.week) : null))

// —— Kỹ thuật 4/3/2 (Trục B): 1 buổi/tuần (buổi giữa tuần = buổi 4) ép nói trôi ——
const showRetell = computed(() => !!d.value && d.value.n === 4 && !d.value.isMission && !d.value.isBoss)
const retellTopic = computed(() =>
  d.value ? `Kể lại "${d.value.scenario?.title || d.value.title}" bằng lời của bạn — dùng cụm vừa nạp.` : '',
)

// —— Độc thoại dài mỗi khối (Trục E): 1 buổi/khối = buổi 5 tuần cuối khối (2/4/6/8) ——
const MONOLOGUE = {
  2: 'Kể lại một ngày điển hình của bạn, từ sáng đến tối.',
  4: 'Kể một kỷ niệm đáng nhớ với bạn bè hoặc gia đình.',
  6: 'Giới thiệu một dự án hoặc công việc bạn từng làm.',
  8: 'Tự giới thiệu bản thân trong 90 giây, như trong một buổi phỏng vấn.',
}
const CONNECTORS = ['First,', 'Then,', 'After that,', 'Because', 'For example,', 'However,', 'Finally,']
const monologueTopic = computed(() => (d.value && d.value.n === 5 ? MONOLOGUE[d.value.week] || '' : ''))

// —— Ngữ cảnh cho AI: bám chủ đề + cụm của buổi + kịch bản CỐ ĐỊNH (roleplay) ——
// Buổi Boss/roleplay -> truyền fixedScenario để AI vào vai đúng buổi + tung twist.
// Buổi Mission -> KHÔNG truyền scenario (AiChat thành nơi tập dượt tự do trước khi
// ra ngoài làm mission thật).
const aiContext = computed(() => {
  if (!d.value) return {}
  const ctx = {
    title: d.value.scenario?.title || d.value.title,
    week: d.value.week,
    day: d.value.n,
    weekTitle: d.value.weekTitle,
    vocab: d.value.vocab.map((v) => v.term),
    phrases: d.value.phrases,
    grammar: d.value.grammar.map((g) => g.title),
  }
  if (d.value.scenario) ctx.fixedScenario = d.value.scenario
  // Chống điểm ảo (#7): buổi Boss chấm rubric -> BẮT BUỘC nói bằng giọng (khóa gõ tay).
  if (d.value.isBoss) ctx.voiceRequired = true
  return ctx
})

// —— Mốc ghi âm khóa comm (1.1 / 4.7 / 8.7) ——
// 3 buổi được khai báo là "mốc" hiện thêm khối VoiceRecorder để lưu bản ghi, so
// lại cạnh nhau ở trang Tổng kết. Câu gợi ý đọc lấy từ cụm dùng được của buổi.
const milestone = computed(() => (d.value ? commMilestoneOf(d.value.week, d.value.n) : null))
const milestoneSentences = computed(() => (d.value ? (d.value.phrases || []).slice(0, 5) : []))
</script>

<template>
  <div class="container day">
    <span class="back" @click="router.push({ name: 'comm' })">← Giao Tiếp Thực Chiến · Tuần {{ week }}</span>

    <template v-if="d">
      <!-- HEADER -->
      <header class="day-head">
        <div class="dh-left">
          <div class="dh-eyebrow">
            TUẦN {{ d.week }} · BUỔI {{ d.n }}/{{ d.totalDays }}
            <span v-if="d.isBoss" class="dh-flag boss">👑 BOSS TUẦN</span>
            <span v-else-if="d.isMission" class="dh-flag mission">🌍 MISSION THẬT</span>
            <span v-else class="dh-flag">🎭 NHẬP VAI</span>
          </div>
          <h1 class="dh-title">{{ d.scenario?.title || d.title }}</h1>
          <p class="dh-sub">{{ d.weekTitle }}</p>
        </div>
        <div class="dh-ring" :style="{ '--pct': ringPct + '%' }">
          <div class="dh-ring-inner">{{ weekDoneCount }}/{{ d.totalDays }}</div>
        </div>
      </header>

      <!-- DAY PILLS -->
      <div class="day-pills">
        <button
          v-for="dd in d.days"
          :key="dd.n"
          class="pill"
          :class="{ on: dd.n === d.n, done: isDone(dd.n), locked: !dayUnlocked(dd.n) }"
          @click="goDay(dd.n)"
        >
          {{ isDone(dd.n) ? '✓' : dd.n }}
        </button>
      </div>

      <div class="main">
        <!-- 1) BRIEFING KỊCH BẢN (không lộ twist) -->
        <section v-if="d.scenario" class="step-card brief-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">{{ d.isBoss ? 'BOSS TUẦN · CHẤM RUBRIC' : 'TÌNH HUỐNG HÔM NAY' }}</div>
              <h2 class="step-title">🎭 {{ d.scenario.title }}</h2>
            </div>
          </div>
          <!-- Surprise mode: giấu bối cảnh/nhiệm vụ cụ thể — người học tự nhận diện -->
          <div v-if="masked" class="brief-surprise">
            <div class="bs-emoji">🎲</div>
            <p>
              <b>Tình huống bí mật.</b> Bạn <b>không biết trước</b> AI sẽ đóng vai ai — hãy
              nghe câu mở đầu của AI, nhận ra bối cảnh và rút đúng "bộ cụm" để xử lý.
              Cứ bắt đầu nói ở khung nhập vai bên dưới.
            </p>
          </div>
          <template v-else>
            <div class="brief-grid">
              <div v-if="d.scenario.role" class="brief-row"><span class="brief-lbl">🤖 Vai AI</span><p>{{ d.scenario.role }}</p></div>
              <div v-if="d.scenario.setting" class="brief-row"><span class="brief-lbl">📍 Bối cảnh</span><p>{{ d.scenario.setting }}</p></div>
            </div>
            <div v-if="d.scenario.tasks?.length" class="brief-tasks">
              <span class="brief-lbl">🎯 Nhiệm vụ của bạn</span>
              <ul>
                <li v-for="(t, i) in d.scenario.tasks" :key="i">{{ t }}</li>
              </ul>
            </div>
          </template>
          <div v-if="d.scenario.rubric?.length" class="brief-rubric">
            <span class="brief-lbl">✅ Chấm điểm theo</span>
            <div class="rubric-chips">
              <span v-for="(r, i) in d.scenario.rubric" :key="i" class="rubric-chip">{{ r }}</span>
            </div>
          </div>
          <p v-if="d.scenario.recall" class="brief-recall">
            🔄 <b>Ôn xoáy:</b> gần cuối hiệp 2, AI sẽ kéo lại {{ d.scenario.recall }} — hãy lôi ra cụm cũ đã học để xử lý.
          </p>
          <p v-if="d.scenario.coldOpen" class="brief-note cold">
            🎲 <b>Vào thẳng nhịp thật:</b> nửa sau khóa rồi — ngay câu đầu AI đã nhập vai ở tốc độ thật,
            không còn hiệp 1 chậm rãi. Cứ phản xạ ngay; bí thì bấm 💡 dưới câu của AI.
          </p>
          <p v-else class="brief-note">
            ⚠️ Hiệp 2 sẽ có <b>một tình huống bất ngờ</b> — đừng chuẩn bị trước, cứ phản xạ tự nhiên.
            Bí thì bấm 💡 dưới câu của AI.
          </p>
        </section>

        <!-- 2) NẠP CỤM SỐNG CÒN -->
        <section v-if="d.vocab.length || d.reviewVocab.length" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">NẠP CỤM SỐNG CÒN · TRƯỚC KHI NHẬP VAI</div>
              <h2 class="step-title">🗂️ Cụm cần cho tình huống này</h2>
            </div>
          </div>
          <div class="vocab-grid">
            <VocabCard v-for="v in d.vocab" :key="v.term" :vocab="v" />
          </div>

          <template v-if="d.reviewVocab.length">
            <div class="sub-head">🔁 Ôn lại từ buổi trước</div>
            <div class="vocab-grid">
              <VocabCard v-for="v in d.reviewVocab" :key="'r-' + v.term" :vocab="v" />
            </div>
          </template>

          <template v-if="d.phrases.length">
            <div class="sub-head">💬 Cụm dùng được</div>
            <div class="phrase-wrap">
              <span v-for="(p, i) in d.phrases" :key="i" class="phrase-chip" @click="say(p)">{{ p }} 🔊</span>
            </div>
          </template>

          <template v-if="d.sentences.length">
            <div class="sub-head">📝 Câu mẫu</div>
            <ul class="sentence-list">
              <li v-for="(s, i) in d.sentences" :key="i" @click="say(s)">{{ s }} <span class="say-ico">🔊</span></li>
            </ul>
          </template>

          <button class="ghost-btn" @click="goTool('flashcard')">🃏 Luyện lại bằng Flashcard →</button>
        </section>

        <!-- 2b) MICRO-LESSON PHÁT ÂM THEO KHỐI (Tuần 1/3/7 · buổi 1) -->
        <section v-if="d.pronunciation" class="step-card pron-lesson">
          <div class="step-head">
            <div>
              <div class="eyebrow">🗣️ PHÁT ÂM TRỌNG TÂM · CẢ KHỐI DÙNG CHUNG</div>
              <h2 class="step-title">{{ d.pronunciation.title || 'Nói sao cho người ta hiểu' }}</h2>
            </div>
          </div>
          <p v-if="d.pronunciation.intro" class="quiz-intro">{{ d.pronunciation.intro }}</p>
          <ul class="pron-tips">
            <li v-for="(t, i) in d.pronunciation.tips" :key="i" v-html="mdInline(t)"></li>
          </ul>
        </section>

        <!-- 2b2) NỐI ÂM & NUỐT ÂM (connected speech) THEO KHỐI (Tuần 1/3/5/7 · buổi 1) -->
        <section v-if="d.connectedSpeech" class="step-card pron-lesson cs-lesson">
          <div class="step-head">
            <div>
              <div class="eyebrow">🔊 NỐI ÂM & NUỐT ÂM · NGHE CHO KỊP GIỌNG THẬT</div>
              <h2 class="step-title">{{ d.connectedSpeech.title || 'Người bản xứ nối âm thế nào' }}</h2>
            </div>
          </div>
          <p v-if="d.connectedSpeech.intro" class="quiz-intro">{{ d.connectedSpeech.intro }}</p>
          <ul class="pron-tips">
            <li v-for="(t, i) in d.connectedSpeech.tips" :key="i" @click="say(String(t).replace(/\*\*/g, ''))">
              <span v-html="mdInline(t)"></span> <span class="say-ico">🔊</span>
            </li>
          </ul>
        </section>

        <!-- 2b3) BỘ HIỆN NGỮ ĐIỆU — đọc câu Yes/No vs câu kể, đo đường lên/xuống -->
        <IntonationTrainer
          v-if="d.intonation"
          :key="'into-' + d.week + '-' + d.n"
          :yesno="d.intonation.yesno"
          :statement="d.intonation.statement"
        />

        <!-- 2c2) SHADOWING CHẤM NHỊP — 1 câu/buổi, bắt chước nhịp trọng âm của mẫu -->
        <ShadowingBeat
          v-if="shadowSentence"
          :key="'shb-' + d.week + '-' + d.n"
          :sentence="shadowSentence"
        />

        <!-- 2e) NGHE–CHÉP — 1–2 câu chốt của hội thoại, rèn tai bắt âm. Buổi Boss
             Khối 2–4 (Tuần 4–8): kéo clip giọng THẬT (nghe thật hóa dần); còn lại TTS. -->
        <ListeningDictation
          v-if="dictationSentences.length"
          :key="'dict-' + d.week + '-' + d.n"
          :sentences="dictationSentences"
          :week="d.week"
          :force-tts="!realListen"
          :allow-real="realListen"
        />

        <!-- 2d) TRÔI CHẢY 4/3/2 — buổi giữa tuần, ép nói mượt hơn -->
        <FluencyRetell
          v-if="showRetell"
          :key="'retell-' + d.week + '-' + d.n"
          :rec-id="`comm:${d.week}:${d.n}:retell`"
          :topic="retellTopic"
          :hints="d.phrases.slice(0, 4)"
        />

        <!-- 2f) ĐỘC THOẠI DÀI — 1 buổi/khối, nói liền mạch 60–90s + từ nối -->
        <MonologueTask
          v-if="monologueTopic"
          :key="'mono-' + d.week + '-' + d.n"
          :rec-id="`comm:${d.week}:${d.n}:mono`"
          :topic="monologueTopic"
          :connectors="CONNECTORS"
        />

        <!-- 3) NHỚ NHANH -->
        <InlineFlashcards v-if="d.vocab.length" :vocab="d.vocab" title="Nhớ nhanh cụm vừa nạp" />

        <!-- 4) MISSION THẬT (buổi 6) -->
        <section v-if="d.isMission" class="step-card mission-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">🌍 SÂN TẬP CÓ TRẬN THẬT</div>
              <h2 class="step-title">Mission tuần {{ d.week }} — làm ngoài app</h2>
            </div>
          </div>
          <ul class="mission-steps">
            <li v-for="(c, i) in d.checklist" :key="i">{{ c }}</li>
          </ul>
          <p class="quiz-intro">
            Tập trước với AI ở khung bên dưới, rồi ra ngoài làm thật. Xong thì đánh dấu hoàn thành buổi để
            giữ streak — bằng chứng (ảnh/ghi âm) bạn tự lưu lại nhé.
          </p>
          <div v-if="revenge" class="revenge-box">
            <div class="rev-emoji">🔁</div>
            <div class="rev-body">
              <b>Cảnh phục thù:</b> Boss <b>Tuần {{ revenge.week }} — {{ revenge.title }}</b> lần trước mới đạt
              {{ revenge.pct }}%. Trước khi làm mission, quay lại đánh lại đúng cảnh đó cho đến khi thắng nhé.
              <button class="rev-btn" @click="router.push({ name: 'comm-day', params: { week: revenge.week, day: revenge.day } })">↩ Đấu lại Boss Tuần {{ revenge.week }} →</button>
            </div>
          </div>
        </section>

        <!-- 4b) NGHE HIỂU (buổi Boss) — nghe đoạn dài hơn rồi trả lời -->
        <ListeningComprehension
          v-if="comprehension"
          :key="'lc-' + d.week + '-' + d.n"
          :listening="comprehension"
          :week="d.week"
        />

        <!-- 4c) PHẢN HỒI & GIỮ NHỊP HỘI THOẠI (Đợt B) — bộ "keo dán" để nghe/luân
             phiên tự nhiên; hiện ở buổi có nhập vai, mở sẵn ở 2 tuần đầu -->
        <section v-if="d.scenario" class="step-card reflex-card">
          <details :open="d.week <= 2">
            <summary class="reflex-summary">
              <div>
                <div class="eyebrow">ỨNG BIẾN · KEO DÁN HỘI THOẠI</div>
                <h2 class="step-title">💬 Phản hồi & giữ nhịp hội thoại</h2>
              </div>
              <span class="reflex-caret">▾</span>
            </summary>
            <p class="quiz-intro">
              Thả những cụm này <b>trong lúc nghe</b> và <b>khi chuyển lượt</b> để nghe tự nhiên như người bản xứ —
              đừng chỉ hỏi–đáp khô khan. Bấm để nghe & đọc theo.
            </p>
            <div class="reflex-groups">
              <div v-for="g in commReflexGroups" :key="g.key" class="reflex-group">
                <div class="reflex-glabel">{{ g.icon }} {{ g.label }}</div>
                <div class="reflex-ghint">{{ g.hint }}</div>
                <div class="phrase-wrap">
                  <span
                    v-for="(p, i) in g.phrases"
                    :key="i"
                    class="phrase-chip reflex-chip"
                    :title="p.vi"
                    @click="say(p.en)"
                  >{{ p.en }} 🔊</span>
                </div>
              </div>
            </div>
          </details>
        </section>

        <!-- 5) NHẬP VAI VỚI AI (trục của buổi) -->
        <AiChat :key="d.week + '-' + d.n" :context="aiContext" @debrief="onDebrief" />

        <!-- 5b) SỔ LỖI — 3 lỗi chính từ debrief, tự sửa lại để nhớ -->
        <ErrorLedger v-if="d.scenario" :week="d.week" :day="d.n" :auto-errors="debriefErrors" />

        <!-- 5c) MỐC GHI ÂM (buổi 1.1 / 4.7 / 8.7) — lưu để so lại cuối khóa -->
        <section v-if="milestone" class="step-card milestone-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">🎙️ MỐC GHI ÂM · {{ milestone.tag }}</div>
              <h2 class="step-title">Ghi lại giọng của bạn hôm nay</h2>
            </div>
          </div>
          <p class="quiz-intro">
            Ghi lại phần nhập vai để so với các mốc khác cuối khóa. Nghe lại 3 mốc cạnh nhau ở
            <a class="ms-link" @click="router.push({ name: 'comm-summary' })">trang Tổng kết</a>.
          </p>
          <VoiceRecorder :rec-id="milestone.recId" :label="milestone.label" :sentences="milestoneSentences" />
        </section>

        <!-- 6) QUIZ NHANH -->
        <section v-if="vocabQuiz.length" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">ÔN NHANH — TỰ CHỌN</div>
              <h2 class="step-title">❓ Quiz cụm buổi {{ d.n }}</h2>
            </div>
          </div>
          <p class="quiz-intro">{{ vocabQuiz.length }} câu trộn nhiều dạng để nhớ cụm lâu hơn. Không bắt buộc để qua buổi.</p>
          <div class="grammar-drill">
            <QuizTool :questions="vocabQuiz" mode="practice" :pass-threshold="0.7" embedded @complete="onVocabComplete" />
          </div>
        </section>

        <!-- 7) BÀI KIỂM TRA TUẦN — chỉ hiện ở buổi cuối (Boss); mở khi xong cả tuần -->
        <section v-if="!d.nextDay" class="step-card week-test">
          <div class="step-head">
            <div>
              <div class="eyebrow">KIỂM TRA CUỐI TUẦN</div>
              <h2 class="step-title">🎯 Bài kiểm tra Tuần {{ d.week }}</h2>
            </div>
            <span v-if="weekTest" class="wt-badge" :class="{ ok: weekTest.passed }">
              {{ weekTest.passed ? '✅ Đã đạt' : 'Cao nhất' }} {{ weekTest.pct }}%
            </span>
          </div>
          <p class="quiz-intro">Đạt từ 70% để nhận <b>+100 XP</b> và mở khóa tuần kế. Điểm được lưu lại.</p>
          <button class="green-btn" :class="{ locked: !weekComplete }" :disabled="!weekComplete" @click="goWeekTest">
            {{ weekComplete ? `🎯 ${weekTest ? 'Làm lại bài kiểm tra' : 'Làm bài kiểm tra tuần'} →` : '🔒 Làm bài kiểm tra tuần' }}
          </button>
          <p v-if="!weekComplete" class="wt-lock-hint">
            Hoàn thành cả {{ d.totalDays }} buổi trong tuần để mở khóa ({{ weekDoneCount }}/{{ d.totalDays }} buổi)
          </p>
        </section>

        <!-- CHECKPOINT -->
        <section class="checkpoint" :class="{ done }">
          <div class="cp-emoji">{{ done ? '✅' : '🎭' }}</div>
          <div class="cp-text">
            <h3>{{ done ? `Đã hoàn thành buổi ${d.n}!` : `Hoàn thành buổi ${d.n} 🎉` }}</h3>
            <p v-if="!done">Nhập vai xong 2 hiệp và lưu vài cụm hay, rồi đánh dấu hoàn thành để nhận <b>+50 XP</b> và giữ streak.</p>
            <p v-else>Tuần {{ d.week }}: đã xong {{ weekDoneCount }}/{{ d.totalDays }} buổi. Xong cả tuần sẽ mở tuần kế 🔓</p>
          </div>
          <div class="cp-cta">
            <button v-if="d.prevDay" class="outline-btn" @click="goDay(d.prevDay)">← Buổi {{ d.prevDay }}</button>
            <button v-if="!done" class="green-btn" @click="markDone">✓ Đánh dấu hoàn thành</button>
            <template v-else>
              <button class="outline-btn" @click="unmark">↩ Bỏ đánh dấu</button>
              <button v-if="d.nextDay" class="green-btn" @click="goDay(d.nextDay)">Buổi {{ d.nextDay }} →</button>
              <button v-else class="green-btn" @click="router.push({ name: 'comm' })">Về bản đồ →</button>
            </template>
          </div>
        </section>
      </div>
    </template>

    <div v-else class="empty">
      <h2>Chưa có nội dung cho buổi này</h2>
      <p>Tuần {{ week }} · Buổi {{ day }} không tìm thấy trong dữ liệu khóa Giao Tiếp.</p>
      <button class="green-btn" @click="router.push({ name: 'comm' })">← Về bản đồ khóa</button>
    </div>
  </div>
</template>

<style scoped src="@/components/day/ieltsDaySection.css"></style>
<style scoped>
.day {
  padding: 26px var(--space-page-x) 90px;
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #b25f00;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

/* header */
.day-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-top: 18px;
}
.dh-eyebrow {
  font-size: 12px;
  font-weight: 800;
  color: var(--muted-2);
  letter-spacing: 0.4px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dh-flag {
  background: rgba(255, 176, 32, 0.16);
  color: #b25f00;
  padding: 3px 9px;
  border-radius: 99px;
  font-size: 11px;
}
.dh-flag.boss {
  background: rgba(108, 92, 231, 0.16);
  color: #6c5ce7;
}
.dh-flag.mission {
  background: rgba(0, 214, 143, 0.16);
  color: #00966a;
}
.dh-title {
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.6px;
  margin: 8px 0 4px;
}
.dh-sub {
  font-size: 14px;
  color: var(--muted);
}
.dh-ring {
  flex: none;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: conic-gradient(#ffb020 var(--pct), var(--line) 0);
  display: grid;
  place-items: center;
}
.dh-ring-inner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--surface);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 800;
  color: var(--ink);
}

/* day pills */
.day-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 18px 0 6px;
}
.pill {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.pill.on {
  background: linear-gradient(135deg, #ffb020, #f08a00);
  border-color: transparent;
  color: #fff;
}
.pill.done {
  border-color: rgba(0, 214, 143, 0.5);
  color: #00966a;
}
.pill.done.on {
  color: #fff;
}
.pill.locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 18px;
  min-width: 0;
}

/* briefing */
.brief-card {
  background: linear-gradient(135deg, #fff8ec, var(--surface));
  border: 1px solid rgba(255, 176, 32, 0.28);
}
[data-theme='dark'] .brief-card {
  background: var(--surface);
}
.brief-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}
.brief-row p {
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--slate);
  margin-top: 3px;
}
.brief-lbl {
  font-size: 12.5px;
  font-weight: 800;
  color: var(--ink-2);
}
.brief-tasks {
  margin-top: 16px;
}
.brief-tasks ul {
  margin: 8px 0 0;
  padding-left: 20px;
}
.brief-tasks li {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--slate);
}
.brief-rubric {
  margin-top: 16px;
}
.rubric-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.rubric-chip {
  background: rgba(0, 214, 143, 0.1);
  border: 1px solid rgba(0, 214, 143, 0.24);
  color: #00966a;
  font-size: 12.5px;
  font-weight: 700;
  padding: 5px 11px;
  border-radius: 99px;
}
.brief-surprise {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
  background: rgba(108, 92, 231, 0.08);
  border: 1px dashed rgba(108, 92, 231, 0.4);
  border-radius: 14px;
  padding: 16px 18px;
}
.bs-emoji {
  font-size: 34px;
  flex: none;
}
.brief-surprise p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--slate);
}
.brief-note {
  margin-top: 16px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--slate);
  background: var(--bg);
  border-left: 3px solid #ffb020;
  border-radius: 10px;
  padding: 10px 14px;
}
.brief-note.cold {
  border-left-color: #6c5ce7;
}

/* phản hồi & giữ nhịp hội thoại (Đợt B) */
.reflex-card {
  border: 1px solid rgba(108, 92, 231, 0.22);
}
.reflex-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  list-style: none;
}
.reflex-summary::-webkit-details-marker {
  display: none;
}
.reflex-caret {
  flex: none;
  color: var(--muted-2);
  font-size: 15px;
  transition: transform 0.15s;
}
details[open] .reflex-caret {
  transform: rotate(180deg);
}
.reflex-groups {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 14px;
}
.reflex-glabel {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--ink);
}
.reflex-ghint {
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--muted);
  margin: 3px 0 8px;
}
.reflex-chip {
  background: rgba(108, 92, 231, 0.1);
  border-color: rgba(108, 92, 231, 0.28);
  color: #6c5ce7;
}

/* mission */
.mission-card {
  background: linear-gradient(135deg, #eafff6, var(--surface));
  border: 1px solid rgba(0, 214, 143, 0.28);
}
[data-theme='dark'] .mission-card {
  background: var(--surface);
}
.mission-steps {
  margin: 14px 0 0;
  padding-left: 20px;
}
.mission-steps li {
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--slate);
}

/* vocab (dùng lại phong cách IeltsDayView) */
.vocab-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 20px;
}
.sub-head {
  font-size: 14px;
  font-weight: 800;
  color: var(--ink);
  margin-top: 24px;
}
.phrase-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 12px;
}
.phrase-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 176, 32, 0.12);
  border: 1px solid rgba(255, 176, 32, 0.3);
  color: #b25f00;
  font-size: 13.5px;
  font-weight: 700;
  padding: 7px 13px;
  border-radius: 99px;
  cursor: pointer;
}
.sentence-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.sentence-list li {
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--slate);
  background: var(--bg);
  border: 1px solid rgba(108, 92, 231, 0.08);
  border-radius: 12px;
  padding: 11px 15px;
  cursor: pointer;
}
.say-ico {
  opacity: 0.6;
  font-size: 12px;
}
.ghost-btn {
  margin-top: 18px;
  border: 1px solid rgba(255, 176, 32, 0.4);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  color: #b25f00;
  padding: 11px 18px;
  border-radius: 12px;
  background: var(--surface);
}

/* cảnh phục thù */
.revenge-box {
  display: flex;
  gap: 14px;
  margin-top: 16px;
  background: rgba(255, 122, 122, 0.08);
  border: 1px dashed rgba(224, 72, 72, 0.4);
  border-radius: 14px;
  padding: 14px 16px;
}
.rev-emoji {
  font-size: 28px;
  flex: none;
}
.rev-body {
  font-size: 14px;
  line-height: 1.6;
  color: var(--slate);
}
.rev-btn {
  display: block;
  margin-top: 10px;
  border: 1px solid rgba(224, 72, 72, 0.4);
  background: var(--surface);
  color: #c0392b;
  font-weight: 700;
  font-size: 13.5px;
  padding: 9px 15px;
  border-radius: 10px;
  cursor: pointer;
}

/* micro-lesson phát âm */
.pron-lesson {
  border: 1px solid rgba(108, 92, 231, 0.25);
}
.pron-tips {
  margin: 14px 0 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pron-tips li {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--slate);
}
.pron-tips :deep(strong) {
  color: var(--ink);
}

/* mốc ghi âm */
.milestone-card {
  border: 1.5px solid rgba(108, 92, 231, 0.25);
}
.ms-link {
  color: #6c5ce7;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
}

/* bài kiểm tra tuần */
.week-test {
  border: 1.5px solid rgba(0, 214, 143, 0.25);
}
.wt-lock-hint {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
  margin-top: 10px;
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
}
.cp-text p {
  color: #b3b0c9;
  font-size: 14px;
  line-height: 1.55;
  margin-top: 6px;
  max-width: 440px;
}
.checkpoint.done .cp-text p {
  color: #d9fff0;
}
.cp-cta {
  position: relative;
  display: flex;
  gap: 10px;
  flex: none;
  flex-wrap: wrap;
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

@media (max-width: 720px) {
  .vocab-grid {
    grid-template-columns: 1fr;
  }
  .dh-title {
    font-size: 23px;
  }
}
</style>
