<script setup>
/**
 * Ô LUYỆN VIẾT + AI CHẤM cho khóa IELTS theo sách (Writing Task 2).
 *
 * Khác sách in (chỉ đưa bài mẫu để chép): học viên PHẢI tự viết trước, nhờ AI
 * chữa (chấm điểm CEFR/100, gạch chủ ngữ–động từ, sửa từng câu). BÀI MẪU chỉ hé
 * lộ SAU KHI nộp để đối chiếu — không phải để chép. Không bắt buộc để qua buổi
 * (cần mạng + AI), nhưng là hoạt động khác biệt lớn nhất so với sách.
 *
 * Gọi AI: correctWriting() (src/lib/aiChat.js, mode 'correct'). Lưu nháp + kết
 * quả qua writingSlice của store (khóa ielts:1:<buổi>).
 */
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { correctWriting } from '@/lib/aiChat'
import { friendlyAiError } from '@/lib/aiError'
import { requiredSentencesFor } from '@/lib/dayPlan'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import AiReviewCard from './AiReviewCard.vue'
import CountdownTimer from './CountdownTimer.vue'

// day: object buổi (từ getBookDay) — cần n, week, title, writingTask, writingSamples, vocabCards.
const props = defineProps({ day: { type: Object, required: true } })
const user = useUserStore()
const { isOnline } = useOnlineStatus()

const prompt = computed(() => props.day?.writingTask?.prompt || '')
const samplesHtml = computed(() => props.day?.writingSamples || '')
const requiredSentences = computed(() => requiredSentencesFor(prompt.value))

const writingText = ref('')
const showSamples = ref(false)
watch(
  () => props.day,
  (cur) => {
    if (cur) {
      writingText.value = user.writingOf('ielts', cur.week, cur.n)?.text || ''
      showSamples.value = user.writingDone('ielts', cur.week, cur.n)
    }
  },
  { immediate: true },
)

