<script setup>
import { ref, computed } from 'vue'
import { dictionary } from '@/data/tools'

const query = ref('')
const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return dictionary
  return dictionary.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.vi.toLowerCase().includes(q) ||
      t.cat.toLowerCase().includes(q) ||
      t.def.toLowerCase().includes(q),
  )
})
</script>

<template>
  <div class="dict">
    <div class="dict-head">
      <div>
        <h2 class="tool-title">📖 Từ điển thuật ngữ IT</h2>
        <p class="tool-sub">Tra cứu nhanh khái niệm lập trình bằng tiếng Việt.</p>
      </div>
      <span class="count">{{ results.length }} thuật ngữ</span>
    </div>

    <div class="search">
      <span class="icon">🔍</span>
      <input v-model="query" placeholder="Tìm thuật ngữ... (vd: OOP, deploy, stream)" />
    </div>

    <div v-if="results.length" class="grid">
      <div v-for="d in results" :key="d.term" class="entry">
        <div class="entry-top">
          <h3 class="term">{{ d.term }}</h3>
          <span class="cat">{{ d.cat }}</span>
        </div>
        <div class="vi">{{ d.vi }}</div>
        <p class="def">{{ d.def }}</p>
      </div>
    </div>
    <div v-else class="empty">
      <div class="emoji">🙉</div>
      <p>Không tìm thấy thuật ngữ nào khớp “<b>{{ query }}</b>”.</p>
    </div>
  </div>
</template>

<style scoped>
.dict {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 28px;
  padding: 36px;
  box-shadow: 0 18px 50px rgba(108, 92, 231, 0.1);
}
.dict-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 18px;
}
.tool-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.tool-sub {
  font-size: 14.5px;
  color: var(--slate);
  margin-top: 5px;
}
.count {
  font-size: 13px;
  color: var(--muted-2);
  font-weight: 700;
  white-space: nowrap;
}
.search {
  position: relative;
  margin-bottom: 22px;
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
  padding: 15px 18px 15px 48px;
  border-radius: 15px;
  border: 1.5px solid rgba(108, 92, 231, 0.16);
  background: var(--bg);
  font-family: inherit;
  font-size: 16px;
  color: var(--ink);
  outline: none;
}
.search input:focus {
  border-color: var(--purple);
  background: var(--surface);
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
  padding: 18px 20px;
  transition: all 0.15s;
}
@media (hover: hover) {
  .entry:hover {
    border-color: rgba(108, 92, 231, 0.25);
    background: var(--surface);
  }
}
.entry:active {
  border-color: rgba(108, 92, 231, 0.25);
  background: var(--surface);
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
}
.cat {
  font-size: 11px;
  font-weight: 700;
  color: #9a7a3a;
  background: rgba(255, 176, 32, 0.16);
  padding: 3px 10px;
  border-radius: 99px;
  white-space: nowrap;
}
.vi {
  font-size: 14.5px;
  font-weight: 700;
  margin-top: 6px;
  color: var(--ink);
}
.def {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--muted);
  margin-top: 6px;
}
.empty {
  text-align: center;
  padding: 50px 0;
  color: var(--muted-2);
}
.emoji {
  font-size: 46px;
}
.empty p {
  margin-top: 12px;
  font-size: 15px;
}
@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
