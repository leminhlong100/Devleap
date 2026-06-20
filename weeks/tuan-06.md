# 💬 Tuần 6 · Spring AI + Chatbot Streaming · 15/06–21/06/2025

## 📅 Lịch Học Tuần 6 — Tổng Quan 7 Ngày

| Ngày | Thứ | Chế độ | Thời gian | Chủ đề |
| --- | --- | --- | --- | --- |
| 15/06 | Thứ 2 | LIGHT | 1.5h | Reactive Programming cơ bản: Mono, Flux, publisher/subscriber |
| 16/06 | Thứ 3 | FULL | 2.5h | Spring AI Streaming: ChatClient.stream(), Flux response, Server-Sent Events (SSE) |
| 17/06 | Thứ 4 | FULL | 2.5h | Chatbot với Chat Memory: conversation history, MessageChatMemoryAdvisor |
| 18/06 | Thứ 5 | FULL | 2.5h | @Async deep + ThreadPoolTaskExecutor + CompletableFuture trong Spring service |
| 19/06 | Thứ 6 | LIGHT | 1.5h | Prompt Engineering: few-shot, role prompting, structured output, prompt templates |
| 20/06 | Thứ 7 | WEEKEND | 4h | Docker basics: Dockerfile, image, container, docker-compose cho Spring Boot + Redis |
| 21/06 | CN | REVIEW | 4h | Spaced Review T1-T6 + Mini Project: Streaming Chatbot API (Docker + Flux + Chat Memory) |

## ⚡ Ngày 1 · Reactive Programming cơ bản: Mono, Flux, publisher/subscriber

**15/06 — Thứ 2** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Vocalmax + Parroto Shadowing · 15 phút*
>
> **Giai đoạn Nâng cao** — Parroto Shadowing + Vocalmax với từ vựng Spring AI / Reactive / Docker. **Vocalmax 10 từ:** reactive, publisher, subscriber, stream, emit, backpressure, non-blocking, asynchronous, sequence, subscribe. **Parroto shadow:** "A Flux emits zero to many items, while a Mono emits zero or one."

### 📖 Lý Thuyết Cốt Lõi

**Reactive Programming là gì**

Paradigm xử lý data streams bất đồng bộ + non-blocking. Thay vì block chờ kết quả, đăng ký (subscribe) và nhận data khi có. Project Reactor là implementation Spring dùng (Spring WebFlux). Lợi ích: scalability cao với ít threads (event-loop), phù hợp I/O-bound + streaming.

**Mono vs Flux**

`Mono<T>`: publisher emit 0 hoặc 1 item (như Optional + async). `Flux<T>`: publisher emit 0..N items (như Stream + async). Mono cho single result (findById), Flux cho multiple/streaming (findAll, LLM token stream). Cả 2 đều lazy — không chạy đến khi subscribe.

**Publisher / Subscriber**

Reactive Streams spec: Publisher emit data, Subscriber consume. Operators (`map`, `filter`, `flatMap`) transform stream. `.subscribe()` kích hoạt pipeline. Nothing happens until subscribe — "assembly time" vs "subscription time".

**Backpressure**

Cơ chế subscriber báo publisher tốc độ nó xử lý được → tránh bị flood. Reactor handle tự động. Strategies: buffer, drop, latest. Quan trọng khi producer nhanh hơn consumer (streaming data).

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// Mono — 0 or 1
Mono<String> mono = Mono.just("Hello");
mono.map(String::toUpperCase)
    .subscribe(System.out::println); // HELLO

// Flux — 0..N
Flux<Integer> flux = Flux.just(1, 2, 3, 4, 5);
flux.filter(n -> n % 2 == 0)
    .map(n -> n * 10)
    .subscribe(System.out::println); // 20, 40

// Flux from interval — streaming
Flux<Long> stream = Flux.interval(Duration.ofSeconds(1))
    .take(3); // emit 0,1,2 every second
stream.subscribe(i -> System.out.println("Tick: " + i));

// Mono async — non-blocking DB call style
Mono<Student> student = Mono.fromCallable(() -> repo.findById(1L).orElseThrow())
    .subscribeOn(Schedulers.boundedElastic()); // run on I/O scheduler
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Tạo `Flux.just(...)` với 5 số, dùng `filter` + `map`, subscribe và in kết quả.
2. Tạo `Mono.fromCallable()` mô phỏng DB call, dùng `subscribeOn(Schedulers.boundedElastic())`.
3. Dùng `Flux.interval()` emit mỗi giây, `.take(5)` rồi subscribe — quan sát async behavior.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ · Mono và Flux khác nhau thế nào?**

`Mono<T>` emit 0 hoặc 1 item (như async Optional). `Flux<T>` emit 0 đến N items (như async Stream). Mono cho single result (1 user), Flux cho nhiều/streaming (list, LLM tokens). Cả 2 lazy, chỉ chạy khi subscribe.

**Dễ · "Nothing happens until you subscribe" nghĩa là gì?**

Reactive pipeline (map, filter...) chỉ là khai báo (assembly) — không thực thi cho đến khi `.subscribe()` được gọi (subscription time). Khác imperative code chạy ngay. Nếu quên subscribe → code không chạy. Trong Spring WebFlux, framework tự subscribe khi return Mono/Flux từ controller.

**Trung · Reactive (non-blocking) khác blocking I/O thế nào về threads?**

Blocking: mỗi request chiếm 1 thread, thread chờ I/O (block) → cần nhiều threads cho nhiều concurrent requests → tốn memory. Non-blocking: event-loop với ít threads, thread không chờ I/O mà xử lý request khác, callback khi I/O xong. Scalable hơn với I/O-bound, đặc biệt streaming/many connections.

**Trung · Backpressure là gì và tại sao quan trọng?**

Cơ chế subscriber kiểm soát tốc độ nhận data từ publisher để không bị quá tải. Khi producer nhanh hơn consumer (vd: DB stream 1M rows, client xử lý chậm), backpressure báo producer chậm lại. Strategies: buffer (lưu tạm), drop (bỏ bớt), latest (giữ mới nhất). Reactor handle tự động qua request(n).

**Khó · `subscribeOn` vs `publishOn` khác nhau thế nào?**

`subscribeOn`: chỉ định scheduler cho TOÀN BỘ chain từ nguồn (ảnh hưởng nơi subscription bắt đầu), vị trí trong chain không quan trọng — chỉ cái đầu tiên có tác dụng. `publishOn`: chuyển execution sang scheduler khác cho các operators SAU nó (downstream). Dùng `subscribeOn(boundedElastic())` cho blocking source, `publishOn` để switch context giữa chain. Schedulers: `parallel()` (CPU), `boundedElastic()` (I/O/blocking).

### 🧠 Quiz Nhanh

1. `Mono<T>` và `Flux<T>` khác nhau ở điểm nào?
   - [ ] Mono emit 0..N items, Flux chỉ emit đúng 1 item
   - [x] Mono emit 0 hoặc 1 item, Flux emit 0 đến N items
   - [ ] Cả hai luôn emit đúng 1 item, chỉ khác tên gọi
   - [ ] Mono là blocking, Flux là non-blocking
   💡 Mono giống async Optional (0-1 item), Flux giống async Stream (0..N items), phù hợp cho streaming như LLM tokens.

2. Câu "Nothing happens until you subscribe" nghĩa là gì?
   - [ ] Pipeline chạy ngay khi khai báo `map`/`filter`
   - [ ] Phải gọi `.block()` thì operators mới được tạo
   - [x] Pipeline chỉ là khai báo (assembly), chỉ thực thi khi gọi `.subscribe()`
   - [ ] Mono và Flux không bao giờ tự thực thi kể cả khi subscribe
   💡 Reactive pipeline là lazy — operators chỉ là assembly, code chỉ chạy tại subscription time khi `.subscribe()` được gọi.

