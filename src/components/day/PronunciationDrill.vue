<script setup>
import { ref, computed, watch } from 'vue'
import { speak, canSpeak } from '@/lib/speak'
import { recognizeOnce, recognitionSupported } from '@/lib/speechRecognize'
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
})
const emit = defineEmits(['done'])

// —— Cặp tối thiểu (minimal pairs) — chấm âm cuối/âm khó TIN ĐƯỢC ——
// Web Speech API tự "sửa" âm cuối khi chấm 1 từ đơn (đọc "book" vẫn ra "book"
// dù thiếu "-s"), nên điểm ở trên không đo được âm cuối/ngữ điệu thật. Nhưng khi
// đối chiếu với TỪ THỨ HAI khác chỉ ở âm cuối/âm khó, nếu đọc sai thì máy sẽ
// nhận ra thành từ KHÁC — nhờ vậy phân biệt được 2 từ khác nhau là cách chấm
// đáng tin cậy hơn. Nhóm + phân bổ theo tuần: src/data/minimalPairs.js.
const mpFocus = computed(() => pairsForWeek(props.week, props.vocabTerms))
const minimalPairs = computed(() => mpFocus.value.pairs)
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
const mpBusy = ref(-1)
const mpErr = ref('')

function playMinimalTarget(i) {
  const pair = minimalPairs.value[i]
  if (speakable && pair) speak(pair[mpTarget.value[i]])
}

async function tryMinimalPair(i) {
  if (!recordable || mpBusy.value >= 0) return
  mpErr.value = ''
  mpBusy.value = i
  try {
    const { promise } = recognizeOnce({ lang: 'en-US' })
    const heard = await promise
    const said = norm(heard)
    const pair = minimalPairs.value[i]
    const target = norm(pair[mpTarget.value[i]])
    const other = norm(pair[1 - mpTarget.value[i]])
    // So khớp CHÍNH XÁC (không dùng includes) — mục đích chính là bắt lỗi thiếu
    // âm cuối, một match lỏng sẽ che mất đúng lỗi cần phát hiện.
    const ok = !!said && said === target
    mpResults.value[i] = { heard: heard || '(không nghe rõ)', ok, confused: !ok && said === other }
  } catch {
    mpErr.value = 'Không nghe được — kiểm tra micro & dùng Chrome/Edge.'
  } finally {
    mpBusy.value = -1
  }
}

const list = computed(() => props.items.filter((x) => x && x.term).slice(0, 8))
const speakable = canSpeak()
const recordable = recognitionSupported()

const results = ref([]) // null | { heard, ok }
watch(list, (v) => (results.value = v.map(() => null)), { immediate: true })

const busyIndex = ref(-1)
const err = ref('')

