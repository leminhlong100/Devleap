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
  { key: 'scenario', label: 'Tình huống & Thiết kế', icon: '🧭', blurb: 'Thiết kế API, debug prod, idempotency, đánh đổi thực tế' },
  { key: 'behavioral', label: 'Behavioral', icon: '🗣️', blurb: 'STAR, kể dự án, tình huống' },
]

const TOPIC_KEYS = new Set(INTERVIEW_TOPICS.map((t) => t.key))
export const LEVELS = ['easy', 'medium', 'hard']

/** Nhãn tiếng Việt cho từng chủ đề (tra nhanh). */
export function topicLabel(key) {
  return INTERVIEW_TOPICS.find((t) => t.key === key)?.label || key
}

// -------------------- Ngân hàng câu hỏi --------------------
// Mỗi câu: { id, topic, level, q, points: [ý chính], answer: đáp án mẫu ngắn }.
export const QUESTION_BANK = [
  // ---------- Java Core ----------
  { id: 'core-1', topic: 'core', level: 'easy', q: 'Phân biệt JDK, JRE và JVM?',
    points: ['JVM: máy ảo chạy bytecode', 'JRE = JVM + thư viện runtime', 'JDK = JRE + công cụ biên dịch (javac)'],
    answer: 'JVM là máy ảo thực thi bytecode. JRE = JVM + thư viện chuẩn để CHẠY ứng dụng. JDK = JRE + bộ công cụ phát triển (javac, jar, javadoc) để LẬP TRÌNH.' },
  { id: 'core-2', topic: 'core', level: 'easy', q: '`==` khác `equals()` thế nào?',
    points: ['`==` so sánh tham chiếu (địa chỉ)', '`equals()` so sánh nội dung (nếu được override)', 'Với object mặc định equals() = =='],
    answer: '`==` so sánh tham chiếu (cùng object trên heap hay không). `equals()` so sánh nội dung nếu class đã override; mặc định của Object thì equals() vẫn là so tham chiếu.' },
  { id: 'core-3', topic: 'core', level: 'medium', q: 'Vì sao String immutable trong Java? Lợi ích?',
    points: ['String pool tái dùng', 'An toàn làm key của HashMap', 'Thread-safe, cache hashCode', 'Bảo mật (đường dẫn, kết nối)'],
    answer: 'String bất biến để hỗ trợ String pool (tái dùng literal), an toàn khi làm key HashMap (hashCode không đổi), thread-safe và bảo mật. Muốn nối chuỗi trong vòng lặp thì dùng StringBuilder.' },
  { id: 'core-4', topic: 'core', level: 'medium', q: 'String vs StringBuilder vs StringBuffer?',
    points: ['String: bất biến', 'StringBuilder: khả biến, KHÔNG đồng bộ (nhanh)', 'StringBuffer: khả biến, đồng bộ (thread-safe, chậm hơn)'],
    answer: 'String bất biến. StringBuilder khả biến, không đồng bộ nên nhanh — dùng trong 1 luồng. StringBuffer giống StringBuilder nhưng các method synchronized, thread-safe nhưng chậm hơn.' },
  { id: 'core-5', topic: 'core', level: 'medium', q: 'Từ khóa `final` dùng cho biến, method, class có ý nghĩa gì?',
    points: ['final biến: không gán lại (hằng)', 'final method: không override được', 'final class: không kế thừa được (vd String)'],
    answer: 'final trên biến = không gán lại sau khởi tạo; trên method = lớp con không override; trên class = không thể kế thừa. Lưu ý final trên object chỉ khóa tham chiếu, nội dung object vẫn đổi được.' },
  { id: 'core-6', topic: 'core', level: 'medium', q: '`static` là gì? Khi nào dùng biến/method static?',
    points: ['Thuộc về class, không thuộc instance', 'Chia sẻ chung mọi object', 'Gọi qua tên class', 'Hàm tiện ích, hằng số'],
    answer: 'static thuộc về class, chỉ có 1 bản chia sẻ cho mọi instance, truy cập qua tên class. Dùng cho hằng số, hàm tiện ích (utility), bộ đếm chung. Method static không truy cập được biến instance/this.' },
  { id: 'core-7', topic: 'core', level: 'hard', q: 'Autoboxing là gì? Cạm bẫy với Integer cache?',
    points: ['Tự chuyển int <-> Integer', 'Integer cache -128..127', '`==` trên Integer ngoài khoảng -> false', 'NPE khi unbox null'],
    answer: 'Autoboxing tự chuyển primitive ↔ wrapper. Integer cache các giá trị -128..127 nên `==` hai Integer trong khoảng đó là true, ngoài khoảng là false — luôn dùng equals(). Unbox một Integer null gây NullPointerException.' },
  { id: 'core-8', topic: 'core', level: 'medium', q: 'Truyền tham số trong Java là pass-by-value hay pass-by-reference?',
    points: ['Luôn pass-by-value', 'Với object: copy GIÁ TRỊ của tham chiếu', 'Đổi field bên trong thì thấy; gán lại tham chiếu thì không'],
    answer: 'Java luôn pass-by-value. Với object, giá trị được copy là tham chiếu — nên sửa field bên trong object thì caller thấy, nhưng gán lại tham chiếu trong method không ảnh hưởng biến gốc.' },
  { id: 'core-9', topic: 'core', level: 'easy', q: 'Overloading và overriding khác nhau thế nào?',
    points: ['Overload: cùng tên, khác tham số, compile-time', 'Override: cùng signature ở lớp con, runtime', 'Override tuân @Override, luật covariant return'],
    answer: 'Overloading: cùng tên method nhưng khác danh sách tham số, quyết định lúc biên dịch. Overriding: lớp con định nghĩa lại method cùng signature của lớp cha, quyết định lúc chạy (dynamic dispatch).' },
  { id: 'core-10', topic: 'core', level: 'hard', q: 'Java 8+ có gì đáng chú ý mà bạn hay dùng?',
    points: ['Lambda + Stream', 'Optional', 'default method trên interface', 'java.time (LocalDate/LocalDateTime)', 'var (Java 10), record (16), sealed (17)'],
    answer: 'Lambda & Stream API, Optional để tránh null, default method trên interface, java.time thay Date/Calendar. Bản mới hơn: var (10), record cho DTO bất biến (16), sealed class, switch expression, text block.' },

  // ---------- OOP ----------
  { id: 'oop-1', topic: 'oop', level: 'easy', q: 'Bốn tính chất của OOP là gì?',
    points: ['Encapsulation (đóng gói)', 'Inheritance (kế thừa)', 'Polymorphism (đa hình)', 'Abstraction (trừu tượng)'],
    answer: 'Đóng gói (private + getter/setter), Kế thừa (extends, tái dùng), Đa hình (override runtime / overload compile-time), Trừu tượng (ẩn chi tiết qua abstract/interface).' },
  { id: 'oop-2', topic: 'oop', level: 'medium', q: 'Interface khác abstract class thế nào? Khi nào dùng cái nào?',
    points: ['Interface: implement nhiều, "CAN-DO"', 'Abstract: extend 1, có state + constructor, "IS-A"', 'Interface Java 8+ có default/static method'],
    answer: 'Interface là hợp đồng, một lớp implement được nhiều interface, chỉ chứa hằng số và (từ Java 8) default/static method — dùng khi mô tả khả năng "CAN-DO". Abstract class có state, constructor, method cụ thể, chỉ extend một — dùng khi có quan hệ "IS-A" và chia sẻ code chung.' },
  { id: 'oop-3', topic: 'oop', level: 'hard', q: 'Hợp đồng equals()/hashCode() là gì? Quên override hashCode gây lỗi gì?',
    points: ['equal => hashCode bằng nhau', 'hashCode bằng nhau không bắt buộc equal', 'Quên hashCode: HashMap/HashSet chứa trùng, get() trả null'],
    answer: 'Nếu a.equals(b) thì a.hashCode() phải bằng b.hashCode() (chiều ngược lại không bắt buộc). Override equals mà quên hashCode khiến hai object "bằng nhau" rơi vào bucket khác nhau → HashSet chứa trùng, HashMap.get() trả null.' },
  { id: 'oop-4', topic: 'oop', level: 'medium', q: 'Composition vs Inheritance — nên ưu tiên cái nào?',
    points: ['"Favor composition over inheritance"', 'Kế thừa: coupling chặt, phá vỡ đóng gói', 'Composition: linh hoạt, dễ test, dễ thay đổi'],
    answer: 'Ưu tiên composition (has-a) hơn inheritance (is-a) vì kế thừa gắn kết chặt lớp con vào lớp cha và dễ vỡ khi cha đổi. Composition linh hoạt, dễ thay thế thành phần, dễ test — chỉ kế thừa khi thật sự có quan hệ is-a.' },
  { id: 'oop-5', topic: 'oop', level: 'hard', q: 'Cách tạo một immutable class?',
    points: ['class final', 'field private final', 'không setter', 'defensive copy field khả biến ở constructor & getter'],
    answer: 'Đặt class là final, mọi field private final, không có setter, khởi tạo hết ở constructor; với field kiểu khả biến (List, Date) phải copy phòng thủ khi nhận vào và khi trả ra để không lộ tham chiếu bên trong.' },
  { id: 'oop-6', topic: 'oop', level: 'medium', q: 'Đa hình (polymorphism) hoạt động thế nào lúc runtime?',
    points: ['Dynamic method dispatch', 'Kiểu thực của object quyết định method chạy', 'Biến kiểu cha trỏ object con'],
    answer: 'Với method được override, JVM chọn phiên bản theo KIỂU THỰC của object lúc chạy (dynamic dispatch), không theo kiểu biến khai báo. Nhờ đó biến kiểu cha trỏ tới object con vẫn gọi đúng method của con.' },
  { id: 'oop-7', topic: 'oop', level: 'medium', q: 'Comparable khác Comparator thế nào?',
    points: ['Comparable: compareTo, thứ tự "tự nhiên", 1 cách', 'Comparator: compare, thứ tự ngoài, nhiều cách', 'Comparator.comparing(...)'],
    answer: 'Comparable định nghĩa thứ tự tự nhiên ngay trong class (compareTo), chỉ một cách sắp. Comparator là bộ so sánh bên ngoài (compare), tạo được nhiều tiêu chí khác nhau — tiện với Comparator.comparing().thenComparing().' },
  { id: 'oop-8', topic: 'oop', level: 'hard', q: 'Diamond problem là gì? Java xử lý ra sao?',
    points: ['Đa kế thừa gây nhập nhằng', 'Java cấm đa kế thừa class', 'Interface default method trùng -> lớp phải override, gọi A.super.m()'],
    answer: 'Diamond problem là nhập nhằng khi kế thừa cùng lúc hai nguồn có cùng method. Java cấm đa kế thừa class. Với interface, nếu hai default method trùng thì lớp bắt buộc override và có thể gọi rõ InterfaceA.super.method().' },

  // ---------- Collections ----------
  { id: 'col-1', topic: 'collections', level: 'easy', q: 'ArrayList khác LinkedList thế nào? Khi nào chọn LinkedList?',
    points: ['ArrayList: mảng động, random access O(1)', 'LinkedList: danh sách liên kết, chèn/xóa đầu-cuối O(1)', '95% dùng ArrayList'],
    answer: 'ArrayList dựa trên mảng — truy cập theo index O(1), chèn/xóa giữa O(n). LinkedList là danh sách liên kết đôi — thêm/xóa đầu-cuối O(1) nhưng truy cập index O(n). Thực tế hầu hết dùng ArrayList; LinkedList hợp khi làm Queue/Deque.' },
  { id: 'col-2', topic: 'collections', level: 'hard', q: 'HashMap hoạt động bên trong thế nào?',
    points: ['Mảng bucket (mặc định 16)', 'hash(key) -> index', 'Va chạm -> linked list, >8 & cap>=64 -> cây đỏ đen', 'load factor 0.75 -> rehash ×2'],
    answer: 'HashMap là mảng bucket. Key được băm ra index; va chạm thì nối thành linked list, khi một bucket >8 phần tử và bảng ≥64 thì chuyển sang cây đỏ đen (O(log n)). Khi số phần tử vượt capacity×0.75 thì rehash gấp đôi.' },
  { id: 'col-3', topic: 'collections', level: 'medium', q: 'HashMap, LinkedHashMap và TreeMap khác nhau ra sao?',
    points: ['HashMap: không thứ tự, O(1)', 'LinkedHashMap: giữ thứ tự thêm/truy cập', 'TreeMap: sắp theo key, O(log n), range query'],
    answer: 'HashMap không đảm bảo thứ tự, thao tác O(1). LinkedHashMap giữ thứ tự chèn (hoặc thứ tự truy cập — làm LRU cache). TreeMap sắp xếp theo key bằng cây đỏ đen, O(log n), hỗ trợ truy vấn khoảng (firstKey, floorKey, subMap).' },
  { id: 'col-4', topic: 'collections', level: 'medium', q: 'HashSet lưu trữ thế nào? Vì sao phần tử không trùng?',
    points: ['Bọc một HashMap bên trong', 'Phần tử = key, value là hằng dummy', 'Dựa equals()/hashCode() để loại trùng'],
    answer: 'HashSet bên trong dùng một HashMap, phần tử làm key còn value là một object hằng. Việc chống trùng dựa vào equals()/hashCode() của phần tử — nên object tự định nghĩa phải override cả hai.' },
  { id: 'col-5', topic: 'collections', level: 'hard', q: 'Fail-fast và fail-safe iterator là gì?',
    points: ['Fail-fast: ném CME khi collection đổi lúc lặp (ArrayList, HashMap)', 'Cơ chế modCount', 'Fail-safe: lặp trên bản sao (CopyOnWriteArrayList, ConcurrentHashMap)'],
    answer: 'Fail-fast iterator ném ConcurrentModificationException nếu collection bị sửa cấu trúc trong lúc lặp (phát hiện qua modCount) — như ArrayList, HashMap. Fail-safe lặp trên bản sao/snapshot nên không ném nhưng có thể không thấy thay đổi mới — như CopyOnWriteArrayList, ConcurrentHashMap.' },
  { id: 'col-6', topic: 'collections', level: 'medium', q: 'Làm sao xóa phần tử khi đang duyệt list mà không lỗi?',
    points: ['Không xóa trực tiếp trong for-each', 'Dùng Iterator.remove()', 'hoặc removeIf(predicate)'],
    answer: 'Không xóa trực tiếp trong vòng for-each (gây ConcurrentModificationException). Dùng iterator.remove() khi lặp bằng Iterator, hoặc gọn hơn là list.removeIf(điều_kiện).' },
  { id: 'col-7', topic: 'collections', level: 'hard', q: 'HashMap có thread-safe không? Thay bằng gì?',
    points: ['KHÔNG thread-safe', 'ConcurrentHashMap: lock theo bucket + CAS', 'Collections.synchronizedMap: lock toàn map', 'Hashtable legacy'],
    answer: 'HashMap không thread-safe (resize song song có thể mất dữ liệu). Đa luồng nên dùng ConcurrentHashMap (khóa mịn theo bucket + CAS, throughput cao, có computeIfAbsent/merge). Collections.synchronizedMap khóa cả map nên chậm; Hashtable là legacy.' },
  { id: 'col-8', topic: 'collections', level: 'easy', q: 'Độ phức tạp của các thao tác chính trên ArrayList, HashMap, TreeMap?',
    points: ['ArrayList: get O(1), add cuối O(1) amortized, xóa giữa O(n)', 'HashMap: get/put O(1) trung bình', 'TreeMap: O(log n)'],
    answer: 'ArrayList: get theo index O(1), add cuối O(1) amortized (thi thoảng resize O(n)), chèn/xóa giữa O(n). HashMap: get/put trung bình O(1), xấu nhất O(log n) khi treeify. TreeMap: mọi thao tác O(log n).' },

  // ---------- Exception ----------
  { id: 'exc-1', topic: 'exception', level: 'easy', q: 'Checked và unchecked exception khác nhau thế nào?',
    points: ['Checked: compiler bắt handle/throws (IOException)', 'Unchecked: RuntimeException, không bắt buộc', 'Error: sự cố JVM, không catch'],
    answer: 'Checked exception (IOException, SQLException) buộc phải catch hoặc khai báo throws — dùng khi lỗi có thể phục hồi. Unchecked (RuntimeException như NPE, IllegalArgument) là lỗi lập trình, không bắt buộc xử lý. Error (OOM, StackOverflow) là sự cố JVM, thường không catch.' },
  { id: 'exc-2', topic: 'exception', level: 'medium', q: 'try-with-resources là gì? Lợi ích so với finally?',
    points: ['Tự đóng resource (AutoCloseable)', 'Đóng theo thứ tự ngược', 'Xử lý đúng suppressed exception', 'Ngắn gọn, ít lỗi'],
    answer: 'try-with-resources tự gọi close() cho mọi resource implement AutoCloseable, đóng theo thứ tự ngược khai báo, và giữ đúng exception gốc (exception khi close bị "suppressed"). Ngắn gọn và an toàn hơn tự đóng trong finally.' },
  { id: 'exc-3', topic: 'exception', level: 'medium', q: '`finally` có luôn chạy không?',
    points: ['Gần như luôn chạy, kể cả có return', 'Không chạy khi System.exit() hoặc JVM crash', 'return trong finally ghi đè (anti-pattern)'],
    answer: 'finally chạy cả khi try/catch có return hay ném exception. Ngoại lệ: System.exit() hoặc JVM bị kill. Tránh return trong finally vì nó ghi đè giá trị/exception của try.' },
  { id: 'exc-4', topic: 'exception', level: 'medium', q: 'Nên tạo custom exception kế thừa từ đâu?',
    points: ['Lỗi nghiệp vụ -> RuntimeException', 'Recoverable -> Exception (checked)', 'Có constructor (message) và (message, cause)'],
    answer: 'Lỗi nghiệp vụ thường extends RuntimeException (unchecked) để tránh boilerplate throws — hợp với Spring. Nếu muốn ép caller xử lý (recoverable) thì extends Exception. Luôn cung cấp constructor nhận message và nhận (message, cause) để giữ chuỗi nguyên nhân.' },
  { id: 'exc-5', topic: 'exception', level: 'hard', q: 'Exception chaining là gì? Vì sao quan trọng?',
    points: ['throw new X("msg", e) giữ cause', 'Không nuốt stack trace gốc', 'Debug dễ hơn'],
    answer: 'Exception chaining là bọc exception gốc vào exception mới qua constructor (cause) hoặc initCause(). Nhờ đó stack trace gốc được giữ, dễ truy nguyên. Ném new X(e.getMessage()) mà bỏ e là mất gốc — anti-pattern.' },
  { id: 'exc-6', topic: 'exception', level: 'easy', q: 'Có nên catch Exception hoặc Throwable chung chung không?',
    points: ['Tránh catch quá rộng nuốt lỗi', 'Không catch Throwable/Error', 'Catch cụ thể, log đầy đủ, xử lý đúng chỗ'],
    answer: 'Nên catch loại cụ thể nhất và xử lý đúng cách; catch Exception chung chung dễ nuốt lỗi ngoài dự kiến. Không bao giờ catch Throwable/Error vì đó là sự cố JVM. Nếu bắt rộng ở tầng biên thì phải log đầy đủ.' },

  // ---------- Generics ----------
  { id: 'gen-1', topic: 'generics', level: 'easy', q: 'Generics giải quyết vấn đề gì?',
    points: ['Type-safe lúc compile', 'Không cần ép kiểu', 'Tái dùng code cho nhiều kiểu'],
    answer: 'Generics cho phép viết code làm việc với nhiều kiểu mà vẫn kiểm tra kiểu lúc biên dịch, loại bỏ ép kiểu thủ công và lỗi ClassCastException lúc chạy.' },
  { id: 'gen-2', topic: 'generics', level: 'hard', q: 'PECS là gì? Giải thích ? extends và ? super.',
    points: ['Producer Extends, Consumer Super', '? extends T: chỉ đọc (T ra)', '? super T: chỉ ghi (T vào)'],
    answer: 'PECS = Producer Extends, Consumer Super. Nếu cấu trúc CUNG CẤP dữ liệu ra (đọc) dùng ? extends T; nếu TIÊU THỤ dữ liệu vào (ghi) dùng ? super T. Vừa đọc vừa ghi thì dùng T cố định.' },
  { id: 'gen-3', topic: 'generics', level: 'hard', q: 'Type erasure là gì? Hệ quả?',
    points: ['Generic bị xóa lúc runtime', 'List<String> == List<Integer> lúc chạy', 'Không new T(), new T[], instanceof T'],
    answer: 'Trình biên dịch xóa thông tin generic sau khi kiểm tra kiểu (type erasure), lúc runtime chỉ còn kiểu thô. Hệ quả: không tạo được new T(), new T[], không instanceof T, và không overload chỉ khác tham số generic. Cách khắc phục là truyền Class<T> vào.' },
  { id: 'gen-4', topic: 'generics', level: 'medium', q: 'Bounded type parameter là gì? Ví dụ?',
    points: ['<T extends Number> giới hạn kiểu', 'Gọi được method của bound', 'Có thể nhiều bound <T extends A & B>'],
    answer: 'Bounded type giới hạn T phải là con của một kiểu, ví dụ <T extends Number> để dùng được các method của Number (intValue…). Có thể chặn nhiều bound: <T extends Comparable<T> & Serializable>.' },

  // ---------- Stream & Lambda ----------
  { id: 'str-1', topic: 'stream', level: 'medium', q: 'Stream lazy evaluation nghĩa là gì?',
    points: ['Intermediate op không chạy tới khi có terminal', 'Cho phép short-circuit (findFirst)', 'Stream dùng một lần'],
    answer: 'Các thao tác trung gian (map, filter) chỉ được xây dựng chứ chưa chạy; chỉ khi gặp thao tác kết thúc (collect, forEach) pipeline mới thực thi. Nhờ lazy nên có short-circuit (findFirst, anyMatch dừng sớm). Một Stream chỉ dùng được một lần.' },
  { id: 'str-2', topic: 'stream', level: 'medium', q: 'map() khác flatMap() thế nào?',
    points: ['map: T -> R (1-1)', 'flatMap: T -> Stream<R> rồi làm phẳng (1-nhiều)', 'flatMap gộp list-of-list'],
    answer: 'map biến đổi mỗi phần tử 1-1 (T→R). flatMap biến mỗi phần tử thành một Stream rồi nối phẳng tất cả lại — dùng khi mỗi phần tử sinh nhiều giá trị hoặc để làm phẳng list lồng list.' },
  { id: 'str-3', topic: 'stream', level: 'medium', q: 'Collectors.groupingBy trả về gì?',
    points: ['Map<K, List<T>>', 'Kèm downstream: counting() -> Map<K,Long>', 'partitioningBy -> Map<Boolean,List>'],
    answer: 'groupingBy(classifier) trả Map<K, List<T>>. Kèm downstream collector đổi giá trị, ví dụ groupingBy(x, counting()) → Map<K, Long>, hoặc mapping/summingInt. partitioningBy chia thành true/false.' },
  { id: 'str-4', topic: 'stream', level: 'hard', q: 'Optional dùng đúng cách như thế nào?',
    points: ['Chỉ dùng làm return type', 'Không làm field/parameter', 'orElse vs orElseGet (lazy)', 'get() là anti-pattern'],
    answer: 'Optional dùng để biểu thị "có thể không có giá trị" ở return type, buộc caller xử lý rõ ràng. Không dùng làm field hay tham số. Ưu tiên map/orElseGet/orElseThrow; orElse(x) luôn tính x còn orElseGet(supplier) chỉ tính khi rỗng; tránh get() trần.' },
  { id: 'str-5', topic: 'stream', level: 'medium', q: 'Các functional interface cơ bản trong java.util.function?',
    points: ['Function<T,R>: biến đổi', 'Predicate<T>: điều kiện', 'Supplier<T>: cung cấp', 'Consumer<T>: side-effect'],
    answer: 'Function<T,R> biến đổi giá trị, Predicate<T> trả boolean để lọc, Supplier<T> cung cấp giá trị không nhận input, Consumer<T> nhận input làm side-effect không trả về. Còn BiFunction, UnaryOperator…' },
  { id: 'str-6', topic: 'stream', level: 'hard', q: 'Khi nào nên dùng parallelStream? Rủi ro?',
    points: ['Dataset lớn, CPU-bound, stateless', 'Dùng chung ForkJoinPool.commonPool', 'Tránh: I/O-bound, shared mutable, thứ tự quan trọng'],
    answer: 'parallelStream hợp khi dữ liệu lớn, tính toán nặng CPU, thao tác stateless và không chia sẻ trạng thái. Rủi ro: nó dùng chung ForkJoinPool.commonPool (nghẽn với tác vụ I/O), sai khi có shared mutable state, và tốn kém với dữ liệu nhỏ.' },

  // ---------- Concurrency ----------
  { id: 'con-1', topic: 'concurrency', level: 'medium', q: 'Thread và Runnable/Callable khác nhau ra sao?',
    points: ['Runnable: run() không trả về, không checked ex', 'Callable<T>: call() trả T + throws', 'submit(Callable) -> Future<T>'],
    answer: 'Runnable.run() không trả kết quả và không ném checked exception. Callable<T>.call() trả về T và có thể ném checked exception; nộp vào ExecutorService.submit() nhận Future<T> để lấy kết quả sau.' },
  { id: 'con-2', topic: 'concurrency', level: 'hard', q: 'volatile giải quyết gì? Khi nào không đủ?',
    points: ['Đảm bảo visibility giữa thread', 'KHÔNG đảm bảo atomicity', 'count++ vẫn sai -> Atomic/synchronized'],
    answer: 'volatile đảm bảo mọi thread luôn đọc giá trị mới nhất (visibility) và chặn tái sắp xếp lệnh, nhưng KHÔNG đảm bảo tính nguyên tử. Với thao tác đọc-sửa-ghi như count++ thì volatile không đủ, phải dùng AtomicInteger hoặc synchronized.' },
  { id: 'con-3', topic: 'concurrency', level: 'medium', q: 'synchronized và ReentrantLock khác nhau chỗ nào?',
    points: ['synchronized: đơn giản, tự nhả', 'ReentrantLock: tryLock(timeout), fairness, Condition', 'Lock phải unlock trong finally'],
    answer: 'synchronized đơn giản, tự động nhả khóa khi ra khỏi block. ReentrantLock linh hoạt hơn: tryLock có timeout, khóa công bằng (fairness), lockInterruptibly, nhiều Condition — nhưng phải nhớ unlock trong finally.' },
  { id: 'con-4', topic: 'concurrency', level: 'hard', q: 'Deadlock là gì? 4 điều kiện và cách tránh?',
    points: ['Mutual exclusion, hold-and-wait, no preemption, circular wait', 'Tránh: lock ordering nhất quán', 'tryLock có timeout'],
    answer: 'Deadlock là các thread chờ khóa lẫn nhau vô hạn. Bốn điều kiện: loại trừ tương hỗ, giữ-và-chờ, không tước đoạt, chờ vòng tròn. Tránh bằng cách khóa theo thứ tự nhất quán, dùng tryLock có timeout, giảm phạm vi khóa, dùng java.util.concurrent.' },
  { id: 'con-5', topic: 'concurrency', level: 'medium', q: 'ExecutorService là gì? Vì sao hơn tự new Thread?',
    points: ['Quản lý thread pool tái dùng thread', 'Tách nộp task khỏi thực thi', 'shutdown() vs shutdownNow()'],
    answer: 'ExecutorService quản lý một pool tái dùng thread thay vì tạo/hủy thread liên tục (tốn kém), giới hạn số thread tránh cạn tài nguyên, và tách việc nộp task khỏi cách thực thi. Nhớ shutdown() để nhả thread; shutdownNow() cố dừng ngay.' },
  { id: 'con-6', topic: 'concurrency', level: 'hard', q: 'CompletableFuture giải quyết gì mà Future không làm được?',
    points: ['Chain non-blocking thenApply/thenCompose', 'Kết hợp allOf/anyOf', 'Xử lý lỗi exceptionally/handle'],
    answer: 'Future chỉ có get() blocking. CompletableFuture cho phép nối chuỗi non-blocking (thenApply=map, thenCompose=flatMap), kết hợp nhiều future (allOf/anyOf), và xử lý lỗi (exceptionally/handle). join() ném unchecked, get() ném checked.' },
  { id: 'con-7', topic: 'concurrency', level: 'hard', q: 'ThreadLocal là gì? Cạm bẫy trong thread pool?',
    points: ['Biến riêng theo thread', 'Thread pool tái dùng thread -> giá trị cũ leak', 'Luôn remove() trong finally'],
    answer: 'ThreadLocal cho mỗi thread một bản riêng của biến (vd giữ user context per-request). Trong thread pool thread bị tái dùng nên giá trị cũ có thể "dính" sang request sau (rò rỉ / lỗi bảo mật) — phải remove() trong finally.' },

  // ---------- Spring Boot & DI ----------
  { id: 'spr-1', topic: 'spring', level: 'easy', q: 'IoC và DI là gì?',
    points: ['IoC: container tạo & quản lý object', 'DI: tiêm phụ thuộc từ ngoài', 'Giảm coupling, dễ test'],
    answer: 'Inversion of Control: thay vì tự new phụ thuộc, object để container (ApplicationContext) tạo và quản lý. Dependency Injection là cách hiện thực — tiêm phụ thuộc từ bên ngoài vào, giúp loose coupling và dễ test (thay bằng mock).' },
  { id: 'spr-2', topic: 'spring', level: 'medium', q: 'Vì sao nên dùng constructor injection?',
    points: ['Phụ thuộc tường minh, bắt buộc', 'final -> immutable', 'Test không cần Spring', 'Phát hiện circular dependency sớm'],
    answer: 'Constructor injection khiến phụ thuộc trở nên tường minh và bắt buộc, cho phép khai báo final (bất biến), và test được bằng new MyService(mock) không cần Spring context. Field injection ẩn phụ thuộc và khó test hơn.' },
  { id: 'spr-3', topic: 'spring', level: 'medium', q: '@Component, @Service, @Repository, @Controller khác gì nhau?',
    points: ['Đều là @Component (được scan)', '@Repository: dịch exception thành DataAccessException', '@Service/@Controller: ngữ nghĩa tầng'],
    answer: 'Cả bốn đều là stereotype của @Component nên đều được component-scan. Khác nhau về ngữ nghĩa tầng: @Repository thêm chuyển đổi exception JPA sang DataAccessException; @Service đánh dấu tầng nghiệp vụ; @Controller/@RestController tầng web.' },
  { id: 'spr-4', topic: 'spring', level: 'medium', q: '@SpringBootApplication gồm những annotation nào?',
    points: ['@Configuration', '@EnableAutoConfiguration', '@ComponentScan'],
    answer: '@SpringBootApplication gộp ba annotation: @Configuration (khai báo bean), @EnableAutoConfiguration (tự cấu hình theo classpath), và @ComponentScan (quét bean trong package hiện tại và con).' },
  { id: 'spr-5', topic: 'spring', level: 'hard', q: 'Bean scope singleton của Spring có thread-safe không?',
    points: ['singleton = 1 instance / ApplicationContext', 'KHÔNG tự thread-safe', 'Phải viết stateless', 'Khác Singleton pattern (1/JVM)'],
    answer: 'Scope singleton nghĩa là một instance cho mỗi ApplicationContext (khác Singleton pattern 1/JVM), và Spring KHÔNG tự đảm bảo thread-safe. Vì bean được chia sẻ giữa nhiều request nên phải viết stateless, tránh field khả biến chia sẻ.' },
  { id: 'spr-6', topic: 'spring', level: 'hard', q: 'Auto-configuration của Spring Boot hoạt động thế nào?',
    points: ['Dựa classpath', '@ConditionalOnClass / @ConditionalOnMissingBean', 'Override bằng @Bean của mình'],
    answer: 'Spring Boot dò classpath và bật cấu hình theo điều kiện: có thư viện nào thì tự tạo bean tương ứng (vd có spring-data-jpa thì tự cấu hình DataSource), qua @ConditionalOnClass/@ConditionalOnMissingBean. Bạn định nghĩa @Bean cùng loại thì cái của bạn thắng.' },
  { id: 'spr-7', topic: 'spring', level: 'hard', q: 'Vì sao @Transactional/@Async không hoạt động khi gọi nội bộ (self-invocation)?',
    points: ['Chạy qua AOP proxy', 'Gọi this.method() bỏ qua proxy', 'Method không được private/final', 'Tách sang bean khác hoặc self-inject'],
    answer: 'Các annotation này hoạt động qua AOP proxy bọc bean. Khi một method trong bean gọi thẳng this.method() thì không đi qua proxy nên aspect không áp dụng. Cách xử lý: tách method sang bean khác, hoặc tự inject chính mình; method cũng không được private/final.' },
  { id: 'spr-8', topic: 'spring', level: 'medium', q: 'Spring Profile dùng để làm gì?',
    points: ['@Profile("dev") bật bean theo môi trường', 'spring.profiles.active', 'Cấu hình dev/test/prod khác nhau'],
    answer: '@Profile cho phép bean/cấu hình chỉ active trong môi trường nhất định (dev, test, prod). Kích hoạt qua spring.profiles.active hoặc biến môi trường — vd dev dùng H2, prod dùng PostgreSQL.' },

  // ---------- REST & MVC ----------
  { id: 'rest-1', topic: 'rest', level: 'easy', q: '@Controller khác @RestController thế nào?',
    points: ['@RestController = @Controller + @ResponseBody', '@RestController tự serialize JSON', '@Controller trả tên view'],
    answer: '@Controller trả về tên view (Thymeleaf/JSP). @RestController = @Controller + @ResponseBody, mọi giá trị trả về được serialize thẳng thành JSON — dùng cho REST API.' },
  { id: 'rest-2', topic: 'rest', level: 'easy', q: '@PathVariable khác @RequestParam thế nào?',
    points: ['@PathVariable: giá trị trong path /users/42', '@RequestParam: query string ?sort=name', 'PathVariable cho định danh tài nguyên'],
    answer: '@PathVariable lấy giá trị nằm trong đường dẫn (/users/{id}) — thường là định danh tài nguyên. @RequestParam lấy tham số query (?page=1&sort=name) — thường cho lọc/phân trang/sắp xếp.' },
  { id: 'rest-3', topic: 'rest', level: 'medium', q: 'Vì sao dùng DTO thay vì trả entity trực tiếp?',
    points: ['Tách API contract khỏi DB', 'Ẩn field nhạy cảm', 'Tránh LazyInitializationException', 'Versioning, validation riêng'],
    answer: 'DTO tách hợp đồng API khỏi cấu trúc entity: ẩn field nhạy cảm (password), tránh lộ quan hệ lazy gây LazyInitializationException khi serialize, cho phép versioning và validation riêng, giảm over-fetching.' },
  { id: 'rest-4', topic: 'rest', level: 'medium', q: 'Xử lý validation và exception toàn cục trong REST API thế nào?',
    points: ['@Valid @RequestBody + @NotBlank/@Size...', 'MethodArgumentNotValidException', '@RestControllerAdvice + @ExceptionHandler', 'Trả 400 + body lỗi rõ ràng'],
    answer: 'Dùng @Valid trên @RequestBody cùng các annotation @NotBlank/@Size/@Email; khi sai ném MethodArgumentNotValidException. Bắt tập trung bằng @RestControllerAdvice + @ExceptionHandler để trả HTTP status đúng và body lỗi thống nhất (RFC 7807 ProblemDetail).' },
  { id: 'rest-5', topic: 'rest', level: 'medium', q: 'Các HTTP status code hay dùng trong REST và ý nghĩa?',
    points: ['200 OK, 201 Created (+Location)', '204 No Content', '400 Bad Request, 401/403, 404', '409 Conflict, 500'],
    answer: '2xx thành công: 200 OK, 201 Created (kèm Location header khi POST tạo mới), 204 No Content (DELETE). 4xx lỗi client: 400 sai dữ liệu, 401 chưa auth, 403 không đủ quyền, 404 không thấy, 409 xung đột. 5xx lỗi server.' },
  { id: 'rest-6', topic: 'rest', level: 'medium', q: 'REST API thiết kế tốt tuân nguyên tắc gì?',
    points: ['Danh từ số nhiều /users', 'Dùng đúng HTTP method', 'Stateless', 'Versioning /api/v1', 'Idempotency của PUT/DELETE'],
    answer: 'Tài nguyên đặt danh từ số nhiều (/users/{id}), dùng đúng động từ HTTP (GET đọc, POST tạo, PUT/PATCH sửa, DELETE xóa), stateless, có versioning (/api/v1), phân trang, và trả status code chuẩn. GET/PUT/DELETE nên idempotent.' },
  { id: 'rest-7', topic: 'rest', level: 'hard', q: 'PUT khác PATCH thế nào? Idempotent là gì?',
    points: ['PUT: thay toàn bộ resource', 'PATCH: cập nhật một phần', 'Idempotent: gọi nhiều lần = một lần', 'PUT idempotent, POST không'],
    answer: 'PUT thay thế toàn bộ resource (gửi đủ trường), PATCH chỉ cập nhật phần thay đổi. Idempotent nghĩa là gọi nhiều lần cho kết quả như gọi một lần — PUT và DELETE idempotent, POST thì không.' },

  // ---------- JPA / Hibernate ----------
  { id: 'jpa-1', topic: 'jpa', level: 'hard', q: 'N+1 problem là gì? Cách khắc phục?',
    points: ['1 query lấy N entity + N query lazy = N+1', 'Fix: JOIN FETCH, @EntityGraph, @BatchSize, DTO projection', 'Phát hiện qua show-sql'],
    answer: 'N+1 xảy ra khi lấy N entity bằng 1 query rồi truy cập quan hệ lazy của từng cái sinh thêm N query. Khắc phục bằng JOIN FETCH (JPQL), @EntityGraph, @BatchSize, hoặc DTO projection. Phát hiện bằng cách bật spring.jpa.show-sql.' },
  { id: 'jpa-2', topic: 'jpa', level: 'medium', q: 'Fetch type LAZY và EAGER khác nhau? Mặc định của các quan hệ?',
    points: ['LAZY: nạp khi truy cập', 'EAGER: nạp ngay', '@ManyToOne/@OneToOne = EAGER; @OneToMany/@ManyToMany = LAZY', 'Nên để tất cả LAZY'],
    answer: 'LAZY chỉ nạp quan hệ khi thực sự truy cập; EAGER nạp ngay cùng entity. Mặc định *-ToOne là EAGER, *-ToMany là LAZY. Thực hành tốt là để tất cả LAZY rồi fetch chủ động khi cần (JOIN FETCH) để tránh nạp thừa.' },
  { id: 'jpa-3', topic: 'jpa', level: 'hard', q: 'Owning side và inverse side trong quan hệ hai chiều?',
    points: ['Owning giữ FK, có @JoinColumn', 'Inverse dùng mappedBy', 'Hibernate persist theo owning side', 'Phải đồng bộ 2 phía'],
    answer: 'Owning side là phía giữ khóa ngoại (có @JoinColumn, thường là @ManyToOne); inverse side dùng mappedBy trỏ về owning. Hibernate chỉ nhìn owning side để lưu quan hệ, nên khi bidirectional phải đồng bộ cả hai phía bằng helper method.' },
  { id: 'jpa-4', topic: 'jpa', level: 'medium', q: 'CascadeType.REMOVE khác orphanRemoval=true thế nào?',
    points: ['REMOVE: xóa child khi parent bị xóa', 'orphanRemoval: xóa child khi tách khỏi collection', 'orphanRemoval mạnh hơn'],
    answer: 'CascadeType.REMOVE xóa child chỉ khi parent bị xóa. orphanRemoval=true còn xóa child ngay khi nó bị gỡ khỏi collection của parent (mồ côi). Cẩn thận cascade REMOVE với @ManyToMany vì có thể xóa nhầm entity dùng chung.' },
  { id: 'jpa-5', topic: 'jpa', level: 'medium', q: 'JPQL, native query và Criteria/Specification — khi nào dùng?',
    points: ['Derived query: điều kiện đơn giản', 'JPQL: join phức tạp, portable', 'Native: SQL đặc thù DB, performance', 'Specification: query động type-safe'],
    answer: 'Derived query (findByEmail) cho điều kiện đơn giản. JPQL (@Query) cho join/subquery phức tạp mà vẫn portable. Native query khi cần tính năng đặc thù DB hoặc tối ưu hiệu năng. Specification/Criteria khi query động nhiều điều kiện tùy chọn.' },
  { id: 'jpa-6', topic: 'jpa', level: 'hard', q: 'Persistence context và dirty checking là gì?',
    points: ['Persistence context = cache cấp 1', 'Entity managed được theo dõi', 'Dirty checking: tự UPDATE khi field đổi lúc flush/commit'],
    answer: 'Persistence context là cache cấp 1 giữ các entity đang được quản lý trong một transaction. Dirty checking: Hibernate chụp trạng thái ban đầu và tự sinh UPDATE cho entity managed nào bị đổi field khi flush/commit — không cần gọi save() thủ công.' },
  { id: 'jpa-7', topic: 'jpa', level: 'medium', q: 'save() / persist() / merge() khác nhau thế nào?',
    points: ['persist: entity mới (transient)', 'merge: entity detached -> copy vào context', 'save (Spring Data) = persist hoặc merge tùy id'],
    answer: 'persist gắn một entity mới (transient) vào context. merge nhận entity detached, copy trạng thái vào một instance managed và trả về nó. Spring Data save() gọi persist nếu entity mới, merge nếu đã có id.' },

  // ---------- Transaction ----------
  { id: 'tx-1', topic: 'transaction', level: 'medium', q: '@Transactional hoạt động thế nào? Rollback khi nào?',
    points: ['AOP proxy mở/commit/rollback transaction', 'Mặc định rollback trên RuntimeException/Error', 'Checked exception KHÔNG rollback (trừ khi khai báo)'],
    answer: '@Transactional bọc method bằng proxy: mở transaction trước, commit sau, rollback nếu có lỗi. Mặc định chỉ rollback với unchecked (RuntimeException/Error); checked exception không rollback trừ khi khai báo rollbackFor.' },
  { id: 'tx-2', topic: 'transaction', level: 'hard', q: 'Các mức propagation hay dùng (REQUIRED, REQUIRES_NEW)?',
    points: ['REQUIRED (mặc định): dùng tx hiện có hoặc tạo mới', 'REQUIRES_NEW: luôn tạo tx mới, tạm dừng tx ngoài', 'NESTED: savepoint'],
    answer: 'REQUIRED (mặc định) tham gia transaction đang có hoặc tạo mới nếu chưa có. REQUIRES_NEW luôn mở transaction mới và tạm dừng cái đang chạy (vd ghi log/audit độc lập). NESTED tạo savepoint bên trong transaction cha.' },
  { id: 'tx-3', topic: 'transaction', level: 'hard', q: 'Isolation level và các anomaly (dirty/non-repeatable/phantom read)?',
    points: ['READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE', 'Dirty read: đọc dữ liệu chưa commit', 'Non-repeatable: đọc lại khác', 'Phantom: thêm dòng mới'],
    answer: 'Isolation kiểm soát mức thấy dữ liệu của transaction khác. READ_COMMITTED chặn dirty read; REPEATABLE_READ chặn thêm non-repeatable read; SERIALIZABLE chặn cả phantom read nhưng chậm nhất. Càng cao càng an toàn nhưng càng khóa nhiều.' },
  { id: 'tx-4', topic: 'transaction', level: 'medium', q: 'Vì sao nên đặt @Transactional(readOnly = true) cho method chỉ đọc?',
    points: ['Bỏ dirty checking', 'Tối ưu flush', 'Gợi ý DB/driver dùng read replica'],
    answer: 'readOnly=true báo cho Hibernate bỏ qua dirty checking và tối ưu flush (không cần snapshot để so sánh), giảm chi phí; một số hạ tầng còn định tuyến sang read replica. Dùng cho method chỉ truy vấn.' },
  { id: 'tx-5', topic: 'transaction', level: 'hard', q: 'Method có @Transactional nhưng bắt (catch) exception rồi không throw lại — có rollback không?',
    points: ['KHÔNG — proxy chỉ rollback khi exception THOÁT khỏi method', 'catch rồi nuốt lỗi = coi như thành công, transaction commit bình thường', 'Fix: throw lại (hoặc rethrow kiểu khác), hoặc tự gọi setRollbackOnly()'],
    answer: 'Không rollback. Cơ chế @Transactional dựa vào AOP proxy: proxy chỉ biết rollback khi có exception ném ra NGOÀI method mà nó bọc. Nếu bên trong bắt exception rồi xử lý êm (log rồi thôi, không throw lại) thì với proxy, method coi như chạy thành công và transaction vẫn commit — dù dữ liệu đã bị half-done. Cách khắc phục: throw lại exception (nguyên bản hoặc bọc lại), hoặc gọi TransactionAspectSupport.currentTransactionStatus().setRollbackOnly() ngay trong catch.' },
  { id: 'tx-6', topic: 'transaction', level: 'medium', q: 'Transaction timeout dùng để làm gì?',
    points: ['@Transactional(timeout = giây): giới hạn thời gian tối đa transaction được chạy', 'Quá hạn → tự rollback, ném TransactionTimedOutException', 'Chống transaction/query treo giữ khóa quá lâu, ảnh hưởng request khác'],
    answer: '@Transactional(timeout = n) đặt thời gian tối đa (giây) một transaction được phép chạy; quá hạn thì Spring tự rollback và ném TransactionTimedOutException. Mục đích là chống một transaction bị treo (query chậm, deadlock chờ, lỗi logic) giữ khóa/connection quá lâu và kéo theo ảnh hưởng các request khác đang chờ cùng tài nguyên.' },

  // ---------- Testing ----------
  { id: 'test-1', topic: 'testing', level: 'easy', q: 'Cấu trúc một unit test tốt (AAA) là gì?',
    points: ['Arrange - Act - Assert', 'Test 1 hành vi', 'Tên mô tả should_X_when_Y', 'Nhanh, độc lập, deterministic'],
    answer: 'Theo Arrange-Act-Assert: chuẩn bị dữ liệu/mock, gọi hành vi cần test, rồi khẳng định kết quả. Mỗi test kiểm 1 hành vi, tên mô tả rõ (should_return_x_when_y), chạy nhanh, độc lập và deterministic.' },
  { id: 'test-2', topic: 'testing', level: 'medium', q: '@Mock và @InjectMocks khác nhau thế nào?',
    points: ['@Mock: tạo mock cho phụ thuộc', '@InjectMocks: tạo object cần test, tiêm mock vào', '@ExtendWith(MockitoExtension.class)'],
    answer: '@Mock tạo đối tượng giả cho phụ thuộc. @InjectMocks tạo instance của class đang test và tiêm các @Mock vào nó (qua constructor/field). Cần @ExtendWith(MockitoExtension.class) để Mockito khởi tạo.' },
  { id: 'test-3', topic: 'testing', level: 'medium', q: 'when().thenReturn() khác verify() thế nào?',
    points: ['when().thenReturn(): stub, định nghĩa giá trị trả về', 'verify(): kiểm tra method được gọi (mấy lần, tham số gì)', 'Stub cho input, verify cho side-effect'],
    answer: 'when(mock.m()).thenReturn(x) là stub — quy định mock trả gì (kiểm soát input). verify(mock).m(arg) kiểm tra tương tác — method có được gọi không, bao nhiêu lần, với tham số nào (kiểm side-effect như save/sendEmail).' },
  { id: 'test-4', topic: 'testing', level: 'hard', q: '@WebMvcTest, @DataJpaTest, @SpringBootTest dùng khi nào?',
    points: ['@WebMvcTest: tầng web + MockMvc, mock service', '@DataJpaTest: tầng JPA + H2', '@SpringBootTest: full context, integration'],
    answer: '@WebMvcTest nạp riêng tầng web (controller + MockMvc), mock service — test controller. @DataJpaTest nạp tầng JPA với H2 in-memory — test repository. @SpringBootTest nạp toàn bộ context cho integration test end-to-end (chậm hơn).' },
  { id: 'test-5', topic: 'testing', level: 'medium', q: 'Mock, Stub và Spy khác nhau thế nào?',
    points: ['Stub: trả giá trị cố định', 'Mock: verify tương tác', 'Spy: object thật, override một phần', 'doReturn().when(spy) để tránh gọi thật'],
    answer: 'Stub trả giá trị định sẵn cho query. Mock dùng để verify tương tác. Spy bọc object thật và cho ghi đè một phần method (mặc định vẫn gọi thật — nên dùng doReturn().when(spy).m() để tránh chạy method thật).' },

  // ---------- Security & JWT ----------
  { id: 'sec-1', topic: 'security', level: 'easy', q: 'Authentication khác Authorization thế nào?',
    points: ['Authn: bạn là ai (đăng nhập)', 'Authz: bạn được làm gì (quyền)', 'Authn trước, authz sau'],
    answer: 'Authentication xác thực danh tính (bạn là ai — qua mật khẩu/token). Authorization xác định quyền (bạn được làm gì — role/permission). Authentication luôn diễn ra trước authorization.' },
  { id: 'sec-2', topic: 'security', level: 'medium', q: 'JWT gồm những phần nào? Có được mã hóa không?',
    points: ['header.payload.signature (Base64URL)', 'KHÔNG mã hóa — chỉ encode', 'Signature chống sửa (tamper)', 'Không để dữ liệu nhạy cảm'],
    answer: 'JWT gồm header.payload.signature nối bằng dấu chấm, mã Base64URL. Nó KHÔNG được mã hóa — ai cũng decode xem được payload; signature chỉ chống chỉnh sửa. Vì vậy không để dữ liệu nhạy cảm (mật khẩu, PII) trong payload.' },
  { id: 'sec-3', topic: 'security', level: 'hard', q: 'Vì sao dùng JWT stateless thay session? Nhược điểm?',
    points: ['Server không lưu state -> scale ngang dễ', 'Token tự chứa, verify bằng signature', 'Nhược: khó thu hồi -> short expiry + refresh token'],
    answer: 'JWT stateless để server không giữ session (token tự chứa, chỉ verify signature), nên dễ scale ngang không cần shared session store. Nhược điểm là khó thu hồi trước khi hết hạn — khắc phục bằng thời hạn ngắn + refresh token (+ blacklist khi cần).' },
  { id: 'sec-4', topic: 'security', level: 'medium', q: 'Vì sao lưu mật khẩu bằng BCrypt? Vì sao cần salt và cố tình chậm?',
    points: ['Hash một chiều + salt tự động', 'Salt chống rainbow table', 'Chậm (cost factor) chống brute-force', '2 user cùng pass -> khác hash'],
    answer: 'BCrypt băm một chiều kèm salt ngẫu nhiên nhúng sẵn trong hash, nên hai người cùng mật khẩu vẫn ra hash khác nhau (chống rainbow table). Nó cố tình chậm (điều chỉnh qua cost factor) để làm brute-force tốn kém. Verify bằng matches(raw, hashed).' },
  { id: 'sec-5', topic: 'security', level: 'hard', q: 'Spring Security xử lý request qua đâu? Role và Authority khác gì?',
    points: ['SecurityFilterChain (chuỗi filter)', 'JwtAuthenticationFilter extends OncePerRequestFilter', 'Role có prefix ROLE_, hasRole tự thêm', 'Authority mịn hơn'],
    answer: 'Request đi qua SecurityFilterChain; token JWT được xử lý ở một filter (OncePerRequestFilter) rồi đặt Authentication vào SecurityContext. Authority là quyền mịn; Role là nhóm quyền có prefix ROLE_ — hasRole("ADMIN") tự thêm prefix còn hasAuthority thì không.' },

  // ---------- SQL & Database ----------
  { id: 'sql-1', topic: 'sql', level: 'easy', q: 'INNER JOIN khác LEFT JOIN thế nào?',
    points: ['INNER: chỉ dòng khớp cả hai bảng', 'LEFT: giữ hết bảng trái, phải null nếu không khớp', 'RIGHT/FULL tương tự'],
    answer: 'INNER JOIN chỉ trả các dòng khớp ở cả hai bảng. LEFT JOIN giữ toàn bộ dòng bảng trái, cột bảng phải là NULL khi không có dòng khớp. RIGHT JOIN ngược lại; FULL OUTER giữ cả hai bên.' },
  { id: 'sql-2', topic: 'sql', level: 'medium', q: 'Index giúp gì? Đánh đổi khi tạo index?',
    points: ['Tăng tốc SELECT/WHERE/JOIN', 'B-tree, tìm O(log n)', 'Đánh đổi: chậm INSERT/UPDATE, tốn dung lượng'],
    answer: 'Index (thường B-tree) giúp tìm nhanh theo cột đánh index thay vì quét toàn bảng, tăng tốc WHERE/JOIN/ORDER BY. Đánh đổi: mỗi INSERT/UPDATE/DELETE phải cập nhật index nên ghi chậm hơn và tốn dung lượng — chỉ index cột hay lọc/join.' },
  { id: 'sql-3', topic: 'sql', level: 'medium', q: 'ACID là gì?',
    points: ['Atomicity: tất cả hoặc không', 'Consistency: giữ ràng buộc', 'Isolation: transaction độc lập', 'Durability: commit là bền'],
    answer: 'Atomicity: transaction thực hiện trọn vẹn hoặc không gì cả. Consistency: giữ dữ liệu hợp lệ theo ràng buộc. Isolation: các transaction song song không ảnh hưởng lẫn nhau. Durability: đã commit thì dữ liệu bền vững kể cả mất điện.' },
  { id: 'sql-4', topic: 'sql', level: 'medium', q: 'WHERE khác HAVING thế nào?',
    points: ['WHERE lọc dòng trước khi group', 'HAVING lọc nhóm sau GROUP BY', 'HAVING dùng được hàm tổng hợp'],
    answer: 'WHERE lọc từng dòng trước khi gom nhóm (không dùng được hàm tổng hợp). HAVING lọc sau GROUP BY, áp lên kết quả tổng hợp (vd HAVING COUNT(*) > 5).' },
  { id: 'sql-5', topic: 'sql', level: 'hard', q: 'Optimistic lock và pessimistic lock khác nhau thế nào?',
    points: ['Optimistic: @Version, kiểm tra khi commit', 'Pessimistic: khóa dòng ngay (SELECT FOR UPDATE)', 'Optimistic hợp ít xung đột'],
    answer: 'Optimistic lock không khóa; dùng cột @Version và kiểm tra lúc update — nếu version đổi thì ném OptimisticLockException. Pessimistic lock khóa dòng ngay khi đọc (SELECT ... FOR UPDATE). Optimistic hợp khi ít xung đột (throughput cao), pessimistic khi tranh chấp nhiều.' },

  // ---------- SOLID & Patterns ----------
  { id: 'sol-1', topic: 'solid', level: 'medium', q: 'SOLID là gì? Giải thích ngắn từng nguyên tắc.',
    points: ['S: một lý do để đổi', 'O: mở để mở rộng, đóng để sửa', 'L: con thay được cha', 'I: interface nhỏ', 'D: phụ thuộc abstraction'],
    answer: 'Single Responsibility (một class một lý do đổi), Open/Closed (mở rộng không sửa code cũ), Liskov (lớp con thay được lớp cha không phá vỡ), Interface Segregation (interface nhỏ chuyên biệt), Dependency Inversion (phụ thuộc abstraction, không phụ thuộc implementation).' },
  { id: 'sol-2', topic: 'solid', level: 'hard', q: 'Ví dụ vi phạm Liskov Substitution?',
    points: ['Square extends Rectangle', 'setWidth/setHeight phá vỡ invariant', 'Lớp con thu hẹp hành vi cha'],
    answer: 'Kinh điển là Square extends Rectangle: đặt width rồi height thì Square tự đổi cả hai, phá vỡ kỳ vọng area = w×h của Rectangle. Lớp con làm sai hợp đồng của cha (ném exception ngoài dự kiến, thu hẹp input) là vi phạm Liskov.' },
  { id: 'sol-3', topic: 'solid', level: 'medium', q: 'Bạn hay dùng design pattern nào? Cho ví dụ trong Spring.',
    points: ['Singleton (Spring bean)', 'Factory / Builder', 'Strategy (thay if-else)', 'Proxy (AOP, @Transactional)', 'Template Method (JdbcTemplate)'],
    answer: 'Singleton (bean Spring), Factory/Builder (tạo object phức tạp, Lombok @Builder), Strategy (tiêm nhiều implementation của một interface để thay if-else), Proxy (Spring AOP cho @Transactional), Template Method (JdbcTemplate/RestTemplate).' },
  { id: 'sol-4', topic: 'solid', level: 'hard', q: 'Cách hiện thực Singleton thread-safe trong Java?',
    points: ['enum Singleton (đơn giản, an toàn)', 'Double-checked locking + volatile', 'Bill Pugh (static holder)'],
    answer: 'Cách gọn và an toàn nhất là dùng enum. Ngoài ra có Bill Pugh (static inner holder, lazy + thread-safe nhờ class loading) hoặc double-checked locking với biến volatile. Tránh Singleton naive không đồng bộ.' },
  { id: 'sol-5', topic: 'solid', level: 'medium', q: 'Dependency Inversion khác Dependency Injection thế nào?',
    points: ['DIP: nguyên tắc — phụ thuộc abstraction (WHY)', 'DI: kỹ thuật — tiêm phụ thuộc (HOW)', 'DI là một cách đạt DIP'],
    answer: 'Dependency Inversion Principle là nguyên tắc thiết kế: module cấp cao và cấp thấp cùng phụ thuộc abstraction (lý do — WHY). Dependency Injection là kỹ thuật cụ thể tiêm phụ thuộc từ ngoài vào (cách làm — HOW), một phương tiện để đạt DIP.' },

  // ---------- JVM & Memory ----------
  { id: 'jvm-1', topic: 'jvm', level: 'medium', q: 'Heap và Stack khác nhau thế nào?',
    points: ['Heap: object, chia sẻ mọi thread, GC dọn', 'Stack: biến local & call frame, riêng mỗi thread', 'StackOverflow vs OutOfMemory'],
    answer: 'Heap chứa object, dùng chung cho mọi thread, do GC dọn — hết thì OutOfMemoryError. Stack chứa biến local và khung gọi hàm, riêng từng thread, tự giải phóng khi hàm return — đệ quy quá sâu thì StackOverflowError.' },
  { id: 'jvm-2', topic: 'jvm', level: 'medium', q: 'Garbage Collection hoạt động dựa trên nguyên tắc gì?',
    points: ['Dọn object không còn tham chiếu reachable', 'Chia young/old generation', 'Minor GC (young) vs Major/Full GC', 'G1 mặc định từ Java 9'],
    answer: 'GC thu hồi object không còn được tham chiếu từ GC roots (không reachable). Heap chia thế hệ: object mới ở young gen (Minor GC nhanh, thường xuyên), sống lâu thì thăng lên old gen (Major/Full GC). G1 là collector mặc định từ Java 9.' },
  { id: 'jvm-3', topic: 'jvm', level: 'hard', q: 'Memory leak trong Java xảy ra thế nào dù đã có GC?',
    points: ['Giữ tham chiếu không cần', 'static collection phình', 'ThreadLocal quên remove', 'Listener/cache không gỡ'],
    answer: 'GC chỉ dọn object không còn tham chiếu, nên leak xảy ra khi ta vô tình GIỮ tham chiếu không cần: static collection lớn dần, ThreadLocal quên remove trong thread pool, listener/callback không hủy đăng ký, cache không giới hạn. Object vẫn reachable nên không bị dọn.' },
  { id: 'jvm-4', topic: 'jvm', level: 'easy', q: 'ClassLoader là gì?',
    points: ['Nạp class vào JVM lúc cần', 'Phân cấp: Bootstrap -> Platform -> Application', 'Delegation model'],
    answer: 'ClassLoader nạp file .class vào JVM khi cần. Có phân cấp theo mô hình ủy quyền: Bootstrap (thư viện lõi) → Platform → Application (classpath ứng dụng); mỗi loader hỏi cha trước khi tự nạp.' },

  // ---------- Behavioral ----------
  { id: 'beh-1', topic: 'behavioral', level: 'easy', q: 'Hãy kể về một dự án bạn tự hào nhất (theo STAR).',
    points: ['Situation: bối cảnh dự án', 'Task: vai trò & mục tiêu của bạn', 'Action: bạn làm gì cụ thể', 'Result: kết quả đo được'],
    answer: 'Trả lời theo STAR: nêu bối cảnh dự án, vai trò và nhiệm vụ của bạn, các hành động cụ thể BẠN làm (công nghệ, quyết định), và kết quả đo lường được (giảm X% thời gian, phục vụ Y user). Nhấn "tôi" chứ không "chúng tôi".' },
  { id: 'beh-2', topic: 'behavioral', level: 'medium', q: 'Kể về một bug khó bạn từng debug và cách bạn tìm ra.',
    points: ['Mô tả triệu chứng', 'Cách khoanh vùng (log, reproduce, bisect)', 'Root cause', 'Bài học & cách phòng ngừa'],
    answer: 'Chọn một bug thật: mô tả triệu chứng và tác động, cách bạn tái hiện và khoanh vùng (đọc log, thêm metric, bisect commit), nguyên nhân gốc, cách sửa và bài học rút ra (thêm test, monitoring) để không tái diễn.' },
  { id: 'beh-3', topic: 'behavioral', level: 'medium', q: 'Khi bất đồng ý kiến kỹ thuật với đồng nghiệp, bạn xử lý thế nào?',
    points: ['Lắng nghe, hiểu lý do họ', 'Dựa dữ liệu/tiêu chí chung', 'PoC nếu cần', 'Tôn trọng quyết định cuối, cam kết'],
    answer: 'Lắng nghe để hiểu lập luận của họ, trình bày quan điểm dựa trên dữ liệu và tiêu chí chung (hiệu năng, bảo trì, deadline), làm PoC nhỏ nếu cần để so sánh khách quan, và một khi đã có quyết định thì tôn trọng và cùng thực hiện.' },
  { id: 'beh-4', topic: 'behavioral', level: 'easy', q: 'Một lần bạn phải học công nghệ mới rất nhanh?',
    points: ['Tình huống cần học gấp', 'Cách bạn học (docs, dự án nhỏ, mentor)', 'Áp dụng vào việc thật', 'Kết quả'],
    answer: 'Nêu tình huống cần công nghệ mới gấp, cách bạn tiếp cận (đọc tài liệu chính thống, làm dự án thử, hỏi mentor, đọc source), áp dụng ngay vào task thật, và kết quả đạt được — thể hiện khả năng tự học.' },
  { id: 'beh-5', topic: 'behavioral', level: 'medium', q: 'Vì sao bạn muốn rời công ty hiện tại / ứng tuyển vị trí này?',
    points: ['Hướng tích cực, không nói xấu', 'Muốn phát triển/thử thách mới', 'Kết nối với vị trí ứng tuyển'],
    answer: 'Trả lời tích cực, không chê bai công ty cũ: nhấn mong muốn phát triển, thử thách kỹ thuật mới, hoặc phù hợp định hướng nghề nghiệp — và liên hệ cụ thể vì sao vị trí/công ty này phù hợp.' },

  // ---------- SQL & Database (chuyên sâu) ----------
  { id: 'sql-6', topic: 'sql', level: 'hard', q: 'Một truy vấn chạy chậm — quy trình bạn tối ưu nó thế nào?',
    points: ['Đo trước: EXPLAIN/EXPLAIN ANALYZE xem execution plan', 'Tìm full-table scan, thiếu index, sort/temp table', 'Thêm index đúng cột lọc/join, tránh SELECT *, giảm dữ liệu trả về', 'Viết lại subquery/loại tính toán lặp, tránh N+1', 'Đo lại, so sánh'],
    answer: 'Đầu tiên đo bằng EXPLAIN/EXPLAIN ANALYZE để đọc execution plan, tìm full-table scan, thiếu index, filesort hay temp table. Rồi thêm index đúng cột dùng ở WHERE/JOIN/ORDER BY, tránh SELECT *, giảm số dòng phải xử lý, viết lại subquery lồng nhau và loại tính toán lặp, tránh N+1. Cuối cùng đo lại để xác nhận cải thiện.' },
  { id: 'sql-7', topic: 'sql', level: 'medium', q: 'Composite index là gì? Quy tắc leftmost prefix?',
    points: ['Index trên nhiều cột (a,b,c)', 'Chỉ dùng được khi lọc từ cột trái nhất liên tiếp', '(a), (a,b), (a,b,c) OK; (b) hoặc (b,c) không tận dụng', 'Thứ tự cột quan trọng'],
    answer: 'Composite index đánh trên nhiều cột theo thứ tự, ví dụ (a, b, c). Theo leftmost prefix, index chỉ được tận dụng khi truy vấn lọc theo tiền tố trái liên tiếp: dùng cho điều kiện trên a, hoặc a+b, hoặc a+b+c; nhưng lọc chỉ theo b hoặc c thì không dùng được index này. Vì vậy thứ tự cột phải theo mẫu truy vấn hay dùng.' },
  { id: 'sql-8', topic: 'sql', level: 'hard', q: 'Vì sao đã tạo index mà query vẫn không dùng nó?',
    points: ['Bọc hàm/tính toán lên cột (WHERE YEAR(d)=…)', 'Leading wildcard LIKE "%x"', 'Ép kiểu ngầm (so string với number)', 'Cột chọn lọc kém → optimizer bỏ qua', 'OR trên cột khác nhau'],
    answer: 'Index thường bị vô hiệu khi: bọc hàm hoặc phép tính lên cột trong WHERE (WHERE YEAR(created)=2024), dùng LIKE với wildcard đứng đầu ("%abc"), ép kiểu ngầm (so cột số với chuỗi), cột có độ chọn lọc thấp nên optimizer thấy quét bảng còn rẻ hơn, hoặc điều kiện OR trải trên nhiều cột. Cách sửa: viết lại điều kiện sargable (WHERE created >= … AND created < …).' },
  { id: 'sql-9', topic: 'sql', level: 'medium', q: 'Covering index là gì? Lợi ích?',
    points: ['Index chứa đủ mọi cột query cần', 'DB đọc thẳng từ index, không cần về bảng (không lookup)', 'Tăng tốc rõ với SELECT vài cột'],
    answer: 'Covering index là index chứa đủ tất cả cột mà truy vấn cần (ở WHERE và SELECT), nên DB lấy kết quả thẳng từ index mà không phải quay lại đọc bảng (tránh key lookup). Rất hiệu quả khi SELECT chỉ vài cột và cột đó nằm trong index.' },
  { id: 'sql-10', topic: 'sql', level: 'hard', q: 'Phân trang OFFSET và keyset (seek) khác nhau thế nào?',
    points: ['OFFSET/LIMIT: DB vẫn quét bỏ N dòng đầu → chậm khi offset lớn', 'Keyset: WHERE id > last_id ORDER BY id LIMIT n', 'Keyset ổn định, tận dụng index'],
    answer: 'Phân trang OFFSET (LIMIT n OFFSET m) buộc DB duyệt và bỏ qua m dòng đầu nên càng về trang sau càng chậm và có thể lệch khi dữ liệu thay đổi. Keyset/seek pagination lọc theo mốc trang trước (WHERE id > :lastId ORDER BY id LIMIT n) — chạy nhanh và ổn định vì tận dụng index, phù hợp dữ liệu lớn / cuộn vô hạn.' },
  { id: 'sql-11', topic: 'sql', level: 'medium', q: 'Normalization và denormalization — khi nào denormalize?',
    points: ['Chuẩn hóa: giảm trùng lặp, toàn vẹn dữ liệu (3NF)', 'Denormalize: nhân bản dữ liệu để đọc nhanh', 'Đánh đổi: ghi phức tạp, rủi ro không nhất quán', 'Denormalize khi read-heavy, JOIN quá nặng'],
    answer: 'Chuẩn hóa (thường tới 3NF) loại trùng lặp và giữ toàn vẹn dữ liệu nhưng cần nhiều JOIN. Denormalization cố tình nhân bản/gộp dữ liệu để giảm JOIN, tăng tốc đọc — đánh đổi là ghi phức tạp hơn và rủi ro dữ liệu không nhất quán. Chỉ denormalize khi hệ thống đọc nhiều, JOIN thành nút thắt, và có cơ chế đồng bộ (trigger, job, cache).' },
  { id: 'sql-12', topic: 'sql', level: 'hard', q: 'Deadlock ở tầng database xảy ra thế nào? Cách giảm?',
    points: ['Hai transaction khóa dòng theo thứ tự ngược nhau', 'DB tự phát hiện và rollback 1 nạn nhân', 'Giảm: cùng thứ tự truy cập, transaction ngắn, index tốt để khóa ít dòng, retry'],
    answer: 'Deadlock DB xảy ra khi hai transaction giữ khóa và chờ khóa của nhau theo thứ tự ngược nhau. DB phát hiện chu trình chờ và rollback một transaction làm "nạn nhân". Giảm bằng cách: truy cập bảng/dòng theo thứ tự nhất quán, giữ transaction ngắn, đánh index tốt để khóa đúng ít dòng (tránh lock leo thang), giảm isolation nếu hợp lý, và retry khi gặp deadlock.' },

  // ---------- Frontend (JS/TS + React/Angular/Vue/Nuxt) ----------
  { id: 'fe-1', topic: 'frontend', level: 'easy', q: 'var, let và const khác nhau thế nào?',
    points: ['var: function-scope, hoisting, gán lại được', 'let: block-scope, có TDZ, gán lại được', 'const: block-scope, không gán lại (object vẫn đổi field)'],
    answer: 'var có phạm vi hàm và bị hoisting (dùng trước khai báo ra undefined). let và const có phạm vi khối và nằm trong "temporal dead zone" tới khi khai báo. let gán lại được, const thì không — nhưng const trỏ object thì vẫn sửa được thuộc tính bên trong. Hiện đại ưu tiên const, rồi let, tránh var.' },
  { id: 'fe-2', topic: 'frontend', level: 'medium', q: 'Closure trong JavaScript là gì? Cho ví dụ.',
    points: ['Hàm "nhớ" scope nơi nó được tạo', 'Truy cập biến ngoài dù hàm ngoài đã return', 'Dùng: đóng gói state, factory, callback'],
    answer: 'Closure là khả năng một hàm ghi nhớ và truy cập các biến ở scope nơi nó được định nghĩa, kể cả khi hàm bao ngoài đã chạy xong. Ví dụ một hàm counter() trả về hàm con tăng biến count riêng — count được "đóng" trong closure. Dùng để đóng gói trạng thái riêng, tạo factory, giữ dữ liệu cho callback.' },
  { id: 'fe-3', topic: 'frontend', level: 'easy', q: '== khác === trong JavaScript thế nào?',
    points: ['== so sánh sau khi ép kiểu (loose)', '=== so sánh cả kiểu lẫn giá trị (strict)', 'Luôn ưu tiên ===', '0 == "" , null == undefined là bẫy'],
    answer: '== so sánh lỏng, ép kiểu hai vế trước khi so (0 == "false"? "0" == 0 là true), dễ gây bug. === so sánh nghiêm ngặt cả kiểu và giá trị, không ép kiểu. Thực hành tốt luôn dùng ===; chỉ dùng == chủ đích như x == null để bắt cả null lẫn undefined.' },
  { id: 'fe-4', topic: 'frontend', level: 'hard', q: 'Event loop của JavaScript hoạt động thế nào? Microtask vs macrotask?',
    points: ['JS đơn luồng + call stack', 'Web API/timer đẩy callback vào queue', 'Microtask (Promise.then) ưu tiên hơn macrotask (setTimeout)', 'Dọn hết microtask trước mỗi macrotask'],
    answer: 'JS chạy đơn luồng với một call stack. Tác vụ bất đồng bộ (timer, fetch) do môi trường xử lý rồi đẩy callback vào hàng đợi. Event loop lấy việc khi stack rỗng, ưu tiên vét hết microtask queue (Promise.then, queueMicrotask) rồi mới tới một macrotask (setTimeout, I/O). Nên Promise.then luôn chạy trước setTimeout(0).' },
  { id: 'fe-5', topic: 'frontend', level: 'medium', q: 'Promise và async/await khác nhau thế nào?',
    points: ['Promise: then/catch, dễ lồng nhau', 'async/await: viết bất đồng bộ như đồng bộ', 'await chỉ trong hàm async', 'Bắt lỗi bằng try/catch'],
    answer: 'Promise biểu diễn kết quả tương lai, nối bằng then/catch. async/await là cú pháp trên nền Promise giúp viết code bất đồng bộ trông tuần tự, dễ đọc; await tạm dừng hàm async tới khi Promise resolve. Xử lý lỗi bằng try/catch thay cho .catch(). Chạy song song thì dùng Promise.all.' },
  { id: 'fe-6', topic: 'frontend', level: 'hard', q: '`this` trong JavaScript được xác định thế nào? Arrow function khác gì?',
    points: ['this phụ thuộc CÁCH GỌI, không phải nơi khai báo', 'obj.f() → this=obj; gọi trần → undefined/window', 'call/apply/bind đặt this', 'Arrow không có this riêng — lấy this bao ngoài'],
    answer: 'Với hàm thường, this được quyết định lúc gọi: obj.method() thì this là obj, gọi hàm trần thì this là undefined (strict) hoặc global, còn call/apply/bind gán this thủ công. Arrow function không có this riêng mà kế thừa this của scope bao quanh — nên rất tiện cho callback trong class/component để khỏi mất this.' },
  { id: 'fe-7', topic: 'frontend', level: 'easy', q: 'SPA vs MPA và CSR vs SSR (Nuxt) khác nhau ra sao?',
    points: ['SPA: 1 trang, JS render, chuyển route không reload', 'MPA: mỗi trang tải mới từ server', 'CSR: render ở trình duyệt', 'SSR (Nuxt/Next): render sẵn ở server → SEO & first paint tốt hơn'],
    answer: 'SPA tải một trang rồi JS render và điều hướng không reload (mượt nhưng SEO/first-load yếu hơn); MPA mỗi trang tải lại từ server. CSR render hoàn toàn ở trình duyệt; SSR (NuxtJS, Next.js) render HTML sẵn ở server rồi hydrate — tốt cho SEO và thời gian thấy nội dung đầu tiên. Nuxt hỗ trợ cả SSR lẫn static.' },
  { id: 'fe-8', topic: 'frontend', level: 'medium', q: 'Virtual DOM trong React là gì? Vai trò của prop `key`?',
    points: ['Cây ảo trong bộ nhớ mô tả UI', 'Diff cây cũ/mới (reconciliation) → cập nhật DOM tối thiểu', 'key giúp nhận diện phần tử list ổn định', 'Đừng dùng index làm key khi list đổi thứ tự'],
    answer: 'Virtual DOM là biểu diễn UI trong bộ nhớ. Khi state đổi, React dựng cây mới, so (diff/reconciliation) với cây cũ rồi chỉ cập nhật phần DOM thật thay đổi — nhanh hơn thao tác DOM trực tiếp. key cho React biết phần tử nào trong list là "cùng một phần tử" giữa các lần render; nên dùng id ổn định, tránh dùng index khi list có thể sắp xếp/chèn/xóa.' },
  { id: 'fe-9', topic: 'frontend', level: 'medium', q: 'useState và useEffect trong React dùng thế nào? Dependency array quan trọng ra sao?',
    points: ['useState: khai báo state + hàm set → re-render', 'useEffect: side-effect sau render (fetch, subscribe)', 'deps [] chạy 1 lần; [x] chạy khi x đổi; bỏ deps chạy mỗi render', 'return cleanup để hủy'],
    answer: 'useState tạo biến state kèm hàm cập nhật; gọi set làm component re-render. useEffect chạy side-effect sau khi render (gọi API, đăng ký sự kiện). Dependency array quyết định khi nào chạy lại: [] chỉ chạy sau mount, [x] chạy khi x đổi, bỏ trống thì chạy mỗi render (dễ vòng lặp). Trả về hàm cleanup để hủy subscription/timer.' },
  { id: 'fe-10', topic: 'frontend', level: 'easy', q: 'State và props khác nhau thế nào (React/Vue)?',
    points: ['props: dữ liệu cha truyền xuống, read-only với con', 'state: dữ liệu nội bộ component tự quản', 'đổi state → re-render', 'con báo lên cha qua callback/emit'],
    answer: 'Props là dữ liệu component cha truyền xuống con, con chỉ đọc không sửa trực tiếp. State là dữ liệu nội bộ do chính component quản lý và thay đổi được; đổi state kích hoạt render lại. Muốn con tác động lên cha thì cha truyền callback (React) hoặc con emit event (Vue/Angular).' },
  { id: 'fe-11', topic: 'frontend', level: 'medium', q: 'Trong Angular, Component, Service và Dependency Injection liên hệ thế nào?',
    points: ['Component: UI + logic hiển thị', 'Service: logic dùng chung (gọi API, state)', 'DI tiêm service vào component qua constructor', '@Injectable + provider'],
    answer: 'Component lo phần giao diện và tương tác. Service (đánh @Injectable) chứa logic dùng chung như gọi HTTP, xử lý dữ liệu, chia sẻ state. Angular có DI container: khai báo service ở constructor thì Angular tự tiêm instance (thường singleton theo provider). Nhờ đó tách UI khỏi logic, dễ tái dùng và test.' },
  { id: 'fe-12', topic: 'frontend', level: 'medium', q: 'Observable (RxJS) khác Promise thế nào?',
    points: ['Promise: một giá trị, chạy ngay (eager)', 'Observable: nhiều giá trị theo thời gian, lazy (chạy khi subscribe)', 'Hủy được (unsubscribe), có toán tử map/filter/debounce', 'Dùng nhiều trong Angular HttpClient'],
    answer: 'Promise phát đúng một giá trị và bắt đầu chạy ngay khi tạo. Observable (RxJS) là luồng có thể phát nhiều giá trị theo thời gian, lazy — chỉ chạy khi subscribe, và hủy được bằng unsubscribe. Nó có kho toán tử (map, filter, debounceTime, switchMap) rất hợp xử lý sự kiện/search; Angular HttpClient trả Observable.' },
  { id: 'fe-13', topic: 'frontend', level: 'medium', q: 'CORS là gì? Vì sao bị lỗi và xử lý ở đâu?',
    points: ['Same-origin policy chặn gọi khác origin', 'CORS: server thêm header Access-Control-Allow-Origin…', 'Preflight OPTIONS cho request "không đơn giản"', 'Sửa ở SERVER, không phải client'],
    answer: 'CORS (Cross-Origin Resource Sharing) là cơ chế trình duyệt: theo same-origin policy, trang ở origin A gọi API ở origin B sẽ bị chặn trừ khi server B trả header cho phép (Access-Control-Allow-Origin, -Methods, -Headers). Request phức tạp có bước preflight OPTIONS. Lỗi CORS phải sửa ở phía server (cấu hình allowed origins) — không phải ở frontend; dev có thể dùng proxy.' },

  // ---------- Stack thực tế (Struts / iBatis / Batch / Report / FTP) ----------
  { id: 'ms-1', topic: 'mystack', level: 'medium', q: 'Struts (Struts 1) hoạt động theo mô hình MVC thế nào?',
    points: ['ActionServlet là front controller', 'struts-config.xml map URL → Action', 'ActionForm giữ dữ liệu form', 'Action xử lý rồi trả ActionForward tới view (JSP)'],
    answer: 'Struts theo MVC với một front controller (ActionServlet) nhận mọi request. File struts-config.xml ánh xạ URL tới Action tương ứng; ActionForm gom và validate dữ liệu form; Action (Controller) gọi tầng nghiệp vụ rồi trả về một ActionForward trỏ tới view (JSP) để render. So với Spring MVC thì cấu hình XML nhiều hơn và Action nặng hơn Controller.' },
  { id: 'ms-2', topic: 'mystack', level: 'medium', q: 'iBatis/MyBatis khác JPA/Hibernate thế nào? Khi nào chọn cái nào?',
    points: ['MyBatis: SQL mapper — bạn tự viết SQL, map sang object', 'JPA/Hibernate: ORM — sinh SQL từ entity/mapping', 'MyBatis: kiểm soát SQL tối đa, hợp SQL phức tạp/legacy DB', 'JPA: năng suất cao cho CRUD chuẩn'],
    answer: 'MyBatis (kế thừa iBatis) là SQL mapper: mình tự viết SQL trong XML/annotation rồi map kết quả sang object — kiểm soát truy vấn tối đa, rất hợp SQL phức tạp, tối ưu tay, hoặc DB legacy/stored procedure. JPA/Hibernate là ORM tự sinh SQL từ entity và quản lý persistence context — năng suất cao cho CRUD chuẩn nhưng khó kiểm soát query khó. Chọn MyBatis khi cần làm chủ SQL; chọn JPA khi ưu tiên tốc độ phát triển.' },
  { id: 'ms-3', topic: 'mystack', level: 'medium', q: 'Dynamic SQL trong MyBatis/iBatis là gì? Ví dụ.',
    points: ['Ghép câu SQL theo điều kiện lúc chạy', 'Thẻ <if>, <where>, <choose>, <foreach>', 'Dùng #{} (prepared, chống SQL injection) thay ${}', 'Tránh nối chuỗi tay'],
    answer: 'Dynamic SQL cho phép ghép câu truy vấn tùy điều kiện runtime bằng các thẻ như <if>, <where>, <choose>, <foreach> (vd build mệnh đề IN, thêm điều kiện lọc chỉ khi tham số có giá trị). Luôn dùng #{param} (prepared statement, chống SQL injection) thay vì ${param} nối chuỗi trực tiếp.' },
  { id: 'ms-4', topic: 'mystack', level: 'hard', q: 'Thiết kế một batch job xử lý khối lượng lớn cần lưu ý gì?',
    points: ['Xử lý theo lô (chunk) + phân trang, không nạp hết vào RAM', 'Commit theo lô, log tiến độ', 'Chạy lại được (restart/checkpoint), idempotent', 'Xử lý lỗi từng dòng, không hỏng cả job'],
    answer: 'Nên xử lý theo lô (chunk/pagination) để không nạp toàn bộ dữ liệu vào bộ nhớ, commit theo từng lô và ghi log tiến độ. Job phải chạy lại an toàn: lưu checkpoint/trạng thái để restart từ chỗ dừng và đảm bảo idempotent (chạy lại không nhân đôi dữ liệu). Xử lý lỗi ở mức dòng/record (skip + ghi lỗi) để một bản ghi hỏng không làm sập cả job, và có cơ chế cảnh báo/monitoring.' },
  { id: 'ms-5', topic: 'mystack', level: 'medium', q: 'Luồng tạo báo cáo PDF bằng JasperReports diễn ra thế nào?',
    points: ['Thiết kế template .jrxml (JasperSoft Studio)', 'Compile thành .jasper', 'Fill dữ liệu (JDBC/collection) + tham số → JasperPrint', 'Export ra PDF/Excel'],
    answer: 'Thiết kế mẫu báo cáo trong file .jrxml, compile thành .jasper. Lúc chạy, "fill" template với nguồn dữ liệu (JDBC, danh sách object) cùng tham số để ra JasperPrint, rồi export sang PDF (hoặc Excel/HTML) qua JasperExportManager. Trong dự án tôi lập lịch batch để tự động sinh và xuất PDF định kỳ.' },
  { id: 'ms-6', topic: 'mystack', level: 'medium', q: 'Xử lý file rồi upload lên FTP an toàn cần lưu ý gì?',
    points: ['Ghi file tạm rồi rename (atomic) để tránh đọc file dở', 'Retry khi lỗi mạng, timeout', 'Kiểm tra checksum/kích thước sau upload', 'Đóng stream/kết nối trong finally, dọn file tạm'],
    answer: 'Nên xử lý file (vd convert ảnh sang JPG) ra file tạm rồi mới đổi tên/di chuyển (thao tác gần như atomic) để bên khác không đọc phải file đang ghi dở. Với FTP: retry khi lỗi mạng, đặt timeout, kiểm tra lại kích thước/checksum sau khi upload, dùng thư mục tạm trên server rồi rename, và luôn đóng stream/kết nối trong finally cùng dọn file tạm.' },
  { id: 'ms-7', topic: 'mystack', level: 'easy', q: 'Git khác SVN thế nào?',
    points: ['Git: phân tán, mỗi máy có full history', 'SVN: tập trung, cần server để commit/log', 'Git branch/merge nhẹ, làm offline được', 'SVN đơn giản, khóa file tiện cho binary'],
    answer: 'Git phân tán — mỗi bản clone có toàn bộ lịch sử nên commit, xem log, tạo nhánh đều làm offline, branch/merge rất nhẹ. SVN tập trung — cần kết nối server để commit và xem lịch sử, mô hình tuyến tính đơn giản hơn và hỗ trợ khóa file (hợp file nhị phân). Nhiều dự án doanh nghiệp/legacy vẫn dùng SVN nên biết cả hai là lợi thế.' },
  { id: 'ms-8', topic: 'mystack', level: 'hard', q: 'Idempotency trong batch/tích hợp nghĩa là gì? Vì sao quan trọng?',
    points: ['Chạy lại cùng input → cùng kết quả, không nhân đôi', 'Cần khi job retry/chạy lại sau lỗi', 'Kỹ thuật: khóa duy nhất, upsert, đánh dấu đã xử lý, idempotency key'],
    answer: 'Idempotent nghĩa là chạy lại cùng dữ liệu vào cho ra cùng trạng thái, không tạo bản ghi trùng hay tính hai lần. Rất quan trọng cho batch và tích hợp vì job hay bị retry/chạy lại sau lỗi. Đạt được bằng ràng buộc khóa duy nhất, upsert (insert-or-update), đánh dấu record "đã xử lý", hoặc dùng idempotency key khi gọi API bên ngoài (vd thanh toán).' },

  // ========== Bổ sung từ ngân hàng câu hỏi thực tế (VPBank & phỏng vấn thật) ==========
  // ---------- Java Core (bổ sung) ----------
  { id: 'core-11', topic: 'core', level: 'easy', q: 'throw và throws khác nhau thế nào?',
    points: ['throw: CÂU LỆNH ném ra một exception cụ thể', 'throws: khai báo ở CHỮ KÝ method rằng method có thể ném', 'throw đi với 1 object; throws đi với danh sách kiểu exception'],
    answer: 'throw là câu lệnh thực sự ném ra một đối tượng exception (throw new IllegalArgumentException(...)). throws nằm ở chữ ký method để khai báo method CÓ THỂ ném những loại exception nào, buộc caller phải catch hoặc khai báo tiếp (với checked exception). Một bên là hành động ném, một bên là lời khai báo.' },
  { id: 'core-12', topic: 'core', level: 'easy', q: 'Array (mảng) và ArrayList khác nhau thế nào?',
    points: ['Array: kích thước CỐ ĐỊNH, chứa cả primitive lẫn object, có .length', 'ArrayList: co giãn động, chỉ chứa object (autobox), có size()/API phong phú', 'Array nhẹ & nhanh hơn chút; ArrayList tiện hơn'],
    answer: 'Mảng có kích thước cố định khi tạo, chứa được cả primitive lẫn object, truy cập bằng [] và thuộc tính length. ArrayList tự co giãn (resize khi đầy), chỉ chứa object (primitive bị autobox), có API phong phú (add/remove/size). Mảng nhẹ và nhanh hơn một chút; ArrayList linh hoạt hơn nên thực tế hay dùng.' },

  // ---------- Collections (bổ sung) ----------
  { id: 'col-9', topic: 'collections', level: 'easy', q: 'So sánh List, Set và Map?',
    points: ['List: có thứ tự, cho trùng, truy cập theo index', 'Set: không trùng, thường không đảm bảo thứ tự', 'Map: cặp key-value, key duy nhất (không phải Collection)'],
    answer: 'List là tập có thứ tự, cho phép phần tử trùng, truy cập theo index (ArrayList, LinkedList). Set không cho phần tử trùng, thường không đảm bảo thứ tự (HashSet) trừ LinkedHashSet/TreeSet. Map lưu cặp key-value với key duy nhất (HashMap, TreeMap) và không phải Collection thực thụ. Chọn theo nhu cầu: cần thứ tự/trùng → List, loại trùng → Set, tra theo khóa → Map.' },

  // ---------- Concurrency (bổ sung) ----------
  { id: 'con-8', topic: 'concurrency', level: 'medium', q: 'Race condition là gì? Làm sao tránh? Khác deadlock thế nào?',
    points: ['Nhiều thread cùng đọc-ghi dữ liệu chung không đồng bộ → kết quả sai/không xác định', 'Tránh: synchronized/Lock, biến Atomic, immutable, giảm shared state', 'Deadlock: kẹt chờ khóa lẫn nhau (khác race condition)'],
    answer: 'Race condition xảy ra khi nhiều thread cùng truy cập và thay đổi dữ liệu chung mà không đồng bộ, khiến kết quả phụ thuộc thứ tự thực thi và sai khó lường (vd count++ đồng thời). Tránh bằng đồng bộ hóa (synchronized, ReentrantLock), biến nguyên tử (AtomicInteger), dữ liệu bất biến, hoặc giảm/loại bỏ trạng thái chia sẻ. Khác deadlock — deadlock là các thread kẹt chờ khóa của nhau vô hạn.' },

  // ---------- Spring (bổ sung: lifecycle, AOP, inject, scheduling, retry) ----------
  { id: 'spr-9', topic: 'spring', level: 'hard', q: 'Vòng đời (lifecycle) của một Spring bean gồm những giai đoạn nào?',
    points: ['Instantiate → tiêm phụ thuộc → *Aware → BeanPostProcessor (before)', 'Init: @PostConstruct / InitializingBean.afterPropertiesSet → post-init', 'Bean sẵn sàng dùng', 'Destroy: @PreDestroy / DisposableBean.destroy khi context đóng'],
    answer: 'Container tạo instance, tiêm phụ thuộc, gọi các callback Aware và BeanPostProcessor (before-init), chạy khởi tạo (@PostConstruct hoặc afterPropertiesSet, rồi post-init), bean sẵn sàng phục vụ; khi context đóng thì gọi hủy (@PreDestroy hoặc destroy). Với singleton Spring quản lý trọn vòng đời; với prototype Spring KHÔNG gọi bước destroy.' },
  { id: 'spr-10', topic: 'spring', level: 'medium', q: 'AOP trong Spring là gì? Dùng để làm gì?',
    points: ['Tách cross-cutting concern (log, security, transaction) khỏi logic nghiệp vụ', 'Aspect, Advice (Before/After/Around), Pointcut, JoinPoint', 'Spring dùng proxy (JDK dynamic / CGLIB)', 'Là nền của @Transactional, @Async, @Cacheable'],
    answer: 'AOP (Aspect-Oriented Programming) tách các mối quan tâm cắt ngang — logging, bảo mật, transaction, retry — khỏi logic nghiệp vụ để tái dùng. Thành phần: Aspect chứa Advice (Before/After/Around) áp vào các JoinPoint được chọn bởi Pointcut. Spring hiện thực bằng proxy (JDK dynamic proxy cho interface, CGLIB cho class). Chính AOP là nền cho @Transactional/@Async/@Cacheable — nên self-invocation bỏ qua proxy sẽ mất tác dụng.' },
  { id: 'spr-11', topic: 'spring', level: 'easy', q: 'Có mấy cách inject bean? Nên dùng cách nào?',
    points: ['Constructor injection (khuyên dùng)', 'Setter injection', 'Field injection (@Autowired trên field)', 'Constructor: phụ thuộc bắt buộc, final, dễ test'],
    answer: 'Ba cách: constructor injection (qua hàm dựng), setter injection (qua setter), và field injection (@Autowired thẳng trên field). Nên ưu tiên constructor injection vì phụ thuộc tường minh và bắt buộc, cho phép final/bất biến, dễ test và phát hiện circular dependency sớm. Field injection ngắn nhưng ẩn phụ thuộc và khó test.' },
  { id: 'spr-12', topic: 'spring', level: 'medium', q: 'Có 2 bean cùng kiểu (A1, A2), làm sao inject đúng A2?',
    points: ['@Qualifier("a2") tại điểm inject', 'hoặc đánh @Primary cho bean mặc định', 'Đặt tên biến trùng tên bean cũng khớp', 'Không xử lý → NoUniqueBeanDefinitionException'],
    answer: 'Khi có nhiều bean cùng kiểu, Spring không biết chọn cái nào (ném NoUniqueBeanDefinitionException). Dùng @Qualifier("a2") tại chỗ inject để chỉ định rõ, hoặc đánh @Primary cho bean muốn làm mặc định. Ngoài ra đặt tên biến trùng tên bean (a2) cũng khớp được.' },
  { id: 'spr-13', topic: 'spring', level: 'medium', q: 'Làm sao tạo bean theo điều kiện?',
    points: ['@ConditionalOnProperty (theo cấu hình)', '@ConditionalOnClass / @ConditionalOnMissingBean (theo classpath/bean)', '@Conditional tùy biến với Condition', '@Profile theo môi trường — là nền của auto-configuration'],
    answer: 'Dùng nhóm annotation điều kiện: @ConditionalOnProperty (bật theo cấu hình), @ConditionalOnClass/@ConditionalOnMissingBean (theo classpath hoặc bean đã có), hoặc @Conditional tùy biến với một Condition. @Profile bật bean theo môi trường (dev/prod). Đây chính là cơ chế nền cho auto-configuration của Spring Boot.' },
  { id: 'spr-14', topic: 'spring', level: 'medium', q: '@Scheduled: fixedRate khác fixedDelay thế nào? Viết cron chạy mỗi 3 tiếng vào thứ Hai.',
    points: ['fixedRate: tính từ lúc BẮT ĐẦU lần trước (nhịp cố định)', 'fixedDelay: tính từ lúc KẾT THÚC lần trước', 'Cron Spring 6 trường: giây phút giờ ngày tháng thứ', 'Ví dụ: "0 0 0/3 * * MON"'],
    answer: 'fixedRate lên lịch theo thời điểm BẮT ĐẦU lần chạy trước (nhịp đều, có thể chồng nếu chạy lâu); fixedDelay đợi lần trước KẾT THÚC rồi mới tính khoảng chờ. Cron của Spring có 6 trường (giây phút giờ ngày-tháng tháng thứ). Ví dụ mỗi 3 giờ vào thứ Hai: "0 0 0/3 * * MON".' },
  { id: 'spr-15', topic: 'spring', level: 'hard', q: 'Spring Retry: khai báo retry 5 lần thế nào? backoff và @Recover để làm gì?',
    points: ['@EnableRetry + @Retryable(maxAttempts=5, retryFor=...)', 'backoff = khoảng chờ giữa các lần (multiplier tăng dần)', '@Recover: fallback khi hết số lần', 'Chỉ retry đúng loại exception khai báo (NPE ngoài danh sách → không retry)'],
    answer: 'Bật @EnableRetry rồi đánh @Retryable(maxAttempts = 5, retryFor = {IOException.class}) trên method; hết 5 lần vẫn lỗi thì gọi method @Recover (cùng kiểu trả về + tham số exception) để xử lý dự phòng. @Backoff(delay=..., multiplier=...) đặt thời gian chờ giữa các lần, có thể tăng dần để tránh dồn tải. Nếu chỉ khai báo IOException mà gặp NullPointerException thì KHÔNG khớp → không retry, exception ném thẳng ra.' },
  { id: 'spr-16', topic: 'spring', level: 'medium', q: '@Cacheable hoạt động thế nào? Cache invalidation làm sao?',
    points: ['@Cacheable: kiểm tra cache trước, có thì trả luôn không chạy method', '@CachePut: luôn chạy method rồi cập nhật cache', '@CacheEvict: xóa entry khi dữ liệu đổi', 'key theo tham số method (SpEL), cần đặt TTL/kích thước'],
    answer: '@Cacheable bọc method bằng proxy (giống @Transactional): trước khi chạy, kiểm tra cache theo key (mặc định suy từ tham số) — có thì trả thẳng giá trị cache, không thì chạy method rồi lưu kết quả. @CachePut luôn chạy method và cập nhật cache (dùng khi tạo/sửa). @CacheEvict xóa entry khi dữ liệu đổi để tránh đọc dữ liệu cũ (stale) — quên evict đúng chỗ là bug hay gặp nhất. Cần cấu hình TTL/kích thước tối đa (Caffeine/Redis) để cache không phình vô hạn.' },
  { id: 'spr-17', topic: 'spring', level: 'medium', q: 'HikariCP / connection pool là gì? Vì sao phải giới hạn kích thước pool?',
    points: ['Pool giữ sẵn connection DB, tái dùng thay vì mở/đóng mỗi request', 'HikariCP: connection pool mặc định của Spring Boot, nhanh & nhẹ', 'Pool quá nhỏ: request phải chờ connection → nghẽn', 'Pool quá lớn: quá tải DB (mỗi connection tốn RAM/thread ở DB)'],
    answer: 'Connection pool giữ sẵn một số kết nối DB đã mở để tái dùng, tránh chi phí mở/đóng connection cho mỗi request. HikariCP là pool mặc định của Spring Boot, nổi tiếng nhanh và nhẹ. Kích thước pool (maximum-pool-size) phải cân bằng: quá nhỏ thì request phải xếp hàng chờ connection (nghẽn dưới tải cao); quá lớn thì tốn tài nguyên và có thể làm quá tải chính DB (mỗi connection chiếm RAM/thread phía server DB) — công thức tham khảo của HikariCP là số connection nên gần với số core CPU khả dụng, không phải càng nhiều càng nhanh.' },

  // ---------- Security (bổ sung) ----------
  { id: 'sec-6', topic: 'security', level: 'medium', q: 'CSRF là gì? Vì sao REST API thường disable CSRF?',
    points: ['CSRF: lợi dụng cookie phiên tự gửi kèm để giả mạo hành động người dùng', 'Phòng: CSRF token, cookie SameSite', 'REST stateless dùng token ở header Authorization (không dựa cookie) → không dính CSRF'],
    answer: 'CSRF (Cross-Site Request Forgery) là tấn công lợi dụng cookie phiên được trình duyệt tự gửi kèm để giả mạo hành động của người dùng từ một trang khác. Phòng bằng CSRF token hoặc cookie SameSite. REST API thường stateless, xác thực bằng token trong header Authorization (không dựa vào cookie phiên) nên không dính CSRF — vì vậy hay disable để đơn giản.' },
  { id: 'sec-7', topic: 'security', level: 'medium', q: '@PreAuthorize và @Secured khác nhau thế nào?',
    points: ['@Secured: chỉ nhận danh sách role, cú pháp đơn giản', '@PreAuthorize: biểu thức SpEL mạnh (điều kiện, tham số method, gọi bean)', '@PreAuthorize cần bật prePostEnabled'],
    answer: '@Secured chỉ nhận danh sách role đơn giản (@Secured("ROLE_ADMIN")). @PreAuthorize mạnh hơn nhờ biểu thức SpEL: kết hợp điều kiện (hasRole(\'ADMIN\') and #id == principal.id), kiểm tra tham số method, gọi bean. @PreAuthorize/@PostAuthorize cần bật method security (prePostEnabled), còn @Secured bật bằng securedEnabled.' },

  // ---------- SQL & Database (bổ sung) ----------
  { id: 'sql-13', topic: 'sql', level: 'easy', q: 'UNION và UNION ALL khác nhau thế nào?',
    points: ['UNION: gộp và LOẠI trùng (phải sort/distinct → chậm hơn)', 'UNION ALL: gộp GIỮ cả trùng (nhanh hơn)', 'Cùng số cột & kiểu tương thích'],
    answer: 'Cả hai gộp kết quả nhiều SELECT (cùng số cột, kiểu tương thích). UNION loại bỏ dòng trùng nên phải sắp xếp/so sánh, chậm hơn. UNION ALL giữ nguyên mọi dòng kể cả trùng nên nhanh hơn — dùng khi chắc chắn không trùng hoặc không cần loại trùng.' },
  { id: 'sql-14', topic: 'sql', level: 'medium', q: 'View và Materialized View khác nhau thế nào?',
    points: ['View: truy vấn lưu sẵn, chạy lại mỗi lần gọi (luôn mới, không tốn lưu trữ)', 'Materialized View: lưu KẾT QUẢ vật lý → đọc nhanh nhưng phải refresh (có thể cũ)', 'MView hợp báo cáo/aggregation nặng'],
    answer: 'View là một truy vấn được đặt tên, mỗi lần gọi nó chạy lại trên bảng gốc nên dữ liệu luôn mới nhưng không tăng tốc. Materialized View lưu sẵn kết quả xuống đĩa nên đọc rất nhanh, đổi lại tốn dung lượng và phải refresh (định kỳ hoặc theo sự kiện) nên có thể cũ. MView hợp cho báo cáo/tổng hợp nặng, ít thay đổi.' },
  { id: 'sql-15', topic: 'sql', level: 'medium', q: 'CTE (WITH) trong SQL là gì? Lợi ích?',
    points: ['Tập kết quả tạm đặt tên bằng WITH name AS (...)', 'Tách truy vấn phức tạp thành bước dễ đọc thay subquery lồng', 'Hỗ trợ đệ quy (WITH RECURSIVE) cho cây/phân cấp'],
    answer: 'CTE (Common Table Expression) là một tập kết quả tạm được đặt tên bằng mệnh đề WITH name AS (SELECT ...), dùng ngay trong truy vấn chính. Nó giúp tách truy vấn phức tạp thành các bước dễ đọc thay cho subquery lồng nhau, tái dùng trong cùng câu, và hỗ trợ đệ quy (WITH RECURSIVE) để duyệt cấu trúc cây/phân cấp.' },
  { id: 'sql-16', topic: 'sql', level: 'medium', q: 'Stored Procedure và Function trong DB khác nhau thế nào?',
    points: ['Function: BẮT BUỘC trả về giá trị, gọi được trong SELECT/biểu thức', 'Procedure: khối lệnh gọi bằng CALL, có tham số OUT, logic/transaction phức tạp', 'Function hạn chế side-effect; procedure linh hoạt hơn'],
    answer: 'Function bắt buộc trả về một giá trị và thường gọi được ngay trong biểu thức/SELECT, hạn chế thay đổi dữ liệu. Stored Procedure là khối lệnh gọi bằng CALL/EXEC, có thể trả nhiều giá trị qua tham số OUT, thực hiện logic và transaction phức tạp, nhưng không dùng trực tiếp trong SELECT. Procedure linh hoạt cho nghiệp vụ, function tiện cho tính toán tái dùng.' },
  { id: 'sql-17', topic: 'sql', level: 'hard', q: 'Partitioning và Sharding khác nhau thế nào?',
    points: ['Partition: chia 1 bảng thành nhiều phần TRONG cùng 1 DB/server', 'Sharding: phân tán dữ liệu ra NHIỀU server/DB (scale ngang)', 'Partition dễ quản lý; sharding phức tạp (routing, cross-shard join)'],
    answer: 'Partitioning chia một bảng lớn thành nhiều phần (theo range/list/hash) nhưng vẫn trong cùng một database/server, giúp quản lý và truy vấn nhanh hơn trên từng phần. Sharding phân tán dữ liệu ra nhiều server/database độc lập để scale ngang khi một máy không chứa nổi — mạnh về mở rộng nhưng phức tạp (định tuyến shard, join/giao dịch xuyên shard khó).' },
  { id: 'sql-18', topic: 'sql', level: 'medium', q: 'Tiêu chí chọn cột đánh index? Query "=" và "LIKE" cái nào nhanh hơn?',
    points: ['Index cột hay dùng ở WHERE/JOIN/ORDER BY, độ chọn lọc CAO', 'Tránh index cột ít giá trị / bảng ghi rất nhiều', '"=" tận dụng index tốt nhất; LIKE "abc%" còn dùng được, LIKE "%abc" thì không'],
    answer: 'Nên đánh index cho cột thường xuyên lọc/join/sắp xếp và có độ chọn lọc cao (nhiều giá trị khác nhau); tránh với cột ít giá trị (vd giới tính) hoặc bảng ghi rất nhiều vì index làm chậm ghi. Về tốc độ: "=" khớp chính xác nên tận dụng index tốt nhất; LIKE "abc%" vẫn dùng được index (khớp tiền tố), còn LIKE "%abc" (wildcard đứng đầu) thì không dùng được index → chậm.' },
  { id: 'sql-19', topic: 'sql', level: 'easy', q: 'Liquibase (hay Flyway) là gì? Dùng để làm gì?',
    points: ['Công cụ quản lý phiên bản schema DB (migration)', 'Changeset có version, ghi lại đã áp dụng gì (không chạy trùng)', 'Đồng bộ schema giữa môi trường, rollback được, đưa vào CI/CD'],
    answer: 'Liquibase là công cụ quản lý phiên bản (migration) cho schema database: mô tả thay đổi trong các changeset (XML/YAML/SQL) có version, chạy theo thứ tự và ghi lại đã áp dụng những gì (bảng DATABASECHANGELOG) để không chạy trùng. Nhờ đó schema đồng bộ giữa dev/test/prod, đưa được vào version control và CI/CD, và hỗ trợ rollback. Flyway là công cụ tương đương.' },

  // ---------- Kafka & Messaging ----------
  { id: 'kafka-1', topic: 'kafka', level: 'easy', q: 'Kafka là gì? Producer và Consumer khác nhau thế nào?',
    points: ['Nền tảng message/streaming phân tán, lưu log bền theo topic', 'Producer: publish message vào topic', 'Consumer: subscribe/đọc message ra để xử lý', 'Giao tiếp bất đồng bộ, decoupling'],
    answer: 'Kafka là nền tảng message/streaming phân tán, lưu message bền vững thành log theo topic và cho nhiều bên đọc. Producer là bên đẩy (publish) message vào topic; Consumer là bên đọc (subscribe) message ra để xử lý. Nó giúp các service giao tiếp bất đồng bộ, tách rời (decoupling) và chịu tải cao.' },
  { id: 'kafka-2', topic: 'kafka', level: 'medium', q: 'Broker và Zookeeper trong Kafka khác nhau thế nào?',
    points: ['Broker: server Kafka lưu partition & phục vụ read/write; cluster nhiều broker', 'Zookeeper: quản lý metadata, bầu controller/leader, cấu hình cluster', 'Bản mới thay Zookeeper bằng KRaft'],
    answer: 'Broker là các server Kafka thực sự lưu trữ partition và phục vụ ghi/đọc; một cluster gồm nhiều broker để phân tán và nhân bản dữ liệu. Zookeeper (kiến trúc cũ) quản lý metadata cluster, bầu chọn controller/leader và giữ cấu hình. Kafka bản mới chuyển sang KRaft để bỏ phụ thuộc Zookeeper.' },
  { id: 'kafka-3', topic: 'kafka', level: 'hard', q: 'Vì sao trong một consumer group, một partition chỉ được consume bởi một consumer?',
    points: ['Giữ thứ tự trong partition & tránh xử lý trùng trong group', 'Partition là đơn vị song song → consumer hữu ích tối đa = số partition', 'Group khác vẫn đọc độc lập cùng dữ liệu'],
    answer: 'Trong một consumer group, mỗi partition chỉ gán cho đúng một consumer để giữ thứ tự message trong partition và tránh hai consumer xử lý trùng. Vì thế độ song song tối đa của một group bằng số partition (thừa consumer sẽ ngồi không). Các consumer group khác nhau vẫn đọc độc lập toàn bộ dữ liệu của topic.' },
  { id: 'kafka-4', topic: 'kafka', level: 'medium', q: 'Làm sao đảm bảo xử lý message theo đúng thứ tự?',
    points: ['Kafka chỉ đảm bảo thứ tự TRONG một partition', 'Dùng message key để message liên quan vào cùng partition', 'Cùng key → cùng partition → một consumer xử lý tuần tự'],
    answer: 'Kafka chỉ đảm bảo thứ tự trong phạm vi một partition, không phải toàn topic. Muốn các message liên quan (vd cùng một tài khoản) giữ đúng thứ tự, đặt message key phù hợp — Kafka băm key để đưa chúng vào cùng một partition, do đó được một consumer xử lý tuần tự.' },
  { id: 'kafka-5', topic: 'kafka', level: 'hard', q: 'Xử lý message lỗi trong Kafka như thế nào?',
    points: ['Retry có giới hạn (kèm backoff) cho lỗi tạm thời', 'Hết retry → đẩy sang Dead Letter Topic (DLT)', 'Consumer nên idempotent để retry an toàn', 'Tránh chặn cả partition'],
    answer: 'Thường cấu hình retry có giới hạn (kèm backoff) cho message lỗi tạm thời; nếu vẫn thất bại thì đẩy sang Dead Letter Topic (DLT) để không chặn cả partition và điều tra/tái xử lý sau. Cần đảm bảo consumer idempotent để retry không gây tác dụng phụ trùng lặp.' },
  { id: 'kafka-6', topic: 'kafka', level: 'easy', q: 'Offset trong Kafka là gì?',
    points: ['Chỉ số tuần tự vị trí message trong một partition', 'Consumer commit offset để biết đã đọc tới đâu', 'Reset offset để đọc lại từ đầu/mốc thời gian'],
    answer: 'Offset là chỉ số tuần tự xác định vị trí của một message trong một partition. Consumer lưu (commit) offset đã xử lý để biết lần sau đọc tiếp từ đâu, kể cả khi restart hay rebalance. Có thể reset offset để đọc lại từ đầu hoặc từ một mốc thời gian.' },
  { id: 'kafka-7', topic: 'kafka', level: 'medium', q: 'Tham số acks của producer Kafka nghĩa là gì?',
    points: ['acks=0: gửi không chờ xác nhận (nhanh, dễ mất)', 'acks=1: leader ghi xong là ok', 'acks=all: mọi replica in-sync (ISR) xác nhận (bền nhất, chậm hơn)'],
    answer: 'acks quy định mức xác nhận producer chờ khi gửi: acks=0 không chờ (nhanh nhất, rủi ro mất message), acks=1 chỉ cần leader ghi xong, acks=all (hoặc -1) chờ mọi bản sao in-sync (ISR) xác nhận — an toàn nhất, đánh đổi độ trễ. Chọn theo mức độ chấp nhận mất dữ liệu.' },
  { id: 'kafka-8', topic: 'kafka', level: 'medium', q: 'Làm sao tăng tốc/throughput khi có quá nhiều message?',
    points: ['Tăng số partition + consumer trong group (song song)', 'Producer gửi theo batch + bật nén (compression)', 'Tối ưu xử lý consumer, commit hợp lý', 'Scale thêm broker'],
    answer: 'Tăng throughput bằng cách tăng số partition và số consumer trong group để xử lý song song, cho producer gửi theo batch và bật nén (compression), tối ưu logic consumer (xử lý hàng loạt/bất đồng bộ) và commit offset hợp lý, đồng thời scale thêm broker khi cần. Lưu ý số consumer hữu ích tối đa trong một group = số partition.' },

  // ---------- Microservice ----------
  { id: 'micro-1', topic: 'microservice', level: 'medium', q: 'Monolithic và Microservice khác nhau thế nào? Đánh đổi?',
    points: ['Monolith: 1 ứng dụng/triển khai — đơn giản lúc nhỏ, khó scale/độc lập từng phần', 'Microservice: nhiều service nhỏ tự trị, deploy/scale riêng', 'Đổi lại: phức tạp vận hành, mạng, dữ liệu phân tán, giám sát'],
    answer: 'Monolith gói toàn bộ chức năng trong một ứng dụng và một lần triển khai — đơn giản khi nhỏ, nhưng khó scale từng phần và một lỗi có thể ảnh hưởng toàn hệ thống. Microservice chia thành nhiều service nhỏ tự trị, deploy/scale/độc lập công nghệ riêng — đổi lại phức tạp về vận hành, giao tiếp mạng, nhất quán dữ liệu phân tán và giám sát. Chọn microservice khi hệ thống/đội đủ lớn.' },
  { id: 'micro-2', topic: 'microservice', level: 'medium', q: 'Các service giao tiếp với nhau bằng cách nào?',
    points: ['Đồng bộ: REST/gRPC (request-response)', 'Bất đồng bộ: message/event qua Kafka/RabbitMQ', 'Sync đơn giản nhưng coupling & phải chờ; async decoupling & chịu tải tốt hơn'],
    answer: 'Hai kiểu chính: đồng bộ (REST/gRPC theo request-response) — đơn giản, dễ debug nhưng gắn kết chặt và service gọi phải chờ; và bất đồng bộ qua message/event (Kafka, RabbitMQ) — tách rời, chịu tải và lỗi tốt hơn nhưng khó theo dõi luồng. Thực tế thường kết hợp cả hai tùy trường hợp.' },
  { id: 'micro-3', topic: 'microservice', level: 'medium', q: 'API Gateway là gì? Dùng để làm gì?',
    points: ['Cổng vào duy nhất cho client', 'Định tuyến tới service, có thể gộp request', 'Xử lý cross-cutting: auth, rate limit, logging, SSL, cache', 'Ẩn cấu trúc nội bộ'],
    answer: 'API Gateway là điểm vào duy nhất đứng trước các microservice: định tuyến request tới service phù hợp, có thể gộp nhiều lời gọi, và xử lý các mối quan tâm chung như xác thực, rate limiting, logging, SSL, caching. Nhờ đó client không cần biết cấu trúc nội bộ và mỗi service khỏi lặp lại các phần chung.' },
  { id: 'micro-4', topic: 'microservice', level: 'hard', q: 'Service Discovery giải quyết vấn đề gì?',
    points: ['Instance scale/đổi IP động → không hardcode địa chỉ', 'Registry (Eureka/Consul/K8s DNS) để đăng ký & tra cứu', 'Client-side vs server-side discovery', 'Thường kèm load balancing'],
    answer: 'Trong hệ phân tán, các instance service lên/xuống và đổi IP liên tục nên không thể hardcode địa chỉ. Service Discovery dùng một registry (Eureka, Consul, Kubernetes DNS) để service tự đăng ký và bên gọi tra cứu vị trí hiện có, thường kèm cân bằng tải. Có kiểu client-side (client hỏi registry rồi tự chọn) và server-side (qua load balancer/gateway).' },
  { id: 'micro-5', topic: 'microservice', level: 'hard', q: 'Quản lý transaction xuyên nhiều service (phân tán) thế nào? SAGA là gì?',
    points: ['Mỗi service DB riêng → khó ACID/2PC → dùng SAGA', 'SAGA: chuỗi giao dịch cục bộ + hành động bù trừ (compensation) khi lỗi', 'Orchestration (điều phối trung tâm) vs Choreography (theo event)', 'Chấp nhận eventual consistency'],
    answer: 'Vì mỗi service có database riêng nên không dùng được một transaction ACID duy nhất; giải pháp phổ biến là SAGA — chia thành chuỗi giao dịch cục bộ, nếu một bước lỗi thì chạy hành động bù trừ (compensation) để hoàn tác các bước trước, chấp nhận nhất quán cuối (eventual consistency). SAGA có hai kiểu: Orchestration (một bộ điều phối trung tâm ra lệnh) và Choreography (các service phản ứng theo event, không trung tâm).' },

  // ---------- Tình huống & Thiết kế (scenario/behavioral-kỹ thuật) ----------
  { id: 'scn-1', topic: 'scenario', level: 'medium', q: 'Thiết kế API "đặt hàng" sao cho user bấm submit nhiều lần (double-click, mạng lag rồi retry) không tạo hai đơn trùng?',
    points: ['Idempotency key do client sinh, gửi kèm request', 'Server lưu key đã xử lý (unique constraint) trước khi tạo đơn', 'Request lặp cùng key -> trả lại kết quả cũ, không tạo mới', 'Disable nút submit + loading state ở FE chỉ là phòng ngừa phụ, không đủ'],
    answer: 'Giải pháp chắc chắn là idempotency key: client sinh một khóa duy nhất cho mỗi lần "cố gắng đặt hàng" (không đổi khi retry) và gửi kèm; server kiểm tra/đăng ký key đó với ràng buộc unique trước khi tạo đơn — request đến sau với cùng key thì trả lại kết quả của lần xử lý trước thay vì tạo đơn mới. Disable nút hay debounce ở frontend chỉ giảm khả năng xảy ra chứ không đảm bảo, vì mạng vẫn có thể tự retry.' },
  { id: 'scn-2', topic: 'scenario', level: 'hard', q: 'Một endpoint GET đang chậm dần theo thời gian dù traffic không đổi — bạn khoanh vùng nguyên nhân thế nào?',
    points: ['Xem metrics/log trước: latency tăng từ khi nào, tương quan với gì (data tăng, deploy, cấu hình)', 'Bật slow query log / APM xem query nào chậm', 'Nghi ngờ: thiếu index khi bảng phình to, N+1 lộ dần theo data, connection pool cạn, GC pause tăng', 'Tái hiện ở staging với data cỡ thật rồi đo, không đoán mò'],
    answer: 'Trước tiên nhìn dữ liệu quan sát được: latency bắt đầu tăng từ mốc nào, có trùng với một đợt deploy, tăng traffic hay dữ liệu phình to không. Rồi đào sâu bằng slow query log/APM (New Relic, APM tool) để thấy query hoặc bước nào chậm. Nguyên nhân hay gặp khi "chậm dần" (không phải chậm đột ngột): thiếu index nên full-scan ngày càng nặng khi bảng lớn dần, N+1 lộ rõ dần theo số dòng, connection pool không đủ nên request phải chờ, hoặc GC pause tăng vì heap đầy dần (leak). Nên tái hiện ở môi trường có dữ liệu tương đương thật để đo thay vì đoán, rồi fix và đo lại.' },
  { id: 'scn-3', topic: 'scenario', level: 'medium', q: 'Thiết kế rate limiting cho một API public — đặt ở đâu và theo thuật toán nào?',
    points: ['Đặt ở API Gateway/tầng biên là tốt nhất (chặn sớm, đỡ tải app)', 'Có thể thêm lớp trong app nếu cần rule theo nghiệp vụ (per user/plan)', 'Thuật toán: fixed window (đơn giản, có "burst" ở biên), sliding window / token bucket (mượt hơn)', 'Vượt hạn mức -> trả 429 kèm Retry-After'],
    answer: 'Ưu tiên chặn ở API Gateway/reverse proxy để request thừa bị loại sớm, không tốn tài nguyên app; có thể thêm lớp trong ứng dụng khi cần rule theo nghiệp vụ (giới hạn khác nhau theo user/gói dịch vụ). Về thuật toán: fixed window đơn giản nhưng có thể bị "burst" ở ranh giới window; sliding window hoặc token bucket mượt và công bằng hơn. Khi vượt hạn mức, trả HTTP 429 kèm header Retry-After để client biết chờ bao lâu.' },
  { id: 'scn-4', topic: 'scenario', level: 'medium', q: 'Webhook nhận thông báo thanh toán từ bên thứ ba có thể bị gửi trùng (retry) — làm sao không cộng tiền hai lần?',
    points: ['Coi mỗi webhook như KHÔNG idempotent theo mặc định — luôn có thể trùng', 'Lưu id sự kiện (event id từ payload) đã xử lý, kiểm tra trước khi áp dụng', 'Ràng buộc unique ở DB cho event id, xử lý trong transaction', 'Trả 200 ngay cả khi trùng để bên gửi ngưng retry'],
    answer: 'Luôn giả định webhook có thể đến trùng (do bên gửi retry khi không nhận được ACK kịp). Cách xử lý: lấy id sự kiện duy nhất từ payload, kiểm tra đã xử lý chưa (bảng processed_events với ràng buộc UNIQUE trên event id) trước khi cộng tiền/cập nhật trạng thái, và làm việc này trong cùng transaction với nghiệp vụ để tránh race. Dù trùng hay không, vẫn trả HTTP 200 cho request webhook để bên gửi biết đã nhận, ngưng gửi lại.' },
  { id: 'scn-5', topic: 'scenario', level: 'hard', q: 'Thiết kế phân trang cho một danh sách rất lớn (hàng chục triệu dòng) với UI cuộn vô hạn — chọn cơ chế nào?',
    points: ['Tránh OFFSET/LIMIT vì càng về sau càng chậm (DB vẫn phải quét bỏ)', 'Dùng keyset/seek pagination: WHERE (sort_col, id) > (giá trị trang trước) LIMIT n', 'Cần index đúng theo cột sort + id để tận dụng', 'Đánh đổi: không nhảy thẳng tới "trang số N" được, chỉ next/prev tuần tự'],
    answer: 'Với dữ liệu lớn và cuộn vô hạn (chỉ cần next liên tục, không cần nhảy tới trang bất kỳ) thì keyset/seek pagination là lựa chọn đúng: lọc theo mốc của trang trước (WHERE (created_at, id) > (:lastCreatedAt, :lastId) ORDER BY created_at, id LIMIT n) thay vì OFFSET/LIMIT — offset lớn buộc DB quét và bỏ qua hàng triệu dòng nên càng về sau càng chậm. Cần có index đúng trên cặp cột dùng để sort/lọc. Đánh đổi là không nhảy thẳng "trang 500" được, chỉ đi tuần tự next/prev — chấp nhận được với UI infinite scroll.' },
  { id: 'scn-6', topic: 'scenario', level: 'medium', q: 'Cần đổi cấu trúc response của một API đang có breaking change, nhưng client cũ vẫn đang dùng — rollout an toàn thế nào?',
    points: ['Không sửa thẳng API cũ — thêm bản mới (/api/v2) song song', 'Hoặc mở rộng field mới không đổi/xóa field cũ (backward-compatible)', 'Đặt lịch deprecation rõ ràng, thông báo trước cho client cũ', 'Feature flag/phần trăm rollout để giảm rủi ro, theo dõi lỗi trước khi tắt hẳn bản cũ'],
    answer: 'Không sửa trực tiếp API đang chạy nếu đó là breaking change. Cách an toàn: phát hành bản mới song song (/api/v2 hoặc header version) trong khi bản cũ vẫn hoạt động, hoặc nếu có thể thì mở rộng thêm field mới và giữ nguyên field cũ (thay đổi tương thích ngược) thay vì đổi/xóa. Đặt lịch deprecation rõ ràng và báo trước cho các bên tiêu thụ API. Có thể rollout dần (feature flag, theo % traffic) và theo dõi lỗi trước khi tắt hẳn phiên bản cũ.' },
  { id: 'scn-7', topic: 'scenario', level: 'hard', q: 'Một endpoint đọc dữ liệu (read-heavy) khiến DB quá tải khi traffic tăng — những hướng nào để scale?',
    points: ['Cache kết quả (Redis/@Cacheable) cho dữ liệu ít đổi', 'Read replica: tách truy vấn đọc sang DB phụ', 'Thêm/atối ưu index, giảm dữ liệu trả về (DTO gọn, phân trang)', 'CDN cho nội dung tĩnh; denormalize nếu JOIN là nút thắt'],
    answer: 'Nhiều hướng có thể kết hợp: cache kết quả hay đổi ít (Redis, @Cacheable) để đỡ chạm DB; tách truy vấn đọc sang read replica; kiểm tra và thêm index đúng chỗ, giảm dữ liệu trả về (chỉ field cần thiết, phân trang); dùng CDN cho nội dung tĩnh; và nếu JOIN phức tạp là nút thắt thì cân nhắc denormalize có kiểm soát. Chọn hướng nào tùy vào bottleneck thực đo được (CPU DB, I/O, hay network) chứ không áp dụng hết một lúc.' },
  { id: 'scn-8', topic: 'scenario', level: 'medium', q: 'Sau khi thêm cache Redis cho một API, người dùng thấy dữ liệu cũ (stale) sau khi cập nhật — nguyên nhân và cách sửa?',
    points: ['Thường do quên @CacheEvict/cập nhật cache khi ghi dữ liệu', 'Hoặc TTL đặt quá dài so với tần suất đổi dữ liệu', 'Race condition: cache được ghi lại đúng lúc dữ liệu vừa đổi (đọc cũ, ghi vào cache)', 'Fix: evict đúng key khi update/delete, cân nhắc write-through, TTL hợp lý'],
    answer: 'Nguyên nhân phổ biến nhất là quên evict/update cache đúng chỗ khi dữ liệu bị ghi (thêm @Cacheable mà không thêm @CacheEvict/@CachePut tương ứng ở method update/delete), hoặc TTL đặt quá dài so với tần suất thay đổi thực tế. Cũng có thể là race: một request đọc dữ liệu cũ và ghi vào cache đúng lúc dữ liệu vừa được cập nhật ở nơi khác. Sửa bằng cách rà lại mọi nơi ghi dữ liệu để evict đúng key liên quan, cân nhắc chiến lược write-through (ghi DB và cache cùng lúc), và đặt TTL phù hợp với mức độ chấp nhận dữ liệu cũ.' },
  { id: 'scn-9', topic: 'scenario', level: 'medium', q: 'Gọi một API bên thứ ba hay bị timeout/lỗi tạm thời — thiết kế lời gọi sao cho hệ thống vẫn ổn định?',
    points: ['Đặt timeout hợp lý, không chờ vô hạn', 'Retry có giới hạn + backoff (và jitter) cho lỗi tạm thời', 'Circuit breaker: ngừng gọi tạm thời khi lỗi liên tục, tránh dồn tải/thác lũ', 'Có fallback (giá trị mặc định, cache, hàng đợi xử lý sau) khi vẫn lỗi'],
    answer: 'Đặt timeout rõ ràng cho lời gọi (không chờ vô hạn), retry có giới hạn số lần kèm backoff (tăng dần, có jitter tránh nhiều client retry cùng lúc) cho lỗi tạm thời (timeout/5xx), và dùng circuit breaker (Resilience4j) để tạm ngưng gọi khi tỷ lệ lỗi cao, tránh dồn thêm tải lên một dịch vụ đang gặp sự cố. Khi vẫn thất bại, có phương án dự phòng: trả giá trị mặc định/cache cũ, hoặc đẩy vào hàng đợi để xử lý lại sau thay vì làm sập cả luồng chính.' },
  { id: 'scn-10', topic: 'scenario', level: 'hard', q: 'Quan hệ nhiều-nhiều nhưng cần lưu thêm thuộc tính riêng của quan hệ đó (vd học sinh–lớp học kèm ngày ghi danh, trạng thái điểm danh) — thiết kế thế nào?',
    points: ['Không dùng @ManyToMany thuần (không chứa được cột phụ)', 'Tách thành entity trung gian (join entity) riêng, vd Enrollment', 'Enrollment có @ManyToOne tới cả hai phía + các cột phụ (ngày, trạng thái)', 'Về bản chất là 2 quan hệ @OneToMany/@ManyToOne, không còn @ManyToMany trực tiếp'],
    answer: '@ManyToMany thuần chỉ tạo bảng nối 2 khóa ngoại, không có chỗ chứa thêm cột. Cách đúng là tách quan hệ thành một entity trung gian riêng (vd Enrollment) đại diện cho chính mối quan hệ đó, entity này có @ManyToOne tới Student và tới ClassRoom, cộng thêm các field riêng (enrolledAt, attendanceStatus…). Về bản chất, nhiều-nhiều biến thành hai quan hệ một-nhiều (Student 1-N Enrollment N-1 ClassRoom) — cách này linh hoạt và là thực hành chuẩn khi quan hệ có dữ liệu riêng.' },
  { id: 'scn-11', topic: 'scenario', level: 'medium', q: 'Một batch job xử lý ban đêm bị crash giữa chừng (mới xử lý được một phần dữ liệu) — làm sao chạy lại an toàn, không xử lý trùng?',
    points: ['Ghi checkpoint/trạng thái đã xử lý tới đâu (id cuối, offset)', 'Chạy lại từ checkpoint thay vì từ đầu', 'Idempotent: mỗi record xử lý lại vẫn ra cùng kết quả (upsert, đánh dấu processed)', 'Log rõ để biết job dừng ở đâu và vì sao'],
    answer: 'Job phải ghi lại checkpoint (id/offset bản ghi cuối đã xử lý xong, kèm commit theo lô) để lần chạy lại tiếp tục từ đó thay vì làm lại từ đầu. Song song đó, mỗi bước xử lý nên idempotent — dùng upsert hoặc đánh dấu "đã xử lý" trên từng record — để nếu checkpoint bị lệch một chút (xử lý lại vài bản ghi) thì kết quả vẫn đúng, không nhân đôi. Cần log đủ chi tiết (record cuối, lỗi cụ thể) để biết job dừng ở đâu và vì sao trước khi cho chạy lại.' },
  { id: 'scn-12', topic: 'scenario', level: 'hard', q: 'Một API production trả sai dữ liệu nhưng chỉ với một số user cụ thể, không phải tất cả — bạn khoanh vùng thế nào?',
    points: ['Tái hiện với đúng input/tài khoản bị báo lỗi, không thử chung chung', 'Tìm điểm chung của các user bị ảnh hưởng (cùng role, cùng dữ liệu cũ, cùng vùng/server, cùng feature flag)', 'Soi log theo correlation/request id của chính các case đó', 'Nghi ngờ: cache theo key sai, dữ liệu migrate dở, rollout phần trăm/feature flag, điều kiện biên trong code'],
    answer: 'Trước tiên tái hiện đúng với input/tài khoản bị báo lỗi thay vì thử ngẫu nhiên. Sau đó tìm điểm chung giữa các user bị ảnh hưởng: cùng role/tenant, cùng nằm trong một đợt migrate dữ liệu, cùng bị áp một feature flag/rollout %, hay cùng rơi vào một nhánh điều kiện biên trong code (vd danh sách rỗng, giá trị null, ngưỡng số). Soi log/APM theo đúng request id của các case lỗi để thấy khác biệt với case chạy đúng. Nguyên nhân hay gặp: cache bị đặt sai key (dính chéo dữ liệu giữa user), dữ liệu cũ migrate thiếu field, hoặc một feature mới chỉ bật cho một nhóm user và có bug.' },
  { id: 'scn-13', topic: 'scenario', level: 'easy', q: 'Khi nào nên xử lý một tác vụ đồng bộ trong request, khi nào nên đẩy sang hàng đợi xử lý bất đồng bộ? Ví dụ gửi email chào mừng sau khi đăng ký?',
    points: ['Đồng bộ: user cần kết quả ngay để tiếp tục (vd xác thực đăng nhập)', 'Bất đồng bộ/queue: tác vụ chậm, không cần chờ, hoặc có thể lỗi tạm thời cần retry', 'Gửi email chào mừng: không cần user chờ -> đẩy queue, tách khỏi luồng đăng ký chính', 'Bất đồng bộ giúp request chính nhanh & không phụ thuộc uptime của service phụ'],
    answer: 'Xử lý đồng bộ khi người dùng cần kết quả ngay để bước tiếp theo phụ thuộc vào nó (vd xác thực đăng nhập, kiểm tra tồn kho trước khi cho đặt hàng). Đẩy sang hàng đợi/bất đồng bộ khi tác vụ không cần chờ ngay, có thể chậm, hoặc phụ thuộc dịch vụ ngoài dễ lỗi tạm thời. Gửi email chào mừng là ví dụ điển hình nên bất đồng bộ: đẩy một message vào queue rồi trả response đăng ký thành công ngay, một worker riêng xử lý gửi email sau — request chính nhanh hơn và không bị treo nếu service email đang chậm/down; email vẫn gửi được nhờ retry ở worker.' },
  { id: 'scn-14', topic: 'scenario', level: 'hard', q: 'Làm sao đảm bảo hai request xử lý song song không cùng "đặt" được một tài nguyên có giới hạn (vd 2 người cùng đặt trùng 1 ghế)?',
    points: ['Ràng buộc UNIQUE ở DB cho (ghế, suất chiếu) — cách đơn giản & chắc nhất', 'Hoặc pessimistic lock (SELECT FOR UPDATE) khi kiểm tra rồi đặt', 'Optimistic lock (@Version) + retry nếu xung đột, hợp khi ít tranh chấp', 'Nhiều instance/service cùng truy cập thì cần lock phân tán (Redis) nếu không dựa được vào DB'],
    answer: 'Cách chắc chắn và đơn giản nhất là để DB tự đảm bảo qua ràng buộc UNIQUE (ghế, suất chiếu): hai transaction cùng insert thì một cái sẽ bị DB từ chối do vi phạm unique — không cần tự đồng bộ ở tầng ứng dụng. Có thể kết hợp pessimistic lock (SELECT ... FOR UPDATE) khi cần kiểm tra điều kiện phức tạp trước khi đặt, hoặc optimistic lock (@Version) với retry nếu ít khi tranh chấp. Nếu hệ thống có nhiều instance/service cùng thao tác mà không thể dồn hết về một ràng buộc DB, mới cần tới distributed lock (Redis Redlock) — nhưng ưu tiên ràng buộc ở DB trước vì đơn giản và bền hơn.' },
  { id: 'scn-15', topic: 'scenario', level: 'medium', q: 'Cần thêm một cột bắt buộc (NOT NULL) vào bảng production đang có hàng triệu dòng — làm sao thêm mà không gây downtime?',
    points: ['Không ALTER thẳng NOT NULL trên bảng lớn (khóa bảng lâu)', 'Bước 1: thêm cột NULLABLE (hoặc có DEFAULT) trước', 'Bước 2: backfill dữ liệu theo lô (batch update), không update hết 1 lần', 'Bước 3: sau khi backfill xong hết, mới ALTER thêm ràng buộc NOT NULL'],
    answer: 'Thêm thẳng một cột NOT NULL trên bảng hàng triệu dòng có thể khóa bảng rất lâu (tùy DB) và gây downtime. Cách an toàn: (1) thêm cột cho phép NULL (hoặc có DEFAULT) trước — thao tác này nhanh; (2) chạy job backfill dữ liệu cho cột đó theo từng lô nhỏ (batch update) để tránh khóa lâu và không ảnh hưởng traffic đang chạy; (3) khi đã chắc chắn mọi dòng đều có giá trị, mới ALTER thêm ràng buộc NOT NULL — lúc này thao tác rất nhẹ vì dữ liệu đã sẵn sàng. Cần deploy code đọc/ghi tương thích cả hai giai đoạn (cột có thể null) trong lúc backfill.' },
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
]

