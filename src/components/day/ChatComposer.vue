<script setup>
/**
 * Ô nhập câu trả lời + nút mic của AiChat.vue.
 * Không tự gọi API — chỉ phát ra sự kiện, logic thật (gửi câu, bật/tắt mic)
 * nằm ở useChatEngine.js.
 */
defineProps({
  modelValue: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  listening: { type: Boolean, default: false },
  listenable: { type: Boolean, default: false },
  online: { type: Boolean, default: true },
  // Chống điểm ảo (#7): buổi Boss yêu cầu NÓI -> khóa ô gõ + nút gửi, chỉ cho dùng mic.
  voiceRequired: { type: Boolean, default: false },
})
defineEmits(['update:modelValue', 'submit', 'toggle-mic'])
</script>

<template>
  <form class="composer" @submit.prevent="$emit('submit')">
    <button
      v-if="listenable"
      type="button"
      class="mic-btn"
      :class="{ live: listening }"
      :title="listening ? 'Đang nghe… bấm để dừng' : 'Bấm để nói'"
      @click.stop="$emit('toggle-mic')"
    >
      {{ listening ? '⏹️' : '🎤' }}
    </button>
    <input
      :value="modelValue"
      type="text"
      class="composer-input"
      :placeholder="voiceRequired ? '👑 Boss yêu cầu nói — bấm 🎤 để trả lời' : listening ? 'Đang nghe bạn nói…' : 'Nhập câu tiếng Anh của bạn…'"
      :disabled="loading || voiceRequired"
      @input="$emit('update:modelValue', $event.target.value)"
      @click.stop
    />
    <button
      type="submit"
      class="send-btn"
      :disabled="loading || !modelValue.trim() || !online || voiceRequired"
      :title="voiceRequired ? 'Buổi Boss yêu cầu trả lời bằng giọng' : !online ? 'Cần có mạng để gửi cho AI' : undefined"
    >{{ online ? 'Gửi →' : '🔌 Offline' }}</button>
  </form>
</template>

<style scoped>
.composer {
  margin-top: 16px;
  display: flex;
  gap: 9px;
  align-items: center;
}
.mic-btn {
  flex: none;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(0, 214, 143, 0.3);
  background: var(--surface);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;
}
@media (hover: hover) {
  .mic-btn:hover {
    background: #e6fbf2;
  }
}
.mic-btn:active {
  background: #e6fbf2;
}
.mic-btn.live {
  background: #ffe5e5;
  border-color: #ff6b6b;
  animation: pulse 1.1s infinite;
}
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.5);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 107, 107, 0);
  }
}
.composer-input {
  flex: 1;
  min-width: 0;
  border: 1px solid rgba(108, 92, 231, 0.18);
  border-radius: 14px;
  padding: 13px 16px;
  font-size: 16px;
  font-family: inherit;
  background: var(--surface);
  color: var(--ink);
  outline: none;
  transition: border-color 0.15s;
}
.composer-input::placeholder {
  color: var(--muted-2);
}
.composer-input:focus {
  border-color: var(--green);
}
.send-btn {
  flex: none;
  border: none;
  cursor: pointer;
  font-size: 14.5px;
  font-weight: 800;
  color: #fff;
  padding: 13px 20px;
  min-height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #00d68f, #00a86f);
  box-shadow: 0 10px 22px rgba(0, 214, 143, 0.28);
  transition: transform 0.15s;
}
@media (hover: hover) {
  .send-btn:hover:not(:disabled) {
    transform: translateY(-2px);
  }
}
.send-btn:active:not(:disabled) {
  transform: translateY(-1px) scale(0.98);
}
.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 720px) {
  /* Voice-first: mic là hành động chính của chat trên mobile — mở rộng vùng chạm */
  .mic-btn {
    width: 52px;
    height: 52px;
    font-size: 21px;
  }
}
</style>
