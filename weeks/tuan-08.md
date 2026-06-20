# 🔄 Tuần 8 · ÔN TẬP — Spaced Review T1-T7 · 29/06–05/07/2025

## 📅 Lịch Ôn Tập Tuần 8 — Tổng Quan 7 Ngày

*Tuần 8 KHÔNG học chủ đề mới — đây là tuần củng cố toàn bộ kiến thức T1-T7 bằng active recall, gõ lại code từ trí nhớ, và mock interview. Mục tiêu: biến kiến thức thành phản xạ.*

| Ngày | Thứ | Chế độ | Thời gian | Nội dung ôn |
| --- | --- | --- | --- | --- |
| 29/06 | Thứ 2 | LIGHT | 1.5h | Ôn T1-T2: OOP, Interface, equals/hashCode, Generics, Exception, Collections |
| 30/06 | Thứ 3 | FULL | 2.5h | Ôn T3: Stream API, CompletableFuture, Functional Programming, SOLID |
| 01/07 | Thứ 4 | FULL | 2.5h | Ôn T4: Spring Boot, REST API, DI/IoC, Spring Data JPA cơ bản |
| 02/07 | Thứ 5 | FULL | 2.5h | Ôn T5: JPA nâng cao (N+1, EntityGraph), Redis Cache, Spring AI setup |
| 03/07 | Thứ 6 | LIGHT | 1.5h | Ôn T6: Reactive (Mono/Flux), Streaming, Chat Memory, @Async, Prompt Engineering, Docker |
| 04/07 | Thứ 7 | WEEKEND | 4h | Ôn T7: Security/JWT, JUnit/Mockito, RAG + tích hợp toàn bộ |
| 05/07 | CN | REVIEW | 4h | Full Mock Interview tổng hợp T1-T7 + đánh giá điểm yếu + kế hoạch T9-T12 |

## ⚡ Ngày 1 · Ôn T1-T2: Java Core nền tảng

**29/06 — Thứ 2** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Vocalmax review + Parroto · 15 phút*
>
> Ôn lại 20 từ vựng IT cốt lõi T1-T2 trên Vocalmax (OOP, collections, exception terms). Parroto shadow lại 3 câu khó nhất đã học. Mục tiêu: vocabulary thành phản xạ.

### 📖 Tóm Tắt Ôn Tập

**OOP 4 trụ cột**

Encapsulation (private + getter/setter), Inheritance (extends, single), Polymorphism (override runtime / overload compile-time), Abstraction (interface/abstract). Interface vs Abstract: interface = contract đa kế thừa, abstract = is-a + state. Nhớ: "can-do" → interface, "is-a" → abstract.

**equals/hashCode contract**

a.equals(b) → a.hashCode()==b.hashCode(). Vi phạm → HashMap/HashSet hỏng. Luôn override cả 2 cùng nhau. Immutability: final fields, no setters, defensive copy. Comparable (natural order) vs Comparator (custom/multiple orders).

**Generics + type erasure**

Type params bị xóa lúc compile (runtime List<String> == List<Integer> == List). PECS: Producer-Extends, Consumer-Super. Không instanceof T, không new T[]. Bounded types <T extends Comparable<T>>.

**Exception + Collections**

Checked (compile-time, IOException) vs Unchecked (runtime, NPE/RuntimeException). try-with-resources (AutoCloseable). ArrayList (random access O(1)) vs LinkedList (insert head O(1)). HashMap (bucket + hashCode → index, load factor 0.75), TreeMap (Red-Black tree, sorted). ConcurrentModificationException → iterator.remove/removeIf.

### 💻 Code Ôn Tập — Tự Gõ Lại Từ Trí Nhớ

```java
// Active recall: viết lại Generic Stack KHÔNG nhìn notes
public class Stack<T> {
    private List<T> items = new ArrayList<>();

    public void push(T item) { items.add(item); }

    public T pop() {
        if (isEmpty()) throw new EmptyStackException();
        return items.remove(items.size() - 1);
    }

    public T peek() {
        if (isEmpty()) throw new EmptyStackException();
        return items.get(items.size() - 1);
    }

    public boolean isEmpty() { return items.isEmpty(); }
    public int size() { return items.size(); }
}

// Recall: equals + hashCode đúng contract
public class Point {
    private final int x, y;
    public Point(int x, int y) { this.x = x; this.y = y; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point p)) return false;
        return x == p.x && y == p.y;
    }
    @Override
    public int hashCode() { return Objects.hash(x, y); }
}
```

### ✍️ Bài Tập Active Recall (3 bài)

1. Gõ lại Generic Stack<T> hoàn chỉnh từ trí nhớ, không nhìn notes. Tự test với HashSet.
2. Viết class có equals/hashCode đúng contract, test trong HashSet (thêm 2 object "bằng nhau" → set chỉ giữ 1).
3. Giải thích to ra (Feynman): Interface vs Abstract Class, checked vs unchecked exception — như dạy người mới.

### 🎤 Câu Hỏi Phỏng Vấn — Tổng Hợp (5 câu)

**Dễ · 4 tính chất OOP và giải thích ngắn?**

Encapsulation (ẩn data bằng private + getter/setter), Inheritance (kế thừa qua extends), Polymorphism (override runtime / overload compile-time), Abstraction (ẩn implementation qua interface/abstract). Đây là nền tảng mọi câu hỏi OOP.

**Dễ · equals/hashCode contract là gì?**

Nếu a.equals(b) thì BẮT BUỘC a.hashCode() == b.hashCode(). Ngược lại không bắt buộc (hash collision OK). Vi phạm → HashMap/HashSet hoạt động sai (không tìm được key). Luôn override cả 2 cùng nhau, dùng Objects.hash() + Objects.equals().

**Trung · Type erasure ảnh hưởng gì khi code?**

Generics chỉ tồn tại compile-time, runtime bị xóa. Hệ quả: không new T[], không instanceof T, không overload chỉ khác generic type (method(List<String>) vs method(List<Integer>) — cùng erasure → compile error). Bù lại: backward compatible với code cũ.

**Trung · Khi nào dùng ArrayList vs LinkedList vs HashMap?**

ArrayList: random access nhiều (get O(1)), default choice. LinkedList: insert/remove ở đầu/cuối nhiều (O(1)), dùng làm Queue/Deque. HashMap: key-value lookup O(1) trung bình. TreeMap: cần sorted keys. Chọn đúng cấu trúc = nửa bài toán performance.

**Khó · Giải thích HashMap internals: từ put(key,value) đến lưu trữ.**

hashCode(key) → spread/hash function → index = hash & (n-1) (n = bucket count). Collision → chaining (linked list, chuyển sang Red-Black tree khi >8 nodes/bucket từ Java 8). Load factor 0.75: khi size > capacity×0.75 → resize gấp đôi + rehash. equals() so sánh trong bucket để tìm đúng key. Vì vậy equals/hashCode phải đúng.

### 🧠 Quiz Nhanh

1. Theo equals/hashCode contract, điều nào BẮT BUỘC đúng?
   - [ ] Hai object có hashCode bằng nhau thì luôn equals
   - [x] Nếu a.equals(b) thì a.hashCode() phải bằng b.hashCode()
   - [ ] equals và hashCode không liên quan đến nhau
   - [ ] Chỉ cần override equals, không cần hashCode
   💡 Contract một chiều: equals bằng nhau buộc hashCode bằng nhau; ngược lại hash collision vẫn được phép.

