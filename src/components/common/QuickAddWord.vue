<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { cardsFromTerms } from '@/data/tools'
import { generateCard } from '@/lib/aiChat'
import BottomSheet from '@/components/common/BottomSheet.vue'
import WordDraftFields from '@/components/common/WordDraftFields.vue'

/**
 * Nút nổi "Thêm từ" — cho phép lưu nhanh 1 từ đang học được (vd gặp trong
 * sách, video, hội thoại ngoài đời) mà không cần chuyển tới 🔖 Từ vựng & câu
 * đã lưu. Chỉ hiện trên các trang liên quan từ vựng tiếng Anh (route có
 * meta.vocabFab: IELTS, Giao Tiếp, Shadowing, Khu công cụ) — ẩn ở trang chủ,
 * khóa Java, tiến độ, admin... để đỡ che màn hình những chỗ không liên quan.
 * Luồng 2 bước: (1) gõ từ, để AI tạo nháp; (2) xem lại nháp AI tạo (nghĩa/
 * IPA/ví dụ/loại từ/họ từ/cụm từ) — sửa/xóa/thêm tự do rồi mới bấm Lưu.
 */
const POS_OPTIONS = ['Danh từ', 'Động từ', 'Tính từ', 'Trạng từ', 'Cụm từ', 'Giới từ', 'Liên từ', 'Thán từ']

const route = useRoute()
const visible = computed(() => !!route.meta?.vocabFab)

const user = useUserStore()
const open = ref(false)
const step = ref('input') // 'input' | 'review'
const term = ref('')
const topic = ref('')
const generating = ref(false)
const saving = ref(false)
const error = ref('')
const done = ref('')

const draft = reactive({ vi: '', ex: '', ipa: '', cat: '', family: [], collocations: [] })

function show() {
  open.value = true
  step.value = 'input'
  error.value = ''
  done.value = ''
}
function close() {
  open.value = false
}

// Rời khỏi trang có FAB (vd bấm link trong sheet) thì đóng sheet luôn, tránh
// nổi lơ lửng trên trang không liên quan.
watch(visible, (v) => {
  if (!v) open.value = false
})

async function generate() {
  const t = term.value.trim()
  if (!t) return
  if (user.isWordSaved(t)) {
    error.value = `“${t}” đã có trong danh sách rồi.`
    return
  }
  generating.value = true
  error.value = ''
  try {
    const base = cardsFromTerms([t], 'saved')[0]
    let gen = { pos: '', ipa: '', vi: '', ex: '', family: [], collocations: [] }
    try {
      gen = await generateCard(t)
    } catch {
      // AI không phản hồi được -> vẫn cho xem/sửa tay với dữ liệu có sẵn (nếu có).
    }
    draft.vi = base.vi || gen.vi
    draft.ex = base.ex || gen.ex
    draft.ipa = base.ipa || gen.ipa
    draft.cat = gen.pos && POS_OPTIONS.includes(gen.pos) ? gen.pos : ''
    draft.family = gen.family.map((f) => ({ ...f }))
    draft.collocations = [...gen.collocations]
    step.value = 'review'
  } catch {
    error.value = 'Không tạo được, thử lại nhé.'
  } finally {
    generating.value = false
  }
}

function backToInput() {
  step.value = 'input'
  error.value = ''
}

