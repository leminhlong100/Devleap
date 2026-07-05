<script setup>
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useChatEngine, PERSONAS } from '@/composables/useChatEngine'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useKeyboardOpen } from '@/composables/useKeyboardOpen'
import SpeechSupportNote from '@/components/common/SpeechSupportNote.vue'
import ChatMessages from './ChatMessages.vue'
import ChatComposer from './ChatComposer.vue'
import { useUserStore } from '@/stores/user'

/**
 * Khung "Trò chuyện với AI" — coach hội thoại tiếng Anh theo bài học.
 * Mỗi lượt người học gửi đi, AI vừa CHẤM câu (sửa lỗi + điểm CEFR + lời phê theo
 * phong cách hài hước) vừa NÓI TIẾP (kèm gợi ý từ nên dùng). Có nghe/nói, tra từ
 * tại chỗ, lưu/đánh dấu sao từ, và chọn phong cách lời phê.
 *
 * Logic phiên chat + gọi API nằm ở useChatEngine.js; render danh sách tin nhắn
 * + tra/lưu từ ở ChatMessages.vue; ô nhập/mic ở ChatComposer.vue. File này chỉ
 * còn lo layout + wiring.
 */
const props = defineProps({
  // { title, week, weekTitle, vocab: string[], grammar: string[] }
  context: { type: Object, default: () => ({}) },
})

const router = useRouter()
const user = useUserStore()
const chatMessages = ref(null)
const { isOnline } = useOnlineStatus()
const { isKeyboardOpen, keyboardInset } = useKeyboardOpen()

// Bàn phím ảo mở lên: composer dán ngay mép bàn phím (không bị che khuất — xem
// useKeyboardOpen.js) + cuộn tin nhắn xuống cuối để thấy ngay tin mới nhất.
watch(isKeyboardOpen, async (open) => {
  if (!open) return
  await nextTick()
  chatMessages.value?.scrollToEnd()
})

const {
  messages,
  input,
  loading,
  error,
  retry,
  autoSpeak,
  listening,
  savedToast,
  voiceFirst,
  answerTimer,
  persona,
  setPersona,
  speakable,
  listenable,
  unlockedRoleplay,
  roleplayOn,
  currentScenario,
  toggleRoleplay,
  send,
  changePersona,
  showHint,
  showIdea,
  showTranslation,
  replay,
  useIdeaAsAnswer,
  flashToast,
  savingSentence,
  saveSentence,
  toggleMic,
  toggleVoiceFirst,
  reset,
} = useChatEngine(props)

function openSavedDeck() {
  router.push({ name: 'tools-tab', params: { tool: 'flashcard' }, query: { deck: 'saved' } })
}

function closePop() {
  chatMessages.value?.closePop()
}
</script>