// -------------------- Lộ trình 2 tuần --------------------
export const CRASH_PLAN = [
  { day: 1, topic: 'OOP + Interface/Abstract + equals/hashCode', tasks: ['Thuộc 4 tính chất OOP trong 30s', 'Gõ 1 immutable class + override equals/hashCode'] },
  { day: 2, topic: 'Generics + Exception', tasks: ['Thuộc PECS, checked vs unchecked', 'Trả lời miệng 10 câu chủ đề core'] },
  { day: 3, topic: 'Collections + Big-O', tasks: ['Vẽ tay cơ chế HashMap', 'Thuộc bảng chọn collection + độ phức tạp'] },
  { day: 4, topic: 'Stream + Optional + Lambda', tasks: ['Viết 5 pipeline (map/filter/collect/groupingBy)', 'Phân biệt orElse vs orElseGet'] },
  { day: 5, topic: 'Concurrency cơ bản', tasks: ['Thread/Runnable/Callable, ExecutorService', 'volatile vs synchronized vs Atomic, deadlock'] },
  { day: 6, topic: 'Spring Boot + REST + DI', tasks: ['Gõ 1 CRUD controller + @RestControllerAdvice', 'Thuộc 3 annotation của @SpringBootApplication'] },
  { day: 7, topic: 'Ôn + tự test tuần 1', tasks: ['Mock Interview chủ đề Java Core', 'Ghi lại câu chưa chắc'] },
  { day: 8, topic: 'JPA/Hibernate + N+1', tasks: ['Nhớ owning vs inverse side', 'Fix N+1: JOIN FETCH / EntityGraph'] },
  { day: 9, topic: '@Transactional + JPQL + DTO', tasks: ['Hiểu propagation, self-invocation', 'Khi nào native query'] },
  { day: 10, topic: 'Testing (JUnit + Mockito)', tasks: ['@Mock vs @InjectMocks, stub vs verify', 'Viết 3 unit test'] },
  { day: 11, topic: 'Spring Security + JWT', tasks: ['Flow login → token → filter', 'JWT KHÔNG mã hóa; authn vs authz'] },
  { day: 12, topic: 'SOLID + Patterns + JVM', tasks: ['5 nguyên tắc SOLID trong 30s', 'Heap/stack/GC/memory leak'] },
  { day: 13, topic: 'SQL sâu + Frontend + Stack thực tế', tasks: ['Ôn tối ưu query (EXPLAIN/index), composite/covering index', 'Ôn lướt JS core + React/Angular; nhớ Struts/MyBatis/batch trong CV'] },
  { day: 14, topic: 'Kỹ năng PV + Mock Interview toàn phần', tasks: ['Luyện giới thiệu bản thân 60s (VI+EN) + STAR 2–3 dự án', 'Phỏng vấn thử mọi chủ đề, ôn lại chủ đề điểm thấp'] },
]