3. `subscribeOn` và `publishOn` khác nhau thế nào?
   - [x] `subscribeOn` ảnh hưởng scheduler toàn bộ chain từ nguồn; `publishOn` chuyển execution cho operators downstream sau nó
   - [ ] `subscribeOn` chỉ ảnh hưởng operators sau nó; `publishOn` ảnh hưởng toàn chain
   - [ ] Cả hai hoàn toàn giống nhau, chỉ là alias
   - [ ] `publishOn` chỉ dùng cho Mono, `subscribeOn` chỉ dùng cho Flux
   💡 `subscribeOn` (chỉ cái đầu tiên có tác dụng) đặt scheduler cho nguồn — dùng cho blocking source với `boundedElastic()`; `publishOn` switch context cho downstream operators.

- **🧩 LeetCode:** Number of Students Unable to Eat Lunch (LC #1700) — Easy — queue simulation.

- **🤖 AI Tools:** Dùng AI giải thích reactive marble diagrams.

- **📚 Tài Nguyên:** Project Reactor reference docs + "Reactor by example".

## 💪 Ngày 2 · Spring AI Streaming: ChatClient.stream(), SSE

**16/06 — Thứ 3** · **FULL** · ⏱ 30 phút sáng + 2h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Parroto Shadowing · 20 phút*
>
> **Câu shadowing:** "The chatbot streams its response token by token", "Server-Sent Events push data from server to client over HTTP", "Streaming improves perceived latency for the user". **Vocalmax:** streaming, token, server-sent events, chunk, real-time, push, latency, perceived, incremental, render.

### 📖 Lý Thuyết Cốt Lõi

**Tại sao streaming LLM response**

LLM tạo response từng token. Không streaming: user chờ toàn bộ response (5-30s) rồi mới thấy gì → bad UX. Streaming: hiển thị token ngay khi LLM tạo → user thấy text "gõ" ra như ChatGPT → perceived latency thấp hơn nhiều dù total time như nhau.

**ChatClient.stream()**

Spring AI: `chatClient.prompt().user(q).stream().content()` trả về `Flux<String>` — mỗi element là 1 chunk text. Subscribe để nhận từng phần. Khác `.call().content()` (blocking, trả String đầy đủ). Backend reactive end-to-end.

**Server-Sent Events (SSE)**

HTTP standard cho server push data tới client (1 chiều, server→client). `Content-Type: text/event-stream`. Spring: return `Flux<T>` với `produces = MediaType.TEXT_EVENT_STREAM_VALUE` → tự động SSE. Client (browser EventSource) nhận từng event. Đơn giản hơn WebSocket cho one-way streaming.

**SSE vs WebSocket**

SSE: 1 chiều (server→client), HTTP thường, auto-reconnect, đơn giản, phù hợp streaming LLM/notifications. WebSocket: 2 chiều (full-duplex), protocol riêng, phù hợp chat real-time 2 chiều/gaming. Cho chatbot streaming response → SSE đủ và đơn giản hơn.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
@RestController
@RequestMapping("/api/chat")
public class StreamingChatController {

    private final ChatClient chatClient;

    public StreamingChatController(ChatClient.Builder builder) {
        this.chatClient = builder
            .defaultSystem("You are a helpful assistant. Be concise.")
            .build();
    }

    // Streaming endpoint via SSE — returns Flux of text chunks
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestParam String message) {
        return chatClient.prompt()
            .user(message)
            .stream()       // returns Flux<String> instead of blocking
            .content();     // each emission is a token/chunk
    }

    // Compare: blocking endpoint
    @GetMapping("/sync")
    public String syncChat(@RequestParam String message) {
        return chatClient.prompt().user(message).call().content();
    }
}

// Client-side (JavaScript):
// const es = new EventSource('/api/chat/stream?message=Hello');
// es.onmessage = (e) => { output.textContent += e.data; };
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Tạo streaming endpoint trả `Flux<String>` với `produces = TEXT_EVENT_STREAM_VALUE`.
2. Test bằng curl: `curl -N "http://localhost:8080/api/chat/stream?message=Hello"` — quan sát chunks.
3. Viết HTML page đơn giản dùng `EventSource` để hiển thị streaming response.
4. So sánh perceived latency: sync endpoint (.call()) vs stream endpoint (.stream()).

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Tại sao streaming LLM response cải thiện UX?**

LLM tạo token tuần tự (5-30s cho response dài). Không streaming: user nhìn màn hình trống chờ toàn bộ → khó chịu. Streaming: hiển thị từng token ngay khi tạo → user thấy progress, đọc được ngay phần đầu. Total time không đổi nhưng perceived latency giảm mạnh (như ChatGPT typing effect).

**Dễ · `.stream()` khác `.call()` trong Spring AI ChatClient?**

`.call().content()`: blocking, chờ LLM hoàn thành rồi trả String đầy đủ. `.stream().content()`: reactive, trả `Flux<String>` — mỗi emission là 1 chunk, nhận dần. Dùng stream cho UX tốt + long responses, call cho short/internal calls cần full result.

**Trung · Server-Sent Events (SSE) hoạt động thế nào?**

HTTP connection giữ mở, server push events dạng `text/event-stream` (format `data: ...\n\n`). Client dùng `EventSource` API tự kết nối + auto-reconnect khi đứt. 1 chiều server→client. Spring: return `Flux` với `produces=TEXT_EVENT_STREAM_VALUE`, framework serialize mỗi emission thành SSE event.

**Trung · SSE vs WebSocket — chọn cái nào cho chatbot?**

SSE: 1 chiều (server→client), chạy trên HTTP thường, auto-reconnect, firewall-friendly, đơn giản. WebSocket: 2 chiều full-duplex, cần handshake riêng, phù hợp real-time interactive 2 chiều. Chatbot streaming response (server đẩy tokens) → SSE đủ. Nếu cần typing indicators 2 chiều phức tạp → WebSocket. Bắt đầu với SSE.

**Trung · WebFlux vs Spring MVC — khi nào dùng WebFlux?**

WebFlux: reactive non-blocking, scalable cho I/O-bound + nhiều concurrent connections + streaming. Spring MVC: blocking, đơn giản, đủ cho đa số CRUD apps. Dùng WebFlux khi: streaming (LLM, SSE), high-concurrency I/O, full reactive stack (R2DBC). Đừng dùng WebFlux nếu team chưa quen reactive — complexity cao, khó debug.

**Khó · Streaming LLM response có thách thức gì về error handling?**

Khi đã stream 1 phần response rồi LLM/network fail → client đã nhận partial data, không thể "rollback". Cần: (1) `Flux.onErrorResume()` emit error message cuối stream. (2) Client xử lý incomplete response. (3) Timeout cho stream treo. (4) Không cache partial streams. (5) Token counting/cost khó hơn (phải đếm khi stream xong). (6) Backpressure nếu client chậm. Phức tạp hơn request-response nhiều.

**Mock EN · "How would you implement a streaming chatbot endpoint in Spring Boot?"**

"I'd use Spring AI's ChatClient with the `.stream()` method which returns a `Flux<String>`. The controller endpoint produces `text/event-stream` so Spring serializes each emission as a Server-Sent Event. On the client I'd use the EventSource API to append tokens as they arrive. For reliability I'd add `onErrorResume` to send a graceful error event, a timeout on the Flux, and I'd track token usage when the stream completes. SSE is ideal here because it's one-way, runs over plain HTTP, and auto-reconnects."

