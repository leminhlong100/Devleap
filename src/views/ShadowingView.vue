<script setup>
import { ref, shallowRef, watch } from 'vue'
import { shadowingClips, loadShadowingClip } from '@/data/shadowing'
import ShadowingPlayer from '@/components/tools/ShadowingPlayer.vue'
import { useUserStore } from '@/stores/user'

const user = useUserStore()

const selectedId = ref(shadowingClips[0]?.videoId || null)
const clip = shallowRef(null)
const loading = ref(false)

async function load(id) {
  if (!id) return
  loading.value = true
  clip.value = await loadShadowingClip(id)
  loading.value = false
}
watch(selectedId, load, { immediate: true })
</script>

<template>
  <div class="container page">
    <div class="page-head">
      <h1 class="title">Luyện Shadowing 🎧</h1>
      <p class="sub">
        Nghe người bản xứ nói rồi nói nhại lại từng câu. Chọn clip, phát từng câu, bật lặp,
        giảm tốc độ và thu âm để tự so sánh.
      </p>
    </div>

    <!-- Chọn clip -->
    <div class="clip-grid">
      <button
        v-for="c in shadowingClips"
        :key="c.videoId"
        class="clip-card"
        :class="{ on: c.videoId === selectedId }"
        @click="selectedId = c.videoId"
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