2. Type erasure trong Generics gây ra hệ quả nào lúc runtime?
   - [x] Không thể dùng `new T[]` hay `instanceof T`
   - [ ] List<String> và List<Integer> là hai class khác nhau lúc runtime
   - [ ] Generic giúp tăng tốc độ runtime
   - [ ] Có thể overload method chỉ khác generic type
   💡 Generics chỉ tồn tại compile-time; runtime bị xóa nên `new T[]`, `instanceof T` và overload chỉ khác generic type đều không hợp lệ.

3. Khi nào nên chọn LinkedList thay vì ArrayList?
   - [ ] Khi cần random access get(i) nhiều
   - [ ] Khi cần lookup theo key
   - [x] Khi insert/remove ở đầu/cuối nhiều, dùng làm Queue/Deque
   - [ ] Khi cần sorted keys tự động
   💡 ArrayList tốt cho random access O(1); LinkedList tốt cho insert/remove đầu-cuối O(1) và làm Queue/Deque.

- **🧩 LeetCode:** #1 Two Sum + #20 Valid Parentheses — Easy — review nền tảng

- **🤖 AI Tools:** Dùng AI quiz bản thân về OOP concepts.

- **📚 Tài Nguyên:** Ôn lại notes T1-T2 + tự làm flashcards.

## 💪 Ngày 2 · Ôn T3: Stream, Concurrency, Functional, SOLID

**30/06 — Thứ 3** · **FULL** · ⏱ 30 phút sáng + 2h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Parroto Shadowing · 20 phút*
>
> Shadow lại câu khó về concurrency + functional programming. Vocalmax ôn từ vựng Stream/thread. Mục tiêu: nói trôi chảy về async concepts.

### 📖 Tóm Tắt Ôn Tập

**Stream API + Optional**

Pipeline: source → intermediate (filter/map/sorted, lazy) → terminal (collect/reduce/count, trigger). Lazy evaluation + short-circuit (findFirst). Optional tránh NPE: orElse (eager) vs orElseGet (lazy), map/flatMap, tránh .get(). flatMap(Optional::stream) Java 9+.

**CompletableFuture**

supplyAsync → thenApply (map) → thenCompose (flatMap) → exceptionally/handle. allOf (parallel, đợi tất cả) / anyOf (fastest). thenApply (caller thread) vs thenApplyAsync (pool). join() (unchecked) vs get() (checked). Custom executor cho I/O.

**Functional Programming**

Function (T→R, andThen/compose), Predicate (T→bool, and/or/negate), Supplier (→T, lazy), Consumer (T→void). Method references (static/bound/unbound/constructor). Lambda capture effectively-final. SAM interface + @FunctionalInterface.

**Concurrency + SOLID**

Thread/Runnable/Callable, ExecutorService (fixed/cached pool), synchronized (mutual exclusion) vs volatile (visibility) vs AtomicInteger (CAS lock-free) vs ReentrantLock (tryLock/fairness). SOLID: SRP (1 lý do thay đổi), OCP (extend không modify), LSP (subclass thay thế được), ISP (interface nhỏ), DIP (depend abstraction).

### 💻 Code Ôn Tập — Tự Gõ Lại Từ Trí Nhớ

```java
// Active recall: CompletableFuture parallel fetch + combine
CompletableFuture<User> userCF = CompletableFuture.supplyAsync(() -> fetchUser(1L), executor);
CompletableFuture<List<Order>> ordersCF = CompletableFuture.supplyAsync(() -> fetchOrders(1L), executor);

CompletableFuture<Profile> profile = userCF
    .thenCombine(ordersCF, (user, orders) -> new Profile(user, orders))
    .exceptionally(ex -> Profile.empty());

// Active recall: functional composition + stream
Function<String, String> pipeline = ((Function<String,String>) String::trim)
    .andThen(String::toLowerCase);

Predicate<String> valid = ((Predicate<String>) String::isBlank).negate();

List<String> result = names.stream()
    .filter(valid)
    .map(pipeline)
    .sorted()
    .collect(Collectors.toList());
```

### ✍️ Bài Tập Active Recall (4 bài)

1. Gõ lại CompletableFuture chain (supplyAsync → thenApply → exceptionally) từ trí nhớ.
2. Viết Function composition + Predicate.and() không nhìn notes.
3. Giải thích to ra: synchronized vs volatile vs AtomicInteger — khi nào dùng cái nào.
4. Liệt kê 5 nguyên tắc SOLID + 1 ví dụ vi phạm mỗi nguyên tắc (Feynman test).

### 🎤 Câu Hỏi Phỏng Vấn — Tổng Hợp (7 câu)

**Dễ · Stream lazy evaluation nghĩa là gì?**

Intermediate ops (filter/map) không chạy ngay — chỉ build pipeline. Chỉ khi terminal op (collect/count/findFirst) được gọi thì toàn bộ mới execute. Cho phép short-circuit: findFirst() dừng ngay khi tìm thấy, không duyệt hết. Tối ưu performance.

**Dễ · orElse vs orElseGet khác nhau?**

orElse(value): value LUÔN được evaluate (kể cả khi Optional có giá trị). orElseGet(supplier): supplier chỉ chạy khi Optional empty (lazy). Với default đắt (new object, DB call) → dùng orElseGet để tránh lãng phí.

**Dễ · 4 functional interfaces cốt lõi?**

Function<T,R> (transform), Predicate<T> (test→boolean), Supplier<T> (provide, no input), Consumer<T> (consume, no return). Nhớ qua: Read=Function, Test=Predicate, Create=Supplier, Side-effect=Consumer.

**Trung · synchronized vs volatile vs AtomicInteger?**

volatile: chỉ visibility (thread thấy giá trị mới), KHÔNG atomicity. synchronized: mutual exclusion (1 thread/lúc) cho compound operations. AtomicInteger: lock-free CAS, nhanh cho counter đơn giản. Rule: counter → Atomic, complex state → synchronized, flag → volatile.

**Trung · thenApply vs thenCompose trong CompletableFuture?**

thenApply(T→U): transform, wrap kết quả trong CF (như map). thenCompose(T→CF<U>): khi function trả về CF, flatten để tránh CF<CF<U>> (như flatMap). Dùng thenCompose khi chain async operations phụ thuộc nhau.

**Khó · Giải thích Dependency Inversion (DIP) và phân biệt với Dependency Injection (DI).**

DIP (principle): high-level + low-level cùng depend abstraction, không depend concrete. DI (technique): inject dependencies từ ngoài để đạt DIP. DIP là WHY, DI là HOW. Spring IoC = DI in action. Constructor injection > field (immutable, testable, explicit). Giúp loose coupling + dễ mock test.

**Mock EN · "Explain how you'd use CompletableFuture to call multiple services in parallel."**

"I'd kick off each service call with CompletableFuture.supplyAsync on a dedicated I/O thread pool, not the common ForkJoinPool, so blocking calls don't starve it. Then I combine them — thenCombine for two, or allOf for many — waiting for all to complete before building the aggregate response. I add exceptionally or handle for graceful fallback if one fails. This turns sequential 200ms+200ms+200ms calls into a single ~200ms parallel operation, which is critical for API latency."

### 🧠 Quiz Nhanh

