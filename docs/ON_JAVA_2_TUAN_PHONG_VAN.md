# 🚀 Ôn Java Cấp Tốc 2 Tuần — Phỏng Vấn Junior (2 năm KN)

> Bản tổng hợp cô đọng từ khóa 12 tuần (`weeks/`), cắt bớt phần nâng cao ít hỏi
> và sắp lại theo **trọng số thực tế của phỏng vấn Java junior 2 năm**.
> Mục tiêu: học nhanh, nhớ đúng thứ hay bị hỏi, luyện trả lời trôi chảy.

---

## 🎯 Ưu tiên: học gì / bỏ gì

| Mức độ | Chủ đề | Nguồn gốc |
|--------|--------|-----------|
| 🔴 **PHẢI thuộc** | Java Core: OOP, Collections, Exception, Generics, Stream, Concurrency cơ bản | T1–T3 |
| 🔴 **PHẢI thuộc** | Spring Boot + REST API, IoC/DI, DTO, validation, exception handling | T4 |
| 🔴 **PHẢI thuộc** | JPA/Hibernate: mapping, quan hệ, LAZY/EAGER, **N+1**, `@Transactional` | T5 |
| 🟠 **Nên biết** | JUnit 5 + Mockito, test slice; Spring Security + JWT (khái niệm + flow) | T7 |
| 🟠 **Nên biết** | SOLID, vài Design Pattern hay dùng (Singleton, Factory, Builder, Strategy) | T3, T10 |
| 🟡 **Đọc lướt** | JVM/Memory/GC ở mức khái niệm (heap/stack, GC là gì, memory leak) | T10 |
| 🟡 **Đọc lướt** | SQL cơ bản (JOIN, index, transaction), Git, HTTP status code | nền tảng |
| ⚪ **Bỏ / chỉ 1 câu** | Spring AI, RAG, embeddings, Reactive/Flux, microservices sâu, GC tuning, LeetCode khó, system design lớn | T6, T9, T11 |

**Nguyên tắc:** với 2 năm KN, nhà tuyển dụng đào **Java Core + Spring + JPA + testing** và **kinh nghiệm dự án của bạn**. Đừng sa đà vào JVM tuning hay microservices — chỉ cần trả lời được ở mức khái niệm.

---

## 🗓️ Lịch 14 ngày

### Tuần 1 — Nền tảng (Java Core + Spring)

