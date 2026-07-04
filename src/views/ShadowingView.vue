<script setup>
import { ref, shallowRef, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchClipList, fetchClip } from '@/lib/shadowingRepo'
import ShadowingPlayer from '@/components/tools/ShadowingPlayer.vue'
import { parseVideoId } from '@/lib/youtube'
import { useUserStore } from '@/stores/user'

const user = useUserStore()
const route = useRoute()
const router = useRouter()

// Đến từ buổi học IELTS (?week=N) -> lọc sẵn theo clip đã gắn tuần đó (thang nghe
// "thật hóa dần", xem docs/KE_HOACH_CAI_TIEN_GIAO_TIEP.md mục 3.5).
const weekFilter = ref(route.query.week ? Number(route.query.week) : null)
function clearWeekFilter() {
  weekFilter.value = null
  router.replace({ query: { ...route.query, week: undefined } })
}

const shadowingClips = ref([])
const selectedId = ref(null)
const clip = shallowRef(null)
const loading = ref(false)
const listLoading = ref(true)

// Nạp danh mục clip (Supabase, fallback file tĩnh). KHÔNG tự mở clip nào —
// để người dùng tự chọn từ thư viện cho gọn.
onMounted(async () => {
  try {
    shadowingClips.value = await fetchClipList()
  } catch {
    shadowingClips.value = []
  } finally {
    listLoading.value = false
  }
})

// —— Bộ lọc ——
const LEVEL_FILTERS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const levelFilter = ref('all')
const topicFilter = ref('all')

/** Các chủ đề có thật trong danh sách (để đổ vào dropdown). */
const topics = computed(() => {
  const set = new Set()
  for (const c of shadowingClips.value) if (c.topic) set.add(c.topic)
  return [...set].sort()
})

/** Tách 'A1-A2' -> ['A1','A2'] để lọc theo từng cấp. */
function levelTokens(level) {
  return String(level || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean)
}

/** Nhóm màu theo cấp: A* xanh, B* vàng, C* đỏ. */
function levelTone(level) {
  const l = String(level || '').toUpperCase()
  if (l.startsWith('A')) return 'green'
  if (l.startsWith('B')) return 'amber'
  if (l.startsWith('C')) return 'red'
  return 'gray'
}

function thumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

const filteredClips = computed(() =>
  shadowingClips.value.filter((c) => {
    const okTopic = topicFilter.value === 'all' || c.topic === topicFilter.value
    const okLevel = levelFilter.value === 'all' || levelTokens(c.level).includes(levelFilter.value)
    const okWeek = !weekFilter.value || c.week === weekFilter.value
    return okTopic && okLevel && okWeek
  }),
)

// —— Tải bài từ URL YouTube bất kỳ ——
const urlInput = ref('')
const loadingUrl = ref(false)
const loadError = ref('')

