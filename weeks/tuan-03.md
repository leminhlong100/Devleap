# 📙 Tuần 3 · Java Core: Stream + Concurrency · 25/05–31/05/2025

## 📋 Ngày 1 · Stream API · CompletableFuture · Functional Interfaces · Concurrency · SOLID

**Tuần 3 · 25/05–31/05/2025** · **OVERVIEW** · 18h

| Ngày | Thứ | Chế độ | Thời gian | Chủ đề |
| --- | --- | --- | --- | --- |
| 25/05 | Thứ 2 | LIGHT | 1.5h | Stream API nâng cao + Optional |
| 26/05 | Thứ 3 | FULL | 2.5h | CompletableFuture: supplyAsync, thenApply, thenAccept, exceptionally |
| 27/05 | Thứ 4 | FULL | 2.5h | Functional Interfaces: Function, Predicate, Supplier, Consumer, method references |
| 28/05 | Thứ 5 | FULL | 2.5h | Thread, Runnable, Callable, ExecutorService, synchronized, volatile |
| 29/05 | Thứ 6 | LIGHT | 1.5h | SOLID Principles: 5 nguyên tắc với Java examples |
| 30/05 | Thứ 7 | WEEKEND | 4h | CompletableFuture advanced: chaining, allOf, anyOf + Atomic + ThreadLocal |
| 31/05 | CN | REVIEW | 4h | Spaced Review T1-T3 + Mini Project: Async Task Processor |

## ⚡ Ngày 2 · Stream API nâng cao + Optional

**25/05 · Thứ 2** · **LIGHT** · 1.5h

**Optional là gì?**

Container có thể chứa hoặc không chứa giá trị. Tránh NullPointerException. `Optional.of(val)` / `Optional.empty()` / `Optional.ofNullable(val)`.

**Truy xuất giá trị**

`isPresent()` + `get()` (nguy hiểm), `orElse(default)`, `orElseGet(() -> ...)` (lazy), `orElseThrow(() -> new Ex())`.

**Transform với Optional**

`map(fn)` transforms value if present; `filter(predicate)` keeps value if condition true; `ifPresent(consumer)` runs side-effect.

**Stream + Optional**

`Stream.of(a,b,c).filter(Optional::isPresent).map(Optional::get)` hoặc Java 9+: `.flatMap(Optional::stream)`.

```
// Optional best practices
public Optional<String> findUserEmail(Long id) {
    return userRepository.findById(id)
        .map(User::getEmail)
        .filter(email -> email.contains("@"));
}

// Usage
String email = findUserEmail(1L)
    .orElse("default@example.com");

// Anti-pattern (avoid):
// Optional<String> opt = ...;
// if (opt.isPresent()) { String s = opt.get(); } // use ifPresent or map instead

// Java 9 Optional.stream()
List<String> emails = userIds.stream()
    .map(this::findUserEmail)
    .flatMap(Optional::stream)
    .collect(Collectors.toList());
```

- Viết method `findProductById(int id)` trả về `Optional<Product>`, dùng `orElseThrow` để throw `ProductNotFoundException`.
- Chain: `Optional.ofNullable(user).map(User::getAddress).map(Address::getCity).orElse("Unknown")`.
- Refactor một method có `if (x != null)` thành dùng Optional.

**Dễ · Optional là gì? Tại sao nên dùng thay vì null check?**

`Optional<T>` là wrapper container có thể có hoặc không có giá trị. Tránh NPE bằng cách buộc caller phải xử lý "không có giá trị". Code rõ intent hơn, API tường minh hơn.

**Dễ · Sự khác biệt giữa `orElse()` và `orElseGet()`?**

`orElse(T)` luôn evaluate default value (ngay cả khi Optional có giá trị). `orElseGet(Supplier)` lazy — chỉ gọi Supplier khi Optional empty. Dùng `orElseGet` khi default expensive (DB call, object creation).

**Trung · Khi nào KHÔNG nên dùng Optional?**

Không dùng: (1) field của class (serialization broken), (2) method parameter (caller phải handle), (3) collection element (dùng empty collection thay thế). Chỉ dùng cho return type của method.

**Trung · `Optional.map()` vs `Optional.flatMap()` khác nhau thế nào?**

`map(fn)` wrap result trong Optional. `flatMap(fn)` khi fn đã trả về Optional (tránh `Optional<Optional<T>>`). Ví dụ: `opt.flatMap(u -> findAddress(u))` khi `findAddress` returns `Optional<Address>`.

**Khó · Tại sao `Optional.get()` bị coi là anti-pattern?**

Vì nếu Optional empty → `NoSuchElementException`. Mục đích của Optional là ép xử lý "không có giá trị" — dùng `get()` bỏ qua safety. Thay thế: `orElseThrow()` (explicit), `ifPresent()` (side-effect), `map()` (transform). Rule: never call `get()` without `isPresent()` check, better yet avoid `get()` entirely.

### 🧠 Quiz Nhanh

1. Khi nào nên dùng `orElseGet()` thay vì `orElse()`?
   - [ ] Khi Optional luôn có giá trị
   - [x] Khi default value tốn kém (DB call, tạo object) vì `orElseGet` lazy chỉ chạy Supplier khi empty
   - [ ] Khi muốn throw exception lúc empty
   - [ ] Khi cần transform giá trị bên trong
   💡 `orElse(T)` luôn evaluate default ngay cả khi Optional có giá trị; `orElseGet(Supplier)` chỉ gọi Supplier khi empty nên tránh chi phí thừa.

2. Trường hợp nào KHÔNG nên dùng Optional?
   - [ ] Làm return type của method
   - [ ] Trong `map`/`filter` chain
   - [x] Làm field của class hoặc method parameter
   - [ ] Khi cần tránh NullPointerException
   💡 Optional chỉ nên dùng cho return type; dùng làm field gây lỗi serialization, làm parameter ép caller phải xử lý, trong collection nên dùng empty collection.

3. Tại sao `Optional.get()` bị coi là anti-pattern?
   - [x] Vì nếu Optional empty sẽ throw `NoSuchElementException`, bỏ qua mục đích safety của Optional
   - [ ] Vì nó luôn trả về null
   - [ ] Vì nó chậm hơn `orElse()`
   - [ ] Vì nó không compile trong Java 9+
   💡 Mục đích của Optional là ép xử lý trường hợp "không có giá trị"; `get()` mà không check `isPresent()` đánh mất an toàn — nên dùng `orElseThrow()`, `ifPresent()` hoặc `map()`.

LeetCode

#2095 Delete Middle of Linked List

Medium

AI Tool

Copilot

Gợi ý refactor null checks → Optional

