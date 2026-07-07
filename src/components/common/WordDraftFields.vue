<script setup>
/**
 * Khối input dùng chung để XEM & SỬA một thẻ từ vựng nháp (vi/ex/ipa/cat +
 * họ từ + cụm từ) — trước khi lưu (SavedTool.vue, QuickAddWord.vue) hoặc khi
 * sửa lại một thẻ đã lưu. `draft` là object reactive của component cha, được
 * sửa trực tiếp tại đây (không emit) để cha khỏi phải nối dây 6 field riêng lẻ.
 */
const props = defineProps({
  draft: { type: Object, required: true }, // { vi, ex, ipa, cat, family, collocations }
  posOptions: { type: Array, required: true },
})

function addFamilyRow() {
  props.draft.family.push({ word: '', pos: '', vi: '' })
}
function removeFamilyRow(i) {
  props.draft.family.splice(i, 1)
}
function addCollocation() {
  props.draft.collocations.push('')
}
function removeCollocation(i) {
  props.draft.collocations.splice(i, 1)
}
</script>

<template>
  <div class="wdf">
    <div class="wdf-field">
      <label>Nghĩa tiếng Việt</label>
      <input v-model="draft.vi" class="wdf-input" placeholder="nghĩa..." />
    </div>
    <div class="wdf-field">
      <label>Câu ví dụ</label>
      <input v-model="draft.ex" class="wdf-input" placeholder="câu ví dụ..." />
    </div>
    <div class="wdf-field">
      <label>IPA</label>
      <input v-model="draft.ipa" class="wdf-input" placeholder="/.../" />
    </div>
    <div class="wdf-field">
      <label>Loại từ</label>
      <select v-model="draft.cat" class="wdf-input">
        <option value="">— Chưa xác định —</option>
        <option v-for="p in posOptions" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>

    <div class="wdf-field">
      <label>🌳 Họ từ</label>
      <div v-for="(f, i) in draft.family" :key="'fam-' + i" class="wdf-row">
        <input v-model="f.word" class="wdf-input wdf-row-word" placeholder="từ" />
        <input v-model="f.pos" class="wdf-input wdf-row-pos" placeholder="loại" />
        <input v-model="f.vi" class="wdf-input wdf-row-vi" placeholder="nghĩa" />
        <button type="button" class="wdf-row-remove" title="Xóa" @click="removeFamilyRow(i)">✕</button>
      </div>
      <button type="button" class="wdf-add-row" @click="addFamilyRow">+ Thêm từ liên quan</button>
    </div>

    <div class="wdf-field">
      <label>🔗 Cụm từ hay dùng</label>
      <div v-for="(c, i) in draft.collocations" :key="'col-' + i" class="wdf-row">
        <input v-model="draft.collocations[i]" class="wdf-input" placeholder="cụm từ" />
        <button type="button" class="wdf-row-remove" title="Xóa" @click="removeCollocation(i)">✕</button>
      </div>
      <button type="button" class="wdf-add-row" @click="addCollocation">+ Thêm cụm từ</button>
    </div>
  </div>
</template>

<style scoped>
.wdf {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.wdf-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}
.wdf-field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted-2);
}
.wdf-input {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  font-size: 15px;
}
.wdf-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.wdf-row .wdf-input {
  padding: 9px 10px;
  font-size: 14px;
}
.wdf-row-word {
  flex: 1.2;
}
.wdf-row-pos {
  flex: 0.6;
}
.wdf-row-vi {
  flex: 1;
}
.wdf-row-remove {
  border: none;
  background: transparent;
  color: var(--red, #e74c3c);
  font-size: 16px;
  cursor: pointer;
  padding: 6px;
  flex: none;
}
.wdf-add-row {
  align-self: flex-start;
  border: 1px dashed var(--line);
  background: transparent;
  color: var(--muted);
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  margin-top: 2px;
}
</style>
