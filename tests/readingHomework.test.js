import { describe, it, expect, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'

// speak: không có Web Speech trong test → tắt nút nghe cho đơn giản.
vi.mock('@/lib/speak', () => ({ canSpeak: () => false, speak: vi.fn() }))
const { checkParaphrase } = vi.hoisted(() => ({ checkParaphrase: vi.fn(async () => true) }))
vi.mock('@/lib/aiChat', () => ({ checkParaphrase }))
vi.mock('@/composables/useOnlineStatus', () => ({ useOnlineStatus: () => ({ isOnline: { value: true } }) }))

import ReadingHomework from '@/components/day/ReadingHomework.vue'

const ITEMS = [
  {
    n: 1,
    title: 'Q1',
    question: 'Match: Animals could use objects to locate food.',
    questionVi: 'Nối câu với người đúng.',
    passage: 'Tim Caro presented cases of birds using a stick to locate food.',
    passageVi: 'Tim Caro đưa ra ví dụ chim dùng que để tìm thức ăn.',
    keywords: ['C Tim Caro', 'a stick', 'locate food'],
    answer: ['C', 'Tim Caro'],
    model: 'C (Tim Caro) — đoạn F.',
  },
  {
    n: 2,
    title: 'Q2',
    question: 'Match: Ants show two-way teaching.',
    questionVi: 'Kiến dạy học hai chiều.',
    passage: 'Nigel Franks: bidirectional feedback between teacher and pupil.',
    passageVi: 'Nigel Franks: phản hồi hai chiều.',
    keywords: ['A Nigel Franks', 'bidirectional'],
    answer: ['A', 'Nigel Franks'],
    model: 'A (Nigel Franks) — đoạn B.',
  },
]

function mount(items) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const events = { done: 0 }
  const app = createApp({
    render: () => h(ReadingHomework, { items, onDone: () => (events.done += 1) }),
  })
  app.mount(el)
  return { app, el, events }
}

const q = (el, sel) => Array.from(el.querySelectorAll(sel))
const byText = (el, sel, txt) => q(el, sel).find((n) => n.textContent.includes(txt))

async function answer(el, itemIndex, value) {
  const input = q(el, '.rh-input')[itemIndex]
  input.value = value
  input.dispatchEvent(new Event('input'))
  await nextTick()
  const btn = input.closest('.rh-item').querySelector('.rh-btn')
  btn.click()
  await nextTick()
}

describe('ReadingHomework — chế độ active recall', () => {
  it('mặc định GIẤU đoạn văn gợi ý và từ khóa (không lộ đáp án)', () => {
    const { el } = mount(ITEMS)
    expect(el.textContent).not.toContain('birds using a stick')
    expect(el.textContent).not.toContain('C Tim Caro')
    // nút phao có mặt
    expect(byText(el, 'button', 'Xem đoạn gợi ý')).toBeTruthy()
    expect(byText(el, 'button', 'Xem từ khóa')).toBeTruthy()
    // đếm tự lực khởi tạo 0/2
    expect(el.querySelector('.rh-solo').textContent).toContain('0/2')
  })

  it('bấm "Xem đoạn gợi ý" mới hiện đoạn văn và đánh dấu có dùng phao', async () => {
    const { el } = mount(ITEMS)
    byText(el, 'button', 'Xem đoạn gợi ý').click()
    await nextTick()
    expect(el.textContent).toContain('birds using a stick')
    // trả lời đúng câu này -> tag "có phao", KHÔNG tính tự lực
    await answer(el, 0, 'Tim Caro')
    const item0 = q(el, '.rh-item')[0]
    expect(item0.querySelector('.rh-tag').textContent).toContain('có phao')
    expect(el.querySelector('.rh-solo').textContent).toContain('0/2')
  })

  it('trả lời đúng KHÔNG mở phao -> tag "tự lực" + tăng đếm tự lực; xong hết phát done', async () => {
    const { el, events } = mount(ITEMS)
    // Câu 1 tự lực
    await answer(el, 0, 'C')
    const item0 = q(el, '.rh-item')[0]
    expect(item0.querySelector('.rh-tag').textContent).toContain('tự lực')
    expect(el.querySelector('.rh-solo').textContent).toContain('1/2')
    // sau khi đúng, đoạn văn bằng chứng tự hé lộ để đối chiếu
    expect(el.textContent).toContain('birds using a stick')
    expect(events.done).toBe(0)
    // Câu 2 tự lực -> hoàn thành -> emit done
    await answer(el, 1, 'Nigel Franks')
    expect(el.querySelector('.rh-solo').textContent).toContain('2/2')
    expect(events.done).toBe(1)
    expect(el.querySelector('.gate-line').textContent).toContain('không cần phao')
  })

  it('trả lời SAI hiện đáp án ngắn rồi ẩn khi gõ lại; không phát done sớm', async () => {
    const { el, events } = mount(ITEMS)
    await answer(el, 0, 'B')
    const item0 = q(el, '.rh-item')[0]
    expect(item0.querySelector('.rh-answer')).toBeTruthy()
    expect(item0.querySelector('.rh-answer').textContent).toContain('C')
    // gõ lại -> ẩn đáp án
    const input = item0.querySelector('.rh-input')
    input.value = 'C'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    expect(item0.querySelector('.rh-answer')).toBeFalsy()
    expect(events.done).toBe(0)
  })

  it('paraphrase: sai chuỗi nhưng AI xác nhận cùng nghĩa -> chấm ĐÚNG', async () => {
    checkParaphrase.mockResolvedValueOnce(true)
    const { el } = mount(ITEMS)
    await answer(el, 0, 'the zoologist Tim Caro') // khác chuỗi -> wrong
    const item0 = q(el, '.rh-item')[0]
    expect(item0.classList.contains('wrong')).toBe(true)
    const aiBtn = byText(item0, 'button', 'Nhờ AI kiểm tra')
    expect(aiBtn).toBeTruthy()
    aiBtn.click()
    await nextTick()
    await Promise.resolve()
    await nextTick()
    expect(checkParaphrase).toHaveBeenCalledTimes(1)
    expect(item0.querySelector('.rh-input').classList.contains('ok')).toBe(true)
  })

  it('paraphrase: AI nói KHÔNG cùng nghĩa -> vẫn sai + báo', async () => {
    checkParaphrase.mockResolvedValueOnce(false)
    const { el } = mount(ITEMS)
    await answer(el, 0, 'something wrong')
    const item0 = q(el, '.rh-item')[0]
    byText(item0, 'button', 'Nhờ AI kiểm tra').click()
    await nextTick()
    await Promise.resolve()
    await nextTick()
    expect(item0.querySelector('.rh-input').classList.contains('ok')).toBe(false)
    expect(item0.querySelector('.rh-ai-no')).toBeTruthy()
  })
})
