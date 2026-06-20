<script setup>
import { computed } from 'vue'

const props = defineProps({
  pct: { type: Number, default: 0 },
  size: { type: Number, default: 118 },
  stroke: { type: Number, default: 11 },
  trackColor: { type: String, default: 'rgba(255,255,255,.2)' },
  barColor: { type: String, default: '#fff' },
})

const r = computed(() => props.size / 2 - props.stroke / 2 - 0.5)
const c = computed(() => 2 * Math.PI * r.value)
const offset = computed(() => c.value * (1 - props.pct / 100))
const center = computed(() => props.size / 2)
</script>

<template>
  <div class="ring" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <circle :cx="center" :cy="center" :r="r" fill="none" :stroke="trackColor" :stroke-width="stroke" />
      <circle
        :cx="center"
        :cy="center"
        :r="r"
        fill="none"
        :stroke="barColor"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="c.toFixed(1)"
        :stroke-dashoffset="offset.toFixed(1)"
        :transform="`rotate(-90 ${center} ${center})`"
      />
    </svg>
    <div class="ring-center"><slot /></div>
  </div>
</template>

<style scoped>
.ring {
  position: relative;
}
.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
