<script setup>
import { computed, watch } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import LoginGate from '@/components/layout/LoginGate.vue'
import BackToTop from '@/components/common/BackToTop.vue'
import QuickAddWord from '@/components/common/QuickAddWord.vue'
import OfflineBanner from '@/components/common/OfflineBanner.vue'
import UpdateToast from '@/components/common/UpdateToast.vue'
import { useUserStore } from '@/stores/user'
import { updateAppBadge } from '@/lib/appBadge'
import { useRouteTransition } from '@/composables/useRouteTransition'
import { useIsMobile, useMediaQuery } from '@/composables/useMediaQuery'

// Bước 3.4 — chấm số từ đến hạn ôn lên icon app (chỉ hiệu lực khi đã cài PWA;
// trình duyệt thường tự bỏ qua). Đặt ở App.vue để chạy suốt vòng đời app, cập
// nhật ngay khi mở và mỗi khi số từ đến hạn đổi (ôn xong / lưu từ mới).
const user = useUserStore()
watch(() => user.dueTodayCount, (n) => updateAppBadge(n), { immediate: true })

// Bước 4.1 — transition điều hướng có hướng: chỉ trượt trên mobile và khi người
// dùng không yêu cầu giảm chuyển động; desktop giữ fade như cũ.
const { direction } = useRouteTransition()
const { matches: isMobile } = useIsMobile()
const { matches: reducedMotion } = useMediaQuery('(prefers-reduced-motion: reduce)')
const transitionName = computed(() => {
  if (!isMobile.value || reducedMotion.value) return 'fade'
  if (direction.value === 'forward') return 'slide-fwd'
  if (direction.value === 'back') return 'slide-back'
  return 'fade'
})
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <OfflineBanner />
    <UpdateToast />
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition :name="transitionName" mode="out-in">
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
