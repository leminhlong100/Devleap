<script setup>
/**
 * Ô LUYỆN NÓI cho khóa IELTS theo sách (Speaking Part 1…).
 *
 * Khác sách in (chỉ đưa câu trả lời mẫu để đọc): học viên NÓI câu trả lời của
 * mình → máy nhận dạng giọng (Web Speech API) ra transcript → AI chấm như bài
 * viết (correctWriting: điểm CEFR/100, sửa từng câu). Câu trả lời mẫu chỉ hé lộ
 * SAU khi thử. Máy không có mic/nhận dạng thì gõ transcript để vẫn được AI chấm.
 *
 * Không bắt buộc để qua buổi (mic/STT không có trên mọi trình duyệt). Lưu qua
 * writingSlice với "khóa" riêng 'ielts-speak' để không đụng bài viết.
 */
import { ref, computed, watch, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { correctWriting } from '@/lib/aiChat'
import { friendlyAiError } from '@/lib/aiError'
import { recognizeOnce, recognitionSupported } from '@/lib/speechRecognize'
import { speak, canSpeak } from '@/lib/speak'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import AiReviewCard from './AiReviewCard.vue'

const props = defineProps({ day: { type: Object, required: true } })
const user = useUserStore()
const { isOnline } = useOnlineStatus()

const SPEAK_COURSE = 'ielts-speak'
const prompt = computed(() => props.day?.speakingTask?.prompt || '')
const sample = computed(() => props.day?.speakingTask?.sample || '')
const sttSupported = recognitionSupported()
const speakable = canSpeak()

const transcript = ref('')
const listening = ref(false)
const grading = ref(false)
const err = ref('')
const showSample = ref(false)
let handle = null

watch(
  () => props.day,
  (cur) => {
    if (cur) {
      const saved = user.writingOf(SPEAK_COURSE, cur.week, cur.n)
      transcript.value = saved?.text || ''
      showSample.value = !!saved?.done
    }
  },
  { immediate: true },
)

const done = computed(() => user.writingDone(SPEAK_COURSE, props.day.week, props.day.n))
const review = computed(() => user.writingOf(SPEAK_COURSE, props.day.week, props.day.n)?.review)
const wordCount = computed(() => transcript.value.trim().split(/\s+/).filter(Boolean).length)
const canGrade = computed(() => wordCount.value >= 3 && !grading.value && isOnline.value)

async function record() {
  if (listening.value || !sttSupported) return
  err.value = ''
  listening.value = true
  try {
    handle = recognizeOnce({ lang: 'en-US', silenceMs: 3000, leadMs: 8000 })
    const text = await handle.promise
    if (text) transcript.value = text
    if (!text) err.value = 'Chưa nghe được gì — thử nói to & rõ hơn nhé.'
  } catch (e) {
    err.value = e?.message === 'unsupported' ? 'Trình duyệt không hỗ trợ nhận dạng giọng nói.' : 'Không nghe được — kiểm tra micro & thử lại.'
  } finally {
    listening.value = false
    handle = null
  }
}
function stopRecord() {
  handle?.stop?.()
}

async function grade() {
  if (!canGrade.value) return
  grading.value = true
  err.value = ''
  try {
    const rv = await correctWriting(transcript.value, {
      title: props.day.title,
      week: props.day.week,
      weekTitle: 'IELTS Speaking (theo sách)',
      grammar: [],
      vocab: (props.day.vocabCards || []).map((v) => v.term).slice(0, 20),
    })
    if (!rv) throw new Error('AI chưa trả về kết quả. Thử lại nhé.')
    user.saveWriting(SPEAK_COURSE, props.day.week, props.day.n, transcript.value, true, rv)
    showSample.value = true
  } catch (e) {
    err.value = friendlyAiError(e).message
  } finally {
    grading.value = false
  }
}
function saveDraft() {
  user.saveWriting(SPEAK_COURSE, props.day.week, props.day.n, transcript.value, done.value, review.value)
}
function playSample() {
  if (speakable && sample.value) speak(sample.value, 0.9)
}

onUnmounted(() => handle?.stop?.())
</script>

<template>
  <section class="step-card" :class="{ current: !done }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: done }">LUYỆN NÓI · TỰ CHỌN · AI CHẤM</div>
        <h2 class="step-title">🗣️ Luyện nói — nói &amp; AI chấm</h2>
      </div>
      <span class="wt-badge" :class="{ ok: done }">{{ done ? '✅ Đã thử' : 'Tự chọn' }}</span>
    </div>

    <p v-if="prompt" class="sc-prompt"><b>Câu hỏi:</b> {{ prompt }}</p>
    <p class="quiz-intro">
      Tự trả lời bằng lời của bạn (2–4 câu). Bấm 🎤 để nói — máy sẽ chuyển thành chữ rồi AI chấm.
      <b>Câu trả lời mẫu chỉ hiện sau khi bạn thử.</b>
    </p>

    <div class="sc-controls">
      <button v-if="sttSupported" class="sc-mic" :class="{ live: listening }" @click="listening ? stopRecord() : record()">
        {{ listening ? '⏹️ Dừng nghe' : '🎤 Nói câu trả lời' }}
      </button>
      <span v-if="listening" class="sc-live">🔴 Đang nghe… nói xong sẽ tự dừng</span>
    </div>

    <textarea
      v-model="transcript"
      class="write-area"
      rows="4"
      :placeholder="sttSupported ? 'Bản chữ từ giọng nói sẽ hiện ở đây — có thể sửa lại trước khi chấm…' : 'Trình duyệt không hỗ trợ mic — gõ câu trả lời của bạn ở đây…'"
      @change="saveDraft"
    ></textarea>

    <div class="write-foot">
      <span class="write-count" :class="{ ok: wordCount >= 3 }">🗣️ {{ wordCount }} từ</span>
      <button
        class="green-btn"
        :class="{ locked: !canGrade }"
        :disabled="!canGrade"
        :title="!isOnline ? 'Cần có mạng để AI chấm' : undefined"
        @click="grade"
      >
        {{ grading ? '🤖 AI đang chấm…' : !isOnline ? '🔌 Cần có mạng' : done ? '↻ Chấm lại' : 'Nhờ AI chấm' }}
      </button>
    </div>
    <div v-if="err" class="rev-error">⚠️ {{ err }}</div>

    <AiReviewCard v-if="review" :review="review" />

    <!-- CÂU TRẢ LỜI MẪU — hé lộ sau khi thử (đối chiếu + nghe phát âm mẫu) -->
    <div v-if="showSample && sample" class="sc-sample">
      <div class="sc-sample-head">
        <span>📢 Câu trả lời mẫu</span>
        <button v-if="speakable" class="sc-play" @click="playSample">🔊 Nghe mẫu</button>
      </div>
      <p class="sc-sample-text">{{ sample }}</p>
    </div>
    <p v-else-if="sample" class="sc-locked">🔒 Câu trả lời mẫu sẽ hiện sau khi bạn tự nói &amp; nhờ AI chấm.</p>
  </section>
</template>

<style scoped src="./ieltsDaySection.css"></style>
<style scoped>
.sc-prompt {
  margin-top: 14px;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--ink);
  background: var(--bg);
  border-left: 3px solid var(--green);
  border-radius: 12px;
  padding: 12px 15px;
}
.sc-controls {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.sc-mic {
  border: none;
  background: #6c5ce7;
  color: #fff;
  font-weight: 800;
  font-size: 14.5px;
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  min-height: 46px;
  font-family: inherit;
}
.sc-mic.live {
  background: #e04848;
  animation: sc-pulse 1.2s ease-in-out infinite;
}
@keyframes sc-pulse {
  50% { opacity: 0.65; }
}
.sc-live {
  font-size: 13px;
  font-weight: 700;
  color: #e04848;
}
.write-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.write-count {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--muted-2);
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
.sc-sample {
  margin-top: 18px;
  border: 1px solid rgba(0, 214, 143, 0.25);
  background: rgba(0, 214, 143, 0.05);
  border-radius: 14px;
  padding: 14px 16px;
}
.sc-sample-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  font-weight: 800;
  color: #00966a;
}
.sc-play {
  border: 1px solid rgba(0, 214, 143, 0.4);
  background: var(--surface);
  color: #00966a;
  border-radius: 99px;
  padding: 6px 14px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  min-height: 38px;
}
.sc-sample-text {
  margin-top: 10px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--ink);
}
.sc-locked {
  margin-top: 16px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--muted-2);
  background: var(--bg);
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 12px 15px;
}
</style>
