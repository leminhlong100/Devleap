<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { speak, canSpeak } from '@/lib/speak'
import { cardsFromTerms } from '@/data/tools'
import { generateCard } from '@/lib/aiChat'
import WordDraftFields from '@/components/common/WordDraftFields.vue'

/**
 * Xem lại danh sách từ vựng & câu người học đã lưu khi trò chuyện với AI.
 * Tách 2 mục: Từ vựng (kind != 'sentence') và Câu (kind == 'sentence').
 * Có tìm kiếm, nghe phát âm, bỏ lưu, sửa lại, và lối tắt học lại bằng Flashcard.
 * Ngoài ra cho phép TỰ THÊM một thẻ mới: gõ từ -> AI tạo nháp (nghĩa/IPA/ví dụ/
 * loại từ/họ từ/cụm từ) -> xem lại, sửa/xóa/thêm tùy ý (WordDraftFields.vue)
 * rồi mới lưu, không lưu thẳng "mù" theo AI. Hình minh họa luôn tự động lấy
 * theo từ (không cần chọn/tạo ảnh thủ công), xem VocabIllustration.vue.
 *
 * "Chủ đề" (topic) khác với "Loại từ" (cat = danh/động/tính từ...): chủ đề là
 * nhóm do người học tự đặt (vd "Bài 1", "Học tập", "Làm việc") để gom từ lại
 * học riêng — tạo trước ở đây rồi mới gắn từ vào, xem vocabSlice.js#createTopic.
 */
const user = useUserStore()
const router = useRouter()
const speakable = canSpeak()
const keyOf = (t) => String(t || '').trim().toLowerCase()

// "Phân loại" = LOẠI TỪ (danh/động/tính/trạng từ...), không phải chủ đề.
const POS_OPTIONS = ['Danh từ', 'Động từ', 'Tính từ', 'Trạng từ', 'Cụm từ', 'Giới từ', 'Liên từ', 'Thán từ']
const DEFAULT_CAT = 'Từ vựng'

// —— Quản lý chủ đề ——
const newTopicName = ref('')
function addTopic() {
  if (user.createTopic(newTopicName.value)) newTopicName.value = ''
}
function removeTopic(name) {
  const n = countInTopic(name)
  const msg = n
    ? `Xóa chủ đề "${name}"? ${n} từ trong đó KHÔNG bị xóa, chỉ bỏ khỏi chủ đề này.`
    : `Xóa chủ đề "${name}"?`
  if (!confirm(msg)) return
  user.deleteTopic(name)
  if (topicFilter.value === name) topicFilter.value = ''
}
function countInTopic(name) {
  return user.savedWordList.filter((w) => w.topic === name).length
}
function studyFlashcards(topic) {
  const query = { deck: 'saved' }
  if (topic) query.topic = topic
  router.push({ name: 'tools-tab', params: { tool: 'flashcard' }, query })
}

// —— Tự thêm thẻ mới —— (2 bước: gõ từ -> AI tạo nháp -> xem/sửa/xóa/thêm rồi mới lưu)
const showCreate = ref(false)
const createStep = ref('form') // 'form' | 'review'
const form = reactive({ term: '', topic: '' })
const createDraft = reactive({ vi: '', ex: '', ipa: '', cat: '', family: [], collocations: [] })
const creating = ref(false)
const createError = ref('')

function toggleCreate() {
  showCreate.value = !showCreate.value
  createStep.value = 'form'
  createError.value = ''
}

async function genCreateDraft() {
  const term = form.term.trim()
  if (!term) return
  if (user.isWordSaved(term)) {
    createError.value = `“${term}” đã có trong danh sách rồi.`
    return
  }
  creating.value = true
  createError.value = ''
  try {
    // Từ đã có sẵn trong kho IT/glossary IELTS -> dùng luôn nghĩa/ví dụ, khỏi tốn
    // lượt gọi AI cho phần đó — nhưng vẫn hỏi AI để có thêm họ từ + cụm từ đi kèm.
    const base = cardsFromTerms([term], 'saved')[0]
    let gen = { pos: '', ipa: '', vi: '', ex: '', family: [], collocations: [] }
    try {
      gen = await generateCard(term)
    } catch {
      // AI không phản hồi được -> vẫn cho xem/sửa tay với dữ liệu có sẵn (nếu có).
    }
    createDraft.vi = base.vi || gen.vi
    createDraft.ex = base.ex || gen.ex
    createDraft.ipa = base.ipa || gen.ipa
    createDraft.cat = gen.pos && POS_OPTIONS.includes(gen.pos) ? gen.pos : ''
    createDraft.family = gen.family.map((f) => ({ ...f }))
    createDraft.collocations = [...gen.collocations]
    createStep.value = 'review'
  } catch {
    createError.value = 'Không tạo được thẻ, thử lại nhé.'
  } finally {
    creating.value = false
  }
}

