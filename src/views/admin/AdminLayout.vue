<script setup>
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import BottomSheet from '@/components/common/BottomSheet.vue'
import { adminModules } from './adminModules'

const route = useRoute()
const mobileNavOpen = ref(false)

watch(() => route.fullPath, () => {
  mobileNavOpen.value = false
})
</script>

<template>
  <div class="admin">
    <header class="admin-topbar">
      <button
        type="button"
        class="admin-menu-btn"
        aria-label="Mở menu quản trị"
        :aria-expanded="mobileNavOpen"
        @click="mobileNavOpen = true"
      >
        ☰
      </button>
      <span class="admin-topbar-title">⚙️ Quản trị</span>
    </header>

    <aside class="admin-side">
      <RouterLink :to="{ name: 'admin-home' }" class="admin-brand">
        ⚙️ Quản trị
      </RouterLink>
      <nav class="admin-nav">
        <RouterLink
          v-for="m in adminModules"
          :key="m.key"
          :to="m.route"
          class="admin-nav-link"
          :class="{ active: route.name === m.route.name }"
        >
          <span class="ic">{{ m.icon }}</span> {{ m.title }}
        </RouterLink>
      </nav>
      <RouterLink :to="{ name: 'home' }" class="admin-back">← Về trang chính</RouterLink>
    </aside>

    <BottomSheet v-model="mobileNavOpen">
      <nav class="admin-nav admin-nav-sheet">
        <RouterLink
          v-for="m in adminModules"
          :key="m.key"
          :to="m.route"
          class="admin-nav-link"
          :class="{ active: route.name === m.route.name }"
        >
          <span class="ic">{{ m.icon }}</span> {{ m.title }}
        </RouterLink>
      </nav>
      <RouterLink :to="{ name: 'home' }" class="admin-back admin-back-sheet">← Về trang chính</RouterLink>
    </BottomSheet>

    <main class="admin-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin {
  display: grid;
  grid-template-columns: 232px 1fr;
  min-height: calc(100vh - 76px);
  min-height: calc(100dvh - 76px);
  max-width: var(--container);
  margin: 0 auto;
}
.admin-topbar {
  display: none;
}
.admin-side {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 24px 16px;
  border-right: 1px solid rgba(108, 92, 231, 0.1);
}
.admin-brand {
  font-size: 18px;
  font-weight: 800;
  color: var(--ink);
  padding: 6px 10px 14px;
}
.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.admin-nav-link {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 12px;
  border-radius: 11px;
  font-size: 15px;
  font-weight: 600;
  color: var(--slate);
  transition: all 0.15s;
}
@media (hover: hover) {
  .admin-nav-link:hover {
    background: rgba(108, 92, 231, 0.06);
  }
}
.admin-nav-link:active {
  background: rgba(108, 92, 231, 0.1);
}
.admin-nav-link.active {
  color: var(--purple);
  background: rgba(108, 92, 231, 0.1);
}
.ic {
  font-size: 17px;
}
.admin-back {
  margin-top: auto;
  padding: 10px 12px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--muted-2);
}
.admin-main {
  padding: 32px var(--space-page-x) 64px;
  min-width: 0;
}
@media (max-width: 720px) {
  .admin {
    grid-template-columns: 1fr;
  }
  .admin-topbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--line);
  }
  .admin-menu-btn {
    width: 40px;
    height: 40px;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border: none;
    background: var(--line-soft, rgba(108, 92, 231, 0.08));
    border-radius: 11px;
    color: var(--ink);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  .admin-topbar-title {
    font-size: 16px;
    font-weight: 800;
    color: var(--ink);
  }
  .admin-side {
    display: none;
  }
  .admin-nav-sheet {
    padding-top: 4px;
  }
  .admin-nav-sheet .admin-nav-link {
    min-height: 44px;
  }
  .admin-back-sheet {
    display: block;
    margin-top: 10px;
    border-top: 1px solid var(--line);
    padding-top: 14px;
  }
  .admin-main {
    padding: 22px 16px 48px;
  }
}
</style>
