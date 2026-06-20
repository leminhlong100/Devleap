# 🔐 Tuần 7 · JWT/Security + JUnit + RAG · 22/06–28/06/2025

## 📅 Lịch Học Tuần 7 — Tổng Quan 7 Ngày

| Ngày | Thứ | Chế độ | Thời gian | Chủ đề |
| --- | --- | --- | --- | --- |
| 22/06 | Thứ 2 | LIGHT | 1.5h | Spring Security cơ bản: SecurityFilterChain, authentication vs authorization |
| 23/06 | Thứ 3 | FULL | 2.5h | JWT: cấu trúc token, tạo/validate, JwtAuthenticationFilter, stateless auth |
| 24/06 | Thứ 4 | FULL | 2.5h | Role-based access control: @PreAuthorize, GrantedAuthority, method security, password encoding |
| 25/06 | Thứ 5 | FULL | 2.5h | JUnit 5: @Test, assertions, lifecycle, @ParameterizedTest, test structure (AAA) |
| 26/06 | Thứ 6 | LIGHT | 1.5h | Mockito: @Mock, @InjectMocks, when/thenReturn, verify, @WebMvcTest/@DataJpaTest |
| 27/06 | Thứ 7 | WEEKEND | 4h | RAG (Retrieval-Augmented Generation): embeddings, VectorStore, PGVector, similarity search |
| 28/06 | CN | REVIEW | 4h | Spaced Review T1-T7 + Mini Project: Secured RAG Q&A API (JWT + tests + PGVector) |

## ⚡ Ngày 1 · Spring Security cơ bản: SecurityFilterChain, authn vs authz

**22/06 — Thứ 2** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Vocalmax + Parroto Shadowing · 15 phút*
>
> **Vocalmax 10 từ:** authentication, authorization, principal, credential, filter chain, granted authority, security context, stateless, role, permission. **Parroto shadow:** "Authentication verifies who you are; authorization decides what you can do."

### 📖 Lý Thuyết Cốt Lõi

**Authentication vs Authorization**

Authentication (authn): xác thực BẠN LÀ AI (login với username/password, token). Authorization (authz): xác định bạn ĐƯỢC LÀM GÌ (roles, permissions). Authn trước, authz sau. Ví dụ: login (authn) → admin được xóa user, user thường thì không (authz).

**SecurityFilterChain**

Spring Security 6: config bằng `SecurityFilterChain` bean (thay `WebSecurityConfigurerAdapter` cũ). Định nghĩa: endpoint nào cần auth, endpoint nào public (`permitAll`), CSRF, session policy. Request đi qua chuỗi filters trước khi tới controller.

**SecurityContext + Principal**

`SecurityContextHolder` lưu thông tin authenticated user (trong ThreadLocal). `Authentication` object chứa principal (user), authorities (roles), credentials. Lấy current user: `SecurityContextHolder.getContext().getAuthentication()`.

**Filter chain flow**

Request → các Security filters (authentication, authorization) → nếu pass → controller. `UsernamePasswordAuthenticationFilter`, `JwtAuthenticationFilter` (custom). Filter order quan trọng. Mỗi filter có 1 trách nhiệm cụ thể (chain of responsibility pattern).

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // disable for stateless REST API
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // no session, use JWT
            );
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

// Get current authenticated user
@GetMapping("/me")
public String currentUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    return "Logged in as: " + auth.getName();
}
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Setup Spring Security, config `SecurityFilterChain`: public `/api/public/**`, còn lại cần auth.
2. Thêm `BCryptPasswordEncoder` bean, encode 1 password và verify.
3. Tạo endpoint `/me` lấy current user từ `SecurityContextHolder`.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ · Authentication và Authorization khác nhau thế nào?**

Authentication (authn) = xác thực bạn là ai (login, verify credentials/token). Authorization (authz) = xác định bạn được phép làm gì (roles, permissions). Authn xảy ra trước, authz sau. Ví dụ: đăng nhập = authn; chỉ admin xóa được user = authz.

**Dễ · SecurityFilterChain là gì?**

Bean config Spring Security 6 định nghĩa cách bảo vệ HTTP requests: endpoint nào public/cần auth, role yêu cầu, CSRF, session policy. Thay thế `WebSecurityConfigurerAdapter` deprecated. Request đi qua chuỗi security filters trước khi tới controller.

**Trung · Tại sao REST API thường set SessionCreationPolicy.STATELESS?**

REST API stateless theo nguyên tắc — không lưu session server-side. Mỗi request tự chứa auth info (JWT token trong header). Lợi ích: scale ngang dễ (không cần sticky session/session replication), phù hợp microservices. Trade-off: không revoke token dễ như session (cần blacklist/short expiry).

**Trung · SecurityContextHolder hoạt động thế nào?**

Lưu `Authentication` của current user trong ThreadLocal (mặc định) — mỗi request thread có context riêng. Sau khi authenticate, filter set Authentication vào đó. Code lấy ra: `SecurityContextHolder.getContext().getAuthentication()`. Cảnh báo: ThreadLocal + thread pool → phải clear sau request (Spring tự làm), @Async mất context (cần propagate).

**Khó · CSRF là gì? Tại sao disable cho stateless JWT API nhưng cần cho session-based?**

CSRF (Cross-Site Request Forgery): browser tự gửi cookies (session) trong request từ site độc hại → thực hiện hành động thay user. Session-based dùng cookies → dễ bị CSRF → cần CSRF token. JWT trong Authorization header (không phải cookie) → browser không tự gửi → không bị CSRF → disable được. Nếu JWT lưu trong cookie → vẫn cần CSRF protection.

### 🧠 Quiz Nhanh

1. Sự khác biệt cốt lõi giữa authentication và authorization là gì?
   - [ ] Authentication xác định bạn được làm gì, authorization xác thực bạn là ai
   - [x] Authentication xác thực bạn là ai, authorization xác định bạn được làm gì
   - [ ] Cả hai đều chỉ kiểm tra password
   - [ ] Authorization luôn xảy ra trước authentication
   💡 Authn xác thực danh tính (bạn là ai), authz xác định quyền (bạn được làm gì); authn trước, authz sau.

2. Trong Spring Security 6, bean nào dùng để config cách bảo vệ HTTP requests?
   - [x] SecurityFilterChain
   - [ ] WebSecurityConfigurerAdapter
   - [ ] SecurityContextHolder
   - [ ] AuthenticationManager
   💡 Spring Security 6 dùng SecurityFilterChain bean thay cho WebSecurityConfigurerAdapter đã deprecated.

3. Tại sao REST API thường set SessionCreationPolicy.STATELESS?
   - [ ] Để server lưu session state hiệu quả hơn
   - [ ] Để bắt buộc dùng cookie cho mỗi request
   - [x] Vì REST stateless, mỗi request tự chứa auth info nên scale ngang dễ
   - [ ] Vì nó tự động revoke token khi hết hạn
   💡 Stateless nghĩa server không lưu session; mỗi request tự chứa auth (JWT), giúp scale ngang dễ, phù hợp microservices.

