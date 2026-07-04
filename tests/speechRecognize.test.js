import { describe, it, expect, afterEach } from 'vitest'
import { recognitionSupported, speechSupport } from '@/lib/speechRecognize'
import { canListen } from '@/lib/listen'

function setRecognition(hasStandard, hasWebkit) {
  if (hasStandard) window.SpeechRecognition = function () {}
  else delete window.SpeechRecognition
  if (hasWebkit) window.webkitSpeechRecognition = function () {}
  else delete window.webkitSpeechRecognition
}
function setSynthesis(has) {
  if (has) {
    window.speechSynthesis = window.speechSynthesis || {}
    window.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || function () {}
  } else {
    delete window.speechSynthesis
    delete window.SpeechSynthesisUtterance
  }
}

describe('speechSupport()', () => {
  afterEach(() => {
    setRecognition(false, false)
    setSynthesis(false)
  })

  it('không có SpeechRecognition lẫn SpeechSynthesis (Safari cũ) -> cả 2 false', () => {
    setRecognition(false, false)
    setSynthesis(false)
    expect(speechSupport()).toEqual({ recognition: false, synthesis: false })
  })

  it('Safari/iOS hiện đại: không có SpeechRecognition nhưng CÓ SpeechSynthesis', () => {
    setRecognition(false, false)
    setSynthesis(true)
    expect(speechSupport()).toEqual({ recognition: false, synthesis: true })
  })

  it('Chrome/Edge: có cả recognition lẫn synthesis', () => {
    setRecognition(true, false)
    setSynthesis(true)
    expect(speechSupport()).toEqual({ recognition: true, synthesis: true })
  })

  it('chỉ có webkitSpeechRecognition (tiền tố cũ) vẫn tính là có recognition', () => {
    setRecognition(false, true)
    setSynthesis(false)
    expect(speechSupport()).toEqual({ recognition: true, synthesis: false })
  })

  it('recognitionSupported() và canListen() (listen.js) luôn khớp speechSupport().recognition', () => {
    setRecognition(true, false)
    expect(recognitionSupported()).toBe(true)
    expect(canListen()).toBe(true)
    expect(speechSupport().recognition).toBe(true)

    setRecognition(false, false)
    expect(recognitionSupported()).toBe(false)
    expect(canListen()).toBe(false)
    expect(speechSupport().recognition).toBe(false)
  })
})
