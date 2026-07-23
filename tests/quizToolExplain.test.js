import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createApp, h, nextTick } from 'vue'

const { explainQuiz } = vi.hoisted(() => ({ explainQuiz: vi.fn(async () => 'Vì "run" nghĩa là chạy/di chuyển.') }))
vi.mock('@/lib/aiChat', () => ({ explainQuiz }))
vi.mock('@/composables/useOnlineStatus', () => ({ useOnlineStatus: () => ({ isOnline: { value: true } }) }))
vi.mock('@/lib/haptics', () => ({ hapticLight: vi.fn(), hapticError: vi.fn() }))

import QuizTool from '@/components/tools/QuizTool.vue'

const QS = [{ q: 'What does "run" mean?', opts: ['To sit', 'To move fast'], correct: 1, ex: 'Đáp án: To move fast' }]

function mount(questions) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const app = createApp({ render: () => h(QuizTool, { questions, mode: 'practice', embedded: true }) })
  app.use(createPinia())
  app.mount(el)
  return { app, el }
}
const q = (el, sel) => Array.from(el.querySelectorAll(sel))
const byText = (el, sel, txt) => q(el, sel).find((n) => n.textContent.includes(txt))

describe('QuizTool — nút "Vì sao?" gọi AI giải thích', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    explainQuiz.mockClear()
  })

  it('sau khi trả lời, bấm "Vì sao?" -> gọi explainQuiz và hiện lời giải', async () => {
    const { el } = mount(QS)
    // trả lời câu (chọn phương án bất kỳ)
    q(el, '.option')[0].click()
    await nextTick()
    const whyBtn = byText(el, 'button', 'Vì sao?')
    expect(whyBtn).toBeTruthy()
    whyBtn.click()
    await nextTick()
    await Promise.resolve()
    await nextTick()
    expect(explainQuiz).toHaveBeenCalledTimes(1)
    // truyền đúng câu hỏi + đáp án đúng cho AI
    const arg = explainQuiz.mock.calls[0][0]
    expect(arg.question).toContain('run')
    expect(arg.correct).toBe('To move fast')
    expect(el.querySelector('.why-text')?.textContent).toContain('chạy')
  })

  it('chưa trả lời thì không có nút "Vì sao?"', () => {
    const { el } = mount(QS)
    expect(byText(el, 'button', 'Vì sao?')).toBeFalsy()
  })
})
