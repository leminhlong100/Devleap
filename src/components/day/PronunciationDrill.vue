<script setup>
import { ref, computed, watch } from 'vue'
import { speak, canSpeak } from '@/lib/speak'
import { recognizeOnce, recognitionSupported } from '@/lib/speechRecognize'

const props = defineProps({
  // [{ term, ipa }] — từ vựng + cụm của buổi để luyện phát âm
  items: { type: Array, default: () => [] },
  tip: { type: String, default: 'Chú ý phát âm rõ ÂM CUỐI (liked /t/, books /s/) và trọng âm của từ.' },
})
const emit = defineEmits(['done'])

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
    <p v-if="!recordable" class="quiz-intro warn">⚠️ Trình duyệt chưa hỗ trợ nhận diện giọng nói — vẫn có thể nghe mẫu để luyện.</p>
    <p v-if="err" class="quiz-intro warn">⚠️ {{ err }}</p>

    <div class="pd-grid">
      <div v-for="(it, i) in list" :key="i" class="pd-card" :class="{ ok: results[i] && results[i].ok, bad: results[i] && !results[i].ok }">
        <div class="pd-term">{{ it.term }}</div>
        <div v-if="it.ipa" class="pd-ipa">{{ it.ipa }}</div>
        <div class="pd-actions">
          <button class="pd-btn" @click="play(it.term)" :disabled="!speakable" aria-label="Nghe mẫu">🔊</button>
          <button
            class="pd-btn mic"
            :class="{ rec: busyIndex === i }"
            @click="tryPronounce(i)"
            :disabled="!recordable || (busyIndex >= 0 && busyIndex !== i)"
            aria-label="Đọc to"
          >
            {{ busyIndex === i ? '● Đang nghe…' : '🎤 Đọc' }}
          </button>
        </div>
        <div v-if="results[i]" class="pd-feedback">
          <span v-if="results[i].ok" class="pd-ok">✓ Tốt!</span>
          <span v-else class="pd-bad">✕ Nghe ra: “{{ results[i].heard }}”</span>
        </div>
      </div>
    </div>

    <button v-if="!isDone" class="green-btn" :class="{ locked: !enough }" @click="markDone">
      {{ enough ? '✓ Phát âm ổn rồi, học tiếp →' : `Đọc đúng thêm ${Math.max(0, Math.ceil(list.length * 0.6) - doneCount)} từ` }}
    </button>
    <div v-else class="gate-line ok">✅ Đã hoàn thành phần luyện phát âm.</div>
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
</style>
