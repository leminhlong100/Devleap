<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { defaultCode } from '@/data/tools'

// Khi mở từ một ngày học, view truyền code mẫu của ngày đó vào.
const props = defineProps({ initial: { type: Object, default: null } })

const user = useUserStore()
const startCode = () => props.initial?.code || defaultCode
const fileName = computed(() => props.initial?.file || 'Main.java')
const code = ref(startCode())
const output = ref([])
const hasRun = ref(false)
const rewarded = ref(false)

// Đổi ngày học -> nạp lại code mẫu mới.
watch(
  () => props.initial,
  () => {
    code.value = startCode()
    output.value = []
    hasRun.value = false
  },
)

// Mô phỏng chạy: bắt các System.out.print(ln) và in ra chuỗi literal.
function run() {
  const src = code.value || ''
  const re = /System\.out\.print(?:ln)?\s*\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g
  const out = []
  let m
  while ((m = re.exec(src)) !== null) {
    out.push(m[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"'))
  }
  if (out.length === 0) out.push('(không có System.out.println nào — thử thêm một dòng in nhé!)')
  output.value = out
  hasRun.value = true
  if (!rewarded.value) {
    user.addXp(15)
    rewarded.value = true
  }
}
function reset() {
  code.value = startCode()
  output.value = []
  hasRun.value = false
}
</script>

<template>
  <div class="pg">
    <div class="pg-head">
      <div>
        <h2 class="tool-title">💻 Code Playground · Java</h2>
        <p class="tool-sub">Gõ code rồi bấm <b>Chạy</b> để xem kết quả in ra ngay trong trình duyệt.</p>
      </div>
      <span class="task-tag">{{ props.initial ? `📌 Code mẫu: ${fileName}` : '📌 Bài tập: in lời chào' }}</span>
    </div>

    <div class="pg-grid">
      <div class="editor">
        <div class="bar">
          <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
          <span class="file">{{ fileName }}</span>
        </div>
        <textarea v-model="code" spellcheck="false" class="code-area"></textarea>
      </div>

      <div class="console">
        <div class="console-label">KẾT QUẢ / CONSOLE</div>
        <template v-if="hasRun">
          <div v-for="(ln, i) in output" :key="i" class="line"><span class="caret">›</span> {{ ln }}</div>
          <div class="ok">✓ Chạy thành công · +15 XP</div>
        </template>
        <div v-else class="empty">
          <span class="cat-emoji">🐱</span>
          <span>Bấm <b>▶ Chạy code</b> để xem<br />chương trình của bạn in ra gì.</span>
        </div>
      </div>
    </div>

    <div class="pg-cta">
      <button class="reset" @click="reset">↺ Đặt lại</button>
      <button class="run" @click="run">▶ Chạy code</button>
    </div>
  </div>
</template>

<style scoped>
.pg {
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 18px 50px rgba(108, 92, 231, 0.1);
}
.pg-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 20px;
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
.task-tag {
  background: rgba(108, 92, 231, 0.1);
  color: var(--purple);
  font-size: 12.5px;
  font-weight: 800;
  padding: 7px 14px;
  border-radius: 99px;
  white-space: nowrap;
}
.pg-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 18px;
}
.editor {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #2a2a3e;
  background: #1e1e2e;
}
.bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 16px;
  background: #15151f;
  border-bottom: 1px solid #2a2a3e;
}
.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.dot.r {
  background: #ff5f57;
}
.dot.y {
  background: #febc2e;
}
.dot.g {
  background: #28c840;
}
.file {
  margin-left: 8px;
  color: var(--muted-2);
  font-size: 12.5px;
  font-weight: 600;
}
.code-area {
  width: 100%;
  height: 300px;
  resize: none;
  border: none;
  outline: none;
  background: #1e1e2e;
  color: #e6e6f0;
  font-family: var(--mono);
  font-size: 13.5px;
  line-height: 1.6;
  padding: 16px 18px;
  tab-size: 4;
  display: block;
}
.console {
  border-radius: 16px;
  border: 1px solid #2a2a3e;
  background: #15151f;
  padding: 16px 18px;
  min-height: 340px;
  font-family: var(--mono);
  font-size: 13.5px;
  line-height: 1.65;
  overflow: auto;
}
.console-label {
  color: #6a6a82;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}
.line {
  color: #d6f5e6;
  white-space: pre-wrap;
}
.caret {
  color: var(--green);
}
.ok {
  color: var(--green);
  margin-top: 14px;
  font-weight: 700;
}
.empty {
  color: #5a5a72;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  height: 260px;
  line-height: 1.6;
}
.empty b {
  color: var(--muted-2);
}
.cat-emoji {
  font-size: 34px;
  margin-bottom: 8px;
}
.pg-cta {
  display: flex;
  gap: 12px;
  margin-top: 18px;
  justify-content: flex-end;
}
.reset,
.run {
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  border-radius: 13px;
}
.reset {
  border: 1px solid rgba(108, 92, 231, 0.2);
  color: #6a6a82;
  padding: 13px 22px;
  background: #fff;
}
.reset:hover {
  background: var(--purple-soft);
}
.run {
  border: none;
  font-weight: 800;
  color: #fff;
  padding: 13px 28px;
  background: var(--grad-green);
  box-shadow: 0 10px 24px rgba(0, 214, 143, 0.32);
  transition: transform 0.18s;
}
.run:hover {
  transform: translateY(-2px);
}
@media (max-width: 760px) {
  .pg-grid {
    grid-template-columns: 1fr;
  }
}
</style>
