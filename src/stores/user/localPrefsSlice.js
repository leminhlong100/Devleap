import { ieltsTrack, setIeltsTrackPref } from '@/data/courseIelts'

/**
 * Tùy chọn chỉ lưu LOCAL, không đồng bộ cloud và không nằm trong
 * snapshot()/applySnapshot() (không phải "tiến độ" mà là "sở thích thiết bị"):
 * persona chat + từ đánh dấu sao, track khóa IELTS nền tảng.
 */
const CONVO_KEY = 'devleap:convo:v1'
// `activeSaveTopic`: chủ đề đang chọn để gắn vào từ/câu lưu khi chat với AI
// (xem vocabSlice.js#createTopic) — chỉ local, không đồng bộ cloud.
// `commPersona`: persona riêng cho khóa Giao Tiếp — mặc định 'gaubong' (ấm áp,
//   hạ lo âu; kế hoạch "Nói Tự Tin" Trục D), tách khỏi `persona` của khóa Nền Tảng.
// `commDare`: thang tự đánh giá "mình dám nói" (1–5) đầu (start) & cuối (end) khóa
//   comm -> hiện tiến bộ ở trang Tổng kết. null = chưa chấm.
// `commMetrics`: số khách quan mỗi buổi comm — map "week:day" -> { wpm, pron } để
//   trang Tổng kết hiện tiến bộ nói nhanh hơn / rõ hơn (Trục E). Chỉ local.
// `commConfusions`: nhóm âm học viên hay LẪN — map groupKey -> { attempts, confused }
//   (đếm dồn qua cả khóa từ cặp tối thiểu bị nghe nhầm) -> remediation cá nhân hóa
//   (kế hoạch cải tiến #8). Chỉ local.
// `commPeerRubric`: bảng rubric tự chấm / người nghe chấm bài self-intro
//   (kế hoạch cải tiến #9) — { self: {dim:1..4}, peer: {dim:1..4} }. Chỉ local.
const DEFAULT_CONVO = {
  persona: 'cotnha',
  commPersona: 'gaubong',
  activeSaveTopic: '',
  commDare: { start: null, end: null },
  commMetrics: {},
  commConfusions: {},
  commPeerRubric: { self: {}, peer: {} },
}

// Kết quả khóa "Java Phỏng Vấn Cấp Tốc" — chỉ LOCAL: điểm cao nhất + báo cáo gần
// nhất + điểm trung bình theo chủ đề (gợi ý ôn chỗ yếu) + danh sách câu hỏi tự
// đánh dấu "cần ôn lại" (SRS-lite: không lịch lặp lại như flashcard, chỉ là một
// bucket để lọc riêng trong Ngân hàng câu hỏi, ép active-recall thay vì đọc lướt).
// Không đồng bộ cloud để khỏi đổi schema Supabase; có thể nâng cấp sync sau.
const JAVA_PREP_KEY = 'devleap:javaprep:v1'
const DEFAULT_JAVA_PREP = { bestScore: 0, lastReport: null, topicScores: {}, reviewQuestions: [] }

export function state() {
  return {
    // tùy chọn chế độ hội thoại (hiện chỉ có persona lời phê) — chỉ local.
    convoPrefs: { ...DEFAULT_CONVO },
    // Track khóa IELTS nền tảng ('A' = Work & Life English, mặc định; 'B' = IELTS
    // Bridge) — chỉ local, đọc từ data/courseIelts.js lúc app khởi động.
    ieltsTrack,
    // Kết quả phỏng vấn thử Java — chỉ local.
    javaPrep: { ...DEFAULT_JAVA_PREP },
  }
}

