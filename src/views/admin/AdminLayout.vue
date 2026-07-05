<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { adminModules } from './adminModules'

const route = useRoute()
</script>

<template>
  <div class="admin">
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
@media (max-width: 760px) {
  .admin {
    grid-template-columns: 1fr;
  }
  .admin-side {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    border-right: none;
    border-bottom: 1px solid rgba(108, 92, 231, 0.1);
    padding: 14px 16px;
  }
  .admin-brand {
    padding: 0 8px 0 0;
  }
  .admin-nav {
    flex-direction: row;
  }
  .admin-back {
    margin: 0 0 0 auto;
  }
  .admin-main {
    padding: 22px 16px 48px;
  }
}
</style>
