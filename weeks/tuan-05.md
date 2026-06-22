# 🚀 Tuần 5 · JPA Nâng cao + Spring AI Setup · 08/06–14/06/2025

## 📅 Lịch Học Tuần 5 — Tổng Quan 7 Ngày

| Ngày | Thứ | Chế độ | Thời gian | Chủ đề |
| --- | --- | --- | --- | --- |
| 08/06 | Thứ 2 | LIGHT | 1.5h | N+1 Problem sâu + JOIN FETCH + @EntityGraph |
| 09/06 | Thứ 3 | FULL | 2.5h | Entity Relationships nâng cao: @OneToMany, cascade, orphanRemoval, fetch strategies |
| 10/06 | Thứ 4 | FULL | 2.5h | JPA Performance: @BatchSize, DTO Projection, Specification API, Criteria queries |
| 11/06 | Thứ 5 | FULL | 2.5h | Redis Cache: @Cacheable, @CacheEvict, RedisTemplate, cache strategies |
| 12/06 | Thứ 6 | LIGHT | 1.5h | Spring AI Setup: dependencies, ChatClient, OpenAI/Ollama config |
| 13/06 | Thứ 7 | WEEKEND | 4h | Spring AI deep: PromptTemplate, ChatModel, system/user messages + caching AI responses |
| 14/06 | CN | REVIEW | 4h | Spaced Review T1-T5 + Mini Project: Cached AI-powered Student Advisor API |

## ⚡ Ngày 1 · N+1 Problem + JOIN FETCH + @EntityGraph

**08/06 — Thứ 2** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

### 📖 Lý Thuyết Cốt Lõi

**N+1 là gì (sâu hơn)**

1 query load N parent → N query load children = N+1 round trips tới DB. Mỗi round trip có latency. Với 1000 rows = 1001 queries = thảm họa performance. Phát hiện: bật `spring.jpa.show-sql=true` + `spring.jpa.properties.hibernate.format_sql=true`, hoặc dùng Hibernate statistics.

**JOIN FETCH (JPQL)**

`SELECT s FROM Student s JOIN FETCH s.course` → 1 query với SQL JOIN. Eagerly loads association. Lưu ý: `JOIN FETCH` với collection → duplicate rows (dùng `DISTINCT`). Không phân trang được với collection fetch (Hibernate warning HHH000104 — paginate in memory).

**@EntityGraph**

Declarative fetch trên repository method: `@EntityGraph(attributePaths = {"course", "address"})`. Override fetch strategy chỉ cho query đó mà không cần viết JPQL. `type = FETCH` (chỉ định EAGER cho attributes) vs `LOAD` (EAGER cho attributes + default cho phần còn lại).

**Khi nào dùng cái nào**

`JOIN FETCH`: control chính xác, complex queries. `@EntityGraph`: clean, reusable trên derived queries. `@BatchSize`: khi không thể join (multiple collections). DTO projection: khi chỉ cần vài fields (tốt nhất cho read-only).

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
public interface StudentRepository extends JpaRepository<Student, Long> {

    // 1. JOIN FETCH — explicit, 1 query
    @Query("SELECT DISTINCT s FROM Student s JOIN FETCH s.course WHERE s.gpa > :minGpa")
    List<Student> findWithCourseByGpaGreaterThan(@Param("minGpa") Double minGpa);

    // 2. @EntityGraph — declarative, applies to derived query
    @EntityGraph(attributePaths = {"course", "enrollments"})
    List<Student> findByFaculty(Faculty faculty);

    // 3. @EntityGraph on findAll override
    @Override
    @EntityGraph(attributePaths = {"course"})
    List<Student> findAll();
}

// BAD — triggers N+1:
// List<Student> students = repo.findAll();        // 1 query
// students.forEach(s -> s.getCourse().getName()); // N queries (lazy load)
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Tạo Student-Course relationship, viết code gây ra N+1, bật show-sql để đếm số queries.
2. Fix N+1 bằng `JOIN FETCH` — verify còn 1 query trong log.
3. Fix lại bằng `@EntityGraph` — so sánh số queries với cách 2.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ · N+1 query problem là gì?**

Khi load N entities (1 query) rồi access lazy association của mỗi entity → mỗi access trigger 1 query → tổng N+1 queries. Ví dụ: load 100 students rồi gọi `student.getCourse()` trong loop = 101 queries thay vì 1-2.

**Dễ · JOIN FETCH khác JOIN thường thế nào?**

`JOIN` thường (JPQL): join để filter/where nhưng KHÔNG load association vào persistence context (vẫn lazy). `JOIN FETCH`: join VÀ eagerly initialize association — đưa data vào entity. Chỉ `JOIN FETCH` mới fix N+1.

**Trung · Tại sao JOIN FETCH với collection không phân trang được?**

Khi fetch collection, SQL JOIN tạo Cartesian product (1 parent × M children = M rows). Hibernate không thể apply SQL `LIMIT/OFFSET` đúng vì pagination phải tính trên parent, không phải joined rows. Hibernate fallback: load tất cả vào memory rồi paginate (HHH000104 warning) — nguy hiểm với large datasets. Giải pháp: 2 queries (paginate IDs trước, fetch associations sau) hoặc @BatchSize.

**Trung · @EntityGraph type FETCH vs LOAD khác nhau?**

`FETCH` (default): attributes trong graph = EAGER, attributes KHÔNG trong graph = LAZY (bất kể mapping). `LOAD`: attributes trong graph = EAGER, attributes ngoài graph = theo mapping mặc định của entity. FETCH cho control tuyệt đối, LOAD respect entity defaults.

**Khó · MultipleBagFetchException xảy ra khi nào? Cách fix?**

Khi `JOIN FETCH` 2+ collections kiểu `List` (bag) cùng lúc → Hibernate không thể tạo Cartesian product hợp lệ. Fix: (1) Đổi `List` thành `Set` (no bag semantics). (2) Tách thành nhiều queries — fetch 1 collection mỗi query (Hibernate cache entity nên query 2 chỉ thêm collection). (3) Dùng `@BatchSize` thay vì fetch. (4) `default_batch_fetch_size` global config.

### 🧠 Quiz Nhanh

1. N+1 problem xảy ra do điều gì?
   - [ ] Một query duy nhất load toàn bộ data nên quá nặng
   - [x] 1 query load N parent rồi mỗi parent trigger thêm 1 query load children
   - [ ] Database thiếu index nên mỗi query chạy chậm
   - [ ] Connection pool hết kết nối khi load nhiều rows
   💡 N+1 = 1 query load N parent + N query load children = N+1 round trips tới DB, mỗi round trip có latency.

2. `JOIN FETCH` khác `JOIN` thường (JPQL) ở điểm nào?
   - [ ] `JOIN FETCH` chỉ dùng được với native SQL
   - [ ] `JOIN` thường nhanh hơn vì không tạo Cartesian product
   - [x] `JOIN` thường chỉ filter mà KHÔNG load association vào persistence context, `JOIN FETCH` thì eagerly initialize association
   - [ ] Cả hai đều fix được N+1 như nhau
   💡 `JOIN` thường vẫn để association lazy; chỉ `JOIN FETCH` mới đưa data vào entity và fix N+1.

