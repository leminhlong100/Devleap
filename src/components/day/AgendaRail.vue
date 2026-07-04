<script setup>
defineProps({
  title: { type: String, default: 'Lộ trình hôm nay' },
  subtitle: { type: String, default: 'Làm lần lượt để mở khóa bước sau' },
  items: { type: Array, required: true }, // [{title, meta, xp, status}]
})

function dotStyle(item, i, len) {
  if (item.status === 'done')
    return { bg: 'linear-gradient(135deg,#00D68F,#00a86f)', color: '#fff', icon: '✓', anim: 'none', titleColor: '#1E1E2E', metaColor: '#00A86F', lineColor: '#00D68F' }
  if (item.status === 'current')
    return { bg: 'linear-gradient(135deg,#6C5CE7,#8B7CF0)', color: '#fff', icon: String(i + 1), anim: 'pulsering 2.2s infinite', titleColor: '#6C5CE7', metaColor: '#6C5CE7', lineColor: '#D9D6EC' }
  if (item.status === 'locked')
    return { bg: '#E6E6F0', color: '#9a9ab0', icon: '🔒', anim: 'none', titleColor: '#9a9ab0', metaColor: '#b6b6c6', lineColor: '#E6E6F0' }
  // mặc định: bước có sẵn (chưa gắn tiến độ) — số thứ tự, không khóa.
  return { bg: 'var(--purple-soft)', color: '#6C5CE7', icon: String(i + 1), anim: 'none', titleColor: '#1E1E2E', metaColor: '#76768e', lineColor: '#D9D6EC' }
}
</script>

<template>
  <aside class="rail">
    <h3 class="rail-title">{{ title }}</h3>
    <p class="rail-sub">{{ subtitle }}</p>
    <div v-for="(a, i) in items" :key="i" class="step">
      <div class="dot-col">
        <div class="dot" :style="{ background: dotStyle(a, i).bg, color: dotStyle(a, i).color, animation: dotStyle(a, i).anim }">
          {{ dotStyle(a, i).icon }}
        </div>
        <div v-if="i < items.length - 1" class="line" :style="{ background: dotStyle(a, i).lineColor }"></div>
      </div>
      <div class="step-body">
        <div class="step-title" :style="{ color: dotStyle(a, i).titleColor }">{{ a.title }}</div>
        <div class="step-meta" :style="{ color: dotStyle(a, i).metaColor }">{{ a.meta }}<template v-if="a.xp"> · {{ a.xp }} XP</template></div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.rail {
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
/* Mobile: bố cục gập về 1 cột nên rail không cần dính trên — nếu để sticky,
   các thẻ phía dưới (VocabCard có .illo position:relative) sẽ vẽ đè lên rail. */
@media (max-width: 900px) {
  .rail {
    position: static;
    top: auto;
  }
}
</style>