async function load(id) {
  if (!id) return
  loading.value = true
  clip.value = await fetchClip(id)
  loading.value = false
  await nextTick()
  document.getElementById('sh-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
watch(selectedId, load, { immediate: true })

async function loadFromUrl() {
  const id = parseVideoId(urlInput.value)
  loadError.value = ''
  if (!id) {
    loadError.value = 'Link không hợp lệ. Dán dạng youtube.com/watch?v=… hoặc youtu.be/…'
    return
  }
  loadingUrl.value = true
  try {
    let res
    try {
      res = await fetch('/.netlify/functions/shadowing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.value }),
      })
    } catch {
      throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      // error có thể là string (dạng cũ) hoặc { code, message } (netlify/functions/_llm.js#errorResponse).
      const err = data?.error
      throw new Error((err && typeof err === 'object' ? err.message : err) || 'Không tải được bài.')
    }
    selectedId.value = null // bỏ chọn clip gợi ý để player nhận clip URL
    clip.value = {
      videoId: data.videoId,
      title: data.title,
      level: 'YouTube',
      topic: data.author || 'Tự tải',
      sentences: data.sentences, // { ai, original }
    }
    await nextTick()
    document.getElementById('sh-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (e) {
    loadError.value = e?.message || 'Không tải được bài. Thử lại hoặc chọn clip gợi ý.'
  } finally {
    loadingUrl.value = false
  }
}

function pickFeatured(id) {
  loadError.value = ''
  selectedId.value = id
}
</script>

<template>
  <div class="container page">
    <div class="page-head">
      <h1 class="title">Luyện Shadowing 🎧</h1>
      <p class="sub">
        Chọn một bài trong thư viện theo chủ đề &amp; cấp độ, hoặc dán link YouTube bất kỳ để tự
        tạo bài. Phát từng câu, bật lặp, xem IPA, giảm tốc độ và thu âm để tự so sánh.
      </p>
    </div>

    <!-- Tải từ URL YouTube -->
    <form class="url-bar" @submit.prevent="loadFromUrl">
      <input
        v-model="urlInput"
        class="url-input"
        type="text"
        inputmode="url"
        placeholder="Dán link YouTube… (vd https://youtube.com/watch?v=…)"
        :disabled="loadingUrl"
      />
      <button class="url-btn" type="submit" :disabled="loadingUrl || !urlInput.trim()">
        {{ loadingUrl ? 'Đang tải…' : '▶ Tải video' }}
      </button>
    </form>
    <p v-if="loadError" class="url-err">⚠️ {{ loadError }}</p>

    <!-- Đến từ buổi học IELTS: đang lọc theo tuần -->
    <div v-if="weekFilter" class="week-banner">
      <span>🎧 Đang lọc bài gợi ý cho <b>Tuần {{ weekFilter }}</b></span>
      <button class="week-clear" @click="clearWeekFilter">Xem tất cả bài ✕</button>
    </div>

    <!-- Thanh lọc: chủ đề + cấp độ -->
    <div class="filters">
      <select v-model="topicFilter" class="topic-select">
        <option value="all">Tất cả chủ đề</option>
        <option v-for="t in topics" :key="t" :value="t">{{ t }}</option>
      </select>

      <div class="level-chips">
        <button
          class="lv-chip"
          :class="{ on: levelFilter === 'all' }"
          @click="levelFilter = 'all'"
        >
          Tất cả
        </button>
        <button
          v-for="lv in LEVEL_FILTERS"
          :key="lv"
          class="lv-chip"
          :class="[`tone-${levelTone(lv)}`, { on: levelFilter === lv }]"
          @click="levelFilter = lv"
        >
          <span class="dot"></span>{{ lv }}
        </button>
      </div>
    </div>

    <!-- Thư viện clip -->
    <div v-if="listLoading" class="empty">Đang tải thư viện…</div>
    <div v-else-if="!shadowingClips.length" class="empty">
      Chưa có bài nào trong thư viện. Hãy dán link YouTube ở trên để bắt đầu.
    </div>
    <div v-else-if="weekFilter && !filteredClips.length" class="empty">
      Chưa có bài nào được gắn cho Tuần {{ weekFilter }}. Xem thư viện chung bên dưới hoặc dán link YouTube ở trên.
      <div><button class="week-clear" @click="clearWeekFilter">Xem tất cả bài ✕</button></div>
    </div>
    <div v-else-if="!filteredClips.length" class="empty">
      Không có bài nào khớp bộ lọc. Thử bỏ bớt điều kiện.
    </div>
    <div v-else class="clip-grid">
      <button
        v-for="c in filteredClips"
        :key="c.videoId"
        class="clip-card"
        :class="{ on: c.videoId === selectedId }"
        @click="pickFeatured(c.videoId)"
      >
        <div class="thumb">
          <img :src="thumb(c.videoId)" alt="" loading="lazy" @error="(e) => (e.target.style.display = 'none')" />
          <span v-if="c.topic" class="badge topic">{{ c.topic }}</span>
          <span class="badge level" :class="`tone-${levelTone(c.level)}`">{{ c.level }}</span>
          <span class="badge count">☰ {{ c.sentenceCount }} câu</span>
          <span v-if="c.videoId === selectedId" class="open-tag">ĐANG MỞ</span>
        </div>
        <div class="card-body">
          <h3>{{ c.title }}</h3>
          <div class="card-foot">
            <span
              v-if="user.shadowingPassed(c.videoId)"
              class="status done"
            >✓ Hoàn thành</span>
            <span
              v-else-if="user.shadowingOf(c.videoId)"
              class="status best"
            >Tốt nhất {{ user.shadowingOf(c.videoId).best }}%</span>
            <span v-else class="status new">Chưa luyện</span>
          </div>
        </div>
      </button>
    </div>

    <div id="sh-player">
      <div v-if="loading" class="loading">Đang tải clip…</div>
      <ShadowingPlayer v-else-if="clip" :clip="clip" :key="clip.videoId" />
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 48px 28px 70px;
  max-width: 1080px;
}
.page-head {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 32px;
}
.title {
  font-size: 40px;
  font-weight: 800;
  letter-spacing: -1px;
}
.sub {
  font-size: 17px;
  color: var(--slate);
  margin-top: 12px;
  line-height: 1.6;
}
.url-bar {
  display: flex;
  gap: 10px;
  max-width: 760px;
  margin: 0 auto 6px;
}
.url-input {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  padding: 13px 16px;
  border: 1.5px solid rgba(108, 92, 231, 0.2);
  border-radius: 14px;
  background: var(--surface);
  color: var(--ink);
  transition: border-color 0.15s;
}
.url-input:focus {
  outline: none;
  border-color: var(--purple);
}
.url-btn {
  flex: none;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  background: var(--grad-purple);
  border: none;
  border-radius: 14px;
  padding: 0 22px;
  cursor: pointer;
}
.url-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.url-err {
  max-width: 760px;
  margin: 0 auto 8px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--danger-strong);
  background: rgba(214, 81, 43, 0.08);
  border: 1px solid rgba(214, 81, 43, 0.25);
  padding: 10px 14px;
  border-radius: 12px;
}

