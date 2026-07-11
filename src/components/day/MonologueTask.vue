<script setup>
import { ref } from 'vue'
import VoiceRecorder from '@/components/day/VoiceRecorder.vue'
import { speak, canSpeak } from '@/lib/speak'

/**
 * Độc thoại dài 60–90s mỗi khối (kế hoạch "Nói Tự Tin", Trục E). Người học nói
 * LIỀN MẠCH một chủ đề dài hơn hẳn lượt hội thoại 1–3 câu, có dùng TỪ NỐI để
 * mạch lạc. Tái dùng VoiceRecorder để ghi lại; tự chấm bằng checklist mạch lạc
 * (không gọi LLM). Rèn kỹ năng kể chuyện / tự giới thiệu — thứ hội thoại ngắn bỏ sót.
 */
const props = defineProps({
  recId: { type: String, required: true },
  topic: { type: String, default: 'Nói liền mạch 60–90 giây về một chủ đề.' },
  connectors: { type: Array, default: () => [] },
})

const speakable = canSpeak()
const checks = ref([false, false, false])
const CHECK_LABELS = [
  'Nói liền mạch 60–90 giây, không dừng dài',
  'Dùng ít nhất 3 từ nối để nối ý',
  'Có mở đầu – thân – kết (không kể lộn xộn)',
]
function say(t) {
  if (speakable) speak(t)
}
</script>

<template>
  <section class="step-card mono">
    <div class="step-head">
      <div>
        <div class="eyebrow">ĐỘC THOẠI DÀI · NÓI LIỀN MẠCH</div>
        <h2 class="step-title">🎤 Nói một mình 60–90 giây</h2>
      </div>
    </div>
    <p class="quiz-intro">
      Lượt hội thoại ngắn không đủ để tập <b>kể chuyện</b>. Hôm nay bạn nói <b>một mình, liền mạch 60–90s</b> —
      dùng từ nối để mạch ý trôi chảy. Ghi âm lại rồi nghe xem mình có bị đứt quãng không.
    </p>

    <div class="mono-topic">🎯 {{ topic }}</div>

    <div v-if="connectors.length" class="mono-conn">
      <div class="mono-conn-label">🔗 Từ nối nên dùng (bấm nghe):</div>
      <div class="mono-conn-wrap">
        <span v-for="(c, i) in connectors" :key="i" class="mono-conn-chip" @click="say(c)">{{ c }} 🔊</span>
      </div>
    </div>

    <VoiceRecorder :rec-id="recId" label="Ghi âm bài độc thoại 60–90s" />

    <div class="mono-check">
      <div class="mono-check-label">✅ Tự chấm mạch lạc:</div>
      <label v-for="(lbl, i) in CHECK_LABELS" :key="i" class="mono-check-row">
        <input type="checkbox" v-model="checks[i]" />
        <span>{{ lbl }}</span>
      </label>
    </div>
  </section>
</template>

<style scoped>
.mono {
  border: 1px solid rgba(108, 92, 231, 0.22);
}
.mono-topic {
  margin-top: 14px;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  background: rgba(108, 92, 231, 0.1);
  border-radius: 12px;
  padding: 12px 15px;
}
.mono-conn {
  margin-top: 16px;
}
.mono-conn-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 8px;
}
.mono-conn-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.mono-conn-chip {
  background: rgba(255, 176, 32, 0.12);
  border: 1px solid rgba(255, 176, 32, 0.3);
  color: #b25f00;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 99px;
  cursor: pointer;
}
.mono-check {
  margin-top: 16px;
}
.mono-check-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 8px;
}
.mono-check-row {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  color: var(--slate);
  padding: 6px 0;
  cursor: pointer;
}
.mono-check-row input {
  width: 18px;
  height: 18px;
  accent-color: #6c5ce7;
}
</style>
