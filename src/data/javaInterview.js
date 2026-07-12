/**
 * Dữ liệu khóa "Java Phỏng Vấn Cấp Tốc" — thuần dữ liệu, không phụ thuộc Vue.
 *
 * Gồm: chủ đề (INTERVIEW_TOPICS), ngân hàng câu hỏi + đáp án (QUESTION_BANK),
 * cheat-sheet (CHEATSHEET), lộ trình 2 tuần (CRASH_PLAN), bài coding chạy thật
 * (CODING_CHALLENGES) và kỹ năng phỏng vấn cá nhân hóa (INTERVIEW_SKILLS).
 * Các helper thuần (questionsByTopic / pickInterviewSet) được test ở
 * tests/javaInterview.test.js.
 *
 * Định hướng: Java Backend là chính, kèm frontend (hỏi lướt), database/SQL
 * chuyên sâu, stack thực tế (Struts/iBatis/Batch/JasperReports/FTP) và kỹ năng
 * phỏng vấn — bám hồ sơ ứng viên Java Backend/Full-stack ~2 năm KN.
 */

// -------------------- Chủ đề --------------------
export const INTERVIEW_TOPICS = [
  { key: 'core', label: 'Java Core', icon: '☕', blurb: 'Ngôn ngữ, kiểu dữ liệu, String, static/final' },
  { key: 'oop', label: 'OOP', icon: '🧱', blurb: '4 tính chất, interface/abstract, equals/hashCode' },
  { key: 'collections', label: 'Collections', icon: '📦', blurb: 'List/Set/Map, HashMap internals, Big-O' },
  { key: 'exception', label: 'Exception', icon: '⚠️', blurb: 'Checked/unchecked, try-with-resources' },
  { key: 'generics', label: 'Generics', icon: '🔤', blurb: 'Wildcard, PECS, type erasure' },
  { key: 'stream', label: 'Stream & Lambda', icon: '🌊', blurb: 'Stream API, Optional, functional interface' },
  { key: 'concurrency', label: 'Concurrency', icon: '🧵', blurb: 'Thread, volatile, lock, ExecutorService' },
  { key: 'spring', label: 'Spring Boot & DI', icon: '🌱', blurb: 'IoC, DI, bean scope, auto-config' },
  { key: 'rest', label: 'REST & MVC', icon: '🔌', blurb: 'Controller, mapping, DTO, validation' },
  { key: 'jpa', label: 'JPA / Hibernate', icon: '🗄️', blurb: 'Mapping, LAZY/EAGER, N+1' },
  { key: 'transaction', label: 'Transaction', icon: '💳', blurb: '@Transactional, propagation, isolation' },
  { key: 'testing', label: 'Testing', icon: '🧪', blurb: 'JUnit 5, Mockito, test slice' },
  { key: 'security', label: 'Security & JWT', icon: '🔐', blurb: 'Authn/authz, JWT, BCrypt' },
  { key: 'sql', label: 'SQL & Database', icon: '🐘', blurb: 'JOIN, index, transaction, ACID' },
  { key: 'solid', label: 'SOLID & Patterns', icon: '📐', blurb: 'SOLID, design patterns hay dùng' },
  { key: 'jvm', label: 'JVM & Memory', icon: '⚙️', blurb: 'Heap/stack, GC, memory leak' },
  { key: 'frontend', label: 'Frontend (JS/React…)', icon: '🖥️', blurb: 'JS/TS core, React/Angular/Vue/Nuxt cơ bản' },
  { key: 'mystack', label: 'Stack thực tế', icon: '🏭', blurb: 'Struts, iBatis/MyBatis, Batch, JasperReports, FTP' },
  { key: 'kafka', label: 'Kafka & Messaging', icon: '📨', blurb: 'Producer/consumer, partition, offset, DLT, acks' },
  { key: 'microservice', label: 'Microservice', icon: '🧩', blurb: 'Gateway, discovery, SAGA, giao tiếp service' },
  { key: 'design', label: 'System Design', icon: '🏗️', blurb: 'Rate limiter, URL shortener, capacity, cache, pagination' },
  { key: 'infra', label: 'Hạ tầng thực tế', icon: '🐳', blurb: 'Docker, CI/CD, Redis, observability, gRPC, API versioning' },
  { key: 'scenario', label: 'Tình huống & Thiết kế', icon: '🧭', blurb: 'Thiết kế API, debug prod, idempotency, đánh đổi thực tế' },
  { key: 'behavioral', label: 'Behavioral', icon: '🗣️', blurb: 'STAR, kể dự án, tình huống' },
]

const TOPIC_KEYS = new Set(INTERVIEW_TOPICS.map((t) => t.key))
export const LEVELS = ['easy', 'medium', 'hard']

/** Nhãn tiếng Việt cho từng chủ đề (tra nhanh). */
export function topicLabel(key) {
  return INTERVIEW_TOPICS.find((t) => t.key === key)?.label || key
}

/**
 * srsId cho một câu hỏi trong ngân hàng — tái dùng CHUNG map `srs` (SM-2) đã có
 * cho flashcard từ vựng (xem src/stores/user/srsSlice.js), chỉ khác namespace
 * ('javaq:') nên không cần cột Supabase riêng.
 */
export function javaSrsId(questionId) {
  return `javaq:${String(questionId || '').trim()}`
}

