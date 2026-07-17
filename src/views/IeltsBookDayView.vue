<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import VocabCard from '@/components/day/VocabCard.vue'
import InlineFlashcards from '@/components/day/InlineFlashcards.vue'
import TypedCheckList from '@/components/day/TypedCheckList.vue'
import ReadingHomework from '@/components/day/ReadingHomework.vue'
import PronunciationCheck from '@/components/day/PronunciationCheck.vue'
import DictationCloze from '@/components/day/DictationCloze.vue'
import QuizTool from '@/components/tools/QuizTool.vue'
import { getBookDay, computeIeltsBookProgress, isBookDayUnlocked, IELTS_BOOK_WEEK } from '@/data/ieltsBook'
import { speak } from '@/lib/speak'
import { hapticSuccess } from '@/lib/haptics'

const props = defineProps({ week: [String, Number], day: [String, Number] })
const router = useRouter()
const user = useUserStore()

const d = computed(() => getBookDay(props.day))
const say = (t) => speak(t)

const bookProgress = computed(() => computeIeltsBookProgress(user.completed.ielts || []))
const done = computed(() => !!d.value && user.isDone('ielts', IELTS_BOOK_WEEK, d.value.n))

// —— Thẻ học (flashcard) cho từng nhóm từ ——
const phrasalCards = computed(() =>
  (d.value?.vocab.phrasals || []).map((p) => ({ term: p.term, vi: p.vi, ipa: '', illo: '🔗' })),
)
// Day 7+: Trạng từ (Adverbs) & Adjective Phrases — mỗi nhóm có danh sách + thẻ SRS.
const adverbCards = computed(() =>
  (d.value?.vocab.adverbs || []).map((a) => ({ term: a.term, vi: a.vi, ipa: '', illo: '⚡' })),
)
const phraseCards = computed(() =>
  (d.value?.vocab.phrases || []).map((p) => ({ term: p.term, vi: p.vi, ipa: '', illo: '🧷' })),
)
// Day 9+: Useful Phrases (cụm từ/collocation thông dụng) — danh sách + thẻ SRS.
const collocationCards = computed(() =>
  (d.value?.vocab.collocations || []).map((p) => ({ term: p.term, vi: p.vi, ipa: '', illo: '💬' })),
)
const wordFormCards = computed(() =>
  (d.value?.vocab.wordForms || []).map((w) => ({
    term: w.base,
    vi: [w.noun && `DT: ${w.noun}`, w.verb && `ĐT: ${w.verb}`, w.adj && `TT: ${w.adj}`, w.adv && `TrT: ${w.adv}`]
      .filter(Boolean)
      .join(' · '),
    ipa: '',
    illo: '🧩',
  })),
)

// —— Listening: nghe chữ cái → gõ lại (chấm ngay) ——
const LETTER_FOCUS = ['A', 'E', 'I', 'G', 'J', 'B', 'V', 'P', 'U', 'Y']
const letterItems = computed(() => {
  const alpha = d.value?.listening?.alphabet || []
  const byLetter = Object.fromEntries(alpha.map((a) => [a.letter.toUpperCase(), a]))
  return LETTER_FOCUS.filter((L) => byLetter[L]).map((L) => ({ say: L, answer: L }))
})
const alphabetAudios = computed(() => (d.value?.audio || []).filter((a) => /alphabet/i.test(a.url || a.file || '')))
const practiceAudios = computed(() => (d.value?.audio || []).filter((a) => /practice/i.test(a.url || a.file || '')))
// Audio kỹ năng nói (Speaking Part 1…) — buổi Reading/Writing/Speaking có thể kèm bản ghi câu hỏi mẫu.
const speakingAudios = computed(() => (d.value?.audio || []).filter((a) => /speaking/i.test(a.url || a.file || '')))
// Audio ví dụ mẫu (Listening Part 1 có lời giải sẵn) — phát kèm phần lý thuyết/ví dụ.
const exampleAudios = computed(() => (d.value?.audio || []).filter((a) => /example/i.test(a.url || a.file || '')))
// Dictation (Day 3+): điền chỗ trống theo bản ghi thật (Audio 1).
const dictation = computed(() => d.value?.listening?.dictation || null)
const dictationAudios = computed(() => (d.value?.audio || []).filter((a) => /dictation/i.test(a.url || a.file || '')))
const dictationCount = computed(() => Object.keys(dictation.value?.answers || {}).length)
// Practice 2 (Day 5+): nghe cùng bản ghi rồi chọn đáp án đúng (MCQ) — ôn nhanh, không bắt buộc.
const listeningMcq = computed(() => d.value?.listening?.mcq || [])
// Listening Part 2 (Day 9+): buổi nghe CHỈ có MCQ + ghép (matching), không alphabet/dictation
// -> chính bài trắc nghiệm này là CỔNG nghe BẮT BUỘC (≥70%), thay cho nghe-gõ/chép chính tả.
const listeningQuizGate = computed(
  () => listeningMcq.value.length > 0 && !dictation.value && letterItems.value.length === 0,
)
const listeningQuizAudios = computed(() => (d.value?.audio || []).filter((a) => /part2/i.test(a.url || a.file || '')))
function onListeningQuizComplete(r) {
  if (d.value) user.recordQuiz('ielts', scope('listen'), r.score, r.total, 0.7)
}
// Audio 2 (bản ghi thật): q = phần đầu "Mr / Miss / Jane…"; đáp án = HỌ được đánh vần
// (từ answer key). Chấp nhận gõ họ hoặc cả "tiền tố + họ".
const practiceItems = computed(() =>
  (d.value?.listening?.practice || []).map((p) => {
    const q = String(p.prompt || '').replace(/_+/g, '').trim()
    const sur = p.answer || ''
    return { q, answer: sur ? [sur, `${q} ${sur}`] : '' }
  }),
)
// Có đủ đáp án để CHẤM không (có answer key thì bật chấm; chưa có thì chỉ điền).
const audio2Graded = computed(
  () => practiceItems.value.length > 0 && practiceItems.value.every((it) => it.answer && it.answer.length),
)
function onAudio2Done() {
  if (d.value) user.recordQuiz('ielts', scope('audio2'), practiceItems.value.length, practiceItems.value.length, 1)
}