Resource

Baeldung Guide to Optional

baeldung.com/java-optional

## 💪 Ngày 3 · CompletableFuture: supplyAsync, thenApply, thenAccept, exceptionally

**26/05 · Thứ 3** · **FULL** · 2.5h

**CompletableFuture là gì?**

Java 8 class cho async/non-blocking code. `CompletableFuture.supplyAsync(() -> ...)` chạy trên ForkJoinPool. Trả về `CompletableFuture<T>`.

**Transform chain**

`thenApply(fn)` transform kết quả (như Stream.map). `thenAccept(consumer)` consume kết quả (không return). `thenRun(runnable)` chạy sau khi done (không quan tâm result).

**Error handling**

`exceptionally(ex -> fallback)` handle exception, return default. `handle((result, ex) -> ...)` handle cả success và failure. `whenComplete((result, ex) -> ...)` side-effect, không transform.

**Thread control**

`thenApplyAsync(fn)` chạy trên ForkJoinPool. `thenApplyAsync(fn, executor)` chỉ định thread pool riêng. `.join()` block chờ kết quả (như `get()` nhưng unchecked).

```
// Basic async chain
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> fetchUserFromDB(1L))   // chạy async
    .thenApply(user -> user.getName())         // transform
    .thenApply(String::toUpperCase)            // chain
    .exceptionally(ex -> "ANONYMOUS");        // fallback

String result = future.join(); // block & get
System.out.println(result);
```

```
// handle() vs exceptionally()
CompletableFuture<String> robust = CompletableFuture
    .supplyAsync(() -> {
        if (Math.random() < 0.5) throw new RuntimeException("DB down");
        return "data";
    })
    .handle((data, ex) -> {
        if (ex != null) {
            log.error("Failed: " + ex.getMessage());
            return "fallback";
        }
        return data.toUpperCase();
    });
```

- Tạo `CompletableFuture` fetch user từ DB giả (sleep 100ms), transform thành UpperCase name.
- Chain: fetch product → check stock → calculate price (3 `thenApply` steps).
- Add `exceptionally` fallback khi DB throws exception.
- Compare: dùng `thenApply` vs `thenApplyAsync` — in ra thread name để thấy sự khác biệt.

**Dễ · CompletableFuture giải quyết vấn đề gì mà `Future` không làm được?**

`Future` chỉ có `get()` (blocking), không chain được, không handle exception tốt. `CompletableFuture`: non-blocking chain với `thenApply`, error handling với `exceptionally`, combine multiple futures với `allOf/anyOf`. Thực tế: REST call → transform → cache → respond không block main thread.

**Dễ · `thenApply` vs `thenAccept` vs `thenRun` khác nhau thế nào?**

`thenApply(T→U)`: transform, returns `CF<U>`. `thenAccept(T→void)`: consume result, returns `CF<Void>`. `thenRun(()→void)`: ignore result, run action, returns `CF<Void>`. Analogy: Stream's `map` / `forEach` / thenRun như cleanup.

**Trung · Giải thích `exceptionally()` vs `handle()` vs `whenComplete()`.**

`exceptionally`: chỉ trigger khi có exception, phải return fallback value. `handle`: trigger cả success và failure, có thể transform hoặc recover. `whenComplete`: side-effect only (logging), không transform result/exception. Production: dùng `handle` cho business logic, `whenComplete` cho logging/metrics.

**Trung · Thread nào thực thi callback trong `thenApply`?**

Default: cùng thread với stage trước nó (hoặc calling thread nếu đã complete). `thenApplyAsync`: ForkJoinPool.commonPool(). `thenApplyAsync(fn, executor)`: custom executor. Production: luôn dùng async với custom executor để tránh starvation ForkJoinPool.

**Khó · `CompletableFuture.join()` vs `.get()` khác gì nhau?**

Cả hai đều block chờ kết quả. `.get()` throws checked `ExecutionException` + `InterruptedException`. `.join()` throws unchecked `CompletionException`. Dùng `.join()` trong stream pipeline (no checked ex). Dùng `.get(timeout, unit)` khi cần timeout. Production: không dùng trong main thread — defeats async purpose.

**Khó · Khi nào dùng custom Executor thay vì ForkJoinPool?**

ForkJoinPool phù hợp CPU-bound (computation). I/O-bound tasks (DB, HTTP) nên dùng dedicated thread pool (`Executors.newFixedThreadPool(n)`) vì ForkJoinPool threads có thể bị starve khi tất cả blocked chờ I/O. Spring: dùng `@Async` với custom TaskExecutor bean.

**Mock EN · "Can you explain how you'd use CompletableFuture in a Spring Boot service?"**

"In production, I'd inject a custom `ThreadPoolTaskExecutor` and use `CompletableFuture.supplyAsync(() -> service.fetchData(), executor).thenApply(this::transform).exceptionally(ex -> fallback)`. This keeps the REST controller non-blocking. I combine multiple calls with `allOf` when I need results from parallel DB queries before responding."

### 🧠 Quiz Nhanh

1. `CompletableFuture` giải quyết vấn đề gì mà `Future` không làm được?
   - [ ] Cho phép tạo thread mới nhanh hơn
   - [x] Non-blocking chain (`thenApply`), error handling (`exceptionally`) và combine nhiều futures (`allOf/anyOf`)
   - [ ] Tự động shutdown thread pool
   - [ ] Đảm bảo thread-safe cho mọi biến
   💡 `Future` chỉ có `get()` blocking, không chain và xử lý exception kém; `CompletableFuture` bổ sung chaining, error handling và composition.

2. `thenApply`, `thenAccept` và `thenRun` khác nhau thế nào?
   - [ ] Cả ba đều transform và trả về `CF<U>`
   - [ ] Cả ba đều ignore kết quả
   - [x] `thenApply` transform trả `CF<U>`, `thenAccept` consume trả `CF<Void>`, `thenRun` ignore result chạy action trả `CF<Void>`
   - [ ] `thenRun` nhận kết quả còn `thenApply` thì không
   💡 `thenApply(T→U)` map kết quả, `thenAccept(T→void)` consume kết quả, `thenRun(()→void)` bỏ qua kết quả và chạy action.

3. `.join()` khác `.get()` ở điểm nào?
   - [x] `.get()` throws checked `ExecutionException` + `InterruptedException`, còn `.join()` throws unchecked `CompletionException`
   - [ ] `.join()` không block còn `.get()` block
   - [ ] `.join()` chạy async còn `.get()` chạy sync
   - [ ] Hai method hoàn toàn giống nhau
   💡 Cả hai đều block chờ kết quả; khác biệt chính là `.join()` ném unchecked exception nên tiện dùng trong stream pipeline, còn `.get()` ném checked exceptions.

