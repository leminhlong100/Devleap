<script setup>
import { RouterLink } from 'vue-router'
import { adminModules } from './adminModules'
</script>

<template>
  <div class="head">
    <h1 class="title">Bảng quản trị</h1>
    <p class="sub">Quản lý nội dung của Devleap. Chọn một module để bắt đầu.</p>
  </div>

  <div class="grid">
    <RouterLink v-for="m in adminModules" :key="m.key" :to="m.route" class="card">
      <span class="card-ic">{{ m.icon }}</span>
      <h3>{{ m.title }}</h3>
      <p>{{ m.desc }}</p>
    </RouterLink>
  </div>
</template>

<style scoped>
.head {
  margin-bottom: 28px;
}
.title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.6px;
}
.sub {
  font-size: 15.5px;
  color: var(--muted-2);
  margin-top: 8px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.card {
  display: block;
  background: var(--surface);
  border: 1.5px solid rgba(108, 92, 231, 0.1);
  border-radius: 18px;
  padding: 22px;
  transition: all 0.15s;
}
.card:hover {
  transform: translateY(-4px);
  border-color: var(--purple);
}
.card-ic {
  font-size: 30px;
}
.card h3 {
  font-size: 18px;
  font-weight: 800;
  color: var(--ink);
  margin: 12px 0 6px;
}
.card p {
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.55;
}
</style>