### 🧠 Quiz Nhanh

1. Tại sao streaming LLM response cải thiện UX dù total time không đổi?
   - [ ] Vì streaming làm LLM tạo token nhanh hơn
   - [ ] Vì streaming giảm tổng thời gian xử lý xuống còn 1 giây
   - [x] Vì hiển thị token ngay khi tạo nên perceived latency giảm mạnh
   - [ ] Vì streaming bỏ qua các token không cần thiết
   💡 Total generation time không đổi nhưng user thấy progress ngay (typing effect như ChatGPT), nên perceived latency thấp hơn nhiều.

2. Trong Spring AI ChatClient, `.stream().content()` trả về kiểu gì?
   - [x] `Flux<String>` — mỗi emission là 1 chunk/token
   - [ ] `String` đầy đủ sau khi LLM hoàn thành
   - [ ] `Mono<String>` chứa toàn bộ response
   - [ ] `List<String>` tất cả chunks gom lại một lần
   💡 `.stream().content()` reactive trả `Flux<String>` nhận dần từng chunk; còn `.call().content()` mới blocking trả String đầy đủ.

3. Để biến một endpoint trả `Flux` thành Server-Sent Events, cần làm gì?
   - [ ] Đổi `Flux` thành `Mono` và thêm header WebSocket
   - [ ] Thêm `@Async` lên method controller
   - [x] Đặt `produces = MediaType.TEXT_EVENT_STREAM_VALUE`
   - [ ] Trả về `List<String>` với `Content-Type: application/json`
   💡 Spring tự serialize mỗi emission của `Flux` thành SSE event khi endpoint khai báo `produces = TEXT_EVENT_STREAM_VALUE`.

- **🧩 LeetCode:** Number of Recent Calls (LC #933) — Easy — queue.

- **🤖 AI Tools:** Spring AI streaming docs + build a typing-effect UI.

- **📚 Tài Nguyên:** Spring AI "Streaming" + MDN "Server-Sent Events".

## 💪 Ngày 3 · Chatbot với Chat Memory

**17/06 — Thứ 4** · **FULL** · ⏱ 30 phút sáng + 2h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Parroto Shadowing · 20 phút*
>
> **Câu shadowing:** "The chatbot remembers the context of the conversation", "Each message is appended to the conversation history", "Memory must be bounded to avoid exceeding the context window". **Vocalmax:** conversation, context, history, memory, advisor, session, window, truncate, append, stateful.

### 📖 Lý Thuyết Cốt Lõi

**Tại sao cần Chat Memory**

LLM stateless: mỗi API call độc lập, không nhớ gì. Để chatbot có context ("nó" trỏ tới gì user nói trước), phải gửi lại history (previous messages) trong mỗi request. Không có memory → bot trả lời như lần đầu mỗi câu. Memory = lưu + inject conversation history.

**MessageChatMemoryAdvisor**

Spring AI Advisor (interceptor) tự động lưu user + assistant messages và inject vào prompt trước khi gọi LLM. `ChatClient.builder().defaultAdvisors(new MessageChatMemoryAdvisor(chatMemory))`. Truyền `conversationId` để tách memory theo session/user.

**ChatMemory implementations**

`InMemoryChatMemory`: lưu RAM (mất khi restart, không scale multi-instance). Production: implement `ChatMemory` với Redis/JDBC để persist + share. Key theo `conversationId`. Cần cleanup/TTL cho old conversations.

**Context window + truncation**

LLM có giới hạn tokens (context window, vd 128k). History dài → vượt limit → error hoặc tốn tiền. Chiến lược: (1) Sliding window — giữ N messages gần nhất. (2) Summarization — tóm tắt history cũ. (3) Token-based truncation. Trade-off giữa context đầy đủ vs cost/limit.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
@Configuration
public class ChatbotConfig {

    @Bean
    public ChatMemory chatMemory() {
        return new InMemoryChatMemory(); // production: Redis-backed
    }

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder, ChatMemory chatMemory) {
        return builder
            .defaultSystem("You are a friendly tutor. Remember the student's context.")
            .defaultAdvisors(new MessageChatMemoryAdvisor(chatMemory))
            .build();
    }
}

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {
    private final ChatClient chatClient;

    public ChatbotController(ChatClient chatClient) { this.chatClient = chatClient; }

    @PostMapping("/{conversationId}")
    public String chat(@PathVariable String conversationId,
                       @RequestBody String message) {
        return chatClient.prompt()
            .user(message)
            // bind this call to a conversation's memory
            .advisors(a -> a.param(CHAT_MEMORY_CONVERSATION_ID_KEY, conversationId))
            .call()
            .content();
    }
}
// Conversation flow:
// POST /api/chatbot/user123  "My name is Long"        -> "Hi Long!"
// POST /api/chatbot/user123  "What's my name?"        -> "Your name is Long." (remembers!)
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Config `ChatClient` với `MessageChatMemoryAdvisor` + `InMemoryChatMemory`.
2. Test conversation: gửi "My name is X", rồi "What's my name?" — verify bot nhớ.
3. Test 2 conversationId khác nhau — verify memory tách biệt (không lẫn context).
4. Implement sliding window: chỉ giữ 10 messages gần nhất (custom ChatMemory hoặc config).

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Tại sao LLM cần chat memory để có conversation?**

LLM stateless — mỗi call độc lập, không nhớ call trước. Để bot hiểu context ("it", "that", câu hỏi follow-up), phải gửi lại toàn bộ (hoặc 1 phần) conversation history trong mỗi request. Memory = component lưu trữ + inject history này tự động.

**Dễ · MessageChatMemoryAdvisor làm gì?**

Là Spring AI Advisor (interceptor) tự động: (1) lưu user message + assistant response vào ChatMemory, (2) inject history vào prompt trước khi gọi LLM. Tách theo `conversationId`. Giúp không phải tự quản lý history thủ công trong mỗi call.

**Trung · Tại sao InMemoryChatMemory không đủ cho production?**

(1) Mất hết khi app restart. (2) Không share giữa multiple instances (load balancer → request 2 vào instance khác, mất context). (3) Memory leak nếu không cleanup conversations cũ. Production: persist vào Redis/DB với conversationId làm key + TTL cho cleanup.

**Trung · Context window limit gây vấn đề gì với chat memory?**

Conversation dài → history nhiều tokens → vượt context window của model → error hoặc bị cắt + tốn tiền (tính theo token). Phải bound memory: sliding window (N messages gần nhất), summarization (tóm tắt phần cũ), hoặc token-based truncation. Trade-off: context đầy đủ vs cost/limit.

**Trung · conversationId dùng để làm gì trong chat memory?**

Tách biệt memory theo session/user. Mỗi conversation có ID riêng → user A và user B không lẫn context. Trong multi-user app, conversationId thường = sessionId hoặc userId+chatId. Advisor dùng nó làm key để lưu/lấy đúng history.

**Khó · Thiết kế chat memory cho chatbot 1 triệu users — cân nhắc gì?**

(1) Storage: Redis (fast, TTL) cho active conversations, archive vào DB/S3 cho cũ. (2) Bounding: sliding window + summarization để giới hạn tokens/conversation. (3) Partitioning: shard theo conversationId. (4) Cleanup: TTL tự xóa inactive. (5) Cost: token usage scale với history length × users → cần limit nghiêm. (6) Privacy: encrypt PII, retention policy, GDPR delete. (7) Cache summaries thay vì full history.

**Mock EN · "How do you manage conversation context in a production chatbot?"**