LeetCode

#1115 Print FooBar Alternately

Medium — threading

AI Tool

Copilot

Async code review

Resource

Baeldung CompletableFuture Guide

baeldung.com/java-completablefuture

## 💪 Ngày 4 · Functional Interfaces: Function, Predicate, Supplier, Consumer, method references

**27/05 · Thứ 4** · **FULL** · 2.5h

**`Function<T,R>`**

Nhận T, trả về R. `apply(t)`. `compose(before)` chạy before rồi function này. `andThen(after)` chạy function rồi after. `Function.identity()` trả về input.

**`Predicate<T>`**

Nhận T, trả về boolean. `test(t)`. `and(p2)`, `or(p2)`, `negate()`. Dùng trong `filter()`. `Predicate.not(p)` Java 11+.

**`Supplier<T>` + `Consumer<T>`**

`Supplier`: no input, returns T (factory/lazy init). `Consumer`: nhận T, returns void (side-effect, forEach). `BiConsumer<T,U>` nhận 2 params.

**Method References**

4 loại: `ClassName::staticMethod` (static), `obj::instanceMethod` (bound), `ClassName::instanceMethod` (unbound), `ClassName::new` (constructor). Thay thế lambda khi body chỉ gọi 1 method.

```
// Function composition
Function<String, Integer> strLen = String::length;
Function<Integer, String> intToStr = i -> "Length: " + i;
Function<String, String> pipeline = strLen.andThen(intToStr);
System.out.println(pipeline.apply("Hello")); // "Length: 5"

// Predicate composition
Predicate<String> notEmpty = Predicate.not(String::isEmpty);
Predicate<String> longEnough = s -> s.length() >= 3;
Predicate<String> valid = notEmpty.and(longEnough);
List<String> result = names.stream().filter(valid).collect(Collectors.toList());

// Supplier for lazy init
Supplier<List<String>> listFactory = ArrayList::new;
List<String> list = listFactory.get(); // create only when needed

// Consumer chaining
Consumer<String> print = System.out::println;
Consumer<String> log = s -> logger.info(s);
Consumer<String> printAndLog = print.andThen(log);
names.forEach(printAndLog);
```

- Tạo `Function<Employee, String>` trả về "name (dept)". Chain với `Function<String, String>` uppercase.
- Viết `Predicate<Integer>` kiểm tra số dương VÀ chẵn. Dùng `.and()`.
- Dùng `Supplier<Connection>` để lazy-load DB connection.
- Refactor: thay 3 lambdas lặp bằng method references (static, instance, constructor).

**Dễ · `Function<T,R>`, `Predicate<T>`, `Supplier<T>`, `Consumer<T>` — mỗi cái dùng khi nào?**

`Function`: transform (T→R). `Predicate`: test/filter (T→boolean). `Supplier`: provide without input (→T). `Consumer`: consume without return (T→void). Nhớ qua CRUD: Create=Supplier, Read=Function, test=Predicate, side-effect=Consumer.

**Dễ · Method reference `String::length` tương đương lambda nào?**

Tương đương `(String s) -> s.length()`. Đây là unbound instance method reference — instance cung cấp lúc gọi. Các loại: `Math::abs` (static), `obj::method` (bound), `String::toUpperCase` (unbound), `ArrayList::new` (constructor ref).

**Trung · `Function.compose()` vs `Function.andThen()` — thứ tự thực thi?**

`f.andThen(g)` = g(f(x)) — f trước, g sau. `f.compose(g)` = f(g(x)) — g trước, f sau. Mnemonic: `andThen` đọc trái sang phải (natural), `compose` như toán học f∘g. Ví dụ: `trim.andThen(toLowerCase)` = trim trước, lower sau.

**Trung · Khi nào nên dùng `Predicate.not()` (Java 11)?**

Thay vì `s -> !s.isEmpty()` dùng `Predicate.not(String::isEmpty)` — readable hơn với method reference. Nhất là trong stream: `stream.filter(Predicate.not(String::isBlank))` vs `stream.filter(s -> !s.isBlank())`.

**Khó · Tại sao functional interfaces phải có đúng 1 abstract method? Ý nghĩa của `@FunctionalInterface`?**

SAM (Single Abstract Method) rule: lambda expression implement đúng 1 method nên interface phải có đúng 1 abstract method. `@FunctionalInterface` là annotation kiểm tra compile-time — compile error nếu add method thứ 2. Interface có thể có default/static methods. Ví dụ: `Comparator` có `compare()` (SAM) + nhiều default methods.

**Khó · Giải thích closure trong lambda Java — variable capture hoạt động thế nào?**

Lambda có thể capture biến ngoài scope nhưng biến phải **effectively final** (không thay đổi sau khi capture). JVM copy value vào hidden field của lambda object. Mutable local variable không capture được vì thread safety — biến local trên stack, lambda có thể chạy trên thread khác.

**Mock EN · "How do you use functional interfaces in a real Spring Boot project?"**

"We extensively use them for validation chains: `Predicate<Order>` for business rules composed with `.and()`. In service layer, `Function<Entity, DTO>` mapper objects injected as Spring beans. CompletableFuture pipelines use `Function` chains. We define custom `@FunctionalInterface` for domain-specific transformations like `OrderPricer: Order -> Money`."

### 🧠 Quiz Nhanh

1. Functional interface nào dùng để transform một giá trị từ T sang R?
   - [ ] `Predicate<T>`
   - [ ] `Consumer<T>`
   - [x] `Function<T,R>`
   - [ ] `Supplier<T>`
   💡 `Function` (T→R) transform, `Predicate` (T→boolean) test, `Consumer` (T→void) side-effect, `Supplier` (→T) cung cấp giá trị không cần input.

2. `f.andThen(g)` thực thi theo thứ tự nào?
   - [x] `g(f(x))` — chạy `f` trước rồi `g` sau
   - [ ] `f(g(x))` — chạy `g` trước rồi `f` sau
   - [ ] Chạy `f` và `g` song song
   - [ ] Chỉ chạy `g`, bỏ qua `f`
   💡 `andThen` đọc trái sang phải (f trước, g sau) = `g(f(x))`; ngược lại `f.compose(g)` = `f(g(x))` (g trước).

3. `@FunctionalInterface` và quy tắc SAM có ý nghĩa gì?
   - [ ] Interface phải có ít nhất 2 abstract methods
   - [ ] Interface không được có default method
   - [x] Interface phải có đúng 1 abstract method; annotation kiểm tra compile-time và báo lỗi nếu thêm method thứ 2
   - [ ] Annotation bắt buộc cho mọi interface
   💡 SAM (Single Abstract Method) là cơ sở của lambda; `@FunctionalInterface` enforce đúng 1 abstract method lúc compile, vẫn cho phép default/static methods.

