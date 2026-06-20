<script setup>
import { computed } from 'vue'

const props = defineProps({
  vocab: { type: Object, required: true }, // {term, ipa, vi, illo, g1, g2, ex (with {w}), exVi, vidLen}
})
const emit = defineEmits(['play'])

const illoBg = computed(() => `linear-gradient(135deg,${props.vocab.g1},${props.vocab.g2})`)
const parts = computed(() => (props.vocab.ex || '').split('{w}'))
</script>

<template>
  <div class="vcard">
    <div class="vtop">
      <div class="illo" :style="{ background: illoBg }">
        {{ vocab.illo }}
        <span class="play" title="Video ví dụ" @click="emit('play', vocab)">▶</span>
      </div>
      <div class="vmeta">
        <div class="vterm-row">
          <span class="vterm">{{ vocab.term }}</span>
          <span class="speak" title="Nghe phát âm">🔊</span>
        </div>
        <div v-if="vocab.ipa" class="vipa">{{ vocab.ipa }}</div>
        <div v-if="vocab.vi" class="vvi">{{ vocab.vi }}</div>
      </div>
    </div>
    <div v-if="vocab.ex" class="vex">
      <div class="vex-label">VÍ DỤ</div>
      <div class="vex-en">{{ parts[0] }}<b>{{ vocab.term }}</b>{{ parts[1] || '' }}</div>
      <div v-if="vocab.exVi" class="vex-vi">{{ vocab.exVi }}</div>
      <div v-if="vocab.vidLen" class="vex-vid" @click="emit('play', vocab)">🎬 Video dùng từ · {{ vocab.vidLen }}</div>
    </div>
  </div>
</template>

<style scoped>
.vcard {
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.12);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(108, 92, 231, 0.05);
}
.vtop {
  display: flex;
  gap: 14px;
  padding: 14px 16px;
}
.illo {
  position: relative;
  width: 78px;
  height: 78px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  flex: none;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}
.play {
  position: absolute;
  bottom: -7px;
  right: -7px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ink);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  padding-left: 2px;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
}
.vmeta {
  flex: 1;
  min-width: 0;
}
.vterm-row {
  display: flex;
  align-items: center;
  gap: 7px;
}
.vterm {
  font-size: 17px;
  font-weight: 800;
  color: var(--purple);
  letter-spacing: -0.2px;
}
.speak {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--purple-soft);
  color: var(--purple);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  flex: none;
}
.vipa {
  font-size: 11.5px;
  color: var(--muted-2);
  font-weight: 600;
  margin-top: 2px;
}
.vvi {
  display: inline-block;
  margin-top: 7px;
  font-size: 12.5px;
  font-weight: 700;
  color: #00a86f;
  background: rgba(0, 214, 143, 0.1);
  padding: 3px 9px;
  border-radius: 8px;
}
.vex {
  background: var(--bg);
  border-top: 1px solid rgba(108, 92, 231, 0.06);
  padding: 11px 16px;
}
.vex-label {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.4px;
  color: var(--muted-3);
  margin-bottom: 4px;
}
.vex-en {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--ink);
  font-weight: 600;
}
.vex-en b {
  color: var(--purple);
}
.vex-vi {
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--muted-2);
  font-weight: 600;
  margin-top: 2px;
}
.vex-vid {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 9px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--purple);
  cursor: pointer;
}
</style>