function backToCreateForm() {
  createStep.value = 'form'
  createError.value = ''
}

function confirmCreate() {
  const term = form.term.trim()
  if (!term) return
  const base = cardsFromTerms([term], 'saved')[0]
  const family = createDraft.family
    .map((f) => ({ word: f.word.trim(), pos: f.pos.trim(), vi: f.vi.trim() }))
    .filter((f) => f.word)
  const collocations = createDraft.collocations.map((c) => c.trim()).filter(Boolean)
  user.saveWord({
    ...base,
    vi: createDraft.vi.trim(),
    ex: createDraft.ex.trim(),
    ipa: createDraft.ipa.trim(),
    cat: createDraft.cat || DEFAULT_CAT,
    topic: form.topic,
    family,
    collocations,
  })
  form.term = ''
  form.topic = ''
  showCreate.value = false
  createStep.value = 'form'
}

// —— Sửa lại một thẻ đã lưu ——
const editingKey = ref('')
const editForm = reactive({ vi: '', ex: '', ipa: '', cat: '', topic: '', family: [], collocations: [] })

function startEdit(w) {
  editingKey.value = keyOf(w.term)
  editForm.vi = w.vi || ''
  editForm.ex = w.ex || ''
  editForm.ipa = w.ipa || ''
  editForm.cat = w.cat || ''
  editForm.topic = w.topic || ''
  editForm.family = (w.family || []).map((f) => ({ ...f }))
  editForm.collocations = [...(w.collocations || [])]
}
function cancelEdit() {
  editingKey.value = ''
}
function saveEdit(w) {
  const family = editForm.family
    .map((f) => ({ word: f.word.trim(), pos: f.pos.trim(), vi: f.vi.trim() }))
    .filter((f) => f.word)
  const collocations = editForm.collocations.map((c) => c.trim()).filter(Boolean)
  user.updateSavedWord(w.term, {
    vi: editForm.vi.trim(),
    ex: editForm.ex.trim(),
    ipa: editForm.ipa.trim(),
    cat: editForm.cat.trim() || DEFAULT_CAT,
    topic: editForm.topic,
    family,
    collocations,
  })
  editingKey.value = ''
}

const query = ref('')
const catFilter = ref('')
const topicFilter = ref('') // '' = mọi chủ đề, '__none__' = chưa phân loại, else = tên chủ đề
const has = (s, q) => String(s || '').toLowerCase().includes(q)
const matches = (it, q) => !q || has(it.term, q) || has(it.vi, q) || has(it.context, q)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return user.savedWordList.filter((it) => matches(it, q))
})
const words = computed(() =>
  filtered.value.filter((it) => {
    if (it.kind === 'sentence') return false
    if (catFilter.value && it.cat !== catFilter.value) return false
    if (topicFilter.value === '__none__') return !it.topic
    if (topicFilter.value) return it.topic === topicFilter.value
    return true
  })
)
const sentences = computed(() => filtered.value.filter((it) => it.kind === 'sentence'))
// Loại từ đang thực sự có trong DANH SÁCH TỪ đã lưu -> chỉ hiện bộ lọc phù hợp, không rối.
const usedCategories = computed(() => {
  const set = new Set()
  for (const w of filtered.value) if (w.kind !== 'sentence' && w.cat) set.add(w.cat)
  return [...set].sort()
})

function say(text) {
  speak(text)
}
function remove(term) {
  user.removeSavedWord(term)
}
</script>

