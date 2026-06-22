# 🌱 Tuần 4 · Spring Boot + REST API · 01/06–07/06/2025

## 📋 Ngày 1 · Spring Boot + REST API — Overview

**Tuần 4 · 01/06–07/06/2025** · **OVERVIEW** · 18h tổng

| Ngày | Thứ | Chế độ | Thời gian | Chủ đề |
| --- | --- | --- | --- | --- |
| 01/06 | Thứ 2 | LIGHT | 1.5h | Spring Initializr + project structure + @SpringBootApplication |
| 02/06 | Thứ 3 | FULL | 2.5h | @RestController, @GetMapping/@PostMapping/@PutMapping/@DeleteMapping, ResponseEntity |
| 03/06 | Thứ 4 | FULL | 2.5h | Dependency Injection: @Component/@Service/@Repository/@Autowired/@Bean, IoC container |
| 04/06 | Thứ 5 | FULL | 2.5h | Spring Data JPA: @Entity, @Id, JpaRepository, CRUD, @Query, Pagination |
| 05/06 | Thứ 6 | LIGHT | 1.5h | DTO pattern + @Valid validation + @ControllerAdvice exception handling |
| 06/06 | Thứ 7 | WEEKEND | 4h | Spring Profiles + Actuator + @Transactional + @Scheduled + @Async |
| 07/06 | CN | REVIEW | 4h | Spaced Review T1-T4 + Mini Project: Student Management REST API full CRUD |

## ⚡ Ngày 2 · Spring Initializr + project structure + @SpringBootApplication

**01/06 · Thứ 2** · **LIGHT** · 1.5h

**Spring Boot là gì?**

Framework xây dựng Java apps nhanh với convention-over-configuration. Auto-configuration giảm boilerplate. Embedded Tomcat — không cần deploy WAR. `spring.io/initializr` chọn dependencies.

**Project structure**

`src/main/java`: Java code. `src/main/resources`: `application.properties`/`.yml`. `src/test`: tests. Package: `com.example.demo` → Controller / Service / Repository / Entity / DTO layers.

**@SpringBootApplication**

Meta-annotation = `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`. Entry point: `SpringApplication.run(App.class, args)`. Auto-scans components in same package and sub-packages.

**application.properties**

`server.port=8080`, `spring.datasource.url=...`, `spring.jpa.hibernate.ddl-auto=update`. Profile-specific: `application-dev.properties`, `application-prod.properties`.

```
// Main application class
@SpringBootApplication
public class StudentApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(StudentApiApplication.class, args);
    }
}

// application.properties
// server.port=8080
// spring.datasource.url=jdbc:h2:mem:testdb
// spring.datasource.driver-class-name=org.h2.Driver
// spring.jpa.hibernate.ddl-auto=create-drop
// spring.h2.console.enabled=true
```

- Tạo project Spring Boot mới từ start.spring.io: chọn Spring Web + Spring Data JPA + H2. Chạy `mvn spring-boot:run`, verify cổng 8080.
- Thêm `server.port=9090` vào properties, restart và verify.
- Tạo class `HelloController` trả về "Hello Spring Boot!" tại `/hello`.

**Dễ · `@SpringBootApplication` bao gồm những annotation nào?**

`@Configuration` (đây là config class, @Bean defs), `@EnableAutoConfiguration` (auto-configure based on classpath), `@ComponentScan` (scan @Component/@Service/@Repository in current + sub-packages). Tách ra khi cần fine-grain control.

**Dễ · Auto-configuration trong Spring Boot hoạt động thế nào?**

Dựa vào classpath. Nếu có `spring-data-jpa` → auto-configure DataSource, EntityManagerFactory. Nếu có `spring-web` → auto-configure DispatcherServlet. Điều kiện qua `@ConditionalOnClass`, `@ConditionalOnMissingBean`. Override bằng properties hoặc custom @Bean.

**Trung · Tại sao Spring Boot dùng Embedded Tomcat thay vì deploy WAR?**

Development: `java -jar app.jar` thay vì setup server. Microservices: mỗi service tự-contained. CI/CD: Docker image đơn giản hơn. Có thể đổi sang Jetty/Undertow bằng cách exclude `spring-boot-starter-tomcat` + add `spring-boot-starter-jetty`.

**Trung · `application.properties` vs `application.yml` — khi nào dùng cái nào?**

Properties: đơn giản, quen thuộc. YAML: hierarchical config rõ hơn, tránh lặp prefix. YAML: `spring.datasource.url` → `spring: datasource: url:`. Khi có nhiều config lồng nhau → YAML dễ đọc. Tránh dùng cả hai trong cùng project.

**Khó · Spring Boot fat JAR (uber JAR) là gì? Cấu trúc bên trong?**

Fat JAR chứa tất cả dependencies (nested JARs trong `BOOT-INF/lib/`). Custom classloader `JarLauncher` load nested JARs. `BOOT-INF/classes/` chứa app code. `META-INF/MANIFEST.MF` chỉ định `Main-Class: JarLauncher`, `Start-Class: com.example.App`. Khác executable WAR (thêm `webapp/WEB-INF/`).

### 🧠 Quiz Nhanh

1. `@SpringBootApplication` là meta-annotation tổng hợp từ những annotation nào?
   - [ ] `@Configuration` + `@EnableScheduling` + `@RestController`
   - [x] `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`
   - [ ] `@Service` + `@Repository` + `@Component`
   - [ ] `@Bean` + `@Autowired` + `@Qualifier`
   💡 `@SpringBootApplication` gồm `@Configuration` (định nghĩa @Bean), `@EnableAutoConfiguration` (auto-configure theo classpath) và `@ComponentScan` (quét component trong package hiện tại + sub-packages).

2. Auto-configuration của Spring Boot quyết định cấu hình dựa trên điều gì?
   - [x] Dựa vào classpath (ví dụ có `spring-data-jpa` thì auto-configure DataSource)
   - [ ] Dựa vào số lượng CPU core của máy
   - [ ] Dựa vào tên class chính của ứng dụng
   - [ ] Dựa vào dung lượng RAM còn trống
   💡 Auto-configuration dựa vào classpath: có `spring-web` thì auto-configure DispatcherServlet, có `spring-data-jpa` thì auto-configure DataSource/EntityManagerFactory, điều kiện qua `@ConditionalOnClass`/`@ConditionalOnMissingBean`.