LeetCode

#1636 Sort Array by Increasing Frequency

Easy — with Comparator

AI Tool

Copilot

Refactor lambda→method-ref suggestions

Resource

Baeldung Functional Interfaces

baeldung.com/java-8-functional-interfaces

## 💪 Ngày 5 · Thread, Runnable, Callable, ExecutorService, synchronized, volatile

**28/05 · Thứ 5** · **FULL** · 2.5h

**Thread lifecycle**

NEW → RUNNABLE → RUNNING → BLOCKED/WAITING → TERMINATED. `new Thread(runnable).start()`. `Runnable` = no return, `Callable<T>` = returns T, throws checked exception.

**ExecutorService**

`Executors.newFixedThreadPool(n)`: fixed size. `newCachedThreadPool()`: dynamic (careful with OOM). `newSingleThreadExecutor()`: sequential. Submit: `execute(Runnable)` / `submit(Callable)→Future`.

**synchronized + volatile**

`synchronized(this)` hoặc synchronized method: mutual exclusion, one thread at a time. `volatile field`: visibility guarantee — reads/writes go to main memory, not CPU cache. volatile ≠ atomicity.

**Race condition + Deadlock**

Race: 2 threads read-modify-write cùng biến → inconsistent. Deadlock: T1 holds L1 waits L2; T2 holds L2 waits L1. Fix: lock ordering, timeout, hoặc use higher-level constructs.

```
// ExecutorService + Callable
ExecutorService pool = Executors.newFixedThreadPool(4);

List<Callable<String>> tasks = List.of(
    () -> fetchFromDB("user"),
    () -> fetchFromDB("orders"),
    () -> fetchFromCache("products")
);

List<Future<String>> futures = pool.invokeAll(tasks);
futures.forEach(f -> {
    try { System.out.println(f.get()); }
    catch (Exception e) { e.printStackTrace(); }
});
pool.shutdown();
```

```
// synchronized counter (thread-safe)
public class Counter {
    private int count = 0;

    public synchronized void increment() {
        count++; // read-modify-write atomic
    }

    public synchronized int get() { return count; }
}

// volatile flag
public class Worker implements Runnable {
    private volatile boolean running = true;

    public void stop() { running = false; }

    @Override
    public void run() {
        while (running) { doWork(); } // sees updated value
    }
}
```

- Tạo 10 threads mỗi thread print thread name + số thứ tự. Quan sát interleaving.
- `ExecutorService` chạy 5 tasks tính Fibonacci(40), collect results với `invokeAll`.
- Race condition demo: 1000 threads tăng counter không sync → sai. Fix với `synchronized`.
- Implement Producer-Consumer đơn giản với `BlockingQueue<String>`.

**Dễ · `Runnable` vs `Callable` khác gì nhau?**

`Runnable.run()`: no return, no checked exception. `Callable<T>.call()`: returns T, throws checked Exception. Dùng `Callable` khi cần kết quả hoặc có thể throw. `ExecutorService.submit(Callable)` → `Future<T>`.

**Dễ · `volatile` giải quyết vấn đề gì? Khi nào không đủ?**

Giải quyết visibility: đảm bảo thread khác thấy giá trị mới nhất (không đọc CPU cache). KHÔNG giải quyết atomicity: `count++` là 3 operations (read, increment, write) — không atomic dù `volatile`. Dùng `AtomicInteger` hoặc `synchronized` cho compound operations.

**Trung · `newFixedThreadPool` vs `newCachedThreadPool` — khi nào dùng cái nào?**

Fixed: CPU-bound tasks (số thread = CPU cores), predictable, no OOM risk. Cached: short-lived I/O tasks, scales up/down. Danger: unbounded growth → OOM với nhiều concurrent tasks. Production: dùng custom `ThreadPoolExecutor` với bounded queue + rejection policy.

**Trung · Giải thích thread deadlock và cách prevent.**

Deadlock: T1 holds A, waits B; T2 holds B, waits A → circular wait. 4 conditions: mutual exclusion, hold-and-wait, no preemption, circular wait. Prevention: (1) consistent lock ordering, (2) `tryLock(timeout)` với ReentrantLock, (3) avoid nested locks, (4) use higher-level: `java.util.concurrent` instead of raw `synchronized`.

**Khó · `synchronized method` vs `synchronized(this)` vs `synchronized(lock)` — phân tích.**

`synchronized method` ≡ `synchronized(this)` — locks on instance. Static sync method locks on Class object. `synchronized(specificLock)` — fine-grained, can have multiple locks per object → higher throughput. Pattern: `private final Object lock = new Object(); synchronized(lock) {...}` — object private, không ai khác có thể sync on same lock.

**Khó · Tại sao `ExecutorService.shutdown()` cần gọi + phân biệt `shutdown()` vs `shutdownNow()`?**

`shutdown()`: không nhận task mới, chờ tasks đang chạy hoàn thành (graceful). `shutdownNow()`: cố interrupt running tasks, trả về list of unexecuted tasks. `awaitTermination(timeout)` block chờ termination. Không shutdown → threads không daemon = JVM không exit. Production pattern: Runtime.addShutdownHook to gracefully shutdown.

**Mock EN · "Tell me about a concurrency issue you've encountered or how you'd design a thread-safe cache."**

"I'd use ConcurrentHashMap with computeIfAbsent for thread-safe lazy initialization. For cache invalidation, a ScheduledExecutorService runs cleanup every N minutes. If cache miss rate is concern, use read-write separation with ReadWriteLock — multiple readers, exclusive writer. In production I use Caffeine cache which handles all this, but understanding the underlying mechanics helps debug cache stampede issues."

### 🧠 Quiz Nhanh

1. `Runnable` và `Callable` khác nhau thế nào?
   - [ ] `Runnable` trả về giá trị, `Callable` thì không
   - [x] `Callable<T>.call()` trả về T và throws checked Exception, còn `Runnable.run()` không return và không throws checked exception
   - [ ] Cả hai đều trả về `Future`
   - [ ] `Runnable` chỉ chạy trên main thread
   💡 Dùng `Callable` khi cần kết quả hoặc có thể throw checked exception; `ExecutorService.submit(Callable)` trả về `Future<T>`.

