<script setup>
/**
 * QUAN TRỌNG: block này KHÔNG dùng SpeechRecognition (STT) để chấm — chỉ ghi
 * âm (MediaRecorder) rồi cho học viên TỰ ĐÁNH GIÁ + nghe lại bản ghi của mình.
 * Trang buổi comm vừa có 🔊 "Nghe mẫu" (TTS) vừa có nhiều mic khác nhau; bật
 * SpeechRecognition ở block này từng làm ĐỨNG CẢ TAB (TTS+STT chạy chồng nhau
 * là bug đã biết của Chrome). Ghi âm thường (MediaRecorder) không đụng tới
 * SpeechRecognition nên không dính bug đó. Xem thêm lib/speak.js#stopSpeaking.
 */
import { ref, computed, watch, onUnmounted } from 'vue'
import { speak, canSpeak } from '@/lib/speak'
import { recordingSupported, startRecording } from '@/lib/recorder'
import SpeechSupportNote from '@/components/common/SpeechSupportNote.vue'
import { pairsForWeek } from '@/data/minimalPairs'

const props = defineProps({
  // [{ term, ipa }] — từ vựng + cụm của buổi để luyện phát âm
  items: { type: Array, default: () => [] },
  tip: { type: String, default: 'Chú ý phát âm rõ ÂM CUỐI (liked /t/, books /s/) và trọng âm của từ.' },
  // Tuần hiện tại — dùng để chọn 8 cặp tối thiểu luyện âm cuối (mở từ Tuần 2).
  week: { type: [Number, String], default: 0 },
  // Từ vựng đã học trong tuần — ưu tiên chọn cặp tối thiểu chứa từ này.
  vocabTerms: { type: Array, default: () => [] },
  // Khóa học — 'comm' dùng bộ cặp tối thiểu riêng cho giao tiếp (COMM_WEEK_FOCUS)
  // và bật phần cặp tối thiểu ngay từ Tuần 1.
  course: { type: String, default: '' },
  // Nhóm âm remediation cá nhân hóa (kế hoạch cải tiến #8): nếu có, cặp tối thiểu
  // lấy ĐÚNG các nhóm này (âm học viên hay lẫn thật), thay cho lịch tuần cứng.
  priorityGroups: { type: Array, default: () => [] },
  // Chế độ CHỈ luyện cặp tối thiểu (bỏ phần đọc-to cụm) — dùng cho block "phục thù
  // phát âm" nhắm đúng chỗ yếu, không kèm cả bộ từ vựng buổi.
  pairsOnly: { type: Boolean, default: false },
})
const emit = defineEmits(['done', 'stats', 'mpAttempt'])

// —— Cặp tối thiểu (minimal pairs) — chấm âm cuối/âm khó TIN ĐƯỢC ——
// Web Speech API tự "sửa" âm cuối khi chấm 1 từ đơn (đọc "book" vẫn ra "book"
// dù thiếu "-s"), nên điểm ở trên không đo được âm cuối/ngữ điệu thật. Nhưng khi
// đối chiếu với TỪ THỨ HAI khác chỉ ở âm cuối/âm khó, nếu đọc sai thì máy sẽ
// nhận ra thành từ KHÁC — nhờ vậy phân biệt được 2 từ khác nhau là cách chấm
// đáng tin cậy hơn. Nhóm + phân bổ theo tuần: src/data/minimalPairs.js.
const mpFocus = computed(() => pairsForWeek(props.week, props.vocabTerms, props.course, props.priorityGroups))
// Khóa comm luyện cặp tối thiểu ngay từ Tuần 1; khóa Nền Tảng vẫn mở từ Tuần 2.
// Chế độ pairsOnly / có priorityGroups (remediation) thì luôn hiện cặp tối thiểu.
const showMinimalPairs = computed(
  () => props.pairsOnly || props.priorityGroups.length > 0 || props.course === 'comm' || Number(props.week) >= 2,
)
const minimalPairs = computed(() => mpFocus.value.pairs)
// Nhãn nhóm âm của từng cặp — để quy lỗi "nghe nhầm" về đúng nhóm khi track confusions.
const pairGroups = computed(() => mpFocus.value.pairGroups || [])
const mpTarget = ref([]) // index (0|1) trong cặp — từ người học cần đọc
const mpResults = ref([]) // null | { heard, ok, confused }
watch(
  minimalPairs,
  (v) => {
    mpTarget.value = v.map(() => (Math.random() < 0.5 ? 0 : 1))
    mpResults.value = v.map(() => null)
  },
  { immediate: true },
)
const mpBusy = ref(-1) // index đang GHI ÂM (chưa dừng)
const mpErr = ref('')
let mpRecHandle = null