// Đếm câu: tách theo dòng / dấu kết câu; mỗi câu ≥ 2 từ.
const writtenCount = computed(
  () =>
    writingText.value
      .split(/[\n.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.split(/\s+/).filter(Boolean).length >= 2).length,
)
const writingMet = computed(() => writtenCount.value >= requiredSentences.value)
const writingDone = computed(() => user.writingDone('ielts', props.day.week, props.day.n))
const review = computed(() => user.writingOf('ielts', props.day.week, props.day.n)?.review)
const reviewing = ref(false)
const reviewError = ref('')
const timedOn = ref(false)
const timeUp = ref(false)

function saveDraft() {
  user.saveWriting('ielts', props.day.week, props.day.n, writingText.value, writingDone.value, review.value)
}

async function askAiCorrect() {
  if (!writingMet.value || reviewing.value || !isOnline.value) return
  reviewing.value = true
  reviewError.value = ''
  try {
    const rv = await correctWriting(writingText.value, {
      title: props.day.title,
      week: props.day.week,
      weekTitle: 'IELTS cơ bản (theo sách)',
      grammar: (props.day.grammar || []).map((g) => g.title),
      vocab: (props.day.vocabCards || []).map((v) => v.term).slice(0, 20),
    })
    if (!rv) throw new Error('AI chưa trả về kết quả. Thử lại nhé.')
    user.saveWriting('ielts', props.day.week, props.day.n, writingText.value, true, rv)
    showSamples.value = true // nộp xong mới hé lộ bài mẫu để đối chiếu
  } catch (e) {
    reviewError.value = friendlyAiError(e).message
  } finally {
    reviewing.value = false
  }
}
</script>

<template>
  <section class="step-card" :class="{ current: !writingDone }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: writingDone }">LÀM NGAY · TỰ VIẾT · AI CHẤM</div>
        <h2 class="step-title">✍️ Luyện viết — AI chữa bài</h2>
      </div>
      <span class="wt-badge" :class="{ ok: writingDone }">{{ writingDone ? '✅ Đã nộp' : `${writtenCount}/${requiredSentences} câu` }}</span>
    </div>

    <p v-if="prompt" class="wc-prompt"><b>Đề bài:</b> {{ prompt }}</p>
    <p class="quiz-intro">
      Tự viết bài của bạn (tối thiểu {{ requiredSentences }} câu) rồi nhờ AI chữa: chấm điểm, gạch chủ ngữ–động từ, sửa từng câu.
      <b>Bài mẫu chỉ hiện sau khi bạn nộp</b> — để đối chiếu, không phải để chép.
    </p>

    <div class="wc-timed">
      <label class="wc-timed-toggle">
        <input type="checkbox" v-model="timedOn" /> ⏱ Luyện tính giờ (mô phỏng phòng thi)
      </label>
      <CountdownTimer v-if="timedOn" :minutes="20" label="Viết trong" @timeup="timeUp = true" />
      <p v-if="timeUp" class="wc-timeup">⏱ Hết giờ! Trong phòng thi bạn cần viết xong trong khoảng thời gian này. Cứ hoàn thành nốt để luyện nhé.</p>
    </div>

    <textarea
      v-model="writingText"
      class="write-area"
      rows="9"
      placeholder="Viết bài của bạn ở đây… (mở bài – thân bài – kết bài)"
      @change="saveDraft"
    ></textarea>
    <div class="write-foot">
      <span class="write-count" :class="{ ok: writingMet }">✍️ {{ writtenCount }}/{{ requiredSentences }} câu</span>
      <button
        class="green-btn"
        :class="{ locked: !writingMet || reviewing || !isOnline }"
        :disabled="!writingMet || reviewing || !isOnline"
        :title="!isOnline && writingMet ? 'Cần có mạng để AI chữa bài' : undefined"
        @click="askAiCorrect"
      >
        {{ reviewing ? '🤖 AI đang chữa…' : !isOnline && writingMet ? '🔌 Cần có mạng' : writingDone ? '↻ Nhờ AI chữa lại' : writingMet ? '🤖 Nhờ AI chữa bài' : `Cần thêm ${Math.max(0, requiredSentences - writtenCount)} câu` }}
      </button>
    </div>
    <div v-if="reviewError" class="rev-error">⚠️ {{ reviewError }}</div>

    <!-- KẾT QUẢ AI CHỮA BÀI -->
    <AiReviewCard v-if="review" :review="review" />

    <!-- BÀI MẪU — chỉ mở SAU KHI nộp (đối chiếu, không chép) -->
    <details v-if="showSamples && samplesHtml" class="wc-samples" open>
      <summary>📖 Xem bài mẫu để đối chiếu (đã nộp bài)</summary>
      <div class="prose" v-html="samplesHtml"></div>
    </details>
    <p v-else-if="samplesHtml" class="wc-locked">🔒 Bài mẫu sẽ hiện sau khi bạn tự viết & nộp bài.</p>
  </section>
</template>

<style scoped src="./ieltsDaySection.css"></style>
<style scoped>
.wc-timed {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wc-timed-toggle {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--slate);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.wc-timeup {
  font-size: 13.5px;
  font-weight: 600;
  color: #b5730b;
  background: rgba(255, 176, 32, 0.1);
  border-radius: 10px;
  padding: 10px 13px;
}
.wc-prompt {
  margin-top: 14px;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--ink);
  background: var(--bg);
  border-left: 3px solid var(--purple);
  border-radius: 12px;
  padding: 12px 15px;
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
.wc-samples {
  margin-top: 18px;
  border: 1px solid rgba(108, 92, 231, 0.22);
  border-radius: 14px;
  background: rgba(108, 92, 231, 0.04);
  padding: 0 16px;
}
.wc-samples > summary {
  cursor: pointer;
  padding: 12px 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #6c5ce7;
  list-style: none;
}
.wc-samples > summary::-webkit-details-marker {
  display: none;
}
.wc-locked {
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
