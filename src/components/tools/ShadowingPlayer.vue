<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { loadYouTubeApi } from '@/lib/youtube'
import { recognitionSupported, recognizeOnce } from '@/lib/speechRecognize'
import { scoreTranscript, scoreVerdict } from '@/lib/pronounceScore'
import { fetchSentenceIpa } from '@/lib/ipa'
import { useUserStore } from '@/stores/user'
import SpeechSupportNote from '@/components/common/SpeechSupportNote.vue'

// Một clip = { videoId, title, level, topic, sentences } với sentences là:
//  - mảng [{id,text,start,end}] (clip gợi ý có sẵn), HOẶC
//  - { ai:[…], original:[…] } (bài tải từ URL — có cả bản gốc & bản AI).
const props = defineProps({ clip: { type: Object, required: true } })

// —— Bản gốc / AI + danh sách câu đang luyện (có thể đã chỉnh sửa) ——
const STORAGE = (vid, v) => `shadow-edit:${vid}:${v}`
const hasVariants = computed(() => {
  const s = props.clip?.sentences
  return !!s && !Array.isArray(s) && !!(s.ai || s.original)
})
const variant = ref('ai') // 'ai' | 'original'
function baseList() {
  const s = props.clip?.sentences
  if (!s) return []
  if (Array.isArray(s)) return s
  return s[variant.value] || s.ai || s.original || []
}
const working = ref([]) // danh sách câu hiện hành (sau khi áp bản sửa nếu có)
function loadWorking() {
  try {
    const saved = localStorage.getItem(STORAGE(props.clip.videoId, variant.value))
    if (saved) {
      working.value = JSON.parse(saved)
      return
    }
  } catch {
    /* localStorage bị chặn — dùng bản gốc */
  }
  working.value = baseList().map((s) => ({ ...s }))
}
function persistEdits() {
  try {
    localStorage.setItem(STORAGE(props.clip.videoId, variant.value), JSON.stringify(working.value))
  } catch {
    /* hết chỗ / bị chặn — bỏ qua */
  }
}
function setVariant(v) {
  if (v === variant.value) return
  variant.value = v
  resetPlayback()
  loadWorking()
}
const sentences = computed(() => working.value)

// ---- Trình phát YouTube ----
const mountEl = ref(null)
let player = null
const playerReady = ref(false)
let watcher = null // setInterval theo dõi để dừng đúng cuối câu

const activeId = ref(null) // câu đang chọn
const playing = ref(false)
const loop = ref(false)
const RATES = [0.5, 0.75, 1]
const rate = ref(1)
const rateMenuOpen = ref(false)
const ratesEl = ref(null)

// Đệm đầu/cuối mỗi câu (giây): phụ đề YouTube hay lệch nhẹ nên lùi điểm bắt đầu
// và nới điểm kết thúc để không bị cụt từ đầu/cuối câu.
const PAD = 0.15
const startOf = (s) => Math.max(0, s.start - PAD)
const endOf = (s) => s.end + PAD

const activeSentence = computed(() => sentences.value.find((s) => s.id === activeId.value) || null)
const activeIndex = computed(() => sentences.value.findIndex((s) => s.id === activeId.value))

// Mốc thời gian hiển thị kiểu "0:00.50 – 0:05.89 (5.4s)".
const fmtClock = (s) => {
  const m = Math.floor(s / 60)
  return `${m}:${(s - m * 60).toFixed(2).padStart(5, '0')}`
}
const fmtRange = (s) => `${fmtClock(s.start)} – ${fmtClock(s.end)} (${(s.end - s.start).toFixed(1)}s)`

function clearWatcher() {
  if (watcher) {
    clearInterval(watcher)
    watcher = null
  }
}

// Dừng phát & bỏ chọn câu (khi đổi bản gốc/AI hoặc sửa cấu trúc câu).
function resetPlayback() {
  clearWatcher()
  activeId.value = null
  playing.value = false
  player?.pauseVideo?.()
}