3. Trong fat JAR (uber JAR) của Spring Boot, các dependency dạng nested JAR nằm ở đâu?
   - [ ] `META-INF/classes/`
   - [ ] `WEB-INF/lib/`
   - [x] `BOOT-INF/lib/`
   - [ ] `src/main/resources/`
   💡 Fat JAR chứa nested JAR trong `BOOT-INF/lib/`, app code trong `BOOT-INF/classes/`, và `JarLauncher` (custom classloader) chịu trách nhiệm load các nested JAR này.

LeetCode

#349 Intersection of Two Arrays

Easy — warm-up

AI Tool

Spring Initializr tự động qua VS Code extension

Resource

spring.io/guides/gs/spring-boot

## 💪 Ngày 3 · @RestController, HTTP Mappings, ResponseEntity

**02/06 · Thứ 3** · **FULL** · 2.5h

**@RestController**

`@Controller` + `@ResponseBody`. Mọi method return value được serialized to JSON/XML. `@Controller` dùng khi trả về View (Thymeleaf). `@RequestMapping("/api/v1")` cho base path.

**HTTP mapping annotations**

`@GetMapping` (read), `@PostMapping` (create), `@PutMapping` (full update), `@PatchMapping` (partial update), `@DeleteMapping` (delete). Params: `@PathVariable`, `@RequestParam`, `@RequestBody`.

**ResponseEntity<T>**

Kiểm soát HTTP status + headers + body. `ResponseEntity.ok(body)` = 200. `ResponseEntity.created(uri).body(obj)` = 201. `ResponseEntity.noContent().build()` = 204. `ResponseEntity.notFound().build()` = 404.

**Request handling**

`@PathVariable Long id`: `/students/{id}`. `@RequestParam(required=false) String name`: `/students?name=Long`. `@RequestBody StudentDto dto`: JSON body → object (via Jackson). `@Valid` kết hợp với `@RequestBody`.

```
@RestController
@RequestMapping("/api/v1/students")
public class StudentController {

    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service; // Constructor injection
    }

    @GetMapping
    public ResponseEntity<List<StudentDto>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentDto> getById(@PathVariable Long id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<StudentDto> create(@Valid @RequestBody StudentDto dto) {
        StudentDto created = service.create(dto);
        URI location = URI.create("/api/v1/students/" + created.getId());
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentDto> update(
            @PathVariable Long id,
            @Valid @RequestBody StudentDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- Tạo `ProductController` với GET all, GET by id, POST, DELETE.
- Add `@RequestParam String category` filter to GET all.
- Trả về `ResponseEntity.created()` với Location header khi POST.
- Test tất cả endpoints bằng Postman hoặc HTTPie.

**Dễ · `@Controller` vs `@RestController` khác nhau thế nào?**

`@Controller`: return String = view name (Thymeleaf template). `@RestController` = `@Controller` + `@ResponseBody`: return value serialized to JSON/XML automatically. Dùng `@RestController` cho REST APIs, `@Controller` cho MVC with templates.

**Dễ · `@PathVariable` vs `@RequestParam` — khi nào dùng cái nào?**

`@PathVariable`: resource identifier trong URL path (`/students/42`). `@RequestParam`: optional filter/sort trong query string (`/students?sort=name&page=1`). REST convention: ID trong path, filters trong query params.

**Trung · HTTP status codes quan trọng trong REST API — 200, 201, 204, 400, 401, 403, 404, 409, 500.**

200 OK (GET/PUT success), 201 Created (POST with Location header), 204 No Content (DELETE), 400 Bad Request (validation fail), 401 Unauthorized (no auth), 403 Forbidden (no permission), 404 Not Found, 409 Conflict (duplicate), 500 Internal Server Error.

**Trung · Tại sao nên dùng Constructor Injection thay vì `@Autowired` field injection?**

Constructor: dependencies visible (explicit contract), immutable (final fields), testable (`new MyClass(mock)`), no reflection needed. Field injection: hidden dependencies, requires Spring context for testing, allows mutable state. Spring team recommends constructor injection. IntelliJ warns about field injection.

**Trung · `@RequestBody` deserialization hoạt động thế nào? Jackson config ở đâu?**

Jackson ObjectMapper convert JSON→Java. Spring Boot auto-configures Jackson. Customize via `@JsonProperty`, `@JsonIgnore`, `@JsonFormat`. Global config: `JacksonConfig` bean với `ObjectMapper` setup (`FAIL_ON_UNKNOWN_PROPERTIES=false`, date format, snake_case). `spring.jackson.*` properties.

**Khó · Thiết kế REST API versioning strategies — trade-offs?**

(1) URI: `/api/v1/students` — visible, cacheable, easy to route. (2) Header: `Accept: application/vnd.app.v1+json` — clean URI, hard to test in browser. (3) Query param: `/students?version=1` — easy, not REST-ful. Production: URI versioning phổ biến nhất (AWS, Twitter). Chú ý: không version minor changes, chỉ version breaking changes.

**Mock EN · "Walk me through your REST API design for a student management system."**

"I'd design it RESTfully: GET /students (list with pagination), POST /students (create, returns 201 + Location), GET /students/{id} (single resource), PUT /students/{id} (full update), PATCH /students/{id} (partial update), DELETE /students/{id} (soft delete, returns 204). I'd version the API at /api/v1/. DTOs separate API contract from entity. @ControllerAdvice for global error handling returning RFC 7807 Problem Details format."

### 🧠 Quiz Nhanh

1. `@RestController` tương đương với sự kết hợp của những annotation nào?
   - [x] `@Controller` + `@ResponseBody`
   - [ ] `@Controller` + `@RequestMapping`
   - [ ] `@Component` + `@Autowired`
   - [ ] `@Service` + `@ResponseBody`
   💡 `@RestController` = `@Controller` + `@ResponseBody`, nên mọi giá trị method trả về được tự động serialize sang JSON/XML; `@Controller` thuần dùng khi trả về View (Thymeleaf).

2. Khi tạo resource thành công bằng POST, status code và cách dựng `ResponseEntity` chuẩn là gì?
   - [ ] 200 OK với `ResponseEntity.ok(obj)`
   - [ ] 204 No Content với `ResponseEntity.noContent().build()`
   - [x] 201 Created với `ResponseEntity.created(location).body(obj)`
   - [ ] 404 Not Found với `ResponseEntity.notFound().build()`
   💡 POST tạo mới trả về 201 Created kèm Location header: `ResponseEntity.created(uri).body(created)`. 204 dùng cho DELETE, 200 cho GET/PUT.

3. Theo Spring team, vì sao nên ưu tiên Constructor Injection thay vì `@Autowired` field injection?
   - [ ] Vì field injection không hoạt động với `@Service`
   - [ ] Vì constructor injection chạy nhanh hơn lúc runtime
   - [x] Vì dependency tường minh, immutable (final), và dễ test mà không cần Spring context
   - [ ] Vì field injection yêu cầu nhiều bộ nhớ hơn
   💡 Constructor injection làm dependency hiển thị rõ (explicit contract), cho phép field `final` (immutable), và test được bằng `new MyClass(mock)` không cần reflection hay Spring context.

LeetCode

#415 Add Strings

Easy — warm-up

AI Tool

Postman/Insomnia API testing

Resource

restfulapi.net REST principles

## 💪 Ngày 4 · Dependency Injection: @Component/@Service/@Repository/@Autowired/@Bean, IoC container

**03/06 · Thứ 4** · **FULL** · 2.5h

**IoC Container**

Spring container quản lý object lifecycle. Bạn khai báo dependencies, Spring tạo và inject. `ApplicationContext` là IoC container. `BeanFactory` là interface cơ bản.

**Stereotype annotations**

`@Component` (generic). `@Service` (business logic). `@Repository` (data access, thêm exception translation). `@Controller`/`@RestController` (presentation). Tất cả đều trigger component scan.

**@Bean và @Configuration**

`@Configuration` class = factory. `@Bean` method = tạo bean thủ công (third-party libraries, complex setup). Bean name = method name by default. `@Primary` và `@Qualifier` resolve ambiguity khi có nhiều beans cùng type.

**Bean scopes**

`@Scope("singleton")` default: 1 instance per container. `@Scope("prototype")`: new instance per injection. `@RequestScope`: 1 per HTTP request. `@SessionScope`: 1 per HTTP session. Vấn đề: singleton inject prototype → luôn dùng cùng prototype instance.

```
// Service layer
@Service
public class StudentService {
    private final StudentRepository repository;
    private final EmailService emailService;