// -------------------- Ngân hàng câu hỏi --------------------
// Mỗi câu: { id, topic, level, q, points: [ý chính], answer: đáp án mẫu ngắn }.
export const QUESTION_BANK = [
  // ---------- Java Core ----------
  { id: 'core-1', topic: 'core', level: 'easy', q: 'Phân biệt JDK, JRE và JVM?',
    points: ['JVM: máy ảo chạy bytecode', 'JRE = JVM + thư viện runtime', 'JDK = JRE + công cụ biên dịch (javac)'],
    answer: 'Hình dung như búp bê Nga lồng nhau: JVM (lõi trong cùng) là máy ảo dịch và chạy bytecode. JRE = JVM + thư viện chuẩn, đủ để CHẠY app. JDK = JRE + bộ đồ nghề lập trình (javac, jar, javadoc) để VIẾT và biên dịch code. Máy user chỉ cần JRE, dev cần JDK.' },
  { id: 'core-2', topic: 'core', level: 'easy', q: '`==` khác `equals()` thế nào?',
    points: ['`==` so sánh tham chiếu (địa chỉ)', '`equals()` so sánh nội dung (nếu được override)', 'Với object mặc định equals() = =='],
    answer: '`==` hỏi "có phải CÙNG một object không" (so địa chỉ tham chiếu trên heap). `equals()` hỏi "nội dung có GIỐNG nhau không" — nhưng chỉ đúng nếu class đã override; mặc định Object.equals() vẫn so tham chiếu y hệt `==`. Mẹo: với String/dữ liệu luôn dùng `equals()`.' },
  { id: 'core-3', topic: 'core', level: 'medium', q: 'Vì sao String immutable trong Java? Lợi ích?',
    points: ['String pool tái dùng', 'An toàn làm key của HashMap', 'Thread-safe, cache hashCode', 'Bảo mật (đường dẫn, kết nối)'],
    answer: 'Bất biến nghĩa là tạo ra rồi thì không sửa được nội dung. Nhờ vậy: nhiều biến chung một String literal an toàn qua String pool (tiết kiệm bộ nhớ); làm key HashMap yên tâm vì hashCode không bao giờ đổi; tự động thread-safe; và an toàn bảo mật (đường dẫn, mật khẩu không bị đổi ngầm). Vì "sửa" String thực chất là tạo object mới, nối chuỗi trong vòng lặp phải dùng StringBuilder.' },
  { id: 'core-4', topic: 'core', level: 'medium', q: 'String vs StringBuilder vs StringBuffer?',
    points: ['String: bất biến', 'StringBuilder: khả biến, KHÔNG đồng bộ (nhanh)', 'StringBuffer: khả biến, đồng bộ (thread-safe, chậm hơn)'],
    answer: 'String bất biến (mỗi lần đổi là tạo object mới). StringBuilder khả biến, sửa tại chỗ và KHÔNG đồng bộ nên nhanh — mặc định dùng trong một luồng. StringBuffer y hệt StringBuilder nhưng mọi method đều synchronized nên thread-safe mà chậm hơn. Mẹo nhớ: buffer có "khóa" (an toàn, ì ạch), builder thì "chạy nhanh".' },
  { id: 'core-5', topic: 'core', level: 'medium', q: 'Từ khóa `final` dùng cho biến, method, class có ý nghĩa gì?',
    points: ['final biến: không gán lại (hằng)', 'final method: không override được', 'final class: không kế thừa được (vd String)'],
    answer: 'final nghĩa là "chốt lại, cấm đổi", nhưng đổi cái gì tùy chỗ đặt: trên biến = không gán lại sau khi khởi tạo (thành hằng); trên method = lớp con không được override; trên class = không ai kế thừa được (ví dụ String). Bẫy hay gặp: final trên biến object chỉ khóa THAM CHIẾU (không trỏ đi nơi khác), còn nội dung bên trong object vẫn sửa thoải mái.' },
  { id: 'core-6', topic: 'core', level: 'medium', q: '`static` là gì? Khi nào dùng biến/method static?',
    points: ['Thuộc về class, không thuộc instance', 'Chia sẻ chung mọi object', 'Gọi qua tên class', 'Hàm tiện ích, hằng số'],
    answer: 'static gắn với CLASS chứ không gắn với từng object, nên chỉ tồn tại đúng 1 bản dùng chung cho mọi instance và gọi thẳng qua tên class. Ví như số phòng thì mỗi người một khác, nhưng tên tòa nhà thì cả tòa xài chung. Dùng cho hằng số, hàm tiện ích (utility), bộ đếm chung. Method static không có `this` nên không đụng được biến instance.' },
  { id: 'core-7', topic: 'core', level: 'hard', q: 'Autoboxing là gì? Cạm bẫy với Integer cache?',
    points: ['Tự chuyển int <-> Integer', 'Integer cache -128..127', '`==` trên Integer ngoài khoảng -> false', 'NPE khi unbox null'],
    answer: 'Autoboxing là việc Java tự chuyển qua lại primitive ↔ wrapper (`int` ↔ `Integer`) cho tiện. Cạm bẫy: JVM cache sẵn các Integer từ -128..127, nên `==` hai Integer trong khoảng đó trả true (cùng object cache), còn ngoài khoảng lại tạo object mới nên false — vì vậy luôn so bằng equals(). Bẫy thứ hai: unbox một `Integer` đang null sẽ ném NullPointerException.' },
  { id: 'core-8', topic: 'core', level: 'medium', q: 'Truyền tham số trong Java là pass-by-value hay pass-by-reference?',
    points: ['Luôn pass-by-value', 'Với object: copy GIÁ TRỊ của tham chiếu', 'Đổi field bên trong thì thấy; gán lại tham chiếu thì không'],
    answer: 'Java LUÔN pass-by-value — không bao giờ pass-by-reference. Với object, cái được copy vào method là GIÁ TRỊ của tham chiếu (một bản sao địa chỉ). Hình dung method cầm một tờ giấy ghi cùng địa chỉ nhà: sửa đồ đạc trong nhà (đổi field) thì caller thấy; nhưng viết đè địa chỉ khác lên tờ giấy (gán lại tham chiếu) chỉ ảnh hưởng bản sao, biến gốc không đổi.' },
  { id: 'core-9', topic: 'core', level: 'easy', q: 'Overloading và overriding khác nhau thế nào?',
    points: ['Overload: cùng tên, khác tham số, compile-time', 'Override: cùng signature ở lớp con, runtime', 'Override tuân @Override, luật covariant return'],
    answer: 'Overloading (nạp chồng): cùng tên method nhưng khác danh sách tham số, trong cùng một class — compiler chọn bản nào ngay lúc biên dịch. Overriding (ghi đè): lớp con viết lại method cùng signature của lớp cha — JVM chọn bản nào lúc chạy theo object thực (dynamic dispatch). Nhớ nhanh: overLOAD = "load thêm phiên bản cùng tên", overRIDE = "con cưỡi lên và thay thế method của cha".' },
  { id: 'core-10', topic: 'core', level: 'hard', q: 'Java 8+ có gì đáng chú ý mà bạn hay dùng?',
    points: ['Lambda + Stream', 'Optional', 'default method trên interface', 'java.time (LocalDate/LocalDateTime)', 'var (Java 10), record (16), sealed (17)'],
    answer: 'Java 8 là bước ngoặt: Lambda & Stream API (xử lý dữ liệu kiểu khai báo, gọn hơn vòng lặp), Optional để diễn đạt "có thể null" mà tránh NPE, default method cho phép thêm method vào interface mà không vỡ code cũ, và java.time thay Date/Calendar cũ khó dùng. Bản mới hơn: var (10) suy luận kiểu, record (16) cho DTO bất biến siêu gọn, sealed class, switch expression, text block.' },

  // ---------- OOP ----------
  { id: 'oop-1', topic: 'oop', level: 'easy', q: 'Bốn tính chất của OOP là gì?',
    points: ['Encapsulation (đóng gói)', 'Inheritance (kế thừa)', 'Polymorphism (đa hình)', 'Abstraction (trừu tượng)'],
    answer: 'Bốn trụ cột: Đóng gói (giấu field private, mở cửa qua getter/setter — như thuốc bọc vỏ nang), Kế thừa (extends để tái dùng code của lớp cha), Đa hình (cùng một lời gọi cho ra hành vi khác nhau — override lúc chạy / overload lúc biên dịch), Trừu tượng (chỉ phơi ra "làm gì", giấu "làm thế nào" qua abstract/interface). Mẹo nhớ tiếng Anh: A-PIE.' },
  { id: 'oop-2', topic: 'oop', level: 'medium', q: 'Interface khác abstract class thế nào? Khi nào dùng cái nào?',
    points: ['Interface: implement nhiều, "CAN-DO"', 'Abstract: extend 1, có state + constructor, "IS-A"', 'Interface Java 8+ có default/static method'],
    answer: 'Interface là bản HỢP ĐỒNG về khả năng: một lớp ký được nhiều hợp đồng (implement nhiều interface), chỉ chứa hằng số và (từ Java 8) default/static method — hợp khi mô tả "CAN-DO" như Comparable, Runnable. Abstract class là "bản nửa hoàn thiện": có state, constructor, method cụ thể để chia sẻ code chung, nhưng chỉ extend được một — hợp khi có quan hệ "IS-A". Mẹo chọn: cần đa "khả năng" thì interface, cần chia sẻ code + trạng thái chung thì abstract class.' },
  { id: 'oop-3', topic: 'oop', level: 'hard', q: 'Hợp đồng equals()/hashCode() là gì? Quên override hashCode gây lỗi gì?',
    points: ['equal => hashCode bằng nhau', 'hashCode bằng nhau không bắt buộc equal', 'Quên hashCode: HashMap/HashSet chứa trùng, get() trả null'],
    answer: 'Quy tắc vàng: nếu a.equals(b) thì a.hashCode() BẮT BUỘC bằng b.hashCode() (chiều ngược lại không cần — hai object khác nhau vẫn có thể trùng hashCode, gọi là va chạm). Ví như hashCode là "số kệ hàng", equals là "so từng món": muốn tìm được món thì trước hết phải nhìn đúng kệ. Override equals mà quên hashCode khiến hai object "bằng nhau" rơi vào bucket khác nhau → HashSet chứa trùng, HashMap.get() trả null.' },
  { id: 'oop-4', topic: 'oop', level: 'medium', q: 'Composition vs Inheritance — nên ưu tiên cái nào?',
    points: ['"Favor composition over inheritance"', 'Kế thừa: coupling chặt, phá vỡ đóng gói', 'Composition: linh hoạt, dễ test, dễ thay đổi'],
    answer: 'Ưu tiên composition ("có-một", has-a) hơn inheritance ("là-một", is-a). Vì kế thừa buộc lớp con dính chặt vào chi tiết của cha, cha đổi là con dễ vỡ (fragile base class). Composition thì lắp ghép như Lego: dễ thay linh kiện, dễ mock để test, đổi hành vi lúc chạy. Chỉ kế thừa khi thật sự "con LÀ một loại cha" và muốn đa hình.' },
  { id: 'oop-5', topic: 'oop', level: 'hard', q: 'Cách tạo một immutable class?',
    points: ['class final', 'field private final', 'không setter', 'defensive copy field khả biến ở constructor & getter'],
    answer: 'Công thức 4 bước: (1) class là final để không ai kế thừa rồi phá; (2) mọi field private final; (3) không có setter, khởi tạo hết trong constructor; (4) với field khả biến (List, Date) phải copy PHÒNG THỦ cả khi nhận vào constructor lẫn khi trả ra ở getter — nếu không, người ngoài giữ tham chiếu và sửa được ruột object. Ý cốt lõi: đừng để "địa chỉ" của dữ liệu bên trong lọt ra ngoài.' },
  { id: 'oop-6', topic: 'oop', level: 'medium', q: 'Đa hình (polymorphism) hoạt động thế nào lúc runtime?',
    points: ['Dynamic method dispatch', 'Kiểu thực của object quyết định method chạy', 'Biến kiểu cha trỏ object con'],
    answer: 'Với method đã override, JVM quyết định gọi bản nào dựa trên KIỂU THỰC của object lúc chạy (dynamic dispatch / late binding), chứ không dựa trên kiểu biến lúc khai báo. Nhờ đó `Animal a = new Dog()` gọi `a.sound()` vẫn ra tiếng của Dog. Đó chính là sức mạnh cho phép viết code theo kiểu cha mà chạy đúng hành vi của từng con.' },
  { id: 'oop-7', topic: 'oop', level: 'medium', q: 'Comparable khác Comparator thế nào?',
    points: ['Comparable: compareTo, thứ tự "tự nhiên", 1 cách', 'Comparator: compare, thứ tự ngoài, nhiều cách', 'Comparator.comparing(...)'],
    answer: 'Comparable là thứ tự "bẩm sinh" nằm ngay trong class qua compareTo() — mỗi class chỉ có một cách sắp mặc định (ví dụ số tăng dần). Comparator là bộ so sánh "rời" đặt bên ngoài qua compare() — tạo được bao nhiêu tiêu chí tùy thích (theo tên, theo tuổi...) mà không sửa class gốc, rất tiện với Comparator.comparing().thenComparing(). Nhớ nhanh: Comparable = "tôi tự biết so", Comparator = "trọng tài bên ngoài so hộ".' },
  { id: 'oop-8', topic: 'oop', level: 'hard', q: 'Diamond problem là gì? Java xử lý ra sao?',
    points: ['Đa kế thừa gây nhập nhằng', 'Java cấm đa kế thừa class', 'Interface default method trùng -> lớp phải override, gọi A.super.m()'],
    answer: 'Diamond problem (hình thoi) là sự nhập nhằng khi một lớp thừa kế cùng lúc từ hai nhánh mà cả hai đều có method cùng tên — JVM không biết chọn bản nào. Java né bằng cách CẤM đa kế thừa class. Với interface (Java 8+ có default method), nếu hai default method trùng, compiler bắt lớp phải tự override, và muốn gọi bản cụ thể thì viết rõ `InterfaceA.super.method()`.' },

  // ---------- Collections ----------
  { id: 'col-1', topic: 'collections', level: 'easy', q: 'ArrayList khác LinkedList thế nào? Khi nào chọn LinkedList?',
    points: ['ArrayList: mảng động, random access O(1)', 'LinkedList: danh sách liên kết, chèn/xóa đầu-cuối O(1)', '95% dùng ArrayList'],
    answer: 'ArrayList là mảng động — nhảy tới phần tử thứ i tức thì O(1) (như biết số trang trong sách), nhưng chèn/xóa ở giữa phải dịch dời cả dãy O(n). LinkedList là danh sách liên kết đôi — thêm/xóa ở đầu-cuối O(1), nhưng muốn tới index i phải đi bộ lần lượt O(n). Thực tế 95% dùng ArrayList; chỉ chọn LinkedList khi cần Queue/Deque thêm-xóa hai đầu liên tục.' },
  { id: 'col-2', topic: 'collections', level: 'hard', q: 'HashMap hoạt động bên trong thế nào?',
    points: ['Mảng bucket (mặc định 16)', 'hash(key) -> index', 'Va chạm -> linked list, >8 & cap>=64 -> cây đỏ đen', 'load factor 0.75 -> rehash ×2'],
    answer: 'HashMap là một mảng các "ngăn" (bucket, mặc định 16). Băm key ra một index để biết bỏ vào ngăn nào — như phân thư vào hộc theo mã bưu điện. Nhiều key rơi cùng ngăn (va chạm) thì nối thành linked list; nếu một ngăn phình >8 phần tử và bảng đã ≥64 thì đổi ngăn đó sang cây đỏ đen để tra cứu O(log n) thay vì O(n). Khi số phần tử vượt capacity×0.75 (load factor) thì rehash — tăng gấp đôi bảng và chia lại chỗ.' },
  { id: 'col-3', topic: 'collections', level: 'medium', q: 'HashMap, LinkedHashMap và TreeMap khác nhau ra sao?',
    points: ['HashMap: không thứ tự, O(1)', 'LinkedHashMap: giữ thứ tự thêm/truy cập', 'TreeMap: sắp theo key, O(log n), range query'],
    answer: 'Cùng là Map key-value nhưng khác nhau ở THỨ TỰ. HashMap nhanh nhất O(1) nhưng duyệt ra thứ tự lộn xộn. LinkedHashMap thêm một danh sách liên kết nên giữ đúng thứ tự chèn (hoặc thứ tự truy cập — nền tảng làm LRU cache). TreeMap luôn giữ key được SẮP XẾP bằng cây đỏ đen, O(log n), đổi lấy khả năng truy vấn khoảng (firstKey, floorKey, subMap). Nhớ: Hash=nhanh/loạn, Linked=nhớ thứ tự vào, Tree=luôn sắp xếp.' },
  { id: 'col-4', topic: 'collections', level: 'medium', q: 'HashSet lưu trữ thế nào? Vì sao phần tử không trùng?',
    points: ['Bọc một HashMap bên trong', 'Phần tử = key, value là hằng dummy', 'Dựa equals()/hashCode() để loại trùng'],
    answer: 'HashSet thực chất "mượn ruột" của một HashMap: phần tử bạn thêm được lưu làm KEY, còn value chỉ là một object hằng dummy cho có. Vì key của HashMap vốn không được trùng, Set tự động không trùng — dựa vào cặp equals()/hashCode() của phần tử để phát hiện. Hệ quả quan trọng: object tự viết muốn bỏ vào Set phải override cả equals lẫn hashCode, không thì trùng vẫn lọt.' },
  { id: 'col-5', topic: 'collections', level: 'hard', q: 'Fail-fast và fail-safe iterator là gì?',
    points: ['Fail-fast: ném CME khi collection đổi lúc lặp (ArrayList, HashMap)', 'Cơ chế modCount', 'Fail-safe: lặp trên bản sao (CopyOnWriteArrayList, ConcurrentHashMap)'],
    answer: 'Fail-fast iterator "báo lỗi ngay": nếu collection bị sửa cấu trúc (thêm/xóa) trong lúc đang lặp, nó ném ConcurrentModificationException — phát hiện nhờ đếm số lần sửa modCount lệch với lúc bắt đầu (ArrayList, HashMap). Fail-safe iterator "âm thầm an toàn": lặp trên một bản sao/snapshot nên không bao giờ ném, đổi lại có thể không thấy thay đổi mới nhất (CopyOnWriteArrayList, ConcurrentHashMap). Nhớ: fast=la làng, safe=lặng lẽ.' },
  { id: 'col-6', topic: 'collections', level: 'medium', q: 'Làm sao xóa phần tử khi đang duyệt list mà không lỗi?',
    points: ['Không xóa trực tiếp trong for-each', 'Dùng Iterator.remove()', 'hoặc removeIf(predicate)'],
    answer: 'Đừng gọi list.remove() ngay trong vòng for-each — nó làm modCount lệch và ném ConcurrentModificationException (như rút ghế khi người khác đang đếm ghế). Cách đúng: lặp bằng Iterator rồi gọi iterator.remove() (nó cập nhật modCount đồng bộ), hoặc gọn nhất là dùng list.removeIf(điều_kiện).' },
  { id: 'col-7', topic: 'collections', level: 'hard', q: 'HashMap có thread-safe không? Thay bằng gì?',
    points: ['KHÔNG thread-safe', 'ConcurrentHashMap: lock theo bucket + CAS', 'Collections.synchronizedMap: lock toàn map', 'Hashtable legacy'],
    answer: 'HashMap KHÔNG thread-safe: hai luồng cùng resize có thể làm hỏng cấu trúc hoặc mất dữ liệu. Đa luồng nên dùng ConcurrentHashMap — nó khóa MỊN theo từng bucket cộng thao tác CAS, nên nhiều luồng ghi song song vẫn nhanh (throughput cao) và có sẵn computeIfAbsent/merge tiện lợi. Collections.synchronizedMap thì khóa CẢ map như một cửa duy nhất nên nghẽn; Hashtable là đồ cổ (legacy), tránh dùng.' },
  { id: 'col-8', topic: 'collections', level: 'easy', q: 'Độ phức tạp của các thao tác chính trên ArrayList, HashMap, TreeMap?',
    points: ['ArrayList: get O(1), add cuối O(1) amortized, xóa giữa O(n)', 'HashMap: get/put O(1) trung bình', 'TreeMap: O(log n)'],
    answer: 'ArrayList: get theo index O(1), add vào cuối O(1) amortized (nghĩa là thường tức thì, thi thoảng phải resize copy cả mảng O(n) nhưng chia đều ra vẫn coi như O(1)), chèn/xóa ở giữa O(n). HashMap: get/put trung bình O(1), xấu nhất O(log n) khi bucket đã treeify thành cây. TreeMap: mọi thao tác O(log n) vì luôn duyệt cây. Quy luật dễ nhớ: index thẳng=O(1), băm=O(1) trung bình, cây=O(log n).' },

  // ---------- Exception ----------
  { id: 'exc-1', topic: 'exception', level: 'easy', q: 'Checked và unchecked exception khác nhau thế nào?',
    points: ['Checked: compiler bắt handle/throws (IOException)', 'Unchecked: RuntimeException, không bắt buộc', 'Error: sự cố JVM, không catch'],
    answer: 'Mẹo nhớ: checked là lỗi "đến từ bên ngoài" (IOException, SQLException) mà compiler ÉP bạn phải catch hoặc khai báo throws — dùng khi có thể phục hồi. Unchecked (RuntimeException như NPE, IllegalArgument) là lỗi do code sai, compiler không ép vì đáng ra bạn phải sửa code chứ không "xử lý". Còn Error (OOM, StackOverflow) là JVM đang chết dở — đừng catch.' },
  { id: 'exc-2', topic: 'exception', level: 'medium', q: 'try-with-resources là gì? Lợi ích so với finally?',
    points: ['Tự đóng resource (AutoCloseable)', 'Đóng theo thứ tự ngược', 'Xử lý đúng suppressed exception', 'Ngắn gọn, ít lỗi'],
    answer: 'Coi try-with-resources như "thuê đồ có người tự trả": mọi resource implement AutoCloseable sẽ được tự gọi close() khi ra khỏi block, đóng theo thứ tự NGƯỢC lúc mở, và giữ đúng exception gốc (lỗi lúc close chỉ bị "suppressed" chứ không đè lên lỗi chính). Ngắn gọn và an toàn hơn nhiều so với tự nhớ đóng trong finally.' },
  { id: 'exc-3', topic: 'exception', level: 'medium', q: '`finally` có luôn chạy không?',
    points: ['Gần như luôn chạy, kể cả có return', 'Không chạy khi System.exit() hoặc JVM crash', 'return trong finally ghi đè (anti-pattern)'],
    answer: 'Gần như LUÔN chạy — kể cả khi try/catch đã return hay đang ném exception (finally chạy ngay trước lúc thoát). Chỉ trượt khi System.exit() hoặc JVM bị kill/crash. Đừng đặt return trong finally vì nó âm thầm đè lên giá trị/exception của try, nuốt mất lỗi thật.' },
  { id: 'exc-4', topic: 'exception', level: 'medium', q: 'Nên tạo custom exception kế thừa từ đâu?',
    points: ['Lỗi nghiệp vụ -> RuntimeException', 'Recoverable -> Exception (checked)', 'Có constructor (message) và (message, cause)'],
    answer: 'Mặc định cho extends RuntimeException (unchecked) để khỏi rải throws khắp nơi — hợp với Spring. Chỉ extends Exception (checked) khi thực sự muốn ÉP caller xử lý vì lỗi có thể phục hồi. Luôn tạo constructor nhận message và nhận (message, cause) để không đánh mất nguyên nhân gốc.' },
  { id: 'exc-5', topic: 'exception', level: 'hard', q: 'Exception chaining là gì? Vì sao quan trọng?',
    points: ['throw new X("msg", e) giữ cause', 'Không nuốt stack trace gốc', 'Debug dễ hơn'],
    answer: 'Chaining là "gói" exception gốc làm cause của exception mới, qua constructor (message, cause) hoặc initCause(). Nhờ vậy stack trace gốc vẫn còn nguyên, đọc log là truy được tận gốc. Ném new X(e.getMessage()) rồi bỏ e đi là cắt đứt manh mối — anti-pattern kinh điển.' },
  { id: 'exc-6', topic: 'exception', level: 'easy', q: 'Có nên catch Exception hoặc Throwable chung chung không?',
    points: ['Tránh catch quá rộng nuốt lỗi', 'Không catch Throwable/Error', 'Catch cụ thể, log đầy đủ, xử lý đúng chỗ'],
    answer: 'Nguyên tắc: catch càng cụ thể càng tốt và xử lý đúng cách. Catch Exception chung chung dễ nuốt luôn cả lỗi ngoài dự kiến khiến bug bị giấu. Tuyệt đối không catch Throwable/Error vì đó là JVM đang hấp hối (OOM…), bắt lại chẳng cứu được gì. Nếu buộc phải bắt rộng ở tầng biên thì tối thiểu phải log đầy đủ.' },

  // ---------- Generics ----------
  { id: 'gen-1', topic: 'generics', level: 'easy', q: 'Generics giải quyết vấn đề gì?',
    points: ['Type-safe lúc compile', 'Không cần ép kiểu', 'Tái dùng code cho nhiều kiểu'],
    answer: 'Generics giúp một đoạn code chạy được với nhiều kiểu mà compiler vẫn kiểm tra kiểu ngay lúc biên dịch — như dán "nhãn kiểu" lên container. Nhờ đó bỏ được ép kiểu thủ công và chặn ClassCastException từ lúc build thay vì để nổ lúc chạy.' },
  { id: 'gen-2', topic: 'generics', level: 'hard', q: 'PECS là gì? Giải thích ? extends và ? super.',
    points: ['Producer Extends, Consumer Super', '? extends T: chỉ đọc (T ra)', '? super T: chỉ ghi (T vào)'],
    answer: 'PECS = Producer Extends, Consumer Super. Nhớ theo vai trò: nếu cấu trúc SẢN XUẤT dữ liệu cho bạn đọc RA thì ? extends T; nếu nó TIÊU THỤ dữ liệu bạn ghi VÀO thì ? super T. Còn vừa đọc vừa ghi thì đừng dùng wildcard, để T cố định.' },
  { id: 'gen-3', topic: 'generics', level: 'hard', q: 'Type erasure là gì? Hệ quả?',
    points: ['Generic bị xóa lúc runtime', 'List<String> == List<Integer> lúc chạy', 'Không new T(), new T[], instanceof T'],
    answer: 'Compiler kiểm tra kiểu generic xong thì XÓA sạch thông tin đó đi (type erasure), lúc runtime chỉ còn kiểu thô — nên List<String> và List<Integer> thực chất là cùng một class. Hệ quả: không new T(), không new T[], không instanceof T, và không overload chỉ khác tham số generic. Muốn biết kiểu thật lúc chạy thì phải tự truyền Class<T> vào.' },
  { id: 'gen-4', topic: 'generics', level: 'medium', q: 'Bounded type parameter là gì? Ví dụ?',
    points: ['<T extends Number> giới hạn kiểu', 'Gọi được method của bound', 'Có thể nhiều bound <T extends A & B>'],
    answer: 'Bounded type đặt "trần trên" cho T, ví dụ <T extends Number> nghĩa là T phải là Number hoặc con của nó — nhờ vậy trong code gọi được các method của Number (như intValue…). Có thể chặn nhiều điều kiện cùng lúc: <T extends Comparable<T> & Serializable>.' },
  { id: 'gen-5', topic: 'generics', level: 'medium', q: 'Generic method khác generic class thế nào?',
    points: ['Generic method: <T> khai báo ở method, độc lập với class', 'Type param suy luận từ tham số truyền vào', 'Dùng khi chỉ 1 method cần generic, không muốn generic hóa cả class'],
    answer: 'Generic class khai báo <T> ở cấp class (class Box<T>) nên mọi method dùng chung một T. Generic method thì tự khai báo <T> ngay trước kiểu trả về (static <T> T firstOf(List<T> list)), và T được suy ra từ tham số truyền vào, độc lập với class chứa nó — dùng khi chỉ MỘT method cần generic mà không muốn kéo cả class theo.' },
  { id: 'gen-6', topic: 'generics', level: 'hard', q: 'Vì sao không tạo được mảng generic (new T[])? Cách né?',
    points: ['Mảng Java giữ kiểu runtime (reified), generic bị erasure', 'new T[] sẽ mất kiểm tra kiểu lúc runtime -> Java cấm', 'Né bằng List<T> hoặc ép kiểu (T[]) new Object[n] kèm cảnh báo unchecked'],
    answer: 'Mâu thuẫn cốt lõi: mảng Java NHỚ kiểu phần tử lúc runtime (reified) để chặn gán sai, còn generic thì bị XÓA kiểu (erasure) nên JVM không biết T là gì lúc chạy — cho phép new T[] sẽ phá vỡ chính cơ chế bảo vệ đó, nên Java cấm luôn. Né bằng cách dùng List<T> thay mảng, hoặc tạo Object[] rồi ép (T[]) kèm @SuppressWarnings("unchecked").' },
  { id: 'gen-7', topic: 'generics', level: 'medium', q: 'Wildcard không giới hạn (?) khác Object thế nào?',
    points: ['List<?>: danh sách của MỘT kiểu cụ thể nào đó (chưa biết), chỉ đọc an toàn kiểu Object', 'List<Object>: danh sách chấp nhận add mọi kiểu Object', 'List<?> KHÔNG add được (trừ null) vì trình biên dịch không biết kiểu thật'],
    answer: 'List<?> nghĩa là "list của MỘT kiểu cụ thể nào đó, chỉ có điều chưa biết là kiểu gì" — đọc ra thì an toàn dưới dạng Object, nhưng KHÔNG add được gì (trừ null) vì compiler không dám chắc kiểu thật. List<Object> thì khác hẳn: nó nhận Object bất kỳ nên add thoải mái. Điểm hay để nhớ: List<String> không gán được cho List<Object> nhưng lại gán được cho List<?>.' },

  // ---------- Stream & Lambda ----------
  { id: 'str-1', topic: 'stream', level: 'medium', q: 'Stream lazy evaluation nghĩa là gì?',
    points: ['Intermediate op không chạy tới khi có terminal', 'Cho phép short-circuit (findFirst)', 'Stream dùng một lần'],
    answer: 'Các op trung gian (map, filter) chỉ là "bản thiết kế" — chưa chạy gì cho tới khi gặp op kết thúc (collect, forEach) mới kích hoạt cả pipeline. Nhờ lazy nên có short-circuit: findFirst/anyMatch tìm thấy là dừng ngay, không duyệt hết. Lưu ý một Stream chỉ xài được một lần, muốn dùng lại phải tạo mới.' },
  { id: 'str-2', topic: 'stream', level: 'medium', q: 'map() khác flatMap() thế nào?',
    points: ['map: T -> R (1-1)', 'flatMap: T -> Stream<R> rồi làm phẳng (1-nhiều)', 'flatMap gộp list-of-list'],
    answer: 'map đổi mỗi phần tử 1-đổi-1 (T→R), số phần tử giữ nguyên. flatMap biến mỗi phần tử thành một Stream rồi NỐI PHẲNG tất cả thành một dòng chảy — dùng khi một phần tử đẻ ra nhiều giá trị, hoặc để làm phẳng list-lồng-list thành list đơn.' },
  { id: 'str-3', topic: 'stream', level: 'medium', q: 'Collectors.groupingBy trả về gì?',
    points: ['Map<K, List<T>>', 'Kèm downstream: counting() -> Map<K,Long>', 'partitioningBy -> Map<Boolean,List>'],
    answer: 'groupingBy(classifier) gom phần tử theo khóa, mặc định trả Map<K, List<T>>. Thêm downstream collector để đổi phần giá trị: groupingBy(x, counting()) → Map<K, Long>, hay dùng mapping/summingInt. Nếu chỉ chia hai nhóm true/false thì dùng partitioningBy.' },
  { id: 'str-4', topic: 'stream', level: 'hard', q: 'Optional dùng đúng cách như thế nào?',
    points: ['Chỉ dùng làm return type', 'Không làm field/parameter', 'orElse vs orElseGet (lazy)', 'get() là anti-pattern'],
    answer: 'Optional là cách nói rõ "chỗ này có thể rỗng" ở kiểu trả về, buộc caller phải xử lý thay vì quên rồi ăn NPE. Đừng dùng làm field hay tham số. Ưu tiên map/orElseGet/orElseThrow; nhớ orElse(x) LUÔN tính x kể cả khi có giá trị, còn orElseGet(supplier) chỉ tính khi rỗng (rẻ hơn nếu x tốn kém); tránh gọi get() trần vì chẳng khác gì tháo ngòi an toàn.' },
  { id: 'str-5', topic: 'stream', level: 'medium', q: 'Các functional interface cơ bản trong java.util.function?',
    points: ['Function<T,R>: biến đổi', 'Predicate<T>: điều kiện', 'Supplier<T>: cung cấp', 'Consumer<T>: side-effect'],
    answer: 'Nhớ theo "vào/ra": Function<T,R> nhận T trả R (biến đổi); Predicate<T> nhận T trả boolean (điều kiện/lọc); Supplier<T> không nhận gì, chỉ đẻ ra T (cung cấp); Consumer<T> nhận T nhưng không trả gì (side-effect). Còn các biến thể như BiFunction (2 tham số) và UnaryOperator (T→T).' },
  { id: 'str-6', topic: 'stream', level: 'hard', q: 'Khi nào nên dùng parallelStream? Rủi ro?',
    points: ['Dataset lớn, CPU-bound, stateless', 'Dùng chung ForkJoinPool.commonPool', 'Tránh: I/O-bound, shared mutable, thứ tự quan trọng'],
    answer: 'Chỉ đáng dùng khi dữ liệu LỚN, tính toán nặng CPU, mỗi thao tác stateless và không đụng trạng thái chung — lúc đó chia việc cho nhiều lõi mới lời. Rủi ro: mặc định nó xài chung ForkJoinPool.commonPool nên tác vụ I/O sẽ làm nghẽn cả app; có shared mutable state là sai kết quả; và với dữ liệu nhỏ thì chi phí chia/gộp còn đắt hơn lợi ích.' },

  // ---------- Concurrency ----------
  { id: 'con-1', topic: 'concurrency', level: 'medium', q: 'Thread và Runnable/Callable khác nhau ra sao?',
    points: ['Runnable: run() không trả về, không checked ex', 'Callable<T>: call() trả T + throws', 'submit(Callable) -> Future<T>'],
    answer: 'Runnable.run() làm việc xong là thôi — không trả kết quả, không ném được checked exception. Callable<T>.call() thì trả về T và được phép ném checked exception; nộp nó vào ExecutorService.submit() sẽ nhận về Future<T> để lấy kết quả sau. Ngắn gọn: cần lấy kết quả hoặc ném lỗi thì dùng Callable.' },
  { id: 'con-2', topic: 'concurrency', level: 'hard', q: 'volatile giải quyết gì? Khi nào không đủ?',
    points: ['Đảm bảo visibility giữa thread', 'KHÔNG đảm bảo atomicity', 'count++ vẫn sai -> Atomic/synchronized'],
    answer: 'volatile lo phần "nhìn thấy": đảm bảo mọi thread luôn đọc giá trị mới nhất (visibility) và chặn CPU/compiler sắp xếp lại lệnh sai. Nhưng nó KHÔNG làm thao tác trở nên nguyên tử. Việc như count++ thực ra gồm 3 bước đọc-cộng-ghi nên hai thread vẫn đè lên nhau — chỗ này phải dùng AtomicInteger hoặc synchronized.' },
  { id: 'con-3', topic: 'concurrency', level: 'medium', q: 'synchronized và ReentrantLock khác nhau chỗ nào?',
    points: ['synchronized: đơn giản, tự nhả', 'ReentrantLock: tryLock(timeout), fairness, Condition', 'Lock phải unlock trong finally'],
    answer: 'synchronized đơn giản, được cái tự nhả khóa khi thoát block nên khó quên. ReentrantLock đổi lấy sự linh hoạt: tryLock (kể cả có timeout) để không chờ mãi, fairness cho khóa công bằng, lockInterruptibly, và nhiều Condition riêng — cái giá là bạn phải tự unlock() trong finally, quên là kẹt.' },
  { id: 'con-4', topic: 'concurrency', level: 'hard', q: 'Deadlock là gì? 4 điều kiện và cách tránh?',
    points: ['Mutual exclusion, hold-and-wait, no preemption, circular wait', 'Tránh: lock ordering nhất quán', 'tryLock có timeout'],
    answer: 'Deadlock là mấy thread ôm khóa rồi chờ nhau theo vòng tròn, kẹt cứng vĩnh viễn. Nó cần đủ 4 điều kiện cùng lúc: loại trừ tương hỗ, giữ-và-chờ, không tước đoạt, chờ vòng tròn — phá được một cái là hết kẹt. Cách phổ biến nhất: luôn lấy khóa theo cùng một THỨ TỰ (phá "chờ vòng tròn"); ngoài ra dùng tryLock có timeout, thu nhỏ phạm vi khóa, ưu tiên đồ trong java.util.concurrent.' },
  { id: 'con-5', topic: 'concurrency', level: 'medium', q: 'ExecutorService là gì? Vì sao hơn tự new Thread?',
    points: ['Quản lý thread pool tái dùng thread', 'Tách nộp task khỏi thực thi', 'shutdown() vs shutdownNow()'],
    answer: 'Tạo/hủy thread liên tục rất tốn, và new Thread vô tội vạ có thể làm cạn tài nguyên máy. ExecutorService giữ sẵn một pool thread để TÁI DÙNG, khống chế số thread tối đa, và tách bạch việc "nộp task" khỏi "cách chạy task". Nhớ gọi shutdown() cho nó dọn thread khi xong; shutdownNow() là cố dừng ngay lập tức.' },
  { id: 'con-6', topic: 'concurrency', level: 'hard', q: 'CompletableFuture giải quyết gì mà Future không làm được?',
    points: ['Chain non-blocking thenApply/thenCompose', 'Kết hợp allOf/anyOf', 'Xử lý lỗi exceptionally/handle'],
    answer: 'Future cũ chỉ có get() phải ĐỨNG CHỜ, không nối tiếp được gì. CompletableFuture cho phép ghép chuỗi non-blocking (thenApply giống map, thenCompose giống flatMap), gộp nhiều future (allOf/anyOf), và bắt lỗi gọn (exceptionally/handle) — như một dây chuyền xử lý bất đồng bộ. Lưu ý join() ném unchecked còn get() ném checked.' },
  { id: 'con-7', topic: 'concurrency', level: 'hard', q: 'ThreadLocal là gì? Cạm bẫy trong thread pool?',
    points: ['Biến riêng theo thread', 'Thread pool tái dùng thread -> giá trị cũ leak', 'Luôn remove() trong finally'],
    answer: 'ThreadLocal phát cho mỗi thread một BẢN RIÊNG của biến, tiện để giữ ngữ cảnh theo luồng (vd user context của mỗi request) mà không phải truyền tay. Cạm bẫy: trong thread pool thread bị tái dùng, nên giá trị cũ có thể "dính" sang request kế tiếp — rò rỉ dữ liệu, thậm chí lộ thông tin người khác. Vì vậy phải remove() trong finally sau mỗi lần dùng.' },

  // ---------- Spring Boot & DI ----------
  { id: 'spr-1', topic: 'spring', level: 'easy', q: 'IoC và DI là gì?',
    points: ['IoC: container tạo & quản lý object', 'DI: tiêm phụ thuộc từ ngoài', 'Giảm coupling, dễ test'],
    answer: 'IoC (Inversion of Control) là "đảo quyền điều khiển": thay vì class tự tay new các phụ thuộc, nó giao cho container (ApplicationContext) lo việc tạo và quản lý vòng đời — giống bạn không tự nấu ăn mà gọi nhà hàng lo. DI (Dependency Injection) là cách hiện thực IoC cụ thể: container "tiêm" sẵn phụ thuộc từ bên ngoài vào (thường qua constructor). Lợi ích: class không dính chặt vào một implementation cụ thể (loose coupling), và khi test chỉ cần tiêm mock vào là xong.' },
  { id: 'spr-2', topic: 'spring', level: 'medium', q: 'Vì sao nên dùng constructor injection?',
    points: ['Phụ thuộc tường minh, bắt buộc', 'final -> immutable', 'Test không cần Spring', 'Phát hiện circular dependency sớm'],
    answer: 'Constructor injection nhận mọi phụ thuộc qua hàm dựng, nên phụ thuộc trở nên tường minh và bắt buộc — nhìn constructor là biết class cần gì, và không thể tạo object mà thiếu phụ thuộc. Nó cho phép khai báo field `final` (bất biến, an toàn đa luồng) và test cực dễ: chỉ cần `new MyService(mock)`, không cần khởi động cả Spring. Ngược lại field injection (`@Autowired` thẳng lên field) giấu phụ thuộc, dễ để class phình to lúc nào không hay và khó test hơn.' },
  { id: 'spr-3', topic: 'spring', level: 'medium', q: '@Component, @Service, @Repository, @Controller khác gì nhau?',
    points: ['Đều là @Component (được scan)', '@Repository: dịch exception thành DataAccessException', '@Service/@Controller: ngữ nghĩa tầng'],
    answer: 'Về kỹ thuật cả bốn đều là `@Component` nên đều được component-scan tạo thành bean — khác biệt chủ yếu là NGỮ NGHĨA đánh dấu vai trò từng tầng, giúp code tự mô tả. Riêng `@Repository` (tầng dữ liệu) có thêm giá trị thật: tự dịch exception của JPA/JDBC sang `DataAccessException` thống nhất. `@Service` đánh dấu tầng nghiệp vụ; `@Controller`/`@RestController` là tầng web. Mẹo nhớ: chúng như nhãn dán phòng ban — cùng là "nhân viên" (@Component) nhưng ghi rõ ai làm việc gì.' },
  { id: 'spr-4', topic: 'spring', level: 'medium', q: '@SpringBootApplication gồm những annotation nào?',
    points: ['@Configuration', '@EnableAutoConfiguration', '@ComponentScan'],
    answer: '`@SpringBootApplication` là một annotation "3 trong 1" gộp: `@Configuration` (cho phép khai báo bean bằng `@Bean`), `@EnableAutoConfiguration` (tự động cấu hình dựa trên các thư viện có trong classpath), và `@ComponentScan` (quét và đăng ký bean trong package chứa nó cùng các package con). Chỉ cần đặt nó ở class main là đủ để Spring Boot "tự ráp" gần hết mọi thứ.' },
  { id: 'spr-5', topic: 'spring', level: 'hard', q: 'Bean scope singleton của Spring có thread-safe không?',
    points: ['singleton = 1 instance / ApplicationContext', 'KHÔNG tự thread-safe', 'Phải viết stateless', 'Khác Singleton pattern (1/JVM)'],
    answer: 'Scope `singleton` của Spring nghĩa là một instance duy nhất cho mỗi ApplicationContext (khác Singleton pattern kinh điển là 1 cho cả JVM). Quan trọng: Spring KHÔNG tự làm bean thread-safe — nó chỉ tạo một bản dùng chung. Vì cùng một bean phục vụ đồng thời nhiều request/thread, bạn phải viết bean STATELESS (không giữ field khả biến dùng chung); nếu nhét biến trạng thái vào field thì các request sẽ giẫm lên dữ liệu của nhau.' },
  { id: 'spr-6', topic: 'spring', level: 'hard', q: 'Auto-configuration của Spring Boot hoạt động thế nào?',
    points: ['Dựa classpath', '@ConditionalOnClass / @ConditionalOnMissingBean', 'Override bằng @Bean của mình'],
    answer: 'Auto-configuration hoạt động theo kiểu "thấy gì cấu hình nấy": Spring Boot dò classpath và bật cấu hình có điều kiện — thấy thư viện nào thì tự tạo bean tương ứng (vd có `spring-data-jpa` + driver DB thì tự dựng `DataSource`). Cơ chế nằm ở các annotation như `@ConditionalOnClass` (có class này mới cấu hình) và `@ConditionalOnMissingBean` (chỉ tạo nếu bạn CHƯA tự định nghĩa). Nhờ `@ConditionalOnMissingBean`, khi bạn tự khai một `@Bean` cùng loại thì cái của bạn luôn thắng — auto-config chỉ "lấp chỗ trống".' },
  { id: 'spr-7', topic: 'spring', level: 'hard', q: 'Vì sao @Transactional/@Async không hoạt động khi gọi nội bộ (self-invocation)?',
    points: ['Chạy qua AOP proxy', 'Gọi this.method() bỏ qua proxy', 'Method không được private/final', 'Tách sang bean khác hoặc self-inject'],
    answer: '`@Transactional`/`@Async` hoạt động nhờ Spring bọc bean của bạn trong một PROXY — mọi lời gọi từ ngoài vào đều đi qua proxy này để nó mở transaction/chuyển luồng. Nhưng khi một method trong bean gọi method khác của CHÍNH NÓ bằng `this.method()`, lời gọi đi thẳng, không qua proxy, nên annotation vô tác dụng (như gọi nội bộ trong nhà thì không qua cổng bảo vệ). Cách xử lý: tách method sang bean khác, hoặc tự inject chính mình rồi gọi qua tham chiếu proxy; ngoài ra method phải `public`, không được `private`/`final` để proxy override được.' },
  { id: 'spr-8', topic: 'spring', level: 'medium', q: 'Spring Profile dùng để làm gì?',
    points: ['@Profile("dev") bật bean theo môi trường', 'spring.profiles.active', 'Cấu hình dev/test/prod khác nhau'],
    answer: '`@Profile("dev")` cho phép một bean/cấu hình chỉ được kích hoạt trong môi trường nhất định (dev, test, prod) — như công tắc bật/tắt theo môi trường. Bạn chọn profile đang chạy bằng `spring.profiles.active` trong file cấu hình hoặc biến môi trường. Ví dụ điển hình: profile `dev` dùng DB H2 in-memory cho nhẹ, còn `prod` dùng PostgreSQL thật — cùng một codebase, cấu hình khác nhau tùy nơi deploy.' },

  // ---------- REST & MVC ----------
  { id: 'rest-1', topic: 'rest', level: 'easy', q: '@Controller khác @RestController thế nào?',
    points: ['@RestController = @Controller + @ResponseBody', '@RestController tự serialize JSON', '@Controller trả tên view'],
    answer: '`@Controller` truyền thống trả về TÊN một view (trang Thymeleaf/JSP) để server render HTML. `@RestController` = `@Controller` + `@ResponseBody`: mọi giá trị method trả về được serialize thẳng thành JSON ghi vào response body, không đi tìm view nào — đây là cái dùng cho REST API. Mẹo nhớ: có chữ "Rest" thì trả DỮ LIỆU, không có thì trả TRANG.' },
  { id: 'rest-2', topic: 'rest', level: 'easy', q: '@PathVariable khác @RequestParam thế nào?',
    points: ['@PathVariable: giá trị trong path /users/42', '@RequestParam: query string ?sort=name', 'PathVariable cho định danh tài nguyên'],
    answer: '`@PathVariable` lấy giá trị nằm TRONG đường dẫn, ví dụ `id` trong `/users/{id}` — dùng để xác định CHÍNH tài nguyên nào (danh từ định danh). `@RequestParam` lấy tham số ở query string sau dấu `?`, ví dụ `?page=1&sort=name` — dùng cho những thứ bổ trợ như lọc, phân trang, sắp xếp. Mẹo nhớ: path chỉ "món đồ nào", query mô tả "lấy nó ra sao".' },
  { id: 'rest-3', topic: 'rest', level: 'medium', q: 'Vì sao dùng DTO thay vì trả entity trực tiếp?',
    points: ['Tách API contract khỏi DB', 'Ẩn field nhạy cảm', 'Tránh LazyInitializationException', 'Versioning, validation riêng'],
    answer: 'DTO tạo một lớp trung gian giữa API và entity DB, để "hợp đồng" với client không dính cứng vào cấu trúc bảng. Lợi ích: ẩn field nhạy cảm (password, số dư nội bộ); tránh `LazyInitializationException` khi Jackson lỡ serialize một quan hệ lazy đã đóng session; cho phép versioning và validation riêng cho từng API; và trả đúng dữ liệu cần (giảm over-fetching). Quan trọng nhất: đổi entity DB thì không vô tình làm vỡ API của client.' },
  { id: 'rest-4', topic: 'rest', level: 'medium', q: 'Xử lý validation và exception toàn cục trong REST API thế nào?',
    points: ['@Valid @RequestBody + @NotBlank/@Size...', 'MethodArgumentNotValidException', '@RestControllerAdvice + @ExceptionHandler', 'Trả 400 + body lỗi rõ ràng'],
    answer: 'Đặt `@Valid` trước `@RequestBody` và gắn các ràng buộc như `@NotBlank`/`@Size`/`@Email` lên field của DTO; khi dữ liệu sai, Spring tự ném `MethodArgumentNotValidException`. Thay vì rải try-catch khắp controller, bắt lỗi TẬP TRUNG một chỗ bằng class `@RestControllerAdvice` chứa các `@ExceptionHandler` — nó biến mọi exception thành HTTP status đúng (400, 404, 409...) và một body lỗi thống nhất (chuẩn RFC 7807 `ProblemDetail`). Kết quả: validation khai báo gọn, xử lý lỗi một nơi, response nhất quán.' },
  { id: 'rest-5', topic: 'rest', level: 'medium', q: 'Các HTTP status code hay dùng trong REST và ý nghĩa?',
    points: ['200 OK, 201 Created (+Location)', '204 No Content', '400 Bad Request, 401/403, 404', '409 Conflict, 500'],
    answer: 'Nhóm theo chữ số đầu cho dễ nhớ. 2xx = thành công: 200 OK, 201 Created (kèm header `Location` trỏ tới tài nguyên vừa tạo khi POST), 204 No Content (thường cho DELETE/PUT không trả body). 4xx = lỗi phía CLIENT: 400 dữ liệu sai, 401 chưa đăng nhập (chưa xác thực), 403 đã đăng nhập nhưng không đủ quyền, 404 không tìm thấy, 409 xung đột (vd tạo trùng). 5xx = lỗi phía SERVER (500 lỗi chung). Mẹo phân biệt 401 vs 403: 401 = "bạn là ai?", 403 = "biết bạn rồi nhưng không cho".' },
  { id: 'rest-6', topic: 'rest', level: 'medium', q: 'REST API thiết kế tốt tuân nguyên tắc gì?',
    points: ['Danh từ số nhiều /users', 'Dùng đúng HTTP method', 'Stateless', 'Versioning /api/v1', 'Idempotency của PUT/DELETE'],
    answer: 'Nguyên tắc REST tốt: đặt tên tài nguyên bằng DANH TỪ số nhiều (`/users/{id}`, không phải `/getUser`), để chính HTTP METHOD nói lên hành động (GET đọc, POST tạo, PUT/PATCH sửa, DELETE xóa); giữ stateless (mỗi request tự đủ thông tin, server không nhớ phiên); có versioning (`/api/v1`); hỗ trợ phân trang cho danh sách lớn; và trả đúng status code chuẩn. Ngoài ra GET/PUT/DELETE nên idempotent (gọi lại nhiều lần vẫn an toàn), chỉ POST là không.' },
  { id: 'rest-7', topic: 'rest', level: 'hard', q: 'PUT khác PATCH thế nào? Idempotent là gì?',
    points: ['PUT: thay toàn bộ resource', 'PATCH: cập nhật một phần', 'Idempotent: gọi nhiều lần = một lần', 'PUT idempotent, POST không'],
    answer: 'PUT thay thế TOÀN BỘ tài nguyên — bạn gửi đầy đủ mọi trường, thiếu trường nào coi như đặt lại/xóa trường đó. PATCH chỉ cập nhật PHẦN thay đổi (gửi vài trường cần sửa). Idempotent nghĩa là gọi 1 lần hay 100 lần cùng request đều cho ra cùng trạng thái cuối: PUT (đặt giá trị X → vẫn là X) và DELETE (xóa rồi vẫn là đã xóa) đều idempotent, còn POST thì không (gọi 3 lần dễ tạo 3 bản ghi). Đó là lý do retry POST nguy hiểm hơn.' },

  // ---------- JPA / Hibernate ----------
  { id: 'jpa-1', topic: 'jpa', level: 'hard', q: 'N+1 problem là gì? Cách khắc phục?',
    points: ['1 query lấy N entity + N query lazy = N+1', 'Fix: JOIN FETCH, @EntityGraph, @BatchSize, DTO projection', 'Phát hiện qua show-sql'],
    answer: 'N+1 là cái bẫy hiệu năng: bạn chạy 1 query lấy N entity (vd 100 đơn hàng), rồi vòng lặp truy cập một quan hệ lazy của từng cái (vd `order.getCustomer()`) khiến mỗi cái bắn thêm 1 query — tổng thành 1 + N = 101 query thay vì 1–2. Khắc phục bằng `JOIN FETCH` trong JPQL (nạp kèm 1 lần), `@EntityGraph`, `@BatchSize` (gom nạp theo lô), hoặc DTO projection lấy đúng dữ liệu cần. Phát hiện bằng cách bật `spring.jpa.show-sql=true` rồi giật mình vì thấy hàng loạt query giống hệt nhau.' },
  { id: 'jpa-2', topic: 'jpa', level: 'medium', q: 'Fetch type LAZY và EAGER khác nhau? Mặc định của các quan hệ?',
    points: ['LAZY: nạp khi truy cập', 'EAGER: nạp ngay', '@ManyToOne/@OneToOne = EAGER; @OneToMany/@ManyToMany = LAZY', 'Nên để tất cả LAZY'],
    answer: 'LAZY = "để đó, khi nào cần mới nạp" (chỉ bắn query lúc bạn thực sự truy cập quan hệ đó); EAGER = "nạp ngay lập tức cùng entity cha". Mặc định của JPA: các quan hệ `*-ToOne` (`@ManyToOne`, `@OneToOne`) là EAGER, còn `*-ToMany` (`@OneToMany`, `@ManyToMany`) là LAZY. Thực hành tốt là ép TẤT CẢ về LAZY (`fetch = FetchType.LAZY`) để không nạp thừa, rồi màn hình nào cần dữ liệu liên quan thì chủ động `JOIN FETCH` đúng chỗ đó — kiểm soát được, tránh cả N+1 lẫn nạp cả cây dữ liệu.' },
  { id: 'jpa-3', topic: 'jpa', level: 'hard', q: 'Owning side và inverse side trong quan hệ hai chiều?',
    points: ['Owning giữ FK, có @JoinColumn', 'Inverse dùng mappedBy', 'Hibernate persist theo owning side', 'Phải đồng bộ 2 phía'],
    answer: 'Trong quan hệ hai chiều, owning side (phía "chủ") là phía giữ KHÓA NGOẠI trong bảng — có `@JoinColumn`, thường là phía `@ManyToOne`. Inverse side (phía "phụ") dùng `mappedBy` để trỏ ngược về owning. Điểm cốt lõi: Hibernate CHỈ nhìn owning side khi quyết định lưu/cập nhật quan hệ vào DB, nên nếu chỉ set phía inverse thì quan hệ không được lưu. Vì vậy với bidirectional phải đồng bộ cả hai đầu, thường bằng helper method kiểu `addChild()` set cả hai chiều một lượt để khỏi quên.' },
  { id: 'jpa-4', topic: 'jpa', level: 'medium', q: 'CascadeType.REMOVE khác orphanRemoval=true thế nào?',
    points: ['REMOVE: xóa child khi parent bị xóa', 'orphanRemoval: xóa child khi tách khỏi collection', 'orphanRemoval mạnh hơn'],
    answer: '`CascadeType.REMOVE` xóa các child chỉ khi chính PARENT bị xóa (xóa hóa đơn thì xóa luôn các dòng của nó). `orphanRemoval = true` mạnh hơn: nó còn xóa một child ngay khi child đó bị GỠ khỏi collection của parent — tức đứa con "mồ côi", không còn ai tham chiếu, sẽ bị dọn dù parent vẫn sống. Cẩn thận dùng cascade REMOVE với `@ManyToMany` vì entity ở đó thường được nhiều bên dùng chung, xóa cascade dễ xóa nhầm dữ liệu của người khác.' },
  { id: 'jpa-5', topic: 'jpa', level: 'medium', q: 'JPQL, native query và Criteria/Specification — khi nào dùng?',
    points: ['Derived query: điều kiện đơn giản', 'JPQL: join phức tạp, portable', 'Native: SQL đặc thù DB, performance', 'Specification: query động type-safe'],
    answer: 'Chọn theo độ phức tạp và tính linh động. Derived query (đặt tên method như `findByEmail`) — nhanh gọn cho điều kiện đơn giản. JPQL qua `@Query` — cho join/subquery phức tạp mà vẫn viết theo entity nên portable giữa các DB. Native query — khi cần tính năng SQL đặc thù của một DB hoặc phải tối ưu hiệu năng tay. Specification/Criteria API — khi truy vấn ĐỘNG, số điều kiện thay đổi tùy input người dùng (màn hình lọc nhiều tiêu chí tùy chọn), vì ghép chúng bằng nối chuỗi thì rối và dễ SQL injection.' },
  { id: 'jpa-6', topic: 'jpa', level: 'hard', q: 'Persistence context và dirty checking là gì?',
    points: ['Persistence context = cache cấp 1', 'Entity managed được theo dõi', 'Dirty checking: tự UPDATE khi field đổi lúc flush/commit'],
    answer: 'Persistence context là "vùng làm việc" (cache cấp 1) giữ mọi entity đang được quản lý trong phạm vi một transaction/session — trong đó mỗi entity là duy nhất theo id. Dirty checking là phép màu đi kèm: khi entity được nạp, Hibernate chụp lại ảnh trạng thái ban đầu; đến lúc flush/commit nó so sánh và TỰ sinh câu `UPDATE` cho những field đã đổi — bạn chỉ cần sửa thuộc tính object, KHÔNG cần gọi `save()` thủ công. Đây là lý do nhiều người ngạc nhiên "sao không gọi save mà DB vẫn đổi".' },
  { id: 'jpa-7', topic: 'jpa', level: 'medium', q: 'save() / persist() / merge() khác nhau thế nào?',
    points: ['persist: entity mới (transient)', 'merge: entity detached -> copy vào context', 'save (Spring Data) = persist hoặc merge tùy id'],
    answer: '`persist` dùng cho entity MỚI (transient, chưa có trong DB) — gắn nó vào persistence context để được INSERT. `merge` dùng cho entity DETACHED (đã từng ở DB nhưng nay ngoài context, vd nhận từ request): nó COPY trạng thái vào một instance managed rồi trả về instance đó — lưu ý object bạn truyền vào KHÔNG trở thành managed, phải dùng object trả về. Spring Data `save()` gộp cả hai: entity chưa có id (mới) thì gọi `persist`, có id rồi thì gọi `merge`.' },

  // ---------- Transaction ----------
  { id: 'tx-1', topic: 'transaction', level: 'medium', q: '@Transactional hoạt động thế nào? Rollback khi nào?',
    points: ['AOP proxy mở/commit/rollback transaction', 'Mặc định rollback trên RuntimeException/Error', 'Checked exception KHÔNG rollback (trừ khi khai báo)'],
    answer: '`@Transactional` cho một proxy bọc quanh method: mở transaction trước khi vào, commit khi ra êm, rollback khi có lỗi văng ra. Cạm bẫy hay bị hỏi: MẶC ĐỊNH Spring chỉ rollback với exception UNCHECKED (`RuntimeException`/`Error`); còn CHECKED exception (như `IOException`) thì nó vẫn COMMIT bình thường trừ khi bạn khai báo rõ `@Transactional(rollbackFor = Exception.class)`. Nhiều người tưởng cứ ném exception là rollback — không phải vậy.' },
  { id: 'tx-2', topic: 'transaction', level: 'hard', q: 'Các mức propagation hay dùng (REQUIRED, REQUIRES_NEW)?',
    points: ['REQUIRED (mặc định): dùng tx hiện có hoặc tạo mới', 'REQUIRES_NEW: luôn tạo tx mới, tạm dừng tx ngoài', 'NESTED: savepoint'],
    answer: 'Propagation quyết định method sẽ dùng transaction nào. `REQUIRED` (mặc định): có transaction đang chạy thì THAM GIA vào, chưa có thì tạo mới — nên nó "cùng chìm cùng nổi" với transaction cha. `REQUIRES_NEW`: LUÔN mở một transaction mới độc lập và tạm treo cái đang chạy — hợp cho việc phải commit riêng dù nghiệp vụ chính rollback, như ghi log/audit. `NESTED`: tạo một savepoint bên trong transaction cha, rollback được về savepoint mà không hủy cả cha.' },
  { id: 'tx-3', topic: 'transaction', level: 'hard', q: 'Isolation level và các anomaly (dirty/non-repeatable/phantom read)?',
    points: ['READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE', 'Dirty read: đọc dữ liệu chưa commit', 'Non-repeatable: đọc lại khác', 'Phantom: thêm dòng mới'],
    answer: 'Isolation level kiểm soát một transaction "nhìn thấy" dữ liệu dang dở của transaction khác tới mức nào — càng cao càng sạch nhưng khóa nhiều hơn, chậm hơn. Thang tăng dần: READ_COMMITTED chặn dirty read (đọc phải dữ liệu chưa commit của người khác); REPEATABLE_READ chặn thêm non-repeatable read (đọc lại cùng một dòng ra giá trị khác vì bị người khác sửa giữa chừng); SERIALIZABLE chặn nốt phantom read (đọc lại một khoảng thì bị "mọc" thêm dòng mới) nhưng chậm nhất. Mẹo nhớ 3 anomaly: dirty = đọc bẩn (chưa commit), non-repeatable = 1 dòng ĐỔI giá trị, phantom = THÊM/BỚT dòng.' },
  { id: 'tx-4', topic: 'transaction', level: 'medium', q: 'Vì sao nên đặt @Transactional(readOnly = true) cho method chỉ đọc?',
    points: ['Bỏ dirty checking', 'Tối ưu flush', 'Gợi ý DB/driver dùng read replica'],
    answer: '`@Transactional(readOnly = true)` báo cho Hibernate rằng method chỉ ĐỌC, nên nó bỏ qua dirty checking và không cần chụp snapshot để so sánh khi flush — tiết kiệm bộ nhớ và CPU, nhất là khi nạp nhiều entity. Ngoài ra một số hạ tầng dựa vào cờ này để ĐỊNH TUYẾN query sang read replica, giảm tải cho DB master. Cứ method nào chỉ truy vấn (không insert/update/delete) thì nên gắn — vừa nhanh hơn vừa nói rõ ý định.' },
  { id: 'tx-5', topic: 'transaction', level: 'hard', q: 'Method có @Transactional nhưng bắt (catch) exception rồi không throw lại — có rollback không?',
    points: ['KHÔNG — proxy chỉ rollback khi exception THOÁT khỏi method', 'catch rồi nuốt lỗi = coi như thành công, transaction commit bình thường', 'Fix: throw lại (hoặc rethrow kiểu khác), hoặc tự gọi setRollbackOnly()'],
    answer: 'Không rollback. `@Transactional` chạy qua AOP proxy, mà proxy chỉ "nhìn thấy" exception khi nó VĂNG RA NGOÀI method được bọc — giống bảo vệ ở cổng chỉ biết có sự cố khi bạn chạy ra ngoài kêu cứu. Nếu bên trong bạn `catch` rồi nuốt lỗi (log xong thôi, không throw lại), proxy tưởng method chạy ngon và vẫn COMMIT — dù dữ liệu đã lỡ dang dở (half-done). Cách khắc phục: throw lại exception (nguyên bản hoặc bọc kiểu khác) để nó thoát ra, hoặc chủ động gọi `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()` ngay trong catch để đánh dấu "phải rollback".' },
  { id: 'tx-6', topic: 'transaction', level: 'medium', q: 'Transaction timeout dùng để làm gì?',
    points: ['@Transactional(timeout = giây): giới hạn thời gian tối đa transaction được chạy', 'Quá hạn → tự rollback, ném TransactionTimedOutException', 'Chống transaction/query treo giữ khóa quá lâu, ảnh hưởng request khác'],
    answer: '`@Transactional(timeout = n)` đặt giới hạn số GIÂY tối đa một transaction được phép chạy; quá hạn Spring tự rollback và ném `TransactionTimedOutException`. Nó như cái "hẹn giờ ngắt" để chống một transaction bị treo (query chậm, chờ deadlock, lỗi logic vòng lặp) ôm khóa và connection quá lâu. Vì khóa/connection là tài nguyên chung, một transaction treo có thể làm hàng loạt request khác đang chờ cùng tài nguyên bị dồn ứ — timeout cắt sớm để bảo vệ phần còn lại của hệ thống.' },

  // ---------- Testing ----------
  { id: 'test-1', topic: 'testing', level: 'easy', q: 'Cấu trúc một unit test tốt (AAA) là gì?',
    points: ['Arrange - Act - Assert', 'Test 1 hành vi', 'Tên mô tả should_X_when_Y', 'Nhanh, độc lập, deterministic'],
    answer: 'Nghĩ theo 3 nhịp Arrange-Act-Assert như một cảnh phim: Arrange dựng bối cảnh (chuẩn bị dữ liệu, mock), Act diễn đúng MỘT hành động cần test, Assert kiểm tra kết cục có đúng như mong đợi. Mỗi test chỉ soi 1 hành vi để khi nó đỏ là biết ngay hỏng ở đâu; đặt tên kiểu should_return_x_when_y để đọc tên là hiểu ý; và phải nhanh, độc lập, deterministic (chạy 100 lần vẫn ra một kết quả).' },
  { id: 'test-2', topic: 'testing', level: 'medium', q: '@Mock và @InjectMocks khác nhau thế nào?',
    points: ['@Mock: tạo mock cho phụ thuộc', '@InjectMocks: tạo object cần test, tiêm mock vào', '@ExtendWith(MockitoExtension.class)'],
    answer: 'Hình dung class đang test là một cỗ máy, còn phụ thuộc là các linh kiện. @Mock tạo linh kiện GIẢ (điều khiển được), @InjectMocks lắp cỗ máy thật rồi CẮM các @Mock đó vào (qua constructor hoặc field). Nhờ vậy ta test riêng logic của cỗ máy mà không đụng tới linh kiện thật (DB, API). Nhớ thêm @ExtendWith(MockitoExtension.class) thì Mockito mới đứng ra khởi tạo giúp.' },
  { id: 'test-3', topic: 'testing', level: 'medium', q: 'when().thenReturn() khác verify() thế nào?',
    points: ['when().thenReturn(): stub, định nghĩa giá trị trả về', 'verify(): kiểm tra method được gọi (mấy lần, tham số gì)', 'Stub cho input, verify cho side-effect'],
    answer: 'Phân biệt bằng hướng của mũi tên: when(mock.m()).thenReturn(x) là stub, dặn TRƯỚC cho mock "nếu bị gọi thì trả về x" — dựng đầu VÀO cho code. Còn verify(mock).m(arg) soi lại SAU khi chạy: method đó có thực sự được gọi không, mấy lần, với tham số gì — kiểm đầu RA / side-effect (như có gọi save/sendEmail đúng không). Mẹo: stub cho input, verify cho hành động đã xảy ra.' },
  { id: 'test-4', topic: 'testing', level: 'hard', q: '@WebMvcTest, @DataJpaTest, @SpringBootTest dùng khi nào?',
    points: ['@WebMvcTest: tầng web + MockMvc, mock service', '@DataJpaTest: tầng JPA + H2', '@SpringBootTest: full context, integration'],
    answer: 'Ba annotation này khác nhau ở việc nạp BAO NHIÊU của ứng dụng — càng nạp ít thì test càng nhanh và gọn. @WebMvcTest chỉ bật tầng web (controller + MockMvc, service thì mock) để test riêng controller. @DataJpaTest chỉ bật tầng JPA với H2 in-memory để test repository/câu query. @SpringBootTest bật NGUYÊN cả context cho integration test end-to-end — thật nhất nhưng nặng và chậm nhất, nên chỉ dùng khi cần kiểm cả luồng ráp lại.' },
  { id: 'test-5', topic: 'testing', level: 'medium', q: 'Mock, Stub và Spy khác nhau thế nào?',
    points: ['Stub: trả giá trị cố định', 'Mock: verify tương tác', 'Spy: object thật, override một phần', 'doReturn().when(spy) để tránh gọi thật'],
    answer: 'Cả ba đều là "đóng thế" nhưng vai khác nhau: Stub là diễn viên đọc thoại có sẵn — trả giá trị định trước cho câu hỏi (query). Mock là giám sát viên — ta dùng nó để verify xem có được gọi đúng cách không. Spy là bản sao của object THẬT: mặc định vẫn chạy code thật, chỉ ghi đè một phần method ta muốn. Với spy nhớ dùng doReturn().when(spy).m() thay cho when() để khỏi lỡ chạy method thật khi đang stub.' },
  { id: 'test-6', topic: 'testing', level: 'easy', q: 'Test pyramid là gì? Vì sao nên viết nhiều unit test hơn integration/E2E?',
    points: ['Đáy: unit test (nhiều, nhanh, rẻ)', 'Giữa: integration test', 'Đỉnh: E2E test (ít, chậm, đắt, dễ vỡ)', 'Unit test cô lập lỗi nhanh, chạy trong CI mỗi commit'],
    answer: 'Test pyramid là hình chóp: đáy rộng là RẤT NHIỀU unit test (nhanh, rẻ, soi từng đơn vị), giữa là ít integration test (kiểm nhiều lớp ráp với nhau), đỉnh nhọn là RẤT ÍT E2E (chậm, đắt, dễ vỡ vì phụ thuộc môi trường thật). Ta xây nhiều ở đáy vì unit test chạy được mỗi commit và khi đỏ là chỉ đúng chỗ hỏng; càng lên đỉnh test càng đắt và mơ hồ, nên E2E chỉ dành cho vài luồng sống-còn. Lộn ngược tháp (nhiều E2E, ít unit) là dấu hiệu bộ test chậm và khó bảo trì.' },
  { id: 'test-7', topic: 'testing', level: 'medium', q: '@ParameterizedTest dùng để làm gì?',
    points: ['Chạy CÙNG một test với nhiều bộ input khác nhau', '@ValueSource, @CsvSource, @MethodSource cấp dữ liệu', 'Tránh copy-paste nhiều test method giống hệt nhau chỉ khác input'],
    answer: '@ParameterizedTest (JUnit 5) cho ta viết MỘT test rồi chạy lại nó với nhiều bộ dữ liệu khác nhau — giống một khuôn bánh dập ra nhiều cái. Dữ liệu bơm vào qua @ValueSource (một giá trị đơn), @CsvSource (nhiều tham số/kèm kết quả kỳ vọng) hoặc @MethodSource (dữ liệu phức tạp sinh từ method riêng). Nhờ vậy khỏi phải copy-paste chục test gần như y hệt chỉ khác input/expected, và muốn thêm ca kiểm chỉ cần thêm một dòng dữ liệu.' },
  { id: 'test-8', topic: 'testing', level: 'hard', q: 'Test coverage cao (vd 90%) có đảm bảo code ít bug không?',
    points: ['Coverage chỉ đo DÒNG/NHÁNH được chạy qua, không đo có assert đúng hay không', 'Có thể 100% coverage mà test không assert gì (false sense of security)', 'Coverage là chỉ báo hữu ích, không phải mục tiêu tự thân'],
    answer: 'Không. Coverage chỉ đo dòng/nhánh code có được CHẠY QUA khi test hay không — như điểm danh xem có ai đi ngang, chứ không hỏi họ có làm đúng việc không. Một test gọi hàm rồi bỏ đó, chẳng assert gì, vẫn kéo coverage lên 100% mà không bắt được lỗi nào — đó là cảm giác an toàn giả. Vậy nên coverage cao là tín hiệu tốt để tham khảo, không phải bảo chứng chất lượng: cái cần là test có assert đúng kết quả mong đợi và phủ được edge case, chứ không chỉ đi qua dòng code.' },

  // ---------- Security & JWT ----------
  { id: 'sec-1', topic: 'security', level: 'easy', q: 'Authentication khác Authorization thế nào?',
    points: ['Authn: bạn là ai (đăng nhập)', 'Authz: bạn được làm gì (quyền)', 'Authn trước, authz sau'],
    answer: 'Ví như vào tòa nhà: Authentication là bước gác cổng kiểm chứng minh thư xem "bạn LÀ AI" (qua mật khẩu/token). Authorization là bước xét thẻ xem "bạn ĐƯỢC vào phòng nào, làm gì" (theo role/permission). Thứ tự luôn là xác thực trước, phân quyền sau — chưa biết bạn là ai thì không thể xét bạn được làm gì.' },
  { id: 'sec-2', topic: 'security', level: 'medium', q: 'JWT gồm những phần nào? Có được mã hóa không?',
    points: ['header.payload.signature (Base64URL)', 'KHÔNG mã hóa — chỉ encode', 'Signature chống sửa (tamper)', 'Không để dữ liệu nhạy cảm'],
    answer: 'JWT có 3 phần header.payload.signature nối bằng dấu chấm, đều là Base64URL. Điểm dễ nhầm: Base64URL chỉ là ENCODE (đổi cách viết), KHÔNG phải mã hóa — bất kỳ ai cũng dán token vào jwt.io là đọc được payload. Signature không giấu nội dung, nó chỉ như con dấu niêm phong: sửa payload là dấu vỡ, server phát hiện ngay. Vì payload phơi bày như vậy, tuyệt đối đừng nhét dữ liệu nhạy cảm (mật khẩu, thông tin cá nhân/PII) vào đó.' },
  { id: 'sec-3', topic: 'security', level: 'hard', q: 'Vì sao dùng JWT stateless thay session? Nhược điểm?',
    points: ['Server không lưu state -> scale ngang dễ', 'Token tự chứa, verify bằng signature', 'Nhược: khó thu hồi -> short expiry + refresh token'],
    answer: 'JWT stateless nghĩa là mọi thứ cần biết đã nằm sẵn TRONG token, server chỉ cần verify signature chứ không phải tra session lưu ở đâu đó — giống vé đã in đủ thông tin, soát vé không cần gọi về tổng đài. Nhờ vậy nhân bao nhiêu server cũng được, không cần shared session store, rất hợp scale ngang. Cái giá phải trả: đã phát token thì khó thu hồi sớm (server không giữ nên không xé được), nên bù bằng thời hạn ngắn + refresh token, và khi cần chặn gấp thì thêm blacklist.' },
  { id: 'sec-4', topic: 'security', level: 'medium', q: 'Vì sao lưu mật khẩu bằng BCrypt? Vì sao cần salt và cố tình chậm?',
    points: ['Hash một chiều + salt tự động', 'Salt chống rainbow table', 'Chậm (cost factor) chống brute-force', '2 user cùng pass -> khác hash'],
    answer: 'BCrypt băm MỘT CHIỀU nên lộ DB cũng không lần ngược ra mật khẩu gốc. Salt là một chuỗi ngẫu nhiên trộn vào rồi nhúng luôn trong hash, khiến hai người cùng mật khẩu vẫn ra hash khác nhau — vô hiệu hóa rainbow table (bảng tra hash dựng sẵn). Và nó CỐ TÌNH chậm, chỉnh qua cost factor: chậm một chút với 1 lần đăng nhập thì không sao, nhưng kẻ brute-force phải thử hàng tỷ lần thì trở nên tốn kém bất khả thi. Kiểm tra bằng matches(raw, hashed) chứ không so sánh chuỗi trực tiếp.' },
  { id: 'sec-5', topic: 'security', level: 'hard', q: 'Spring Security xử lý request qua đâu? Role và Authority khác gì?',
    points: ['SecurityFilterChain (chuỗi filter)', 'JwtAuthenticationFilter extends OncePerRequestFilter', 'Role có prefix ROLE_, hasRole tự thêm', 'Authority mịn hơn'],
    answer: 'Mỗi request đi qua SecurityFilterChain — một dây chuyền các filter như các trạm kiểm soát nối tiếp. Ở trạm xử lý JWT (một filter kế thừa OncePerRequestFilter, chạy đúng 1 lần mỗi request), token được đọc và đặt Authentication vào SecurityContext để các bước sau biết "ai đang gọi". Về quyền: Authority là quyền hạt mịn (vd READ_REPORT), còn Role chỉ là một Authority quy ước có prefix ROLE_ (ROLE_ADMIN) — hasRole("ADMIN") tự chèn thêm ROLE_ giúp bạn, còn hasAuthority(...) thì bạn phải ghi đủ chuỗi.' },

  // ---------- SQL & Database ----------
  { id: 'sql-1', topic: 'sql', level: 'easy', q: 'INNER JOIN khác LEFT JOIN thế nào?',
    points: ['INNER: chỉ dòng khớp cả hai bảng', 'LEFT: giữ hết bảng trái, phải null nếu không khớp', 'RIGHT/FULL tương tự'],
    answer: 'INNER JOIN chỉ giữ dòng khớp ở CẢ HAI bảng — như phần giao nhau của hai vòng tròn. LEFT JOIN giữ TRỌN bảng trái, dòng nào bên trái không tìm được cặp bên phải thì các cột phải là NULL (hữu ích để tìm "đơn nhưng chưa có thanh toán"). RIGHT JOIN chỉ là hình phản chiếu của LEFT (giữ trọn bảng phải), còn FULL OUTER giữ hết cả hai bên, thiếu đâu NULL đó.' },
  { id: 'sql-2', topic: 'sql', level: 'medium', q: 'Index giúp gì? Đánh đổi khi tạo index?',
    points: ['Tăng tốc SELECT/WHERE/JOIN', 'B-tree, tìm O(log n)', 'Đánh đổi: chậm INSERT/UPDATE, tốn dung lượng'],
    answer: 'Index (thường là B-tree) đóng vai như MỤC LỤC của cuốn sách: thay vì đọc lướt cả cuốn (quét toàn bảng), DB nhảy thẳng tới trang cần tìm, nên WHERE/JOIN/ORDER BY nhanh hẳn. Nhưng mục lục không miễn phí: mỗi lần INSERT/UPDATE/DELETE phải cập nhật lại index nên GHI chậm hơn và tốn thêm dung lượng. Quy tắc: chỉ đánh index cho cột hay dùng để lọc/join, đừng index bừa mọi cột.' },
  { id: 'sql-3', topic: 'sql', level: 'medium', q: 'ACID là gì?',
    points: ['Atomicity: tất cả hoặc không', 'Consistency: giữ ràng buộc', 'Isolation: transaction độc lập', 'Durability: commit là bền'],
    answer: 'ACID là 4 lời hứa của transaction, nhớ qua ví dụ chuyển tiền A sang B. Atomicity: trọn gói hoặc không gì cả — không có chuyện trừ tiền A mà quên cộng cho B. Consistency: xong vẫn hợp lệ mọi ràng buộc (tổng số dư không tự sinh/mất). Isolation: nhiều giao dịch chạy song song mà không giẫm lên nhau, như thể xếp hàng lần lượt. Durability: đã commit là ghi bền, mất điện bật lại vẫn còn.' },
  { id: 'sql-4', topic: 'sql', level: 'medium', q: 'WHERE khác HAVING thế nào?',
    points: ['WHERE lọc dòng trước khi group', 'HAVING lọc nhóm sau GROUP BY', 'HAVING dùng được hàm tổng hợp'],
    answer: 'Khác nhau ở THỜI ĐIỂM lọc so với bước GROUP BY. WHERE chạy TRƯỚC khi gom nhóm nên nó soi từng dòng thô và không dùng được hàm tổng hợp. HAVING chạy SAU khi đã gom nhóm nên lọc trên kết quả tổng hợp của từng nhóm (vd HAVING COUNT(*) > 5 để giữ nhóm có trên 5 dòng). Mẹo nhớ: WHERE lọc nguyên liệu, HAVING lọc thành phẩm.' },
  { id: 'sql-5', topic: 'sql', level: 'hard', q: 'Optimistic lock và pessimistic lock khác nhau thế nào?',
    points: ['Optimistic: @Version, kiểm tra khi commit', 'Pessimistic: khóa dòng ngay (SELECT FOR UPDATE)', 'Optimistic hợp ít xung đột'],
    answer: 'Khác nhau ở thái độ với xung đột. Optimistic (lạc quan) tin "chắc ít ai đụng cùng lúc" nên KHÔNG khóa: nó gắn cột @Version, tới lúc update mới kiểm — nếu version đã bị người khác đổi thì ném OptimisticLockException để ta thử lại. Pessimistic (bi quan) tin "kiểu gì cũng tranh nhau" nên KHÓA dòng ngay khi đọc (SELECT ... FOR UPDATE), ai tới sau phải chờ. Ít xung đột thì chọn optimistic cho throughput cao (không ai phải chờ); tranh chấp gay gắt thì pessimistic an toàn hơn dù chậm.' },

  // ---------- SOLID & Patterns ----------
  { id: 'sol-1', topic: 'solid', level: 'medium', q: 'SOLID là gì? Giải thích ngắn từng nguyên tắc.',
    points: ['S: một lý do để đổi', 'O: mở để mở rộng, đóng để sửa', 'L: con thay được cha', 'I: interface nhỏ', 'D: phụ thuộc abstraction'],
    answer: 'Năm chữ cái S-O-L-I-D là năm nguyên tắc giúp code dễ sửa, dễ mở rộng: Single Responsibility (mỗi class chỉ có MỘT lý do để đổi), Open/Closed (mở để thêm tính năng mới, đóng với việc sửa code cũ đang chạy), Liskov (lớp con phải thay được lớp cha mà không làm hỏng chương trình), Interface Segregation (chia interface nhỏ chuyên biệt thay vì một interface khổng lồ), Dependency Inversion (phụ thuộc vào abstraction chứ không vào implementation cụ thể). Chung một tinh thần: giảm phụ thuộc cứng để sửa một chỗ không kéo sập chỗ khác.' },
  { id: 'sol-2', topic: 'solid', level: 'hard', q: 'Ví dụ vi phạm Liskov Substitution?',
    points: ['Square extends Rectangle', 'setWidth/setHeight phá vỡ invariant', 'Lớp con thu hẹp hành vi cha'],
    answer: 'Ví dụ kinh điển: Square extends Rectangle. Trực giác toán học bảo hình vuông LÀ hình chữ nhật, nhưng trong code thì không: gọi setWidth rồi setHeight, Square âm thầm đổi luôn cạnh kia, phá vỡ kỳ vọng `area = w×h` của Rectangle. Nói cách khác, lớp con vi phạm Liskov khi làm sai hợp đồng của cha — ném exception ngoài dự kiến, thu hẹp input hay đổi hành vi khiến code đang dùng cha bỗng chạy sai.' },
  { id: 'sol-3', topic: 'solid', level: 'medium', q: 'Bạn hay dùng design pattern nào? Cho ví dụ trong Spring.',
    points: ['Singleton (Spring bean)', 'Factory / Builder', 'Strategy (thay if-else)', 'Proxy (AOP, @Transactional)', 'Template Method (JdbcTemplate)'],
    answer: 'Điểm hay là Spring đã dùng đầy pattern nên rất dễ lấy ví dụ thật: Singleton (mỗi bean mặc định chỉ có một thể hiện dùng chung), Factory/Builder (dựng object phức tạp gọn gàng, như Lombok @Builder), Strategy (tiêm nhiều implementation của cùng một interface để thay chuỗi if-else bằng đa hình), Proxy (Spring AOP bọc bean để lo @Transactional, cache, security mà không sửa code gốc), và Template Method (JdbcTemplate/RestTemplate lo phần khung lặp đi lặp lại, ta chỉ điền phần riêng).' },
  { id: 'sol-4', topic: 'solid', level: 'hard', q: 'Cách hiện thực Singleton thread-safe trong Java?',
    points: ['enum Singleton (đơn giản, an toàn)', 'Double-checked locking + volatile', 'Bill Pugh (static holder)'],
    answer: 'Gọn và an toàn nhất là dùng enum — JVM đảm bảo enum chỉ khởi tạo một lần, miễn nhiễm cả với reflection lẫn serialization. Nếu cần lazy (chỉ tạo khi dùng) thì Bill Pugh là đẹp nhất: đặt instance trong một static inner holder, JVM chỉ nạp class holder ở lần gọi đầu tiên nên vừa lười vừa thread-safe mà không cần khóa. Cách thủ công hơn là double-checked locking với biến `volatile` (volatile để tránh việc thấy object nửa vời khi đang khởi tạo). Tránh Singleton naive không đồng bộ vì hai thread có thể cùng tạo ra hai instance.' },
  { id: 'sol-5', topic: 'solid', level: 'medium', q: 'Dependency Inversion khác Dependency Injection thế nào?',
    points: ['DIP: nguyên tắc — phụ thuộc abstraction (WHY)', 'DI: kỹ thuật — tiêm phụ thuộc (HOW)', 'DI là một cách đạt DIP'],
    answer: 'Hai thứ dễ lẫn vì cùng viết tắt DI nhưng ở hai tầng khác nhau. Dependency Inversion Principle là NGUYÊN TẮC (cái WHY): module cấp cao và cấp thấp đừng phụ thuộc trực tiếp vào nhau mà cùng phụ thuộc vào abstraction (interface). Dependency Injection là KỸ THUẬT (cái HOW): thay vì để class tự `new` phụ thuộc bên trong, ta tiêm nó từ bên ngoài vào (qua constructor, setter). Nói ngắn: DI là một trong những cách phổ biến nhất để hiện thực DIP.' },
  { id: 'sol-6', topic: 'solid', level: 'medium', q: 'Ví dụ vi phạm Open/Closed Principle và cách sửa?',
    points: ['Vi phạm: if-else/switch theo type, phải sửa code cũ mỗi khi thêm loại mới', 'Sửa: trừu tượng hóa hành vi khác nhau ra interface, mỗi loại implement riêng (Strategy)', 'Thêm loại mới = thêm class mới, không sửa code đang chạy'],
    answer: 'Dấu hiệu vi phạm dễ thấy nhất là một chuỗi if-else/switch theo type: method tính phí ship với `if (type == "STANDARD") ... else if (type == "EXPRESS") ...`. Mỗi lần thêm một loại vận chuyển mới lại phải mở đúng method này ra sửa, mà đụng vào code đang chạy là có rủi ro làm hỏng cái đang đúng. Cách sửa là đẩy phần hành vi khác nhau ra sau một interface `ShippingStrategy`, mỗi loại một class implement riêng — từ đó thêm loại mới chỉ là thêm một class mới, không phải sờ vào code cũ. Đó chính là tinh thần "mở để mở rộng, đóng với việc sửa".' },
  { id: 'sol-7', topic: 'solid', level: 'medium', q: 'Interface Segregation Principle (ISP) là gì? Ví dụ vi phạm?',
    points: ['Không ép class implement method nó không dùng tới', 'Vi phạm: interface "phình to" (Worker có cả work() và eat())', 'Sửa: tách thành nhiều interface nhỏ, chuyên biệt'],
    answer: 'ISP nói: đừng ép một class phải implement những method nó chẳng dùng tới; thà nhiều interface nhỏ còn hơn một interface "phình to". Ví dụ vi phạm: `interface Worker { void work(); void eat(); }` — một Robot buộc phải implement Worker sẽ phải viết `eat()` dù robot không ăn (thường đành để trống hoặc ném exception, rất gượng). Sửa bằng cách tách ra `Workable` và `Eatable` riêng; con người implement cả hai, robot chỉ implement `Workable`. Lợi ích thực sự: sau này đổi phần "ăn" không kéo theo phải sửa những class chỉ quan tâm tới "làm việc".' },
  { id: 'sol-8', topic: 'solid', level: 'hard', q: 'Decorator pattern là gì? Khác Inheritance ở điểm nào?',
    points: ['Bọc object gốc, thêm hành vi mà không sửa class gốc', 'Nhiều decorator ghép được với nhau linh hoạt lúc runtime', 'Khác kế thừa: kế thừa cố định lúc compile, decorator đổi được lúc runtime'],
    answer: 'Decorator giống như mặc thêm áo khoác: lấy một object gốc rồi bọc nó bằng một object khác CÙNG interface để cộng thêm hành vi, mà không phải sửa class gốc. Ví dụ quen thuộc là java.io: `new BufferedInputStream(new FileInputStream(f))` — lớp buffer bọc ngoài lớp đọc file. Khác kế thừa ở chỗ: kế thừa cố định hành vi ngay lúc biên dịch và mỗi tổ hợp tính năng lại đẻ ra một subclass (dễ bùng nổ số lượng class), còn decorator cho phép ghép/tháo/xếp chồng linh hoạt lúc runtime — muốn thêm nén, mã hóa hay đệm thì cứ bọc thêm một lớp.' },

  // ---------- JVM & Memory ----------
  { id: 'jvm-1', topic: 'jvm', level: 'medium', q: 'Heap và Stack khác nhau thế nào?',
    points: ['Heap: object, chia sẻ mọi thread, GC dọn', 'Stack: biến local & call frame, riêng mỗi thread', 'StackOverflow vs OutOfMemory'],
    answer: 'Hình dung Heap là một nhà kho lớn dùng chung cho mọi thread: mọi object (`new`) nằm ở đây, sống tới khi không ai tham chiếu thì GC dọn; kho đầy mà vẫn cố nhét thì `OutOfMemoryError`. Stack là chồng đĩa riêng của từng thread: mỗi lần gọi hàm đặt thêm một "đĩa" (frame) chứa biến local, hàm return thì gỡ đĩa đó ra ngay nên rất nhanh và tự dọn. Đệ quy quá sâu chồng đĩa cao quá thì `StackOverflowError`.' },
  { id: 'jvm-2', topic: 'jvm', level: 'medium', q: 'Garbage Collection hoạt động dựa trên nguyên tắc gì?',
    points: ['Dọn object không còn tham chiếu reachable', 'Chia young/old generation', 'Minor GC (young) vs Major/Full GC', 'G1 mặc định từ Java 9'],
    answer: 'Nguyên tắc lõi là "reachability": bắt đầu từ các GC roots (biến trên stack, biến static...) đi theo tham chiếu; object nào không lần tới được thì coi như rác và bị thu hồi — vì không đếm reference nên hai object trỏ vòng lẫn nhau vẫn dọn được. Để nhanh, GC dựa trên nhận xét thực tế "phần lớn object chết yểu": object mới nằm ở young gen và bị Minor GC quét thường xuyên (nhanh), số ít sống sót lâu mới được thăng lên old gen (Major/Full GC tốn kém hơn). Từ Java 9, G1 là collector mặc định.' },
  { id: 'jvm-3', topic: 'jvm', level: 'hard', q: 'Memory leak trong Java xảy ra thế nào dù đã có GC?',
    points: ['Giữ tham chiếu không cần', 'static collection phình', 'ThreadLocal quên remove', 'Listener/cache không gỡ'],
    answer: 'Mấu chốt: GC chỉ dọn thứ không ai tham chiếu, nên leak trong Java không phải "quên free" mà là vô tình GIỮ tham chiếu tới thứ đã hết dùng — object vẫn reachable nên GC đành chừa lại. Các thủ phạm kinh điển: `static` collection cứ thêm mà không xóa nên phình mãi; `ThreadLocal` quên `remove()` trong thread pool (thread sống dai nên giá trị bám theo); listener/callback đăng ký mà không hủy; cache không giới hạn kích thước. Cứ để lâu, bộ nhớ đầy dần rồi `OutOfMemoryError`.' },
  { id: 'jvm-4', topic: 'jvm', level: 'easy', q: 'ClassLoader là gì?',
    points: ['Nạp class vào JVM lúc cần', 'Phân cấp: Bootstrap -> Platform -> Application', 'Delegation model'],
    answer: 'ClassLoader là bộ phận nạp file `.class` (bytecode) vào JVM khi lần đầu cần tới một class. Nó tổ chức phân cấp theo mô hình ỦY QUYỀN (parent-first): Bootstrap (nạp thư viện lõi `java.*`) → Platform → Application (nạp class trong classpath ứng dụng của bạn). Khi cần một class, mỗi loader HỎI CHA nạp trước, cha chịu thua mới tự nạp — cơ chế này đảm bảo class lõi như `java.lang.String` luôn do Bootstrap nạp, không bị mạo danh bởi class cùng tên trong app.' },
  { id: 'jvm-5', topic: 'jvm', level: 'medium', q: 'JIT compiler là gì? Khác Interpreter thế nào?',
    points: ['Interpreter: dịch & chạy bytecode từng dòng, chậm nhưng khởi động nhanh', 'JIT: biên dịch phần code "nóng" (chạy nhiều lần) thành native code', 'HotSpot kết hợp cả hai để cân bằng tốc độ khởi động và tốc độ chạy lâu dài'],
    answer: 'Interpreter đọc và thực thi bytecode từng lệnh một — khởi động ngay lập tức nhưng chạy chậm vì phải "dịch" lại mỗi lần. JIT (Just-In-Time) compiler thì theo dõi những đoạn code chạy đi chạy lại nhiều lần (gọi là "hot spot") và biên dịch chúng thẳng sang mã máy native để lần sau chạy nhanh gấp bội. JVM HotSpot khôn ở chỗ kết hợp cả hai: dùng interpreter để chạy ngay từ giây đầu (khỏi chờ compile), rồi JIT âm thầm tối ưu dần phần code nóng — vừa khởi động nhanh vừa chạy nhanh khi ổn định. Ví như con đường hay đi thì mới bỏ công trải nhựa.' },
  { id: 'jvm-6', topic: 'jvm', level: 'hard', q: 'String pool nằm ở đâu trong bộ nhớ? Vì sao quan trọng với hiệu năng?',
    points: ['String pool (String Constant Pool) nằm trong heap (từ Java 7 trở đi)', 'Literal trùng nội dung -> dùng chung 1 object trong pool', 'intern() đưa string vào pool thủ công -> tiết kiệm bộ nhớ khi có nhiều chuỗi trùng lặp'],
    answer: 'String pool (String Constant Pool) là một khu tái sử dụng chuỗi; từ Java 7 nó nằm trong heap (trước đó ở PermGen). Các String LITERAL có cùng nội dung được JVM tự động cho dùng chung MỘT object duy nhất trong pool thay vì tạo mới mỗi lần — nhờ String bất biến nên chia sẻ an toàn, tiết kiệm bộ nhớ rõ rệt khi app có nhiều chuỗi lặp lại. Lưu ý `new String("a")` luôn tạo object mới NGOÀI pool; gọi `.intern()` sẽ đẩy nó vào pool để tái dùng. Đây cũng là lý do so chuỗi phải dùng `equals()` chứ không `==`.' },
  { id: 'jvm-7', topic: 'jvm', level: 'medium', q: 'Các tham số JVM hay chỉnh khi tune heap là gì?',
    points: ['-Xms: kích thước heap khởi tạo', '-Xmx: kích thước heap tối đa', '-XX:+UseG1GC: chọn G1 collector', '-Xss: kích thước stack mỗi thread'],
    answer: 'Vài tham số hay chỉnh khi tune bộ nhớ JVM: `-Xms` là heap ban đầu, `-Xmx` là heap tối đa — trên server thường ĐẶT BẰNG NHAU để JVM khỏi tốn công resize heap qua lại lúc chạy. `-XX:+UseG1GC` (hoặc `-XX:+UseZGC` cho độ trễ thấp) để chọn thuật toán GC. `-Xss` chỉnh kích thước stack mỗi thread — tăng lên khi gặp `StackOverflowError` do đệ quy hợp lệ nhưng sâu (đổi lại mỗi thread tốn nhiều RAM hơn). Nguyên tắc: chỉnh dựa trên số đo (GC log, profiler), đừng chỉnh mò.' },

  // ---------- Behavioral ----------
  { id: 'beh-1', topic: 'behavioral', level: 'easy', q: 'Hãy kể về một dự án bạn tự hào nhất (theo STAR).',
    points: ['Situation: bối cảnh dự án', 'Task: vai trò & mục tiêu của bạn', 'Action: bạn làm gì cụ thể', 'Result: kết quả đo được'],
    answer: 'Dùng khung STAR để câu chuyện có đầu đuôi rõ ràng: Situation (bối cảnh dự án, vấn đề gặp phải), Task (vai trò và nhiệm vụ CỦA BẠN), Action (những gì chính BẠN đã làm — công nghệ chọn, quyết định đưa ra), Result (kết quả đo được: giảm X% thời gian, phục vụ Y user). Mẹo ghi điểm: nói "TÔI đã làm" thay vì "chúng tôi", và luôn chốt bằng con số/kết quả cụ thể — interviewer nhớ kết quả, không nhớ mô tả chung chung.' },
  { id: 'beh-2', topic: 'behavioral', level: 'medium', q: 'Kể về một bug khó bạn từng debug và cách bạn tìm ra.',
    points: ['Mô tả triệu chứng', 'Cách khoanh vùng (log, reproduce, bisect)', 'Root cause', 'Bài học & cách phòng ngừa'],
    answer: 'Kể một bug thật theo mạch "triệu chứng → truy tìm → gốc rễ → bài học": mô tả triệu chứng và tác động (ai bị ảnh hưởng, nghiêm trọng cỡ nào); cách bạn TÁI HIỆN và KHOANH VÙNG có phương pháp (đọc log, thêm metric, `git bisect` để tìm commit gây lỗi) thay vì đoán mò; nguyên nhân gốc thực sự; cách sửa; và quan trọng nhất là bài học phòng ngừa (thêm test, thêm monitoring/alert) để nó không tái diễn. Phần "cách suy luận" mới là thứ interviewer muốn nghe.' },
  { id: 'beh-3', topic: 'behavioral', level: 'medium', q: 'Khi bất đồng ý kiến kỹ thuật với đồng nghiệp, bạn xử lý thế nào?',
    points: ['Lắng nghe, hiểu lý do họ', 'Dựa dữ liệu/tiêu chí chung', 'PoC nếu cần', 'Tôn trọng quyết định cuối, cam kết'],
    answer: 'Thể hiện sự chín chắn hơn là "phải thắng": trước hết LẮNG NGHE để thực sự hiểu lý do của họ (nhiều khi họ có thông tin mình chưa biết); rồi trình bày quan điểm dựa trên DỮ LIỆU và tiêu chí chung mà cả hai đồng ý (hiệu năng, chi phí bảo trì, deadline) thay vì cảm tính hay cái tôi; nếu vẫn chưa ngã ngũ thì làm một PoC nhỏ để so sánh khách quan, "để số liệu nói". Và một khi tập thể/leader đã quyết, dù không theo ý mình thì vẫn tôn trọng và toàn tâm thực hiện (disagree and commit).' },
  { id: 'beh-4', topic: 'behavioral', level: 'easy', q: 'Một lần bạn phải học công nghệ mới rất nhanh?',
    points: ['Tình huống cần học gấp', 'Cách bạn học (docs, dự án nhỏ, mentor)', 'Áp dụng vào việc thật', 'Kết quả'],
    answer: 'Chọn một lần bạn phải học công nghệ mới gấp và kể theo mạch: bối cảnh vì sao cần học nhanh; CÁCH bạn tiếp cận có hệ thống (đọc tài liệu chính thống thay vì chỉ chép StackOverflow, làm một dự án nhỏ để thử tay, hỏi mentor những chỗ tắc, đọc source khi cần hiểu sâu); rồi áp dụng NGAY vào task thật để học đi đôi với làm; và kết quả đạt được. Câu này để chứng minh khả năng TỰ HỌC — thứ quý nhất vì công nghệ luôn đổi.' },
  { id: 'beh-5', topic: 'behavioral', level: 'medium', q: 'Vì sao bạn muốn rời công ty hiện tại / ứng tuyển vị trí này?',
    points: ['Hướng tích cực, không nói xấu', 'Muốn phát triển/thử thách mới', 'Kết nối với vị trí ứng tuyển'],
    answer: 'Luôn trả lời theo hướng TÍCH CỰC và tránh xa việc nói xấu công ty/sếp cũ (nói xấu chỗ cũ khiến nhà tuyển dụng lo bạn sẽ nói xấu họ sau này). Hướng vào điều bạn MUỐN TIẾN TỚI: cơ hội phát triển, thử thách kỹ thuật mới, hay sự phù hợp với định hướng nghề nghiệp. Rồi liên hệ CỤ THỂ vì sao chính vị trí/công ty này đáp ứng điều đó (công nghệ họ dùng, quy mô sản phẩm, văn hóa) — cho thấy bạn đã tìm hiểu chứ không rải CV đại trà.' },

  // ---------- SQL & Database (chuyên sâu) ----------
  { id: 'sql-6', topic: 'sql', level: 'hard', q: 'Một truy vấn chạy chậm — quy trình bạn tối ưu nó thế nào?',
    points: ['Đo trước: EXPLAIN/EXPLAIN ANALYZE xem execution plan', 'Tìm full-table scan, thiếu index, sort/temp table', 'Thêm index đúng cột lọc/join, tránh SELECT *, giảm dữ liệu trả về', 'Viết lại subquery/loại tính toán lặp, tránh N+1', 'Đo lại, so sánh'],
    answer: 'Nguyên tắc vàng: đo trước, sửa sau — như bác sĩ chụp X-quang rồi mới mổ. Chạy EXPLAIN/EXPLAIN ANALYZE để đọc execution plan, soi các "cờ đỏ" như full-table scan, thiếu index, filesort hay temp table. Sau đó thêm index đúng cột dùng ở WHERE/JOIN/ORDER BY, bỏ SELECT *, giảm số dòng phải quét, viết lại subquery lồng nhau và tránh N+1. Cuối cùng đo lại để chắc là nhanh thật chứ không phải nhanh cảm tính.' },
  { id: 'sql-7', topic: 'sql', level: 'medium', q: 'Composite index là gì? Quy tắc leftmost prefix?',
    points: ['Index trên nhiều cột (a,b,c)', 'Chỉ dùng được khi lọc từ cột trái nhất liên tiếp', '(a), (a,b), (a,b,c) OK; (b) hoặc (b,c) không tận dụng', 'Thứ tự cột quan trọng'],
    answer: 'Composite index là index đánh trên nhiều cột theo thứ tự, ví dụ `(a, b, c)`. Hãy hình dung như danh bạ sắp theo Họ rồi tới Tên: tra theo Họ (hoặc Họ+Tên) thì cực nhanh, nhưng chỉ biết Tên mà không biết Họ thì phải dò cả quyển. Vì thế leftmost prefix chỉ tận dụng index khi lọc từ cột trái liên tiếp: `a`, `a+b`, `a+b+c` đều OK; còn lọc mình `b` hay `c` thì vô dụng. Do đó thứ tự cột phải khớp mẫu truy vấn hay dùng nhất.' },
  { id: 'sql-8', topic: 'sql', level: 'hard', q: 'Vì sao đã tạo index mà query vẫn không dùng nó?',
    points: ['Bọc hàm/tính toán lên cột (WHERE YEAR(d)=…)', 'Leading wildcard LIKE "%x"', 'Ép kiểu ngầm (so string với number)', 'Cột chọn lọc kém → optimizer bỏ qua', 'OR trên cột khác nhau'],
    answer: 'Index giống cuốn mục lục — chỉ tra được khi cột còn "nguyên bản". Nó bị vô hiệu khi: bọc hàm hay phép tính lên cột trong WHERE (`WHERE YEAR(created)=2024`), dùng `LIKE` với wildcard đứng đầu (dạng `%abc`), ép kiểu ngầm (so cột số với chuỗi), cột có độ chọn lọc thấp nên optimizer thấy quét cả bảng còn rẻ hơn, hoặc điều kiện `OR` trải trên nhiều cột. Cách chữa là viết điều kiện sargable, để cột đứng trần một bên: `WHERE created >= … AND created < …`.' },
  { id: 'sql-9', topic: 'sql', level: 'medium', q: 'Covering index là gì? Lợi ích?',
    points: ['Index chứa đủ mọi cột query cần', 'DB đọc thẳng từ index, không cần về bảng (không lookup)', 'Tăng tốc rõ với SELECT vài cột'],
    answer: 'Covering index là index chứa sẵn đủ mọi cột mà truy vấn cần (cả ở WHERE lẫn SELECT), nên DB lấy kết quả thẳng từ index mà khỏi quay về đọc bảng — bỏ được bước key lookup tốn kém. Ví như câu trả lời đã in ngay trên mục lục nên không phải giở vào trong sách. Rất lợi khi SELECT chỉ vài cột và các cột đó đều nằm trong index.' },
  { id: 'sql-10', topic: 'sql', level: 'hard', q: 'Phân trang OFFSET và keyset (seek) khác nhau thế nào?',
    points: ['OFFSET/LIMIT: DB vẫn quét bỏ N dòng đầu → chậm khi offset lớn', 'Keyset: WHERE id > last_id ORDER BY id LIMIT n', 'Keyset ổn định, tận dụng index'],
    answer: 'Phân trang `OFFSET` (`LIMIT n OFFSET m`) bắt DB duyệt rồi vứt bỏ m dòng đầu — như đếm lại từ đầu mỗi lần lật trang, nên trang càng sâu càng chậm và dễ lệch khi dữ liệu đổi. Keyset/seek pagination thì "nhớ mốc" của trang trước và nhảy thẳng tới đó (`WHERE id > :lastId ORDER BY id LIMIT n`), tận dụng index nên nhanh và ổn định. Vì vậy dữ liệu lớn hay cuộn vô hạn nên dùng keyset.' },
  { id: 'sql-11', topic: 'sql', level: 'medium', q: 'Normalization và denormalization — khi nào denormalize?',
    points: ['Chuẩn hóa: giảm trùng lặp, toàn vẹn dữ liệu (3NF)', 'Denormalize: nhân bản dữ liệu để đọc nhanh', 'Đánh đổi: ghi phức tạp, rủi ro không nhất quán', 'Denormalize khi read-heavy, JOIN quá nặng'],
    answer: 'Chuẩn hóa (thường tới 3NF) tách dữ liệu sao cho mỗi thứ chỉ lưu ở đúng một chỗ — sạch, không trùng, nhất quán, nhưng đọc thì phải JOIN nhiều bảng. Denormalization làm ngược lại: cố tình nhân bản hoặc gộp dữ liệu để bớt JOIN, đọc nhanh hơn — đánh đổi là ghi phức tạp và rủi ro lệch dữ liệu. Quy tắc: lấy chuẩn hóa làm mặc định, chỉ denormalize khi đã đo thấy hệ thống đọc nhiều và JOIN thành nút thắt, kèm cơ chế đồng bộ (trigger, job, cache).' },
  { id: 'sql-12', topic: 'sql', level: 'hard', q: 'Deadlock ở tầng database xảy ra thế nào? Cách giảm?',
    points: ['Hai transaction khóa dòng theo thứ tự ngược nhau', 'DB tự phát hiện và rollback 1 nạn nhân', 'Giảm: cùng thứ tự truy cập, transaction ngắn, index tốt để khóa ít dòng, retry'],
    answer: 'Deadlock giống hai người trong ngõ hẹp cứ nhường nhau mãi không ai đi được: transaction A giữ khóa 1 chờ khóa 2, còn B giữ khóa 2 chờ khóa 1 — vòng chờ khép kín. DB tự phát hiện chu trình chờ và rollback một transaction làm "nạn nhân" để giải vây. Giảm bằng cách: luôn truy cập bảng/dòng theo cùng một thứ tự, giữ transaction ngắn, đánh index tốt để chỉ khóa đúng ít dòng (tránh lock leo thang), hạ isolation nếu hợp lý, và retry khi dính deadlock.' },

  // ---------- Frontend (JS/TS + React/Angular/Vue/Nuxt) ----------
  { id: 'fe-1', topic: 'frontend', level: 'easy', q: 'var, let và const khác nhau thế nào?',
    points: ['var: function-scope, hoisting, gán lại được', 'let: block-scope, có TDZ, gán lại được', 'const: block-scope, không gán lại (object vẫn đổi field)'],
    answer: '`var` có phạm vi hàm và bị hoisting nên dùng trước khai báo ra `undefined`. `let` và `const` có phạm vi khối và nằm trong "temporal dead zone" tới lúc khai báo nên đụng sớm sẽ báo lỗi. `let` gán lại được, `const` thì không — nhưng `const` trỏ tới object thì vẫn sửa được field bên trong (khóa cái hộp chứ không khóa đồ trong hộp). Mẹo hiện đại: mặc định dùng `const`, cần đổi giá trị mới dùng `let`, và tránh `var`.' },
  { id: 'fe-2', topic: 'frontend', level: 'medium', q: 'Closure trong JavaScript là gì? Cho ví dụ.',
    points: ['Hàm "nhớ" scope nơi nó được tạo', 'Truy cập biến ngoài dù hàm ngoài đã return', 'Dùng: đóng gói state, factory, callback'],
    answer: 'Closure là việc một hàm "mang theo" và vẫn truy cập được các biến ở scope nơi nó ra đời, kể cả khi hàm cha đã chạy xong — như đứa con giữ chìa khóa nhà dù bố mẹ đã đi vắng. Ví dụ hàm `counter()` trả về một hàm con tăng dần biến `count` riêng: `count` bị "đóng" trong closure, bên ngoài không ai chạm tới. Dùng để đóng gói state riêng tư, tạo factory, và giữ dữ liệu cho callback.' },
  { id: 'fe-3', topic: 'frontend', level: 'easy', q: '== khác === trong JavaScript thế nào?',
    points: ['== so sánh sau khi ép kiểu (loose)', '=== so sánh cả kiểu lẫn giá trị (strict)', 'Luôn ưu tiên ===', '0 == "" , null == undefined là bẫy'],
    answer: '`==` so sánh lỏng: nó ép kiểu hai vế về cùng loại trước khi so, sinh ra những kết quả gây bất ngờ (ví dụ số 0 lại bằng chuỗi rỗng) nên rất dễ đẻ bug. `===` so sánh nghiêm ngặt cả kiểu lẫn giá trị, không ép kiểu — "gì ra nấy". Thực hành tốt là luôn dùng `===`; chỉ cố ý dùng `==` ở một mẹo quen thuộc là `x == null` để bắt gọn cả `null` lẫn `undefined`.' },
  { id: 'fe-4', topic: 'frontend', level: 'hard', q: 'Event loop của JavaScript hoạt động thế nào? Microtask vs macrotask?',
    points: ['JS đơn luồng + call stack', 'Web API/timer đẩy callback vào queue', 'Microtask (Promise.then) ưu tiên hơn macrotask (setTimeout)', 'Dọn hết microtask trước mỗi macrotask'],
    answer: 'JS chạy đơn luồng với một call stack duy nhất. Việc bất đồng bộ (timer, fetch) được môi trường xử lý hộ rồi đẩy callback vào hàng đợi. Khi stack rỗng, event loop vét SẠCH microtask queue (`Promise.then`, `queueMicrotask`) trước, rồi mới lấy một macrotask (`setTimeout`, I/O) để làm. Nhớ đơn giản: microtask là "khách VIP" luôn được phục vụ trước — nên `Promise.then` luôn chạy trước `setTimeout(0)`.' },
  { id: 'fe-5', topic: 'frontend', level: 'medium', q: 'Promise và async/await khác nhau thế nào?',
    points: ['Promise: then/catch, dễ lồng nhau', 'async/await: viết bất đồng bộ như đồng bộ', 'await chỉ trong hàm async', 'Bắt lỗi bằng try/catch'],
    answer: 'Promise là "lời hứa" về một kết quả tương lai, nối chuỗi bằng `then`/`catch` nhưng lồng nhiều tầng thì rối mắt. `async`/`await` là lớp cú pháp trên nền Promise, giúp viết code bất đồng bộ nhìn tuần tự như code thường nên dễ đọc: `await` tạm dừng hàm `async` tới khi Promise resolve, và bắt lỗi bằng `try/catch` quen thuộc. Cần chạy nhiều việc song song thì gom bằng `Promise.all` thay vì `await` lần lượt.' },
  { id: 'fe-6', topic: 'frontend', level: 'hard', q: '`this` trong JavaScript được xác định thế nào? Arrow function khác gì?',
    points: ['this phụ thuộc CÁCH GỌI, không phải nơi khai báo', 'obj.f() → this=obj; gọi trần → undefined/window', 'call/apply/bind đặt this', 'Arrow không có this riêng — lấy this bao ngoài'],
    answer: 'Với hàm thường, `this` được quyết định lúc GỌI chứ không phải lúc viết: `obj.method()` thì `this` là `obj`, gọi hàm trần thì `this` là `undefined` (strict) hoặc global, còn `call`/`apply`/`bind` thì gán `this` thủ công. Arrow function thì khác hẳn — nó không có `this` riêng mà "mượn" `this` của scope bao quanh lúc định nghĩa. Nhờ vậy arrow rất tiện cho callback trong class/component để khỏi lo mất `this`.' },
  { id: 'fe-7', topic: 'frontend', level: 'easy', q: 'SPA vs MPA và CSR vs SSR (Nuxt) khác nhau ra sao?',
    points: ['SPA: 1 trang, JS render, chuyển route không reload', 'MPA: mỗi trang tải mới từ server', 'CSR: render ở trình duyệt', 'SSR (Nuxt/Next): render sẵn ở server → SEO & first paint tốt hơn'],
    answer: 'SPA tải một trang rồi để JS render và điều hướng không reload — mượt như app nhưng SEO và lần tải đầu yếu hơn; MPA thì mỗi trang tải mới hẳn từ server. Trục còn lại là nơi render: CSR dựng UI hoàn toàn ở trình duyệt, còn SSR (NuxtJS, Next.js) render sẵn HTML ở server rồi "hydrate" — tốt cho SEO và thời gian thấy nội dung đầu tiên. Nuxt linh hoạt làm được cả SSR lẫn static.' },
  { id: 'fe-8', topic: 'frontend', level: 'medium', q: 'Virtual DOM trong React là gì? Vai trò của prop `key`?',
    points: ['Cây ảo trong bộ nhớ mô tả UI', 'Diff cây cũ/mới (reconciliation) → cập nhật DOM tối thiểu', 'key giúp nhận diện phần tử list ổn định', 'Đừng dùng index làm key khi list đổi thứ tự'],
    answer: 'Virtual DOM là bản phác UI trong bộ nhớ, nhẹ hơn DOM thật rất nhiều. Khi state đổi, React dựng cây mới rồi so (diff/reconciliation) với cây cũ và chỉ vá đúng phần DOM thật thay đổi — như sửa vài chữ trên bản nháp thay vì in lại cả trang. `key` giúp React nhận ra phần tử nào trong list là "cùng một phần tử" giữa các lần render, nên hãy dùng id ổn định; tránh dùng index làm key khi list có thể sắp xếp/chèn/xóa vì sẽ gây nhầm và render sai.' },
  { id: 'fe-9', topic: 'frontend', level: 'medium', q: 'useState và useEffect trong React dùng thế nào? Dependency array quan trọng ra sao?',
    points: ['useState: khai báo state + hàm set → re-render', 'useEffect: side-effect sau render (fetch, subscribe)', 'deps [] chạy 1 lần; [x] chạy khi x đổi; bỏ deps chạy mỗi render', 'return cleanup để hủy'],
    answer: '`useState` tạo một biến state kèm hàm cập nhật; gọi hàm `set` sẽ khiến component render lại. `useEffect` chạy side-effect SAU khi render (gọi API, đăng ký sự kiện, timer). Dependency array là "công tắc" quyết định khi nào chạy lại: `[]` chỉ chạy sau mount, `[x]` chạy khi `x` đổi, còn bỏ trống thì chạy mỗi lần render (dễ thành vòng lặp vô tận). Nhớ `return` một hàm cleanup để gỡ subscription/timer khi unmount hoặc trước lần chạy sau.' },
  { id: 'fe-10', topic: 'frontend', level: 'easy', q: 'State và props khác nhau thế nào (React/Vue)?',
    points: ['props: dữ liệu cha truyền xuống, read-only với con', 'state: dữ liệu nội bộ component tự quản', 'đổi state → re-render', 'con báo lên cha qua callback/emit'],
    answer: 'Props là dữ liệu cha truyền xuống con — con chỉ được ĐỌC, không sửa trực tiếp (như món quà nhận từ bố mẹ, không tự đổi được). State là dữ liệu nội bộ do chính component quản lý và thay đổi được; đổi state thì component render lại. Muốn con tác động ngược lên cha thì cha truyền callback xuống (React) hoặc con phát event lên (Vue/Angular emit) — dữ liệu đi xuống, sự kiện đi lên.' },
  { id: 'fe-11', topic: 'frontend', level: 'medium', q: 'Trong Angular, Component, Service và Dependency Injection liên hệ thế nào?',
    points: ['Component: UI + logic hiển thị', 'Service: logic dùng chung (gọi API, state)', 'DI tiêm service vào component qua constructor', '@Injectable + provider'],
    answer: 'Component lo phần giao diện và tương tác người dùng. Service (đánh `@Injectable`) chứa logic dùng chung như gọi HTTP, xử lý dữ liệu, chia sẻ state giữa nhiều component. Angular có sẵn DI container: chỉ cần khai báo service ở constructor là Angular tự "tiêm" instance vào (thường là singleton theo provider), mình không phải tự `new`. Nhờ tách UI khỏi logic như vậy mà code dễ tái dùng, dễ thay thế và dễ test (mock service).' },
  { id: 'fe-12', topic: 'frontend', level: 'medium', q: 'Observable (RxJS) khác Promise thế nào?',
    points: ['Promise: một giá trị, chạy ngay (eager)', 'Observable: nhiều giá trị theo thời gian, lazy (chạy khi subscribe)', 'Hủy được (unsubscribe), có toán tử map/filter/debounce', 'Dùng nhiều trong Angular HttpClient'],
    answer: 'Promise phát đúng MỘT giá trị và khởi động ngay khi được tạo (eager). Observable (RxJS) là một luồng có thể phát NHIỀU giá trị theo thời gian, lại lazy — chỉ chạy khi có ai `subscribe`, và hủy được bằng `unsubscribe`. Ví như Promise là một bức thư, còn Observable là kênh podcast phát liên tục. Nó kèm kho toán tử (`map`, `filter`, `debounceTime`, `switchMap`) rất hợp xử lý sự kiện hay ô search; `HttpClient` của Angular trả về Observable.' },
  { id: 'fe-13', topic: 'frontend', level: 'medium', q: 'CORS là gì? Vì sao bị lỗi và xử lý ở đâu?',
    points: ['Same-origin policy chặn gọi khác origin', 'CORS: server thêm header Access-Control-Allow-Origin…', 'Preflight OPTIONS cho request "không đơn giản"', 'Sửa ở SERVER, không phải client'],
    answer: 'CORS (Cross-Origin Resource Sharing) là luật an toàn của TRÌNH DUYỆT: theo same-origin policy, trang ở origin A gọi API sang origin B sẽ bị chặn, trừ khi server B đồng ý bằng các header `Access-Control-Allow-Origin`, `-Methods`, `-Headers`. Request "phức tạp" còn có bước hỏi trước preflight `OPTIONS`. Điểm hay nhầm: lỗi CORS phải sửa ở phía SERVER (khai báo origin được phép), không phải ở frontend — lúc dev có thể tạm dùng proxy.' },

  // ---------- Stack thực tế (Struts / iBatis / Batch / Report / FTP) ----------
  { id: 'ms-1', topic: 'mystack', level: 'medium', q: 'Struts (Struts 1) hoạt động theo mô hình MVC thế nào?',
    points: ['ActionServlet là front controller', 'struts-config.xml map URL → Action', 'ActionForm giữ dữ liệu form', 'Action xử lý rồi trả ActionForward tới view (JSP)'],
    answer: 'Struts theo mô hình MVC với một front controller duy nhất là `ActionServlet` nhận mọi request. File `struts-config.xml` ánh xạ URL tới `Action` tương ứng; `ActionForm` gom và validate dữ liệu form; `Action` (vai Controller) gọi tầng nghiệp vụ rồi trả về một `ActionForward` trỏ tới view (JSP) để render. So với Spring MVC thì Struts cấu hình XML nhiều hơn và `Action` nặng hơn Controller thời nay — biết nó chủ yếu để bảo trì hệ thống legacy.' },
  { id: 'ms-2', topic: 'mystack', level: 'medium', q: 'iBatis/MyBatis khác JPA/Hibernate thế nào? Khi nào chọn cái nào?',
    points: ['MyBatis: SQL mapper — bạn tự viết SQL, map sang object', 'JPA/Hibernate: ORM — sinh SQL từ entity/mapping', 'MyBatis: kiểm soát SQL tối đa, hợp SQL phức tạp/legacy DB', 'JPA: năng suất cao cho CRUD chuẩn'],
    answer: 'MyBatis (kế thừa iBatis) là SQL mapper: mình TỰ viết SQL trong XML/annotation rồi map kết quả sang object — kiểm soát truy vấn tối đa, rất hợp SQL phức tạp, tối ưu tay, DB legacy hay stored procedure. JPA/Hibernate là ORM: nó tự SINH SQL từ entity và quản lý persistence context — năng suất cao cho CRUD chuẩn nhưng khó chủ động với query khó. Cách nhớ: cần cầm lái SQL thì chọn MyBatis; cần đi nhanh với CRUD thông thường thì chọn JPA.' },
  { id: 'ms-3', topic: 'mystack', level: 'medium', q: 'Dynamic SQL trong MyBatis/iBatis là gì? Ví dụ.',
    points: ['Ghép câu SQL theo điều kiện lúc chạy', 'Thẻ <if>, <where>, <choose>, <foreach>', 'Dùng #{} (prepared, chống SQL injection) thay ${}', 'Tránh nối chuỗi tay'],
    answer: 'Dynamic SQL cho phép GHÉP câu truy vấn tùy điều kiện lúc chạy bằng các thẻ như `<if>`, `<where>`, `<choose>`, `<foreach>` — ví dụ chỉ thêm điều kiện lọc khi tham số có giá trị, hay build mệnh đề `IN` từ một list. Điểm cốt tử: luôn dùng `#{param}` (prepared statement, tự bind an toàn nên chống SQL injection) thay vì `${param}` nối chuỗi trực tiếp, và tránh tự ghép SQL bằng tay.' },
  { id: 'ms-4', topic: 'mystack', level: 'hard', q: 'Thiết kế một batch job xử lý khối lượng lớn cần lưu ý gì?',
    points: ['Xử lý theo lô (chunk) + phân trang, không nạp hết vào RAM', 'Commit theo lô, log tiến độ', 'Chạy lại được (restart/checkpoint), idempotent', 'Xử lý lỗi từng dòng, không hỏng cả job'],
    answer: 'Xử lý theo LÔ (chunk/pagination) để không nạp cả núi dữ liệu vào RAM, commit theo từng lô và ghi log tiến độ. Job phải chạy lại an toàn: lưu checkpoint/trạng thái để restart đúng chỗ dừng, và idempotent — chạy lại không nhân đôi dữ liệu. Xử lý lỗi ở mức từng dòng/record (skip và ghi lại chỗ lỗi) để một bản ghi hỏng không kéo sập cả job, kèm cảnh báo/monitoring. Tóm lại: chia nhỏ, ghi mốc, chạy lại được, đừng để một hạt sạn làm hỏng cả mẻ.' },
  { id: 'ms-5', topic: 'mystack', level: 'medium', q: 'Luồng tạo báo cáo PDF bằng JasperReports diễn ra thế nào?',
    points: ['Thiết kế template .jrxml (JasperSoft Studio)', 'Compile thành .jasper', 'Fill dữ liệu (JDBC/collection) + tham số → JasperPrint', 'Export ra PDF/Excel'],
    answer: 'Đầu tiên thiết kế mẫu báo cáo trong file `.jrxml` (thường bằng JasperSoft Studio), rồi compile thành `.jasper`. Lúc chạy, "fill" template với nguồn dữ liệu (JDBC, danh sách object) cùng tham số để tạo ra một `JasperPrint`, rồi export sang PDF (hoặc Excel/HTML) qua `JasperExportManager`. Ví như `.jrxml` là khuôn bánh, dữ liệu là bột — đổ vào rồi "nướng" ra PDF; trong dự án tôi lập lịch batch để tự động sinh báo cáo định kỳ.' },
  { id: 'ms-6', topic: 'mystack', level: 'medium', q: 'Xử lý file rồi upload lên FTP an toàn cần lưu ý gì?',
    points: ['Ghi file tạm rồi rename (atomic) để tránh đọc file dở', 'Retry khi lỗi mạng, timeout', 'Kiểm tra checksum/kích thước sau upload', 'Đóng stream/kết nối trong finally, dọn file tạm'],
    answer: 'Mẹo chính là "ghi file tạm rồi mới đổi tên": xử lý xong (ví dụ convert ảnh sang JPG) ra một file tạm, sau đó rename hoặc di chuyển (thao tác gần như atomic) để bên khác không đọc phải file đang ghi dở. Với FTP thì thêm: retry khi lỗi mạng, đặt timeout, kiểm tra lại kích thước/checksum sau upload, upload vào thư mục tạm trên server rồi rename, và luôn đóng stream/kết nối trong `finally` cùng dọn file tạm.' },
  { id: 'ms-7', topic: 'mystack', level: 'easy', q: 'Git khác SVN thế nào?',
    points: ['Git: phân tán, mỗi máy có full history', 'SVN: tập trung, cần server để commit/log', 'Git branch/merge nhẹ, làm offline được', 'SVN đơn giản, khóa file tiện cho binary'],
    answer: 'Git là phân tán — mỗi bản clone giữ TOÀN BỘ lịch sử, nên commit, xem log, tạo nhánh đều làm được offline và branch/merge cực nhẹ. SVN là tập trung — phải kết nối server mới commit và xem lịch sử được, mô hình tuyến tính đơn giản hơn và hỗ trợ khóa file (tiện cho file nhị phân). Cách nhớ: Git là "ai cũng có bản sao đầy đủ", SVN là "một kho chung ở server"; nhiều dự án doanh nghiệp/legacy vẫn dùng SVN nên biết cả hai là lợi thế.' },
  { id: 'ms-8', topic: 'mystack', level: 'hard', q: 'Idempotency trong batch/tích hợp nghĩa là gì? Vì sao quan trọng?',
    points: ['Chạy lại cùng input → cùng kết quả, không nhân đôi', 'Cần khi job retry/chạy lại sau lỗi', 'Kỹ thuật: khóa duy nhất, upsert, đánh dấu đã xử lý, idempotency key'],
    answer: 'Idempotent nghĩa là chạy lại cùng một input thì ra cùng một trạng thái, không đẻ bản ghi trùng hay tính tiền hai lần — như bấm nút gọi thang máy nhiều lần vẫn chỉ tới một chuyến. Nó tối quan trọng cho batch và tích hợp vì job hay bị retry/chạy lại sau lỗi. Đạt được bằng ràng buộc khóa duy nhất, `upsert` (insert-or-update), đánh dấu record "đã xử lý", hoặc gửi kèm idempotency key khi gọi API bên ngoài (ví dụ thanh toán).' },

  // ========== Bổ sung từ ngân hàng câu hỏi thực tế (VPBank & phỏng vấn thật) ==========
  // ---------- Java Core (bổ sung) ----------
  { id: 'core-11', topic: 'core', level: 'easy', q: 'throw và throws khác nhau thế nào?',
    points: ['throw: CÂU LỆNH ném ra một exception cụ thể', 'throws: khai báo ở CHỮ KÝ method rằng method có thể ném', 'throw đi với 1 object; throws đi với danh sách kiểu exception'],
    answer: 'Mẹo nhớ: throws có "s" là lời khai báo, throw không "s" là hành động. `throw` là câu lệnh thực sự tung ra một đối tượng exception ngay tại chỗ, ví dụ `throw new IllegalArgumentException(...)`. `throws` đặt ở chữ ký method như tấm biển cảnh báo "method này CÓ THỂ ném các loại exception sau", buộc caller phải catch hoặc khai báo throws tiếp (với checked exception). Tóm lại: một bên ném thật, một bên chỉ báo trước.' },
  { id: 'core-12', topic: 'core', level: 'easy', q: 'Array (mảng) và ArrayList khác nhau thế nào?',
    points: ['Array: kích thước CỐ ĐỊNH, chứa cả primitive lẫn object, có .length', 'ArrayList: co giãn động, chỉ chứa object (autobox), có size()/API phong phú', 'Array nhẹ & nhanh hơn chút; ArrayList tiện hơn'],
    answer: 'Hình dung mảng như hộp trứng đúc sẵn số ô: kích thước cố định lúc tạo, chứa được cả primitive lẫn object, truy cập bằng `[]` và thuộc tính `length`. ArrayList như túi co giãn — tự nới rộng (cấp mảng lớn hơn rồi copy khi đầy), chỉ chứa object nên primitive bị autobox, bù lại có API phong phú (`add`/`remove`/`size`). Mảng nhẹ và nhanh hơn chút vì cố định; ArrayList linh hoạt hơn nên thực tế hay dùng.' },

  // ---------- Collections (bổ sung) ----------
  { id: 'col-9', topic: 'collections', level: 'easy', q: 'So sánh List, Set và Map?',
    points: ['List: có thứ tự, cho trùng, truy cập theo index', 'Set: không trùng, thường không đảm bảo thứ tự', 'Map: cặp key-value, key duy nhất (không phải Collection)'],
    answer: 'Nhớ theo công dụng: List như một hàng người xếp thứ tự, cho trùng, gọi theo số thứ tự index (ArrayList, LinkedList). Set như một túi đồ không cho vật trùng, thường không giữ thứ tự (HashSet), trừ LinkedHashSet (giữ thứ tự thêm) hay TreeSet (sắp xếp). Map như một cuốn từ điển: mỗi key (từ) tra ra một value (nghĩa), key là duy nhất (HashMap, TreeMap) và Map không phải Collection thực thụ. Chọn: cần thứ tự/trùng → List, loại trùng → Set, tra theo khóa → Map.' },

  // ---------- Concurrency (bổ sung) ----------
  { id: 'con-8', topic: 'concurrency', level: 'medium', q: 'Race condition là gì? Làm sao tránh? Khác deadlock thế nào?',
    points: ['Nhiều thread cùng đọc-ghi dữ liệu chung không đồng bộ → kết quả sai/không xác định', 'Tránh: synchronized/Lock, biến Atomic, immutable, giảm shared state', 'Deadlock: kẹt chờ khóa lẫn nhau (khác race condition)'],
    answer: 'Race condition (đua tranh) xảy ra khi nhiều thread cùng đọc-ghi một dữ liệu chung mà không đồng bộ, nên kết quả phụ thuộc thread nào chạy trước — sai lúc được lúc không, rất khó tái hiện. Ví dụ kinh điển: hai thread cùng `count++` (đọc-cộng-ghi không nguyên tử) làm mất lần đếm. Tránh bằng đồng bộ hóa (`synchronized`, `ReentrantLock`), biến nguyên tử (`AtomicInteger`), dữ liệu bất biến, hoặc giảm/bỏ trạng thái chia sẻ. Khác deadlock ở chỗ: race là tranh nhau gây kết quả sai, còn deadlock là các thread kẹt cứng chờ khóa của nhau nên đứng im mãi.' },

  // ---------- Spring (bổ sung: lifecycle, AOP, inject, scheduling, retry) ----------
  { id: 'spr-9', topic: 'spring', level: 'hard', q: 'Vòng đời (lifecycle) của một Spring bean gồm những giai đoạn nào?',
    points: ['Instantiate → tiêm phụ thuộc → *Aware → BeanPostProcessor (before)', 'Init: @PostConstruct / InitializingBean.afterPropertiesSet → post-init', 'Bean sẵn sàng dùng', 'Destroy: @PreDestroy / DisposableBean.destroy khi context đóng'],
    answer: 'Hình dung như dây chuyền lắp ráp: Spring tạo instance → tiêm phụ thuộc → gọi các callback Aware → BeanPostProcessor (before-init) → chạy khởi tạo (@PostConstruct hoặc afterPropertiesSet, rồi BeanPostProcessor after-init) → bean sẵn sàng phục vụ; khi context đóng thì gọi hủy (@PreDestroy hoặc destroy). Nhớ mẹo: với singleton Spring lo trọn vòng đời, nhưng với prototype Spring giao bean xong là "buông tay" — KHÔNG gọi bước destroy.' },
  { id: 'spr-10', topic: 'spring', level: 'medium', q: 'AOP trong Spring là gì? Dùng để làm gì?',
    points: ['Tách cross-cutting concern (log, security, transaction) khỏi logic nghiệp vụ', 'Aspect, Advice (Before/After/Around), Pointcut, JoinPoint', 'Spring dùng proxy (JDK dynamic / CGLIB)', 'Là nền của @Transactional, @Async, @Cacheable'],
    answer: 'AOP (Aspect-Oriented Programming) gom các mối quan tâm "cắt ngang" nhiều nơi — logging, bảo mật, transaction, retry — ra một chỗ, thay vì rải code lặp trong mọi method. Ví von: như một lớp bọc bên ngoài tự thêm việc trước/sau khi method chạy mà không đụng vào logic gốc. Thành phần: Aspect chứa Advice (Before/After/Around) áp vào các JoinPoint được chọn bởi Pointcut. Spring hiện thực bằng proxy (JDK dynamic proxy cho interface, CGLIB cho class). Chính AOP là nền cho @Transactional/@Async/@Cacheable — nên tự gọi method trong cùng class (self-invocation) sẽ bỏ qua proxy và mất tác dụng.' },
  { id: 'spr-11', topic: 'spring', level: 'easy', q: 'Có mấy cách inject bean? Nên dùng cách nào?',
    points: ['Constructor injection (khuyên dùng)', 'Setter injection', 'Field injection (@Autowired trên field)', 'Constructor: phụ thuộc bắt buộc, final, dễ test'],
    answer: 'Ba cách: constructor injection (qua hàm dựng), setter injection (qua setter), và field injection (@Autowired thẳng trên field). Nên ưu tiên constructor injection vì nó liệt kê rõ mọi phụ thuộc bắt buộc ngay ở hàm dựng — như một hóa đơn ghi đủ nguyên liệu: thiếu là không tạo được object, cho phép để `final`/bất biến, dễ viết unit test (chỉ việc new và truyền mock) và lộ circular dependency sớm. Field injection viết ngắn nhưng giấu phụ thuộc và khó test vì không new thẳng được.' },
  { id: 'spr-12', topic: 'spring', level: 'medium', q: 'Có 2 bean cùng kiểu (A1, A2), làm sao inject đúng A2?',
    points: ['@Qualifier("a2") tại điểm inject', 'hoặc đánh @Primary cho bean mặc định', 'Đặt tên biến trùng tên bean cũng khớp', 'Không xử lý → NoUniqueBeanDefinitionException'],
    answer: 'Có hai bean cùng kiểu thì Spring lúng túng "chọn ai" và ném NoUniqueBeanDefinitionException. Cách chỉ đích danh: gắn @Qualifier("a2") ngay tại chỗ inject (như gọi đúng tên riêng), hoặc đánh @Primary cho bean muốn làm mặc định (ứng viên được ưu tiên khi không nói rõ). Mẹo phụ: đặt tên biến trùng tên bean (a2) thì Spring cũng tự khớp theo tên.' },
  { id: 'spr-13', topic: 'spring', level: 'medium', q: 'Làm sao tạo bean theo điều kiện?',
    points: ['@ConditionalOnProperty (theo cấu hình)', '@ConditionalOnClass / @ConditionalOnMissingBean (theo classpath/bean)', '@Conditional tùy biến với Condition', '@Profile theo môi trường — là nền của auto-configuration'],
    answer: 'Ý tưởng: đặt "công tắc điều kiện" để bean chỉ được tạo khi thỏa. Dùng nhóm annotation điều kiện: @ConditionalOnProperty (bật theo cấu hình trong file properties), @ConditionalOnClass/@ConditionalOnMissingBean (theo có mặt class trên classpath hoặc chưa có bean nào khác), hoặc @Conditional tùy biến với một lớp Condition tự viết. @Profile bật bean theo môi trường (dev/prod). Chính cơ chế này là nền cho auto-configuration của Spring Boot — Boot tự lắp bean khi phát hiện đủ điều kiện.' },
  { id: 'spr-14', topic: 'spring', level: 'medium', q: '@Scheduled: fixedRate khác fixedDelay thế nào? Viết cron chạy mỗi 3 tiếng vào thứ Hai.',
    points: ['fixedRate: tính từ lúc BẮT ĐẦU lần trước (nhịp cố định)', 'fixedDelay: tính từ lúc KẾT THÚC lần trước', 'Cron Spring 6 trường: giây phút giờ ngày tháng thứ', 'Ví dụ: "0 0 0/3 * * MON"'],
    answer: 'Khác nhau ở mốc tính giờ: fixedRate tính từ lúc BẮT ĐẦU lần trước (như chuông reo đều đặn mỗi X giây bất kể việc xong chưa — nếu chạy lâu có thể chồng lần); fixedDelay đợi lần trước KẾT THÚC rồi mới đếm X giây nghỉ (luôn giãn cách, không chồng). Cron của Spring có 6 trường: giây phút giờ ngày-tháng tháng thứ. Ví dụ mỗi 3 giờ vào thứ Hai: "0 0 0/3 * * MON" (phần 0/3 nghĩa là bắt đầu từ 0 giờ rồi lặp mỗi 3 giờ).' },
  { id: 'spr-15', topic: 'spring', level: 'hard', q: 'Spring Retry: khai báo retry 5 lần thế nào? backoff và @Recover để làm gì?',
    points: ['@EnableRetry + @Retryable(maxAttempts=5, retryFor=...)', 'backoff = khoảng chờ giữa các lần (multiplier tăng dần)', '@Recover: fallback khi hết số lần', 'Chỉ retry đúng loại exception khai báo (NPE ngoài danh sách → không retry)'],
    answer: 'Bật `@EnableRetry` một lần cho ứng dụng, rồi gắn `@Retryable(maxAttempts = 5, retryFor = {IOException.class})` lên method cần thử lại. Khi cả 5 lần đều lỗi, Spring gọi method `@Recover` (phải cùng kiểu trả về và nhận tham số là exception) làm phương án dự phòng — chỗ để trả giá trị mặc định hoặc báo lỗi tử tế. `@Backoff(delay = ..., multiplier = ...)` đặt thời gian CHỜ giữa các lần, nên để tăng dần (exponential) cho khỏi dồn tải lên dịch vụ đang yếu. Lưu ý quan trọng: nó chỉ retry đúng loại exception khai báo — khai `IOException` mà gặp `NullPointerException` thì KHÔNG khớp, không retry, lỗi văng thẳng ra.' },
  { id: 'spr-16', topic: 'spring', level: 'medium', q: '@Cacheable hoạt động thế nào? Cache invalidation làm sao?',
    points: ['@Cacheable: kiểm tra cache trước, có thì trả luôn không chạy method', '@CachePut: luôn chạy method rồi cập nhật cache', '@CacheEvict: xóa entry khi dữ liệu đổi', 'key theo tham số method (SpEL), cần đặt TTL/kích thước'],
    answer: '`@Cacheable` cho một proxy bọc method (giống cơ chế `@Transactional`): trước khi chạy, nó tra cache theo key (mặc định suy ra từ tham số) — TRÚNG thì trả thẳng giá trị cache và KHÔNG chạy method, TRƯỢT thì chạy method rồi lưu kết quả lại. `@CachePut` thì LUÔN chạy method và cập nhật cache (dùng khi tạo/sửa). `@CacheEvict` xóa entry khi dữ liệu đổi để tránh trả dữ liệu cũ (stale) — quên evict đúng chỗ là bug cache phổ biến nhất. Nhớ cấu hình TTL và kích thước tối đa (Caffeine/Redis) để cache không phình vô hạn gây tốn RAM. Mẹo: có `@Cacheable` ở đâu thì phải nghĩ ngay "khi nào dữ liệu này đổi để evict?".' },
  { id: 'spr-17', topic: 'spring', level: 'medium', q: 'HikariCP / connection pool là gì? Vì sao phải giới hạn kích thước pool?',
    points: ['Pool giữ sẵn connection DB, tái dùng thay vì mở/đóng mỗi request', 'HikariCP: connection pool mặc định của Spring Boot, nhanh & nhẹ', 'Pool quá nhỏ: request phải chờ connection → nghẽn', 'Pool quá lớn: quá tải DB (mỗi connection tốn RAM/thread ở DB)'],
    answer: 'Mở một kết nối DB là việc ĐẮT (bắt tay TCP, xác thực...), nên connection pool giữ sẵn một số kết nối đã mở để tái dùng cho từng request — như quầy thu ngân mở sẵn thay vì mỗi khách tới mới đi tuyển một thu ngân. HikariCP là pool mặc định của Spring Boot, nổi tiếng nhanh và nhẹ. Kích thước pool (`maximum-pool-size`) phải CÂN BẰNG: quá nhỏ thì request xếp hàng chờ connection (nghẽn khi tải cao); quá lớn thì tốn tài nguyên và có thể làm quá tải chính DB vì mỗi connection ngốn RAM/thread ở phía server DB. Trực giác ngược đời: số connection tối ưu thường GẦN với số core CPU khả dụng, không phải càng nhiều càng nhanh.' },

  // ---------- Security (bổ sung) ----------
  { id: 'sec-6', topic: 'security', level: 'medium', q: 'CSRF là gì? Vì sao REST API thường disable CSRF?',
    points: ['CSRF: lợi dụng cookie phiên tự gửi kèm để giả mạo hành động người dùng', 'Phòng: CSRF token, cookie SameSite', 'REST stateless dùng token ở header Authorization (không dựa cookie) → không dính CSRF'],
    answer: 'CSRF (Cross-Site Request Forgery) lợi dụng việc trình duyệt TỰ ĐỘNG đính kèm cookie phiên vào mọi request tới một domain: một trang độc hại có thể lén gửi request tới ngân hàng của bạn, và vì cookie tự gửi kèm nên server tưởng chính bạn thao tác — giống ai đó ký lệnh bằng chữ ký đã đóng sẵn của bạn. Phòng bằng CSRF token (mã bí mật mà trang giả không đoán được) hoặc cookie `SameSite`. REST API thường STATELESS, xác thực bằng token trong header `Authorization` — token này KHÔNG tự gửi kèm như cookie, nên không dính CSRF; vì vậy với REST người ta hay disable CSRF cho gọn.' },
  { id: 'sec-7', topic: 'security', level: 'medium', q: '@PreAuthorize và @Secured khác nhau thế nào?',
    points: ['@Secured: chỉ nhận danh sách role, cú pháp đơn giản', '@PreAuthorize: biểu thức SpEL mạnh (điều kiện, tham số method, gọi bean)', '@PreAuthorize cần bật prePostEnabled'],
    answer: '`@Secured` chỉ nhận danh sách role đơn giản, kiểu `@Secured("ROLE_ADMIN")` — đủ cho phân quyền thô. `@PreAuthorize` mạnh hơn hẳn nhờ dùng biểu thức SpEL: ghép nhiều điều kiện và kiểm tra cả THAM SỐ của method, ví dụ `@PreAuthorize("hasRole(\'ADMIN\') or #id == principal.id")` để "admin hoặc chính chủ mới được xem" — thứ `@Secured` không làm được. `@PreAuthorize`/`@PostAuthorize` cần bật `prePostEnabled`, còn `@Secured` bật bằng `securedEnabled`. Thực tế hầu hết dự án chọn `@PreAuthorize` vì linh hoạt.' },

  // ---------- SQL & Database (bổ sung) ----------
  { id: 'sql-13', topic: 'sql', level: 'easy', q: 'UNION và UNION ALL khác nhau thế nào?',
    points: ['UNION: gộp và LOẠI trùng (phải sort/distinct → chậm hơn)', 'UNION ALL: gộp GIỮ cả trùng (nhanh hơn)', 'Cùng số cột & kiểu tương thích'],
    answer: 'Cả hai đều gộp kết quả của nhiều câu SELECT (yêu cầu cùng số cột và kiểu tương thích). Khác nhau: `UNION` LOẠI dòng trùng — nhưng để biết dòng nào trùng nó phải sắp xếp/so sánh toàn bộ, nên CHẬM hơn. `UNION ALL` giữ nguyên mọi dòng kể cả trùng, không tốn công lọc nên NHANH hơn. Mẹo: mặc định hãy dùng `UNION ALL` cho nhanh, chỉ dùng `UNION` khi thật sự cần khử trùng — nhiều người quen tay gõ `UNION` và vô tình bắt DB làm việc thừa.' },
  { id: 'sql-14', topic: 'sql', level: 'medium', q: 'View và Materialized View khác nhau thế nào?',
    points: ['View: truy vấn lưu sẵn, chạy lại mỗi lần gọi (luôn mới, không tốn lưu trữ)', 'Materialized View: lưu KẾT QUẢ vật lý → đọc nhanh nhưng phải refresh (có thể cũ)', 'MView hợp báo cáo/aggregation nặng'],
    answer: 'View chỉ là một câu truy vấn được ĐẶT TÊN — mỗi lần gọi nó chạy lại trên bảng gốc, nên dữ liệu luôn mới nhất nhưng KHÔNG tăng tốc (chỉ gọn code, ẩn độ phức tạp). Materialized View thì LƯU SẴN kết quả xuống đĩa như một bảng chụp, nên đọc rất nhanh; đổi lại tốn dung lượng và có thể CŨ vì phải refresh (định kỳ hoặc theo sự kiện) mới cập nhật. Mẹo nhớ: View = công thức nấu (nấu lại mỗi lần gọi), Materialized View = món đã nấu sẵn để tủ (ăn nhanh nhưng có thể nguội). MView hợp báo cáo/tổng hợp nặng, ít đổi.' },
  { id: 'sql-15', topic: 'sql', level: 'medium', q: 'CTE (WITH) trong SQL là gì? Lợi ích?',
    points: ['Tập kết quả tạm đặt tên bằng WITH name AS (...)', 'Tách truy vấn phức tạp thành bước dễ đọc thay subquery lồng', 'Hỗ trợ đệ quy (WITH RECURSIVE) cho cây/phân cấp'],
    answer: 'CTE (Common Table Expression) là một tập kết quả TẠM được đặt tên bằng `WITH ten AS (SELECT ...)`, rồi dùng như một bảng ngay trong truy vấn chính bên dưới. Giá trị lớn nhất là DỄ ĐỌC: nó tách một truy vấn rối thành các bước có tên rõ ràng, đọc từ trên xuống, thay cho subquery lồng nhau nhiều tầng khó dò; lại tái dùng được nhiều lần trong cùng câu. Ngoài ra `WITH RECURSIVE` cho phép ĐỆ QUY để duyệt cấu trúc cây/phân cấp (cây nhân viên–quản lý, danh mục cha–con) — thứ subquery thường khó làm.' },
  { id: 'sql-16', topic: 'sql', level: 'medium', q: 'Stored Procedure và Function trong DB khác nhau thế nào?',
    points: ['Function: BẮT BUỘC trả về giá trị, gọi được trong SELECT/biểu thức', 'Procedure: khối lệnh gọi bằng CALL, có tham số OUT, logic/transaction phức tạp', 'Function hạn chế side-effect; procedure linh hoạt hơn'],
    answer: 'Function BẮT BUỘC trả về một giá trị và thường gọi được ngay trong biểu thức/`SELECT` (vd `SELECT tinh_thue(gia)`), nên thường hạn chế thay đổi dữ liệu — hợp cho các phép TÍNH TOÁN tái dùng. Stored Procedure là một khối lệnh gọi bằng `CALL`/`EXEC`, có thể trả nhiều giá trị qua tham số `OUT`, chạy logic và transaction phức tạp (nhiều bước INSERT/UPDATE), nhưng KHÔNG dùng trực tiếp trong `SELECT`. Mẹo nhớ: Function = "hàm tính ra một giá trị để dùng trong query"; Procedure = "một quy trình nghiệp vụ chạy độc lập".' },
  { id: 'sql-17', topic: 'sql', level: 'hard', q: 'Partitioning và Sharding khác nhau thế nào?',
    points: ['Partition: chia 1 bảng thành nhiều phần TRONG cùng 1 DB/server', 'Sharding: phân tán dữ liệu ra NHIỀU server/DB (scale ngang)', 'Partition dễ quản lý; sharding phức tạp (routing, cross-shard join)'],
    answer: 'Cả hai đều là chia nhỏ dữ liệu, khác ở CHỖ ĐẶT. Partitioning chia một bảng lớn thành nhiều phần (theo range/list/hash) nhưng VẪN trong cùng một database/server — giúp truy vấn và bảo trì nhanh hơn trên từng phần (vd xóa cả partition tháng cũ trong nháy mắt). Sharding phân tán dữ liệu ra NHIỀU server/database độc lập để scale NGANG khi một máy không chứa hay phục vụ nổi. Mẹo nhớ: partition = chia ngăn trong cùng một tủ; sharding = chia ra nhiều tủ ở nhiều phòng. Sharding mạnh về mở rộng nhưng phức tạp: phải định tuyến đúng shard, và join/giao dịch xuyên shard rất khó.' },
  { id: 'sql-18', topic: 'sql', level: 'medium', q: 'Tiêu chí chọn cột đánh index? Query "=" và "LIKE" cái nào nhanh hơn?',
    points: ['Index cột hay dùng ở WHERE/JOIN/ORDER BY, độ chọn lọc CAO', 'Tránh index cột ít giá trị / bảng ghi rất nhiều', '"=" tận dụng index tốt nhất; LIKE "abc%" còn dùng được, LIKE "%abc" thì không'],
    answer: 'Nên đánh index cho cột hay dùng ở `WHERE`/`JOIN`/`ORDER BY` VÀ có độ chọn lọc cao (nhiều giá trị khác nhau, lọc ra ít dòng). Tránh index cột ít giá trị như giới tính (lọc ra nửa bảng thì index vô ích) hoặc bảng ghi cực nhiều, vì mỗi index làm chậm INSERT/UPDATE và tốn dung lượng. Về tốc độ: `=` khớp chính xác nên tận dụng index tốt nhất; `LIKE "abc%"` VẪN dùng được index vì khớp theo TIỀN TỐ (như tra từ điển theo vần đầu); nhưng `LIKE "%abc"` có wildcard ĐỨNG ĐẦU thì index bó tay, phải quét cả bảng → chậm.' },
  { id: 'sql-19', topic: 'sql', level: 'easy', q: 'Liquibase (hay Flyway) là gì? Dùng để làm gì?',
    points: ['Công cụ quản lý phiên bản schema DB (migration)', 'Changeset có version, ghi lại đã áp dụng gì (không chạy trùng)', 'Đồng bộ schema giữa môi trường, rollback được, đưa vào CI/CD'],
    answer: 'Liquibase là công cụ quản lý PHIÊN BẢN cho schema database — giống Git nhưng cho cấu trúc DB. Bạn mô tả mỗi thay đổi trong một "changeset" (XML/YAML/SQL) có đánh version; nó chạy theo thứ tự và GHI LẠI đã áp dụng changeset nào (trong bảng `DATABASECHANGELOG`) để không bao giờ chạy trùng. Nhờ đó schema đồng bộ tự động giữa dev/test/prod, đưa được vào version control và pipeline CI/CD, và hỗ trợ rollback khi cần. Flyway là công cụ tương đương, đơn giản hơn (thiên về SQL thuần).' },

  // ---------- Kafka & Messaging ----------
  { id: 'kafka-1', topic: 'kafka', level: 'easy', q: 'Kafka là gì? Producer và Consumer khác nhau thế nào?',
    points: ['Nền tảng message/streaming phân tán, lưu log bền theo topic', 'Producer: publish message vào topic', 'Consumer: subscribe/đọc message ra để xử lý', 'Giao tiếp bất đồng bộ, decoupling'],
    answer: 'Hình dung Kafka như một cuốn "sổ nhật ký" (log) khổng lồ chia theo topic, ghi message bền vững lên đĩa nên nhiều bên đọc lại bao nhiêu lần cũng được. Producer là bên viết vào sổ (publish message vào topic); Consumer là bên đọc sổ ra để xử lý (subscribe). Vì bên gửi và bên nhận không phải chờ nhau, Kafka giúp các service giao tiếp bất đồng bộ, tách rời (decoupling) và chịu tải rất cao.' },
  { id: 'kafka-2', topic: 'kafka', level: 'medium', q: 'Broker và Zookeeper trong Kafka khác nhau thế nào?',
    points: ['Broker: server Kafka lưu partition & phục vụ read/write; cluster nhiều broker', 'Zookeeper: quản lý metadata, bầu controller/leader, cấu hình cluster', 'Bản mới thay Zookeeper bằng KRaft'],
    answer: 'Broker là "nhân viên kho" — chính các server Kafka lưu trữ partition và phục vụ ghi/đọc; nhiều broker hợp thành cluster để phân tán và nhân bản dữ liệu. Zookeeper (kiến trúc cũ) là "ban quản lý" đứng ngoài: giữ metadata cluster, bầu chọn controller/leader và lưu cấu hình. Kafka bản mới gộp luôn vai trò quản lý đó vào cluster qua KRaft nên bỏ được Zookeeper cho gọn.' },
  { id: 'kafka-3', topic: 'kafka', level: 'hard', q: 'Vì sao trong một consumer group, một partition chỉ được consume bởi một consumer?',
    points: ['Giữ thứ tự trong partition & tránh xử lý trùng trong group', 'Partition là đơn vị song song → consumer hữu ích tối đa = số partition', 'Group khác vẫn đọc độc lập cùng dữ liệu'],
    answer: 'Quy tắc "một partition chỉ một consumer trong group" giống mỗi thùng hàng chỉ giao cho đúng một người bốc: nhờ vậy message trong partition giữ nguyên thứ tự và không bị hai consumer xử lý trùng. Hệ quả cần nhớ: độ song song tối đa của một group đúng bằng số partition, thêm consumer dư sẽ ngồi không. Còn các consumer group khác nhau thì độc lập, mỗi group vẫn đọc được toàn bộ dữ liệu của topic.' },
  { id: 'kafka-4', topic: 'kafka', level: 'medium', q: 'Làm sao đảm bảo xử lý message theo đúng thứ tự?',
    points: ['Kafka chỉ đảm bảo thứ tự TRONG một partition', 'Dùng message key để message liên quan vào cùng partition', 'Cùng key → cùng partition → một consumer xử lý tuần tự'],
    answer: 'Điểm mấu chốt: Kafka chỉ đảm bảo thứ tự TRONG một partition, chứ không trên cả topic. Muốn các message liên quan (vd cùng một tài khoản) giữ đúng thứ tự, hãy đặt cùng một message key cho chúng — Kafka băm key để dồn chúng vào cùng một partition, nhờ đó một consumer xử lý tuần tự. Mẹo nhớ: "cùng key → cùng partition → cùng thứ tự".' },
  { id: 'kafka-5', topic: 'kafka', level: 'hard', q: 'Xử lý message lỗi trong Kafka như thế nào?',
    points: ['Retry có giới hạn (kèm backoff) cho lỗi tạm thời', 'Hết retry → đẩy sang Dead Letter Topic (DLT)', 'Consumer nên idempotent để retry an toàn', 'Tránh chặn cả partition'],
    answer: 'Với message lỗi, trước hết retry có giới hạn kèm backoff cho các lỗi tạm thời (mạng chập chờn, DB bận). Nếu retry mãi vẫn hỏng thì đẩy message sang Dead Letter Topic (DLT) — như "hộp thư lỗi" để điều tra/tái xử lý sau — nhằm không để một message độc chặn đứng cả partition. Quan trọng: consumer phải idempotent (xử lý lại cùng message không gây tác dụng phụ trùng lặp) thì retry mới an toàn.' },
  { id: 'kafka-6', topic: 'kafka', level: 'easy', q: 'Offset trong Kafka là gì?',
    points: ['Chỉ số tuần tự vị trí message trong một partition', 'Consumer commit offset để biết đã đọc tới đâu', 'Reset offset để đọc lại từ đầu/mốc thời gian'],
    answer: 'Offset là số thứ tự đánh dấu vị trí một message trong một partition, giống số trang trong một cuốn sách. Consumer commit offset đã xử lý để lần sau — kể cả sau khi restart hay rebalance — biết đọc tiếp từ đâu mà không phải đọc lại từ đầu. Khi cần, có thể reset offset để tua lại từ đầu partition hoặc từ một mốc thời gian.' },
  { id: 'kafka-7', topic: 'kafka', level: 'medium', q: 'Tham số acks của producer Kafka nghĩa là gì?',
    points: ['acks=0: gửi không chờ xác nhận (nhanh, dễ mất)', 'acks=1: leader ghi xong là ok', 'acks=all: mọi replica in-sync (ISR) xác nhận (bền nhất, chậm hơn)'],
    answer: 'acks là mức "biên nhận" producer chờ trước khi coi việc gửi là thành công: acks=0 gửi rồi đi luôn không chờ (nhanh nhất nhưng dễ mất message), acks=1 chỉ cần leader ghi xong là yên tâm, acks=all (hoặc -1) chờ mọi bản sao in-sync (ISR) xác nhận nên bền nhất nhưng chậm hơn. Bản chất là đổi độ trễ lấy độ an toàn, tùy bạn chấp nhận mất dữ liệu tới đâu.' },
  { id: 'kafka-8', topic: 'kafka', level: 'medium', q: 'Làm sao tăng tốc/throughput khi có quá nhiều message?',
    points: ['Tăng số partition + consumer trong group (song song)', 'Producer gửi theo batch + bật nén (compression)', 'Tối ưu xử lý consumer, commit hợp lý', 'Scale thêm broker'],
    answer: 'Vì partition là đơn vị song song, cách tăng throughput cốt lõi là tăng số partition rồi thêm consumer trong group để mở nhiều "làn" chạy cùng lúc. Kèm theo: cho producer gửi theo batch và bật nén (compression) để đỡ chi phí mạng, tối ưu logic consumer (xử lý hàng loạt/bất đồng bộ) và commit offset hợp lý, và scale thêm broker khi cần. Nhớ cái trần: số consumer hữu ích tối đa trong một group = số partition.' },

  // ---------- Microservice ----------
  { id: 'micro-1', topic: 'microservice', level: 'medium', q: 'Monolithic và Microservice khác nhau thế nào? Đánh đổi?',
    points: ['Monolith: 1 ứng dụng/triển khai — đơn giản lúc nhỏ, khó scale/độc lập từng phần', 'Microservice: nhiều service nhỏ tự trị, deploy/scale riêng', 'Đổi lại: phức tạp vận hành, mạng, dữ liệu phân tán, giám sát'],
    answer: 'Monolith gói toàn bộ chức năng vào một ứng dụng, một lần triển khai — như một căn nhà nguyên khối: gọn và đơn giản khi còn nhỏ, nhưng khó scale riêng từng phần và một lỗi có thể kéo sập cả nhà. Microservice tách thành nhiều service nhỏ tự trị, mỗi cái deploy/scale/chọn công nghệ độc lập — đổi lại là phức tạp về vận hành, giao tiếp mạng, nhất quán dữ liệu phân tán và giám sát. Vì thế chỉ nên đi microservice khi hệ thống và đội ngũ đã đủ lớn.' },
  { id: 'micro-2', topic: 'microservice', level: 'medium', q: 'Các service giao tiếp với nhau bằng cách nào?',
    points: ['Đồng bộ: REST/gRPC (request-response)', 'Bất đồng bộ: message/event qua Kafka/RabbitMQ', 'Sync đơn giản nhưng coupling & phải chờ; async decoupling & chịu tải tốt hơn'],
    answer: 'Có hai kiểu giao tiếp. Đồng bộ (REST/gRPC theo request-response) giống gọi điện thoại: đơn giản, dễ debug nhưng gắn kết chặt và bên gọi phải đứng chờ trả lời. Bất đồng bộ qua message/event (Kafka, RabbitMQ) giống gửi thư: tách rời, chịu tải và chịu lỗi tốt hơn nhưng khó theo dõi luồng end-to-end. Thực tế thường phối hợp cả hai tùy trường hợp.' },
  { id: 'micro-3', topic: 'microservice', level: 'medium', q: 'API Gateway là gì? Dùng để làm gì?',
    points: ['Cổng vào duy nhất cho client', 'Định tuyến tới service, có thể gộp request', 'Xử lý cross-cutting: auth, rate limit, logging, SSL, cache', 'Ẩn cấu trúc nội bộ'],
    answer: 'API Gateway là "cổng bảo vệ" duy nhất đứng trước cụm microservice: mọi request của client đi qua đây, được định tuyến tới service phù hợp và có thể gộp nhiều lời gọi thành một. Nó cũng gánh các việc chung (cross-cutting) như xác thực, rate limiting, logging, SSL, caching để từng service khỏi phải lặp lại. Nhờ vậy client không cần biết cấu trúc nội bộ bên trong.' },
  { id: 'micro-4', topic: 'microservice', level: 'hard', q: 'Service Discovery giải quyết vấn đề gì?',
    points: ['Instance scale/đổi IP động → không hardcode địa chỉ', 'Registry (Eureka/Consul/K8s DNS) để đăng ký & tra cứu', 'Client-side vs server-side discovery', 'Thường kèm load balancing'],
    answer: 'Trong hệ phân tán, các instance service liên tục lên/xuống và đổi IP (auto-scale, restart) nên hardcode địa chỉ là hỏng ngay. Service Discovery dùng một registry (Eureka, Consul, Kubernetes DNS) như "danh bạ sống": service tự đăng ký khi khởi động và bên gọi tra cứu địa chỉ hiện có, thường kèm cân bằng tải. Có hai kiểu: client-side (client hỏi registry rồi tự chọn instance) và server-side (đi qua load balancer/gateway lo giúp).' },
  { id: 'micro-5', topic: 'microservice', level: 'hard', q: 'Quản lý transaction xuyên nhiều service (phân tán) thế nào? SAGA là gì?',
    points: ['Mỗi service DB riêng → khó ACID/2PC → dùng SAGA', 'SAGA: chuỗi giao dịch cục bộ + hành động bù trừ (compensation) khi lỗi', 'Orchestration (điều phối trung tâm) vs Choreography (theo event)', 'Chấp nhận eventual consistency'],
    answer: 'Vì mỗi service có database riêng nên không thể bọc chung trong một transaction ACID duy nhất; giải pháp phổ biến là SAGA — tách thành chuỗi giao dịch cục bộ nối tiếp, nếu một bước lỗi thì chạy hành động bù trừ (compensation) để "hoàn tác" các bước trước, chấp nhận nhất quán cuối (eventual consistency). SAGA có hai kiểu: Orchestration (một nhạc trưởng trung tâm ra lệnh từng bước) và Choreography (không nhạc trưởng, các service tự phản ứng theo event của nhau).' },
  { id: 'micro-6', topic: 'microservice', level: 'hard', q: 'Circuit Breaker là gì? Vì sao cần trong hệ microservice?',
    points: ['Ngăn một service lỗi/chậm kéo sập cả chuỗi gọi (cascading failure)', '3 trạng thái: Closed (bình thường) -> Open (cắt, trả lỗi/fallback ngay) -> Half-Open (thử lại dè chừng)', 'Kèm timeout + fallback (Resilience4j, Hystrix cũ)'],
    answer: 'Circuit Breaker mượn ý tưởng cầu dao điện: nó theo dõi tỉ lệ lỗi khi gọi một service phụ thuộc, nếu vượt ngưỡng thì "ngắt mạch" (Open) — các lời gọi sau bị chặn và trả lỗi/fallback ngay thay vì ngồi chờ timeout. Nhờ vậy một service đang chết không kéo sập cả chuỗi service gọi lẫn nhau (cascading failure). Sau một khoảng thời gian nó sang Half-Open thử vài request dò đường; ổn thì đóng lại về Closed (bình thường). Thường triển khai bằng Resilience4j (Hystrix đã ngừng phát triển).' },
  { id: 'micro-7', topic: 'microservice', level: 'medium', q: 'Distributed tracing là gì? Vì sao cần khi debug microservice?',
    points: ['Một request đi qua nhiều service -> cần theo dõi xuyên suốt', 'Trace ID gắn xuyên suốt mọi service trong cùng 1 request, Span ID cho từng bước', 'Công cụ: Zipkin, Jaeger, OpenTelemetry'],
    answer: 'Một request thật thường đi xuyên nhiều service, nên nếu chỉ soi log rời rạc của từng service thì rất khó ghép lại để biết nó chậm/lỗi ở đâu. Distributed tracing gắn một Trace ID duy nhất theo suốt hành trình request (propagate qua header), và mỗi chặng xử lý ở từng service là một Span có Span ID riêng — như bưu kiện có mã vận đơn được quét ở mỗi trạm. Công cụ như Zipkin/Jaeger/OpenTelemetry ráp các span thành một biểu đồ timeline, chỉ ngay ra service nào đang là nút thắt.' },
  { id: 'micro-8', topic: 'microservice', level: 'medium', q: 'Vì sao mỗi microservice nên có database riêng (Database per Service)?',
    points: ['Tách rời triển khai/scale độc lập, đổi schema không ảnh hưởng service khác', 'Tránh coupling ngầm qua DB dùng chung (service khác đọc thẳng bảng nội bộ)', 'Đánh đổi: khó JOIN xuyên service, cần API/event để lấy dữ liệu tổng hợp'],
    answer: 'Nếu nhiều service xài chung một database, chúng bị coupling ngầm qua schema — đổi một cột có thể phá vỡ service khác đang đọc thẳng bảng đó, và không thể scale/deploy độc lập thật sự. Database per Service tách hẳn dữ liệu để mỗi service toàn quyền với schema của mình, ranh giới rõ ràng. Đánh đổi là không JOIN trực tiếp xuyên service được nữa — phải gọi API hoặc dùng event/CQRS để tổng hợp dữ liệu liên service.' },

  // ---------- System Design ----------
  { id: 'design-1', topic: 'design', level: 'medium', q: 'Thiết kế URL Shortener (kiểu bit.ly) — các bước chính?',
    points: ['1) Làm rõ yêu cầu: QPS đọc/ghi, custom alias, hết hạn link', '2) Sinh mã ngắn: base62 encode một ID tăng dần, hoặc hash + xử lý va chạm', '3) Schema: shortCode -> longUrl, index trên shortCode', '4) Đọc nhiều hơn ghi rất nhiều -> cache (Redis) trước DB', '5) Redirect dùng 301 (cache ở browser) hay 302 (đo được click) tùy nhu cầu'],
    answer: 'Trả lời theo các bước để thể hiện tư duy thiết kế. (1) Làm rõ yêu cầu: tỉ lệ đọc/ghi, có cho đặt alias riêng không, link có hết hạn không. (2) Cách sinh mã ngắn — hoặc encode base62 một ID tự tăng (đơn giản, đảm bảo không đụng độ), hoặc hash long URL rồi xử lý va chạm. (3) Schema tối giản `{shortCode, longUrl, createdAt, expiresAt}`, đánh index theo `shortCode`. (4) Vì lượt ĐỌC (redirect) áp đảo lượt ghi, đặt cache (Redis) trước DB cho các mã hot. (5) Chọn kiểu redirect: 301 (trình duyệt cache lại, nhẹ server nhưng khó đếm click) hay 302 (không cache, đo được số lượt click) — tùy có cần thống kê không. Điểm mấu chốt: đây là hệ ĐỌC-NẶNG nên cache là trung tâm.' },
  { id: 'design-2', topic: 'design', level: 'hard', q: 'Thiết kế Rate Limiter cho một API — cách tiếp cận?',
    points: ['Thuật toán: Token Bucket (cho phép burst) hoặc Sliding Window (chính xác hơn Fixed Window)', 'Lưu bộ đếm ở Redis (INCR + EXPIRE) để dùng chung cho nhiều instance server', 'Key theo user/IP/API key + endpoint', 'Vượt ngưỡng -> trả 429 Too Many Requests + header Retry-After'],
    answer: 'Chọn thuật toán trước: Token Bucket cho phép burst ngắn (token nạp đều vào "xô", mỗi request tiêu 1 token — hết token thì bị chặn), hoặc Sliding Window chính xác hơn Fixed Window (Fixed Window dính lỗi kinh điển: cho phép gấp đôi giới hạn ngay ranh giới hai cửa sổ). Điểm quan trọng khi có NHIỀU instance server: bộ đếm phải DÙNG CHUNG — lưu ở Redis (`INCR` + `EXPIRE`, hoặc script Lua cho atomic) thay vì đếm riêng trong RAM từng instance (đếm riêng thì tổng vượt xa giới hạn). Khóa đếm theo user/IP/API key + endpoint. Vượt ngưỡng thì trả `429 Too Many Requests` kèm header `Retry-After` để client biết chờ bao lâu.' },
  { id: 'design-3', topic: 'design', level: 'hard', q: 'Ước lượng capacity/QPS — cách tiếp cận khi được hỏi "hệ thống cần bao nhiêu server"?',
    points: ['Suy ra QPS trung bình từ DAU × số request/user/ngày ÷ 86400 giây', 'Peak QPS thường gấp 2-5 lần trung bình (giờ cao điểm)', 'Ước lượng storage: số bản ghi × kích thước trung bình × thời gian lưu', 'Không cần số chính xác — quan trọng là THỂ HIỆN CÁCH TÍNH hợp lý'],
    answer: 'Không ai kỳ vọng con số chính xác — interviewer chấm CÁCH bạn ước lượng có logic. Trình tự: từ DAU suy ra QPS. Ví dụ DAU 10 triệu, mỗi user ~5 request/ngày → 50 triệu request/ngày ÷ 86400s ≈ 580 QPS trung bình; nhân hệ số PEAK giờ cao điểm (thường 2–5x) ≈ 1500–3000 QPS đỉnh; chia cho năng lực mỗi instance (vài trăm QPS) ra số instance cần. Storage ước tương tự: số bản ghi mới/ngày × kích thước trung bình mỗi bản ghi × số ngày lưu. Mẹo: nói to giả định của mình và làm tròn (86400 ≈ 100k cho dễ nhẩm) — họ muốn nghe bạn lập luận, không phải bấm máy tính.' },
  { id: 'design-4', topic: 'design', level: 'medium', q: 'Thiết kế API phân trang (pagination) cho danh sách lớn — offset hay cursor?',
    points: ['Offset/limit (?page=5&size=20): đơn giản nhưng chậm dần khi offset lớn (DB phải quét/skip)', 'Cursor-based (?after=<id_hoặc_encoded_key>): dùng keyset trên cột index, ổn định hơn khi dữ liệu bị thêm/xóa giữa các trang', 'Offset hợp UI có số trang; cursor hợp infinite-scroll/feed lớn'],
    answer: 'Offset/limit dễ làm và cho phép NHẢY thẳng tới trang N, nhưng có hai điểm yếu: chậm dần khi offset lớn (DB vẫn phải quét rồi BỎ hết các dòng phía trước), và dễ trả trùng/sót record nếu dữ liệu bị thêm/xóa giữa các lần gọi. Cursor-based (keyset pagination) lấy giá trị của cột có index (thường `id` hoặc `created_at`) của phần tử cuối trang trước làm mốc "lấy tiếp từ đây" — tốc độ ỔN ĐỊNH bất kể sâu bao nhiêu và không lệch khi dữ liệu thay đổi. Chọn theo UI: cursor cho feed/infinite-scroll (chỉ cần next liên tục); offset khi cần hiện số trang 1,2,3… và tổng số trang.' },
  { id: 'design-5', topic: 'design', level: 'medium', q: 'Khi nào thêm cache (Redis) vào hệ thống? Chọn chiến lược ghi nào?',
    points: ['Thêm khi: đọc nhiều hơn ghi rất nhiều, dữ liệu ít đổi, truy vấn tính toán nặng lặp lại', 'Cache-aside (lazy loading): app tự đọc cache trước, miss thì query DB rồi ghi lại cache — phổ biến nhất', 'Write-through: ghi cache đồng thời với DB — dữ liệu luôn mới nhưng chậm hơn khi ghi', 'Luôn đặt TTL để tránh dữ liệu cũ vĩnh viễn nếu quên invalidate'],
    answer: 'Thêm cache khi: tỉ lệ đọc/ghi lệch hẳn về ĐỌC, dữ liệu ít đổi, hoặc một truy vấn tốn kém bị lặp lại nhiều (dashboard, bảng xếp hạng, danh sách top). Chiến lược phổ biến nhất là cache-aside (lazy loading): app đọc cache trước, TRƯỢT thì query DB rồi tự ghi ngược kết quả vào cache cho lần sau. Write-through thì ghi cache + DB CÙNG LÚC mỗi lần ghi — cache luôn mới nhưng thao tác ghi chậm hơn. Dù chọn cách nào cũng luôn đặt TTL hợp lý làm "lưới an toàn": lỡ quên invalidate khi update DB thì dữ liệu cũ cũng tự hết hạn, không tồn tại vĩnh viễn. Nhớ câu đùa: "hai thứ khó nhất trong lập trình là đặt tên biến và invalidate cache".' },
  { id: 'design-6', topic: 'design', level: 'hard', q: 'Idempotency cho API thanh toán/đặt hàng ở mức nâng cao hơn scenario cơ bản — cần thêm gì?',
    points: ['Idempotency key kèm response cache: request lặp trả NGUYÊN response cũ (kể cả status code), không chỉ né tạo trùng', 'TTL cho key (vd 24h) để không phình bảng vô hạn', 'Xử lý trường hợp request đầu ĐANG xử lý dở mà request lặp tới (lock theo key hoặc trạng thái "processing")'],
    answer: 'Mức cơ bản, idempotency key chỉ chặn TẠO TRÙNG bản ghi. Mức nâng cao còn LƯU LẠI response của lần xử lý đầu (cả status code lẫn body) gắn với key đó — request lặp cùng key sẽ nhận NGUYÊN response cũ thay vì tính lại hay báo lỗi, đảm bảo client thấy kết quả nhất quán dù retry. Key nên có TTL (vd 24–48h) để bảng lưu không phình mãi. Ca khó nhất: request lặp ập tới trong khi request ĐẦU còn đang xử lý DỞ (chưa có response để trả) — cần một trạng thái "processing" tạm (lock theo key hoặc unique constraint) để request lặp biết CHỜ/thử lại, thay vì cả hai chạy song song rồi tạo trùng.' },
  { id: 'design-7', topic: 'design', level: 'hard', q: 'Thiết kế hệ thống thông báo (Notification System) gửi email/SMS/push cho hàng triệu user — những điểm chính?',
    points: ['Tách API nhận yêu cầu gửi (nhanh, trả 202 ngay) khỏi worker gửi thật (qua message queue)', 'Queue (Kafka/RabbitMQ) đệm request, worker scale ngang xử lý theo tốc độ nhà cung cấp (SES/Twilio…) cho phép', 'Retry + backoff khi provider lỗi tạm thời; Dead Letter Queue cho lỗi vĩnh viễn', 'Template hóa nội dung theo loại thông báo + throttling theo user để tránh spam'],
    answer: 'Chìa khóa là TÁCH nhận-yêu-cầu khỏi gửi-thật. API nhận yêu cầu nên trả về NGAY (`202 Accepted`) rồi đẩy việc gửi vào message queue (Kafka/RabbitMQ) thay vì gửi đồng bộ — vì nhà cung cấp email/SMS (SES, Twilio) có giới hạn tốc độ và độ trễ riêng, gửi đồng bộ sẽ làm treo request và sập khi tải cao. Worker đọc queue, scale ngang theo tải, gửi đúng nhịp nhà cung cấp cho phép, retry có backoff khi lỗi tạm thời, và đẩy sang Dead Letter Queue nếu lỗi vĩnh viễn (email sai định dạng) để một message hỏng không chặn cả hàng đợi. Thêm: template hóa nội dung theo loại thông báo, và throttling theo user (tối đa N thông báo/giờ) để tránh spam.' },

  // ---------- Hạ tầng thực tế (Docker/CI-CD/Redis/Observability) ----------
  { id: 'infra-1', topic: 'infra', level: 'easy', q: 'Docker container khác Virtual Machine (VM) thế nào?',
    points: ['Container chia sẻ chung OS kernel của host -> nhẹ, khởi động giây', 'VM ảo hóa cả phần cứng + có OS riêng -> nặng, khởi động phút', 'Image = bản đóng gói bất biến (app + dependency); container = instance đang chạy của image'],
    answer: 'Container ảo hóa ở tầng HỆ ĐIỀU HÀNH: nhiều container chia sẻ chung kernel của host nên rất nhẹ, khởi động trong vài giây, đóng gói gọn đúng app + dependency cần thiết. VM ảo hóa cả PHẦN CỨNG, mỗi VM chạy một OS đầy đủ riêng nên nặng hơn nhiều, khởi động mất vài phút — đổi lại cô lập mạnh hơn. Mẹo nhớ quan hệ image–container giống class–object: image là bản đóng gói BẤT BIẾN (như class/khuôn đúc), còn container là một INSTANCE đang chạy sinh ra từ image đó (như object). Cùng một image chạy được nhiều container y hệt nhau.' },
  { id: 'infra-2', topic: 'infra', level: 'medium', q: 'Dockerfile cho một app Spring Boot thường gồm những bước gì? Multi-stage build để làm gì?',
    points: ['FROM base image (JDK để build, JRE để chạy) -> COPY source -> RUN build (mvn/gradle) -> COPY jar -> ENTRYPOINT java -jar', 'Multi-stage: 1 stage build (có JDK+Maven, image to) -> 1 stage runtime (chỉ JRE + jar, image nhỏ)', 'Multi-stage giảm size image cuối, không mang theo công cụ build không cần lúc chạy'],
    answer: 'Cấu trúc cơ bản: chọn base image → `COPY` source → `RUN` lệnh build (`mvn package`/`gradle build`) ra file jar → `ENTRYPOINT ["java","-jar","app.jar"]`. Multi-stage build tách làm 2 giai đoạn: stage ĐẦU dùng image đầy đủ JDK + Maven/Gradle để build ra jar (image này TO nhưng chỉ dùng tạm lúc build); stage SAU chỉ `COPY` riêng file jar đã build sang một image JRE gọn nhẹ để chạy. Kết quả: image cuối NHỎ hơn nhiều vì không vác theo cả bộ công cụ build không cần lúc runtime — nhẹ hơn, deploy nhanh hơn, và ít lỗ hổng bảo mật hơn (ít thứ trong image).' },
  { id: 'infra-3', topic: 'infra', level: 'medium', q: 'CI/CD pipeline cho một service Java thường có những bước nào?',
    points: ['CI: mỗi lần push -> checkout -> build -> chạy unit test -> (chạy static analysis/lint)', 'Build Docker image -> push lên registry (nếu pass hết)', 'CD: deploy tự động lên staging; deploy production thường cần approve/gate thủ công hoặc theo nhánh', 'Fail sớm: test nhanh chạy trước, integration test chậm chạy sau'],
    answer: 'CI (Continuous Integration): mỗi lần push code, pipeline TỰ ĐỘNG checkout → build → chạy unit test (và thường cả lint/static analysis) — nguyên tắc "fail sớm": xếp test nhanh chạy trước để lỗi lộ ra ngay, khỏi phí thời gian các bước sau. Nếu xanh hết thì build Docker image và push lên container registry. CD (Continuous Delivery/Deployment): tự động deploy lên STAGING; còn deploy PRODUCTION thường có thêm cổng kiểm soát — approve thủ công hoặc gate theo nhánh (chỉ `main`/`release` mới được lên prod) để giảm rủi ro. Tinh thần chung: tự động hóa để mỗi lần release nhỏ, thường xuyên và ít đau.' },
  { id: 'infra-4', topic: 'infra', level: 'medium', q: 'Dùng Redis làm cache khác gì so với dùng làm session store hay message queue?',
    points: ['Cache: lưu tạm kết quả tính toán/query tốn kém, có TTL, mất thì query lại DB được (không phải nguồn sự thật)', 'Session store: lưu trạng thái đăng nhập user, cần persistence tốt hơn (mất session -> user bị đăng xuất)', 'Redis Streams/Pub-Sub: dùng làm message queue nhẹ, không bền/mạnh bằng Kafka cho khối lượng lớn'],
    answer: 'Khác nhau chủ yếu ở mức độ QUAN TRỌNG của dữ liệu. Làm cache: Redis chỉ giữ bản sao TẠM của dữ liệu vốn nằm ở DB, có TTL — mất dữ liệu cache thì hệ thống vẫn ĐÚNG, chỉ chậm hơn vì phải query lại DB; Redis không phải "nguồn sự thật". Làm session store: lưu trạng thái đăng nhập, giờ phải quan tâm PERSISTENCE (AOF/RDB) hơn, vì mất dữ liệu này là user bị đăng xuất hàng loạt. Làm message queue (Redis Streams/Pub-Sub): ổn cho khối lượng vừa phải và độ trễ thấp, nhưng thiếu các tính năng bền vững/replay/partition mạnh như Kafka cho hệ thống lớn. Cùng một công cụ, kỳ vọng về độ bền khác nhau tùy vai trò.' },
  { id: 'infra-5', topic: 'infra', level: 'hard', q: 'Ba trụ cột của Observability (quan sát hệ thống) là gì?',
    points: ['Logs: sự kiện rời rạc, chi tiết, tìm lỗi cụ thể', 'Metrics: số liệu theo thời gian (CPU, QPS, error rate, latency) -> vẽ dashboard, đặt alert', 'Traces: theo dấu một request xuyên nhiều service (xem thêm chủ đề Microservice)'],
    answer: 'Ba trụ cột bổ trợ nhau, nhớ theo vai trò. Logs: sự kiện RỜI RẠC, chi tiết từng dòng — trả lời "chuyện gì đã xảy ra" ở một request/lỗi cụ thể. Metrics: số liệu đo THEO THỜI GIAN (CPU, RAM, QPS, error rate, latency p95/p99) — tổng hợp thành dashboard và đặt ALERT khi vượt ngưỡng. Traces: theo dấu đường đi của MỘT request xuyên qua nhiều service để biết nó chậm/lỗi ở bước nào (distributed tracing). Cách phối hợp dễ nhớ: METRIC báo "có sự cố" (chuông reo), rồi TRACE + LOG giúp truy ra "sự cố ở đâu, vì sao".' },
  { id: 'infra-6', topic: 'infra', level: 'medium', q: 'REST và gRPC khác nhau thế nào? Khi nào chọn gRPC?',
    points: ['REST: JSON qua HTTP/1.1, dễ đọc/debug, phổ biến cho public API', 'gRPC: Protocol Buffers (binary) qua HTTP/2, nhanh hơn, hỗ trợ streaming hai chiều', 'gRPC hợp giao tiếp internal service-to-service hiệu năng cao; REST hợp API public/dễ tích hợp'],
    answer: 'REST truyền JSON (text, đọc/debug bằng mắt được) qua HTTP/1.1, được hỗ trợ ở khắp nơi nên hợp cho API PUBLIC — client nào cũng gọi được dễ. gRPC dùng Protocol Buffers (định dạng NHỊ PHÂN, nhỏ gọn và nhanh hơn JSON) qua HTTP/2, hỗ trợ streaming hai chiều và có contract chặt (`.proto`) tự sinh code client/server. Chọn gRPC cho giao tiếp NỘI BỘ service-to-service cần hiệu năng cao và độ trễ thấp; REST vẫn là mặc định cho API hướng RA NGOÀI vì phổ dụng và dễ tích hợp. Mẹo nhớ: REST = dễ đọc cho người, gRPC = nhanh cho máy.' },
  { id: 'infra-7', topic: 'infra', level: 'medium', q: 'API versioning là gì? Các cách làm phổ biến?',
    points: ['Mục đích: đổi API mà không phá vỡ client cũ đang dùng bản trước', 'URI versioning: /api/v1/users, /api/v2/users (đơn giản, dễ thấy nhất)', 'Header versioning: Accept: application/vnd.api+json;version=2 (URL sạch hơn nhưng khó test bằng tay hơn)'],
    answer: 'API versioning cho phép bạn thay đổi/breaking-change một API mà KHÔNG làm hỏng các client cũ vẫn đang gọi bản trước — như xây cầu mới rồi mới tháo cầu cũ. Cách phổ biến nhất là URI versioning (`/api/v1/users` vs `/api/v2/users`): đơn giản, nhìn URL là biết version, dễ test bằng trình duyệt/curl. Header versioning (đặt version trong `Accept` header hoặc header tùy biến) giữ URL sạch hơn nhưng khó thao tác tay và dễ bị quên set header. Dù chọn cách nào cũng cần chính sách rõ ràng về thời gian còn hỗ trợ version cũ trước khi khai tử (deprecation), và báo trước cho bên tiêu thụ.' },

  // ---------- Tình huống & Thiết kế (scenario/behavioral-kỹ thuật) ----------
  { id: 'scn-1', topic: 'scenario', level: 'medium', q: 'Thiết kế API "đặt hàng" sao cho user bấm submit nhiều lần (double-click, mạng lag rồi retry) không tạo hai đơn trùng?',
    points: ['Idempotency key do client sinh, gửi kèm request', 'Server lưu key đã xử lý (unique constraint) trước khi tạo đơn', 'Request lặp cùng key -> trả lại kết quả cũ, không tạo mới', 'Disable nút submit + loading state ở FE chỉ là phòng ngừa phụ, không đủ'],
    answer: 'Chìa khóa là idempotency key — hãy hình dung như "số vé" duy nhất cho MỘT lần đặt hàng: client sinh key này một lần và giữ nguyên qua mọi lần retry, gửi kèm request. Server đăng ký key vào DB với ràng buộc UNIQUE TRƯỚC khi tạo đơn, nên request thứ hai cùng key sẽ đụng ràng buộc và chỉ được trả lại kết quả cũ, không tạo đơn mới. Disable nút hay debounce ở frontend chỉ là "hàng rào mềm" giảm xác suất chứ không chắc chắn, vì trình duyệt/mạng vẫn có thể tự retry sau lưng bạn. Nhớ: chống trùng phải nằm ở server, không phải ở nút bấm.' },
  { id: 'scn-2', topic: 'scenario', level: 'hard', q: 'Một endpoint GET đang chậm dần theo thời gian dù traffic không đổi — bạn khoanh vùng nguyên nhân thế nào?',
    points: ['Xem metrics/log trước: latency tăng từ khi nào, tương quan với gì (data tăng, deploy, cấu hình)', 'Bật slow query log / APM xem query nào chậm', 'Nghi ngờ: thiếu index khi bảng phình to, N+1 lộ dần theo data, connection pool cạn, GC pause tăng', 'Tái hiện ở staging với data cỡ thật rồi đo, không đoán mò'],
    answer: 'Nguyên tắc: đo trước, đoán sau. Đầu tiên nhìn dữ liệu quan sát được — latency bắt đầu leo từ mốc nào, có trùng với một đợt deploy, tăng traffic hay dữ liệu phình to không — vì mốc thời gian thường chỉ thẳng vào thủ phạm. Rồi đào sâu bằng slow query log/APM (New Relic...) để thấy query hay bước nào chậm. Từ khóa "chậm DẦN" (không phải sập đột ngột) gợi ý nguyên nhân tỉ lệ với dữ liệu: thiếu index nên full-scan ngày càng nặng khi bảng lớn lên, N+1 lộ rõ dần theo số dòng, connection pool cạn khiến request phải xếp hàng, hoặc GC pause tăng vì heap đầy dần (rò rỉ bộ nhớ). Cuối cùng tái hiện ở môi trường có dữ liệu cỡ thật để đo, fix rồi đo lại — không sửa mò.' },
  { id: 'scn-3', topic: 'scenario', level: 'medium', q: 'Thiết kế rate limiting cho một API public — đặt ở đâu và theo thuật toán nào?',
    points: ['Đặt ở API Gateway/tầng biên là tốt nhất (chặn sớm, đỡ tải app)', 'Có thể thêm lớp trong app nếu cần rule theo nghiệp vụ (per user/plan)', 'Thuật toán: fixed window (đơn giản, có "burst" ở biên), sliding window / token bucket (mượt hơn)', 'Vượt hạn mức -> trả 429 kèm Retry-After'],
    answer: 'Rate limiting nên đặt càng gần "cửa vào" càng tốt — ở API Gateway/reverse proxy — để request thừa bị chặn ngay ở biên, không tốn tài nguyên app phía sau; thêm một lớp trong ứng dụng khi cần luật theo nghiệp vụ (hạn mức khác nhau theo user/gói dịch vụ). Về thuật toán: fixed window đơn giản nhưng dính lỗi "burst" ở ranh giới (dồn hai cửa sổ sát nhau thành gấp đôi hạn mức); sliding window hoặc token bucket mượt và công bằng hơn — token bucket còn cho "dồn phiếu" để chịu được burst ngắn hợp lý. Khi vượt hạn mức, trả HTTP 429 kèm header Retry-After để client biết chờ bao lâu rồi hãy gọi lại.' },
  { id: 'scn-4', topic: 'scenario', level: 'medium', q: 'Webhook nhận thông báo thanh toán từ bên thứ ba có thể bị gửi trùng (retry) — làm sao không cộng tiền hai lần?',
    points: ['Coi mỗi webhook như KHÔNG idempotent theo mặc định — luôn có thể trùng', 'Lưu id sự kiện (event id từ payload) đã xử lý, kiểm tra trước khi áp dụng', 'Ràng buộc unique ở DB cho event id, xử lý trong transaction', 'Trả 200 ngay cả khi trùng để bên gửi ngưng retry'],
    answer: 'Luôn coi webhook là "có thể đến trùng" theo mặc định, vì bên gửi sẽ retry mỗi khi chưa nhận được ACK kịp — không trùng mới là ngoại lệ. Cách chống cộng tiền hai lần: lấy event id duy nhất trong payload, chèn vào bảng processed_events có ràng buộc UNIQUE trên event id TRƯỚC khi cộng tiền/đổi trạng thái, và gói cả hai bước trong cùng một transaction để tránh race. Nhờ UNIQUE, lần thứ hai cùng event id sẽ bị chặn ngay từ cửa. Dù là bản trùng hay không, vẫn trả HTTP 200 để bên gửi biết đã nhận và ngừng gửi lại.' },
  { id: 'scn-5', topic: 'scenario', level: 'hard', q: 'Thiết kế phân trang cho một danh sách rất lớn (hàng chục triệu dòng) với UI cuộn vô hạn — chọn cơ chế nào?',
    points: ['Tránh OFFSET/LIMIT vì càng về sau càng chậm (DB vẫn phải quét bỏ)', 'Dùng keyset/seek pagination: WHERE (sort_col, id) > (giá trị trang trước) LIMIT n', 'Cần index đúng theo cột sort + id để tận dụng', 'Đánh đổi: không nhảy thẳng tới "trang số N" được, chỉ next/prev tuần tự'],
    answer: 'Với dữ liệu khổng lồ và UI cuộn vô hạn (chỉ cần "trang kế", không cần nhảy tới trang bất kỳ), keyset/seek pagination là lựa chọn đúng: thay vì OFFSET/LIMIT, ta ghi nhớ mốc cuối của trang trước rồi lọc tiếp `WHERE (created_at, id) > (:lastCreatedAt, :lastId) ORDER BY created_at, id LIMIT n`. Vì sao? OFFSET lớn buộc DB vẫn phải quét rồi VỨT BỎ hàng triệu dòng đầu, nên càng lật sâu càng chậm; còn keyset nhảy thẳng vào đúng chỗ nhờ index nên tốc độ ổn định bất kể ở trang nào. Điều kiện: phải có index đúng trên cặp cột dùng để sort/lọc. Đánh đổi duy nhất là không nhảy thẳng "trang 500" được, chỉ đi tuần tự next/prev — điều mà infinite scroll vốn không cần.' },
  { id: 'scn-6', topic: 'scenario', level: 'medium', q: 'Cần đổi cấu trúc response của một API đang có breaking change, nhưng client cũ vẫn đang dùng — rollout an toàn thế nào?',
    points: ['Không sửa thẳng API cũ — thêm bản mới (/api/v2) song song', 'Hoặc mở rộng field mới không đổi/xóa field cũ (backward-compatible)', 'Đặt lịch deprecation rõ ràng, thông báo trước cho client cũ', 'Feature flag/phần trăm rollout để giảm rủi ro, theo dõi lỗi trước khi tắt hẳn bản cũ'],
    answer: 'Quy tắc vàng: không bao giờ sửa vỡ (breaking) một API đang có client dùng. Cách an toàn là cho bản cũ và mới sống song song — phát hành /api/v2 (hoặc version qua header) trong khi v1 vẫn chạy; hoặc nếu có thể thì chỉ THÊM field mới và giữ nguyên field cũ (thay đổi tương thích ngược) thay vì đổi/xóa. Công bố lịch deprecation rõ ràng và báo trước cho các bên tiêu thụ để họ kịp chuyển. Nên bật dần qua feature flag hoặc theo % traffic và theo dõi lỗi trước khi thật sự khai tử bản cũ — giống như bắc xong cầu mới rồi mới tháo cầu cũ.' },
  { id: 'scn-7', topic: 'scenario', level: 'hard', q: 'Một endpoint đọc dữ liệu (read-heavy) khiến DB quá tải khi traffic tăng — những hướng nào để scale?',
    points: ['Cache kết quả (Redis/@Cacheable) cho dữ liệu ít đổi', 'Read replica: tách truy vấn đọc sang DB phụ', 'Thêm/atối ưu index, giảm dữ liệu trả về (DTO gọn, phân trang)', 'CDN cho nội dung tĩnh; denormalize nếu JOIN là nút thắt'],
    answer: 'Đây là bài toán "giảm tải cho DB" với nhiều tầng có thể kết hợp: cache kết quả ít thay đổi (Redis, @Cacheable) để phần lớn request khỏi chạm DB; tách truy vấn đọc sang read replica; rà và thêm index đúng chỗ, đồng thời cắt bớt dữ liệu trả về (chỉ field cần, có phân trang); đẩy nội dung tĩnh ra CDN; và nếu một JOIN nặng là nút thắt thì cân nhắc denormalize có kiểm soát. Nhưng đừng rải hết một lượt — hãy ĐO để biết bottleneck thật nằm ở đâu (CPU của DB, I/O, hay network) rồi mới chọn đúng đòn bẩy, vì mỗi giải pháp đều có cái giá riêng.' },
  { id: 'scn-8', topic: 'scenario', level: 'medium', q: 'Sau khi thêm cache Redis cho một API, người dùng thấy dữ liệu cũ (stale) sau khi cập nhật — nguyên nhân và cách sửa?',
    points: ['Thường do quên @CacheEvict/cập nhật cache khi ghi dữ liệu', 'Hoặc TTL đặt quá dài so với tần suất đổi dữ liệu', 'Race condition: cache được ghi lại đúng lúc dữ liệu vừa đổi (đọc cũ, ghi vào cache)', 'Fix: evict đúng key khi update/delete, cân nhắc write-through, TTL hợp lý'],
    answer: 'Nút thắt gần như luôn nằm ở khâu GHI: có @Cacheable để đọc nhưng QUÊN đặt @CacheEvict/@CachePut tương ứng ở method update/delete, nên cache vẫn giữ bản cũ sau khi DB đã đổi; hoặc TTL đặt quá dài so với tần suất dữ liệu thay đổi. Tinh vi hơn là race: một request đọc bản cũ rồi ghi đè lại vào cache đúng lúc dữ liệu vừa được cập nhật ở nơi khác. Cách sửa: rà lại MỌI nơi ghi dữ liệu để evict đúng key liên quan, cân nhắc write-through (ghi DB và cache cùng lúc) cho dữ liệu nhạy cảm, và đặt TTL khớp với mức "cũ" mà nghiệp vụ chấp nhận được. Đúng như câu đùa kinh điển: hai thứ khó nhất trong lập trình là đặt tên và làm mới cache.' },
  { id: 'scn-9', topic: 'scenario', level: 'medium', q: 'Gọi một API bên thứ ba hay bị timeout/lỗi tạm thời — thiết kế lời gọi sao cho hệ thống vẫn ổn định?',
    points: ['Đặt timeout hợp lý, không chờ vô hạn', 'Retry có giới hạn + backoff (và jitter) cho lỗi tạm thời', 'Circuit breaker: ngừng gọi tạm thời khi lỗi liên tục, tránh dồn tải/thác lũ', 'Có fallback (giá trị mặc định, cache, hàng đợi xử lý sau) khi vẫn lỗi'],
    answer: 'Mấu chốt là "luôn kỳ vọng nó sẽ lỗi" và bọc lời gọi bằng nhiều lớp phòng vệ: đặt timeout rõ ràng để không bao giờ chờ vô hạn; retry có GIỚI HẠN số lần kèm backoff tăng dần và jitter (thêm nhiễu ngẫu nhiên để tránh cả đám client cùng retry một nhịp gây "bão"); và dùng circuit breaker (Resilience4j) — như cầu dao điện — tự ngắt lời gọi khi tỉ lệ lỗi cao để không dội thêm tải lên một dịch vụ đang ốm, rồi dò thử lại sau. Khi mọi cách vẫn fail, cần fallback: trả giá trị mặc định/cache cũ, hoặc đẩy vào hàng đợi xử lý lại sau — để một dependency chết không kéo sập luồng chính của bạn.' },
  { id: 'scn-10', topic: 'scenario', level: 'hard', q: 'Quan hệ nhiều-nhiều nhưng cần lưu thêm thuộc tính riêng của quan hệ đó (vd học sinh–lớp học kèm ngày ghi danh, trạng thái điểm danh) — thiết kế thế nào?',
    points: ['Không dùng @ManyToMany thuần (không chứa được cột phụ)', 'Tách thành entity trung gian (join entity) riêng, vd Enrollment', 'Enrollment có @ManyToOne tới cả hai phía + các cột phụ (ngày, trạng thái)', 'Về bản chất là 2 quan hệ @OneToMany/@ManyToOne, không còn @ManyToMany trực tiếp'],
    answer: '@ManyToMany thuần chỉ sinh ra một bảng nối gồm 2 khóa ngoại — không có chỗ nhét thêm cột nào. Khi bản thân quan hệ có dữ liệu riêng, hãy "nâng cấp" nó thành một entity trung gian độc lập (vd Enrollment) đại diện cho chính mối quan hệ, entity này có @ManyToOne trỏ tới Student và tới ClassRoom, cộng thêm các field riêng (enrolledAt, attendanceStatus…). Về bản chất, một quan hệ nhiều-nhiều được tách thành hai quan hệ một-nhiều: Student 1-N Enrollment N-1 ClassRoom. Đây là thực hành chuẩn và linh hoạt: sau này muốn thêm thuộc tính cho quan hệ chỉ việc thêm cột vào Enrollment.' },
  { id: 'scn-11', topic: 'scenario', level: 'medium', q: 'Một batch job xử lý ban đêm bị crash giữa chừng (mới xử lý được một phần dữ liệu) — làm sao chạy lại an toàn, không xử lý trùng?',
    points: ['Ghi checkpoint/trạng thái đã xử lý tới đâu (id cuối, offset)', 'Chạy lại từ checkpoint thay vì từ đầu', 'Idempotent: mỗi record xử lý lại vẫn ra cùng kết quả (upsert, đánh dấu processed)', 'Log rõ để biết job dừng ở đâu và vì sao'],
    answer: 'Hai vũ khí bổ trợ nhau: checkpoint và tính idempotent. Job phải ghi checkpoint (id/offset của bản ghi cuối đã xử lý xong, commit theo lô) để lần chạy lại tiếp tục từ đúng chỗ đứt gãy thay vì làm lại từ đầu — như đánh dấu trang sách đang đọc dở. Song song, mỗi bước xử lý nên idempotent (dùng upsert hoặc gắn cờ "đã xử lý" trên từng record), để nếu checkpoint lệch một chút và vài record bị chạy lại thì kết quả vẫn đúng, không nhân đôi. Cuối cùng, log đủ chi tiết (record cuối, lỗi cụ thể) để biết job dừng ở đâu và vì sao trước khi cho chạy lại.' },
  { id: 'scn-12', topic: 'scenario', level: 'hard', q: 'Một API production trả sai dữ liệu nhưng chỉ với một số user cụ thể, không phải tất cả — bạn khoanh vùng thế nào?',
    points: ['Tái hiện với đúng input/tài khoản bị báo lỗi, không thử chung chung', 'Tìm điểm chung của các user bị ảnh hưởng (cùng role, cùng dữ liệu cũ, cùng vùng/server, cùng feature flag)', 'Soi log theo correlation/request id của chính các case đó', 'Nghi ngờ: cache theo key sai, dữ liệu migrate dở, rollout phần trăm/feature flag, điều kiện biên trong code'],
    answer: 'Chìa khóa là tìm ĐIỂM CHUNG của nhóm bị ảnh hưởng — "chỉ một số user" nghĩa là có một biến nào đó phân biệt họ với phần còn lại. Trước hết tái hiện đúng với input/tài khoản bị báo lỗi thay vì thử ngẫu nhiên. Rồi soi xem các user lỗi giống nhau ở đâu: cùng role/tenant, cùng nằm trong một đợt migrate dữ liệu, cùng bị bật một feature flag/rollout %, hay cùng rơi vào một nhánh điều kiện biên trong code (danh sách rỗng, giá trị null, vượt ngưỡng). Dùng request id/correlation id lọc log-APM của chính các case lỗi để so với case chạy đúng. Thủ phạm hay gặp: cache đặt SAI key làm dữ liệu dính chéo giữa user, dữ liệu cũ migrate thiếu field, hoặc một feature mới chỉ bật cho một nhóm và có bug.' },
  { id: 'scn-13', topic: 'scenario', level: 'easy', q: 'Khi nào nên xử lý một tác vụ đồng bộ trong request, khi nào nên đẩy sang hàng đợi xử lý bất đồng bộ? Ví dụ gửi email chào mừng sau khi đăng ký?',
    points: ['Đồng bộ: user cần kết quả ngay để tiếp tục (vd xác thực đăng nhập)', 'Bất đồng bộ/queue: tác vụ chậm, không cần chờ, hoặc có thể lỗi tạm thời cần retry', 'Gửi email chào mừng: không cần user chờ -> đẩy queue, tách khỏi luồng đăng ký chính', 'Bất đồng bộ giúp request chính nhanh & không phụ thuộc uptime của service phụ'],
    answer: 'Câu hỏi tự trả lời: người dùng có cần kết quả NGAY để đi tiếp không? Nếu bước sau phụ thuộc kết quả (xác thực đăng nhập, kiểm tra tồn kho trước khi cho đặt hàng) thì xử lý đồng bộ. Nếu tác vụ chậm, không cần chờ, hoặc phụ thuộc dịch vụ ngoài dễ lỗi tạm thời thì đẩy sang hàng đợi/bất đồng bộ. Email chào mừng là ví dụ sách giáo khoa cho async: đẩy một message vào queue rồi trả "đăng ký thành công" ngay, để một worker riêng gửi email sau. Lợi ích kép: request chính nhanh hơn và KHÔNG treo nếu service email đang chậm/down — email vẫn tới nhờ worker tự retry. Nguyên tắc: đừng bắt người dùng chờ những việc họ không cần chờ.' },
  { id: 'scn-14', topic: 'scenario', level: 'hard', q: 'Làm sao đảm bảo hai request xử lý song song không cùng "đặt" được một tài nguyên có giới hạn (vd 2 người cùng đặt trùng 1 ghế)?',
    points: ['Ràng buộc UNIQUE ở DB cho (ghế, suất chiếu) — cách đơn giản & chắc nhất', 'Hoặc pessimistic lock (SELECT FOR UPDATE) khi kiểm tra rồi đặt', 'Optimistic lock (@Version) + retry nếu xung đột, hợp khi ít tranh chấp', 'Nhiều instance/service cùng truy cập thì cần lock phân tán (Redis) nếu không dựa được vào DB'],
    answer: 'Đây là bài toán tranh chấp (race condition) — phải có MỘT trọng tài phân xử. Cách chắc và đơn giản nhất là giao cho DB qua ràng buộc UNIQUE trên (ghế, suất chiếu): hai transaction cùng insert thì DB sẽ từ chối một cái vì vi phạm unique, khỏi cần tự đồng bộ ở tầng ứng dụng. Khi cần kiểm tra điều kiện phức tạp trước khi đặt, dùng pessimistic lock (`SELECT ... FOR UPDATE`) để khóa dòng lại; hoặc optimistic lock (@Version) kèm retry nếu va chạm hiếm khi xảy ra. Chỉ khi nhiều instance/service thao tác mà không thể dồn về một ràng buộc DB thì mới cần distributed lock (Redis Redlock) — nhưng luôn ưu tiên ràng buộc ở DB trước vì nó đơn giản và bền hơn.' },
  { id: 'scn-15', topic: 'scenario', level: 'medium', q: 'Cần thêm một cột bắt buộc (NOT NULL) vào bảng production đang có hàng triệu dòng — làm sao thêm mà không gây downtime?',
    points: ['Không ALTER thẳng NOT NULL trên bảng lớn (khóa bảng lâu)', 'Bước 1: thêm cột NULLABLE (hoặc có DEFAULT) trước', 'Bước 2: backfill dữ liệu theo lô (batch update), không update hết 1 lần', 'Bước 3: sau khi backfill xong hết, mới ALTER thêm ràng buộc NOT NULL'],
    answer: 'Thêm thẳng cột NOT NULL vào bảng hàng triệu dòng dễ khóa bảng rất lâu (tùy DB) và gây downtime, vì DB phải kiểm tra/điền toàn bộ dòng trong một phát. Chiến thuật an toàn là chia thành 3 bước nhỏ, mỗi bước đều nhẹ: (1) thêm cột cho phép NULL (hoặc có DEFAULT) — thao tác nhanh; (2) backfill dữ liệu cho cột đó theo từng lô nhỏ (batch update) để không khóa lâu và không cản traffic đang chạy; (3) khi chắc chắn mọi dòng đã có giá trị, mới ALTER thêm ràng buộc NOT NULL — lúc này rất nhẹ vì dữ liệu đã sẵn sàng. Suốt quá trình, code phải đọc/ghi tương thích cả khi cột còn có thể null. Tinh thần: bẻ một thao tác "nặng và khóa" thành nhiều bước "nhẹ và không khóa".' },
]

