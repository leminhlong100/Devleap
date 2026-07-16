<script setup>
import { ref, computed, watch } from 'vue'
import { speak, canSpeak } from '@/lib/speak'
import { hapticLight } from '@/lib/haptics'
import { useUserStore } from '@/stores/user'
import { previewInterval, intervalLabel } from '@/lib/srs'
import { useSwipe } from '@/composables/useSwipe'

const props = defineProps({
  vocab: { type: Array, default: () => [] }, // [{term, vi, ipa, illo}]
  title: { type: String, default: 'Ôn nhanh — nhớ lại nghĩa' },
  // Số thẻ tối đa trong một phiên (mặc định 8 để giữ hành vi cũ; khóa theo sách
  // truyền số lớn hơn để học trọn nhóm từ của buổi).
  limit: { type: Number, default: 8 },
  // Nhãn eyebrow — cho phép đổi tiêu đề nhỏ theo ngữ cảnh (vd học nhóm phrasal verb).
  eyebrow: { type: String, default: 'ÔN ĐẦU GIỜ · NHỚ LẠI CHỦ ĐỘNG' },
})
const emit = defineEmits(['done'])

const user = useUserStore()
const speakable = canSpeak()

// Chuẩn hóa srsId trùng quy ước cardsFromTerms ('ielts:từ') -> dùng chung lịch ôn
// với bộ Flashcard, nên ôn ở đây cũng giãn lịch cho cả deck chính.
const cards = computed(() =>
  props.vocab
    .filter((v) => v && v.term)
    .slice(0, props.limit)
    .map((v) => ({ ...v, srsId: `ielts:${String(v.term).trim().toLowerCase()}` })),
)

// Hàng đợi phiên: thẻ "chưa nhớ" được đẩy xuống cuối để ÔN LẠI NGAY trong buổi.
const queue = ref([])
const flipped = ref(false)
const mastered = ref(new Set())
const busy = ref(false) // đang chạy hiệu ứng bay ra -> khóa thao tác kép

// Vuốt ngang (chỉ sau khi đã lật thẻ): phải = "Nhớ được", trái = "Chưa nhớ".
// Nút bấm vẫn là đường chính; vuốt chỉ là lối tắt như bản Flashcard thanh công cụ.
const swipe = useSwipe({
  enabled: () => flipped.value && !busy.value,
  onCommit: (direction) => grade(direction === 'right' ? 'good' : 'again'),
})

watch(
  cards,
  (v) => {
    queue.value = v.map((c) => c.srsId)
    flipped.value = false
    mastered.value = new Set()
    busy.value = false
    swipe.reset()
  },
  { immediate: true },
)

const bySrs = computed(() => Object.fromEntries(cards.value.map((c) => [c.srsId, c])))
const current = computed(() => (queue.value.length ? bySrs.value[queue.value[0]] : null))
const total = computed(() => cards.value.length)
const masteredCount = computed(() => mastered.value.size)
const finished = computed(() => total.value > 0 && queue.value.length === 0)

// Nhãn "lần ôn kế" để học viên thấy việc chấm có ý nghĩa (giãn cách thật).
function nextLabel(grade) {
  if (!current.value) return ''
  const card = user.srsOf(current.value.srsId)
  return intervalLabel(previewInterval(card, grade))
}

function sayWord() {
  if (speakable && current.value) speak(current.value.term)
}

function onCardClick() {
  // Vừa vuốt xong thì bỏ qua click "ảo" trình duyệt bắn ra khi thả tay.
  if (swipe.hasDragged.value || busy.value) return
  flipped.value = !flipped.value
}

function grade(g) {
  const card = current.value
  if (!card || busy.value) return
  busy.value = true
  hapticLight() // gõ nhẹ xác nhận (nút bấm lẫn vuốt đều qua đây)
  user.reviewCard(card.srsId, g) // nuôi lịch SRS + thưởng XP (nếu đến hạn)
  if (g !== 'again') {
    mastered.value = new Set(mastered.value).add(card.term)
  }
  // Chờ thẻ bay ra / lật lại rồi mới đổi sang thẻ kế cho mượt.
  setTimeout(() => {
    const id = queue.value.shift()
    if (g === 'again') queue.value.push(id) // chưa nhớ -> ôn lại cuối hàng đợi ngay
    flipped.value = false
    busy.value = false
    swipe.reset()
    if (queue.value.length === 0) emit('done')
  }, 260)
}

