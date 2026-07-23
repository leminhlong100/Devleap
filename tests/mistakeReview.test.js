import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia, getActivePinia } from 'pinia'
import { createApp, h, nextTick } from 'vue'

vi.mock('@/lib/supabase', () => ({ isCloudEnabled: false, supabase: null }))

import { useUserStore } from '@/stores/user'
import MistakeReview from '@/components/day/MistakeReview.vue'

describe('ieltsReviewSlice — sổ lỗi + Leitner', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('addMistake thêm câu (dedup theo id), đếm tới hạn', () => {
    const u = useUserStore()
    u.addMistake({ id: 'a', q: 'Q1', answer: 'x', kind: 'reading' })
    u.addMistake({ id: 'a', q: 'Q1-dup', answer: 'y' }) // trùng id -> bỏ qua
    u.addMistake({ id: 'b', q: 'Q2', answer: 'z', kind: 'grammar' })
    expect(u.mistakeTotal).toBe(2)
    expect(u.dueMistakeCount).toBe(2) // vừa thêm là tới hạn ngay
    // thiếu dữ liệu -> không thêm
    u.addMistake({ id: 'c', q: '', answer: '' })
    expect(u.mistakeTotal).toBe(2)
  })

  it('reviewMistake đúng -> hết tới hạn (giãn cách); sai -> vẫn tới hạn', () => {
    const u = useUserStore()
    u.addMistake({ id: 'a', q: 'Q1', answer: 'x' })
    u.reviewMistake('a', true)
    expect(u.dueMistakeCount).toBe(0) // đã lên box, hạn ôn đẩy sang mai
    expect(u.mistakeTotal).toBe(1)
    u.reviewMistake('a', false)
    expect(u.dueMistakeCount).toBe(1) // sai -> về box 0, tới hạn lại
  })

  it('đúng liên tục tới box cao nhất -> "thuộc" & rời sổ', () => {
    const u = useUserStore()
    u.addMistake({ id: 'a', q: 'Q1', answer: 'x' })
    for (let i = 0; i < 6; i++) u.reviewMistake('a', true)
    expect(u.mistakeTotal).toBe(0)
  })
})

function mount() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const app = createApp({ render: () => h(MistakeReview) })
  app.use(getActivePinia()) // dùng chung pinia đã seed ở beforeEach
  app.mount(el)
  return { el }
}
const q = (el, sel) => Array.from(el.querySelectorAll(sel))

describe('MistakeReview.vue — ôn lại lỗi tới hạn', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('không có câu tới hạn -> không hiện gì', () => {
    const { el } = mount()
    expect(el.querySelector('.review-card')).toBeFalsy()
  })

  it('có câu tới hạn -> hiện, gõ đúng thì cập nhật box (rời khỏi tới hạn)', async () => {
    const u = useUserStore()
    u.addMistake({ id: 'a', q: 'Con kiến (EN)?', answer: 'ant', kind: 'vocab' })
    const { el } = mount()
    expect(el.querySelector('.review-card')).toBeTruthy()
    const input = el.querySelector('.mr-input')
    input.value = 'ant'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    q(el, '.mr-btn').find((b) => b.textContent.includes('Kiểm tra')).click()
    await nextTick()
    expect(input.classList.contains('ok')).toBe(true)
    expect(u.dueMistakeCount).toBe(0) // đã ôn đúng -> giãn cách
  })
})