function playMinimalTarget(i) {
  const pair = minimalPairs.value[i]
  if (speakable && pair) speak(pair[mpTarget.value[i]])
}

function revoke(url) {
  if (url) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    }
  }
}

// Ghi âm đơn giản (MediaRecorder) — KHÔNG chấm tự động. Bấm lần 1 để bắt đầu
// ghi, bấm lại để dừng -> hiện nút nghe lại bản ghi + tự đánh giá đúng/sai.
async function toggleMinimalPair(i) {
  if (mpBusy.value === i) {
    try {
      const blob = await mpRecHandle?.stop()
      if (blob) {
        revoke(mpResults.value[i]?.audioUrl)
        mpResults.value[i] = { audioUrl: URL.createObjectURL(blob), ok: null, selfAssessed: false }
      }
    } catch {
      mpErr.value = 'Ghi âm lỗi — kiểm tra micro.'
    } finally {
      mpRecHandle = null
      mpBusy.value = -1
    }
    return
  }
  if (!recordable || mpBusy.value >= 0) return
  mpErr.value = ''
  try {
    mpRecHandle = await startRecording()
    mpBusy.value = i
  } catch {
    mpErr.value = 'Không dùng được micro — kiểm tra quyền truy cập.'
  }
}

const list = computed(() => props.items.filter((x) => x && x.term).slice(0, 8))
const speakable = canSpeak()
const recordable = recordingSupported()

const results = ref([]) // null | { audioUrl, ok, selfAssessed }
watch(list, (v) => (results.value = v.map(() => null)), { immediate: true })

const busyIndex = ref(-1) // index đang GHI ÂM (chưa dừng)
const err = ref('')
let recHandle = null

function play(term) {
  if (speakable) speak(term)
}

// Ghi âm đơn giản (MediaRecorder) — KHÔNG chấm tự động, chỉ ghi + cho nghe lại
// rồi tự đánh giá đúng/sai bằng 2 nút bên dưới.
async function toggleRecord(i) {
  if (busyIndex.value === i) {
    try {
      const blob = await recHandle?.stop()
      if (blob) {
        revoke(results.value[i]?.audioUrl)
        results.value[i] = { audioUrl: URL.createObjectURL(blob), ok: null, selfAssessed: false }
      }
    } catch {
      err.value = 'Ghi âm lỗi — kiểm tra micro.'
    } finally {
      recHandle = null
      busyIndex.value = -1
    }
    return
  }
  if (!recordable || busyIndex.value >= 0) return
  err.value = ''
  try {
    recHandle = await startRecording()
    busyIndex.value = i
  } catch {
    err.value = 'Không dùng được micro — kiểm tra quyền truy cập.'
  }
}

// Tự đánh giá "Đọc được / Chưa được" — dùng cho CẢ 2 trường hợp: đã ghi âm
// xong (nghe lại rồi tự chấm), lẫn khi trình duyệt không ghi âm được.
function selfAssess(i, ok) {
  results.value[i] = { ...(results.value[i] || {}), ok, selfAssessed: true }
}
function selfAssessMp(i, ok) {
  mpResults.value[i] = { ...(mpResults.value[i] || {}), ok, selfAssessed: true }
  // Tự báo cáo (không còn chấm máy) — dùng làm tín hiệu gần đúng cho remediation (#8).
  emit('mpAttempt', { group: pairGroups.value[i] || mpFocus.value.groupKey, confused: !ok })
}

const doneCount = computed(() => results.value.filter((r) => r && r.ok).length)
const enough = computed(() => list.value.length > 0 && doneCount.value >= Math.ceil(list.value.length * 0.6))
const isDone = ref(false)

// —— Số khách quan cho debrief (kế hoạch "Nói Tự Tin" Trục A) ——
// pronScore = % lần đọc-to trúng trên tổng số lần ĐÃ THỬ (cả cụm + cặp tối thiểu),
// confusions = số lần "nghe nhầm thành từ khác" ở cặp tối thiểu (dấu hiệu âm cuối/âm
// khó chưa rõ). Chỉ đưa số này cho LLM tham khảo khi viết nhận xét "độ dễ hiểu" —
// KHÔNG chấm phát âm bằng LLM (Groq không nghe được âm thật).
const pronStats = computed(() => {
  const all = [...results.value, ...(showMinimalPairs.value ? mpResults.value : [])].filter(Boolean)
  const attempted = all.length
  const correct = all.filter((r) => r.ok).length
  // Không còn STT nên không biết "nghe nhầm thành từ khác" chính xác — dùng tự
  // đánh giá SAI ở cặp tối thiểu làm tín hiệu gần đúng thay thế.
  const confusions = mpResults.value.filter((r) => r && r.selfAssessed && !r.ok).length
  return {
    attempted,
    confusions,
    pronScore: attempted ? Math.round((correct / attempted) * 100) : null,
  }
})
watch(pronStats, (s) => emit('stats', s), { deep: true })