- **🧩 LeetCode:** Two Sum (LC #1) — Easy — review hashmap

- **🤖 AI Tools:** Dùng AI giải thích security filter chain flow — request đi qua các filter nào theo thứ tự nào.

- **📚 Tài Nguyên:** Spring Security reference "Architecture" + Baeldung "Spring Security".

## 💪 Ngày 2 · JWT: cấu trúc, tạo/validate, stateless auth

**23/06 — Thứ 3** · **FULL** · ⏱ 30 phút sáng + 2h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Parroto Shadowing · 20 phút*
>
> **Câu shadowing:** "A JWT consists of a header, a payload, and a signature", "The token is signed to prevent tampering", "Stateless authentication scales horizontally". **Vocalmax:** token, claim, signature, payload, header, bearer, expiration, secret key, decode, tamper.

### 📖 Lý Thuyết Cốt Lõi

**JWT structure**

3 phần ngăn bởi dấu chấm: `header.payload.signature` (Base64URL encoded). Header: algorithm (HS256/RS256) + type. Payload: claims (sub, exp, iat, custom data như roles). Signature: ký header+payload bằng secret → đảm bảo không bị sửa. KHÔNG mã hóa — payload đọc được (đừng để secret trong payload).

**Tạo + validate JWT**

Library `jjwt` (io.jsonwebtoken). Tạo: `Jwts.builder().subject(username).claim("roles", roles).expiration(...).signWith(key).compact()`. Validate: parse + verify signature + check expiration. Sai signature/hết hạn → throw exception.

**Bearer token flow**

Client login → server trả JWT. Client lưu (localStorage/memory) → gửi mỗi request header `Authorization: Bearer <token>`. Server validate token mỗi request (stateless, không cần DB lookup session). Token chứa đủ info (user, roles) để authorize.

**JwtAuthenticationFilter**

Custom filter extends `OncePerRequestFilter`. Mỗi request: extract token từ header → validate → tạo `Authentication` → set vào `SecurityContextHolder`. Đặt trước `UsernamePasswordAuthenticationFilter` trong chain. Không token/invalid → tiếp tục chain (anonymous) hoặc reject.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
@Component
public class JwtService {
    private final SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());

    public String generateToken(String username, List<String> roles) {
        return Jwts.builder()
            .subject(username)
            .claim("roles", roles)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 3600_000)) // 1h
            .signWith(key)
            .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isValid(String token) {
        try { parseClaims(token); return true; }
        catch (JwtException e) { return false; } // invalid signature or expired
    }

    private Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(key).build()
            .parseSignedClaims(token).getPayload();
    }
}

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtService.isValid(token)) {
                String username = jwtService.extractUsername(token);
                var auth = new UsernamePasswordAuthenticationToken(username, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(req, res);
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Tạo `JwtService` generate + validate token với jjwt library.
2. Tạo `/api/auth/login` endpoint: verify credentials → trả JWT.
3. Implement `JwtAuthenticationFilter`, đăng ký vào SecurityFilterChain.
4. Test full flow: login lấy token → gọi protected endpoint với `Authorization: Bearer <token>`.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · JWT gồm những phần nào?**

3 phần ngăn bởi dấu chấm: Header (algorithm + type), Payload (claims: sub, exp, custom data), Signature (ký header+payload bằng secret). Format: `xxxxx.yyyyy.zzzzz`, mỗi phần Base64URL encoded. Signature đảm bảo integrity (không bị sửa).

**Dễ · JWT có được mã hóa không? Lưu gì trong payload?**

KHÔNG mã hóa — chỉ Base64 encode (decode được dễ dàng). Signature chỉ đảm bảo không bị TAMPER, không giấu nội dung. Vì vậy KHÔNG để dữ liệu nhạy cảm (password, secret) trong payload. Chỉ lưu: user id, username, roles, expiration — đủ để authorize.

**Trung · Stateless JWT auth khác session-based auth thế nào?**

Session: server lưu session state (memory/DB), client giữ session ID (cookie), mỗi request server lookup session. JWT: server không lưu gì, token tự chứa info, validate bằng signature (không DB lookup). JWT scale ngang dễ (no shared session store), session dễ revoke hơn (xóa server-side).

**Trung · Tại sao dùng OncePerRequestFilter cho JWT filter?**

`OncePerRequestFilter` đảm bảo filter chạy ĐÚNG 1 LẦN mỗi request (kể cả khi có forward/include internal). Tránh validate token nhiều lần (lãng phí + có thể gây bug double-authentication). Là base class chuẩn cho custom security filters.

**Trung · Refresh token là gì? Tại sao cần?**

Access token nên short-lived (15p-1h) để giảm rủi ro nếu bị lộ. Nhưng bắt user login lại mỗi giờ thì tệ. Refresh token (long-lived, lưu an toàn) dùng để lấy access token mới khi hết hạn mà không cần login lại. Refresh token lưu server-side (revoke được), access token stateless.

**Khó · JWT có nhược điểm gì về bảo mật và cách mitigate?**

(1) Không revoke được trước khi hết hạn (stateless) → dùng short expiry + refresh token + blacklist cho critical. (2) Nếu bị lộ (XSS) → attacker dùng được tới khi hết hạn → lưu httpOnly cookie hoặc memory, không localStorage. (3) Payload đọc được → không để PII. (4) Secret key lộ → tất cả token compromise → rotate keys, dùng RS256 (asymmetric). (5) "alg: none" attack → luôn verify algorithm.

**Mock EN · "Walk me through how JWT authentication works in a Spring Boot API."**

"On login, the server verifies credentials and issues a signed JWT containing the username and roles with a short expiration. The client stores it and sends it in the Authorization header as a Bearer token on each request. A custom filter extending OncePerRequestFilter extracts the token, verifies the signature and expiration, and if valid, builds an Authentication object and places it in the SecurityContext. This is stateless — the server stores no session — so it scales horizontally. For security I use short-lived access tokens with refresh tokens, and I never put sensitive data in the payload since it's only encoded, not encrypted."

### 🧠 Quiz Nhanh

1. Một JWT gồm những phần nào theo đúng thứ tự?
   - [x] Header, payload, signature
   - [ ] Signature, header, payload
   - [ ] Payload, signature, header
   - [ ] Header, signature, claims
   💡 JWT có dạng header.payload.signature (Base64URL), trong đó signature ký header+payload để chống tamper.

2. Phát biểu nào ĐÚNG về payload của JWT?
   - [ ] Payload được mã hóa nên có thể lưu password an toàn
   - [ ] Payload chỉ server đọc được, client không decode được
   - [x] Payload chỉ Base64 encode, ai cũng decode được nên không để dữ liệu nhạy cảm
   - [ ] Payload chứa secret key để verify signature
   💡 JWT không mã hóa, chỉ encode; signature chỉ chống tamper chứ không giấu nội dung, nên không để dữ liệu nhạy cảm trong payload.

3. Tại sao JwtAuthenticationFilter nên extends OncePerRequestFilter?
   - [ ] Để filter chạy nhiều lần cho mỗi request
   - [ ] Để tự động mã hóa token
   - [ ] Để bỏ qua việc validate signature
   - [x] Để đảm bảo filter chạy đúng 1 lần mỗi request, tránh validate token lặp lại
   💡 OncePerRequestFilter đảm bảo filter chạy đúng một lần mỗi request (kể cả forward/include), tránh double-authentication.

- **🧩 LeetCode:** Isomorphic Strings (LC #205) — Easy — hashmap

- **🤖 AI Tools:** Dùng AI debug JWT validation issues — sai signature, hết hạn, sai algorithm.

- **📚 Tài Nguyên:** jwt.io (decode tokens) + Baeldung "Spring Security JWT".

## 💪 Ngày 3 · Role-based access control + method security

**24/06 — Thứ 4** · **FULL** · ⏱ 30 phút sáng + 2h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Parroto Shadowing · 20 phút*
>
> **Câu shadowing:** "The @PreAuthorize annotation checks permissions before the method runs", "Passwords must be hashed, never stored in plain text", "Role-based access control restricts actions by user role". **Vocalmax:** role, authority, permission, hash, salt, bcrypt, pre-authorize, method security, hierarchy, grant.

### 📖 Lý Thuyết Cốt Lõi

**Role vs Authority**

Authority: quyền cụ thể (`READ_USER`, `DELETE_POST`). Role: nhóm authorities, prefix `ROLE_` (`ROLE_ADMIN`). `hasRole("ADMIN")` tự thêm prefix `ROLE_`, `hasAuthority("ROLE_ADMIN")` thì không. Spring lưu cả 2 dạng `GrantedAuthority`. Role coarse-grained, authority fine-grained.

**@PreAuthorize / @PostAuthorize**

Method-level security. `@PreAuthorize("hasRole('ADMIN')")` check TRƯỚC khi chạy method. `@PostAuthorize("returnObject.owner == authentication.name")` check SAU (dựa kết quả). SpEL expressions. Bật bằng `@EnableMethodSecurity`. Linh hoạt hơn URL-based config.

**Password encoding (BCrypt)**

KHÔNG BAO GIỜ lưu plain password. `BCryptPasswordEncoder`: hash 1 chiều + salt tự động (mỗi hash khác nhau dù cùng password). `encode(raw)` khi lưu, `matches(raw, hashed)` khi verify. BCrypt chậm có chủ đích (chống brute-force), có cost factor (work factor).

**UserDetailsService**

Interface load user data cho authentication. `loadUserByUsername(username)` → trả `UserDetails` (username, hashed password, authorities). Spring dùng để verify login. Custom implementation query DB. `AuthenticationManager` dùng nó + PasswordEncoder để authenticate.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException(username));
        return org.springframework.security.core.userdetails.User
            .withUsername(user.getUsername())
            .password(user.getPassword()) // already BCrypt-hashed
            .authorities(user.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .toList())
            .build();
    }
}

