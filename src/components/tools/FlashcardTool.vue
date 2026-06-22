<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { previewInterval, intervalLabel, daysUntil } from '@/lib/srs'
import { speak, canSpeak } from '@/lib/speak'
import { vocabImageUrl } from '@/lib/vocabImage'

const speakable = canSpeak()
function sayTerm() {
  if (card.value) speak(card.value.term)
}

// Flashcard chỉ chạy theo từng bài học: view truyền bộ thẻ của ngày vào.
// `deck='saved'` -> bộ từ người học tự lưu (cho phép bỏ lưu ngay trên thẻ).
const props = defineProps({
  cards: { type: Array, default: null },
  deck: { type: String, default: '' },
})

const user = useUserStore()
const isSaved = computed(() => props.deck === 'saved')
// Thẻ "câu" (lưu cả câu khi chat AI): mặt trước là câu tiếng Anh, mặt sau là
// bản dịch — không có ảnh minh họa/IPA như thẻ từ đơn.
const isSentence = computed(() => card.value?.kind === 'sentence')

function removeWord() {
  if (!card.value) return
  user.removeSavedWord(card.value.term)
}

const index = ref(0)
const flipped = ref(false)

// Hàng đợi ôn: thẻ đến hạn / thẻ mới xếp lên trước (quá hạn lâu nhất đứng đầu),
// các thẻ chưa tới hạn xếp sau. Cố định thứ tự trong suốt phiên để khỏi nhảy thẻ.
const ordered = ref([])
function dueRank(c) {
  const s = user.srsOf(c.srsId)
  if (!s) return 0 // thẻ mới
  const d = daysUntil(s.due)
  return d <= 0 ? d - 1 : 1000 + d // quá hạn lên đầu; chưa tới hạn đẩy xuống cuối
}
function buildQueue() {
  ordered.value = [...(props.cards || [])].sort((a, b) => dueRank(a) - dueRank(b))
  index.value = 0
  flipped.value = false
}
// Đổi bộ thẻ (đổi ngày học) -> dựng lại hàng đợi.
watch(() => props.cards, buildQueue, { immediate: true })

const cards = computed(() => ordered.value)
const hasCards = computed(() => cards.value.length > 0)
const card = computed(() => cards.value[index.value])
const total = computed(() => cards.value.length)

// Ảnh minh họa mặt trước thẻ (nhớ lâu hơn). Trong lúc tải hiện spinner; ảnh chỉ
// hiện khi đã tải xong nên không bao giờ thấy "ảnh thẻ cũ + chữ thẻ mới".
const imgUrl = computed(() => (card.value && !isSentence.value ? vocabImageUrl(card.value.term) : ''))
const imgOk = ref(true)
const imgLoaded = ref(false)
// Đổi thẻ -> ẩn ảnh cũ, hiện lại spinner, thử tải ảnh của thẻ mới.
watch(() => card.value?.srsId, () => {
  imgOk.value = true
  imgLoaded.value = false
})
const dueTotal = computed(() => user.dueCount(cards.value.map((c) => c.srsId)))

const cardSrs = computed(() => (card.value ? user.srsOf(card.value.srsId) : null))
const status = computed(() => {
  const s = cardSrs.value
  if (!s) return { label: '✦ Thẻ mới', kind: 'new' }
  const d = daysUntil(s.due)
  if (d <= 0) return { label: '⏰ Đến hạn ôn', kind: 'due' }
  return { label: `✓ Đã thuộc · còn ${intervalLabel(d)}`, kind: 'later' }
})

// 4 mức kiểu Anki — mỗi nút hiện trước khoảng ôn kế nếu chọn.
const GRADE_BTNS = [
  { grade: 'again', label: 'Quên', cls: 'g-again' },
  { grade: 'hard', label: 'Khó', cls: 'g-hard' },
  { grade: 'good', label: 'Tốt', cls: 'g-good' },
  { grade: 'easy', label: 'Dễ', cls: 'g-easy' },
]
const previewLabel = (grade) => intervalLabel(previewInterval(cardSrs.value, grade))

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
function grade(g) {
  user.reviewCard(card.value.srsId, g)
  setTimeout(advance, 280)
}
function dotColor(i) {
  if (i === index.value) return '#6C5CE7'
  const s = user.srsOf(cards.value[i]?.srsId)
  if (!s) return '#D9D6EC' // mới
  return daysUntil(s.due) <= 0 ? '#FFB020' : '#00D68F' // đến hạn (vàng) / đã thuộc (xanh)
}
</script>

