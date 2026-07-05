<script setup>
import { computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AgendaRail from '@/components/day/AgendaRail.vue'
import VocabCard from '@/components/day/VocabCard.vue'
import AiChat from '@/components/day/AiChat.vue'
import QuizTool from '@/components/tools/QuizTool.vue'
import InlineFlashcards from '@/components/day/InlineFlashcards.vue'
import ErrorLedger from '@/components/day/ErrorLedger.vue'
import ListeningDictation from '@/components/day/ListeningDictation.vue'
import ReadingComprehension from '@/components/day/ReadingComprehension.vue'
import ListeningComprehension from '@/components/day/ListeningComprehension.vue'
import PronunciationDrill from '@/components/day/PronunciationDrill.vue'
import SentenceBankPractice from '@/components/day/SentenceBankPractice.vue'
import VoiceRecorder from '@/components/day/VoiceRecorder.vue'
import DayHeader from '@/components/day/DayHeader.vue'
import GrammarSection from '@/components/day/GrammarSection.vue'
import WritingSection from '@/components/day/WritingSection.vue'
import MissionSection from '@/components/day/MissionSection.vue'
import WeekTestSection from '@/components/day/WeekTestSection.vue'
import { getIeltsDay } from '@/data/courseIelts'
import { planFromChecklist, requiredSentencesFor } from '@/lib/dayPlan'
import { listeningStageOf, listeningStageInfo } from '@/data/ieltsListeningStage'
import { speak } from '@/lib/speak'

function say(text) {
  speak(text)
}

const props = defineProps({ week: [String, Number], day: [String, Number] })
const router = useRouter()
const user = useUserStore()

const d = computed(() => getIeltsDay(props.week, props.day))

// BUỔI CHẨN ĐOÁN ĐẦU VÀO ("mốc 0"): Tuần 1 · Buổi 1. Checklist không hiển thị trên
// trang, nên khung hóa rõ ngay tại đây để người học hiểu hôm nay là đo điểm xuất phát
// (viết được AI chấm CEFR + ghi âm), KHÔNG phải để lấy điểm cao.
const isDiagnostic = computed(() => !!d.value && Number(d.value.week) === 1 && d.value.n === 1)

// —— KẾ HOẠCH BUỔI: chỉ hiện những khối mà checklist của ngày thật sự nhắc đến ——
// Mục tiêu: hết "quá tải" (12 khối/ngày) bằng cách bám đúng nhịp tác giả đã thiết kế
// cho từng ngày (Ngày 1 = ngữ pháp + viết + ghi âm; ngày từ vựng mới mở phòng từ…).
// Không có checklist -> hiện đầy đủ (an toàn ngược). Logic ở lib/dayPlan (test riêng).
const plan = computed(() => planFromChecklist(d.value?.checklist || []))

// Thang nghe "thật hóa dần" (Tuần 4-6 bán thực, Tuần 7-8 clip gốc) — gợi ý bài
// shadowing đã curate cho tuần này (xem docs/KE_HOACH_CAI_TIEN_GIAO_TIEP.md mục 3.5).
const listeningStage = computed(() => (d.value ? listeningStageInfo(d.value.week) : null))
// Hiện gợi ý ở buổi có nội dung nghe HOẶC buổi cuối tuần (tổng hợp) — không rải
// mọi buổi để tránh quá tải, nhưng vẫn chắc chắn xuất hiện ít nhất 1 lần/tuần.
const showListeningUpgrade = computed(
  () => !!d.value && listeningStageOf(d.value.week) !== 'tts' && (plan.value.listening || !d.value.nextDay),
)
function goShadowingForWeek() {
  if (!d.value) return
  router.push({ name: 'shadowing', query: { week: d.value.week } })
}

// Tiến độ thật: số buổi đã hoàn thành trong tuần & trạng thái buổi hiện tại.
const isDone = (n) => !!d.value && user.isDone('ielts', d.value.week, n)
const done = computed(() => !!d.value && isDone(d.value.n))

// —— Cổng luyện ngữ pháp: phải ĐẠT bài tập (≥70%) mới hoàn thành buổi & mở buổi kế ——
const grammarDrills = computed(() => d.value?.grammarDrills || [])
// Cổng ngữ pháp CHỈ bắt buộc ở NGÀY HỌC MỚI điểm đó. Ngày ôn/tổng hợp: bài tập là
// tự chọn (không bắt làm lại y hệt). Buổi cuối dùng "quiz tổng hợp" thay cho khối lẻ.
const grammarGateNeeded = computed(
  () => plan.value.grammar && grammarDrills.value.length > 0 && d.value?.grammarMode === 'new',
)
// Có hiện khối "Bài tập ngữ pháp" lẻ không? Ẩn ở buổi cuối để khỏi trùng quiz tổng hợp.
const showGrammarDrills = computed(
  () => plan.value.grammar && grammarDrills.value.length > 0 && d.value?.grammarMode !== 'final',
)
const grammarPassed = computed(
  () => !!d.value && (!grammarGateNeeded.value || user.grammarDayPassed('ielts', d.value.week, d.value.n)),
)

// —— Bài tập VIẾT làm ngay tại bài (vd "Viết 10 câu…") ——
// Chi tiết giao diện + nộp bài nằm ở WritingSection.vue; ở đây chỉ giữ lại phần
// cần cho CỔNG hoàn thành buổi + agenda + sổ lỗi tự động (autoErrors bên dưới).
const writingTask = computed(() => d.value?.writingTask || null)
const writingNeeded = computed(() => plan.value.writing && !!writingTask.value)
const requiredSentences = computed(() => requiredSentencesFor(writingTask.value?.prompt))
const writingDone = computed(
  () => !writingNeeded.value || (!!d.value && user.writingDone('ielts', d.value.week, d.value.n)),
)
const writingReview = computed(() => (d.value ? user.writingOf('ielts', d.value.week, d.value.n)?.review : null))

// —— QUIZ TỪ VỰNG: ÔN NHANH, KHÔNG còn là cổng bắt buộc ——
// Trước đây quiz từ vựng chặn hoàn thành buổi kể cả ngày trọng tâm là ngữ pháp.
// Nay chỉ là luyện thêm cho nhớ (vẫn cộng XP/ghi điểm), không khóa qua buổi.
const vocabQuiz = computed(() => d.value?.quiz || [])
const vocabPassed = computed(() => !!d.value && user.vocabDayPassed('ielts', d.value.week, d.value.n))
function onVocabComplete(r) {
  if (d.value) user.recordVocabDay('ielts', d.value.week, d.value.n, r.score, r.total, 0.7)
}

// Hoàn thành buổi: phải XONG các HOẠT ĐỘNG có cổng trên trang — luyện ngữ pháp,
// bài viết, quiz từ vựng. Phần nào không có trên buổi thì tự bỏ qua (adaptive).
// (Đã bỏ checklist tự-tick: mỗi hoạt động đã là việc làm thật, không cần tick lại.)
const dayReady = computed(() => grammarPassed.value && writingDone.value)
// Nhãn nút "hoàn thành" theo cổng còn thiếu (ưu tiên trên xuống dưới).
const nextGateLabel = computed(() => {
  if (!grammarPassed.value) return '🔒 Làm bài tập ngữ pháp trước'
  if (!writingDone.value) return '🔒 Nộp bài viết trước'
  return '✓ Đánh dấu hoàn thành'
})

// Mở khóa tuần tự: một buổi chỉ mở khi buổi LIỀN TRƯỚC đã hoàn thành.
const dayUnlocked = (n) => {
  if (!d.value) return false
  const i = d.value.days.findIndex((dd) => dd.n === n)
  return i <= 0 || isDone(d.value.days[i - 1].n)
}
// Vào thẳng URL một buổi bị khóa -> đẩy về buổi chưa hoàn thành đầu tiên.
watch(
  d,
  (cur) => {
    if (cur && !dayUnlocked(cur.n)) {
      const target = cur.days.find((dd) => !isDone(dd.n)) || cur.days[0]
      if (target && target.n !== cur.n) router.replace({ name: 'ielts-day', params: { week: props.week, day: target.n } })
    }
  },
  { immediate: true },
)
const weekDoneCount = computed(() => (d.value ? d.value.days.filter((dd) => isDone(dd.n)).length : 0))
const ringPct = computed(() => (d.value ? Math.round((weekDoneCount.value / d.value.totalDays) * 100) : 0))

function markDone() {
  // Phải xong cả luyện ngữ pháp lẫn bài viết trước khi cho hoàn thành buổi.
  if (d.value && !done.value && dayReady.value) {
    const { week, nextDay } = d.value
    const vocabTerms = [...d.value.vocab, ...d.value.reviewVocab].map((v) => v.term)
    user.toggleDay('ielts', week, d.value.n, d.value.totalDays, vocabTerms)
    // Vừa xong buổi CUỐI CÙNG của tuần -> hỏi cảm nhận (chỉ 1 lần/tuần).
    if (!nextDay && !user.weekFeedbackOf('ielts', week)) showWeekSurvey.value = true
  }
}
function unmark() {
  if (d.value && done.value) user.toggleDay('ielts', d.value.week, d.value.n, d.value.totalDays)
}

// —— KHẢO SÁT CẢM NHẬN CUỐI TUẦN (Dễ/Vừa/Khó) ——
// Đầu vào duy nhất để hiệu chỉnh độ khó (xem docs/KE_HOACH_DO_KHO_KHOA_HOC.md mục 5).
// weekTest (kết quả bài kiểm tra tuần) được khai báo bên dưới — dùng được ở đây
// vì các hàm chỉ chạy khi người dùng bấm nút, lúc đó mọi computed đã sẵn sàng.
const showWeekSurvey = ref(false)
const weekSurveyNote = ref('')
const weekSurveySuggestion = ref(null) // null | 'remedial' | 'ahead' — gợi ý sau khi chọn cảm nhận
function closeWeekSurvey() {
  showWeekSurvey.value = false
  weekSurveySuggestion.value = null
  weekSurveyNote.value = ''
}
function chooseWeekFeeling(rating) {
  if (!d.value) return
  user.saveWeekFeedback('ielts', d.value.week, rating, weekSurveyNote.value)
  const wt = weekTest.value
  if (rating === 'hard' && wt && !wt.passed && wt.pct < 70) {
    weekSurveySuggestion.value = 'remedial'
  } else if (rating === 'easy' && wt && wt.passed && wt.pct > 90) {
    weekSurveySuggestion.value = 'ahead'
  } else {
    closeWeekSurvey()
  }
}
function skipWeekSurvey() {
  if (d.value) user.saveWeekFeedback('ielts', d.value.week, 'skipped')
  closeWeekSurvey()
}
// "Khó" + quiz tuần < 70% -> dẫn thẳng tới khối ôn bù (đã có ở IeltsCourseView.vue).
function goRemedialFromSurvey() {
  if (d.value) router.push({ name: 'assessment', params: { course: 'ielts', scope: `week-${d.value.week}` } })
  closeWeekSurvey()
}
// "Dễ" + quiz tuần > 90% -> gợi ý thử sức sớm với tuần kế tiếp.
function goAheadFromSurvey() {
  if (d.value) router.push({ name: 'ielts-day', params: { week: Number(d.value.week) + 1, day: 1 } })
  closeWeekSurvey()
}

const agenda = computed(() => {
  if (!d.value) return []
  const p = plan.value
  const a = []
  // Thứ tự khớp với trang; chỉ liệt kê khối thực sự hiện trong buổi (theo kế hoạch ngày).
  if (p.vocab && d.value.vocab.length) a.push({ title: 'Từ vựng buổi này', meta: `${d.value.vocab.length + d.value.reviewVocab.length} từ` })
  if (p.flashcards && d.value.vocab.length) a.push({ title: 'Nhớ nhanh từ', meta: 'lật thẻ · nhớ lại' })
  if (p.grammar && d.value.grammar.length) {
    const label = d.value.grammarMode === 'new' ? 'Ngữ pháp hôm nay' : d.value.grammarMode === 'final' ? 'Tổng hợp ngữ pháp tuần' : 'Ôn tập ngữ pháp'
    a.push({ title: label, meta: `${d.value.grammar.length} điểm` })
  }
  if (showGrammarDrills.value) a.push({ title: 'Luyện tập ngữ pháp', meta: `${grammarDrills.value.length} câu · ${grammarGateNeeded.value ? 'bắt buộc đạt' : 'tự chọn'}` })
  if (d.value.reading) a.push({ title: 'Bài đọc hiểu', meta: `${d.value.reading.questions.length} câu hỏi` })
  if (d.value.listening) a.push({ title: 'Bài nghe (tên & số)', meta: `${d.value.listening.questions.length} câu hỏi` })
  if (p.reading && d.value.skills?.length) a.push({ title: 'Bài giảng & khung mẫu', meta: `${d.value.skills.length} mục` })
  if (p.reading && d.value.lessonScript) a.push({ title: 'Kịch bản bài học', meta: d.value.lessonScript.title })
  if (p.listening && listenSentences.value.length) a.push({ title: 'Luyện nghe', meta: `${listenSentences.value.length} câu nghe–chép` })
  if (p.pronunciation && pronItems.value.length) a.push({ title: 'Luyện phát âm', meta: `${pronItems.value.length} từ · nghe → nói` })
  if (recordingTask.value) a.push({ title: 'Ghi âm sản phẩm', meta: 'mốc so sánh' })
  if (p.sentenceBank && d.value.sentenceBank?.length) a.push({ title: 'Đặt câu về bản thân', meta: `${Math.min(d.value.sentenceBank.length, 8)} câu · AI chữa` })
  if (p.writing && writingTask.value) a.push({ title: 'Bài tập viết', meta: `${requiredSentences.value} câu · làm tại bài` })
  if (p.aiChat) a.push({ title: 'Trò chuyện với AI', meta: 'luyện giao tiếp' })
  if (p.quiz && d.value.quiz.length && d.value.grammarMode !== 'final') a.push({ title: 'Quiz từ vựng', meta: `${d.value.quiz.length} câu · ôn nhanh` })
  if (d.value.weekPracticeQuiz?.length) a.push({ title: 'Bài tập ôn tuần', meta: `${d.value.weekPracticeQuiz.length} câu · tổng hợp` })
  if (missionNeeded.value) a.push({ title: '🌍 Mission tuần', meta: missionDone.value ? '✅ đã hoàn thành' : 'ngoài app · +150 XP' })
  if (realTalkNeeded.value) a.push({ title: '🗣️ Buổi nói người thật', meta: realTalkDone.value ? '✅ đã hoàn thành' : 'ngoài app · +100 XP' })
  return a
})

function goDay(n) {
  if (n && dayUnlocked(n)) router.push({ name: 'ielts-day', params: { week: props.week, day: n } })
}
function goTool(tool) {
  // Mang theo ngữ cảnh buổi học để Flashcard nạp đúng từ vựng của tuần này.
  const query = d.value ? { c: 'ielts', w: d.value.week, d: d.value.n } : undefined
  router.push({ name: 'tools-tab', params: { tool }, query })
}
// Kết quả bài kiểm tra tuần (nếu đã làm) — dùng cho cả WeekTestSection lẫn khảo
// sát cảm nhận cuối tuần bên dưới, nên giữ 1 computed chung ở đây.
const weekTest = computed(() => (d.value ? user.quizOf('ielts', `week:${d.value.week}`) : null))

// —— MISSION TUẦN + BUỔI NÓI NGƯỜI THẬT (real-life, ngoài app) ——
// Chi tiết ghi chú/tick-off nằm ở MissionSection.vue; ở đây chỉ giữ cờ "có cần
// hiện không" + "đã xong chưa" vì agenda cũng cần 2 cờ này.
const missionNeeded = computed(
  () => !!d.value && plan.value.mission && (d.value.checklist || []).some((c) => /🌍|mission\s*tuần/i.test(c)),
)
const missionDone = computed(() => !!d.value && user.missionDone('ielts', d.value.week, d.value.n))
const realTalkNeeded = computed(
  () => !!d.value && plan.value.realTalk && (d.value.checklist || []).some((c) => /🗣️|buổi nói người thật/i.test(c)),
)
const realTalkDone = computed(() => !!d.value && user.realTalkDone('ielts', d.value.week, d.value.n))

// Sổ lỗi tự động: gom các câu SAI mà AI đã chữa trong bài viết của buổi này.
const autoErrors = computed(() => {
  const lines = writingReview.value?.lines || []
  return lines
    .filter((l) => !l.ok && l.corrected && l.corrected !== l.original)
    .map((l) => ({ wrong: l.original, right: l.corrected, note: l.note || '' }))
})

// Câu để LUYỆN NGHE: ưu tiên câu đúng của ngữ pháp hôm nay, thêm câu mẫu IELTS.
const listenSentences = computed(() => {
  if (!d.value) return []
  return [...(d.value.grammarExamples || []), ...(d.value.sentences || [])].slice(0, 5)
})
// Mục để LUYỆN PHÁT ÂM: từ vựng (có IPA) + cụm dùng được của buổi.
const pronItems = computed(() => {
  if (!d.value) return []
  const fromVocab = d.value.vocab.map((v) => ({ term: v.term, ipa: v.ipa || '' }))
  const fromPhrases = (d.value.phrases || []).map((p) => ({ term: p, ipa: '' }))
  return [...fromVocab, ...fromPhrases].slice(0, 8)
})
// Từ vựng của tuần (mới + ôn) — ưu tiên chọn cặp tối thiểu chứa từ đã học.
const pronVocabTerms = computed(() => {
  if (!d.value) return []
  return [...d.value.vocab, ...(d.value.reviewVocab || [])].map((v) => v.term)
})

// —— SẢN PHẨM thu âm của buổi ("mốc 0" buổi 1, bản ghi 60s buổi 6…) ——
// "Sản phẩm nhỏ" trong nhịp học mô tả việc cần ghi âm; hiện recorder khi việc đó là ghi âm.
const recordingTask = computed(() => {
  const product = d.value?.rhythm?.product || ''
  if (!/ghi\s*âm/i.test(product)) return null
  return {
    recId: `ielts:${d.value.week}:${d.value.n}`,
    label: product.replace(/\s+$/, ''),
    sentences: listenSentences.value,
  }
})

// Ngữ cảnh đưa cho AI để bám sát chủ đề + từ vựng + ngữ pháp của buổi học.
const aiContext = computed(() =>
  d.value
    ? {
        title: d.value.title,
        week: d.value.week,
        weekTitle: d.value.weekTitle,
        vocab: d.value.vocab.map((v) => v.term),
        phrases: d.value.phrases,
        grammar: d.value.grammar.map((g) => g.title),
      }
    : {},
)
</script>

<template>
  <div class="container day">
    <span class="back" @click="router.push({ name: 'ielts' })">← Lộ trình nền tảng · Tuần {{ week }}</span>

    <template v-if="d">
      <DayHeader
        :day="d"
        :plan="plan"
        :is-diagnostic="isDiagnostic"
        :agenda-count="agenda.length"
        :week-done-count="weekDoneCount"
        :ring-pct="ringPct"
        :is-done="isDone"
        :day-unlocked="dayUnlocked"
        @go-day="goDay"
      />

      <!-- TWO COLUMN -->
      <div class="two-col">
        <AgendaRail title="Buổi học hôm nay" subtitle="Nhẹ nhàng, làm lần lượt nhé" :items="agenda" />

        <div class="main">
          <!-- ════ 1) HỌC TỪ VỰNG (Presentation) ════ -->
          <!-- VOCAB (week) -->
          <section v-if="plan.vocab && (d.vocab.length || d.reviewVocab.length)" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">PHÒNG TỪ VỰNG · BƯỚC 1 HỌC TỪ</div>
                <h2 class="step-title">🗣️ Từ vựng buổi này</h2>
              </div>
            </div>
            <div class="vocab-grid">
              <VocabCard v-for="v in d.vocab" :key="v.term" :vocab="v" />
            </div>

            <!-- ÔN LẠI buổi trước -->
            <template v-if="d.reviewVocab.length">
              <div class="sub-head">🔁 Ôn lại từ buổi trước</div>
              <div class="vocab-grid">
                <VocabCard v-for="v in d.reviewVocab" :key="'r-' + v.term" :vocab="v" />
              </div>
            </template>

            <!-- CỤM DÙNG ĐƯỢC -->
            <template v-if="d.phrases.length">
              <div class="sub-head">💬 Cụm dùng được</div>
              <div class="phrase-wrap">
                <span v-for="(p, i) in d.phrases" :key="i" class="phrase-chip" @click="say(p)">{{ p }} 🔊</span>
              </div>
            </template>

            <!-- CÂU MẪU IELTS -->
            <template v-if="d.sentences.length">
              <div class="sub-head">📝 Câu mẫu IELTS</div>
              <ul class="sentence-list">
                <li v-for="(s, i) in d.sentences" :key="i" @click="say(s)">{{ s }} <span class="say-ico">🔊</span></li>
              </ul>
            </template>

            <button class="ghost-btn" @click="goTool('flashcard')">🃏 Luyện lại bằng Flashcard →</button>
          </section>

          <!-- ════ 2) NHỚ LẠI TỪ VỪA HỌC (active recall) ════ -->
          <!-- FLASHCARD — nhớ lại chủ động ngay sau khi học từ -->
          <InlineFlashcards v-if="plan.flashcards && d.vocab.length" :vocab="d.vocab" title="Nhớ nhanh từ vừa học" />

          <!-- ════ 3) HỌC NGỮ PHÁP (Presentation) ════ -->
          <GrammarSection
            :day="d"
            :plan="plan"
            :show-grammar-drills="showGrammarDrills"
            :grammar-gate-needed="grammarGateNeeded"
            :grammar-passed="grammarPassed"
          />

          <!-- ════ 5) ĐỌC & TÀI LIỆU (Input) ════ -->
          <!-- BÀI ĐỌC HIỂU — đoạn ngắn (input thật) + câu hỏi đọc hiểu -->
          <ReadingComprehension v-if="d.reading" :reading="d.reading" />

          <!-- BÀI NGHE HIỂU — nghe đoạn ngắn (tên & số) + câu hỏi -->
          <ListeningComprehension v-if="d.listening" :listening="d.listening" :week="d.week" />

          <!-- THANG NGHE "THẬT HÓA DẦN": gợi ý shadowing bán thực/clip gốc theo tuần -->
          <section v-if="showListeningUpgrade" class="step-card listening-upgrade">
            <div class="step-head">
              <div>
                <div class="eyebrow">{{ listeningStage.label }}</div>
                <h2 class="step-title">🎧 Nghe thật hơn tuần này</h2>
              </div>
            </div>
            <p class="quiz-intro">{{ listeningStage.goal }}</p>
            <button class="btn-shadow" @click="goShadowingForWeek">Xem bài shadowing gợi ý cho Tuần {{ d.week }} →</button>
          </section>

          <!-- BÀI GIẢNG & KHUNG MẪU — bài đọc, script nghe, khung Speaking/Writing… -->
          <section v-if="plan.reading && d.skills && d.skills.length" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">BÀI GIẢNG & KHUNG MẪU</div>
                <h2 class="step-title">📚 Tài liệu & thực hành của tuần</h2>
              </div>
            </div>
            <p class="quiz-intro">Bài đọc, script nghe và khung mẫu Speaking/Writing của tuần — phục vụ phần đọc/nghe của buổi hôm nay.</p>
            <details v-for="(sk, i) in d.skills" :key="i" class="skill-acc">
              <summary>{{ sk.title }}</summary>
              <div class="prose" v-html="sk.html"></div>
            </details>
          </section>

          <!-- LESSON SCRIPT (đọc/kịch bản) -->
          <section v-if="plan.reading && d.lessonScript" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">KỊCH BẢN BÀI HỌC</div>
                <h2 class="step-title">📝 {{ d.lessonScript.title }}</h2>
              </div>
            </div>
            <div class="prose" v-html="d.lessonScript.html"></div>
          </section>

          <!-- ════ 6) LUYỆN NGHE (Receptive practice) ════ -->
          <!-- LUYỆN NGHE — nghe & chép lại câu (kỹ năng Listening) -->
          <ListeningDictation v-if="plan.listening" :sentences="listenSentences" :week="d.week" />

          <!-- ════ 7) LUYỆN PHÁT ÂM (Productive — controlled) ════ -->
          <!-- LUYỆN PHÁT ÂM — nghe mẫu rồi đọc to, máy chấm (kỹ năng Pronunciation) -->
          <PronunciationDrill v-if="plan.pronunciation" :items="pronItems" :week="d.week" :vocab-terms="pronVocabTerms" />

          <!-- SẢN PHẨM — ghi âm "mốc 0" (đọc to, giữ lại để cuối khóa so sánh) -->
          <VoiceRecorder
            v-if="recordingTask"
            :rec-id="recordingTask.recId"
            :label="recordingTask.label"
            :sentences="recordingTask.sentences"
          />

          <!-- ════ 8) ĐẶT CÂU CÓ KHUNG (Production — guided) ════ -->
          <!-- ĐẶT CÂU — kho 100 câu mở đầu, viết tiếp cho đúng với mình + AI chữa -->
          <SentenceBankPractice v-if="plan.sentenceBank" :prompts="d.sentenceBank" :context="aiContext" />

          <!-- ════ 9) VIẾT ĐOẠN (Production — freer) ════ -->
          <!-- BÀI TẬP VIẾT — làm ngay tại bài (bắt buộc nộp để qua buổi) -->
          <WritingSection v-if="plan.writing && writingTask" :day="d" />

          <!-- AI CHAT — luyện giao tiếp -->
          <AiChat v-if="plan.aiChat" :context="aiContext" />

          <!-- QUIZ TỪ VỰNG — ÔN NHANH, không bắt buộc; ẩn ở buổi cuối (đã có quiz tổng hợp) -->
          <section v-if="plan.quiz && vocabQuiz.length && d.grammarMode !== 'final'" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow" :class="{ green: vocabPassed }">ÔN NHANH — TỰ CHỌN</div>
                <h2 class="step-title">❓ Ôn nhanh buổi {{ d.n }}</h2>
              </div>
              <span class="wt-badge" :class="{ ok: vocabPassed }">{{ vocabPassed ? '✅ Đã đạt' : 'Tự chọn' }}</span>
            </div>
            <p class="quiz-intro">{{ vocabQuiz.length }} câu trộn nhiều dạng — <b>chọn nghĩa</b>, <b>gõ từ</b> và <b>🧩 sắp xếp câu</b> — để ôn cho đỡ nhàm và cộng XP. <b>Không bắt buộc</b> để qua buổi.</p>
            <div class="grammar-drill">
              <QuizTool :questions="vocabQuiz" mode="practice" :pass-threshold="0.7" embedded @complete="onVocabComplete" />
            </div>
            <div v-if="vocabPassed" class="gate-line ok">✅ Bạn đã đạt quiz từ vựng.</div>
          </section>

          <!-- TỰ LUYỆN CUỐI TUẦN — quiz TỔNG HỢP MỚI (ngữ pháp + từ vựng cả tuần) -->
          <section v-if="d.weekPracticeQuiz && d.weekPracticeQuiz.length" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">TỰ LUYỆN CUỐI TUẦN</div>
                <h2 class="step-title">📋 Bài tập ôn tuần ({{ d.weekPracticeQuiz.length }} câu)</h2>
              </div>
            </div>
            <p class="quiz-intro">
              Bài tập <b>mới hoàn toàn</b>: điền chỗ trống, sửa câu và chọn nghĩa — gom cả <b>ngữ pháp</b> và
              <b>từ vựng cả tuần</b> (khác các quiz từng ngày). Tự luyện trước khi làm bài kiểm tra tuần (không bắt buộc).
            </p>
            <div class="grammar-drill">
              <QuizTool :questions="d.weekPracticeQuiz" mode="practice" embedded />
            </div>
          </section>

          <!-- MISSION TUẦN + BUỔI NÓI NGƯỜI THẬT — ngoài app, không do app chấm -->
          <MissionSection
            :day="d"
            :mission-needed="missionNeeded"
            :mission-done="missionDone"
            :real-talk-needed="realTalkNeeded"
            :real-talk-done="realTalkDone"
          />

          <!-- SỔ LỖI — tự gom lỗi thật từ bài AI đã chữa + ghi chú thêm -->
          <ErrorLedger :week="d.week" :day="d.n" :auto-errors="autoErrors" />

          <!-- BÀI KIỂM TRA TUẦN (lưu điểm) -->
          <WeekTestSection :day="d" :week-done-count="weekDoneCount" :week-test="weekTest" />

          <!-- CHECKPOINT NAV -->
          <section class="checkpoint" :class="{ done }">
            <div class="cp-emoji">{{ done ? '✅' : '🎯' }}</div>
            <div class="cp-text">
              <h3>{{ done ? `Đã hoàn thành buổi ${d.n}!` : `Hoàn thành buổi ${d.n} 🎉` }}</h3>
              <p v-if="!done">Làm xong các hoạt động của buổi (luyện ngữ pháp + nộp bài viết), rồi đánh dấu hoàn thành để nhận <b>+50 XP</b> và giữ streak.</p>
              <p v-else>Tuần {{ d.week }}: đã xong {{ weekDoneCount }}/{{ d.totalDays }} buổi. Xong cả tuần sẽ mở khóa tuần kế tiếp 🔓</p>
            </div>
            <div class="cp-cta">
              <button v-if="d.prevDay" class="outline-btn" @click="goDay(d.prevDay)">← Buổi {{ d.prevDay }}</button>
              <button v-if="!done" class="green-btn" :class="{ locked: !dayReady }" :disabled="!dayReady" @click="markDone">
                {{ nextGateLabel }}
              </button>
              <template v-else>
                <button class="outline-btn" @click="unmark">↩ Bỏ đánh dấu</button>
                <button v-if="d.nextDay" class="green-btn" @click="goDay(d.nextDay)">Buổi {{ d.nextDay }} →</button>
                <button v-else class="green-btn" @click="router.push({ name: 'ielts' })">Về bản đồ →</button>
              </template>
            </div>
          </section>
        </div>
      </div>

      <!-- KHẢO SÁT CẢM NHẬN CUỐI TUẦN -->
      <Transition name="wf-fade">
        <div v-if="showWeekSurvey" class="wf-overlay" @click.self="skipWeekSurvey">
          <div class="wf-card">
            <template v-if="!weekSurveySuggestion">
              <h3 class="wf-title">Tuần này với em thế nào?</h3>
              <div class="wf-options">
                <button class="wf-opt" @click="chooseWeekFeeling('easy')">
                  <span class="wf-emoji">😌</span><span>Dễ</span>
                </button>
                <button class="wf-opt" @click="chooseWeekFeeling('ok')">
                  <span class="wf-emoji">🙂</span><span>Vừa</span>
                </button>
                <button class="wf-opt" @click="chooseWeekFeeling('hard')">
                  <span class="wf-emoji">😵</span><span>Khó</span>
                </button>
              </div>
              <textarea
                v-model="weekSurveyNote"
                class="wf-note"
                rows="2"
                placeholder="Ghi chú thêm (không bắt buộc)…"
              ></textarea>
              <button class="wf-skip" @click="skipWeekSurvey">Bỏ qua</button>
            </template>
            <template v-else-if="weekSurveySuggestion === 'remedial'">
              <h3 class="wf-title">🩹 Ôn lại trước khi qua tuần mới nhé</h3>
              <p class="wf-desc">
                Bài kiểm tra Tuần {{ d.week }} mới đạt {{ weekTest?.pct }}% — ôn lại câu sai sẽ giúp tuần sau nhẹ hơn hẳn.
              </p>
              <div class="wf-actions">
                <button class="wf-primary" @click="goRemedialFromSurvey">Ôn ngay →</button>
                <button class="wf-skip" @click="closeWeekSurvey">Để sau</button>
              </div>
            </template>
            <template v-else>
              <h3 class="wf-title">🚀 Học nhanh đấy!</h3>
              <p class="wf-desc">
                Điểm kiểm tra Tuần {{ d.week }} đạt {{ weekTest?.pct }}% — thử sang Tuần {{ Number(d.week) + 1 }} sớm xem sao?
              </p>
              <div class="wf-actions">
                <button class="wf-primary" @click="goAheadFromSurvey">Sang Tuần {{ Number(d.week) + 1 }} →</button>
                <button class="wf-skip" @click="closeWeekSurvey">Để sau</button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </template>

    <div v-else class="empty">
      <h2>Chưa có nội dung cho buổi này</h2>
      <p>Tuần {{ week }} · Buổi {{ day }} không tìm thấy trong dữ liệu khóa học.</p>
      <button class="green-btn" @click="router.push({ name: 'ielts' })">← Về bản đồ IELTS</button>
    </div>
  </div>
