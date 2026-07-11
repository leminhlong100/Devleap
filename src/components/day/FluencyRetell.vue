<script setup>
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import VoiceRecorder from '@/components/day/VoiceRecorder.vue'

/**
 * Kỹ thuật 4/3/2 (fluency retell) — kế hoạch "Nói Tự Tin", Trục B.
 * Kể CÙNG MỘT nội dung 3 lượt, thời gian giảm dần (60→45→30s). Lượt sau ít thời
 * gian hơn ép người học nói TRÔI hơn, bỏ khựng, tự động hóa cụm. Lượt cuối ghi âm
 * lại (tái dùng VoiceRecorder) làm sản phẩm để nghe lại tiến bộ trong buổi.
 */
const props = defineProps({
  // Khóa lưu bản ghi lượt cuối (vd "comm:1:4:retell").
  recId: { type: String, required: true },
  // Chủ đề để kể lại (1 câu gợi ý), vd "Kể lại một ngày của bạn".
  topic: { type: String, default: 'Kể lại nội dung buổi hôm nay bằng lời của bạn.' },
  // Vài cụm gợi ý để bám khi kể (không bắt buộc).
  hints: { type: Array, default: () => [] },
})

const ROUNDS = [60, 45, 30] // giây mỗi lượt (4/3/2 rút gọn cho hội thoại)
const roundIdx = ref(0) // lượt đang/đã tới (0..3; 3 = xong 3 lượt)
const remaining = ref(0)
const running = ref(false)
let timer = null

const done = computed(() => roundIdx.value >= ROUNDS.length)
const curSeconds = computed(() => ROUNDS[Math.min(roundIdx.value, ROUNDS.length - 1)])
const mmss = computed(() => {
  const s = Math.max(0, remaining.value)
  return `0:${String(s).padStart(2, '0')}`
})

function clear() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  running.value = false
}

function startRound() {
  if (running.value || done.value) return
  remaining.value = ROUNDS[roundIdx.value]
  running.value = true
  timer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) finishRound()
  }, 1000)
}

function finishRound() {
  clear()
  if (roundIdx.value < ROUNDS.length) roundIdx.value += 1
}

// Đổi bài -> reset toàn bộ.
watch(
  () => props.recId,
  () => {
    clear()
    roundIdx.value = 0
    remaining.value = 0
  },
)

onBeforeUnmount(clear)
</script>

<template>
  <section class="step-card fr" :class="{ current: !done }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: done }">TRÔI CHẢY · KỸ THUẬT 4/3/2</div>
        <h2 class="step-title">🏃 Kể 3 lượt, mỗi lượt nhanh hơn</h2>
      </div>
      <span class="wt-badge" :class="{ ok: done }">{{ Math.min(roundIdx, ROUNDS.length) }}/{{ ROUNDS.length }}</span>
    </div>
    <p class="quiz-intro">
      Kể lại <b>cùng một nội dung</b> 3 lượt: 60s → 45s → 30s. Lượt sau ít thời gian hơn để ép bạn nói
      <b>trôi hơn, bớt khựng</b> — không cần thêm ý, chỉ cần nói mượt hơn. Nói với một người nghe tưởng tượng.
    </p>

    <div class="fr-topic">🎯 {{ topic }}</div>
    <div v-if="hints.length" class="fr-hints">
      <span v-for="(h, i) in hints" :key="i" class="fr-hint">{{ h }}</span>
    </div>

    <!-- Thanh 3 lượt + đồng hồ -->
    <div class="fr-rounds">
      <div
        v-for="(sec, i) in ROUNDS"
        :key="i"
        class="fr-round"
        :class="{ done: roundIdx > i, active: roundIdx === i }"
      >
        <span class="fr-round-n">Lượt {{ i + 1 }}</span>
        <span class="fr-round-sec">{{ sec }}s</span>
        <span v-if="roundIdx > i" class="fr-round-ico">✓</span>
      </div>
    </div>

    <div v-if="!done" class="fr-timer-wrap">
      <div v-if="running" class="fr-timer">⏱ {{ mmss }}</div>
      <button v-if="!running" class="green-btn" @click="startRound">
        ▶ Bắt đầu lượt {{ roundIdx + 1 }} · {{ curSeconds }}s
      </button>
      <button v-else class="outline-btn" @click="finishRound">Xong sớm →</button>
    </div>
    <div v-else class="gate-line ok">✅ Xong 3 lượt! Ghi âm lượt cuối bên dưới để nghe lại độ trôi chảy.</div>

    <!-- Lượt cuối: ghi âm lại làm sản phẩm -->
    <VoiceRecorder
      v-if="roundIdx >= ROUNDS.length - 1"
      :rec-id="recId"
      label='Ghi âm lượt "30 giây" — bản trôi chảy nhất'
      :sentences="hints"
    />
  </section>
</template>

<style scoped>
.fr.current {
  border: 1px solid rgba(255, 176, 32, 0.3);
}
.fr-topic {
  margin-top: 14px;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  background: rgba(255, 176, 32, 0.1);
  border-radius: 12px;
  padding: 12px 15px;
}
.fr-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.fr-hint {
  background: var(--bg);
  border: 1px solid rgba(108, 92, 231, 0.15);
  color: var(--slate);
  font-size: 13px;
  font-weight: 600;
  padding: 5px 11px;
  border-radius: 99px;
}
.fr-rounds {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.fr-round {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 6px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface);
}
.fr-round.active {
  border-color: #ffb020;
  background: rgba(255, 176, 32, 0.12);
}
.fr-round.done {
  border-color: rgba(0, 214, 143, 0.5);
}
.fr-round-n {
  font-size: 12px;
  font-weight: 800;
  color: var(--muted-2);
}
.fr-round-sec {
  font-size: 18px;
  font-weight: 800;
  color: var(--ink);
}
.fr-round-ico {
  color: #00966a;
  font-weight: 800;
}
.fr-timer-wrap {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.fr-timer {
  font-size: 30px;
  font-weight: 800;
  color: #b25f00;
  font-variant-numeric: tabular-nums;
}
.gate-line.ok {
  margin-top: 16px;
  color: var(--text-success);
  font-weight: 700;
}
</style>
