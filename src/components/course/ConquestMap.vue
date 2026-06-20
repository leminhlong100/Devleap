<script setup>
import { computed } from 'vue'

const props = defineProps({
  weeks: { type: Array, required: true }, // [{num, icon, title, sub, status}]
  stages: { type: Object, default: () => ({}) }, // { weekNum: {icon,label,range} }
  theme: { type: String, default: 'purple' }, // purple | green — màu badge "current"
})

const emit = defineEmits(['select'])

// Tính % tô màu cho đường nối dọc dựa trên số tuần done/current.
const lineGradient = computed(() => {
  const total = props.weeks.length
  const lastDone = props.weeks.reduce((acc, w, i) => (w.status === 'done' ? i + 1 : acc), 0)
  const currentIdx = props.weeks.findIndex((w) => w.status === 'current')
  const donePct = Math.round((lastDone / total) * 100)
  const curPct = currentIdx >= 0 ? Math.round(((currentIdx + 0.5) / total) * 100) : donePct
  return `linear-gradient(180deg,#00D68F 0%,#00D68F ${donePct}%,#6C5CE7 ${Math.min(curPct, 99)}%,#D9D6EC ${Math.min(curPct + 12, 100)}%,#D9D6EC 100%)`
})

function styleFor(w) {
  if (w.status === 'done') {
    return {
      accent: '#00C281',
      badge: '✓ Hoàn thành',
      badgeBg: 'rgba(0,214,143,.14)',
      badgeColor: '#00A86F',
      cardBg: '#fff',
      cardBorder: 'rgba(0,214,143,.3)',
      cardShadow: '0 8px 22px rgba(0,214,143,.1)',
      titleColor: '#1E1E2E',
      subColor: '#76768e',
      nodeBg: 'linear-gradient(135deg,#00D68F,#00a86f)',
      nodeIcon: '✓',
      nodeShadow: '0 8px 20px rgba(0,214,143,.4)',
      nodeAnim: 'none',
      clickable: true,
    }
  }
  if (w.status === 'current') {
    return {
      accent: '#c9c2f5',
      badge: props.theme === 'green' ? '▶ Bắt đầu' : '▶ Đang học',
      badgeBg: props.theme === 'green' ? 'rgba(255,255,255,.2)' : 'rgba(108,92,231,.14)',
      badgeColor: props.theme === 'green' ? '#fff' : '#6C5CE7',
      cardBg: 'linear-gradient(135deg,#6C5CE7,#4b3bc4)',
      cardBorder: 'transparent',
      cardShadow: '0 14px 34px rgba(108,92,231,.35)',
      titleColor: '#fff',
      subColor: '#d9d4f5',
      nodeBg: 'linear-gradient(135deg,#6C5CE7,#8B7CF0)',
      nodeIcon: w.icon,
      nodeShadow: '0 10px 24px rgba(108,92,231,.5)',
      nodeAnim: 'pulsering 2s infinite',
      clickable: true,
    }
  }
  return {
    accent: '#b0b0c4',
    badge: '🔒 Khóa',
    badgeBg: '#EDEDF4',
    badgeColor: '#9a9ab0',
    cardBg: '#FBFBFE',
    cardBorder: 'rgba(108,92,231,.08)',
    cardShadow: 'none',
    titleColor: '#9a9ab0',
    subColor: '#b6b6c6',
    nodeBg: '#E6E6F0',
    nodeIcon: '🔒',
    nodeShadow: 'none',
    nodeAnim: 'none',
    clickable: false,
  }
}

function rowFor(w, i) {
  const left = i % 2 === 0
  return { left, right: !left, stage: props.stages[w.num], s: styleFor(w) }
}

function onNode(w, clickable) {
  if (clickable) emit('select', w)
}
</script>

