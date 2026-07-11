<script setup>
/**
 * Tìm kiếm toàn cục — nút mở trên header + bảng lệnh (command palette) phủ toàn
 * màn hình. Mở bằng click, phím "/" hoặc Ctrl/Cmd+K. Điều hướng kết quả bằng
 * mũi tên ↑↓, chọn bằng Enter, đóng bằng Esc.
 */
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { searchAll, normalize } from '@/data/searchIndex'
import { useAnalytics } from '@/composables/useAnalytics'

const router = useRouter()
const { track } = useAnalytics()

const open = ref(false)
const query = ref('')
const active = ref(0)
const inputEl = ref(null)
const listEl = ref(null)

const TYPE_LABEL = { lesson: 'Bài học', vocab: 'Từ vựng', term: 'Thuật ngữ' }
const TYPE_ORDER = ['lesson', 'vocab', 'term']

const results = computed(() => (query.value.trim() ? searchAll(query.value, { limit: 40 }) : []))

// Gom theo loại để hiển thị thành nhóm. Trong nhóm giữ thứ tự điểm; giữa các
// nhóm thì nhóm chứa kết quả điểm cao nhất nổi lên trên, để mục khớp nhất luôn
// nằm đầu danh sách (và là mục được chọn sẵn khi nhấn Enter).
const groups = computed(() => {
  const by = {}
  for (const r of results.value) (by[r.type] ||= []).push(r)
  return TYPE_ORDER.filter((t) => by[t]?.length)
    .map((t) => ({ type: t, label: TYPE_LABEL[t], items: by[t], best: by[t][0].score }))
    .sort((a, b) => b.best - a.best)
})

// Danh sách phẳng (theo thứ tự hiển thị) để điều hướng bàn phím.
const flat = computed(() => groups.value.flatMap((g) => g.items))

watch(results, () => {
  active.value = 0
})

function openPalette() {
  open.value = true
  track('search_open') // Bước 4.1 — đo mức dùng tính năng tìm kiếm.
  nextTick(() => inputEl.value?.focus())
}
function closePalette() {
  open.value = false
  query.value = ''
  active.value = 0
}

function move(delta) {
  const n = flat.value.length
  if (!n) return
  active.value = (active.value + delta + n) % n
  scrollActiveIntoView()
}
function scrollActiveIntoView() {
  nextTick(() => {
    listEl.value?.querySelector('.res.active')?.scrollIntoView({ block: 'nearest' })
  })
}

function go(item) {
  if (!item) return
  router.push(item.route)
  closePalette()
}
function onEnter() {
  go(flat.value[active.value])
}

