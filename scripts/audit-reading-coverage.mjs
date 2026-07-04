/**
 * KIỂM KÊ ĐỘ PHỦ TỪ VỰNG của bài đọc (src/data/ieltsInput.js `reading.text`) so
 * với từ đã dạy cộng dồn tới tuần đó — hỗ trợ mục còn lại của Đợt 3 trong
 * docs/KE_HOACH_DO_KHO_KHOA_HOC.md (mục tiêu: ≤5% từ chưa học mỗi bài đọc,
 * theo ngưỡng coverage 95–98% của Nation/Hu).
 *
 * "Đã dạy" = hợp của:
 *   (a) BASE_WORDS — ~500 từ tiếng Anh cực phổ biến (hư từ + động/tính/danh từ
 *       A1 cơ bản) mà người học coi như đã biết dù giáo trình không dạy riêng
 *       (ví dụ "name", "time", "good") — nếu bỏ qua bước này, hầu hết mọi câu
 *       sẽ bị báo sai vì bài đọc nào cũng cần các từ nền này.
 *   (b) từ trong "**Từ chính:**" của mọi tuần TỪ 1 ĐẾN tuần đang xét, tính theo
 *       ĐÚNG TRACK (Track A dùng *_Work.md cho tuần 6–8, Track B dùng file gốc).
 *
 * GIỚI HẠN — ĐỌC TRƯỚC KHI TIN SỐ LIỆU (lý do mục này từng bị hoãn):
 *  - So khớp qua "stem" tự chế (bỏ đuôi -s/-es/-ing/-ed/-ies/-er/-est/-ly) + bảng
 *    bất quy tắc thủ công (IRREGULAR_FORMS) — không phải lemmatizer thật, có thể
 *    bỏ sót vài dạng hiếm.
 *  - Danh từ riêng (viết hoa, KHÔNG ở đầu câu) bị loại khỏi cả tử số lẫn mẫu số —
 *    heuristic đơn giản, có thể sai với từ viết hoa đầu câu trùng tên riêng.
 *  - `ieltsInput.js` dùng CHUNG bài đọc cho mọi track ở tuần 6–8 dù vocab 2 track
 *    khác nhau -> script kiểm tra riêng từng track, số liệu có thể lệch nhau.
 *  - Đây là công cụ CHẨN ĐOÁN — không tự sửa bài đọc hay vocab. Người soạn tự
 *    quyết định: sửa bài đọc, bổ sung từ vào "Phòng từ vựng", hay chấp nhận vì
 *    từ bị báo thật ra quá cơ bản/đã có trong BASE_WORDS mà script chưa liệt kê.
 *
 * Dùng:
 *   node scripts/audit-reading-coverage.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'Base_English')
const TARGET_MIN_COVERAGE = 95 // % — mục 5 "Thước đo thành công" của kế hoạch

// Tên nhân vật lặp lại trong các bài đọc (dialogue/ví dụ) — không phải "từ vựng"
// cần học, nên loại khỏi cả tử số lẫn mẫu số dù có viết hoa ở đầu câu hay không
// (heuristic "viết hoa giữa câu" ở dưới không bắt được trường hợp tên mở đầu câu).
const KNOWN_PROPER_NOUNS = new Set(
  ['mai', 'minh', 'nam', 'lan', 'trang', 'huy', 'hoa', 'linh', 'ha', 'an', 'quang', 'da', 'nang'],
)

// ─────────────────────────── 1. Từ nền A1 (~500 từ) ───────────────────────────
// Hư từ + động/tính/danh từ cơ bản nhất tiếng Anh — coi như "đã biết" bất kể
// giáo trình có dạy riêng hay không (tương đương ~500 từ đầu của các bảng tần
// suất phổ biến như GSL/NGSL, gõ tay từ kiến thức nền, KHÔNG tra cứu ngoài).
const BASE_WORDS = new Set(
  `
  a an the this that these those my your his her its our their mine yours hers ours theirs
  i you he she it we they me him us them myself yourself himself herself itself ourselves
  yourselves themselves who whom whose which what whoever whatever
  am is are was were be been being have has had having do does did doing done
  will would shall should can could may might must
  in on at to of for with without from into onto over under above below between among
  through during before after about against along around behind beside beyond despite
  except inside outside near since toward towards until upon within across off out up
  down away back
  and but or nor so yet because although though while if unless when whenever where
  wherever whether as than that not no
  some any every each all both few many much more most less least several other another
  such own same
  one two three four five six seven eight nine ten eleven twelve twenty thirty forty
  fifty hundred thousand first second third last next once twice
  very too so just only also still again always never often usually sometimes rarely
  already yet now then here there well quite really almost even ever soon today
  tomorrow yesterday later early late together alone yes ok okay please sorry thanks
  thank hello hi bye
  be have do say say get make go know take see come think look want give find tell
  ask work seem feel try leave call need become put mean keep let begin help talk
  turn start show hear play run move live believe bring happen write provide sit
  stand lose pay meet include continue learn change lead understand watch follow
  stop create speak read spend grow open walk win remember love add expect build
  stay fall cut reach remain wait serve send drive break teach offer occur buy wear
  choose listen study plan share decide agree prefer allow enjoy hope matter appear
  act cost count worry check visit join cover apply produce save thank forget improve
  protect reduce increase compare discuss describe explain imagine receive arrive
  finish practise practice prepare repeat remind review celebrate relax communicate
  travel cook clean wash drink eat sleep dream laugh cry smile shout whisper love
  like dislike hate wish
  good bad big small new old young high low long short great little right wrong
  different important easy hard difficult simple sure clear happy sad angry tired
  busy free ready safe careful quiet loud quick slow strong weak healthy sick hungry
  thirsty hot cold warm cool wet dry clean dirty full empty expensive cheap beautiful
  nice kind friendly polite honest confident nervous excited bored interested
  interesting boring funny serious popular famous common normal usual natural modern
  traditional local national international public private personal social physical
  mental general special particular similar various certain possible impossible
  necessary available likely early late whole entire main real true false wonderful
  great fine perfect
  time day days year years month months week weeks morning afternoon evening night
  hour hours minute minutes second seconds people person man woman child children
  boy girl family friend friends home house room school work job money food water
  book phone computer car bus train city town country world life way thing things
  place part problem question answer idea plan reason result example fact information
  news story word name number level kind type group team member company business
  government service product market price area region age goal habit experience
  weekend holiday
  student students class classes classroom classmate teacher lesson lessons school
  university college library exam exams test tests grammar vocabulary sentence
  paragraph article spelling pronunciation accent error mistake correct incorrect
  progress effort achievement opportunity activity structure comparison contrast
  evidence strategy technique skill skills knowledge topic section passage record
  recording aloud silent focus attention distract motivate motivated consistent
  familiar foreign positive negative specific basically generally overall however
  therefore furthermore additionally instead actually especially fortunately luckily
  immediately regularly usually finally why how what where when who
  everyone everything everywhere someone something somewhere anyone anything anywhere
  nobody nothing nowhere
  father mother brother sister parent parents husband wife son daughter grandmother
  grandfather aunt uncle cousin
  kitchen bedroom bathroom window door wall floor corner shelf shelves table chair
  lamp garden yard roof stairs
  breakfast lunch dinner coffee tea fruit meat bread rice dish dishes vegetable snack
  hotel station office hospital market shop store canteen park museum airport
  afraid calm proud confused embarrassed stressed anxious panic upset annoyed
  relaxed comfortable
  fourth fifth sixth seventh eighth ninth tenth ago half past future present continuous
  verb verbs noun nouns adjective adjectives article articles phrase phrases plural
  singular countable uncountable comparative superlative passive active tense
  chart charts data file files camera video videos battery light heavy heavier
  technology app apps online internet screen device devices message messages
  agenda deadline meeting colleague customer income budget salary
  bag desk chalk board notebook pen pencil calendar picture poster sticker timer
  learner learners examiner beginner beginners expert speaker speakers audience
  podcast podcasts shadow script rhythm pattern letter letters sound sounds accent
  spelling paraphrase reference underline search searching confuse pause pauses
  hesitate hesitation recover recovering filler mock band descriptor descriptors
  connector connectors clause clauses preposition prepositions relative
  extra separate connect chance chances space green fresh culture cultures side
  sides jam detail details complicated hometown neighbourhood neighborhood
  trip journey ticket flight airport destination tourist experience
  overall sharp usage bigger biggest heavier heaviest earlier earliest
  weekday weekdays concern manage management solve solution stable rise rising
  earn earning shop shopping part-time fulltime interview interviews
  develop developing improve improvement solve solved store stored collect collected
  distract distracted notice noticed depend depends material materials
  atmosphere decorate decoration visual reminder reminders object objects
  motivate motivated tool tools scroll scrolling unrelated post posts rule airplane
  mode remove distraction distractions ear ears pair pairs quarter
  sudden suddenly stress interest interested boring positive impact record records
  pressure forward process rather passage section letter afterwards
  fix fixable enjoyable steady sudden message messages realise realize realised
  realized embarrassed sound sounded strange voice noticed consistent situation
  situations gentle familiar song songs conversation conversations reuse reliable
  discourage discouraged correction form self exact text accept accepting deeper
  pattern difference challenge letters alike close attention organise organize
  avoid random disconnected state connect connects ending endings able complete
  completing treat judge ability calmly recent zero comparison large course band
  role responsibility teamwork
  use used large mobile rule set key sun trust audio session sessions disappear
  sell miss step steps basic predict prediction decision decisions souvenir pack
  ring rang rung
  music tourism final routine frequency reply nurse nursing television engineer
  housework noisy patient white front wake woke woken skip skips
  `
    .trim()
    .split(/\s+/),
)

// Dạng bất quy tắc phổ biến (đủ dùng cho bài đọc A1–A2) -> ánh xạ về dạng gốc.
const IRREGULAR_FORMS = {
  am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', been: 'be', being: 'be',
  has: 'have', had: 'have', having: 'have',
  does: 'do', did: 'do', doing: 'do', done: 'do',
  goes: 'go', went: 'go', gone: 'go', going: 'go',
  made: 'make', making: 'make',
  took: 'take', taken: 'take', taking: 'take',
  came: 'come', coming: 'come',
  saw: 'see', seen: 'see', seeing: 'see',
  thought: 'think', thinking: 'think',
  said: 'say', says: 'say', saying: 'say',
  told: 'tell', telling: 'tell',
  found: 'find', finding: 'find',
  gave: 'give', given: 'give', giving: 'give',
  became: 'become', becoming: 'become',
  left: 'leave', leaving: 'leave',
  felt: 'feel', feeling: 'feel',
  brought: 'bring', bringing: 'bring',
  bought: 'buy', buying: 'buy',
  taught: 'teach', teaching: 'teach',
  caught: 'catch', catching: 'catch',
  understood: 'understand', understanding: 'understand',
  stood: 'stand', standing: 'stand',
  sat: 'sit', sitting: 'sit',
  ran: 'run', running: 'run',
  ate: 'eat', eaten: 'eat', eating: 'eat',
  drank: 'drink', drunk: 'drink', drinking: 'drink',
  wrote: 'write', written: 'write', writing: 'write',
  spoke: 'speak', spoken: 'speak', speaking: 'speak',
  broke: 'break', broken: 'break', breaking: 'break',
  chose: 'choose', chosen: 'choose', choosing: 'choose',
  drove: 'drive', driven: 'drive', driving: 'drive',
  fell: 'fall', fallen: 'fall', falling: 'fall',
  flew: 'fly', flown: 'fly', flying: 'fly',
  grew: 'grow', grown: 'grow', growing: 'grow',
  heard: 'hear', hearing: 'hear',
  held: 'hold', holding: 'hold',
  kept: 'keep', keeping: 'keep',
  led: 'lead', leading: 'lead',
  lost: 'lose', losing: 'lose',
  met: 'meet', meeting: 'meet',
  paid: 'pay', paying: 'pay',
  rode: 'ride', ridden: 'ride', riding: 'ride',
  rose: 'rise', risen: 'rise', rising: 'rise',
  sent: 'send', sending: 'send',
  showed: 'show', shown: 'show', showing: 'show',
  sang: 'sing', sung: 'sing', singing: 'sing',
  slept: 'sleep', sleeping: 'sleep',
  spent: 'spend', spending: 'spend',
  swam: 'swim', swum: 'swim', swimming: 'swim',
  wore: 'wear', worn: 'wear', wearing: 'wear',
  won: 'win', winning: 'win',
  built: 'build', building: 'build',
  better: 'good', best: 'good',
  worse: 'bad', worst: 'bad',
  further: 'far', farther: 'far', furthest: 'far', farthest: 'far',
  children: 'child', men: 'man', women: 'woman', feet: 'foot', teeth: 'tooth', mice: 'mouse',
  got: 'get', gotten: 'get', getting: 'get',
  forgot: 'forget', forgotten: 'forget', forgetting: 'forget',
  sold: 'sell', selling: 'sell',
  meant: 'mean', meaning: 'mean',
  missed: 'miss', missing: 'miss',
  rang: 'ring', rung: 'ring', ringing: 'ring',
  woke: 'wake', woken: 'wake', waking: 'wake',
}

// Bung viết tắt trước khi tách từ (đơn giản, đủ cho bài đọc soạn tay).
function expandContractions(s) {
  return s
    .replace(/\bwon['’]t\b/gi, 'will not')
    .replace(/\bcan['’]t\b/gi, 'can not')
    .replace(/\b(\w+)n['’]t\b/gi, '$1 not')
    .replace(/\blet['’]s\b/gi, 'let us')
    .replace(/\bi['’]m\b/gi, 'i am')
    .replace(/\b(\w+)['’]re\b/gi, '$1 are')
    .replace(/\b(\w+)['’]ve\b/gi, '$1 have')
    .replace(/\b(\w+)['’]ll\b/gi, '$1 will')
    .replace(/\b(\w+)['’]d\b/gi, '$1 would')
    .replace(/\b(\w+)['’]s\b/gi, '$1') // 's sở hữu -> bỏ (đã tách từ gốc)
}

// Sinh vài "ứng viên gốc từ" cho một từ đã lowercase (hậu tố đơn giản).
// Chạy 2 tầng để bắt hậu tố kép (reminders -> reminder -> remind, feelings -> feeling -> feel).
function stemCandidates(w) {
  const level1 = stemOnce(w)
  const all = new Set(level1)
  for (const cand of level1) {
    if (cand === w) continue
    for (const cand2 of stemOnce(cand)) all.add(cand2)
  }
  return all
}

function stemOnce(w) {
  const out = new Set([w])
  if (IRREGULAR_FORMS[w]) out.add(IRREGULAR_FORMS[w])
  if (/ies$/.test(w)) out.add(w.replace(/ies$/, 'y'))
  if (/ied$/.test(w)) out.add(w.replace(/ied$/, 'y'))
  if (/ying$/.test(w)) out.add(w.replace(/ying$/, 'y'))
  if (/xes$|ches$|shes$|sses$/.test(w)) out.add(w.replace(/es$/, ''))
  if (/es$/.test(w)) out.add(w.replace(/es$/, ''))
  if (/s$/.test(w) && !/ss$/.test(w)) out.add(w.replace(/s$/, ''))
  if (/ing$/.test(w)) {
    const base = w.replace(/ing$/, '')
    out.add(base)
    out.add(base + 'e') // making -> make
    if (/([^aeiou])\1$/.test(base)) out.add(base.slice(0, -1)) // running -> run
  }
  if (/ed$/.test(w)) {
    const base = w.replace(/ed$/, '')
    out.add(base)
    out.add(base + 'e') // liked -> like
    if (/([^aeiou])\1$/.test(base)) out.add(base.slice(0, -1)) // stopped -> stop
  }
  if (/ier$/.test(w)) out.add(w.replace(/ier$/, 'y')) // happier -> happy
  if (/iest$/.test(w)) out.add(w.replace(/iest$/, 'y')) // happiest -> happy
  if (/er$/.test(w)) {
    const base = w.replace(/er$/, '')
    out.add(base)
    if (/([^aeiou])\1$/.test(base)) out.add(base.slice(0, -1)) // bigger -> big
  }
  if (/est$/.test(w)) {
    const base = w.replace(/est$/, '')
    out.add(base)
    if (/([^aeiou])\1$/.test(base)) out.add(base.slice(0, -1)) // biggest -> big
  }
  if (/ly$/.test(w)) {
    out.add(w.replace(/ly$/, ''))
    if (/ily$/.test(w)) out.add(w.replace(/ily$/, 'y')) // easily -> easy
  }
  return out
}

// ─────────────────────────── 2. Vocab đã dạy theo tuần/track ───────────────────────────
function parseThemeWords(text) {
  const words = []
  const re = /\*\*Từ chính:\*\*\s*([^\n]+)|^Từ chính:\s*([^\n]+)/gim
  let m
  while ((m = re.exec(text))) {
    const list = (m[1] || m[2] || '').split(',')
    for (const raw of list) {
      const w = raw.trim().replace(/[.*`]+$/g, '').replace(/^[.*`]+/, '').trim().toLowerCase()
      if (w) words.push(w)
    }
  }
  return words
}

function loadWeekFiles() {
  const files = fs.readdirSync(DIR).filter((f) => /^NenTang_Tuan\d+(_Work)?\.md$/.test(f))
  const rows = []
  for (const file of files) {
    const raw = fs.readFileSync(path.join(DIR, file), 'utf8')
    const titleM = /^#\s+Tuần\s+(\d+)/m.exec(raw)
    const num = titleM ? Number(titleM[1]) : 0
    const isWork = /_Work\.md$/.test(file)
    rows.push({ file, num, isWork, words: parseThemeWords(raw) })
  }
  return rows
}

/** words[track][week] = Set từ đã dạy CỘNG DỒN tới tuần đó (bao gồm mọi từ trong cụm). */
function buildCumulativeVocab(weekFiles) {
  const byTrack = { A: {}, B: {} }
  for (const track of ['A', 'B']) {
    const running = new Set()
    for (let n = 1; n <= 8; n++) {
      const row =
        track === 'A' && n >= 6
          ? weekFiles.find((r) => r.num === n && r.isWork)
          : weekFiles.find((r) => r.num === n && !r.isWork)
      if (row) {
        for (const phrase of row.words) {
          running.add(phrase)
          for (const w of phrase.split(/\s+/)) running.add(w)
        }
      }
      byTrack[track][n] = new Set(running) // snapshot cộng dồn
    }
  }
  return byTrack
}

