<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Lộ trình hôm nay' },
  subtitle: { type: String, default: 'Làm lần lượt để mở khóa bước sau' },
  items: { type: Array, required: true }, // [{title, meta, xp, status, key}]
  activeIndex: { type: Number, default: -1 }, // mục đang hiện trên màn hình (scroll-spy)
})
const emit = defineEmits(['select'])

function statusFor(item, i) {
  return item.status || (i === props.activeIndex ? 'current' : 'default')
}

function dotStyle(status, i) {
  if (status === 'done')
    return { bg: 'linear-gradient(135deg,#00D68F,#00a86f)', color: '#fff', icon: '✓', anim: 'none', titleColor: '#1E1E2E', metaColor: '#00A86F', lineColor: '#00D68F' }
  if (status === 'current')
    return { bg: 'linear-gradient(135deg,#6C5CE7,#8B7CF0)', color: '#fff', icon: String(i + 1), anim: 'pulsering 2.2s infinite', titleColor: '#6C5CE7', metaColor: '#6C5CE7', lineColor: '#D9D6EC' }
  if (status === 'locked')
    return { bg: '#E6E6F0', color: '#9a9ab0', icon: '🔒', anim: 'none', titleColor: '#9a9ab0', metaColor: '#b6b6c6', lineColor: '#E6E6F0' }
  // mặc định: bước có sẵn (chưa gắn tiến độ) — số thứ tự, không khóa.
  return { bg: 'var(--purple-soft)', color: '#6C5CE7', icon: String(i + 1), anim: 'none', titleColor: '#1E1E2E', metaColor: '#76768e', lineColor: '#D9D6EC' }
}

// Thanh ngang (mobile): tự cuộn chip đang active vào giữa khi người học cuộn trang.
// Cố tình KHÔNG dùng chip.scrollIntoView() — trình duyệt có thể quyết định cuộn cả
// TRANG (không chỉ thanh ngang) để đưa chip vào khung nhìn, gây lặp vô hạn với
// IntersectionObserver (cuộn trang → đổi active → cuộn lại...). Tự tính scrollLeft
// của riêng .rail-h-track (có scroll-behavior: smooth trong CSS) để chỉ cuộn ngang.
const track = ref(null)
watch(
  () => props.activeIndex,
  (idx) => {
    if (idx < 0) return
    nextTick(() => {
      const el = track.value
      const chip = el?.querySelector(`[data-idx="${idx}"]`)
      if (!el || !chip) return
      el.scrollLeft = chip.offsetLeft - el.clientWidth / 2 + chip.clientWidth / 2
    })
  },
)
</script>

<template>
  <!-- Desktop / tablet (>720px): danh sách dọc dính bên trái, giữ nguyên giao diện cũ -->
  <aside class="rail rail-v">
    <h3 class="rail-title">{{ title }}</h3>
    <p class="rail-sub">{{ subtitle }}</p>
    <div
      v-for="(a, i) in items"
      :key="i"
      class="step"
      @click="emit('select', i)"
    >
      <div class="dot-col">
        <div
          class="dot"
          :style="{ background: dotStyle(statusFor(a, i), i).bg, color: dotStyle(statusFor(a, i), i).color, animation: dotStyle(statusFor(a, i), i).anim }"
        >
          {{ dotStyle(statusFor(a, i), i).icon }}
        </div>
        <div v-if="i < items.length - 1" class="line" :style="{ background: dotStyle(statusFor(a, i), i).lineColor }"></div>
      </div>
      <div class="step-body">
        <div class="step-title" :style="{ color: dotStyle(statusFor(a, i), i).titleColor }">{{ a.title }}</div>
        <div class="step-meta" :style="{ color: dotStyle(statusFor(a, i), i).metaColor }">{{ a.meta }}<template v-if="a.xp"> · {{ a.xp }} XP</template></div>
      </div>
    </div>
  </aside>

  <!-- Mobile (≤720px): thanh bước học ngang dính dưới header, cuộn ngang, bấm nhảy tới mục -->
  <nav class="rail rail-h" aria-label="Các bước trong buổi học">
    <div ref="track" class="rail-h-track">
      <button
        v-for="(a, i) in items"
        :key="i"
        type="button"
        class="chip"
        :data-idx="i"
        :class="{ active: i === activeIndex, done: a.status === 'done' }"
        @click="emit('select', i)"
      >
        <span class="chip-dot">{{ a.status === 'done' ? '✓' : i + 1 }}</span>
        <span class="chip-label">{{ a.title }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.rail-v {
  position: sticky;
  top: 90px;
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 22px;
  padding: 24px 22px;
  box-shadow: 0 12px 34px rgba(108, 92, 231, 0.07);
}
.rail-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.2px;
}
.rail-sub {
  font-size: 12.5px;
  color: var(--muted-2);
  font-weight: 600;
  margin: 4px 0 18px;
}
.step {
  display: flex;
  gap: 13px;
  align-items: flex-start;
  cursor: pointer;
  border-radius: 12px;
}
.dot-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: none;
}
.dot {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
}
.line {
  width: 3px;
  height: 34px;
  border-radius: 99px;
  margin: 3px 0;
}
.step-body {
  padding-bottom: 8px;
}
.step-title {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.3;
}
.step-meta {
  font-size: 12px;
  font-weight: 600;
  margin-top: 3px;
}
/* Mobile: bố cục gập về 1 cột nên rail dọc không cần dính trên nữa — dùng bản
   thanh ngang (.rail-h) thay thế hoàn toàn ở ≤720px. */
@media (max-width: 900px) {
  .rail-v {
    position: static;
    top: auto;
  }
}

/* —— Thanh ngang mobile —— */
.rail-h {
  display: none;
}
@media (max-width: 720px) {
  .rail-v {
    display: none;
  }
  .rail-h {
    display: block;
    position: sticky;
    top: 64px;
    z-index: 45;
    margin: 0 calc(var(--space-page-x) * -1) 4px;
    background: var(--surface);
    border-bottom: 1px solid var(--line);
  }
  .rail-h-track {
    display: flex;
    gap: 8px;
    padding: 10px var(--space-page-x);
    overflow-x: auto;
    scroll-behavior: smooth;
    scroll-snap-type: x proximity;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .rail-h-track::-webkit-scrollbar {
    display: none;
  }
  .chip {
    flex: none;
    display: flex;
    align-items: center;
    gap: 7px;
    scroll-snap-align: center;
    border: 1px solid var(--border);
    background: var(--surface-1);
    color: var(--muted);
    padding: 8px 13px;
    min-height: 44px;
    border-radius: 99px;
    font-size: 12.5px;
    font-weight: 700;
    white-space: nowrap;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .chip:active {
    background: var(--purple-soft);
  }
  .chip.active {
    background: var(--grad-purple);
    border-color: transparent;
    color: #fff;
  }
  .chip.done:not(.active) {
    border-color: rgba(0, 214, 143, 0.4);
    color: #00a86f;
  }
  .chip-dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    font-size: 10.5px;
    font-weight: 800;
    flex: none;
  }
  .chip:not(.active) .chip-dot {
    background: rgba(108, 92, 231, 0.12);
    color: var(--purple);
  }
}
</style>