// -------------------- Coding challenge (chạy thật qua run-java) --------------------
export const CODING_CHALLENGES = [
  {
    id: 'reverse-string', title: 'Đảo ngược chuỗi', level: 'easy',
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
    id: 'fizzbuzz', title: 'FizzBuzz', level: 'easy',
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
    id: 'two-sum', title: 'Two Sum (HashMap)', level: 'medium',
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
    id: 'dedup', title: 'Loại bỏ trùng lặp (Set)', level: 'easy',
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
    id: 'word-count', title: 'Đếm tần suất từ (Stream)', level: 'medium',
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
    id: 'anagram', title: 'Kiểm tra Anagram', level: 'medium',
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
    id: 'fibonacci', title: 'Fibonacci (vòng lặp)', level: 'easy',
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
    id: 'palindrome', title: 'Kiểm tra Palindrome', level: 'easy',
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
    id: 'debug-cme', title: 'Sửa lỗi: xóa phần tử khi đang lặp (debug)', level: 'medium',
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
    id: 'valid-parentheses', title: 'Kiểm tra ngoặc hợp lệ (Stack)', level: 'medium',
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
    id: 'group-anagrams', title: 'Gom nhóm Anagram (Stream)', level: 'medium',
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
    id: 'binary-search', title: 'Binary Search', level: 'medium',
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
    id: 'merge-intervals', title: 'Gộp khoảng chồng lấn (Merge Intervals)', level: 'hard',
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
    id: 'lru-cache', title: 'LRU Cache (LinkedHashMap)', level: 'hard',
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

export const INTERVIEW_TOTALS = {
  questions: QUESTION_BANK.length,
  topics: INTERVIEW_TOPICS.length,
  challenges: CODING_CHALLENGES.length,
  stories: INTERVIEW_SKILLS.starStories.length,
}
