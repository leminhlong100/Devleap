<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { speak, canSpeak, wpmRateForWeek } from '@/lib/speak'
import { listeningStageOf } from '@/data/ieltsListeningStage'
import { dictationClipForWeek } from '@/lib/dictationClip'
import { loadYouTubeApi } from '@/lib/youtube'

const props = defineProps({
  sentences: { type: Array, default: () => [] }, // câu mẫu đúng để nghe-chép (giai đoạn TTS)
  week: { type: [String, Number], default: null }, // tuần hiện tại -> chỉnh tốc độ TTS theo thang WPM
  // Khóa comm: luôn dùng TTS câu của buổi, KHÔNG kéo clip shadowing IELTS (off-topic).
  forceTts: { type: Boolean, default: false },
})
const emit = defineEmits(['done'])

// —— Giai đoạn nghe "clip gốc" (Tuần 7+, xem ieltsListeningStage.js): lấy 5 câu
// từ clip shadowing THẬT đã curate cho tuần (Bước 1.3) thay vì câu TTS mặc định.
// Không có clip curate cho tuần đó -> rơi về TTS như cũ (an toàn ngược).
const useReal = computed(() => !props.forceTts && listeningStageOf(props.week) === 'native')
const realClip = ref(null) // { videoId, title, sentences } | null
const realLoading = ref(false)
async function loadReal(week) {
  if (!useReal.value) {
    realClip.value = null
    return
  }
  realLoading.value = true
  try {
    realClip.value = await dictationClipForWeek(week, 5)
  } catch {
    realClip.value = null
  } finally {
    realLoading.value = false
  }
}
watch(() => props.week, (w) => loadReal(w), { immediate: true })

// Tối đa 5 câu/buổi cho vừa sức. Khi đang tải clip thật thì để rỗng (tránh chớp
// đổi từ câu TTS sang câu thật giữa chừng nếu người học gõ trước lúc tải xong).
const items = computed(() => {
  if (useReal.value && realLoading.value) return []
  if (realClip.value) return realClip.value.sentences.map((s) => ({ text: s.text, start: s.start, end: s.end }))
  return props.sentences.filter(Boolean).slice(0, 5).map((text) => ({ text, start: null, end: null }))
})
const speakable = canSpeak()
const baseRate = computed(() => wpmRateForWeek(props.week))

const answers = ref([])
const results = ref([]) // null = chưa kiểm tra; số 0..100 = % đúng
watch(
  items,
  (v) => {
    answers.value = v.map(() => '')
    results.value = v.map(() => null)
  },
  { immediate: true },
)

// ---- Phát đoạn start–end thật từ YouTube player (cùng cách ShadowingPlayer.vue
// dùng) — chỉ dựng player khi có clip thật, giữ nguyên nhánh TTS cũ khi không có. ----
const mountEl = ref(null)
let player = null
const playerReady = ref(false)
let watcher = null
const PAD = 0.15
const startOf = (item) => Math.max(0, item.start - PAD)
const endOf = (item) => item.end + PAD
function clearWatcher() {
  if (watcher) {
    clearInterval(watcher)
    watcher = null
  }
}
async function ensurePlayer(videoId) {
  if (player) {
    if (playerReady.value) player.loadVideoById(videoId)
    return
  }
  const YT = await loadYouTubeApi()
  player = new YT.Player(mountEl.value, {
    videoId,
    playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
    events: { onReady: () => (playerReady.value = true) },
  })
}
watch(realClip, async (c) => {
  if (!c) return
  await nextTick()
  ensurePlayer(c.videoId)
})
function playReal(item, slow) {
  if (!player || !playerReady.value) return
  clearWatcher()
  player.setPlaybackRate(slow ? 0.75 : 1)
  player.seekTo(startOf(item), true)
  player.playVideo()
  watcher = setInterval(() => {
    const t = player.getCurrentTime?.() ?? 0
    if (t >= endOf(item) - 0.05) {
      player.pauseVideo()
      clearWatcher()
    }
  }, 80)
}
onBeforeUnmount(() => {
  clearWatcher()
  player?.destroy?.()
})

function canPlay(i) {
  const item = items.value[i]
  if (!item) return false
  return item.start != null ? playerReady.value : speakable
}
function play(i, slow) {
  const item = items.value[i]
  if (!item) return
  if (item.start != null) playReal(item, slow)
  else if (speakable) speak(item.text, slow ? baseRate.value * 0.68 : baseRate.value)
}

