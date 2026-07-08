<script setup>
/**
 * Modal "Chọn chế độ học" hiện khi bấm vào một clip trong thư viện Shadowing —
 * cho chọn giữa Dictation (nghe-viết chính tả) và Shadowing (bắt chước phát âm)
 * trước khi mở player, thay vì luôn mặc định vào Shadowing.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  lastMode: { type: String, default: null }, // 'shadowing' | 'dictation' | null -> gắn nhãn "ĐANG HỌC"
})
const emit = defineEmits(['update:modelValue', 'choose'])

function close() {
  emit('update:modelValue', false)
}
function choose(mode) {
  emit('choose', mode)
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="cmm-fade">
      <div v-if="modelValue" class="cmm-overlay" @click.self="close">
        <div class="cmm-panel">
          <button class="cmm-close" title="Đóng" @click="close">✕</button>
          <h2 class="cmm-title">Chọn chế độ học</h2>
          <p class="cmm-sub">Chọn chế độ học phù hợp với bạn nhất</p>

          <div class="cmm-options">
            <button class="cmm-opt" @click="choose('dictation')">
              <span v-if="props.lastMode === 'dictation'" class="cmm-badge">ĐANG HỌC</span>
              <span class="cmm-face">🦉</span>
              <span class="cmm-label"><span class="cmm-icon">✏️</span> NGHE - VIẾT CHÍNH TẢ</span>
            </button>
            <button class="cmm-opt" @click="choose('shadowing')">
              <span v-if="props.lastMode === 'shadowing'" class="cmm-badge">ĐANG HỌC</span>
              <span class="cmm-face">🦜</span>
              <span class="cmm-label"><span class="cmm-icon">🎤</span> BẮT CHƯỚC PHÁT ÂM</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cmm-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(20, 18, 35, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.cmm-panel {
  position: relative;
  width: 100%;
  max-width: 520px;
  background: var(--surface);
  border-radius: 24px;
  padding: 32px 28px;
  box-shadow: 0 24px 60px rgba(20, 18, 35, 0.25);
  text-align: center;
}
.cmm-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--chip-bg);
  color: var(--muted-2);
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
}
.cmm-close:active {
  background: var(--track-bg);
}
.cmm-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--ink);
}
.cmm-sub {
  margin-top: 6px;
  font-size: 14px;
  color: var(--muted);
}
.cmm-options {
  display: flex;
  gap: 16px;
  margin-top: 26px;
}
@media (max-width: 480px) {
  .cmm-options {
    flex-direction: column;
  }
}
.cmm-opt {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 22px 14px 20px;
  border: 1.5px solid rgba(108, 92, 231, 0.16);
  border-radius: 18px;
  background: var(--surface);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
@media (hover: hover) {
  .cmm-opt:hover {
    border-color: var(--purple);
    box-shadow: 0 10px 24px rgba(108, 92, 231, 0.16);
    transform: translateY(-2px);
  }
}
.cmm-opt:active {
  transform: scale(0.98);
}
.cmm-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10.5px;
  font-weight: 800;
  color: var(--amber-ink);
  background: rgba(255, 176, 32, 0.18);
  border: 1px solid rgba(255, 176, 32, 0.4);
  padding: 3px 10px;
  border-radius: 99px;
  white-space: nowrap;
}
.cmm-face {
  font-size: 56px;
  line-height: 1;
}
.cmm-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: 0.2px;
}
.cmm-icon {
  font-size: 16px;
}

.cmm-fade-enter-active,
.cmm-fade-leave-active {
  transition: opacity 0.18s ease;
}
.cmm-fade-enter-from,
.cmm-fade-leave-to {
  opacity: 0;
}
</style>
