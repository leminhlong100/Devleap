<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { parseVideoId, loadYouTubeApi } from '@/lib/youtube'
import { fetchClipList, fetchClip, saveClip, deleteClip } from '@/lib/shadowingRepo'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

// —— Danh sách clip đã có ——
const clips = ref([])
const listLoading = ref(true)

async function reloadList() {
  listLoading.value = true
  try {
    clips.value = await fetchClipList()
  } finally {
    listLoading.value = false
  }
}
onMounted(reloadList)

// —— Trình soạn 1 bài ——
const urlInput = ref('')
const generating = ref(false)
const error = ref('')

// Bài đang soạn: { videoId, title, topic, level, lang, sentences:{ai,original} }
const draft = ref(null)
const saving = ref(false)
const savedMsg = ref('')

// Danh sách câu đang sửa = bản AI (bản người dùng nhìn thấy). Bản gốc giữ nguyên làm tham chiếu.
const rows = computed(() => draft.value?.sentences?.ai || [])
const canSave = computed(() => rows.value.length > 0)

/** Gọi function tạo bài từ URL, đổ vào draft cho admin sửa. */
async function generate() {
  error.value = ''
  savedMsg.value = ''
  const id = parseVideoId(urlInput.value)
  if (!id) {
    error.value = 'Link không hợp lệ. Dán dạng youtube.com/watch?v=… hoặc youtu.be/…'
    return
  }
  generating.value = true
  try {
    const res = await fetch('/.netlify/functions/shadowing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlInput.value }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Không tạo được bài.')
    draft.value = {
      videoId: data.videoId,
      title: data.title || `Video ${data.videoId}`,
      topic: data.author || '',
      level: 'A1',
      lang: 'en',
      sentences: data.sentences, // { ai, original }
    }
  } catch (e) {
    error.value = e?.message || 'Không tạo được bài. Thử video khác có phụ đề.'
  } finally {
    generating.value = false
  }
}

/** Mở 1 clip đã có để sửa lại. */
async function editExisting(videoId) {
  error.value = ''
  savedMsg.value = ''
  generating.value = true
  try {
    const clip = await fetchClip(videoId)
    if (!clip) throw new Error('Không tìm thấy clip.')
    // Chuẩn hóa: nếu sentences là mảng (dữ liệu cũ) -> bọc thành {ai, original}.
    const s = Array.isArray(clip.sentences)
      ? { ai: clip.sentences.map((x) => ({ ...x })), original: clip.sentences }
      : clip.sentences
    draft.value = {
      videoId: clip.videoId,
      title: clip.title,
      topic: clip.topic || '',
      level: clip.level || 'A1',
      lang: clip.lang || 'en',
      sentences: s,
    }
  } catch (e) {
    error.value = e?.message || 'Không mở được clip.'
  } finally {
    generating.value = false
  }
}

async function save() {
  if (!canSave.value) return
  saving.value = true
  error.value = ''
  savedMsg.value = ''
  try {
    renumber()
    const title = draft.value.title
    await saveClip(draft.value)
    // Lưu xong: đóng trình soạn, dọn ô nhập, quay về danh sách.
    draft.value = null
    urlInput.value = ''
    savedMsg.value = `Đã lưu "${title}". Người dùng có thể luyện ngay.`
    await reloadList()
  } catch (e) {
    error.value = e?.message || 'Lưu thất bại. Kiểm tra quyền admin / cấu hình Supabase.'
  } finally {
    saving.value = false
  }
}

async function removeClip(videoId) {
  if (!window.confirm('Xóa clip này khỏi danh sách?')) return
  try {
    await deleteClip(videoId)
    if (draft.value?.videoId === videoId) draft.value = null
    await reloadList()
  } catch (e) {
    error.value = e?.message || 'Xóa thất bại.'
  }
}

function discard() {
  draft.value = null
  urlInput.value = ''
  savedMsg.value = ''
  error.value = ''
}

// ——————————————————————————————————————————————————————————————
//  Sửa cấu trúc câu: gộp / tách / thêm / xóa dòng + chỉnh mốc thời gian
// ——————————————————————————————————————————————————————————————
const round2 = (s) => Math.round(s * 100) / 100
const renumber = () => rows.value.forEach((s, i) => (s.id = i + 1))

const caret = reactive({}) // id -> vị trí con trỏ trong textarea (để tách câu)
function onCaret(s, e) {
  caret[s.id] = e.target.selectionStart
}