// —— Homework I (dịch): gõ → chấm ngay ——
const translateItems = computed(() =>
  (d.value?.homework?.translate || []).map((t) => ({ q: t.vi, hint: t.hint, answer: t.answer, say: t.answer })),
)
// Day 9+: bài "Viết câu hoàn chỉnh" dùng chung bucket dịch nhưng đề là TỪ GỢI Ý tiếng
// Anh ("(I / eat / dinner) …"), không phải câu tiếng Việt -> đổi nhãn cho đúng.
const translateIsSentenceBuild = computed(
  () => translateItems.value.length > 0 && translateItems.value.every((t) => /\s\/\s/.test(t.q || '')),
)

// —— Phát âm: máy chấm (10 từ đầu) ——
const pronItems = computed(() => (d.value?.vocabCards || []).slice(0, 10).map((v) => ({ term: v.term, ipa: v.ipa || '' })))

// —— CỔNG NGỮ PHÁP: bài luyện ngữ pháp của buổi (Homework III) ≥70% ——
// Buổi có "Điền động từ" (cloze) hoặc "Chọn đại từ" (choice) — dùng cái nào có mặt.
const grammarIsChoice = computed(() => !(d.value?.homework?.cloze?.length) && (d.value?.homework?.choice?.length || 0) > 0)
// Buổi kỹ năng (Reading/Writing/Speaking, không có Basic Grammar): cloze là bài
// ĐIỀN PARAPHRASE hoàn thành mở bài Opinion Essay — nhãn nói theo hướng viết, không
// phải "dạng đúng của từ" (chia động từ) như buổi ngữ pháp.
const grammarIsWritingCloze = computed(
  () => !grammarIsChoice.value && !!d.value?.writing && !(d.value?.grammar?.length) && (d.value?.homework?.cloze?.length || 0) > 0,
)
// Buổi ngữ pháp mà bài điền là CỤM TỪ (vd tính từ + giới từ: "comfortable with") —
// nhận biết qua đáp án nhiều từ (có khoảng trắng). Nhãn nói "điền cụm từ", không phải
// "dạng đúng của từ" (chia động từ / danh từ) như Day 4–5.
const grammarIsPhraseCloze = computed(
  () =>
    !grammarIsChoice.value &&
    !grammarIsWritingCloze.value &&
    (d.value?.grammar?.length || 0) > 0 &&
    (d.value?.homework?.cloze || []).length > 0 &&
    (d.value?.homework?.cloze || []).every((c) => (c.answer || []).some((a) => /\s/.test(a))),
)
const grammarQuiz = computed(() => {
  const hw = d.value?.homework
  if (!hw) return []
  return hw.cloze?.length ? hw.cloze : hw.choice || []
})
const grammarNeeded = computed(() => grammarQuiz.value.length > 0)
const grammarPassed = computed(
  () => !!d.value && (!grammarNeeded.value || user.grammarDayPassed('ielts', IELTS_BOOK_WEEK, d.value.n)),
)
function onGrammarComplete(r) {
  if (d.value) user.recordGrammarDay('ielts', IELTS_BOOK_WEEK, d.value.n, r.score, r.total, 0.7)
}

// —— Quiz phrasal verb (Homework II) — ôn nhanh, không bắt buộc ——
const vocabQuiz = computed(() => d.value?.homework?.mcq || [])
const vocabPassed = computed(() => !!d.value && user.vocabDayPassed('ielts', IELTS_BOOK_WEEK, d.value.n))
function onVocabComplete(r) {
  if (d.value) user.recordVocabDay('ielts', IELTS_BOOK_WEEK, d.value.n, r.score, r.total, 0.7)
}

