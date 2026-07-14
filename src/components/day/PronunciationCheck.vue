<script setup>
/**
 * LUYỆN PHÁT ÂM CÓ CHẤM TỰ ĐỘNG (STT). Khác PronunciationDrill (chỉ ghi âm + tự
 * chấm): ở đây máy nghe giọng học viên (Web Speech API, recognizeOnce — MỘT lần,
 * continuous=false nên KHÔNG dính bug đứng tab) rồi so văn bản với từ mục tiêu
 * (scoreTranscript). Đúng thì đánh dấu ✓; khi TẤT CẢ từ đều đúng, tự phát 'done'
 * và hiện "Đã hoàn thành phần luyện phát âm".
 *
 * Trình duyệt không hỗ trợ nhận dạng (Safari/iOS/Firefox): rơi về tự đánh giá để
 * không chặn học viên.
 */
import { ref, computed, watch, onUnmounted } from 'vue'
import { speak, canSpeak } from '@/lib/speak'
import { recognizeOnce, recognitionSupported } from '@/lib/speechRecognize'
import { scoreTranscript } from '@/lib/pronounceScore'

const props = defineProps({
  items: { type: Array, default: () => [] }, // [{ term, ipa }]
  title: { type: String, default: '🗣️ Phát âm chuẩn từng từ' },
  passScore: { type: Number, default: 75 }, // % từ trúng để tính đúng
})
const emit = defineEmits(['done'])

const speakable = canSpeak()
const sttOk = recognitionSupported()

const list = computed(() => props.items.filter((x) => x && x.term))
const status = ref([]) // null | 'ok' | 'wrong'
const heard = ref([]) // văn bản máy nghe được
watch(
  list,
  (v) => {
    status.value = v.map(() => null)
    heard.value = v.map(() => '')
  },
  { immediate: true },
)

const busy = ref(-1)
const err = ref('')
let handle = null

const okCount = computed(() => status.value.filter((s) => s === 'ok').length)
const allDone = computed(() => list.value.length > 0 && okCount.value === list.value.length)
let emitted = false
watch(allDone, (v) => {
  if (v && !emitted) {
    emitted = true
    emit('done')
  }
})

function play(term) {
  if (speakable) speak(term)
}

async function record(i) {
  if (busy.value >= 0) return
  err.value = ''
  busy.value = i
  try {
    handle = recognizeOnce({ lang: 'en-US' })
    const text = await handle.promise
    heard.value[i] = text || ''
    const { score } = scoreTranscript(list.value[i].term, text || '')
    status.value[i] = score >= props.passScore ? 'ok' : 'wrong'
  } catch (e) {
    err.value = e?.message === 'unsupported' ? 'Trình duyệt không nghe được giọng.' : 'Không nghe rõ — thử lại nhé.'
  } finally {
    handle = null
    busy.value = -1
  }
}
function stop() {
  try {
    handle?.stop()
  } catch {
    /* ignore */
  }
}
// Fallback khi không có STT: tự xác nhận đã đọc.
function selfOk(i) {
  status.value[i] = 'ok'
}

onUnmounted(stop)
</script>

<template>
  <section v-if="list.length" class="step-card" :class="{ current: !allDone }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: allDone }">LUYỆN PHÁT ÂM · MÁY CHẤM</div>
        <h2 class="step-title">{{ title }}</h2>
      </div>
      <span class="wt-badge" :class="{ ok: allDone }">{{ okCount }}/{{ list.length }}</span>
    </div>
    <p class="quiz-intro">
      Bấm 🔊 nghe mẫu, rồi bấm 🎤 và đọc to. <b>Máy sẽ tự chấm</b> — đọc đúng cả {{ list.length }} từ thì phần này tự hoàn thành.
    </p>
    <p v-if="!sttOk" class="quiz-intro warn">
      ⚠️ Trình duyệt này chưa nghe được giọng (nên dùng Chrome/Edge). Bạn vẫn nghe mẫu rồi tự xác nhận đã đọc được.
    </p>
    <p v-if="err" class="quiz-intro warn">⚠️ {{ err }}</p>

    <div class="pc-grid">
      <div v-for="(it, i) in list" :key="i" class="pc-card" :class="status[i]">
        <div class="pc-term">{{ it.term }}</div>
        <div v-if="it.ipa" class="pc-ipa">{{ it.ipa }}</div>
        <div class="pc-actions">
          <button class="pc-btn" @click="play(it.term)" :disabled="!speakable" aria-label="Nghe mẫu">🔊</button>
          <button
            v-if="sttOk"
            class="pc-btn mic"
            :class="{ rec: busy === i }"
            @click="busy === i ? stop() : record(i)"
            :disabled="busy >= 0 && busy !== i"
          >
            {{ busy === i ? '⏹️ Đang nghe…' : '🎤 Đọc' }}
          </button>
          <button v-else class="pc-btn self" @click="selfOk(i)">✅ Đã đọc</button>
        </div>
        <div v-if="heard[i]" class="pc-heard">Máy nghe: “{{ heard[i] }}”</div>
        <div v-if="status[i] === 'ok'" class="pc-fb ok">✓ Chuẩn!</div>
        <div v-else-if="status[i] === 'wrong'" class="pc-fb bad">Chưa khớp — nghe mẫu rồi đọc lại.</div>
      </div>
    </div>

    <div v-if="allDone" class="gate-line ok">✅ Đã hoàn thành phần luyện phát âm.</div>
  </section>
</template>

<style scoped>
.pc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 6px;
}
.pc-card {
  background: var(--surface-1);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px;
  text-align: center;
}
.pc-card.ok {
  border-color: #00d68f;
  background: rgba(0, 214, 143, 0.08);
}
.pc-card.wrong {
  border-color: #ff6b6b;
}
.pc-term {
  font-size: 16px;
  font-weight: 800;
  color: var(--ink);
}
.pc-ipa {
  font-size: 12.5px;
  color: #6c5ce7;
  margin-top: 2px;
}
.pc-actions {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 10px;
}
.pc-btn {
  border: 1px solid rgba(108, 92, 231, 0.25);
  background: var(--surface);
  border-radius: 8px;
  padding: 7px 12px;
  min-height: 42px;
  font-size: 13px;
  cursor: pointer;
  color: var(--ink);
}
.pc-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pc-btn.mic.rec {
  background: rgba(255, 107, 107, 0.12);
  border-color: #ff6b6b;
  color: #d1495b;
}
.pc-heard {
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
  font-style: italic;
}
.pc-fb {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 700;
}
.pc-fb.ok {
  color: #00966a;
}
.pc-fb.bad {
  color: #d1495b;
}
.quiz-intro.warn {
  color: var(--text-warning, #b7791f);
}
</style>
