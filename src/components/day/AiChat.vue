<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChatEngine, PERSONAS } from '@/composables/useChatEngine'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useKeyboardOpen } from '@/composables/useKeyboardOpen'
import { setSpeechProfile, clearSpeechProfile, speak } from '@/lib/speak'
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
  // { title, week, weekTitle, vocab: string[], grammar: string[], fixedScenario? }
  context: { type: Object, default: () => ({}) },
})
// Khóa comm nghe sự kiện này để ghi 3 lỗi vào sổ lỗi + điểm rubric buổi Boss.
const emit = defineEmits(['debrief'])

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
  fluency,
  persona,
  setPersona,
  speakable,
  listenable,
  unlockedRoleplay,
  roleplayOn,
  currentScenario,
  deferCorrection,
  toggleDeferCorrection,
  debrief,
  debriefLoading,
  debriefError,
  debriefAvailable,
  runDebrief,
  saveUpgrade,
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
  reset,
} = useChatEngine(props)

// Debrief xong -> báo lên trang buổi (CommDayView) để lưu chiến lợi phẩm.
watch(debrief, (v) => {
  if (v) emit('debrief', v)
})

// —— Giọng đa vùng + tốc độ (khóa comm, Trục C) ——
// Chỉ bật hồ sơ giọng cho buổi có kịch bản cố định (comm): mỗi buổi một vùng giọng
// khác nhau (ổn định trong buổi), thêm nút 0.8x/1.0x để tập nghe nhanh dần.
const isComm = computed(() => !!props.context?.fixedScenario)
const slowVoice = ref(false) // true = 0.8x
function applyProfile() {
  if (!isComm.value) return
  const seed = Number(props.context?.week || 0) * 10 + Number(props.context?.day || 0)
  setSpeechProfile({ seed, rate: slowVoice.value ? 0.8 : 1 })
}
function toggleSlowVoice() {
  slowVoice.value = !slowVoice.value
  applyProfile()
}
// Đọc lại câu cuối của AI (chậm) — cứu nguy khi nghe không kịp trong lúc nhập vai.
function slowRepeatLast() {
  const last = [...messages.value].reverse().find((m) => m.role === 'assistant')
  if (last?.message) speak(last.message, 0.72)
}
onMounted(applyProfile)
watch(() => props.context?.title, applyProfile)
onUnmounted(clearSpeechProfile)

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
          v-if="speakable"
          class="tool-toggle"
          :class="{ on: autoSpeak }"
          :title="autoSpeak ? 'Đang tự đọc câu trả lời' : 'Tự đọc câu trả lời: tắt'"
          @click.stop="autoSpeak = !autoSpeak"
        >
          {{ autoSpeak ? '🔊 Đọc' : '🔇 Đọc' }}
        </button>
        <button
          v-if="speakable && isComm"
          class="tool-toggle"
          :class="{ on: slowVoice }"
          :title="slowVoice ? 'AI đang đọc chậm (0.8x). Bấm để về tốc độ thường' : 'AI đọc tốc độ thường (1.0x). Bấm để nghe chậm 0.8x'"
          @click.stop="toggleSlowVoice"
        >
          {{ slowVoice ? '🐢 0.8x' : '⚡ 1.0x' }}
        </button>
        <button
          v-if="speakable && isComm && roleplayOn"
          class="tool-toggle"
          title="Nghe không kịp? Đọc lại câu vừa rồi của AI, chậm hơn"
          @click.stop="slowRepeatLast"
        >
          🐢 Nói chậm lại
        </button>
        <button
          v-if="isComm && roleplayOn"
          class="tool-toggle"
          :class="{ on: !deferCorrection }"
          :title="deferCorrection ? 'Đang CHỈ TRÒ CHUYỆN — AI không soi lỗi từng câu (sửa dồn vào cuối buổi). Bấm để vừa nói vừa soi' : 'Đang VỪA NÓI VỪA SOI — AI chấm từng câu. Bấm để chỉ trò chuyện'"
          @click.stop="toggleDeferCorrection"
        >
          {{ deferCorrection ? '🗣️ Chỉ trò chuyện' : '✍️ Vừa nói vừa soi' }}
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

    <!-- Chủ đề đang lưu từ/câu vào (tạo chủ đề ở 🔖 Từ vựng & câu đã lưu) -->
    <div v-if="user.topicList.length" class="topic-bar" @click.stop>
      <span class="topic-bar-label">💾 Lưu vào chủ đề:</span>
      <select
        class="topic-bar-select"
        :value="user.convoPrefs.activeSaveTopic"
        @change="user.setConvoPrefs({ activeSaveTopic: $event.target.value })"
      >
        <option value="">— Không chủ đề —</option>
        <option v-for="t in user.topicList" :key="t" :value="t">{{ t }}</option>
      </select>
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

    <!-- ———————————— DEBRIEF: kết thúc & nhận xét (khóa Giao Tiếp) ———————————— -->
    <div v-if="debriefAvailable || debrief || debriefLoading || debriefError" class="debrief-zone">
      <button
        v-if="!debrief"
        type="button"
        class="debrief-btn"
        :class="{ loading: debriefLoading }"
        :disabled="debriefLoading"
        @click.stop="runDebrief"
      >
        {{ debriefLoading ? '🤖 Đang tổng kết buổi…' : '📋 Kết thúc & nhận xét' }}
      </button>
      <p v-if="debriefError" class="debrief-error">⚠️ {{ debriefError }}</p>

      <div v-if="debrief" class="debrief-card">
        <div class="debrief-head">
          <div>
            <div class="debrief-eyebrow">CHIẾN LỢI PHẨM CỦA BUỔI</div>
            <h3 class="debrief-title">📋 Nhận xét & rubric</h3>
          </div>
          <div class="debrief-score" :class="{ pass: debrief.score >= 70 }">{{ debrief.score }}<small>/100</small></div>
        </div>

        <p v-if="debrief.summary" class="debrief-summary">{{ debrief.summary }}</p>

        <p v-if="debrief.intelligibility" class="debrief-intel">🗣️ <b>Độ dễ hiểu:</b> {{ debrief.intelligibility }}</p>
        <p v-if="debrief.fluency" class="debrief-intel fl">
          🏃 <b>Trôi chảy:</b> {{ debrief.fluency }}
          <span v-if="fluency" class="fl-chip">~{{ fluency.avgWpm }} từ/phút</span>
        </p>
        <p v-if="debrief.confidenceTip" class="debrief-intel tip">💪 <b>Vượt lo âu:</b> {{ debrief.confidenceTip }}</p>

        <div v-if="debrief.rubric.length" class="debrief-rubric">
          <div v-for="(r, i) in debrief.rubric" :key="i" class="rb-row" :class="{ met: r.met }">
            <span class="rb-ico">{{ r.met ? '✅' : '⬜' }}</span><span>{{ r.criterion }}</span>
          </div>
        </div>

        <template v-if="debrief.errors.length">
          <div class="debrief-sub">📓 3 lỗi chính (đã đưa vào sổ lỗi bên dưới để tự sửa):</div>
          <ul class="debrief-errors">
            <li v-for="(e, i) in debrief.errors" :key="i">
              <s>{{ e.wrong }}</s> → <b>{{ e.right }}</b>
              <span v-if="e.note" class="err-note">— {{ e.note }}</span>
            </li>
          </ul>
        </template>

        <template v-if="debrief.upgrades.length">
          <div class="debrief-sub">⬆️ 3 câu nâng cấp — lưu vào ôn tập (Flashcard):</div>
          <div class="debrief-upgrades">
            <div v-for="(u, i) in debrief.upgrades" :key="i" class="up-row">
              <div class="up-text">
                <div class="up-en">{{ u.en }}</div>
                <div v-if="u.vi" class="up-vi">{{ u.vi }}</div>
              </div>
              <button
                class="up-save"
                :class="{ saved: user.isWordSaved(u.en) }"
                @click.stop="saveUpgrade(u.en, u.vi)"
              >
                {{ user.isWordSaved(u.en) ? '✓ Đã lưu' : '＋ Lưu' }}
              </button>
            </div>
          </div>
        </template>

        <button type="button" class="debrief-again ghost-btn" :disabled="debriefLoading" @click.stop="runDebrief">
          🔄 Chấm lại
        </button>
      </div>
    </div>

    <div class="composer-dock" :style="isKeyboardOpen ? { bottom: keyboardInset + 'px' } : null">
      <ChatComposer
        v-model="input"
        :loading="loading"
        :listening="listening"
        :listenable="listenable"
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