.week-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: 760px;
  margin: 0 auto 6px;
  padding: 10px 16px;
  background: rgba(108, 92, 231, 0.08);
  border: 1px solid rgba(108, 92, 231, 0.2);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}
.week-clear {
  border: none;
  background: none;
  color: var(--purple);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  padding: 4px 8px;
}

/* —— Thanh lọc —— */
.filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin: 28px 0 18px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 16px;
}
.topic-select {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  padding: 9px 14px;
  border: 1.5px solid rgba(108, 92, 231, 0.18);
  border-radius: 11px;
  background: var(--surface);
  cursor: pointer;
  min-width: 170px;
}
.topic-select:focus {
  outline: none;
  border-color: var(--purple);
}
.level-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.lv-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--slate);
  background: var(--chip-bg);
  border: 1.5px solid transparent;
  padding: 7px 13px;
  border-radius: 99px;
  cursor: pointer;
  transition: all 0.15s;
}
.lv-chip:hover {
  background: var(--track-bg);
}
.lv-chip .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.lv-chip.tone-green {
  color: #15a86f;
}
.lv-chip.tone-amber {
  color: #d99800;
}
.lv-chip.tone-red {
  color: #e0455e;
}
.lv-chip.on {
  border-color: currentColor;
  background: var(--surface);
  box-shadow: 0 2px 10px rgba(108, 92, 231, 0.1);
}
.lv-chip:first-child.on {
  color: var(--purple);
}

/* —— Lưới card —— */
.clip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
  margin-bottom: 32px;
}
.clip-card {
  position: relative;
  text-align: left;
  padding: 0;
  background: var(--surface);
  border: 1.5px solid rgba(108, 92, 231, 0.1);
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
.clip-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(108, 92, 231, 0.14);
}
.clip-card.on {
  border-color: var(--purple);
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.18);
}
.thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #6c5ce7, #8b7cf0);
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.badge {
  position: absolute;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 9px;
  border-radius: 8px;
  line-height: 1;
  backdrop-filter: blur(2px);
}
.badge.topic {
  top: 8px;
  left: 8px;
  max-width: 64%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fff;
  background: rgba(20, 18, 38, 0.62);
}
.badge.count {
  bottom: 8px;
  left: 8px;
  color: #fff;
  background: rgba(20, 18, 38, 0.62);
}
.badge.level {
  top: 8px;
  right: 8px;
  color: #fff;
}
.badge.level.tone-green {
  background: #15a86f;
}
.badge.level.tone-amber {
  background: #d99800;
}
.badge.level.tone-red {
  background: #e0455e;
}
.badge.level.tone-gray {
  background: #6c5ce7;
}
.open-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: var(--green, #00b377);
  color: #fff;
  font-size: 10.5px;
  font-weight: 800;
  padding: 4px 9px;
  border-radius: 8px;
}
.card-body {
  padding: 13px 14px 15px;
}
.card-body h3 {
  font-size: 15.5px;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.35;
  margin-bottom: 9px;
  /* tối đa 2 dòng cho đều card */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.7em;
}
.card-foot {
  display: flex;
  align-items: center;
}
.status {
  font-size: 11.5px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 99px;
}
.status.done {
  color: #fff;
  background: linear-gradient(135deg, #00d68f, #00b377);
}
.status.best {
  color: var(--amber-ink);
  background: rgba(255, 176, 32, 0.16);
}
.status.new {
  color: var(--muted-2);
  background: var(--chip-bg);
}
.empty {
  text-align: center;
  padding: 48px 20px;
  color: var(--muted);
  font-size: 15px;
}
.loading {
  text-align: center;
  padding: 40px;
  color: var(--muted);
}
@media (max-width: 760px) {
  .title {
    font-size: 32px;
  }
  .filters {
    justify-content: flex-start;
  }
}
</style>
