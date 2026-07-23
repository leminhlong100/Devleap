import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createApp, h, nextTick } from 'vue'

const { correctWriting, recognizeOnce } = vi.hoisted(() => ({
  correctWriting: vi.fn(async () => ({
    cefr: 'A2',
    score: 60,
    summary: 'Tạm ổn, mở rộng thêm ý.',
    lines: [{ original: 'I go gym', corrected: 'I go to the gym', ok: false, note: 'thiếu giới từ' }],
  })),
  recognizeOnce: vi.fn(() => ({ promise: Promise.resolve('I go to the gym three times a week'), stop: vi.fn() })),
}))
vi.mock('@/lib/aiChat', () => ({ correctWriting }))
vi.mock('@/lib/speechRecognize', () => ({ recognizeOnce, recognitionSupported: () => true }))
vi.mock('@/lib/speak', () => ({ canSpeak: () => false, speak: vi.fn() }))
vi.mock('@/composables/useOnlineStatus', () => ({ useOnlineStatus: () => ({ isOnline: { value: true } }) }))

import SpeakingCoach from '@/components/day/SpeakingCoach.vue'
import { useUserStore } from '@/stores/user'

const DAY = {
  n: 10,
  week: 1,
  title: 'Speaking test',
  speakingTask: { prompt: 'How often do you exercise?', sample: 'I exercise three to four times a week.' },
  vocabCards: [{ term: 'cardio' }],
}

function mount(day) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const app = createApp({ render: () => h(SpeakingCoach, { day }) })
  app.use(createPinia())
  app.mount(el)
  return { app, el }
}

const q = (el, sel) => Array.from(el.querySelectorAll(sel))
const btnByText = (el, txt) => q(el, 'button').find((b) => b.textContent.includes(txt))

describe('SpeakingCoach — nói/gõ → AI chấm, câu mẫu ẩn tới khi thử', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    correctWriting.mockClear()
    recognizeOnce.mockClear()
  })

  it('mặc định: câu hỏi hiện, câu trả lời mẫu BỊ KHÓA', () => {
    const { el } = mount(DAY)
    expect(el.textContent).toContain('How often do you exercise?')
    expect(el.textContent).not.toContain('I exercise three to four times a week')
    expect(el.textContent).toContain('Câu trả lời mẫu sẽ hiện sau khi bạn tự nói')
  })

  it('bấm 🎤 -> STT điền transcript vào ô', async () => {
    const { el } = mount(DAY)
    btnByText(el, 'Nói câu trả lời').click()
    await nextTick()
    await Promise.resolve()
    await nextTick()
    expect(recognizeOnce).toHaveBeenCalledTimes(1)
    expect(el.querySelector('textarea').value).toContain('I go to the gym three times a week')
  })

  it('gõ transcript + chấm -> gọi AI, hiện điểm, hé lộ câu mẫu, lưu vào khóa ielts-speak', async () => {
    const { el } = mount(DAY)
    const ta = el.querySelector('textarea')
    ta.value = 'I go to the gym three times a week.'
    ta.dispatchEvent(new Event('input'))
    await nextTick()
    btnByText(el, 'Nhờ AI chấm').click()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(correctWriting).toHaveBeenCalledTimes(1)
    expect(el.textContent).toContain('60/100')
    expect(el.textContent).toContain('I exercise three to four times a week') // câu mẫu hé lộ
    // lưu ở "khóa" riêng, KHÔNG đụng bài viết ielts
    const user = useUserStore()
    expect(user.writingDone('ielts-speak', 1, 10)).toBe(true)
    expect(user.writingDone('ielts', 1, 10)).toBe(false)
  })
})
