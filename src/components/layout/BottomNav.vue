<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useKeyboardOpen } from '@/composables/useKeyboardOpen'

const route = useRoute()
const { isKeyboardOpen } = useKeyboardOpen()

const tabs = [
  { label: 'Trang chủ', icon: '🏠', to: { name: 'home' }, match: ['home'] },
  { label: 'Khóa học', icon: '📚', to: { name: 'courses' }, match: ['courses', 'java', 'ielts', 'java-day', 'ielts-day'] },
  { label: 'Shadowing', icon: '🎧', to: { name: 'shadowing' }, match: ['shadowing'] },
  { label: 'Công cụ', icon: '🧰', to: { name: 'tools' }, match: ['tools', 'tools-tab'] },
  { label: 'Tiến bộ', icon: '📈', to: { name: 'progress' }, match: ['progress'] },
]

const activeKey = computed(() => route.name)
const isActive = (tab) => tab.match.includes(activeKey.value)
</script>

<template>
  <!-- Chỉ hiện ở ≤720px (xem media query) — ẩn khi bàn phím ảo mở để không nổi lên trên bàn phím -->
  <nav v-show="!isKeyboardOpen" class="bottom-nav" aria-label="Điều hướng chính">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.label"
      :to="tab.to"
      class="bn-tab"
      :class="{ active: isActive(tab) }"
    >
      <span class="bn-icon" aria-hidden="true">{{ tab.icon }}</span>
      <span class="bn-label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  display: none;
}

@media (max-width: 720px) {
  .bottom-nav {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 55;
    background: var(--surface);
    border-top: 1px solid var(--line);
    padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px));
  }
  .bn-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 48px;
    padding: 4px 2px;
    border-radius: 12px;
    color: var(--muted-2);
    text-decoration: none;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.15s, background 0.15s;
  }
  .bn-tab:active {
    background: var(--line-soft);
  }
  .bn-tab.active {
    color: var(--purple);
  }
  .bn-icon {
    font-size: 20px;
    line-height: 1;
  }
  .bn-label {
    font-size: 11px;
    font-weight: 700;
  }
}
</style>
