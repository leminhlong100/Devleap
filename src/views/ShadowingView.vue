<script setup>
import { ref, shallowRef, watch } from 'vue'
import { shadowingClips, loadShadowingClip } from '@/data/shadowing'
import ShadowingPlayer from '@/components/tools/ShadowingPlayer.vue'
import { parseVideoId } from '@/lib/youtube'
import { useUserStore } from '@/stores/user'

const user = useUserStore()

const selectedId = ref(shadowingClips[0]?.videoId || null)
const clip = shallowRef(null)
const loading = ref(false)

// —— Tải bài từ URL YouTube bất kỳ ——
const urlInput = ref('')
const loadingUrl = ref(false)
const loadError = ref('')

async function load(id) {
  if (!id) return
  loading.value = true
  clip.value = await loadShadowingClip(id)
  loading.value = false
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
    const res = await fetch('/.netlify/functions/shadowing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlInput.value }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Không tải được bài.')
    selectedId.value = null // bỏ chọn clip gợi ý để player nhận clip URL
    clip.value = {
      videoId: data.videoId,
      title: data.title,
      level: 'YouTube',
      topic: data.author || 'Tự tải',
      sentences: data.sentences, // { ai, original }
    }
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
        Dán link YouTube bất kỳ (có phụ đề) để tự tạo bài, hoặc chọn clip gợi ý. Phát từng câu,
        bật lặp, xem IPA, giảm tốc độ và thu âm để tự so sánh.
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

    <!-- Chọn clip gợi ý -->
    <h2 class="grid-head">Clip gợi ý</h2>
    <div class="clip-grid">
      <button
        v-for="c in shadowingClips"
        :key="c.videoId"
        class="clip-card"
        :class="{ on: c.videoId === selectedId }"
        @click="pickFeatured(c.videoId)"
      >
        <span v-if="c.videoId === selectedId" class="open-tag">ĐANG MỞ</span>
        <div class="clip-tags">
          <span class="clip-level">{{ c.level }}</span>
          <span v-if="user.shadowingPassed(c.videoId)" class="clip-done">✓ Hoàn thành</span>
          <span v-else-if="user.shadowingOf(c.videoId)" class="clip-best">{{ user.shadowingOf(c.videoId).best }}%</span>
        </div>
        <h3>{{ c.title }}</h3>
        <p>{{ c.topic }} · {{ c.sentenceCount }} câu</p>
      </button>
    </div>

    <div v-if="loading" class="loading">Đang tải clip…</div>
    <ShadowingPlayer v-else-if="clip" :clip="clip" :key="clip.videoId" />
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
  color: #7a7a92;
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
  background: #fff;
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
  color: #d6512b;
  background: rgba(214, 81, 43, 0.08);
  border: 1px solid rgba(214, 81, 43, 0.25);
  padding: 10px 14px;
  border-radius: 12px;
}
.grid-head {
  font-size: 15px;
  font-weight: 800;
  color: var(--muted-2);
  margin: 28px 0 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.clip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}
.clip-card {
  position: relative;
  text-align: left;
  background: #fff;
  border: 1.5px solid rgba(108, 92, 231, 0.1);
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.15s;
}
.clip-card:hover {
  transform: translateY(-4px);
}
.clip-card.on {
  background: linear-gradient(135deg, #f5f3ff, #ffffff);
  border-color: var(--purple);
}
.clip-card.on h3 {
  color: var(--purple);
}
.clip-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.clip-level {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 800;
  color: var(--purple);
  background: var(--purple-soft);
  padding: 3px 10px;
  border-radius: 99px;
}
.clip-done {
  font-size: 11.5px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #00d68f, #00b377);
  padding: 3px 10px;
  border-radius: 99px;
}
.clip-best {
  font-size: 11.5px;
  font-weight: 800;
  color: var(--amber-ink);
  background: rgba(255, 176, 32, 0.16);
  padding: 3px 10px;
  border-radius: 99px;
}
.clip-card h3 {
  font-size: 16px;
  font-weight: 800;
  margin: 12px 0 5px;
  color: var(--ink);
  line-height: 1.35;
}
.clip-card p {
  font-size: 13px;
  color: var(--muted);
}
.open-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--green);
  color: #fff;
  font-size: 10.5px;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 99px;
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
}
</style>
