/**
 * Lõi gọi LLM cho chat luyện tiếng Anh — dùng chung cho Netlify Function
 * (production) và plugin Vite dev (xem vite.config.js). File bắt đầu bằng "_"
 * nên Netlify coi là module phụ trợ, KHÔNG deploy thành function riêng.
 *
 * Nhà cung cấp: Groq (API tương thích OpenAI), free tier rộng. API key luôn ở
 * phía server (env var / .env.local đọc trong Node), không lộ ra bundle client.
 *
 * Có 2 lớp "trí tuệ":
 *   1) COACH (mặc định) — vừa CHẤM câu vừa NÓI TIẾP trong 1 lần gọi, trả JSON có
 *      cấu trúc: { evaluation, next }. evaluation gồm câu sửa + điểm CEFR + lời
 *      phê theo "phong cách" (persona) hài hước + câu trả lời mẫu.
 *   2) Phụ trợ (mode 'translate' | 'hint' | 'idea' | 'word') — trả về text ngắn,
 *      gọi theo yêu cầu (bấm "Dịch câu hỏi?", "Xem gợi ý", "Bí ý tưởng?", chạm từ).
 */

// Model đổi được qua env GROQ_MODEL. Mặc định llama-3.3-70b: chất lượng tốt cho
// hội thoại; muốn nhanh/nhẹ hơn có thể dùng llama-3.1-8b-instant.
const MODEL = (typeof process !== 'undefined' && process.env?.GROQ_MODEL) || 'llama-3.3-70b-versatile'
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Phong cách "lời phê" của AI khi chấm câu. Lời phê LUÔN bằng tiếng Việt cho dễ
 * hiểu; câu sửa & câu trả lời mẫu thì bằng tiếng Anh. Mỗi persona chỉ đổi GIỌNG
 * ĐIỆU, không đổi nội dung kỹ thuật (vẫn phải chỉ ra lỗi rõ ràng).
 */
export const PERSONAS = {
  cotnha: {
    label: 'Cợt nhả',
    tone:
      'Giọng cợt nhả, hài hước, trêu chọc nhẹ kiểu bạn bè thân. Được pha trò, dùng emoji. ' +
      'CHỈ trêu cái LỖI SAI cho vui, tuyệt đối không xúc phạm hay hạ thấp người học.',
  },
  chuiboi: {
    label: 'Chửi bới',
    tone:
      'Giọng "chửi yêu" cường điệu, cà khịa mạnh kiểu đập bàn cho vui, hài hước kiểu roast. ' +
      'CHỈ roast cái lỗi sai và sự lười biếng, KHÔNG dùng từ tục tĩu, KHÔNG hạ thấp nhân phẩm. ' +
      'Mục tiêu: khiến người học bật cười rồi tự sửa.',
  },
  gaubong: {
    label: 'Gấu bông',
    tone:
      'Giọng ấm áp, động viên, kiên nhẫn như gấu bông. Khen điểm tốt trước rồi nhẹ nhàng gợi ý sửa. ' +
      'Phù hợp người mới hoặc đang ngại nói.',
  },
  nghiemtuc: {
    label: 'Nghiêm túc',
    tone:
      'Giọng giáo viên chuyên nghiệp, đi thẳng trọng tâm, không đùa. Chỉ rõ lỗi ngữ pháp/từ vựng ' +
      'cụ thể và cách sửa chuẩn xác, ngắn gọn.',
  },
}
const DEFAULT_PERSONA = 'cotnha'

/** Tóm tắt ngữ cảnh bài học thành vài dòng để nhét vào system prompt. */
function contextLines(context = {}) {
  const { title, week, weekTitle, exam, vocab = [], grammar = [] } = context
  const vocabLine = vocab.length ? vocab.join(', ') : '(none specified)'
  const grammarLine = grammar.length ? grammar.join('; ') : '(general English)'
  const topic = title
    ? `Lesson topic: "${title}"${week ? ` (Week ${week}${weekTitle ? `: ${weekTitle}` : ''})` : ''}.`
    : ''
  const examLine = exam && exam !== 'none' ? `Exam focus: ${exam.toUpperCase()}.` : ''
  return { vocabLine, grammarLine, topic, examLine }
}