// —— Các cổng "làm tại chỗ" khác (bắt buộc để hoàn thành buổi) ——
const scope = (name) => `day:${d.value?.n}:${name}`
// Cổng nghe: buổi có bảng chữ cái (nghe-gõ) HOẶC bài chép chính tả (dictation).
const listeningNeeded = computed(() => letterItems.value.length > 0 || !!dictation.value || listeningQuizGate.value)
const listeningPassed = computed(() => !!d.value && (!listeningNeeded.value || user.quizPassed('ielts', scope('listen'))))
function onListeningDone() {
  if (d.value) user.recordQuiz('ielts', scope('listen'), letterItems.value.length, letterItems.value.length, 1)
}
function onDictationDone() {
  if (d.value) user.recordQuiz('ielts', scope('listen'), dictationCount.value, dictationCount.value, 1)
}
const translateNeeded = computed(() => translateItems.value.length > 0)
const translatePassed = computed(() => !!d.value && (!translateNeeded.value || user.quizPassed('ielts', scope('translate'))))
function onTranslateDone() {
  if (d.value) user.recordQuiz('ielts', scope('translate'), translateItems.value.length, translateItems.value.length, 1)
}
// —— Homework đọc hiểu (Day 2+): dùng từ khóa trả lời ngắn, chấm ngay (cổng bắt buộc) ——
const readingItems = computed(() => d.value?.homework?.reading || [])
const readingNeeded = computed(() => readingItems.value.length > 0)
const readingPassed = computed(() => !!d.value && (!readingNeeded.value || user.quizPassed('ielts', scope('reading'))))
function onReadingDone() {
  if (d.value) user.recordQuiz('ielts', scope('reading'), readingItems.value.length, readingItems.value.length, 1)
}
// Phát âm — máy chấm, KHÔNG bắt buộc để qua buổi (STT không có trên mọi trình duyệt).
function onPronDone() {
  if (d.value) user.recordQuiz('ielts', scope('pron'), pronItems.value.length, pronItems.value.length, 1)
}

// Hoàn thành buổi: buộc học viên LÀM các hoạt động chính ngay trên web —
// ngữ pháp + nghe-gõ + dịch (đều chấm tự động). Phần nào buổi không có thì tự bỏ qua.
const dayReady = computed(
  () => grammarPassed.value && listeningPassed.value && translatePassed.value && readingPassed.value,
)
const nextGateLabel = computed(() => {
  if (!grammarPassed.value) return grammarIsWritingCloze.value ? '🔒 Làm bài điền chỗ trống trước' : '🔒 Làm bài tập ngữ pháp trước'
  if (!listeningPassed.value)
    return dictation.value
      ? '🔒 Làm bài chép chính tả trước'
      : listeningQuizGate.value
        ? '🔒 Làm bài nghe (Part 2) trước'
        : '🔒 Làm bài nghe chữ cái trước'
  if (!translatePassed.value) return translateIsSentenceBuild.value ? '🔒 Làm bài viết câu trước' : '🔒 Làm bài dịch trước'
  if (!readingPassed.value) return '🔒 Làm bài đọc hiểu trước'
  return '✓ Đánh dấu hoàn thành'
})

watch(
  d,
  (cur) => {
    if (cur && !isBookDayUnlocked(cur.n, user.completed.ielts || [])) {
      const target = bookProgress.value.continue.day
      if (target && target !== cur.n) router.replace({ name: 'ielts-day', params: { week: IELTS_BOOK_WEEK, day: target } })
    }
  },
  { immediate: true },
)

function markDone() {
  if (d.value && !done.value && dayReady.value) {
    user.toggleDay('ielts', IELTS_BOOK_WEEK, d.value.n, d.value.totalDays, d.value.vocabTerms)
    hapticSuccess()
  }
}
function unmark() {
  if (d.value && done.value) user.toggleDay('ielts', IELTS_BOOK_WEEK, d.value.n, d.value.totalDays)
}
function goDay(n) {
  if (n) router.push({ name: 'ielts-day', params: { week: IELTS_BOOK_WEEK, day: n } })
}
</script>

