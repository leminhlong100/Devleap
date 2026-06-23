<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { loadYouTubeApi } from '@/lib/youtube'
import { recognitionSupported, recognizeOnce } from '@/lib/speechRecognize'
import { scoreTranscript, scoreVerdict } from '@/lib/pronounceScore'
import { useUserStore } from '@/stores/user'

// Một clip = { videoId, title, level, topic, sentences:[{id,text,start,end}] }
const props = defineProps({ clip: { type: Object, required: true } })

const sentences = computed(() => props.clip?.sentences || [])

// ---- Trình phát YouTube ----
const mountEl = ref(null)
let player = null
const playerReady = ref(false)
let watcher = null // setInterval theo dõi để dừng đúng cuối câu

const activeId = ref(null) // câu đang chọn
const playing = ref(false)
const loop = ref(false)
const RATES = [0.5, 0.75, 1]
const rate = ref(0.75)

const activeSentence = computed(() => sentences.value.find((s) => s.id === activeId.value) || null)
const activeIndex = computed(() => sentences.value.findIndex((s) => s.id === activeId.value))

function clearWatcher() {
  if (watcher) {
    clearInterval(watcher)
    watcher = null
  }
}

// Theo dõi thời gian phát: tới cuối câu thì lặp lại (nếu bật) hoặc dừng.
function watchSentence(s) {
  clearWatcher()
  watcher = setInterval(() => {
    if (!player) return
    const t = player.getCurrentTime?.() ?? 0
    if (t >= s.end - 0.05) {
      if (loop.value) {
        player.seekTo(s.start, true)
      } else {
        player.pauseVideo()
        playing.value = false
        clearWatcher()
      }
    }
  }, 80)
}

function playSentence(s) {
  if (!player || !playerReady.value) return
  activeId.value = s.id
  player.setPlaybackRate(rate.value)
  player.seekTo(s.start, true)
  player.playVideo()
  playing.value = true
  watchSentence(s)
  scrollToActive()
}

function replay() {
  if (activeSentence.value) playSentence(activeSentence.value)
}
function pause() {
  player?.pauseVideo()
  playing.value = false
  clearWatcher()
}
function step(delta) {
  const i = activeIndex.value
  const next = i < 0 ? 0 : i + delta
  if (next >= 0 && next < sentences.value.length) playSentence(sentences.value[next])
}
function setRate(r) {
  rate.value = r
  player?.setPlaybackRate(r)
}

// ---- Tự cuộn câu đang phát vào tầm nhìn ----
const rowEls = reactive({})
async function scrollToActive() {
  await nextTick()
  rowEls[activeId.value]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// ---- Một lần "Nói thử": vừa THU (để nghe lại) vừa CHẤM (so khớp văn bản) ----
const user = useUserStore()
const canRecord = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
const canScore = recognitionSupported()

const recordings = reactive({}) // id -> objectURL bản thu của user
const scores = reactive({}) // id -> { score, words, heard, verdict }
const bestScores = reactive({}) // id -> điểm cao nhất từng câu (để tính điểm cả bài)
const attemptingId = ref(null) // câu đang thu/nghe
const attemptError = ref('')
let recognizer = null
let mediaRecorder = null
let mediaStream = null

// Thu âm best-effort (để nghe lại) — không thu được vẫn chấm điểm bình thường.
async function startRecording(s) {
  if (!canRecord) return
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    mediaStream = null
    return
  }
  const chunks = []
  mediaRecorder = new MediaRecorder(mediaStream)
  mediaRecorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
    if (recordings[s.id]) URL.revokeObjectURL(recordings[s.id])
    recordings[s.id] = URL.createObjectURL(blob)
    mediaStream?.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }
  mediaRecorder.start()
}
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
}