1. Stream "lazy evaluation" nghĩa là gì?
   - [x] Intermediate ops chỉ chạy khi có terminal op được gọi
   - [ ] Mọi op chạy ngay khi khai báo
   - [ ] Stream luôn duyệt hết mọi phần tử
   - [ ] filter/map chạy trên thread riêng
   💡 Intermediate ops (filter/map) chỉ build pipeline; chỉ khi terminal op chạy mới execute, cho phép short-circuit như findFirst.

2. orElse và orElseGet khác nhau ở điểm nào?
   - [ ] orElseGet luôn evaluate giá trị mặc định
   - [ ] Không có khác biệt thực tế
   - [x] orElse luôn evaluate value; orElseGet chỉ chạy supplier khi Optional empty
   - [ ] orElse chỉ dùng cho primitive
   💡 orElse(value) evaluate value kể cả khi có giá trị; orElseGet(supplier) lazy, chỉ chạy khi empty — tốt cho default đắt.

3. thenCompose dùng khi nào trong CompletableFuture?
   - [ ] Khi muốn chạy song song allOf
   - [x] Khi function trả về CF<U>, để flatten tránh CF<CF<U>>
   - [ ] Khi cần transform giá trị thường (như map)
   - [ ] Khi muốn xử lý exception
   💡 thenApply như map (T→U), thenCompose như flatMap (T→CF<U>) — dùng để chain các async operation phụ thuộc nhau.

- **🧩 LeetCode:** #146 LRU Cache + #347 Top K Frequent — Medium — review concurrency/collections

- **🤖 AI Tools:** Dùng AI tạo concurrency scenarios để luyện.

- **📚 Tài Nguyên:** Ôn lại notes T3 + "Java Concurrency in Practice" chương 2-3.

## 💪 Ngày 3 · Ôn T4: Spring Boot, REST, DI, JPA cơ bản

**01/07 — Thứ 4** · **FULL** · ⏱ 30 phút sáng + 2h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Parroto Shadowing · 20 phút*
>
> Shadow câu về REST API design + Spring DI. Vocalmax ôn từ vựng Spring. Mục tiêu: nói về Spring architecture trôi chảy.

### 📖 Tóm Tắt Ôn Tập

**Spring Boot + Auto-config**

@SpringBootApplication = @Configuration + @EnableAutoConfiguration + @ComponentScan. Auto-config dựa classpath (@ConditionalOnClass). Embedded Tomcat, fat JAR. application.yml config. Profiles (dev/prod).

**REST API**

@RestController (= @Controller + @ResponseBody). HTTP methods + status (200/201/204/400/404/409). @PathVariable (resource id) vs @RequestParam (filter) vs @RequestBody (JSON). ResponseEntity kiểm soát status+headers. DTO pattern (tách API khỏi entity) + @Valid validation + @RestControllerAdvice.

**DI + IoC**

IoC container quản lý beans. @Component/@Service/@Repository/@Controller stereotypes. Constructor injection (> field injection: immutable, testable). @Bean/@Configuration (manual beans). @Primary/@Qualifier (resolve ambiguity). Bean scopes (singleton default, prototype). Circular dependency → @Lazy/redesign.

**Spring Data JPA cơ bản**

@Entity/@Id/@GeneratedValue. JpaRepository (save/findById/findAll/deleteById). Derived queries (findByNameAndGpa). @Query JPQL. Pageable/Page. @Transactional (readOnly cho GET). LAZY default cho collections.

### 💻 Code Ôn Tập — Tự Gõ Lại Từ Trí Nhớ

```java
// Active recall: 3-layer Spring REST controller
@RestController
@RequestMapping("/api/v1/students")
public class StudentController {
    private final StudentService service;
    public StudentController(StudentService service) { this.service = service; } // constructor injection

    @GetMapping
    public Page<StudentDto> getAll(@RequestParam(defaultValue="0") int page,
                                   @RequestParam(defaultValue="10") int size) {
        return service.findAll(PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentDto create(@Valid @RequestBody CreateStudentRequest req) {
        return service.create(req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}
```

### ✍️ Bài Tập Active Recall (4 bài)

1. Gõ lại full CRUD controller (GET all + pagination, GET by id, POST, PUT, DELETE) từ trí nhớ với đúng status codes.
2. Viết @Entity + JpaRepository với 2 derived query methods (findByX, findByXGreaterThan).
3. Giải thích to ra: tại sao constructor injection > field injection (4 lý do).
4. Thiết kế DTO pattern: Request DTO (validation) + Response DTO cho 1 resource bất kỳ.

### 🎤 Câu Hỏi Phỏng Vấn — Tổng Hợp (7 câu)

**Dễ · @SpringBootApplication gồm những annotation nào?**

@Configuration (config class), @EnableAutoConfiguration (auto-config dựa classpath), @ComponentScan (quét components trong package + sub-packages). 3 trong 1 meta-annotation.

**Dễ · HTTP status 200 vs 201 vs 204 vs 404?**

200 OK (GET/PUT thành công), 201 Created (POST tạo mới, kèm Location header), 204 No Content (DELETE thành công, no body), 404 Not Found (resource không tồn tại). 400 Bad Request cho validation fail.

**Trung · @Component vs @Service vs @Repository khác gì?**

Đều là @Component specialization (đều được component scan). @Repository thêm exception translation (DB exception → DataAccessException). @Service đánh dấu business layer. Semantic + AOP behavior khác nhau, giúp code readable + target AOP đúng layer.

**Trung · Tại sao Constructor Injection > Field Injection?**

(1) Immutable (final fields). (2) Explicit dependencies (thấy rõ trong constructor). (3) Testable (new Service(mock) không cần Spring). (4) Fail-fast (thiếu dependency → lỗi lúc khởi tạo). Spring team + IntelliJ đều khuyến nghị constructor injection.

**Trung · DTO pattern giải quyết vấn đề gì?**

Tách API contract khỏi DB entity: security (ẩn fields nhạy cảm), versioning (API đổi độc lập DB), validation (validate input riêng), tránh LazyInitializationException khi serialize entity, control fields trả về. Dùng MapStruct (compile-time) map entity↔DTO.

**Khó · @Transactional readOnly=true tối ưu gì?**

Hibernate: no dirty checking (không track changes), no snapshot (ít memory), flush mode NEVER (không accidental writes). DB: hint route tới read replica nếu config. Connection pool optimization. Luôn dùng cho service methods chỉ đọc → performance + an toàn (không vô tình ghi).

**Mock EN · "Walk me through the layers of a Spring Boot REST application."**

"I follow a three-layer architecture. The Controller layer handles HTTP — mapping requests, validation, and returning proper status codes via ResponseEntity. The Service layer holds business logic and transaction boundaries with @Transactional. The Repository layer extends JpaRepository for data access. DTOs separate the API contract from JPA entities for security and flexibility. Dependencies flow inward via constructor injection, and a @RestControllerAdvice centralizes exception handling so every error returns a consistent JSON format."

### 🧠 Quiz Nhanh

1. @SpringBootApplication gồm những annotation nào?
   - [x] @Configuration + @EnableAutoConfiguration + @ComponentScan
   - [ ] @Controller + @Service + @Repository
   - [ ] @RestController + @RequestMapping + @Bean
   - [ ] @Entity + @Id + @GeneratedValue
   💡 Đây là meta-annotation 3-trong-1: config class, auto-config dựa classpath, và component scan package + sub-packages.