<template>
  <div class="container day">
    <span class="back" @click="router.push({ name: 'ielts' })">← Lộ trình IELTS · theo sách</span>

    <template v-if="d">
      <!-- HEADER -->
      <header class="d-head">
        <div class="d-badge">DAY {{ String(d.n).padStart(2, '0') }}</div>
        <h1 class="d-title">{{ d.title }}</h1>
        <div class="prose d-aims" v-html="d.aims"></div>
        <div class="d-meta">
          <span class="chip">🎯 {{ d.topicVocabulary }}</span>
          <span class="chip">🔥 {{ bookProgress.doneDays }}/{{ bookProgress.totalDays }} buổi</span>
        </div>
      </header>

      <div class="main">
        <!-- ════ READING SKILLS (lý thuyết) ════ -->
        <section v-if="d.reading" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">READING SKILLS</div>
              <h2 class="step-title">📚 Kỹ năng đọc (Reading)</h2>
            </div>
          </div>
          <div class="prose" v-html="d.reading"></div>
        </section>

        <!-- ════ WRITING SKILLS (lý thuyết) ════ -->
        <section v-if="d.writing" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">WRITING SKILLS</div>
              <h2 class="step-title">✍️ Kỹ năng viết (Writing)</h2>
            </div>
          </div>
          <div class="prose" v-html="d.writing"></div>
        </section>

        <!-- ════ SPEAKING SKILLS (lý thuyết) ════ -->
        <section v-if="d.speaking" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">SPEAKING SKILLS</div>
              <h2 class="step-title">🗣️ Kỹ năng nói — định dạng bài thi</h2>
            </div>
          </div>
          <div v-if="speakingAudios.length" class="audio-row">
            <div v-for="(a, i) in speakingAudios" :key="i" class="audio-item">
              <span class="audio-label">{{ a.label }}</span>
              <audio controls preload="none" :src="a.url"></audio>
            </div>
          </div>
          <div class="prose" v-html="d.speaking"></div>
        </section>

        <!-- ════ NGỮ PHÁP ════ -->
        <section v-if="d.grammar.length" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">BASIC GRAMMAR</div>
              <h2 class="step-title">📖 Ngữ pháp hôm nay</h2>
            </div>
          </div>
          <div v-for="(g, i) in d.grammar" :key="i" class="gram-block">
            <h3 class="gram-title">{{ g.title }}</h3>
            <div class="prose" v-html="g.html"></div>
          </div>
        </section>

        <!-- LUYỆN NGỮ PHÁP (cổng bắt buộc) -->
        <section v-if="grammarQuiz.length" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow" :class="{ green: grammarPassed }">LÀM NGAY · BẮT BUỘC ĐẠT ≥70%</div>
              <h2 class="step-title">{{ grammarIsChoice ? '✍️ Chọn đáp án đúng' : grammarIsWritingCloze ? '✍️ Điền chỗ trống hoàn thành câu' : grammarIsPhraseCloze ? '✍️ Điền cụm từ vào chỗ trống' : '✍️ Điền dạng đúng của từ vào chỗ trống' }}</h2>
            </div>
            <span class="wt-badge" :class="{ ok: grammarPassed }">{{ grammarPassed ? '✅ Đã đạt' : 'Chưa đạt' }}</span>
          </div>
          <p class="quiz-intro">{{ grammarIsChoice ? 'Chọn phương án phù hợp cho mỗi câu. Đạt ≥70% để mở hoàn thành buổi.' : grammarIsWritingCloze ? 'Điền từ/cụm từ phù hợp vào mỗi chỗ trống (gợi ý nghĩa trong ngoặc). Đạt ≥70% để mở hoàn thành buổi.' : grammarIsPhraseCloze ? 'Điền cụm từ (tính từ + giới từ) phù hợp vào mỗi chỗ trống — gợi ý nghĩa tiếng Việt trong ngoặc. Đạt ≥70% để mở hoàn thành buổi.' : 'Gõ đúng dạng của từ trong ngoặc. Đạt ≥70% để mở hoàn thành buổi.' }}</p>
          <div class="grammar-drill">
            <QuizTool :questions="grammarQuiz" mode="practice" :pass-threshold="0.7" embedded @complete="onGrammarComplete" />
          </div>
          <div v-if="grammarPassed" class="gate-line ok">{{ grammarIsWritingCloze ? '✅ Bạn đã hoàn thành bài điền chỗ trống.' : '✅ Bạn đã đạt bài tập ngữ pháp.' }}</div>
        </section>

        <!-- ════ TỪ VỰNG ════ -->
        <section v-if="d.vocabCards.length" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">BASIC VOCABULARY · {{ d.topicVocabulary }}</div>
              <h2 class="step-title">🗣️ Từ vựng chủ đề</h2>
            </div>
          </div>
          <div class="vocab-grid">
            <VocabCard v-for="v in d.vocabCards" :key="v.term" :vocab="v" />
          </div>
        </section>
        <!-- HỌC THUỘC bằng thẻ (SRS) — từ vựng chủ đề -->
        <InlineFlashcards
          v-if="d.vocabCards.length"
          :vocab="d.vocabCards"
          :limit="30"
          eyebrow="HỌC THUỘC · THẺ GHI NHỚ"
          :title="`Thẻ từ vựng ${d.topicVocabulary}`"
        />

        <!-- TRẠNG TỪ (ADVERBS) + thẻ học — Day 7+ -->
        <section v-if="d.vocab.adverbs && d.vocab.adverbs.length" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">BASIC VOCABULARY · ADVERBS</div>
              <h2 class="step-title">⚡ Trạng từ (Adverbs)</h2>
            </div>
          </div>
          <ul class="pv-list">
            <li v-for="(a, i) in d.vocab.adverbs" :key="i" @click="say(a.exEn || a.term)">
              <span class="pv-term">{{ a.term }}</span>
              <span class="pv-vi">{{ a.vi }}</span>
              <span class="pv-ex" v-if="a.exEn">“{{ a.exEn }}” 🔊</span>
            </li>
          </ul>
        </section>
        <InlineFlashcards
          v-if="adverbCards.length"
          :vocab="adverbCards"
          :limit="20"
          eyebrow="HỌC THUỘC · THẺ GHI NHỚ"
          title="Thẻ trạng từ (Adverbs)"
        />

        <!-- ADJECTIVE PHRASES (cụm tính từ) + thẻ học — Day 7+ -->
        <section v-if="d.vocab.phrases && d.vocab.phrases.length" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">BASIC VOCABULARY · ADJECTIVE PHRASES</div>
              <h2 class="step-title">🧷 Cụm tính từ (Adjective Phrases)</h2>
            </div>
          </div>
          <ul class="pv-list">
            <li v-for="(p, i) in d.vocab.phrases" :key="i" @click="say(p.exEn || p.term)">
              <span class="pv-term">{{ p.term }}</span>
              <span class="pv-vi">{{ p.vi }}</span>
              <span class="pv-ex" v-if="p.exEn">“{{ p.exEn }}” 🔊</span>
            </li>
          </ul>
        </section>
        <InlineFlashcards
          v-if="phraseCards.length"
          :vocab="phraseCards"
          :limit="20"
          eyebrow="HỌC THUỘC · THẺ GHI NHỚ"
          title="Thẻ cụm tính từ (Adjective Phrases)"
        />

        <!-- USEFUL PHRASES (cụm từ hữu ích) + thẻ học — Day 9+ -->
        <section v-if="d.vocab.collocations && d.vocab.collocations.length" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">BASIC VOCABULARY · USEFUL PHRASES</div>
              <h2 class="step-title">💬 Cụm từ hữu ích (Useful Phrases)</h2>
            </div>
          </div>
          <ul class="pv-list">
            <li v-for="(p, i) in d.vocab.collocations" :key="i" @click="say(p.exEn || p.term)">
              <span class="pv-term">{{ p.term }}</span>
              <span class="pv-vi">{{ p.vi }}</span>
              <span class="pv-ex" v-if="p.exEn">“{{ p.exEn }}” 🔊</span>
            </li>
          </ul>
        </section>
        <InlineFlashcards
          v-if="collocationCards.length"
          :vocab="collocationCards"
          :limit="20"
          eyebrow="HỌC THUỘC · THẺ GHI NHỚ"
          title="Thẻ cụm từ hữu ích (Useful Phrases)"
        />

        <!-- PHRASAL VERBS + thẻ học -->
        <section v-if="d.vocab.phrasals.length" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">BASIC VOCABULARY · PHRASAL VERBS</div>
              <h2 class="step-title">🔗 Phrasal verbs</h2>
            </div>
          </div>
          <ul class="pv-list">
            <li v-for="(p, i) in d.vocab.phrasals" :key="i" @click="say(p.exEn || p.term)">
              <span class="pv-term">{{ p.term }}</span>
              <span class="pv-vi">{{ p.vi }}</span>
              <span class="pv-ex" v-if="p.exEn">“{{ p.exEn }}” 🔊</span>
            </li>
          </ul>
        </section>
        <InlineFlashcards
          v-if="phrasalCards.length"
          :vocab="phrasalCards"
          :limit="20"
          eyebrow="HỌC THUỘC · THẺ GHI NHỚ"
          title="Thẻ phrasal verbs"
        />

        <!-- WORD FORMATION + thẻ học -->
        <section v-if="d.vocab.wordForms.length" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">BASIC VOCABULARY · WORD FORMATION</div>
              <h2 class="step-title">🧩 Họ từ (Word Formation)</h2>
            </div>
          </div>
          <div class="table-wrap">
            <table class="wf-table">
              <thead>
                <tr><th>Gốc</th><th>Danh từ</th><th>Động từ</th><th>Tính từ</th><th>Trạng từ</th></tr>
              </thead>
              <tbody>
                <tr v-for="(w, i) in d.vocab.wordForms" :key="i">
                  <td><b>{{ w.base }}</b><small v-if="w.baseVi"> · {{ w.baseVi }}</small></td>
                  <td>{{ w.noun || '—' }}</td>
                  <td>{{ w.verb || '—' }}</td>
                  <td>{{ w.adj || '—' }}</td>
                  <td>{{ w.adv || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <InlineFlashcards
          v-if="wordFormCards.length"
          :vocab="wordFormCards"
          :limit="20"
          eyebrow="HỌC THUỘC · THẺ GHI NHỚ"
          title="Thẻ họ từ (nhớ các dạng)"
        />

        <!-- QUIZ PHRASAL VERB (ôn nhanh) -->
        <section v-if="vocabQuiz.length" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow" :class="{ green: vocabPassed }">ÔN NHANH — TỰ CHỌN</div>
              <h2 class="step-title">❓ Chọn phrasal verb đúng</h2>
            </div>
            <span class="wt-badge" :class="{ ok: vocabPassed }">{{ vocabPassed ? '✅ Đã đạt' : 'Tự chọn' }}</span>
          </div>
          <div class="grammar-drill">
            <QuizTool :questions="vocabQuiz" mode="practice" :pass-threshold="0.7" embedded @complete="onVocabComplete" />
          </div>
        </section>

        <!-- ════ LISTENING — DICTATION (điền chỗ trống theo bản ghi) ════ -->
        <template v-if="dictation">
          <!-- Lý thuyết Listening Dictation -->
          <section v-if="d.listening.intro" class="step-card">
            <div class="step-head">
              <div>
                <div class="eyebrow">LISTENING SKILLS</div>
                <h2 class="step-title">🎧 Kỹ năng nghe — Dictation</h2>
              </div>
            </div>
            <div v-if="exampleAudios.length" class="audio-row">
              <div v-for="(a, i) in exampleAudios" :key="i" class="audio-item">
                <span class="audio-label">{{ a.label }}</span>
                <audio controls preload="none" :src="a.url"></audio>
              </div>
            </div>
            <div class="prose" v-html="d.listening.intro"></div>
          </section>

          <!-- LÀM NGAY: nghe Audio 1 → điền chỗ trống (bắt buộc) -->
          <DictationCloze
            :title="dictation.title"
            :note="dictation.note"
            :en="dictation.en"
            :vi="dictation.vi"
            :answers="dictation.answers"
            @done="onDictationDone"
          >
            <div v-if="dictationAudios.length" class="audio-row">
              <div v-for="(a, i) in dictationAudios" :key="i" class="audio-item">
                <span class="audio-label">{{ a.label }}</span>
                <audio controls preload="none" :src="a.url"></audio>
              </div>
            </div>
          </DictationCloze>
        </template>

        <!-- ════ LISTENING — PART 2 (nghe → chọn đáp án & ghép) · CỔNG BẮT BUỘC · Day 9+ ════ -->
        <section v-if="listeningQuizGate" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow" :class="{ green: listeningPassed }">LÀM NGAY · NGHE PART 2 · BẮT BUỘC ĐẠT ≥70%</div>
              <h2 class="step-title">🎧 Nghe &amp; chọn / ghép đáp án</h2>
            </div>
            <span class="wt-badge" :class="{ ok: listeningPassed }">{{ listeningPassed ? '✅ Đã đạt' : 'Chưa đạt' }}</span>
          </div>
          <div v-if="d.listening && d.listening.intro" class="prose" v-html="d.listening.intro"></div>
          <div v-if="listeningQuizAudios.length" class="audio-row">
            <div v-for="(a, i) in listeningQuizAudios" :key="i" class="audio-item">
              <span class="audio-label">{{ a.label }}</span>
              <audio controls preload="none" :src="a.url"></audio>
            </div>
          </div>
          <p class="quiz-intro">Nghe bản ghi rồi chọn đáp án đúng (câu 11–13) và ghép yêu cầu phù hợp (câu 16–20). Đạt ≥70% để mở hoàn thành buổi.</p>
          <div class="grammar-drill">
            <QuizTool :questions="listeningMcq" mode="practice" :pass-threshold="0.7" embedded @complete="onListeningQuizComplete" />
          </div>
          <div v-if="listeningPassed" class="gate-line ok">✅ Bạn đã hoàn thành bài nghe Part 2.</div>
        </section>

        <!-- ════ LISTENING — PRACTICE 2 (nghe & chọn đáp án) · buổi có dictation ════ -->
        <section v-if="listeningMcq.length && dictation" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">LISTENING SKILLS · PRACTICE 2</div>
              <h2 class="step-title">🎧 Nghe &amp; chọn đáp án đúng</h2>
            </div>
            <span class="wt-badge">Tự chọn</span>
          </div>
          <p class="quiz-intro">Nghe tiếp bản ghi (từ khoảng 2:02) rồi chọn đáp án đúng cho mỗi câu. Ôn nhanh — không bắt buộc để qua buổi.</p>
          <div v-if="dictationAudios.length" class="audio-row">
            <div v-for="(a, i) in dictationAudios" :key="i" class="audio-item">
              <span class="audio-label">{{ a.label }}</span>
              <audio controls preload="none" :src="a.url"></audio>
            </div>
          </div>
          <div class="grammar-drill">
            <QuizTool :questions="listeningMcq" mode="practice" :pass-threshold="0.7" embedded />
          </div>
        </section>

        <!-- ════ LISTENING — ALPHABET ════ -->
        <section v-if="d.listening && d.listening.alphabet.length" class="step-card">
          <div class="step-head">
            <div>
              <div class="eyebrow">LISTENING SKILLS</div>
              <h2 class="step-title">🎧 The Alphabet</h2>
            </div>
          </div>
          <div v-if="alphabetAudios.length" class="audio-row">
            <div v-for="(a, i) in alphabetAudios" :key="i" class="audio-item">
              <span class="audio-label">{{ a.label }}</span>
              <audio controls preload="none" :src="a.url"></audio>
            </div>
          </div>
          <div class="alpha-grid">
            <button v-for="a in d.listening.alphabet" :key="a.letter" class="alpha-cell" @click="say(a.letter)">
              <span class="alpha-letter">{{ a.letter }}</span>
              <span class="alpha-ipa">{{ a.ipa }}</span>
            </button>
          </div>
          <div v-if="d.listening.intro" class="prose alpha-note" v-html="d.listening.intro"></div>
        </section>

        <!-- LÀM NGAY: nghe chữ cái → gõ lại (chấm ngay, bắt buộc) -->
        <TypedCheckList
          v-if="letterItems.length"
          :items="letterItems"
          listen-mode
          eyebrow="LÀM NGAY · NGHE & GÕ · BẮT BUỘC"
          title="🎧 Nghe chữ cái rồi gõ lại"
          intro="Bấm 🔊 để nghe một chữ cái, rồi gõ đúng chữ đó. Gõ đúng cả danh sách thì phần này hoàn thành."
          done-label="Đã hoàn thành bài nghe chữ cái."
          @done="onListeningDone"
        />

        <!-- Audio 2 (bản ghi thật) — nghe & ĐIỀN, CHẤM NGAY (đã có answer key) -->
        <TypedCheckList
          v-if="practiceItems.length"
          :items="practiceItems"
          :graded="audio2Graded"
          eyebrow="NGHE & CHẤM · BẢN GHI THẬT (AUDIO 2)"
          title="📻 Nghe & điền họ được đánh vần"
          :intro="audio2Graded
            ? 'Bật bản ghi, nghe từng mục rồi gõ HỌ được đánh vần và bấm Kiểm tra. Sai sẽ hiện đáp án; gõ lại thì đáp án ẩn đi. Nghe đúng hết là hoàn thành!'
            : 'Bật bản ghi rồi gõ họ được đánh vần cho mỗi mục ngay tại đây.'"
          done-label="Đã hoàn thành bài nghe đánh vần tên (Audio 2)."
          @done="onAudio2Done"
        >
          <div v-if="practiceAudios.length" class="audio-row">
            <div v-for="(a, i) in practiceAudios" :key="i" class="audio-item">
              <span class="audio-label">{{ a.label }}</span>
              <audio controls preload="none" :src="a.url"></audio>
            </div>
          </div>
        </TypedCheckList>

        <!-- ════ LUYỆN PHÁT ÂM — MÁY CHẤM ════ -->
        <PronunciationCheck v-if="pronItems.length" :items="pronItems" @done="onPronDone" />

        <!-- ════ HOMEWORK I — DỊCH / VIẾT CÂU (chấm ngay) ════ -->
        <TypedCheckList
          v-if="translateItems.length"
          :items="translateItems"
          :eyebrow="translateIsSentenceBuild ? 'HOMEWORK · VIẾT CÂU HOÀN CHỈNH · BẮT BUỘC' : 'HOMEWORK · DỊCH (S + V + O) · BẮT BUỘC'"
          :title="translateIsSentenceBuild ? '🧩 Viết câu hoàn chỉnh' : '🌐 Dịch câu sang tiếng Anh'"
          :intro="translateIsSentenceBuild
            ? 'Dùng từ gợi ý và đúng thì (Present Continuous / Past Simple), gõ CẢ CÂU tiếng Anh rồi bấm Kiểm tra. Sai sẽ hiện đáp án; gõ lại thì đáp án ẩn đi. Viết đúng hết mới hoàn thành.'
            : 'Gõ câu tiếng Anh rồi bấm Kiểm tra. Sai sẽ hiện đáp án; khi bạn gõ lại thì đáp án ẩn đi để tự nhớ. Dịch đúng hết mới hoàn thành.'"
          :done-label="translateIsSentenceBuild ? 'Đã hoàn thành bài viết câu.' : 'Đã hoàn thành bài dịch.'"
          @done="onTranslateDone"
        />

        <!-- ════ HOMEWORK — ĐỌC HIỂU (chấm ngay, bắt buộc) ════ -->
        <ReadingHomework v-if="readingItems.length" :items="readingItems" @done="onReadingDone" />

        <!-- CHECKPOINT -->
        <section class="checkpoint" :class="{ done }">
          <div class="cp-emoji">{{ done ? '✅' : '🎯' }}</div>
          <div class="cp-text">
            <h3>{{ done ? `Đã hoàn thành Day ${d.n}!` : `Hoàn thành Day ${d.n} 🎉` }}</h3>
            <p v-if="!done">Làm xong các bài <b>làm ngay</b> (các mục ghi <b>BẮT BUỘC</b>) rồi đánh dấu hoàn thành để nhận <b>+50 XP</b>.</p>
            <p v-else>Đã xong {{ bookProgress.doneDays }}/{{ bookProgress.totalDays }} buổi. Hoàn thành buổi để mở buổi kế tiếp 🔓</p>
          </div>
          <div class="cp-cta">
            <button v-if="d.prevDay" class="outline-btn" @click="goDay(d.prevDay)">← Day {{ d.prevDay }}</button>
            <button v-if="!done" class="green-btn" :class="{ locked: !dayReady }" :disabled="!dayReady" @click="markDone">
              {{ nextGateLabel }}
            </button>
            <template v-else>
              <button class="outline-btn" @click="unmark">↩ Bỏ đánh dấu</button>
              <button v-if="d.nextDay" class="green-btn" @click="goDay(d.nextDay)">Day {{ d.nextDay }} →</button>
              <button v-else class="green-btn" @click="router.push({ name: 'ielts' })">Về bản đồ →</button>
            </template>
          </div>
        </section>
      </div>
    </template>

    <div v-else class="empty">
      <h2>Buổi này chưa có nội dung</h2>
      <p>Day {{ day }} chưa được số hóa từ sách. Hãy bổ sung ảnh vào <code>IELTS/DAY {{ day }}/</code> nhé.</p>
      <button class="green-btn" @click="router.push({ name: 'ielts' })">← Về bản đồ IELTS</button>
    </div>
  </div>
</template>

<style scoped src="@/components/day/ieltsDaySection.css"></style>
<style scoped>
.day {
  padding: 26px var(--space-page-x) 90px;
  max-width: 860px;
  margin: 0 auto;
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
.d-head {
  margin: 18px 0 24px;
}
.d-badge {
  display: inline-block;
  background: #1e1e2e;
  color: #fff;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 1px;
  padding: 5px 14px;
  border-radius: 8px;
}
.d-title {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.5px;
  margin: 12px 0 6px;
  color: var(--ink);
}
.d-aims {
  color: var(--slate);
  font-size: 14.5px;
}
.d-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.chip {
  background: rgba(0, 214, 143, 0.12);
  border: 1px solid rgba(0, 214, 143, 0.24);
  color: #00966a;
  font-weight: 700;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 99px;
}
.main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.eyebrow.green {
  color: #00966a;
}
.gram-block + .gram-block {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}
.gram-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 8px;
}
.vocab-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 16px;
}
.pv-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pv-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  background: var(--bg);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
}
.pv-term {
  font-weight: 800;
  color: #6c5ce7;
}
.pv-vi {
  color: var(--muted);
  font-size: 13px;
}
.pv-ex {
  flex-basis: 100%;
  color: var(--slate);
  font-size: 13.5px;
}
.table-wrap {
  overflow-x: auto;
  margin-top: 12px;
}
.wf-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
  min-width: 480px;
}
.wf-table th,
.wf-table td {
  border: 1px solid var(--line);
  padding: 8px 10px;
  text-align: left;
}
.wf-table th {
  background: var(--bg-accent);
  font-weight: 800;
}
.wf-table small {
  color: var(--muted);
}
.audio-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 14px;
}
.audio-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.audio-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted);
}
.audio-item audio {
  height: 38px;
}
.alpha-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
  margin-top: 16px;
}
.alpha-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border: 1px solid rgba(0, 214, 143, 0.22);
  background: var(--surface-1);
  border-radius: 12px;
  padding: 10px 4px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.alpha-cell:active {
  transform: scale(0.96);
  background: rgba(0, 214, 143, 0.14);
}
.alpha-letter {
  font-size: 18px;
  font-weight: 900;
  color: var(--ink);
}
.alpha-ipa {
  font-size: 12px;
  color: #6c5ce7;
}
.alpha-note {
  margin-top: 14px;
  font-size: 14px;
  color: var(--slate);
}
.practice-list {
  margin: 10px 0 0 18px;
  columns: 2;
  color: var(--slate);
  font-size: 14px;
  line-height: 1.9;
}
.checkpoint {
  background: linear-gradient(135deg, #1e1e2e, #23203a);
  border-radius: 24px;
  padding: 26px 28px;
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
  max-width: 460px;
}
.cp-cta {
  position: relative;
  display: flex;
  gap: 10px;
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
.green-btn.locked {
  opacity: 0.55;
  cursor: not-allowed;
}
.empty {
  text-align: center;
  padding: 80px 20px;
}
.empty h2 {
  font-size: 22px;
  font-weight: 800;
}
.empty p {
  color: var(--muted);
  margin: 10px 0 22px;
}
@media (max-width: 640px) {
  .vocab-grid {
    grid-template-columns: 1fr;
  }
  .practice-list {
    columns: 1;
  }
}
</style>
