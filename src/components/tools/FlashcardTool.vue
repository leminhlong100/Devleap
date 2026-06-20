<script setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

// Flashcard chỉ chạy theo từng bài học: view truyền bộ thẻ của ngày vào.
const props = defineProps({ cards: { type: Array, default: null } })

const user = useUserStore()
const { knownCards } = storeToRefs(user)

const index = ref(0)
const flipped = ref(false)
const cards = computed(() => props.cards || [])
const hasCards = computed(() => cards.value.length > 0)

const card = computed(() => cards.value[index.value])
const total = computed(() => cards.value.length)

// Đổi bộ thẻ (đổi ngày học) -> quay về thẻ đầu.
watch(cards, () => {
  index.value = 0
  flipped.value = false
})

function flip() {
  flipped.value = !flipped.value
}
function advance() {
  index.value = (index.value + 1) % total.value
  flipped.value = false
}
function prev() {
  index.value = (index.value - 1 + total.value) % total.value
  flipped.value = false
}
function markKnown() {
  user.markCardKnown(index.value)
  setTimeout(advance, 280)
}
function markUnknown() {
  advance()
}
function dotColor(i) {
  if (knownCards.value.includes(i)) return '#00D68F'
  return i === index.value ? '#6C5CE7' : '#D9D6EC'
}
</script>

<template>
  <div class="card-tool">
    <!-- CHƯA CÓ THẺ THEO BÀI -->
    <div v-if="!hasCards" class="empty-tool">
      <div class="empty-emoji">🃏</div>
      <h2>Flashcard đi theo từng bài học</h2>
      <p>Mở một ngày học rồi bấm <b>🃏 Luyện lại bằng Flashcard</b> để học bộ từ vựng của bài đó.</p>
    </div>

    <template v-else>
    <div class="tool-head">
      <div>
        <h2 class="tool-title">🃏 Flashcard từ vựng IT</h2>
        <p class="tool-sub">Bấm vào thẻ để lật xem nghĩa. Đánh dấu "Đã thuộc" để nhận XP.</p>
      </div>
      <div class="known">
        <div class="known-label">Đã thuộc</div>
        <div class="known-count">{{ knownCards.length }} / {{ total }}</div>
      </div>
    </div>

    <div class="stage">
      <div class="card-wrap" @click="flip">
        <div class="card-3d" :style="{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }">
          <!-- FRONT -->
          <div class="face front">
            <span class="cat">{{ card.cat }}</span>
            <span class="card-no">Thẻ {{ index + 1 }}/{{ total }}</span>
            <div class="term">{{ card.term }}</div>
            <div class="ipa">{{ card.ipa }}</div>
            <div class="hint">👆 Bấm để xem nghĩa</div>
          </div>
          <!-- BACK -->
          <div class="face back">
            <div class="back-label">NGHĨA TIẾNG VIỆT</div>
            <div v-if="card.vi" class="vi">{{ card.vi }}</div>
            <div v-else class="vi vi-empty">“{{ card.term }}”</div>
            <div v-if="card.ex" class="ex">
              <div class="ex-label">VÍ DỤ</div>
              <div class="ex-text">{{ card.ex }}</div>
            </div>
            <div v-else class="ex ex-hint">
              <div class="ex-text">Chưa có nghĩa sẵn cho từ này — tra ở 📖 Từ điển hoặc tự ghi chú nhé.</div>
            </div>
            <div class="back-cta">
              <button class="unknown" @click.stop="markUnknown">Chưa thuộc</button>
              <button class="known-btn" @click.stop="markKnown">Đã thuộc · +20 XP</button>
            </div>
          </div>
        </div>
      </div>

      <div class="controls">
        <button class="nav" @click="prev">←</button>
        <div class="dots">
          <span v-for="(c, i) in cards" :key="i" class="dot" :style="{ background: dotColor(i) }"></span>
        </div>
        <button class="nav" @click="advance">→</button>
      </div>
    </div>
    </template>
  </div>
</template>

<style scoped>
.card-tool {
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 28px;
  padding: 36px;
  box-shadow: 0 18px 50px rgba(108, 92, 231, 0.1);
}
.empty-tool {
  text-align: center;
  padding: 30px 10px;
}
.empty-emoji {
  font-size: 56px;
}
.empty-tool h2 {
  font-size: 24px;
  font-weight: 800;
  margin-top: 10px;
  letter-spacing: -0.5px;
}
.empty-tool p {
  font-size: 15px;
  color: #7a7a92;
  margin-top: 10px;
  line-height: 1.6;
}
.tool-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 26px;
}
.tool-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.tool-sub {
  font-size: 14.5px;
  color: #7a7a92;
  margin-top: 5px;
}
.known {
  text-align: right;
}
.known-label {
  font-size: 13px;
  color: var(--muted-2);
  font-weight: 600;
}
.known-count {
  font-size: 22px;
  font-weight: 800;
  color: #00c281;
}
.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card-wrap {
  perspective: 1400px;
  width: 100%;
  max-width: 540px;
  cursor: pointer;
}
.card-3d {
  position: relative;
  width: 100%;
  height: 300px;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
}
.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 24px;
}
.front {
  background: linear-gradient(150deg, #6c5ce7, #4b3bc4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  box-shadow: 0 16px 40px rgba(108, 92, 231, 0.3);
}
.cat {
  position: absolute;
  top: 18px;
  left: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 99px;
}
.card-no {
  position: absolute;
  top: 18px;
  right: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 700;
}
.term {
  font-size: 42px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
}
.ipa {
  font-size: 17px;
  color: #d9d4f5;
  margin-top: 10px;
}
.hint {
  margin-top: 26px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 13.5px;
  font-weight: 600;
}
.back {
  transform: rotateY(180deg);
  background: #fff;
  border: 2px solid var(--green);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 30px 34px;
  box-shadow: 0 16px 40px rgba(0, 214, 143, 0.18);
}
.back-label {
  font-size: 13px;
  font-weight: 800;
  color: #00c281;
  letter-spacing: 0.5px;
}
.vi {
  font-size: 26px;
  font-weight: 800;
  margin-top: 6px;
  letter-spacing: -0.3px;
}
.vi-empty {
  color: var(--muted-2);
  font-style: italic;
}
.ex-hint {
  border-left-color: var(--muted-2);
}
.ex-hint .ex-text {
  font-style: normal;
  color: var(--muted);
}
.ex {
  margin-top: 16px;
  padding: 14px 16px;
  background: var(--bg);
  border-radius: 14px;
  border-left: 3px solid var(--purple);
}
.ex-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted-2);
  margin-bottom: 4px;
}
.ex-text {
  font-size: 14.5px;
  line-height: 1.55;
  color: #3a3a52;
  font-style: italic;
}
.back-cta {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.unknown,
.known-btn {
  flex: 1;
  cursor: pointer;
  font-size: 14.5px;
  font-weight: 700;
  padding: 12px;
  border-radius: 13px;
}
.unknown {
  border: 1px solid rgba(108, 92, 231, 0.2);
  color: #6a6a82;
  background: #fff;
}
.unknown:hover {
  background: var(--purple-soft);
}
.known-btn {
  border: none;
  color: #fff;
  background: var(--grad-green);
}
.controls {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 26px;
}
.nav {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  border: 1px solid rgba(108, 92, 231, 0.16);
  background: #fff;
  cursor: pointer;
  font-size: 20px;
  color: var(--purple);
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav:hover {
  background: var(--purple-soft);
}
.dots {
  display: flex;
  gap: 7px;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  transition: all 0.2s;
}
</style>
