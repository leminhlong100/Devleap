/**
 * Dữ liệu cho Khu công cụ học (mẫu từ design).
 */
import { normalize } from './searchIndex'
import { lookupVocab } from './vocabGlossary'

export const toolDefs = [
  { id: 'flashcard', icon: '🃏', title: 'Flashcard từ vựng', desc: 'Lật thẻ học thuật ngữ IT.', iconBg: 'rgba(108,92,231,.14)' },
  { id: 'quiz', icon: '❓', title: 'Quiz trắc nghiệm', desc: 'Câu hỏi theo từng bài học.', iconBg: 'rgba(255,176,32,.16)' },
  { id: 'playground', icon: '💻', title: 'Code Playground', desc: 'Gõ & chạy thử code Java.', iconBg: 'rgba(0,214,143,.14)' },
  { id: 'dictionary', icon: '📖', title: 'Từ điển thuật ngữ', desc: 'Tra cứu khái niệm IT.', iconBg: 'rgba(108,92,231,.14)' },
  { id: 'chat', icon: '💬', title: 'Trò chuyện với AI', desc: 'Luyện giao tiếp tiếng Anh.', iconBg: 'rgba(0,214,143,.14)' },
]

export const flashcards = [
  { term: 'deploy', ipa: '/dɪˈplɔɪ/', cat: 'DevOps', vi: 'Triển khai', ex: 'We deploy the app to production every Friday afternoon.' },
  { term: 'inheritance', ipa: '/ɪnˈherɪtəns/', cat: 'OOP', vi: 'Tính kế thừa', ex: 'A subclass uses inheritance to reuse the parent’s code.' },
  { term: 'exception', ipa: '/ɪkˈsepʃn/', cat: 'Java Core', vi: 'Ngoại lệ', ex: 'The method throws an exception when the input is invalid.' },
  { term: 'concurrency', ipa: '/kənˈkɜːrənsi/', cat: 'Threads', vi: 'Tính đồng thời', ex: 'Concurrency lets the server handle many requests at once.' },
  { term: 'dependency', ipa: '/dɪˈpendənsi/', cat: 'Spring', vi: 'Sự phụ thuộc', ex: 'Spring injects the dependency into the service automatically.' },
  { term: 'repository', ipa: '/rɪˈpɒzətri/', cat: 'Data', vi: 'Kho lưu trữ', ex: 'The repository handles all database access for users.' },
]

export const dictionary = [
  { term: 'API', cat: 'Web', vi: 'Giao diện lập trình ứng dụng', def: 'Tập hợp quy tắc cho phép các phần mềm giao tiếp với nhau.' },
  { term: 'OOP', cat: 'Java Core', vi: 'Lập trình hướng đối tượng', def: 'Mô hình tổ chức code quanh các "đối tượng" (object).' },
  { term: 'Inheritance', cat: 'OOP', vi: 'Tính kế thừa', def: 'Cho phép một class dùng lại thuộc tính & phương thức của class khác.' },
  { term: 'Polymorphism', cat: 'OOP', vi: 'Tính đa hình', def: 'Cùng một phương thức hành xử khác nhau ở các class con.' },
  { term: 'Exception', cat: 'Java Core', vi: 'Ngoại lệ', def: 'Sự kiện bất thường làm gián đoạn luồng chạy của chương trình.' },
  { term: 'Stream', cat: 'Java 8+', vi: 'Luồng dữ liệu', def: 'API xử lý tập hợp dữ liệu theo phong cách hàm: map, filter, reduce.' },
  { term: 'Concurrency', cat: 'Threads', vi: 'Tính đồng thời', def: 'Khả năng xử lý nhiều tác vụ cùng lúc bằng nhiều luồng.' },
  { term: 'Dependency Injection', cat: 'Spring', vi: 'Tiêm phụ thuộc', def: 'Spring tự cung cấp các đối tượng mà class cần, thay vì tự tạo.' },
  { term: 'Repository', cat: 'Data', vi: 'Kho lưu trữ', def: 'Lớp trung gian truy cập dữ liệu, tách logic khỏi database.' },
  { term: 'REST', cat: 'Web', vi: 'Kiến trúc REST', def: 'Phong cách thiết kế API qua HTTP với GET/POST/PUT/DELETE.' },
  { term: 'JVM', cat: 'Java Core', vi: 'Máy ảo Java', def: 'Môi trường thực thi bytecode Java, chạy được trên mọi nền tảng.' },
  { term: 'Microservices', cat: 'System', vi: 'Vi dịch vụ', def: 'Kiến trúc chia ứng dụng lớn thành nhiều dịch vụ nhỏ độc lập.' },
]

export const defaultCode = `public class Main {
    public static void main(String[] args) {
        System.out.println("Xin chào devleap! 🐱");
        System.out.println("Hôm nay mình học Java + English");
        System.out.println("Bạn vừa hoàn thành bài tập đầu tiên!");
    }
}`

// Tra cứu nghĩa/ví dụ theo thuật ngữ — gộp từ flashcards (giàu: ipa/vi/ex) và
// dictionary (vi/def). flashcards ghi đè vì dữ liệu đầy đủ hơn.
const VOCAB_LOOKUP = (() => {
  const m = new Map()
  for (const d of dictionary) m.set(d.term.toLowerCase(), { term: d.term, ipa: '', cat: d.cat, vi: d.vi, ex: d.def })
  for (const f of flashcards) m.set(f.term.toLowerCase(), { term: f.term, ipa: f.ipa, cat: f.cat, vi: f.vi, ex: f.ex })
  return m
})()

/**
 * Dựng danh sách flashcard từ các thuật ngữ của một ngày học.
 * Thuật ngữ trùng với kho có sẵn sẽ được bổ sung nghĩa/ví dụ; còn lại để trống
 * (FlashcardTool sẽ hiển thị gợi ý tra từ điển).
 *
 * Mỗi thẻ kèm `srsId` ổn định = `${course}:${từ-đã-chuẩn-hóa}` để lịch ôn tập
 * (Spaced Repetition) bám theo *từ vựng*, không bám theo vị trí trong deck — nhờ
 * vậy cùng một từ xuất hiện ở nhiều ngày vẫn dùng chung một lịch ôn.
 */
export function cardsFromTerms(terms, course = 'java') {
  const seen = new Set()
  const out = []
  for (const t of terms || []) {
    const key = String(t).trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    // Ưu tiên kho IT (flashcards/dictionary); nếu không có, tra glossary IELTS.
    let base = VOCAB_LOOKUP.get(key)
    if (!base) {
      const g = lookupVocab(t)
      base = g
        ? { term: t, ipa: g.ipa, cat: 'Từ vựng', vi: g.vi, ex: g.ex.replace('{w}', t) }
        : { term: t, ipa: '', cat: 'Từ vựng', vi: '', ex: '' }
    }
    out.push({ ...base, srsId: `${course}:${normalize(t)}` })
  }
  return out
}