<template>
  <div class="map">
    <div class="spine" :style="{ background: lineGradient }"></div>

    <template v-for="(w, i) in weeks" :key="w.num">
      <div v-if="stages[w.num]" class="stage-banner">
        <span class="stage-pill" :class="theme">
          <span class="stage-icon">{{ stages[w.num].icon }}</span>{{ stages[w.num].label }}
          <span class="stage-range">· {{ stages[w.num].range }}</span>
        </span>
      </div>

      <div class="row">
        <!-- left slot -->
        <div class="slot left">
          <div
            v-if="rowFor(w, i).left"
            class="wcard right-text"
            :style="{
              background: rowFor(w, i).s.cardBg,
              borderColor: rowFor(w, i).s.cardBorder,
              boxShadow: rowFor(w, i).s.cardShadow,
            }"
          >
            <div class="wcard-top end">
              <span class="wnum" :style="{ color: rowFor(w, i).s.accent }">TUẦN {{ w.num }}</span>
              <span class="wbadge" :style="{ background: rowFor(w, i).s.badgeBg, color: rowFor(w, i).s.badgeColor }">{{ rowFor(w, i).s.badge }}</span>
            </div>
            <h3 class="wtitle" :style="{ color: rowFor(w, i).s.titleColor }">{{ w.title }}</h3>
            <p class="wsub" :style="{ color: rowFor(w, i).s.subColor }">{{ w.sub }}</p>
          </div>
        </div>

        <!-- node -->
        <div class="node-slot">
          <div
            class="node"
            :style="{
              background: rowFor(w, i).s.nodeBg,
              boxShadow: rowFor(w, i).s.nodeShadow,
              animation: rowFor(w, i).s.nodeAnim,
              cursor: rowFor(w, i).s.clickable ? 'pointer' : 'default',
            }"
            @click="onNode(w, rowFor(w, i).s.clickable)"
          >
            {{ rowFor(w, i).s.nodeIcon }}
          </div>
        </div>

        <!-- right slot -->
        <div class="slot right">
          <div
            v-if="rowFor(w, i).right"
            class="wcard"
            :style="{
              background: rowFor(w, i).s.cardBg,
              borderColor: rowFor(w, i).s.cardBorder,
              boxShadow: rowFor(w, i).s.cardShadow,
            }"
          >
            <div class="wcard-top">
              <span class="wnum" :style="{ color: rowFor(w, i).s.accent }">TUẦN {{ w.num }}</span>
              <span class="wbadge" :style="{ background: rowFor(w, i).s.badgeBg, color: rowFor(w, i).s.badgeColor }">{{ rowFor(w, i).s.badge }}</span>
            </div>
            <h3 class="wtitle" :style="{ color: rowFor(w, i).s.titleColor }">{{ w.title }}</h3>
            <p class="wsub" :style="{ color: rowFor(w, i).s.subColor }">{{ w.sub }}</p>
          </div>
        </div>
      </div>
    </template>

    <slot name="footer" />
  </div>
</template>

<style scoped>
.map {
  max-width: 880px;
  margin: 0 auto;
  padding: 48px 28px 70px;
  position: relative;
}
.spine {
  position: absolute;
  left: 50%;
  top: 60px;
  bottom: 70px;
  width: 5px;
  transform: translateX(-50%);
  border-radius: 99px;
  z-index: 0;
}
.stage-banner {
  position: relative;
  z-index: 2;
  text-align: center;
  margin: 14px 0 26px;
}
.stage-pill {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.14);
  box-shadow: 0 8px 22px rgba(108, 92, 231, 0.1);
  padding: 9px 18px;
  border-radius: 99px;
  font-size: 13.5px;
  font-weight: 800;
  color: var(--purple);
  white-space: nowrap;
}
.stage-pill.green {
  border-color: rgba(0, 214, 143, 0.18);
  box-shadow: 0 8px 22px rgba(0, 214, 143, 0.12);
  color: #00a86f;
}
.stage-icon {
  font-size: 16px;
}
.stage-range {
  color: #b0b0c4;
  font-weight: 600;
}
.row {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 76px 1fr;
  align-items: center;
  margin: 8px 0;
}
.slot {
  display: flex;
}
.slot.left {
  justify-content: flex-end;
}
.slot.right {
  justify-content: flex-start;
}
.node-slot {
  display: flex;
  justify-content: center;
}
.node {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  border: 4px solid var(--bg);
}
.wcard {
  max-width: 330px;
  width: 100%;
  border: 1px solid;
  border-radius: 18px;
  padding: 16px 18px;
}
.wcard.right-text {
  text-align: right;
}
.wcard-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wcard-top.end {
  justify-content: flex-end;
}
.wnum {
  font-size: 12px;
  font-weight: 800;
}
.wbadge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 99px;
}
.wtitle {
  font-size: 16.5px;
  font-weight: 800;
  margin: 7px 0 4px;
}
.wsub {
  font-size: 13px;
  line-height: 1.5;
}
@media (max-width: 640px) {
  .row {
    grid-template-columns: 56px 1fr;
  }
  .node-slot {
    order: -1;
  }
  .slot.left {
    justify-content: flex-start;
  }
  .wcard.right-text {
    text-align: left;
  }
  .wcard-top.end {
    justify-content: flex-start;
  }
  .spine {
    left: 28px;
  }
}
</style>