// -------------------- Cheat-sheet --------------------
export const CHEATSHEET = [
  { title: 'Java Core & OOP', icon: '☕', items: [
    'equals() luôn đi kèm hashCode(); `==` so tham chiếu, equals() so nội dung.',
    'String bất biến → StringBuilder khi nối trong vòng lặp.',
    'Integer cache -128..127 → luôn so bằng equals().',
    'Interface = CAN-DO (implement nhiều); abstract class = IS-A (extend một).',
    'Ưu tiên composition hơn inheritance.',
  ] },
  { title: 'Collections', icon: '📦', items: [
    'ArrayList (random access O(1)) là mặc định; LinkedList cho Queue/Deque.',
    'HashMap: bucket → va chạm → cây khi >8 & cap≥64 → rehash ở 0.75.',
    'HashMap không thread-safe → ConcurrentHashMap.',
    'Xóa khi lặp → iterator.remove() hoặc removeIf().',
    'TreeMap O(log n), sắp theo key, truy vấn khoảng.',
  ] },
  { title: 'Exception & Generics', icon: '⚠️', items: [
    'Checked = phục hồi được; Unchecked = lỗi lập trình.',
    'finally luôn chạy trừ System.exit().',
    'try-with-resources tự đóng, xử lý đúng suppressed exception.',
    'PECS: Producer extends, Consumer super.',
    'Type erasure: không new T(), new T[], instanceof T.',
  ] },
  { title: 'Stream & Concurrency', icon: '🌊', items: [
    'Stream lazy, dùng một lần, có short-circuit.',
    'map (1-1) vs flatMap (1-nhiều, làm phẳng).',
    'Optional chỉ làm return type; orElseGet lazy hơn orElse.',
    'volatile = visibility (không atomicity) → Atomic/synchronized.',
    'ThreadLocal trong pool → luôn remove() trong finally.',
  ] },
  { title: 'Spring & JPA', icon: '🌱', items: [
    '@SpringBootApplication = Configuration + EnableAutoConfiguration + ComponentScan.',
    'Constructor injection > field injection; bean singleton phải stateless.',
    '@Transactional/@Async qua proxy → self-invocation KHÔNG chạy.',
    'N+1 → JOIN FETCH / @EntityGraph / @BatchSize / DTO projection.',
    'LAZY mặc định cho *-ToMany, EAGER cho *-ToOne → nên để tất cả LAZY.',
  ] },
  { title: 'Testing & Security', icon: '🔐', items: [
    '@Mock (phụ thuộc) + @InjectMocks (class test); when=stub, verify=tương tác.',
    '@WebMvcTest / @DataJpaTest / @SpringBootTest cho từng tầng.',
    'JWT = header.payload.signature, KHÔNG mã hóa; authn trước authz.',
    'BCrypt: hash một chiều + salt, cố tình chậm.',
    'SOLID · Liskov = Square/Rectangle · DIP (WHY) ≠ DI (HOW).',
  ] },
  { title: 'Frontend & DB nhanh', icon: '🖥️', items: [
    'let/const block-scope + TDZ; var hoisting. === so cả kiểu lẫn giá trị.',
    'Closure = hàm nhớ scope tạo ra nó. Event loop: microtask (Promise) trước macrotask (setTimeout).',
    'React: Virtual DOM + diff; key ổn định (đừng dùng index); useEffect khai báo đủ deps.',
    'SSR (Nuxt/Next) tốt SEO; Observable (RxJS) lazy, nhiều giá trị vs Promise một giá trị.',
    'SQL chậm → EXPLAIN → thêm index đúng cột lọc/join, tránh SELECT *, tránh N+1, keyset pagination.',
  ] },
  { title: 'Kỹ năng phỏng vấn', icon: '🗣️', items: [
    'Giới thiệu 60s: tên + vai trò + năm KN + 1 thành tựu CÓ SỐ + mong muốn.',
    'Kể dự án theo STAR, nhấn "TÔI làm gì" và kết quả đo được.',
    'Điểm yếu: nói thật + đang cải thiện, không "giả yếu".',
    'Luôn thủ sẵn 2–3 câu hỏi ngược cho nhà tuyển dụng.',
    'Không biết → nói thật + cách bạn sẽ tìm ra; đừng chém bừa.',
  ] },
  { title: 'Kafka · Microservice · DB nâng cao', icon: '🧩', items: [
    'Kafka giữ thứ tự theo PARTITION; cùng key → cùng partition; 1 partition/1 consumer trong 1 group.',
    'acks=all bền nhất; message lỗi → retry rồi Dead Letter Topic (DLT); offset = vị trí đã đọc.',
    'Microservice: REST (sync) hoặc message (async); transaction phân tán dùng SAGA + bù trừ (eventual consistency).',
    'API Gateway = cổng vào (routing/auth/rate limit); Service Discovery (Eureka/Consul) tránh hardcode địa chỉ.',
    'UNION loại trùng (chậm) vs UNION ALL giữ trùng; View chạy lại vs Materialized View lưu sẵn; CTE = WITH.',
  ] },
  { title: 'System Design nhanh', icon: '🏗️', items: [
    'Luôn làm rõ yêu cầu + ước lượng QPS/storage trước khi thiết kế — thể hiện CÁCH tính, không cần số chính xác.',
    'Đọc nhiều hơn ghi rất nhiều → thêm cache (Redis, cache-aside) trước DB, nhớ đặt TTL.',
    'Rate limiter: Token Bucket (cho phép burst) hoặc Sliding Window; đếm chung qua Redis khi nhiều instance.',
    'Phân trang danh sách lớn: cursor/keyset ổn định hơn offset khi dữ liệu hay đổi.',
    'Idempotency nâng cao: lưu lại RESPONSE theo idempotency key, không chỉ né tạo trùng bản ghi.',
  ] },
  { title: 'Hạ tầng thực tế', icon: '🐳', items: [
    'Container chia sẻ kernel host (nhẹ, giây); VM ảo hóa cả phần cứng (nặng, phút).',
    'Multi-stage Docker build: stage build (JDK+Maven) tách khỏi stage runtime (chỉ JRE+jar) → image nhỏ.',
    'CI: build + unit test fail sớm trước khi build image; CD: staging tự động, production cần gate/approve.',
    '3 trụ cột observability: Logs (chi tiết một sự kiện), Metrics (số liệu theo thời gian, alert), Traces (theo dấu 1 request qua nhiều service).',
    'gRPC (binary, HTTP/2) hợp nội bộ hiệu năng cao; REST (JSON) hợp API public dễ tích hợp.',
  ] },
]