function save() {
  const t = term.value.trim()
  if (!t) return
  saving.value = true
  error.value = ''
  try {
    const base = cardsFromTerms([t], 'saved')[0]
    const family = draft.family.map((f) => ({ word: f.word.trim(), pos: f.pos.trim(), vi: f.vi.trim() })).filter((f) => f.word)
    const collocations = draft.collocations.map((c) => c.trim()).filter(Boolean)
    user.saveWord({
      ...base,
      vi: draft.vi.trim(),
      ex: draft.ex.trim(),
      ipa: draft.ipa.trim(),
      cat: draft.cat || 'Từ vựng',
      topic: topic.value,
      family,
      collocations,
    })
    done.value = `✓ Đã thêm “${t}”`
    term.value = ''
    topic.value = ''
    step.value = 'input'
  } catch {
    error.value = 'Không lưu được, thử lại nhé.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <button v-if="visible" class="quick-add-fab" title="Thêm từ mới đang học" aria-label="Thêm từ mới" @click="show">➕📝</button>

  <BottomSheet v-model="open">
    <div class="qa-body">
      <!-- Bước 1: gõ từ -->
      <template v-if="step === 'input'">
        <h3 class="qa-title">➕ Thêm từ đang học</h3>
        <p class="qa-hint">Gõ một từ tiếng Anh bất kỳ — AI tạo nháp nghĩa/IPA/ví dụ/họ từ/cụm từ để bạn xem & sửa trước khi lưu.</p>
        <form class="qa-form" @submit.prevent="generate">
          <input
            v-model="term"
            class="qa-input"
            placeholder="vd: resilience"
            :disabled="generating"
            autofocus
            @keyup.enter="generate"
          />
          <p v-if="error" class="qa-error">{{ error }}</p>
          <p v-if="done" class="qa-done">{{ done }}</p>
          <button type="submit" class="qa-submit" :disabled="generating || !term.trim()">
            {{ generating ? 'AI đang tạo…' : '🤖 Để AI tạo nháp' }}
          </button>
        </form>
      </template>

      <!-- Bước 2: xem lại nháp AI tạo, sửa/xóa/thêm rồi mới lưu -->
      <template v-else>
        <h3 class="qa-title">👀 Xem lại “{{ term }}”</h3>
        <p class="qa-hint">AI đã tạo nháp — sửa lại, xóa hoặc thêm tùy ý trước khi lưu.</p>

        <div class="qa-field">
          <label>Chủ đề <span class="opt">(tùy chọn)</span></label>
          <select v-model="topic" class="qa-select">
            <option value="">— Không thuộc chủ đề nào —</option>
            <option v-for="tpc in user.topicList" :key="tpc" :value="tpc">{{ tpc }}</option>
          </select>
        </div>

        <WordDraftFields :draft="draft" :pos-options="POS_OPTIONS" />

        <p v-if="error" class="qa-error">{{ error }}</p>
        <div class="qa-review-actions">
          <button type="button" class="qa-back" :disabled="saving" @click="backToInput">← Sửa từ khác</button>
          <button type="button" class="qa-submit" :disabled="saving" @click="save">
            {{ saving ? 'Đang lưu…' : '✓ Lưu thẻ này' }}
          </button>
        </div>
      </template>
    </div>
  </BottomSheet>
</template>

<style scoped>
.quick-add-fab {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 60;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  color: #fff;
  background: var(--grad-orange, linear-gradient(135deg, #f6a93a, #e08a2c));
  box-shadow: 0 8px 24px rgba(224, 138, 44, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
@media (hover: hover) {
  .quick-add-fab:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(224, 138, 44, 0.5);
  }
}
.quick-add-fab:active {
  transform: scale(0.94);
}
@media (max-width: 460px) {
  .quick-add-fab {
    left: 16px;
    bottom: calc(84px + var(--safe-bottom));
    width: 44px;
    height: 44px;
    font-size: 18px;
  }
}

.qa-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qa-title {
  margin: 0;
  font-size: 18px;
}
.qa-hint {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
.qa-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qa-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}
.qa-field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted-2);
}
.qa-field .opt {
  font-weight: 400;
  font-style: italic;
}
.qa-input,
.qa-select {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  font-size: 15px;
}
.qa-error {
  color: var(--red, #e74c3c);
  font-size: 13px;
  margin: 0;
}
.qa-done {
  color: var(--green, #00966a);
  font-size: 13px;
  margin: 0;
}
.qa-review-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}
.qa-back {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: transparent;
  color: var(--ink);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.qa-submit {
  flex: 2;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: var(--grad-orange, linear-gradient(135deg, #f6a93a, #e08a2c));
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
}
.qa-submit:disabled,
.qa-back:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
