<script setup>
import { computed } from 'vue'
import { useSiteConfigStore } from '@/stores/siteConfig'

/**
 * Banner thông báo/bảo trì toàn site — nội dung do admin đăng ở /admin/content
 * (lớp phủ DB, Đợt 3). Ẩn hoàn toàn khi admin không bật. `tone='warn'` cho thông
 * báo bảo trì (màu cảnh báo), `info` cho thông báo thường.
 */
const site = useSiteConfigStore()
const show = computed(() => site.bannerActive)
const tone = computed(() => site.banner.tone)
</script>

<template>
  <div v-if="show" class="site-banner" :class="tone" role="status">
    <span class="ic">{{ tone === 'warn' ? '🛠️' : '📣' }}</span>
    <span class="txt">{{ site.banner.text }}</span>
  </div>
</template>

<style scoped>
.site-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  color: #fff;
  background: var(--grad-purple, var(--purple));
}
.site-banner.warn {
  background: linear-gradient(135deg, #f59000, #d6512b);
}
.ic {
  font-size: 16px;
  flex: none;
}
.txt {
  min-width: 0;
}
@media (max-width: 720px) {
  .site-banner {
    padding: 9px 16px;
    font-size: 13px;
  }
}
</style>
