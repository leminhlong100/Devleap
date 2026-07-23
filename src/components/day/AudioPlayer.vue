<script setup>
/**
 * Trình phát audio bài nghe có NÚT CHỈNH TỐC ĐỘ (0.75× / 1× / 1.25×). Sách/CD chỉ
 * phát 1 tốc độ; ở web ta cho người mới nghe chậm rồi tăng dần — luyện nghe thật.
 * Thay cho khối <audio controls> lặp lại nhiều nơi trong buổi học.
 */
import { ref } from 'vue'

defineProps({
  src: { type: String, required: true },
  label: { type: String, default: '' },
})

const RATES = [0.75, 1, 1.25]
const rate = ref(1)
const audioEl = ref(null)
function setRate(r) {
  rate.value = r
  if (audioEl.value) audioEl.value.playbackRate = r
}
// Giữ tốc độ đã chọn khi audio được (re)load / play.
function onPlay() {
  if (audioEl.value) audioEl.value.playbackRate = rate.value
}
</script>

<template>
  <div class="audio-item">
    <span v-if="label" class="audio-label">{{ label }}</span>
    <audio ref="audioEl" controls preload="none" :src="src" @play="onPlay"></audio>
    <div class="ap-rates">
      <span class="ap-label">Tốc độ</span>
      <button
        v-for="r in RATES"
        :key="r"
        class="ap-rate"
        :class="{ on: rate === r }"
        type="button"
        @click="setRate(r)"
      >
        {{ r }}×
      </button>
    </div>
  </div>
</template>

<style scoped>
.audio-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.audio-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted);
}
.audio-item audio {
  height: 38px;
}
.ap-rates {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ap-label {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.ap-rate {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--slate);
  border-radius: 99px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  min-height: 30px;
}
.ap-rate.on {
  border-color: #00d68f;
  background: rgba(0, 214, 143, 0.12);
  color: #00966a;
}
</style>
