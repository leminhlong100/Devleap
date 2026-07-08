<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { loadYouTubeApi } from '@/lib/youtube'
import { clipSentenceList } from '@/lib/dictationClip'
import { useUserStore } from '@/stores/user'
import { useIsMobile } from '@/composables/useMediaQuery'
import BottomSheet from '@/components/common/BottomSheet.vue'

const isMobile = useIsMobile()
const user = useUserStore()

// Cùng hình dạng clip với ShadowingPlayer.vue: { videoId, title, level, topic,
// sentences } — sentences là mảng phẳng hoặc { ai, original }.
const props = defineProps({ clip: { type: Object, required: true } })

const sentences = computed(() =>
  clipSentenceList(props.clip).filter(
    (s) => s && s.text && typeof s.start === 'number' && typeof s.end === 'number',
  ),
)

// —— Trình phát YouTube (giống ShadowingPlayer.vue) ——
const mountEl = ref(null)
let player = null
const playerReady = ref(false)
let watcher = null
const playing = ref(false)
const RATES = [0.5, 0.75, 1, 1.25, 1.5]
const rate = ref(1)
const rateMenuOpen = ref(false)
const rateSheetOpen = ref(false) // mobile: BottomSheet thay cho dropdown (dễ tràn ở màn hẹp)
const ratesEl = ref(null)

const PAD = 0.15
const startOf = (s) => Math.max(0, s.start - PAD)
const endOf = (s) => s.end + PAD

function clearWatcher() {
  if (watcher) {
    clearInterval(watcher)
    watcher = null
  }
}
function watchSentence(s) {
  clearWatcher()
  watcher = setInterval(() => {
    if (!player) return
    const t = player.getCurrentTime?.() ?? 0
    if (t >= endOf(s) - 0.05) {
      player.pauseVideo()
      playing.value = false
      clearWatcher()
    }
  }, 80)
}

// —— Câu hiện hành + độ khó ——
const activeIndex = ref(0)
const activeSentence = computed(() => sentences.value[activeIndex.value] || null)
const difficulty = ref('normal') // 'easy' | 'normal' | 'hard'

function playSentence(i) {
  const s = sentences.value[i]
  if (!s || !player || !playerReady.value) return
  activeIndex.value = i
  player.setPlaybackRate(rate.value)
  player.seekTo(startOf(s), true)
  player.playVideo()
  playing.value = true
  watchSentence(s)
}
function replay() {
  if (activeSentence.value) playSentence(activeIndex.value)
}
function pause() {
  player?.pauseVideo()
  playing.value = false
  clearWatcher()
}
function step(delta) {
  const next = activeIndex.value + delta
  if (next >= 0 && next < sentences.value.length) playSentence(next)
}
function setRate(r) {
  rate.value = r
  player?.setPlaybackRate(r)
  rateMenuOpen.value = false
}
function onDocClick(e) {
  if (rateMenuOpen.value && ratesEl.value && !ratesEl.value.contains(e.target)) {
    rateMenuOpen.value = false
  }
}

