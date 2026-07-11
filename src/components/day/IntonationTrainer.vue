<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { speak, canSpeak } from '@/lib/speak'
import { detectPitch, scoreIntonation, normalizeForPlot, pitchSupported } from '@/lib/pitchTrack'

/**
 * Bộ hiện ngữ điệu (kế hoạch "Nói Tự Tin", Đợt A #2). Người học đọc một câu hỏi
 * Yes/No (mẫu LÊN giọng) và một câu kể/WH (mẫu XUỐNG giọng); mic đo cao độ theo
 * thời gian bằng Web Audio (autocorrelation client-side) và vẽ ĐƯỜNG NGỮ ĐIỆU của
 * họ chồng lên đường mẫu, chấm "khớp hướng chưa". Đây là suprasegmentals ĐO ĐƯỢC
 * mà LLM không nghe được -> lấp lỗ hổng #2. Không đo được (Safari/không mic) thì
 * ẩn phần đo, chỉ còn nghe mẫu.
 */
const props = defineProps({
  yesno: { type: String, default: '' }, // câu Yes/No — mong đợi LÊN giọng cuối câu
  statement: { type: String, default: '' }, // câu kể / WH — mong đợi XUỐNG giọng
})

const supported = pitchSupported()
const speakable = canSpeak()

// Hai dòng luyện: type quyết định mẫu (rising/falling) để chấm + vẽ đường mẫu.
const lines = [
  { key: 'yesno', type: 'yesno', label: 'Câu hỏi Yes/No — LÊN giọng ↗', text: props.yesno },
  { key: 'statement', type: 'statement', label: 'Câu kể / WH — XUỐNG giọng ↘', text: props.statement },
].filter((l) => l.text)

// Trạng thái đo cho từng dòng: recording, chuỗi Hz thô, kết quả chấm, điểm vẽ.
const st = reactive(
  Object.fromEntries(lines.map((l) => [l.key, { recording: false, result: null, plot: [] }])),
)
const activeKey = ref('')
const err = ref('')

let audioCtx = null
let stream = null
let analyser = null
let rafId = 0
let stopTimer = 0
let series = []

const DIR_LABEL = { rising: 'lên giọng ↗', falling: 'xuống giọng ↘', flat: 'giữ đều →', unknown: 'chưa rõ' }

function say(text, key, type) {
  if (!speakable || !text) return
  // Đọc mẫu: câu hỏi Yes/No đọc cao hơn chút để người học nghe được đường lên.
  speak(text, type === 'yesno' ? 0.85 : 0.9)
  activeKey.value = key
}

function cleanupAudio() {
  cancelAnimationFrame(rafId)
  clearTimeout(stopTimer)
  rafId = 0
  stopTimer = 0
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
  if (audioCtx) {
    audioCtx.close?.()
    audioCtx = null
  }
  analyser = null
}

async function record(line) {
  if (!supported || st[line.key].recording) return
  // Chỉ 1 dòng đo tại một thời điểm.
  if (activeKey.value && st[activeKey.value]?.recording) return
  err.value = ''
  series = []
  st[line.key].result = null
  st[line.key].plot = []
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    audioCtx = new AC()
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const src = audioCtx.createMediaStreamSource(stream)
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    src.connect(analyser)
    const buf = new Float32Array(analyser.fftSize)
    st[line.key].recording = true
    activeKey.value = line.key

    const tick = () => {
      if (!analyser) return
      analyser.getFloatTimeDomainData(buf)
      series.push(detectPitch(buf, audioCtx.sampleRate))
      rafId = requestAnimationFrame(tick)
    }
    tick()
    // Tự dừng sau ~3s — đủ cho một câu ngắn, không bắt người học canh nút.
    stopTimer = setTimeout(() => finish(line), 3000)
  } catch {
    err.value = 'Không truy cập được micro — kiểm tra quyền micro & dùng Chrome/Edge.'
    st[line.key].recording = false
    cleanupAudio()
  }
}

function finish(line) {
  if (!st[line.key].recording) return
  st[line.key].recording = false
  cleanupAudio()
  const result = scoreIntonation(series, line.type)
  st[line.key].result = result
  st[line.key].plot = normalizeForPlot(series)
}

function stop(line) {
  clearTimeout(stopTimer)
  finish(line)
}

// —— Vẽ SVG: đường mẫu (arc theo hướng) + đường người học (chuẩn hóa) ——
const W = 300
const H = 90
const PAD = 10
// Đường mẫu lý tưởng: rising = đi lên ở nửa sau; falling = đi xuống ở nửa sau.
function modelPath(type) {
  const y = (v) => PAD + (1 - v) * (H - 2 * PAD)
  const x = (v) => PAD + v * (W - 2 * PAD)
  const pts =
    type === 'yesno'
      ? [[0, 0.35], [0.5, 0.4], [0.75, 0.55], [1, 0.95]]
      : [[0, 0.75], [0.5, 0.7], [0.75, 0.5], [1, 0.12]]
  return pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(' ')
}
function userPath(plot) {
  if (!plot.length) return ''
  const y = (v) => PAD + (1 - v) * (H - 2 * PAD)
  const x = (v) => PAD + v * (W - 2 * PAD)
  return plot.map((p, i) => `${i ? 'L' : 'M'}${x(p.x).toFixed(1)} ${y(p.y).toFixed(1)}`).join(' ')
}

