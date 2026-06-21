import { describe, it, expect } from 'vitest'
import { md } from '@/data/md/render'

describe('md() — render Markdown thuần', () => {
  it('escape generic một-token trong văn xuôi (không bị marked nuốt)', () => {
    const html = md('Cho List<String> tên sinh viên.')
    expect(html).toContain('List&lt;String&gt;')
    expect(html).not.toMatch(/<String>/) // không còn thẻ HTML lạc
  })

  it('escape thẻ lạc <li> trong prose', () => {
    const html = md('HTML list "<li>name</li>" joining.')
    expect(html).toContain('&lt;li&gt;name&lt;/li&gt;')
    // không tạo ra phần tử danh sách thật
    expect(html).not.toMatch(/<li>name<\/li>/)
  })

  it('giữ nguyên generic trong inline code span', () => {
    const html = md('Dùng `Stack<T>` nhé.')
    // marked tự escape bên trong <code>, nhưng vẫn là code span
    expect(html).toContain('<code>Stack&lt;T&gt;</code>')
  })

  it('giữ nguyên code trong fenced block', () => {
    const html = md('```java\nList<String> a = new ArrayList<>();\n```')
    expect(html).toContain('<pre>')
    expect(html).toContain('List&lt;String&gt;')
    expect(html).toContain('class="language-java"')
  })

  it('giữ dấu blockquote callout ở đầu dòng', () => {
    const html = md('> Ghi nhớ: List<T> bị xóa lúc runtime')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('List&lt;T&gt;')
  })

  it('GFM task list vẫn render đúng kèm generic', () => {
    const html = md('- [ ] Map<K, List<T>>\n- [x] flatMap')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('Map&lt;K, List&lt;T&gt;&gt;')
  })

  it('chuỗi rỗng -> chuỗi rỗng', () => {
    expect(md('')).toBe('')
    expect(md('   ')).toBe('')
    expect(md(null)).toBe('')
  })

  it('bảng & in đậm cơ bản vẫn hoạt động', () => {
    const html = md('| A | B |\n| --- | --- |\n| 1 | **2** |')
    expect(html).toContain('<table>')
    expect(html).toContain('<strong>2</strong>')
  })
})