3. `@EntityGraph` với `type = FETCH` xử lý các attribute KHÔNG nằm trong graph thế nào?
   - [x] Coi như LAZY bất kể mapping mặc định
   - [ ] Coi như EAGER bất kể mapping
   - [ ] Theo đúng mapping mặc định của entity
   - [ ] Báo lỗi vì attribute không khai báo trong graph
   💡 `FETCH`: attributes ngoài graph = LAZY (control tuyệt đối); `LOAD`: attributes ngoài graph theo mapping mặc định của entity.

- **🧩 LeetCode:** #547 Number of Provinces — Medium — graph/DFS

- **🤖 AI Tools:** Dùng Copilot để generate test data cho N+1 demo.

- **📚 Tài Nguyên:** Vlad Mihalcea blog "N+1 query problem".

## 💪 Ngày 2 · Entity Relationships nâng cao

**09/06 — Thứ 3** · **FULL** · ⏱ 30 phút sáng + 2h tối

### 📖 Lý Thuyết Cốt Lõi

**Bidirectional relationships**

`@OneToMany(mappedBy="student")` ở parent (inverse side), `@ManyToOne @JoinColumn` ở child (owning side — holds FK). `mappedBy` chỉ ra ai owning. Phải sync cả 2 side trong helper methods (`addEnrollment`/`removeEnrollment`) để tránh inconsistent state.

**Cascade types**

`CascadeType.PERSIST` (save parent → save children), `MERGE`, `REMOVE` (delete parent → delete children), `ALL` (tất cả). Cẩn thận `REMOVE`/`ALL` — có thể xóa nhầm data. Thường dùng cho composition (parent sở hữu children hoàn toàn).

**orphanRemoval**

`@OneToMany(orphanRemoval=true)`: khi child bị remove khỏi collection của parent → child bị DELETE khỏi DB. Khác `CascadeType.REMOVE` (chỉ trigger khi parent bị xóa). orphanRemoval phù hợp parent-child lifecycle gắn chặt (Order → OrderLine).

**Fetch strategy mặc định**

`@ManyToOne`/`@OneToOne`: EAGER mặc định (thường nên đổi LAZY). `@OneToMany`/`@ManyToMany`: LAZY mặc định (giữ nguyên). Best practice: TẤT CẢ associations để LAZY, fetch explicitly khi cần. `@ManyToOne(fetch = FetchType.LAZY)`.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
@Entity
public class Student {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Inverse side — mappedBy points to field in Enrollment
    @OneToMany(mappedBy = "student",
               cascade = CascadeType.ALL,
               orphanRemoval = true,
               fetch = FetchType.LAZY)
    private List<Enrollment> enrollments = new ArrayList<>();

    // Helper — keep both sides in sync
    public void addEnrollment(Enrollment e) {
        enrollments.add(e);
        e.setStudent(this);
    }
    public void removeEnrollment(Enrollment e) {
        enrollments.remove(e);
        e.setStudent(null); // orphanRemoval → DELETE
    }
}

@Entity
public class Enrollment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Owning side — holds the FK column
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Tạo bidirectional Student ↔ Enrollment với helper methods sync cả 2 side.
2. Test `CascadeType.ALL`: save Student có enrollments → verify enrollments tự được persist.
3. Test `orphanRemoval`: remove 1 enrollment khỏi list → save → verify bị DELETE khỏi DB.
4. Đổi `@ManyToOne` từ EAGER (default) sang LAZY, verify qua SQL log.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Owning side vs inverse side trong bidirectional relationship?**

Owning side: holds foreign key, có `@JoinColumn`, là `@ManyToOne` side (thường). Inverse side: dùng `mappedBy`, không có FK column. Hibernate CHỈ nhìn owning side để persist relationship — update inverse side không có tác dụng nếu owning side không set.

**Dễ · mappedBy dùng để làm gì?**

Chỉ định field nào ở phía bên kia "sở hữu" relationship (owning side). `@OneToMany(mappedBy="student")` nghĩa là Enrollment.student là owning side. Tránh tạo extra join table — nếu thiếu mappedBy ở @OneToMany, Hibernate tạo join table thay vì dùng FK.

**Trung · CascadeType.REMOVE vs orphanRemoval=true khác nhau?**

`REMOVE`: child bị xóa CHỈ khi parent bị xóa (`em.remove(parent)`). `orphanRemoval`: child bị xóa khi nó bị tách khỏi parent's collection (`parent.getChildren().remove(child)`) HOẶC khi parent bị xóa. orphanRemoval mạnh hơn — phù hợp khi child không thể tồn tại độc lập.

**Trung · Tại sao phải sync cả 2 side của bidirectional relationship?**

Vì in-memory object graph và DB state phải consistent. Nếu chỉ set 1 side, persistence context có thể có stale data → bugs khi đọc lại trong cùng transaction. Hibernate persist dựa trên owning side, nhưng inverse side cần đúng để code logic + lazy loading hoạt động. Helper methods (`addX`/`removeX`) là best practice.

**Trung · Tại sao nên tránh CascadeType.ALL + @ManyToMany?**

`@ManyToMany` thường share entities (Student-Course: nhiều students học cùng course). `REMOVE` cascade → xóa 1 student có thể xóa luôn courses → ảnh hưởng students khác. Best practice: @ManyToMany chỉ cascade PERSIST/MERGE, không bao giờ REMOVE. Thậm chí nên dùng explicit join entity (Enrollment) thay @ManyToMany.

**Khó · EAGER fetching gây vấn đề gì trong production?**

(1) N+1 ngầm: EAGER @ManyToOne load mỗi entity kéo theo association. (2) Cartesian product khi nhiều EAGER collections. (3) Không thể override sang LAZY tại query level (LAZY thì override sang EAGER được qua JOIN FETCH). (4) Load thừa data không cần. Rule vàng: TẤT CẢ LAZY, fetch khi cần. EAGER là quyết định global không thể undo per-query.

**Mock EN · "How do you model a many-to-many relationship with extra attributes in JPA?"**

"I avoid `@ManyToMany` when there are join attributes. Instead I create an explicit join entity — for example, `Enrollment` between `Student` and `Course` with extra fields like `enrollmentDate` and `grade`. The join entity has two `@ManyToOne` relationships. This gives full control over the relationship, lets me add columns, query the association directly, and avoid the cascade pitfalls of `@ManyToMany`."

### 🧠 Quiz Nhanh

1. Trong bidirectional relationship, phía nào là owning side?
   - [x] Phía giữ foreign key, có `@JoinColumn` (thường là `@ManyToOne`)
   - [ ] Phía dùng `mappedBy`
   - [ ] Phía `@OneToMany` luôn là owning side
   - [ ] Cả hai phía đều là owning side
   💡 Owning side giữ FK và có `@JoinColumn`; Hibernate CHỈ nhìn owning side để persist relationship.

2. `orphanRemoval = true` khác `CascadeType.REMOVE` thế nào?
   - [ ] Cả hai hoàn toàn giống nhau
   - [ ] `orphanRemoval` chỉ xóa child khi parent bị xóa
   - [x] `orphanRemoval` xóa child khi child bị tách khỏi collection của parent, không chỉ khi parent bị xóa
   - [ ] `CascadeType.REMOVE` xóa child khi tách khỏi collection
   💡 `REMOVE` chỉ trigger khi parent bị xóa; `orphanRemoval` mạnh hơn, xóa cả khi child bị remove khỏi collection.