<template>
  <div class="saved">
    <div class="saved-head">
      <div>
        <h2 class="tool-title">🔖 Từ vựng &amp; câu đã lưu</h2>
        <p class="tool-sub">Những từ và câu bạn đã lưu khi trò chuyện với AI — xem lại bất cứ lúc nào.</p>
      </div>
      <button v-if="user.savedCount" class="study-btn" @click="studyFlashcards()">🃏 Học tất cả (Flashcard) →</button>
    </div>

    <!-- Quản lý chủ đề: nhóm từ đã lưu để học riêng từng nhóm -->
    <section class="topics-box">
      <div class="topics-head">
        <h3 class="topics-title">🗂️ Chủ đề của bạn</h3>
        <p class="topics-hint">Tạo chủ đề (vd: Bài 1, Học tập, Làm việc) để nhóm từ lại và học riêng từng nhóm.</p>
      </div>
      <div v-if="user.topicList.length" class="topics-list">
        <span v-for="t in user.topicList" :key="t" class="topic-chip">
          <button class="topic-study" title="Học flashcard chủ đề này" @click="studyFlashcards(t)">▶</button>
          <span class="topic-name">{{ t }}</span>
          <span class="topic-count">{{ countInTopic(t) }}</span>
          <button class="topic-remove" title="Xóa chủ đề (từ vẫn giữ nguyên, chỉ bỏ nhóm)" @click="removeTopic(t)">✕</button>
        </span>
      </div>
      <form class="topic-add" @submit.prevent="addTopic">
        <input v-model="newTopicName" placeholder="Tên chủ đề mới, vd: Bài 1" maxlength="40" />
        <button type="submit" :disabled="!newTopicName.trim()">+ Tạo chủ đề</button>
      </form>
    </section>

    <!-- Tự thêm thẻ mới -->
    <section class="create-box">
      <button class="create-toggle" @click="toggleCreate">
        {{ showCreate ? '✕ Đóng' : '➕ Thêm từ / câu mới' }}
      </button>
      <form v-if="showCreate && createStep === 'form'" class="create-form" @submit.prevent="genCreateDraft">
        <div class="field">
          <label for="cf-term">Từ vựng *</label>
          <input id="cf-term" v-model="form.term" placeholder="vd: resilience" :disabled="creating" autofocus />
        </div>
        <div class="field">
          <label for="cf-topic">Chủ đề <span class="opt">(tùy chọn)</span></label>
          <select id="cf-topic" v-model="form.topic" :disabled="creating">
            <option value="">— Không thuộc chủ đề nào —</option>
            <option v-for="t in user.topicList" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <p class="create-hint">🤖 AI sẽ tạo nháp nghĩa/IPA/ví dụ/họ từ/cụm từ — bạn xem & sửa trước khi lưu.</p>
        <p v-if="createError" class="create-error">{{ createError }}</p>
        <button type="submit" class="create-submit" :disabled="creating || !form.term.trim()">
          {{ creating ? 'AI đang tạo…' : '🤖 Để AI tạo nháp' }}
        </button>
      </form>

      <div v-else-if="showCreate" class="create-form">
        <h4 class="review-title">👀 Xem lại “{{ form.term }}”</h4>
        <p class="create-hint">AI đã tạo nháp — sửa lại, xóa hoặc thêm tùy ý trước khi lưu.</p>
        <WordDraftFields :draft="createDraft" :pos-options="POS_OPTIONS" />
        <p class="create-hint">🖼️ Hình minh họa tự động lấy theo từ vựng — không cần chọn ảnh.</p>
        <p v-if="createError" class="create-error">{{ createError }}</p>
        <div class="review-actions">
          <button type="button" class="edit-cancel" @click="backToCreateForm">← Sửa từ khác</button>
          <button type="button" class="create-submit" @click="confirmCreate">✓ Lưu thẻ này</button>
        </div>
      </div>
    </section>

    <!-- Chưa lưu gì -->
    <div v-if="!user.savedCount" class="empty">
      <div class="emoji">📚</div>
      <h3>Chưa có từ hay câu nào được lưu</h3>
      <p>
        Vào <b>💬 Trò chuyện với AI</b>, bật <b>📌 Lưu từ</b> rồi bấm vào từ (hoặc <b>💾 Lưu câu</b>) để
        thêm vào đây học lại.
      </p>
      <button class="go-chat" @click="router.push({ name: 'tools-tab', params: { tool: 'chat' } })">
        Tới Trò chuyện với AI →
      </button>
    </div>

    <template v-else>
      <div class="search-row">
        <div class="search">
          <span class="icon">🔍</span>
          <input v-model="query" placeholder="Tìm trong danh sách đã lưu…" />
        </div>
        <select v-if="usedCategories.length > 1" v-model="catFilter" class="cat-filter">
          <option value="">Mọi phân loại</option>
          <option v-for="c in usedCategories" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-if="user.topicList.length" v-model="topicFilter" class="cat-filter">
          <option value="">Mọi chủ đề</option>
          <option value="__none__">Chưa phân loại</option>
          <option v-for="t in user.topicList" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <!-- TỪ VỰNG -->
      <section v-if="words.length" class="group">
        <div class="group-head">
          <h3 class="group-title">📝 Từ vựng</h3>
          <span class="count">{{ words.length }} từ</span>
        </div>
        <div class="grid">
          <div v-for="w in words" :key="w.srsId" class="entry">
            <div class="entry-top">
              <div class="entry-title">
                <h4 class="term">{{ w.term }}</h4>
                <span v-if="w.cat" class="cat-badge">{{ w.cat }}</span>
                <span v-if="w.topic" class="topic-badge">🗂️ {{ w.topic }}</span>
              </div>
              <div class="entry-tools">
                <button v-if="speakable" class="mini" title="Nghe phát âm" @click="say(w.term)">🔊</button>
                <button v-if="editingKey !== keyOf(w.term)" class="mini" title="Sửa" @click="startEdit(w)">✎</button>
                <button class="mini danger" title="Bỏ lưu" @click="remove(w.term)">🗑</button>
              </div>
            </div>

            <!-- Đang sửa -->
            <div v-if="editingKey === keyOf(w.term)" class="edit-form">
              <WordDraftFields :draft="editForm" :pos-options="POS_OPTIONS" />
              <div class="field">
                <label>Chủ đề</label>
                <select v-model="editForm.topic">
                  <option value="">— Không thuộc chủ đề nào —</option>
                  <option v-for="t in user.topicList" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="edit-actions">
                <button type="button" class="edit-save" @click="saveEdit(w)">✓ Lưu</button>
                <button type="button" class="edit-cancel" @click="cancelEdit">Hủy</button>
              </div>
            </div>

            <!-- Hiển thị thường -->
            <template v-else>
              <div v-if="w.ipa" class="ipa">{{ w.ipa }}</div>
              <div v-if="w.vi" class="vi">{{ w.vi }}</div>
              <div v-else class="vi vi-empty">(chưa có nghĩa)</div>
              <p v-if="w.context || w.ex" class="ctx">“{{ w.context || w.ex }}”</p>
              <p v-if="w.family && w.family.length" class="family-preview">
                🌳 <span v-for="(f, i) in w.family" :key="f.word">{{ f.word }}<span v-if="i < w.family.length - 1">, </span></span>
              </p>
              <p v-if="w.collocations && w.collocations.length" class="colloc-preview">
                🔗 {{ w.collocations.join(' · ') }}
              </p>
            </template>
          </div>
        </div>
      </section>

      <!-- CÂU -->
      <section v-if="sentences.length" class="group">
        <div class="group-head">
          <h3 class="group-title">💬 Câu</h3>
          <span class="count">{{ sentences.length }} câu</span>
        </div>
        <div class="sent-list">
          <div v-for="s in sentences" :key="s.srsId" class="sent">
            <div class="sent-body">
              <p class="sent-en">{{ s.term }}</p>
              <p v-if="s.vi" class="sent-vi">{{ s.vi }}</p>
            </div>
            <div class="entry-tools">
              <button v-if="speakable" class="mini" title="Nghe lại" @click="say(s.term)">🔊</button>
              <button class="mini danger" title="Bỏ lưu" @click="remove(s.term)">🗑</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Có lưu nhưng tìm không khớp -->
      <div v-if="!words.length && !sentences.length" class="empty small">
        <div class="emoji">🙉</div>
        <p>Không tìm thấy mục nào khớp “<b>{{ query }}</b>”.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.saved {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 28px;
  padding: 36px;
  box-shadow: 0 18px 50px rgba(108, 92, 231, 0.1);
}
.saved-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 22px;
}
.tool-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.tool-sub {
  font-size: 14.5px;
  color: var(--slate);
  margin-top: 5px;
}
.study-btn {
  flex: none;
  cursor: pointer;
  border: none;
  color: #fff;
  background: var(--grad-purple);
  font-size: 13.5px;
  font-weight: 800;
  padding: 11px 16px;
  min-height: 44px;
  border-radius: 12px;
  transition: transform 0.12s, box-shadow 0.15s;
}
@media (hover: hover) {
  .study-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(108, 92, 231, 0.3);
  }
}
.study-btn:active {
  transform: scale(0.97);
  box-shadow: 0 8px 20px rgba(108, 92, 231, 0.3);
}
.topics-box {
  background: var(--bg);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 18px;
}
.topics-head {
  margin-bottom: 12px;
}
.topics-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
}
.topics-hint {
  font-size: 13px;
  color: var(--muted-2);
  margin-top: 4px;
}
.topics-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.topic-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.18);
  border-radius: 99px;
  padding: 4px 6px 4px 4px;
}
.topic-study {
  border: none;
  cursor: pointer;
  background: var(--grad-purple);
  color: #fff;
  font-size: 10px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.topic-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}
