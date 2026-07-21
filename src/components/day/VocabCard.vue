<script setup>
import { computed } from 'vue'
import { speak, canSpeak } from '@/lib/speak'
import VocabIllustration from '@/components/common/VocabIllustration.vue'

const props = defineProps({
  vocab: { type: Object, required: true }, // {term, ipa, vi, illo, g1, g2, ex (with {w}), exVi, img}
})

const illoBg = computed(() => `linear-gradient(135deg,${props.vocab.g1},${props.vocab.g2})`)
const parts = computed(() => (props.vocab.ex || '').split('{w}'))
const speakable = canSpeak()

function sayTerm() {
  speak(props.vocab.term)
}
function sayExample() {
  // Ghép câu ví dụ hoàn chỉnh (thay {w} bằng từ) rồi đọc to.
  const ex = (props.vocab.ex || '').replace('{w}', props.vocab.term)
  speak(ex || props.vocab.term)
}
</script>

<template>
  <div class="vcard">
    <div class="vtop">
      <div class="illo">
        <VocabIllustration
          :term="vocab.term"
          :size="112"
          :background="illoBg"
          :persistent-emoji="vocab.illo"
          :override-url="vocab.img"
        />
      </div>
      <div class="vmeta">
        <div class="vterm-row">
          <span class="vterm">{{ vocab.term }}</span>
          <button v-if="speakable" class="speak" title="Nghe phát âm" @click="sayTerm">🔊</button>
        </div>
        <div v-if="vocab.ipa" class="vipa">{{ vocab.ipa }}</div>
        <div v-if="vocab.vi" class="vvi">{{ vocab.vi }}</div>
      </div>
    </div>
    <div v-if="vocab.ex" class="vex">
      <div class="vex-label">
        VÍ DỤ
        <button v-if="speakable" class="speak-ex" title="Nghe câu ví dụ" @click="sayExample">🔊</button>
      </div>
      <div class="vex-en">
        <template v-if="parts.length > 1">{{ parts[0] }}<b>{{ vocab.term }}</b>{{ parts[1] || '' }}</template>
        <template v-else>{{ parts[0] }}</template>
      </div>
      <div v-if="vocab.exVi" class="vex-vi">{{ vocab.exVi }}</div>
    </div>
  </div>
</template>

<style scoped>
.vcard {
  background: var(--surface);
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
  width: 112px;
  height: 112px;
  border-radius: 14px;
  flex: none;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
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
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--purple-soft);
  color: var(--purple);
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  flex: none;
  padding: 0;
  transition: transform 0.12s;
}
.speak::after {
  content: '';
  position: absolute;
  inset: -10px;
}
@media (hover: hover) {
  .speak:hover {
    transform: scale(1.12);
  }
}
.speak:active {
  transform: scale(0.95);
}
.speak-ex {
  position: relative;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 11px;
  padding: 0;
  margin-left: 6px;
  line-height: 1;
  vertical-align: middle;
  opacity: 0.75;
}
.speak-ex::after {
  content: '';
  position: absolute;
  inset: -16px;
}
@media (hover: hover) {
  .speak-ex:hover {
    opacity: 1;
  }
}
.speak-ex:active {
  opacity: 1;
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
  color: var(--green-2);
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
</style>
