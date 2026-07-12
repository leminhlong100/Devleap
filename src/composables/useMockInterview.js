import { ref, computed, onUnmounted } from 'vue'
import { interviewTurn, interviewReport } from '@/lib/javaInterview'
import { pickInterviewSet, topicLabel } from '@/data/javaInterview'
import { friendlyAiError } from '@/lib/aiError'
import { speak, canSpeak } from '@/lib/speak'
import { canListen, createRecognizer } from '@/lib/listen'
import { runJavaCode, friendlyRunError } from '@/lib/runJava'
import { pickCodingChallenges, buildCodingAnswerText, formatRemaining } from '@/lib/mockInterview'
import { useUserStore } from '@/stores/user'

/**
 * Engine cho phòng Mock Interview (khóa "Java Phỏng Vấn Cấp Tốc"). Tách khỏi
 * useChatEngine (vốn gắn CEFR/vocab tiếng Anh) vì đây là phỏng vấn kỹ thuật.
 *
 * Luồng: AI đóng vai người phỏng vấn — mỗi lượt vừa CHẤM câu trả lời vừa HỎI câu
 * kế (mode 'interview'). Ta bốc sẵn một bộ câu từ ngân hàng (pickInterviewSet) làm
 * GỢI Ý để AI bám chủ đề + trải đều; số câu do `config.count` quyết định. Kết thúc
 * gọi 'interviewReport' để tổng kết rồi lưu kết quả (local) qua store.
 */