export const actions = {
  /** Nạp tùy chọn hội thoại từ localStorage (local-only, gọi trong hydrate()). */
  loadConvoPrefs() {
    try {
      const raw = localStorage.getItem(CONVO_KEY)
      if (raw) {
        const c = JSON.parse(raw) || {}
        this.convoPrefs = { ...DEFAULT_CONVO, ...(c.convoPrefs || {}) }
      }
    } catch {
      /* ignore */
    }
  },

  /** Lưu phần hội thoại (chỉ local). */
  persistConvo() {
    try {
      localStorage.setItem(CONVO_KEY, JSON.stringify({ convoPrefs: this.convoPrefs }))
    } catch {
      /* ignore */
    }
  },

  /** Cập nhật một phần tùy chọn hội thoại. Dùng: user.setConvoPrefs({ persona }). */
  setConvoPrefs(patch = {}) {
    this.convoPrefs = { ...this.convoPrefs, ...patch }
    this.persistConvo()
  },

  /**
   * Ghi một lần THỬ cặp tối thiểu (khóa comm) vào hồ sơ "âm hay lẫn" để đẩy
   * remediation cá nhân hóa (kế hoạch cải tiến #8). Đếm DỒN qua cả khóa: mỗi lần
   * thử tăng `attempts`, nghe nhầm thành từ khác thì tăng thêm `confused`.
   * @param {string} groupKey  key nhóm âm (vd 'th', 'sh-s')
   * @param {boolean} confused  lượt này có bị nghe nhầm thành từ còn lại trong cặp không
   */
  recordCommConfusion(groupKey, confused) {
    const k = String(groupKey || '').trim()
    if (!k) return
    const cur = this.convoPrefs.commConfusions || {}
    const g = cur[k] || { attempts: 0, confused: 0 }
    const next = { attempts: g.attempts + 1, confused: g.confused + (confused ? 1 : 0) }
    this.setConvoPrefs({ commConfusions: { ...cur, [k]: next } })
  },

  /**
   * Đổi track khóa IELTS nền tảng ('A'|'B'). Tuần 1–8 được nạp một lần lúc
   * module tải (xem data/courseIelts.js) nên đổi track cần tải lại trang.
   */
  setIeltsTrack(track) {
    const next = track === 'B' ? 'B' : 'A'
    if (next === this.ieltsTrack) return
    setIeltsTrackPref(next)
    window.location.reload()
  },

  /** Nạp kết quả phỏng vấn thử Java từ localStorage (local-only, gọi trong hydrate()). */
  loadJavaPrep() {
    try {
      const raw = localStorage.getItem(JAVA_PREP_KEY)
      if (raw) {
        const j = JSON.parse(raw) || {}
        this.javaPrep = {
          ...DEFAULT_JAVA_PREP,
          ...j,
          topicScores: j.topicScores && typeof j.topicScores === 'object' ? j.topicScores : {},
          reviewQuestions: Array.isArray(j.reviewQuestions) ? j.reviewQuestions : [],
        }
      }
    } catch {
      /* ignore */
    }
  },

  /**
   * Lưu kết quả một buổi phỏng vấn thử: cập nhật điểm cao nhất, báo cáo gần nhất
   * và điểm trung bình cộng dồn theo chủ đề (để trang khóa gợi ý ôn chỗ yếu).
   * @param {{ overall:number, byTopic?:Array<{topic:string,score:number}> }} report
   */
  saveInterviewResult(report) {
    if (!report || typeof report !== 'object') return
    const overall = Math.max(0, Math.min(100, Math.round(Number(report.overall) || 0)))
    const scores = { ...(this.javaPrep.topicScores || {}) }
    for (const t of Array.isArray(report.byTopic) ? report.byTopic : []) {
      const key = String(t?.topic || '').trim()
      if (!key) continue
      const s = Math.max(0, Math.min(100, Math.round(Number(t.score) || 0)))
      const prev = scores[key]
      // Trung bình trượt đơn giản giữa lần trước và lần này.
      scores[key] = prev != null ? Math.round((prev + s) / 2) : s
    }
    this.javaPrep = {
      ...this.javaPrep,
      bestScore: Math.max(this.javaPrep.bestScore || 0, overall),
      lastReport: { ...report, overall, at: Date.now() },
      topicScores: scores,
    }
    try {
      localStorage.setItem(JAVA_PREP_KEY, JSON.stringify(this.javaPrep))
    } catch {
      /* ignore */
    }
  },

  /**
   * Đánh dấu / bỏ đánh dấu một câu hỏi trong ngân hàng "cần ôn lại" (tab Ngân
   * hàng câu hỏi của khóa Java). Chỉ local — dùng để lọc riêng, ép active-recall
   * thay vì đọc lướt cả trăm câu.
   * @param {string} questionId id của câu trong QUESTION_BANK (vd 'jpa-1').
   */
  toggleReviewQuestion(questionId) {
    const id = String(questionId || '').trim()
    if (!id) return
    const list = Array.isArray(this.javaPrep.reviewQuestions) ? this.javaPrep.reviewQuestions : []
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    this.javaPrep = { ...this.javaPrep, reviewQuestions: next }
    try {
      localStorage.setItem(JAVA_PREP_KEY, JSON.stringify(this.javaPrep))
    } catch {
      /* ignore */
    }
  },
}