// ─────────────────────────── 3. Đo coverage bài đọc ───────────────────────────
function tokenizeWithCase(text) {
  // Tách theo câu để biết từ nào ở ĐẦU câu (loại trừ khỏi kiểm tra viết hoa = tên riêng).
  const sentences = text.split(/(?<=[.!?])\s+/)
  const tokens = [] // { raw, isSentenceStart }
  for (const sent of sentences) {
    const words = sent.match(/[A-Za-z][A-Za-z'’-]*|\d+/g) || []
    words.forEach((w, i) => tokens.push({ raw: w, isSentenceStart: i === 0 }))
  }
  return tokens
}

function isKnown(wordLower, knownSet) {
  for (const cand of stemCandidates(wordLower)) {
    if (BASE_WORDS.has(cand) || knownSet.has(cand)) return true
  }
  return false
}

function auditReading(text, knownSet) {
  const expanded = expandContractions(text)
  const tokens = tokenizeWithCase(expanded)
  let total = 0
  let unknown = 0
  const unknownWords = {}
  for (const t of tokens) {
    if (/^\d+$/.test(t.raw)) continue // số -> bỏ qua hoàn toàn
    const isCapitalized = /^[A-Z]/.test(t.raw) && t.raw.length > 1
    const lower = t.raw.toLowerCase()
    if (KNOWN_PROPER_NOUNS.has(lower)) continue // tên nhân vật lặp lại -> bỏ qua hoàn toàn
    if (isCapitalized && !t.isSentenceStart && !isKnown(lower, knownSet)) continue // heuristic danh từ riêng -> bỏ qua
    total++
    if (!isKnown(lower, knownSet)) {
      unknown++
      unknownWords[lower] = (unknownWords[lower] || 0) + 1
    }
  }
  return { total, unknown, unknownWords }
}

// ─────────────────────────── 4. Chạy audit toàn khóa ───────────────────────────
async function main() {
  const weekFiles = loadWeekFiles()
  const cumulativeVocab = buildCumulativeVocab(weekFiles)
  const { ieltsInput } = await import(pathToFileURL(path.join(ROOT, 'src/data/ieltsInput.js')))

  for (const track of ['A', 'B']) {
    const label = track === 'A' ? 'Track A — Work & Life' : 'Track B — IELTS Bridge'
    console.log(`\n\n════ ${label} ════`)
    console.log('Tuần | Buổi có bài đọc | Tổng từ nội dung | Từ chưa học | % chưa học | Ghi chú')
    console.log('-'.repeat(95))

    let flaggedWeeks = 0
    for (let week = 1; week <= 8; week++) {
      const known = cumulativeVocab[track][week]
      const dayCount = week === 8 ? 14 : 7
      let total = 0
      let unknown = 0
      const unknownWords = {}
      let daysWithReading = 0
      for (let day = 1; day <= dayCount; day++) {
        const entry = ieltsInput[`${week}:${day}`]
        if (!entry?.reading?.text) continue
        daysWithReading++
        const r = auditReading(entry.reading.text, known)
        total += r.total
        unknown += r.unknown
        for (const [w, c] of Object.entries(r.unknownWords)) unknownWords[w] = (unknownWords[w] || 0) + c
      }
      if (!daysWithReading) {
        console.log(`${String(week).padEnd(4)} | (chưa có bài đọc)`)
        continue
      }
      const pctUnknown = total ? Math.round((unknown / total) * 1000) / 10 : 0
      const pctKnown = Math.round((100 - pctUnknown) * 10) / 10
      const over = pctKnown < TARGET_MIN_COVERAGE
      if (over) flaggedWeeks++
      const top = Object.entries(unknownWords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, Number(process.env.AUDIT_TOP || 8))
        .map(([w, c]) => `${w}(${c})`)
        .join(', ')
      const note = over
        ? `⚠️ coverage ${pctKnown}% < ${TARGET_MIN_COVERAGE}% — top từ lạ: ${top}`
        : process.env.AUDIT_VERBOSE
          ? `từ lạ: ${top}`
          : ''
      console.log(
        `${String(week).padEnd(4)} | ${String(daysWithReading).padEnd(16)} | ${String(total).padEnd(17)} | ${String(unknown).padEnd(11)} | ${String(pctUnknown).padEnd(10)} | ${note}`,
      )
    }
    console.log(
      flaggedWeeks
        ? `\n⚠️  ${flaggedWeeks}/8 tuần dưới ngưỡng coverage ${TARGET_MIN_COVERAGE}% ở ${label}.`
        : `\n✅ Mọi tuần đạt coverage ≥ ${TARGET_MIN_COVERAGE}% ở ${label} (theo heuristic của script).`,
    )
  }

  console.log(
    '\nLưu ý: đây là công cụ CHẨN ĐOÁN dựa trên heuristic (stem tự chế + BASE_WORDS ~500 từ tay soạn).' +
      ' Trước khi sửa bài đọc/vocab theo số liệu này, xem lại danh sách "từ lạ" — có thể là từ cơ bản' +
      ' script chưa liệt kê trong BASE_WORDS, không nhất thiết là lỗi thật.',
  )
}

main()