2. `volatile` đảm bảo điều gì và khi nào không đủ?
   - [x] Đảm bảo visibility nhưng KHÔNG đảm bảo atomicity, nên `count++` vẫn sai dù có `volatile`
   - [ ] Đảm bảo cả visibility lẫn atomicity cho mọi thao tác
   - [ ] Khóa biến để chỉ 1 thread truy cập
   - [ ] Tự động dùng `AtomicInteger` bên dưới
   💡 `volatile` đảm bảo thread khác đọc được giá trị mới nhất (không đọc CPU cache), nhưng `count++` gồm 3 thao tác không atomic — cần `AtomicInteger` hoặc `synchronized`.

3. `shutdown()` khác `shutdownNow()` ở điểm nào?
   - [ ] `shutdown()` interrupt ngay mọi task đang chạy
   - [ ] Cả hai đều trả về list task chưa chạy
   - [x] `shutdown()` graceful (không nhận task mới, chờ task đang chạy xong), `shutdownNow()` cố interrupt task đang chạy và trả về list task chưa thực thi
   - [ ] `shutdownNow()` chờ tất cả task hoàn thành
   💡 Nếu không shutdown, các non-daemon thread khiến JVM không exit; `shutdown()` là graceful còn `shutdownNow()` cố dừng ngay.

LeetCode

#1114 Print in Order

Easy — threading

AI Tool

IntelliJ

Thread Concurrency analyzer

Resource

Baeldung Java Concurrency

baeldung.com/java-concurrency

## ⚡ Ngày 6 · SOLID Principles: 5 nguyên tắc với Java examples

**29/05 · Thứ 6** · **LIGHT** · 1.5h

**S — Single Responsibility**

Mỗi class chỉ có 1 lý do thay đổi. `UserService` làm auth → sai. Tách: `UserService`, `AuthService`, `EmailService`. Dấu hiệu vi phạm: class có "and" trong tên mục đích.

**O + L — Open/Closed + Liskov**

Open/Closed: mở để extend, đóng để modify. Dùng interface/abstract + polymorphism. Liskov: subclass phải thay thế được parent mà không break behavior. Vi phạm: `Rectangle extends Square` (phá vỡ area invariant).

**I — Interface Segregation**

Clients không bị ép implement methods mà không dùng. Tách `Animal` interface thành `Walkable`, `Swimmable`, `Flyable`. Fat interface → nhiều nhỏ.

**D — Dependency Inversion**

High-level không depend on Low-level — cả hai depend on abstraction. Inject qua constructor (DI). Spring @Autowired là DI in action. Dễ mock trong test.

```
// DIP example (Spring-style)
// BAD: high-level depends on low-level
public class OrderService {
    private MySQLOrderRepo repo = new MySQLOrderRepo(); // concrete!
}

// GOOD: depend on abstraction
public interface OrderRepository { Order findById(Long id); }

public class OrderService {
    private final OrderRepository repo; // interface
    public OrderService(OrderRepository repo) { this.repo = repo; } // injected
}

// Test: inject mock
OrderRepository mockRepo = mock(OrderRepository.class);
OrderService service = new OrderService(mockRepo);

// ISP example
interface Printable { void print(); }
interface Scannable { void scan(); }
interface Faxable { void fax(); }

class BasicPrinter implements Printable { /* only print */ }
class MultiFunctionDevice implements Printable, Scannable { /* print + scan */ }
```

- Refactor `UserManager` class (có 5 methods: login, sendEmail, saveToDb, generateReport, validatePassword) thành các class riêng.
- Viết Shape hierarchy dùng OCP: `abstract Shape`, subclasses `Circle/Rectangle`, `AreaCalculator` không cần sửa khi thêm shape mới.
- Identify SOLID violation trong đoạn code cho sẵn.

**Dễ · SOLID là gì? Đọc tên 5 chữ cái?**

S=Single Responsibility, O=Open/Closed, L=Liskov Substitution, I=Interface Segregation, D=Dependency Inversion. Mục đích: code dễ maintain, extend, test.

**Dễ · Liskov Substitution Principle — ví dụ vi phạm?**

Classic: `Square extends Rectangle`. Nếu set width → height cũng thay đổi → vi phạm. Code dùng Rectangle expect `setWidth(5); setHeight(3); area()==15` → Square phá vỡ behavior. Fix: đừng dùng inheritance ở đây, dùng interface `Shape`.

**Trung · Phân biệt "tightly coupled" vs "loosely coupled" với ví dụ.**

Tight: `OrderService` directly `new MySQLRepo()` → không test được, không đổi DB được. Loose: inject `OrderRepository` interface → swap implementation. Spring @Autowired = loose coupling. Test = inject mock. Loose coupling = high cohesion, dễ change.

**Trung · Interface Segregation trong Java Collections — ví dụ thực tế?**

`List extends Collection extends Iterable` — phân tầng rõ. `Iterator` chỉ có 3 methods cần thiết. Contrast: nếu `Animal` interface có `fly()`, `swim()`, `run()` → Dog phải implement `fly()` → vi phạm ISP. Tốt hơn: `Flyable`, `Swimmable`, `Runnable` riêng.

**Khó · Dependency Inversion vs Dependency Injection — khác nhau thế nào?**

DIP (principle): depend on abstraction, không depend on concrete. DI (pattern/technique): cơ chế để đạt DIP — inject dependencies từ outside. DIP là WHY, DI là HOW. Spring IoC container thực hiện DI. Constructor injection > field injection (testable, immutable, visible dependencies).

### 🧠 Quiz Nhanh

1. Chữ "S" trong SOLID đại diện cho nguyên tắc nào?
   - [x] Single Responsibility — mỗi class chỉ có 1 lý do thay đổi
   - [ ] Separation of Concerns
   - [ ] Stateless Service
   - [ ] Static Resolution
   💡 SOLID: S=Single Responsibility, O=Open/Closed, L=Liskov Substitution, I=Interface Segregation, D=Dependency Inversion.

2. Ví dụ kinh điển vi phạm Liskov Substitution Principle là gì?
   - [ ] `OrderService` inject `OrderRepository` interface
   - [ ] Tách `Animal` thành `Walkable`, `Swimmable`
   - [x] `Square extends Rectangle` — set width khiến height đổi theo, phá vỡ invariant `setWidth(5); setHeight(3); area()==15`
   - [ ] Dùng constructor injection thay field injection
   💡 Square kế thừa Rectangle phá vỡ behavior mà code dùng Rectangle kỳ vọng; nên dùng interface `Shape` thay vì inheritance ở đây.

