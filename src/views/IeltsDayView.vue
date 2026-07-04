<script setup>
import { computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AgendaRail from '@/components/day/AgendaRail.vue'
import VocabCard from '@/components/day/VocabCard.vue'
import AiChat from '@/components/day/AiChat.vue'
import QuizTool from '@/components/tools/QuizTool.vue'
import ProgressRing from '@/components/common/ProgressRing.vue'
import InlineFlashcards from '@/components/day/InlineFlashcards.vue'
import ErrorLedger from '@/components/day/ErrorLedger.vue'
import ListeningDictation from '@/components/day/ListeningDictation.vue'
import ReadingComprehension from '@/components/day/ReadingComprehension.vue'
import ListeningComprehension from '@/components/day/ListeningComprehension.vue'
import PronunciationDrill from '@/components/day/PronunciationDrill.vue'
import SentenceBankPractice from '@/components/day/SentenceBankPractice.vue'
import VoiceRecorder from '@/components/day/VoiceRecorder.vue'
import { getIeltsDay } from '@/data/courseIelts'
import { planFromChecklist } from '@/lib/dayPlan'
import { listeningStageOf, listeningStageInfo } from '@/data/ieltsListeningStage'
import { speak } from '@/lib/speak'
import { correctWriting } from '@/lib/aiChat'
import { friendlyAiError } from '@/lib/aiError'

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
function onGrammarComplete(r) {
  if (d.value) user.recordGrammarDay('ielts', d.value.week, d.value.n, r.score, r.total, 0.7)
}

// —— Bài tập VIẾT làm ngay tại bài (vd "Viết 10 câu…") ——
const writingTask = computed(() => d.value?.writingTask || null)
const writingNeeded = computed(() => plan.value.writing && !!writingTask.value)
const writingText = ref('')
// Nạp bản nháp đã lưu khi đổi buổi.
watch(
  d,
  (cur) => {
    if (cur) writingText.value = user.writingOf('ielts', cur.week, cur.n)?.text || ''
  },
  { immediate: true },
)
// Số câu cần viết lấy từ đề ("Viết 10 câu" -> 10), kẹp 3..20.
const requiredSentences = computed(() => {
  const m = /(\d+)\s*câu/i.exec(writingTask.value?.prompt || '')
  return m ? Math.min(Math.max(Number(m[1]), 3), 20) : 3
})
// Đếm câu đã viết: tách theo dòng / dấu kết câu, mỗi câu phải có ≥ 2 từ.
const writtenCount = computed(
  () =>
    writingText.value
      .split(/[\n.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.split(/\s+/).filter(Boolean).length >= 2).length,
)
const writingMet = computed(() => writtenCount.value >= requiredSentences.value)
const writingDone = computed(
  () => !writingNeeded.value || (!!d.value && user.writingDone('ielts', d.value.week, d.value.n)),
)
// Kết quả AI chữa bài (đã lưu) của ngày hiện tại.
const writingReview = computed(() => (d.value ? user.writingOf('ielts', d.value.week, d.value.n)?.review : null))
const reviewing = ref(false) // đang gọi AI
const reviewError = ref('')

function saveWritingDraft() {
  if (d.value) user.saveWriting('ielts', d.value.week, d.value.n, writingText.value, false)
}

// —— GIÀN GIÁO cho bài viết: người mới không phải viết từ con số 0 ——
// Mẫu để bắt chước = câu đúng của ngữ pháp hôm nay; khung câu = kho câu mở đầu.
const writingModel = computed(() => (d.value?.grammarExamples || []).slice(0, 3))
const writingFrames = computed(() => (d.value?.sentenceBank || []).slice(0, 6))
const LINK_WORDS = ['and', 'but', 'because', 'so', 'also', 'then']
// Chèn một câu/khung xuống dòng mới trong ô viết (rồi học viên sửa cho đúng với mình).
function insertWriting(text) {
  const clean = String(text || '').replace(/[….]+\s*$/, '').trim()
  const cur = writingText.value
  writingText.value = !cur ? clean : cur.replace(/\s*$/, '') + '\n' + clean
  saveWritingDraft()
}
// Chèn từ nối vào cuối câu đang viết.
function appendWord(w) {
  writingText.value = (writingText.value.replace(/\s*$/, '') + ' ' + w + ' ').replace(/[ \t]+/g, ' ')
  saveWritingDraft()
}
// Nộp bài -> nhờ AI chữa từng câu; chữa xong mới tính là hoàn thành bài viết.
async function askAiCorrect() {
  if (!d.value || !writingMet.value || reviewing.value) return
  reviewing.value = true
  reviewError.value = ''
  try {
    const review = await correctWriting(writingText.value, {
      title: d.value.title,
      week: d.value.week,
      weekTitle: d.value.weekTitle,
      grammar: d.value.grammar.map((g) => g.title),
      vocab: d.value.vocab.map((v) => v.term),
    })
    if (!review) throw new Error('AI chưa trả về kết quả. Thử lại nhé.')
    user.saveWriting('ielts', d.value.week, d.value.n, writingText.value, true, review)
  } catch (e) {
    reviewError.value = friendlyAiError(e).message
  } finally {
    reviewing.value = false
  }
}

// Gạch chân chủ ngữ (1 gạch) + động từ (2 gạch) trong câu AI đã sửa — thay cho
// việc "gạch chân" không làm được trong ô viết. subject/verb là substring của corrected.
function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function svHtml(l) {
  const text = l?.corrected || ''
  const marks = []
  for (const [field, cls] of [['subject', 'u-subj'], ['verb', 'u-verb']]) {
    const frag = (l?.[field] || '').trim()
    if (!frag) continue
    const start = text.indexOf(frag)
    if (start >= 0) marks.push({ start, end: start + frag.length, cls })
  }
  marks.sort((a, b) => a.start - b.start)
  // bỏ phần chồng lấn để không lồng thẻ
  const clean = []
  let lastEnd = -1
  for (const mk of marks) {
    if (mk.start >= lastEnd) {
      clean.push(mk)
      lastEnd = mk.end
    }
  }
  let out = ''
  let pos = 0
  for (const mk of clean) {
    out += escapeHtml(text.slice(pos, mk.start))
    out += `<span class="${mk.cls}">${escapeHtml(text.slice(mk.start, mk.end))}</span>`
    pos = mk.end
  }
  out += escapeHtml(text.slice(pos))
  return out
}

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
// Chỉ mở bài kiểm tra tuần khi đã hoàn thành tất cả các buổi trong tuần.
const weekComplete = computed(() => !!d.value && weekDoneCount.value >= d.value.totalDays)
function goWeekTest() {
  if (d.value && weekComplete.value) router.push({ name: 'assessment', params: { course: 'ielts', scope: `week-${d.value.week}` } })
}
// Kết quả bài kiểm tra tuần (nếu đã làm) để hiện trên thẻ CTA.
const weekTest = computed(() => (d.value ? user.quizOf('ielts', `week:${d.value.week}`) : null))

// —— MISSION TUẦN (real-life, ngoài app) ——
// Mô tả mission lấy trực tiếp từ checklist ngày (bullet "🌍 Mission tuần…: …"),
// không soạn riêng ở tầng dữ liệu — tránh trùng 2 nguồn sự thật.
const missionText = computed(() => {
  if (!d.value) return ''
  const item = (d.value.checklist || []).find((c) => /🌍|mission\s*tuần/i.test(c))
  if (!item) return ''
  return item.replace(/^.*?mission\s*tuần[^:]*:\s*/i, '').replace(/^🌍\s*/, '').trim() || item
})
const missionNeeded = computed(() => plan.value.mission && !!missionText.value)
const missionNote = ref('')
watch(
  d,
  (cur) => {
    if (cur) missionNote.value = user.missionOf('ielts', cur.week, cur.n)?.note || ''
  },
  { immediate: true },
)
const missionDone = computed(() => !!d.value && user.missionDone('ielts', d.value.week, d.value.n))
function saveMissionDraft() {
  if (d.value) user.saveMission('ielts', d.value.week, d.value.n, missionNote.value, false)
}
function toggleMissionDone(ev) {
  if (!d.value) return
  user.saveMission('ielts', d.value.week, d.value.n, missionNote.value, !!ev.target.checked)
}

// —— BUỔI NÓI NGƯỜI THẬT (2 tuần/lần, từ Tuần 3) ——
// Cùng cơ chế với Mission: lấy mô tả từ bullet checklist "🗣️ Buổi nói người
// thật…: …", ghi chú là 3 dòng sổ lỗi đời thực sau buổi nói.
const realTalkText = computed(() => {
  if (!d.value) return ''
  const item = (d.value.checklist || []).find((c) => /🗣️|buổi nói người thật/i.test(c))
  if (!item) return ''
  return item.replace(/^.*?buổi nói người thật[^:]*:\s*/i, '').replace(/^🗣️\s*/, '').trim() || item
})
const realTalkNeeded = computed(() => plan.value.realTalk && !!realTalkText.value)
const realTalkNote = ref('')
watch(
  d,
  (cur) => {
    if (cur) realTalkNote.value = user.realTalkOf('ielts', cur.week, cur.n)?.note || ''
  },
  { immediate: true },
)
const realTalkDone = computed(() => !!d.value && user.realTalkDone('ielts', d.value.week, d.value.n))
function saveRealTalkDraft() {
  if (d.value) user.saveRealTalk('ielts', d.value.week, d.value.n, realTalkNote.value, false)
}
function toggleRealTalkDone(ev) {
  if (!d.value) return
  user.saveRealTalk('ielts', d.value.week, d.value.n, realTalkNote.value, !!ev.target.checked)
}

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
            <span class="meta-chip">🧱 Tuần nền tảng</span>
            <span v-if="agenda.length" class="meta-chip">✅ {{ agenda.length }} hoạt động</span>
            <span v-if="plan.vocab && d.vocab.length" class="meta-chip">🗣️ {{ d.vocab.length + d.reviewVocab.length }} từ</span>
            <span v-if="d.milestone" class="meta-chip">🎯 Mốc tuần: {{ d.milestone }}</span>
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
          :class="{ on: dd.n === d.n, done: isDone(dd.n), locked: !dayUnlocked(dd.n) }"
          :disabled="!dayUnlocked(dd.n)"
          @click="goDay(dd.n)"
        >
          <span v-if="isDone(dd.n)" class="chip-tick">✓</span>
          <span v-else-if="!dayUnlocked(dd.n)" class="chip-tick">🔒</span>Buổi {{ dd.n }}
        </button>
      </div>

      <!-- BANNER CHẨN ĐOÁN ĐẦU VÀO — chỉ ở Tuần 1 · Buổi 1 -->
      <section v-if="isDiagnostic" class="diag-card">
        <div class="diag-ico">🩺</div>
        <div class="diag-body">
          <h3>Buổi chẩn đoán đầu vào — "mốc 0"</h3>
          <p>
            Hôm nay <b>không phải để lấy điểm cao</b>, mà để ghi lại <b>điểm xuất phát</b> của em. Hãy làm thật hai việc:
            (1) <b>viết</b> bài về bản thân rồi nhờ AI chấm — điểm &amp; trình độ <b>CEFR</b> AI đưa ra chính là mốc 0;
            (2) <b>ghi âm</b> đọc to 5 câu để giữ lại. Cuối khóa em sẽ mở lại "mốc 0" này và thấy mình tiến bộ tới đâu.
          </p>
        </div>
      </section>

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
          <!-- GRAMMAR (theo ngày: điểm mới / ôn tập / tổng hợp cuối tuần) -->
          <section v-if="plan.grammar && d.grammar.length" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">{{ d.grammarMode === 'new' ? 'NGỮ PHÁP HÔM NAY' : d.grammarMode === 'final' ? 'TỔNG HỢP NGỮ PHÁP TUẦN' : 'ÔN TẬP NGỮ PHÁP' }}</div>
                <h2 class="step-title">
                  {{ d.grammarMode === 'new' ? '📖 Điểm ngữ pháp của buổi' : d.grammarMode === 'final' ? '🧩 Ôn lại toàn bộ ngữ pháp tuần' : '🔁 Ôn lại ngữ pháp đã học' }}
                </h2>
              </div>
            </div>
            <p v-if="d.grammarMode !== 'new'" class="quiz-intro">
              {{ d.grammarMode === 'final' ? 'Buổi cuối tuần — xâu chuỗi lại tất cả điểm ngữ pháp trước khi làm bài kiểm tra tuần.' : 'Hôm nay không có điểm mới — ôn lại cho nhớ rồi luyện tập bên dưới.' }}
            </p>
            <div v-for="(g, i) in d.grammar" :key="i" class="grammar-block">
              <h3 class="grammar-title">{{ g.title }}</h3>
              <div class="prose" v-html="g.html"></div>
            </div>
          </section>

          <!-- LUYỆN TẬP NGỮ PHÁP — bắt buộc ở ngày học MỚI; ngày ôn là tự chọn -->
          <section v-if="showGrammarDrills" class="step-card" :class="{ current: grammarGateNeeded && !grammarPassed }">
            <div class="step-head">
              <div>
                <div class="eyebrow" :class="{ green: grammarPassed }">{{ grammarGateNeeded ? 'LUYỆN TẬP — VẬN DỤNG NGAY' : 'ÔN LẠI — TỰ CHỌN' }}</div>
                <h2 class="step-title">✏️ Bài tập ngữ pháp ({{ grammarDrills.length }} câu)</h2>
              </div>
              <span class="wt-badge" :class="{ ok: grammarPassed }">{{ grammarGateNeeded ? (grammarPassed ? '✅ Đã đạt' : 'Cần ≥70%') : 'Tự chọn' }}</span>
            </div>
            <p v-if="grammarGateNeeded" class="quiz-intro">Điền chỗ trống và sửa câu sai. <b>Đạt từ 70%</b> để hoàn thành buổi và mở buổi kế tiếp.</p>
            <p v-else class="quiz-intro">Ôn lại điểm ngữ pháp đã học cho nhớ — <b>không bắt buộc</b> để qua buổi.</p>
            <div class="grammar-drill">
              <QuizTool :questions="grammarDrills" mode="practice" :pass-threshold="0.7" embedded @complete="onGrammarComplete" />
            </div>
            <div v-if="grammarGateNeeded && grammarPassed" class="gate-line ok">✅ Bạn đã đạt phần luyện tập.</div>
            <div v-else-if="grammarGateNeeded" class="gate-line">🔒 Đạt ≥70% phần luyện tập để hoàn thành buổi.</div>
          </section>

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
          <PronunciationDrill v-if="plan.pronunciation" :items="pronItems" :week="d.week" />

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
          <section v-if="plan.writing && writingTask" class="step-card" :class="{ current: !writingDone }">
            <div class="step-head">
              <div>
                <div class="eyebrow" :class="{ green: writingDone }">LÀM NGAY TẠI BÀI</div>
                <h2 class="step-title">✍️ Bài tập viết</h2>
              </div>
              <span class="wt-badge" :class="{ ok: writingDone }">{{ writingDone ? '✅ Đã nộp' : `${writtenCount}/${requiredSentences} câu` }}</span>
            </div>
            <p class="quiz-intro">{{ writingTask.prompt }}</p>

            <!-- GIÀN GIÁO — giúp người mới bắt đầu, không phải nghĩ từ con số 0 -->
            <div class="wt-scaffold">
              <div v-if="writingModel.length" class="wt-help">
                <div class="wt-help-label">📖 Viết giống mẫu này (bấm để chèn):</div>
                <ul class="wt-model">
                  <li v-for="(m, i) in writingModel" :key="i" @click="insertWriting(m)">
                    <span>{{ m }}</span><span class="wt-ins">+ chèn</span>
                  </li>
                </ul>
              </div>
              <div v-if="writingFrames.length" class="wt-help">
                <div class="wt-help-label">💡 Bí ý? Bấm một khung câu rồi viết tiếp cho đúng với em:</div>
                <div class="wt-frames">
                  <button v-for="(f, i) in writingFrames" :key="i" class="wt-frame" @click="insertWriting(f)">
                    {{ f.replace(/[….]+\s*$/, '') }}…
                  </button>
                </div>
              </div>
              <div class="wt-help">
                <div class="wt-help-label">🔗 Từ nối cho câu mượt hơn:</div>
                <div class="wt-frames">
                  <button v-for="(w, i) in LINK_WORDS" :key="i" class="wt-link" @click="appendWord(w)">{{ w }}</button>
                </div>
              </div>
            </div>

            <textarea
              v-model="writingText"
              class="write-area"
              rows="8"
              placeholder="Bấm một câu mẫu hoặc khung câu ở trên để bắt đầu, rồi sửa cho đúng với em…"
              @change="saveWritingDraft"
            ></textarea>
            <div class="write-foot">
              <span class="write-count" :class="{ ok: writingMet }">✍️ {{ writtenCount }}/{{ requiredSentences }} câu</span>
              <button
                class="green-btn"
                :class="{ locked: !writingMet || reviewing }"
                :disabled="!writingMet || reviewing"
                @click="askAiCorrect"
              >
                {{ reviewing ? '🤖 AI đang chữa…' : writingDone ? '↻ Nhờ AI chữa lại' : writingMet ? '🤖 Nhờ AI chữa bài' : `Cần thêm ${Math.max(0, requiredSentences - writtenCount)} câu` }}
              </button>
            </div>
            <div v-if="reviewError" class="rev-error">⚠️ {{ reviewError }}</div>

            <!-- KẾT QUẢ AI CHỮA BÀI -->
            <div v-if="writingReview" class="review">
              <div class="rev-top">
                <span class="rev-cefr">{{ writingReview.cefr || '—' }}</span>
                <div class="rev-score-wrap">
                  <div class="rev-score-bar"><div class="rev-score-fill" :style="{ width: (writingReview.score || 0) + '%' }"></div></div>
                  <span class="rev-score-num">{{ writingReview.score ?? 0 }}/100</span>
                </div>
              </div>
              <p v-if="writingReview.summary" class="rev-summary">{{ writingReview.summary }}</p>
              <div class="rev-legend">Gạch chân: <span class="u-subj">chủ ngữ</span> · <span class="u-verb">động từ</span></div>
              <ul class="rev-lines">
                <li v-for="(l, i) in writingReview.lines || []" :key="i" class="rev-line" :class="{ ok: l.ok }">
                  <div v-if="!l.ok && l.corrected !== l.original" class="rev-orig"><s>{{ l.original }}</s></div>
                  <div class="rev-corr"><span class="rev-mark">{{ l.ok ? '✓' : '✕' }}</span><span v-html="svHtml(l)"></span></div>
                  <div v-if="l.note" class="rev-note">💡 {{ l.note }}</div>
                </li>
              </ul>
            </div>
          </section>

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

          <!-- MISSION TUẦN — nhiệm vụ NGOÀI app, có rủi ro thật, không do app chấm -->
          <section v-if="missionNeeded" class="step-card mission-card" :class="{ current: !missionDone }">
            <div class="step-head">
              <div>
                <div class="eyebrow" :class="{ green: missionDone }">NGOÀI APP · CÓ RỦI RO THẬT</div>
                <h2 class="step-title">🌍 Mission tuần</h2>
              </div>
              <span class="wt-badge" :class="{ ok: missionDone }">{{ missionDone ? '✅ Đã hoàn thành' : '+150 XP' }}</span>
            </div>
            <p class="quiz-intro">{{ missionText }}</p>
            <textarea
              v-model="missionNote"
              class="write-area mission-note"
              rows="3"
              placeholder="Dán link / ghi chú bằng chứng (ảnh chụp, đoạn chat, email đã gửi…)…"
              @change="saveMissionDraft"
            ></textarea>
            <label class="mission-check">
              <input type="checkbox" :checked="missionDone" @change="toggleMissionDone" />
              <span>Em đã làm mission này ngoài đời thật</span>
            </label>
          </section>

          <!-- BUỔI NÓI NGƯỜI THẬT — 2 tuần/lần từ Tuần 3, không do app chấm -->
          <section v-if="realTalkNeeded" class="step-card mission-card" :class="{ current: !realTalkDone }">
            <div class="step-head">
              <div>
                <div class="eyebrow" :class="{ green: realTalkDone }">NGOÀI APP · CÓ RỦI RO THẬT</div>
                <h2 class="step-title">🗣️ Buổi nói người thật</h2>
              </div>
              <span class="wt-badge" :class="{ ok: realTalkDone }">{{ realTalkDone ? '✅ Đã hoàn thành' : '+100 XP' }}</span>
            </div>
            <p class="quiz-intro">{{ realTalkText }}</p>
            <textarea
              v-model="realTalkNote"
              class="write-area mission-note"
              rows="3"
              placeholder="Sổ lỗi đời thực sau buổi nói: 1 câu bí, 1 từ không nghe ra, 1 điều làm tốt…"
              @change="saveRealTalkDraft"
            ></textarea>
            <label class="mission-check">
              <input type="checkbox" :checked="realTalkDone" @change="toggleRealTalkDone" />
              <span>Em đã nói chuyện với người thật buổi này</span>
            </label>
          </section>

          <!-- SỔ LỖI — tự gom lỗi thật từ bài AI đã chữa + ghi chú thêm -->
          <ErrorLedger :week="d.week" :day="d.n" :auto-errors="autoErrors" />

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
            <button class="green-btn" :class="{ locked: !weekComplete }" :disabled="!weekComplete" @click="goWeekTest">
              {{ weekComplete ? `🎯 ${weekTest ? 'Làm lại bài kiểm tra' : 'Làm bài kiểm tra tuần'} →` : '🔒 Làm bài kiểm tra tuần' }}
            </button>
            <p v-if="!weekComplete" class="wt-lock-hint">
              Hoàn thành cả {{ d.totalDays }} buổi trong tuần để mở khóa ({{ weekDoneCount }}/{{ d.totalDays }} buổi)
            </p>
          </section>

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

/* banner chẩn đoán đầu vào (Tuần 1 · Buổi 1) */
.diag-card {
  margin-top: 18px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: linear-gradient(135deg, #fff7e8, #fff1f1);
  border: 1px solid rgba(255, 176, 32, 0.35);
  border-left: 4px solid #ffb020;
  border-radius: 18px;
  padding: 18px 22px;
}
.diag-ico {
  font-size: 30px;
  line-height: 1;
  flex: none;
}
.diag-body h3 {
  font-size: 16.5px;
  font-weight: 800;
  color: #7a5200;
  letter-spacing: -0.3px;
}
.diag-body p {
  font-size: 14.5px;
  line-height: 1.6;
  color: #6a5a3a;
  margin-top: 6px;
}
.diag-body b {
  color: #5a4300;
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
.day-chip.locked {
  border-color: rgba(0, 0, 0, 0.08);
  background: #f1f1f6;
  color: #b0b0c0;
  cursor: not-allowed;
}
.day-chip.locked:hover {
  background: #f1f1f6;
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
.listening-upgrade {
  background: linear-gradient(135deg, #f4f3fb, #fff);
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
.check-item {
  cursor: pointer;
  border-radius: 10px;
  padding: 4px 8px;
  margin: 0 -8px;
  transition: background 0.12s;
  user-select: none;
}
.check-item:hover {
  background: rgba(0, 214, 143, 0.06);
}
.check-item.ticked {
  color: #00966a;
}
.check-item.ticked .tick {
  color: #00a86f;
}
.check-item.locked {
  cursor: default;
  opacity: 0.85;
}
.check-item.locked:hover {
  background: transparent;
}

/* accordion bài giảng & khung mẫu */
.skill-acc {
  margin-top: 14px;
  border: 1px solid rgba(0, 214, 143, 0.18);
  border-radius: 14px;
  padding: 4px 16px;
  background: #fbfffd;
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
.grammar-drill {
  margin-top: 18px;
  background: var(--bg);
  border: 1px solid rgba(108, 92, 231, 0.12);
  border-radius: 16px;
  padding: 18px 20px;
}
.wt-scaffold {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--purple-soft);
  border: 1px solid rgba(108, 92, 231, 0.15);
  border-radius: 14px;
  padding: 16px;
}
.wt-help-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--slate);
  margin-bottom: 8px;
}
.wt-model {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wt-model li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 14px;
  color: var(--ink);
  cursor: pointer;
  transition: border-color 0.15s;
}
.wt-model li:hover {
  border-color: var(--purple);
}
.wt-ins {
  font-size: 11.5px;
  font-weight: 800;
  color: var(--purple);
  white-space: nowrap;
}
.wt-frames {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.wt-frame,
.wt-link {
  border: 1px solid rgba(108, 92, 231, 0.3);
  background: #fff;
  color: var(--purple-deep);
  border-radius: 99px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.wt-frame:hover,
.wt-link:hover {
  background: var(--purple-soft);
}
.wt-link {
  border-color: rgba(0, 184, 217, 0.4);
  color: #0a7c93;
}
.wt-link:hover {
  background: rgba(0, 184, 217, 0.08);
}

.write-area {
  width: 100%;
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1.5px solid rgba(0, 214, 143, 0.25);
  font-size: 15px;
  line-height: 1.6;
  font-family: inherit;
  color: var(--ink);
  background: #fff;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s;
}
.write-area:focus {
  border-color: var(--green);
}
.write-area[readonly] {
  background: rgba(0, 214, 143, 0.05);
  border-color: rgba(0, 214, 143, 0.3);
}
.write-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.write-count {
  font-size: 13.5px;
  font-weight: 800;
  color: #8a8aa0;
}
.write-count.ok {
  color: #00a86f;
}
.rev-error {
  margin-top: 12px;
  font-size: 13.5px;
  font-weight: 700;
  color: #e04848;
  background: rgba(255, 90, 90, 0.08);
  border-radius: 12px;
  padding: 10px 14px;
}
.review {
  margin-top: 18px;
  border-top: 1px solid rgba(108, 92, 231, 0.1);
  padding-top: 18px;
}
.rev-top {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.rev-cefr {
  background: var(--grad-purple);
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  padding: 6px 14px;
  border-radius: 99px;
  flex: none;
}
.rev-score-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 160px;
}
.rev-score-bar {
  flex: 1;
  height: 8px;
  border-radius: 99px;
  background: #ececf5;
  overflow: hidden;
}
.rev-score-fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #00d68f, #00a86f);
  transition: width 0.4s;
}
.rev-score-num {
  font-size: 13px;
  font-weight: 800;
  color: #00966a;
  flex: none;
}
.rev-summary {
  margin-top: 12px;
  font-size: 14.5px;
  line-height: 1.6;
  color: #4a4a62;
  background: var(--bg);
  border-left: 3px solid var(--purple);
  border-radius: 12px;
  padding: 12px 15px;
}
.rev-lines {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rev-line {
  border: 1px solid rgba(255, 107, 107, 0.25);
  background: rgba(255, 90, 90, 0.04);
  border-radius: 12px;
  padding: 11px 14px;
}
.rev-line.ok {
  border-color: rgba(0, 214, 143, 0.25);
  background: rgba(0, 214, 143, 0.05);
}
.rev-legend {
  margin-top: 12px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.rev-orig {
  font-size: 13.5px;
  line-height: 1.5;
  color: #b0b0c0;
}
.rev-orig s {
  text-decoration-color: rgba(255, 107, 107, 0.6);
}
.rev-mark {
  font-weight: 900;
  color: #e04848;
  margin-right: 7px;
}
.rev-line.ok .rev-mark {
  color: #00a86f;
}
.rev-corr {
  font-size: 15.5px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.7;
}
/* gạch chân: chủ ngữ 1 gạch, động từ 2 gạch */
.u-subj {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  text-decoration-color: var(--purple);
}
.u-verb {
  text-decoration: underline double;
  text-underline-offset: 3px;
  text-decoration-color: #00a86f;
}
.rev-note {
  margin-top: 6px;
  font-size: 13.5px;
  line-height: 1.55;
  color: #7a7a92;
}
.gate-line {
  margin-top: 16px;
  font-size: 13.5px;
  font-weight: 700;
  color: #8a8aa0;
  background: #f1f1f6;
  border-radius: 12px;
  padding: 11px 15px;
}
.gate-line.ok {
  color: #00966a;
  background: rgba(0, 214, 143, 0.1);
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
.phrase-chip:hover {
  background: rgba(0, 214, 143, 0.18);
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
  color: #4a4a62;
  background: var(--bg);
  border: 1px solid rgba(108, 92, 231, 0.08);
  border-radius: 12px;
  padding: 11px 15px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.sentence-list li:hover {
  border-color: rgba(0, 214, 143, 0.4);
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
.mission-card {
  border: 1.5px solid rgba(255, 176, 32, 0.3);
  background: linear-gradient(135deg, #fffaf0, #fff);
}
.mission-card.current {
  border: 2px solid #ffb020;
  box-shadow: 0 18px 44px rgba(255, 176, 32, 0.16);
}
.mission-note {
  margin-top: 14px;
  min-height: 70px;
}
.mission-check {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  font-weight: 700;
  color: #7a5200;
  cursor: pointer;
}
.mission-check input {
  width: 18px;
  height: 18px;
  accent-color: #ffb020;
  cursor: pointer;
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
.green-btn.locked {
  background: #c4d8cf;
  box-shadow: none;
  cursor: not-allowed;
}
.green-btn.locked:hover {
  transform: none;
}
.wt-lock-hint {
  font-size: 12.5px;
  font-weight: 700;
  color: #8a8aa0;
  margin-top: 10px;
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
  background: #fff;
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
  border: 1px solid #e6e6f0;
  background: #fafafe;
  border-radius: 14px;
  padding: 14px 6px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
}
.wf-opt:hover {
  transform: translateY(-2px);
  background: #f1f1fb;
}
.wf-emoji {
  font-size: 26px;
  line-height: 1;
}
.wf-note {
  width: 100%;
  margin-top: 14px;
  border: 1px solid #e6e6f0;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13.5px;
  font-family: inherit;
  resize: vertical;
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
