<script setup>
import { computed, ref } from 'vue'
import QuizTool from '@/components/tools/QuizTool.vue'
import { speak, canSpeak, wpmRateForWeek } from '@/lib/speak'

const props = defineProps({
  listening: { type: Object, required: true }, // { title, subtitle, script, audioUrl, questions }
  week: { type: [String, Number], default: null }, // tuần hiện tại -> chỉnh tốc độ TTS theo thang WPM
})

// Tốc độ "nghe thường" tăng dần theo tuần; "nghe chậm" luôn chậm hơn ~30% so với mức đó.
const baseRate = computed(() => wpmRateForWeek(props.week))

const questions = computed(() => props.listening?.questions || [])
const hasAudioFile = computed(() => !!props.listening?.audioUrl)
const speakable = canSpeak()
const plays = ref(0) // số lần đã bấm nghe (khuyến khích nghe ≥2 lần)
const showScript = ref(false)

// Phát: ưu tiên file thu giọng thật; nếu không có thì đọc script bằng Web Speech API.
const audioEl = ref(null)
function play(slow) {
  plays.value++
  if (hasAudioFile.value) {
    const el = audioEl.value
    if (el) {
      el.playbackRate = slow ? baseRate.value * 0.8 : baseRate.value
      el.currentTime = 0
      el.play()
    }
    return
  }
  if (speakable && props.listening?.script) speak(props.listening.script, slow ? baseRate.value * 0.68 : baseRate.value)
}
</script>

<template>
  <section v-if="questions.length" class="step-card">
    <div class="step-head">
      <div>
        <div class="eyebrow">NGHE HIỂU · INPUT THẬT</div>
        <h2 class="step-title">🎧 Bài nghe: {{ listening.title }}</h2>
      </div>
      <span class="wt-badge">{{ questions.length }} câu hỏi</span>
    </div>
    <p class="quiz-intro">{{ listening.subtitle || 'Nghe đoạn ngắn rồi trả lời câu hỏi. Nên nghe 2 lần trước khi xem lời thoại.' }}</p>
    <p v-if="!hasAudioFile && !speakable" class="quiz-intro warn">
      ⚠️ Trình duyệt chưa hỗ trợ phát âm. Hãy dùng Chrome/Edge để nghe.
    </p>

    <!-- File thu giọng thật (nếu có) -->
    <audio v-if="hasAudioFile" ref="audioEl" :src="listening.audioUrl" preload="none" />

    <div class="lc-player">
      <button class="lc-play" :disabled="!hasAudioFile && !speakable" @click="play(false)">▶ Nghe</button>
      <button class="lc-play slow" :disabled="!hasAudioFile && !speakable" @click="play(true)">🐢 Nghe chậm</button>
      <span v-if="plays" class="lc-plays">Đã nghe {{ plays }} lần</span>
    </div>

    <div class="lc-quiz">
      <div class="lc-quiz-label">❓ Trả lời câu hỏi (tên &amp; con số)</div>
      <QuizTool :questions="questions" mode="practice" embedded />
    </div>

    <details class="lc-script" @toggle="showScript = $event.target.open">
      <summary>{{ showScript ? 'Ẩn lời thoại' : 'Xem lời thoại (sau khi đã nghe & trả lời)' }}</summary>
      <p class="lc-script-text">{{ listening.script }}</p>
    </details>
  </section>
</template>

<style scoped>
.step-card {
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 22px;
  padding: 26px 28px;
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.06);
}
.step-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.eyebrow {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--muted-2);
}
.step-title {
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.4px;
  margin-top: 5px;
}
.wt-badge {
  background: rgba(0, 150, 106, 0.1);
  color: #00966a;
  font-size: 12.5px;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 99px;
  white-space: nowrap;
}
.quiz-intro {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--muted);
  margin-top: 12px;
}
.quiz-intro.warn {
  color: #d98300;
}
.lc-player {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.lc-play {
  border: 1px solid rgba(0, 214, 143, 0.35);
  background: linear-gradient(135deg, #00d68f, #00a86f);
  color: #fff;
  border-radius: 12px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 8px 18px rgba(0, 214, 143, 0.22);
}
.lc-play.slow {
  background: #fff;
  color: #00966a;
  box-shadow: none;
}
.lc-play:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
.lc-plays {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.lc-quiz {
  margin-top: 18px;
  background: var(--bg);
  border: 1px solid rgba(108, 92, 231, 0.12);
  border-radius: 16px;
  padding: 18px 20px;
}
.lc-quiz-label {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 14px;
}
.lc-script {
  margin-top: 16px;
  border: 1px solid rgba(0, 214, 143, 0.18);
  border-radius: 12px;
  padding: 4px 16px;
  background: #fbfffd;
}
.lc-script > summary {
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 800;
  color: #00966a;
  padding: 12px 0;
  list-style: none;
}
.lc-script > summary::-webkit-details-marker {
  display: none;
}
.lc-script > summary::before {
  content: '▸ ';
  font-weight: 900;
}
.lc-script[open] > summary::before {
  content: '▾ ';
}
.lc-script-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--ink);
  padding-bottom: 12px;
}
</style>