@RestController
@RequestMapping("/api")
@EnableMethodSecurity
public class AdminController {

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> allUsers() { ... }

    @DeleteMapping("/posts/{id}")
    @PreAuthorize("hasRole('ADMIN') or @postService.isOwner(#id, authentication.name)")
    public void deletePost(@PathVariable Long id) { ... }

    // Registration: hash password before saving
    @PostMapping("/register")
    public void register(@RequestBody RegisterRequest req) {
        String hashed = passwordEncoder.encode(req.password());
        userRepository.save(new User(req.username(), hashed, Set.of("USER")));
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Implement `CustomUserDetailsService` query user từ DB.
2. Thêm `@PreAuthorize("hasRole('ADMIN')")` cho admin endpoints, test với user thường → 403.
3. Registration endpoint: hash password với BCrypt trước khi lưu, verify hash khác nhau mỗi lần.
4. Implement ownership check: `@PreAuthorize` cho phép owner hoặc admin xóa resource.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Role và Authority khác nhau thế nào trong Spring Security?**

Authority: quyền cụ thể (fine-grained, vd `DELETE_POST`). Role: nhóm quyền, có prefix `ROLE_` (coarse-grained, vd `ROLE_ADMIN`). `hasRole("ADMIN")` tự thêm prefix → check `ROLE_ADMIN`. `hasAuthority("ROLE_ADMIN")` không thêm prefix. Cùng cơ chế GrantedAuthority bên dưới.

**Dễ · Tại sao không bao giờ lưu password dạng plain text?**

Nếu DB bị lộ, tất cả password lộ ngay → attacker dùng login mọi nơi (users tái dùng password). Phải hash 1 chiều (không reverse được) với salt. Dùng BCrypt/Argon2. Lưu hash, khi login hash input rồi so sánh hash. Plain text password = vi phạm bảo mật nghiêm trọng.

**Trung · Tại sao BCrypt cố tình chậm? Salt giúp gì?**

Chậm (cost factor) để chống brute-force: attacker thử hàng tỷ password/giây với hash nhanh (MD5), nhưng BCrypt giới hạn còn vài nghìn/giây → infeasible. Salt (random per password) chống rainbow table + đảm bảo 2 user cùng password có hash khác nhau → không lộ pattern. BCrypt tự embed salt trong hash.

**Trung · @PreAuthorize vs URL-based authorization (trong SecurityFilterChain)?**

URL-based: config tập trung trong SecurityFilterChain, theo path pattern (coarse). @PreAuthorize: method-level, dùng SpEL linh hoạt (check ownership, complex logic, dùng method args). @PreAuthorize gần business logic hơn, biểu đạt phức tạp hơn. Thường kết hợp cả 2: URL cho coarse, @PreAuthorize cho fine-grained.

**Trung · UserDetailsService dùng để làm gì?**

Interface Spring Security dùng để load user data khi authenticate. `loadUserByUsername` trả `UserDetails` (username + hashed password + authorities). AuthenticationManager dùng nó + PasswordEncoder verify login. Custom implementation query DB của bạn. Là cầu nối giữa Spring Security và user store.

**Khó · @PreAuthorize hoạt động thế nào dưới capô? Hạn chế gì?**

Dùng Spring AOP proxy — wrap method, evaluate SpEL expression trước khi chạy. Như @Transactional, KHÔNG work với self-invocation (gọi method trong cùng class bypass proxy). Cũng không work trên `private`/`final` method (proxy không override được). SpEL evaluate runtime → typo không catch compile-time. Cẩn thận performance với complex SpEL gọi DB.

**Mock EN · "How do you implement role-based access control in Spring Boot?"**

"I store roles with each user and load them as GrantedAuthorities via a custom UserDetailsService. At the URL level I configure coarse rules in the SecurityFilterChain — for example, /api/admin requires ROLE_ADMIN. For fine-grained control I use @PreAuthorize with SpEL on service methods, which lets me check ownership like 'hasRole(ADMIN) or #resource.owner == authentication.name'. Passwords are always BCrypt-hashed. I enable method security with @EnableMethodSecurity, and I'm careful that @PreAuthorize, being AOP-based, doesn't work on self-invoked or private methods."

### 🧠 Quiz Nhanh

1. Khác biệt giữa Role và Authority trong Spring Security là gì?
   - [x] Authority là quyền fine-grained, Role là nhóm quyền có prefix ROLE_
   - [ ] Role là quyền fine-grained, Authority là nhóm quyền coarse-grained
   - [ ] Cả hai hoàn toàn giống nhau, chỉ khác tên gọi
   - [ ] Authority luôn có prefix ROLE_, Role thì không
   💡 Authority là quyền cụ thể (fine-grained); Role là nhóm quyền có prefix ROLE_ (coarse-grained); hasRole("ADMIN") tự thêm prefix thành ROLE_ADMIN.

2. Tại sao BCrypt được thiết kế cố tình chậm?
   - [ ] Để tiết kiệm CPU của server
   - [x] Để chống brute-force, giới hạn số lần thử password mỗi giây
   - [ ] Để mã hóa hai chiều, có thể giải mã ngược
   - [ ] Vì nó không dùng salt nên phải bù bằng tốc độ
   💡 BCrypt chậm (cost factor) khiến attacker chỉ thử được vài nghìn password/giây thay vì hàng tỷ với hash nhanh như MD5; salt tự embed chống rainbow table.

3. Hạn chế nào ĐÚNG về @PreAuthorize do cơ chế AOP proxy?
   - [ ] Nó hoạt động tốt với cả method private và final
   - [ ] Nó được kiểm tra tại compile-time nên bắt typo sớm
   - [x] Nó không hoạt động với self-invocation (gọi method trong cùng class)
   - [ ] Nó chỉ chạy sau khi method đã thực thi xong
   💡 @PreAuthorize dùng AOP proxy như @Transactional, nên self-invocation bypass proxy, và không work trên method private/final; SpEL evaluate runtime nên typo không bắt được compile-time.

- **🧩 LeetCode:** Word Pattern (LC #290) — Easy — hashmap

- **🤖 AI Tools:** Dùng AI review security config cho vulnerabilities — sai role prefix, endpoint hở, plain password.

- **📚 Tài Nguyên:** Spring Security "Method Security" + OWASP password storage cheat sheet.

## 💪 Ngày 4 · JUnit 5: @Test, assertions, lifecycle, @ParameterizedTest, AAA

**25/06 — Thứ 5** · **FULL** · ⏱ 30 phút sáng + 2h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Parroto Shadowing · 20 phút*
>
> **Câu shadowing:** "A unit test verifies a single piece of behavior in isolation", "Arrange, act, assert is the standard test structure", "Parameterized tests run the same test with different inputs". **Vocalmax:** unit test, assertion, fixture, lifecycle, parameterized, arrange act assert, edge case, coverage, isolation, regression.

### 📖 Lý Thuyết Cốt Lõi

**JUnit 5 cơ bản**

`@Test` đánh dấu test method. Assertions: `assertEquals(expected, actual)`, `assertTrue`, `assertNull`, `assertThrows(Ex.class, () -> ...)`, `assertAll` (nhóm). Package `org.junit.jupiter.api`. Test class không cần public (JUnit 5). `assertThrows` test exception.

**Lifecycle annotations**

`@BeforeEach` (chạy trước MỖI test — setup fixture), `@AfterEach` (cleanup), `@BeforeAll`/`@AfterAll` (1 lần cho cả class, phải static). Mỗi test method tạo instance mới (isolation). `@DisplayName` đặt tên readable. `@Disabled` skip test.

**AAA pattern (Arrange-Act-Assert)**

Cấu trúc test rõ ràng: Arrange (setup data + mocks), Act (gọi method test), Assert (verify kết quả). Mỗi test 1 behavior. Tên test mô tả: `should_ReturnStudent_When_IdExists`. Given-When-Then là biến thể (BDD style).

**@ParameterizedTest**

Chạy cùng test với nhiều inputs. `@ValueSource(ints = {1,2,3})`, `@CsvSource({"1,2,3", "4,5,9"})`, `@MethodSource` (data từ method). Giảm code lặp, test nhiều edge cases. `@ParameterizedTest` thay `@Test`.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
class StudentServiceTest {

    private StudentService service;

    @BeforeEach
    void setUp() {
        service = new StudentService(); // fresh instance per test
    }

    @Test
    @DisplayName("should calculate average GPA correctly")
    void shouldCalculateAverageGpa() {
        // Arrange
        List<Double> gpas = List.of(3.0, 4.0, 3.5);
        // Act
        double avg = service.calculateAverage(gpas);
        // Assert
        assertEquals(3.5, avg, 0.001);
    }

    @Test
    void shouldThrowWhenListEmpty() {
        assertThrows(IllegalArgumentException.class,
            () -> service.calculateAverage(List.of()));
    }

    @ParameterizedTest
    @CsvSource({ "3.0, true", "1.5, false", "2.0, true" })
    void shouldDeterminePassingStatus(double gpa, boolean expected) {
        assertEquals(expected, service.isPassing(gpa));
    }

    @Test
    void shouldValidateAllFields() {
        Student s = new Student("Long", "long@x.com", 3.5);
        assertAll("student",
            () -> assertEquals("Long", s.getName()),
            () -> assertTrue(s.getGpa() > 0),
            () -> assertNotNull(s.getEmail())
        );
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Viết test class cho `StudentService` với `@BeforeEach` setup + 3 test methods (AAA).
2. Test exception bằng `assertThrows`, verify message.
3. Dùng `@ParameterizedTest` + `@CsvSource` test `isPassing` với 5 cases.
4. Dùng `assertAll` verify nhiều fields cùng lúc.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Unit test là gì? Tại sao quan trọng?**

Test 1 đơn vị code (method/class) ISOLATED khỏi dependencies. Quan trọng: bắt bug sớm, làm tài liệu sống (test mô tả behavior), enable refactoring an toàn (regression detection), tăng confidence khi deploy. Fast + repeatable. Khác integration test (test nhiều components together).

**Dễ · @BeforeEach vs @BeforeAll khác nhau?**

`@BeforeEach`: chạy TRƯỚC MỖI test method (setup fresh fixture, đảm bảo isolation). `@BeforeAll`: chạy 1 LẦN trước tất cả tests trong class (phải static — vì chạy trước khi tạo instance). Dùng @BeforeEach cho mutable state, @BeforeAll cho expensive shared setup (DB connection).

**Trung · AAA pattern là gì? Tại sao nên theo?**

Arrange (chuẩn bị data + mocks) - Act (gọi method cần test) - Assert (kiểm tra kết quả). Giúp test rõ ràng, dễ đọc, mỗi phần 1 mục đích. Mỗi test nên test 1 behavior. Tên test mô tả: should_X_when_Y. Test dễ maintain + người khác hiểu nhanh.

**Trung · assertThrows hoạt động thế nào? Tại sao không dùng try-catch?**

`assertThrows(Exception.class, () -> code)` verify code throw đúng exception type, trả về exception để assert message. Sạch hơn try-catch (try-catch dễ quên `fail()` nếu không throw → false pass). assertThrows tường minh: test PHẢI throw, nếu không → test fail tự động.

**Trung · @ParameterizedTest giúp gì? Khi nào dùng?**

Chạy cùng logic test với nhiều bộ input → giảm code lặp, test nhiều edge cases gọn gàng. Sources: @ValueSource (1 param đơn giản), @CsvSource (nhiều params), @MethodSource (complex objects), @EnumSource. Dùng khi: test boundary values, nhiều input-output pairs cùng logic (vd validation rules).

**Khó · Test isolation là gì? JUnit đảm bảo thế nào? Pitfalls?**

Mỗi test độc lập, không phụ thuộc thứ tự/state test khác. JUnit tạo INSTANCE MỚI của test class cho mỗi test method (default lifecycle PER_METHOD) → instance fields reset. Pitfalls: static mutable state (shared, leak giữa tests), external state (DB, files — cần cleanup @AfterEach), test order dependency (anti-pattern). Shared expensive resource: @BeforeAll + cleanup cẩn thận.

**Mock EN · "How do you write good unit tests?"**

"I follow the Arrange-Act-Assert structure so each test is readable and focused on one behavior. I name tests descriptively, like 'shouldThrowWhenGpaIsNegative', so failures are self-documenting. I test the happy path plus edge cases and error conditions, using parameterized tests to cover multiple inputs without duplication. I keep tests isolated — no shared mutable state, fresh fixtures via @BeforeEach — so they can run in any order. Good unit tests are fast, deterministic, and serve as living documentation that makes refactoring safe."

### 🧠 Quiz Nhanh

1. Khác biệt giữa @BeforeEach và @BeforeAll là gì?
   - [ ] @BeforeEach chạy 1 lần cho cả class, @BeforeAll chạy trước mỗi test
   - [x] @BeforeEach chạy trước MỖI test method, @BeforeAll chạy 1 lần và phải static
   - [ ] Cả hai đều chạy sau mỗi test method
   - [ ] @BeforeAll chạy trước mỗi test và không cần static
   💡 @BeforeEach chạy trước mỗi test (setup fresh fixture đảm bảo isolation); @BeforeAll chạy đúng 1 lần trước cả class và phải static.

2. Cách nào ĐÚNG để test rằng một method ném exception trong JUnit 5?
   - [ ] Dùng @Test(expected = ...) như JUnit 4
   - [ ] Bọc trong try-catch và không cần gọi fail()
   - [x] Dùng assertThrows(Exception.class, () -> code)
   - [ ] Dùng assertEquals với exception message
   💡 assertThrows verify code throw đúng exception type và trả về exception để assert message; sạch hơn try-catch (try-catch dễ quên fail() gây false pass).

3. JUnit đảm bảo test isolation bằng cách nào (default lifecycle)?
   - [x] Tạo instance MỚI của test class cho mỗi test method
   - [ ] Dùng chung một instance cho tất cả test methods
   - [ ] Chạy các test theo thứ tự alphabet để tránh xung đột
   - [ ] Tự động xóa mọi static field giữa các test
   💡 Default lifecycle PER_METHOD tạo instance mới mỗi test nên instance fields reset; pitfall là static mutable state vẫn bị share giữa các test.

- **🧩 LeetCode:** Merge Sorted Array (LC #88) — Easy — two pointers

- **🤖 AI Tools:** Dùng AI generate test cases + edge cases cho 1 method có sẵn.

- **📚 Tài Nguyên:** JUnit 5 User Guide + "Practical Unit Testing".

## ⚡ Ngày 5 · Mockito + Spring test slices

**26/06 — Thứ 6** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Vocalmax + Parroto · 15 phút*
>
> **Vocalmax 10 từ:** mock, stub, spy, verify, dependency, isolation, behavior, interaction, test slice, integration. **Parroto shadow:** "Mockito lets you replace dependencies with controllable fake objects."

### 📖 Lý Thuyết Cốt Lõi

**Tại sao Mockito**

Unit test cần isolate class khỏi dependencies (DB, external API). Mock = fake object thay dependency thật, control behavior. `@Mock` tạo mock, `@InjectMocks` inject mocks vào class under test. `@ExtendWith(MockitoExtension.class)`. Test logic không cần DB thật → nhanh + deterministic.

**when/thenReturn + verify**

Stub: `when(repo.findById(1L)).thenReturn(Optional.of(student))` định nghĩa mock trả gì. Verify interaction: `verify(repo).save(any())` kiểm tra method được gọi. `verify(repo, times(2))`, `never()`, `verifyNoInteractions()`. `thenThrow` cho test error path.

**Mock vs Stub vs Spy**

Stub: cung cấp canned answers (when/thenReturn). Mock: stub + verify interactions. Spy: wrap object THẬT, override 1 phần (`@Spy`) — phần không stub gọi real method. ArgumentCaptor: capture args truyền vào mock để assert. `any()`, `eq()`, `anyString()` matchers.

**Spring test slices**

`@WebMvcTest`: chỉ load web layer (controller + MockMvc), mock service. `@DataJpaTest`: chỉ JPA layer (repository + H2 in-memory). `@SpringBootTest`: full context (integration). Slices nhanh hơn full context. `@MockBean` inject mock vào Spring context (khác `@Mock` thuần Mockito).

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository repository; // fake dependency

    @Mock
    private EmailService emailService;

    @InjectMocks
    private StudentService service; // mocks injected here

    @Test
    void shouldReturnStudentWhenExists() {
        // Arrange — stub the mock
        Student student = new Student("Long", "long@x.com", 3.5);
        when(repository.findById(1L)).thenReturn(Optional.of(student));

        // Act
        StudentDto result = service.findById(1L);

        // Assert
        assertEquals("Long", result.name());
        verify(repository).findById(1L); // verify interaction
    }

    @Test
    void shouldSendEmailOnCreate() {
        when(repository.save(any(Student.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        service.create(new CreateRequest("Long", "long@x.com", 3.5));

        verify(emailService).sendWelcome("long@x.com"); // verify side effect
    }

    @Test
    void shouldThrowWhenNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(StudentNotFoundException.class, () -> service.findById(99L));
    }
}
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Viết test cho `StudentService` dùng `@Mock` repository + `@InjectMocks` service.
2. Stub `findById` trả Optional.empty() → verify throw exception (error path).
3. Dùng `verify` kiểm tra `emailService.sendWelcome()` được gọi đúng args khi create.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ · Tại sao cần Mockito trong unit test?**

Để isolate class under test khỏi dependencies (DB, API, services khác). Mock = fake object control được, thay dependency thật → test chỉ logic của class đó, không phụ thuộc DB/network → nhanh, deterministic, không cần setup phức tạp. Bug ở đâu rõ ràng (không lẫn từ dependency).

**Dễ · @Mock vs @InjectMocks khác nhau?**

`@Mock`: tạo mock object cho dependency. `@InjectMocks`: tạo instance class under test và inject các @Mock vào (qua constructor/field). Vd: `@Mock repository` + `@InjectMocks service` → service được tạo với mock repository injected. Cần `@ExtendWith(MockitoExtension.class)`.

**Trung · when/thenReturn vs verify — khác mục đích thế nào?**

`when().thenReturn()`: STUB — định nghĩa mock trả gì khi gọi (setup state, kiểm tra output). `verify()`: kiểm tra INTERACTION — method có được gọi không, bao nhiêu lần, với args nào (kiểm tra behavior/side-effect). Stub cho input, verify cho output behavior. Dùng verify khi test side-effects (save, send email).

**Trung · @WebMvcTest vs @DataJpaTest vs @SpringBootTest?**

`@WebMvcTest`: load chỉ web layer (controllers + MockMvc), mock services — test request/response, validation, status codes. `@DataJpaTest`: chỉ JPA (repositories + H2) — test queries. `@SpringBootTest`: full context — integration test toàn bộ. Slices nhanh hơn (load ít beans), full context chậm nhưng test thật end-to-end.

**Khó · Mock vs Spy khác nhau? Khi nào dùng Spy? Pitfall?**

Mock: fake hoàn toàn, mọi method trả default (null/0) trừ khi stub. Spy: wrap object THẬT, gọi real method trừ khi stub override. Dùng Spy khi: test legacy code, chỉ muốn override 1 phần class, hoặc partial mocking. Pitfall: Spy gọi real method khi stub (`when(spy.method())` vẫn execute real method 1 lần) → dùng `doReturn().when(spy).method()` thay vì `when().thenReturn()` để tránh. Spy dễ gây confusion → ưu tiên Mock + refactor.

### 🧠 Quiz Nhanh

1. Vai trò của @Mock và @InjectMocks khác nhau thế nào?
   - [ ] @Mock tạo instance class under test, @InjectMocks tạo dependency giả
   - [ ] Cả hai đều tạo mock object như nhau
   - [x] @Mock tạo mock cho dependency, @InjectMocks tạo class under test và inject các mock vào
   - [ ] @InjectMocks chỉ dùng cho static method
   💡 @Mock tạo mock cho dependency; @InjectMocks tạo instance class-under-test và inject các @Mock vào (cần @ExtendWith(MockitoExtension.class)).

2. when().thenReturn() và verify() khác nhau về mục đích thế nào?
   - [x] when().thenReturn() là stub định nghĩa giá trị trả về; verify() kiểm tra method có được gọi
   - [ ] when().thenReturn() kiểm tra interaction; verify() định nghĩa giá trị trả về
   - [ ] Cả hai đều dùng để stub giá trị trả về
   - [ ] verify() dùng để tạo mock object
   💡 when().thenReturn() là stub (setup input/giá trị trả về); verify() kiểm tra interaction (method được gọi không, mấy lần, args nào) cho side-effect như save/sendEmail.

3. Spring test slice nào chỉ load JPA layer với DB in-memory để test repository?
   - [ ] @WebMvcTest
   - [ ] @SpringBootTest
   - [x] @DataJpaTest
   - [ ] @MockBean
   💡 @DataJpaTest load chỉ JPA layer (repositories + H2) để test queries; @WebMvcTest load web layer, @SpringBootTest load full context.

- **🧩 LeetCode:** First Unique Character in a String (LC #387) — Easy — hashmap

- **🤖 AI Tools:** Dùng AI generate Mockito stubs + test scenarios cho service có dependencies.

- **📚 Tài Nguyên:** Mockito docs + Baeldung "Spring Boot Testing".

## 🔥 Ngày 6 · RAG: embeddings, VectorStore, PGVector, similarity search

**27/06 — Thứ 7** · **WEEKEND** · ⏱ 4h (sáng + chiều)

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Parroto Shadowing · 30 phút*
>
> Nghe + shadow "Introduction to RAG and Vector Databases" 30 phút, practice câu phỏng vấn EN về RAG. **Vocalmax:** review 20 từ Security/Testing/RAG khó nhất tuần.

### 📖 Lý Thuyết Cốt Lõi

**RAG là gì + tại sao**

Retrieval-Augmented Generation: tìm documents liên quan từ knowledge base → inject vào prompt → LLM trả lời dựa trên data thật. Giải quyết: hallucination (LLM bịa), knowledge cutoff (data cũ), domain knowledge (LLM không biết data riêng công ty). Rẻ hơn fine-tuning, update knowledge dễ (chỉ thêm docs).

**Embeddings + similarity**

Embedding: chuyển text thành vector số (vd 1536 chiều) capture ý nghĩa ngữ nghĩa. Text giống nghĩa → vector gần nhau. Similarity search: tìm vectors gần query vector nhất (cosine similarity / Euclidean distance). `EmbeddingModel` tạo embeddings. Đây là "retrieval" trong RAG.

**VectorStore + PGVector**

VectorStore: DB lưu + search embeddings. Spring AI abstraction `VectorStore` (add documents, similaritySearch). PGVector: extension PostgreSQL lưu vectors + index (HNSW/IVFFlat) cho fast similarity search. Khác: Pinecone, Chroma, Redis. PGVector tốt vì dùng luôn Postgres có sẵn.

**RAG pipeline**

(1) Ingest: split documents thành chunks → embed → lưu VectorStore. (2) Query: embed câu hỏi → similaritySearch lấy top-K chunks liên quan → (3) Augment: nhét chunks vào prompt làm context → (4) Generate: LLM trả lời từ context. Spring AI: `QuestionAnswerAdvisor` tự động hóa retrieval + augment.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
@Service
public class IngestionService {
    private final VectorStore vectorStore; // Spring AI abstraction (PGVector backing)

    public void ingest(List<String> texts) {
        List<Document> documents = texts.stream()
            .map(Document::new) // each text becomes a Document
            .toList();
        // Spring AI: embeds each doc + stores vector in PGVector
        vectorStore.add(documents);
    }

    // Split large text into chunks before embedding
    public void ingestLargeDoc(String content) {
        var splitter = new TokenTextSplitter(); // chunk by tokens
        List<Document> chunks = splitter.apply(List.of(new Document(content)));
        vectorStore.add(chunks);
    }
}
```

```java
@RestController
@RequestMapping("/api/rag")
public class RagController {
    private final ChatClient chatClient;

    public RagController(ChatClient.Builder builder, VectorStore vectorStore) {
        this.chatClient = builder
            // Advisor auto-retrieves relevant docs + injects into prompt
            .defaultAdvisors(new QuestionAnswerAdvisor(vectorStore))
            .build();
    }

    @GetMapping("/ask")
    public String ask(@RequestParam String question) {
        return chatClient.prompt()
            .user(question)
            .call()
            .content(); // answer grounded in retrieved documents
    }
}
```

```yaml
# application.yml
spring:
  ai:
    vectorstore:
      pgvector:
        index-type: HNSW
        dimensions: 1536
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Setup PGVector (Docker: `pgvector/pgvector` image), config Spring AI VectorStore.
2. Ingest 5-10 documents (vd FAQ về Java), verify embeddings lưu vào PGVector.
3. Implement RAG query với `QuestionAnswerAdvisor`, hỏi câu liên quan documents.
4. So sánh: hỏi cùng câu KHÔNG có RAG (LLM bịa) vs CÓ RAG (trả từ docs) — thấy grounding.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (8 câu)

**Dễ · RAG là gì và giải quyết vấn đề gì?**

Retrieval-Augmented Generation: retrieve documents liên quan từ knowledge base, inject vào prompt để LLM trả lời dựa trên data thật. Giải quyết: hallucination (bịa thông tin), knowledge cutoff (LLM không biết data mới), domain knowledge (data riêng công ty LLM chưa học). Update knowledge = thêm docs, không cần retrain.

**Dễ · Embedding là gì?**

Embedding chuyển text thành vector số (vd 1536 chiều) capture ý nghĩa ngữ nghĩa. Text có nghĩa tương tự → vectors gần nhau trong không gian vector. Cho phép "semantic search" — tìm theo nghĩa, không phải keyword matching. EmbeddingModel (như text-embedding-3) tạo ra chúng.

**Trung · Similarity search hoạt động thế nào?**

Embed query thành vector → so sánh với tất cả document vectors trong store → tìm K vectors gần nhất (cosine similarity hoặc Euclidean distance). Vectors gần = nghĩa tương tự. Vector DB dùng index (HNSW/IVFFlat) để search nhanh thay vì so sánh brute-force toàn bộ. Trả top-K documents liên quan nhất.

**Trung · RAG vs Fine-tuning — khi nào dùng cái nào?**

RAG: inject knowledge runtime, update dễ (thêm docs), rẻ, grounding tốt, phù hợp factual/dynamic knowledge. Fine-tuning: retrain weights, thay đổi style/behavior, đắt + chậm, knowledge tĩnh trong weights. Dùng RAG cho: company docs, FAQ, dynamic data. Fine-tune cho: consistent format/tone không prompt được. Thường RAG đủ + rẻ hơn nhiều.

**Trung · Tại sao phải chunk documents trước khi embed?**

(1) Embedding model có giới hạn input tokens. (2) Chunk nhỏ → embedding focus 1 ý → similarity search chính xác hơn. (3) Inject chunk liên quan vào prompt thay vì cả document dài → tiết kiệm tokens + context window. Trade-off: chunk quá nhỏ mất context, quá lớn loãng nghĩa. Overlap giữa chunks giữ continuity.

**Khó · Những thách thức khi xây RAG production-grade?**

(1) Chunking strategy: size/overlap ảnh hưởng lớn retrieval quality. (2) Retrieval quality: top-K docs không liên quan → câu trả lời sai (garbage in garbage out). (3) Embedding cost + latency khi scale. (4) Stale data: docs update phải re-embed. (5) Context window: nhiều chunks → vượt limit. (6) Evaluation khó: đo retrieval relevance + answer quality. (7) Hybrid search (semantic + keyword) thường tốt hơn pure vector. (8) Re-ranking sau retrieval cải thiện precision.

**Mock EN · "Explain how you'd build a RAG system in Spring AI."**

"First, ingestion: I split documents into chunks with a TokenTextSplitter, generate embeddings via an EmbeddingModel, and store the vectors in a VectorStore backed by PGVector. At query time, the question is embedded and a similarity search retrieves the top-K most relevant chunks. Spring AI's QuestionAnswerAdvisor automates this — it retrieves relevant documents and injects them into the prompt as context, so the LLM answers grounded in real data rather than hallucinating. For production I'd tune chunk size and overlap, consider hybrid search and re-ranking, and re-embed when source documents change."

**Mock EN · "How does RAG reduce hallucination?"**

"Hallucination happens when an LLM generates plausible but false information from its parametric memory. RAG grounds the model by retrieving relevant, factual documents from a trusted knowledge base and injecting them into the prompt as context, with an instruction to answer only from that context. So instead of guessing, the model summarizes real retrieved data. It also lets me cite sources and say 'I don't know' when retrieval returns nothing relevant. It doesn't eliminate hallucination entirely — retrieval quality matters — but it dramatically improves factual accuracy for domain-specific questions."

### 🧠 Quiz Nhanh

1. RAG (Retrieval-Augmented Generation) giải quyết vấn đề gì của LLM?
   - [ ] Tăng tốc độ inference của model
   - [x] Hallucination, knowledge cutoff và thiếu domain knowledge riêng
   - [ ] Giảm kích thước của model weights
   - [ ] Loại bỏ hoàn toàn nhu cầu dùng prompt
   💡 RAG retrieve docs liên quan inject vào prompt để LLM trả lời dựa trên data thật, giải quyết hallucination, knowledge cutoff và domain knowledge riêng; update knowledge chỉ cần thêm docs.

2. Embedding trong RAG là gì?
   - [ ] Một bản tóm tắt văn bản dạng keyword
   - [ ] Bản mã hóa hai chiều của document
   - [x] Vector số capture ý nghĩa ngữ nghĩa, text giống nghĩa thì vector gần nhau
   - [ ] Chỉ số định danh duy nhất của mỗi document
   💡 Embedding chuyển text thành vector số (vd 1536 chiều) capture nghĩa ngữ nghĩa; text tương tự nghĩa → vector gần nhau, cho phép semantic search.

3. Khi nào nên chọn RAG thay vì fine-tuning?
   - [x] Khi cần inject knowledge factual/dynamic, update dễ và rẻ
   - [ ] Khi cần thay đổi style/tone cố định mà prompt không làm được
   - [ ] Khi muốn knowledge nằm cố định trong weights
   - [ ] Khi không quan tâm tới chi phí và tốc độ
   💡 RAG inject knowledge runtime, update dễ (thêm docs), rẻ, grounding tốt cho factual/dynamic data; fine-tuning đắt/chậm hợp cho style/behavior cố định.

- **🧩 LeetCode:** Group Anagrams (LC #49) — Medium — hashmap, review

- **🤖 AI Tools:** Build mini RAG over your study notes — ingest notes → hỏi đáp grounded.

- **📚 Tài Nguyên:** Spring AI "Retrieval Augmented Generation" + PGVector docs + "What is RAG" (AWS/NVIDIA blogs).

## 🎯 Ngày 7 · Spaced Review T1-T7 + Mini Project

**28/06 — CN** · **REVIEW** · ⏱ 4h (ôn tập + project)

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Mock Interview EN · 30 phút*
>
> Mock interview EN — trả lời 10 câu tuần 7 to ra tiếng Anh, record 2 câu hay nhất. Luyện STAR method kể chuyện về implement authentication/testing.

### 📖 Lý Thuyết Cốt Lõi

**Security recap**

Authn vs Authz, SecurityFilterChain, JWT (header.payload.signature, stateless, Bearer), JwtAuthenticationFilter (OncePerRequestFilter), @PreAuthorize, BCrypt password hashing, UserDetailsService.

**JWT deep recap**

3 phần, không mã hóa (chỉ encode), signature chống tamper, short expiry + refresh token, lưu httpOnly/memory không localStorage, không để PII trong payload.

**Testing recap**

JUnit 5 (@Test, assertions, lifecycle, @ParameterizedTest, AAA), Mockito (@Mock/@InjectMocks, when/thenReturn, verify, Spy), Spring slices (@WebMvcTest, @DataJpaTest, @SpringBootTest).

**RAG recap**

Embeddings (text→vector, semantic), VectorStore + PGVector, similarity search (top-K, cosine), RAG pipeline (ingest→embed→retrieve→augment→generate), QuestionAnswerAdvisor, chunking, grounding chống hallucination.

### 💻 Code Mẫu — Mini Project: Secured RAG Q&A API

```java
// Combines: JWT auth + RAG + tested with JUnit/Mockito
@RestController
@RequestMapping("/api/v1/qa")
public class SecuredRagController {

    private final ChatClient chatClient;

    public SecuredRagController(ChatClient.Builder builder, VectorStore vectorStore) {
        this.chatClient = builder
            .defaultSystem("Answer only from the provided context. If unknown, say so.")
            .defaultAdvisors(new QuestionAnswerAdvisor(vectorStore))
            .build();
    }

    // Protected: requires valid JWT
    @PostMapping("/ask")
    @PreAuthorize("hasRole('USER')")
    public QaResponse ask(@RequestBody @Valid QaRequest request) {
        String answer = chatClient.prompt()
            .user(request.question())
            .call()
            .content();
        return new QaResponse(request.question(), answer);
    }

    public record QaRequest(@NotBlank String question) {}
    public record QaResponse(String question, String answer) {}
}

// Test with Mockito + @WebMvcTest:
// @WebMvcTest(SecuredRagController.class)
// @MockBean ChatClient.Builder ... verify auth required (401 without token)
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Complete Secured RAG Q&A API: JWT auth (login → token → protected endpoint) + RAG (PGVector + QuestionAnswerAdvisor) + @PreAuthorize.
2. Viết tests: @WebMvcTest verify endpoint cần auth (401 không token), unit test service với Mockito.
3. Push GitHub với README EN: architecture (security + RAG + testing), setup (PGVector docker), API docs, test coverage note.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (10 câu)

**Dễ · Authentication vs Authorization?**

Authentication = xác thực bạn là ai (login, verify token). Authorization = xác định bạn được làm gì (roles, permissions). Authn trước, authz sau. Login = authn; chỉ admin xóa user = authz.

**Dễ · JWT gồm những phần nào và có mã hóa không?**

3 phần: header.payload.signature (Base64URL). Header = algorithm, payload = claims (user, roles, exp), signature = chống tamper. KHÔNG mã hóa — chỉ encode, decode được. Không để dữ liệu nhạy cảm trong payload.

**Dễ · @Mock vs @InjectMocks?**

@Mock tạo fake dependency. @InjectMocks tạo instance class-under-test và inject các @Mock vào. Cần @ExtendWith(MockitoExtension.class). Vd: @Mock repository + @InjectMocks service.

**Trung · Tại sao BCrypt cố tình chậm và cần salt?**

Chậm (cost factor) chống brute-force — attacker không thể thử hàng tỷ password/giây. Salt (random per password) chống rainbow table + 2 user cùng password có hash khác nhau. BCrypt embed salt trong hash. Plain text/fast hash (MD5) = vi phạm bảo mật.

**Trung · when/thenReturn vs verify trong Mockito?**

when().thenReturn() = STUB, định nghĩa mock trả gì (setup input). verify() = kiểm tra INTERACTION, method có được gọi không/bao nhiêu lần/args gì (kiểm tra behavior). Stub cho output value, verify cho side-effects (save, sendEmail).

**Trung · Embedding và similarity search trong RAG?**

Embedding = text→vector số capture nghĩa ngữ nghĩa, text giống nghĩa → vector gần nhau. Similarity search = embed query, tìm top-K document vectors gần nhất (cosine similarity), dùng index (HNSW) cho nhanh. Đây là "retrieval" — lấy docs liên quan để inject vào prompt.

**Khó · JWT có nhược điểm bảo mật gì và cách mitigate?**

(1) Không revoke được trước hết hạn → short expiry + refresh token + blacklist. (2) Bị lộ qua XSS → httpOnly cookie/memory, không localStorage. (3) Payload đọc được → không để PII. (4) Secret lộ → rotate keys, dùng RS256. (5) "alg:none" attack → luôn verify algorithm. Defense in depth.

**Khó · RAG production-grade có thách thức gì?**

Chunking strategy (size/overlap), retrieval quality (top-K sai → trả lời sai), embedding cost/latency khi scale, stale data (re-embed khi update), context window limit, evaluation khó, hybrid search (semantic+keyword) tốt hơn pure vector, re-ranking cải thiện precision.

**Mock EN · "Walk me through your Secured RAG Q&A API."**

"It layers three skills from this week. Authentication uses JWT: clients log in, receive a signed token, and send it as a Bearer token; a OncePerRequestFilter validates it and sets the SecurityContext. Authorization uses @PreAuthorize so only authenticated users with the right role can query. The RAG layer uses Spring AI's QuestionAnswerAdvisor over a PGVector store — questions are embedded, relevant chunks retrieved, and the LLM answers grounded in real context with an instruction to say 'I don't know' otherwise. I tested it with @WebMvcTest verifying unauthorized requests get 401, and Mockito unit tests for the service logic."

**Mock EN · "How do you ensure quality and security in a Spring Boot API?"**

"Security and testing go hand in hand. For security I use stateless JWT authentication, BCrypt-hashed passwords, method-level authorization with @PreAuthorize, input validation, and I follow OWASP guidance — short-lived tokens, no sensitive data in JWTs, HTTPS everywhere. For quality I write unit tests with JUnit and Mockito following Arrange-Act-Assert, isolating logic from dependencies, plus Spring test slices like @WebMvcTest and @DataJpaTest for layer-focused integration tests. I include security tests verifying protected endpoints reject unauthorized requests. Together this gives confidence the API is both correct and secure before it ships."

### 🧠 Quiz Nhanh

1. Trong Mini Project Secured RAG Q&A API, @PreAuthorize("hasRole('USER')") đóng vai trò gì?
   - [ ] Xác thực người dùng là ai (authentication)
   - [x] Phân quyền (authorization) — chỉ user có role phù hợp mới gọi được endpoint
   - [ ] Mã hóa câu hỏi trước khi gửi tới LLM
   - [ ] Tạo JWT token cho người dùng
   💡 @PreAuthorize là authorization method-level, chỉ cho user đã authenticate và có đúng role query; authentication (xác thực bạn là ai) do JWT filter đảm nhiệm trước đó.

2. Trong mini project, QuestionAnswerAdvisor trên VectorStore (PGVector) làm gì?
   - [x] Tự động retrieve docs liên quan và inject vào prompt làm context
   - [ ] Hash password người dùng trước khi lưu
   - [ ] Validate JWT signature mỗi request
   - [ ] Tạo embedding cho JWT token
   💡 QuestionAnswerAdvisor tự embed câu hỏi, similarity search lấy top-K chunks liên quan rồi inject vào prompt để LLM trả lời grounded thay vì hallucinate.

3. Để test rằng endpoint protected từ chối request không có token, cách phù hợp là gì?
   - [ ] Dùng @DataJpaTest và kiểm tra query trả về null
   - [ ] Dùng @SpringBootTest mock toàn bộ VectorStore
   - [x] Dùng @WebMvcTest verify request không token nhận 401
   - [ ] Dùng @ParameterizedTest với nhiều password
   💡 @WebMvcTest load web layer + MockMvc để verify endpoint cần auth trả 401 khi không có token; service logic test riêng bằng Mockito unit test.

- **🧩 LeetCode:** Majority Element (LC #169) — Easy — Boyer-Moore, review

- **🤖 AI Tools:** Tổng hợp security + RAG + testing trong 1 project — review architecture end-to-end.

- **📚 Tài Nguyên:** Ôn lại docs tuần 7 (Spring Security, JUnit 5, Mockito, Spring AI RAG).

## 🎯 Tổng Kết Tuần 7

### 📋 Ngân Hàng Câu Hỏi Phỏng Vấn

*Ôn lại cuối tuần — trả lời to ra, ghi âm, nghe lại.*

**Security & JWT**

- **"What's the difference between authentication and authorization?"**  
  Authentication verifies who you are (login, token validation). Authorization decides what you're allowed to do (roles, permissions). Authentication happens first, authorization second. Logging in is authentication; only admins being able to delete users is authorization.
- **"Is a JWT encrypted? What should you store in it?"**  
  No — a JWT is only Base64-encoded, not encrypted, so anyone can decode the payload. The signature only prevents tampering. Never put sensitive data like passwords in it. Store only user id, username, roles, and expiration — enough to authorize requests.
- **"Why use stateless JWT auth over sessions?"**  
  With JWT the server stores no session state; the token is self-contained and validated by signature without a database lookup. This scales horizontally easily — no shared session store or sticky sessions. The trade-off is that tokens are harder to revoke, so you use short expiry plus refresh tokens.

**Testing**

- **"What makes a good unit test?"**  
  It follows Arrange-Act-Assert, tests one behavior, has a descriptive name, and is isolated from dependencies using mocks. It covers the happy path plus edge cases and errors, runs fast and deterministically, and serves as living documentation that makes refactoring safe.
- **"when/thenReturn vs verify in Mockito?"**  
  when().thenReturn() stubs a mock — it defines what the mock returns, setting up the test's inputs. verify() checks an interaction — whether a method was called, how many times, and with what arguments, validating behavior and side effects like saving or sending email.
- **"@WebMvcTest vs @DataJpaTest vs @SpringBootTest?"**  
  @WebMvcTest loads only the web layer with MockMvc and mocked services, for testing controllers. @DataJpaTest loads only the JPA layer with an in-memory DB, for testing repositories. @SpringBootTest loads the full context for end-to-end integration tests. Slices are faster; full context is more realistic.

**RAG**

- **"What is RAG and what problem does it solve?"**  
  Retrieval-Augmented Generation retrieves relevant documents from a knowledge base and injects them into the prompt so the LLM answers from real data. It solves hallucination, knowledge cutoff, and lack of private domain knowledge — and updating knowledge just means adding documents, with no retraining needed.
- **"How does similarity search work?"**  
  The query is embedded into a vector, then compared against stored document vectors to find the K nearest by cosine similarity or distance. Vector databases use indexes like HNSW for fast search instead of brute force. The closest vectors are the most semantically relevant documents.
- **"RAG vs fine-tuning — when to use each?"**  
  RAG injects knowledge at runtime, is cheap, easy to update, and grounds answers in real data — ideal for factual and dynamic knowledge. Fine-tuning retrains the model's weights, is expensive and slow, and suits consistent style or behavior that prompting can't achieve. Usually RAG is enough and far cheaper.

### ✅ Checklist Cuối Tuần

- [ ] Hiểu authentication vs authorization, config SecurityFilterChain (public/protected endpoints)
- [ ] JWT: hiểu 3 phần, generate + validate token với jjwt
- [ ] JwtAuthenticationFilter (OncePerRequestFilter) extract + validate token, set SecurityContext
- [ ] @PreAuthorize role-based access, BCrypt password hashing, UserDetailsService
- [ ] JUnit 5: @Test, assertions, lifecycle, @ParameterizedTest, AAA pattern
- [ ] Mockito: @Mock/@InjectMocks, when/thenReturn, verify interactions
- [ ] Spring test slices: @WebMvcTest, @DataJpaTest phân biệt và dùng được
- [ ] RAG: hiểu embeddings, similarity search, RAG pipeline (ingest→retrieve→augment→generate)
- [ ] PGVector + QuestionAnswerAdvisor: ingest docs, query grounded answer
- [ ] Mini project Secured RAG Q&A API (JWT + tests + PGVector) push GitHub, README EN

> 💡 **Golden Rule Tuần 7:** Security không phải tính năng thêm vào sau — thiết kế từ đầu (authn + authz + hash password). JWT mạnh nhưng hiểu rõ trade-off (stateless = khó revoke). Test không phải gánh nặng — là lưới an toàn cho refactor + tài liệu sống. RAG biến LLM từ "kẻ bịa chuyện" thành "trợ lý có căn cứ". Senior engineer = code chạy được + an toàn + có test + đáng tin.
