<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { speak, canSpeak } from '@/lib/speak'
import { startRecording, saveRecording, loadRecording, deleteRecording, recordingSupported } from '@/lib/recorder'
import { uploadRecording, downloadRecording, deleteRemoteRecording, remoteRecordingExists } from '@/lib/recordingSync'
import { isCloudEnabled } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'

const user = useUserStore()

const props = defineProps({
  // Khóa lưu trữ bản ghi, vd "ielts:1:1" — mỗi buổi một bản riêng.
  recId: { type: String, required: true },
  // Nhãn sản phẩm của buổi (lấy từ "Sản phẩm nhỏ" trong nhịp học), vd 'Ghi âm 5 câu "mốc 0"'.
  label: { type: String, default: 'Ghi âm sản phẩm của buổi' },
  // Câu gợi ý để đọc to (không bắt buộc) — buổi 1 lấy câu đúng của ngữ pháp hôm nay.
  sentences: { type: Array, default: () => [] },
})
const emit = defineEmits(['saved'])

const supported = recordingSupported()
const speakable = canSpeak()

const recording = ref(false)
const elapsed = ref(0) // giây
const audioUrl = ref('') // object URL của bản ghi để phát lại
const hasSaved = ref(false)
const busy = ref(false) // đang dừng & lưu
const err = ref('')
const syncState = ref('idle') // 'idle' | 'syncing' | 'synced' | 'error' — chỉ có ý nghĩa khi đã đăng nhập
const remoteAvailable = ref(false) // có bản trên cloud nhưng máy này chưa có, chờ bấm tải
const fetching = ref(false) // đang tải bản từ cloud về

let handle = null // handle ghi âm đang chạy
let timer = null

const suggest = computed(() => (props.sentences || []).filter(Boolean).slice(0, 5))
const mmss = computed(() => {
  const m = Math.floor(elapsed.value / 60)
  const s = elapsed.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})
const canSync = computed(() => isCloudEnabled && !!user.cloudUserId)

function revoke() {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = ''
  }
}
function showBlob(blob) {
  revoke()
  audioUrl.value = URL.createObjectURL(blob)
}

// Nạp bản ghi đã lưu khi mở buổi (và khi đổi buổi).
watch(
  () => props.recId,
  async (id) => {
    revoke()
    hasSaved.value = false
    elapsed.value = 0
    syncState.value = 'idle'
    remoteAvailable.value = false
    if (!id) return
    const blob = await loadRecording(id)
    if (blob) {
      showBlob(blob)
      hasSaved.value = true
      return
    }
    // Máy này chưa có — hỏi cloud xem có bản đã ghi ở máy khác không (lazy, chưa tải).
    if (canSync.value) {
      remoteAvailable.value = await remoteRecordingExists(user.cloudUserId, id)
    }
  },
  { immediate: true },
)

/** Tải bản ghi đã có trên cloud về (bấm tay) rồi cache lại vào IndexedDB máy này. */
async function fetchFromCloud() {
  if (!canSync.value || fetching.value) return
  fetching.value = true
  try {
    const blob = await downloadRecording(user.cloudUserId, props.recId)
    if (blob) {
      await saveRecording(props.recId, blob)
      showBlob(blob)
      hasSaved.value = true
      remoteAvailable.value = false
      syncState.value = 'synced'
    } else {
      err.value = 'Không tải được bản ghi từ cloud — thử lại sau.'
    }
  } finally {
    fetching.value = false
  }
}

async function start() {
  if (!supported || recording.value || busy.value) return
  err.value = ''
  try {
    handle = await startRecording()
    recording.value = true
    elapsed.value = 0
    timer = setInterval(() => (elapsed.value += 1), 1000)
  } catch {
    err.value = 'Không truy cập được micro — kiểm tra quyền micro & dùng Chrome/Edge.'
  }
}