// Một thao tác duy nhất: thu giọng + nhận dạng để chấm, đồng thời giữ bản thu.
async function attempt(s) {
  if (attemptingId.value) return
  attemptError.value = ''
  pause() // tắt tiếng video để khỏi lẫn vào micro
  attemptingId.value = s.id
  await startRecording(s)
  recognizer = canScore ? recognizeOnce({ lang: 'en-US' }) : null
  try {
    const heard = recognizer ? await recognizer.promise : ''
    stopRecording()
    if (!canScore) {
      attemptError.value = 'Trình duyệt không chấm điểm được (cần Chrome/Edge) — vẫn lưu bản thu để bạn tự nghe lại.'
    } else if (!heard) {
      attemptError.value = 'Chưa nghe rõ — hãy nói to và rõ hơn rồi thử lại.'
    } else {
      const res = scoreTranscript(s.text, heard)
      scores[s.id] = { ...res, verdict: scoreVerdict(res.score) }
      bestScores[s.id] = Math.max(bestScores[s.id] || 0, res.score)
      saveClipResult()
    }
  } catch (e) {
    stopRecording()
    attemptError.value =
      e.message === 'unsupported'
        ? 'Trình duyệt không hỗ trợ chấm điểm giọng nói — hãy dùng Chrome hoặc Edge.'
        : 'Không truy cập được micro — hãy cấp quyền micro cho trang rồi thử lại.'
  } finally {
    attemptingId.value = null
    recognizer = null
  }
}
function stopAttempt() {
  recognizer?.stop()
  stopRecording()
}

// ---- Hoàn thành cả bài: phải XONG TẤT CẢ câu (mỗi câu ≥ SENT_PASS%) VÀ điểm
// trung bình các câu ≥ CLIP_AVG_PASS%. Hai điều kiện: không bỏ sót câu nào, đồng
// thời chất lượng chung phải đủ cao. ----
const SENT_PASS = 70
const CLIP_AVG_PASS = 80
const isSentDone = (id) => (bestScores[id] || 0) >= SENT_PASS

const attemptedCount = computed(() => sentences.value.filter((s) => bestScores[s.id] != null).length)
const doneCount = computed(() => sentences.value.filter((s) => isSentDone(s.id)).length)
const allDone = computed(() => sentences.value.length > 0 && doneCount.value === sentences.value.length)
// "Điểm" cả bài = trung bình điểm tốt nhất TẤT CẢ câu (câu chưa thử tính 0) — vừa
// dùng cho thanh tiến độ, vừa là ngưỡng đạt, vừa lưu lại.
const clipScore = computed(() => {
  const n = sentences.value.length
  if (!n) return 0
  const sum = sentences.value.reduce((acc, s) => acc + (bestScores[s.id] || 0), 0)
  return Math.round(sum / n)
})
const clipPassed = computed(() => allDone.value && clipScore.value >= CLIP_AVG_PASS)
// Nhãn cho biết còn thiếu gì để đạt (số câu chưa xong, hoặc trung bình chưa đủ).
const missLabel = computed(() => {
  if (clipPassed.value || !sentences.value.length) return ''
  if (!allDone.value) return `Còn ${sentences.value.length - doneCount.value} câu`
  return `TB ${clipScore.value}% · cần ${CLIP_AVG_PASS}%`
})
const justCompleted = ref(false)
const storedBest = computed(() => user.shadowingOf(props.clip.videoId))

function saveClipResult() {
  const before = user.shadowingPassed(props.clip.videoId)
  // Kèm điểm tốt nhất từng câu để store lưu lại (tải lại không mất tiến độ).
  user.recordShadowing(props.clip.videoId, clipScore.value, clipPassed.value, { ...bestScores })
  if (!before && user.shadowingPassed(props.clip.videoId)) justCompleted.value = true
}

// Khôi phục điểm tốt nhất từng câu đã lưu (để tải lại / mở lại bài thấy ngay tiến độ).
function hydrateBest() {
  for (const k of Object.keys(bestScores)) delete bestScores[k]
  const saved = user.shadowingSentences(props.clip.videoId)
  for (const [id, v] of Object.entries(saved)) bestScores[id] = v
}

// ---- Vòng đời player ----
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
        // 1 = playing, 2 = paused, 0 = ended
        if (e.data === 1) playing.value = true
        if (e.data === 2 || e.data === 0) playing.value = false
      },
    },
  })
}

onMounted(() => {
  hydrateBest()
  initPlayer()
})