.topic-count {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--muted-2);
  background: var(--bg);
  padding: 1px 7px;
  border-radius: 99px;
}
.topic-remove {
  border: none;
  cursor: pointer;
  background: transparent;
  color: var(--muted-2);
  font-size: 12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
@media (hover: hover) {
  .topic-remove:hover {
    background: var(--bg-danger);
    color: var(--text-danger);
  }
}
.topic-add {
  display: flex;
  gap: 8px;
}
.topic-add input {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1.5px solid rgba(108, 92, 231, 0.16);
  background: var(--surface);
  font-family: inherit;
  font-size: 14px;
  color: var(--ink);
  outline: none;
}
.topic-add input:focus {
  border-color: var(--purple);
}
.topic-add button {
  flex: none;
  cursor: pointer;
  border: none;
  color: #fff;
  background: var(--grad-purple);
  font-size: 13px;
  font-weight: 800;
  padding: 0 16px;
  border-radius: 12px;
  transition: opacity 0.12s;
}
.topic-add button:disabled {
  opacity: 0.5;
  cursor: default;
}
.topic-badge {
  font-size: 11px;
  font-weight: 700;
  color: #00966a;
  background: var(--bg-success);
  padding: 3px 9px;
  border-radius: 99px;
  white-space: nowrap;
}
.create-box {
  margin-bottom: 22px;
}
.create-toggle {
  cursor: pointer;
  border: 1.5px dashed rgba(108, 92, 231, 0.35);
  background: var(--bg);
  color: var(--purple);
  font-size: 13.5px;
  font-weight: 800;
  padding: 11px 16px;
  min-height: 44px;
  border-radius: 12px;
  transition: background 0.12s, border-color 0.12s;
}
@media (hover: hover) {
  .create-toggle:hover {
    background: var(--purple-soft);
    border-color: var(--purple);
  }
}
.create-toggle:active {
  background: var(--purple-soft);
  border-color: var(--purple);
}
.create-form {
  margin-top: 14px;
  background: var(--bg);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}
.field .opt {
  font-weight: 500;
  color: var(--muted-2);
}
.field input,
.field select {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid rgba(108, 92, 231, 0.16);
  background: var(--surface);
  font-family: inherit;
  font-size: 15px;
  color: var(--ink);
  outline: none;
  cursor: pointer;
}
.field input {
  cursor: text;
}
.field input:focus,
.field select:focus {
  border-color: var(--purple);
}
.edit-form {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-soft);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.edit-form .field label {
  font-size: 12px;
}
.edit-form .field input,
.edit-form .field select {
  padding: 9px 12px;
  font-size: 14px;
  background: var(--bg);
}
.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}
.edit-save,
.edit-cancel {
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  padding: 9px 16px;
  min-height: 40px;
  border-radius: 10px;
  border: none;
}
.edit-save {
  color: #fff;
  background: var(--grad-purple);
}
.edit-cancel {
  color: var(--muted);
  background: var(--bg);
  border: 1px solid var(--line-soft);
}
.create-hint {
  font-size: 13px;
  color: var(--muted-2);
}
.review-title {
  font-size: 16px;
  font-weight: 800;
}
.review-actions {
  display: flex;
  gap: 10px;
}
.create-error {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-danger);
}
.create-submit {
  align-self: flex-start;
  cursor: pointer;
  border: none;
  color: #fff;
  background: var(--grad-purple);
  font-size: 14px;
  font-weight: 800;
  padding: 11px 20px;
  min-height: 44px;
  border-radius: 12px;
  transition: transform 0.12s, box-shadow 0.15s, opacity 0.12s;
}
.create-submit:disabled {
  opacity: 0.55;
  cursor: default;
}
@media (hover: hover) {
  .create-submit:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(108, 92, 231, 0.3);
  }
}
.create-submit:not(:disabled):active {
  transform: scale(0.97);
}
.search-row {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}
.search {
  position: relative;
  flex: 1;
  min-width: 0;
}
.icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 17px;
}
.search input {
  width: 100%;
  padding: 14px 18px 14px 48px;
  border-radius: 15px;
  border: 1.5px solid rgba(108, 92, 231, 0.16);
  background: var(--bg);
  font-family: inherit;
  font-size: 16px;
  color: var(--ink);
  outline: none;
}
.search input:focus {
  border-color: var(--purple);
  background: var(--surface);
}
.cat-filter {
  flex: none;
  max-width: 170px;
  padding: 0 14px;
  border-radius: 15px;
  border: 1.5px solid rgba(108, 92, 231, 0.16);
  background: var(--bg);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  outline: none;
  cursor: pointer;
}
.cat-filter:focus {
  border-color: var(--purple);
  background: var(--surface);
}
@media (max-width: 600px) {
  .search-row {
    flex-wrap: wrap;
  }
  .cat-filter {
    max-width: none;
    flex: 1 1 100%;
    min-height: 44px;
  }
}
.group {
  margin-bottom: 26px;
}
.group:last-child {
  margin-bottom: 0;
}
.group-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}
.group-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--ink);
}
.count {
  font-size: 12.5px;
  color: var(--muted-2);
  font-weight: 700;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.entry {
  background: var(--bg);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 16px 18px;
  transition: all 0.15s;
}
@media (hover: hover) {
  .entry:hover {
    border-color: rgba(108, 92, 231, 0.25);
    background: var(--surface);
  }
}
.entry:active {
  border-color: rgba(108, 92, 231, 0.25);
  background: var(--surface);
}
.entry-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.entry-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.term {
  font-size: 18px;
  font-weight: 800;
  color: var(--purple);
  word-break: break-word;
}
.cat-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted-2);
  background: var(--purple-soft);
  padding: 3px 9px;
  border-radius: 99px;
  white-space: nowrap;
}
.entry-tools {
  display: flex;
  gap: 6px;
  flex: none;
}
.mini {
  border: none;
  background: rgba(108, 92, 231, 0.1);
  cursor: pointer;
  font-size: 13px;
  width: 44px;
  height: 44px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
}
@media (hover: hover) {
  .mini:hover {
    background: rgba(108, 92, 231, 0.2);
  }
  .mini.danger:hover {
    background: var(--bg-danger);
  }
}
.mini:active {
  background: rgba(108, 92, 231, 0.2);
}
.mini.danger:active {
  background: var(--bg-danger);
}
.ipa {
  font-size: 13px;
  color: var(--muted);
  margin-top: 4px;
}
.vi {
  font-size: 14.5px;
  font-weight: 700;
  margin-top: 6px;
  color: var(--ink);
}
.vi-empty {
  color: var(--muted-2);
  font-weight: 600;
  font-style: italic;
}
.ctx {
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);
  font-style: italic;
  margin-top: 8px;
}
.family-preview,
.colloc-preview {
  font-size: 12.5px;
  color: var(--muted-2);
  margin-top: 6px;
}
.sent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sent {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  background: var(--bg);
  border: 1px solid var(--line-soft);
  border-left: 3px solid var(--purple);
  border-radius: 14px;
  padding: 14px 16px;
}
.sent-body {
  min-width: 0;
}
.sent-en {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.5;
}
.sent-vi {
  font-size: 14px;
  color: var(--muted);
  margin-top: 6px;
  line-height: 1.5;
}
.empty {
  text-align: center;
  padding: 44px 10px;
  color: var(--muted-2);
}
.empty.small {
  padding: 36px 0;
}
.emoji {
  font-size: 48px;
}
.empty h3 {
  font-size: 20px;
  font-weight: 800;
  margin-top: 10px;
  color: var(--ink);
}
.empty p {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.6;
}
.go-chat {
  margin-top: 18px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  padding: 12px 22px;
  border-radius: 13px;
  background: var(--grad-purple);
}
@media (max-width: 600px) {
  .saved {
    padding: 24px;
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