// -------------------- Lộ trình 2 tuần --------------------
// Mỗi ngày có `goals`: mục tiêu ĐO ĐƯỢC để app tự đánh dấu "hoàn thành ngày"
// (không cần tick tay). Loại mục tiêu:
//   { k: 'q', topics: [...] } — ôn HẾT câu hỏi của các chủ đề này (mở đọc đáp án
//       trong tab Ngân hàng = đã ôn); total = tổng số câu của các topic đó.
//   { k: 'code', n } — giải được ≥ n bài coding (chạy pass) — đếm dồn cả khóa.
//   { k: 'mock', n } — hoàn thành ≥ n buổi Mock Interview — đếm dồn cả khóa.
// `tasks` vẫn là gợi ý luyện tay (không tự chấm). Xem src/lib/crashPlan.js.
export const CRASH_PLAN = [
  { day: 1, topic: 'OOP + Interface/Abstract + equals/hashCode', tasks: ['Thuộc 4 tính chất OOP trong 30s', 'Gõ 1 immutable class + override equals/hashCode'], goals: [{ k: 'q', topics: ['oop'] }] },
  { day: 2, topic: 'Generics + Exception + Core', tasks: ['Thuộc PECS, checked vs unchecked', 'Trả lời miệng 10 câu chủ đề core'], goals: [{ k: 'q', topics: ['generics', 'exception', 'core'] }] },
  { day: 3, topic: 'Collections + Big-O', tasks: ['Vẽ tay cơ chế HashMap', 'Thuộc bảng chọn collection + độ phức tạp'], goals: [{ k: 'q', topics: ['collections'] }] },
  { day: 4, topic: 'Stream + Optional + Lambda', tasks: ['Viết 5 pipeline (map/filter/collect/groupingBy)', 'Phân biệt orElse vs orElseGet'], goals: [{ k: 'q', topics: ['stream'] }, { k: 'code', n: 1 }] },
  { day: 5, topic: 'Concurrency cơ bản', tasks: ['Thread/Runnable/Callable, ExecutorService', 'volatile vs synchronized vs Atomic, deadlock'], goals: [{ k: 'q', topics: ['concurrency'] }] },
  { day: 6, topic: 'Spring Boot + REST + DI', tasks: ['Gõ 1 CRUD controller + @RestControllerAdvice', 'Thuộc 3 annotation của @SpringBootApplication'], goals: [{ k: 'q', topics: ['spring', 'rest'] }] },
  { day: 7, topic: 'Ôn + tự test tuần 1', tasks: ['Mock Interview chủ đề Java Core', 'Ghi lại câu chưa chắc'], goals: [{ k: 'mock', n: 1 }] },
  { day: 8, topic: 'JPA/Hibernate + N+1', tasks: ['Nhớ owning vs inverse side', 'Fix N+1: JOIN FETCH / EntityGraph'], goals: [{ k: 'q', topics: ['jpa'] }] },
  { day: 9, topic: '@Transactional + JPQL + DTO', tasks: ['Hiểu propagation, self-invocation', 'Khi nào native query'], goals: [{ k: 'q', topics: ['transaction'] }] },
  { day: 10, topic: 'Testing (JUnit + Mockito)', tasks: ['@Mock vs @InjectMocks, stub vs verify', 'Viết 3 unit test'], goals: [{ k: 'q', topics: ['testing'] }] },
  { day: 11, topic: 'Spring Security + JWT', tasks: ['Flow login → token → filter', 'JWT KHÔNG mã hóa; authn vs authz'], goals: [{ k: 'q', topics: ['security'] }] },
  { day: 12, topic: 'SOLID + Patterns + JVM + System Design', tasks: ['5 nguyên tắc SOLID trong 30s', 'Heap/stack/GC/memory leak', 'Luyện 1-2 walkthrough System Design (rate limiter hoặc URL shortener)'], goals: [{ k: 'q', topics: ['solid', 'jvm', 'design'] }] },
  { day: 13, topic: 'SQL sâu + Frontend + Stack thực tế + Hạ tầng', tasks: ['Ôn tối ưu query (EXPLAIN/index), composite/covering index', 'Ôn lướt JS core + React/Angular; nhớ Struts/MyBatis/batch trong CV', 'Ôn nhanh Docker/CI-CD/Redis/observability (chủ đề Hạ tầng thực tế)'], goals: [{ k: 'q', topics: ['sql', 'frontend', 'mystack', 'infra'] }] },
  { day: 14, topic: 'Kỹ năng PV + Mock Interview toàn phần', tasks: ['Luyện giới thiệu bản thân 60s (VI+EN) + STAR 2–3 dự án', 'Phỏng vấn thử mọi chủ đề, ôn lại chủ đề điểm thấp'], goals: [{ k: 'q', topics: ['scenario', 'behavioral'] }, { k: 'mock', n: 2 }] },
]