3. Fetch type mặc định của `@ManyToOne` là gì và best practice là gì?
   - [ ] Mặc định LAZY, best practice giữ nguyên LAZY
   - [x] Mặc định EAGER, best practice nên đổi sang LAZY
   - [ ] Mặc định EAGER, best practice giữ EAGER
   - [ ] Mặc định LAZY, best practice đổi sang EAGER
   💡 `@ManyToOne`/`@OneToOne` mặc định EAGER; rule vàng là để TẤT CẢ associations LAZY và fetch explicitly khi cần.

- **🧩 LeetCode:** #207 Course Schedule — Medium — topological sort

- **🤖 AI Tools:** ChatGPT để review entity design.

- **📚 Tài Nguyên:** Baeldung "JPA Cascade Types" + Vlad Mihalcea "owning side".

## 💪 Ngày 3 · JPA Performance: BatchSize, DTO Projection, Specification

**10/06 — Thứ 4** · **FULL** · ⏱ 30 phút sáng + 2h tối

### 📖 Lý Thuyết Cốt Lõi

**@BatchSize**

`@BatchSize(size=20)` trên collection/entity: thay vì N queries riêng lẻ cho lazy load, Hibernate gom thành batch (IN clause). 100 students với batch 20 → 5 queries thay vì 100. Global: `hibernate.default_batch_fetch_size=20`. Giảm N+1 mà không cần JOIN.

**DTO Projection**

Chỉ select columns cần thiết, không load full entity. Interface-based: `interface StudentView { String getName(); Double getGpa(); }` → Spring auto-implement. Class-based (JPQL constructor): `SELECT new com.app.StudentDto(s.name, s.gpa) FROM Student s`. Nhanh hơn vì ít data + không cần persistence context.

**Specification API**

Build dynamic queries type-safe. `Repository extends JpaSpecificationExecutor<Student>`. `Specification<Student> spec = (root, query, cb) -> cb.equal(root.get("faculty"), faculty)`. Combine: `spec.and(other)`, `spec.or(other)`. Phù hợp filter động (search form với nhiều optional criteria).

**Criteria API vs JPQL vs Native**

JPQL: string-based, dễ đọc, type-unsafe. Criteria/Specification: type-safe, verbose, dynamic. Native SQL: DB-specific features, raw performance. Chọn: JPQL cho static queries, Specification cho dynamic filters, Native cho complex reports/DB features.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// 1. Interface-based projection
public interface StudentSummary {
    String getName();
    Double getGpa();
    String getCourseName(); // nested: course.name via getCourse().getName()
}

public interface StudentRepository extends JpaRepository<Student, Long>,
                                            JpaSpecificationExecutor<Student> {
    List<StudentSummary> findByFaculty(Faculty faculty); // returns projection

    // 2. Class-based DTO projection via JPQL constructor
    @Query("SELECT new com.app.dto.StudentDto(s.name, s.gpa) FROM Student s WHERE s.gpa > :min")
    List<StudentDto> findTopStudents(@Param("min") Double min);
}

// 3. Specification — dynamic query
public class StudentSpecs {
    public static Specification<Student> hasFaculty(Faculty f) {
        return (root, query, cb) -> f == null ? null : cb.equal(root.get("faculty"), f);
    }
    public static Specification<Student> gpaAtLeast(Double min) {
        return (root, query, cb) -> min == null ? null : cb.greaterThanOrEqualTo(root.get("gpa"), min);
    }
}
// Usage: combine dynamically
// Specification<Student> spec = Specification.where(hasFaculty(cs)).and(gpaAtLeast(3.0));
// List<Student> result = repo.findAll(spec);
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Tạo interface-based projection `StudentSummary`, verify SQL chỉ SELECT các columns cần.
2. Viết class-based DTO projection qua JPQL constructor expression.
3. Implement Specification cho search form: filter theo faculty + minGpa + name (tất cả optional).
4. Thêm `@BatchSize(size=10)` vào collection, đo số queries giảm.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · DTO projection nhanh hơn load full entity vì sao?**

(1) SELECT ít columns hơn → ít data truyền qua network. (2) Không cần persistence context tracking (no dirty checking, no snapshot). (3) Read-only nên Hibernate skip overhead quản lý entity state. Phù hợp cho list/report views chỉ đọc.

**Dễ · Interface-based vs class-based projection khác nhau?**

Interface-based: định nghĩa interface với getters, Spring Data tự proxy implement — clean, ít code. Class-based: dùng JPQL `SELECT new com.app.Dto(...)` constructor — explicit, control rõ. Interface tốt cho derived queries, class-based cho @Query phức tạp.

**Trung · Specification API giải quyết vấn đề gì mà derived query không?**

Dynamic queries: search form với 5 optional filters → derived query cần 2^5 = 32 methods. Specification build query runtime dựa trên filters nào có giá trị. Type-safe (metamodel), composable (and/or), reusable. Phù hợp advanced search, admin filters.

**Trung · @BatchSize hoạt động thế nào dưới SQL?**

Thay vì `SELECT * FROM course WHERE id = ?` lặp N lần, Hibernate gom IDs cần load và phát `SELECT * FROM course WHERE id IN (?, ?, ..., ?)` theo nhóm `size`. 100 lazy associations với `@BatchSize(20)` → 5 queries. Giảm round trips mà giữ lazy semantics (không over-fetch như EAGER).

**Trung · Khi nào dùng Native Query thay JPQL?**

(1) DB-specific features: PostgreSQL JSONB, window functions, CTE. (2) Complex queries JPQL không express được. (3) Performance-critical cần optimize SQL thủ công. (4) Bulk operations. Đánh đổi: mất portability, mất type-checking entity. Dùng `@Query(nativeQuery=true)` + `@SqlResultSetMapping` cho mapping kết quả.

**Khó · Projection có gây N+1 khi access nested association không?**

Có thể. Interface projection với nested property (`getCourse().getName()`) — nếu Spring resolve qua entity proxy thì lazy load gây N+1. Closed projection (chỉ expose properties map trực tiếp tới columns) → Spring optimize thành single query với chỉ cột cần. Open projection (dùng `@Value` SpEL) → load full entity → mất lợi ích. Rule: dùng closed projection cho performance.

**Mock EN · "How would you optimize a JPA report endpoint that's slow?"**

"First I'd profile with SQL logging to see actual queries. If it's N+1, I'd use JOIN FETCH, @EntityGraph, or @BatchSize. If we're loading full entities for a read-only list, I'd switch to a closed interface projection or a class-based DTO to fetch only needed columns — this avoids persistence context overhead. For complex aggregations I'd consider a native query. I'd also verify pagination is applied at the DB level, not in memory, and add appropriate indexes on filter and join columns."

### 🧠 Quiz Nhanh

1. `@BatchSize(size=20)` giúp giảm N+1 bằng cách nào dưới SQL?
   - [ ] Tự động thêm JOIN vào mọi query
   - [ ] Cache kết quả query vào memory
   - [x] Gom các id cần load và phát query `WHERE id IN (?, ?, ...)` theo nhóm
   - [ ] Đổi tất cả association sang EAGER
   💡 100 lazy associations với `@BatchSize(20)` → 5 queries IN clause thay vì 100, giảm round trips mà giữ lazy semantics.

