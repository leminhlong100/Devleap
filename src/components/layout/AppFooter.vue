<script setup>
import MascotLogo from '@/components/common/MascotLogo.vue'
const links = ['Về chúng tôi', 'Cộng đồng', 'Liên hệ']
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="left">
        <MascotLogo :width="32" :height="34" uid="ftr" />
        <span class="name">Dev<span style="color: var(--purple)">leap</span></span>
        <span class="copy">© 2026 · Mỗi ngày một bước nhảy.</span>
      </div>
      <div class="links">
        <span v-for="l in links" :key="l" class="link">{{ l }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #fff;
  border-top: 1px solid rgba(108, 92, 231, 0.08);
  margin-top: auto;
}
.footer-inner {
  max-width: var(--container);
  margin: 0 auto;
  padding: 34px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.name {
  font-size: 17px;
  font-weight: 800;
}
.copy {
  font-size: 13px;
  color: var(--muted-2);
  margin-left: 8px;
}
.links {
  display: flex;
  gap: 22px;
  font-size: 14px;
  color: var(--muted);
  font-weight: 600;
}
.link {
  cursor: pointer;
  transition: color 0.15s;
}
.link:hover {
  color: var(--purple);
}
</style>