// -------------------- Coding challenge (chạy thật qua run-java) --------------------
export const CODING_CHALLENGES = [
  {
    id: 'reverse-string', title: 'Đảo ngược chuỗi', level: 'easy', pattern: 'string',
    prompt: 'Viết hàm đảo ngược một chuỗi (không dùng StringBuilder.reverse). In ra "olleh" cho input "hello".',
    starter: `public class Main {
    static String reverse(String s) {
        // TODO: đảo ngược chuỗi
        return s;
    }
    public static void main(String[] args) {
        System.out.println(reverse("hello"));
    }
}
`,
    hints: ['Duyệt từ cuối về đầu và nối', 'Hoặc dùng char[] và hai con trỏ'],
    solution: `public class Main {
    static String reverse(String s) {
        char[] a = s.toCharArray();
        int i = 0, j = a.length - 1;
        while (i < j) { char t = a[i]; a[i] = a[j]; a[j] = t; i++; j--; }
        return new String(a);
    }
    public static void main(String[] args) {
        System.out.println(reverse("hello"));
    }
}
`,
  },
  {
    id: 'fizzbuzz', title: 'FizzBuzz', level: 'easy', pattern: 'basic',
    prompt: 'In 1..15: bội 3 → "Fizz", bội 5 → "Buzz", bội cả hai → "FizzBuzz", còn lại in số.',
    starter: `public class Main {
    public static void main(String[] args) {
        // TODO: FizzBuzz 1..15
    }
}
`,
    hints: ['Kiểm tra bội 15 trước', 'Dùng toán tử %'],
    solution: `public class Main {
    public static void main(String[] args) {
        for (int i = 1; i <= 15; i++) {
            if (i % 15 == 0) System.out.println("FizzBuzz");
            else if (i % 3 == 0) System.out.println("Fizz");
            else if (i % 5 == 0) System.out.println("Buzz");
            else System.out.println(i);
        }
    }
}
`,
  },
  {
    id: 'two-sum', title: 'Two Sum (HashMap)', level: 'medium', pattern: 'hashmap',
    prompt: 'Cho mảng {2,7,11,15} và target 9, in chỉ số hai phần tử cộng lại bằng target: "0 1".',
    starter: `import java.util.*;
public class Main {
    static int[] twoSum(int[] nums, int target) {
        // TODO: dùng HashMap để đạt O(n)
        return new int[]{-1, -1};
    }
    public static void main(String[] args) {
        int[] r = twoSum(new int[]{2,7,11,15}, 9);
        System.out.println(r[0] + " " + r[1]);
    }
}
`,
    hints: ['Lưu value -> index vào HashMap', 'Tìm target - nums[i] trong map'],
    solution: `import java.util.*;
public class Main {
    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) return new int[]{seen.get(need), i};
            seen.put(nums[i], i);
        }
        return new int[]{-1, -1};
    }
    public static void main(String[] args) {
        int[] r = twoSum(new int[]{2,7,11,15}, 9);
        System.out.println(r[0] + " " + r[1]);
    }
}
`,
  },
  {
    id: 'dedup', title: 'Loại bỏ trùng lặp (Set)', level: 'easy', pattern: 'hashmap',
    prompt: 'Cho {1,2,2,3,3,3,4}, in các số duy nhất giữ thứ tự xuất hiện: "1 2 3 4".',
    starter: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] nums = {1,2,2,3,3,3,4};
        // TODO: in số duy nhất theo thứ tự
    }
}
`,
    hints: ['LinkedHashSet giữ thứ tự chèn', 'add() trả false nếu đã có'],
    solution: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] nums = {1,2,2,3,3,3,4};
        Set<Integer> seen = new LinkedHashSet<>();
        for (int n : nums) seen.add(n);
        StringBuilder sb = new StringBuilder();
        for (int n : seen) sb.append(n).append(" ");
        System.out.println(sb.toString().trim());
    }
}
`,
  },
  {
    id: 'word-count', title: 'Đếm tần suất từ (Stream)', level: 'medium', pattern: 'stream',
    prompt: 'Đếm số lần xuất hiện mỗi từ trong "a b a c b a" rồi in map (dùng Stream groupingBy).',
    starter: `import java.util.*;
import java.util.stream.*;
public class Main {
    public static void main(String[] args) {
        String s = "a b a c b a";
        // TODO: groupingBy + counting
    }
}
`,
    hints: ['split(" ") rồi Arrays.stream', 'Collectors.groupingBy(w -> w, Collectors.counting())'],
    solution: `import java.util.*;
import java.util.stream.*;
public class Main {
    public static void main(String[] args) {
        String s = "a b a c b a";
        Map<String, Long> freq = Arrays.stream(s.split(" "))
            .collect(Collectors.groupingBy(w -> w, TreeMap::new, Collectors.counting()));
        System.out.println(freq);
    }
}
`,
  },
  {
    id: 'anagram', title: 'Kiểm tra Anagram', level: 'medium', pattern: 'string',
    prompt: 'Hai chuỗi có phải anagram không? In true cho "listen"/"silent", false cho "abc"/"abd".',
    starter: `import java.util.*;
public class Main {
    static boolean isAnagram(String a, String b) {
        // TODO
        return false;
    }
    public static void main(String[] args) {
        System.out.println(isAnagram("listen", "silent"));
        System.out.println(isAnagram("abc", "abd"));
    }
}
`,
    hints: ['Sắp xếp hai char[] rồi so sánh', 'Hoặc đếm tần suất ký tự'],
    solution: `import java.util.*;
public class Main {
    static boolean isAnagram(String a, String b) {
        if (a.length() != b.length()) return false;
        char[] x = a.toCharArray(), y = b.toCharArray();
        Arrays.sort(x); Arrays.sort(y);
        return Arrays.equals(x, y);
    }
    public static void main(String[] args) {
        System.out.println(isAnagram("listen", "silent"));
        System.out.println(isAnagram("abc", "abd"));
    }
}
`,
  },
  {
    id: 'fibonacci', title: 'Fibonacci (vòng lặp)', level: 'easy', pattern: 'basic',
    prompt: 'In 10 số Fibonacci đầu tiên cách nhau bởi dấu cách: "0 1 1 2 3 5 8 13 21 34".',
    starter: `public class Main {
    public static void main(String[] args) {
        // TODO: 10 số Fibonacci đầu
    }
}
`,
    hints: ['Giữ hai biến a=0, b=1', 'Tránh đệ quy O(2^n)'],
    solution: `public class Main {
    public static void main(String[] args) {
        long a = 0, b = 1;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(a).append(" ");
            long next = a + b; a = b; b = next;
        }
        System.out.println(sb.toString().trim());
    }
}
`,
  },
  {
    id: 'palindrome', title: 'Kiểm tra Palindrome', level: 'easy', pattern: 'two-pointer',
    prompt: 'Chuỗi có đối xứng không? In true cho "racecar", false cho "hello".',
    starter: `public class Main {
    static boolean isPalindrome(String s) {
        // TODO
        return false;
    }
    public static void main(String[] args) {
        System.out.println(isPalindrome("racecar"));
        System.out.println(isPalindrome("hello"));
    }
}
`,
    hints: ['Hai con trỏ đầu-cuối tiến vào giữa'],
    solution: `public class Main {
    static boolean isPalindrome(String s) {
        int i = 0, j = s.length() - 1;
        while (i < j) { if (s.charAt(i) != s.charAt(j)) return false; i++; j--; }
        return true;
    }
    public static void main(String[] args) {
        System.out.println(isPalindrome("racecar"));
        System.out.println(isPalindrome("hello"));
    }
}
`,
  },
  {
    id: 'debug-cme', title: 'Sửa lỗi: xóa phần tử khi đang lặp (debug)', level: 'medium', pattern: 'debug',
    prompt: 'Đoạn code dưới NÉM ConcurrentModificationException khi chạy. Sửa lại (không đổi kết quả mong muốn) để in ra các số CHẴN còn lại: "2 4".',
    starter: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
        for (Integer n : nums) {
            if (n % 2 != 0) {
                nums.remove(n); // BUG: xóa trong for-each -> ConcurrentModificationException
            }
        }
        StringBuilder sb = new StringBuilder();
        for (int n : nums) sb.append(n).append(" ");
        System.out.println(sb.toString().trim());
    }
}
`,
    hints: ['Xóa phần tử khi đang for-each trên List gây ConcurrentModificationException (fail-fast, modCount đổi)', 'Dùng Iterator.remove() hoặc list.removeIf(predicate) thay vì gọi remove() trực tiếp trong vòng lặp'],
    solution: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
        nums.removeIf(n -> n % 2 != 0);
        StringBuilder sb = new StringBuilder();
        for (int n : nums) sb.append(n).append(" ");
        System.out.println(sb.toString().trim());
    }
}
`,
  },
  {
    id: 'valid-parentheses', title: 'Kiểm tra ngoặc hợp lệ (Stack)', level: 'medium', pattern: 'stack',
    prompt: 'Kiểm tra một chuỗi ngoặc có hợp lệ (cân bằng, đúng thứ tự) không. In true cho "()[]{}", false cho "(]".',
    starter: `import java.util.*;
public class Main {
    static boolean isValid(String s) {
        // TODO: dùng Stack (Deque) kiểm tra ngoặc hợp lệ
        return false;
    }
    public static void main(String[] args) {
        System.out.println(isValid("()[]{}"));
        System.out.println(isValid("(]"));
    }
}
`,
    hints: ['Gặp ngoặc mở thì push vào stack', 'Gặp ngoặc đóng thì pop và so khớp đúng loại tương ứng, rỗng thì false ngay', 'Cuối cùng stack phải rỗng mới hợp lệ'],
    solution: `import java.util.*;
public class Main {
    static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        Map<Character, Character> pairs = new HashMap<>();
        pairs.put(')', '(');
        pairs.put(']', '[');
        pairs.put('}', '{');
        for (char c : s.toCharArray()) {
            if (pairs.containsKey(c)) {
                if (stack.isEmpty() || stack.pop().charValue() != pairs.get(c).charValue()) return false;
            } else {
                stack.push(c);
            }
        }
        return stack.isEmpty();
    }
    public static void main(String[] args) {
        System.out.println(isValid("()[]{}"));
        System.out.println(isValid("(]"));
    }
}
`,
  },
  {
    id: 'group-anagrams', title: 'Gom nhóm Anagram (Stream)', level: 'medium', pattern: 'stream',
    prompt: 'Cho mảng từ, gom các từ là anagram của nhau vào cùng nhóm. In số nhóm cho {"eat","tea","tan","ate","nat","bat"} (kết quả: 3).',
    starter: `import java.util.*;
import java.util.stream.*;
public class Main {
    public static void main(String[] args) {
        String[] words = {"eat","tea","tan","ate","nat","bat"};
        // TODO: gom nhóm anagram (Collectors.groupingBy theo "khóa" đã sắp xếp ký tự), in số nhóm
    }
}
`,
    hints: ['Sắp xếp ký tự của mỗi từ để tạo "khóa" chung cho một nhóm anagram', 'Collectors.groupingBy(khóa) rồi lấy .size() của map kết quả'],
    solution: `import java.util.*;
import java.util.stream.*;
public class Main {
    static String key(String w) {
        char[] c = w.toCharArray();
        Arrays.sort(c);
        return new String(c);
    }
    public static void main(String[] args) {
        String[] words = {"eat","tea","tan","ate","nat","bat"};
        Map<String, List<String>> groups = Arrays.stream(words)
            .collect(Collectors.groupingBy(Main::key));
        System.out.println(groups.size());
    }
}
`,
  },
  {
    id: 'binary-search', title: 'Binary Search', level: 'medium', pattern: 'binary-search',
    prompt: 'Viết binary search trên mảng đã sắp xếp, trả về chỉ số phần tử (hoặc -1 nếu không có). In chỉ số của 7 trong {1,3,5,7,9,11} (kết quả: 3).',
    starter: `public class Main {
    static int search(int[] a, int target) {
        // TODO: binary search, trả về chỉ số hoặc -1
        return -1;
    }
    public static void main(String[] args) {
        System.out.println(search(new int[]{1,3,5,7,9,11}, 7));
    }
}
`,
    hints: ['lo + (hi - lo) / 2 để tránh tràn số so với (lo + hi) / 2', 'So sánh a[mid] với target để thu hẹp còn nửa mảng phù hợp'],
    solution: `public class Main {
    static int search(int[] a, int target) {
        int lo = 0, hi = a.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] == target) return mid;
            if (a[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }
    public static void main(String[] args) {
        System.out.println(search(new int[]{1,3,5,7,9,11}, 7));
    }
}
`,
  },
  {
    id: 'merge-intervals', title: 'Gộp khoảng chồng lấn (Merge Intervals)', level: 'hard', pattern: 'interval',
    prompt: 'Cho danh sách khoảng {{1,3},{2,6},{8,10},{15,18}}, gộp các khoảng chồng lấn. In kết quả: "[1,6] [8,10] [15,18]".',
    starter: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[][] intervals = {{1,3},{2,6},{8,10},{15,18}};
        // TODO: sắp xếp theo điểm bắt đầu rồi gộp các khoảng chồng lấn
    }
}
`,
    hints: ['Sắp xếp mảng khoảng theo điểm bắt đầu trước', 'So sánh điểm kết thúc của khoảng cuối trong kết quả với điểm bắt đầu khoảng đang xét để quyết định gộp hay thêm mới'],
    solution: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[][] intervals = {{1,3},{2,6},{8,10},{15,18}};
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        List<int[]> merged = new ArrayList<>();
        for (int[] cur : intervals) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < cur[0]) {
                merged.add(cur);
            } else {
                merged.get(merged.size() - 1)[1] = Math.max(merged.get(merged.size() - 1)[1], cur[1]);
            }
        }
        StringBuilder sb = new StringBuilder();
        for (int[] m : merged) sb.append("[").append(m[0]).append(",").append(m[1]).append("] ");
        System.out.println(sb.toString().trim());
    }
}
`,
  },
  {
    id: 'lru-cache', title: 'LRU Cache (LinkedHashMap)', level: 'hard', pattern: 'design',
    prompt: 'Cài đặt LRU Cache dung lượng 2 bằng LinkedHashMap (access-order). put(1,1); put(2,2); get(1); put(3,3) (đẩy 2 ra vì lâu không dùng); in các key còn lại theo thứ tự: "1 3".',
    starter: `import java.util.*;
public class Main {
    static class LRUCache extends LinkedHashMap<Integer, Integer> {
        private final int capacity;
        LRUCache(int capacity) {
            super(16, 0.75f, true); // accessOrder = true
            this.capacity = capacity;
        }
        @Override
        protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
            // TODO: trả true khi size() vượt capacity để tự xóa entry cũ nhất (ít dùng nhất)
            return false;
        }
    }
    public static void main(String[] args) {
        LRUCache cache = new LRUCache(2);
        cache.put(1, 1);
        cache.put(2, 2);
        cache.get(1);
        cache.put(3, 3);
        StringBuilder sb = new StringBuilder();
        for (int k : cache.keySet()) sb.append(k).append(" ");
        System.out.println(sb.toString().trim());
    }
}
`,
    hints: ['LinkedHashMap(cap, 0.75f, true) tự giữ thứ tự theo lần truy cập gần nhất (get/put đẩy entry ra cuối)', 'Override removeEldestEntry: trả true khi size() > capacity, LinkedHashMap tự gọi hàm này sau mỗi put()'],
    solution: `import java.util.*;
public class Main {
    static class LRUCache extends LinkedHashMap<Integer, Integer> {
        private final int capacity;
        LRUCache(int capacity) {
            super(16, 0.75f, true);
            this.capacity = capacity;
        }
        @Override
        protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
            return size() > capacity;
        }
    }
    public static void main(String[] args) {
        LRUCache cache = new LRUCache(2);
        cache.put(1, 1);
        cache.put(2, 2);
        cache.get(1);
        cache.put(3, 3);
        StringBuilder sb = new StringBuilder();
        for (int k : cache.keySet()) sb.append(k).append(" ");
        System.out.println(sb.toString().trim());
    }
}
`,
  },
  {
    id: 'linked-list-reverse', title: 'Đảo ngược Linked List', level: 'medium', pattern: 'linked-list',
    prompt: 'Đảo ngược một singly linked list 1->2->3->4->5. In dãy sau khi đảo: "5 4 3 2 1".',
    starter: `public class Main {
    static class Node {
        int val;
        Node next;
        Node(int val) { this.val = val; }
    }
    static Node reverse(Node head) {
        // TODO: đảo ngược danh sách liên kết, trả về head mới
        return head;
    }
    public static void main(String[] args) {
        Node head = new Node(1);
        head.next = new Node(2);
        head.next.next = new Node(3);
        head.next.next.next = new Node(4);
        head.next.next.next.next = new Node(5);
        Node rev = reverse(head);
        StringBuilder sb = new StringBuilder();
        for (Node n = rev; n != null; n = n.next) sb.append(n.val).append(" ");
        System.out.println(sb.toString().trim());
    }
}
`,
    hints: ['Giữ 3 con trỏ: prev, curr, next', 'Mỗi bước: lưu curr.next, đảo curr.next = prev, rồi dịch chuyển cả prev/curr'],
    solution: `public class Main {
    static class Node {
        int val;
        Node next;
        Node(int val) { this.val = val; }
    }
    static Node reverse(Node head) {
        Node prev = null, curr = head;
        while (curr != null) {
            Node next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
    public static void main(String[] args) {
        Node head = new Node(1);
        head.next = new Node(2);
        head.next.next = new Node(3);
        head.next.next.next = new Node(4);
        head.next.next.next.next = new Node(5);
        Node rev = reverse(head);
        StringBuilder sb = new StringBuilder();
        for (Node n = rev; n != null; n = n.next) sb.append(n.val).append(" ");
        System.out.println(sb.toString().trim());
    }
}
`,
  },
  {
    id: 'linked-list-cycle', title: 'Phát hiện chu trình (Floyd)', level: 'medium', pattern: 'linked-list',
    prompt: 'Kiểm tra một linked list có chu trình không, dùng thuật toán Floyd (slow/fast pointer). In true cho list có chu trình, false cho list bình thường.',
    starter: `public class Main {
    static class Node {
        int val;
        Node next;
        Node(int val) { this.val = val; }
    }
    static boolean hasCycle(Node head) {
        // TODO: dùng hai con trỏ slow/fast (Floyd's Tortoise and Hare)
        return false;
    }
    public static void main(String[] args) {
        Node a = new Node(1);
        Node b = new Node(2);
        Node c = new Node(3);
        a.next = b; b.next = c; c.next = a; // có chu trình
        System.out.println(hasCycle(a));

        Node x = new Node(1);
        x.next = new Node(2); // không có chu trình
        System.out.println(hasCycle(x));
    }
}
`,
    hints: ['slow đi 1 bước, fast đi 2 bước mỗi vòng lặp', 'Nếu có chu trình, slow và fast chắc chắn gặp nhau; fast chạm null nghĩa là không có chu trình'],
    solution: `public class Main {
    static class Node {
        int val;
        Node next;
        Node(int val) { this.val = val; }
    }
    static boolean hasCycle(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
    public static void main(String[] args) {
        Node a = new Node(1);
        Node b = new Node(2);
        Node c = new Node(3);
        a.next = b; b.next = c; c.next = a;
        System.out.println(hasCycle(a));

        Node x = new Node(1);
        x.next = new Node(2);
        System.out.println(hasCycle(x));
    }
}
`,
  },
  {
    id: 'bst-inorder', title: 'BST: chèn & duyệt in-order', level: 'medium', pattern: 'tree',
    prompt: 'Chèn các số {5,3,8,1,4,7,9} vào một Binary Search Tree rồi duyệt in-order (phải tăng dần): "1 3 4 5 7 8 9".',
    starter: `public class Main {
    static class Node {
        int val;
        Node left, right;
        Node(int val) { this.val = val; }
    }
    static Node insert(Node root, int val) {
        // TODO: chèn val vào đúng vị trí BST (đệ quy), trả về root
        return root;
    }
    static void inorder(Node root, StringBuilder sb) {
        // TODO: duyệt trái - gốc - phải
    }
    public static void main(String[] args) {
        Node root = null;
        for (int v : new int[]{5,3,8,1,4,7,9}) root = insert(root, v);
        StringBuilder sb = new StringBuilder();
        inorder(root, sb);
        System.out.println(sb.toString().trim());
    }
}
`,
    hints: ['insert: val nhỏ hơn root thì đi trái, lớn hơn thì đi phải, gặp null thì tạo Node mới', 'inorder: đệ quy trái, in gốc, đệ quy phải -> luôn ra thứ tự tăng dần với BST'],
    solution: `public class Main {
    static class Node {
        int val;
        Node left, right;
        Node(int val) { this.val = val; }
    }
    static Node insert(Node root, int val) {
        if (root == null) return new Node(val);
        if (val < root.val) root.left = insert(root.left, val);
        else root.right = insert(root.right, val);
        return root;
    }
    static void inorder(Node root, StringBuilder sb) {
        if (root == null) return;
        inorder(root.left, sb);
        sb.append(root.val).append(" ");
        inorder(root.right, sb);
    }
    public static void main(String[] args) {
        Node root = null;
        for (int v : new int[]{5,3,8,1,4,7,9}) root = insert(root, v);
        StringBuilder sb = new StringBuilder();
        inorder(root, sb);
        System.out.println(sb.toString().trim());
    }
}
`,
  },
  {
    id: 'bst-validate', title: 'Kiểm tra Valid BST', level: 'hard', pattern: 'tree',
    prompt: 'Kiểm tra một cây nhị phân có phải Binary Search Tree hợp lệ không (không chỉ so root với con trực tiếp). Cây 1 hợp lệ -> true, cây 2 không hợp lệ -> false.',
    starter: `public class Main {
    static class Node {
        int val;
        Node left, right;
        Node(int val) { this.val = val; }
    }
    static boolean isValidBST(Node root, Long lo, Long hi) {
        // TODO: kiểm tra root.val nằm trong (lo, hi), rồi đệ quy siết khoảng cho con trái/phải
        return true;
    }
    public static void main(String[] args) {
        Node valid = new Node(5);
        valid.left = new Node(3);
        valid.right = new Node(8);
        System.out.println(isValidBST(valid, null, null));

        Node invalid = new Node(5);
        invalid.left = new Node(3);
        invalid.right = new Node(4); // 4 nằm bên phải nhưng nhỏ hơn root -> vi phạm BST
        System.out.println(isValidBST(invalid, null, null));
    }
}
`,
    hints: ['Không chỉ so root với con trực tiếp — phải giữ khoảng (lo, hi) siết dần qua từng tầng đệ quy', 'Con trái: hi mới = giá trị root; con phải: lo mới = giá trị root'],
    solution: `public class Main {
    static class Node {
        int val;
        Node left, right;
        Node(int val) { this.val = val; }
    }
    static boolean isValidBST(Node root, Long lo, Long hi) {
        if (root == null) return true;
        if (lo != null && root.val <= lo) return false;
        if (hi != null && root.val >= hi) return false;
        return isValidBST(root.left, lo, (long) root.val) && isValidBST(root.right, (long) root.val, hi);
    }
    public static void main(String[] args) {
        Node valid = new Node(5);
        valid.left = new Node(3);
        valid.right = new Node(8);
        System.out.println(isValidBST(valid, null, null));

        Node invalid = new Node(5);
        invalid.left = new Node(3);
        invalid.right = new Node(4);
        System.out.println(isValidBST(invalid, null, null));
    }
}
`,
  },
  {
    id: 'subsets', title: 'Sinh tất cả tập con (Backtracking)', level: 'medium', pattern: 'recursion',
    prompt: 'In tất cả tập con của {1,2,3} (kể cả tập rỗng) bằng backtracking, mỗi tập một dòng.',
    starter: `import java.util.*;
public class Main {
    static List<List<Integer>> result = new ArrayList<>();
    static void backtrack(int[] nums, int start, List<Integer> current) {
        // TODO: thêm bản sao current vào result, rồi thử thêm từng số từ index start trở đi
    }
    public static void main(String[] args) {
        backtrack(new int[]{1,2,3}, 0, new ArrayList<>());
        for (List<Integer> subset : result) System.out.println(subset);
    }
}
`,
    hints: ['Mỗi lời gọi backtrack: trước tiên add(new ArrayList<>(current)) vào result (bản sao, không phải chính current)', 'for i từ start..n-1: thêm nums[i] vào current, đệ quy backtrack(nums, i+1, current), rồi remove phần tử cuối (quay lui)'],
    solution: `import java.util.*;
public class Main {
    static List<List<Integer>> result = new ArrayList<>();
    static void backtrack(int[] nums, int start, List<Integer> current) {
        result.add(new ArrayList<>(current));
        for (int i = start; i < nums.length; i++) {
            current.add(nums[i]);
            backtrack(nums, i + 1, current);
            current.remove(current.size() - 1);
        }
    }
    public static void main(String[] args) {
        backtrack(new int[]{1,2,3}, 0, new ArrayList<>());
        for (List<Integer> subset : result) System.out.println(subset);
    }
}
`,
  },
  {
    id: 'permutations', title: 'Sinh hoán vị (Backtracking)', level: 'hard', pattern: 'recursion',
    prompt: 'In tất cả hoán vị của {1,2,3} bằng backtracking hoán đổi tại chỗ (in-place swap), mỗi hoán vị một dòng — có 6 dòng.',
    starter: `import java.util.*;
public class Main {
    static void permute(int[] nums, int l) {
        // TODO: nếu l == nums.length thì in nums; ngược lại thử hoán đổi từng vị trí i >= l rồi đệ quy, sau đó hoán đổi lại (quay lui)
    }
    public static void main(String[] args) {
        permute(new int[]{1,2,3}, 0);
    }
}
`,
    hints: ['Điều kiện dừng: l == nums.length -> in mảng (Arrays.toString)', 'for i từ l..n-1: swap(l,i), đệ quy permute(nums, l+1), rồi swap(l,i) lần nữa để quay lui về trạng thái cũ'],
    solution: `import java.util.*;
public class Main {
    static void swap(int[] a, int i, int j) {
        int t = a[i]; a[i] = a[j]; a[j] = t;
    }
    static void permute(int[] nums, int l) {
        if (l == nums.length) {
            System.out.println(Arrays.toString(nums));
            return;
        }
        for (int i = l; i < nums.length; i++) {
            swap(nums, l, i);
            permute(nums, l + 1);
            swap(nums, l, i);
        }
    }
    public static void main(String[] args) {
        permute(new int[]{1,2,3}, 0);
    }
}
`,
  },
  {
    id: 'longest-substr-no-repeat', title: 'Chuỗi con dài nhất không lặp ký tự (Sliding Window)', level: 'medium', pattern: 'sliding-window',
    prompt: 'Tìm độ dài chuỗi con liên tiếp dài nhất không có ký tự lặp lại trong "abcabcbb". Kết quả: 3 (ứng với "abc").',
    starter: `import java.util.*;
public class Main {
    static int lengthOfLongestSubstring(String s) {
        // TODO: sliding window với HashMap lưu vị trí gặp gần nhất của mỗi ký tự
        return 0;
    }
    public static void main(String[] args) {
        System.out.println(lengthOfLongestSubstring("abcabcbb"));
    }
}
`,
    hints: ['Giữ cửa sổ [left, right], mở rộng right; nếu ký tự đã có trong cửa sổ thì đẩy left lên sau vị trí gặp trùng gần nhất', 'Dùng Map<Character, Integer> lưu vị trí gặp gần nhất của mỗi ký tự'],
    solution: `import java.util.*;
public class Main {
    static int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> lastSeen = new HashMap<>();
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (lastSeen.containsKey(c) && lastSeen.get(c) >= left) {
                left = lastSeen.get(c) + 1;
            }
            lastSeen.put(c, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
    public static void main(String[] args) {
        System.out.println(lengthOfLongestSubstring("abcabcbb"));
    }
}
`,
  },
  {
    id: 'container-most-water', title: 'Container With Most Water (Two Pointer)', level: 'medium', pattern: 'two-pointer',
    prompt: 'Cho mảng chiều cao {1,8,6,2,5,4,8,3,7}, tìm diện tích chứa nước lớn nhất giữa hai vạch. Kết quả: 49.',
    starter: `public class Main {
    static int maxArea(int[] height) {
        // TODO: hai con trỏ đầu-cuối, luôn dịch con trỏ có chiều cao NHỎ HƠN vào trong
        return 0;
    }
    public static void main(String[] args) {
        System.out.println(maxArea(new int[]{1,8,6,2,5,4,8,3,7}));
    }
}
`,
    hints: ['Diện tích = min(height[l], height[r]) * (r - l)', 'Dịch con trỏ có chiều cao thấp hơn vào trong — dịch cái cao hơn không bao giờ tăng được diện tích'],
    solution: `public class Main {
    static int maxArea(int[] height) {
        int l = 0, r = height.length - 1, best = 0;
        while (l < r) {
            int area = Math.min(height[l], height[r]) * (r - l);
            best = Math.max(best, area);
            if (height[l] < height[r]) l++;
            else r--;
        }
        return best;
    }
    public static void main(String[] args) {
        System.out.println(maxArea(new int[]{1,8,6,2,5,4,8,3,7}));
    }
}
`,
  },
  {
    id: 'climb-stairs', title: 'Climbing Stairs (DP)', level: 'easy', pattern: 'dp',
    prompt: 'Có 10 bậc thang, mỗi bước leo 1 hoặc 2 bậc. Hỏi có bao nhiêu cách khác nhau để lên tới đỉnh? Kết quả: 89.',
    starter: `public class Main {
    static int climbStairs(int n) {
        // TODO: dp[i] = số cách lên bậc i = dp[i-1] + dp[i-2] (giống Fibonacci)
        return 0;
    }
    public static void main(String[] args) {
        System.out.println(climbStairs(10));
    }
}
`,
    hints: ['Đây thực chất là Fibonacci: dp[1]=1, dp[2]=2', 'Chỉ cần giữ 2 biến trước đó thay vì mảng dp đầy đủ (tối ưu bộ nhớ)'],
    solution: `public class Main {
    static int climbStairs(int n) {
        if (n <= 2) return n;
        int prev2 = 1, prev1 = 2;
        for (int i = 3; i <= n; i++) {
            int cur = prev1 + prev2;
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
    public static void main(String[] args) {
        System.out.println(climbStairs(10));
    }
}
`,
  },
  {
    id: 'coin-change', title: 'Coin Change — số đồng xu ít nhất (DP)', level: 'hard', pattern: 'dp',
    prompt: 'Cho các mệnh giá {1,3,4} và tổng cần đổi 6, tìm số đồng xu ÍT NHẤT để đủ tổng đó. Kết quả: 2 (3+3).',
    starter: `import java.util.*;
public class Main {
    static int coinChange(int[] coins, int amount) {
        // TODO: dp[i] = số đồng xu tối thiểu để đổi được i, dp[0] = 0
        return -1;
    }
    public static void main(String[] args) {
        System.out.println(coinChange(new int[]{1,3,4}, 6));
    }
}
`,
    hints: ['dp[i] = min(dp[i - coin] + 1) với mọi coin <= i mà dp[i-coin] đã tính được', 'Khởi tạo dp toàn Integer.MAX_VALUE (trừ dp[0]=0); cuối cùng dp[amount] == MAX_VALUE nghĩa là không đổi được'],
    solution: `import java.util.*;
public class Main {
    static int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (coin <= i && dp[i - coin] != Integer.MAX_VALUE) {
                    dp[i] = Math.min(dp[i], dp[i - coin] + 1);
                }
            }
        }
        return dp[amount] == Integer.MAX_VALUE ? -1 : dp[amount];
    }
    public static void main(String[] args) {
        System.out.println(coinChange(new int[]{1,3,4}, 6));
    }
}
`,
  },
  {
    id: 'merge-sort', title: 'Merge Sort', level: 'medium', pattern: 'sorting',
    prompt: 'Cài đặt merge sort để sắp xếp mảng {5,2,9,1,5,6}. In kết quả: "1 2 5 5 6 9".',
    starter: `import java.util.*;
public class Main {
    static void mergeSort(int[] a, int lo, int hi) {
        // TODO: chia đôi, sort từng nửa, rồi merge(a, lo, mid, hi)
    }
    static void merge(int[] a, int lo, int mid, int hi) {
        // TODO: trộn hai nửa đã sắp xếp a[lo..mid] và a[mid+1..hi]
    }
    public static void main(String[] args) {
        int[] a = {5,2,9,1,5,6};
        mergeSort(a, 0, a.length - 1);
        StringBuilder sb = new StringBuilder();
        for (int n : a) sb.append(n).append(" ");
        System.out.println(sb.toString().trim());
    }
}
`,
    hints: ['mergeSort: nếu lo < hi thì tính mid = lo + (hi-lo)/2, đệ quy hai nửa rồi merge', 'merge: copy sang mảng tạm, dùng hai con trỏ i, j so sánh và ghi lại vào a theo thứ tự tăng dần'],
    solution: `import java.util.*;
public class Main {
    static void mergeSort(int[] a, int lo, int hi) {
        if (lo >= hi) return;
        int mid = lo + (hi - lo) / 2;
        mergeSort(a, lo, mid);
        mergeSort(a, mid + 1, hi);
        merge(a, lo, mid, hi);
    }
    static void merge(int[] a, int lo, int mid, int hi) {
        int[] tmp = new int[hi - lo + 1];
        int i = lo, j = mid + 1, k = 0;
        while (i <= mid && j <= hi) tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
        while (i <= mid) tmp[k++] = a[i++];
        while (j <= hi) tmp[k++] = a[j++];
        System.arraycopy(tmp, 0, a, lo, tmp.length);
    }
    public static void main(String[] args) {
        int[] a = {5,2,9,1,5,6};
        mergeSort(a, 0, a.length - 1);
        StringBuilder sb = new StringBuilder();
        for (int n : a) sb.append(n).append(" ");
        System.out.println(sb.toString().trim());
    }
}
`,
  },
  {
    id: 'debug-integer-cache', title: 'Sửa lỗi: so sánh Integer bằng == (debug)', level: 'medium', pattern: 'debug',
    prompt: 'Đoạn code dưới in ra false dù hai giá trị bằng nhau (200 và 200), do dùng == để so sánh hai đối tượng Integer nằm ngoài vùng cache (-128..127). Sửa lại để in true.',
    starter: `public class Main {
    public static void main(String[] args) {
        Integer a = 200;
        Integer b = 200;
        System.out.println(a == b); // BUG: so sánh tham chiếu Integer ngoài cache -128..127
    }
}
`,
    hints: ['Integer cache chỉ áp dụng cho giá trị -128..127; ngoài khoảng đó mỗi autobox tạo một object Integer riêng nên == so sánh tham chiếu sẽ là false', 'Dùng .equals() (hoặc unbox về int rồi so sánh) thay vì =='],
    solution: `public class Main {
    public static void main(String[] args) {
        Integer a = 200;
        Integer b = 200;
        System.out.println(a.equals(b));
    }
}
`,
  },
  {
    id: 'debug-map-iteration', title: 'Sửa lỗi: sửa Map khi đang duyệt (debug)', level: 'medium', pattern: 'debug',
    prompt: 'Đoạn code dưới ném ConcurrentModificationException khi xóa entry khỏi Map trong lúc for-each. Sửa lại để in ra các entry có value chẵn, giữ nguyên thứ tự chèn: "a=2 c=4".',
    starter: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Map<String, Integer> map = new LinkedHashMap<>();
        map.put("a", 2);
        map.put("b", 3);
        map.put("c", 4);
        for (Map.Entry<String, Integer> e : map.entrySet()) {
            if (e.getValue() % 2 != 0) {
                map.remove(e.getKey()); // BUG: xóa khỏi map trong lúc for-each duyệt entrySet
            }
        }
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Integer> e : map.entrySet()) sb.append(e.getKey()).append("=").append(e.getValue()).append(" ");
        System.out.println(sb.toString().trim());
    }
}
`,
    hints: ['Map cũng fail-fast như List — sửa cấu trúc map trong for-each trên entrySet/keySet cũng ném ConcurrentModificationException', 'Dùng map.entrySet().removeIf(...) (hoặc Iterator.remove() qua entrySet().iterator())'],
    solution: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Map<String, Integer> map = new LinkedHashMap<>();
        map.put("a", 2);
        map.put("b", 3);
        map.put("c", 4);
        map.entrySet().removeIf(e -> e.getValue() % 2 != 0);
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Integer> e : map.entrySet()) sb.append(e.getKey()).append("=").append(e.getValue()).append(" ");
        System.out.println(sb.toString().trim());
    }
}
`,
  },
]