    // Constructor injection — recommended
    public StudentService(StudentRepository repository, EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    public StudentDto create(StudentDto dto) {
        Student student = mapper.toEntity(dto);
        Student saved = repository.save(student);
        emailService.sendWelcome(saved.getEmail()); // injected dependency
        return mapper.toDto(saved);
    }
}

// Custom Bean configuration
@Configuration
public class AppConfig {
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
    }

    @Bean
    @Primary
    public EmailService gmailService() { return new GmailService(); }

    @Bean
    @Qualifier("sendgrid")
    public EmailService sendGridService() { return new SendGridService(); }
}
```

- Tạo `ProductService` với `@Service`, inject `ProductRepository` qua constructor.
- Viết `@Configuration` class tạo `ModelMapper` bean.
- Tạo 2 implementations của `NotificationService`, dùng `@Primary` để chọn default.
- Demo circular dependency: tạo 2 beans depend on nhau → Spring error. Fix bằng `@Lazy`.

**Dễ · IoC (Inversion of Control) là gì?**

Traditional: code tạo dependencies (`new Service()`). IoC: container tạo và inject dependencies — control inverted. Benefit: loose coupling, testability (inject mocks), flexibility (swap implementations). DI là implementation technique của IoC principle.

**Dễ · `@Autowired` có thể đặt ở đâu? Spring ưu tiên loại nào?**

Constructor (recommended), setter, field. Spring recommends constructor injection: immutable, testable, explicit. Setter: optional dependencies. Field: tránh (hidden deps, khó test). Spring 4.3+: single-constructor class tự động inject không cần @Autowired.

**Trung · Sự khác biệt giữa `@Component`, `@Service`, `@Repository`, `@Controller`.**

Tất cả là specialized `@Component` — đều được component scan. Khác biệt: semantic meaning + AOP proxy behavior. `@Repository` thêm persistence exception translation (DataAccessException). `@Service` typically used for transaction boundaries. Giúp code readable và cho phép AOP target specific layers.

**Trung · Circular dependency xảy ra khi nào? Cách fix?**

A depends B, B depends A → Spring cannot create either first. Fix: (1) Redesign — thường circular dep = bad design. (2) `@Lazy` trên 1 constructor param. (3) Setter injection thay constructor. (4) Extract common logic to C, A và B cùng depend C. Spring Boot 2.6+ detect và throw circular dep by default.

**Trung · `@Primary` vs `@Qualifier` — khi nào dùng?**

Nhiều beans cùng type → `NoUniqueBeanDefinitionException`. `@Primary`: default winner (khi không specify qualifier). `@Qualifier("name")`: explicit selection tại injection site. Production: `@Primary` for main impl, `@Qualifier` for specific cases (test vs prod email service).

**Khó · Singleton bean trong Spring vs Singleton design pattern — khác nhau thế nào?**

Singleton pattern: 1 instance per JVM (static field). Spring singleton: 1 instance per ApplicationContext (IoC container). Nếu multiple contexts (testing, web app), nhiều "singleton" beans. Spring singleton NOT thread-safe by default — stateful singletons gây race condition. Rule: singleton beans nên stateless.

**Mock EN · "Explain Spring's dependency injection to a junior developer."**

"Imagine you're making coffee. Traditional: you go find the coffee beans, grind them, boil water yourself. With DI: you just say 'I need coffee' and someone prepares it for you. Spring is that 'someone' — the IoC container. You declare what you need in your constructor, Spring looks at its registry of beans and injects the right ones. This makes testing easy: for tests, inject a 'decaf mock' instead of real coffee."

### 🧠 Quiz Nhanh

1. IoC (Inversion of Control) trong Spring có nghĩa là gì?
   - [ ] Code tự tạo dependency bằng `new Service()`
   - [x] Container tạo và inject dependency, thay vì code tự khởi tạo — quyền điều khiển bị đảo ngược
   - [ ] Mỗi class phải implement interface `InversionOfControl`
   - [ ] Spring chạy code theo thứ tự ngược lại
   💡 Với IoC, container (ApplicationContext) tạo và inject dependency thay vì code tự `new`. DI là kỹ thuật hiện thực IoC, mang lại loose coupling và khả năng test (inject mock).

2. Annotation nào bổ sung persistence exception translation (chuyển exception DB thành DataAccessException)?
   - [ ] `@Service`
   - [ ] `@Component`
   - [x] `@Repository`
   - [ ] `@Controller`
   💡 Cả bốn đều là specialized `@Component` và được component scan, nhưng `@Repository` thêm AOP persistence exception translation; `@Service` thường đánh dấu transaction boundary.

3. Một singleton bean của Spring khác với Singleton design pattern ở điểm nào?
   - [x] Spring singleton là 1 instance per ApplicationContext, còn Singleton pattern là 1 instance per JVM
   - [ ] Spring singleton luôn thread-safe by default
   - [ ] Singleton pattern tạo nhiều instance hơn Spring singleton
   - [ ] Hai khái niệm hoàn toàn giống nhau
   💡 Spring singleton = 1 instance per IoC container (có thể nhiều container = nhiều "singleton"), trong khi Singleton pattern = 1 instance per JVM (static field). Spring singleton KHÔNG thread-safe by default nên nên giữ stateless.

LeetCode

#242 Valid Anagram

Easy

AI Tool

Spring Boot DevTools auto-restart

Resource

Baeldung Spring DI

## 💪 Ngày 5 · Spring Data JPA: @Entity, @Id, JpaRepository, CRUD, @Query, Pagination

**04/06 · Thứ 5** · **FULL** · 2.5h

**JPA + Hibernate**

JPA: specification. Hibernate: implementation. `@Entity`: class maps to table. `@Id`: primary key. `@GeneratedValue(strategy=AUTO/IDENTITY/SEQUENCE)`. `@Column(name="...", nullable=false)`. `@Table(name="...")`.

**Relationships**

`@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`. `@JoinColumn(name="...")`. Fetch type: `LAZY` (default for collections), `EAGER` (default for single). Always use `LAZY` by default, fetch explicitly when needed.

**JpaRepository**

extends `CrudRepository` + `PagingAndSortingRepository`. Methods: `save()`, `findById()`, `findAll()`, `deleteById()`, `existsById()`. Custom: `findByName(String name)` — Spring Data derives query. `@Query("SELECT s FROM Student s WHERE ...")` — JPQL.

**Pagination + Sorting**

`Pageable pageable = PageRequest.of(page, size, Sort.by("name"))`. `Page<Student> findAll(Pageable pageable)`. `Page` object: `getContent()`, `getTotalElements()`, `getTotalPages()`, `hasNext()`.

```
// Entity
@Entity
@Table(name = "students")
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "gpa")
    private Double gpa;

    @Enumerated(EnumType.STRING)
    private Faculty faculty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    // getters, setters...
}

// Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByFaculty(Faculty faculty);
    Optional<Student> findByEmail(String email);
    List<Student> findByGpaGreaterThan(Double minGpa);

    @Query("SELECT s FROM Student s WHERE s.name LIKE %:keyword%")
    List<Student> searchByName(@Param("keyword") String keyword);

    Page<Student> findAll(Pageable pageable);
}
```

- Tạo `Student` entity + `StudentRepository`. Test CRUD bằng `CommandLineRunner`.
- Add `findByGpaGreaterThan(Double min)` và test.
- Implement pagination: GET `/students?page=0&size=10&sort=name` → `Page<StudentDto>`.
- Add `@OneToMany` relationship giữa `Course` và `Student`.

**Dễ · `@Entity` + `@Id` + `@GeneratedValue` — explain từng annotation.**

`@Entity`: class này map tới DB table (tên class = tên table by default). `@Id`: field này là primary key. `@GeneratedValue(IDENTITY)`: DB auto-increment. `AUTO`: JPA chọn strategy. `SEQUENCE`: dùng DB sequence (PostgreSQL). `TABLE`: portable nhưng chậm.

**Dễ · JpaRepository methods: `save()` vs `saveAndFlush()` — khác nhau?**

`save()`: persist/merge + có thể batch. Không flush ngay (pending trong persistence context). `saveAndFlush()`: flush to DB immediately. `flush()` = send SQL to DB (nhưng vẫn trong transaction, chưa commit). Dùng `saveAndFlush` khi cần ID ngay sau save hoặc khi test cần verify DB state.

**Trung · Spring Data JPA method naming convention — ví dụ thực tế.**

Spring derives queries from method name: `findBy` + field names + keywords. `findByNameAndEmail()` → `WHERE name=? AND email=?`. `findByGpaGreaterThan()` → `WHERE gpa > ?`. `findByNameContaining()` → `WHERE name LIKE %?%`. `countByFaculty()` → `COUNT WHERE faculty=?`. `existsByEmail()` → boolean.

**Trung · LAZY vs EAGER fetching — production impact?**

LAZY: fetch associations khi access (default cho @OneToMany/@ManyToMany). EAGER: fetch luôn khi load entity. Problem: EAGER với nhiều associations → huge JOIN query. LAZY problem: `LazyInitializationException` ngoài transaction. Solution: `@EntityGraph` hoặc `JOIN FETCH` trong @Query khi cần data.

**Trung · `@Transactional` hoạt động thế nào với JPA?**

`@Transactional` trên service method: Spring tạo AOP proxy, wrap method trong transaction. Nếu exception → rollback. `readOnly=true` cho SELECT → hints Hibernate (no dirty checking, optimize flush). `propagation`: REQUIRED (join existing), REQUIRES_NEW (new tx), SUPPORTS (if exists), MANDATORY. Default: REQUIRED rollback on RuntimeException.

**Khó · N+1 query problem — giải thích và cách fix.**

N+1: load N students (1 query) → access course của mỗi student → N queries. Total: N+1. Fix: (1) `JOIN FETCH` trong JPQL: `SELECT s FROM Student s JOIN FETCH s.course`. (2) `@EntityGraph(attributePaths={"course"})` trên repository method. (3) `@BatchSize(size=20)` → Hibernate batch loads. (4) DTO projection với @Query để chỉ select needed fields.

**Mock EN · "How would you optimize a slow JPA query in production?"**

"First I'd enable SQL logging (`spring.jpa.show-sql=true`) and check what queries are generated. If N+1, I'd add JOIN FETCH or @EntityGraph. If fetching too many columns, I'd switch to DTO projection with @Query SELECT new com.app.dto.StudentDto(s.name, s.email) FROM Student s. I'd also check if pagination is properly applied (not loading all records to memory). For complex reports I might bypass JPA and use native @Query or JdbcTemplate."

### 🧠 Quiz Nhanh

1. Quan hệ giữa JPA và Hibernate là gì?
   - [ ] JPA là implementation, Hibernate là specification
   - [x] JPA là specification, Hibernate là một implementation của JPA
   - [ ] Cả hai đều là database engine
   - [ ] Hibernate thay thế hoàn toàn JPA và không liên quan
   💡 JPA là specification (chuẩn), còn Hibernate là một implementation phổ biến của chuẩn đó. `@Entity`, `@Id`, `@GeneratedValue` là các annotation thuộc JPA.

2. Với `@OneToMany`/`@ManyToMany`, fetch type mặc định là gì và best practice ra sao?
   - [x] Mặc định LAZY, và nên giữ LAZY rồi fetch tường minh khi cần
   - [ ] Mặc định EAGER, và nên luôn để EAGER cho tiện
   - [ ] Không có default, bắt buộc khai báo
   - [ ] Mặc định LAZY nhưng nên đổi hết sang EAGER
   💡 Collection (`@OneToMany`/`@ManyToMany`) mặc định LAZY, association đơn (`@ManyToOne`/`@OneToOne`) mặc định EAGER. Best practice: dùng LAZY và fetch tường minh (JOIN FETCH/@EntityGraph) khi cần để tránh JOIN khổng lồ.

3. Vấn đề N+1 query xảy ra như thế nào và cách fix điển hình?
   - [ ] Do query thiếu mệnh đề WHERE, fix bằng cách thêm index
   - [ ] Do dùng LAZY thay vì EAGER, fix bằng cách bỏ JPA
   - [x] Load N entity (1 query) rồi truy cập association từng cái sinh N query; fix bằng JOIN FETCH hoặc @EntityGraph
   - [ ] Do gọi `saveAndFlush()` quá nhiều lần
   💡 N+1 = 1 query load danh sách + N query khi truy cập association của từng phần tử. Fix: `JOIN FETCH` trong JPQL, `@EntityGraph(attributePaths=...)`, `@BatchSize`, hoặc DTO projection.

LeetCode

#1 Two Sum

Easy — review with HashMap

AI Tool

Spring Data JPA query generation hints

Resource

Baeldung Spring Data JPA

## ⚡ Ngày 6 · DTO pattern + @Valid validation + @ControllerAdvice exception handling

**05/06 · Thứ 6** · **LIGHT** · 1.5h

**DTO Pattern**

Data Transfer Object: tách API contract khỏi DB entity. Request DTO (input), Response DTO (output). Lợi ích: control exposed fields, add validation, version API độc lập với DB schema. Tools: MapStruct (compile-time), ModelMapper (runtime).

**Bean Validation (@Valid)**

`@NotNull`, `@NotBlank`, `@NotEmpty`, `@Size(min, max)`, `@Min`, `@Max`, `@Email`, `@Pattern(regexp)`, `@Positive`. Kết hợp với `@Valid @RequestBody` trong controller. `BindingResult` để handle errors manually.

**@ControllerAdvice**

Global exception handler. `@ExceptionHandler(NotFoundException.class)` trên method. Trả về `ResponseEntity` với proper status code. `@RestControllerAdvice` = `@ControllerAdvice` + `@ResponseBody`.

**Problem Details (RFC 7807)**

Standard error response format: `type`, `title`, `status`, `detail`, `instance`. Spring 6+ built-in: `ProblemDetail`. Các trường custom: `timestamp`, `errors` list.

```
// Request DTO with validation
public class CreateStudentRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100)
    private String name;

    @Email(message = "Invalid email format")
    @NotBlank
    private String email;

    @Min(0) @Max(4)
    private Double gpa;

    @NotNull
    private Faculty faculty;
    // getters, setters...
}