"Since LLMs are stateless, I persist conversation history keyed by a conversation ID — in Redis for active sessions with a TTL, archived to a database for long-term storage. To stay within the context window and control cost, I bound the memory using a sliding window of recent messages plus a running summary of older context. I separate memory per conversation ID so users never see each other's context, and I apply a retention policy with encryption for any personal data to meet privacy requirements."

### 🧠 Quiz Nhanh

1. Tại sao LLM cần chat memory để có conversation?
   - [x] Vì LLM stateless, mỗi call độc lập nên phải gửi lại history mỗi request
   - [ ] Vì LLM lưu sẵn lịch sử trong model weights
   - [ ] Vì memory giúp LLM tạo token nhanh hơn
   - [ ] Vì không có memory thì LLM không thể stream response
   💡 LLM stateless — mỗi API call độc lập không nhớ gì; memory là component lưu + inject conversation history để bot hiểu context.

2. `MessageChatMemoryAdvisor` làm nhiệm vụ gì?
   - [ ] Chỉ giới hạn số token tối đa của mỗi prompt
   - [x] Tự động lưu user/assistant messages và inject history vào prompt theo conversationId
   - [ ] Mã hóa toàn bộ conversation trước khi gửi lên LLM
   - [ ] Chuyển blocking call thành streaming call
   💡 Advisor là interceptor tự lưu messages vào ChatMemory và inject history trước khi gọi LLM, tách theo `conversationId`.

3. Tại sao `InMemoryChatMemory` không đủ cho production?
   - [ ] Vì nó không hỗ trợ tách theo conversationId
   - [ ] Vì nó luôn vượt context window của model
   - [x] Vì mất hết khi restart, không share giữa các instance, có thể leak memory nếu không cleanup
   - [ ] Vì nó chỉ hoạt động với Mono chứ không với Flux
   💡 Production nên persist vào Redis/DB keyed theo conversationId với TTL để bền vững, share đa instance và tránh memory leak.

- **🧩 LeetCode:** Implement Stack using Queues (LC #225) — Easy — design.

- **🤖 AI Tools:** Spring AI Chat Memory + build multi-turn bot.

- **📚 Tài Nguyên:** Spring AI "Chat Memory Advisor" docs.

## 💪 Ngày 4 · @Async deep + ThreadPoolTaskExecutor

**18/06 — Thứ 5** · **FULL** · ⏱ 30 phút sáng + 2h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Parroto Shadowing · 20 phút*
>
> **Câu shadowing:** "The async method runs on a separate thread pool", "We configure the core pool size and queue capacity", "The method returns a CompletableFuture immediately". **Vocalmax:** asynchronous, thread pool, core size, max size, queue capacity, executor, rejection policy, future, await, non-blocking.

### 📖 Lý Thuyết Cốt Lõi

**@Async + @EnableAsync**

`@EnableAsync` bật async support. `@Async` trên method → chạy trên thread pool riêng, return ngay (caller không block). Return type: `void` (fire-and-forget), `CompletableFuture<T>`, hoặc `Future<T>`. Self-invocation không work (proxy bypass) — như @Transactional.

**ThreadPoolTaskExecutor config**

`corePoolSize` (threads luôn sống), `maxPoolSize` (tối đa khi queue đầy), `queueCapacity` (hàng đợi tasks). Flow: tasks ≤ core → dùng core threads. Đầy core → vào queue. Queue đầy → tạo thêm threads tới max. Max đầy → rejection policy.

**Rejection policies**

Khi pool + queue đầy: `AbortPolicy` (default, throw exception), `CallerRunsPolicy` (caller thread tự chạy → backpressure tự nhiên), `DiscardPolicy` (bỏ silently), `DiscardOldestPolicy`. Production thường dùng `CallerRunsPolicy` để slow down thay vì crash.

**@Async + Spring AI**

LLM calls chậm (1-5s). `@Async` để xử lý nhiều LLM requests song song hoặc background tasks (generate report, embed documents). Return `CompletableFuture<String>`. Kết hợp custom executor cho I/O-bound (không dùng ForkJoinPool). Exception trong void @Async bị nuốt — dùng `AsyncUncaughtExceptionHandler`.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Bean("aiTaskExecutor")
    public Executor aiTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("ai-async-");
        executor.setRejectedExecutionHandler(
            new ThreadPoolExecutor.CallerRunsPolicy()); // backpressure
        executor.initialize();
        return executor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) ->
            log.error("Async error in {}: {}", method.getName(), ex.getMessage());
    }
}

@Service
public class AsyncAiService {
    private final ChatClient chatClient;
    public AsyncAiService(ChatClient.Builder b) { this.chatClient = b.build(); }

    @Async("aiTaskExecutor")
    public CompletableFuture<String> generateAsync(String prompt) {
        String result = chatClient.prompt().user(prompt).call().content();
        return CompletableFuture.completedFuture(result);
    }
}
// Parallel LLM calls:
// var f1 = service.generateAsync("Summarize topic A");
// var f2 = service.generateAsync("Summarize topic B");
// CompletableFuture.allOf(f1, f2).join(); // both run concurrently
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Config `ThreadPoolTaskExecutor` với core=4, max=10, queue=50, CallerRunsPolicy.
2. Tạo `@Async` method return `CompletableFuture<String>`, verify chạy trên thread "ai-async-".
3. Gọi 5 async LLM tasks song song, dùng `allOf` chờ tất cả — đo thời gian vs tuần tự.
4. Trigger rejection: submit nhiều hơn max+queue, quan sát CallerRunsPolicy behavior.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · @Async hoạt động thế nào? Cần gì để bật?**

`@EnableAsync` trên config class bật async. `@Async` trên method → Spring tạo proxy, chạy method trên thread pool riêng, return ngay (non-blocking caller). Return `CompletableFuture<T>` để lấy kết quả sau, hoặc void cho fire-and-forget.

**Dễ · Tại sao @Async method trong cùng class không chạy async?**

@Async dựa trên AOP proxy. Gọi từ class khác → qua proxy → async hoạt động. Gọi method trong cùng class (`this.asyncMethod()`) → bypass proxy → chạy sync. Fix: tách @Async method sang bean khác, hoặc inject self (antipattern).

**Trung · Giải thích corePoolSize, maxPoolSize, queueCapacity tương tác thế nào.**

Tasks đến: nếu active threads < core → tạo thread mới (tới core). Nếu ≥ core → vào queue. Queue đầy → tạo thêm threads (tới max). Max + queue đầy → rejection policy. Lưu ý: maxPoolSize chỉ có tác dụng khi queue đầy — queue lớn = max ít khi đạt.

**Trung · Tại sao không nên dùng default executor cho @Async?**

Spring default `SimpleAsyncTaskExecutor` tạo thread MỚI cho mỗi task (không reuse, không bound) → nhiều requests → tạo vô số threads → OOM/context-switch thrashing. Luôn config `ThreadPoolTaskExecutor` bounded với named threads cho production.

**Trung · CallerRunsPolicy giúp gì trong production?**

Khi pool + queue đầy, thay vì throw exception (AbortPolicy) hoặc bỏ task (DiscardPolicy), CallerRunsPolicy bắt caller thread tự chạy task đó. Tác dụng: tạo backpressure tự nhiên — caller bị chậm lại → giảm tốc độ submit → pool có thời gian xử lý. Tránh crash + không mất task.

**Khó · @Async + @Transactional cùng method — vấn đề gì?**

@Async chạy method trên thread KHÁC. @Transactional dùng ThreadLocal để giữ transaction context. Thread mới → KHÔNG có transaction context của caller → transaction không propagate. Hơn nữa nếu cả 2 annotation cùng method, thứ tự proxy có thể gây behavior khó lường. Fix: tách rõ — async method gọi 1 transactional method ở bean khác, hoặc quản lý transaction programmatically trong async method.