/* —— Chọn chủ đề đang lưu từ/câu vào —— */
.topic-bar {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.topic-bar-label {
  font-size: 12.5px;
  font-weight: 800;
  color: var(--ink-2);
}
.topic-bar-select {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  background: var(--bg);
  border: 1.5px solid rgba(108, 92, 231, 0.2);
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
  outline: none;
}
.topic-bar-select:focus {
  border-color: var(--purple);
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

/* —— Debrief (khóa Giao Tiếp Thực Chiến) —— */
.debrief-zone {
  margin-top: 14px;
}
.debrief-btn {
  width: 100%;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  padding: 14px 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6c5ce7, #4b3bc4);
  box-shadow: 0 10px 24px rgba(108, 92, 231, 0.28);
}
.debrief-btn.loading {
  opacity: 0.7;
  cursor: progress;
}
.debrief-error {
  margin-top: 10px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-danger);
  background: var(--bg-danger);
  border-radius: 12px;
  padding: 10px 14px;
}
.debrief-card {
  border: 1px solid rgba(108, 92, 231, 0.2);
  background: linear-gradient(135deg, #f7f5ff, var(--surface));
  border-radius: 18px;
  padding: 18px 18px 16px;
}
[data-theme='dark'] .debrief-card {
  background: var(--surface);
}
.debrief-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.debrief-eyebrow {
  font-size: 11.5px;
  font-weight: 800;
  color: var(--muted-2);
  letter-spacing: 0.4px;
}
.debrief-title {
  font-size: 18px;
  font-weight: 800;
  margin-top: 3px;
}
.debrief-score {
  flex: none;
  font-size: 26px;
  font-weight: 800;
  color: var(--text-danger);
}
.debrief-score.pass {
  color: var(--text-success);
}
.debrief-score small {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted-2);
}
.debrief-summary {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--slate);
  background: var(--bg);
  border-left: 3px solid #6c5ce7;
  border-radius: 10px;
  padding: 10px 14px;
}
.debrief-intel {
  margin-top: 10px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--slate);
  background: rgba(0, 214, 143, 0.08);
  border-left: 3px solid #00d68f;
  border-radius: 10px;
  padding: 9px 13px;
}
.debrief-intel.fl {
  background: rgba(255, 176, 32, 0.1);
  border-left-color: #ffb020;
}
.debrief-intel.tip {
  background: rgba(108, 92, 231, 0.08);
  border-left-color: #6c5ce7;
}
.fl-chip {
  display: inline-block;
  margin-left: 6px;
  background: rgba(255, 176, 32, 0.2);
  color: #b25f00;
  font-weight: 800;
  font-size: 12px;
  padding: 2px 9px;
  border-radius: 99px;
  white-space: nowrap;
}
.debrief-rubric {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.rb-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--muted);
}
.rb-row.met {
  color: var(--ink);
  font-weight: 600;
}
.rb-ico {
  flex: none;
}
.debrief-sub {
  margin-top: 16px;
  font-size: 13px;
  font-weight: 800;
  color: var(--ink-2);
}
.debrief-errors {
  margin: 8px 0 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.debrief-errors li {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--slate);
}
.debrief-errors s {
  color: var(--text-danger);
}
.debrief-errors b {
  color: var(--text-success);
}
.err-note {
  color: var(--muted-2);
  font-size: 12.5px;
}
.debrief-upgrades {
  margin-top: 9px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.up-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
}
.up-en {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.up-vi {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}
.up-save {
  flex: none;
  border: 1px solid var(--purple);
  background: var(--surface);
  color: var(--purple);
  font-size: 12.5px;
  font-weight: 800;
  padding: 7px 12px;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
}
.up-save.saved {
  background: var(--purple);
  color: #fff;
}
.debrief-again {
  margin-top: 14px;
  border: 1px solid rgba(108, 92, 231, 0.4);
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--purple);
  padding: 9px 16px;
  border-radius: 11px;
  background: var(--surface);
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