<template>
  <section class="step-card ai-chat" :class="{ 'kb-open': isKeyboardOpen }" @click="closePop">
    <div class="step-head">
      <div>
        <div class="eyebrow">LUYỆN GIAO TIẾP</div>
        <h2 class="step-title">💬 Trò chuyện với AI</h2>
      </div>
      <div class="head-tools">
        <button
          v-if="listenable"
          class="tool-toggle"
          :class="{ on: voiceFirst }"
          :title="voiceFirst ? 'Voice-first: tự bật mic + đếm 10s sau mỗi lượt AI. Bấm để chỉ gõ chữ' : 'Đang chỉ gõ chữ. Bấm để bật lại voice-first'"
          @click.stop="toggleVoiceFirst"
        >
          {{ voiceFirst ? '🎤 Nói ngay' : '💬 Gõ chữ' }}
        </button>
        <button
          v-if="speakable"
          class="tool-toggle"
          :class="{ on: autoSpeak }"
          :title="autoSpeak ? 'Đang tự đọc câu trả lời' : 'Tự đọc câu trả lời: tắt'"
          @click.stop="autoSpeak = !autoSpeak"
        >
          {{ autoSpeak ? '🔊 Đọc' : '🔇 Đọc' }}
        </button>
        <button
          class="tool-toggle"
          :class="{ on: roleplayOn, locked: !unlockedRoleplay }"
          :disabled="!unlockedRoleplay"
          :title="unlockedRoleplay ? (roleplayOn ? 'Đang ở tình huống bất ngờ — bấm để tắt' : 'Vào tình huống bất ngờ: AI đổi vai, không báo trước câu hỏi') : 'Mở khóa từ Tuần 4'"
          @click.stop="toggleRoleplay"
        >
          {{ roleplayOn ? '🎭 Đang bất ngờ' : unlockedRoleplay ? '🎭 Tình huống bất ngờ' : '🔒 Tình huống bất ngờ' }}
        </button>
        <button class="tool-toggle" title="Bắt đầu lại từ đầu" @click.stop="reset">↺ Mới</button>
      </div>
    </div>

    <!-- Nhãn kịch bản đang luyện ở chế độ Surprise mode -->
    <div v-if="roleplayOn && currentScenario" class="scenario-tag">{{ currentScenario.label }} — không biết trước câu hỏi kế tiếp, hãy phản xạ tự nhiên!</div>

    <!-- Thanh chọn phong cách lời phê (đổi được bất cứ lúc nào) -->
    <div class="persona-bar">
      <span class="persona-bar-label">Phong cách AI:</span>
      <button
        v-for="p in PERSONAS"
        :key="p.key"
        class="pchip"
        :class="{ on: persona === p.key }"
        :title="p.desc"
        @click.stop="setPersona(p.key)"
      >{{ p.label }}</button>
    </div>

    <!-- ———————————— HỘI THOẠI ———————————— -->
    <button v-if="user.savedCount" class="saved-pill" @click.stop="openSavedDeck">
      📚 {{ user.savedCount }} từ đã lưu — học bằng Flashcard →
    </button>
    <p class="hint">Chạm vào <b>từ</b> để tra nghĩa / lưu. {{ listenable ? 'Bấm 🎤 để nói.' : 'Gõ câu trả lời ở ô bên dưới.' }}</p>
    <SpeechSupportNote
      :visible="!listenable"
      text="Trình duyệt này chưa hỗ trợ nói chuyện bằng giọng nói — hãy dùng Chrome/Edge trên máy tính hoặc Android nếu muốn luyện nói. Ở đây em vẫn gõ chữ để trò chuyện với AI bình thường."
    />

    <ChatMessages
      ref="chatMessages"
      :messages="messages"
      :speakable="speakable"
      :persona="persona"
      :saving-sentence="savingSentence"
      :loading="loading"
      :show-hint="showHint"
      :show-idea="showIdea"
      :show-translation="showTranslation"
      :replay="replay"
      :use-idea-as-answer="useIdeaAsAnswer"
      :save-sentence="saveSentence"
      :change-persona="changePersona"
      :flash-toast="flashToast"
    />

    <div v-if="error" class="chat-error-box">
      <p class="chat-error">⚠️ {{ error }}</p>
      <button v-if="retry" type="button" class="chat-retry-btn" @click="retry?.()">🔄 Thử lại</button>
    </div>

    <div class="composer-dock" :style="isKeyboardOpen ? { bottom: keyboardInset + 'px' } : null">
      <ChatComposer
        v-model="input"
        :loading="loading"
        :listening="listening"
        :listenable="listenable"
        :answer-timer="answerTimer"
        :online="isOnline"
        @submit="send"
        @toggle-mic="toggleMic"
      />
    </div>

    <Transition name="toast">
      <div v-if="savedToast" class="save-toast">{{ savedToast }}</div>
    </Transition>
  </section>
</template>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--surface);
  border-radius: 22px;
  padding: 26px var(--space-page-x);
  border: 1px solid rgba(108, 92, 231, 0.1);
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.06);
}
.head-tools {
  display: flex;
  gap: 8px;
  flex: none;
}
@media (max-width: 720px) {
  /* 4 nút (Nói ngay/Đọc/Bất ngờ/Mới) không vừa 1 hàng ở 375px — xuống hàng riêng dưới tiêu đề rồi tự bọc. */
  .head-tools {
    width: 100%;
    flex-wrap: wrap;
  }
}
.tool-toggle {
  position: relative;
  border: 1px solid rgba(0, 214, 143, 0.3);
  background: var(--surface);
  color: var(--text-success);
  font-size: 12.5px;
  font-weight: 700;
  padding: 7px 12px;
  min-height: 44px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}