/** Gộp câu i với câu kế (i+1): nối chữ, lấy end của câu sau. */
function mergeDown(i) {
  const a = rows.value[i]
  const b = rows.value[i + 1]
  if (!a || !b) return
  a.text = `${a.text} ${b.text}`.replace(/\s+/g, ' ').trim()
  a.end = b.end
  rows.value.splice(i + 1, 1)
  renumber()
  resetPlayback()
}

/** Tách câu i tại vị trí con trỏ; chia mốc thời gian theo tỉ lệ ký tự. */
function splitAt(i) {
  const s = rows.value[i]
  if (!s) return
  const pos = Math.min(Math.max(caret[s.id] ?? Math.floor(s.text.length / 2), 1), s.text.length - 1)
  const left = s.text.slice(0, pos).trim()
  const right = s.text.slice(pos).trim()
  if (!left || !right) return
  const mid = round2(s.start + (s.end - s.start) * (pos / s.text.length))
  rows.value.splice(i, 1, { ...s, text: left, end: mid }, { ...s, text: right, start: mid })
  renumber()
  resetPlayback()
}

/** Xóa 1 dòng. */
function removeRow(i) {
  rows.value.splice(i, 1)
  renumber()
  resetPlayback()
}

/** Thêm 1 dòng trống ngay sau dòng i (mốc thời gian xen giữa câu i và câu kế). */
function addBelow(i) {
  const a = rows.value[i]
  const b = rows.value[i + 1]
  const start = a ? a.end : 0
  const end = b ? b.start : round2(start + 3)
  rows.value.splice(i + 1, 0, { id: 0, text: '', start, end: Math.max(end, round2(start + 0.5)) })
  renumber()
}

/** Thêm 1 dòng vào cuối (hoặc khi danh sách rỗng). */
function addAtEnd() {
  const last = rows.value[rows.value.length - 1]
  const start = last ? last.end : 0
  rows.value.push({ id: 0, text: '', start, end: round2(start + 3) })
  renumber()
}

// ——————————————————————————————————————————————————————————————
//  Trình phát YouTube nhúng — phát thử từng câu, lấy mốc thời gian từ video
// ——————————————————————————————————————————————————————————————
const mountEl = ref(null)
let player = null
const playerReady = ref(false)
const playing = ref(false)
const loop = ref(false)
const RATES = [0.5, 0.75, 1]
const rate = ref(1)
const activeId = ref(null)
const curTime = ref(0) // thời gian phát hiện tại (giây) — để gán mốc
let watcher = null
let ticker = null

const fmtClock = (s) => {
  const x = Math.max(0, +s || 0)
  const m = Math.floor(x / 60)
  return `${m}:${(x - m * 60).toFixed(2).padStart(5, '0')}`
}

function clearWatcher() {
  if (watcher) {
    clearInterval(watcher)
    watcher = null
  }
}
function resetPlayback() {
  clearWatcher()
  activeId.value = null
  playing.value = false
  player?.pauseVideo?.()
}