// -------------------- Kỹ năng phỏng vấn (cá nhân hóa theo CV) --------------------
// Nội dung dựng từ hồ sơ ứng viên: Java Backend/Full-stack ~2 năm, khách Nhật (cable TV/Internet),
// stack Java/Struts/iBatis/Spring Boot + Angular/NuxtJS/React, thủ khoa CNTT ĐH Nông Lâm.
// Dùng ở tab "Kỹ năng PV".
export const INTERVIEW_SKILLS = {
  // Giới thiệu bản thân ~60 giây, hai ngôn ngữ để luyện cả vòng tiếng Anh.
  selfIntro: {
    vi: 'Em là Lê Minh Long, lập trình viên Java Backend/Full-stack với gần 2 năm kinh nghiệm xây hệ thống doanh nghiệp cho khách hàng Nhật trong lĩnh vực truyền hình cáp và dịch vụ Internet. Em chủ yếu làm backend với Java, Struts, iBatis và Spring Boot: xây REST API cho frontend Angular/NuxtJS, viết batch job và báo cáo bằng JasperReports, xử lý file và upload FTP. Em quen làm việc với codebase lớn cùng quy trình của khách Nhật, chú trọng chất lượng và độ ổn định của hệ thống. Em tốt nghiệp thủ khoa ngành CNTT Đại học Nông Lâm với GPA 3.54, và đang tìm môi trường để phát triển sâu hơn về backend và hệ thống quy mô lớn.',
    en: "Hi, I'm Long, a Java backend / full-stack developer with nearly two years of experience building enterprise systems for Japanese clients in the cable-TV and internet-service domain. I mainly work on the backend with Java, Struts, iBatis and Spring Boot — building REST APIs consumed by Angular and NuxtJS, scheduled batch jobs, JasperReports PDF reports, and file/FTP processing. I'm comfortable working with large codebases and Japanese-client workflows, and I care about code quality and system reliability. I graduated top of my IT class at Nong Lam University with a 3.54 GPA, and I'm looking for a role where I can grow deeper in backend and large-scale systems.",
  },

  // Kể dự án theo STAR — rút thẳng từ kinh nghiệm thật trong CV.
  starStories: [
    {
      id: 'rest-api', title: 'REST API cho frontend Angular / NuxtJS', tags: ['REST API', 'Java', 'Backend', 'Integration'],
      situation: 'Hệ thống quản lý truyền hình cáp/Internet cần API cho các màn hình quản lý người dùng và hợp đồng do frontend Angular và NuxtJS gọi.',
      task: 'Em thiết kế và hiện thực các REST API phục vụ những tính năng đó.',
      action: 'Em xây API bằng Java (Struts/Spring), định nghĩa endpoint và DTO rõ ràng, validate đầu vào và trả lỗi nhất quán; thống nhất hợp đồng dữ liệu với phía frontend và kiểm thử bằng Postman.',
      result: 'Frontend Angular/NuxtJS tích hợp mượt, tính năng quản lý người dùng và hợp đồng vận hành ổn định. [Nếu nhớ được: số lượng endpoint đã xây, số màn hình dùng tới, hoặc thời gian tích hợp rút ngắn được bao lâu.]',
    },
    {
      id: 'ecom-pay', title: 'Thanh toán PayPal + đăng nhập OAuth (e-commerce)', tags: ['Spring Boot', 'ReactJS', 'OAuth', 'Payment'],
      situation: 'Dự án nền tảng thương mại điện tử cần thanh toán online an toàn và đăng nhập tiện lợi.',
      task: 'Em phụ trách phần thanh toán, xác thực và quản lý vai trò người dùng.',
      action: 'Em xây backend Spring Boot + frontend ReactJS, tích hợp PayPal API cho thanh toán, triển khai OAuth đăng nhập Google/Facebook và phân quyền theo role cho khu vực quản trị.',
      result: 'Người dùng thanh toán và đăng nhập mượt mà; hệ thống quản lý sản phẩm và vai trò vận hành ổn định. [Nếu nhớ được: số giao dịch/tháng xử lý qua PayPal, tỷ lệ đăng nhập OAuth so với form thường, hoặc số sự cố thanh toán giảm được.]',
    },
    {
      id: 'batch-report', title: 'Batch job + báo cáo PDF tự động (JasperReports)', tags: ['Batch', 'JasperReports', 'Automation'],
      situation: 'Khách hàng cần báo cáo định kỳ và xuất PDF, trước đó làm thủ công tốn thời gian.',
      task: 'Em xây dựng luồng tạo báo cáo tự động.',
      action: 'Em lập lịch batch job, dùng JasperReports sinh và export PDF, xử lý dữ liệu theo lô để chịu tải và ghi log tiến độ.',
      result: 'Báo cáo được tạo và xuất PDF tự động đúng hạn, giảm đáng kể công việc thủ công và sai sót. [Nếu nhớ được: số báo cáo/tháng được tự động hóa, thời gian làm thủ công trước đây so với sau khi tự động (vd từ X giờ xuống còn Y phút).]',
    },
    {
      id: 'file-ftp', title: 'Pipeline xử lý file & upload FTP', tags: ['File Processing', 'FTP', 'Backend'],
      situation: 'Hệ thống cần chuyển đổi ảnh và đẩy file lên FTP server một cách tự động, ổn định.',
      task: 'Em xây pipeline xử lý và truyền file.',
      action: 'Em convert ảnh sang JPG, ghi ra file tạm rồi mới chuyển/đổi tên để tránh đọc file dở, tự động upload FTP kèm retry khi lỗi mạng và đóng stream cẩn thận.',
      result: 'Luồng xử lý file chạy tự động, ổn định, ít lỗi và không cần thao tác tay. [Nếu nhớ được: số file/ngày xử lý, tỷ lệ lỗi upload trước và sau khi thêm retry.]',
    },
    {
      id: 'legacy-maintain', title: 'Bảo trì & fix lỗi production hệ thống enterprise', tags: ['Legacy', 'Debugging', 'Teamwork'],
      situation: 'Hệ thống enterprise cho khách Nhật đang chạy thật, vừa phải thêm tính năng vừa giữ ổn định.',
      task: 'Em duy trì, nâng cấp tính năng và xử lý sự cố production.',
      action: 'Em đọc và hiểu code legacy (Struts/iBatis), tái hiện lỗi qua log, sửa cẩn thận kèm test, và phối hợp chặt với team cùng phía khách hàng Nhật để xác nhận yêu cầu.',
      result: 'Hệ thống ổn định hơn, giảm lỗi tái diễn; em quen làm việc với codebase lớn và quy trình của khách Nhật. [Nếu nhớ được: số bug production/tháng giảm, thời gian trung bình để fix và deploy một hotfix.]',
    },
  ],

  // Câu hỏi HR/hành vi hay gặp + mẹo trả lời + gợi ý cá nhân hóa.
  hrQuestions: [
    { q: 'Điểm mạnh của bạn là gì?', tip: 'Chọn điểm liên quan mô tả công việc, kèm 1 ví dụ có số.',
      sample: 'Xây REST API và batch/báo cáo cho hệ thống enterprise, tự học nhanh, cẩn thận khi làm hệ thống legacy và giao tiếp rõ ràng với khách Nhật.' },
    { q: 'Điểm yếu của bạn là gì?', tip: 'Nói điểm THẬT đang cải thiện, không "giả yếu" kiểu "em quá cầu toàn".',
      sample: 'Đôi khi em sa đà vào chi tiết kỹ thuật; em đang tập ước lượng và ưu tiên theo giá trị. Tiếng Anh giao tiếp (B1) em đang luyện thêm mỗi ngày.' },
    { q: 'Vì sao bạn muốn đổi việc / ứng tuyển vị trí này?', tip: 'Hướng tích cực, không nói xấu công ty cũ.',
      sample: 'Em muốn thử thách với hệ thống backend quy mô lớn hơn và công nghệ mới; định hướng của công ty phù hợp với mục tiêu phát triển sâu về backend của em.' },
    { q: 'Bạn thấy mình ở đâu trong 3–5 năm tới?', tip: 'Gắn với lộ trình kỹ thuật thực tế.',
      sample: 'Trở thành Senior Backend vững về thiết kế hệ thống và tối ưu hiệu năng, có thể dẫn dắt phần kỹ thuật và mentor thành viên mới.' },
    { q: 'Mức lương mong muốn của bạn?', tip: 'Tìm hiểu thị trường trước; đưa một KHOẢNG dựa trên giá trị, đừng chốt cứng một số quá sớm.',
      sample: 'Dựa trên gần 2 năm kinh nghiệm và mặt bằng thị trường cho Java backend, em mong muốn khoảng [X–Y]. Em cởi mở trao đổi tùy phạm vi công việc và tổng phúc lợi.' },
    { q: 'Bạn xử lý áp lực và deadline gấp thế nào?', tip: 'Cho thấy cách bạn ưu tiên và giao tiếp.',
      sample: 'Em chia nhỏ task, ưu tiên phần rủi ro/giá trị cao trước, và báo sớm cho quản lý khi thấy nguy cơ trễ để cùng điều chỉnh phạm vi thay vì im lặng.' },
    { q: 'Kể về một lần bạn thất bại hoặc mắc lỗi.', tip: 'Chọn lỗi thật, nhấn bài học và cách phòng ngừa.',
      sample: 'Kể một sự cố cụ thể (vd đẩy nhầm cấu hình), cách em khắc phục nhanh, rồi bổ sung test/checklist/monitoring để không tái diễn.' },
  ],

  // Câu hỏi nên hỏi ngược nhà tuyển dụng (thể hiện sự nghiêm túc).
  askThem: [
    'Team đang dùng stack và quy trình gì (code review, CI/CD, testing)?',
    'Thách thức kỹ thuật lớn nhất của hệ thống hiện tại là gì?',
    'Lộ trình phát triển và cơ hội lên senior cho vị trí này ra sao?',
    'Văn hóa làm việc và cách phối hợp với khách hàng/đội ở Nhật thế nào?',
    'Kỳ vọng dành cho người mới trong 3–6 tháng đầu là gì?',
  ],

  // Mẹo đàm phán lương.
  negotiation: [
    'Tìm hiểu mặt bằng lương cho Java backend ~2 năm KN trước buổi phỏng vấn.',
    'Nếu được, để nhà tuyển dụng nêu con số trước; nếu phải nói, đưa một khoảng dựa trên dữ liệu.',
    'Neo bằng giá trị: tốt nghiệp thủ khoa, kinh nghiệm làm hệ thống cho khách Nhật, làm được cả backend lẫn frontend.',
    'Xét TỔNG thu nhập (thưởng, phụ cấp, OT, cơ hội học hỏi) chứ không chỉ lương cứng.',
    'Thương lượng lịch sự, không ra tối hậu thư; có thể xin thời gian cân nhắc trước khi chốt.',
  ],

  // Nên / Không nên trong buổi phỏng vấn.
  dosDonts: {
    dos: [
      'Đến sớm; nếu online, kiểm tra mic/camera/mạng trước 10 phút.',
      'Chuẩn bị sẵn 2–3 câu hỏi ngược và bản giới thiệu 60 giây.',
      'Nói "TÔI đã làm gì" khi kể việc của mình, minh họa bằng con số.',
      'Không biết thì thành thật và nói cách bạn sẽ tìm ra.',
      'Nghĩ thành tiếng khi làm bài kỹ thuật để người phỏng vấn thấy tư duy.',
      'Thay các phần [ ] trong STAR bằng số liệu THẬT của bạn trước khi vào phỏng vấn thật — interviewer hay hỏi "chính xác bao nhiêu?".',
    ],
    donts: [
      'Nói xấu công ty/đồng nghiệp cũ.',
      'Trả lời chung chung, không có ví dụ cụ thể.',
      'Giả vờ biết thứ mình không biết.',
      'Lan man, trả lời lạc đề quá dài.',
      'Quên hỏi lại nhà tuyển dụng ở cuối buổi.',
    ],
  },
}