// —— Gõ lại câu nghe được: che từng từ, hé lộ dần khi gõ đúng ——
const typed = ref('')
const revealed = reactive({}) // sentenceId -> Set<wordIndex> đã bấm 👁 lộ từ
function revealedSet(id) {
  if (!revealed[id]) revealed[id] = new Set()
  return revealed[id]
}
function normWord(w) {
  return String(w || '')
    .toLowerCase()
    .replace(/[.,!?;:"'’“”()-]/g, '')
}
const targetWords = computed(() => (activeSentence.value ? activeSentence.value.text.split(/\s+/).filter(Boolean) : []))
const typedWords = computed(() => typed.value.split(/\s+/).filter(Boolean))

function maskLen(target) {
  return difficulty.value === 'hard' ? 4 : target.length
}
function wordPill(i) {
  const target = targetWords.value[i] || ''
  const set = activeSentence.value ? revealedSet(activeSentence.value.id) : new Set()
  if (set.has(i)) return { text: target, state: 'revealed' }

  const got = typedWords.value[i]
  if (got == null) {
    // Chưa gõ tới: Dễ hé chữ đầu, Vừa/Khó che kín.
    const hint = difficulty.value === 'easy' && target ? target[0] : ''
    return { text: hint + '*'.repeat(Math.max(maskLen(target) - hint.length, 0)), state: 'pending' }
  }
  const tnorm = normWord(target)
  const gnorm = normWord(got)
  if (gnorm === tnorm) return { text: got, state: 'ok' }

  const isLast = i === typedWords.value.length - 1 && !typed.value.endsWith(' ')
  const isPrefix = gnorm.length > 0 && tnorm.startsWith(gnorm)
  const rest = difficulty.value === 'hard' ? '' : '*'.repeat(Math.max(target.length - got.length, 0))
  if (isLast && isPrefix) return { text: got + rest, state: 'typing' }
  return { text: got + rest, state: 'wrong' }
}
const pills = computed(() => targetWords.value.map((_, i) => wordPill(i)))

function revealWord(i) {
  if (!activeSentence.value) return
  revealedSet(activeSentence.value.id).add(i)
}
function revealAll() {
  if (!activeSentence.value) return
  const set = revealedSet(activeSentence.value.id)
  targetWords.value.forEach((_, i) => set.add(i))
}

// —— Chấm điểm câu hiện hành (dựa vị trí từ, từ đã lộ tính là sai) ——
const liveScore = computed(() => {
  const total = targetWords.value.length
  if (!total) return 0
  const set = activeSentence.value ? revealedSet(activeSentence.value.id) : new Set()
  let hit = 0
  for (let i = 0; i < total; i++) {
    if (set.has(i)) continue
    const got = typedWords.value[i]
    if (got && normWord(got) === normWord(targetWords.value[i])) hit++
  }
  return Math.round((hit / total) * 100)
})

// —— Tiến độ cả bài (điểm tốt nhất từng câu, giống ShadowingPlayer.vue) ——
const SENT_PASS = 70
const CLIP_AVG_PASS = 80
const bestScores = reactive({}) // id -> điểm tốt nhất
const isSentDone = (id) => (bestScores[id] || 0) >= SENT_PASS
const doneCount = computed(() => sentences.value.filter((s) => isSentDone(s.id)).length)
const allDone = computed(() => sentences.value.length > 0 && doneCount.value === sentences.value.length)
const clipScore = computed(() => {
  const n = sentences.value.length
  if (!n) return 0
  const sum = sentences.value.reduce((acc, s) => acc + (bestScores[s.id] || 0), 0)
  return Math.round(sum / n)
})
const clipPassed = computed(() => allDone.value && clipScore.value >= CLIP_AVG_PASS)
const justCompleted = ref(false)

function commitCurrent() {
  const s = activeSentence.value
  if (!s) return
  const score = liveScore.value
  bestScores[s.id] = Math.max(bestScores[s.id] || 0, score)
  const before = user.dictationPassed(props.clip.videoId)
  user.recordDictation(props.clip.videoId, clipScore.value, clipPassed.value, { ...bestScores })
  if (!before && user.dictationPassed(props.clip.videoId)) justCompleted.value = true
}
function goNext() {
  commitCurrent()
  if (activeIndex.value < sentences.value.length - 1) {
    typed.value = ''
    playSentence(activeIndex.value + 1)
  }
}
function jumpTo(i) {
  commitCurrent()
  typed.value = ''
  playSentence(i)
}

// Bảng chép (cột phải) che kín câu chưa hoàn thành bằng "****" theo từng từ —
// chỉ hiện chữ thật (xanh) sau khi câu đó đạt mốc SENT_PASS, tránh lộ đáp án
// trước khi luyện xong.
function maskSentence(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => '*'.repeat(w.length))
    .join(' ')
}

function hydrateBest() {
  for (const k of Object.keys(bestScores)) delete bestScores[k]
  const saved = user.dictationSentences(props.clip.videoId)
  for (const [id, v] of Object.entries(saved)) bestScores[id] = v
}

// —— Ẩn/hiện media & bảng chép ——
const showMedia = ref(true)
const showTranscript = ref(true)

// —— Vòng đời player ——
async function initPlayer() {
  const YT = await loadYouTubeApi()
  player = new YT.Player(mountEl.value, {
    videoId: props.clip.videoId,
    playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
    events: {
      onReady: () => {
        playerReady.value = true
        player.setPlaybackRate(rate.value)
      },
      onStateChange: (e) => {
        if (e.data === 1) playing.value = true
        if (e.data === 2 || e.data === 0) playing.value = false
      },
    },
  })
}

onMounted(() => {
  hydrateBest()
  initPlayer()
  document.addEventListener('click', onDocClick)
})

watch(
  () => props.clip.videoId,
  (id, old) => {
    if (id === old) return
    clearWatcher()
    activeIndex.value = 0
    typed.value = ''
    playing.value = false
    justCompleted.value = false
    for (const k of Object.keys(revealed)) delete revealed[k]
    hydrateBest()
    if (player && playerReady.value) {
      player.loadVideoById(id)
      player.pauseVideo()
    }
  },
)

onBeforeUnmount(() => {
  clearWatcher()
  document.removeEventListener('click', onDocClick)
  player?.destroy?.()
})
</script>

<template>
  <div class="dc-player">
    <div class="dc-head">
      <div class="dc-head-top">
        <span class="dc-crumbs">Topics <span class="dc-sep">›</span> {{ clip.topic }} <span class="dc-sep">›</span> {{ clip.title }}</span>
        <span class="dc-level">{{ clip.level }}</span>
      </div>
      <div class="dc-head-tools">
        <button class="dc-head-btn" :class="{ off: !showMedia }" @click="showMedia = !showMedia">
          {{ showMedia ? '👁 Ẩn media' : '👁 Hiện media' }}
        </button>
        <button class="dc-head-btn" :class="{ off: !showTranscript }" @click="showTranscript = !showTranscript">
          {{ showTranscript ? '☰ Ẩn transcript' : '☰ Hiện transcript' }}
        </button>
      </div>
    </div>

    <div class="dc-stage" :class="{ 'no-transcript': !showTranscript }">
      <!-- Cột trái: video -->
      <div v-if="showMedia" class="dc-left">
        <div class="dc-video">
          <div ref="mountEl" class="dc-iframe"></div>
          <div v-if="!playerReady" class="dc-loading">Đang tải trình phát…</div>
        </div>
      </div>

      <!-- Cột giữa: nhập liệu + độ khó + điều khiển -->
      <div class="dc-mid">
        <div class="dc-diff">
          <button v-for="d in ['easy', 'normal', 'hard']" :key="d" class="dc-diff-btn" :class="{ on: difficulty === d }" @click="difficulty = d">
            {{ d === 'easy' ? 'Easy' : d === 'normal' ? 'Normal' : 'Hard' }}
          </button>
        </div>

        <div class="dc-controls">
          <div class="dc-ctrl-group">
            <button class="dc-ctrl" :disabled="activeIndex <= 0" title="Câu trước" @click="jumpTo(activeIndex - 1)">‹</button>
            <button class="dc-ctrl" title="Làm mới câu" @click="typed = ''">↺</button>
            <button v-if="!playing" class="dc-ctrl primary" title="Phát" @click="replay">▶</button>
            <button v-else class="dc-ctrl primary" title="Tạm dừng" @click="pause">❚❚</button>
            <button class="dc-ctrl" :disabled="activeIndex >= sentences.length - 1" title="Câu sau" @click="jumpTo(activeIndex + 1)">›</button>
          </div>
          <div ref="ratesEl" class="dc-rates">
            <button class="dc-rate-toggle" :class="{ open: rateMenuOpen }" title="Tốc độ phát" @click="rateMenuOpen = !rateMenuOpen">
              {{ rate }}× <span class="dc-rate-caret">▾</span>
            </button>
            <div v-if="rateMenuOpen" class="dc-rate-menu">
              <button v-for="r in RATES" :key="r" class="dc-rate" :class="{ on: rate === r }" @click="setRate(r)">{{ r }}×</button>
            </div>
          </div>
        </div>

        <label class="dc-input-label">GÕ NHỮNG GÌ BẠN NGHE ĐƯỢC:</label>
        <textarea
          v-model="typed"
          class="dc-input"
          rows="3"
          placeholder="Gõ câu bạn nghe được…"
          @keydown.enter.exact.prevent="goNext"
        ></textarea>

        <div v-if="pills.length" class="dc-pills">
          <span v-for="(p, i) in pills" :key="i" class="dc-pill-wrap">
            <button
              v-if="p.state !== 'revealed'"
              class="dc-eye"
              title="Hiện từ này"
              @click="revealWord(i)"
            >👁</button>
            <span class="dc-pill" :class="`state-${p.state}`">{{ p.text }}</span>
          </span>
        </div>
        <p class="dc-hint">Các từ được tiết lộ sẽ bị tính là lỗi và ảnh hưởng đến điểm số của bạn.</p>

        <button class="dc-reveal-all" @click="revealAll">HIỆN TẤT CẢ TỪ</button>
        <button class="dc-next" @click="goNext">TIẾP THEO ›</button>

        <div class="dc-clip-sum" :class="{ passed: clipPassed }">
          <div class="dc-sum-score">
            <span class="dc-sum-num">{{ clipScore }}%</span>
            <span class="dc-sum-cap">điểm TB</span>
          </div>
          <div class="dc-sum-info">
            <div class="dc-sum-bar"><div class="dc-sum-fill" :style="{ width: clipScore + '%' }"></div></div>
            <div class="dc-sum-meta-mini">Đã xong {{ doneCount }}/{{ sentences.length }} câu</div>
          </div>
          <div v-if="clipPassed" class="dc-sum-badge done">✓ Hoàn thành</div>
        </div>
        <p v-if="justCompleted" class="dc-congrats">🎉 Hoàn thành bài này (+120 XP).</p>
      </div>

      <!-- Cột phải: bản chép (transcript tham khảo + tiến độ) -->
      <div v-if="showTranscript" class="dc-right">
        <div class="dc-list-head">
          <span class="dc-list-title">BẢN CHÉP</span>
          <span class="dc-list-pct">{{ Math.round((doneCount / (sentences.length || 1)) * 100) }}%</span>
        </div>
        <div class="dc-list-bar"><div class="dc-list-fill" :style="{ width: (doneCount / (sentences.length || 1)) * 100 + '%' }"></div></div>

        <ol class="dc-list">
          <li v-for="(s, i) in sentences" :key="s.id" class="dc-row" :class="{ active: i === activeIndex, done: isSentDone(s.id) }">
            <button class="dc-row-btn" @click="jumpTo(i)">
              <span class="dc-row-num">#{{ i + 1 }}</span>
              <span class="dc-row-text" :class="{ done: isSentDone(s.id) }">{{ isSentDone(s.id) ? s.text : maskSentence(s.text) }}</span>
              <span class="dc-row-icons">
                <span v-if="bestScores[s.id] != null && !isSentDone(s.id)" class="dc-row-chip">{{ bestScores[s.id] }}%</span>
                <span class="dc-row-icon" :class="{ ok: isSentDone(s.id) }">{{ isSentDone(s.id) ? '✓' : '○' }}</span>
              </span>
            </button>
          </li>
        </ol>
      </div>
    </div>

    <!-- ≤720px: thanh điều khiển dính đáy (thay .dc-controls ẩn ở trên) -->
    <div v-if="isMobile" class="dc-mobile-bar">
      <button class="dc-mctrl" :disabled="activeIndex <= 0" title="Câu trước" @click="jumpTo(activeIndex - 1)">⏮</button>
      <button class="dc-mctrl" title="Làm mới câu" @click="typed = ''">↺</button>
      <button v-if="!playing" class="dc-mctrl primary" title="Phát" @click="replay">▶</button>
      <button v-else class="dc-mctrl primary" title="Tạm dừng" @click="pause">❚❚</button>
      <button class="dc-mctrl" :disabled="activeIndex >= sentences.length - 1" title="Câu sau" @click="jumpTo(activeIndex + 1)">⏭</button>
      <button class="dc-mctrl" title="Tốc độ phát" @click="rateSheetOpen = true">{{ rate }}×</button>
    </div>
    <BottomSheet v-model="rateSheetOpen">
      <h3 class="dc-sheet-title">Tốc độ phát</h3>
      <div class="dc-sheet-rates">
        <button
          v-for="r in RATES"
          :key="r"
          class="dc-sheet-rate"
          :class="{ on: rate === r }"
          @click="setRate(r); rateSheetOpen = false"
        >{{ r }}×</button>
      </div>
    </BottomSheet>
  </div>
</template>

<style scoped>
.dc-player {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 18px 50px rgba(108, 92, 231, 0.08);
}
.dc-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}
.dc-head-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.dc-crumbs {
  font-size: 13.5px;
  color: var(--muted-2);
  flex: 1;
  /* KHÔNG min-width:0 — nếu không flexbox sẽ ép span này co gần về 0 khi
     .dc-head-tools chiếm hết chỗ, làm chữ xuống dòng từng chữ một (lỗi màn hẹp). */
}
.dc-sep {
  color: var(--muted-2);
  margin: 0 2px;
}
.dc-level {
  flex: none;
  font-size: 11.5px;
  font-weight: 800;
  color: var(--purple);
  background: var(--purple-soft);
  padding: 3px 11px;
  border-radius: 99px;
}
.dc-head-tools {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dc-head-btn {
  flex: 1;
  min-width: 128px;
  border: 1px solid rgba(108, 92, 231, 0.2);
  background: var(--surface);
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
  padding: 7px 12px;
  min-height: 40px;
  border-radius: 10px;
  cursor: pointer;
}
.dc-head-btn.off {
  color: var(--muted-2);
  background: var(--chip-bg);
}
@media (min-width: 640px) {
  .dc-head {
    flex-direction: row;
    align-items: center;
  }
  .dc-head-top {
    flex: 1;
    min-width: 0;
  }
  .dc-head-tools {
    flex: none;
  }
  .dc-head-btn {
    flex: none;
    min-width: 0;
  }
}

.dc-stage {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
@media (min-width: 960px) {
  .dc-stage {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 0.9fr);
    gap: 20px;
    align-items: start;
  }
  .dc-stage.no-transcript {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  }
}

.dc-video {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
}
.dc-iframe,
.dc-video :deep(iframe) {
  width: 100%;
  height: 100%;
  border: 0;
}
.dc-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
}