// ---- Chế độ sửa câu: sửa chữ, gộp với câu kế, tách tại con trỏ ----
const editing = ref(false)
const caret = reactive({}) // id -> vị trí con trỏ trong textarea
const renumber = () => working.value.forEach((s, i) => (s.id = i + 1))
function onCaret(s, e) {
  caret[s.id] = e.target.selectionStart
}
function editText(s, e) {
  s.text = e.target.value
  persistEdits()
}
function mergeDown(i) {
  const a = working.value[i]
  const b = working.value[i + 1]
  if (!a || !b) return
  a.text = `${a.text} ${b.text}`.replace(/\s+/g, ' ').trim()
  a.end = b.end
  working.value.splice(i + 1, 1)
  renumber()
  resetPlayback()
  persistEdits()
}
function splitAt(i) {
  const s = working.value[i]
  if (!s) return
  const pos = Math.min(Math.max(caret[s.id] ?? Math.floor(s.text.length / 2), 1), s.text.length - 1)
  const left = s.text.slice(0, pos).trim()
  const right = s.text.slice(pos).trim()
  if (!left || !right) return
  const mid = Math.round((s.start + (s.end - s.start) * (pos / s.text.length)) * 100) / 100
  working.value.splice(i, 1, { ...s, text: left, end: mid }, { ...s, text: right, start: mid })
  renumber()
  resetPlayback()
  persistEdits()
}
function resetEdits() {
  try {
    localStorage.removeItem(STORAGE(props.clip.videoId, variant.value))
  } catch {
    /* bỏ qua */
  }
  resetPlayback()
  loadWorking()
}

// ---- IPA dưới câu đang phát (tra theo từ, có cache) ----
const ipaOn = ref(true)
const ipaWords = ref([]) // [{ word, ipa }]
const ipaLoading = ref(false)
let ipaToken = 0
async function loadIpaFor(s) {
  ipaWords.value = []
  if (!s || !ipaOn.value) return
  const token = ++ipaToken
  ipaLoading.value = true
  try {
    const res = await fetchSentenceIpa(s.text.split(/\s+/))
    if (token === ipaToken) ipaWords.value = res
  } finally {
    if (token === ipaToken) ipaLoading.value = false
  }
}
watch([activeSentence, ipaOn], ([s]) => loadIpaFor(s))