function play(term) {
  if (speakable) speak(term)
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[.,!?;:"'’]/g, '')
    .trim()
}

async function tryPronounce(i) {
  if (!recordable || busyIndex.value >= 0) return
  err.value = ''
  busyIndex.value = i
  try {
    const { promise } = recognizeOnce({ lang: 'en-US' })
    const heard = await promise
    const target = norm(list.value[i].term)
    const said = norm(heard)
    // Khớp nếu nói trúng từ/cụm mục tiêu (chứa hoặc bằng).
    const ok = !!said && (said === target || said.includes(target) || target.includes(said))
    results.value[i] = { heard: heard || '(không nghe rõ)', ok }
  } catch (e) {
    err.value = 'Không nghe được — kiểm tra micro & dùng Chrome/Edge.'
  } finally {
    busyIndex.value = -1
  }
}

// Không có SpeechRecognition (Safari/iOS): không chấm máy được, cho tự đánh
// giá "Đọc được / Chưa được" thay vì khoá chết cả phần luyện phát âm.
function selfAssess(i, ok) {
  results.value[i] = { heard: '(tự đánh giá)', ok, selfAssessed: true }
}
function selfAssessMp(i, ok) {
  mpResults.value[i] = { heard: '(tự đánh giá)', ok, selfAssessed: true, confused: false }
}

const doneCount = computed(() => results.value.filter((r) => r && r.ok).length)
const enough = computed(() => list.value.length > 0 && doneCount.value >= Math.ceil(list.value.length * 0.6))
const isDone = ref(false)
function markDone() {
  isDone.value = true
  emit('done')
}
</script>

<template>
  <section v-if="list.length" class="step-card" :class="{ current: !isDone }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: isDone }">LUYỆN PHÁT ÂM · NGHE → NÓI</div>
        <h2 class="step-title">🗣️ Phát âm chuẩn từng từ</h2>
      </div>
      <span class="wt-badge" :class="{ ok: enough }">{{ doneCount }}/{{ list.length }}</span>
    </div>
    <p class="quiz-intro">Bấm 🔊 nghe mẫu, rồi bấm 🎤 và đọc to. Hệ thống chấm xem em nói có trúng không. <b>{{ tip }}</b></p>
    <SpeechSupportNote
      :visible="!recordable"
      text="Trình duyệt chưa hỗ trợ nhận diện giọng nói — hãy dùng Chrome/Edge để máy tự chấm. Ở đây em vẫn nghe mẫu rồi tự đánh giá bằng 2 nút bên dưới."
    />
    <p v-if="err" class="quiz-intro warn">⚠️ {{ err }}</p>

    <div class="pd-grid">
      <div v-for="(it, i) in list" :key="i" class="pd-card" :class="{ ok: results[i] && results[i].ok, bad: results[i] && !results[i].ok }">
        <div class="pd-term">{{ it.term }}</div>
        <div v-if="it.ipa" class="pd-ipa">{{ it.ipa }}</div>
        <div class="pd-actions">
          <button class="pd-btn" @click="play(it.term)" :disabled="!speakable" aria-label="Nghe mẫu">🔊</button>
          <button
            v-if="recordable"
            class="pd-btn mic"
            :class="{ rec: busyIndex === i }"
            @click="tryPronounce(i)"
            :disabled="busyIndex >= 0 && busyIndex !== i"
            aria-label="Đọc to"
          >
            {{ busyIndex === i ? '● Đang nghe…' : '🎤 Đọc' }}
          </button>
          <template v-else>
            <button class="pd-btn self-ok" @click="selfAssess(i, true)" aria-label="Đọc được">✅ Đọc được</button>
            <button class="pd-btn self-bad" @click="selfAssess(i, false)" aria-label="Chưa đọc được">🙁 Chưa được</button>
          </template>
        </div>
        <div v-if="results[i]" class="pd-feedback">
          <span v-if="results[i].ok" class="pd-ok">✓ Tốt!</span>
          <span v-else-if="results[i].selfAssessed" class="pd-bad">Luyện thêm rồi thử lại nhé.</span>
          <span v-else class="pd-bad">✕ Nghe ra: “{{ results[i].heard }}”</span>
        </div>
      </div>
    </div>

    <button v-if="!isDone" class="green-btn" :class="{ locked: !enough }" @click="markDone">
      {{ enough ? '✓ Phát âm ổn rồi, học tiếp →' : `Đọc đúng thêm ${Math.max(0, Math.ceil(list.length * 0.6) - doneCount)} từ` }}
    </button>
    <div v-else class="gate-line ok">✅ Đã hoàn thành phần luyện phát âm.</div>

    <!-- CẶP TỐI THIỂU — chấm âm khó tin được (phân biệt 2 từ khác nhau) -->
    <div v-if="Number(week) >= 2" class="pd-mp">
      <div class="step-head">
        <div>
          <div class="eyebrow">CẶP TỐI THIỂU · {{ mpFocus.groupLabel.toUpperCase() }}</div>
          <h2 class="step-title">🎯 Tuần này: {{ mpFocus.groupLabel }}</h2>
        </div>
      </div>
      <p class="quiz-intro">Bấm 🔊 nghe từ CẦN đọc, rồi bấm 🎤 đọc đúng từ đó (không phải từ còn lại trong cặp). <b>{{ mpFocus.tip }}</b></p>
      <SpeechSupportNote
        :visible="!recordable"
        text="Không có mic chấm điểm — nghe kỹ 2 từ khác nhau ở đâu rồi tự đánh giá xem mình phát âm đúng chưa."
      />
      <p v-if="mpErr" class="quiz-intro warn">⚠️ {{ mpErr }}</p>

      <div class="pd-grid">
        <div
          v-for="(pair, i) in minimalPairs"
          :key="i"
          class="pd-card"
          :class="{ ok: mpResults[i] && mpResults[i].ok, bad: mpResults[i] && !mpResults[i].ok }"
        >
          <div class="pd-term">{{ pair[mpTarget[i]] }}</div>
          <div class="pd-ipa">(khác với “{{ pair[1 - mpTarget[i]] }}”)</div>
          <div class="pd-actions">
            <button class="pd-btn" @click="playMinimalTarget(i)" :disabled="!speakable" aria-label="Nghe mẫu">🔊</button>
            <button
              v-if="recordable"
              class="pd-btn mic"
              :class="{ rec: mpBusy === i }"
              @click="tryMinimalPair(i)"
              :disabled="mpBusy >= 0 && mpBusy !== i"
              aria-label="Đọc to"
            >
              {{ mpBusy === i ? '● Đang nghe…' : '🎤 Đọc' }}
            </button>
            <template v-else>
              <button class="pd-btn self-ok" @click="selfAssessMp(i, true)" aria-label="Đọc được">✅ Đọc được</button>
              <button class="pd-btn self-bad" @click="selfAssessMp(i, false)" aria-label="Chưa đọc được">🙁 Chưa được</button>
            </template>
          </div>
          <div v-if="mpResults[i]" class="pd-feedback">
            <span v-if="mpResults[i].ok" class="pd-ok">✓ Đúng!</span>
            <span v-else-if="mpResults[i].confused" class="pd-bad">✕ Nghe ra “{{ pair[1 - mpTarget[i]] }}” — chú ý âm cuối!</span>
            <span v-else-if="mpResults[i].selfAssessed" class="pd-bad">Luyện thêm rồi thử lại nhé.</span>
            <span v-else class="pd-bad">✕ Nghe ra: “{{ mpResults[i].heard }}”</span>
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
  font-size: 13px;
  cursor: pointer;
  color: var(--text-primary);
}
.pd-btn:hover {
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
.pd-btn.self-ok:hover {
  background: var(--bg-success);
  border-color: var(--border-success);
}
.pd-btn.self-bad:hover {
  background: var(--bg-danger);
  border-color: var(--border-danger);
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
</style>
