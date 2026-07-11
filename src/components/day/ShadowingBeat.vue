<script setup>
import { computed, ref } from 'vue'
import { speak, canSpeak } from '@/lib/speak'
import { beatPattern } from '@/lib/beatPattern'

/**
 * Shadowing chấm nhịp (kế hoạch "Nói Tự Tin", Đợt A #3). Mỗi buổi 1 câu: hiện MẪU
 * NHỊP (từ mang nghĩa được nhấn), phát mẫu để người học bắt chước (shadow), rồi
 * TỰ-CHẤM trọng âm theo mẫu. Tiếng Anh nói theo nhịp trọng âm — đọc đều tăm tắp là
 * lý do lớn khiến người Việt nghe "máy" và khó hiểu. Không gọi LLM (Groq không nghe
 * được), không đo mic ở đây: mô hình mẫu là văn bản, người học tự đối chiếu.
 */
const props = defineProps({
  sentence: { type: String, required: true },
})

const speakable = canSpeak()
const pat = computed(() => beatPattern(props.sentence))
const beats = computed(() => pat.value.beats)

const checks = ref([false, false, false])
const CHECK_LABELS = computed(() => [
  `Nhấn đúng ${beats.value} nhịp (các từ đậm), không nhấn từ mờ`,
  'Nuốt/rút gọn từ chức năng (a, the, to, of…) — không đọc đều',
  'Bắt chước kịp tốc độ mẫu, không chậm hơn nhiều',
])

const played = ref(false)
function playModel(slow) {
  if (!speakable) return
  speak(props.sentence, slow ? 0.7 : 0.92)
  played.value = true
}
</script>

<template>
  <section class="step-card shb">
    <div class="step-head">
      <div>
        <div class="eyebrow">🥁 SHADOWING · CHẤM NHỊP TRỌNG ÂM</div>
        <h2 class="step-title">Bắt chước nhịp câu</h2>
      </div>
      <span class="shb-beats">{{ beats }} nhịp</span>
    </div>
    <p class="quiz-intro">
      Tiếng Anh nói theo <b>nhịp trọng âm</b>: nhấn từ mang nghĩa (in <b>đậm</b>), nuốt từ chức năng.
      Nghe mẫu rồi <b>nói đè lên</b> (shadow) đúng nhịp — đọc đều tăm tắp là lý do bị nghe không hiểu.
    </p>

    <div class="shb-sentence">
      <span
        v-for="(w, i) in pat.words"
        :key="i"
        class="shb-word"
        :class="{ beat: w.stressed }"
      >{{ w.word }}<span v-if="w.stressed" class="shb-dot">•</span></span>
    </div>

    <div class="shb-controls">
      <button class="shb-play" @click="playModel(false)" :disabled="!speakable">🔊 Nghe mẫu</button>
      <button class="shb-play slow" @click="playModel(true)" :disabled="!speakable">🐢 Chậm</button>
    </div>
    <p v-if="!speakable" class="quiz-intro warn">⚠️ Trình duyệt chưa hỗ trợ phát âm — hãy dùng Chrome/Edge để nghe mẫu.</p>

    <div class="shb-check">
      <div class="shb-check-label">✅ Tự chấm sau khi shadow 2–3 lần:</div>
      <label v-for="(lbl, i) in CHECK_LABELS" :key="i" class="shb-check-row">
        <input type="checkbox" v-model="checks[i]" />
        <span>{{ lbl }}</span>
      </label>
    </div>
  </section>
</template>

<style scoped>
.shb {
  border: 1px solid rgba(255, 176, 32, 0.28);
}
.shb-beats {
  background: rgba(255, 176, 32, 0.14);
  color: #b25f00;
  font-size: 12.5px;
  font-weight: 800;
  padding: 5px 12px;
  border-radius: 99px;
  white-space: nowrap;
}
.shb-sentence {
  margin-top: 16px;
  font-size: 20px;
  line-height: 1.9;
  color: var(--slate);
  background: var(--bg);
  border-radius: 14px;
  padding: 16px 18px;
}
.shb-word {
  display: inline-block;
  margin-right: 7px;
  position: relative;
}
.shb-word.beat {
  font-weight: 800;
  color: var(--ink);
}
.shb-dot {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  color: #f08a00;
  font-size: 14px;
}
.shb-controls {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.shb-play {
  border: 1px solid rgba(255, 176, 32, 0.45);
  background: var(--surface);
  color: #b25f00;
  border-radius: 10px;
  padding: 9px 16px;
  min-height: 44px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.shb-play.slow {
  color: var(--muted);
}
.shb-play:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.shb-check {
  margin-top: 18px;
}
.shb-check-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 8px;
}
.shb-check-row {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  color: var(--slate);
  padding: 6px 0;
  cursor: pointer;
}
.shb-check-row input {
  width: 18px;
  height: 18px;
  accent-color: #f08a00;
}
.quiz-intro.warn {
  color: var(--text-warning);
}
</style>