<template>
  <div class="card-tool">
    <!-- CHƯA CÓ THẺ THEO BÀI -->
    <div v-if="!hasCards && isSaved" class="empty-tool">
      <div class="empty-emoji">📚</div>
      <h2>Chưa có từ nào được lưu</h2>
      <p>Vào <b>💬 Trò chuyện với AI</b>, bật <b>📌 Lưu từ</b> rồi chạm vào từ trong câu trả lời để thêm vào đây.</p>
    </div>
    <div v-else-if="!hasCards" class="empty-tool">
      <div class="empty-emoji">🃏</div>
      <h2>Flashcard đi theo từng bài học</h2>
      <p>Mở một ngày học rồi bấm <b>🃏 Luyện lại bằng Flashcard</b> để học bộ từ vựng của bài đó.</p>
    </div>

    <template v-else>
    <div class="tool-head">
      <div>
        <h2 class="tool-title">{{ isSaved ? '📚 Từ vựng đã lưu' : '🃏 Flashcard từ vựng IT' }}</h2>
        <p class="tool-sub">Lật thẻ, rồi tự chấm mức nhớ. Lịch ôn giãn cách tự xếp ngày ôn lại.</p>
      </div>
      <div class="known">
        <div class="known-label">Đến hạn ôn</div>
        <div class="known-count" :class="{ alldone: dueTotal === 0 }">{{ dueTotal }} / {{ total }}</div>
      </div>
    </div>

    <div v-if="dueTotal === 0" class="all-done">
      🎉 Bạn đã ôn hết các thẻ đến hạn hôm nay! Có thể ôn thêm tùy thích.
    </div>

    <div class="stage">
      <div class="card-wrap" @click="flip">
        <div class="card-3d" :style="{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }">
          <!-- FRONT -->
          <div class="face front">
            <span class="cat">{{ card.cat }}</span>
            <span class="card-no">Thẻ {{ index + 1 }}/{{ total }}</span>
            <div class="fc-illo">
              <span v-if="isSentence" class="fc-illo-fallback">💬</span>
              <template v-else>
                <img
                  v-if="imgUrl && imgOk"
                  :src="imgUrl"
                  :alt="card.term"
                  class="fc-img"
                  :class="{ shown: imgLoaded }"
                  decoding="async"
                  @load="imgLoaded = true"
                  @error="imgOk = false"
                />
                <span v-if="imgOk && !imgLoaded" class="fc-spin"></span>
                <span v-else-if="!imgOk" class="fc-illo-fallback">🗂️</span>
              </template>
            </div>
            <div class="term" :class="{ 'term-sentence': isSentence }">{{ card.term }}</div>
            <div v-if="card.ipa" class="ipa">{{ card.ipa }}</div>
            <button v-if="speakable" class="speak-fc" title="Nghe phát âm" @click.stop="sayTerm">🔊 Nghe</button>
            <span class="srs-status" :class="status.kind">{{ status.label }}</span>
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
            <div v-else-if="!isSentence" class="ex ex-hint">
              <div class="ex-text">Chưa có nghĩa sẵn cho từ này — tra ở 📖 Từ điển hoặc tự ghi chú nhé.</div>
            </div>
            <div v-if="isSaved && card.context" class="ex ctx-ex">
              <div class="ex-label">💬 KHI CHAT VỚI AI</div>
              <div class="ex-text">{{ card.context }}</div>
            </div>
            <button v-if="isSaved" class="remove-saved" title="Bỏ từ này khỏi danh sách" @click.stop="removeWord">
              🗑 Bỏ lưu từ này
            </button>
            <div class="grade-label">Bạn nhớ từ này tới đâu?</div>
            <div class="grade-cta">
              <button
                v-for="b in GRADE_BTNS"
                :key="b.grade"
                class="grade-btn"
                :class="b.cls"
                @click.stop="grade(b.grade)"
              >
                <span class="g-name">{{ b.label }}</span>
                <span class="g-when">{{ previewLabel(b.grade) }}</span>
              </button>
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
  color: #ffb020;
}
.known-count.alldone {
  color: #00c281;
}
.all-done {
  background: rgba(0, 214, 143, 0.1);
  border: 1px solid rgba(0, 214, 143, 0.3);
  color: #00936a;
  font-size: 13.5px;
  font-weight: 700;
  text-align: center;
  padding: 11px 16px;
  border-radius: 14px;
  margin-bottom: 18px;
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
  height: 450px;
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
  padding: 56px 30px 30px;
  box-shadow: 0 16px 40px rgba(108, 92, 231, 0.3);
}
.cat {
  position: absolute;
  top: 18px;
  left: 20px;
  z-index: 2;
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
  z-index: 2;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 700;
}
.fc-illo {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 18px;
  margin-bottom: 16px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.14);
  border: 3px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.28);
}
.fc-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.35s ease;
}
.fc-img.shown {
  opacity: 1;
}
.fc-spin {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: fc-rot 0.7s linear infinite;
}
@keyframes fc-rot {
  to {
    transform: rotate(360deg);
  }
}
.fc-illo-fallback {
  font-size: 56px;
}
.term {
  font-size: 42px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
}
/* Thẻ câu: câu dài nên chữ nhỏ hơn & xuống dòng tự nhiên */
.term-sentence {
  font-size: 22px;
  line-height: 1.4;
  letter-spacing: 0;
  max-width: 92%;
  word-break: break-word;
}
.ipa {
  font-size: 17px;
  color: #d9d4f5;
  margin-top: 10px;
}
.speak-fc {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 99px;
  cursor: pointer;
  transition: background 0.15s, transform 0.12s;
}
.speak-fc:hover {
  background: rgba(255, 255, 255, 0.3);
}
.speak-fc:active {
  transform: scale(0.96);
}
.srs-status {
  margin-top: 18px;
  font-size: 12.5px;
  font-weight: 700;
  padding: 5px 13px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}