**Mock EN · "How do you configure thread pools for async tasks in Spring Boot?"**

"I always define a custom `ThreadPoolTaskExecutor` rather than relying on the default, which creates unbounded threads. I size the core pool based on whether the work is CPU-bound (around the number of cores) or I/O-bound like LLM calls (higher, since threads spend time waiting). I set a bounded queue capacity and use `CallerRunsPolicy` so that under overload the caller slows down instead of the app crashing. I name the threads for easier debugging and add an `AsyncUncaughtExceptionHandler` to log exceptions from void async methods, which would otherwise be swallowed."

### 🧠 Quiz Nhanh

1. Cần gì để bật và chạy một method async trong Spring?
   - [ ] Chỉ cần `@Transactional` trên method
   - [ ] Chỉ cần return `CompletableFuture` mà không cần annotation nào
   - [x] `@EnableAsync` trên config class và `@Async` trên method
   - [ ] Phải gọi `Thread.start()` thủ công bên trong method
   💡 `@EnableAsync` bật async support, `@Async` trên method khiến Spring tạo proxy chạy method trên thread pool riêng, return ngay cho caller.

2. Trong ThreadPoolTaskExecutor, thứ tự xử lý task khi tải tăng dần là gì?
   - [x] Dùng core threads → đầy thì vào queue → queue đầy thì tạo thêm tới max → đầy hết thì rejection policy
   - [ ] Tạo ngay tới maxPoolSize → rồi mới vào queue
   - [ ] Vào queue trước → rồi mới tạo core threads
   - [ ] Luôn chạy trên 1 thread duy nhất cho tới khi queue đầy
   💡 maxPoolSize chỉ có tác dụng khi queue đã đầy — queue lớn nghĩa là max ít khi đạt tới.

3. `CallerRunsPolicy` giúp gì khi pool và queue đều đầy?
   - [ ] Bỏ task mới một cách im lặng
   - [ ] Throw exception và dừng ứng dụng
   - [x] Bắt caller thread tự chạy task → tạo backpressure tự nhiên, không mất task
   - [ ] Tự động tăng maxPoolSize lên gấp đôi
   💡 Khác AbortPolicy (throw) hay DiscardPolicy (bỏ task), CallerRunsPolicy làm caller chậm lại nên giảm tốc độ submit, tránh crash và không mất task.