2. HTTP status nào đúng cho POST tạo resource mới thành công?
   - [ ] 200 OK
   - [ ] 204 No Content
   - [x] 201 Created
   - [ ] 404 Not Found
   💡 201 Created cho POST tạo mới (kèm Location header); 200 cho GET/PUT, 204 cho DELETE no body, 404 khi không tồn tại.

3. Tại sao Constructor Injection được ưu tiên hơn Field Injection?
   - [ ] Vì viết ít code hơn
   - [ ] Vì tạo bean nhanh hơn lúc runtime
   - [x] Vì cho phép final fields, explicit dependencies, dễ test và fail-fast
   - [ ] Vì hỗ trợ circular dependency tốt hơn
   💡 Constructor injection cho immutable (final), dependencies rõ ràng, test không cần Spring (new Service(mock)), và lỗi sớm khi thiếu dependency.

- **🧩 LeetCode:** #704 Binary Search + #242 Valid Anagram — Easy — review

- **🤖 AI Tools:** Dùng AI review Spring architecture của bạn.

- **📚 Tài Nguyên:** Ôn lại notes T4 + Spring Boot reference "Web".

## 💪 Ngày 4 · Ôn T5: JPA nâng cao, Redis, Spring AI

**02/07 — Thứ 5** · **FULL** · ⏱ 30 phút sáng + 2h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Parroto Shadowing · 20 phút*
>
> Shadow câu về JPA performance + caching. Vocalmax ôn từ vựng JPA/Redis/AI. Mục tiêu: nói về performance optimization như senior.

### 📖 Tóm Tắt Ôn Tập

**N+1 + fetch optimization**

N+1 = N children queries sau 1 parent query. Fix: JOIN FETCH (explicit JPQL), @EntityGraph (declarative), @BatchSize (IN clause), DTO projection (chỉ cột cần). Tất cả associations để LAZY mặc định. MultipleBagFetchException → đổi List sang Set hoặc tách query.

**Entity relationships**

Owning side (FK, @JoinColumn) vs inverse side (mappedBy). Cascade (PERSIST/REMOVE/ALL), orphanRemoval (xóa child khi tách khỏi collection). Sync cả 2 side qua helper methods. Tránh @ManyToMany REMOVE cascade. EAGER vs LAZY.

**Redis Cache**

@Cacheable (read, skip nếu hit), @CachePut (luôn update), @CacheEvict (invalidate). TTL safety net. Cache-aside pattern. Distributed cache cho multi-instance (vs local Caffeine). Cache stampede → lock/early refresh.

**Spring AI setup**

ChatClient (fluent: .prompt().user().call().content()) vs ChatModel (low-level). System vs User message. PromptTemplate placeholders. Structured output .entity(Class). Cache AI responses (Redis, key=prompt hash, temperature thấp). API key qua env var.

### 💻 Code Ôn Tập — Tự Gõ Lại Từ Trí Nhớ

```java
// Active recall: N+1 fix (3 cách) + Redis cache
public interface StudentRepository extends JpaRepository<Student, Long> {
    // Cách 1: JOIN FETCH
    @Query("SELECT DISTINCT s FROM Student s JOIN FETCH s.course")
    List<Student> findAllWithCourse();

    // Cách 2: @EntityGraph
    @EntityGraph(attributePaths = {"course", "enrollments"})
    List<Student> findByFaculty(Faculty faculty);
}

@Service
public class StudentService {
    @Cacheable(value = "students", key = "#id")
    public StudentDto findById(Long id) { /* chỉ chạy khi cache miss */ ... }

    @CacheEvict(value = "students", key = "#id")
    public void delete(Long id) { repo.deleteById(id); } // invalidate cache
}

// Spring AI structured output
StudentAdvice advice = chatClient.prompt()
    .system("You are an academic advisor.")
    .user(u -> u.text("Advise {n} with GPA {g}").param("n", name).param("g", gpa))
    .call()
    .entity(StudentAdvice.class); // JSON → record
```

### ✍️ Bài Tập Active Recall (4 bài)

1. Gõ lại 3 cách fix N+1 (JOIN FETCH, @EntityGraph, @BatchSize) từ trí nhớ.
2. Viết @Cacheable + @CacheEvict cho 1 service, giải thích cache-aside flow.
3. Giải thích to ra: owning vs inverse side, khi nào cần sync cả 2.
4. Viết Spring AI ChatClient call với system message + structured output.

### 🎤 Câu Hỏi Phỏng Vấn — Tổng Hợp (7 câu)

**Dễ · 4 cách fix N+1?**

JOIN FETCH (explicit JPQL, 1 query), @EntityGraph (declarative trên repository method), @BatchSize (gom lazy loads thành IN clause), DTO projection (chỉ select cột cần, không load full entity).

**Dễ · @Cacheable vs @CacheEvict?**

@Cacheable: lưu kết quả method vào cache, lần sau cùng key trả từ cache (skip method). @CacheEvict: xóa entry khỏi cache (gọi khi update/delete để invalidate). Cặp đôi tạo cache-aside pattern.

**Dễ · ChatClient vs ChatModel trong Spring AI?**

ChatClient: fluent high-level API (.prompt().user().call().content()), tiện cho hầu hết use cases. ChatModel: low-level (call(Prompt)→ChatResponse), control chi tiết. ChatClient build trên ChatModel, khuyên dùng mặc định.

**Trung · Owning side vs inverse side trong JPA?**

Owning side: giữ FK, có @JoinColumn, thường @ManyToOne. Inverse side: dùng mappedBy, không quản lý FK. Hibernate chỉ nhìn owning side để persist. Update inverse side không có tác dụng nếu owning side chưa set. Sync cả 2 qua helper methods.

**Trung · Tại sao cache cần TTL ngay cả khi có @CacheEvict?**

@CacheEvict chỉ invalidate khi data đổi QUA app. Nếu data đổi ngoài app (another service, manual DB) hoặc evict bug → stale vĩnh viễn. TTL là safety net — stale data tự expire sau X phút. Defense in depth.

**Khó · MultipleBagFetchException nguyên nhân và fix?**

JOIN FETCH 2+ List collections cùng query → Cartesian product không hợp lệ. Fix: (1) đổi List → Set, (2) tách nhiều queries (Hibernate cache entity, query 2 chỉ thêm collection), (3) @BatchSize thay fetch, (4) default_batch_fetch_size global config.

**Mock EN · "How do you diagnose and fix a slow JPA endpoint?"**

"First I enable SQL logging to see the actual queries. The most common culprit is the N+1 problem — loading a list then lazily accessing an association per row. I fix it with JOIN FETCH, an @EntityGraph, or @BatchSize depending on the case. If we're loading full entities just for a read-only list, I switch to a DTO projection to fetch only needed columns. I verify pagination happens at the database level, add indexes on filter and join columns, and cache hot read-only data in Redis with a TTL."

### 🧠 Quiz Nhanh

1. Cách nào KHÔNG phải là cách fix N+1 problem?
   - [ ] JOIN FETCH trong JPQL
   - [ ] @EntityGraph declarative
   - [x] Đổi tất cả associations sang EAGER
   - [ ] DTO projection chỉ select cột cần
   💡 4 cách đúng: JOIN FETCH, @EntityGraph, @BatchSize, DTO projection. Để mọi thứ EAGER gây load thừa và vẫn không giải quyết tận gốc.