2. Tại sao DTO projection nhanh hơn load full entity?
   - [x] Select ít columns hơn và không cần persistence context tracking (no dirty checking)
   - [ ] Vì luôn dùng native SQL nhanh hơn JPQL
   - [ ] Vì tự động cache kết quả vào Redis
   - [ ] Vì bỏ qua database index
   💡 Projection select ít cột, read-only nên Hibernate skip overhead quản lý entity state (dirty checking, snapshot).

3. Specification API giải quyết vấn đề gì mà derived query khó làm?
   - [ ] Tăng tốc độ insert hàng loạt
   - [ ] Tự động tạo index trên các cột filter
   - [x] Build dynamic query type-safe, composable cho search form nhiều filter optional
   - [ ] Thay thế hoàn toàn nhu cầu viết JPQL
   💡 Search form 5 optional filters cần 2^5 = 32 derived methods; Specification build query runtime, type-safe và composable (and/or).

- **🧩 LeetCode:** #973 K Closest Points to Origin — Medium — heap

- **🤖 AI Tools:** Dùng AI generate Specification predicates.

- **📚 Tài Nguyên:** Spring Data JPA docs "Projections" + Baeldung "JPA Criteria Queries".

## 💪 Ngày 4 · Redis Cache

**11/06 — Thứ 5** · **FULL** · ⏱ 30 phút sáng + 2h tối

### 📖 Lý Thuyết Cốt Lõi

**Caching cơ bản + Redis**

Cache: lưu kết quả expensive operation để tái dùng → giảm DB load + latency. Redis: in-memory key-value store, hỗ trợ distributed cache (nhiều app instances share). Spring Boot: `spring-boot-starter-data-redis` + `spring-boot-starter-cache`. Config: `spring.data.redis.host/port`.

**@Cacheable**

`@Cacheable("students")` trên method: lần đầu chạy method + lưu kết quả vào cache key. Lần sau cùng key → trả từ cache, không chạy method. Key mặc định = params. Custom: `@Cacheable(value="students", key="#id")`. `condition`/`unless` để control khi nào cache.

**@CacheEvict + @CachePut**

`@CacheEvict("students", key="#id")`: xóa entry khi update/delete (invalidation). `@CacheEvict(allEntries=true)`: clear toàn bộ cache. `@CachePut`: luôn chạy method VÀ update cache (cho update operations). `@Caching` để combine nhiều cache annotations.

**TTL + cache strategies**

TTL (time-to-live): entry tự expire sau thời gian → tránh stale data. Config qua `RedisCacheConfiguration.entryTtl(Duration.ofMinutes(10))`. Strategies: Cache-Aside (phổ biến, app quản lý), Write-Through, Write-Behind. Cẩn thận: cache invalidation là "one of the two hard things in CS".

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
@Configuration
@EnableCaching
public class RedisCacheConfig {
    @Bean
    public RedisCacheConfiguration cacheConfiguration() {
        return RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .disableCachingNullValues()
            .serializeValuesWith(SerializationPair.fromSerializer(
                new GenericJackson2JsonRedisSerializer()));
    }
}

@Service
public class StudentService {
    private final StudentRepository repo;

    @Cacheable(value = "students", key = "#id")
    public StudentDto findById(Long id) {
        // chỉ chạy khi cache miss
        return repo.findById(id).map(mapper::toDto)
            .orElseThrow(() -> new StudentNotFoundException(id));
    }

    @CachePut(value = "students", key = "#result.id")
    public StudentDto update(Long id, UpdateRequest req) {
        Student s = repo.findById(id).orElseThrow();
        s.update(req);
        return mapper.toDto(repo.save(s)); // update cache với fresh data
    }

    @CacheEvict(value = "students", key = "#id")
    public void delete(Long id) {
        repo.deleteById(id); // remove khỏi cache
    }

    @CacheEvict(value = "students", allEntries = true)
    public void clearCache() { /* clear all */ }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Setup Redis (Docker: `docker run -p 6379:6379 redis`), config Spring connect.
2. Thêm `@Cacheable` vào `findById`, verify lần 2 không hit DB (xem SQL log).
3. Thêm `@CacheEvict` vào `update`/`delete`, verify cache invalidate đúng.
4. Config TTL 30s, verify entry expire sau 30s (cache miss → query lại DB).

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Cache giải quyết vấn đề gì?**

Giảm latency (memory nhanh hơn DB/network nhiều lần) và giảm load lên DB (ít queries hơn). Phù hợp data đọc nhiều, ghi ít, ít thay đổi (reference data, user profiles, computed results). Đánh đổi: stale data + memory cost + complexity quản lý invalidation.

**Dễ · @Cacheable vs @CachePut khác nhau?**

`@Cacheable`: nếu cache có key → trả từ cache, KHÔNG chạy method (skip execution). `@CachePut`: LUÔN chạy method rồi update cache với kết quả. Dùng `@Cacheable` cho read, `@CachePut` cho update (đảm bảo cache có data mới nhất sau khi save).

**Trung · Tại sao local cache (Caffeine) không đủ cho multi-instance app?**

Mỗi app instance có local cache riêng → inconsistent: instance A update DB + evict local cache, instance B vẫn serve stale data từ local cache của nó. Distributed cache (Redis) shared giữa instances → 1 nơi invalidate, tất cả thấy. Hybrid: L1 local (Caffeine) + L2 distributed (Redis) cho cả tốc độ và consistency.

**Trung · Cache-Aside pattern hoạt động thế nào?**

App đọc: check cache → hit thì trả, miss thì query DB + populate cache. App ghi: update DB → invalidate (evict) cache entry. Lần đọc sau sẽ re-populate. App tự quản lý cache (lazy loading). Phổ biến nhất, chính là `@Cacheable` + `@CacheEvict` của Spring.

**Trung · Tại sao cần TTL ngay cả khi đã có @CacheEvict?**

@CacheEvict chỉ invalidate khi update qua app. Nhưng data có thể thay đổi ngoài app (DB migration, another service, manual fix), hoặc evict logic có bug. TTL là safety net — đảm bảo stale data tự biến mất sau X phút. Không có TTL + miss 1 evict = stale vĩnh viễn.

**Khó · Cache stampede (thundering herd) là gì? Cách phòng?**

Khi 1 hot key expire, nhiều requests đồng thời cache miss → tất cả cùng query DB → DB quá tải. Phòng: (1) Lock/mutex — chỉ 1 request rebuild cache, còn lại chờ. (2) Probabilistic early expiration — refresh trước khi expire. (3) Stale-while-revalidate — serve stale + refresh background. Redisson/Caffeine có built-in `refreshAfterWrite`.

**Mock EN · "How do you decide what to cache and handle cache invalidation?"**

"I cache data that's read-heavy, expensive to compute, and changes infrequently — like user profiles, product catalogs, or aggregated reports. I avoid caching highly volatile or user-specific transactional data. For invalidation I use the cache-aside pattern: evict on writes via `@CacheEvict`, plus a TTL as a safety net for changes that bypass the application. For distributed systems I use Redis so all instances share one source of truth, and I monitor cache hit rate to tune TTLs."

### 🧠 Quiz Nhanh

1. `@Cacheable` khác `@CachePut` thế nào?
   - [ ] Cả hai luôn chạy method rồi update cache
   - [x] `@Cacheable` trả từ cache và skip method nếu hit; `@CachePut` LUÔN chạy method rồi update cache
   - [ ] `@CachePut` skip method nếu cache có key
   - [ ] `@Cacheable` dùng cho write, `@CachePut` dùng cho read
   💡 `@Cacheable` cho read (skip nếu hit); `@CachePut` cho update (luôn chạy + update cache với data mới nhất).

2. Tại sao local cache (Caffeine) không đủ cho multi-instance app?
   - [ ] Vì Caffeine không hỗ trợ TTL
   - [ ] Vì local cache luôn chậm hơn DB
   - [x] Mỗi instance có cache riêng → một instance evict không làm các instance khác thấy → stale data
   - [ ] Vì local cache không serialize được object
   💡 Distributed cache (Redis) shared giữa instances → 1 nơi invalidate, tất cả thấy; local cache thì inconsistent.

3. Tại sao cần TTL ngay cả khi đã có `@CacheEvict`?
   - [x] TTL là safety net cho data thay đổi ngoài app hoặc khi evict logic có bug
   - [ ] TTL làm cache nhanh hơn
   - [ ] `@CacheEvict` không hoạt động nếu thiếu TTL
   - [ ] TTL thay thế hoàn toàn nhu cầu evict
   💡 `@CacheEvict` chỉ invalidate khi update qua app; data đổi ngoài app hoặc evict miss thì TTL đảm bảo stale data tự biến mất.

- **🧩 LeetCode:** #146 LRU Cache — Medium — chính là cache!

- **🤖 AI Tools:** Dùng AI giải thích cache hit rate metrics.

- **📚 Tài Nguyên:** Spring "Cache Abstraction" docs + Redis docs.

## ⚡ Ngày 5 · Spring AI Setup

**12/06 — Thứ 6** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

### 📖 Lý Thuyết Cốt Lõi

**Spring AI là gì**

Framework Spring để tích hợp LLMs (OpenAI, Anthropic, Ollama, Azure) với API thống nhất. Tránh vendor lock-in: đổi model provider chỉ cần đổi config + dependency. Abstractions: `ChatClient`, `ChatModel`, `EmbeddingModel`. Lấy cảm hứng từ Spring's template pattern (như JdbcTemplate).

**Dependencies + config**

Thêm `spring-ai-openai-spring-boot-starter` (hoặc `ollama`). Config: `spring.ai.openai.api-key=${OPENAI_API_KEY}`, `spring.ai.openai.chat.options.model=gpt-4o`, `temperature`. Ollama (local, free): `spring.ai.ollama.base-url=http://localhost:11434`, chạy model local không cần API key.

**ChatClient (fluent API)**

High-level fluent API: `chatClient.prompt().user("...").call().content()`. Auto-inject `ChatClient.Builder`. Hỗ trợ system message, user message, options. `.call()` synchronous, `.stream()` reactive (Flux). Khuyên dùng ChatClient hơn ChatModel raw.

**ChatModel (low-level)**

`ChatModel` là abstraction cấp thấp hơn: `chatModel.call(new Prompt("..."))` → `ChatResponse`. ChatClient build trên ChatModel. Dùng ChatModel khi cần control chi tiết Prompt/messages. API key bảo mật qua env var, KHÔNG hardcode.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// build.gradle / pom.xml:
// implementation 'org.springframework.ai:spring-ai-openai-spring-boot-starter'

// application.yml:
// spring:
//   ai:
//     openai:
//       api-key: ${OPENAI_API_KEY}
//       chat:
//         options:
//           model: gpt-4o
//           temperature: 0.7

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final ChatClient chatClient;

