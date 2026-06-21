<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { speak, canSpeak } from '@/lib/speak'

/**
 * Xem lại danh sách từ vựng & câu người học đã lưu khi trò chuyện với AI.
 * Tách 2 mục: Từ vựng (kind != 'sentence') và Câu (kind == 'sentence').
 * Có tìm kiếm, nghe phát âm, bỏ lưu, và lối tắt học lại bằng Flashcard.
 */
const user = useUserStore()
const router = useRouter()
const speakable = canSpeak()

const query = ref('')
const has = (s, q) => String(s || '').toLowerCase().includes(q)
const matches = (it, q) => !q || has(it.term, q) || has(it.vi, q) || has(it.context, q)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return user.savedWordList.filter((it) => matches(it, q))
})
const words = computed(() => filtered.value.filter((it) => it.kind !== 'sentence'))
const sentences = computed(() => filtered.value.filter((it) => it.kind === 'sentence'))

function say(text) {
  speak(text)
}
function remove(term) {
  user.removeSavedWord(term)
}
function studyFlashcards() {
  router.push({ name: 'tools-tab', params: { tool: 'flashcard' }, query: { deck: 'saved' } })
}
</script>

<template>
  <div class="saved">
    <div class="saved-head">
      <div>
        <h2 class="tool-title">🔖 Từ vựng &amp; câu đã lưu</h2>
        <p class="tool-sub">Những từ và câu bạn đã lưu khi trò chuyện với AI — xem lại bất cứ lúc nào.</p>
      </div>
      <button v-if="user.savedCount" class="study-btn" @click="studyFlashcards">🃏 Học bằng Flashcard →</button>
    </div>

    <!-- Chưa lưu gì -->
    <div v-if="!user.savedCount" class="empty">
      <div class="emoji">📚</div>
      <h3>Chưa có từ hay câu nào được lưu</h3>
      <p>
        Vào <b>💬 Trò chuyện với AI</b>, bật <b>📌 Lưu từ</b> rồi bấm vào từ (hoặc <b>💾 Lưu câu</b>) để
        thêm vào đây học lại.
      </p>
      <button class="go-chat" @click="router.push({ name: 'tools-tab', params: { tool: 'chat' } })">
        Tới Trò chuyện với AI →
      </button>
    </div>

    <template v-else>
      <div class="search">
        <span class="icon">🔍</span>
        <input v-model="query" placeholder="Tìm trong danh sách đã lưu…" />
      </div>

      <!-- TỪ VỰNG -->
      <section v-if="words.length" class="group">
        <div class="group-head">
          <h3 class="group-title">📝 Từ vựng</h3>
          <span class="count">{{ words.length }} từ</span>
        </div>
        <div class="grid">
          <div v-for="w in words" :key="w.srsId" class="entry">
            <div class="entry-top">
              <h4 class="term">{{ w.term }}</h4>
              <div class="entry-tools">
                <button v-if="speakable" class="mini" title="Nghe phát âm" @click="say(w.term)">🔊</button>
                <button class="mini danger" title="Bỏ lưu" @click="remove(w.term)">🗑</button>
              </div>
            </div>
            <div v-if="w.ipa" class="ipa">{{ w.ipa }}</div>
            <div v-if="w.vi" class="vi">{{ w.vi }}</div>
            <div v-else class="vi vi-empty">(chưa có nghĩa)</div>
            <p v-if="w.context || w.ex" class="ctx">“{{ w.context || w.ex }}”</p>
          </div>
        </div>
      </section>

      <!-- CÂU -->
      <section v-if="sentences.length" class="group">
        <div class="group-head">
          <h3 class="group-title">💬 Câu</h3>
          <span class="count">{{ sentences.length }} câu</span>
        </div>
        <div class="sent-list">
          <div v-for="s in sentences" :key="s.srsId" class="sent">
            <div class="sent-body">
              <p class="sent-en">{{ s.term }}</p>
              <p v-if="s.vi" class="sent-vi">{{ s.vi }}</p>
            </div>
            <div class="entry-tools">
              <button v-if="speakable" class="mini" title="Nghe lại" @click="say(s.term)">🔊</button>
              <button class="mini danger" title="Bỏ lưu" @click="remove(s.term)">🗑</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Có lưu nhưng tìm không khớp -->
      <div v-if="!words.length && !sentences.length" class="empty small">
        <div class="emoji">🙉</div>
        <p>Không tìm thấy mục nào khớp “<b>{{ query }}</b>”.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.saved {
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 28px;
  padding: 36px;
  box-shadow: 0 18px 50px rgba(108, 92, 231, 0.1);
}
.saved-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 22px;
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
.study-btn {
  flex: none;
  cursor: pointer;
  border: none;
  color: #fff;
  background: var(--grad-purple);
  font-size: 13.5px;
  font-weight: 800;
  padding: 11px 16px;
  border-radius: 12px;
  transition: transform 0.12s, box-shadow 0.15s;
}
.study-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(108, 92, 231, 0.3);
}
.search {
  position: relative;
  margin-bottom: 24px;
}
.icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 17px;
}
.search input {
  width: 100%;
  padding: 14px 18px 14px 48px;
  border-radius: 15px;
  border: 1.5px solid rgba(108, 92, 231, 0.16);
  background: var(--bg);
  font-family: inherit;
  font-size: 15px;
  color: var(--ink);
  outline: none;
}
.search input:focus {
  border-color: var(--purple);
  background: #fff;
}
.group {
  margin-bottom: 26px;
}
.group:last-child {
  margin-bottom: 0;
}
.group-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}
.group-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--ink);
}
.count {
  font-size: 12.5px;
  color: var(--muted-2);
  font-weight: 700;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.entry {
  background: var(--bg);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 16px 18px;
  transition: all 0.15s;
}
.entry:hover {
  border-color: rgba(108, 92, 231, 0.25);
  background: #fff;
}
.entry-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.term {
  font-size: 18px;
  font-weight: 800;
  color: var(--purple);
  word-break: break-word;
}
.entry-tools {
  display: flex;
  gap: 6px;
  flex: none;
}
.mini {
  border: none;
  background: rgba(108, 92, 231, 0.1);
  cursor: pointer;
  font-size: 13px;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  transition: background 0.12s;
}
.mini:hover {
  background: rgba(108, 92, 231, 0.2);
}
.mini.danger:hover {
  background: #fff1f1;
}
.ipa {
  font-size: 13px;
  color: var(--muted);
  margin-top: 4px;
}
.vi {
  font-size: 14.5px;
  font-weight: 700;
  margin-top: 6px;
  color: var(--ink);
}
.vi-empty {
  color: var(--muted-2);
  font-weight: 600;
  font-style: italic;
}
.ctx {
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);
  font-style: italic;
  margin-top: 8px;
}
.sent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sent {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  background: var(--bg);
  border: 1px solid var(--line-soft);
  border-left: 3px solid var(--purple);
  border-radius: 14px;
  padding: 14px 16px;
}
.sent-body {
  min-width: 0;
}
.sent-en {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.5;
}
.sent-vi {
  font-size: 14px;
  color: var(--muted);
  margin-top: 6px;
  line-height: 1.5;
}
.empty {
  text-align: center;
  padding: 44px 10px;
  color: var(--muted-2);
}
.empty.small {
  padding: 36px 0;
}
.emoji {
  font-size: 48px;
}
.empty h3 {
  font-size: 20px;
  font-weight: 800;
  margin-top: 10px;
  color: var(--ink);
}
.empty p {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.6;
}
.go-chat {
  margin-top: 18px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  padding: 12px 22px;
  border-radius: 13px;
  background: var(--grad-purple);
}
@media (max-width: 600px) {
  .saved {
    padding: 24px;
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