function markDone() {
  isDone.value = true
  emit('done')
}

onUnmounted(() => {
  results.value.forEach((r) => revoke(r?.audioUrl))
  mpResults.value.forEach((r) => revoke(r?.audioUrl))
})
</script>

<template>
  <section v-if="pairsOnly ? minimalPairs.length : list.length" class="step-card" :class="{ current: !isDone && !pairsOnly, remedial: pairsOnly }">
    <!-- Chế độ remediation "phục thù phát âm": chỉ header nhắm chỗ yếu, không đọc-to -->
    <div v-if="pairsOnly" class="step-head">
      <div>
        <div class="eyebrow">🎯 PHỤC THÙ PHÁT ÂM · ÂM BẠN HAY LẪN</div>
        <h2 class="step-title">Vá lại: {{ mpFocus.groupLabel }}</h2>
      </div>
    </div>
    <p v-if="pairsOnly" class="quiz-intro">
      Đây là âm bạn <b>hay nghe nhầm</b> qua các buổi. Luyện lại đúng nó cho tới khi máy phân biệt được —
      đây mới là thứ khiến người nghe hiểu bạn ngay.
    </p>

    <template v-if="!pairsOnly">
      <div class="step-head">
        <div>
          <div class="eyebrow" :class="{ green: isDone }">LUYỆN PHÁT ÂM · NGHE → NÓI</div>
          <h2 class="step-title">🗣️ Phát âm chuẩn từng từ</h2>
        </div>
        <span class="wt-badge" :class="{ ok: enough }">{{ doneCount }}/{{ list.length }}</span>
      </div>
      <p class="quiz-intro">Bấm 🔊 nghe mẫu, rồi bấm 🎤 ghi âm giọng đọc, nghe lại rồi tự chấm. <b>{{ tip }}</b></p>
      <SpeechSupportNote
        :visible="!recordable"
        text="Trình duyệt chưa hỗ trợ ghi âm — hãy nghe mẫu rồi tự đánh giá bằng 2 nút bên dưới."
      />
      <p v-if="err" class="quiz-intro warn">⚠️ {{ err }}</p>

      <div class="pd-grid">
        <div v-for="(it, i) in list" :key="i" class="pd-card" :class="{ ok: results[i] && results[i].ok, bad: results[i] && results[i].ok === false }">
          <div class="pd-term">{{ it.term }}</div>
          <div v-if="it.ipa" class="pd-ipa">{{ it.ipa }}</div>
          <div class="pd-actions">
            <button class="pd-btn" @click="play(it.term)" :disabled="!speakable" aria-label="Nghe mẫu">🔊</button>
            <button
              v-if="recordable"
              class="pd-btn mic"
              :class="{ rec: busyIndex === i }"
              @click="toggleRecord(i)"
              :disabled="busyIndex >= 0 && busyIndex !== i"
              aria-label="Ghi âm"
            >
              {{ busyIndex === i ? '⏹️ Dừng' : '🎤 Ghi âm' }}
            </button>
          </div>
          <div v-if="results[i]?.audioUrl" class="pd-playback">
            <audio :src="results[i].audioUrl" controls></audio>
          </div>
          <div v-if="!recordable || results[i]?.audioUrl" class="pd-actions">
            <button class="pd-btn self-ok" @click="selfAssess(i, true)" aria-label="Đọc được">✅ Đọc được</button>
            <button class="pd-btn self-bad" @click="selfAssess(i, false)" aria-label="Chưa đọc được">🙁 Chưa được</button>
          </div>
          <div v-if="results[i] && results[i].selfAssessed" class="pd-feedback">
            <span v-if="results[i].ok" class="pd-ok">✓ Tốt!</span>
            <span v-else class="pd-bad">Luyện thêm rồi thử lại nhé.</span>
          </div>
        </div>
      </div>

      <button v-if="!isDone" class="green-btn" :class="{ locked: !enough }" @click="markDone">
        {{ enough ? '✓ Phát âm ổn rồi, học tiếp →' : `Đọc đúng thêm ${Math.max(0, Math.ceil(list.length * 0.6) - doneCount)} từ` }}
      </button>
      <div v-else class="gate-line ok">✅ Đã hoàn thành phần luyện phát âm.</div>
    </template>

    <!-- CẶP TỐI THIỂU — chấm âm khó tin được (phân biệt 2 từ khác nhau) -->
    <div v-if="showMinimalPairs" class="pd-mp" :class="{ solo: pairsOnly }">
      <div v-if="!pairsOnly" class="step-head">
        <div>
          <div class="eyebrow">CẶP TỐI THIỂU · {{ mpFocus.groupLabel.toUpperCase() }}</div>
          <h2 class="step-title">🎯 Tuần này: {{ mpFocus.groupLabel }}</h2>
        </div>
      </div>
      <p class="quiz-intro">Bấm 🔊 nghe từ CẦN đọc, rồi bấm 🎤 ghi âm đọc đúng từ đó, nghe lại rồi tự chấm. <b>{{ mpFocus.tip }}</b></p>
      <SpeechSupportNote
        :visible="!recordable"
        text="Không ghi âm được — nghe kỹ 2 từ khác nhau ở đâu rồi tự đánh giá xem mình phát âm đúng chưa."
      />
      <p v-if="mpErr" class="quiz-intro warn">⚠️ {{ mpErr }}</p>

      <div class="pd-grid">
        <div
          v-for="(pair, i) in minimalPairs"
          :key="i"
          class="pd-card"
          :class="{ ok: mpResults[i] && mpResults[i].ok, bad: mpResults[i] && mpResults[i].ok === false }"
        >
          <div class="pd-term">{{ pair[mpTarget[i]] }}</div>
          <div class="pd-ipa">(khác với “{{ pair[1 - mpTarget[i]] }}”)</div>
          <div class="pd-actions">
            <button class="pd-btn" @click="playMinimalTarget(i)" :disabled="!speakable" aria-label="Nghe mẫu">🔊</button>
            <button
              v-if="recordable"
              class="pd-btn mic"
              :class="{ rec: mpBusy === i }"
              @click="toggleMinimalPair(i)"
              :disabled="mpBusy >= 0 && mpBusy !== i"
              aria-label="Ghi âm"
            >
              {{ mpBusy === i ? '⏹️ Dừng' : '🎤 Ghi âm' }}
            </button>
          </div>
          <div v-if="mpResults[i]?.audioUrl" class="pd-playback">
            <audio :src="mpResults[i].audioUrl" controls></audio>
          </div>
          <div v-if="!recordable || mpResults[i]?.audioUrl" class="pd-actions">
            <button class="pd-btn self-ok" @click="selfAssessMp(i, true)" aria-label="Đọc được">✅ Đọc được</button>
            <button class="pd-btn self-bad" @click="selfAssessMp(i, false)" aria-label="Chưa đọc được">🙁 Chưa được</button>
          </div>
          <div v-if="mpResults[i] && mpResults[i].selfAssessed" class="pd-feedback">
            <span v-if="mpResults[i].ok" class="pd-ok">✓ Đúng!</span>
            <span v-else class="pd-bad">Luyện thêm rồi thử lại nhé.</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pd-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.pd-card {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
}
.pd-card.ok {
  border-color: var(--border-success);
  background: var(--bg-success);
}
.pd-card.bad {
  border-color: var(--border-danger);
}
.pd-term {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}
.pd-ipa {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.pd-actions {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 10px;
}
.pd-btn {
  border: 1px solid var(--border-strong);
  background: var(--surface-2);
  border-radius: 8px;
  padding: 5px 10px;
  min-height: 44px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-primary);
}
@media (hover: hover) {
  .pd-btn:hover {
    background: var(--surface-1);
  }
}
.pd-btn:active {
  background: var(--surface-1);
}
.pd-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pd-btn.mic.rec {
  background: var(--bg-danger);
  border-color: var(--border-danger);
  color: var(--text-danger);
}
.pd-btn.self-ok,
.pd-btn.self-bad {
  font-size: 12px;
  padding: 5px 8px;
}
@media (hover: hover) {
  .pd-btn.self-ok:hover {
    background: var(--bg-success);
    border-color: var(--border-success);
  }
  .pd-btn.self-bad:hover {
    background: var(--bg-danger);
    border-color: var(--border-danger);
  }
}
.pd-btn.self-ok:active {
  background: var(--bg-success);
  border-color: var(--border-success);
}
.pd-btn.self-bad:active {
  background: var(--bg-danger);
  border-color: var(--border-danger);
}
.pd-playback {
  margin-top: 8px;
}
.pd-playback audio {
  width: 100%;
  height: 32px;
}
.pd-feedback {
  margin-top: 8px;
  font-size: 12px;
}
.pd-ok {
  color: var(--text-success);
  font-weight: 500;
}
.pd-bad {
  color: var(--text-danger);
}
.quiz-intro.warn {
  color: var(--text-warning);
}
.pd-mp {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}
.pd-mp.solo {
  margin-top: 14px;
  padding-top: 0;
  border-top: none;
}
/* Block remediation "phục thù phát âm" — viền cam nhạt để tách khỏi drill tuần */
.step-card.remedial {
  border: 1px solid rgba(255, 122, 122, 0.35);
  background: linear-gradient(135deg, rgba(255, 122, 122, 0.05), var(--surface));
}
</style>