2. Trong JPA, owning side là phía nào?
   - [x] Phía giữ FK, có @JoinColumn (thường @ManyToOne)
   - [ ] Phía dùng mappedBy
   - [ ] Phía luôn là collection
   - [ ] Phía không liên quan đến persist
   💡 Owning side giữ FK và @JoinColumn; Hibernate chỉ nhìn owning side để persist, nên update inverse side (mappedBy) không có tác dụng nếu owning chưa set.

3. Tại sao cache vẫn cần TTL dù đã có @CacheEvict?
   - [ ] Vì @CacheEvict không hoạt động
   - [ ] Vì TTL giúp cache nhanh hơn
   - [x] Vì @CacheEvict chỉ invalidate khi data đổi qua app; TTL là safety net cho thay đổi ngoài app
   - [ ] Vì TTL bắt buộc trong Redis
   💡 Nếu data đổi ngoài app hoặc evict bug, data sẽ stale vĩnh viễn; TTL tự expire stale data — defense in depth.

- **🧩 LeetCode:** #1 Two Sum + #49 Group Anagrams — Review

- **🤖 AI Tools:** Dùng AI tạo JPA performance scenarios.

- **📚 Tài Nguyên:** Ôn lại notes T5 + Vlad Mihalcea performance blog.

## ⚡ Ngày 5 · Ôn T6: Reactive, Streaming, Async, Prompt, Docker

**03/07 — Thứ 6** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Vocalmax review + Parroto · 15 phút*
>
> Ôn từ vựng reactive/Docker. Shadow câu về streaming + containerization. Mục tiêu: vocabulary phản xạ.

### 📖 Tóm Tắt Ôn Tập

**Reactive + Streaming**

Mono (0-1) vs Flux (0-N), lazy (subscribe mới chạy), backpressure, non-blocking event-loop. ChatClient.stream() → Flux<String>. SSE (text/event-stream) server push, perceived latency thấp. SSE vs WebSocket (1 chiều vs 2 chiều). subscribeOn (source) vs publishOn (downstream).

**Chat Memory + @Async**

LLM stateless → cần gửi history. MessageChatMemoryAdvisor, conversationId tách session. Bound context window (sliding window/summarization). @Async + ThreadPoolTaskExecutor (core/max/queue), CallerRunsPolicy backpressure, return CompletableFuture. Self-invocation + @Transactional pitfalls.

**Prompt Engineering**

Zero-shot vs few-shot (ví dụ trong prompt). Role prompting (system message persona). Chain of Thought ("think step by step"). Structured output (.entity). Grounding (facts trong prompt) chống hallucination. Prompt injection (delimiters + validation phòng).

**Docker**

Container (share kernel, nhẹ) vs VM (full OS). Image (template) vs Container (instance). Multi-stage build (build stage JDK + run stage JRE → image nhỏ). Layer caching (deps trước code). docker-compose (multi-container, service name = DNS). Non-root, pin versions security.

### 💻 Code Ôn Tập — Tự Gõ Lại Từ Trí Nhớ

```java
// Active recall: streaming chatbot endpoint với memory
@GetMapping(value = "/{conversationId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<String> streamChat(@PathVariable String conversationId, @RequestParam String message) {
    return chatClient.prompt()
        .user(message)
        .advisors(a -> a.param(CHAT_MEMORY_CONVERSATION_ID_KEY, conversationId))
        .stream()
        .content()
        .onErrorResume(e -> Flux.just("[Error: " + e.getMessage() + "]"));
}
```

```docker
# Active recall: multi-stage Dockerfile
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn/ .mvn
RUN ./mvnw dependency:go-offline
COPY src ./src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### ✍️ Bài Tập Active Recall (3 bài)

1. Gõ lại streaming endpoint (Flux + SSE + onErrorResume) từ trí nhớ.
2. Viết multi-stage Dockerfile cho Spring Boot không nhìn notes.
3. Giải thích to ra: Mono vs Flux, SSE vs WebSocket, few-shot vs zero-shot prompting.

### 🎤 Câu Hỏi Phỏng Vấn — Tổng Hợp (5 câu)

**Dễ · Mono vs Flux?**

Mono<T> emit 0-1 item (async Optional), Flux<T> emit 0-N items (async Stream). Mono cho single result, Flux cho list/streaming (LLM tokens). Cả 2 lazy — chỉ chạy khi subscribe.

**Dễ · Tại sao streaming LLM cải thiện UX?**

LLM tạo token tuần tự (5-30s). Không streaming: user chờ toàn bộ → khó chịu. Streaming: hiển thị từng token ngay → perceived latency thấp, đọc được ngay phần đầu (như ChatGPT typing). Total time không đổi nhưng cảm giác nhanh hơn nhiều.

**Trung · Tại sao @Async cần custom ThreadPoolTaskExecutor?**

Default SimpleAsyncTaskExecutor tạo thread mới mỗi task (unbounded) → OOM. Custom executor bounded (core/max/queue) + named threads + rejection policy → control + an toàn. I/O-bound (LLM) dùng pool lớn hơn CPU-bound.

**Trung · Few-shot prompting và Chain of Thought?**

Few-shot: cho vài ví dụ input→output trong prompt để model học pattern (vs zero-shot chỉ instruction). Chain of Thought: yêu cầu "think step by step" → reasoning tốt hơn cho task logic. Cả 2 cải thiện accuracy, đổi lại tốn tokens hơn.

**Khó · Multi-stage Docker build + layer caching tối ưu thế nào?**

Multi-stage: build stage (JDK+Maven) tách run stage (JRE only) → image cuối nhỏ (~200MB vs ~700MB), an toàn (ít attack surface). Layer caching: COPY pom.xml + download deps TRƯỚC COPY src → đổi code không invalidate deps layer → rebuild nhanh. Non-root user, pin versions, .dockerignore.

### 🧠 Quiz Nhanh

1. Mono và Flux khác nhau thế nào?
   - [ ] Mono emit 0-N item, Flux emit 0-1 item
   - [x] Mono emit 0-1 item, Flux emit 0-N item
   - [ ] Cả hai luôn chạy ngay không cần subscribe
   - [ ] Mono dùng cho streaming, Flux cho single result
   💡 Mono<T> như async Optional (0-1), Flux<T> như async Stream (0-N); cả hai lazy — chỉ chạy khi subscribe.

2. Tại sao @Async cần custom ThreadPoolTaskExecutor?
   - [x] Vì default SimpleAsyncTaskExecutor tạo thread mới mỗi task (unbounded) → OOM
   - [ ] Vì default executor chạy đồng bộ
   - [ ] Vì @Async không hoạt động nếu thiếu executor
   - [ ] Vì custom executor luôn nhanh hơn
   💡 Default tạo thread unbounded gây OOM; custom executor bounded (core/max/queue) + named threads + rejection policy cho control và an toàn.

3. Multi-stage Docker build mang lại lợi ích chính nào?
   - [ ] Tăng tốc độ chạy app lúc runtime
   - [ ] Cho phép chạy nhiều container một lúc
   - [x] Tách build stage (JDK) khỏi run stage (JRE) → image cuối nhỏ và ít attack surface
   - [ ] Tự động fix N+1 query
   💡 Build stage có JDK+Maven, run stage chỉ JRE → image nhỏ (~200MB vs ~700MB), an toàn hơn; kết hợp layer caching để rebuild nhanh.

- **🧩 LeetCode:** #155 Min Stack + #225 Implement Stack using Queues — Review design

- **🤖 AI Tools:** Dùng AI quiz reactive + Docker concepts.

- **📚 Tài Nguyên:** Ôn lại notes T6 + Project Reactor + Docker docs.

## 🔥 Ngày 6 · Ôn T7: Security, Testing, RAG + Tích hợp

**04/07 — Thứ 7** · **WEEKEND** · ⏱ 4h (sáng + chiều)

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Parroto Shadowing · 30 phút*
>
> Shadow câu phỏng vấn EN về security + testing + RAG. Vocalmax ôn tổng hợp 30 từ khó nhất T5-T7. Mock interview EN 3 câu.

### 📖 Tóm Tắt Ôn Tập

**Security + JWT**

Authn (bạn là ai) vs Authz (được làm gì). SecurityFilterChain config. JWT (header.payload.signature, không mã hóa, stateless, Bearer token). JwtAuthenticationFilter (OncePerRequestFilter). @PreAuthorize role-based. BCrypt password hash (slow + salt). UserDetailsService.

**Testing**

JUnit 5 (@Test, assertions, @BeforeEach lifecycle, @ParameterizedTest, AAA pattern). Mockito (@Mock/@InjectMocks, when/thenReturn stub, verify interaction, Spy). Spring slices (@WebMvcTest web layer, @DataJpaTest JPA, @SpringBootTest full). Test isolation.

**RAG**

Embeddings (text→vector, semantic). VectorStore + PGVector. Similarity search (top-K, cosine, HNSW index). RAG pipeline (ingest→chunk→embed→retrieve→augment→generate). QuestionAnswerAdvisor. Chunking strategy. Grounding chống hallucination. RAG vs fine-tuning.

**Tích hợp toàn bộ**

1 production API điển hình: JWT auth (filter) → @PreAuthorize authz → @RestController → @Service (@Transactional + @Cacheable Redis) → JpaRepository (N+1 optimized) → Spring AI (RAG grounded). Tested với JUnit/Mockito. Dockerized. Đây là bức tranh tổng thể T4-T7.

### 💻 Code Ôn Tập — Tự Gõ Lại Từ Trí Nhớ

```java
// Active recall: tích hợp Security + Cache + JPA + AI trong 1 flow
@RestController
@RequestMapping("/api/v1/qa")
public class SecuredRagController {
    private final ChatClient chatClient;
    private final StudentService studentService;

