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

// Netlify Function có trần thực thi ~26s -> mỗi lần gọi Groq tối đa 18s, và chỉ
// retry được ĐÚNG 1 lần (18s x 2 + backoff vẫn còn dư margin cho phần code còn lại).
const REQUEST_TIMEOUT_MS = 18000
const MAX_RETRIES = 1
const BASE_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 4000

/** Lỗi gọi AI có `code` để client/hàm gọi phân loại (rate_limited/timeout/upstream/...). */
export class AiError extends Error {
  constructor(message, code = 'upstream') {
    super(message)
    this.name = 'AiError'
    this.code = code
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Thời gian chờ trước lần retry: ưu tiên header Retry-After, else exponential + jitter, có trần. */
function backoffDelay(attempt, retryAfterHeader) {
  const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : NaN
  if (Number.isFinite(retryAfterMs) && retryAfterMs > 0) return Math.min(retryAfterMs, MAX_BACKOFF_MS)
  const base = BASE_BACKOFF_MS * 2 ** attempt
  return Math.min(base + Math.random() * 300, MAX_BACKOFF_MS)
}

/**
 * Gửi 1 request chat/completions tới Groq với timeout + retry (429/5xx/mạng/timeout).
 * Trả về nội dung reply thô (string). Ném `AiError` với `code` phù hợp khi hết cách.
 * @param {{ messages, temperature, maxTokens, json? }} args
 */
export async function groqRequest({ messages, temperature = 0.7, maxTokens = 400, json = false }, key) {
  const body = { model: MODEL, messages, temperature, max_tokens: maxTokens }
  if (json) body.response_format = { type: 'json_object' }

  let lastErr
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    let res
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (e) {
      lastErr =
        e?.name === 'AbortError'
          ? new AiError('AI phản hồi quá lâu, thử lại nhé.', 'timeout')
          : new AiError('Không kết nối được tới máy chủ AI.', 'network')
      if (attempt < MAX_RETRIES) {
        await sleep(backoffDelay(attempt))
        continue
      }
      throw lastErr
    } finally {
      clearTimeout(timer)
    }

    if (res.ok) {
      const data = await res.json()
      const reply = data?.choices?.[0]?.message?.content || ''
      if (!reply) throw new AiError('AI không trả về nội dung. Thử lại nhé.', 'upstream')
      return reply.trim()
    }

    if (res.status === 429) {
      lastErr = new AiError('Đã chạm giới hạn tốc độ Groq (429). Đợi vài giây rồi thử lại.', 'rate_limited')
      if (attempt < MAX_RETRIES) {
        await sleep(backoffDelay(attempt, res.headers?.get?.('retry-after')))
        continue
      }
      throw lastErr
    }
    if (res.status === 401) throw new AiError('GROQ_API_KEY không hợp lệ. Kiểm tra lại key ở console.groq.com.', 'config')
    if (res.status >= 500) {
      lastErr = new AiError(`AI đang gặp sự cố (Groq ${res.status}).`, 'upstream')
      if (attempt < MAX_RETRIES) {
        await sleep(backoffDelay(attempt))
        continue
      }
      throw lastErr
    }
    // 4xx khác (400 sai payload…): lỗi phía mình, retry không giúp được gì.
    const detail = await res.text().catch(() => '')
    throw new AiError(`Groq API ${res.status}: ${detail.slice(0, 200)}`, 'bad_request')
  }
  throw lastErr
}

/** Dựng { status, body } chuẩn hoá từ một lỗi AiError (hoặc Error thường) để trả về client. */
export function errorResponse(e) {
  const code = e?.code || 'upstream'
  const status =
    code === 'rate_limited' ? 429 : code === 'timeout' ? 504 : code === 'bad_request' ? 400 : code === 'config' ? 500 : 502
  return { status, body: { error: { code, message: e?.message || 'Lỗi không xác định' } } }
}

/**
 * Phong cách "lời phê" của AI khi chấm câu. Lời phê LUÔN bằng tiếng Việt cho dễ
 * hiểu; câu sửa & câu trả lời mẫu thì bằng tiếng Anh. Mỗi persona chỉ đổi GIỌNG
 * ĐIỆU, không đổi nội dung kỹ thuật (vẫn phải chỉ ra lỗi rõ ràng).
 */
export const PERSONAS = {
  cotnha: {
    label: 'Cợt nhả',
    tone:
      'Giọng cợt nhả, lầy lội, hỗn HẾT CỠ kiểu đứa bạn thân mất dạy nhưng có tâm. ' +
      'Cà khịa cái lỗi sai không nương tay, xài slang Gen-Z + meme tiếng Việt thả ga ' +
      '("tới công chuyện luôn á", "cười xỉu", "trời ơi tin được không", "thôi xong", "u là trời", "mượt như sin"), ' +
      'chêm emoji 💀😂🤡. Phóng đại lỗi cho hài, chốt bằng cách sửa đúng ngay sau đó. ' +
      'Cấm: từ tục tĩu/chửi thề, slur, body-shaming, hay đụng tới giá trị/nhân phẩm người học. ' +
      'Roast cái LỖI thật gắt — KHÔNG roast con người. Hỗn về câu chữ, không hỗn về nhân cách.',
  },
  chuiboi: {
    label: 'Chửi bới',
    tone:
      'Giọng "chửi yêu" lên đỉnh: đập bàn, gào lên, cường điệu kịch tính kiểu bà hàng xóm chửi mất gà ' +
      'nhưng nội dung là roast cái lỗi tiếng Anh. Drama HẾT NẤC, chì chiết cái sai và sự lười, ' +
      'xài "ối giời ơi", "trời đất quỷ thần ơi", "cái này mà cũng sai được hả", "học kiểu gì vậy trời", ' +
      'thán từ + emoji 😤🔥💢. Chửi xong PHẢI quay xe chỉ ra lỗi cụ thể và câu đúng. ' +
      'Cấm tuyệt đối: từ tục tĩu/chửi thề thật, slur, đe dọa, hạ nhục ngoại hình/trí tuệ/nhân phẩm. ' +
      'Mục tiêu: người học vừa quê vừa bật cười rồi nhớ đời mà sửa. Gắt với LỖI, không gắt với NGƯỜI.',
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

/**
 * Dựng system prompt cho SURPRISE ROLEPLAY: AI đóng vai một tình huống bất ngờ
 * (khách khó tính, người hỏi đường vội…), người học KHÔNG biết trước câu hỏi kế
 * tiếp, và AI chủ động đổi đề tài/thêm biến cố giữa chừng — mô phỏng hội thoại
 * thật ngoài đời. Vẫn trả JSON cùng cấu trúc {evaluation, next} như COACH để tái
 * dùng nguyên luồng chấm câu ở client.
 */
export function buildRoleplayPrompt(context = {}, persona = DEFAULT_PERSONA) {
  const { vocabLine, grammarLine, topic } = contextLines(context)
  const p = PERSONAS[persona] || PERSONAS[DEFAULT_PERSONA]
  const scenario = context.scenario || 'You are a stranger having an everyday conversation with the learner.'
  const wantSuggest = context.suggestWords !== false

  return [
    'You are running a SURPRISE ROLEPLAY exercise for a Vietnamese English learner (CEFR A1-B2).',
    topic,
    `Target vocabulary to weave in if natural: ${vocabLine}.`,
    `Grammar focus: ${grammarLine}.`,
    '',
    `SCENARIO — stay fully in character as this role: ${scenario}`,
    'The learner does NOT know your next line in advance. Do not preview, explain, or break character to describe the exercise.',
    'After a few exchanges, UNEXPECTEDLY change the topic, add a complication, or ask a tricky follow-up — like a real unpredictable conversation. Never announce the change.',
    '',
    'On EACH turn you do TWO things at once and return ONE JSON object:',
    "1) EVALUATE the learner's most recent message (their English, not their in-character choice).",
    '2) CONTINUE the roleplay in character with your next line.',
    '',
    `Feedback persona (giọng điệu lời phê, ngoài vai diễn): ${p.label}. ${p.tone}`,
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
    '    "message": "your in-character next line, 1-3 sentences, natural English",',
    wantSuggest
      ? '    "suggestedWords": ["up to 3 words (prefer the target vocabulary) the learner should try to use in their NEXT reply"]'
      : '    "suggestedWords": []',
    '  }',
    '}',
    '',
    'Rules:',
    '- "corrected", "recommended", "message" are ENGLISH. "feedback", "recommendedVi" are VIETNAMESE.',
    '- If the learner has not written anything yet, set "evaluation" to null and OPEN the roleplay in character with your first line.',
    '- Keep pushing the target vocabulary naturally, but the scenario always comes first.',
    '- Never break character in "message". Only "feedback" speaks as the coach persona.',
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

/**
 * Dựng system prompt cho chế độ ERROR DRILL: sinh bài tập LUYỆN LẠI đúng kiểu
 * lỗi người học đã mắc trong tuần (Bước 5.4 — "Trợ lý ôn sổ lỗi"). `context.errors`
 * là mảng { wrong, right, note } gom từ bài viết đã chữa + Sổ lỗi + câu quiz sai
 * (xem src/lib/errorDrillStats.js#collectWeekErrors) — KHÔNG lặp lại nguyên câu
 * cũ, chỉ luyện lại đúng DẠNG lỗi đó với câu mới.
 */
export function buildErrorDrillPrompt(context = {}) {
  const { grammarLine, topic } = contextLines(context)
  const errors = Array.isArray(context.errors) ? context.errors : []
  const errorLines = errors.length
    ? errors
        .map((e, i) => `${i + 1}. Wrong: "${e.wrong}" -> Correct: "${e.right}"${e.note ? ` (note: ${e.note})` : ''}`)
        .join('\n')
    : '(no recorded mistakes this week — invent common CEFR A2-B1 mistakes for a Vietnamese learner instead)'

  return [
    'You are an exercise generator creating a PERSONALIZED practice drill for a Vietnamese English learner (CEFR A1-B2).',
    topic,
    `Grammar focus this week: ${grammarLine}.`,
    '',
    'Below are mistakes this learner ACTUALLY made this week (wrong sentence -> corrected sentence):',
    errorLines,
    '',
    'Create EXACTLY 5 short exercises that target the SAME KINDS of mistakes above (same grammar/vocab point), using NEW sentences — do not reuse the exact wrong/correct sentences verbatim.',
    'Each exercise is one of:',
    '  - "cloze": a sentence with one blank ("_____") testing the point; "answer" = array of acceptable exact words/phrases for the blank.',
    '  - "error": one WRONG sentence (with a mistake of the same kind) the learner must rewrite correctly; "answer" = array of acceptable corrected forms.',
    '',
    'Return ONLY a valid JSON object with EXACTLY this shape (no markdown, no extra text):',
    '{',
    '  "questions": [',
    '    { "type": "cloze"|"error", "q": "the exercise sentence", "answer": ["accepted answer", "..."], "ex": "SHORT Vietnamese explanation of the grammar/vocab point" }',
    '  ]',
    '}',
    'Rules:',
    '- Exactly 5 items in "questions", mixing "cloze" and "error" types.',
    '- "q" and "answer" values are ENGLISH; "ex" is VIETNAMESE.',
    '- Keep sentences short and natural, appropriate for CEFR A2-B1.',
    '- Output JSON only.',
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Dựng system prompt cho chế độ CARD: người học tự tạo 1 thẻ flashcard mới
 * (chỉ gõ từ, để trống nghĩa/ví dụ) — AI điền nốt IPA/nghĩa/câu ví dụ trong
 * MỘT lần gọi duy nhất. Ảnh minh họa KHÔNG qua AI (đã tự động lấy từ Wikipedia
 * theo từ, xem VocabIllustration.vue).
 */
export function buildCardPrompt() {
  return [
    'You are a bilingual English-Vietnamese dictionary helping a Vietnamese learner create a vocabulary flashcard.',
    'The user sends ONE English word or short phrase.',
    'Return ONLY a valid JSON object with EXACTLY this shape (no markdown, no extra text):',
    '{',
    '  "pos": "the word\'s part of speech, in Vietnamese, EXACTLY one of: Danh từ, Động từ, Tính từ, Trạng từ, Cụm từ, Giới từ, Liên từ, Thán từ (pick the single closest match; use \\"Cụm từ\\" for multi-word phrases/idioms)",',
    '  "ipa": "IPA pronunciation with slashes, e.g. /dɪˈplɔɪ/ (empty string if unsure)",',
    '  "vi": "concise Vietnamese meaning, a few words only",',
    '  "ex": "one short natural English example sentence that uses the word"',
    '}',
    'Output JSON only.',
  ].join('\n')
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
  return groqRequest({ messages: chat, temperature, maxTokens, json }, key)
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
  } else if (m === 'roleplay') {
    system = buildRoleplayPrompt(context, persona)
    temperature = 0.9 // cần biến hóa/bất ngờ hơn hội thoại thường
  } else if (m === 'errorDrill') {
    system = buildErrorDrillPrompt(context)
    temperature = 0.5
    maxTokens = 900
  } else if (m === 'card') {
    system = buildCardPrompt()
    temperature = 0.4
    maxTokens = 250
  } else {
    system = m === 'feedback' ? buildFeedbackPrompt(context, persona) : buildCoachPrompt(context, persona)
    // Persona "gắt" cần thêm chất lầy/biến hóa — nâng nhiệt để bớt ra giọng nhạt, lặp.
    if (persona === 'cotnha' || persona === 'chuiboi') temperature = 0.95
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
    throw new AiError('AI trả về định dạng không hợp lệ. Thử lại nhé.', 'upstream')
  return { reply: parsed }
}
