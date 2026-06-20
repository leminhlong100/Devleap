<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import MascotLogo from '@/components/common/MascotLogo.vue'

const route = useRoute()
const user = useUserStore()
const { xp, streak, level, xpPct } = storeToRefs(user)

const nav = [
  { name: 'Trang chủ', to: { name: 'home' }, match: ['home'] },
  { name: 'Khóa học', to: { name: 'courses' }, match: ['courses', 'java', 'ielts', 'java-day', 'ielts-day'] },
  { name: 'Công cụ', to: { name: 'tools' }, match: ['tools', 'tools-tab'] },
]

const activeKey = computed(() => route.name)
const isActive = (item) => item.match.includes(activeKey.value)
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <RouterLink :to="{ name: 'home' }" class="logo">
        <MascotLogo :width="44" :height="47" uid="hdr" />
        <span class="logo-text">Dev<span class="brand-text">leap</span></span>
      </RouterLink>

      <nav class="nav">
        <RouterLink
          v-for="item in nav"
          :key="item.name"
          :to="item.to"
          class="nav-link"
          :class="{ active: isActive(item) }"
        >
          {{ item.name }}
        </RouterLink>
      </nav>

      <div class="header-right">
        <div class="streak" title="Chuỗi ngày học">
          <span class="streak-icon">🔥</span>{{ streak }}
        </div>
        <div class="xp-chip">
          <div class="xp-info">
            <div class="xp-top">
              <span class="lv">Lv.{{ level }}</span>
              <span class="xp-num">{{ xp }} XP</span>
            </div>
            <div class="xp-track"><div class="xp-fill" :style="{ width: xpPct + '%' }"></div></div>
          </div>
          <div class="avatar">🧑‍💻</div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(247, 248, 252, 0.82);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(108, 92, 231, 0.1);
}
.header-inner {
  max-width: var(--container);
  margin: 0 auto;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  gap: 28px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 11px;
  cursor: pointer;
  flex: none;
}
.logo-text {
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.nav {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 6px;
}
.nav-link {
  padding: 9px 15px;
  border-radius: 11px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  color: #5a5a72;
  transition: all 0.15s;
}
.nav-link:hover {
  background: rgba(108, 92, 231, 0.06);
}
.nav-link.active {
  color: var(--purple);
  background: rgba(108, 92, 231, 0.1);
}
.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.streak {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #fff3dd, #ffe8c2);
  border: 1px solid rgba(255, 176, 32, 0.35);
  padding: 7px 13px;
  border-radius: 13px;
  font-weight: 800;
  color: var(--amber-ink);
  font-size: 14px;
}
.streak-icon {
  font-size: 16px;
}
.xp-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.14);
  padding: 6px 8px 6px 13px;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(108, 92, 231, 0.07);
}
.xp-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.xp-top {
  display: flex;
  align-items: center;
  gap: 7px;
}
.lv {
  font-size: 12px;
  font-weight: 800;
  color: var(--purple);
}
.xp-num {
  font-size: 11px;
  color: var(--muted-2);
  font-weight: 600;
}
.xp-track {
  width: 96px;
  height: 6px;
  border-radius: 99px;
  background: #ececf5;
  overflow: hidden;
}
.xp-fill {
  height: 100%;
  border-radius: 99px;
  background: var(--grad-brand);
  transition: width 0.5s;
}
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: linear-gradient(135deg, #6c5ce7, #8b7cf0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex: none;
}
@media (max-width: 720px) {
  .header-inner {
    gap: 14px;
    padding: 12px 18px;
    flex-wrap: wrap;
  }
  .xp-info {
    display: none;
  }
}
</style>