3. Dependency Inversion (DIP) khác Dependency Injection (DI) thế nào?
   - [ ] Chúng là hai tên gọi của cùng một thứ
   - [x] DIP là nguyên tắc (depend on abstraction = WHY), DI là kỹ thuật để đạt DIP (inject dependency từ ngoài = HOW)
   - [ ] DI là nguyên tắc còn DIP là pattern
   - [ ] DIP chỉ áp dụng cho Spring
   💡 DIP nói "phụ thuộc vào abstraction, không phụ thuộc concrete"; DI là cơ chế (constructor/field injection, Spring IoC) thực hiện DIP.

LeetCode

#146 LRU Cache

Medium — design

AI Tool

SonarLint

SOLID violation detection

Resource

Baeldung SOLID Principles

baeldung.com/solid-principles

## 🔥 Ngày 7 · CompletableFuture advanced: chaining, allOf, anyOf + Atomic + ThreadLocal

**30/05 · Thứ 7** · **WEEKEND** · 4h

**CompletableFuture combining**

`allOf(cf1, cf2, cf3)` trả về `CF<Void>` hoàn thành khi tất cả done. `anyOf(...)` hoàn thành khi 1 trong số done. `thenCompose(fn)` = flatMap (tránh `CF<CF<T>>`). Pattern: parallel fetch → combine.

**Atomic classes**

`AtomicInteger`, `AtomicLong`, `AtomicReference<T>`. `compareAndSet(expected, update)` = CAS operation (lock-free). Nhanh hơn `synchronized` cho simple counter. `incrementAndGet()`, `getAndAdd(delta)`.

**ThreadLocal<T>**

Per-thread storage. `set(value)` / `get()` / `remove()`. Use case: Spring `SecurityContextHolder`, request-scoped data, SimpleDateFormat (not thread-safe). WARNING: memory leak nếu dùng với thread pool — always `remove()` in finally.

**ReentrantLock**

Flexible than `synchronized`: `tryLock(timeout)`, `lockInterruptibly()`, fairness option, `Condition` for wait/signal. `lock()` + `unlock()` in finally. Multiple Conditions per lock.

```
// Parallel fetch + combine
CompletableFuture<User> userCF = CompletableFuture.supplyAsync(() -> fetchUser(1L));
CompletableFuture<List<Order>> ordersCF = CompletableFuture.supplyAsync(() -> fetchOrders(1L));

CompletableFuture<UserProfile> profile = userCF.thenCombine(ordersCF,
    (user, orders) -> new UserProfile(user, orders));

// allOf for multiple futures
CompletableFuture<Void> allDone = CompletableFuture.allOf(userCF, ordersCF);
allDone.thenRun(() -> System.out.println("All fetched!"));
```

```
// AtomicInteger (lock-free counter)
AtomicInteger counter = new AtomicInteger(0);
IntStream.range(0, 1000).parallel().forEach(i -> counter.incrementAndGet());
System.out.println(counter.get()); // always 1000

// ThreadLocal for request context
ThreadLocal<String> requestId = new ThreadLocal<>();
// In filter: requestId.set(UUID.randomUUID().toString());
// In service: String id = requestId.get();
// In finally: requestId.remove(); // CRITICAL for thread pools
```

- `allOf` — fetch 3 services parallel, combine results, print total time vs sequential.
- `thenCompose` — fetchUser → thenCompose fetchOrders(userId) (avoid CF<CF>).
- AtomicInteger counter: 100 threads increment 100 times each → verify 10000.
- ThreadLocal request-ID: simulate filter sets ID, service reads ID, verify isolation.

**Dễ · `allOf()` vs `anyOf()` — khi nào dùng?**

`allOf`: đợi TẤT CẢ hoàn thành (aggregate results). `anyOf`: lấy kết quả của NHANH NHẤT (fastest wins, timeout pattern). Ví dụ: `allOf` = fetch user + orders + address cùng lúc trước khi render. `anyOf` = query primary DB và backup DB, lấy ai trả lời trước.

**Dễ · `thenCompose` khác `thenApply` thế nào?**

`thenApply(T→U)` = map. `thenCompose(T→CF<U>)` = flatMap. Khi transform function trả về CF thì dùng `thenCompose` để tránh `CF<CF<U>>`. Pattern: fetch user → thenCompose(u → fetchOrders(u.id)) vs thenApply → CF<CF<Order>>.

**Trung · Tại sao CAS (compareAndSet) được gọi là "lock-free"?**

CAS là hardware instruction (cmpxchg) — atomic read-compare-write trong 1 CPU cycle. Không cần OS mutex. Nếu compare fail (concurrent update), retry loop (spin). "Lock-free" = no kernel-level lock, không context switch. Nhanh hơn synchronized cho lightly-contended scenarios.

**Trung · ThreadLocal memory leak xảy ra thế nào? Cách tránh?**

Thread pool reuse threads → ThreadLocal values persist giữa requests. Nếu không `remove()`, giá trị cũ từ request trước leak sang request sau → security bug (user A thấy data của user B) + memory leak. Fix: luôn `remove()` trong finally block hoặc servlet filter afterCompletion.

**Khó · So sánh `synchronized` vs `ReentrantLock` — khi nào chọn cái nào?**

`synchronized`: simpler, auto-release, JVM-optimized (biased locking). `ReentrantLock`: tryLock(timeout) để tránh deadlock, fairness (`new ReentrantLock(true)`), multiple Conditions, lockInterruptibly. Rule: default synchronized; ReentrantLock khi cần tryLock, fairness, hoặc Condition variables.

**Khó · Explain `StampedLock` và optimistic read — khi nào nó outperforms `ReadWriteLock`?**

`ReadWriteLock`: readers share lock, writer exclusive. `StampedLock`: optimistic read (không lock) → validate stamp → nếu invalid, upgrade to read lock. Outperforms khi read >> write, đọc nhanh. Downside: không reentrant, không support interruption. Java 8+. Production: cache implementations where reads dominate.

**Mock EN · "How would you handle 1000 concurrent API calls to an external service?"**

"I'd use a bounded thread pool, say 50 threads, with CompletableFuture.supplyAsync targeting that pool. Use a semaphore or rate limiter (Resilience4j) to cap concurrent calls. Result aggregation with allOf. Circuit breaker for failure handling. Backpressure with BlockingQueue if producer outpaces consumer. In Spring WebFlux I'd use reactive Mono/Flux for fully non-blocking."

**Mock EN · "What's the difference between parallelism and concurrency?"**

"Concurrency is about dealing with multiple tasks at once — they may not run simultaneously (time-slicing on 1 CPU). Parallelism is about doing multiple tasks simultaneously on multiple CPUs. Concurrency is a design property, parallelism is a runtime property. Java: concurrency via threads/CompletableFuture; parallelism via parallel streams, ForkJoinPool. Most production code needs concurrency for I/O; parallelism mainly for CPU-bound computation."