</template>

<style scoped src="@/components/day/ieltsDaySection.css"></style>
<style scoped>
.day {
  padding: 26px var(--space-page-x) 70px;
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
.listening-upgrade {
  background: linear-gradient(135deg, #f4f3fb, #fff);
}
[data-theme='dark'] .listening-upgrade {
  background: var(--bg-accent);
}
.btn-shadow {
  margin-top: 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  background: var(--grad-purple);
  padding: 11px 20px;
  border-radius: 12px;
}

/* accordion bài giảng & khung mẫu */
.skill-acc {
  margin-top: 14px;
  border: 1px solid rgba(0, 214, 143, 0.18);
  border-radius: 14px;
  padding: 4px 16px;
  background: var(--surface-1);
}
.skill-acc + .skill-acc {
  margin-top: 10px;
}
.skill-acc > summary {
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
  padding: 12px 0;
  list-style: none;
}
.skill-acc > summary::-webkit-details-marker {
  display: none;
}
.skill-acc > summary::before {
  content: '▸ ';
  color: #00a86f;
  font-weight: 900;
}
.skill-acc[open] > summary::before {
  content: '▾ ';
}
.skill-acc[open] > summary {
  border-bottom: 1px solid rgba(0, 214, 143, 0.14);
  margin-bottom: 8px;
}

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
  background: rgba(0, 214, 143, 0.1);
  border: 1px solid rgba(0, 214, 143, 0.22);
  color: #00966a;
  font-size: 13.5px;
  font-weight: 700;
  padding: 7px 13px;
  border-radius: 99px;
  cursor: pointer;
  transition: background 0.15s;
}
@media (hover: hover) {
  .phrase-chip:hover {
    background: rgba(0, 214, 143, 0.18);
  }
}
.phrase-chip:active {
  background: rgba(0, 214, 143, 0.24);
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
  transition: border-color 0.15s;
}
@media (hover: hover) {
  .sentence-list li:hover {
    border-color: rgba(0, 214, 143, 0.4);
  }
}
.sentence-list li:active {
  border-color: rgba(0, 214, 143, 0.6);
  background: var(--surface-1, var(--bg));
}
.say-ico {
  opacity: 0.6;
  font-size: 12px;
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
  background: var(--surface);
  transition: background 0.15s;
}
@media (hover: hover) {
  .ghost-btn:hover {
    background: #e6fbf2;
  }
}
.ghost-btn:active {
  background: #d3f7e6;
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

/* khảo sát cảm nhận cuối tuần */
.wf-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(30, 30, 46, 0.5);
  backdrop-filter: blur(6px);
}
.wf-card {
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  border-radius: 22px;
  padding: 28px 26px 24px;
  text-align: center;
  box-shadow: 0 30px 70px rgba(30, 30, 46, 0.32);
}
.wf-title {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.3px;
}
.wf-desc {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--slate);
  margin: 10px 0 0;
}
.wf-options {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.wf-opt {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line);
  background: var(--surface-1);
  border-radius: 14px;
  padding: 14px 6px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
}
@media (hover: hover) {
  .wf-opt:hover {
    transform: translateY(-2px);
    background: var(--bg-accent);
  }
}
.wf-opt:active {
  transform: translateY(-1px) scale(0.98);
  background: var(--bg-accent);
}
.wf-emoji {
  font-size: 26px;
  line-height: 1;
}
.wf-note {
  width: 100%;
  margin-top: 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  background: var(--surface);
  color: var(--ink);
}
.wf-skip {
  display: block;
  margin: 14px auto 0;
  border: none;
  background: none;
  color: var(--muted-2);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.wf-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 18px;
}
.wf-primary {
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  padding: 13px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #00d68f, #00a86f);
  box-shadow: 0 12px 26px rgba(0, 214, 143, 0.3);
}
.wf-fade-enter-active,
.wf-fade-leave-active {
  transition: opacity 0.2s ease;
}
.wf-fade-enter-from,
.wf-fade-leave-to {
  opacity: 0;
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
