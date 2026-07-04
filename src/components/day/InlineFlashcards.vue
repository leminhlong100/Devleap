<script setup>
import { ref, computed, watch } from 'vue'
import { speak, canSpeak } from '@/lib/speak'
import { useUserStore } from '@/stores/user'
import { previewInterval, intervalLabel } from '@/lib/srs'

const props = defineProps({
  vocab: { type: Array, default: () => [] }, // [{term, vi, ipa, illo}]
  title: { type: String, default: 'Ôn nhanh — nhớ lại nghĩa' },
})
const emit = defineEmits(['done'])

const user = useUserStore()
const speakable = canSpeak()

// Chuẩn hóa srsId trùng quy ước cardsFromTerms ('ielts:từ') -> dùng chung lịch ôn
// với bộ Flashcard, nên ôn ở đây cũng giãn lịch cho cả deck chính.
const cards = computed(() =>
  props.vocab
    .filter((v) => v && v.term)
    .slice(0, 8)
    .map((v) => ({ ...v, srsId: `ielts:${String(v.term).trim().toLowerCase()}` })),
)

// Hàng đợi phiên: thẻ "chưa nhớ" được đẩy xuống cuối để ÔN LẠI NGAY trong buổi.
const queue = ref([])
const revealed = ref(false)
const mastered = ref(new Set())

watch(
  cards,
  (v) => {
    queue.value = v.map((c) => c.srsId)
    revealed.value = false
    mastered.value = new Set()
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

function reveal() {
  revealed.value = true
}
function sayWord() {
  if (speakable && current.value) speak(current.value.term)
}

function grade(g) {
  const card = current.value
  if (!card) return
  user.reviewCard(card.srsId, g) // nuôi lịch SRS + thưởng XP (nếu đến hạn)
  const id = queue.value.shift()
  if (g === 'again') {
    queue.value.push(id) // chưa nhớ -> ôn lại cuối hàng đợi ngay trong phiên
  } else {
    mastered.value = new Set(mastered.value).add(card.term)
  }
  revealed.value = false
  if (queue.value.length === 0) emit('done')
}
</script>

<template>
  <section class="step-card ifc-section">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: finished }">ÔN ĐẦU GIỜ · NHỚ LẠI CHỦ ĐỘNG</div>
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

      <div class="ifc-card2" :class="{ flipped: revealed }" @click="!revealed && reveal()">
        <template v-if="!revealed">
          <span class="ifc2-emoji">{{ current.illo || '📝' }}</span>
          <span class="ifc2-term">{{ current.term }}</span>
          <span class="ifc2-ask">Nghĩa tiếng Việt là gì?</span>
        </template>
        <template v-else>
          <span class="ifc2-vi">{{ current.vi || '—' }}</span>
          <span v-if="current.ipa" class="ifc2-ipa">{{ current.term }} {{ current.ipa }}</span>
          <button v-if="speakable" class="ifc2-say" @click.stop="sayWord" aria-label="Nghe phát âm">🔊 Nghe</button>
        </template>
      </div>

      <!-- chưa lật: nút lật; đã lật: tự chấm -> nuôi SRS -->
      <div v-if="!revealed" class="ifc-actions">
        <button class="ifc-reveal" @click="reveal">Lật xem nghĩa →</button>
      </div>
      <div v-else class="ifc-grades">
        <button class="ifc-grade again" @click="grade('again')">
          ❌ Chưa nhớ<small>{{ nextLabel('again') }}</small>
        </button>
        <button class="ifc-grade good" @click="grade('good')">
          🙂 Nhớ được<small>{{ nextLabel('good') }}</small>
        </button>
        <button class="ifc-grade easy" @click="grade('easy')">
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
.ifc-card2 {
  min-height: 150px;
  border: 1.5px solid var(--border-accent, rgba(108, 92, 231, 0.4));
  border-radius: 16px;
  background: var(--surface-1, #fbfbfe);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 22px;
  cursor: pointer;
  text-align: center;
}
.ifc-card2.flipped {
  background: var(--bg-accent, #f2f0ff);
}
.ifc2-emoji {
  font-size: 26px;
}
.ifc2-term {
  font-size: 24px;
  font-weight: 800;
  color: var(--ink, #1e1e2e);
}
.ifc2-ask {
  font-size: 13px;
  color: var(--muted-2, #9a9ab0);
}
.ifc2-vi {
  font-size: 22px;
  font-weight: 800;
  color: var(--purple-deep, #4b3bc4);
}
.ifc2-ipa {
  font-size: 14px;
  color: var(--muted, #76768e);
}
.ifc2-say {
  margin-top: 6px;
  border: 1px solid var(--border-strong, rgba(108, 92, 231, 0.22));
  background: var(--surface);
  border-radius: 99px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  color: var(--ink, #1e1e2e);
}
.ifc-actions {
  margin-top: 14px;
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
  border-radius: 12px;
  cursor: pointer;
}
.ifc-reveal:hover {
  background: var(--purple-deep, #4b3bc4);
}
.ifc-grades {
  margin-top: 14px;
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
  .ifc-grade {
    font-size: 12.5px;
  }
}
</style>