/** Dựng system prompt cho COACH (chấm + nói tiếp, trả JSON). */
export function buildCoachPrompt(context = {}, persona = DEFAULT_PERSONA) {
  const { vocabLine, grammarLine, topic, examLine } = contextLines(context)
  const p = PERSONAS[persona] || PERSONAS[DEFAULT_PERSONA]
  const wantSuggest = context.suggestWords !== false

  return [
    'You are an English conversation coach for a Vietnamese learner (around CEFR A1–B2).',
    topic,
    examLine,
    `Target vocabulary to weave in: ${vocabLine}.`,
    `Grammar focus: ${grammarLine}.`,
    '',
    'On EACH turn you do TWO things at once and return ONE JSON object:',
    '1) EVALUATE the learner\'s most recent message.',
    '2) CONTINUE the conversation with your next line.',
    '',
    `Feedback persona (giọng điệu lời phê): ${p.label}. ${p.tone}`,
    '',
    'Return ONLY a valid JSON object with EXACTLY this shape (no markdown, no extra text):',
    '{',
    '  "evaluation": {',
    '    "corrected": "the learner\'s sentence rewritten in correct, natural English (keep their meaning). If already correct, repeat it.",',
    '    "cefr": "one of A1,A2,B1,B2,C1 — estimated level of the learner\'s message",',
    '    "feedback": ["1 to 2 SHORT lines in VIETNAMESE, in the persona tone above, pointing out what to fix and why"],',
    '    "recommended": "a better example answer in natural English the learner could have said",',
    '    "recommendedVi": "Vietnamese translation of recommended"',
    '  },',
    '  "next": {',
    `    "message": "your next conversational line in simple natural English, 2-3 sentences, ending with ONE follow-up question",`,
    wantSuggest
      ? '    "suggestedWords": ["up to 3 words (prefer the target vocabulary) the learner should try to use in their NEXT reply"]'
      : '    "suggestedWords": []',
    '  }',
    '}',
    '',
    'Rules:',
    '- "corrected", "recommended", "message" are ENGLISH. "feedback", "recommendedVi" are VIETNAMESE.',
    '- If the learner has not written anything yet, set "evaluation" to null.',
    '- Keep the conversation on the lesson topic and naturally push the target vocabulary.',
    '- Never break character of the chosen persona in the "feedback" field.',
    '- Output JSON only.',
  ]
    .filter(Boolean)
    .join('\n')
}