    @PostMapping("/ask")
    @PreAuthorize("hasRole('USER')")  // authz
    public QaResponse ask(@RequestBody @Valid QaRequest req) {  // validation
        String answer = chatClient.prompt()
            .user(req.question())
            .call()              // RAG via QuestionAnswerAdvisor
            .content();
        return new QaResponse(req.question(), answer);
    }
}

// Test: verify auth required
@WebMvcTest(SecuredRagController.class)
class SecuredRagControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean ChatClient.Builder builder;

    @Test
    void shouldReturn401WhenNoToken() throws Exception {
        mockMvc.perform(post("/api/v1/qa/ask").contentType(MediaType.APPLICATION_JSON)
                .content("{\"question\":\"hi\"}"))
            .andExpect(status().isUnauthorized());
    }
}
```

### ✍️ Bài Tập Active Recall (4 bài)

1. Gõ lại JWT flow (generate token → filter validate → SecurityContext) từ trí nhớ.
2. Viết 1 test với Mockito (@Mock + when/thenReturn + verify) cho service bất kỳ.
3. Giải thích to ra: RAG pipeline đầy đủ (ingest → retrieve → augment → generate).
4. Vẽ (text/giấy) kiến trúc 1 production API tích hợp Security + Cache + JPA + AI + Test.

### 🎤 Câu Hỏi Phỏng Vấn — Tổng Hợp (8 câu)

**Dễ · Authentication vs Authorization?**

Authentication = xác thực bạn là ai (login, verify token). Authorization = xác định bạn được làm gì (roles, permissions). Authn trước, authz sau.

**Dễ · JWT có mã hóa không?**

KHÔNG — chỉ Base64 encode (decode được). Signature chỉ chống tamper, không giấu nội dung. Không để dữ liệu nhạy cảm trong payload. Chỉ lưu user id, roles, expiration.

**Dễ · @Mock vs @InjectMocks?**

@Mock tạo fake dependency. @InjectMocks tạo instance class-under-test và inject các @Mock vào. Cần @ExtendWith(MockitoExtension.class).

**Trung · RAG giảm hallucination thế nào?**

Retrieve documents thật từ knowledge base, inject vào prompt làm context, yêu cầu LLM trả lời CHỈ từ context đó. Model không phải bịa từ memory. Thêm "nếu không biết, nói không biết". Retrieval quality quyết định answer quality.

**Trung · when/thenReturn vs verify trong Mockito?**

when().thenReturn() = STUB định nghĩa mock trả gì (input). verify() = kiểm tra interaction, method được gọi không/bao nhiêu lần/args gì (behavior/side-effect). Stub cho output, verify cho side-effects (save, sendEmail).

**Trung · Tại sao REST API dùng stateless JWT thay session?**

JWT self-contained, validate bằng signature (no DB lookup), scale ngang dễ (no shared session store). Session: server lưu state, cần sticky session/replication. Trade-off: JWT khó revoke (dùng short expiry + refresh token).

**Khó · Mô tả kiến trúc 1 production Spring Boot API tích hợp đầy đủ.**

Request → JwtAuthenticationFilter (validate token, set SecurityContext) → @PreAuthorize (authz) → @RestController (validation @Valid) → @Service (@Transactional readOnly + @Cacheable Redis) → JpaRepository (N+1 fix bằng @EntityGraph) → optional Spring AI (RAG grounded answer). @RestControllerAdvice xử lý exceptions consistent. Tested: @WebMvcTest (controller) + Mockito unit (service) + @DataJpaTest (repo). Dockerized với docker-compose (app + Redis + Postgres/PGVector).

**Mock EN · "Describe a complete, production-ready Spring Boot feature you could build end to end."**

"Take a secured AI Q&A endpoint. A JWT filter authenticates each request and sets the SecurityContext; @PreAuthorize enforces role-based authorization. The controller validates input with @Valid and delegates to a service annotated @Transactional with readOnly for reads. The service caches hot results in Redis with a TTL, fetches data via repositories where I've eliminated N+1 with @EntityGraph, and calls Spring AI with a RAG advisor so answers are grounded in real documents. A @RestControllerAdvice returns consistent error responses. I test it with @WebMvcTest for the web layer, Mockito for service logic, and @DataJpaTest for queries, then containerize everything with docker-compose. That's correct, secure, performant, tested, and deployable."

### 🧠 Quiz Nhanh

1. Authentication và Authorization khác nhau thế nào?
   - [ ] Authentication xác định được làm gì, Authorization xác thực bạn là ai
   - [x] Authentication xác thực bạn là ai, Authorization xác định được làm gì
   - [ ] Cả hai là cùng một khái niệm
   - [ ] Authorization luôn diễn ra trước Authentication
   💡 Authn (login, verify token) = bạn là ai; Authz (roles, permissions) = được làm gì; authn trước, authz sau.

2. JWT có mã hóa nội dung payload không?
   - [x] Không — chỉ Base64 encode, decode được; signature chỉ chống tamper
   - [ ] Có — payload được mã hóa AES
   - [ ] Có — chỉ server đọc được payload
   - [ ] Không có payload trong JWT
   💡 JWT chỉ Base64 encode (đọc được), signature chống tamper chứ không giấu nội dung — không để dữ liệu nhạy cảm/PII trong payload.

3. Trong Mockito, when().thenReturn() và verify() dùng cho mục đích gì?
   - [ ] Cả hai đều kiểm tra số lần gọi method
   - [ ] Cả hai đều định nghĩa giá trị trả về
   - [x] when().thenReturn() là stub (output), verify() kiểm tra interaction (behavior/side-effect)
   - [ ] when() kiểm tra side-effect, verify() định nghĩa output
   💡 Stub định nghĩa mock trả gì (input); verify kiểm tra method có được gọi không, bao nhiêu lần, args gì (side-effect như save, sendEmail).

- **🧩 LeetCode:** #56 Merge Intervals + #169 Majority Element — Medium/Easy — review

- **🤖 AI Tools:** Dùng AI làm mock interviewer hỏi security/testing/RAG.

- **📚 Tài Nguyên:** Ôn lại notes T7 + tự xây 1 integration demo nhỏ.

## 🎯 Ngày 7 · Full Mock Interview + Đánh giá + Kế hoạch T9-T12

**05/07 — CN** · **REVIEW** · ⏱ 4h (ôn tập + project)

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Full Mock Interview EN · 45 phút*
>
> Mock interview EN hoàn chỉnh — tự phỏng vấn bản thân hoặc nhờ AI làm interviewer. 15 câu mix Java Core + Spring + AI + Security + Testing. Record toàn bộ, nghe lại, note câu ấp úng. STAR method cho 2 behavioral questions.

### 📖 Tóm Tắt Ôn Tập

**Self-assessment T1-T7**

Đánh giá thật: chủ đề nào tự tin (trả lời không nhìn notes)? Chủ đề nào còn yếu (ấp úng, phải tra)? Liệt kê 3 điểm mạnh + 3 điểm yếu cần củng cố. Trung thực = tiến bộ.

**Interview readiness**

Có thể giải thích mỗi chủ đề T1-T7 cho người mới (Feynman)? Trả lời được mock EN trôi chảy? Code được core examples từ trí nhớ? Đây là thước đo sẵn sàng phỏng vấn.

**Kế hoạch T9-T12**

T9: Microservices + Docker Compose + Spring Cloud Gateway + Concurrency. T10: JVM + GC + Design Patterns + Clean Code. T11: LeetCode Top 50 + Demo Project + System Design. T12: Tổng ôn + Nộp đơn + Final Mock. Chuyển sang giai đoạn EN "Ứng dụng" (Mock Interview + STAR + Business English).

**Spaced repetition plan**

Lên lịch ôn lại: chủ đề yếu ôn mỗi 3 ngày, chủ đề mạnh mỗi tuần. Duy trì LeetCode daily. GitHub commit đều. Vocalmax/Parroto giữ streak. Review tuần 8 này lại sau 1 tuần.

### 💻 Code Ôn Tập — Tự Gõ Lại Từ Trí Nhớ

```java
// Final recall: viết 1 feature hoàn chỉnh tích hợp nhiều tuần (không nhìn notes)
@RestController
@RequestMapping("/api/v1/students")
public class StudentController {
    private final StudentService service;
    public StudentController(StudentService service) { this.service = service; }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<StudentDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }
}