### 🧠 Quiz Nhanh

1. `allOf()` và `anyOf()` khác nhau thế nào?
   - [x] `allOf` đợi TẤT CẢ futures hoàn thành (aggregate), `anyOf` hoàn thành khi NHANH NHẤT xong (fastest wins)
   - [ ] `allOf` lấy kết quả nhanh nhất, `anyOf` đợi tất cả
   - [ ] Cả hai đều chạy futures tuần tự
   - [ ] `anyOf` chỉ dùng được với đúng 2 futures
   💡 `allOf` dùng khi cần gộp kết quả nhiều future (vd fetch user + orders + address); `anyOf` dùng cho pattern fastest-wins như query primary và backup DB.

2. Tại sao CAS (`compareAndSet`) được gọi là "lock-free"?
   - [ ] Vì nó dùng `synchronized` bên trong
   - [ ] Vì nó luôn thành công ngay lần đầu
   - [x] Vì nó là hardware instruction (cmpxchg) atomic, không cần OS mutex; nếu compare fail thì retry (spin), không context switch
   - [ ] Vì nó chặn mọi thread khác cho đến khi xong
   💡 CAS thực hiện read-compare-write atomic ở mức CPU, không cần kernel lock — nhanh hơn `synchronized` trong tình huống ít tranh chấp.

3. `ThreadLocal` memory leak xảy ra thế nào và cách tránh?
   - [ ] Chỉ xảy ra khi tạo thread mới mỗi request
   - [x] Thread pool reuse thread khiến value cũ persist sang request sau; tránh bằng cách luôn `remove()` trong finally
   - [ ] Không bao giờ leak vì ThreadLocal tự dọn
   - [ ] Tránh bằng cách không dùng `get()`
   💡 Với thread pool, nếu không `remove()`, giá trị từ request trước leak sang request sau (security bug + memory leak); luôn `remove()` trong finally hoặc afterCompletion.

LeetCode

#347 Top K Frequent

Medium — review

AI Tool

Java VisualVM

Thread monitoring

Resource

Baeldung ReentrantLock + StampedLock

baeldung.com/java-concurrent-locks

## 🎯 Ngày 8 · Spaced Review T1-T3 + Mini Project: Async Task Processor

**31/05 · Chủ Nhật** · **REVIEW** · 4h

**Stream + Optional recap**

Stream API chain: source → filter → map → collect. Optional phòng NPE. `flatMap(Optional::stream)` Java 9+. Avoid `Optional.get()` without check.

**CompletableFuture recap**

`supplyAsync` → `thenApply` → `exceptionally`. `allOf` parallel. `thenCompose` flatMap. Custom executor for I/O.

**Functional recap**

`Function.andThen/compose`. `Predicate.and/or/negate`. Method references (4 types). Lambda captures effectively-final vars.

**Concurrency recap**

Thread lifecycle. ExecutorService patterns. `synchronized` vs `volatile` vs `AtomicXxx` vs `ReentrantLock`. ThreadLocal caution.

```
public class AsyncTaskProcessor {
    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private final List<String> results = Collections.synchronizedList(new ArrayList<>());

    public CompletableFuture<String> processTask(String task) {
        return CompletableFuture
            .supplyAsync(() -> heavyComputation(task), executor)
            .thenApply(result -> "[DONE] " + result)
            .exceptionally(ex -> "[ERROR] " + task + ": " + ex.getMessage());
    }

    public List<String> processAll(List<String> tasks) {
        List<CompletableFuture<String>> futures = tasks.stream()
            .map(this::processTask)
            .collect(Collectors.toList());

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        return futures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList());
    }

    private String heavyComputation(String input) {
        try { Thread.sleep(100); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        return input.toUpperCase();
    }

    public void shutdown() { executor.shutdown(); }
}
```

- Complete `AsyncTaskProcessor` — add retry logic (3 attempts) với `exceptionally`.
- Add `Predicate<String>` filter to skip invalid tasks before processing.
- Push project to GitHub với README.md mô tả architecture EN (5+ câu).

**Dễ · `Optional.orElse()` vs `orElseGet()` — performance difference?**

`orElse(T)`: T luôn được evaluate (ngay cả khi value present). `orElseGet(Supplier<T>)`: Supplier chỉ chạy khi empty (lazy). Với expensive default (new object, DB call) → `orElseGet`. Example: `orElse(new User())` creates User even if found; `orElseGet(User::new)` only when missing.

**Dễ · CompletableFuture `thenApply` vs `thenApplyAsync` — thread execution?**

`thenApply`: runs on completing thread (or caller if already done). `thenApplyAsync`: runs on ForkJoinPool.commonPool(). `thenApplyAsync(fn, exec)`: runs on custom executor. For I/O tasks always use async + custom I/O thread pool to avoid blocking ForkJoinPool.

**Dễ · 4 loại method reference — ví dụ mỗi loại?**

Static: `Math::abs` ≡ `x -> Math.abs(x)`. Bound instance: `str::contains` ≡ `x -> str.contains(x)`. Unbound: `String::toUpperCase` ≡ `s -> s.toUpperCase()`. Constructor: `ArrayList::new` ≡ `() -> new ArrayList<>()`.

**Trung · Khi nào Stream `parallel()` giúp và khi nào gây hại?**

Giúp: CPU-bound, large dataset (>10k elements), no shared mutable state, order không quan trọng. Gây hại: I/O-bound (block ForkJoinPool), small dataset (overhead > gain), shared state (race condition), order-sensitive ops. Rule: benchmark first; default sequential unless profiling shows bottleneck.

**Trung · Explain `synchronized` + `wait/notify` pattern.**

`wait()`: release lock, thread goes to WAITING. `notify()`: wake one waiting thread. `notifyAll()`: wake all. Phải gọi trong synchronized block. Pattern: `while (!condition) { lock.wait(); } doWork();` — vòng loop vì spurious wakeups. `notify` vs `notifyAll`: dùng `notifyAll` an toàn hơn khi nhiều conditions.

**Trung · SOLID — Single Responsibility — ví dụ vi phạm trong Spring?**

`UserController` vừa xử lý HTTP vừa validate business logic vừa query DB → 3 reasons to change. Fix: Controller chỉ handle HTTP, Service handle business logic, Repository handle DB. Dấu hiệu: class > 200 lines, method > 20 lines, class có "and" trong tên.

**Khó · Giải thích Java Memory Model (JMM) và happens-before relationship.**

JMM định nghĩa visibility và ordering guarantees giữa threads. Happens-before: action A happens-before B nếu B thấy tất cả effects của A. Guaranteed: synchronized block exit → enter, volatile write → read, Thread.start() → run(), join() return → completion. Không có happens-before → data race (undefined behavior).