    // ChatClient.Builder auto-configured by Spring AI
    public AiController(ChatClient.Builder builder) {
        this.chatClient = builder
            .defaultSystem("You are a helpful academic advisor.")
            .build();
    }

    @GetMapping("/ask")
    public String ask(@RequestParam String question) {
        return chatClient.prompt()
            .user(question)
            .call()
            .content(); // returns the LLM text response
    }
}
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Thêm Spring AI dependency, config OpenAI API key qua env var (HOẶC Ollama local nếu không có key).
2. Tạo `AiController` với endpoint `/ask?question=...` trả về câu trả lời từ LLM.
3. Set `defaultSystem(...)` để định hình persona, test sự khác biệt trong response.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ · Spring AI giải quyết vấn đề gì?**

Cung cấp API thống nhất để tích hợp các LLM khác nhau (OpenAI, Anthropic, Ollama...) vào Spring app. Tránh vendor lock-in — đổi provider chỉ cần đổi dependency + config, code business giữ nguyên. Tích hợp tự nhiên với Spring DI, auto-configuration.

**Dễ · ChatClient vs ChatModel khác nhau?**

`ChatClient`: fluent high-level API (`.prompt().user().call().content()`), tiện cho hầu hết use cases, hỗ trợ default system message. `ChatModel`: low-level (`call(Prompt)` → `ChatResponse`), control chi tiết hơn. ChatClient được build trên ChatModel. Khuyên dùng ChatClient mặc định.

**Trung · Tại sao không hardcode API key trong code?**

(1) Security: code thường push lên Git → key lộ → bị abuse + tốn tiền. (2) Flexibility: mỗi environment (dev/prod) key khác nhau. Dùng env var (`${OPENAI_API_KEY}`), secrets manager (Vault, AWS Secrets), hoặc external config. Spring resolve `${...}` từ environment.

**Trung · temperature trong LLM config ảnh hưởng gì?**

Temperature (0-2) control randomness/creativity. Thấp (0-0.3): deterministic, focused, phù hợp factual/code tasks. Cao (0.7-1.0+): creative, varied, phù hợp brainstorm/writing. Cho academic advisor/factual app → temperature thấp để answer consistent và chính xác.

**Khó · Ollama (local) vs OpenAI (cloud) — trade-offs khi nào dùng?**

Ollama: chạy model local, miễn phí, data không rời máy (privacy), no API limits, nhưng cần GPU mạnh + model nhỏ hơn = chất lượng thấp hơn + latency tùy hardware. OpenAI: chất lượng cao nhất, không cần hardware, nhưng tốn tiền per token, data gửi lên cloud, rate limits. Dev/learning/privacy → Ollama; production quality → OpenAI/managed. Spring AI cho phép đổi dễ dàng.

### 🧠 Quiz Nhanh

1. Lợi ích chính của Spring AI là gì?
   - [ ] Tự động train model trên data của bạn
   - [x] Cung cấp API thống nhất để tích hợp nhiều LLM, tránh vendor lock-in
   - [ ] Loại bỏ hoàn toàn chi phí gọi LLM
   - [ ] Chạy mọi model trực tiếp trên CPU không cần config
   💡 Spring AI cho API thống nhất (ChatClient, ChatModel); đổi provider chỉ cần đổi config + dependency, code business giữ nguyên.

2. ChatClient khác ChatModel thế nào?
   - [x] ChatClient là fluent high-level API được build trên ChatModel; ChatModel là low-level (`call(Prompt)` → `ChatResponse`)
   - [ ] ChatModel là fluent API, ChatClient là low-level
   - [ ] Hai cái hoàn toàn không liên quan
   - [ ] ChatClient chỉ dùng được với Ollama
   💡 ChatClient `.prompt().user().call().content()` tiện cho hầu hết use case; ChatModel cho control chi tiết hơn. Khuyên dùng ChatClient.