// Global exception handler
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex) {
        Map<String, Object> errors = new LinkedHashMap<>();
        errors.put("status", 400);
        errors.put("errors", ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage)));
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(StudentNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            StudentNotFoundException ex) {
        return ResponseEntity.status(404).body(Map.of(
            "status", 404,
            "message", ex.getMessage()
        ));
    }
}
```

- Tạo `CreateStudentRequest` DTO với validation annotations. Test với invalid payload → verify 400 response.
- Viết `GlobalExceptionHandler` xử lý `StudentNotFoundException` trả về 404 JSON.
- Tạo `StudentResponse` DTO (không expose id, không expose internal fields), dùng MapStruct để map.

**Dễ · DTO pattern có lợi ích gì so với expose Entity trực tiếp?**

(1) Security: ẩn internal fields (passwords, audit fields). (2) Versioning: API contract tách khỏi DB schema. (3) Validation: validate input riêng. (4) Performance: chỉ return fields cần thiết. (5) Avoid `LazyInitializationException` từ serializing Hibernate proxies.

**Dễ · `@Valid` vs `@Validated` — khác nhau?**

`@Valid` (JSR-303): trigger validation trên method params, không support groups. `@Validated` (Spring): supports validation groups, có thể đặt ở class level (validate all methods). `@Valid` đủ cho hầu hết REST API use cases.

**Trung · `@ControllerAdvice` vs `@ExceptionHandler` trong Controller — khi nào dùng?**

`@ExceptionHandler` trong Controller chỉ áp dụng cho controller đó. `@ControllerAdvice`: global, áp dụng cho tất cả controllers. Production: luôn dùng `@RestControllerAdvice` global — tránh duplicate error handling, consistent response format.

**Trung · MapStruct vs ModelMapper — trade-offs?**

MapStruct: compile-time code generation → zero reflection → fast (hiệu suất như viết tay). Runtime errors → compile errors. Verbose config. ModelMapper: runtime reflection → slower → harder to debug. MapStruct preferred in production. Add `@Mapper(componentModel = "spring")` để MapStruct bean injectable.

**Khó · Thiết kế error response format chuẩn cho production REST API.**

RFC 7807 Problem Details: `{"type": "uri", "title": "Student Not Found", "status": 404, "detail": "Student with id 42 not found", "instance": "/students/42"}`. Add custom fields: `timestamp`, `traceId` (correlation ID for logs). Spring 6 `ProblemDetail` built-in. Nhất quán: tất cả errors cùng format → client easy to parse.

### 🧠 Quiz Nhanh

1. Lợi ích nào KHÔNG phải là lý do dùng DTO pattern thay vì expose Entity trực tiếp?
   - [ ] Ẩn internal fields (security)
   - [ ] Tách API contract khỏi DB schema (versioning)
   - [ ] Tránh `LazyInitializationException` khi serialize Hibernate proxy
   - [x] Tăng tốc độ kết nối tới database
   💡 DTO giúp security (ẩn field), versioning (tách contract khỏi schema), validation riêng, chỉ trả field cần thiết và tránh serialize Hibernate proxy — nhưng không liên quan đến tốc độ kết nối DB.

2. Sự khác biệt chính giữa `@Valid` và `@Validated` là gì?
   - [x] `@Validated` (Spring) hỗ trợ validation groups và đặt được ở class level; `@Valid` (JSR-303) thì không hỗ trợ groups
   - [ ] `@Valid` hỗ trợ groups còn `@Validated` thì không
   - [ ] Hai annotation hoàn toàn giống nhau
   - [ ] `@Valid` chỉ dùng cho service, `@Validated` chỉ dùng cho controller
   💡 `@Valid` là JSR-303 trigger validation trên param nhưng không hỗ trợ groups; `@Validated` là của Spring, hỗ trợ validation groups và có thể đặt ở class level. `@Valid` đủ cho hầu hết REST API.

3. So với ModelMapper, ưu điểm chính của MapStruct là gì?
   - [ ] Map ở runtime bằng reflection nên linh hoạt hơn
   - [x] Sinh code ở compile-time, zero reflection, nhanh như viết tay và lỗi map thành compile error
   - [ ] Không cần khai báo gì, tự map mọi field
   - [ ] Chỉ hoạt động với ModelMapper kèm theo
   💡 MapStruct sinh code lúc compile-time nên không dùng reflection, hiệu suất như viết tay và lỗi mapping trở thành compile error; ModelMapper map runtime bằng reflection nên chậm và khó debug hơn.

LeetCode

#412 Fizz Buzz

Easy — warm-up

AI Tool

IntelliJ validation annotation hints

Resource

Baeldung Bean Validation + MapStruct docs

## 🔥 Ngày 7 · Spring Profiles + Actuator + @Transactional + @Scheduled + @Async

**06/06 · Thứ 7** · **WEEKEND** · 4h

**Spring Profiles**

`@Profile("dev")` bean chỉ active trong dev profile. `spring.profiles.active=dev` in properties. Multi-profile: `application-dev.yml`, `application-prod.yml`. `@ActiveProfiles("test")` in tests. Thực tế: dev dùng H2, prod dùng PostgreSQL.

**Spring Actuator**

Monitoring endpoints: `/actuator/health`, `/actuator/info`, `/actuator/metrics`, `/actuator/env`. Enable: `management.endpoints.web.exposure.include=health,info,metrics`. Secure in production. Custom health indicator: implement `HealthIndicator`.

**@Transactional deep dive**

`@Transactional` trên service. Self-invocation không work (gọi method trong cùng bean bypass proxy). `readOnly=true` optimization. Propagation: `REQUIRED` (default), `REQUIRES_NEW` (suspend current, start new). Rollback: unchecked exceptions by default. Checked: dùng `rollbackFor=Exception.class`.

**@Scheduled + @Async**

`@EnableScheduling` + `@Scheduled(cron="0 0 * * * *")` chạy hourly. `@EnableAsync` + `@Async` trả về `CompletableFuture`. `@Async` method trong cùng class không work (proxy issue). Custom TaskExecutor bean cho @Async.

```
// application-dev.yml
// spring:
//   datasource:
//     url: jdbc:h2:mem:devdb
// logging:
//   level:
//     root: DEBUG

