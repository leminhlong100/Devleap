# 🏗️ Tuần 9 · Microservices + Docker + Concurrency · 06/07–12/07/2025

## 📅 Lịch Học Tuần 9 — Tổng Quan 7 Ngày

| Ngày | Thứ | Chế độ | Thời gian | Chủ đề |
| --- | --- | --- | --- | --- |
| 06/07 | Thứ 2 | LIGHT | 1.5h | Microservices vs Monolith: khái niệm, ưu nhược điểm, khi nào dùng |
| 07/07 | Thứ 3 | FULL | 2.5h | Inter-service communication: REST (RestClient/WebClient/Feign), service discovery |
| 08/07 | Thứ 4 | FULL | 2.5h | Spring Cloud Gateway: routing, filters, load balancing, cross-cutting concerns |
| 09/07 | Thứ 5 | FULL | 2.5h | Resilience: Circuit Breaker (Resilience4j), retry, timeout, fallback, bulkhead |
| 10/07 | Thứ 6 | LIGHT | 1.5h | Distributed concurrency: idempotency, distributed lock, eventual consistency |
| 11/07 | Thứ 7 | WEEKEND | 4h | Docker Compose multi-service: gateway + 2 services + Redis + Postgres, networking |
| 12/07 | CN | REVIEW | 4h | Spaced Review T1-T9 + Mini Project: 2-service system với Gateway + Circuit Breaker |

## ⚡ Ngày 1 · Microservices vs Monolith: Khái Niệm & Trade-offs

**06/07 — Thứ 2** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Mock Interview EN + Vocalmax · 15 phút*
>
> **🎯 Bắt đầu phase "Ứng dụng" (T9-T12):** tiếng Anh chuyển sang Mock Interview + STAR method + Business English. Mục tiêu: nói về kiến trúc hệ thống bằng tiếng Anh tự tin. **Vocalmax — 10 từ vựng (luyện phát âm + đặt câu):**  **microservice** /ˈmaɪkroʊˌsɜːrvɪs/ — dịch vụ nhỏ, độc lập, tập trung 1 nghiệp vụ. **monolith** /ˈmɒnəlɪθ/ — ứng dụng đơn khối, tất cả trong 1 deployable. **decouple** /diːˈkʌpl/ — tách rời sự phụ thuộc giữa các thành phần. **bounded context** — ranh giới nghiệp vụ rõ ràng (DDD). **scalability** /ˌskeɪləˈbɪləti/ — khả năng mở rộng quy mô. **deployment** /dɪˈplɔɪmənt/ — việc triển khai ứng dụng lên môi trường. **service boundary** — biên giới giữa các service. **distributed** /dɪˈstrɪbjutɪd/ — phân tán trên nhiều node/process. **autonomy** /ɔːˈtɒnəmi/ — tính tự chủ (deploy/own data độc lập). **resilience** /rɪˈzɪliəns/ — khả năng chịu lỗi, phục hồi.  **🎤 Mock EN (nói to ra, ghi âm):** Trả lời *"What are microservices and how do they differ from a monolith?"* trong 60–90 giây. Cấu trúc: definition → key benefit → key trade-off → when you'd choose each.

### 📖 Lý Thuyết Cốt Lõi

**1. Monolith là gì? Ưu & nhược**

Monolith là một ứng dụng đơn khối: tất cả module (user, order, payment...) chạy trong cùng một process và được deploy như một đơn vị duy nhất. **Ưu:** đơn giản để dev và debug, không có network giữa các module, transaction ACID dễ dàng, deploy chỉ 1 artifact. **Nhược:** khó scale từng phần (phải nhân bản cả app dù chỉ 1 module nóng), tight coupling khiến thay đổi nhỏ phải build/test lại toàn bộ, 1 bug memory leak có thể crash cả app, và bị khóa vào 1 tech stack.

**2. Microservices là gì? Ưu & nhược**

Microservices chia hệ thống thành nhiều service nhỏ, độc lập, mỗi service own một nghiệp vụ và giao tiếp qua mạng (REST/messaging). **Ưu:** independent deployment (deploy 1 service không đụng service khác), scale riêng từng service theo tải, mỗi team chọn tech stack phù hợp, fault isolation (1 service sập không kéo cả hệ thống). **Nhược:** distributed complexity (debug, tracing khó), network latency & failure, data consistency phải xử lý qua eventual consistency, chi phí vận hành (CI/CD, monitoring, infra) tăng mạnh.

**3. Khi nào dùng cái nào?**

**Dùng microservices khi:** team lớn cần làm việc song song không dẫm chân nhau, các phần của hệ thống có nhu cầu scale rất khác nhau, cần independent deploy để release nhanh, domain đã ổn định. **Dùng monolith khi:** team nhỏ, đang làm MVP/startup, domain chưa rõ ràng. Nguyên tắc nổi tiếng của Martin Fowler: *"Monolith First"* — bắt đầu với monolith well-structured (modular monolith), chỉ tách ra microservices khi thật sự có lý do (pain point cụ thể), vì tách sai bounded context rất tốn kém.

**4. Bounded Context (DDD) & Database per Service**

Bounded Context (từ Domain-Driven Design) là cách chia service theo ranh giới nghiệp vụ chứ không theo tầng kỹ thuật. Ví dụ: "Ordering", "Catalog", "Payment" là các bounded context riêng. Nguyên tắc cốt lõi: **database per service** — mỗi service own data của riêng nó, không service nào được truy cập DB của service khác trực tiếp. Muốn lấy data thì gọi API. Điều này đảm bảo loose coupling và autonomy, nhưng đổi lại là không còn JOIN/transaction xuyên service — phải dùng API composition hoặc saga.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```text
# ============ MONOLITH ============
#  +--------------------------------------------------+
#  |               E-COMMERCE APP (1 JVM)             |
#  |   [User]  [Catalog]  [Order]  [Payment]          |
#  |              \    |     |    /                    |
#  |              +-----------------+                  |
#  |              |  ONE DATABASE   |                  |
#  |              +-----------------+                  |
#  +--------------------------------------------------+
#   Deploy 1 lần | Scale = nhân bản cả app

# ============ MICROSERVICES ============
#                    [API Gateway]
#                         |
#     +----------+--------+--------+-----------+
#     v          v                 v           v
#  user-svc  catalog-svc       order-svc   payment-svc
#     |          |                 |           |
#   [user DB] [catalog DB]     [order DB]  [payment DB]
#   (database per service - giao tiếp qua REST/messaging)
#   Deploy/scale từng service độc lập | fault isolation
```