**Khó · CompletableFuture `exceptionally` vs `handle` vs `whenComplete` — production pattern?**

`exceptionally`: simple recovery, return fallback. `handle`: transform result OR recover from exception, most flexible. `whenComplete`: side-effect (logging, metrics) without altering pipeline. Pattern: `thenApply(transform).handle(logAndRecover).whenComplete(metrics)`. Never swallow exceptions silently.

**Mock EN · "Walk me through your AsyncTaskProcessor project architecture."**

"The processor uses a bounded 4-thread ExecutorService to avoid resource exhaustion. Each task runs via `supplyAsync` returning a CompletableFuture. I chain `thenApply` for transformation and `exceptionally` for error recovery. `allOf` joins all futures then I collect results. Collections.synchronizedList ensures thread safety for the result list. Shutdown hook ensures graceful termination. This pattern scales to 100+ concurrent tasks efficiently."

**Mock EN · "How does the JVM handle thread scheduling?"**

"JVM delegates to the OS thread scheduler. Threads compete for CPU time slices — preemptive multitasking. Thread priority (1-10, default 5) is a hint to the scheduler, not a guarantee. The JVM doesn't guarantee fairness. `Thread.yield()` suggests giving up CPU. `Thread.sleep(ms)` suspends for at least ms. For precise scheduling use ScheduledExecutorService with fixed-rate or fixed-delay."

### 🧠 Quiz Nhanh

1. Khi nào Stream `parallel()` giúp ích và khi nào gây hại?
   - [ ] Luôn nhanh hơn sequential trong mọi trường hợp
   - [x] Giúp với CPU-bound, dataset lớn, không shared mutable state; gây hại với I/O-bound, dataset nhỏ, shared state hoặc thao tác order-sensitive
   - [ ] Chỉ giúp khi dataset nhỏ
   - [ ] Luôn an toàn với shared mutable state
   💡 `parallel()` chỉ lợi khi CPU-bound + dataset lớn + không shared state; với I/O-bound hoặc dataset nhỏ, overhead lớn hơn lợi ích — nên benchmark trước.

2. Happens-before trong Java Memory Model đảm bảo điều gì?
   - [ ] Mọi thread luôn chạy theo đúng thứ tự code
   - [x] Nếu A happens-before B thì B thấy được tất cả effects của A; ví dụ volatile write → read, `Thread.start()` → run()
   - [ ] Loại bỏ hoàn toàn nhu cầu dùng `synchronized`
   - [ ] Chỉ áp dụng cho biến `final`
   💡 JMM định nghĩa visibility/ordering qua happens-before; không có quan hệ này thì xảy ra data race (undefined behavior).

3. Trong production, `exceptionally`, `handle` và `whenComplete` dùng cho mục đích gì?
   - [x] `exceptionally` recovery đơn giản trả fallback, `handle` linh hoạt nhất (transform result HOẶC recover exception), `whenComplete` side-effect (logging/metrics) không đổi pipeline
   - [ ] Cả ba đều bắt buộc phải trả về fallback value
   - [ ] `whenComplete` dùng để transform kết quả
   - [ ] `handle` chỉ chạy khi không có exception
   💡 Pattern: `thenApply(transform).handle(logAndRecover).whenComplete(metrics)`; `whenComplete` chỉ side-effect, `handle` xử lý cả success lẫn failure, không bao giờ nuốt exception âm thầm.

LeetCode

#56 Merge Intervals

Medium — review

AI Tool

JProfiler / VisualVM

Thread dump analysis

Resource

Java Concurrency in Practice

Book by Brian Goetz

## 🎯 Ngày 9 · Tuần 3 · Stream + Concurrency · Review & Checklist

**Tổng Kết** · **SUMMARY**

## 🎯 Tổng Kết Tuần 3

### Interview Q&A Bank

**Stream & Optional**

- **What is Optional and when should you not use it?**  
  Optional is a container to explicitly handle absent values. Don't use: as field (serialization), as parameter (caller must handle null anyway), inside collections (use empty collection). Only for return types.
- **Explain Stream lazy evaluation.**  
  Intermediate ops (filter, map) are lazy — not executed until terminal op (collect, count) is called. Enables short-circuiting (findFirst stops at first match). Stream.of(1,2,3).filter(n->n>1).findFirst() only evaluates until first match found.
- **thenCompose vs thenApply in CompletableFuture?**  
  thenApply(T→U) = map, wraps in CF. thenCompose(T→CF<U>) = flatMap, flattens. Use thenCompose when transform function itself returns a CompletableFuture.

**Functional Programming**

- **What is a SAM interface?**  
  Single Abstract Method interface — the basis for lambda expressions. @FunctionalInterface enforces this at compile time. Built-in: Function, Predicate, Supplier, Consumer, Comparator. Any interface with exactly 1 abstract method can be used with lambda.
- **Method reference vs lambda — when to prefer?**  
  Method reference when lambda body is just a single method call: `String::toUpperCase` over `s -> s.toUpperCase()`. More readable. Lambda preferred when logic is custom or needs parameters beyond method signature.
- **Explain closure and effectively final in Java lambdas.**  
  Lambda can capture local variables from enclosing scope only if they are effectively final (not modified after assignment). JVM copies the value. Prevents data races since lambda may run on different thread. Instance fields and static fields can be freely modified.

**Concurrency**

- **synchronized vs AtomicInteger — which to use?**  
  AtomicInteger: faster for simple counters/flags, lock-free CAS, good for lightly contended. synchronized: needed for compound operations, multiple variables, complex state. AtomicReference for single reference updates. synchronized (or ReentrantLock) for critical sections with multiple statements.
- **What is a thread-safe class?**  
  A class that behaves correctly when accessed from multiple threads without external synchronization. Techniques: immutability (most reliable), synchronized methods/blocks, concurrent collections (ConcurrentHashMap), atomic classes, volatile fields for flags.
- **Explain SOLID in 30 seconds.**  
  S: one reason to change. O: extend without modifying. L: subclass substitutable for parent. I: small focused interfaces. D: depend on abstractions. Together they produce code that's easier to test (D), extend (O), maintain (S), and compose (I, L).

### Checklist Tuần 3

> 💡 **Golden Rule Tuần 3:** Stream + CompletableFuture = nói với máy tính "tôi muốn gì", không phải "làm thế nào". SOLID = code sống được qua nhiều sprint, không phải code chạy được 1 lần. Concurrency = sức mạnh khi dùng đúng, thảm họa khi dùng sai — hiểu JMM trước khi optimize.
