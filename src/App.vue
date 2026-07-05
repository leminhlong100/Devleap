<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import LoginGate from '@/components/layout/LoginGate.vue'
import BackToTop from '@/components/common/BackToTop.vue'
import OfflineBanner from '@/components/common/OfflineBanner.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <OfflineBanner />
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <AppFooter />
    <BottomNav />
    <LoginGate />
    <BackToTop />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-main {
  flex: 1;
}

@media (max-width: 720px) {
  /* Điều hướng đã có ở BottomNav — footer thông tin không có giá trị trên "app" mobile */
  .app-shell :deep(.footer) {
    display: none;
  }
  /* Chừa chỗ cho tab bar đáy (~64px + safe-area) để nội dung cuối trang không bị che */
  .app-main {
    padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
  }
  .app-shell :deep(.back-to-top) {
    bottom: calc(76px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