```yaml
# order-service/src/main/resources/application.yml
spring:
  application:
    name: order-service          # tên dùng cho service discovery
  datasource:
    url: jdbc:postgresql://localhost:5432/orderdb   # DB riêng của order
    username: order_user
    password: ${ORDER_DB_PASSWORD}

server:
  port: 8081                     # mỗi service một port riêng

# Mỗi service là 1 deployable artifact độc lập,
# có config + DB riêng, không chia sẻ schema với service khác.
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Vẽ (dạng text/ASCII) kiến trúc một hệ thống e-commerce dưới dạng **monolith**, sau đó vẽ lại dưới dạng **microservices**. Đánh dấu rõ ranh giới service và DB của từng service.
2. Cho một app đặt đồ ăn (food delivery), liệt kê **5 services** hợp lý theo bounded context, và ghi rõ **mỗi service own data gì** (ví dụ: restaurant-service own thông tin nhà hàng + menu; order-service own đơn hàng + trạng thái...).
3. Nói to ra bằng tiếng Anh (ghi âm 60s): 2 ưu điểm và 2 nhược điểm của microservices, kết thúc bằng "I'd start with a monolith because...". Nghe lại và sửa phát âm.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ · Microservices khác monolith ở điểm cốt lõi nào?**

Monolith deploy như một đơn vị duy nhất, mọi module chạy chung process và thường dùng chung một database. Microservices chia thành nhiều service nhỏ độc lập, mỗi service deploy/scale riêng, own database của mình và giao tiếp với nhau qua mạng (REST hoặc messaging). Điểm cốt lõi: microservices đánh đổi sự đơn giản trong code lấy tính độc lập trong vận hành — bạn được independent deploy và scale, nhưng phải gánh distributed complexity.

**Dễ · Khi nào nên dùng monolith thay vì microservices?**

Khi team nhỏ, đang làm MVP/startup, domain chưa rõ ràng và chưa có pain point cụ thể về scale hay deploy. Lúc đó monolith đơn giản hơn nhiều: dev nhanh, debug dễ, transaction ACID, không tốn chi phí vận hành phân tán. Theo nguyên tắc "Monolith First" của Martin Fowler, nên bắt đầu với một modular monolith well-structured, rồi mới tách ra khi thực sự gặp giới hạn.

**Trung · "Database per service" nghĩa là gì và tại sao quan trọng?**

Mỗi microservice own database riêng và không service nào được truy cập trực tiếp DB của service khác — muốn lấy data thì phải gọi API của service đó. Quan trọng vì nó đảm bảo loose coupling và autonomy: service có thể đổi schema, đổi loại DB (SQL/NoSQL) mà không phá vỡ service khác, và scale độc lập. Cái giá phải trả là mất khả năng JOIN xuyên service và transaction ACID xuyên service — phải thay bằng API composition hoặc saga pattern.

**Trung · Bounded Context là gì và liên quan thế nào tới việc chia service?**

Bounded Context là khái niệm từ Domain-Driven Design: một ranh giới rõ ràng trong đó một mô hình nghiệp vụ và ngôn ngữ chung (ubiquitous language) là nhất quán. Khi thiết kế microservices, ta nên chia service theo bounded context — tức theo ranh giới nghiệp vụ (Ordering, Catalog, Payment) chứ không theo tầng kỹ thuật (controller/service/repo). Mỗi bounded context thường tương ứng với một microservice own data của mình. Tách sai bounded context dẫn tới các service "chatty" gọi nhau liên tục, làm mất hết lợi ích của microservices.

**Khó · Những thách thức distributed nào xuất hiện khi chuyển sang microservices?**

Nhiều thách thức: (1) **Network failure & latency** — mỗi lời gọi giờ qua mạng, có thể fail/chậm, cần circuit breaker, retry, timeout. (2) **Data consistency** — không còn transaction ACID xuyên service, phải chấp nhận eventual consistency và dùng saga + compensating actions. (3) **Distributed tracing & debugging** — một request đi qua nhiều service nên cần correlation ID, tracing (Zipkin/Jaeger), centralized logging. (4) **Operational overhead** — CI/CD, service discovery, monitoring, configuration management cho hàng chục service. (5) **Testing** — integration/contract testing phức tạp hơn nhiều. Vì vậy microservices chỉ đáng khi lợi ích về scale/deploy/team lớn hơn các chi phí này.

### 🧠 Quiz Nhanh

1. Theo nguyên tắc "database per service", một service muốn lấy dữ liệu của service khác thì phải làm gì?
   - [ ] Truy cập trực tiếp vào database của service kia
   - [x] Gọi API của service đó
   - [ ] Dùng JOIN xuyên database
   - [ ] Chia sẻ chung một schema
   💡 Mỗi service own database riêng, không service nào truy cập trực tiếp DB của service khác — muốn lấy data thì gọi API, đảm bảo loose coupling và autonomy.

2. Nguyên tắc "Monolith First" của Martin Fowler khuyên điều gì?
   - [ ] Luôn bắt đầu bằng microservices để dễ scale
   - [ ] Không bao giờ tách thành microservices
   - [x] Bắt đầu với monolith well-structured, chỉ tách khi có lý do cụ thể
   - [ ] Tách microservices ngay khi team có hơn 2 người
   💡 "Monolith First" khuyên bắt đầu với một modular monolith well-structured, chỉ tách ra microservices khi thật sự có pain point cụ thể, vì tách sai bounded context rất tốn kém.

3. Bounded Context (DDD) dùng để chia service theo tiêu chí nào?
   - [ ] Theo tầng kỹ thuật (controller/service/repo)
   - [ ] Theo ngôn ngữ lập trình của mỗi team
   - [x] Theo ranh giới nghiệp vụ
   - [ ] Theo số lượng dòng code mỗi service
   💡 Bounded Context chia service theo ranh giới nghiệp vụ (Ordering, Catalog, Payment) chứ không theo tầng kỹ thuật; tách sai bounded context tạo ra các service "chatty".

- **🧩 LeetCode:** #1768 Merge Strings Alternately (Easy) — Dùng 2 con trỏ, xen kẽ ký tự từ word1 và word2; khi 1 chuỗi hết thì nối phần còn lại của chuỗi kia. Warm-up nhẹ cho ngày LIGHT.

- **🤖 AI Tools:** Hỏi ChatGPT/Claude: *"Critique my microservices decomposition for a food delivery app — am I splitting by bounded context or by technical layer?"* Yêu cầu AI chỉ ra các service "chatty" tiềm ẩn.

- **📚 Tài Nguyên:** microservices.io (Chris Richardson — patterns) · Martin Fowler "Microservices" & "MonolithFirst" (martinfowler.com) · Sách "Building Microservices" (Sam Newman).

## 💪 Ngày 2 · Inter-service Communication: REST Clients & Service Discovery

**07/07 — Thứ 3** · **FULL** · ⏱ 30 phút sáng + 2h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Mock Interview EN · 20 phút*
>
> **Vocab (communication):** synchronous, asynchronous, message broker, request-response, fire-and-forget, service discovery, load balancing, payload, latency, throughput. **🎤 STAR method (luyện cho behavioral interview):** trả lời câu *"Tell me about a time you debugged a difficult integration issue."* theo cấu trúc:  **S**ituation — bối cảnh ngắn gọn (1-2 câu). **T**ask — nhiệm vụ/trách nhiệm của bạn. **A**ction — bạn cụ thể đã làm gì (chiếm phần lớn câu trả lời). **R**esult — kết quả đo được (số liệu nếu có).  Ghi âm câu trả lời STAR ~90 giây, nghe lại xem "Action" có cụ thể không.

### 📖 Lý Thuyết Cốt Lõi

**1. Synchronous vs Asynchronous**

**Synchronous** (REST, gRPC): client gọi và *chờ* response — đơn giản, dễ reasoning, nhưng tạo temporal coupling (cả 2 service phải online cùng lúc) và dễ lan truyền lỗi/latency. **Asynchronous** (message queue: Kafka, RabbitMQ): producer gửi message rồi tiếp tục, consumer xử lý sau — giúp decouple, chịu tải đột biến (buffering), resilient hơn khi 1 bên down; nhưng phức tạp hơn, khó debug và phải xử lý eventual consistency. Quy tắc: dùng sync cho query cần phản hồi ngay; dùng async cho event/notification và tác vụ nền.

**2. Spring REST Clients**

**RestTemplate**: client cũ, blocking, đang ở chế độ maintenance — tránh dùng cho code mới. **WebClient**: reactive, non-blocking (Project Reactor — Mono/Flux), phù hợp khi cần concurrency cao hoặc streaming; cũng dùng được kiểu blocking. **RestClient** (Spring 6.1+): API fluent, đồng bộ, là lựa chọn hiện đại thay RestTemplate cho code blocking. **OpenFeign**: declarative — bạn chỉ định nghĩa một interface với annotation, Spring Cloud tự sinh implementation gọi HTTP; tích hợp sẵn LoadBalancer + Resilience4j.

**3. Service Discovery**

Trong môi trường động (instances lên/xuống, IP thay đổi), hardcode IP là không khả thi. Service Discovery (Eureka, Consul, hoặc Kubernetes DNS) giải quyết: mỗi service **đăng ký** chính nó vào registry khi khởi động, và khi cần gọi service khác thì **tra cứu theo tên logic** (ví dụ `order-service`) thay vì IP cụ thể. Registry trả về danh sách instance đang khỏe mạnh. Điều này cho phép thêm/bớt instance mà không cần cấu hình lại client.

**4. Load Balancing: Client-side vs Server-side**

**Server-side LB** (Nginx, AWS ELB): client gọi một địa chỉ load balancer, LB phân phối request tới các instance. **Client-side LB** (Spring Cloud LoadBalancer): client lấy danh sách instance từ service discovery rồi *tự chọn* instance (round-robin...) — không cần một hop LB trung gian, giảm latency và single point of failure. Spring Cloud LoadBalancer tích hợp với WebClient/RestClient/Feign: khi bạn gọi theo tên service, nó tự resolve và cân bằng tải giữa các instance.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// ===== WebClient (reactive, non-blocking) =====
@Configuration
public class WebClientConfig {
    @Bean
    @LoadBalanced   // bật client-side load balancing theo tên service
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}

@Service
public class OrderService {
    private final WebClient.Builder builder;
    public OrderService(WebClient.Builder builder) { this.builder = builder; }

    public Mono<Product> getProduct(Long id) {
        return builder.build()
            .get()
            .uri("http://product-service/api/products/{id}", id) // tên logic
            .retrieve()
            .bodyToMono(Product.class);        // Mono<Product> bất đồng bộ
    }
}

// ===== RestClient (Spring 6.1+, fluent, blocking) =====
@Service
public class OrderServiceSync {
    private final RestClient restClient;
    public OrderServiceSync(RestClient.Builder builder) {
        this.restClient = builder.baseUrl("http://product-service").build();
    }

    public Product getProduct(Long id) {
        return restClient.get()
            .uri("/api/products/{id}", id)
            .retrieve()
            .body(Product.class);
    }
}
```