- **🧩 LeetCode:** Task Scheduler (LC #621) — Medium — greedy/queue.

- **🤖 AI Tools:** Dùng AI tune thread pool sizing.

- **📚 Tài Nguyên:** Baeldung "Spring @Async" + "ThreadPoolTaskExecutor".

## ⚡ Ngày 5 · Prompt Engineering

**19/06 — Thứ 6** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Vocalmax + Parroto · 15 phút*
>
> **Vocalmax 10 từ:** prompt, few-shot, zero-shot, role, instruction, constraint, delimiter, chain of thought, grounding, hallucination. **Parroto shadow:** "Few-shot prompting provides examples to guide the model's output."

### 📖 Lý Thuyết Cốt Lõi

**Prompt Engineering cơ bản**

Cách viết prompt để LLM cho output tốt hơn. Nguyên tắc: rõ ràng + cụ thể, cho context, chỉ định format output, dùng delimiters (```) tách phần. Tệ: "viết về Java". Tốt: "Viết 3 bullet points ngắn gọn giải thích JPA cho junior dev, mỗi point < 20 từ".

**Zero-shot vs Few-shot**

Zero-shot: chỉ instruction, không ví dụ ("Classify sentiment: 'I love this'"). Few-shot: cho vài ví dụ input→output để model học pattern ("Tốt → positive\nTệ → negative\n'I love this' →"). Few-shot tăng accuracy cho task phức tạp/format cụ thể.

**Role prompting + Chain of Thought**

Role: gán persona qua system message ("You are a senior Java interviewer") → output phù hợp ngữ cảnh. Chain of Thought (CoT): yêu cầu model "think step by step" → reasoning tốt hơn cho task logic/toán. "Let's think step by step" là magic phrase kinh điển.

**Structured output + grounding**

Structured: yêu cầu JSON/format cụ thể → dễ parse trong code (Spring AI `.entity()`). Grounding: cung cấp facts/context trong prompt để model trả lời dựa trên data thật (giảm hallucination) — nền tảng của RAG (tuần 7). Anti-hallucination: "If you don't know, say so".

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
@Service
public class PromptEngineeringDemo {
    private final ChatClient chatClient;
    public PromptEngineeringDemo(ChatClient.Builder b) { this.chatClient = b.build(); }

    // Few-shot prompting via PromptTemplate
    public String classifySentiment(String text) {
        String fewShot = """
            Classify the sentiment as POSITIVE, NEGATIVE, or NEUTRAL.

            Text: "This product is amazing!"  -> POSITIVE
            Text: "Worst purchase ever."       -> NEGATIVE
            Text: "It arrived on Tuesday."     -> NEUTRAL

            Text: "{input}" ->
            """;
        return chatClient.prompt()
            .user(u -> u.text(fewShot).param("input", text))
            .call().content();
    }

    // Role + Chain of Thought + constraint
    public String explainConcept(String concept) {
        return chatClient.prompt()
            .system("You are a senior Java mentor. Explain concepts simply, " +
                    "using analogies. If unsure, say so honestly.")
            .user(u -> u.text("Explain {c} step by step in under 100 words.")
                        .param("c", concept))
            .call().content();
    }
}
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Viết zero-shot prompt rồi few-shot prompt cho cùng task (sentiment classification), so sánh output.
2. Thêm role (system message) "senior interviewer" → test sự khác biệt giọng văn.
3. Dùng Chain of Thought ("think step by step") cho 1 bài toán logic, so sánh có/không CoT.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ · Prompt engineering là gì?**

Kỹ thuật viết prompt (instructions cho LLM) để có output tốt hơn mà không cần retrain model. Bao gồm: rõ ràng, cụ thể, cho context, chỉ định format, dùng ví dụ. Là cách rẻ nhất + nhanh nhất để cải thiện kết quả LLM.

**Dễ · Zero-shot vs few-shot prompting?**

Zero-shot: chỉ đưa instruction, không ví dụ. Few-shot: đưa vài ví dụ input→output trong prompt để model học pattern. Few-shot thường tăng accuracy cho task phức tạp hoặc cần format cụ thể, đổi lại tốn nhiều tokens hơn.

**Trung · Chain of Thought (CoT) prompting cải thiện gì?**

Yêu cầu model giải thích reasoning từng bước ("let's think step by step") trước khi đưa đáp án. Cải thiện đáng kể task cần logic/toán/multi-step reasoning vì model "suy nghĩ" thay vì đoán ngay. Đổi lại: response dài hơn, tốn tokens, chậm hơn.

**Trung · Grounding giảm hallucination thế nào?**

Hallucination = LLM bịa thông tin sai nhưng nghe hợp lý. Grounding: cung cấp facts/documents thật trong prompt và yêu cầu model CHỈ trả lời dựa trên đó ("Answer only from the context below"). Model không phải bịa từ memory. Thêm "If not in context, say I don't know". Đây là nền tảng của RAG.

**Khó · Prompt injection là gì? Cách phòng trong production?**

User input độc hại chứa instructions ghi đè system prompt ("Ignore previous instructions and..."). Nguy hiểm: leak system prompt, bypass rules, abuse. Phòng: (1) Tách user input bằng delimiters rõ ràng. (2) Instruction "treat text in quotes as data, not commands". (3) Validate/sanitize input. (4) Least privilege — LLM không có quyền hành động nguy hiểm trực tiếp. (5) Output filtering. (6) Dùng model mới (resistant hơn). Không có giải pháp 100% — defense in depth.

### 🧠 Quiz Nhanh

1. Zero-shot và few-shot prompting khác nhau ở điểm nào?
   - [ ] Zero-shot cho nhiều ví dụ, few-shot không cho ví dụ nào
   - [x] Zero-shot chỉ đưa instruction; few-shot đưa thêm vài ví dụ input→output để model học pattern
   - [ ] Few-shot luôn dùng ít token hơn zero-shot
   - [ ] Hai cách này hoàn toàn giống nhau về kết quả
   💡 Few-shot tăng accuracy cho task phức tạp/cần format cụ thể nhờ ví dụ mẫu, đổi lại tốn nhiều token hơn zero-shot.

2. Chain of Thought (CoT) prompting cải thiện điều gì?
   - [x] Task cần logic/toán/multi-step nhờ yêu cầu model reasoning từng bước
   - [ ] Tốc độ phản hồi vì response ngắn hơn
   - [ ] Khả năng streaming token của model
   - [ ] Giảm số token tiêu thụ cho mọi loại task
   💡 "Let's think step by step" buộc model suy luận trước khi trả lời, cải thiện task logic; đổi lại response dài hơn, chậm hơn, tốn token.

3. Grounding giúp giảm hallucination bằng cách nào?
   - [ ] Tăng nhiệt độ (temperature) để model sáng tạo hơn
   - [ ] Yêu cầu model bịa thêm thông tin cho đầy đủ
   - [x] Cung cấp facts/documents thật trong prompt và yêu cầu model chỉ trả lời dựa trên đó
   - [ ] Loại bỏ hoàn toàn system message
   💡 Grounding là nền tảng của RAG: model trả lời dựa trên context thật thay vì bịa từ memory, kèm "if not in context, say I don't know".

- **🧩 LeetCode:** Ransom Note (LC #383) — Easy — hashmap.

- **🤖 AI Tools:** Thử các prompt techniques trên ChatGPT/Claude.

- **📚 Tài Nguyên:** OpenAI Prompt Engineering Guide + Anthropic Prompt Library.

## 🔥 Ngày 6 · Docker basics cho Spring Boot

**20/06 — Thứ 7** · **WEEKEND** · ⏱ 4h (sáng + chiều)

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Parroto Shadowing · 30 phút*
>
> Nghe + shadow "Docker for Java Developers" 30 phút, practice câu phỏng vấn EN về containerization. **Vocalmax review** 20 từ Docker/reactive khó nhất tuần.

### 📖 Lý Thuyết Cốt Lõi

**Container vs VM + image**

Container: đóng gói app + dependencies, share OS kernel của host (nhẹ, nhanh khởi động). VM: ảo hóa cả OS (nặng). Image: template read-only (như class). Container: instance đang chạy của image (như object). Docker Hub: registry chứa images.

**Dockerfile**

Script build image. Instructions chính: `FROM` (base image), `WORKDIR`, `COPY`, `RUN` (build-time), `EXPOSE` (port), `ENTRYPOINT`/`CMD` (run command). Multi-stage build: stage build (Maven) + stage run (JRE nhỏ) → image gọn, không chứa build tools.

**Image layers + best practices**

Mỗi instruction = 1 layer (cached). Đặt instructions ít thay đổi lên trên (dependencies trước code) → cache hiệu quả. Best: multi-stage, base image nhỏ (eclipse-temurin:21-jre-alpine), .dockerignore, không chạy root, layer dependencies tách code.

**docker-compose**

Định nghĩa multi-container app trong `docker-compose.yml` (services, networks, volumes). 1 lệnh `docker compose up` chạy cả Spring Boot + Redis + PostgreSQL. Services giao tiếp qua service name (DNS nội bộ). Phù hợp dev environment + local testing toàn stack.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```docker
# ---- Build stage ----
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline   # cache dependencies layer
COPY src ./src
RUN ./mvnw clean package -DskipTests

# ---- Run stage ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATA_REDIS_HOST=redis
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

# Run: docker compose up --build
# App reaches Redis via hostname "redis" (service name = DNS)
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Viết multi-stage Dockerfile cho Spring Boot app, build image: `docker build -t myapp .`.
2. Chạy container: `docker run -p 8080:8080 myapp`, verify app hoạt động.
3. Viết docker-compose.yml chạy app + Redis, `docker compose up --build`.
4. Verify app connect Redis qua service name "redis" (không phải localhost).

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (8 câu)

**Dễ · Container khác Virtual Machine thế nào?**

Container share OS kernel của host, chỉ đóng gói app + dependencies → nhẹ (MB), khởi động giây. VM ảo hóa cả OS riêng (guest OS) → nặng (GB), khởi động phút. Container density cao hơn, phù hợp microservices. VM cô lập mạnh hơn (security boundary).

**Dễ · Image vs Container khác nhau?**

Image: template read-only (blueprint) chứa app + deps + config — như class trong OOP. Container: instance đang chạy của image — như object. Từ 1 image chạy được nhiều containers. Image build 1 lần, chạy nhiều nơi (build once, run anywhere).

**Trung · Multi-stage build giúp gì?**

Tách build (cần JDK + Maven + source) khỏi runtime (chỉ cần JRE + jar). Stage build compile, stage run copy jar từ stage build. Kết quả: image cuối nhỏ (không chứa JDK/Maven/source), an toàn hơn (ít attack surface), deploy nhanh hơn. Giảm image từ ~700MB xuống ~200MB.

**Trung · Docker layer caching hoạt động thế nào? Tối ưu sao?**

Mỗi Dockerfile instruction tạo 1 layer cached. Nếu layer + các layer trên không đổi → reuse cache (build nhanh). Đặt instructions ít thay đổi lên trên: COPY pom.xml + download deps TRƯỚC khi COPY src. Vì code đổi thường xuyên hơn deps → đổi code không invalidate deps layer → không re-download.

**Trung · Trong docker-compose, services giao tiếp thế nào?**

Compose tạo network nội bộ, mỗi service reachable qua tên service làm hostname (DNS resolution). App connect Redis qua `redis:6379` (tên service "redis"), KHÔNG dùng localhost (localhost trong container = chính container đó). Đây là lý do config dùng `SPRING_DATA_REDIS_HOST=redis`.

**Khó · Tại sao không nên chạy container as root? Best practices security?**

Container root = host root nếu escape container (privilege escalation risk). Best: tạo non-root user trong Dockerfile (`RUN adduser ...; USER appuser`). Khác: (1) base image nhỏ/distroless (ít vulnerabilities). (2) scan images (Trivy). (3) không hardcode secrets (dùng env/secrets). (4) read-only filesystem. (5) drop capabilities. (6) pin image versions (không dùng :latest). (7) .dockerignore tránh leak.

**Mock EN · "How would you containerize a Spring Boot application for production?"**

"I'd write a multi-stage Dockerfile: a build stage with the JDK and Maven that compiles the jar, and a slim runtime stage with just a JRE on a small base like Alpine. I order instructions so dependencies are cached separately from source code for faster rebuilds. I run as a non-root user, pin image versions, use a .dockerignore, and pass secrets via environment variables, never baked into the image. For local development I use docker-compose to spin up the app alongside Redis and Postgres, with services communicating by name over the compose network."

**Mock EN · "What's the difference between CMD and ENTRYPOINT in a Dockerfile?"**

"ENTRYPOINT defines the executable that always runs — it's the fixed command for the container. CMD provides default arguments that can be overridden at runtime via `docker run`. A common pattern is ENTRYPOINT for the main process like `java -jar app.jar` and CMD for default flags. If you only use CMD, the entire command can be replaced; with ENTRYPOINT the base command stays fixed and you only override its arguments. For a Spring Boot app I typically use ENTRYPOINT with the java -jar command."

### 🧠 Quiz Nhanh

1. Container khác Virtual Machine ở điểm cốt lõi nào?
   - [x] Container share OS kernel của host nên nhẹ và khởi động nhanh; VM ảo hóa cả OS riêng nên nặng
   - [ ] Container ảo hóa cả guest OS, VM chỉ đóng gói app
   - [ ] Container luôn nặng hơn VM
   - [ ] VM khởi động nhanh hơn container vì không có kernel
   💡 Container chỉ đóng gói app + dependencies và dùng chung kernel host (MB, khởi động giây); VM có guest OS riêng (GB, khởi động phút) nhưng cô lập mạnh hơn.

2. Vì sao nên đặt `COPY pom.xml` + download dependencies TRƯỚC khi `COPY src`?
   - [ ] Vì Docker bắt buộc dependencies phải đứng cuối Dockerfile
   - [ ] Vì src luôn nhỏ hơn dependencies
   - [x] Để tận dụng layer caching — code đổi thường xuyên hơn deps nên không invalidate layer deps, rebuild nhanh
   - [ ] Vì như vậy image cuối sẽ không chứa source code
   💡 Mỗi instruction là 1 layer cached; đặt phần ít thay đổi (deps) lên trên nên đổi code không làm re-download dependencies.

3. Trong docker-compose, app connect tới Redis qua đâu?
   - [ ] Qua `localhost:6379`
   - [ ] Qua địa chỉ IP public của host
   - [x] Qua tên service làm hostname, ví dụ `redis:6379` (DNS nội bộ của compose network)
   - [ ] Qua biến môi trường `OPENAI_API_KEY`
   💡 Compose tạo network nội bộ, mỗi service reachable qua tên service; localhost trong container trỏ về chính container đó nên không dùng được.

- **🧩 LeetCode:** Number of Islands (LC #200) — Medium — BFS/DFS.

- **🤖 AI Tools:** Dùng AI generate + optimize Dockerfile.

- **📚 Tài Nguyên:** Docker official "Get Started" + Spring Boot "Container Images" docs.

## 🎯 Ngày 7 · Spaced Review T1-T6 + Mini Project

**21/06 — CN** · **REVIEW** · ⏱ 4h (ôn tập + project)

> 🌏 **TIẾNG ANH — HỌC TRƯỚC (trên app)** · *Mock Interview EN · 30 phút*
>
> Mock interview EN — trả lời 10 câu tuần 6 to ra tiếng Anh, record 2 câu hay nhất. Luyện **STAR method** kể chuyện về xây streaming feature.

### 📖 Lý Thuyết Cốt Lõi (Review)

**Reactive recap**

Mono (0-1), Flux (0-N), lazy (subscribe mới chạy), backpressure, non-blocking event-loop scalable cho I/O. `subscribeOn` (source) vs `publishOn` (downstream).

**Streaming + Chatbot recap**

`ChatClient.stream()` → `Flux<String>`, SSE (`text/event-stream`) cho server push, perceived latency. Chat memory: LLM stateless, MessageChatMemoryAdvisor, conversationId, bound context window.

**@Async recap**

`@EnableAsync` + `@Async`, ThreadPoolTaskExecutor (core/max/queue), CallerRunsPolicy backpressure, return CompletableFuture, self-invocation + @Transactional pitfalls.

**Prompt + Docker recap**

Prompt: few-shot, role, CoT, grounding, prompt injection. Docker: multi-stage build, layer caching, docker-compose, service name DNS, non-root security.

### 💻 Mini Project: Streaming Chatbot API (Docker + Flux + Chat Memory)

```java
@RestController
@RequestMapping("/api/v1/chat")
public class StreamingChatbotController {

    private final ChatClient chatClient;

    public StreamingChatbotController(ChatClient.Builder builder, ChatMemory memory) {
        this.chatClient = builder
            .defaultSystem("You are a helpful coding tutor. Be concise and friendly.")
            .defaultAdvisors(new MessageChatMemoryAdvisor(memory))
            .build();
    }

    // Streaming + memory: SSE response with conversation context
    @GetMapping(value = "/{conversationId}/stream",
                produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@PathVariable String conversationId,
                                   @RequestParam String message) {
        return chatClient.prompt()
            .user(message)
            .advisors(a -> a.param(CHAT_MEMORY_CONVERSATION_ID_KEY, conversationId))
            .stream()
            .content()
            .onErrorResume(e -> Flux.just("[Error: " + e.getMessage() + "]"));
    }
}
// docker-compose: app + redis (chat memory backing store)
// Client: EventSource streams tokens, bot remembers conversation
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Complete Streaming Chatbot API: kết hợp Flux streaming (SSE) + Chat Memory (conversationId) + error handling (onErrorResume).
2. Dockerize: viết Dockerfile + docker-compose (app + Redis), `docker compose up` chạy full stack.
3. Push GitHub với README EN: architecture (reactive + streaming + memory + Docker), demo GIF/screenshot, setup instructions.

### 🎤 Câu Hỏi Phỏng Vấn — Review Toàn Tuần (10 câu)

**Dễ · Mono vs Flux?**

`Mono<T>` emit 0-1 item (async Optional), `Flux<T>` emit 0-N items (async Stream). Mono cho single result, Flux cho list/streaming (LLM tokens). Cả 2 lazy — chỉ chạy khi subscribe.

**Dễ · `.stream()` vs `.call()` trong ChatClient?**

`.call().content()` blocking, trả String đầy đủ sau khi LLM xong. `.stream().content()` reactive, trả `Flux<String>` từng chunk. Stream cho UX tốt + long response (typing effect), call cho short/internal.

**Dễ · Tại sao LLM cần chat memory?**

LLM stateless, mỗi call độc lập. Để có context conversation, phải gửi lại history mỗi request. MessageChatMemoryAdvisor tự lưu + inject history theo conversationId.

**Trung · SSE vs WebSocket cho chatbot?**

SSE: 1 chiều server→client, HTTP thường, auto-reconnect, đơn giản — đủ cho streaming LLM response. WebSocket: 2 chiều full-duplex, phức tạp hơn, cho real-time interactive 2 chiều. Chatbot streaming → SSE đủ và đơn giản hơn.

**Trung · Tại sao @Async cần custom ThreadPoolTaskExecutor?**

Default SimpleAsyncTaskExecutor tạo thread mới mỗi task (unbounded) → OOM. Custom executor bounded (core/max/queue) + named threads + rejection policy → control + an toàn. I/O-bound (LLM) dùng pool lớn hơn CPU-bound.

**Trung · Context window limit ảnh hưởng chat memory thế nào?**

History dài → nhiều tokens → vượt context window → error + tốn tiền. Phải bound: sliding window (N messages gần), summarization (tóm tắt cũ), token truncation. Trade-off context đầy đủ vs cost.

**Khó · Streaming response thách thức gì về error handling?**

Đã stream partial data → không rollback được. Cần onErrorResume emit error cuối stream, client xử lý incomplete, timeout cho stream treo, không cache partial, token counting khi stream xong, backpressure nếu client chậm. Phức tạp hơn request-response.

**Khó · Multi-stage Docker build + layer caching tối ưu thế nào?**

Multi-stage: build stage (JDK+Maven) + run stage (JRE only) → image nhỏ, an toàn. Layer caching: COPY pom.xml + download deps TRƯỚC COPY src → code đổi không invalidate deps layer → rebuild nhanh. Non-root user, pin versions, .dockerignore.

**Mock EN · "Walk me through your Streaming Chatbot architecture."**

"It combines this week's concepts. The endpoint returns a `Flux<String>` produced as Server-Sent Events, so the client renders tokens with a typing effect as Spring AI's `.stream()` emits them. A MessageChatMemoryAdvisor backed by Redis maintains conversation history keyed by conversation ID, so the bot remembers context across turns. I add `onErrorResume` to gracefully end the stream on failure. The whole stack — app plus Redis — runs via docker-compose, with services communicating by name. This gives a responsive, stateful, containerized chatbot."

**Mock EN · "How do reactive programming and streaming improve a chatbot's user experience?"**

"Reactive programming lets the server handle the LLM's token stream without blocking a thread per request, so it scales to many concurrent conversations efficiently. Streaming the response token by token over SSE dramatically reduces perceived latency — the user starts reading immediately instead of staring at a blank screen for many seconds. Even though the total generation time is unchanged, the experience feels far faster and more interactive, which is exactly the ChatGPT-style typing effect users now expect."

### 🧠 Quiz Nhanh

1. Trong mini project, vì sao streaming endpoint trả `Flux<String>` qua SSE?
   - [ ] Vì SSE là giao thức 2 chiều full-duplex bắt buộc cho chatbot
   - [x] Vì client render token với typing effect khi `.stream()` emit dần qua `text/event-stream`
   - [ ] Vì `Flux` chỉ hoạt động được với WebSocket
   - [ ] Vì SSE giúp giảm tổng thời gian LLM tạo response
   💡 Endpoint produces `TEXT_EVENT_STREAM_VALUE`, Spring serialize mỗi emission của `.stream()` thành SSE event để client hiển thị token dần dần.

2. Vai trò của `.onErrorResume(e -> Flux.just(...))` trong streaming chatbot là gì?
   - [x] Xử lý lỗi giữa stream bằng cách emit một message lỗi thay vì làm vỡ stream
   - [ ] Tự động rollback các token đã gửi cho client
   - [ ] Lưu conversation history vào Redis
   - [ ] Chuyển stream thành blocking call
   💡 Khi đã stream partial data thì không rollback được; `onErrorResume` kết thúc stream một cách graceful bằng cách phát ra message lỗi cuối cùng.

3. Làm sao bot trong mini project nhớ context qua nhiều lượt?
   - [ ] Nhờ `@Async` chạy mỗi request trên thread riêng
   - [ ] Nhờ LLM tự lưu state giữa các call
   - [x] Nhờ `MessageChatMemoryAdvisor` lưu/inject history theo `conversationId` (backing store Redis)
   - [ ] Nhờ đặt `produces = TEXT_EVENT_STREAM_VALUE`
   💡 LLM stateless nên Advisor lưu và inject history keyed theo conversationId; Redis làm backing store giúp bền vững và share đa instance.

- **🧩 LeetCode:** LRU Cache (LC #146) — Medium — review.

- **🤖 AI Tools:** Tổng hợp streaming + memory + Docker.

- **📚 Tài Nguyên:** Ôn lại docs tuần 6 (Reactor, Spring AI streaming, Docker).

## 🎯 Tổng Kết Tuần 6

### 📋 Ngân Hàng Câu Hỏi Phỏng Vấn

*Ôn lại cuối tuần — trả lời to ra, ghi âm, nghe lại.*

**Reactive & Streaming**

- **"What's the difference between Mono and Flux?"**  
  Mono emits 0 or 1 item (async Optional), Flux emits 0 to N items (async Stream). Both are lazy — nothing runs until you subscribe. Use Mono for single results, Flux for collections and streaming like LLM token output.
- **"Why stream an LLM response instead of returning it all at once?"**  
  LLMs generate tokens sequentially over several seconds. Streaming displays each token as it's produced, so the user sees progress immediately — much lower perceived latency. The total time is unchanged but the UX feels far more responsive, like ChatGPT's typing effect.
- **"SSE vs WebSocket for a chatbot?"**  
  SSE is one-way server-to-client over plain HTTP with auto-reconnect — simple and sufficient for streaming an LLM response. WebSocket is full-duplex and more complex, for two-way real-time interaction. For streaming bot responses, SSE is the simpler right choice.

**Async & Chat Memory**

- **"Why must @Async use a custom thread pool?"**  
  The default SimpleAsyncTaskExecutor creates a new unbounded thread per task, risking OutOfMemory under load. A custom ThreadPoolTaskExecutor with bounded core/max/queue sizes, named threads, and a rejection policy gives control and safety. I/O-bound work like LLM calls uses a larger pool than CPU-bound work.
- **"Why is InMemoryChatMemory insufficient for production?"**  
  It's lost on restart, isn't shared across instances behind a load balancer (causing lost context), and can leak memory without cleanup. Production persists history to Redis or a database keyed by conversation ID, with a TTL for cleanup.
- **"How do you stay within the LLM context window with chat memory?"**  
  Bound the memory — keep a sliding window of recent messages, summarize older context, or truncate by token count. This balances having enough context against cost and the model's token limit.

**Prompt Engineering & Docker**

- **"What is few-shot prompting?"**  
  Providing a few example input-output pairs in the prompt so the model learns the desired pattern and format, versus zero-shot which gives only an instruction. Few-shot improves accuracy for complex or format-specific tasks at the cost of more tokens.
- **"What is prompt injection and how do you mitigate it?"**  
  Malicious user input containing instructions that override the system prompt ("ignore previous instructions"). Mitigate with clear delimiters separating user data from instructions, input validation, least privilege so the LLM can't take dangerous actions, and output filtering. No single fix is complete — use defense in depth.
- **"Why use a multi-stage Docker build?"**  
  It separates the build environment (JDK + Maven + source) from the runtime (just a JRE + jar). The final image is much smaller and more secure because it excludes build tools and source. Combined with proper layer ordering, dependencies are cached separately from code for faster rebuilds.

### ✅ Checklist Cuối Tuần

- [ ] Hiểu Mono vs Flux, viết reactive pipeline với map/filter/subscribe
- [ ] Streaming endpoint trả Flux<String> qua SSE (text/event-stream), test bằng curl -N
- [ ] Chatbot với MessageChatMemoryAdvisor nhớ context qua conversationId
- [ ] Hiểu context window limit + cách bound chat memory (sliding window/summarization)
- [ ] Config ThreadPoolTaskExecutor (core/max/queue) + CallerRunsPolicy cho @Async
- [ ] @Async return CompletableFuture, gọi song song nhiều LLM tasks với allOf
- [ ] Prompt engineering: few-shot, role, Chain of Thought, grounding chống hallucination
- [ ] Hiểu prompt injection và cách phòng (delimiters, validation, least privilege)
- [ ] Multi-stage Dockerfile + docker-compose (app + Redis), services qua service name
- [ ] Mini project Streaming Chatbot API (Flux + Chat Memory + Docker) push GitHub, README EN

> 💡 **Golden Rule Tuần 6:** Reactive không phải lúc nào cũng cần — nhưng streaming LLM thì reactive tỏa sáng. Chatbot không có memory chỉ là API call lặp lại; memory biến nó thành trợ lý thật. @Async + thread pool đúng = xử lý song song an toàn. Prompt engineering rẻ hơn fine-tuning 1000 lần — học viết prompt tốt trước. Docker = "chạy được trên máy tôi" trở thành "chạy được mọi nơi".
