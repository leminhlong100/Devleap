<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import LoginGate from '@/components/layout/LoginGate.vue'
import BackToTop from '@/components/common/BackToTop.vue'
import QuickAddWord from '@/components/common/QuickAddWord.vue'
import OfflineBanner from '@/components/common/OfflineBanner.vue'
import UpdateToast from '@/components/common/UpdateToast.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <OfflineBanner />
    <UpdateToast />
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
    <QuickAddWord />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  min-height: 100dvh;
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
  /* Chừa chỗ cho tab bar đáy (~72px + safe-area) để nội dung cuối trang không bị che */
  .app-main {
    padding-bottom: calc(72px + var(--safe-bottom));
  }
  .app-shell :deep(.back-to-top) {
    bottom: calc(84px + var(--safe-bottom));
  }
}
</style>
