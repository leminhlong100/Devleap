import { AiCallError } from './aiError.js'

/**
 * Gọi backend chat AI (Netlify Function / dev proxy). Gửi lịch sử hội thoại +
 * ngữ cảnh bài học, nhận về câu trả lời của AI. API key nằm hoàn toàn ở server.
 */
const ENDPOINT = '/.netlify/functions/chat'

/**
 * Gọi backend chat. Tùy `mode`:
 *  - mặc định/'coach': trả về OBJECT có cấu trúc { evaluation, next }.
 *  - 'translate' | 'hint' | 'idea' | 'word': trả về string.
 * @param {{ messages?: Array<{role,text}>, context?: object, persona?: string, mode?: string }} args
 * @throws {AiCallError} luôn có `.code` (xem netlify/functions/_llm.js#errorResponse)
 *   để `friendlyAiError()` (src/lib/aiError.js) phân loại thông điệp hiển thị.
 */
export async function sendChat({ messages = [], context = {}, persona, mode }) {
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context, persona, mode }),
    })
  } catch {
    throw new AiCallError('Không kết nối được máy chủ AI. Kiểm tra mạng hoặc cấu hình API.', 'network')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Format mới: { error: { code, message } }. Vẫn đỡ được format cũ (string) phòng lệch bản.
    const err = data.error
    const { code, message } =
      err && typeof err === 'object' ? err : { code: 'upstream', message: err || `Lỗi máy chủ (${res.status})` }
    throw new AiCallError(message, code)
  }
  return data.reply
}

/**
 * Một lượt COACH: vừa chấm câu vừa nói tiếp. Trả về { evaluation, next }.
 * @param {{ messages, context, persona }} args
 */
export async function coachTurn({ messages, context, persona }) {
  const reply = await sendChat({ messages, context, persona, mode: 'coach' })
  if (!reply || typeof reply !== 'object') throw new Error('AI trả về định dạng không hợp lệ.')
  return reply
}

/**
 * Một lượt SURPRISE ROLEPLAY: AI đóng vai tình huống bất ngờ (context.scenario),
 * chủ động đổi đề tài giữa chừng, vẫn vừa chấm câu vừa nói tiếp như coachTurn.
 * @param {{ messages, context, persona }} args  context nên có thêm `scenario`.
 */
export async function roleplayTurn({ messages, context, persona }) {
  const reply = await sendChat({ messages, context, persona, mode: 'roleplay' })
  if (!reply || typeof reply !== 'object') throw new Error('AI trả về định dạng không hợp lệ.')
  return reply
}

/**
 * DEBRIEF cuối buổi nhập vai (khóa "Giao Tiếp Thực Chiến"): gửi CẢ transcript +
 * rubric của tình huống, nhận về tổng kết { score, rubric[], errors[], upgrades[],
 * summary }. Chỉ gọi 1 lần/buổi (tiết kiệm quota) — xem useChatEngine.runDebrief.
 * @param {{ messages, context, persona }} args  context nên có `rubric` (mảng tiêu chí).
 */
export async function debriefTurn({ messages, context, persona }) {
  const reply = await sendChat({ messages, context, persona, mode: 'debrief' })
  if (!reply || typeof reply !== 'object') throw new Error('AI trả về định dạng không hợp lệ.')
  return reply
}

/**
 * Chấm LẠI câu cuối theo một persona khác (đổi phong cách lời phê tại chỗ).
 * @param {{ messages, context, persona }} args  messages kết thúc ở lượt user cần chấm.
 * @returns {Promise<object>} evaluation { corrected, cefr, feedback, recommended, recommendedVi }
 */
export async function reFeedback({ messages, context, persona }) {
  const reply = await sendChat({ messages, context, persona, mode: 'feedback' })
  if (!reply || typeof reply !== 'object') throw new Error('AI trả về định dạng không hợp lệ.')
  return reply.evaluation || null
}

/**
 * Nhờ AI CHỮA bài tập viết (1 lần gọi, không cần lịch sử). Trả về review:
 * { cefr, score, summary, lines: [{ original, corrected, ok, note }] }.
 * @param {string} text  toàn bộ bài viết của người học (mỗi câu một dòng).
 * @param {object} context  ngữ cảnh bài học (title, week, vocab, grammar…).
 */
export async function correctWriting(text, context = {}) {
  const reply = await sendChat({
    messages: [{ role: 'user', text: String(text || '').trim() }],
    context,
    mode: 'correct',
  })
  if (!reply || typeof reply !== 'object') throw new Error('AI trả về định dạng không hợp lệ.')
  return reply.review || null
}

/**
 * Nhờ AI sinh 5 bài tập LUYỆN LẠI đúng kiểu lỗi người học đã mắc trong tuần
 * (Bước 5.4 — Trợ lý ôn sổ lỗi). Trả về mảng câu hỏi thô từ AI — gọi
 * `sanitizeDrillQuestions()` (src/lib/errorDrillStats.js) trước khi render qua
 * QuizTool để bỏ mục hỏng.
 * @param {Array<{wrong: string, right: string, note: string}>} errors  gom qua collectWeekErrors().
 * @param {object} context  ngữ cảnh bài học (title, week, grammar…).
 */
