import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  INTERVIEW_TOPICS,
  QUESTION_BANK,
  CODING_CHALLENGES,
  INTERVIEW_SKILLS,
  LEVELS,
  INTERVIEW_TOTALS,
  CHEATSHEET,
  CRASH_PLAN,
  questionsByTopic,
  pickInterviewSet,
  topicLabel,
  challengesByPattern,
  challengePatterns,
  javaSrsId,
} from '../src/data/javaInterview.js'
import { buildInterviewPrompt, buildInterviewReportPrompt } from '../netlify/functions/_llm.js'

const TOPIC_KEYS = new Set(INTERVIEW_TOPICS.map((t) => t.key))

describe('data/javaInterview — ngân hàng câu hỏi', () => {
  it('id là duy nhất', () => {
    const ids = QUESTION_BANK.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('mọi câu có topic hợp lệ, level hợp lệ, và points không rỗng', () => {
    for (const q of QUESTION_BANK) {
      expect(TOPIC_KEYS.has(q.topic), `topic ${q.topic} (${q.id})`).toBe(true)
      expect(LEVELS).toContain(q.level)
      expect(Array.isArray(q.points) && q.points.length > 0, `points ${q.id}`).toBe(true)
      expect(typeof q.q).toBe('string')
      expect(q.q.length).toBeGreaterThan(0)
      expect(typeof q.answer).toBe('string')
      expect(q.answer.length).toBeGreaterThan(0)
    }
  })

  it('mỗi chủ đề có ít nhất 3 câu (đủ để trải đều)', () => {
    for (const t of INTERVIEW_TOPICS) {
      expect(questionsByTopic(t.key).length, `topic ${t.key}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('INTERVIEW_TOTALS khớp dữ liệu', () => {
    expect(INTERVIEW_TOTALS.questions).toBe(QUESTION_BANK.length)
    expect(INTERVIEW_TOTALS.topics).toBe(INTERVIEW_TOPICS.length)
    expect(INTERVIEW_TOTALS.challenges).toBe(CODING_CHALLENGES.length)
  })

  it('mỗi coding challenge có starter, solution và ít nhất 1 gợi ý', () => {
    for (const c of CODING_CHALLENGES) {
      expect(c.starter).toContain('class Main')
      expect(c.solution).toContain('class Main')
      expect(Array.isArray(c.hints) && c.hints.length > 0).toBe(true)
    }
  })

  it('có bài coding medium/hard hơn (không chỉ easy) và một bài debug code có sẵn', () => {
    const ids = new Set(CODING_CHALLENGES.map((c) => c.id))
    for (const id of ['debug-cme', 'valid-parentheses', 'group-anagrams', 'binary-search', 'merge-intervals', 'lru-cache']) {
      expect(ids.has(id), `thiếu challenge ${id}`).toBe(true)
    }
    expect(CODING_CHALLENGES.some((c) => c.level === 'hard')).toBe(true)
    const debug = CODING_CHALLENGES.find((c) => c.id === 'debug-cme')
    expect(debug.starter).toMatch(/remove\(n\)/) // starter chứa bug thật (xóa trong for-each)
    expect(debug.solution).toMatch(/removeIf/)
  })

  it('mỗi coding challenge có pattern hợp lệ (non-empty string)', () => {
    for (const c of CODING_CHALLENGES) {
      expect(typeof c.pattern, `pattern ${c.id}`).toBe('string')
      expect(c.pattern.length, `pattern ${c.id}`).toBeGreaterThan(0)
    }
  })

  it('phủ đủ dạng bài live-coding hay gặp: linked list, tree, backtracking, sliding window, two-pointer, dp, sorting, ≥3 bài debug', () => {
    const requiredPatterns = ['linked-list', 'tree', 'recursion', 'sliding-window', 'two-pointer', 'dp', 'sorting']
    for (const p of requiredPatterns) {
      expect(challengesByPattern(p).length, `pattern ${p}`).toBeGreaterThan(0)
    }
    expect(challengesByPattern('debug').length).toBeGreaterThanOrEqual(3)
    const ids = new Set(CODING_CHALLENGES.map((c) => c.id))
    for (const id of [
      'linked-list-reverse', 'linked-list-cycle', 'bst-inorder', 'bst-validate',
      'subsets', 'permutations', 'longest-substr-no-repeat', 'container-most-water',
      'climb-stairs', 'coin-change', 'merge-sort', 'debug-integer-cache', 'debug-map-iteration',
    ]) {
      expect(ids.has(id), `thiếu challenge ${id}`).toBe(true)
    }
  })

  it('challengesByPattern lọc đúng và challengePatterns liệt kê không trùng', () => {
    const dp = challengesByPattern('dp')
    expect(dp.length).toBeGreaterThan(0)
    for (const c of dp) expect(c.pattern).toBe('dp')
    expect(challengesByPattern('khong-ton-tai')).toEqual([])

    const patterns = challengePatterns()
    expect(new Set(patterns).size).toBe(patterns.length)
    expect(patterns).toContain('two-pointer')
  })

  it('topicLabel trả nhãn tiếng Việt, fallback về key', () => {
    expect(topicLabel('jpa')).toBe('JPA / Hibernate')
    expect(topicLabel('khong-co')).toBe('khong-co')
  })

  it('javaSrsId tạo namespace "javaq:" ổn định, tái dùng map srs chung', () => {
    expect(javaSrsId('jpa-1')).toBe('javaq:jpa-1')
    expect(javaSrsId(' jpa-1 ')).toBe('javaq:jpa-1')
    expect(javaSrsId('')).toBe('javaq:')
  })

  it('CHEATSHEET có card System Design & Hạ tầng thực tế mới', () => {
    const titles = CHEATSHEET.map((c) => c.title)
    expect(titles.some((t) => t.includes('System Design'))).toBe(true)
    expect(titles.some((t) => t.includes('Hạ tầng'))).toBe(true)
  })

  it('CRASH_PLAN 14 ngày vẫn nguyên vẹn, có nhắc System Design/Hạ tầng', () => {
    expect(CRASH_PLAN.length).toBe(14)
    const blob = CRASH_PLAN.map((d) => `${d.topic} ${d.tasks.join(' ')}`).join(' ')
    expect(blob).toMatch(/System Design/)
    expect(blob).toMatch(/Hạ tầng/)
  })

  it('có đủ chủ đề mở rộng theo CV (frontend, stack thực tế) và mỗi cái đủ câu', () => {
    const keys = new Set(INTERVIEW_TOPICS.map((t) => t.key))
    expect(keys.has('frontend')).toBe(true)
    expect(keys.has('mystack')).toBe(true)
    expect(questionsByTopic('frontend').length).toBeGreaterThanOrEqual(3)
    expect(questionsByTopic('mystack').length).toBeGreaterThanOrEqual(3)
    // Database/SQL được đào sâu thêm.
    expect(questionsByTopic('sql').length).toBeGreaterThanOrEqual(8)
  })

  it('có chủ đề Kafka và Microservice (bổ sung từ ngân hàng thực tế), đủ câu', () => {
    const keys = new Set(INTERVIEW_TOPICS.map((t) => t.key))
    expect(keys.has('kafka')).toBe(true)
    expect(keys.has('microservice')).toBe(true)
    expect(questionsByTopic('kafka').length).toBeGreaterThanOrEqual(3)
    expect(questionsByTopic('microservice').length).toBeGreaterThanOrEqual(3)
  })

  it('có chủ đề "Tình huống & Thiết kế" (scenario) — vá lỗ hổng recall-only, đủ câu', () => {
    const keys = new Set(INTERVIEW_TOPICS.map((t) => t.key))
    expect(keys.has('scenario')).toBe(true)
    expect(questionsByTopic('scenario').length).toBeGreaterThanOrEqual(10)
  })

  it('có chủ đề System Design (design) và Hạ tầng thực tế (infra), đủ câu walkthrough', () => {
    const keys = new Set(INTERVIEW_TOPICS.map((t) => t.key))
    expect(keys.has('design')).toBe(true)
    expect(keys.has('infra')).toBe(true)
    expect(questionsByTopic('design').length).toBeGreaterThanOrEqual(6)
    expect(questionsByTopic('infra').length).toBeGreaterThanOrEqual(6)
  })

  it('các topic từng mỏng (jvm/generics/testing/solid/microservice) nay đủ ≥7 câu', () => {
    for (const key of ['jvm', 'generics', 'testing', 'solid', 'microservice']) {
      expect(questionsByTopic(key).length, `topic ${key}`).toBeGreaterThanOrEqual(7)
    }
  })

  it('bao phủ từ khóa hạ tầng thực tế (Docker/CI-CD/Redis/observability/gRPC/versioning)', () => {
    const blob = QUESTION_BANK.map((q) => `${q.q} ${q.answer}`).join(' ').toLowerCase()
    for (const kw of ['docker', 'multi-stage', 'ci/cd', 'observability', 'grpc', 'versioning', 'circuit breaker']) {
      expect(blob.includes(kw), `thiếu: ${kw}`).toBe(true)
    }
  })

  it('bổ sung caching/connection-pool (Spring) và gotcha rollback (transaction)', () => {
    const blob = QUESTION_BANK.map((q) => `${q.q} ${q.answer}`).join(' ').toLowerCase()
    for (const kw of ['@cacheable', 'hikaricp', 'setrollbackonly', 'transaction timeout']) {
      expect(blob.includes(kw), `thiếu: ${kw}`).toBe(true)
    }
  })

  it('bao phủ các câu hỏi thực tế hay gặp (VPBank & phỏng vấn thật)', () => {
    const blob = QUESTION_BANK.map((q) => `${q.q} ${q.answer}`).join(' ').toLowerCase()
    for (const kw of [
      'throw', 'throws', 'array', 'race condition', 'lifecycle', 'aop',
      '@qualifier', 'csrf', '@preauthorize', 'union all', 'materialized view',
      'cte', 'stored procedure', 'sharding', 'liquibase', 'saga',
      'api gateway', 'service discovery', 'offset', 'dead letter',
    ]) {
      expect(blob.includes(kw), `thiếu chủ đề: ${kw}`).toBe(true)
    }
  })
})

describe('data/javaInterview — INTERVIEW_SKILLS (cá nhân hóa CV)', () => {
  it('có self-intro cả tiếng Việt lẫn tiếng Anh, không rỗng', () => {
    expect(typeof INTERVIEW_SKILLS.selfIntro.vi).toBe('string')
    expect(INTERVIEW_SKILLS.selfIntro.vi.length).toBeGreaterThan(50)
    expect(typeof INTERVIEW_SKILLS.selfIntro.en).toBe('string')
    expect(INTERVIEW_SKILLS.selfIntro.en.length).toBeGreaterThan(50)
  })

  it('mỗi STAR story đủ 4 phần S/T/A/R và có id, title, tags', () => {
    expect(INTERVIEW_SKILLS.starStories.length).toBeGreaterThanOrEqual(3)
    const ids = new Set()
    for (const s of INTERVIEW_SKILLS.starStories) {
      expect(typeof s.id).toBe('string')
      ids.add(s.id)
      expect(s.title.length).toBeGreaterThan(0)
      expect(Array.isArray(s.tags) && s.tags.length > 0).toBe(true)
      for (const k of ['situation', 'task', 'action', 'result']) {
        expect(typeof s[k], `${s.id}.${k}`).toBe('string')
        expect(s[k].length, `${s.id}.${k}`).toBeGreaterThan(0)
      }
    }
    expect(ids.size).toBe(INTERVIEW_SKILLS.starStories.length)
  })

  it('câu hỏi HR có q + tip + sample; có ask-them, negotiation, dos/donts', () => {
    for (const h of INTERVIEW_SKILLS.hrQuestions) {
      expect(h.q.length).toBeGreaterThan(0)
      expect(h.tip.length).toBeGreaterThan(0)
      expect(h.sample.length).toBeGreaterThan(0)
    }
    expect(INTERVIEW_SKILLS.askThem.length).toBeGreaterThan(0)
    expect(INTERVIEW_SKILLS.negotiation.length).toBeGreaterThan(0)
    expect(INTERVIEW_SKILLS.dosDonts.dos.length).toBeGreaterThan(0)
    expect(INTERVIEW_SKILLS.dosDonts.donts.length).toBeGreaterThan(0)
  })

  it('INTERVIEW_TOTALS.stories khớp số STAR story', () => {
    expect(INTERVIEW_TOTALS.stories).toBe(INTERVIEW_SKILLS.starStories.length)
  })

  it('mỗi STAR story nhắc định lượng số liệu thật (không bịa số) trong result', () => {
    for (const s of INTERVIEW_SKILLS.starStories) {
      expect(s.result, `${s.id}.result`).toMatch(/\[Nếu nhớ được:.*\]/)
    }
    expect(INTERVIEW_SKILLS.dosDonts.dos.some((d) => /số liệu THẬT/.test(d))).toBe(true)
  })
})

describe('data/javaInterview — pickInterviewSet', () => {
  it('tôn trọng count và không trùng câu', () => {
    const set = pickInterviewSet({ count: 6 })
    expect(set.length).toBe(6)
    expect(new Set(set.map((q) => q.id)).size).toBe(6)
  })

  it('lọc đúng theo topics', () => {
    const set = pickInterviewSet({ topics: ['jpa', 'spring'], count: 5 })
    expect(set.length).toBeGreaterThan(0)
    for (const q of set) expect(['jpa', 'spring']).toContain(q.topic)
  })

  it('lọc đúng theo level', () => {
    const set = pickInterviewSet({ level: 'easy', count: 5 })
    for (const q of set) expect(q.level).toBe('easy')
  })

  it('bỏ qua topic không hợp lệ (không crash, dùng toàn bộ pool)', () => {
    const set = pickInterviewSet({ topics: ['khong-ton-tai'], count: 4 })
    expect(set.length).toBe(4)
  })

  it('seed khác nhau cho thứ tự bắt đầu khác nhau', () => {
    const a = pickInterviewSet({ topics: ['core'], count: 4, seed: 0 })
    const b = pickInterviewSet({ topics: ['core'], count: 4, seed: 2 })
    // Cùng pool nhưng điểm bắt đầu lệch -> id đầu tiên thường khác nhau.
    expect(a.map((q) => q.id)).not.toEqual(b.map((q) => q.id))
  })

  it('count lớn hơn pool -> trả tối đa pool có được, không lặp', () => {
    const set = pickInterviewSet({ topics: ['generics'], count: 999 })
    const pool = questionsByTopic('generics')
    expect(set.length).toBe(pool.length)
    expect(new Set(set.map((q) => q.id)).size).toBe(pool.length)
  })
})

describe('netlify/functions/_llm.js — buildInterviewPrompt', () => {
  it('nhúng khuôn JSON và số câu, đổi ngôn ngữ theo lang', () => {
    const vi = buildInterviewPrompt({ lang: 'vi', topics: ['JPA / Hibernate'], count: 8 })
    expect(vi).toContain('"evaluation"')
    expect(vi).toContain('"next"')
    expect(vi).toContain('"score"')
    expect(vi).toContain('8 questions total')
    expect(vi).toContain('Vietnamese')

    const en = buildInterviewPrompt({ lang: 'en', count: 5 })
    expect(en).toContain('English')
    expect(en).toContain('5 questions total')
  })

  it('có bankQuestion -> gợi ý câu hỏi kế; không có -> AI tự chọn', () => {
    const withBank = buildInterviewPrompt({ bankQuestion: 'N+1 problem là gì?' })
    expect(withBank).toContain('N+1 problem là gì?')
    const noBank = buildInterviewPrompt({})
    expect(noBank).toMatch(/Pick the next question yourself/i)
  })

  it('an toàn khi thiếu context', () => {
    expect(() => buildInterviewPrompt()).not.toThrow()
    expect(() => buildInterviewPrompt({ topics: 'not-array' })).not.toThrow()
  })

  it('có rubric neo điểm theo băng (0-39/40-69/70-89/90-100) để chấm nhất quán hơn', () => {
    const p = buildInterviewPrompt({})
    expect(p).toMatch(/score rubric/i)
    expect(p).toContain('0-39')
    expect(p).toContain('90-100')
  })

  it('có "follow-up ladder": đào sâu cùng chủ đề khi câu trả lời yếu (<60) thay vì luôn đổi chủ đề', () => {
    const p = buildInterviewPrompt({})
    expect(p).toMatch(/follow-up ladder/i)
    expect(p).toMatch(/below 60/i)
  })
})

describe('netlify/functions/_llm.js — buildInterviewReportPrompt', () => {
  it('nhúng khuôn JSON tổng kết', () => {
    const p = buildInterviewReportPrompt({ lang: 'vi', topics: ['Java Core'] })
    expect(p).toContain('"overall"')
    expect(p).toContain('"byTopic"')
    expect(p).toContain('"strengths"')
    expect(p).toContain('"gaps"')
    expect(p).toContain('"advice"')
    expect(p).toContain('"summary"')
  })

  it('dùng cùng rubric điểm theo băng như buildInterviewPrompt', () => {
    const p = buildInterviewReportPrompt({ lang: 'vi' })
    expect(p).toMatch(/score rubric/i)
    expect(p).toContain('0-39')
  })
})

describe('netlify/functions/_llm.js — runChat() mode interview', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  function stubFetch(content) {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ choices: [{ message: { content } }] }),
        }),
      ),
    )
  }

  it('parse đúng { evaluation, next } cho mode interview', async () => {
    const payload = {
      evaluation: { score: 70, verdict: 'Đạt', strengths: ['nắm N+1'], gaps: ['thiếu ví dụ'], ideal: 'JOIN FETCH…' },
      next: { question: 'volatile khác synchronized thế nào?', topic: 'concurrency', level: 'medium' },
    }
    stubFetch(JSON.stringify(payload))
    const { runChat } = await import('../netlify/functions/_llm.js')
    const { reply } = await runChat(
      { messages: [{ role: 'user', text: 'N+1 là...' }], context: { lang: 'vi', count: 8, askedCount: 1 }, mode: 'interview' },
      'key',
    )
    expect(reply.evaluation.score).toBe(70)
    expect(reply.next.topic).toBe('concurrency')
  })

  it('parse đúng báo cáo cho mode interviewReport', async () => {
    const payload = {
      overall: 72,
      verdict: 'Gần sẵn sàng',
      byTopic: [{ topic: 'jpa', score: 60, note: 'ôn N+1' }],
      strengths: ['OOP tốt'],
      gaps: ['JPA yếu'],
      advice: ['luyện N+1'],
      summary: 'Ổn, cần ôn JPA.',
    }
    stubFetch(JSON.stringify(payload))
    const { runChat } = await import('../netlify/functions/_llm.js')
    const { reply } = await runChat({ messages: [], context: { lang: 'vi' }, mode: 'interviewReport' }, 'key')
    expect(reply.overall).toBe(72)
    expect(reply.byTopic[0].topic).toBe('jpa')
  })
})