onBeforeUnmount(cleanupAudio)
</script>

<template>
  <section v-if="lines.length" class="step-card into">
    <div class="step-head">
      <div>
        <div class="eyebrow">🎵 NGỮ ĐIỆU · ĐO ĐƯỜNG LÊN/XUỐNG</div>
        <h2 class="step-title">Nói đúng nhạc điệu câu</h2>
      </div>
    </div>
    <p class="quiz-intro">
      Câu hỏi <b>Yes/No</b> đi <b>lên giọng</b> ở cuối; câu kể và câu hỏi <b>WH</b> đi <b>xuống giọng</b>.
      Nghe mẫu (🔊), rồi bấm 🎤 <b>Đọc thử</b> — máy vẽ đường ngữ điệu của bạn chồng lên đường mẫu.
    </p>
    <p v-if="!supported" class="quiz-intro warn">
      ⚠️ Trình duyệt này chưa đo được cao độ. Bạn vẫn nghe mẫu được; để đo hãy dùng Chrome/Edge.
    </p>
    <p v-if="err" class="quiz-intro warn">⚠️ {{ err }}</p>

    <div class="into-list">
      <div v-for="line in lines" :key="line.key" class="into-row">
        <div class="into-lbl">{{ line.label }}</div>
        <div class="into-text" @click="say(line.text, line.key, line.type)">"{{ line.text }}" <span class="say-ico">🔊</span></div>

        <svg class="into-svg" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" role="img" aria-hidden="true">
          <line :x1="0" :y1="H / 2" :x2="W" :y2="H / 2" class="into-axis" />
          <path :d="modelPath(line.type)" class="into-model" />
          <path v-if="st[line.key].plot.length" :d="userPath(st[line.key].plot)" class="into-user" />
        </svg>

        <div class="into-controls">
          <button class="into-play" @click="say(line.text, line.key, line.type)" :disabled="!speakable">🔊 Nghe mẫu</button>
          <button
            v-if="supported && !st[line.key].recording"
            class="into-rec"
            @click="record(line)"
          >
            🎤 Đọc thử
          </button>
          <button v-else-if="supported" class="into-stop" @click="stop(line)">
            <span class="dot live"></span> Đang nghe… dừng
          </button>
          <span
            v-if="st[line.key].result"
            class="into-verdict"
            :class="{ ok: st[line.key].result.ok }"
          >
            {{ st[line.key].result.ok ? '✅ Khớp' : '△ Chưa khớp' }} · bạn
            {{ DIR_LABEL[st[line.key].result.direction] }}
          </span>
        </div>
        <p v-if="st[line.key].result && !st[line.key].result.ok" class="into-hint">
          Mẫu là <b>{{ DIR_LABEL[st[line.key].result.expected] }}</b> — thử lại, đẩy cao độ
          {{ line.type === 'yesno' ? 'LÊN mạnh hơn ở từ cuối' : 'XUỐNG dứt khoát ở từ cuối' }}.
        </p>
      </div>
    </div>

    <div class="into-legend">
      <span class="lg-model">— đường mẫu</span>
      <span class="lg-user">— giọng bạn</span>
    </div>
  </section>
</template>

<style scoped>
.into {
  border: 1px solid rgba(108, 92, 231, 0.25);
}
.into-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 16px;
}
.into-row {
  background: var(--bg);
  border: 1px solid rgba(108, 92, 231, 0.12);
  border-radius: 14px;
  padding: 14px 16px;
}
.into-lbl {
  font-size: 12.5px;
  font-weight: 800;
  color: #6c5ce7;
}
.into-text {
  font-size: 15.5px;
  font-weight: 700;
  color: var(--ink);
  margin: 6px 0 10px;
  cursor: pointer;
}
.say-ico {
  opacity: 0.6;
  font-size: 12px;
}
.into-svg {
  width: 100%;
  height: 90px;
  display: block;
  background: var(--surface);
  border-radius: 10px;
  border: 1px solid var(--line);
}
.into-axis {
  stroke: var(--line);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}
.into-model {
  fill: none;
  stroke: #b9a9ff;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 6 5;
}
.into-user {
  fill: none;
  stroke: #00c389;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.into-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.into-play,
.into-rec,
.into-stop {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  border-radius: 10px;
  padding: 8px 14px;
  min-height: 42px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
}
.into-rec {
  border-color: rgba(0, 195, 137, 0.5);
  color: #00966a;
}
.into-stop {
  border-color: rgba(224, 72, 72, 0.5);
  color: #c0392b;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.into-play:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.dot.live {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #e04848;
  animation: into-pulse 1s infinite;
}
@keyframes into-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.into-verdict {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-warning);
}
.into-verdict.ok {
  color: var(--text-success);
}
.into-hint {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--slate);
}
.into-legend {
  display: flex;
  gap: 16px;
  margin-top: 14px;
  font-size: 12px;
  font-weight: 700;
}
.lg-model {
  color: #8f7dff;
}
.lg-user {
  color: #00966a;
}
.quiz-intro.warn {
  color: var(--text-warning);
}
</style>