export function useMockInterview() {
  const user = useUserStore()

  const phase = ref('setup') // 'setup' | 'running' | 'report'
  const config = ref({ lang: 'vi', topics: [], level: '', count: 8, durationMin: 0, codingCount: 0 })
  const qa = ref([]) // [{ type, q, topic, level, answer, evaluation, evaluating, challenge?, code? }]
  const input = ref('')
  const loading = ref(false)
  const error = ref('')
  const retry = ref(null)
  const report = ref(null)
  const done = ref(false) // đã trả lời hết số câu -> cho bấm "Kết thúc & nhận báo cáo"

  const autoSpeak = ref(false)
  const listening = ref(false)
  const speakable = canSpeak()
  const listenable = canListen()
  let recognizer = null
  let attempt = 0

  let bankSet = []
  let codingQueue = []

  // —— Timed mode: đếm ngược, hết giờ tự động kết thúc buổi ——
  const remainingSec = ref(0)
  let timer = null
  function clearTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  function startTimer(min) {
    clearTimer()
    const sec = Math.max(0, Math.floor(Number(min) || 0)) * 60
    if (!sec) return
    remainingSec.value = sec
    timer = setInterval(() => {
      remainingSec.value -= 1
      if (remainingSec.value <= 0) {
        clearTimer()
        if (phase.value === 'running' && !loading.value) finish()
      }
    }, 1000)
  }
  const remainingLabel = computed(() => formatRemaining(remainingSec.value))
  const isTimed = computed(() => (config.value.durationMin || 0) > 0)

  const answered = computed(() => qa.value.filter((r) => r.evaluation).length)
  const total = computed(() => config.value.count || 0)
  const progressPct = computed(() => (total.value ? Math.round((answered.value / total.value) * 100) : 0))
  const currentRound = computed(() => (qa.value.length ? qa.value[qa.value.length - 1] : null))
  const awaitingAnswer = computed(
    () => !!currentRound.value && currentRound.value.type !== 'coding' && !currentRound.value.evaluation && !loading.value,
  )
  const awaitingCode = computed(
    () => !!currentRound.value && currentRound.value.type === 'coding' && !currentRound.value.evaluation && !loading.value,
  )
  const recognizerLang = computed(() => (config.value.lang === 'en' ? 'en-US' : 'vi-VN'))

  /** Ngữ cảnh gửi backend (dùng NHÃN chủ đề cho AI dễ hiểu). */
  function ctx(askedCount) {
    return {
      lang: config.value.lang,
      topics: (config.value.topics || []).map(topicLabel),
      level: config.value.level || 'mixed',
      count: config.value.count,
      askedCount,
      bankQuestion: bankSet[askedCount]?.q,
    }
  }

  /** Transcript gọn để gửi backend: assistant = câu hỏi, user = câu trả lời. */
  function transcript() {
    const out = []
    for (const r of qa.value) {
      out.push({ role: 'assistant', text: r.q })
      if (r.answer != null) out.push({ role: 'user', text: r.answer })
    }
    return out
  }

  /** Bắt đầu buổi phỏng vấn với cấu hình đã chọn. */
  async function start(cfg) {
    const count = Math.max(3, Math.min(15, Number(cfg.count) || 8))
    const codingCount = Math.max(0, Math.min(count, Number(cfg.codingCount) || 0))
    config.value = {
      lang: cfg.lang === 'en' ? 'en' : 'vi',
      topics: Array.isArray(cfg.topics) ? cfg.topics : [],
      level: cfg.level || '',
      count,
      codingCount,
      durationMin: Math.max(0, Number(cfg.durationMin) || 0),
    }
    attempt += 1
    bankSet = pickInterviewSet({
      topics: config.value.topics,
      level: config.value.level || undefined,
      count: count - codingCount,
      seed: attempt,
    })
    codingQueue = pickCodingChallenges(codingCount, { level: config.value.level || undefined })
    qa.value = []
    input.value = ''
    error.value = ''
    retry.value = null
    report.value = null
    done.value = false
    autoSpeak.value = config.value.lang === 'en' // TTS chỉ tự bật cho tiếng Anh
    phase.value = 'running'
    startTimer(config.value.durationMin)
    await pushNext()
  }

  /** Chèn bài coding (nếu còn trong hàng đợi) hoặc hỏi AI câu kế. */
  async function pushNext() {
    if (qa.value.length >= config.value.count) {
      done.value = true
      return
    }
    if (codingQueue.length) {
      const c = codingQueue.shift()
      qa.value.push({
        type: 'coding',
        q: c.prompt,
        topic: 'coding',
        level: c.level,
        challenge: c,
        code: c.starter,
        runOutput: null,
        answer: null,
        evaluation: null,
        evaluating: false,
      })
      return
    }
    await askNext()
  }

  /** Hỏi câu kế (dùng cả cho câu mở đầu — transcript rỗng thì AI chỉ mở màn). */
  async function askNext() {
    loading.value = true
    error.value = ''
    retry.value = null
    try {
      const { next } = await interviewTurn({ messages: transcript(), context: ctx(qa.value.length) })
      if (next?.question && qa.value.length < config.value.count) {
        qa.value.push({
          type: 'qa',
          q: String(next.question).trim(),
          topic: next.topic || bankSet[qa.value.length]?.topic || '',
          level: next.level || bankSet[qa.value.length]?.level || '',
          answer: null,
          evaluation: null,
          evaluating: false,
        })
        if (autoSpeak.value) maybeSpeak(qa.value[qa.value.length - 1].q)
      } else {
        done.value = true
      }
    } catch (e) {
      error.value = friendlyAiError(e).message
      retry.value = askNext
    } finally {
      loading.value = false
    }
  }

  /** Gửi câu trả lời cho câu hiện tại: nhận chấm điểm + câu kế. */
  async function submit(text) {
    const answer = String(text ?? input.value).trim()
    const round = currentRound.value
    if (!answer || !round || round.evaluation || loading.value) return
    round.answer = answer
    round.evaluating = true
    input.value = ''
    loading.value = true
    error.value = ''
    retry.value = null
    try {
      const { evaluation, next } = await interviewTurn({
        messages: transcript(),
        context: ctx(qa.value.length),
      })
      round.evaluation = evaluation || { score: 0, verdict: '—', strengths: [], gaps: [], ideal: '' }
      if (codingQueue.length && qa.value.length < config.value.count) {
        // Còn bài coding trong hàng đợi -> ưu tiên chèn thay vì dùng gợi ý "next" của AI.
        await pushNext()
      } else if (qa.value.length < config.value.count && next?.question) {
        qa.value.push({
          type: 'qa',
          q: String(next.question).trim(),
          topic: next.topic || bankSet[qa.value.length]?.topic || '',
          level: next.level || bankSet[qa.value.length]?.level || '',
          answer: null,
          evaluation: null,
          evaluating: false,
        })
        if (autoSpeak.value) maybeSpeak(qa.value[qa.value.length - 1].q)
      } else {
        done.value = true
      }
    } catch (e) {
      round.evaluating = false
      error.value = friendlyAiError(e).message
      // Thử lại: bỏ đánh dấu đã trả lời để gọi lại đúng câu này.
      retry.value = () => submit(answer)
    } finally {
      round.evaluating = false
      loading.value = false
    }
  }

  /** Chạy code cho câu coding hiện tại (không nộp bài, chỉ xem output). */
  async function runCode() {
    const round = currentRound.value
    if (!round || round.type !== 'coding' || round.evaluation || loading.value) return
    loading.value = true
    error.value = ''
    try {
      round.runOutput = await runJavaCode(round.code)
    } catch (e) {
      error.value = friendlyRunError(e)
    } finally {
      loading.value = false
    }
  }

  /** Nộp bài coding hiện tại: chạy code (nếu chưa chạy), đóng gói làm câu trả lời rồi gửi AI chấm. */
  async function submitCode() {
    const round = currentRound.value
    if (!round || round.type !== 'coding' || round.evaluation || loading.value) return
    loading.value = true
    error.value = ''
    retry.value = null
    try {
      const result = round.runOutput || (await runJavaCode(round.code))
      round.runOutput = result
      if (result.ok) user.markChallengeSolved(round.challenge.id)
      const answerText = buildCodingAnswerText(round.challenge, round.code, result)
      round.answer = answerText
      round.evaluating = true
      const { evaluation, next } = await interviewTurn({ messages: transcript(), context: ctx(qa.value.length) })
      round.evaluation = evaluation || { score: 0, verdict: '—', strengths: [], gaps: [], ideal: '' }
      if (codingQueue.length && qa.value.length < config.value.count) {
        await pushNext()
      } else if (qa.value.length < config.value.count && next?.question) {
        qa.value.push({
          type: 'qa',
          q: String(next.question).trim(),
          topic: next.topic || bankSet[qa.value.length]?.topic || '',
          level: next.level || bankSet[qa.value.length]?.level || '',
          answer: null,
          evaluation: null,
          evaluating: false,
        })
      } else {
        done.value = true
      }
    } catch (e) {
      round.evaluating = false
      error.value = friendlyAiError(e).message
      retry.value = submitCode
    } finally {
      round.evaluating = false
      loading.value = false
    }
  }

  /** Kết thúc buổi: xin báo cáo tổng kết + lưu kết quả (local). */
  async function finish() {
    if (loading.value || !answered.value) return
    loading.value = true
    error.value = ''
    retry.value = null
    try {
      const r = await interviewReport({ messages: transcript(), context: ctx(qa.value.length) })
      report.value = normalizeReport(r)
      user.saveInterviewResult(report.value)
      phase.value = 'report'
      stopMic()
      clearTimer()
    } catch (e) {
      error.value = friendlyAiError(e).message
      retry.value = finish
    } finally {
      loading.value = false
    }
  }

  function normalizeReport(r) {
    const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)))
    const arr = (x) => (Array.isArray(x) ? x.map((s) => String(s || '').trim()).filter(Boolean) : [])
    return {
      overall: clamp(r?.overall),
      verdict: String(r?.verdict || '').trim(),
      byTopic: Array.isArray(r?.byTopic)
        ? r.byTopic
            .map((t) => ({ topic: String(t?.topic || '').trim(), score: clamp(t?.score), note: String(t?.note || '').trim() }))
            .filter((t) => t.topic)
        : [],
      strengths: arr(r?.strengths),
      gaps: arr(r?.gaps),
      advice: arr(r?.advice),
      summary: String(r?.summary || '').trim(),
    }
  }

  /** Về màn thiết lập để phỏng vấn lại. */
  function restart() {
    phase.value = 'setup'
    qa.value = []
    report.value = null
    done.value = false
    error.value = ''
    stopMic()
    clearTimer()
  }

  // —— Giọng nói ——
  function maybeSpeak(text) {
    // speak() ưu tiên giọng tiếng Anh; chỉ đọc khi buổi bằng tiếng Anh cho tự nhiên.
    if (config.value.lang === 'en') speak(text, 0.95)
  }
  function replay(text) {
    speak(text, 0.95)
  }
  function toggleMic() {
    if (!listenable) return
    if (listening.value) {
      recognizer?.stop()
      return
    }
    recognizer = createRecognizer({
      lang: recognizerLang.value,
      onResult: ({ final, interim }) => {
        input.value = final || interim
      },
      onError: (err) => {
        error.value =
          err === 'not-allowed'
            ? 'Trình duyệt chưa cho phép dùng micro. Hãy bật quyền micro rồi thử lại.'
            : `Không nghe được (${err}).`
        listening.value = false
      },
      onEnd: () => {
        listening.value = false
      },
    })
    if (!recognizer) return
    error.value = ''
    listening.value = true
    recognizer.start()
  }
  function stopMic() {
    if (listening.value) recognizer?.stop()
    listening.value = false
  }
  function toggleAutoSpeak() {
    autoSpeak.value = !autoSpeak.value
  }

  // Rời trang giữa lúc đang nghe -> dừng luôn recognizer, tránh phiên nhận diện
  // mồ côi tiếp tục giữ micro chạy nền sau khi component đã bị huỷ.
  onUnmounted(stopMic)

  return {
    phase,
    config,
    qa,
    input,
    loading,
    error,
    retry,
    report,
    done,
    autoSpeak,
    listening,
    speakable,
    listenable,
    answered,
    total,
    progressPct,
    currentRound,
    awaitingAnswer,
    awaitingCode,
    remainingSec,
    remainingLabel,
    isTimed,
    start,
    submit,
    runCode,
    submitCode,
    finish,
    restart,
    replay,
    toggleMic,
    toggleAutoSpeak,
  }
}