@Service
public class StudentService {
    private final StudentRepository repo;
    public StudentService(StudentRepository repo) { this.repo = repo; }

    @Cacheable(value = "students", key = "#id")
    @Transactional(readOnly = true)
    public StudentDto findById(Long id) {
        return repo.findByIdWithCourse(id)   // @EntityGraph, no N+1
            .map(this::toDto)
            .orElseThrow(() -> new StudentNotFoundException(id));
    }

    private StudentDto toDto(Student s) {
        return new StudentDto(s.getName(), s.getEmail(), s.getGpa());
    }
}
// Tích hợp: Security (@PreAuthorize) + Cache (@Cacheable) + Transaction +
// JPA optimized (@EntityGraph) + DTO + exception handling. Tự gõ lại = sẵn sàng.
```

### ✍️ Bài Tập Active Recall (3 bài)

1. Hoàn thành full mock interview EN 15 câu (tự ghi âm), nghe lại, chấm điểm từng câu (trôi chảy/ấp úng).
2. Viết self-assessment: bảng 7 tuần × (tự tin / cần ôn), liệt kê 3 điểm yếu ưu tiên củng cố trong T9-T12.
3. Push tổng hợp lên GitHub: README "Java Backend Learning Journey T1-T8" liệt kê skills + projects, cập nhật profile sẵn sàng nộp đơn.

### 🎤 Câu Hỏi Phỏng Vấn — Tổng Hợp (10 câu)

**Dễ · 4 tính chất OOP?**

Encapsulation, Inheritance, Polymorphism, Abstraction. Nền tảng mọi câu hỏi OOP.

**Dễ · equals/hashCode contract?**

a.equals(b) → a.hashCode()==b.hashCode(). Vi phạm → HashMap/HashSet hỏng. Override cả 2 cùng nhau.

**Dễ · @SpringBootApplication gồm gì?**

@Configuration + @EnableAutoConfiguration + @ComponentScan.

**Trung · synchronized vs volatile vs AtomicInteger?**

volatile (visibility only), synchronized (mutual exclusion, compound ops), AtomicInteger (lock-free CAS, counter). Chọn theo use case.

**Trung · N+1 problem và cách fix?**

N children queries sau 1 parent query. Fix: JOIN FETCH, @EntityGraph, @BatchSize, DTO projection. Tất cả LAZY mặc định.

**Trung · Constructor injection > field injection vì sao?**

Immutable, explicit dependencies, testable, fail-fast. Spring team khuyến nghị.

**Khó · Giải thích HashMap internals đầy đủ.**

hashCode → spread → index = hash & (n-1). Collision → chaining (→ Red-Black tree khi >8 nodes). Load factor 0.75 → resize gấp đôi + rehash. equals so sánh trong bucket. Vì vậy equals/hashCode phải đúng contract.

**Khó · JWT stateless auth — ưu nhược điểm và mitigate?**

Ưu: scale ngang dễ (no session store), self-contained. Nhược: khó revoke (short expiry + refresh token), bị lộ qua XSS (httpOnly/memory không localStorage), payload đọc được (không để PII), secret lộ (rotate keys/RS256), "alg:none" attack (verify algorithm). Defense in depth.

**Mock EN · "Tell me about your backend skills and a project you're proud of."**

"Over the past two months I've built solid Java backend skills: core Java with OOP, generics, concurrency and functional programming; Spring Boot for REST APIs with proper layering, DI, and JPA where I handle performance issues like N+1; and modern AI integration with Spring AI, including streaming chatbots and RAG. I'm proud of a secured AI Q&A API that combines JWT authentication, Redis caching, optimized JPA queries, and RAG with PGVector — all tested with JUnit and Mockito and containerized with Docker. It taught me how the layers fit together into something production-ready."

**Mock EN · "Where do you see gaps in your knowledge and how will you address them?"**

"I've built strong fundamentals through Java core, Spring Boot, and AI integration, but I know I have gaps in distributed systems — I'm about to study microservices, Spring Cloud Gateway, and Docker Compose orchestration. I also want deeper JVM internals like garbage collection, and more design patterns and system design practice. My plan is structured: dedicated weeks for each, daily LeetCode for algorithms, and building a portfolio project that demonstrates the full stack. I learn best by building, so each topic ends with a hands-on project pushed to GitHub."

### 🧠 Quiz Nhanh

1. Runtime polymorphism trong Java hoạt động dựa trên gì?
   - [ ] Loại của reference (reference type)
   - [x] Loại thực của object qua dynamic dispatch (virtual method table)
   - [ ] Thứ tự khai báo method
   - [ ] Compile-time overload resolution
   💡 JVM dùng dynamic dispatch resolve method override dựa trên actual object type (không phải reference type), thông qua virtual method table.

2. Theo bức tranh tích hợp T4-T7, thứ tự xử lý một request production điển hình là gì?
   - [x] JWT filter → @PreAuthorize → @RestController → @Service → JpaRepository
   - [ ] @Service → @RestController → JWT filter → JpaRepository
   - [ ] JpaRepository → @RestController → JWT filter → @Service
   - [ ] @RestController → JpaRepository → @PreAuthorize → @Service
   💡 Request đi qua JwtAuthenticationFilter (authn) → @PreAuthorize (authz) → controller (validation) → service (@Transactional + @Cacheable) → repository (N+1 optimized) → optional Spring AI RAG.

3. RAG giảm hallucination bằng cách nào?
   - [ ] Fine-tune lại model với dữ liệu mới
   - [ ] Tăng temperature để model sáng tạo hơn
   - [x] Retrieve document thật, inject vào prompt làm context để LLM trả lời từ dữ liệu thực
   - [ ] Giảm độ dài câu trả lời
   💡 RAG embed query, retrieve chunk tương tự nhất từ vector store, inject vào prompt; model trả lời từ context thực thay vì bịa, và có thể nói "không biết" khi không tìm thấy.

- **🧩 LeetCode:** Tổng hợp — chọn 3 bài bất kỳ đã làm — Giải lại từ đầu không nhìn solution (test retention)

- **🤖 AI Tools:** Nhờ AI làm full mock interviewer 30 phút.

- **📚 Tài Nguyên:** Cập nhật CV/LinkedIn + chuẩn bị T9-T12.

## 🎯 Tổng Kết Tuần 8 — Nửa Chặng Đường

### 📋 Ngân Hàng Câu Hỏi Tổng Hợp T1-T7

*Đây là bộ câu hỏi cốt lõi nhất 7 tuần — trả lời được hết = sẵn sàng phỏng vấn.*

**Java Core (T1-T3)**

- **"What are the four pillars of OOP and how does polymorphism work at runtime?"**  
  Encapsulation, Inheritance, Polymorphism, Abstraction. Runtime polymorphism uses dynamic dispatch — the JVM resolves which overridden method to call based on the actual object type, not the reference type, via the virtual method table.
- **"Explain the difference between synchronized, volatile, and atomic classes."**  
  volatile guarantees visibility but not atomicity. synchronized provides mutual exclusion for compound operations. Atomic classes use lock-free CAS for simple operations like counters. Choose atomic for counters, synchronized for complex critical sections, volatile for flags.
- **"How do Streams and CompletableFuture differ in handling collections vs async work?"**  
  Streams process collections lazily with a pipeline of intermediate and terminal operations. CompletableFuture handles asynchronous computation with composition via thenApply, thenCompose, and combination via allOf — non-blocking, with exception handling through exceptionally and handle.

**Spring + JPA (T4-T5)**

- **"Walk through the layers of a Spring Boot REST application."**  
  Controller handles HTTP and validation, returning proper status via ResponseEntity. Service holds business logic and transactions. Repository extends JpaRepository for data access. DTOs separate the API contract from entities. Dependencies flow inward via constructor injection; @RestControllerAdvice centralizes error handling.
- **"What is the N+1 problem and how do you fix it?"**  
  Loading N entities then accessing a lazy association per entity triggers N extra queries. Fix with JOIN FETCH, @EntityGraph, @BatchSize, or a DTO projection that selects only needed columns. Keep associations LAZY by default and fetch explicitly.
- **"How does Spring's cache abstraction work with Redis?"**  
  @Cacheable stores method results and returns from cache on hits. @CacheEvict invalidates on writes. @CachePut always updates. This is the cache-aside pattern. Redis provides a distributed cache shared across instances, with a TTL as a safety net against stale data.

**AI + Security + Testing (T6-T7)**

- **"Why stream an LLM response, and how does SSE enable it?"**  
  Streaming shows tokens as they're generated, drastically lowering perceived latency. ChatClient.stream() returns a Flux, and a controller producing text/event-stream serializes each emission as a Server-Sent Event — one-way server-to-client over HTTP with auto-reconnect, simpler than WebSocket.
- **"Explain stateless JWT authentication and its trade-offs."**  
  The server issues a signed token containing user and roles; the client sends it as a Bearer token, validated by signature without a session lookup. It scales horizontally but is hard to revoke, so use short-lived access tokens with refresh tokens, and never store sensitive data since the payload is only encoded.
- **"What is RAG and how does it reduce hallucination?"**  
  Retrieval-Augmented Generation embeds a query, retrieves the most similar document chunks from a vector store, and injects them into the prompt as context so the LLM answers from real data instead of guessing. It grounds responses, enables citations, and lets the model say 'I don't know' when retrieval finds nothing relevant.

### ✅ Checklist Ôn Tập Tuần 8

- [ ] Gõ lại Generic Stack + equals/hashCode từ trí nhớ, không nhìn notes (T1-T2)
- [ ] Giải thích trôi chảy: synchronized/volatile/Atomic, SOLID, CompletableFuture (T3)
- [ ] Viết full CRUD Spring controller + đúng status codes từ trí nhớ (T4)
- [ ] Gõ lại 3 cách fix N+1 + @Cacheable/@CacheEvict (T5)
- [ ] Viết streaming endpoint (Flux+SSE) + multi-stage Dockerfile từ trí nhớ (T6)
- [ ] Gõ lại JWT flow + 1 Mockito test + giải thích RAG pipeline (T7)
- [ ] Hoàn thành full mock interview EN 15 câu, ghi âm + nghe lại
- [ ] Self-assessment: liệt kê 3 điểm mạnh + 3 điểm yếu cần củng cố
- [ ] Tất cả 7 checklist tuần trước (T1-T7) đã review lại, đánh dấu chủ đề yếu
- [ ] Cập nhật CV/LinkedIn + GitHub README "Learning Journey", sẵn sàng T9-T12

> 💡 **Golden Rule Tuần 8:** Ôn tập không phải đọc lại — là GỢI LẠI từ trí nhớ (active recall). Nếu phải nhìn notes mới trả lời được = chưa thuộc. Gõ lại code từ đầu, giải thích to ra như dạy người khác (Feynman). Đã đi được nửa chặng đường — kiến thức nền vững là bệ phóng cho microservices, system design phía trước. Trung thực với điểm yếu = chìa khóa tiến bộ. 7 tuần nền tảng → sẵn sàng bứt phá!