// Chuẩn hóa: bỏ dấu câu, về chữ thường, tách từ.
function words(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[.,!?;:"'’“”()-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function check(i) {
  const correct = words(items.value[i]?.text)
  const got = words(answers.value[i])
  if (!got.length) return
  let hit = 0
  const used = [...correct]
  for (const g of got) {
    const k = used.indexOf(g)
    if (k >= 0) {
      hit++
      used.splice(k, 1)
    }
  }
  const pct = correct.length ? Math.round((hit / correct.length) * 100) : 0
  results.value[i] = pct
}

// Đánh dấu từng từ để học biết chỗ sai (so với câu gốc).
function marked(i) {
  if (results.value[i] === null) return []
  const got = new Set(words(answers.value[i]))
  return words(items.value[i]?.text).map((w) => ({ w, ok: got.has(w) }))
}

const doneCount = computed(() => results.value.filter((r) => r !== null && r >= 60).length)
const allDone = computed(() => items.value.length > 0 && doneCount.value >= items.value.length)
const isDone = ref(false)
function markDone() {
  isDone.value = true
  emit('done')
}
</script>

<template>
  <section v-if="items.length" class="step-card" :class="{ current: !isDone }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: isDone }">LUYỆN NGHE · NGHE–CHÉP</div>
        <h2 class="step-title">🎧 Nghe và chép lại câu</h2>
      </div>
      <span class="wt-badge" :class="{ ok: allDone }">{{ doneCount }}/{{ items.length }}</span>
    </div>
    <p v-if="!realClip && !speakable" class="quiz-intro warn">⚠️ Trình duyệt chưa hỗ trợ phát âm. Hãy dùng Chrome/Edge để nghe.</p>
    <p v-if="realClip" class="quiz-intro real">🎥 Đoạn nghe lấy từ clip thật: <b>{{ realClip.title }}</b> — giọng tự nhiên, khó hơn TTS một chút.</p>
    <p class="quiz-intro">Bấm ▶ để nghe (🐢 = chậm), gõ lại đúng câu em nghe được rồi bấm <b>Kiểm tra</b>. Đạt ≥60% từ là qua.</p>
    <div v-if="realClip" class="ld-real-video"><div ref="mountEl"></div></div>

    <div class="ld-list">
      <div v-for="(s, i) in items" :key="i" class="ld-row">
        <div class="ld-num">{{ i + 1 }}</div>
        <div class="ld-body">
          <div class="ld-controls">
            <button class="ld-play" @click="play(i, false)" :disabled="!canPlay(i)">▶ Nghe</button>
            <button class="ld-play slow" @click="play(i, true)" :disabled="!canPlay(i)">🐢 Chậm</button>
            <span v-if="results[i] !== null" class="ld-score" :class="{ ok: results[i] >= 60 }">{{ results[i] }}% đúng</span>
          </div>
          <div class="ld-input-row">
            <input
              v-model="answers[i]"
              class="ld-input"
              placeholder="Gõ lại câu em nghe được…"
              @keydown.enter="check(i)"
            />
            <button class="ld-check" @click="check(i)">Kiểm tra</button>
          </div>
          <div v-if="results[i] !== null" class="ld-answer">
            <span class="ld-answer-label">Đáp án:</span>
            <span class="ld-marked">
              <span v-for="(m, k) in marked(i)" :key="k" class="ld-word" :class="{ miss: !m.ok }">{{ m.w }} </span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <button v-if="!isDone" class="green-btn" :class="{ locked: !allDone }" @click="markDone">
      {{ allDone ? '✓ Nghe tốt rồi, học tiếp →' : `Cần đạt ${items.length - doneCount} câu nữa` }}
    </button>
    <div v-else class="gate-line ok">✅ Đã hoàn thành phần luyện nghe.</div>
  </section>
</template>

<style scoped>
.ld-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
}
.ld-row {
  display: flex;
  gap: 10px;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
}
.ld-num {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  min-width: 16px;
  padding-top: 6px;
}
.ld-body {
  flex: 1;
}
.ld-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.ld-play {
  border: 1px solid var(--border-strong);
  background: var(--surface-2);
  border-radius: 8px;
  padding: 5px 12px;
  min-height: 44px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-primary);
  touch-action: manipulation;
}
@media (hover: hover) {
  .ld-play:hover {
    background: var(--surface-1);
  }
}
.ld-play:active {
  background: var(--surface-1);
}
.ld-play.slow {
  color: var(--text-secondary);
}
.ld-play:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ld-score {
  font-size: 12px;
  color: var(--text-warning);
  font-weight: 500;
}
.ld-score.ok {
  color: var(--text-success);
}
.ld-input-row {
  display: flex;
  gap: 8px;
}
.ld-input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 7px 11px;
  font-size: 16px;
  background: var(--surface-2);
  color: var(--text-primary);
  outline: none;
  font-family: inherit;
}
.ld-input:focus {
  border-color: var(--border-accent);
}
.ld-check {
  border: none;
  background: var(--fill-accent, #2f6df6);
  color: #fff;
  border-radius: 8px;
  padding: 7px 14px;
  min-height: 44px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  touch-action: manipulation;
}
.ld-check:active {
  opacity: 0.85;
}
.ld-answer {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
}
.ld-answer-label {
  color: var(--text-muted);
  margin-right: 6px;
}
.ld-word {
  color: var(--text-success);
  margin-right: 5px;
  display: inline-block;
}
.ld-word.miss {
  color: var(--text-danger);
  text-decoration: underline;
  text-decoration-style: wavy;
}
.quiz-intro.warn {
  color: var(--text-warning);
}
.quiz-intro.real {
  color: var(--text-secondary);
}
.ld-real-video {
  width: 100%;
  max-width: 320px;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  margin-bottom: 14px;
}
.ld-real-video > div {
  width: 100%;
  height: 100%;
}
.ld-real-video :deep(iframe) {
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