async function stop() {
  if (!recording.value || !handle) return
  busy.value = true
  clearInterval(timer)
  timer = null
  recording.value = false
  try {
    const blob = await handle.stop()
    handle = null
    showBlob(blob)
    await saveRecording(props.recId, blob)
    hasSaved.value = true
    remoteAvailable.value = false
    emit('saved')
    if (canSync.value) {
      syncState.value = 'syncing'
      const ok = await uploadRecording(user.cloudUserId, props.recId, blob)
      syncState.value = ok ? 'synced' : 'error'
    }
  } catch {
    err.value = 'Lưu bản ghi thất bại — thử ghi lại nhé.'
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (recording.value) return
  await deleteRecording(props.recId)
  if (canSync.value) deleteRemoteRecording(user.cloudUserId, props.recId)
  revoke()
  hasSaved.value = false
  syncState.value = 'idle'
  elapsed.value = 0
}

function say(text) {
  if (speakable) speak(text)
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  if (handle) handle.cancel()
  revoke()
})
onMounted(() => {}) // (nạp đã làm ở watch immediate)
</script>

<template>
  <section class="step-card vr" :class="{ current: !hasSaved }">
    <div class="vr-head">
      <div>
        <div class="vr-eyebrow" :class="{ green: hasSaved }">SẢN PHẨM CỦA BUỔI · GIỮ LÀM MỐC SO SÁNH</div>
        <h2 class="vr-title">🎙️ {{ label }}</h2>
      </div>
      <span class="vr-badge" :class="{ ok: hasSaved }">{{ hasSaved ? '✅ Đã ghi' : 'Chưa ghi' }}</span>
      <span v-if="canSync && syncState === 'syncing'" class="vr-cloud">☁️ Đang đồng bộ…</span>
      <span v-else-if="canSync && syncState === 'synced'" class="vr-cloud ok">☁️ Đã đồng bộ</span>
      <span v-else-if="canSync && syncState === 'error'" class="vr-cloud warn">☁️ Lỗi đồng bộ — thử ghi lại để gửi lại</span>
    </div>
    <p class="vr-intro">
      Đọc to và ghi âm giọng của em. Bản ghi được giữ lại trên máy này để
      <b>cuối khóa nghe lại</b> — em sẽ tự thấy mình tiến bộ tới đâu.
    </p>

    <p v-if="!supported" class="vr-intro warn">⚠️ Trình duyệt chưa hỗ trợ ghi âm — hãy dùng Chrome/Edge để làm phần này.</p>
    <p v-if="err" class="vr-intro warn">⚠️ {{ err }}</p>

    <!-- Có bản ghi trên cloud nhưng máy này chưa có -->
    <div v-if="remoteAvailable && !hasSaved" class="vr-remote">
      <span>☁️ Em đã ghi buổi này trên máy khác — tải về để nghe lại ở đây.</span>
      <button class="vr-fetch" :disabled="fetching" @click="fetchFromCloud">{{ fetching ? 'Đang tải…' : 'Tải bản ghi' }}</button>
    </div>

    <!-- Câu gợi ý để đọc -->
    <div v-if="suggest.length" class="vr-suggest">
      <div class="vr-suggest-label">📖 Gợi ý câu để đọc (bấm 🔊 nghe mẫu):</div>
      <ul>
        <li v-for="(s, i) in suggest" :key="i" @click="say(s)">{{ s }} <span class="say-ico">🔊</span></li>
      </ul>
    </div>

    <!-- Điều khiển ghi âm -->
    <div class="vr-controls">
      <button v-if="!recording" class="vr-rec" :disabled="!supported || busy" @click="start">
        <span class="dot"></span>{{ hasSaved ? 'Ghi lại' : 'Bắt đầu ghi âm' }}
      </button>
      <button v-else class="vr-stop" @click="stop">
        <span class="dot live"></span>Dừng & lưu · {{ mmss }}
      </button>

      <audio v-if="audioUrl && !recording" :src="audioUrl" controls class="vr-audio"></audio>
      <button v-if="hasSaved && !recording" class="vr-del" :disabled="busy" @click="remove" title="Xóa bản ghi">🗑️</button>
    </div>

    <div v-if="hasSaved" class="vr-foot ok">✅ Đã lưu bản ghi "mốc 0". Nghe lại bất cứ lúc nào ở đây.</div>
    <div v-else-if="recording" class="vr-foot rec">● Đang ghi… đọc to, rõ ràng rồi bấm "Dừng & lưu".</div>
  </section>
