<script setup>
import BottomSheet from '@/components/common/BottomSheet.vue'

const props = defineProps({
  slides: { type: Array, required: true },
  slideIndex: { type: Number, required: true },
})
const emit = defineEmits(['next', 'prev', 'close'])

const open = defineModel('open', { type: Boolean, default: false })
</script>

<template>
  <BottomSheet v-model="open">
    <div class="tour">
      <button type="button" class="tour-skip" @click="emit('close')">Bỏ qua</button>
      <div class="tour-emoji">{{ slides[slideIndex].emoji }}</div>
      <h3 class="tour-title">{{ slides[slideIndex].title }}</h3>
      <p class="tour-text">{{ slides[slideIndex].text }}</p>
      <div class="tour-dots">
        <span
          v-for="(s, i) in slides"
          :key="s.title"
          class="tour-dot"
          :class="{ active: i === slideIndex }"
        ></span>
      </div>
      <div class="tour-actions">
        <button v-if="slideIndex > 0" type="button" class="tour-btn tour-btn-ghost" @click="emit('prev')">← Trước</button>
        <button type="button" class="tour-btn tour-btn-primary" @click="emit('next')">
          {{ slideIndex >= slides.length - 1 ? 'Bắt đầu học →' : 'Tiếp theo' }}
        </button>
      </div>
    </div>
  </BottomSheet>
</template>

<style scoped>
.tour {
  position: relative;
  text-align: center;
  padding: 8px 4px 4px;
}
.tour-skip {
  position: absolute;
  top: -2px;
  right: 0;
  border: none;
  background: none;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 6px 8px;
}
.tour-emoji {
  font-size: 48px;
  margin-top: 8px;
}
.tour-title {
  font-size: 20px;
  font-weight: 800;
  margin: 14px 0 8px;
}
.tour-text {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--slate);
  max-width: 380px;
  margin: 0 auto;
}
.tour-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 22px 0 4px;
}
.tour-dot {
  width: 7px;
  height: 7px;
  border-radius: 99px;
  background: var(--line);
}
.tour-dot.active {
  background: var(--purple);
  width: 18px;
}
.tour-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}
.tour-btn {
  border: none;
  cursor: pointer;
  font-size: 14.5px;
  font-weight: 700;
  border-radius: 12px;
  padding: 12px 20px;
  min-height: 44px;
}
.tour-btn-ghost {
  background: transparent;
  color: var(--muted);
}
.tour-btn-primary {
  color: #fff;
  background: var(--grad-purple);
  box-shadow: 0 8px 20px rgba(108, 92, 231, 0.28);
}
</style>