```java
// ===== OpenFeign (declarative) =====
@FeignClient(name = "product-service")   // resolve qua service discovery
public interface ProductClient {

    @GetMapping("/api/products/{id}")
    Product getProduct(@PathVariable("id") Long id);

    @GetMapping("/api/products")
    List<Product> getAll();
}

// Bật ở class cấu hình:
@SpringBootApplication
@EnableFeignClients
public class OrderApplication { }

// Dùng như một bean bình thường:
@Service
public class CheckoutService {
    private final ProductClient productClient;
    public CheckoutService(ProductClient productClient) {
        this.productClient = productClient;
    }
    public Product fetch(Long id) {
        return productClient.getProduct(id);  // Feign tự gọi HTTP
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Tạo một **WebClient** gọi sang một service khác (dùng `@LoadBalanced` theo tên service), trả về `Mono<T>`, rồi block() để in kết quả.
2. Viết lại lời gọi đó bằng **RestClient** (Spring 6.1) kiểu blocking với API fluent. So sánh số dòng code.
3. Định nghĩa một **Feign client** interface cho product-service với 2 endpoint (getById, getAll). Bật `@EnableFeignClients` và inject vào một service.
4. Thêm xử lý **timeout**: cấu hình connect/read timeout cho WebClient (qua HttpClient) hoặc Feign (`feign.client.config`), và xử lý ngoại lệ khi timeout.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Synchronous và asynchronous communication khác nhau thế nào?**

Synchronous: client gọi và chờ response ngay (REST, gRPC) — đơn giản nhưng cả 2 service phải online cùng lúc (temporal coupling). Asynchronous: producer gửi message vào broker (Kafka/RabbitMQ) rồi đi tiếp, consumer xử lý sau — decouple tốt hơn, chịu tải đột biến, nhưng phức tạp và phải chấp nhận eventual consistency. Query cần kết quả ngay thì dùng sync; event/notification/tác vụ nền thì dùng async.

**Dễ · Service discovery giải quyết vấn đề gì?**

Trong môi trường động, instance lên/xuống liên tục và IP thay đổi, nên không thể hardcode địa chỉ. Service discovery (Eureka/Consul/K8s DNS) cho phép service đăng ký chính nó khi khởi động, và client tra cứu service khác theo tên logic thay vì IP. Registry trả về danh sách instance khỏe mạnh, nên ta có thể scale lên/xuống mà không phải cấu hình lại client.

**Trung · WebClient, RestClient và Feign — chọn cái nào và khi nào?**

**WebClient**: reactive, non-blocking — chọn khi cần concurrency cao, streaming, hoặc app đã dùng WebFlux. **RestClient** (Spring 6.1+): API fluent, blocking — lựa chọn hiện đại thay RestTemplate cho code đồng bộ thông thường. **Feign**: declarative — chỉ cần khai báo interface, ít boilerplate nhất, tích hợp sẵn LoadBalancer + Resilience4j; phù hợp khi gọi nhiều endpoint của service khác. RestTemplate đã maintenance-mode, không nên dùng cho code mới.

**Trung · Client-side và server-side load balancing khác gì?**

Server-side LB (Nginx, ELB): client gọi một địa chỉ LB, LB phân phối tới các instance — đơn giản cho client nhưng thêm một hop và là một thành phần phải quản lý. Client-side LB (Spring Cloud LoadBalancer): client lấy danh sách instance từ service discovery rồi tự chọn (round-robin...), bỏ qua hop trung gian, giảm latency và tránh single point of failure. Nhược điểm client-side là logic LB nằm trong mỗi client, khó cập nhật đồng bộ.

**Trung · Khi nào nên dùng message queue thay vì REST?**

Dùng message queue khi: (1) không cần response tức thì (gửi email, cập nhật analytics), (2) cần decouple producer/consumer để chúng scale và fail độc lập, (3) cần buffer khi tải đột biến (queue hấp thụ spike), (4) cần broadcast một event tới nhiều consumer (pub/sub), (5) cần đảm bảo eventual delivery dù consumer tạm down. Dùng REST khi cần kết quả đồng bộ ngay lập tức trong luồng request của user.

**Khó · Lời gọi sync giữa các service có rủi ro gì và xử lý ra sao?**

Rủi ro chính là **cascade failure** và latency lan truyền: nếu service A gọi B gọi C, mà C chậm/down thì A cũng bị treo thread, cạn thread pool và sập theo. Ngoài ra là temporal coupling (cả chuỗi phải online). Cách xử lý: đặt **timeout** hợp lý cho mọi lời gọi, dùng **circuit breaker** để fail fast khi downstream lỗi, **retry với backoff** cho lỗi tạm thời (chỉ với thao tác idempotent), **bulkhead** để cô lập thread pool theo dependency, và cung cấp **fallback** để graceful degradation. Khi có thể, chuyển sang async để cắt temporal coupling.

**Khó · Reactive (WebClient/WebFlux) giúp gì cho inter-service call so với blocking?**

Mô hình blocking (thread-per-request) tốn một thread cho mỗi request đang chờ I/O; khi một service gọi nhiều downstream chậm, thread pool nhanh chóng cạn. Reactive (Project Reactor, Netty) dùng non-blocking I/O với số thread nhỏ (event loop): một thread phục vụ nhiều request, thread không bị giữ trong lúc chờ network. Điều này cho throughput cao hơn nhiều với cùng tài nguyên, đặc biệt với workload I/O-bound (gọi nhiều service song song qua `Mono.zip`/`Flux`). Đổi lại, code reactive khó học, khó debug stacktrace, và phải reactive end-to-end (driver DB cũng phải non-blocking) mới hưởng trọn lợi ích.

### 🧠 Quiz Nhanh

1. Đặc điểm nào KHÔNG đúng với synchronous communication (REST/gRPC)?
   - [ ] Client gọi và chờ response ngay
   - [ ] Tạo temporal coupling (cả 2 service phải online cùng lúc)
   - [x] Producer gửi rồi tiếp tục, consumer xử lý sau
   - [ ] Dễ lan truyền lỗi/latency
   💡 "Producer gửi rồi tiếp tục, consumer xử lý sau" là đặc điểm của asynchronous (message queue); synchronous thì client gọi và chờ response ngay, gây temporal coupling.

2. Trong các Spring REST client, cái nào declarative — chỉ cần định nghĩa interface với annotation và Spring tự sinh implementation?
   - [ ] RestTemplate
   - [ ] WebClient
   - [x] OpenFeign
   - [ ] RestClient
   💡 OpenFeign là declarative: bạn chỉ định nghĩa một interface với annotation, Spring Cloud tự sinh implementation gọi HTTP, tích hợp sẵn LoadBalancer + Resilience4j.

3. Client-side load balancing (Spring Cloud LoadBalancer) khác server-side LB ở điểm cốt lõi nào?
   - [x] Client tự lấy danh sách instance từ discovery và tự chọn, bỏ hop trung gian
   - [ ] Client gọi một địa chỉ LB và LB phân phối request
   - [ ] Chỉ hoạt động với RestTemplate
   - [ ] Không cần service discovery
   💡 Client-side LB lấy danh sách instance từ service discovery rồi tự chọn (round-robin...), không cần hop LB trung gian, giảm latency và single point of failure.

- **🧩 LeetCode:** #200 Number of Islands (Medium) — DFS/BFS trên grid, đánh dấu visited. Liên hệ: duyệt graph là nền tảng cho dependency/service graph sau này.

- **🤖 AI Tools:** Hỏi AI: *"Show me the same downstream call written in WebClient, RestClient, and Feign side by side, and explain the trade-offs."* Sau đó tự gõ lại từng phiên bản.

- **📚 Tài Nguyên:** Spring docs: RestClient & WebClient · Spring Cloud OpenFeign reference · Spring Cloud LoadBalancer docs · microservices.io "Service Discovery".

## 💪 Ngày 3 · Spring Cloud Gateway: Routing, Filters & Cross-cutting

**08/07 — Thứ 4** · **FULL** · ⏱ 30 phút sáng + 2h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Mock Interview EN · 20 phút*
>
> **Vocab (gateway):** entry point, routing, predicate, filter, rate limiting, cross-cutting concern, throttle, gateway, downstream, intercept. **🎤 Mock EN:** trả lời *"How would you handle authentication across many microservices?"* trong 90 giây. Gợi ý cấu trúc câu trả lời: centralized validation at the gateway → propagate identity downstream → services trust the gateway. Ghi âm và nghe lại độ trôi chảy.

### 📖 Lý Thuyết Cốt Lõi

**1. API Gateway Pattern**

API Gateway là **single entry point** cho mọi client request vào hệ thống microservices. Thay vì client phải biết địa chỉ từng service, client chỉ gọi gateway, và gateway route request tới service phù hợp. Gateway tập trung xử lý các **cross-cutting concern**: authentication/authorization, rate limiting, logging, CORS, request/response transformation. Lợi ích: ẩn cấu trúc nội bộ, giảm số lần round-trip cho client (aggregation), và tránh lặp lại logic chung ở mọi service.

**2. Spring Cloud Gateway**

Spring Cloud Gateway là gateway non-blocking, **built trên Spring WebFlux + Netty** (reactive), chịu được throughput cao với ít thread. Cấu hình xoay quanh khái niệm **Route**: mỗi route gồm một `id`, một `uri` đích, một tập **predicates** (điều kiện để match request) và một tập **filters** (biến đổi request/response). Có thể cấu hình route bằng YAML hoặc bằng Java (`RouteLocator` bean) cho logic phức tạp.

**3. Predicates & Filters**

**Predicates** quyết định request có khớp route không: `Path` (theo URL), `Method` (GET/POST), `Header`, `Host`, `Query`, `After/Before/Between` (theo thời gian). **Filters** biến đổi request/response: `AddRequestHeader`, `RewritePath`, `StripPrefix`, `CircuitBreaker`, `RequestRateLimiter`, `Retry`. Filter có thể là pre (trước khi forward) hoặc post (sau khi nhận response). Kết hợp predicate + filter cho phép định tuyến và xử lý linh hoạt.

**4. Cross-cutting concerns tại Gateway**

Đặt các mối quan tâm chung ở gateway để không lặp lại ở mọi service: **Centralized JWT validation** — gateway verify token một lần, nếu hợp lệ thì forward kèm thông tin user (header) xuống service; service tin tưởng gateway. **Rate limiting** — dùng `RequestRateLimiter` với backend Redis (token bucket) để chống abuse/DDoS. **CORS** cấu hình tập trung. **Centralized logging/tracing** — gán correlation ID cho mỗi request. Lưu ý: không nhồi quá nhiều business logic vào gateway để tránh nó thành "monolith mới".

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```yaml
# gateway/src/main/resources/application.yml
spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      routes:
        - id: order-route
          uri: lb://order-service        # lb:// = load-balanced theo discovery
          predicates:
            - Path=/api/orders/**         # chỉ match path này
            - Method=GET,POST
          filters:
            - StripPrefix=1               # bỏ /api trước khi forward
            - AddRequestHeader=X-Gateway, true
            - name: CircuitBreaker
              args:
                name: orderCB
                fallbackUri: forward:/fallback/orders
            - name: RequestRateLimiter    # rate limit bằng Redis
              args:
                redis-rate-limiter.replenishRate: 10   # 10 req/s
                redis-rate-limiter.burstCapacity: 20

        - id: product-route
          uri: lb://product-service
          predicates:
            - Path=/api/products/**
          filters:
            - StripPrefix=1

      default-filters:
        - DedupeResponseHeader=Access-Control-Allow-Origin
```

```java
// Cấu hình route bằng Java (RouteLocator) cho logic phức tạp
@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("order-route", r -> r
                .path("/api/orders/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Gateway", "true")
                    .circuitBreaker(c -> c
                        .setName("orderCB")
                        .setFallbackUri("forward:/fallback/orders")))
                .uri("lb://order-service"))
            .route("product-route", r -> r
                .path("/api/products/**")
                .filters(f -> f.stripPrefix(1))
                .uri("lb://product-service"))
            .build();
    }
}

// Fallback endpoint khi circuit mở
@RestController
class FallbackController {
    @GetMapping("/fallback/orders")
    Mono<String> orderFallback() {
        return Mono.just("Order service is temporarily unavailable");
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Cấu hình 2 **routes** trong gateway (order & product), mỗi route match theo `Path` và forward tới service tương ứng bằng `lb://`.
2. Thêm một **filter** `AddRequestHeader` và `RewritePath`/`StripPrefix`; kiểm tra header tới đúng service đích.
3. Cài **JWT validation** tập trung tại gateway: viết một `GlobalFilter` verify token; nếu hợp lệ thì gắn header `X-User-Id` xuống downstream, nếu không thì trả 401.
4. Bật **rate limiting** với `RequestRateLimiter` + Redis (replenishRate/burstCapacity), test bằng cách bắn nhiều request và quan sát HTTP 429.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · API Gateway pattern là gì và giải quyết vấn đề gì?**

API Gateway là single entry point cho mọi client request vào hệ microservices. Client chỉ gọi gateway, gateway route tới service phù hợp. Nó giải quyết: ẩn cấu trúc nội bộ (client không cần biết địa chỉ từng service), tập trung cross-cutting concern (auth, rate limit, logging, CORS) thay vì lặp ở mọi service, và có thể aggregate nhiều lời gọi để giảm round-trip cho client (đặc biệt hữu ích cho mobile).

**Dễ · Predicate và Filter trong Spring Cloud Gateway khác nhau thế nào?**

Predicate là điều kiện để quyết định một request có khớp route hay không (Path, Method, Header, Host, thời gian...) — nó chỉ trả về true/false. Filter là thứ biến đổi request hoặc response khi đã match route (AddRequestHeader, RewritePath, StripPrefix, CircuitBreaker, RequestRateLimiter). Nói gọn: predicate quyết định "đi route nào", filter quyết định "xử lý gì trên đường đi".

**Trung · Tại sao Spring Cloud Gateway lại reactive (WebFlux/Netty)?**

Gateway là điểm nghẽn lưu lượng: mọi request đi qua nó, và phần lớn công việc là I/O-bound (chờ downstream service trả về). Mô hình blocking sẽ tốn một thread cho mỗi request đang chờ, nhanh cạn thread pool dưới tải cao. Reactive non-blocking (Netty event loop) cho phép một số ít thread phục vụ rất nhiều request đồng thời, đạt throughput cao hơn với ít tài nguyên — đúng nhu cầu của một gateway.

**Trung · Centralized JWT validation tại gateway hoạt động ra sao?**

Gateway có một GlobalFilter chặn mọi request, verify chữ ký + hạn của JWT một lần. Nếu hợp lệ, gateway trích thông tin user và gắn vào header (ví dụ X-User-Id, X-Roles) rồi forward xuống downstream; downstream tin tưởng gateway (mạng nội bộ đã được bảo vệ) nên không cần verify lại token đầy đủ. Lợi ích: không lặp logic auth ở mọi service. Cần lưu ý zero-trust: downstream vẫn nên kiểm tra header có đến từ gateway không, hoặc tự verify token nếu yêu cầu bảo mật cao.

**Trung · Rate limiting tại gateway thực hiện thế nào và tại sao cần Redis?**

Dùng filter `RequestRateLimiter` với thuật toán token bucket: cấu hình replenishRate (token thêm mỗi giây) và burstCapacity (số token tối đa). Khi hết token, request bị trả về HTTP 429 Too Many Requests. Cần Redis vì gateway thường chạy nhiều instance — counter phải được chia sẻ tập trung để rate limit là chính xác toàn cục, không phải mỗi instance đếm riêng. KeyResolver xác định giới hạn theo gì (theo user, theo IP, theo API key).

**Khó · API Gateway khác Load Balancer ở điểm nào?**

Load Balancer hoạt động chủ yếu ở tầng thấp (L4/L7), nhiệm vụ là phân phối lưu lượng tới nhiều instance của *cùng một* service để cân tải và đảm bảo availability — nó không hiểu nghiệp vụ. API Gateway hoạt động ở tầng ứng dụng (L7), hiểu API: nó route theo path/method tới *các service khác nhau*, và xử lý cross-cutting concern (auth, rate limit, transformation, aggregation, circuit breaking). Thực tế chúng bổ sung nhau: gateway thường đứng sau một load balancer, và bản thân gateway có thể dùng client-side load balancing để gọi downstream.

**Khó · Gateway có thể trở thành single point of failure / bottleneck không? Xử lý sao?**

Có — vì mọi traffic đi qua nó. Để tránh: (1) chạy **nhiều instance gateway** sau một load balancer (stateless, scale ngang được). (2) Giữ gateway **nhẹ** — chỉ routing + cross-cutting, không nhồi business logic. (3) Dùng reactive để chịu throughput cao. (4) Đặt **circuit breaker + timeout** trên các route để một downstream lỗi không kéo gateway sập. (5) Cẩn thận với rate limiter dùng Redis — Redis cũng phải HA. (6) Có thể dùng nhiều gateway chuyên biệt (Backend-for-Frontend) thay vì một gateway khổng lồ. Mục tiêu là gateway không bao giờ là điểm chết duy nhất.

### 🧠 Quiz Nhanh

1. Trong Spring Cloud Gateway, thành phần nào quyết định một request có khớp route hay không?
   - [ ] Filter
   - [x] Predicate
   - [ ] RouteLocator
   - [ ] Netty handler
   💡 Predicate là điều kiện (Path, Method, Header, Host, thời gian...) quyết định request có khớp route không; Filter mới là thứ biến đổi request/response khi đã match.

2. Tại sao rate limiting tại gateway cần backend Redis?
   - [ ] Vì Redis nhanh hơn việc đọc file cấu hình
   - [x] Vì gateway chạy nhiều instance nên counter phải được chia sẻ tập trung để rate limit chính xác toàn cục
   - [ ] Vì Spring Cloud Gateway không hỗ trợ rate limit nếu thiếu Redis
   - [ ] Vì Redis tự động sinh JWT token
   💡 Gateway thường chạy nhiều instance; counter phải chia sẻ tập trung qua Redis để rate limit chính xác toàn cục thay vì mỗi instance đếm riêng.

3. Tại sao Spring Cloud Gateway được xây dựng theo mô hình reactive (WebFlux/Netty)?
   - [ ] Vì reactive giúp code dễ debug hơn blocking
   - [ ] Vì nó bắt buộc để dùng circuit breaker
   - [x] Vì gateway là điểm nghẽn I/O-bound, non-blocking cho phép ít thread phục vụ nhiều request, đạt throughput cao
   - [ ] Vì Netty là cách duy nhất để route theo path
   💡 Mọi request đi qua gateway và phần lớn là I/O-bound; reactive non-blocking (Netty event loop) cho phép ít thread phục vụ rất nhiều request đồng thời, throughput cao với ít tài nguyên.

- **🧩 LeetCode:** #207 Course Schedule (Medium) — Topological sort / phát hiện chu trình bằng BFS (Kahn) hoặc DFS. Liên hệ: phát hiện circular dependency giữa service.

- **🤖 AI Tools:** Hỏi AI: *"Write a Spring Cloud Gateway GlobalFilter that validates a JWT and forwards X-User-Id downstream, returning 401 if invalid."* Rồi review từng dòng và tự gõ lại.

- **📚 Tài Nguyên:** Spring Cloud Gateway reference docs (routes/predicates/filters) · microservices.io "API Gateway" pattern · Bài về Backend-for-Frontend (BFF).

## 💪 Ngày 4 · Resilience: Circuit Breaker với Resilience4j

**09/07 — Thứ 5** · **FULL** · ⏱ 30 phút sáng + 2h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Mock Interview EN · 20 phút*
>
> **Vocab (resilience):** circuit breaker, fallback, graceful degradation, cascade failure, retry, backoff, timeout, bulkhead, fail fast, fault tolerance. **🎤 Mock EN:** trả lời *"What happens in your system when a downstream service goes down?"* trong 90 giây. Gợi ý: circuit breaker opens → fail fast → return fallback → degrade gracefully → recover when half-open succeeds. Ghi âm, tự chấm độ rõ ràng.

### 📖 Lý Thuyết Cốt Lõi

**1. Circuit Breaker Pattern (3 states)**

Circuit breaker bảo vệ hệ thống khỏi gọi mãi một dependency đang lỗi. Ba trạng thái: **CLOSED** — bình thường, request đi qua; theo dõi tỉ lệ lỗi. **OPEN** — khi tỉ lệ lỗi vượt ngưỡng, breaker mở; mọi request *fail fast* ngay (không gọi downstream) và trả fallback. Sau một khoảng thời gian chờ, chuyển sang **HALF_OPEN** — cho qua vài request thử; nếu thành công thì về CLOSED, nếu vẫn lỗi thì quay lại OPEN. Mục tiêu: ngăn **cascade failure** và cho downstream thời gian hồi phục.

**2. Resilience4j — các module**

Resilience4j là thư viện fault-tolerance nhẹ, thiết kế functional, thay thế Hystrix (đã ngừng phát triển). Các decorator chính qua annotation: `@CircuitBreaker` (ngắt mạch), `@Retry` (thử lại lỗi tạm thời), `@RateLimiter` (giới hạn số lời gọi), `@Bulkhead` (cô lập tài nguyên/thread pool theo dependency), `@TimeLimiter` (giới hạn thời gian cho lời gọi bất đồng bộ). Cấu hình qua `application.yml`, và các decorator có thể chồng lên nhau theo thứ tự định nghĩa.

**3. Fallback & Graceful Degradation**

Fallback là phương án dự phòng khi lời gọi thất bại (do circuit mở, timeout, hay exception). Thay vì lỗi cho user, ta trả về một giá trị mặc định, dữ liệu cache cũ, hoặc một response rút gọn — đây là **graceful degradation**: hệ thống vẫn chạy với chức năng giảm bớt thay vì sập hoàn toàn. Ví dụ: product-service down → trả về danh sách sản phẩm từ cache hoặc một thông báo "tạm thời không hiển thị đánh giá". Fallback method trong Resilience4j phải cùng signature + thêm tham số `Throwable`.

**4. Retry, Timeout & Bulkhead**

**Retry**: thử lại lỗi tạm thời (network glitch) với *exponential backoff* để tránh dồn tải; chỉ retry thao tác **idempotent**. **Timeout**: luôn đặt giới hạn thời gian — fail fast còn hơn treo thread chờ vô hạn. **Bulkhead**: cô lập tài nguyên (thread pool/semaphore) riêng cho mỗi dependency, để một dependency chậm không nuốt hết thread và làm sập cả service (ví von vách ngăn khoang tàu). Triết lý chung: **fail fast** để tránh **cascade failure** lan truyền khắp hệ thống.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// @CircuitBreaker + @Retry + fallback method
@Service
public class ProductGateway {

    private final ProductClient client;
    public ProductGateway(ProductClient client) { this.client = client; }

    @CircuitBreaker(name = "productCB", fallbackMethod = "getProductFallback")
    @Retry(name = "productRetry")
    public Product getProduct(Long id) {
        return client.getProduct(id);   // có thể ném exception khi service down
    }

    // fallback: cùng signature + tham số Throwable cuối
    public Product getProductFallback(Long id, Throwable ex) {
        // graceful degradation: trả product rút gọn / từ cache
        return new Product(id, "Unavailable", 0.0);
    }
}

// TimeLimiter cho lời gọi bất đồng bộ (trả CompletableFuture)
@TimeLimiter(name = "productCB")
@CircuitBreaker(name = "productCB", fallbackMethod = "asyncFallback")
public CompletableFuture<Product> getProductAsync(Long id) {
    return CompletableFuture.supplyAsync(() -> client.getProduct(id));
}

public CompletableFuture<Product> asyncFallback(Long id, Throwable ex) {
    return CompletableFuture.completedFuture(new Product(id, "Unavailable", 0.0));
}
```

```yaml
# application.yml — cấu hình Resilience4j
resilience4j:
  circuitbreaker:
    instances:
      productCB:
        sliding-window-size: 10           # xét 10 lời gọi gần nhất
        failure-rate-threshold: 50        # >50% lỗi thì OPEN
        wait-duration-in-open-state: 10s  # chờ 10s rồi sang HALF_OPEN
        permitted-number-of-calls-in-half-open-state: 3
        slow-call-duration-threshold: 2s  # call > 2s tính là "slow"
        slow-call-rate-threshold: 80
  retry:
    instances:
      productRetry:
        max-attempts: 3
        wait-duration: 500ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2  # 500ms -> 1s -> 2s
  timelimiter:
    instances:
      productCB:
        timeout-duration: 3s
  bulkhead:
    instances:
      productCB:
        max-concurrent-calls: 20          # cô lập tối đa 20 call đồng thời
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Bọc một lời gọi downstream bằng `@CircuitBreaker` + một **fallback method** trả về dữ liệu mặc định; cấu hình ngưỡng failure-rate trong yml.
2. Thêm `@Retry` với **exponential backoff** (max-attempts=3, multiplier=2); log mỗi lần retry để quan sát khoảng cách thời gian.
3. Đặt `@TimeLimiter` (timeout 3s) cho một lời gọi async chậm và xác nhận fallback được kích hoạt khi quá hạn.
4. Viết một test: làm cho downstream luôn lỗi, gọi nhiều lần và quan sát circuit chuyển CLOSED → OPEN (request bắt đầu fail fast ngay), sau wait-duration thì HALF_OPEN.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Circuit breaker có 3 trạng thái nào và chuyển đổi ra sao?**

CLOSED (bình thường, request đi qua, theo dõi tỉ lệ lỗi), OPEN (tỉ lệ lỗi vượt ngưỡng → mở mạch, mọi request fail fast và trả fallback), HALF_OPEN (sau thời gian chờ, cho qua vài request thử). Từ HALF_OPEN: nếu thử thành công thì về CLOSED, nếu vẫn lỗi thì quay lại OPEN. Mục đích là cho downstream thời gian hồi phục và tránh dội request vào service đang chết.

**Dễ · Fallback method dùng để làm gì?**

Fallback là phương án dự phòng được gọi khi lời gọi chính thất bại (circuit mở, timeout, exception). Thay vì ném lỗi cho user, ta trả về giá trị mặc định, dữ liệu cache cũ, hoặc response rút gọn — gọi là graceful degradation. Ví dụ product-service down thì vẫn hiển thị sản phẩm nhưng ẩn phần đánh giá. Trong Resilience4j, fallback method phải cùng signature với method gốc và thêm tham số Throwable ở cuối.

**Trung · Tại sao circuit breaker giúp ngăn cascade failure?**

Khi một downstream chậm/lỗi, nếu không có gì bảo vệ, các service gọi nó sẽ giữ thread chờ, dồn ứ request, cạn thread pool và sập theo — lỗi lan ngược toàn chuỗi (cascade). Circuit breaker phát hiện tỉ lệ lỗi cao và **mở mạch**, khiến các lời gọi tiếp theo fail fast ngay lập tức (không giữ thread, không gọi downstream). Nhờ đó service gọi không bị treo, vẫn phục vụ phần còn lại, và downstream được giảm tải để hồi phục.

**Trung · Tại sao retry phải đi kèm idempotency?**

Retry tự động gửi lại request khi gặp lỗi tạm thời. Vấn đề: có thể request đã được xử lý thành công ở downstream nhưng response bị mất do network — khi retry, thao tác bị thực hiện lần nữa. Nếu thao tác không idempotent (ví dụ "trừ tiền", "tạo đơn"), retry gây side-effect kép (trừ tiền 2 lần). Vì vậy chỉ nên retry thao tác idempotent (GET, hoặc các thao tác dùng idempotency key). Ngoài ra cần exponential backoff để không dội tải vào service đang yếu.

**Trung · Bulkhead pattern là gì?**

Bulkhead (vách ngăn) cô lập tài nguyên cho từng dependency, ví von như các khoang kín của tàu thủy: một khoang ngập nước không làm chìm cả tàu. Trong service, ta cấp một thread pool/semaphore riêng cho mỗi downstream; nếu downstream A chậm và chiếm hết "khoang" của nó, các lời gọi tới B/C vẫn còn tài nguyên riêng để hoạt động. Resilience4j cung cấp `@Bulkhead` với 2 kiểu: semaphore (giới hạn số call đồng thời) và thread-pool. Nó ngăn một dependency lỗi nuốt hết tài nguyên của cả service.

**Khó · Resilience4j khác Hystrix ở điểm nào và tại sao thay thế?**

Hystrix (Netflix) đã vào maintenance mode từ 2018, không phát triển thêm. Resilience4j là thư viện hiện đại thay thế: thiết kế **functional/lightweight** (dùng higher-order functions để decorate, không ép buộc một mô hình thread cố định như Hystrix), modular (chọn riêng circuit breaker, retry, bulkhead, rate limiter...), không phụ thuộc thư viện ngoài (Hystrix kéo theo Archaius/RxJava), tích hợp tốt với Spring Boot, Micrometer metrics và reactive (Reactor). Hystrix dùng mô hình thread-pool nặng cho mọi command; Resilience4j cho phép semaphore-based isolation nhẹ hơn. Vì vậy ngày nay dự án mới dùng Resilience4j.

**Khó · Khi chồng nhiều decorator (CircuitBreaker + Retry + TimeLimiter), thứ tự áp dụng ảnh hưởng gì?**

Thứ tự rất quan trọng vì nó quyết định cái gì "bọc" cái gì. Ví dụ nếu Retry bọc ngoài CircuitBreaker, mỗi lần retry sẽ được CircuitBreaker ghi nhận và một loạt retry thất bại có thể nhanh chóng mở mạch; ngược lại nếu CircuitBreaker bọc ngoài Retry, một chu kỳ retry hoàn chỉnh mới tính là một lần lỗi cho breaker. Thông thường khuyến nghị thứ tự (từ ngoài vào trong): Retry → CircuitBreaker → RateLimiter → TimeLimiter → Bulkhead. Với async/TimeLimiter, TimeLimiter cần đặt phù hợp để timeout được tính là một "failure" cho circuit breaker. Trong Spring, thứ tự có thể chỉnh qua aspect order; cần test kỹ để hành vi đúng ý đồ — sai thứ tự dễ khiến retry vô hiệu hóa fail-fast hoặc breaker không bao giờ mở.

### 🧠 Quiz Nhanh

1. Khi circuit breaker ở trạng thái OPEN, request sẽ được xử lý thế nào?
   - [ ] Vẫn gọi downstream bình thường nhưng log thêm cảnh báo
   - [x] Fail fast ngay (không gọi downstream) và trả fallback
   - [ ] Được đưa vào queue chờ downstream hồi phục
   - [ ] Tự động retry vô hạn cho tới khi thành công
   💡 Ở trạng thái OPEN, mọi request fail fast ngay lập tức (không gọi downstream) và trả fallback, cho downstream thời gian hồi phục, tránh cascade failure.

2. Tại sao retry phải đi kèm idempotency?
   - [ ] Vì idempotency giúp retry chạy nhanh hơn
   - [ ] Vì Resilience4j yêu cầu bắt buộc
   - [x] Vì request có thể đã xử lý thành công nhưng mất response; retry thao tác không idempotent gây side-effect kép
   - [ ] Vì retry chỉ hoạt động với thao tác POST
   💡 Response có thể bị mất dù downstream đã xử lý xong; khi retry, thao tác không idempotent (trừ tiền, tạo đơn) bị thực hiện lần nữa gây side-effect kép, nên chỉ retry thao tác idempotent.

3. Yêu cầu nào đúng về fallback method trong Resilience4j?
   - [x] Cùng signature với method gốc và thêm tham số Throwable ở cuối
   - [ ] Phải là static method
   - [ ] Không được nhận tham số nào
   - [ ] Phải trả về kiểu void
   💡 Fallback method trong Resilience4j phải cùng signature với method gốc và thêm một tham số Throwable ở cuối để nhận exception gây ra failure.

- **🧩 LeetCode:** #133 Clone Graph (Medium) — DFS/BFS + HashMap lưu node đã clone để tránh vòng lặp vô hạn. Tư duy graph traversal có visited-set, giống tránh retry storm.

- **🤖 AI Tools:** Hỏi AI: *"Explain the correct aspect order when stacking @Retry, @CircuitBreaker and @TimeLimiter in Resilience4j, with a concrete failure scenario for a wrong order."*

- **📚 Tài Nguyên:** Resilience4j official docs (resilience4j.readme.io) · Spring Cloud CircuitBreaker reference · Bài "Release It!" (Michael Nygard) về stability patterns.

## ⚡ Ngày 5 · Distributed Concurrency: Idempotency, Lock & Consistency

**10/07 — Thứ 6** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Mock Interview EN + Vocalmax · 15 phút*
>
> **Vocalmax — vocab phân tán:** idempotency, distributed lock, eventual consistency, strong consistency, race condition, partition tolerance, compensating action, choreography, orchestration, replica. **🎤 Mock EN:** trả lời *"How do you make sure a payment isn't charged twice on a retry?"* trong 60–90 giây. Gợi ý: idempotency key → store processed keys → return cached result on duplicate. Ghi âm, nghe lại.

### 📖 Lý Thuyết Cốt Lõi

**1. Idempotency**

Một thao tác là idempotent nếu thực hiện nhiều lần cho kết quả giống như một lần — không gây side-effect kép. Trong hệ phân tán, retry và message redelivery khiến cùng một request có thể đến nhiều lần. Giải pháp: client gửi kèm một **idempotency key** (UUID) duy nhất cho mỗi thao tác; server lưu key đã xử lý cùng kết quả. Khi gặp lại key đó, server không thực hiện lại mà trả về kết quả đã lưu. Cực kỳ quan trọng cho payment, tạo đơn, chuyển tiền — nơi làm lặp là thảm họa.

**2. Distributed Lock**

Khi một service chạy nhiều instance, lock trong JVM (`synchronized`) là vô dụng vì nó chỉ cục bộ trong một process. Distributed lock đảm bảo trong toàn cụm chỉ **một instance** xử lý một tài nguyên tại một thời điểm. Cài đặt phổ biến: Redis `SETNX` (set if not exists) + TTL, hoặc thư viện **Redisson** (có lock có watchdog tự gia hạn). Lưu ý quan trọng: lock phải có **timeout/TTL** để tránh deadlock nếu instance giữ lock bị crash. Redlock là thuật toán an toàn hơn nhưng phức tạp; cân nhắc kỹ vì distributed lock rất dễ sai.

**3. Eventual vs Strong Consistency (CAP)**

**CAP theorem**: trong hệ phân tán, khi có network partition (P), ta chỉ chọn được Consistency (C) hoặc Availability (A), không cả hai. **Strong consistency**: mọi read luôn thấy write mới nhất (như ACID) — chính xác nhưng phải chờ đồng bộ, giảm availability. **Eventual consistency**: các replica sẽ hội tụ "sau cùng" — chấp nhận đọc dữ liệu tạm cũ để đổi lấy availability và hiệu năng (mô hình BASE: Basically Available, Soft state, Eventual consistency). Microservices với database-per-service thường chọn eventual consistency cho dữ liệu xuyên service.

**4. Saga Pattern**

Vì không còn transaction ACID xuyên service, ta dùng **saga**: một chuỗi các local transaction, mỗi bước phát event kích hoạt bước tiếp theo; nếu một bước thất bại thì chạy **compensating action** (hoàn tác các bước trước, ví dụ "hoàn tiền"). Hai kiểu điều phối: **Choreography** — không có bộ điều khiển trung tâm, mỗi service nghe event và phản ứng (đơn giản, nhưng khó theo dõi luồng khi nhiều bước). **Orchestration** — một orchestrator điều khiển tuần tự các bước (dễ quản lý/giám sát, nhưng tạo điểm tập trung). Saga đảm bảo data consistency mà không cần distributed transaction.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// ===== Idempotency key check =====
@Service
public class PaymentService {

    private final IdempotencyStore store;   // ví dụ: Redis-backed
    private final PaymentGateway gateway;

    public PaymentResult pay(String idempotencyKey, PaymentRequest req) {
        // Nếu key đã xử lý -> trả kết quả cũ, KHÔNG charge lại
        PaymentResult existing = store.get(idempotencyKey);
        if (existing != null) {
            return existing;          // duplicate request -> safe
        }
        PaymentResult result = gateway.charge(req);   // thao tác có side-effect
        store.put(idempotencyKey, result, Duration.ofHours(24));
        return result;
    }
}
```

```java
// ===== Distributed lock với Redisson =====
@Service
public class InventoryService {

    private final RedissonClient redisson;
    public InventoryService(RedissonClient redisson) { this.redisson = redisson; }

    public void reserveStock(Long productId, int qty) {
        RLock lock = redisson.getLock("lock:product:" + productId);
        boolean locked = false;
        try {
            // chờ tối đa 5s, tự release sau 10s (watchdog) nếu crash
            locked = lock.tryLock(5, 10, TimeUnit.SECONDS);
            if (!locked) {
                throw new IllegalStateException("Could not acquire lock");
            }
            // ---- critical section: chỉ 1 instance vào đây ----
            // đọc tồn kho, kiểm tra, trừ kho, lưu DB
            decrementStock(productId, qty);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            if (locked && lock.isHeldByCurrentThread()) {
                lock.unlock();        // luôn release trong finally
            }
        }
    }
}
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Cài **idempotency key** cho một endpoint POST (ví dụ tạo đơn): nhận header `Idempotency-Key`, lưu key + kết quả vào store, trả lại kết quả cũ khi gặp key trùng. Test gửi 2 request cùng key.
2. Viết một **distributed lock** với Redis (Redisson `tryLock` có timeout/TTL) bảo vệ thao tác trừ tồn kho; mô phỏng 2 luồng cùng giành lock.
3. Vẽ (text) và giải thích một **saga** cho luồng đặt hàng: Order → Payment → Inventory, kèm các **compensating action** khi bước Inventory thất bại. So sánh choreography vs orchestration cho luồng này.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ · Idempotency là gì và tại sao quan trọng trong hệ phân tán?**

Idempotent nghĩa là thực hiện thao tác nhiều lần cho kết quả như một lần, không gây side-effect kép. Quan trọng vì retry, timeout và message redelivery khiến cùng một request có thể đến nhiều lần. Với thao tác như thanh toán, nếu không idempotent thì khách bị trừ tiền 2 lần. Giải pháp phổ biến là idempotency key: client gửi kèm một UUID duy nhất, server lưu key đã xử lý và trả lại kết quả cũ khi gặp key trùng thay vì thực hiện lại.

**Dễ · Tại sao không dùng được synchronized cho distributed lock?**

Vì `synchronized` (hoặc ReentrantLock) chỉ có tác dụng trong phạm vi một JVM/process. Khi service chạy nhiều instance trên nhiều máy, mỗi instance có JVM riêng, lock cục bộ không thấy nhau nên 2 instance vẫn vào critical section cùng lúc. Cần một lock dùng chung bên ngoài như Redis (SETNX + TTL) hoặc Redisson, hoặc dùng DB row-lock, để đảm bảo toàn cụm chỉ một instance xử lý tài nguyên tại một thời điểm.

**Trung · Eventual consistency và strong consistency khác nhau thế nào?**

Strong consistency: mọi read luôn thấy write mới nhất ngay lập tức (như ACID transaction) — chính xác nhưng phải chờ đồng bộ, giảm availability và hiệu năng. Eventual consistency: chấp nhận các replica có thể tạm khác nhau, nhưng sẽ hội tụ về cùng giá trị "sau cùng" nếu không có write mới — ưu tiên availability và hiệu năng, đổi lại có thể đọc dữ liệu hơi cũ trong chốc lát. Microservices với database-per-service thường chọn eventual consistency cho dữ liệu xuyên service (đồng bộ qua event).

**Trung · Giải thích CAP theorem.**

CAP nói rằng một hệ phân tán không thể đồng thời đảm bảo cả ba: Consistency (mọi node thấy cùng dữ liệu mới nhất), Availability (mọi request đều có response), và Partition tolerance (hệ vẫn chạy khi mạng bị chia cắt). Trong thực tế, network partition là không tránh khỏi nên P là bắt buộc — do đó khi có partition, ta phải chọn giữa C và A. Hệ chọn CP (như nhiều DB transaction) ưu tiên đúng đắn, từ chối phục vụ khi không chắc chắn; hệ chọn AP (như nhiều NoSQL) vẫn trả lời nhưng có thể trả dữ liệu cũ. Lựa chọn phụ thuộc yêu cầu nghiệp vụ.

**Khó · Saga pattern là gì? Choreography vs orchestration?**

Saga thay thế distributed transaction (vốn không khả thi với database-per-service) bằng một chuỗi local transaction; mỗi bước thành công sẽ kích hoạt bước kế, và nếu một bước thất bại thì chạy compensating action để hoàn tác các bước trước (ví dụ hoàn tiền, trả lại kho). **Choreography**: không có điều phối trung tâm — mỗi service lắng nghe event và tự phản ứng, phát event tiếp theo; đơn giản, loose-coupled, nhưng khi nhiều bước thì khó theo dõi luồng tổng thể và dễ tạo phụ thuộc event ngầm. **Orchestration**: một orchestrator điều khiển tường minh thứ tự các bước và xử lý compensation; dễ giám sát/debug và quản lý luồng phức tạp, nhưng tạo một điểm tập trung và orchestrator có thể phình to. Chọn choreography cho luồng đơn giản, orchestration cho luồng nhiều bước cần kiểm soát chặt.

### 🧠 Quiz Nhanh

1. Cách phổ biến để đảm bảo một thao tác (như thanh toán) là idempotent trong hệ phân tán là gì?
   - [ ] Khóa toàn bộ database trong lúc xử lý
   - [x] Client gửi kèm idempotency key; server lưu key đã xử lý và trả kết quả cũ khi gặp key trùng
   - [ ] Chỉ cho phép một request mỗi giây
   - [ ] Dùng synchronized trong service
   💡 Client gửi kèm một idempotency key (UUID) duy nhất; server lưu key đã xử lý cùng kết quả, khi gặp lại key đó thì trả kết quả cũ thay vì thực hiện lại — tránh trừ tiền 2 lần.

2. Tại sao `synchronized` (lock trong JVM) không dùng được làm distributed lock?
   - [ ] Vì synchronized quá chậm
   - [ ] Vì synchronized không hỗ trợ timeout
   - [x] Vì nó chỉ có tác dụng trong phạm vi một JVM/process, nhiều instance có JVM riêng không thấy lock của nhau
   - [ ] Vì synchronized chỉ dùng được cho method tĩnh
   💡 `synchronized` chỉ cục bộ trong một JVM; khi service chạy nhiều instance, mỗi instance có JVM riêng nên lock không thấy nhau — cần lock dùng chung bên ngoài như Redis SETNX hoặc Redisson.

3. Theo CAP theorem, khi xảy ra network partition (P), một hệ phân tán phải chọn giữa hai yếu tố nào?
   - [ ] Latency và Throughput
   - [ ] Durability và Consistency
   - [x] Consistency và Availability
   - [ ] Partition tolerance và Availability
   💡 CAP nói khi có network partition (vốn không tránh khỏi nên P bắt buộc), ta chỉ chọn được Consistency hoặc Availability, không cả hai.

- **🧩 LeetCode:** #1834 Single-Threaded CPU (Medium) — Priority queue (min-heap) theo thời gian xử lý + sort theo thời điểm enqueue. Tư duy scheduling, liên hệ xử lý task tuần tự an toàn.

- **🤖 AI Tools:** Hỏi AI: *"Why is implementing a correct distributed lock with Redis so error-prone? Explain Redlock controversy briefly."* Đọc để hiểu vì sao distributed lock cần dùng dè chừng.

- **📚 Tài Nguyên:** CAP theorem (Brewer) · microservices.io "Saga" pattern · Redisson distributed lock docs · Martin Kleppmann "How to do distributed locking".

## 🔥 Ngày 6 · Docker Compose Multi-service: Gateway + Services + Redis + Postgres

**11/07 — Thứ 7** · **WEEKEND** · ⏱ 4h (sáng + chiều)

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Mock Interview EN · 30 phút*
>
> **Full Mock EN (30 phút):** tự phỏng vấn về kiến trúc microservices. Chuẩn bị trả lời lưu loát các câu:  "Walk me through the architecture of a system you built." "How do your services communicate and discover each other?" "How do you run the whole stack locally for development?"  Ghi âm toàn bộ, nghe lại, gạch các chỗ ấp úng để luyện lại. Tập dùng thuật ngữ: container, image, service, network, volume, healthcheck.

### 📖 Lý Thuyết Cốt Lõi

**1. Docker Compose multi-service orchestration**

Docker Compose định nghĩa và chạy ứng dụng nhiều container bằng một file `compose.yaml` (hoặc `docker-compose.yml`). Các khối chính: **services** (mỗi container: image/build, ports, environment, depends_on), **networks** (mạng ảo để container nói chuyện), **volumes** (lưu trữ bền vững). Một lệnh `docker compose up` khởi động toàn bộ stack theo đúng thứ tự phụ thuộc — rất phù hợp để dựng môi trường dev/local đầy đủ (gateway + service + DB + cache) chỉ trong vài giây.

**2. Service networking (DNS)**

Khi các service ở chung một Docker network, Compose tạo sẵn một **DNS nội bộ**: mỗi service được phân giải theo *tên service*. Ví dụ order-service gọi `http://product-service:8082` — Docker tự resolve "product-service" ra IP container, không cần hardcode IP. Đây là service discovery tối giản. Phân biệt **expose** (mở port chỉ trong network nội bộ, container khác gọi được) với **ports** (publish ra host, người ngoài/máy host gọi được). Thường chỉ publish gateway ra host, còn các service nội bộ chỉ giao tiếp trong network — tăng bảo mật (network isolation).

**3. Environment & config**

Cấu hình truyền vào container qua **environment variables** (khối `environment` hoặc file `.env`). Đây là cách chuẩn để tách config khỏi image (12-factor app): cùng một image chạy được ở dev/staging/prod chỉ bằng đổi env. Dùng `.env` để lưu giá trị (password, host) và tham chiếu `${VAR}` trong compose; tránh hardcode secret trong file commit. Có thể dùng Spring profiles (`SPRING_PROFILES_ACTIVE`) hoặc nhiều file compose (override) cho từng môi trường.

**4. Healthcheck + depends_on condition**

`depends_on` mặc định chỉ đảm bảo container kia đã *start*, KHÔNG đảm bảo nó đã *sẵn sàng nhận request* (Postgres start xong nhưng DB chưa accept connection). Để chờ đúng, định nghĩa **healthcheck** cho service (lệnh test định kỳ) và dùng `depends_on` với `condition: service_healthy` — service phụ thuộc chỉ khởi động sau khi dependency healthy. **Production note:** Docker Compose tuyệt cho dev/local và CI, nhưng để chạy production scale (auto-scaling, self-healing, rolling update đa node) thì dùng **Kubernetes**.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```yaml
# docker-compose.yml — full stack multi-service
services:
  gateway:
    build: ./gateway
    ports:
      - "8080:8080"            # chỉ gateway publish ra host
    environment:
      - SPRING_PROFILES_ACTIVE=docker
    depends_on:
      order-service:
        condition: service_healthy
      product-service:
        condition: service_healthy
    networks: [appnet]

  order-service:
    build: ./order-service
    environment:
      - DB_URL=jdbc:postgresql://postgres:5432/orderdb
      - REDIS_HOST=redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/actuator/health"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks: [appnet]

  product-service:
    build: ./product-service
    environment:
      - DB_URL=jdbc:postgresql://postgres:5432/productdb
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8082/actuator/health"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks: [appnet]

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data    # dữ liệu bền vững
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks: [appnet]

  redis:
    image: redis:7-alpine
    networks: [appnet]

networks:
  appnet:
    driver: bridge

volumes:
  pgdata:
```

```text
# Dockerfile multi-stage (recap) — gateway / mỗi service
# ---- Stage 1: build ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY . .
RUN ./mvnw -q clean package -DskipTests

# ---- Stage 2: runtime (image nhỏ, chỉ JRE + jar) ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]

# Multi-stage: stage build có toàn bộ JDK + source,
# stage runtime chỉ lấy file jar -> image gọn, ít lỗ hổng bảo mật.
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Viết một **docker-compose.yml** multi-service: gateway + 2 service + redis + postgres, dùng chung một network, chỉ publish gateway ra host.
2. Thêm **healthcheck** cho mỗi service (Spring Boot Actuator `/actuator/health`) và cho postgres (`pg_isready`); dùng `depends_on: condition: service_healthy`.
3. Kiểm chứng **service-to-service call qua DNS name**: từ order-service gọi `http://product-service:8082/...` (không hardcode IP), quan sát log thành công.
4. Thử **scale** một service: `docker compose up --scale product-service=3`; quan sát 3 instance chạy và lý do vì sao không nên publish cố định port cho service được scale.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (8 câu)

**Dễ · Docker Compose dùng để làm gì?**

Docker Compose định nghĩa và chạy một ứng dụng nhiều container bằng một file YAML khai báo (services, networks, volumes). Chỉ với `docker compose up`, ta khởi động toàn bộ stack (gateway, các service, DB, cache) cùng lúc theo đúng thứ tự phụ thuộc. Cực kỳ tiện để dựng môi trường dev/local đầy đủ và dùng trong CI, thay vì phải chạy từng `docker run` thủ công và nhớ hết tham số.

**Dễ · Các service trong Compose tìm nhau bằng cách nào?**

Bằng DNS nội bộ của Docker network. Khi các service nằm chung một network, Compose phân giải mỗi service theo tên service của nó. Ví dụ order-service gọi `http://product-service:8082`, Docker tự resolve "product-service" thành IP của container — không cần hardcode IP, IP có thể thay đổi tự do. Đây là dạng service discovery tối giản tích hợp sẵn.

**Trung · depends_on khác healthcheck thế nào?**

`depends_on` mặc định chỉ đảm bảo thứ tự khởi động — container phụ thuộc start sau khi container kia đã *start*, nhưng "started" không có nghĩa là "ready" (Postgres process chạy rồi nhưng chưa accept connection). Healthcheck định nghĩa một lệnh test để biết service thực sự sẵn sàng. Kết hợp `depends_on` với `condition: service_healthy` mới đảm bảo service phụ thuộc chỉ khởi động khi dependency đã healthy thật sự, tránh lỗi connection refused lúc startup.

**Trung · Volume dùng để làm gì? Tại sao Postgres cần volume?**

Container có filesystem ephemeral — khi container bị xóa/tạo lại, dữ liệu bên trong mất hết. Volume là vùng lưu trữ bền vững do Docker quản lý, gắn vào container nhưng tồn tại độc lập với vòng đời container. Postgres cần volume (mount vào `/var/lib/postgresql/data`) để dữ liệu DB không mất khi container restart hay rebuild. Phân biệt với bind mount (gắn thư mục host) thường dùng để inject code/config lúc dev.

**Trung · expose và ports khác nhau ra sao?**

`ports` (ví dụ "8080:8080") publish port của container ra host — máy host và bên ngoài truy cập được. `expose` chỉ mở port trong phạm vi Docker network nội bộ, các container khác gọi được nhưng host/bên ngoài thì không. Best practice cho microservices: chỉ `ports` cho gateway (điểm vào duy nhất), còn các service nội bộ chỉ giao tiếp trong network — giảm bề mặt tấn công (network isolation), buộc traffic phải đi qua gateway.

**Trung · Cấu hình theo môi trường (dev/prod) trong Compose làm sao?**

Dùng environment variables để tách config khỏi image (12-factor). Giá trị nhạy cảm/thay đổi (host DB, password) đặt trong file `.env` và tham chiếu `${VAR}` trong compose, không hardcode secret vào file commit. Có thể dùng `SPRING_PROFILES_ACTIVE` để chọn Spring profile, hoặc nhiều file compose (base + override per môi trường) gộp bằng `-f`. Cùng một image chạy được ở mọi môi trường chỉ bằng đổi env.

**Khó · Docker Compose có dùng cho production không? Khi nào cần Kubernetes?**

Compose tuyệt vời cho dev/local và CI vì khai báo đơn giản, dựng nhanh trên một máy. Nhưng cho production scale nó thiếu nhiều thứ: chạy đa node (Compose chỉ một host), auto-scaling theo tải, self-healing (tự restart/reschedule pod khi node chết), rolling update/rollback không downtime, service mesh, secret management chín muồi, scheduling tài nguyên. Kubernetes giải quyết tất cả những điều đó cho hệ phân tán nhiều node ở quy mô lớn. Quy tắc thực dụng: Compose cho dev và hệ nhỏ một host; Kubernetes (hoặc managed như EKS/GKE) khi cần HA, scale ngang đa node và vận hành production nghiêm túc.

**Mock EN · Walk me through how you run your microservices stack locally.**

"I use a single `docker-compose.yml` that defines every component: an API gateway, two business services, a Postgres database, and a Redis cache. They all share one bridge network, so each service can reach the others by service name through Docker's internal DNS — for example, the order service calls `http://product-service:8082` without any hardcoded IP. I only publish the gateway's port to the host; everything else stays internal for isolation. Each service has a healthcheck hitting its Actuator endpoint, and I use `depends_on` with `condition: service_healthy` so a service won't start until its database is actually ready, not just started. Config comes from environment variables and a `.env` file, so the same images run in any environment. With one `docker compose up`, the whole stack is running in seconds. For production scale, though, I'd move to Kubernetes for auto-scaling and self-healing."

### 🧠 Quiz Nhanh

1. Trong Docker Compose, các service nằm chung một network tìm thấy nhau bằng cách nào?
   - [ ] Bằng IP cố định hardcode trong compose
   - [x] Bằng DNS nội bộ, phân giải theo tên service
   - [ ] Bằng cách publish toàn bộ port ra host
   - [ ] Bằng một file hosts chia sẻ
   💡 Khi chung một Docker network, Compose tạo DNS nội bộ phân giải theo tên service — order-service gọi `http://product-service:8082` mà không cần hardcode IP.

2. Sự khác biệt cốt lõi giữa `depends_on` mặc định và healthcheck là gì?
   - [x] depends_on chỉ đảm bảo container đã start, healthcheck mới xác nhận service thực sự sẵn sàng nhận request
   - [ ] depends_on chỉ dùng cho database, healthcheck cho service
   - [ ] healthcheck đảm bảo thứ tự start, depends_on kiểm tra sức khỏe
   - [ ] Cả hai hoàn toàn giống nhau
   💡 `depends_on` mặc định chỉ đảm bảo container đã *start*, không phải đã *ready*; cần healthcheck + `condition: service_healthy` để chờ service thực sự sẵn sàng.

3. Best practice publish port cho microservices stack trong Compose là gì?
   - [ ] Publish toàn bộ port của mọi service ra host
   - [ ] Không publish port nào cả
   - [x] Chỉ publish gateway ra host, các service nội bộ chỉ giao tiếp trong network
   - [ ] Chỉ publish database ra host để dễ debug
   💡 Chỉ `ports` cho gateway (điểm vào duy nhất), còn các service nội bộ chỉ giao tiếp trong network — giảm bề mặt tấn công (network isolation), buộc traffic đi qua gateway.

- **🧩 LeetCode:** #994 Rotting Oranges (Medium — BFS) — Multi-source BFS theo từng "phút": queue chứa mọi cam thối ban đầu, lan ra hàng xóm theo level. Tư duy lan truyền trạng thái theo lớp.

- **🤖 AI Tools:** Hỏi AI: *"Review my docker-compose.yml for a gateway + 2 services + Postgres + Redis — check networking, healthchecks, and security (which ports should NOT be published)."*

- **📚 Tài Nguyên:** Docker Compose docs (docs.docker.com/compose) · Compose file reference (services/healthcheck/depends_on) · Spring Boot Actuator health endpoint · 12-factor app (config).

## 🎯 Ngày 7 · Spaced Review T1-T9 + Mini Project: 2-service System

**12/07 — CN** · **REVIEW** · ⏱ 4h (ôn tập + project)

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Full Mock Interview EN · 45 phút*
>
> **Full Mock (45 phút) — System Design discussion in English.** Tự phỏng vấn (hoặc nhờ AI làm interviewer) cho đề: *"Design a simple e-commerce backend with microservices."* Trình bày to ra theo cấu trúc:  Clarify requirements & scale assumptions. Identify services by bounded context (order, product, payment...). Communication: sync REST vs async events; database per service. Gateway for routing/auth/rate-limit; resilience with circuit breakers. Consistency: idempotency keys, saga for cross-service transactions. How to scale & deploy (Compose for dev, Kubernetes for prod).  Ghi âm toàn bộ 45 phút, nghe lại, đánh dấu thuật ngữ chưa trôi để luyện lại tuần sau.

### 📖 Lý Thuyết Cốt Lõi (Review T1-T9)

**1. Microservices & Communication (recap)**

Microservices = nhiều service nhỏ độc lập, chia theo bounded context, database per service; đổi đơn giản trong code lấy độc lập trong vận hành. Giao tiếp: sync (RestClient/WebClient/Feign + client-side load balancing + service discovery) cho query cần ngay; async (message queue) để decouple và chịu tải. Nhớ "Monolith First" — chỉ tách khi có lý do thật.

**2. Gateway & Resilience (recap)**

Spring Cloud Gateway = single entry point (reactive, route = predicates + filters), tập trung auth/rate-limit/logging/CORS. Resilience4j chống cascade failure: Circuit Breaker (CLOSED/OPEN/HALF_OPEN, fail fast), Retry (backoff, chỉ idempotent), TimeLimiter, Bulkhead, và Fallback cho graceful degradation.

**3. Distributed Concurrency & Docker (recap)**

Idempotency key chống xử lý lặp (payment/retry); distributed lock (Redis/Redisson, luôn có TTL) khi nhiều instance; eventual consistency + CAP (chọn C hay A khi có partition); saga + compensating action thay distributed transaction. Docker Compose dựng full stack dev (services/networks/volumes, DNS theo tên service, healthcheck + depends_on); Compose cho dev, Kubernetes cho prod scale.

**4. Nền tảng T1-T8 (spaced recall)**

Tự kiểm tra nhanh: Java core/OOP, Collections & Generics, Streams/Optional, Exception, Concurrency (thread/executor/CompletableFuture, synchronized/volatile/atomic), JVM & GC, Spring Boot (IoC/DI, REST, JPA/transaction), testing (JUnit/Mockito). Nói to một câu chốt cho mỗi chủ đề để kích hoạt trí nhớ dài hạn.

### 💻 Code Mẫu — Mini Project: order-service + product-service + Gateway + Circuit Breaker

```yaml
# gateway/application.yml — route tới 2 service, có circuit breaker
spring:
  cloud:
    gateway:
      routes:
        - id: order
          uri: lb://order-service
          predicates: [ Path=/api/orders/** ]
          filters:
            - StripPrefix=1
        - id: product
          uri: lb://product-service
          predicates: [ Path=/api/products/** ]
          filters:
            - StripPrefix=1
```

```java
// order-service: gọi product-service qua Feign + Circuit Breaker + fallback
@FeignClient(name = "product-service")
public interface ProductClient {
    @GetMapping("/api/products/{id}")
    Product getProduct(@PathVariable("id") Long id);
}

@Service
public class OrderService {
    private final ProductClient productClient;
    public OrderService(ProductClient productClient) { this.productClient = productClient; }

    @CircuitBreaker(name = "productCB", fallbackMethod = "createOrderFallback")
    public Order createOrder(Long productId, int qty) {
        Product p = productClient.getProduct(productId);   // có thể fail khi product down
        return new Order(productId, qty, p.price() * qty, "CONFIRMED");
    }

    // fallback: product-service down -> tạo đơn PENDING, không sập
    public Order createOrderFallback(Long productId, int qty, Throwable ex) {
        return new Order(productId, qty, 0.0, "PENDING_PRICE");
    }
}
```

```yaml
# docker-compose.yml — chạy full stack mini project
services:
  gateway:
    build: ./gateway
    ports: ["8080:8080"]
    depends_on:
      order-service: { condition: service_healthy }
      product-service: { condition: service_healthy }
    networks: [appnet]
  order-service:
    build: ./order-service
    healthcheck:
      test: ["CMD","curl","-f","http://localhost:8081/actuator/health"]
      interval: 10s
      retries: 5
    networks: [appnet]
  product-service:
    build: ./product-service
    healthcheck:
      test: ["CMD","curl","-f","http://localhost:8082/actuator/health"]
      interval: 10s
      retries: 5
    networks: [appnet]
networks: { appnet: { driver: bridge } }
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Hoàn thiện **hệ 2-service**: order-service + product-service đứng sau Spring Cloud Gateway; order gọi product qua Feign/WebClient có `@CircuitBreaker`. Chạy tất cả bằng `docker compose up`.
2. **Test circuit breaker**: dừng (kill) product-service (`docker compose stop product-service`), gọi tạo đơn qua gateway, xác nhận fallback kích hoạt (đơn PENDING thay vì lỗi 500), rồi start lại và xác nhận circuit về CLOSED.
3. **Push GitHub**: viết README bằng tiếng Anh có **architecture diagram** (ASCII hoặc Mermaid), mô tả services, communication, gateway, circuit breaker, cách chạy bằng Docker Compose.

### 🎤 Câu Hỏi Phỏng Vấn — Tổng Hợp T9 + T1-T9 (10 câu)

**Dễ · Tóm tắt trong một câu: microservices đánh đổi điều gì lấy điều gì?**

Microservices đánh đổi sự đơn giản trong code (giờ là hệ phân tán phức tạp) để lấy tính độc lập trong vận hành (deploy, scale, chọn tech và chịu lỗi độc lập theo từng service). Chỉ đáng khi lợi ích về scale/deploy/team lớn hơn chi phí distributed complexity.

**Dễ · Vai trò của API Gateway trong hệ vừa build là gì?**

Gateway là điểm vào duy nhất: client chỉ gọi gateway, gateway route theo path tới order-service hay product-service. Nó cũng là nơi tập trung cross-cutting concern như auth, rate limiting, logging. Trong Docker Compose, chỉ gateway publish port ra host còn các service nội bộ giữ kín — buộc mọi traffic đi qua gateway.

**Trung · Trong mini project, circuit breaker bảo vệ điều gì cụ thể?**

Khi order-service gọi product-service mà product down/chậm, nếu không có gì bảo vệ thì order-service sẽ treo thread chờ và có thể sập theo. Circuit breaker trên lời gọi đó phát hiện tỉ lệ lỗi cao, mở mạch và fail fast, chạy fallback (tạo đơn ở trạng thái PENDING_PRICE thay vì trả 500). Nhờ vậy order-service vẫn phục vụ, và product-service được giảm tải để hồi phục; khi product khỏe lại, circuit về CLOSED.

**Trung · Làm sao đảm bảo data consistency giữa order và product/inventory?**

Vì mỗi service own database riêng, không có transaction ACID xuyên service. Ta chấp nhận eventual consistency và dùng saga: order tạo ở trạng thái pending, phát event để inventory trừ kho và payment trừ tiền; mỗi bước là local transaction, nếu một bước fail thì chạy compensating action (hoàn tiền, trả kho, hủy đơn). Thêm idempotency key để retry không gây trừ kho/trừ tiền lặp.

**Trung · depends_on: condition: service_healthy quan trọng thế nào trong project này?**

Nếu chỉ dùng depends_on mặc định, gateway có thể start trước khi order/product thực sự sẵn sàng nhận request, gây lỗi route lúc khởi động. Dùng `condition: service_healthy` kết hợp healthcheck (gọi Actuator /health) đảm bảo gateway chỉ lên sau khi các service đã healthy thật, và service chỉ lên sau khi Postgres ready — tránh các lỗi connection refused/503 chỉ xuất hiện lúc cold start.

**Khó · Concurrency (T8) liên hệ thế nào với distributed concurrency (T9)?**

Trong một JVM (T8), ta dùng synchronized/Lock/atomic/volatile để bảo vệ shared state giữa các thread cùng process; transaction DB cục bộ đảm bảo tính nhất quán. Khi lên phân tán (T9), shared state nằm trên nhiều process/máy nên các công cụ trong-JVM vô dụng — phải dùng distributed lock (Redis/Redisson), idempotency để chống xử lý lặp do retry, và saga thay cho transaction xuyên service. Tư duy chung giống nhau (tránh race condition, đảm bảo atomicity nơi cần), nhưng phạm vi và công cụ khác hẳn, và còn phải đối mặt network failure + eventual consistency.

**Khó · Khi nào bạn KHÔNG nên dùng microservices cho dự án này?**

Khi team nhỏ, sản phẩm còn ở giai đoạn MVP, domain chưa ổn định, và chưa gặp pain point thật về scale hay deploy. Lúc đó microservices chỉ thêm chi phí (network, distributed tracing, eventual consistency, infra, CI/CD cho nhiều service) mà chưa đem lợi ích tương xứng, thậm chí làm chậm phát triển. Nên bắt đầu bằng một modular monolith được cấu trúc tốt theo bounded context, rồi tách dần khi có lý do cụ thể — đúng tinh thần "Monolith First". Tách sai bounded context khi domain chưa rõ là sai lầm rất tốn kém để sửa.

**Khó · Một request user đi qua hệ thống này như thế nào, end-to-end?**

Client gọi gateway (port public). Gateway verify JWT, áp rate limit, gán correlation ID, rồi match predicate Path để route — ví dụ POST /api/orders tới order-service qua client-side load balancing (lb://). Order-service nhận request, cần giá sản phẩm nên gọi product-service qua Feign; lời gọi này được bọc circuit breaker + timeout. Nếu product khỏe, trả giá và order lưu đơn vào DB riêng (Postgres), có thể dùng distributed lock/idempotency cho bước trừ kho. Nếu product down, circuit breaker fail fast và fallback tạo đơn PENDING. Response đi ngược về gateway rồi tới client. Toàn bộ chạy trong một Docker network, service tìm nhau qua DNS theo tên. Logs/traces gắn correlation ID để theo dõi xuyên suốt.

**Mock EN · How would you scale this system if traffic grew 10x?**

"First I'd find the bottleneck with metrics — usually one service, not all. Because each service is independent, I can scale just the hot one horizontally by running more instances behind client-side load balancing, instead of scaling the whole app. For local dev that's `docker compose up --scale`, but at 10x I'd move to Kubernetes for auto-scaling and self-healing. Stateless services scale easily; for the database I'd add read replicas and caching with Redis to take read pressure off Postgres, and consider partitioning if writes are the limit. The gateway is stateless too, so I'd run several instances behind a load balancer. I'd also rely on circuit breakers and bulkheads so a slow dependency under load doesn't cascade, and prefer async messaging for non-critical work to smooth out spikes."

**Mock EN · Walk me through the architecture you designed and the key trade-offs.**

"It's a microservices backend split by bounded context: an order service and a product service, each owning its own Postgres database, with Redis for caching and idempotency keys. All traffic enters through a Spring Cloud Gateway, which handles routing, authentication, and rate limiting, so cross-cutting concerns live in one place. The order service calls the product service synchronously through Feign, wrapped in a Resilience4j circuit breaker with a fallback, so if products go down we degrade gracefully instead of failing. For cross-service consistency I'd use a saga with compensating actions rather than distributed transactions, accepting eventual consistency. The whole stack runs locally with Docker Compose using an internal network and healthchecks. The main trade-off is complexity: I've traded simple in-process calls and ACID transactions for independent deployability and fault isolation — which is only worth it once the team and scale justify it. For a smaller product I'd start with a modular monolith."

### 🧠 Quiz Nhanh

1. Trong mini project, khi product-service down/chậm thì circuit breaker trên lời gọi của order-service làm gì?
   - [ ] Treo thread chờ cho tới khi product hồi phục
   - [x] Mở mạch, fail fast và chạy fallback (tạo đơn PENDING_PRICE thay vì trả 500)
   - [ ] Tự động khởi động lại product-service
   - [ ] Chuyển request sang database trực tiếp
   💡 Circuit breaker phát hiện tỉ lệ lỗi cao, mở mạch và fail fast, chạy fallback tạo đơn PENDING_PRICE; nhờ vậy order-service vẫn phục vụ và product-service được giảm tải để hồi phục.

2. Concurrency trong một JVM (T8) khác distributed concurrency (T9) ở điểm nào?
   - [ ] Hoàn toàn giống nhau, chỉ khác tên gọi
   - [ ] T8 dùng saga, T9 dùng synchronized
   - [x] T8 dùng synchronized/Lock/atomic trong một process; T9 phải dùng distributed lock, idempotency và saga vì state nằm trên nhiều process/máy
   - [ ] T9 không cần lo về race condition
   💡 Trong một JVM dùng synchronized/Lock/atomic/volatile; khi phân tán, state nằm trên nhiều process nên các công cụ trong-JVM vô dụng — phải dùng distributed lock, idempotency và saga, còn phải đối mặt network failure + eventual consistency.

3. Để đảm bảo data consistency giữa order và product/inventory (mỗi service own DB riêng), cách tiếp cận đúng là gì?
   - [ ] Dùng một distributed transaction ACID xuyên service
   - [ ] Cho order-service truy cập trực tiếp DB của inventory
   - [x] Chấp nhận eventual consistency và dùng saga với compensating action, thêm idempotency key
   - [ ] Khóa cả hai database cho tới khi hoàn tất
   💡 Vì mỗi service own DB riêng, không có transaction ACID xuyên service; ta chấp nhận eventual consistency, dùng saga (local transaction + compensating action) và idempotency key để retry không gây trừ kho/tiền lặp.

- **🧩 LeetCode:** #210 Course Schedule II (Medium) — Topological sort trả về thứ tự (Kahn's BFS với in-degree). Liên hệ: thứ tự khởi động service theo dependency, giống depends_on.

- **🤖 AI Tools:** Nhờ AI làm *interviewer*: *"Act as a senior engineer. Conduct a 30-minute system design interview on a microservices e-commerce backend, and give feedback on my answers."*

- **📚 Tài Nguyên:** microservices.io (full pattern catalog) · "System Design Interview" (Alex Xu) · Spring Cloud reference · ôn lại note T1-T9 của chính mình.

## 🎯 Tổng Kết Tuần 9

### 📋 Ngân Hàng Câu Hỏi Phỏng Vấn

*Ôn lại cuối tuần — trả lời to ra, ghi âm, nghe lại.*

**Microservices Architecture**

- **Q: What are microservices and how do they differ from a monolith?**  
  A: Microservices split a system into small, independently deployable services, each owning its own data and communicating over the network, whereas a monolith ships everything as one unit sharing one database. Microservices trade code-level simplicity for operational independence: you gain independent deployment, per-service scaling, tech freedom and fault isolation, but you take on distributed complexity, network failures and eventual consistency.
- **Q: Why "database per service" and what does bounded context mean?**  
  A: Database per service means each service owns its data and no other service touches that database directly — they go through its API. This keeps services loosely coupled and autonomous so they can change schema or scale independently. Bounded context (from DDD) is the business boundary you split services along, so each service maps to one cohesive domain rather than to a technical layer.
- **Q: When do you choose synchronous vs asynchronous communication?**  
  A: Use synchronous REST when the caller needs an immediate answer in the request flow. Use asynchronous messaging (Kafka/RabbitMQ) for events, notifications and background work, to decouple producers and consumers, absorb traffic spikes and stay resilient when one side is down — at the cost of complexity and eventual consistency.

**Gateway & Resilience**

- **Q: What problem does the API Gateway pattern solve?**  
  A: It gives clients a single entry point so they don't need to know each service's address, and centralizes cross-cutting concerns — authentication, rate limiting, logging, CORS — instead of duplicating them in every service. It can also aggregate calls to reduce client round-trips. The risk is it becoming a bottleneck or single point of failure, so keep it lightweight and run multiple instances.
- **Q: Explain the circuit breaker's three states.**  
  A: CLOSED — requests flow normally while the breaker tracks the failure rate. OPEN — once failures exceed a threshold the breaker opens and requests fail fast with a fallback, giving the downstream time to recover. HALF_OPEN — after a wait it lets a few trial requests through; success returns it to CLOSED, failure sends it back to OPEN. This prevents cascade failure.
- **Q: How do fallback and retry work, and what's the catch with retry?**  
  A: A fallback returns a default, cached or reduced response when a call fails, so the system degrades gracefully instead of erroring out. Retry re-sends a request on transient failures with exponential backoff. The catch: only retry idempotent operations — otherwise a retried "charge" or "create order" can run twice and cause duplicate side-effects.

**Distributed Systems**

- **Q: How do you prevent a payment from being charged twice?**  
  A: Idempotency. The client sends a unique idempotency key with the request; the server stores processed keys with their result. If the same key arrives again (a retry or redelivery), the server returns the stored result instead of charging again. This makes the operation safe to repeat.
- **Q: Explain eventual consistency and the CAP theorem.**  
  A: CAP says that during a network partition a distributed system can only guarantee either consistency or availability, not both. Strong consistency means every read sees the latest write but may sacrifice availability; eventual consistency accepts temporarily stale reads but the replicas converge over time, favoring availability and performance. Microservices with database-per-service usually pick eventual consistency for cross-service data.
- **Q: What does Docker Compose give you for orchestrating services?**  
  A: Compose declares the whole multi-container stack — services, networks, volumes — in one YAML file and starts it with one command. Services find each other by name via Docker's internal DNS, healthchecks plus depends_on ensure correct startup order, and volumes persist data. It's ideal for dev and CI; for production scale (multi-node, auto-scaling, self-healing) you move to Kubernetes.

### ✅ Checklist Cuối Tuần

- [ ] Hiểu rõ microservices vs monolith: trade-offs, "Monolith First", bounded context & database per service
- [ ] Inter-service communication: gọi service khác bằng WebClient / RestClient / Feign + service discovery
- [ ] Spring Cloud Gateway: cấu hình routes (predicates + filters), hiểu cross-cutting concerns
- [ ] Circuit Breaker + fallback với Resilience4j (3 states, retry, timeout, bulkhead)
- [ ] Idempotency key + distributed lock (Redis/Redisson) để xử lý concurrency phân tán
- [ ] Eventual consistency & CAP theorem; biết khi nào dùng saga + compensating action
- [ ] Viết docker-compose.yml multi-service (gateway + 2 service + Redis + Postgres)
- [ ] Service-to-service networking qua DNS theo tên service + healthcheck/depends_on
- [ ] Hoàn thành mini project 2-service + circuit breaker, test fallback khi kill 1 service
- [ ] Mock interview EN: trình bày system design microservices bằng tiếng Anh trôi chảy

> 💡 **Golden Rule Tuần 9:** Microservices không phải "luôn tốt hơn" — chúng đổi complexity trong code lấy complexity trong vận hành. Monolith first, tách khi có lý do thật. Gateway = 1 cửa vào, Circuit Breaker = ngắt mạch tránh sập dây chuyền. Distributed system = ôm lấy eventual consistency + idempotency. Hiểu trade-off quan trọng hơn thuộc tool.