3. `temperature` thấp (0–0.3) phù hợp cho loại task nào?
   - [ ] Brainstorm và creative writing
   - [ ] Tạo nội dung đa dạng, ngẫu nhiên
   - [x] Factual/code tasks cần deterministic, focused
   - [ ] Tăng tốc độ inference của model
   💡 Temperature thấp → deterministic, phù hợp factual/code; cao (0.7–1.0+) → creative, phù hợp brainstorm/writing.

- **🧩 LeetCode:** #1768 Merge Strings Alternately — Easy — string

- **🤖 AI Tools:** Chính Spring AI là AI tool hôm nay! Thử ChatClient.

- **📚 Tài Nguyên:** Spring AI reference docs (docs.spring.io/spring-ai).

## 🔥 Ngày 6 · Spring AI deep: PromptTemplate, messages, caching AI

**13/06 — Thứ 7** · **WEEKEND** · ⏱ 4h (sáng + chiều)

### 📖 Lý Thuyết Cốt Lõi

**PromptTemplate**

Template với placeholders: `new PromptTemplate("Tell me about {topic}")`. `.create(Map.of("topic", "JPA"))` → render prompt. Tách prompt khỏi code, reusable, dễ A/B test prompts. Spring AI: load template từ file resource (`.st` files) cho prompt phức tạp.

**System vs User messages**

`SystemMessage`: định hình behavior/persona/rules ("You are an academic advisor, answer concisely"). `UserMessage`: input thực tế từ user. `AssistantMessage`: previous AI responses (cho conversation history/context). Thứ tự messages tạo conversation context.

**ChatClient nâng cao**

`.system(s -> s.text("...").param(...))`, `.user(...)`, `.options(ChatOptions)`. Structured output: `.entity(StudentAdvice.class)` → auto parse JSON response thành Java object. Advisors (interceptors): logging, chat memory, RAG context injection.

**Caching AI responses**

LLM calls đắt (tiền + latency 1-5s). Cache responses cho identical prompts với `@Cacheable` (key = prompt hash). Kết hợp Redis từ ngày 4. Cẩn thận: chỉ cache khi prompt deterministic (temperature thấp) và câu hỏi lặp lại (FAQ-style). Giảm cost đáng kể.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// Block 1 — PromptTemplate + structured output
@Service
public class AdvisorService {
    private final ChatClient chatClient;

    public AdvisorService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    // PromptTemplate với placeholder
    public String adviseForGpa(String name, Double gpa) {
        PromptTemplate template = new PromptTemplate(
            "Student {name} has a GPA of {gpa}. Give one concise study tip.");
        Prompt prompt = template.create(Map.of("name", name, "gpa", gpa));
        return chatClient.prompt(prompt).call().content();
    }

    // Structured output — auto parse to Java record
    public StudentAdvice getStructuredAdvice(String name, Double gpa) {
        return chatClient.prompt()
            .system("You are an academic advisor. Respond with advice and a priority level.")
            .user(u -> u.text("Advise student {n} with GPA {g}").param("n", name).param("g", gpa))
            .call()
            .entity(StudentAdvice.class); // JSON → record
    }

    public record StudentAdvice(String advice, String priority, List<String> resources) {}
}
```

```java
// Block 2 — Caching AI responses
@Service
public class CachedAiService {
    private final ChatClient chatClient;

