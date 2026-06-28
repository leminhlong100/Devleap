<script setup>
// Logo Devleap (ảnh PNG). size='sm' (header), 'lg' (hero/footer).
import logoUrl from '@/images/favicon.png'

defineProps({
  width: { type: Number, default: 44 },
  height: { type: Number, default: 47 },
  variant: { type: String, default: 'header' }, // header | hero | footer
  uid: { type: String, default: 'm' },
})
</script>

<template>
  <img
    :src="logoUrl"
    alt="Devleap"
    :width="width"
    :height="height"
    class="logo-img"
    :class="`logo-${variant}`"
  />
</template>

<style scoped>
.logo-img {
  object-fit: contain;
  display: block;
}
.logo-hero {
  animation: floaty 5s ease-in-out infinite;
  filter: drop-shadow(0 24px 40px rgba(0, 168, 111, 0.28));
}
</style>