// Đổi clip -> nạp video mới, reset trạng thái.
watch(
  () => props.clip.videoId,
  (id, old) => {
    if (id === old) return
    clearWatcher()
    stopAttempt()
    activeId.value = null
    playing.value = false
    attemptError.value = ''
    justCompleted.value = false
    // Dọn điểm/bản thu của bài cũ (kết quả đã lưu vào store rồi).
    Object.values(recordings).forEach((url) => URL.revokeObjectURL(url))
    for (const k of Object.keys(recordings)) delete recordings[k]
    for (const k of Object.keys(scores)) delete scores[k]
    hydrateBest() // nạp lại điểm từng câu đã lưu của bài mới
    if (player && playerReady.value) {
      player.loadVideoById(id)
      player.pauseVideo()
    }
  },
)

onBeforeUnmount(() => {
  clearWatcher()
  stopAttempt()
  Object.values(recordings).forEach((url) => URL.revokeObjectURL(url))
  player?.destroy?.()
})
</script>

<template>
  <div class="sh-player">
    <div class="sh-head">
      <div>
        <span class="sh-level">{{ clip.level }}</span>
        <h2 class="sh-title">{{ clip.title }}</h2>
        <p class="sh-topic">Chủ đề: {{ clip.topic }} · {{ sentences.length }} câu</p>
      </div>
    </div>

    <div class="sh-stage">
      <!-- Trình phát YouTube -->
      <div class="sh-video">
        <div ref="mountEl" class="sh-iframe"></div>
        <div v-if="!playerReady" class="sh-loading">Đang tải trình phát…</div>
      </div>

      <!-- Thanh điều khiển chung -->
      <div class="sh-bar">
        <button class="sh-ctrl" :disabled="activeIndex <= 0" title="Câu trước" @click="step(-1)">⏮</button>
        <button v-if="!playing" class="sh-ctrl primary" :disabled="!activeSentence" title="Phát lại câu" @click="replay">▶ Phát câu</button>
        <button v-else class="sh-ctrl primary" title="Tạm dừng" @click="pause">⏸ Dừng</button>
        <button class="sh-ctrl" :disabled="activeIndex < 0 || activeIndex >= sentences.length - 1" title="Câu sau" @click="step(1)">⏭</button>

        <button class="sh-ctrl toggle" :class="{ on: loop }" title="Lặp lại câu" @click="loop = !loop">🔁 Lặp</button>

        <div class="sh-rates">
          <span class="sh-rates-label">🐢 Tốc độ</span>
          <button
            v-for="r in RATES"
            :key="r"
            class="sh-rate"
            :class="{ on: rate === r }"
            @click="setRate(r)"
          >
            {{ r }}×
          </button>
        </div>
      </div>
      <p class="sh-hint">
        Bấm một câu để phát đúng đoạn đó. Bật 🔁 để lặp, giảm 🐢 tốc độ, rồi bấm
        <b>🎤 Nói thử</b> — một nút vừa <b>chấm điểm</b> vừa <b>giữ bản thu để nghe lại</b>.
      </p>
      <p v-if="!canScore" class="sh-note">
        ⓘ Chấm điểm giọng nói cần Chrome hoặc Edge. Trình duyệt khác vẫn nói thử được để tự nghe lại bản thu.
      </p>

      <!-- Tổng kết cả bài: ĐẠT khi xong TẤT CẢ câu (mỗi câu ≥ SENT_PASS%) và điểm trung bình ≥ CLIP_AVG_PASS% -->
      <div class="sh-clip-sum" :class="{ passed: clipPassed }">
        <div class="sh-sum-main">
          <div class="sh-sum-score">
            <span class="sh-sum-num">{{ clipScore }}%</span>
            <span class="sh-sum-cap">điểm TB</span>
          </div>
          <div class="sh-sum-info">
            <div class="sh-sum-bar"><div class="sh-sum-fill" :style="{ width: clipScore + '%' }"></div></div>
            <div class="sh-sum-meta">
              Cần xong tất cả {{ sentences.length }} câu (mỗi câu ≥ {{ SENT_PASS }}%) và trung bình ≥ {{ CLIP_AVG_PASS }}%
              · đã xong {{ doneCount }}/{{ sentences.length }} câu
            </div>
          </div>
        </div>
        <div v-if="clipPassed" class="sh-sum-badge done">✓ Hoàn thành</div>
        <div v-else class="sh-sum-badge">{{ missLabel }}</div>
      </div>
      <p v-if="justCompleted" class="sh-congrats">🎉 Chúc mừng! Bạn đã hoàn thành bài này (+{{ 120 }} XP).</p>

      <p v-if="attemptError" class="sh-mic-err">⚠️ {{ attemptError }}</p>

      <!-- Danh sách câu -->
      <ol class="sh-list">
        <li
          v-for="s in sentences"
          :key="s.id"
          :ref="(el) => (rowEls[s.id] = el)"
          class="sh-row"
          :class="{ active: s.id === activeId }"
        >
          <div class="sh-row-main">
            <button class="sh-play" :title="`Phát câu ${s.id}`" @click="playSentence(s)">
              {{ s.id === activeId && playing ? '🔊' : '▶' }}
            </button>
            <div class="sh-text" @click="playSentence(s)">{{ s.text }}</div>

            <div class="sh-actions">
              <span
                v-if="bestScores[s.id] != null"
                class="sh-best-chip"
                :class="{ done: isSentDone(s.id) }"
                :title="isSentDone(s.id) ? 'Câu đã đạt' : 'Điểm tốt nhất của câu'"
              >{{ isSentDone(s.id) ? '✓ ' : '' }}{{ bestScores[s.id] }}%</span>
              <button
                class="sh-score-btn"
                :class="{ listening: attemptingId === s.id, redo: scores[s.id] || recordings[s.id] }"
                :disabled="attemptingId && attemptingId !== s.id"
                :title="attemptingId === s.id ? 'Dừng' : 'Nói thử: chấm điểm + giữ bản thu'"
                @click="attemptingId === s.id ? stopAttempt() : attempt(s)"
              >
                {{ attemptingId === s.id ? '⏹ Đang nghe…' : (scores[s.id] || recordings[s.id]) ? '🎤 Nói lại' : '🎤 Nói thử' }}
              </button>
            </div>
          </div>

          <!-- Bản thu của người học để tự nghe lại -->
          <div v-if="recordings[s.id]" class="sh-playback">
            <span class="sh-playback-label">Bản thu của bạn</span>
            <audio :src="recordings[s.id]" controls class="sh-audio"></audio>
          </div>

          <!-- Kết quả chấm điểm: từ đọc đúng giữ màu, từ sai/thiếu tô đỏ gạch -->
          <div v-if="scores[s.id]" class="sh-result" :class="scores[s.id].verdict.kind">
            <div class="sh-result-top">
              <span class="sh-score-num">{{ scores[s.id].score }}%</span>
              <span class="sh-verdict">{{ scores[s.id].verdict.label }}</span>
              <span class="sh-hit">{{ scores[s.id].hit }}/{{ scores[s.id].total }} từ đúng</span>
              <span v-if="isSentDone(s.id)" class="sh-done-chip">✓ Đạt câu</span>
            </div>
            <div class="sh-words">
              <span
                v-for="(w, i) in scores[s.id].words"
                :key="i"
                class="sh-word"
                :class="{ miss: !w.ok }"
              >{{ w.word }}</span>
            </div>
            <div class="sh-heard">Bạn nói: “{{ scores[s.id].heard }}”</div>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.sh-player {
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 28px;
  padding: 28px;
  box-shadow: 0 18px 50px rgba(108, 92, 231, 0.1);
}
.sh-head {
  margin-bottom: 18px;
}
.sh-level {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  color: var(--purple);
  background: var(--purple-soft);
  padding: 3px 11px;
  border-radius: 99px;
}
.sh-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin-top: 8px;
}
.sh-topic {
  font-size: 14px;
  color: #7a7a92;
  margin-top: 4px;
}
.sh-video {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  overflow: hidden;
  background: #000;
}
/* YouTube API thay thế thẻ div bằng iframe (mất class), nên target qua .sh-video. */
.sh-iframe,
.sh-video :deep(iframe) {
  width: 100%;
  height: 100%;
  border: 0;
}
.sh-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
}
.sh-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}
.sh-ctrl {
  border: 1px solid rgba(108, 92, 231, 0.18);
  background: #fff;
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
  padding: 9px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.sh-ctrl:hover:not(:disabled) {
  background: var(--purple-soft);
}
.sh-ctrl:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.sh-ctrl.primary {
  color: #fff;
  background: var(--grad-purple);
  border: none;
}
.sh-ctrl.toggle.on {
  background: var(--purple);
  color: #fff;
  border-color: var(--purple);
}
.sh-rates {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.sh-rates-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted-2);
}
.sh-rate {
  border: 1px solid rgba(108, 92, 231, 0.18);
  background: #fff;
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
  padding: 7px 11px;
  border-radius: 10px;
  cursor: pointer;
}
.sh-rate.on {
  background: var(--purple);
  color: #fff;
  border-color: var(--purple);
}
.sh-hint {
  font-size: 13px;
  color: var(--muted);
  margin-top: 12px;
}
.sh-note {
  font-size: 12.5px;
  color: var(--muted-2);
  background: rgba(108, 92, 231, 0.06);
  border-radius: 10px;
  padding: 8px 12px;
  margin-top: 8px;
}
/* —— tổng kết cả bài —— */
.sh-clip-sum {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding: 14px 18px;
  border: 1px solid rgba(108, 92, 231, 0.16);
  border-radius: 16px;
  background: linear-gradient(135deg, #f5f3ff, #ffffff);
}
.sh-clip-sum.passed {
  border-color: rgba(0, 214, 143, 0.4);
  background: linear-gradient(135deg, #eafff6, #ffffff);
}
.sh-sum-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}
.sh-sum-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: none;
}
.sh-sum-num {
  font-size: 28px;
  font-weight: 800;
  color: var(--purple);
  line-height: 1;
}
.sh-clip-sum.passed .sh-sum-num {
  color: #00b377;
}
.sh-sum-cap {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted-2);
  margin-top: 3px;
}
.sh-sum-info {
  flex: 1;
  min-width: 0;
}
.sh-sum-bar {
  height: 9px;
  border-radius: 99px;
  background: #ececf5;
  overflow: hidden;
}
.sh-sum-fill {
  height: 100%;
  border-radius: 99px;
  background: var(--grad-brand, var(--grad-purple));
  transition: width 0.4s;
}
.sh-clip-sum.passed .sh-sum-fill {
  background: linear-gradient(90deg, #00d68f, #00b377);
}
.sh-sum-meta {
  font-size: 12.5px;
  color: var(--muted-2);
  margin-top: 7px;
}
.sh-sum-prev {
  font-weight: 700;
  color: var(--purple);
}
.sh-sum-badge {
  flex: none;
  font-size: 13px;
  font-weight: 800;
  padding: 7px 14px;
  border-radius: 99px;
  color: var(--muted-2);
  background: #efeff7;
}
.sh-sum-badge.done {
  color: #fff;
  background: linear-gradient(135deg, #00d68f, #00b377);
}
.sh-congrats {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #00936a;
  background: rgba(0, 214, 143, 0.1);
  border: 1px solid rgba(0, 214, 143, 0.3);
  padding: 10px 14px;
  border-radius: 12px;
}
.sh-score-btn.redo {
  background: #fff;
}
.sh-mic-err {
  font-size: 13px;
  font-weight: 700;
  color: #d6512b;
  background: rgba(214, 81, 43, 0.08);
  border: 1px solid rgba(214, 81, 43, 0.25);
  padding: 9px 13px;
  border-radius: 12px;
  margin-top: 12px;
}
.sh-list {
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 460px;
  overflow-y: auto;
}
.sh-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 14px;
  background: #fff;
  transition: all 0.15s;
}
.sh-row.active {
  border-color: var(--purple);
  background: linear-gradient(135deg, #f5f3ff, #ffffff);
}
.sh-row-main {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}
.sh-play {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  border: 1px solid rgba(108, 92, 231, 0.16);
  background: #fff;
  color: var(--purple);
  font-size: 15px;
  cursor: pointer;
  flex: none;
}
.sh-play:hover {
  background: var(--purple-soft);
}
.sh-text {
  font-size: 15.5px;
  line-height: 1.55;
  color: #2f2f47;
  cursor: pointer;
}
.sh-row.active .sh-text {
  font-weight: 700;
  color: var(--ink);
}
.sh-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.sh-best-chip {
  font-size: 12px;
  font-weight: 800;
  padding: 4px 9px;
  border-radius: 99px;
  color: var(--amber-ink);
  background: rgba(255, 176, 32, 0.16);
  white-space: nowrap;
}
.sh-best-chip.done {
  color: #00936a;
  background: rgba(0, 214, 143, 0.14);
}
.sh-score-btn {
  border: 1px solid rgba(108, 92, 231, 0.35);
  background: var(--purple-soft);
  color: var(--purple);
  font-size: 12.5px;
  font-weight: 700;
  padding: 7px 11px;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
}
.sh-score-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.sh-score-btn.listening {
  background: var(--purple);
  color: #fff;
  border-color: var(--purple);
  animation: sh-pulse 1s infinite;
}
.sh-rec-btn {
  border: 1px solid rgba(0, 214, 143, 0.4);
  background: rgba(0, 214, 143, 0.08);
  color: #00936a;
  font-size: 12.5px;
  font-weight: 700;
  padding: 7px 11px;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
}
.sh-rec-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.sh-rec-btn.rec {
  background: #ff4757;
  color: #fff;
  border-color: #ff4757;
  animation: sh-pulse 1s infinite;
}
@keyframes sh-pulse {
  50% {
    opacity: 0.55;
  }
}
.sh-playback {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sh-playback-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted-2);
  flex: none;
}
.sh-audio {
  height: 34px;
  width: 100%;
  max-width: 280px;
}
/* —— kết quả chấm điểm —— */
.sh-result {
  border-radius: 12px;
  padding: 12px 14px;
  background: var(--bg);
  border-left: 4px solid var(--purple);
}
.sh-result.great {
  border-left-color: #00c281;
  background: rgba(0, 214, 143, 0.07);
}
.sh-result.good {
  border-left-color: #00c281;
  background: rgba(0, 214, 143, 0.05);
}
.sh-result.ok {
  border-left-color: #ffb020;
  background: rgba(255, 176, 32, 0.08);
}
.sh-result.low {
  border-left-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.07);
}
.sh-result-top {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.sh-score-num {
  font-size: 22px;
  font-weight: 800;
  color: var(--ink);
}
.sh-verdict {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}
.sh-hit {
  font-size: 12.5px;
  color: var(--muted-2);
  font-weight: 600;
}
.sh-done-chip {
  margin-left: auto;
  font-size: 12px;
  font-weight: 800;
  color: #00936a;
  background: rgba(0, 214, 143, 0.14);
  padding: 3px 10px;
  border-radius: 99px;
}
.sh-xp {
  margin-left: auto;
  font-size: 13px;
  font-weight: 800;
  color: #00936a;
  background: rgba(0, 214, 143, 0.14);
  padding: 3px 10px;
  border-radius: 99px;
  animation: sh-pop 0.3s ease;
}
@keyframes sh-pop {
  from {
    transform: scale(0.6);
    opacity: 0;
  }
}
.sh-words {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px 7px;
}
.sh-word {
  font-size: 15px;
  font-weight: 600;
  color: #1f7a52;
}
.sh-word.miss {
  color: #d6512b;
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
  opacity: 0.75;
}
.sh-heard {
  margin-top: 10px;
  font-size: 13px;
  font-style: italic;
  color: var(--muted);
}
@media (max-width: 640px) {
  .sh-player {
    padding: 18px;
  }
  .sh-row-main {
    grid-template-columns: auto 1fr;
  }
  .sh-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
  .sh-rates {
    margin-left: 0;
  }
}
</style>