</template>

<style scoped>
.vr {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 22px;
  padding: 26px var(--space-page-x);
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.06);
}
.vr.current {
  border: 2px solid var(--green);
  box-shadow: 0 18px 44px rgba(0, 214, 143, 0.16);
}
.vr-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.vr-eyebrow {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--muted-2);
}
.vr-eyebrow.green {
  color: var(--green-2);
}
.vr-title {
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.4px;
  margin-top: 5px;
}
.vr-badge {
  background: rgba(0, 150, 106, 0.1);
  color: var(--text-success);
  font-size: 12.5px;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 99px;
  white-space: nowrap;
}
.vr-badge.ok {
  background: rgba(0, 214, 143, 0.16);
  color: var(--green-2);
}
.vr-intro {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--muted);
  margin-top: 12px;
}
.vr-intro.warn {
  color: var(--text-danger);
  font-weight: 600;
}
.vr-cloud {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted-2);
}
.vr-cloud.ok {
  color: var(--text-success);
}
.vr-cloud.warn {
  color: var(--text-danger);
}
.vr-remote {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  background: rgba(108, 92, 231, 0.06);
  border: 1px solid rgba(108, 92, 231, 0.15);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13.5px;
  color: var(--ink-2);
}
.vr-fetch {
  border: none;
  background: var(--purple, #6c5ce7);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
}
.vr-fetch:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.vr-suggest {
  margin-top: 16px;
  background: var(--bg);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 14px;
  padding: 14px 16px;
}
.vr-suggest-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 8px;
}
.vr-suggest ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.vr-suggest li {
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--ink-2);
  cursor: pointer;
  padding: 7px 11px;
  min-height: 44px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  border-radius: 10px;
  border: 1px solid rgba(108, 92, 231, 0.08);
  background: var(--surface);
  transition: border-color 0.15s, background 0.15s;
}
@media (hover: hover) {
  .vr-suggest li:hover {
    border-color: rgba(0, 214, 143, 0.4);
  }
}
.vr-suggest li:active {
  border-color: rgba(0, 214, 143, 0.4);
  background: rgba(0, 214, 143, 0.06);
}
.say-ico {
  opacity: 0.6;
  font-size: 12px;
}
.vr-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  flex-wrap: wrap;
}
.vr-rec,
.vr-stop {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  padding: 12px 22px;
  border-radius: 14px;
  white-space: nowrap;
}
.vr-rec {
  background: linear-gradient(135deg, #00d68f, #00a86f);
  box-shadow: 0 12px 26px rgba(0, 214, 143, 0.3);
}
.vr-rec:disabled {
  background: var(--disabled-bg);
  box-shadow: none;
  cursor: not-allowed;
}
.vr-stop {
  background: linear-gradient(135deg, #ff7a7a, #e04848);
  box-shadow: 0 12px 26px rgba(224, 72, 72, 0.25);
}
.vr-rec .dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #fff;
}
.vr-stop .dot {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  background: #fff;
}
.vr-stop .dot.live {
  animation: vr-pulse 1s infinite;
}
@keyframes vr-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.vr-audio {
  height: 40px;
  flex: 1;
  min-width: 200px;
}
.vr-del {
  border: 1px solid rgba(255, 107, 107, 0.4);
  background: var(--surface);
  color: var(--text-danger);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 15px;
  cursor: pointer;
}
@media (hover: hover) {
  .vr-del:hover {
    background: rgba(255, 107, 107, 0.08);
  }
}
.vr-del:active {
  background: rgba(255, 107, 107, 0.16);
}
.vr-foot {
  margin-top: 14px;
  font-size: 13.5px;
  font-weight: 700;
  border-radius: 12px;
  padding: 11px 15px;
}
.vr-foot.ok {
  color: var(--text-success);
  background: rgba(0, 214, 143, 0.1);
}
.vr-foot.rec {
  color: var(--text-danger);
  background: rgba(255, 107, 107, 0.08);
}
</style>
