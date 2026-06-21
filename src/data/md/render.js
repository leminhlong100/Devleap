/**
 * Renderer Markdown dùng chung cho cả khóa Java (weeks/) lẫn IELTS (Base_English/).
 *
 * Vì sao cần lớp này thay vì gọi thẳng marked.parse:
 *   Nội dung khóa học là **Markdown thuần** (không cố ý chèn HTML). Nhưng các
 *   generic một-token trong văn xuôi — `List<String>`, `Stack<T>`, `Stream<R>` —
 *   bị marked hiểu nhầm là thẻ HTML inline và NUỐT mất (`<String>` biến thành
 *   một phần tử lạ, chữ phía sau bị ăn theo). Generic nhiều token có dấu phẩy/
 *   khoảng trắng (`Map<String, Integer>`) thì marked tự escape nên không sao —
 *   chỉ token đơn mới vỡ.
 *
 * Cách xử lý: escape mọi dấu `<` / `>` nằm NGOÀI code (fenced ``` và inline `…`)
 * trước khi đưa cho marked. An toàn tuyệt đối vì các file này không có HTML thật.
 * Dấu blockquote `>` ở đầu dòng được giữ nguyên để callout không bị hỏng.
 */
import { marked } from 'marked'

marked.setOptions({ breaks: false, gfm: true })

/** Escape `<`/`>` trong một đoạn text, nhưng giữ nguyên các code span `…`. */
function escapeOutsideInlineCode(text) {
  let out = ''
  let i = 0
  while (i < text.length) {
    if (text[i] === '`') {
      let run = 1
      while (text[i + run] === '`') run++
      const marker = '`'.repeat(run)
      const close = text.indexOf(marker, i + run)
      if (close !== -1) {
        out += text.slice(i, close + run) // giữ nguyên code span
        i = close + run
        continue
      }
    }
    const ch = text[i]
    out += ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch
    i++
  }
  return out
}

/** Escape các dấu ngoặc nhọn lạc ngoài code; giữ fence và blockquote. */
function escapeStrayAngles(src) {
  const lines = src.split(/\r?\n/)
  let inFence = false
  return lines
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence
        return line
      }
      if (inFence) return line
      // giữ nguyên dấu trích dẫn blockquote ở đầu dòng ("> ", "> > " …)
      const qm = /^(\s*(?:>\s?)+)/.exec(line)
      const prefix = qm ? qm[1] : ''
      const body = qm ? line.slice(qm[1].length) : line
      return prefix + escapeOutsideInlineCode(body)
    })
    .join('\n')
}

/** Render một đoạn Markdown thuần -> HTML (rỗng nếu không có nội dung). */
export const md = (src) =>
  src && src.trim() ? marked.parse(escapeStrayAngles(src.trim())) : ''