/** Dựng system prompt cho chế độ FEEDBACK: chỉ chấm lại câu cuối theo persona. */
export function buildFeedbackPrompt(context = {}, persona = DEFAULT_PERSONA) {
  const { vocabLine, examLine } = contextLines(context)
  const p = PERSONAS[persona] || PERSONAS[DEFAULT_PERSONA]
  return [
    'You are an English conversation coach for a Vietnamese learner.',
    examLine,
    `Target vocabulary: ${vocabLine}.`,
    `Feedback persona (giọng điệu lời phê): ${p.label}. ${p.tone}`,
    '',
    'EVALUATE only the learner\'s most recent message. Return ONLY this JSON (no extra text):',
    '{',
    '  "evaluation": {',
    '    "corrected": "their sentence rewritten correctly in natural English (English)",',
    '    "cefr": "one of A1,A2,B1,B2,C1",',
    '    "feedback": ["1-2 SHORT lines in VIETNAMESE in the persona tone above"],',
    '    "recommended": "a better example answer in English",',
    '    "recommendedVi": "Vietnamese translation of recommended"',
    '  }',
    '}',
    'Output JSON only.',
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Dựng system prompt cho chế độ CORRECT: chữa bài tập VIẾT của người học.
 * Trả JSON: nhận xét tổng thể (CEFR, điểm, tóm tắt) + sửa TỪNG câu (sai chỗ nào).
 */
export function buildCorrectionPrompt(context = {}) {
  const { grammarLine, topic } = contextLines(context)
  return [
    'You are a strict but encouraging English writing tutor for a Vietnamese learner (CEFR A1–B2).',
    topic,
    `Grammar focus of this exercise: ${grammarLine}.`,
    '',
    "The user message is the learner's writing — usually several short sentences, one per line.",
    'Correct EACH sentence and give an overall assessment.',
    'Return ONLY a valid JSON object with EXACTLY this shape (no markdown, no extra text):',
    '{',
    '  "review": {',
    '    "cefr": "one of A1,A2,B1,B2,C1 — estimated level of the writing",',
    '    "score": 0-100 integer (overall correctness + naturalness),',
    '    "summary": "1-2 SHORT lines in VIETNAMESE: what was good and the main thing to fix",',
    '    "lines": [',
    '      {',
    '        "original": "the learner sentence exactly as written",',
    '        "corrected": "the same sentence in natural correct English (repeat unchanged if already correct)",',
    '        "ok": true if the sentence is essentially correct else false,',
    '        "note": "SHORT Vietnamese note explaining the fix; empty string \\"\\" if ok",',
    '        "subject": "the SUBJECT of the corrected sentence, copied EXACTLY as a substring of corrected (e.g. \\"My brother\\"); empty string if none",',
    '        "verb": "the MAIN VERB (incl. auxiliary, e.g. \\"is\\", \\"have studied\\") of the corrected sentence, copied EXACTLY as a substring of corrected; empty string if none"',
    '      }',
    '    ]',
    '  }',
    '}',
    'Rules:',
    '- Exactly ONE entry in "lines" per non-empty learner sentence, in the original order.',
    '- "corrected" is ENGLISH; "summary" and "note" are VIETNAMESE.',
    '- Be specific in notes (vd: thiếu "to" sau "go", sai thì quá khứ, thiếu mạo từ "a/the", sai chính tả).',
    '- "subject" and "verb" MUST be exact substrings of "corrected" so they can be highlighted.',
    '- Pay special attention to the grammar focus above.',
    '- Output JSON only.',
  ]
    .filter(Boolean)
    .join('\n')
}

/** Dựng system prompt cho các chế độ phụ trợ trả TEXT ngắn. */
export function buildSystemPrompt(context = {}) {
  const mode = context.mode

  if (mode === 'translate') {
    return [
      'You are a precise English-to-Vietnamese translator.',
      'Translate the user message into natural, fluent Vietnamese.',
      'Reply with ONLY the Vietnamese translation — no quotes, no notes, no English, no extra sentences.',
    ].join('\n')
  }

  if (mode === 'word') {
    return [
      'You are a concise bilingual dictionary.',
      'The user sends ONE English word or short phrase.',
      'Reply with ONLY its Vietnamese meaning in a few words — no English, no IPA, no examples, no punctuation at the end.',
    ].join('\n')
  }

  const { vocabLine, grammarLine, topic } = contextLines(context)

  if (mode === 'hint') {
    return [
      'You are a helpful English tutor for a Vietnamese learner.',
      topic,
      `Useful vocabulary: ${vocabLine}.`,
      'The user message is the question they need to answer.',
      'Reply in VIETNAMESE with a SHORT hint (1-2 sentences) on HOW to answer: structure, a useful phrase, or what to mention. Do NOT give the full English answer.',
    ]
      .filter(Boolean)
      .join('\n')
  }

  if (mode === 'idea') {
    return [
      'You are a helpful English tutor for a Vietnamese learner who is stuck.',
      topic,
      `Try to use this vocabulary if natural: ${vocabLine}.`,
      'The user message is the question they need to answer.',
      'Reply with ONE simple, natural English sample answer (1-2 sentences) they could say. English only, no Vietnamese, no quotes.',
    ]
      .filter(Boolean)
      .join('\n')
  }

  // Fallback: hội thoại tự do cũ (giữ để tương thích nếu gọi không kèm mode).
  return [
    'You are a friendly, patient English conversation tutor for a Vietnamese learner (around IELTS band 5–6.5).',
    topic,
    `Target vocabulary to practise: ${vocabLine}.`,
    `Grammar focus: ${grammarLine}.`,
    '',
    'Rules:',
    '- Always reply in English, simple and natural. Keep each reply short (2–4 sentences).',
    '- Gently correct grammar/word mistakes, then keep chatting.',
    '- End every reply with ONE short follow-up question.',
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Gửi lịch sử hội thoại tới Groq và trả về câu trả lời (string).
 * @param {{ key, system, messages, json?, temperature?, maxTokens? }} args
 */
export async function askLLM({ key, system, messages = [], json = false, temperature = 0.8, maxTokens = 400 }) {
  const chat = [
    { role: 'system', content: system },
    ...messages
      .filter((m) => m && m.text)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })),
  ]

  const body = { model: MODEL, messages: chat, temperature, max_tokens: maxTokens }
  if (json) body.response_format = { type: 'json_object' }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    if (res.status === 429)
      throw new Error('Đã chạm giới hạn tốc độ Groq (429). Đợi vài giây rồi thử lại.')
    if (res.status === 401)
      throw new Error('GROQ_API_KEY không hợp lệ. Kiểm tra lại key ở console.groq.com.')
    throw new Error(`Groq API ${res.status}: ${detail.slice(0, 200)}`)
  }

  const data = await res.json()
  const reply = data?.choices?.[0]?.message?.content || ''
  if (!reply) throw new Error('Groq không trả về nội dung. Thử lại nhé.')
  return reply.trim()
}