// application-prod.yml
// spring:
//   datasource:
//     url: jdbc:postgresql://prod-host/studentdb
// logging:
//   level:
//     root: WARN

@Configuration
@Profile("dev")
public class DevDataInitializer {
    @Bean
    CommandLineRunner seedData(StudentRepository repo) {
        return args -> {
            repo.save(new Student("Alice", "alice@example.com", 3.9));
            repo.save(new Student("Bob", "bob@example.com", 3.5));
        };
    }
}
```

```
@Service
@EnableAsync
public class ReportService {

    @Scheduled(cron = "0 0 8 * * MON-FRI") // 8AM weekdays
    public void generateDailyReport() {
        // runs on scheduler thread
        log.info("Generating daily report...");
    }

    @Async("taskExecutor") // custom executor
    public CompletableFuture<Report> generateReportAsync(Long studentId) {
        Report report = heavyComputation(studentId);
        return CompletableFuture.completedFuture(report);
    }
}

@Configuration
public class AsyncConfig implements AsyncConfigurer {
    @Bean("taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-");
        executor.initialize();
        return executor;
    }
}
```

- Tạo `application-dev.yml` (H2) và `application-prod.yml` (PostgreSQL). Switch profile qua `SPRING_PROFILES_ACTIVE` env var.
- Enable Actuator, expose `/health` và `/info`. Add custom `BuildInfoContributor`.
- Add `@Scheduled` job xóa students inactive hơn 1 năm (chạy mỗi đêm 2AM).
- Thêm `@Async` vào email sending trong `StudentService` — verify không block main thread.

**Dễ · Spring Profiles dùng để làm gì?**

Separate configurations for different environments (dev/staging/prod). Dev: H2, verbose logging, seed data. Prod: PostgreSQL, minimal logging, no seed. Activate: `spring.profiles.active=prod` or env var `SPRING_PROFILES_ACTIVE=prod` (overrides properties). Multiple: `spring.profiles.active=prod,feature-x`.

**Dễ · Spring Actuator cung cấp những gì? Tại sao quan trọng?**

`/health`: liveness + readiness (K8s probe). `/metrics`: JVM memory, CPU, HTTP request counts. `/info`: build version, git commit. `/env`: active properties. `/loggers`: dynamic log level change. Production: expose only `/health` publicly, rest behind auth or internal network.

**Trung · `@Transactional` self-invocation problem — giải thích.**

Spring `@Transactional` dùng AOP proxy. Gọi method từ ngoài class → goes through proxy → transaction starts. Gọi method trong cùng class → bypasses proxy → NO transaction. Fix: (1) Inject self via `@Autowired` (ugly). (2) Move method to separate bean. (3) Use `TransactionTemplate` programmatically. Best: redesign to avoid self-call.

**Trung · `@Async` pitfalls — những lỗi thường gặp?**

(1) Gọi `@Async` method trong cùng class → proxy bypass → chạy sync. (2) Không có `@EnableAsync` → chạy sync silently. (3) Dùng default SimpleAsyncTaskExecutor → new thread per call → OOM. (4) Return void → exception bị swallow silently. (5) `@Transactional` + `@Async` → different threads, transaction không propagate. Fix: return `CompletableFuture` + custom thread pool + separate class.

**Khó · Giải thích Spring AOP proxy mechanism — JDK dynamic proxy vs CGLIB.**

JDK dynamic proxy: tạo proxy implement same interfaces. CGLIB: subclass proxy (bytecode generation). Spring default: interface → JDK proxy; class → CGLIB. Spring Boot 2.0+: default CGLIB (proxied by subclass). Implication: `@Transactional`/`@Async`/`@Cacheable` chỉ work khi gọi qua proxy (method không phải `final`, không `private`).

**Khó · Spring Boot startup optimization — cách giảm startup time?**

(1) Lazy initialization: `spring.main.lazy-initialization=true` — chỉ load beans khi needed. (2) Exclude unused auto-configurations: `@SpringBootApplication(exclude={...})`. (3) Spring Native (GraalVM): compile AOT → ms startup. (4) Application context caching in tests: `@SpringBootTest` reuses context. (5) Class data sharing (AppCDS). Production: measure first with Spring Boot Actuator startup endpoint.

**Mock EN · "How do you handle database transactions in Spring Boot?"**

"I use `@Transactional` on service methods — it's declarative and clean. For reads I always add `readOnly=true` which tells Hibernate to skip dirty checking and optimize flushing. I'm careful about self-invocation — I always put transactional methods in a separate class from callers. For complex saga patterns involving multiple services, I use choreography-based sagas with events rather than distributed transactions, since 2PC is impractical in microservices."

**Mock EN · "Describe how you'd secure a Spring Boot application in production."**

"Multiple layers: First, Spring Security for authentication (JWT or OAuth2). HTTPS enforced via SSL termination at load balancer. Actuator endpoints secured or limited to internal network. Input validation with Bean Validation to prevent injection. SQL injection prevented by JPA parameterized queries. CORS configured for known origins. Rate limiting at API gateway level. Secrets in environment variables or Vault, never in properties files. Regular dependency updates for security patches."

### 🧠 Quiz Nhanh

1. Vì sao `@Transactional` self-invocation (gọi method trong cùng class) lại không tạo transaction?
   - [x] Vì gọi nội bộ bypass AOP proxy, nên không kích hoạt logic transaction
   - [ ] Vì `@Transactional` chỉ hoạt động trên method `private`
   - [ ] Vì Spring tắt transaction trong cùng một class
   - [ ] Vì cần thêm `@EnableTransactionManagement` cho mỗi method
   💡 `@Transactional` dựa trên AOP proxy: gọi từ ngoài đi qua proxy nên transaction bắt đầu, còn gọi nội bộ (`this.method()`) bypass proxy nên không có transaction. Fix: tách method sang bean khác hoặc dùng TransactionTemplate.

2. Lỗi `@Async` nào sau đây là phổ biến và đúng?
   - [ ] `@Async` luôn chạy trên thread chính của request
   - [x] Gọi `@Async` method trong cùng class bị bypass proxy nên chạy đồng bộ (sync)
   - [ ] `@Async` không cần `@EnableAsync` vẫn luôn chạy bất đồng bộ
   - [ ] `@Async` trả về void sẽ luôn ném exception ra ngoài
   💡 Pitfall thường gặp: gọi `@Async` trong cùng class → bypass proxy → chạy sync; thiếu `@EnableAsync` → chạy sync âm thầm; dùng default executor → OOM; return void → exception bị nuốt. Nên tách class, return `CompletableFuture` và dùng thread pool riêng.

3. Về Spring AOP proxy, mặc định của Spring Boot 2.0+ là gì?
   - [ ] Luôn dùng JDK dynamic proxy cho mọi bean
   - [x] Mặc định CGLIB (proxy bằng subclass), và `@Transactional`/`@Async` chỉ work khi method không `final`/`private`
   - [ ] Không dùng proxy, chèn bytecode trực tiếp vào class gốc
   - [ ] Chỉ proxy được các class implement interface
   💡 JDK dynamic proxy tạo proxy implement interface; CGLIB tạo subclass proxy. Spring Boot 2.0+ mặc định CGLIB, nên `@Transactional`/`@Async`/`@Cacheable` chỉ hoạt động khi gọi qua proxy và method không `final`/`private`.

LeetCode

#206 Reverse Linked List

Easy — review

AI Tool

Spring Boot Actuator dashboard

Resource

Baeldung Spring Profiles + Actuator

## 🎯 Ngày 8 · Spaced Review T1-T4 + Mini Project: Student Management REST API full CRUD

**07/06 · CN** · **REVIEW** · 4h

**Spring Boot recap**

Auto-configuration, embedded Tomcat, fat JAR, convention-over-configuration. `@SpringBootApplication` = 3 annotations. `application.yml` cho config.

**REST API recap**

`@RestController`, HTTP methods + status codes, `ResponseEntity`, `@PathVariable/@RequestParam/@RequestBody`, DTO pattern + validation.

**DI + IoC recap**

IoC container, `@Component/@Service/@Repository`, Constructor injection, `@Bean/@Configuration`, `@Primary/@Qualifier`, Bean scopes.

**JPA recap**

`@Entity`, `JpaRepository`, method naming, `@Query`, pagination, N+1 problem, `@Transactional`, LAZY vs EAGER.

```
// Complete flow: Controller → Service → Repository
@RestController
@RequestMapping("/api/v1/students")
public class StudentController {
    private final StudentService service;
    public StudentController(StudentService service) { this.service = service; }