| Ngày | Chủ đề | Việc cần làm |
|------|--------|--------------|
| **1** | OOP + Interface/Abstract + equals/hashCode | Đọc [§1](#1-java-core), gõ lại 1 immutable class + override equals/hashCode. Thuộc "4 tính chất OOP" trong 30s. |
| **2** | Generics + Exception | Thuộc PECS, checked vs unchecked, try-with-resources. Trả lời miệng 10 câu §1. |
| **3** | Collections (List/Set/Map) + Big-O | Vẽ tay cơ chế HashMap. Thuộc bảng chọn collection + độ phức tạp. |
| **4** | Stream API + Optional + Functional Interface | Viết 5 pipeline (map/filter/collect/groupingBy). Phân biệt `orElse` vs `orElseGet`. |
| **5** | Concurrency cơ bản | Thread/Runnable/Callable, ExecutorService, `volatile` vs `synchronized` vs Atomic, deadlock. |
| **6** | Spring Boot + REST + DI | Đọc [§2](#2-spring-boot--rest). Gõ 1 CRUD controller + `@RestControllerAdvice`. |
| **7** | **Ôn + tự test tuần 1** | Trả lời miệng toàn bộ Q&A [§4](#4-ngân-hàng-câu-hỏi). Ghi lại câu chưa chắc. |

### Tuần 2 — Chiều sâu + Luyện phỏng vấn

| Ngày | Chủ đề | Việc cần làm |
|------|--------|--------------|
| **8** | JPA/Hibernate + **N+1** | Đọc [§3](#3-jpa--hibernate). Nhớ owning vs inverse side, fix N+1 (JOIN FETCH / EntityGraph). |
| **9** | `@Transactional` + JPQL vs Native + DTO projection | Hiểu propagation, self-invocation bẫy, khi nào native query. |
| **10** | Testing (JUnit + Mockito) | `@Mock` vs `@InjectMocks`, stub vs verify, test slice (`@WebMvcTest`/`@DataJpaTest`). Viết 3 unit test. |
| **11** | Spring Security + JWT | Flow login → token → filter. JWT KHÔNG mã hóa. Authn vs authz. |
| **12** | SOLID + Design Patterns + JVM khái niệm | 5 nguyên tắc SOLID nói trong 30s. 4 pattern hay dùng. Heap/stack/GC/memory leak. |
| **13** | SQL + Git + HTTP + chuẩn bị kể dự án | Ôn JOIN/index/transaction. Chuẩn bị **STAR** kể 2 dự án của bạn. |
| **14** | **Mock interview toàn phần** | Tự hỏi-đáp 30 câu ngẫu nhiên + kể dự án. Ghi âm nghe lại. |

> Mỗi ngày ~2–3h là đủ. Nếu ít thời gian: **dồn vào Ngày 1–4, 6, 8, 10** (phần đỏ), lướt phần còn lại.

---

## 1. Java Core

*(T1–T3 — phần bị hỏi nhiều nhất)*

### 1.1 OOP · Interface/Abstract · equals/hashCode · Generics
- **4 tính chất OOP**: Encapsulation (`private` + getter/setter) · Inheritance (`extends`, đơn kế thừa) · Polymorphism (override runtime / overload compile-time) · Abstraction (`abstract`/`interface`).
- **Interface vs Abstract**: interface = "CAN-DO" (implement nhiều, chỉ constant, không constructor); abstract = "IS-A" (extend 1, có state + constructor + concrete method).
- **Functional Interface**: đúng 1 abstract method (SAM) → dùng được lambda; `@FunctionalInterface` enforce lúc compile.
- **Generics / PECS**: **Producer `extends`, Consumer `super`**. Type-safe, khỏi cast.
- **Immutable class**: `final class` + `private final` field + không setter + defensive copy. String/Integer/LocalDate là ví dụ → thread-safe.

**Gotcha:**
- `equals()`/`hashCode()` contract: `a.equals(b)` ⇒ `hashCode` bằng nhau. Override `equals` mà **quên `hashCode`** → HashMap/HashSet chứa trùng, `get()` trả null.
- `==` so **reference**, `equals()` so **nội dung**. `new String("x") == new String("x")` → false.
- **Type erasure**: generic bị xóa lúc runtime → không `new T()`, không `new T[]`, không `instanceof T`.
- **Diamond problem**: cấm đa kế thừa class; interface default method trùng → class **bắt buộc override** (`A.super.method()`).

### 1.2 Exception · Collections
- **Hierarchy**: `Throwable` → `Error` (không catch) / `Exception` → `RuntimeException` (unchecked).
- **Checked** (IOException…): compiler bắt handle, dùng khi **recover được**. **Unchecked** (NPE, IllegalArgument): lỗi lập trình.
- **try-with-resources**: tự `close()` (AutoCloseable), đóng theo thứ tự ngược, xử lý đúng suppressed exception.
- **Chọn collection**: `ArrayList` (đọc theo index, 95% case) · `LinkedList` (Queue/Deque) · `HashSet` (kiểm tra tồn tại) · `TreeSet/TreeMap` (sorted, range query) · `LinkedHashSet` (giữ thứ tự thêm).

**Gotcha:**
- `finally` **luôn chạy** trừ `System.exit()`/JVM crash. `return` trong finally ghi đè return của try (anti-pattern).
- **HashMap internals**: bucket array (mặc định 16) → hash → index → collision chain (linked list); **>8 entry & capacity ≥64 → chuyển Red-Black Tree** O(log n); load factor 0.75 thì rehash ×2.
- **HashMap KHÔNG thread-safe** → dùng `ConcurrentHashMap` (lock theo bucket + CAS).
- **CME (ConcurrentModificationException)**: sửa collection khi đang iterate → dùng `iterator.remove()` hoặc `removeIf()`. Cơ chế fail-fast qua `modCount`.
- `ArrayList.add()` = **O(1) amortized** (resize ×1.5 tốn O(n) nhưng hiếm).
- **Đừng dùng mutable object làm key** — đổi field → hashCode đổi → mất entry.

### 1.3 Stream · Optional · Concurrency
- **Stream**: source → intermediate (**lazy**) → terminal (eager). Single-use, có short-circuit (`findFirst`, `anyMatch`).
- `map` (1→1) vs `flatMap` (1→nhiều rồi flatten). `groupingBy` → `Map<K, List<T>>` (kèm downstream `counting()` → `Map<K, Long>`).
- **Optional** chỉ dùng làm **return type**. `get()` là anti-pattern → dùng `orElseThrow`/`map`/`ifPresent`.
  - `orElse(x)` **luôn** tính `x`; `orElseGet(supplier)` **lazy** → dùng khi default đắt.
- **Concurrency:**
  - `Runnable` (no return) vs `Callable<T>` (return + throws checked). `ExecutorService.submit()` → `Future<T>`.
  - `volatile` = **visibility, KHÔNG atomicity** → `count++` vẫn sai, cần `AtomicInteger`/`synchronized`.
  - `synchronized` (đơn giản, auto-release) vs `ReentrantLock` (`tryLock(timeout)`, fairness, Condition).
  - **Deadlock**: 4 điều kiện (mutual exclusion, hold-and-wait, no preemption, circular wait). Tránh: **lock ordering** nhất quán + `tryLock`.
  - `ThreadLocal` trong thread pool → **luôn `remove()` trong finally** (tránh leak sang request sau).
  - `CompletableFuture`: `thenApply` (map) / `thenCompose` (flatMap) / `allOf`/`anyOf` / `exceptionally`. `join()` throws unchecked, `get()` throws checked.

---

## 2. Spring Boot + REST

*(T4)*

- **Spring Boot**: auto-configuration (theo classpath, `@ConditionalOnClass`), embedded Tomcat, fat JAR (`java -jar`).
- **`@SpringBootApplication`** = `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`. *(nhớ chính xác 3 cái)*
- **IoC/DI**: `ApplicationContext` = IoC container quản lý bean. **Ưu tiên Constructor Injection** (dependency tường minh, `final` immutable, test không cần Spring context) hơn field `@Autowired`.
- **Stereotype**: `@Component` (chung), `@Service` (business), `@Repository` (data + **exception translation** → `DataAccessException`), `@RestController` = `@Controller` + `@ResponseBody`.
- **Bean scope**: `singleton` (mặc định, 1/context — **phải stateless**, KHÔNG thread-safe sẵn), `prototype`, `request`, `session`. Nhiều bean cùng type → `@Primary`/`@Qualifier`.
- **REST mapping**: `@GetMapping`/`@PostMapping`… + `@PathVariable` (id trong path) / `@RequestParam` (filter, sort) / `@RequestBody` (JSON → object). `ResponseEntity` để kiểm soát status + header (POST tạo mới → **201 + Location header**).
- **DTO**: tách API contract khỏi entity → bảo mật, versioning, tránh `LazyInitializationException` khi serialize proxy.
- **Validation**: `@Valid @RequestBody` + `@NotBlank/@Size/@Email…` → fail ném `MethodArgumentNotValidException`.
- **Exception handling toàn cục**: `@RestControllerAdvice` + `@ExceptionHandler` → trả format chuẩn (RFC 7807 `ProblemDetail`).

**Gotcha:**
- Spring **singleton ≠ Singleton pattern** (1/ApplicationContext, không phải 1/JVM) và **không thread-safe** → giữ bean stateless.
- **Circular dependency**: Spring Boot 2.6+ ném lỗi → fix bằng `@Lazy`/redesign.
- `@Transactional`/`@Async`/`@Cacheable` chạy qua **AOP proxy** → **self-invocation** (gọi method nội bộ) KHÔNG hoạt động; method không được `private`/`final`.

---

## 3. JPA / Hibernate

*(T5 — điểm "ăn" hay bị đào sâu)*

- **Entity mapping**: `@Entity`/`@Id`/`@GeneratedValue(IDENTITY|SEQUENCE)`/`@Column`.
- **Fetch mặc định**: `@ManyToOne`/`@OneToOne` = **EAGER**; `@OneToMany`/`@ManyToMany` = **LAZY**. Quy tắc vàng: **để tất cả LAZY**, cần thì fetch chủ động.
- **Owning side vs inverse side**: owning giữ FK + `@JoinColumn` (thường `@ManyToOne`); inverse dùng `mappedBy`. Hibernate chỉ persist theo **owning side**. Bidirectional phải sync 2 phía qua helper method.
- **Cascade** (`PERSIST/MERGE/REMOVE/ALL`) và **`orphanRemoval=true`** (xóa child khi tách khỏi collection — mạnh hơn `REMOVE`).
- **`@Transactional`**: AOP proxy, rollback trên RuntimeException, `readOnly=true` cho GET, propagation mặc định `REQUIRED`.
- **JPQL vs Native**: derived query (`findByEmail`) cho đơn giản; `@Query` JPQL cho join phức tạp; `nativeQuery=true` cho SQL DB-specific/performance.

**⭐ N+1 problem (chắc chắn bị hỏi):**
- **Là gì**: load N entity (1 query) rồi truy cập lazy association từng cái → N query ⇒ tổng **N+1**.
- **Phát hiện**: bật `spring.jpa.show-sql=true`, thấy loạt query giống nhau.
- **Fix**: `JOIN FETCH` (JPQL) · `@EntityGraph` (declarative) · `@BatchSize` (gom `WHERE id IN (...)`) · **DTO projection**.
- **Bẫy**: `JOIN FETCH` collection **không phân trang được** (Cartesian → paginate in-memory); JOIN FETCH 2 `List` cùng lúc → `MultipleBagFetchException` (đổi sang `Set`).

---

## 4. Testing · Security · SOLID (lướt nhanh)

### JUnit 5 + Mockito *(T7)*
- **AAA** (Arrange-Act-Assert), tên test `should_X_when_Y`, mỗi test 1 behavior, isolated + deterministic.
- `@Mock` (fake dependency) + `@InjectMocks` (class cần test) + `@ExtendWith(MockitoExtension.class)`.
- `when().thenReturn()` = **stub** (định nghĩa output); `verify()` = **kiểm tra interaction** (gọi mấy lần, args gì).
- Test slice: `@WebMvcTest` (controller + MockMvc, mock service) · `@DataJpaTest` (repo + H2) · `@SpringBootTest` (full context). `@MockBean` để mock vào Spring context.

### Spring Security + JWT *(T7)*
- **Authentication** = bạn LÀ AI; **Authorization** = bạn ĐƯỢC LÀM GÌ. Authn trước, authz sau.
- **JWT** = `header.payload.signature` (Base64URL). **KHÔNG mã hóa — chỉ encode**, ai cũng decode được → không để dữ liệu nhạy cảm. Signature chỉ chống sửa (tamper).
- **Flow**: login → server trả JWT → client gửi `Authorization: Bearer <token>` → server validate bằng signature (**stateless**, không cần DB).
- `SecurityFilterChain` (Spring Security 6) + `JwtAuthenticationFilter extends OncePerRequestFilter` (chạy đúng 1 lần/request).
- `hasRole("ADMIN")` tự thêm prefix `ROLE_`; `hasAuthority("ROLE_ADMIN")` thì không.
- **BCrypt**: hash 1 chiều + salt tự động (2 user cùng pass vẫn khác hash), cố tình chậm chống brute-force.
- Nhược điểm JWT: khó revoke → short expiry + refresh token.

### SOLID + Patterns *(T3, T10)*
- **SOLID (30s)**: **S** 1 lý do đổi · **O** mở để mở rộng, đóng để sửa · **L** con thay được cha (bẫy: `Square extends Rectangle`) · **I** interface nhỏ tập trung · **D** phụ thuộc abstraction.
- **DIP ≠ DI**: DIP là nguyên tắc (WHY), DI là kỹ thuật inject (HOW). Constructor injection > field injection.
- **Pattern hay dùng**: Singleton (Spring bean), Factory Method, Builder (`Lombok @Builder`), Strategy (thay if-else bằng interface), Observer (event).

### JVM khái niệm *(T10 — chỉ cần mức này)*
- **Heap** (object, chia young/old gen) vs **Stack** (biến local, call frame — mỗi thread 1 stack) vs **Metaspace** (class metadata).
- **GC** tự dọn object không còn tham chiếu. **Memory leak** trong Java = giữ tham chiếu không cần (static collection phình, ThreadLocal quên remove, listener không gỡ).

---

## 5. Ngân Hàng Câu Hỏi (tự trả lời miệng)

> Che phần đáp án, trả lời to thành tiếng. Câu nào lắp bắp → đánh dấu ôn lại.

### Java Core
1. 4 tính chất OOP? Overriding vs overloading?
2. Interface vs abstract class — khi nào dùng cái nào?
3. Override `equals` mà quên `hashCode` thì chuyện gì xảy ra?
4. Vì sao String immutable? Lợi ích gì?
5. Checked vs unchecked exception — khi nào ném loại nào?
6. `finally` có luôn chạy không? Ngoại lệ nào?
7. HashMap hoạt động bên trong thế nào? Xử lý collision? Khi nào rehash?
8. HashMap vs TreeMap vs ConcurrentHashMap?
9. Fail-fast vs fail-safe iterator? CME xảy ra khi nào?
10. `ArrayList` vs `LinkedList` — khi nào chọn LinkedList?
11. Stream lazy evaluation là gì? `map` vs `flatMap`?
12. `orElse` vs `orElseGet`? Optional dùng sai chỗ nào?
13. `volatile` giải quyết gì? Khi nào không đủ?
14. `synchronized` vs `ReentrantLock` vs `AtomicInteger`?
15. Deadlock là gì? 4 điều kiện? Cách tránh?
16. `Runnable` vs `Callable`? `shutdown()` vs `shutdownNow()`?

### Spring / JPA
17. `@SpringBootApplication` gồm những annotation nào?
18. Vì sao ưu tiên constructor injection?
19. `@Component` vs `@Service` vs `@Repository`?
20. `@Controller` vs `@RestController`? `@PathVariable` vs `@RequestParam`?
21. Xử lý validation error toàn cục thế nào?
22. Bean scope singleton có thread-safe không?
23. `@Transactional` hoạt động thế nào? Vì sao self-invocation không work?
24. **N+1 problem là gì và fix ra sao?** ⭐
25. LAZY vs EAGER — mặc định của từng loại quan hệ?
26. Owning side vs inverse side? `mappedBy` để làm gì?
27. `CascadeType.REMOVE` vs `orphanRemoval`?
28. Khi nào dùng native query thay JPQL?

### Testing / Security
29. `@Mock` vs `@InjectMocks`? `when().thenReturn()` vs `verify()`?
30. `@WebMvcTest` vs `@DataJpaTest` vs `@SpringBootTest`?
31. Authentication vs authorization?
32. JWT gồm mấy phần? Có mã hóa không?
33. Vì sao JWT stateless? Nhược điểm và cách khắc phục?
34. Vì sao BCrypt cần salt và cố tình chậm?

### Behavioral (chuẩn bị theo STAR: Situation–Task–Action–Result)
35. Kể một dự án bạn tự hào nhất — vai trò, thử thách, kết quả.
36. Một bug khó bạn từng debug? Cách bạn tìm ra?
37. Khi bất đồng ý kiến kỹ thuật với đồng nghiệp, bạn xử lý sao?
38. Một lần bạn phải học công nghệ mới nhanh?

---

## 📌 Cheat-sheet 60 giây trước khi vào phòng

- `equals` ⇒ luôn override kèm `hashCode` · `==` reference / `equals` nội dung
- Checked = recover được · Unchecked = bug · `finally` luôn chạy trừ `System.exit()`
- HashMap: bucket → collision → tree khi >8 → rehash 0.75 · không thread-safe → ConcurrentHashMap
- Stream lazy, single-use · `map` vs `flatMap` · `groupingBy` → `Map<K,List>`
- `volatile` = visibility (không atomicity) · Atomic = CAS · ThreadLocal → luôn `remove()`
- `@SpringBootApplication` = Configuration + EnableAutoConfiguration + ComponentScan
- Constructor injection > field · Spring singleton phải stateless
- `@Transactional`/`@Async` = proxy → self-invocation KHÔNG work
- **N+1 → JOIN FETCH / @EntityGraph / @BatchSize / DTO projection**
- LAZY mặc định cho *-ToMany, EAGER cho *-ToOne · để tất cả LAZY
- JWT = header.payload.signature, KHÔNG mã hóa · authn trước authz
- SOLID · Liskov = Square/Rectangle · DIP (WHY) ≠ DI (HOW)

---

*Nguồn: khóa 12 tuần trong `weeks/tuan-01.md` → `tuan-12.md`. Chi tiết đầy đủ (bài tập, code mẫu gõ tay, quiz) xem trực tiếp từng tuần trên web app.*