.srs-status.due {
  background: rgba(255, 176, 32, 0.95);
  color: #4a3000;
}
.srs-status.later {
  background: rgba(0, 214, 143, 0.95);
  color: #003d29;
}
.hint {
  margin-top: 16px;
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
.ctx-ex {
  border-left-color: var(--green);
  background: #eafff6;
}
.ctx-ex .ex-label {
  color: #00966a;
}
.remove-saved {
  display: block;
  margin: 14px auto 0;
  cursor: pointer;
  border: 1px solid rgba(255, 107, 107, 0.35);
  background: #fff;
  color: #d63b3b;
  font-size: 12.5px;
  font-weight: 700;
  padding: 7px 14px;
  border-radius: 10px;
  transition: background 0.15s;
}
.remove-saved:hover {
  background: #fff1f1;
}
.grade-label {
  margin-top: 20px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
  text-align: center;
}
.grade-cta {
  display: flex;
  gap: 9px;
  margin-top: 10px;
}
.grade-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  padding: 10px 6px;
  border-radius: 13px;
  border: 1.5px solid transparent;
  background: #fff;
  transition: all 0.15s;
}
.grade-btn:hover {
  transform: translateY(-2px);
}
.g-name {
  font-size: 14px;
  font-weight: 800;
}
.g-when {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.75;
}
.g-again {
  border-color: rgba(255, 71, 87, 0.4);
  color: #e0354a;
  background: rgba(255, 71, 87, 0.07);
}
.g-hard {
  border-color: rgba(255, 159, 10, 0.45);
  color: #c9750a;
  background: rgba(255, 159, 10, 0.08);
}
.g-good {
  border-color: rgba(0, 214, 143, 0.45);
  color: #00936a;
  background: rgba(0, 214, 143, 0.08);
}
.g-easy {
  border-color: rgba(108, 92, 231, 0.4);
  color: var(--purple);
  background: var(--purple-soft);
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
