<script setup>
import { ref, onMounted, computed } from 'vue'
import { parseVideoId } from '@/lib/youtube'
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
const level = ref('A1')
const generating = ref(false)
const error = ref('')

// Bài đang soạn: { videoId, title, topic, level, lang, sentences:{ai,original} }
const draft = ref(null)
const saving = ref(false)
const savedMsg = ref('')

const canSave = computed(() => draft.value && draft.value.sentences?.ai?.length > 0)

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
      level: level.value,
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
      ? { ai: clip.sentences, original: clip.sentences }
      : clip.sentences
    draft.value = {
      videoId: clip.videoId,
      title: clip.title,
      topic: clip.topic || '',
      level: clip.level || 'A1-A2',
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
</script>

<template>
  <div class="head">
    <h1 class="title">🎧 Quản lý Shadowing</h1>
    <p class="sub">
      Dán link YouTube (có phụ đề tiếng Anh), chọn cấp độ → hệ thống tự lấy transcript và đánh bóng.
      Sửa lại câu nếu sai rồi bấm Lưu là người dùng có ngay bài mới.
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
    <select v-model="level" class="in level" :disabled="generating">
      <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
    </select>
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

    <h3 class="sec-head">Các câu ({{ draft.sentences.ai.length }}) — sửa nếu sai</h3>
    <div class="rows">
      <div v-for="(s, i) in draft.sentences.ai" :key="i" class="row">
        <span class="num">{{ i + 1 }}</span>
        <textarea v-model="s.text" class="in row-text" rows="2"></textarea>
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
  max-width: 720px;
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
.level {
  width: 110px;
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
.rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.num {
  flex: none;
  width: 26px;
  text-align: right;
  font-size: 13px;
  font-weight: 800;
  color: var(--muted-2);
  padding-top: 12px;
}
.row-text {
  flex: 1;
  resize: vertical;
  line-height: 1.5;
}
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