async function initPlayer(videoId) {
  const YT = await loadYouTubeApi()
  if (!mountEl.value) return
  player = new YT.Player(mountEl.value, {
    videoId,
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
  // Cập nhật đồng hồ thời gian phát để admin gán mốc đầu/cuối câu.
  ticker = setInterval(() => {
    if (player?.getCurrentTime) curTime.value = round2(player.getCurrentTime())
  }, 120)
}

/** Phát đúng đoạn của 1 câu; tới cuối thì lặp lại (nếu bật) hoặc dừng. */
function playSentence(s) {
  if (!player || !playerReady.value) return
  activeId.value = s.id
  player.setPlaybackRate(rate.value)
  player.seekTo(s.start, true)
  player.playVideo()
  playing.value = true
  clearWatcher()
  watcher = setInterval(() => {
    const t = player.getCurrentTime?.() ?? 0
    if (t >= s.end - 0.04) {
      if (loop.value) player.seekTo(s.start, true)
      else {
        player.pauseVideo()
        playing.value = false
        clearWatcher()
      }
    }
  }, 80)
}
function pause() {
  player?.pauseVideo()
  playing.value = false
  clearWatcher()
}
function setRate(r) {
  rate.value = r
  player?.setPlaybackRate(r)
}
/** Tua video tới đúng đầu câu để xem/nghe rồi gán mốc. */
function seekTo(sec) {
  if (!player || !playerReady.value) return
  player.seekTo(Math.max(0, sec), true)
}
/** Gán mốc đầu / cuối của câu = vị trí phát hiện tại. */
function setStartNow(s) {
  s.start = Math.min(curTime.value, round2(s.end - 0.2))
}
function setEndNow(s) {
  s.end = Math.max(curTime.value, round2(s.start + 0.2))
}

// Đổi bài đang soạn -> nạp video mới vào trình phát.
watch(
  () => draft.value?.videoId,
  async (id) => {
    resetPlayback()
    playerReady.value = false
    if (!id) {
      player?.destroy?.()
      player = null
      return
    }
    await nextTick()
    if (player) player.loadVideoById(id)
    else initPlayer(id)
  },
)

onBeforeUnmount(() => {
  clearWatcher()
  if (ticker) clearInterval(ticker)
  player?.destroy?.()
})
</script>

<template>
  <div class="head">
    <h1 class="title">🎧 Quản lý Shadowing</h1>
    <p class="sub">
      Dán link YouTube (có phụ đề tiếng Anh), chọn cấp độ → hệ thống tự lấy transcript và đánh bóng.
      Mở video ngay bên cạnh để phát thử từng câu, gộp/tách/thêm/xóa dòng và canh lại mốc thời gian, rồi bấm Lưu.
    </p>
  </div>

  <!-- Tạo bài mới -->
  <form class="maker" @submit.prevent="generate">
    <input
      v-model="urlInput"
      class="in url"
      type="text"
      inputmode="url"
      placeholder="Dán link YouTube…"
      :disabled="generating"
    />
    <button class="btn" type="submit" :disabled="generating || !urlInput.trim()">
      {{ generating ? 'Đang xử lý…' : 'Tạo bài' }}
    </button>
  </form>
  <p v-if="error" class="msg err">⚠️ {{ error }}</p>
  <p v-if="savedMsg" class="msg ok">✓ {{ savedMsg }}</p>

  <!-- Trình sửa bài -->
  <section v-if="draft" class="editor">
    <div class="editor-top">
      <div class="meta-grid">
        <label class="field">
          <span>Tiêu đề</span>
          <input v-model="draft.title" class="in" type="text" />
        </label>
        <label class="field">
          <span>Chủ đề / tác giả</span>
          <input v-model="draft.topic" class="in" type="text" />
        </label>
        <label class="field sm">
          <span>Cấp độ</span>
          <select v-model="draft.level" class="in">
            <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
          </select>
        </label>
        <div class="field sm">
          <span>Video ID</span>
          <code class="vid">{{ draft.videoId }}</code>
        </div>
      </div>
      <div class="actions">
        <button class="btn ghost" @click="discard">Hủy</button>
        <button class="btn" :disabled="!canSave || saving" @click="save">
          {{ saving ? 'Đang lưu…' : 'Lưu bài' }}
        </button>
      </div>
    </div>

    <div class="work">
      <!-- Cột trái: video + đồng hồ + tốc độ (dính khi cuộn) -->
      <div class="stage">
        <div class="video">
          <div ref="mountEl" class="iframe"></div>
          <div v-if="!playerReady" class="vid-loading">Đang tải trình phát…</div>
        </div>
        <div class="transport">
          <span class="clock">{{ fmtClock(curTime) }}</span>
          <button v-if="playing" class="t-btn" title="Tạm dừng" @click="pause">❚❚</button>
          <button class="t-btn toggle" :class="{ on: loop }" title="Lặp lại câu" @click="loop = !loop">🔁</button>
          <div class="rates">
            <button v-for="r in RATES" :key="r" class="rate" :class="{ on: rate === r }" @click="setRate(r)">{{ r }}×</button>
          </div>
        </div>
        <p class="hint">
          Bấm ▶ ở mỗi câu để nghe đúng đoạn đó. Canh lại mốc bằng nút
          <strong>Đầu=⏱</strong> / <strong>Cuối=⏱</strong> (lấy vị trí video đang dừng).
        </p>
      </div>

      <!-- Cột phải: danh sách câu có thể sửa cấu trúc -->
      <div class="rows-wrap">
        <div class="rows-head">
          <h3 class="sec-head plain">Các câu ({{ rows.length }})</h3>
          <button class="add-btn" @click="addAtEnd">＋ Thêm câu cuối</button>
        </div>

        <div class="rows">
          <div
            v-for="(s, i) in rows"
            :key="s.id"
            class="row"
            :class="{ active: s.id === activeId }"
          >
            <div class="row-bar">
              <span class="num">{{ i + 1 }}</span>
              <button class="mini play" title="Phát thử câu này" @click="playSentence(s)">▶</button>
              <button class="mini" title="Tua video tới đầu câu" @click="seekTo(s.start)">⏱</button>
              <span class="time">{{ fmtClock(s.start) }} → {{ fmtClock(s.end) }}</span>
              <span class="spacer"></span>
              <button class="mini" title="Đặt mốc ĐẦU = vị trí video hiện tại" @click="setStartNow(s)">Đầu=⏱</button>
              <button class="mini" title="Đặt mốc CUỐI = vị trí video hiện tại" @click="setEndNow(s)">Cuối=⏱</button>
            </div>

            <textarea
              v-model="s.text"
              class="in row-text"
              rows="2"
              @keyup="onCaret(s, $event)"
              @click="onCaret(s, $event)"
              @select="onCaret(s, $event)"
            ></textarea>

            <div class="row-ops">
              <button class="op" title="Tách câu tại vị trí con trỏ" @click="splitAt(i)">✂ Tách</button>
              <button class="op" :disabled="i >= rows.length - 1" title="Gộp với câu kế" @click="mergeDown(i)">⬇ Gộp</button>
              <button class="op" title="Thêm câu trống bên dưới" @click="addBelow(i)">＋ Dưới</button>
              <button class="op del" title="Xóa câu này" @click="removeRow(i)">🗑 Xóa</button>
            </div>
          </div>

          <p v-if="!rows.length" class="empty">
            Chưa có câu nào. Bấm “Thêm câu cuối” để soạn tay.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Danh sách clip đã có -->
  <section class="list">
    <h2 class="sec-head">Clip đã có</h2>
    <div v-if="listLoading" class="muted">Đang tải…</div>
    <div v-else-if="!clips.length" class="muted">Chưa có clip nào. Tạo bài đầu tiên ở trên.</div>
    <table v-else class="tbl">
      <thead>
        <tr><th>Tiêu đề</th><th>Cấp độ</th><th>Số câu</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="c in clips" :key="c.videoId">
          <td>
            <div class="c-title">{{ c.title }}</div>
            <div class="c-sub">{{ c.topic }}</div>
          </td>
          <td><span class="lvl">{{ c.level }}</span></td>
          <td>{{ c.sentenceCount }}</td>
          <td class="row-actions">
            <button class="link" @click="editExisting(c.videoId)">Sửa</button>
            <button class="link del" @click="removeClip(c.videoId)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.head {
  margin-bottom: 22px;
}
.title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.sub {
  font-size: 14.5px;
  color: var(--muted-2);
  margin-top: 8px;
  max-width: 760px;
  line-height: 1.6;
}
.maker {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.in {
  font-size: 15px;
  padding: 11px 14px;
  border: 1.5px solid rgba(108, 92, 231, 0.2);
  border-radius: 12px;
  background: #fff;
  color: var(--ink);
}
.in:focus {
  outline: none;
  border-color: var(--purple);
}
.url {
  flex: 1;
  min-width: 240px;
}
.btn {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  background: var(--grad-purple, var(--purple));
  border: none;
  border-radius: 12px;
  padding: 0 20px;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn.ghost {
  background: #fff;
  color: var(--ink);
  border: 1.5px solid rgba(108, 92, 231, 0.2);
  padding: 10px 18px;
}
.msg {
  margin-top: 12px;
  font-size: 13.5px;
  font-weight: 700;
  padding: 10px 14px;
  border-radius: 12px;
}
.err {
  color: #d6512b;
  background: rgba(214, 81, 43, 0.08);
  border: 1px solid rgba(214, 81, 43, 0.25);
}
.ok {
  color: #00a86f;
  background: rgba(0, 168, 111, 0.08);
  border: 1px solid rgba(0, 168, 111, 0.25);
}
.editor {
  margin-top: 24px;
  background: #fff;
  border: 1.5px solid rgba(108, 92, 231, 0.12);
  border-radius: 18px;
  padding: 20px;
}
.editor-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}
.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto auto;
  gap: 12px;
  flex: 1;
  min-width: 260px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field > span {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted-2);
}
.field.sm {
  min-width: 90px;
}
.vid {
  font-size: 13px;
  padding: 11px 12px;
  background: #f4f3fb;
  border-radius: 10px;
  color: var(--muted);
}
.actions {
  display: flex;
  gap: 10px;
}
.sec-head {
  font-size: 14px;
  font-weight: 800;
  color: var(--muted-2);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin: 24px 0 12px;
}
.sec-head.plain {
  margin: 0;
}

/* —— Bố cục video + danh sách câu —— */
.work {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 22px;
}
@media (min-width: 980px) {
  .work {
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1fr);
    align-items: start;
  }
  .stage {
    position: sticky;
    top: 78px;
  }
}
.video {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  background: #000;
}
.iframe,
.video :deep(iframe) {
  width: 100%;
  height: 100%;
  border: 0;
}
.vid-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
}
.transport {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
.clock {
  font-family: ui-monospace, monospace;
  font-size: 14px;
  font-weight: 800;
  color: var(--purple);
  background: var(--purple-soft);
  padding: 6px 10px;
  border-radius: 9px;
}
.t-btn {
  min-width: 38px;
  height: 38px;
  border: 1px solid rgba(108, 92, 231, 0.18);
  background: #fff;
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
}
.t-btn.toggle.on {
  background: var(--purple);
  color: #fff;
  border-color: var(--purple);
}
.rates {
  display: inline-flex;
  gap: 4px;
  margin-left: auto;
  background: #efeafc;
  padding: 3px;
  border-radius: 10px;
}
.rate {
  border: none;
  background: transparent;
  color: var(--muted-2);
  font-size: 12.5px;
  font-weight: 800;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.rate.on {
  background: #fff;
  color: var(--purple);
  box-shadow: 0 2px 6px rgba(108, 92, 231, 0.18);
}
.hint {
  margin-top: 12px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--muted-2);
}
.hint strong {
  color: var(--purple);
}

/* —— Danh sách câu sửa được —— */
.rows-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.add-btn {
  border: 1px solid rgba(108, 92, 231, 0.25);
  background: var(--purple-soft);
  color: var(--purple);
  font-size: 12.5px;
  font-weight: 800;
  padding: 7px 12px;
  border-radius: 10px;
  cursor: pointer;
}
.rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.row {
  border: 1px solid rgba(108, 92, 231, 0.14);
  border-radius: 14px;
  padding: 10px 12px;
  background: #fbfaff;
}
.row.active {
  border-color: var(--purple);
  background: linear-gradient(135deg, #f5f3ff, #fff);
}
.row-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
}
.num {
  flex: none;
  min-width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: var(--muted-2);
  background: #f0eef9;
  border-radius: 50%;
}
.spacer {
  flex: 1;
}
.time {
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
  color: var(--muted-2);
}
.mini {
  border: 1px solid rgba(108, 92, 231, 0.2);
  background: #fff;
  color: var(--ink);
  font-size: 11.5px;
  font-weight: 700;
  padding: 5px 8px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
}
.mini:hover {
  background: var(--purple-soft);
}
.mini.play {
  color: var(--purple);
  font-size: 12px;
}
.row-text {
  width: 100%;
  resize: vertical;
  line-height: 1.5;
}
.row-ops {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;
}
.op {
  border: 1px solid rgba(108, 92, 231, 0.22);
  background: #fff;
  color: var(--purple);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 9px;
  cursor: pointer;
}
.op:hover:not(:disabled) {
  background: var(--purple-soft);
}
.op:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.op.del {
  color: #d6512b;
  border-color: rgba(214, 81, 43, 0.3);
}
.op.del:hover {
  background: rgba(214, 81, 43, 0.08);
}
.empty {
  font-size: 13.5px;
  color: var(--muted);
}

/* —— Danh sách clip —— */
.list {
  margin-top: 32px;
}
.muted {
  color: var(--muted);
  font-size: 14px;
}
.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.tbl th {
  text-align: left;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--muted-2);
  padding: 8px 12px;
  border-bottom: 1.5px solid rgba(108, 92, 231, 0.12);
}
.tbl td {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(108, 92, 231, 0.12);
  vertical-align: middle;
}
.c-title {
  font-weight: 700;
  color: var(--ink);
}
.c-sub {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}
.lvl {
  font-size: 11.5px;
  font-weight: 800;
  color: var(--purple);
  background: var(--purple-soft);
  padding: 3px 10px;
  border-radius: 99px;
}
.row-actions {
  white-space: nowrap;
  text-align: right;
}
.row-actions .link + .link {
  margin-left: 14px;
}
.link {
  border: none;
  background: none;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--purple);
  cursor: pointer;
  padding: 0;
}
.link.del {
  color: #d6512b;
}
@media (max-width: 700px) {
  .meta-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
