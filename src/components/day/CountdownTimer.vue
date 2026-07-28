<script setup>
/**
 * Đồng hồ đếm ngược cho "luyện tính giờ" (mô phỏng áp lực phòng thi). Sách/CD không
 * tạo được áp lực thời gian — ở web ta cho bấm giờ theo mức khuyến nghị của IELTS.
 * Bắt đầu/tạm dừng/đặt lại; hết giờ phát 'timeup' (KHÔNG chặn thao tác — chỉ nhắc).
 */
import { ref, computed, onUnmounted, watch } from 'vue'

const props = defineProps({
  minutes: { type: Number, default: 20 },
  label: { type: String, default: 'Luyện tính giờ' },
})
const emit = defineEmits(['timeup'])

const total = computed(() => Math.max(1, Math.round(props.minutes * 60)))
const remaining = ref(total.value)
const running = ref(false)
const firedTimeup = ref(false)
let timer = null

watch(total, (t) => {
  if (!running.value) remaining.value = t
})

const mmss = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = remaining.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})
const low = computed(() => remaining.value <= 60 && remaining.value > 0)
const over = computed(() => remaining.value <= 0)

function tick() {
  if (remaining.value > 0) {
    remaining.value--
    if (remaining.value === 0) {
      stop()
      if (!firedTimeup.value) {
        firedTimeup.value = true
        emit('timeup')
      }
    }
  }
}
function start() {
  if (running.value || over.value) return
  running.value = true
  timer = setInterval(tick, 1000)
}
function stop() {
  running.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function reset() {
  stop()
  remaining.value = total.value
  firedTimeup.value = false
}
onUnmounted(stop)

defineExpose({ start, stop, reset, remaining, tick })
</script>

<template>
  <div class="ct" :class="{ low, over }">
    <span class="ct-label">⏱ {{ label }}</span>
    <span class="ct-time">{{ over ? 'Hết giờ' : mmss }}</span>
    <div class="ct-btns">
      <button v-if="!running && !over" class="ct-btn" type="button" @click="start">Bắt đầu</button>
      <button v-else-if="running" class="ct-btn" type="button" @click="stop">Tạm dừng</button>
      <button class="ct-btn ghost" type="button" @click="reset">Đặt lại</button>
    </div>
  </div>
</template>

<style scoped>
.ct {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px 14px;
  background: var(--bg);
}
.ct.low {
  border-color: rgba(255, 176, 32, 0.6);
  background: rgba(255, 176, 32, 0.08);
}
.ct.over {
  border-color: rgba(224, 72, 72, 0.6);
  background: rgba(224, 72, 72, 0.08);
}
.ct-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.ct-time {
  font-size: 20px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
  min-width: 62px;
}
.ct.low .ct-time {
  color: #b5730b;
}
.ct.over .ct-time {
  color: #e04848;
  font-size: 15px;
}
.ct-btns {
  display: flex;
  gap: 6px;
  margin-left: auto;
}
.ct-btn {
  border: none;
  background: #6c5ce7;
  color: #fff;
  font-weight: 700;
  font-size: 12.5px;
  padding: 7px 13px;
  border-radius: 9px;
  cursor: pointer;
  font-family: inherit;
  min-height: 36px;
}
.ct-btn.ghost {
  background: var(--surface);
  color: var(--slate);
  border: 1px solid var(--line);
}
</style>