// Đánh dấu phần khớp trong tiêu đề (không phân biệt dấu).
function highlight(title) {
  const q = normalize(query.value).split(' ').filter(Boolean)
  if (!q.length) return escapeHtml(title)
  const tNorm = normalize(title)
  // map vị trí ký tự gốc -> chuẩn hóa cùng độ dài (normalize giữ độ dài ký tự khi
  // chỉ bỏ dấu); ta đánh dấu các khoảng khớp token.
  const marks = new Array(title.length).fill(false)
  for (const tok of q) {
    let from = 0
    let idx
    while ((idx = tNorm.indexOf(tok, from)) !== -1) {
      for (let k = idx; k < idx + tok.length && k < title.length; k++) marks[k] = true
      from = idx + tok.length
    }
  }
  let out = ''
  let on = false
  for (let i = 0; i < title.length; i++) {
    if (marks[i] && !on) {
      out += '<mark>'
      on = true
    } else if (!marks[i] && on) {
      out += '</mark>'
      on = false
    }
    out += escapeHtml(title[i])
  }
  if (on) out += '</mark>'
  return out
}
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// Phím tắt toàn cục: "/" hoặc Ctrl/Cmd+K để mở.
function onKeydown(e) {
  const k = e.key
  const inField = /^(input|textarea|select)$/i.test(e.target?.tagName) || e.target?.isContentEditable
  if ((e.metaKey || e.ctrlKey) && (k === 'k' || k === 'K')) {
    e.preventDefault()
    open.value ? closePalette() : openPalette()
    return
  }
  if (open.value && k === 'Escape') {
    e.preventDefault()
    closePalette()
    return
  }
  if (!open.value && k === '/' && !inField) {
    e.preventDefault()
    openPalette()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const isMac = computed(() => typeof navigator !== 'undefined' && /mac/i.test(navigator.platform))
</script>

<template>
  <button class="search-trigger" @click="openPalette" aria-label="Tìm kiếm">
    <span class="mag">🔍</span>
    <span class="ph">Tìm kiếm</span>
    <kbd class="kbd">{{ isMac ? '⌘' : 'Ctrl' }} K</kbd>
  </button>

  <Teleport to="body">
    <Transition name="pal">
      <div v-if="open" class="pal-overlay" @click.self="closePalette" @keydown.esc="closePalette">
        <div class="pal" role="dialog" aria-label="Tìm kiếm toàn cục">
          <div class="pal-input-row">
            <span class="pal-mag">🔍</span>
            <input
              ref="inputEl"
              v-model="query"
              class="pal-input"
              type="text"
              placeholder="Tìm bài học, từ vựng, thuật ngữ…"
              autocomplete="off"
              spellcheck="false"
              @keydown.down.prevent="move(1)"
              @keydown.up.prevent="move(-1)"
              @keydown.enter.prevent="onEnter"
              @keydown.esc="closePalette"
            />
            <button class="pal-esc" @click="closePalette">Esc</button>
          </div>

          <div ref="listEl" class="pal-body">
            <template v-if="flat.length">
              <div v-for="g in groups" :key="g.type" class="group">
                <div class="group-head">{{ g.label }} <span class="group-count">{{ g.items.length }}</span></div>
                <button
                  v-for="item in g.items"
                  :key="item.id"
                  class="res"
                  :class="{ active: flat[active] && flat[active].id === item.id }"
                  @click="go(item)"
                  @mousemove="active = flat.indexOf(item)"
                >
                  <span class="res-icon">{{ item.icon }}</span>
                  <span class="res-main">
                    <span class="res-title" v-html="highlight(item.title)"></span>
                    <span class="res-sub">{{ item.subtitle }}</span>
                    <span v-if="item.snippet" class="res-snip">{{ item.snippet }}</span>
                  </span>
                  <span class="res-tags">
                    <span class="tag" :class="item.course">{{ item.courseLabel }}</span>
                    <span v-if="item.count > 1" class="tag count">×{{ item.count }}</span>
                  </span>
                </button>
              </div>
            </template>

            <div v-else-if="query.trim()" class="empty">
              Không tìm thấy kết quả cho “<b>{{ query }}</b>”.
            </div>
            <div v-else class="hint">
              <p class="hint-title">Tìm xuyên suốt ~115 ngày học</p>
              <ul class="hint-list">
                <li><span>🔤</span> Từ vựng tiếng Anh (IELTS)</li>
                <li><span>📄</span> Bài học theo tuần / ngày</li>
                <li><span>💬</span> Câu hỏi phỏng vấn & chủ đề ngữ pháp</li>
              </ul>
              <p class="hint-tip">Mẹo: gõ không dấu vẫn ra kết quả — “ke thua” → “kế thừa”.</p>
            </div>
          </div>

          <div class="pal-foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> di chuyển</span>
            <span><kbd>↵</kbd> mở</span>
            <span><kbd>esc</kbd> đóng</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* —— nút mở trên header —— */
.search-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border: 1px solid rgba(108, 92, 231, 0.16);
  background: var(--surface);
  color: var(--muted, #76768e);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 11px;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(108, 92, 231, 0.06);
  transition: background 0.15s, border-color 0.15s;
  min-width: 230px;
}
@media (hover: hover) {
  .search-trigger:hover {
    background: var(--purple-soft, #f2f0ff);
    border-color: rgba(108, 92, 231, 0.3);
  }
}
.search-trigger:active {
  background: var(--purple-soft, #f2f0ff);
  border-color: rgba(108, 92, 231, 0.3);
}
.search-trigger .mag {
  font-size: 14px;
}
.search-trigger .ph {
  flex: 1;
  text-align: left;
}
.kbd {
  font: 600 11px var(--mono, monospace);
  color: var(--muted-2, #9a9ab0);
  background: var(--chip-bg);
  border: 1px solid rgba(108, 92, 231, 0.14);
  border-radius: 6px;
  padding: 2px 6px;
}

/* —— overlay + bảng —— */
.pal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(30, 30, 46, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 84px 18px 24px;
}
.pal {
  width: 100%;
  max-width: 640px;
  background: var(--surface, #fff);
  border: 1px solid rgba(108, 92, 231, 0.14);
  border-radius: 18px;
  box-shadow: 0 30px 80px rgba(30, 30, 46, 0.35);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: min(72vh, 620px);
}
.pal-input-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line, rgba(108, 92, 231, 0.1));
}
.pal-mag {
  font-size: 18px;
}
.pal-input {
  flex: 1;
  border: none;
  outline: none;
  background: none;
  font: inherit;
  font-size: 17px;
  color: var(--ink, #1e1e2e);
}
.pal-esc {
  border: 1px solid var(--line, rgba(108, 92, 231, 0.12));
  background: var(--chip-bg);
  color: var(--muted, #76768e);
  font: 600 12px var(--mono, monospace);
  padding: 4px 8px;
  border-radius: 7px;
  cursor: pointer;
}

.pal-body {
  overflow-y: auto;
  padding: 8px;
}
.group + .group {
  margin-top: 4px;
}
.group-head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted-2, #9a9ab0);
  padding: 10px 12px 6px;
}
.group-count {
  font-weight: 700;
  color: var(--purple, #6c5ce7);
  background: var(--purple-soft, #f2f0ff);
  border-radius: 6px;
  padding: 0 6px;
}
.res {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  font: inherit;
  padding: 9px 12px;
  border-radius: 11px;
  cursor: pointer;
}
.res.active {
  background: var(--purple-soft, #f2f0ff);
}
.res-icon {
  font-size: 20px;
  width: 26px;
  text-align: center;
  flex: none;
}
.res-main {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.res-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink, #1e1e2e);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.res-title :deep(mark) {
  background: rgba(255, 176, 32, 0.32);
  color: inherit;
  border-radius: 3px;
  padding: 0 1px;
}
.res-sub {
  font-size: 12px;
  color: var(--muted, #76768e);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.res-snip {
  font-size: 11.5px;
  color: var(--muted-2, #9a9ab0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.res-tags {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: none;
}
.tag {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 7px;
}
.tag.java {
  color: #b06a00;
  background: rgba(255, 176, 32, 0.16);
}
.tag.ielts {
  color: var(--purple, #6c5ce7);
  background: var(--purple-soft, #f2f0ff);
}
.tag.count {
  color: var(--muted, #76768e);
  background: var(--chip-bg);
}

.empty,
.hint {
  padding: 26px 22px;
  color: var(--muted, #76768e);
}
.empty b {
  color: var(--ink, #1e1e2e);
}
.hint-title {
  font-size: 14px;
  font-weight: 800;
  color: var(--ink, #1e1e2e);
  margin: 0 0 12px;
}
.hint-list {
  list-style: none;
  padding: 0;
  margin: 0 0 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hint-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
}
.hint-tip {
  font-size: 12.5px;
  color: var(--muted-2, #9a9ab0);
  margin: 0;
}

.pal-foot {
  display: flex;
  gap: 16px;
  padding: 10px 18px;
  border-top: 1px solid var(--line, rgba(108, 92, 231, 0.1));
  font-size: 12px;
  color: var(--muted-2, #9a9ab0);
}
.pal-foot kbd {
  font: 600 11px var(--mono, monospace);
  background: var(--chip-bg);
  border: 1px solid rgba(108, 92, 231, 0.14);
  border-radius: 5px;
  padding: 1px 5px;
  margin-right: 2px;
}

/* —— transition —— */
.pal-enter-active,
.pal-leave-active {
  transition: opacity 0.16s ease;
}
.pal-enter-from,
.pal-leave-to {
  opacity: 0;
}
.pal-enter-active .pal,
.pal-leave-active .pal {
  transition: transform 0.18s ease;
}
.pal-enter-from .pal,
.pal-leave-to .pal {
  transform: translateY(-12px) scale(0.98);
}

@media (max-width: 860px) {
  .search-trigger {
    min-width: 0;
  }
  .search-trigger .ph,
  .search-trigger .kbd {
    display: none;
  }
  .search-trigger {
    width: 38px;
    height: 38px;
    padding: 0;
    justify-content: center;
    border-radius: 11px;
  }
  /* Vùng chạm mở rộng ≥44px mà không đổi kích thước icon hiển thị (38px) */
  .search-trigger::after {
    content: '';
    position: absolute;
    inset: -3px;
  }
}
@media (max-width: 720px) {
  .pal-overlay {
    padding: 60px 10px 16px;
  }
}
</style>