@media (hover: hover) {
  .tool-toggle:hover {
    background: #e6fbf2;
  }
}
.tool-toggle:active {
  background: #e6fbf2;
}
.tool-toggle.on {
  background: linear-gradient(135deg, #00d68f, #00a86f);
  border-color: transparent;
  color: #fff;
}
.tool-toggle.locked {
  opacity: 0.55;
  cursor: not-allowed;
}
@media (hover: hover) {
  .tool-toggle.locked:hover {
    background: var(--surface);
  }
}

/* —— Nhãn kịch bản Surprise mode —— */
.scenario-tag {
  margin-top: 12px;
  background: linear-gradient(135deg, #fff7e8, #fff1f1);
  border: 1px solid rgba(255, 176, 32, 0.35);
  border-left: 3px solid #ffb020;
  color: #7a5200;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
  padding: 9px 13px;
  border-radius: 12px;
}
[data-theme='dark'] .scenario-tag {
  background: var(--bg-warning);
  color: var(--text-warning);
}

/* —— Thanh chọn phong cách lời phê —— */
.persona-bar {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.persona-bar-label {
  font-size: 12.5px;
  font-weight: 800;
  color: var(--ink-2);
  margin-right: 2px;
}
.pchip {
  font-size: 12.5px;
  font-weight: 700;
  color: #6c5ce7;
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.25);
  border-radius: 999px;
  padding: 5px 11px;
  cursor: pointer;
  transition: all 0.13s;
}
@media (hover: hover) {
  .pchip:hover {
    background: #f5f3ff;
  }
}
.pchip:active {
  background: #f5f3ff;
}
.pchip.on {
  background: #6c5ce7;
  border-color: transparent;
  color: #fff;
}

/* —— Lối tắt & gợi ý —— */
.saved-pill {
  align-self: flex-start;
  margin-top: 12px;
  cursor: pointer;
  border: 1px solid rgba(108, 92, 231, 0.25);
  background: linear-gradient(135deg, #f5f3ff, #eef6ff);
  color: var(--purple);
  font-size: 13px;
  font-weight: 800;
  padding: 9px 14px;
  border-radius: 11px;
}
.hint {
  font-size: 13px;
  line-height: 1.6;
  color: var(--muted);
  margin-top: 10px;
}

.chat-error-box {
  margin-top: 12px;
  background: var(--bg-danger);
  border: 1px solid var(--border-danger);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.chat-error {
  color: var(--text-danger);
  font-size: 13.5px;
}
.chat-retry-btn {
  flex-shrink: 0;
  background: var(--danger-strong);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
@media (hover: hover) {
  .chat-retry-btn:hover {
    background: var(--danger-strong);
    filter: brightness(0.9);
  }
}
.chat-retry-btn:active {
  background: var(--danger-strong);
  filter: brightness(0.85);
}

/* Toast */
.save-toast {
  position: absolute;
  left: 50%;
  bottom: 78px;
  transform: translateX(-50%);
  background: #2d2d44;
  color: #fff;
  font-size: 13.5px;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 999px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
  z-index: 25;
  white-space: nowrap;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

/* —— Composer dính đáy trên mobile —— */
@media (max-width: 720px) {
  .composer-dock {
    position: sticky;
    /* Mặc định dán ngay trên BottomNav; trang buổi học có thêm MobileCheckpointBar
       (xem body.has-mcb-bar bên dưới) nên phải chừa thêm chỗ. Khi bàn phím ảo mở,
       AiChat.vue ghi đè bằng inline style `bottom: keyboardInset` (JS) để dán sát
       mép bàn phím thay vì bị bàn phím che (xem useKeyboardOpen.js). */
    bottom: calc(72px + var(--safe-bottom));
    z-index: 40;
    margin: 12px calc(-1 * var(--space-page-x)) calc(-1 * var(--space-page-x));
    padding: 10px var(--space-page-x) calc(10px + var(--safe-bottom));
    background: var(--surface);
    border-top: 1px solid var(--line);
    backdrop-filter: blur(14px);
  }
  body.has-mcb-bar .composer-dock {
    bottom: calc(128px + var(--safe-bottom));
  }
  /* Bàn phím mở: nhường chỗ cho tin nhắn + ô nhập bằng cách gọn phần đầu thẻ lại */
  .ai-chat.kb-open .scenario-tag,
  .ai-chat.kb-open .persona-bar,
  .ai-chat.kb-open .saved-pill,
  .ai-chat.kb-open .hint {
    display: none;
  }
}
</style>
