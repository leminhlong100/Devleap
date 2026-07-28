import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createApp, h, nextTick } from 'vue'

// AI chữa bài -> trả review giả (không gọi mạng). vi.hoisted vì vi.mock nâng lên đầu file.
const { correctWriting } = vi.hoisted(() => ({
  correctWriting: vi.fn(async () => ({
    cefr: 'B1',
    score: 72,
    summary: 'Bài ổn, chú ý thì động từ.',
    lines: [{ original: 'I like work from home', corrected: 'I like working from home', ok: false, note: 'gerund' }],
  })),
}))
vi.mock('@/lib/aiChat', () => ({ correctWriting }))
vi.mock('@/composables/useOnlineStatus', () => ({ useOnlineStatus: () => ({ isOnline: { value: true } }) }))

import WritingCoach from '@/components/day/WritingCoach.vue'
import { useUserStore } from '@/stores/user'

const DAY = {
  n: 10,
  week: 1,
  title: 'Writing test',
  writingTask: { prompt: 'Some people believe working from home is beneficial. Agree?' },
  writingSamples: '<p>MODEL ESSAY: Many people work from home.</p>',
  grammar: [],
  vocabCards: [{ term: 'flexible' }],
}

function mount(day) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const app = createApp({ render: () => h(WritingCoach, { day }) })
  app.use(createPinia())
  app.mount(el)
  return { app, el }
}

const q = (el, sel) => Array.from(el.querySelectorAll(sel))
const btnByText = (el, txt) => q(el, 'button').find((b) => b.textContent.includes(txt))

describe('WritingCoach — tự viết trước, AI chấm, bài mẫu ẩn tới khi nộp', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    correctWriting.mockClear()
  })

  it('mặc định: đề bài hiện, bài mẫu BỊ KHÓA (chưa nộp)', () => {
    const { el } = mount(DAY)
    expect(el.textContent).toContain('Some people believe working from home')
    expect(el.textContent).not.toContain('MODEL ESSAY')
    expect(el.textContent).toContain('Bài mẫu sẽ hiện sau khi bạn tự viết')
  })

  it('nút chữa bị khóa khi chưa đủ câu, mở khi đủ', async () => {
    const { el } = mount(DAY)
    const ta = el.querySelector('textarea')
    ta.value = 'I like it.' // 1 câu
    ta.dispatchEvent(new Event('input'))
    await nextTick()
    expect(btnByText(el, 'Nhờ AI chữa bài')).toBeFalsy() // vẫn hiện "Cần thêm … câu"
    ta.value = 'I like working from home. It saves time. I feel happy.'
    ta.dispatchEvent(new Event('input'))
    await nextTick()
    expect(btnByText(el, 'Nhờ AI chữa bài')).toBeTruthy()
  })

  it('nộp -> gọi AI, hiện điểm/summary, HÉ LỘ bài mẫu, lưu writingDone', async () => {
    const { el } = mount(DAY)
    const ta = el.querySelector('textarea')
    ta.value = 'I like working from home. It saves time. I feel happy.'
    ta.dispatchEvent(new Event('input'))
    await nextTick()
    btnByText(el, 'Nhờ AI chữa bài').click()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(correctWriting).toHaveBeenCalledTimes(1)
    expect(el.textContent).toContain('72/100')
    expect(el.textContent).toContain('B1')
    expect(el.textContent).toContain('Bài ổn')
    // bài mẫu đã hé lộ để đối chiếu
    expect(el.textContent).toContain('MODEL ESSAY')
    // tiến độ lưu
    expect(useUserStore().writingDone('ielts', 1, 10)).toBe(true)
  })
})
