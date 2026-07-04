<script setup>
import { ref, watch } from 'vue'
import { fetchVocabImage } from '@/lib/vocabImage'

/**
 * Ô ảnh minh họa từ vựng dùng chung cho VocabCard.vue và FlashcardTool.vue.
 *
 * 2 kiểu dùng:
 *  - Có `persistentEmoji` (VocabCard: mỗi từ có sẵn emoji + nền gradient riêng
 *    trong data) -> emoji luôn hiện, ảnh tải xong thì fade-in đè lên trên.
 *  - Không có (FlashcardTool: card không có emoji riêng) -> hiện spinner lúc
 *    đang tra ảnh, ảnh tải xong hiện đè lên; lỗi/không có ảnh mới hiện
 *    `fallbackEmoji` (mặc định 🗂️).
 */
const props = defineProps({
  term: { type: String, default: '' },
  size: { type: Number, default: 112 },
  background: { type: String, default: '' }, // CSS background (màu/gradient) của ô
  persistentEmoji: { type: String, default: '' },
  fallbackEmoji: { type: String, default: '🗂️' },
  showSpinner: { type: Boolean, default: false },
  overrideUrl: { type: String, default: '' }, // có sẵn URL (vd data đã gán) -> bỏ qua tra cứu
})

const imgUrl = ref('')
const imgOk = ref(true)
const loaded = ref(false)
const looking = ref(false)
let token = 0

async function resolve() {
  const my = ++token
  imgUrl.value = ''
  imgOk.value = true
  loaded.value = false
  looking.value = false
  if (props.overrideUrl) {
    imgUrl.value = props.overrideUrl
    return
  }
  if (!props.term) return
  looking.value = true
  const url = await fetchVocabImage(props.term)
  if (my !== token) return // từ đã đổi trong lúc chờ -> bỏ kết quả cũ, khỏi hiện sai ảnh
  looking.value = false
  imgUrl.value = url
}
watch(() => [props.term, props.overrideUrl], resolve, { immediate: true })

const emojiSize = (ratio) => `${Math.round(props.size * ratio)}px`
</script>

<template>
  <div class="vill" :style="{ width: `${size}px`, height: `${size}px`, background }">
    <span v-if="persistentEmoji" class="vill-emoji" :style="{ fontSize: emojiSize(0.43) }">{{ persistentEmoji }}</span>
    <span v-else-if="showSpinner && (looking || (imgUrl && imgOk && !loaded))" class="vill-spin"></span>
    <span v-else-if="!imgUrl || !imgOk" class="vill-emoji" :style="{ fontSize: emojiSize(0.37) }">{{ fallbackEmoji }}</span>

    <img
      v-if="imgUrl && imgOk"
      :src="imgUrl"
      :alt="term"
      class="vill-img"
      :class="{ shown: loaded }"
      loading="lazy"
      decoding="async"
      @load="loaded = true"
      @error="imgOk = false"
    />
  </div>
</template>

<style scoped>
.vill {
  position: relative;
  border-radius: inherit;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vill-emoji {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.vill-spin {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: vill-rot 0.7s linear infinite;
}
@keyframes vill-rot {
  to {
    transform: rotate(360deg);
  }
}
.vill-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.35s ease;
}
.vill-img.shown {
  opacity: 1;
}
</style>