/**
 * Xử lý một yêu cầu chat (dùng chung cho Netlify function & dev proxy).
 * @param {{ messages, context, persona, mode }} payload
 * @param {string} key  GROQ_API_KEY
 * @returns {Promise<{ reply: object|string }>} reply là OBJECT khi mode=coach,
 *   ngược lại là string.
 */
export async function runChat({ messages = [], context = {}, persona, mode } = {}, key) {
  const m = mode || context.mode

  // Chế độ phụ trợ: trả text ngắn.
  if (m === 'translate' || m === 'hint' || m === 'idea' || m === 'word') {
    const reply = await askLLM({
      key,
      system: buildSystemPrompt({ ...context, mode: m }),
      messages,
      temperature: m === 'translate' || m === 'word' ? 0.2 : 0.6,
      maxTokens: m === 'word' ? 40 : 200,
    })
    return { reply }
  }

  // Chế độ CORRECT / FEEDBACK / COACH: trả JSON có cấu trúc.
  let system
  let temperature = 0.6
  let maxTokens = 800
  if (m === 'correct') {
    system = buildCorrectionPrompt(context)
    temperature = 0.3 // chữa bài cần ổn định, ít "sáng tạo"
    maxTokens = 1300 // đủ cho ~10 câu kèm chú thích từng câu
  } else {
    system = m === 'feedback' ? buildFeedbackPrompt(context, persona) : buildCoachPrompt(context, persona)
  }
  const raw = await askLLM({ key, system, messages, json: true, temperature, maxTokens })
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Thử bóc khối JSON đầu tiên nếu model lỡ kèm chữ thừa.
    const s = raw.indexOf('{')
    const e = raw.lastIndexOf('}')
    if (s !== -1 && e > s) {
      try {
        parsed = JSON.parse(raw.slice(s, e + 1))
      } catch {
        /* fall through */
      }
    }
  }
  if (!parsed || typeof parsed !== 'object')
    throw new Error('AI trả về định dạng không hợp lệ. Thử lại nhé.')
  return { reply: parsed }
}