// Theo dõi thời gian phát: tới cuối câu thì lặp lại (nếu bật) hoặc dừng.
function watchSentence(s) {
  clearWatcher()
  watcher = setInterval(() => {
    if (!player) return
    const t = player.getCurrentTime?.() ?? 0
    if (t >= endOf(s) - 0.05) {
      if (loop.value) {
        player.seekTo(startOf(s), true)
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
  player.seekTo(startOf(s), true)
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
  rateMenuOpen.value = false
}
// Đóng menu tốc độ khi bấm ra ngoài
function onDocClick(e) {
  if (rateMenuOpen.value && ratesEl.value && !ratesEl.value.contains(e.target)) {
    rateMenuOpen.value = false
  }
}

// ---- Phím tắt (desktop): Space=phát lại câu, ←/→=câu trước/sau, L=lặp, R=nói thử ----
function isTypingTarget(el) {
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}
function onKeydown(e) {
  if (!playerReady.value) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (isTypingTarget(e.target)) return
  switch (e.key) {
    case ' ': // Space: phát lại câu đang chọn (chưa chọn thì phát câu đầu)
      e.preventDefault()
      if (activeSentence.value) replay()
      else if (sentences.value.length) playSentence(sentences.value[0])
      break
    case 'ArrowLeft':
      e.preventDefault()
      step(-1)
      break
    case 'ArrowRight':
      e.preventDefault()
      step(1)
      break
    case 'l':
    case 'L':
      loop.value = !loop.value
      break
    case 'r':
    case 'R': // nói thử câu đang chọn (đang thu thì dừng)
      if (!activeSentence.value) break
      e.preventDefault()
      if (attemptingId.value === activeSentence.value.id) stopAttempt()
      else attempt(activeSentence.value)
      break
  }
}

// ---- Tự cuộn câu đang phát vào tầm nhìn ----
// Chỉ cuộn TRONG khung danh sách (không cuộn cả trang) để video luôn còn thấy.
const rowEls = reactive({})
const listEl = ref(null)
async function scrollToActive() {
  await nextTick()
  const row = rowEls[activeId.value]
  const list = listEl.value
  if (!row || !list) return
  const listRect = list.getBoundingClientRect()
  const rowRect = row.getBoundingClientRect()
  // đưa câu vào giữa khung danh sách
  const delta = rowRect.top - listRect.top - (list.clientHeight - rowRect.height) / 2
  list.scrollTo({ top: list.scrollTop + delta, behavior: 'smooth' })
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
  variant.value = 'ai'
  loadWorking()
  hydrateBest()
  initPlayer()
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
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
    editing.value = false
    variant.value = 'ai' // bài mới -> về bản AI
    loadWorking()
    ipaWords.value = []
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
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
  Object.values(recordings).forEach((url) => URL.revokeObjectURL(url))
  player?.destroy?.()
})
</script>

<template>
  <div class="sh-player">
    <div class="sh-head">
      <span class="sh-level">{{ clip.level }}</span>
      <h2 class="sh-title">{{ clip.title }}</h2>
      <p class="sh-topic">{{ clip.topic }}</p>
    </div>

    <div class="sh-stage">
      <!-- Cột trái: video + bảng điều khiển kèm câu đang luyện (dính khi cuộn) -->
      <div class="sh-left">
        <div class="sh-video">
          <div ref="mountEl" class="sh-iframe"></div>
          <div v-if="!playerReady" class="sh-loading">Đang tải trình phát…</div>
        </div>

        <!-- Bảng điều khiển + câu đang luyện -->
        <div class="sh-panel">
          <div class="sh-panel-top">
            <span class="sh-status">{{ playing ? '● Đang phát' : '❚❚ Tạm dừng' }}</span>
            <div v-if="hasVariants" class="sh-seg">
              <button class="sh-seg-btn" :class="{ on: variant === 'original' }" @click="setVariant('original')">Bản gốc</button>
              <button class="sh-seg-btn" :class="{ on: variant === 'ai' }" @click="setVariant('ai')">AI</button>
            </div>
          </div>

          <div class="sh-controls">
            <button class="sh-ctrl" :disabled="activeIndex <= 0" title="Câu trước" @click="step(-1)">⏮</button>
            <button v-if="!playing" class="sh-ctrl primary" :disabled="!activeSentence" title="Phát lại câu" @click="replay">▶</button>
            <button v-else class="sh-ctrl primary" title="Tạm dừng" @click="pause">❚❚</button>
            <button class="sh-ctrl" :disabled="activeIndex < 0 || activeIndex >= sentences.length - 1" title="Câu sau" @click="step(1)">⏭</button>
            <button class="sh-ctrl toggle" :class="{ on: loop }" title="Lặp lại câu" @click="loop = !loop">🔁</button>
            <div ref="ratesEl" class="sh-rates">
              <button class="sh-rate-toggle" :class="{ open: rateMenuOpen }" title="Tốc độ phát" @click="rateMenuOpen = !rateMenuOpen">
                {{ rate }}× <span class="sh-rate-caret">▾</span>
              </button>
              <div v-if="rateMenuOpen" class="sh-rate-menu">
                <button v-for="r in RATES" :key="r" class="sh-rate" :class="{ on: rate === r }" @click="setRate(r)">{{ r }}×</button>
              </div>
            </div>
            <button class="sh-ctrl chip" :class="{ on: ipaOn }" title="Phiên âm IPA" @click="ipaOn = !ipaOn">IPA</button>
          </div>

          <SpeechSupportNote
            :visible="!canScore"
            text="Trình duyệt này không chấm điểm giọng nói được (cần Chrome/Edge) — vẫn nghe + đọc theo + ghi âm lại nghe được bình thường, chỉ tự so với phụ đề thay vì máy chấm."
          />

          <!-- Câu đang luyện: chữ lớn + IPA dưới từng từ -->
          <div class="sh-current">
            <template v-if="activeSentence">
              <div class="sh-current-text">
                <template v-if="ipaOn && ipaWords.length">
                  <span v-for="(w, i) in ipaWords" :key="i" class="sh-cw">
                    <span class="sh-cw-text">{{ w.word }}</span>
                    <span class="sh-cw-phon">{{ w.ipa || '·' }}</span>
                  </span>
                </template>
                <span v-else class="sh-current-plain">{{ activeSentence.text }}</span>
              </div>
              <button
                class="sh-mic"
                :class="{ listening: attemptingId === activeId }"
                :title="attemptingId === activeId ? 'Dừng' : 'Nói thử'"
                @click="attemptingId === activeId ? stopAttempt() : attempt(activeSentence)"
              >🎤</button>
            </template>
            <p v-else class="sh-current-empty">Bấm một câu bên phải để bắt đầu luyện.</p>
          </div>

          <!-- Bản thu + kết quả chấm điểm của câu đang luyện -->
          <div v-if="activeSentence && recordings[activeId]" class="sh-playback">
            <audio :src="recordings[activeId]" controls class="sh-audio"></audio>
          </div>
          <div v-if="activeSentence && scores[activeId]" class="sh-result" :class="scores[activeId].verdict.kind">
            <div class="sh-result-top">
              <span class="sh-score-num">{{ scores[activeId].score }}%</span>
              <span class="sh-verdict">{{ scores[activeId].verdict.label }}</span>
              <span class="sh-hit">{{ scores[activeId].hit }}/{{ scores[activeId].total }} từ đúng</span>
            </div>
            <div class="sh-words">
              <span v-for="(w, i) in scores[activeId].words" :key="i" class="sh-word" :class="{ miss: !w.ok }">{{ w.word }}</span>
            </div>
            <div class="sh-heard">Bạn nói: “{{ scores[activeId].heard }}”</div>
            <p class="sh-score-note">💡 Điểm này đo đúng TỪ, KHÔNG đo âm cuối/ngữ điệu — trình duyệt tự "sửa" âm cuối nên điểm có thể cao ảo.</p>
          </div>
          <p v-if="attemptError" class="sh-mic-err">⚠️ {{ attemptError }}</p>
        </div>

        <!-- Tổng kết cả bài -->
        <div class="sh-clip-sum" :class="{ passed: clipPassed }">
          <div class="sh-sum-score">
            <span class="sh-sum-num">{{ clipScore }}%</span>
            <span class="sh-sum-cap">điểm TB</span>
          </div>
          <div class="sh-sum-info">
            <div class="sh-sum-bar"><div class="sh-sum-fill" :style="{ width: clipScore + '%' }"></div></div>
            <div class="sh-sum-meta-mini">Đã xong {{ doneCount }}/{{ sentences.length }} câu</div>
          </div>
          <div v-if="clipPassed" class="sh-sum-badge done">✓ Hoàn thành</div>
          <div v-else class="sh-sum-badge">{{ missLabel }}</div>
        </div>
        <p v-if="justCompleted" class="sh-congrats">🎉 Hoàn thành bài này (+120 XP).</p>
      </div>

      <!-- Cột phải: danh sách câu -->
      <div class="sh-right">
        <div class="sh-list-head">
          <span class="sh-list-count">{{ sentences.length }} câu</span>
          <div class="sh-list-tools">
            <div v-if="hasVariants" class="sh-seg">
              <button class="sh-seg-btn" :class="{ on: variant === 'original' }" @click="setVariant('original')">Bản gốc</button>
              <button class="sh-seg-btn" :class="{ on: variant === 'ai' }" @click="setVariant('ai')">AI</button>
            </div>
            <button class="sh-tool-btn" :class="{ on: editing }" title="Sửa cách ngắt câu" @click="editing = !editing">✎ {{ editing ? 'Xong' : 'Sửa' }}</button>
            <button v-if="editing" class="sh-tool-btn" title="Khôi phục bản gốc" @click="resetEdits">↺</button>
          </div>
        </div>

        <ol ref="listEl" class="sh-list">
          <li
            v-for="(s, index) in sentences"
            :key="s.id"
            :ref="(el) => (rowEls[s.id] = el)"
            class="sh-row"
            :class="{ active: s.id === activeId, done: isSentDone(s.id) }"
          >
            <!-- Chế độ sửa -->
            <div v-if="editing" class="sh-edit">
              <textarea
                class="sh-edit-text"
                :value="s.text"
                rows="2"
                @input="editText(s, $event)"
                @keyup="onCaret(s, $event)"
                @click="onCaret(s, $event)"
                @select="onCaret(s, $event)"
              ></textarea>
              <div class="sh-edit-btns">
                <button class="sh-edit-btn" title="Tách tại con trỏ" @click="splitAt(index)">✂ Tách</button>
                <button class="sh-edit-btn" :disabled="index >= sentences.length - 1" title="Gộp với câu kế" @click="mergeDown(index)">⬇ Gộp</button>
              </div>
            </div>

            <!-- Hàng câu: badge + chữ + thời gian -->
            <button v-else class="sh-row-btn" @click="playSentence(s)">
              <span class="sh-badge" :class="{ done: isSentDone(s.id) }">
                {{ isSentDone(s.id) ? '✓' : index + 1 }}
              </span>
              <span class="sh-row-body">
                <span class="sh-text">{{ s.text }}</span>
                <span class="sh-time">{{ fmtRange(s) }}</span>
              </span>
              <span v-if="bestScores[s.id] != null && !isSentDone(s.id)" class="sh-best-chip">{{ bestScores[s.id] }}%</span>
            </button>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sh-player {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 18px 50px rgba(108, 92, 231, 0.08);
}
.sh-head {
  margin-bottom: 18px;
}
.sh-level {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 800;
  color: var(--purple);
  background: var(--purple-soft);
  padding: 3px 11px;
  border-radius: 99px;
}
.sh-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin-top: 8px;
}
.sh-topic {
  font-size: 13.5px;
  color: var(--muted);
  margin-top: 4px;
}

/* —— Bố cục 2 cột —— */
.sh-stage {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
@media (min-width: 960px) {
  .sh-stage {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    gap: 22px;
    align-items: start;
  }
  .sh-left {
    position: sticky;
    top: 78px;
  }
}

/* —— Video —— */
.sh-video {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
}
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

/* —— Bảng điều khiển + câu đang luyện —— */
.sh-panel {
  margin-top: 14px;
  border: 1px solid rgba(108, 92, 231, 0.12);
  border-radius: 18px;
  padding: 14px 16px;
  background: var(--surface-1);
}
.sh-panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.sh-status {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.sh-seg {
  display: inline-flex;
  background: var(--track-bg);
  border-radius: 10px;
  padding: 3px;
}
.sh-seg-btn {
  border: none;
  background: transparent;
  color: var(--muted-2);
  font-size: 12px;
  font-weight: 800;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.sh-seg-btn.on {
  background: var(--surface);
  color: var(--purple);
  box-shadow: 0 2px 6px rgba(108, 92, 231, 0.18);
}
.sh-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sh-ctrl {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(108, 92, 231, 0.18);
  background: var(--surface);
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
  border-radius: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.sh-ctrl:hover:not(:disabled) {
  background: var(--purple-soft);
}
.sh-ctrl:disabled {
  opacity: 0.35;
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
.sh-ctrl.chip {
  font-size: 12.5px;
  font-weight: 800;
  letter-spacing: 0.3px;
}
.sh-ctrl.chip.on {
  background: var(--purple);
  color: #fff;
  border-color: var(--purple);
}
.sh-rates {
  position: relative;
  margin-left: auto;
}
.sh-rate-toggle {
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid rgba(108, 92, 231, 0.18);
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
  padding: 0 13px;
  border-radius: 11px;
  cursor: pointer;
}
.sh-rate-toggle:hover,
.sh-rate-toggle.open {
  background: var(--purple-soft);
  border-color: var(--purple);
}
.sh-rate-caret {
  font-size: 10px;
  color: var(--muted-2);
}
.sh-rate-menu {
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
  min-width: 78px;
}
.sh-rate {
  border: none;
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
}
.sh-rate:hover {
  background: var(--purple-soft);
}
.sh-rate.on {
  background: var(--purple);
  color: #fff;
}

/* —— Câu đang luyện —— */
.sh-current {
  position: relative;
  margin-top: 14px;
  padding: 18px 16px;
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 14px;
  min-height: 72px;
  display: flex;
  align-items: center;
}
.sh-current-text {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  padding-right: 46px;
}
.sh-cw {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.3;
}
.sh-cw-text {
  font-size: 19px;
  font-weight: 700;
  color: var(--ink);
}
.sh-cw-phon {
  font-size: 12.5px;
  color: var(--purple);
}
.sh-current-plain {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.45;
  color: var(--ink);
}
.sh-current-empty {
  font-size: 14.5px;
  color: var(--muted-2);
}
.sh-mic {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(108, 92, 231, 0.25);
  background: var(--purple-soft);
  color: var(--purple);
  font-size: 17px;
  cursor: pointer;
}
.sh-mic:hover {
  background: var(--surface);
}
.sh-mic.listening {
  background: var(--purple);
  color: #fff;
  border-color: var(--purple);
  animation: sh-pulse 1s infinite;
}
@keyframes sh-pulse {
  50% {
    opacity: 0.55;
  }
}

/* —— Bản thu + kết quả chấm —— */
.sh-playback {
  margin-top: 10px;
}
.sh-audio {
  height: 34px;
  width: 100%;
}
.sh-result {
  margin-top: 10px;
  border-radius: 12px;
  padding: 12px 14px;
  background: var(--bg);
  border-left: 4px solid var(--purple);
}
.sh-result.great,
.sh-result.good {
  border-left-color: #00c281;
  background: rgba(0, 214, 143, 0.06);
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
  font-size: 20px;
  font-weight: 800;
  color: var(--ink);
}
.sh-verdict {
  font-size: 13px;
  font-weight: 700;
}
.sh-hit {
  font-size: 12px;
  color: var(--muted-2);
}
.sh-words {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 7px;
}
.sh-word {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-success);
}
.sh-word.miss {
  color: var(--danger-strong);
  text-decoration: line-through;
  opacity: 0.75;
}
.sh-heard {
  margin-top: 8px;
  font-size: 12.5px;
  font-style: italic;
  color: var(--muted);
}
.sh-score-note {
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--muted);
}
.sh-mic-err {
  margin-top: 10px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--danger-strong);
  background: rgba(214, 81, 43, 0.08);
  border: 1px solid rgba(214, 81, 43, 0.22);
  padding: 9px 12px;
  border-radius: 10px;
}

/* —— Tổng kết —— */
.sh-clip-sum {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 14px;
  padding: 12px 16px;
  border: 1px solid rgba(108, 92, 231, 0.14);
  border-radius: 14px;
  background: linear-gradient(135deg, #f5f3ff, #fff);
}
[data-theme='dark'] .sh-clip-sum {
  background: var(--bg-accent);
}
.sh-clip-sum.passed {
  border-color: rgba(0, 214, 143, 0.4);
  background: linear-gradient(135deg, #eafff6, #fff);
}
[data-theme='dark'] .sh-clip-sum.passed {
  background: var(--bg-success);
}
.sh-sum-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: none;
}
.sh-sum-num {
  font-size: 24px;
  font-weight: 800;
  color: var(--purple);
  line-height: 1;
}
.sh-clip-sum.passed .sh-sum-num {
  color: #00b377;
}
.sh-sum-cap {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--muted-2);
  margin-top: 3px;
}
.sh-sum-info {
  flex: 1;
  min-width: 0;
}
.sh-sum-bar {
  height: 8px;
  border-radius: 99px;
  background: var(--track-bg);
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
.sh-sum-meta-mini {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted-2);
  margin-top: 6px;
}
.sh-sum-badge {
  flex: none;
  font-size: 12.5px;
  font-weight: 800;
  padding: 6px 13px;
  border-radius: 99px;
  color: var(--muted-2);
  background: var(--chip-bg);
}
.sh-sum-badge.done {
  color: #fff;
  background: linear-gradient(135deg, #00d68f, #00b377);
}
.sh-congrats {
  margin-top: 10px;
  font-size: 13.5px;
  font-weight: 700;
  color: #00936a;
  background: rgba(0, 214, 143, 0.1);
  border: 1px solid rgba(0, 214, 143, 0.3);
  padding: 9px 13px;
  border-radius: 12px;
}

/* —— Cột phải: danh sách câu —— */
.sh-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.sh-list-count {
  font-size: 14px;
  font-weight: 800;
  color: var(--ink);
}
.sh-list-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sh-tool-btn {
  border: 1px solid rgba(108, 92, 231, 0.2);
  background: var(--surface);
  color: var(--ink);
  font-size: 12.5px;
  font-weight: 700;
  padding: 7px 11px;
  border-radius: 10px;
  cursor: pointer;
}
.sh-tool-btn:hover {
  background: var(--purple-soft);
}
.sh-tool-btn.on {
  background: var(--purple);
  color: #fff;
  border-color: var(--purple);
}
.sh-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
@media (min-width: 960px) {
  .sh-list {
    max-height: calc(100vh - 130px);
    max-height: calc(100dvh - 130px);
    overflow-y: auto;
    padding-right: 4px;
  }
}
.sh-row {
  border-radius: 12px;
}
.sh-row-btn {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  text-align: left;
  padding: 11px 12px;
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 12px;
  background: var(--surface);
  cursor: pointer;
  transition: all 0.12s;
}
.sh-row-btn:hover {
  border-color: rgba(108, 92, 231, 0.3);
  background: var(--surface-1);
}
.sh-row.active .sh-row-btn {
  border-color: var(--purple);
  background: linear-gradient(135deg, #f5f3ff, #fff);
}
[data-theme='dark'] .sh-row.active .sh-row-btn {
  background: var(--bg-accent);
}
.sh-badge {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: var(--muted-2);
  background: var(--chip-bg);
}
.sh-badge.done {
  color: #fff;
  background: linear-gradient(135deg, #00d68f, #00b377);
}
.sh-row-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.sh-text {
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--ink);
}
.sh-row.active .sh-text {
  font-weight: 700;
  color: var(--ink);
}
.sh-time {
  font-size: 11.5px;
  color: var(--muted-2);
}
.sh-best-chip {
  flex: none;
  font-size: 11.5px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 99px;
  color: var(--amber-ink);
  background: rgba(255, 176, 32, 0.16);
  white-space: nowrap;
}

/* —— Sửa câu —— */
.sh-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 11px 12px;
  border: 1px solid rgba(108, 92, 231, 0.18);
  border-radius: 12px;
  background: var(--surface);
}
.sh-edit-text {
  width: 100%;
  font-family: inherit;
  font-size: 16px;
  line-height: 1.5;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.25);
  border-radius: 10px;
  padding: 8px 10px;
  resize: vertical;
}
.sh-edit-text:focus {
  outline: none;
  border-color: var(--purple);
}
.sh-edit-btns {
  display: flex;
  gap: 8px;
}
.sh-edit-btn {
  border: 1px solid rgba(108, 92, 231, 0.25);
  background: var(--purple-soft);
  color: var(--purple);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 11px;
  border-radius: 9px;
  cursor: pointer;
}
.sh-edit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .sh-player {
    padding: 14px;
    border-radius: 18px;
  }
  .sh-title {
    font-size: 18px;
  }
  .sh-current-plain {
    font-size: 17px;
  }
  .sh-cw-text {
    font-size: 17px;
  }
  .sh-list {
    max-height: 56vh;
    overflow-y: auto;
  }
}
</style>