    // Cache identical prompts — saves $ and latency
    @Cacheable(value = "ai-responses", key = "#question.hashCode()")
    public String askCached(String question) {
        return chatClient.prompt()
            .user(question)
            .options(OpenAiChatOptions.builder()
                .temperature(0.2) // low temp → deterministic → cacheable
                .build())
            .call()
            .content();
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Tạo `PromptTemplate` với 2+ placeholders, render và gọi LLM.
2. Dùng structured output `.entity(Record.class)` để parse response thành Java object.
3. Set system message định hình persona "academic advisor", so sánh với không có system message.
4. Thêm `@Cacheable` (Redis) cho AI endpoint, verify câu hỏi lặp không gọi lại LLM (check latency + log).

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (8 câu)

**Dễ · System message khác User message thế nào?**

System message: định hình behavior, persona, rules của AI cho toàn conversation ("You are a concise academic advisor"). User message: câu hỏi/input thực tế từ người dùng. System đặt context/constraint, User là nội dung cần xử lý. System thường set 1 lần, User thay đổi mỗi request.

**Dễ · PromptTemplate có lợi ích gì so với string concatenation?**

Tách prompt khỏi logic code, dễ đọc/maintain. Placeholder `{var}` an toàn hơn nối chuỗi. Reusable across calls. Dễ version + A/B test prompts. Load từ external file cho prompts phức tạp → đổi prompt không cần recompile.

**Trung · Structured output (.entity()) hoạt động thế nào?**

Spring AI thêm format instructions vào prompt (yêu cầu LLM trả JSON theo schema của class), rồi parse JSON response thành Java object/record qua Jackson. Cho phép dùng LLM output type-safe trong code thay vì parse string thủ công. Hoạt động tốt với record/POJO có structure rõ ràng.

**Trung · Tại sao caching AI responses quan trọng trong production?**

LLM calls đắt: tiền (per token), latency (1-5s). Nhiều câu hỏi lặp lại (FAQ, common queries). Cache identical prompts → giảm cost lớn + response tức thì cho cache hit. Điều kiện: temperature thấp (deterministic) + prompt giống hệt. Dùng Redis với prompt hash làm key.

**Trung · Conversation history (chat memory) được handle thế nào?**

LLM stateless — mỗi call độc lập. Để có context conversation, gửi previous messages (User + Assistant) trong mỗi request. Spring AI: `MessageChatMemoryAdvisor` tự lưu + inject history. Đánh đổi: history dài → nhiều tokens → tốn tiền + có thể vượt context window. Cần truncate/summarize history cũ.

**Khó · Những rủi ro khi tích hợp LLM vào production app?**

(1) Cost runaway — token usage không kiểm soát → bill lớn (cần rate limit + monitor). (2) Latency — LLM chậm, cần async/streaming + timeout. (3) Hallucination — LLM bịa, cần validation/grounding (RAG). (4) Prompt injection — user input độc hại manipulate prompt (sanitize input). (5) Non-determinism — khó test. (6) Vendor downtime — cần fallback/circuit breaker. (7) Data privacy — PII gửi lên cloud.

**Mock EN · "How would you integrate an LLM into a Spring Boot application reliably?"**

"I'd use Spring AI's ChatClient for a vendor-neutral abstraction. I'd secure the API key in environment variables. To control cost and latency I'd cache deterministic responses in Redis keyed by prompt hash, set low temperature for factual tasks, and add timeouts plus a circuit breaker with Resilience4j for provider outages. For long responses I'd use streaming with Flux. I'd validate and sanitize user input to prevent prompt injection, and monitor token usage and latency as first-class metrics."

**Mock EN · "What's the difference between fine-tuning, prompt engineering, and RAG?"**

"Prompt engineering means crafting better instructions to get better outputs — cheapest, fastest to iterate. RAG, retrieval-augmented generation, injects relevant external documents into the prompt at runtime so the model answers from your data — great for grounding and reducing hallucination without retraining. Fine-tuning retrains the model weights on your data — most expensive and slowest, used when you need consistent style or domain behavior that prompting can't achieve. In practice I start with prompt engineering, add RAG for knowledge grounding, and only fine-tune as a last resort."

### 🧠 Quiz Nhanh

1. System message khác User message thế nào?
   - [x] System message định hình behavior/persona/rules cho toàn conversation; User message là input thực tế từ người dùng
   - [ ] System message là câu hỏi của user, User message là persona
   - [ ] Hai loại message giống hệt nhau
   - [ ] System message chỉ dùng được với Ollama
   💡 System đặt context/constraint (thường set 1 lần); User là nội dung cần xử lý (thay đổi mỗi request).

2. Structured output `.entity(StudentAdvice.class)` hoạt động thế nào?
   - [ ] Tự train model để trả đúng kiểu Java
   - [ ] Chỉ hoạt động với native SQL
   - [x] Spring AI thêm format instructions yêu cầu LLM trả JSON theo schema, rồi parse thành Java object qua Jackson
   - [ ] Chuyển đổi entity JPA thành prompt
   💡 Spring AI inject yêu cầu trả JSON theo schema của class rồi parse response → cho phép dùng LLM output type-safe.

3. Điều kiện nào để cache AI responses hiệu quả và an toàn?
   - [ ] Temperature cao để câu trả lời đa dạng
   - [ ] Mỗi prompt đều khác nhau hoàn toàn
   - [x] Prompt deterministic (temperature thấp) và câu hỏi lặp lại (FAQ-style)
   - [ ] Luôn cache mọi response bất kể nội dung
   💡 LLM calls đắt (tiền + latency 1–5s); chỉ cache khi prompt deterministic và lặp lại, dùng Redis với prompt hash làm key.

- **🧩 LeetCode:** #155 Min Stack — Medium — design

- **🤖 AI Tools:** Spring AI structured output + chat memory.

- **📚 Tài Nguyên:** Spring AI docs "Prompts" + "ChatClient API" + "Chat Memory".

## 🎯 Ngày 7 · Spaced Review T1-T5 + Mini Project

**14/06 — CN** · **REVIEW** · ⏱ 4h (ôn tập + project)

### 📖 Lý Thuyết Cốt Lõi

**N+1 + fetch recap**

N+1 = N children queries sau 1 parent query. Fix: JOIN FETCH (explicit), @EntityGraph (declarative), @BatchSize (IN clause), DTO projection (chỉ cột cần). Tất cả associations để LAZY mặc định.

**Relationships recap**

Owning side (FK, @JoinColumn) vs inverse side (mappedBy). Cascade (PERSIST/REMOVE/ALL), orphanRemoval. Sync cả 2 side qua helper methods. Tránh @ManyToMany REMOVE cascade.

**Redis cache recap**

`@Cacheable` (read, skip nếu hit), `@CachePut` (luôn update), `@CacheEvict` (invalidate). TTL safety net. Cache-aside pattern. Distributed cache cho multi-instance. Cache stampede phòng bằng lock/early refresh.

**Spring AI recap**

ChatClient fluent API, system/user messages, PromptTemplate placeholders, structured output `.entity()`, cache AI responses (cost + latency). API key qua env var. Temperature control determinism.

### 💻 Code Mẫu — Mini Project: Cached AI-powered Student Advisor API

```java
@RestController
@RequestMapping("/api/v1/advisor")
public class StudentAdvisorController {

    private final StudentService studentService;
    private final AdvisorService advisorService;

    public StudentAdvisorController(StudentService s, AdvisorService a) {
        this.studentService = s;
        this.advisorService = a;
    }

    // Combines: JPA (optimized fetch) + Redis cache + Spring AI
    @GetMapping("/{studentId}")
    public StudentAdvice advise(@PathVariable Long studentId) {
        // 1. Fetch student with @EntityGraph (no N+1)
        StudentDto student = studentService.findByIdWithCourse(studentId);
        // 2. Get AI advice (cached in Redis by student profile)
        return advisorService.getStructuredAdvice(student.name(), student.gpa());
    }
}

@Service
public class AdvisorService {
    private final ChatClient chatClient;
    public AdvisorService(ChatClient.Builder b) { this.chatClient = b.build(); }

    @Cacheable(value = "advice", key = "#name + '_' + #gpa")
    public StudentAdvice getStructuredAdvice(String name, Double gpa) {
        return chatClient.prompt()
            .system("You are an academic advisor. Give concise, actionable advice.")
            .user(u -> u.text("Advise {n} with GPA {g}").param("n", name).param("g", gpa))
            .options(OpenAiChatOptions.builder().temperature(0.3).build())
            .call()
            .entity(StudentAdvice.class);
    }

    public record StudentAdvice(String advice, String priority, List<String> resources) {}
}
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Complete Student Advisor API: kết hợp JPA optimized fetch (@EntityGraph) + Redis cache + Spring AI structured output. Test full flow.
2. Verify: gọi advise cho cùng student 2 lần → lần 2 không gọi LLM (cache hit), check latency giảm.
3. Push GitHub với README EN: architecture diagram (text), tech stack (Spring Boot + JPA + Redis + Spring AI), setup + API docs.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (10 câu)

**Dễ · 4 cách fix N+1 problem?**

(1) JOIN FETCH trong JPQL — explicit, 1 query. (2) @EntityGraph — declarative trên repository method. (3) @BatchSize — gom lazy loads thành IN clause. (4) DTO projection — chỉ select columns cần, không load full entity.

**Dễ · Owning side trong JPA relationship là gì?**

Phía giữ foreign key, có `@JoinColumn`, thường là `@ManyToOne` side. Hibernate chỉ nhìn owning side để persist relationship. Inverse side dùng `mappedBy` và không quản lý FK. Update chỉ inverse side không persist nếu owning side chưa set.

**Dễ · @Cacheable vs @CacheEvict?**

`@Cacheable`: lưu kết quả method vào cache, lần sau cùng key trả từ cache (skip method). `@CacheEvict`: xóa entry khỏi cache (gọi khi update/delete để invalidate stale data). Cặp đôi tạo cache-aside pattern.

**Trung · Khi nào @EntityGraph tốt hơn JOIN FETCH?**

@EntityGraph: declarative, reusable trên derived queries (không cần viết JPQL), clean. Dùng khi muốn override fetch cho query cụ thể mà không viết custom query. JOIN FETCH: khi cần control chính xác query, có WHERE/filtering phức tạp, hoặc fetch nhiều levels. EntityGraph dễ đọc hơn cho simple eager loading.

**Trung · Tại sao cache cần TTL ngay cả khi có @CacheEvict?**

@CacheEvict chỉ invalidate khi data thay đổi QUA app. Nếu data đổi ngoài app (another service, manual DB update) hoặc evict logic bug → stale vĩnh viễn. TTL là safety net — stale data tự expire sau X phút bất kể. Defense in depth cho cache consistency.

**Trung · DTO projection nhanh hơn full entity vì sao?**

Select ít columns (ít data network), không cần persistence context (no dirty checking/snapshot), read-only nên Hibernate skip overhead state management. Closed projection (chỉ map trực tiếp columns) tránh được cả N+1. Lý tưởng cho list/report views.

**Khó · MultipleBagFetchException — nguyên nhân và fix?**

Xảy ra khi JOIN FETCH 2+ `List` collections cùng query → Cartesian product không hợp lệ (Hibernate không phân biệt được rows). Fix: (1) Đổi `List` → `Set`. (2) Tách thành nhiều queries (Hibernate cache entity, query 2 chỉ thêm collection). (3) Dùng @BatchSize thay fetch. (4) hibernate.default_batch_fetch_size global.

**Khó · Cache stampede là gì? Cách phòng trong distributed system?**

Hot key expire → nhiều concurrent requests cùng miss → tất cả query DB đồng thời → DB overload. Phòng: (1) Distributed lock (Redis SETNX/Redisson) — 1 request rebuild, còn lại chờ. (2) Probabilistic early expiration — refresh trước TTL hết. (3) Stale-while-revalidate — serve stale + async refresh. (4) Caffeine `refreshAfterWrite`.

**Mock EN · "Walk me through your Student Advisor API architecture."**

"It combines three layers I learned this week. The data layer uses JPA with @EntityGraph to fetch students and their courses in a single query, avoiding N+1. The caching layer uses Redis — AI advice is cached by a key derived from the student's name and GPA, so repeated requests skip the expensive LLM call. The AI layer uses Spring AI's ChatClient with a system message defining the advisor persona, low temperature for consistency, and structured output that parses the response into a typed record. This gives me a fast, cost-efficient, type-safe endpoint."

**Mock EN · "How do you balance performance and data freshness when caching?"**

"It's a trade-off driven by the data's volatility and the cost of staleness. For reference data that rarely changes, I use longer TTLs and aggressive caching. For data that changes through my application, I combine event-driven eviction via @CacheEvict on writes with a moderate TTL as a safety net. For data that must be real-time, I don't cache at all. I always monitor cache hit rate and adjust TTLs based on actual access patterns rather than guessing upfront."

### 🧠 Quiz Nhanh

1. Đâu KHÔNG phải là một cách fix N+1 problem?
   - [ ] JOIN FETCH trong JPQL
   - [ ] @EntityGraph trên repository method
   - [x] Tăng kích thước connection pool
   - [ ] @BatchSize gom lazy loads thành IN clause
   💡 4 cách fix N+1: JOIN FETCH, @EntityGraph, @BatchSize, DTO projection; connection pool không liên quan tới số round trips.

2. Trong Mini Project Student Advisor API, AI advice được cache bằng cách nào?
   - [ ] Cache trong local memory của mỗi instance
   - [x] Cache trong Redis với key derived từ name + gpa của student
   - [ ] Không cache để luôn có advice mới
   - [ ] Cache trong database table riêng
   💡 `@Cacheable(value = "advice", key = "#name + '_' + #gpa")` → request lặp cho cùng profile skip LLM call đắt đỏ.

3. Cache stampede được phòng chống thế nào trong distributed system?
   - [ ] Tăng TTL lên vô hạn
   - [ ] Tắt cache hoàn toàn
   - [x] Distributed lock (1 request rebuild), probabilistic early expiration, hoặc stale-while-revalidate
   - [ ] Dùng EAGER fetch cho mọi entity
   💡 Hot key expire → nhiều request cùng miss → DB overload; phòng bằng lock, early refresh, hoặc serve stale + async refresh.

- **🧩 LeetCode:** #347 Top K Frequent Elements — Medium — review

- **🤖 AI Tools:** Tổng hợp Spring AI + Redis trong 1 project.

- **📚 Tài Nguyên:** Ôn lại tất cả docs tuần 5 + Vlad Mihalcea performance blog.

## 🎯 Tổng Kết Tuần 5

### 📋 Ngân Hàng Câu Hỏi Phỏng Vấn

*Ôn lại cuối tuần — trả lời to ra, ghi âm, nghe lại.*

**JPA Performance**

- **"What is the N+1 query problem?"**  
  Loading N entities triggers N additional queries when accessing a lazy association in a loop, totaling N+1 queries. Fix with JOIN FETCH, @EntityGraph, @BatchSize, or DTO projection.
- **"JOIN FETCH vs @EntityGraph?"**  
  JOIN FETCH is explicit JPQL giving precise control for complex queries. @EntityGraph is declarative on repository methods, reusable on derived queries without writing JPQL. Both solve N+1 by eager-loading associations.
- **"Why use DTO projection?"**  
  Selects only needed columns, skips persistence context overhead (no dirty checking), read-only and faster. Closed interface projections avoid N+1 entirely. Ideal for list and report views.

**Redis Caching**

- **"Explain the cache-aside pattern."**  
  On read, check cache first — return on hit, query DB and populate on miss. On write, update DB and evict the cache entry. The application manages the cache lazily. This is exactly Spring's @Cacheable + @CacheEvict.
- **"Why does a multi-instance app need distributed cache?"**  
  Each instance has its own local cache, so one instance evicting won't update others, causing stale reads. Redis is shared across all instances — one source of truth. Hybrid L1 (local) + L2 (Redis) gives speed plus consistency.
- **"What is cache stampede and how to prevent it?"**  
  When a hot key expires, many concurrent requests miss simultaneously and overload the DB. Prevent with a distributed lock so only one request rebuilds, probabilistic early expiration, or stale-while-revalidate.

**Spring AI**

- **"ChatClient vs ChatModel?"**  
  ChatClient is a high-level fluent API (.prompt().user().call().content()) for most use cases with default system messages. ChatModel is lower-level (call(Prompt) returns ChatResponse) for fine control. ChatClient is built on ChatModel and is recommended.
- **"Why cache LLM responses?"**  
  LLM calls are expensive in money (per token) and latency (1-5s). Caching identical deterministic prompts (low temperature) in Redis keyed by prompt hash drastically cuts cost and gives instant responses for repeated questions.
- **"Prompt engineering vs RAG vs fine-tuning?"**  
  Prompt engineering crafts better instructions — cheapest. RAG injects relevant external documents at runtime to ground answers and reduce hallucination without retraining. Fine-tuning retrains model weights — most expensive. Start with prompting, add RAG, fine-tune last.

### ✅ Checklist Cuối Tuần

- [ ] Tái hiện được N+1 problem và fix bằng cả 3 cách: JOIN FETCH, @EntityGraph, @BatchSize
- [ ] Hiểu owning vs inverse side, viết bidirectional relationship với helper sync methods
- [ ] Cascade + orphanRemoval: biết khi nào dùng, tránh @ManyToMany REMOVE
- [ ] DTO projection (interface + class-based) hoạt động, verify SQL chỉ select cột cần
- [ ] Specification API: build dynamic search query với nhiều optional filters
- [ ] Redis setup + @Cacheable/@CacheEvict/@CachePut hoạt động, verify cache hit/miss
- [ ] Hiểu TTL, cache-aside, cache stampede và cách phòng
- [ ] Spring AI: ChatClient gọi LLM, system message, PromptTemplate, structured output
- [ ] Cache AI responses bằng Redis — verify giảm cost + latency cho prompt lặp
- [ ] Mini project Student Advisor API (JPA + Redis + Spring AI) push GitHub, README EN

> 💡 **Golden Rule Tuần 5:** JPA mạnh nhưng N+1 giết performance — luôn nghĩ "query này tạo bao nhiêu round trips?". Cache tăng tốc nhưng invalidation là con dao hai lưỡi — TTL là người bạn tốt. Spring AI mở ra cánh cửa LLM, nhưng token tốn tiền và LLM có thể bịa — cache, validate, và đặt temperature đúng. Performance + cost awareness = dấu hiệu của senior engineer.