.dc-mid {
  border: 1px solid rgba(108, 92, 231, 0.12);
  border-radius: 18px;
  padding: 16px;
  background: var(--surface-1);
}
.dc-diff {
  display: inline-flex;
  background: var(--track-bg);
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 12px;
}
.dc-diff-btn {
  border: none;
  background: transparent;
  color: var(--muted-2);
  font-size: 12.5px;
  font-weight: 800;
  padding: 6px 14px;
  min-height: 36px;
  border-radius: 8px;
  cursor: pointer;
}
.dc-diff-btn.on {
  background: var(--surface);
  color: var(--purple);
  box-shadow: 0 2px 6px rgba(108, 92, 231, 0.18);
}
.dc-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.dc-ctrl-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
@media (max-width: 720px) {
  /* ≤720px: cụm phát/lặp + tốc độ chuyển xuống .dc-mobile-bar dính đáy, tránh
     lặp 2 bộ điều khiển trên cùng 1 màn hẹp. */
  .dc-controls {
    display: none;
  }
}
.dc-ctrl {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0 10px;
  border: 1px solid rgba(108, 92, 231, 0.18);
  background: var(--surface);
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
}
.dc-ctrl:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.dc-ctrl.primary {
  color: #fff;
  background: var(--grad-purple);
  border: none;
}
.dc-rates {
  position: relative;
  margin-left: auto;
}
.dc-rate-toggle {
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid rgba(108, 92, 231, 0.18);
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
  padding: 0 12px;
  border-radius: 10px;
  cursor: pointer;
}
.dc-rate-caret {
  font-size: 10px;
  color: var(--muted-2);
}
.dc-rate-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.18);
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(108, 92, 231, 0.18);
  min-width: 70px;
}
.dc-rate {
  border: none;
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.dc-rate.on {
  background: var(--purple);
  color: #fff;
}

.dc-input-label {
  display: block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
  color: var(--muted-2);
  margin-bottom: 6px;
}
.dc-input {
  width: 100%;
  font-family: inherit;
  font-size: 16px;
  line-height: 1.5;
  color: var(--ink);
  background: var(--surface);
  border: 1.5px solid rgba(108, 92, 231, 0.2);
  border-radius: 12px;
  padding: 10px 12px;
  resize: vertical;
}
.dc-input:focus {
  outline: none;
  border-color: var(--purple);
}

.dc-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 14px;
  margin-top: 14px;
}
.dc-pill-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.dc-eye {
  border: none;
  background: none;
  font-size: 11px;
  opacity: 0.55;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.dc-eye:hover {
  opacity: 1;
}
.dc-pill {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 4px;
}
.dc-pill.state-ok {
  color: #00b377;
}
.dc-pill.state-typing {
  color: #2f6df6;
}
.dc-pill.state-wrong {
  color: #e0455e;
}
.dc-pill.state-pending {
  color: var(--muted-2);
}
.dc-pill.state-revealed {
  color: var(--muted-2);
  text-decoration: underline dotted;
}

.dc-hint {
  margin-top: 10px;
  font-size: 11.5px;
  color: var(--muted-2);
}

.dc-reveal-all {
  display: block;
  width: 100%;
  margin-top: 12px;
  border: 1.5px solid rgba(255, 176, 32, 0.4);
  background: rgba(255, 176, 32, 0.1);
  color: var(--amber-ink);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.3px;
  padding: 11px;
  border-radius: 12px;
  cursor: pointer;
}
.dc-next {
  display: block;
  width: 100%;
  margin-top: 10px;
  border: none;
  background: var(--grad-purple);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.3px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
}

.dc-clip-sum {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(108, 92, 231, 0.14);
  border-radius: 14px;
  background: linear-gradient(135deg, #f5f3ff, #fff);
}
[data-theme='dark'] .dc-clip-sum {
  background: var(--bg-accent);
}
.dc-clip-sum.passed {
  border-color: rgba(0, 214, 143, 0.4);
  background: linear-gradient(135deg, #eafff6, #fff);
}
[data-theme='dark'] .dc-clip-sum.passed {
  background: var(--bg-success);
}
.dc-sum-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: none;
}
.dc-sum-num {
  font-size: 22px;
  font-weight: 800;
  color: var(--purple);
  line-height: 1;
}
.dc-clip-sum.passed .dc-sum-num {
  color: #00b377;
}
.dc-sum-cap {
  font-size: 10px;
  font-weight: 700;
  color: var(--muted-2);
  margin-top: 3px;
}
.dc-sum-info {
  flex: 1;
  min-width: 0;
}
.dc-sum-bar {
  height: 8px;
  border-radius: 99px;
  background: var(--track-bg);
  overflow: hidden;
}
.dc-sum-fill {
  height: 100%;
  border-radius: 99px;
  background: var(--grad-brand, var(--grad-purple));
  transition: width 0.4s;
}
.dc-clip-sum.passed .dc-sum-fill {
  background: linear-gradient(90deg, #00d68f, #00b377);
}
.dc-sum-meta-mini {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--muted-2);
  margin-top: 6px;
}
.dc-sum-badge {
  flex: none;
  font-size: 12px;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 99px;
  color: #fff;
  background: linear-gradient(135deg, #00d68f, #00b377);
}
.dc-congrats {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #00936a;
  background: rgba(0, 214, 143, 0.1);
  border: 1px solid rgba(0, 214, 143, 0.3);
  padding: 9px 13px;
  border-radius: 12px;
}

/* —— Cột phải: bản chép —— */
.dc-right {
  border: 1px solid rgba(108, 92, 231, 0.12);
  border-radius: 18px;
  padding: 14px;
  background: var(--surface-1);
}
.dc-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.dc-list-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--ink);
}
.dc-list-pct {
  font-size: 12px;
  font-weight: 800;
  color: var(--purple);
}
.dc-list-bar {
  height: 6px;
  border-radius: 99px;
  background: var(--track-bg);
  overflow: hidden;
  margin-bottom: 12px;
}
.dc-list-fill {
  height: 100%;
  border-radius: 99px;
  background: var(--grad-purple);
  transition: width 0.4s;
}
.dc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
@media (min-width: 960px) {
  .dc-list {
    max-height: calc(100vh - 220px);
    max-height: calc(100dvh - 220px);
    overflow-y: auto;
    padding-right: 4px;
  }
}
.dc-row-btn {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  text-align: left;
  padding: 9px 10px;
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 10px;
  background: var(--surface);
  cursor: pointer;
}
.dc-row.active .dc-row-btn {
  border-color: var(--purple);
  background: linear-gradient(135deg, #f5f3ff, #fff);
}
[data-theme='dark'] .dc-row.active .dc-row-btn {
  background: var(--bg-accent);
}
.dc-row-num {
  flex: none;
  font-size: 11px;
  font-weight: 800;
  color: var(--muted-2);
  padding-top: 2px;
}
.dc-row-text {
  flex: 1;
  min-width: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--muted-2);
  letter-spacing: 0.5px;
}
.dc-row-text.done {
  color: #00b377;
  font-weight: 700;
  letter-spacing: normal;
}
.dc-row-icons {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dc-row-chip {
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 99px;
  color: var(--amber-ink);
  background: rgba(255, 176, 32, 0.16);
}
.dc-row-icon {
  font-size: 13px;
  color: var(--muted-2);
}
.dc-row-icon.ok {
  color: #00b377;
}

/* —— Thanh điều khiển dính đáy (mobile) —— */
.dc-mobile-bar {
  display: none;
}
@media (max-width: 720px) {
  .dc-player {
    padding: 14px;
    border-radius: 18px;
    padding-bottom: 96px;
  }
  .dc-mobile-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(72px + var(--safe-bottom));
    z-index: 45;
    padding: 10px var(--space-page-x);
    background: var(--surface);
    border-top: 1px solid var(--line);
    backdrop-filter: blur(14px);
  }
  .dc-mctrl {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    height: 44px;
    padding: 0 10px;
    border: 1px solid rgba(108, 92, 231, 0.18);
    background: var(--surface);
    color: var(--ink);
    font-size: 14px;
    font-weight: 700;
    border-radius: 11px;
    cursor: pointer;
  }
  .dc-mctrl:disabled {
    opacity: 0.35;
  }
  .dc-mctrl.primary {
    min-width: 52px;
    height: 52px;
    font-size: 17px;
    color: #fff;
    background: var(--grad-purple);
    border: none;
  }
}

/* —— BottomSheet chọn tốc độ (mobile) —— */
.dc-sheet-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 12px;
}
.dc-sheet-rates {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.dc-sheet-rate {
  flex: 1;
  min-width: 64px;
  height: 52px;
  border: 1px solid rgba(108, 92, 231, 0.2);
  background: var(--surface);
  color: var(--ink);
  font-size: 16px;
  font-weight: 800;
  border-radius: 12px;
  cursor: pointer;
}
.dc-sheet-rate:active {
  background: var(--purple-soft);
}
.dc-sheet-rate.on {
  background: var(--purple);
  color: #fff;
  border-color: var(--purple);
}

/* —— Màn rất hẹp (≤380px): tránh badge tổng kết bị bóp méo —— */
@media (max-width: 380px) {
  .dc-clip-sum {
    flex-wrap: wrap;
  }
}
</style>