// -------------------- Helpers (test được) --------------------
/** Trả về các câu hỏi thuộc một chủ đề (giữ nguyên thứ tự khai báo). */
export function questionsByTopic(topic) {
  return QUESTION_BANK.filter((q) => q.topic === topic)
}

/**
 * Bốc một bộ câu hỏi cho buổi phỏng vấn.
 * @param {{ topics?: string[], level?: string, count?: number, seed?: number }} opts
 *   - topics: rỗng/undefined = mọi chủ đề.
 *   - level: 'easy'|'medium'|'hard' hoặc undefined = mọi mức.
 *   - count: số câu tối đa (mặc định 8).
 *   - seed: để quay vòng điểm bắt đầu (xác định, không random — test được).
 * @returns {Array} danh sách câu hỏi (không trùng), tối đa `count`.
 */
export function pickInterviewSet({ topics = [], level, count = 8, seed = 0 } = {}) {
  const topicSet = new Set((topics || []).filter((t) => TOPIC_KEYS.has(t)))
  let pool = QUESTION_BANK.filter((q) => {
    if (topicSet.size && !topicSet.has(q.topic)) return false
    if (level && q.level !== level) return false
    return true
  })
  if (!pool.length) return []

  // Trải đều theo chủ đề: gom theo topic rồi lấy luân phiên, bắt đầu lệch theo seed.
  const byTopic = new Map()
  for (const q of pool) {
    if (!byTopic.has(q.topic)) byTopic.set(q.topic, [])
    byTopic.get(q.topic).push(q)
  }
  const buckets = [...byTopic.values()]
  const startShift = Math.abs(Math.floor(Number(seed) || 0))
  // Lệch điểm bắt đầu trong mỗi bucket để buổi sau không lặp y hệt buổi trước.
  for (const b of buckets) {
    const s = startShift % b.length
    if (s) b.push(...b.splice(0, s))
  }
  const out = []
  let idx = 0
  while (out.length < count && buckets.some((b) => b.length)) {
    const b = buckets[idx % buckets.length]
    if (b.length) out.push(b.shift())
    idx++
  }
  return out.slice(0, count)
}

/** Lọc coding challenge theo dạng (pattern), vd 'two-pointer', 'dp', 'tree'. */
export function challengesByPattern(pattern) {
  return CODING_CHALLENGES.filter((c) => c.pattern === pattern)
}

/** Danh sách các pattern đang có, theo thứ tự xuất hiện đầu tiên (dùng cho bộ lọc UI). */
export function challengePatterns() {
  const seen = new Set()
  const out = []
  for (const c of CODING_CHALLENGES) {
    if (c.pattern && !seen.has(c.pattern)) {
      seen.add(c.pattern)
      out.push(c.pattern)
    }
  }
  return out
}

export const INTERVIEW_TOTALS = {
  questions: QUESTION_BANK.length,
  topics: INTERVIEW_TOPICS.length,
  challenges: CODING_CHALLENGES.length,
  stories: INTERVIEW_SKILLS.starStories.length,
}