export async function generateErrorDrill(errors, context = {}) {
  const reply = await sendChat({
    messages: [{ role: 'user', text: 'Generate the drill now.' }],
    context: { ...context, errors },
    mode: 'errorDrill',
  })
  if (!reply || typeof reply !== 'object') throw new Error('AI trả về định dạng không hợp lệ.')
  return reply.questions || []
}

/**
 * Giải thích "vì sao" đáp án đúng/sai cho một câu quiz (tiếng Việt). Trả về text.
 * @param {{ question: string, options?: string[]|null, correct: string, chosen?: string }} q
 */
export async function explainQuiz({ question, options, correct, chosen } = {}, context = {}) {
  const optLine = Array.isArray(options) && options.length ? `Options: ${options.join(' | ')}\n` : ''
  const text = `Question: ${question}\n${optLine}Correct answer: ${correct}\nLearner's answer: ${chosen || '(để trống)'}`
  return sendChat({ messages: [{ role: 'user', text }], context, mode: 'explain' })
}

/**
 * Nhờ AI xác nhận câu trả lời của học viên có CÙNG NGHĨA với đáp án mong đợi không
 * (chấm paraphrase cho bài đọc hiểu). Trả về boolean.
 * @param {string} expected  đáp án mẫu
 * @param {string} answer    câu học viên gõ
 */
export async function checkParaphrase(expected, answer) {
  const reply = await sendChat({
    messages: [{ role: 'user', text: `Expected answer: ${expected}\nLearner's answer: ${answer}` }],
    mode: 'equiv',
  })
  return /\byes\b/i.test(String(reply || ''))
}

/** Gợi ý CÁCH trả lời (tiếng Việt) cho một câu hỏi của AI. */
export async function getHint(question, context = {}) {
  return sendChat({ messages: [{ role: 'user', text: String(question || '') }], context, mode: 'hint' })
}

/** Một câu trả lời mẫu (tiếng Anh) khi người học bí ý tưởng. */
export async function getIdea(question, context = {}) {
  return sendChat({ messages: [{ role: 'user', text: String(question || '') }], context, mode: 'idea' })
}

/** Dịch nhanh một từ/cụm sang tiếng Việt (mặt sau flashcard / tra tại chỗ). */
export async function translateWord(word) {
  const reply = await sendChat({
    messages: [{ role: 'user', text: String(word || '').trim() }],
    mode: 'word',
  })
  return String(reply || '').trim().replace(/^["“”']+|["“”']+$/g, '')
}

/**
 * Dịch một đoạn tiếng Anh sang tiếng Việt (chế độ 'translate'). Dùng khi lưu cả
 * câu để học flashcard, hoặc bấm "Dịch câu hỏi?".
 * @param {string} text
 * @returns {Promise<string>} bản dịch tiếng Việt
 */
export async function translateToVi(text) {
  const reply = await sendChat({
    messages: [{ role: 'user', text: String(text || '').trim() }],
    mode: 'translate',
  })
  // Bỏ ngoặc kép bao quanh nếu model lỡ thêm vào.
  return String(reply || '').trim().replace(/^["“”']+|["“”']+$/g, '')
}

/**
 * Tự tạo loại từ (danh/động/tính/trạng từ...)/IPA/nghĩa/câu ví dụ cho MỘT từ
 * mới (dùng khi người học tự thêm thẻ flashcard và để trống các ô này). Ảnh
 * minh họa KHÔNG qua AI — tự động lấy theo từ ở VocabIllustration.vue, không
 * cần sinh/chọn ảnh ở đây.
 * @param {string} word
 * @returns {Promise<{pos: string, ipa: string, vi: string, ex: string, family: Array<{word:string,pos:string,vi:string}>, collocations: string[]}>}
 */
export async function generateCard(word) {
  const reply = await sendChat({
    messages: [{ role: 'user', text: String(word || '').trim() }],
    mode: 'card',
  })
  const r = reply && typeof reply === 'object' ? reply : {}
  const family = Array.isArray(r.family)
    ? r.family
        .map((f) => ({
          word: String(f?.word || '').trim(),
          pos: String(f?.pos || '').trim(),
          vi: String(f?.vi || '').trim(),
        }))
        .filter((f) => f.word)
    : []
  const collocations = Array.isArray(r.collocations)
    ? r.collocations.map((c) => String(c || '').trim()).filter(Boolean)
    : []
  return {
    pos: String(r.pos || '').trim(),
    ipa: String(r.ipa || '').trim(),
    vi: String(r.vi || '').trim(),
    ex: String(r.ex || '').trim(),
    family,
    collocations,
  }
}
