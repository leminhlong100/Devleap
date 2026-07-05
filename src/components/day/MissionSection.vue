<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  day: { type: Object, required: true },
  // Phụ thuộc store + dùng chung với agenda ở IeltsDayView.vue nên tính ở đó
  // rồi truyền xuống, tránh 2 nguồn sự thật lệch nhau.
  missionNeeded: { type: Boolean, default: false },
  missionDone: { type: Boolean, default: false },
  realTalkNeeded: { type: Boolean, default: false },
  realTalkDone: { type: Boolean, default: false },
})
const user = useUserStore()

// —— MISSION TUẦN (real-life, ngoài app) ——
// Mô tả mission lấy trực tiếp từ checklist ngày (bullet "🌍 Mission tuần…: …"),
// không soạn riêng ở tầng dữ liệu — tránh trùng 2 nguồn sự thật.
const missionText = computed(() => {
  const item = (props.day.checklist || []).find((c) => /🌍|mission\s*tuần/i.test(c))
  if (!item) return ''
  return item.replace(/^.*?mission\s*tuần[^:]*:\s*/i, '').replace(/^🌍\s*/, '').trim() || item
})
const missionNote = ref('')
watch(
  () => props.day,
  (cur) => {
    if (cur) missionNote.value = user.missionOf('ielts', cur.week, cur.n)?.note || ''
  },
  { immediate: true },
)
function saveMissionDraft() {
  user.saveMission('ielts', props.day.week, props.day.n, missionNote.value, false)
}
function toggleMissionDone(ev) {
  user.saveMission('ielts', props.day.week, props.day.n, missionNote.value, !!ev.target.checked)
}

// —— BUỔI NÓI NGƯỜI THẬT (2 tuần/lần, từ Tuần 3) ——
const realTalkText = computed(() => {
  const item = (props.day.checklist || []).find((c) => /🗣️|buổi nói người thật/i.test(c))
  if (!item) return ''
  return item.replace(/^.*?buổi nói người thật[^:]*:\s*/i, '').replace(/^🗣️\s*/, '').trim() || item
})
const realTalkNote = ref('')
watch(
  () => props.day,
  (cur) => {
    if (cur) realTalkNote.value = user.realTalkOf('ielts', cur.week, cur.n)?.note || ''
  },
  { immediate: true },
)
function saveRealTalkDraft() {
  user.saveRealTalk('ielts', props.day.week, props.day.n, realTalkNote.value, false)
}
function toggleRealTalkDone(ev) {
  user.saveRealTalk('ielts', props.day.week, props.day.n, realTalkNote.value, !!ev.target.checked)
}
</script>

<template>
  <!-- MISSION TUẦN — nhiệm vụ NGOÀI app, có rủi ro thật, không do app chấm -->
  <section v-if="missionNeeded" class="step-card mission-card" data-agenda-key="mission" :class="{ current: !missionDone }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: missionDone }">NGOÀI APP · CÓ RỦI RO THẬT</div>
        <h2 class="step-title">🌍 Mission tuần</h2>
      </div>
      <span class="wt-badge" :class="{ ok: missionDone }">{{ missionDone ? '✅ Đã hoàn thành' : '+150 XP' }}</span>
    </div>
    <p class="quiz-intro">{{ missionText }}</p>
    <textarea
      v-model="missionNote"
      class="write-area mission-note"
      rows="3"
      placeholder="Dán link / ghi chú bằng chứng (ảnh chụp, đoạn chat, email đã gửi…)…"
      @change="saveMissionDraft"
    ></textarea>
    <label class="mission-check">
      <input type="checkbox" :checked="missionDone" @change="toggleMissionDone" />
      <span>Em đã làm mission này ngoài đời thật</span>
    </label>
  </section>

  <!-- BUỔI NÓI NGƯỜI THẬT — 2 tuần/lần từ Tuần 3, không do app chấm -->
  <section v-if="realTalkNeeded" class="step-card mission-card" data-agenda-key="realTalk" :class="{ current: !realTalkDone }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: realTalkDone }">NGOÀI APP · CÓ RỦI RO THẬT</div>
        <h2 class="step-title">🗣️ Buổi nói người thật</h2>
      </div>
      <span class="wt-badge" :class="{ ok: realTalkDone }">{{ realTalkDone ? '✅ Đã hoàn thành' : '+100 XP' }}</span>
    </div>
    <p class="quiz-intro">{{ realTalkText }}</p>
    <textarea
      v-model="realTalkNote"
      class="write-area mission-note"
      rows="3"
      placeholder="Sổ lỗi đời thực sau buổi nói: 1 câu bí, 1 từ không nghe ra, 1 điều làm tốt…"
      @change="saveRealTalkDraft"
    ></textarea>
    <label class="mission-check">
      <input type="checkbox" :checked="realTalkDone" @change="toggleRealTalkDone" />
      <span>Em đã nói chuyện với người thật buổi này</span>
    </label>
  </section>
</template>

<style scoped src="./ieltsDaySection.css"></style>
<style scoped>
.mission-card {
  border: 1.5px solid rgba(255, 176, 32, 0.3);
  background: linear-gradient(135deg, #fffaf0, #fff);
}
[data-theme='dark'] .mission-card {
  background: var(--bg-warning);
}
.mission-card.current {
  border: 2px solid #ffb020;
  box-shadow: 0 18px 44px rgba(255, 176, 32, 0.16);
}
.mission-note {
  margin-top: 14px;
  min-height: 70px;
}
.mission-check {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  font-weight: 700;
  color: #7a5200;
  cursor: pointer;
}
[data-theme='dark'] .mission-check {
  color: var(--amber-ink);
}
.mission-check input {
  width: 18px;
  height: 18px;
  accent-color: #ffb020;
  cursor: pointer;
}
</style>