    @GetMapping
    public Page<StudentResponse> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.findAll(PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse create(@Valid @RequestBody CreateStudentRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public StudentResponse update(@PathVariable Long id,
                                  @Valid @RequestBody UpdateStudentRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
```

- Complete Student Management API: Entity + DTO + Repository + Service + Controller + GlobalExceptionHandler. Tested với Postman — all 5 CRUD endpoints work.
- Add `/api/v1/students/search?name=Alice&faculty=CS&minGpa=3.0` endpoint với dynamic query.
- Push to GitHub với README.md (EN): project description, setup instructions, API endpoints table, tech stack.

**Dễ · `@SpringBootApplication` bao gồm những gì?**

`@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`. ComponentScan quét current package + sub-packages. EnableAutoConfiguration tự động configure dựa trên classpath (nếu có JPA → configure EntityManagerFactory).

**Dễ · HTTP status codes: 200 vs 201 vs 204 — khi nào dùng?**

200 OK: GET success. 201 Created: POST success (include Location header). 204 No Content: DELETE success (no body). 400 Bad Request: validation failure. 404 Not Found: resource doesn't exist. 409 Conflict: duplicate resource.

**Dễ · JpaRepository built-in methods — kể 5 methods quan trọng.**

`save(entity)`, `findById(id)` → `Optional`, `findAll()`, `deleteById(id)`, `existsById(id)`, `count()`, `findAll(Pageable)`.

**Trung · Tại sao nên dùng Constructor Injection thay vì `@Autowired` field injection?**

Immutability (final fields), explicit dependencies (visible in constructor), testability (`new Service(mock)`), no Spring context needed for unit test, IntelliJ warns about field injection. Constructor injection = best practice per Spring docs.

**Trung · Spring Data JPA `@Query` dùng JPQL hay SQL? Khi nào dùng native query?**

Default: JPQL (Java Persistence Query Language) — works with entity names (not table names), portable across databases. `nativeQuery=true`: raw SQL — DB-specific, faster for complex queries, needed for DB-specific features (PostgreSQL JSON operations). Prefer JPQL for portability, native for performance-critical queries.

**Trung · DTO pattern — tại sao quan trọng trong production?**

Security: ẩn internal fields. Flexibility: API contract độc lập với DB. Validation: validate input riêng. Versioning: v1 và v2 DTO khác nhau, entity unchanged. Serialization control: @JsonIgnore fields không liên quan. Avoid circular references from JPA relationships.

**Khó · `@Transactional readOnly=true` — tại sao nên dùng cho GET requests?**

Hibernate hints: no dirty checking (không track changes), no snapshot save → less memory. JPA flush mode NEVER → no accidental writes. Database: hint to use read replica (if configured). Connection pool: some pools can route to read replicas. Performance improvement especially with large entity graphs. Always use for service methods that only read.

**Khó · N+1 query problem — explain với ví dụ và solution.**

Load 100 students (1 query). Access `student.getCourse()` in loop → 100 separate queries = 101 total. Fix: `@Query("SELECT s FROM Student s JOIN FETCH s.course WHERE ...")` → 1 query with JOIN. Or `@EntityGraph(attributePaths={"course"})` on repository method. Or DTO projection: `SELECT new StudentDto(s.name, c.name) FROM Student s JOIN s.course c`.

**Mock EN · "How would you design a scalable REST API for a high-traffic system?"**

"I'd start with proper HTTP semantics (idempotent PUT/DELETE, safe GET). Pagination on all list endpoints. Caching headers (ETag, Cache-Control) for GET endpoints. Database indexing for search fields. Connection pooling (HikariCP). Rate limiting at API gateway. Async processing for heavy operations (return 202 Accepted + polling endpoint or webhook). Horizontal scaling with stateless services. CQRS if read/write patterns differ significantly."

**Mock EN · "Describe the Spring Boot application lifecycle from startup to first request."**

"JVM loads Spring Application. SpringApplication.run() triggers: environment prepared, ApplicationContext created, auto-configuration applied (based on classpath scanning), beans instantiated and injected (IoC container built), CommandLineRunners execute, embedded Tomcat starts on configured port. First request arrives: DispatcherServlet receives it, finds matching @RequestMapping via HandlerMapping, creates handler chain with interceptors, invokes controller method, serializes response via Jackson, sends HTTP response."

LeetCode

#704 Binary Search

Easy — algo practice

AI Tool

Postman automated test collections

Resource

Spring Boot reference docs

## 🎯 Tổng Kết Tuần 4

### Ngân hàng câu hỏi phỏng vấn

**Spring Boot Fundamentals**

- **What is Spring Boot auto-configuration?**  
  Spring Boot detects dependencies on classpath and auto-configures beans. If spring-data-jpa on classpath → configures DataSource, EntityManagerFactory, TransactionManager. Controlled by @ConditionalOnClass/@ConditionalOnMissingBean. Override by declaring own @Bean. View in actuator /conditions endpoint.
- **Difference between @Component, @Service, @Repository?**  
  All are @Component specializations, all eligible for component scanning. @Repository adds PersistenceExceptionTranslation AOP (converts DB exceptions to DataAccessException). @Service marks business layer (transaction boundary). Semantic meaning helps readability and AOP targeting.
- **What is Spring IoC container?**  
  ApplicationContext is the IoC container — manages bean lifecycle, DI, AOP, events. Beans registered via @Component scan or @Bean methods. Container injects dependencies, applies proxies (@Transactional, @Async). Singleton scope default — one instance shared. Prototype — new instance per request.

**REST API + JPA**

- **How to handle validation errors globally in Spring Boot?**  
  @RestControllerAdvice with @ExceptionHandler(MethodArgumentNotValidException.class). Extract field errors from BindingResult. Return ResponseEntity with 400 status and error map. RFC 7807 Problem Details format recommended for consistency.
- **Spring Data JPA derived query vs @Query — when to use each?**  
  Derived (findByNameAndGpaGreaterThan): simple conditions, auto-generated, readable. @Query JPQL: complex joins, groupBy, subqueries. @Query nativeQuery=true: DB-specific SQL, performance-critical. Rule: start with derived, switch to @Query when derived gets complex (>3 conditions).
- **What is JPA N+1 problem and how to fix?**  
  Loading N entities then accessing lazy collection triggers N additional queries. Fix: JOIN FETCH in JPQL, @EntityGraph for dynamic loading, DTO projection to select only needed fields. Detect with: spring.jpa.show-sql=true or Hibernate statistics.

**Spring Production Patterns**

- **How do Spring Profiles work?**  
  @Profile("dev") beans only active when dev profile active. Activate via spring.profiles.active=dev (property), SPRING_PROFILES_ACTIVE=dev (env var, highest priority), @ActiveProfiles("test") in tests. Environment-specific application-{profile}.yml files. Use for: different DB configs, mock vs real services, feature flags.
- **@Transactional self-invocation problem?**  
  Spring @Transactional uses AOP proxy. External call → proxy → transaction begins. Internal call (this.method()) → bypasses proxy → no transaction. Fix: move to separate @Component bean or use ApplicationContext.getBean(this.getClass()) (antipattern). Best: design to avoid internal calls.
- **What does Spring Actuator provide?**  
  Production-ready monitoring endpoints. /health: app health + DB/Redis connectivity (use for K8s liveness/readiness probes). /metrics: JVM, HTTP, custom. /info: build info. /loggers: change log level at runtime. Secure in production: only expose /health publicly.

### Checklist Tuần 4

- [ ] Tạo Spring Boot project từ Initializr, chạy được cổng 8080
- [ ] CRUD controller hoàn chỉnh với ResponseEntity đúng status codes (200/201/204/404)
- [ ] Constructor injection cho tất cả beans — không dùng @Autowired field injection
- [ ] Student entity + JpaRepository + custom findBy methods hoạt động
- [ ] DTO pattern: Request DTO (validation) + Response DTO (mapper) tách biệt entity
- [ ] @ControllerAdvice bắt validation errors → 400 response đúng format
- [ ] Spring Profiles: dev (H2) và prod (PostgreSQL) switch được qua env var
- [ ] N+1 problem: identify và fix bằng JOIN FETCH hoặc @EntityGraph
- [ ] Mini project Student API: full CRUD + pagination + search, push GitHub
- [ ] Mock interview: giải thích DI, @Transactional, N+1 cho người phỏng vấn bằng tiếng Anh

> 💡 **Golden Rule Tuần 4:** Spring Boot = Java với superpower. @RestController + @Service + @Repository = 3 tầng rõ ràng, mỗi tầng 1 trách nhiệm. JPA tiết kiệm 80% boilerplate DB code — nhưng hiểu N+1 và @Transactional trước khi optimize. Constructor injection + DTO + @ControllerAdvice = production-ready API từ ngày đầu.