const cardWrapStyle = computed(() => ({
  transform: `translateX(${swipe.dx.value}px) rotate(${swipe.dx.value / 24}deg)`,
  transition: swipe.dragging.value ? 'none' : 'transform 0.25s ease',
}))
const leftHintOpacity = computed(() => (swipe.state.value.direction === 'left' ? swipe.state.value.ratio : 0))
const rightHintOpacity = computed(() => (swipe.state.value.direction === 'right' ? swipe.state.value.ratio : 0))
</script>

<template>
  <section class="step-card ifc-section">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: finished }">{{ eyebrow }}</div>
        <h2 class="step-title">🧠 {{ title }}</h2>
      </div>
      <span class="wt-badge" :class="{ ok: finished }">Thuộc {{ masteredCount }}/{{ total }}</span>
    </div>
    <p class="quiz-intro">
      Nhìn từ, <b>tự nhớ nghĩa trong đầu</b> rồi mới lật kiểm tra. Thẻ nào chưa nhớ sẽ quay lại ngay đến khi em nhớ — đây là cách ôn khắc sâu nhất.
    </p>

    <!-- ĐANG ÔN -->
    <div v-if="current" class="ifc-stage">
      <div class="ifc-progress">
        <span>Còn lại trong phiên: <b>{{ queue.length }}</b> thẻ</span>
        <span v-if="masteredCount" class="ifc-mastered">✅ đã thuộc {{ masteredCount }}</span>
      </div>

      <div
        class="ifc-wrap"
        :style="cardWrapStyle"
        @click="onCardClick"
        @pointerdown="swipe.onPointerDown"
        @pointermove="swipe.onPointerMove"
        @pointerup="swipe.onPointerUp"
        @pointercancel="swipe.onPointerCancel"
      >
        <span class="ifc-hint-swipe left" :style="{ opacity: leftHintOpacity }">❌ Chưa nhớ</span>
        <span class="ifc-hint-swipe right" :style="{ opacity: rightHintOpacity }">🙂 Nhớ được</span>

        <div class="ifc-3d" :class="{ flipped }">
          <!-- FRONT -->
          <div class="ifc-face front">
            <span class="ifc-badge">Còn {{ queue.length }} thẻ</span>
            <span class="ifc-emoji">{{ current.illo || '📝' }}</span>
            <span class="ifc-term">{{ current.term }}</span>
            <span class="ifc-tip">👆 Bấm để xem nghĩa</span>
          </div>
          <!-- BACK -->
          <div class="ifc-face back">
            <div class="ifc-back-label">NGHĨA TIẾNG VIỆT</div>
            <div class="ifc-vi">{{ current.vi || '—' }}</div>
            <div v-if="current.ipa" class="ifc-ipa">{{ current.term }} {{ current.ipa }}</div>
            <button v-if="speakable" class="ifc-say" @click.stop="sayWord" aria-label="Nghe phát âm">🔊 Nghe</button>
          </div>
        </div>
      </div>

      <!-- chưa lật: nhắc lật; đã lật: tự chấm -> nuôi SRS -->
      <div v-if="!flipped" class="ifc-actions">
        <button class="ifc-reveal" @click.stop="flipped = true">Lật xem nghĩa →</button>
      </div>
      <div v-else class="ifc-grades">
        <button class="ifc-grade again" @click.stop="grade('again')">
          ❌ Chưa nhớ<small>{{ nextLabel('again') }}</small>
        </button>
        <button class="ifc-grade good" @click.stop="grade('good')">
          🙂 Nhớ được<small>{{ nextLabel('good') }}</small>
        </button>
        <button class="ifc-grade easy" @click.stop="grade('easy')">
          ⚡ Quá dễ<small>{{ nextLabel('easy') }}</small>
        </button>
      </div>
    </div>

    <!-- XONG PHIÊN -->
    <div v-else-if="finished" class="ifc-done">
      <div class="ifc-done-emoji">🎉</div>
      <div>
        <div class="ifc-done-title">Đã thuộc cả {{ total }} từ!</div>
        <div class="ifc-done-sub">Lịch ôn lại đã được lên tự động — hôm sau hệ thống nhắc đúng lúc để nhớ lâu.</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ifc-stage {
  margin-top: 16px;
}
.ifc-progress {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary, #76768e);
  margin-bottom: 12px;
}
.ifc-mastered {
  color: var(--text-success, #00966a);
  font-weight: 600;
}

/* ---- Thẻ lật 3D + vuốt (giống Flashcard thanh công cụ) ---- */
.ifc-wrap {
  position: relative;
  perspective: 1400px;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  cursor: pointer;
  touch-action: pan-y;
  user-select: none;
}
.ifc-3d {
  position: relative;
  width: 100%;
  height: 240px;
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1);
}
.ifc-3d.flipped {
  transform: rotateY(180deg);
}
.ifc-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
}
.ifc-face.front {
  background: linear-gradient(150deg, #6c5ce7, #4b3bc4);
  box-shadow: 0 14px 34px rgba(108, 92, 231, 0.32);
}
.ifc-badge {
  position: absolute;
  top: 14px;
  right: 16px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.18);
  padding: 4px 11px;
  border-radius: 99px;
}
.ifc-emoji {
  font-size: 46px;
  line-height: 1;
  width: 84px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  border: 3px solid rgba(255, 255, 255, 0.5);
}
.ifc-term {
  font-size: 30px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
  word-break: break-word;
}
.ifc-tip {
  position: absolute;
  bottom: 16px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.78);
}
.ifc-face.back {
  transform: rotateY(180deg);
  background: var(--surface, #fff);
  border: 2px solid var(--green, #00d68f);
  box-shadow: 0 14px 34px rgba(0, 214, 143, 0.18);
}
.ifc-back-label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #00c281;
}
.ifc-vi {
  font-size: 26px;
  font-weight: 800;
  color: var(--purple-deep, #4b3bc4);
  letter-spacing: -0.3px;
  word-break: break-word;
}
.ifc-ipa {
  font-size: 14px;
  color: var(--muted, #76768e);
}
.ifc-say {
  margin-top: 4px;
  border: 1px solid var(--border-strong, rgba(108, 92, 231, 0.22));
  background: var(--surface);
  border-radius: 99px;
  padding: 8px 18px;
  min-height: 44px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  color: var(--ink, #1e1e2e);
}
.ifc-say:active {
  transform: scale(0.96);
}

/* Gợi ý vuốt (hiện mờ dần theo tay) */
.ifc-hint-swipe {
  position: absolute;
  top: 14px;
  z-index: 3;
  font-size: 13px;
  font-weight: 800;
  padding: 6px 13px;
  border-radius: 99px;
  color: #fff;
  pointer-events: none;
  transition: opacity 0.08s linear;
}
.ifc-hint-swipe.left {
  left: 12px;
  background: rgba(255, 71, 87, 0.92);
}
.ifc-hint-swipe.right {
  right: 12px;
  background: rgba(0, 214, 143, 0.92);
}

.ifc-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
.ifc-reveal {
  border: none;
  background: var(--purple, #6c5ce7);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 12px 28px;
  min-height: 44px;
  border-radius: 12px;
  cursor: pointer;
}
@media (hover: hover) {
  .ifc-reveal:hover {
    background: var(--purple-deep, #4b3bc4);
  }
}
.ifc-reveal:active {
  background: var(--purple-deep, #4b3bc4);
}
.ifc-grades {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.ifc-grade {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  border: 1.5px solid var(--border, rgba(108, 92, 231, 0.1));
  background: var(--surface);
  border-radius: 12px;
  padding: 11px 8px;
  min-height: 44px;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  color: var(--ink, #1e1e2e);
  transition: all 0.15s;
}
.ifc-grade small {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-2, #9a9ab0);
}
@media (hover: hover) {
  .ifc-grade.again:hover {
    border-color: var(--red, #ff6b6b);
    background: rgba(255, 107, 107, 0.07);
  }
  .ifc-grade.good:hover {
    border-color: var(--green, #00d68f);
    background: rgba(0, 214, 143, 0.07);
  }
  .ifc-grade.easy:hover {
    border-color: var(--cyan, #00b8d9);
    background: rgba(0, 184, 217, 0.07);
  }
}
.ifc-grade.again:active {
  border-color: var(--red, #ff6b6b);
  background: rgba(255, 107, 107, 0.14);
}
.ifc-grade.good:active {
  border-color: var(--green, #00d68f);
  background: rgba(0, 214, 143, 0.14);
}
.ifc-grade.easy:active {
  border-color: var(--cyan, #00b8d9);
  background: rgba(0, 184, 217, 0.14);
}
.ifc-done {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(0, 214, 143, 0.08);
  border-radius: 14px;
  padding: 18px;
}
.ifc-done-emoji {
  font-size: 30px;
}
.ifc-done-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--green-2, #00a86f);
}
.ifc-done-sub {
  font-size: 13px;
  color: var(--text-secondary, #76768e);
  margin-top: 2px;
  line-height: 1.5;
}
@media (max-width: 560px) {
  .ifc-3d {
    height: 260px;
  }
  .ifc-term {
    font-size: 26px;
  }
  .ifc-grade {
    font-size: 12.5px;
  }
}
</style>
