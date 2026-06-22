# ⚙️ Tuần 10 · JVM + Design Patterns + Clean Code · 13/07–19/07/2025

## 📅 Lịch Học Tuần 10 — Tổng Quan 7 Ngày

| Ngày | Thứ | Chế độ | Thời gian | Chủ đề |
| --- | --- | --- | --- | --- |
| 13/07 | Thứ 2 | LIGHT | 1.5h | JVM Architecture: classloader, runtime data areas, execution engine, JIT |
| 14/07 | Thứ 3 | FULL | 2.5h | Memory Management: Heap (young/old gen), Stack, Metaspace, object lifecycle |
| 15/07 | Thứ 4 | FULL | 2.5h | Garbage Collection: GC algorithms (G1, ZGC, Parallel), GC tuning, memory leaks |
| 16/07 | Thứ 5 | FULL | 2.5h | Creational Patterns: Singleton, Factory Method, Abstract Factory, Builder |
| 17/07 | Thứ 6 | LIGHT | 1.5h | Structural + Behavioral Patterns: Adapter, Decorator, Strategy, Observer |
| 18/07 | Thứ 7 | WEEKEND | 4h | Clean Code + SOLID applied: refactoring, code smells, naming, functions, patterns in Spring |
| 19/07 | CN | REVIEW | 4h | Spaced Review T1-T10 + Mini Project: Refactor code áp dụng patterns + clean code |

## ⚡ Ngày 1 · JVM Architecture: classloader, runtime data areas, execution engine, JIT

**13/07 — Thứ 2** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

### 📖 Lý Thuyết Cốt Lõi

**1. JVM Overview — Write Once, Run Anywhere**

JVM (Java Virtual Machine) là máy ảo thực thi bytecode, là tầng trừu tượng giữa code và phần cứng. Code Java được biên dịch thành **bytecode** (.class) — độc lập nền tảng — rồi JVM dịch bytecode thành mã máy native của từng OS/CPU. Nhờ vậy cùng một file .class chạy trên Windows, Linux, macOS mà không cần biên dịch lại. Phân biệt: **JDK** (Development Kit) = JRE + compiler/tools (javac, javap, jdb); **JRE** (Runtime Environment) = JVM + thư viện core để chạy app; **JVM** = chỉ máy ảo thực thi bytecode.

**2. ClassLoader Subsystem**

ClassLoader chịu trách nhiệm nạp class vào bộ nhớ theo 3 cấp: **Bootstrap** (nạp core JDK trong rt.jar/java.base) → **Platform/Extension** (nạp module mở rộng) → **Application/System** (nạp class trên classpath app). Theo **delegation model** (ủy quyền lên trên): khi cần nạp class, classloader luôn hỏi parent trước; chỉ tự nạp nếu parent không tìm thấy — ngăn class core bị giả mạo. Quá trình gồm 3 bước: **Loading** (đọc bytecode), **Linking** (verify + prepare + resolve), **Initialization** (chạy static block, gán giá trị static).

**3. Runtime Data Areas**

Vùng nhớ JVM chia làm 2 nhóm. **Chia sẻ giữa các thread:** *Method Area / Metaspace* (class metadata, static, constant pool) và *Heap* (mọi object và mảng). **Riêng từng thread:** *JVM Stack* (mỗi method call tạo 1 stack frame chứa biến local, operand), *PC Register* (địa chỉ lệnh đang thực thi), *Native Method Stack* (cho method native qua JNI). Heap là nơi GC hoạt động; Stack tự giải phóng khi method trả về.

**4. Execution Engine — Interpreter + JIT**

Execution Engine thực thi bytecode bằng 2 cơ chế kết hợp. **Interpreter** đọc và thực thi từng lệnh bytecode — khởi động nhanh nhưng chạy chậm với code lặp nhiều. **JIT Compiler** phát hiện "hot methods" (gọi nhiều) và biên dịch chúng thành native code, cache lại để lần sau chạy thẳng. HotSpot dùng 2 tầng: **C1 (Client)** compile nhanh, tối ưu nhẹ; **C2 (Server)** compile chậm hơn nhưng tối ưu sâu (inlining, escape analysis, loop unrolling). Tiered compilation cân bằng giữa thời gian khởi động và hiệu năng đỉnh.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// Demo: in ra hệ thống classloader của JVM (delegation hierarchy)
public class ClassLoaderDemo {
    public static void main(String[] args) {
        // ClassLoader của class do app viết -> Application ClassLoader
        ClassLoader appLoader = ClassLoaderDemo.class.getClassLoader();
        System.out.println("App ClassLoader      : " + appLoader);

        // Đi lên parent -> Platform ClassLoader
        ClassLoader platformLoader = appLoader.getParent();
        System.out.println("Platform ClassLoader : " + platformLoader);

        // Parent của Platform -> Bootstrap (hiện ra null vì viết bằng C++)
        ClassLoader bootstrapLoader = platformLoader.getParent();
        System.out.println("Bootstrap ClassLoader: " + bootstrapLoader);

        // Class core như String do Bootstrap nạp -> getClassLoader() trả null
        System.out.println("String loader        : " + String.class.getClassLoader());
    }
}

/*
 Bytecode concept — chạy lệnh:  javap -c ClassLoaderDemo.class
 sẽ thấy các opcode JVM, ví dụ method main:
   0: ldc           #2   // load constant
   2: invokevirtual #3   // gọi method
   5: return
 Đây là bytecode trung gian mà Execution Engine (interpreter/JIT) thực thi.
*/
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Viết một class bất kỳ, biên dịch rồi chạy `javap -c <ClassName>` để xem bytecode. Ghi chú 3 opcode và giải thích chúng làm gì (ví dụ `invokevirtual`, `getstatic`, `return`).
2. Giải thích bằng lời (hoặc viết ra giấy) delegation model: khi load class `com.myapp.Service`, classloader nào được hỏi đầu tiên và vì sao class core như `java.lang.String` luôn do Bootstrap nạp.
3. Cho một chương trình tạo 1 object + gọi 2 method lồng nhau, vẽ sơ đồ các runtime data areas: object nằm ở Heap, stack frame nào nằm ở Stack, static field nằm ở đâu.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ · Phân biệt JVM, JRE và JDK?**

**JVM** là máy ảo thực thi bytecode — phần lõi dịch .class thành native code. **JRE** = JVM + thư viện core (java.lang, java.util...) — đủ để *chạy* app Java nhưng không biên dịch được. **JDK** = JRE + công cụ phát triển (javac compiler, javap, jdb debugger, jar) — đủ để *viết và biên dịch*. Quan hệ bao hàm: JDK ⊃ JRE ⊃ JVM. Muốn dev thì cần JDK, chỉ chạy app thì cần JRE.

**Dễ · Tại sao Java biên dịch ra bytecode thay vì ra mã máy trực tiếp?**

Bytecode là mã trung gian **độc lập nền tảng** — cùng một file .class chạy được trên mọi OS/CPU có JVM, hiện thực triết lý "write once, run anywhere". Nếu biên dịch thẳng ra native, code sẽ gắn chặt với một kiến trúc cụ thể (x86, ARM) và phải compile lại cho từng nền tảng. Bytecode cũng cho phép JVM tối ưu lúc runtime (JIT) dựa trên hành vi thực tế của chương trình, điều mà compile tĩnh ahead-of-time khó làm được.

**Trung · Giải thích delegation model của ClassLoader.**

Khi một classloader nhận yêu cầu nạp class, nó **không tự nạp ngay** mà ủy quyền (delegate) lên parent trước: Application → Platform → Bootstrap. Chỉ khi parent không tìm thấy, classloader con mới tự nạp. Cơ chế "parent-first" này đảm bảo: (1) **an toàn** — class core như `java.lang.String` luôn do Bootstrap nạp, không thể bị giả mạo bởi class cùng tên trên classpath; (2) **tránh trùng lặp** — một class chỉ được nạp một lần bởi classloader phù hợp nhất.

**Trung · Runtime data areas nào chia sẻ giữa các thread, nào riêng từng thread?**

**Chia sẻ giữa mọi thread:** *Heap* (chứa tất cả object/mảng — nơi GC chạy) và *Method Area/Metaspace* (class metadata, static field, constant pool). **Riêng từng thread:** *JVM Stack* (stack frame cho mỗi lời gọi method, chứa biến local), *PC Register* (chỉ tới lệnh bytecode đang chạy), *Native Method Stack* (cho method native qua JNI). Vì Heap chia sẻ nên object có thể bị race condition khi nhiều thread cùng truy cập — đó là lý do cần synchronization; còn biến local trên Stack thì thread-safe tự nhiên.

**Khó · JIT compiler hoạt động thế nào? C1 và C2 khác gì nhau?**

JIT (Just-In-Time) compiler theo dõi runtime để phát hiện **hot methods/loops** (chạy nhiều lần qua bộ đếm invocation/backedge), rồi biên dịch bytecode của chúng thành **native code** được cache lại. Ban đầu interpreter chạy (khởi động nhanh), sau đó JIT thay thế dần. HotSpot dùng **tiered compilation**: **C1 (Client)** compile nhanh, tối ưu nhẹ, thu thập profiling data; **C2 (Server)** compile chậm nhưng tối ưu sâu — inlining, escape analysis, loop unrolling, dead code elimination — dựa trên profile từ C1. Method rất nóng sẽ được nâng lên C2 để đạt hiệu năng đỉnh. JIT còn có thể *deoptimize* nếu giả định tối ưu bị sai (ví dụ một nhánh code bất ngờ được chạy).

### 🧠 Quiz Nhanh

1. Cùng một file `.class` chạy được trên Windows, Linux, macOS chủ yếu nhờ điều gì?
   - [ ] Vì JVM biên dịch source code trực tiếp ra mã máy của từng OS
   - [x] Vì bytecode độc lập nền tảng và mỗi JVM dịch nó sang native code của OS/CPU
   - [ ] Vì JDK đi kèm bản binary riêng cho mỗi nền tảng
   - [ ] Vì interpreter chạy y hệt nhau và không cần dịch ra native
   💡 Java compile ra bytecode độc lập nền tảng, JVM của từng OS mới dịch sang native code, hiện thực "write once, run anywhere".

2. Theo delegation model của ClassLoader, khi cần nạp một class thì điều gì xảy ra trước?
   - [x] ClassLoader ủy quyền lên parent trước, chỉ tự nạp nếu parent không tìm thấy
   - [ ] ClassLoader con luôn tự nạp trước rồi mới hỏi parent
   - [ ] Bootstrap ClassLoader luôn được bỏ qua vì viết bằng C++
   - [ ] Mọi class đều được nạp đồng thời bởi cả ba cấp loader
   💡 Cơ chế "parent-first": Application hỏi Platform, Platform hỏi Bootstrap; nhờ vậy class core như `java.lang.String` không bị giả mạo.

3. Vùng nhớ nào trong runtime data areas được chia sẻ giữa các thread?
   - [ ] JVM Stack
   - [ ] PC Register
   - [x] Heap và Method Area/Metaspace
   - [ ] Native Method Stack
   💡 Heap (object/mảng) và Method Area/Metaspace (class metadata, static, constant pool) chia sẻ giữa mọi thread; Stack, PC Register, Native Method Stack là riêng từng thread.

- **🧩 LeetCode:** #146 LRU Cache (Medium — review) — Kết hợp HashMap + doubly linked list để get/put O(1). Ôn lại design data structure — liên hệ cách JVM cache compiled code.

- **🤖 AI Tools:** Hỏi AI giải thích từng dòng output của `javap -c`. Nhờ AI vẽ sơ đồ ASCII của runtime data areas cho một chương trình mẫu.

- **📚 Tài Nguyên:** Oracle JVM Specification (docs.oracle.com/javase/specs), Baeldung — "JVM Architecture Explained", "How JVM Works".

## 💪 Ngày 2 · Memory Management: Heap (young/old gen), Stack, Metaspace, object lifecycle

**14/07 — Thứ 3** · **FULL** · ⏱ 30 phút sáng + 2h tối

### 📖 Lý Thuyết Cốt Lõi

**1. Heap Structure — Young & Old Gen**

Heap chia theo thế hệ (generational). **Young Generation** gồm *Eden* (object mới sinh ra) và 2 vùng *Survivor (S0, S1)*. Object sống sót qua mỗi lần Minor GC sẽ được copy qua lại giữa 2 Survivor và tăng "age". Khi age vượt ngưỡng (`MaxTenuringThreshold`), object được **promote** lên **Old Generation** (Tenured) — nơi chứa object sống lâu. Phân chia này tận dụng giả thuyết: hầu hết object chết trẻ, nên dọn Young Gen thường xuyên và nhanh.

**2. Stack Memory**

Mỗi thread có một **JVM Stack** riêng. Mỗi lời gọi method tạo một **stack frame** chứa biến local, tham số, và operand stack; frame bị pop khi method trả về. Stack lưu giá trị primitive và *reference* (con trỏ) tới object trên Heap — bản thân object luôn ở Heap. Nếu đệ quy quá sâu/vô hạn, stack tràn → **StackOverflowError**. Khác với Heap: khi không tạo nổi object mới vì Heap đầy → **OutOfMemoryError**. Stack tự dọn theo LIFO, không cần GC.

**3. Metaspace**

**Metaspace** lưu class metadata (cấu trúc class, method, field, constant pool). Từ **Java 8**, Metaspace thay thế **PermGen** và chuyển ra *off-heap* (native memory) — không còn nằm trong Heap. Lợi ích: tự động mở rộng theo nhu cầu (giới hạn bởi `-XX:MaxMetaspaceSize` hoặc RAM), giảm lỗi `OutOfMemoryError: PermGen space` kinh điển. Tuy nhiên load quá nhiều class động (ví dụ classloader leak trong app server) vẫn có thể gây `OutOfMemoryError: Metaspace`.

**4. Object Lifecycle & Reference Types**

Object sống từ lúc `new` tới khi không còn reference nào "reachable" từ GC roots, rồi bị GC thu hồi. Java có 4 loại reference điều khiển khi nào GC dọn: **Strong** (mặc định — không bao giờ bị dọn khi còn reference), **Soft** (chỉ bị dọn khi sắp hết bộ nhớ — tốt cho cache), **Weak** (bị dọn ngay lần GC kế tiếp khi chỉ còn weak ref — dùng trong `WeakHashMap`), **Phantom** (dùng để dọn dẹp tài nguyên trước khi object bị thu hồi, thay `finalize()`).

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
import java.lang.ref.WeakReference;
import java.lang.ref.SoftReference;

public class MemoryDemo {

    // Biến local 'count' nằm trên STACK; object 'data' nằm trên HEAP
    static class Data {
        int[] payload = new int[1024]; // chiếm chỗ trên Heap
    }

    public static void main(String[] args) {
        // Strong reference: GC KHÔNG bao giờ dọn khi 'strong' còn trỏ tới
        Data strong = new Data();

        // Weak reference: bị dọn ngay lần GC kế tiếp nếu chỉ còn weak ref
        WeakReference<Data> weak = new WeakReference<>(new Data());
        System.out.println("Trước GC, weak.get() = " + (weak.get() != null));
        System.gc(); // gợi ý GC chạy (không đảm bảo)
        System.out.println("Sau GC,   weak.get() = " + (weak.get() != null)); // thường null

        // Soft reference: chỉ bị dọn khi sắp hết bộ nhớ -> hợp làm cache
        SoftReference<Data> soft = new SoftReference<>(new Data());
        System.out.println("Soft còn sống? " + (soft.get() != null));

        // strong vẫn còn -> object không bị thu hồi
        System.out.println("Strong còn sống? " + (strong != null));
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Viết method đệ quy vô hạn (không có điều kiện dừng) để chủ động gây `StackOverflowError`. Quan sát stack trace và giải thích vì sao lỗi này là Error chứ không phải Exception.
2. Viết vòng lặp liên tục `new` object và thêm vào một `List` để gây `OutOfMemoryError: Java heap space`. Chạy lại với `-Xmx16m` để OOM nhanh hơn.
3. Tạo ví dụ `WeakReference<Object>`: kiểm tra `get()` trước và sau `System.gc()`, xác nhận object bị dọn khi chỉ còn weak ref.
4. Chạy app với flag `-Xlog:gc*` (Java 9+) hoặc `-verbose:gc`, tạo nhiều object để quan sát object được promote từ Young sang Old Gen trong GC log.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Khác biệt giữa Heap và Stack memory?**

**Heap**: chia sẻ giữa mọi thread, chứa tất cả object và mảng, được GC quản lý, kích thước lớn, truy cập chậm hơn. **Stack**: riêng từng thread, chứa stack frame (biến local, tham số, giá trị primitive, reference tới object), tự dọn theo LIFO khi method trả về, kích thước nhỏ, truy cập rất nhanh và thread-safe. Object luôn ở Heap; chỉ *reference* tới nó nằm trên Stack.

**Dễ · Young Generation và Old Generation khác nhau thế nào?**

**Young Gen** (Eden + 2 Survivor) chứa object mới sinh, được dọn bằng **Minor GC** rất thường xuyên và nhanh vì đa số object chết trẻ. **Old Gen** (Tenured) chứa object sống lâu đã được promote từ Young Gen; dọn bằng **Major/Full GC** ít thường xuyên hơn nhưng chậm và gây pause dài hơn. Phân chia thế hệ tận dụng *generational hypothesis* để tối ưu tần suất và chi phí GC.

**Trung · StackOverflowError và OutOfMemoryError khác nhau ở đâu?**

**StackOverflowError** xảy ra khi *Stack của một thread* tràn — thường do đệ quy quá sâu hoặc vô hạn, tạo quá nhiều stack frame. **OutOfMemoryError** xảy ra khi JVM không cấp phát được bộ nhớ mới: `Java heap space` (Heap đầy do giữ quá nhiều object), `Metaspace` (quá nhiều class), hoặc `GC overhead limit exceeded` (GC chạy mãi mà dọn được rất ít). Cả hai đều là `Error` (không nên catch để xử lý nghiệp vụ), nhưng nguyên nhân và vùng nhớ khác nhau hoàn toàn.

**Trung · Metaspace khác PermGen như thế nào?**

Trước Java 8, class metadata lưu ở **PermGen** — một vùng *trong Heap* với kích thước cố định, hay gây `OutOfMemoryError: PermGen space` khi load nhiều class. Từ **Java 8**, **Metaspace** thay thế PermGen và chuyển ra *native memory (off-heap)*, tự động mở rộng theo nhu cầu (giới hạn bởi `-XX:MaxMetaspaceSize` hoặc RAM). Kết quả: giảm hẳn lỗi PermGen kinh điển và GC quản lý class metadata hiệu quả hơn. Vẫn có thể bị `OutOfMemoryError: Metaspace` nếu rò rỉ classloader.

**Khó · Giải thích 4 loại reference: strong, soft, weak, phantom.**

**Strong** (mặc định): còn strong ref thì GC không bao giờ dọn — nguyên nhân chính của memory leak. **Soft**: GC chỉ dọn khi *sắp hết bộ nhớ* — lý tưởng cho cache vì giữ object lâu nhất có thể. **Weak**: bị dọn ngay *lần GC kế tiếp* nếu chỉ còn weak ref — dùng trong `WeakHashMap` để key tự biến mất khi không còn dùng. **Phantom**: `get()` luôn trả null, dùng cùng `ReferenceQueue` để biết object đã bị thu hồi và thực hiện cleanup tài nguyên — an toàn hơn `finalize()`. Thứ tự "dễ bị dọn": Phantom > Weak > Soft > Strong.

**Khó · Object promotion là gì? Khi nào object được promote lên Old Gen?**

**Promotion** là quá trình chuyển object từ Young Gen lên Old Gen. Object mới nằm ở Eden; sau mỗi Minor GC, object sống sót được copy sang Survivor và tăng *age*. Khi age vượt `-XX:MaxTenuringThreshold` (mặc định ~15), object được promote lên Old Gen. Ngoài ra **premature promotion** xảy ra khi Survivor không đủ chỗ (do *-XX:SurvivorRatio* nhỏ hoặc burst allocation), JVM buộc promote sớm — gây Old Gen đầy nhanh và Full GC thường xuyên. Object quá lớn có thể được cấp thẳng vào Old Gen (humongous/large object).

**Khó · Escape analysis là gì và nó tối ưu bộ nhớ ra sao?**

**Escape analysis** là tối ưu của JIT (C2) phân tích xem một object có "thoát" ra ngoài scope của method/thread tạo ra nó không. Nếu object *không escape* (chỉ dùng cục bộ), JIT có thể: (1) **scalar replacement** — phân rã object thành các biến primitive lưu trên Stack/register thay vì cấp phát trên Heap, giảm áp lực GC; (2) **stack allocation**; (3) **lock elision** — bỏ synchronized không cần thiết nếu object không chia sẻ giữa thread. Nhờ vậy nhiều object "tạm thời" thực tế không bao giờ chạm tới Heap, giảm số lần GC đáng kể.

### 🧠 Quiz Nhanh

1. Một object Java luôn được cấp phát ở đâu, còn cái gì nằm trên Stack?
   - [ ] Object nằm trên Stack, reference nằm trên Heap
   - [x] Object luôn nằm trên Heap, còn reference (con trỏ) tới nó nằm trên Stack
   - [ ] Cả object lẫn reference đều nằm trên Stack
   - [ ] Object nằm ở Metaspace cùng với class metadata
   💡 Stack chứa primitive và reference tới object; bản thân object luôn ở Heap — nơi GC hoạt động.

2. Từ Java 8, class metadata được lưu ở đâu thay cho PermGen?
   - [ ] Trong Young Generation của Heap
   - [ ] Trong PermGen với kích thước cố định lớn hơn
   - [x] Trong Metaspace nằm ở native memory (off-heap), tự động mở rộng
   - [ ] Trong Survivor space cùng object sống lâu
   💡 Java 8 thay PermGen bằng Metaspace ở off-heap, tự mở rộng theo nhu cầu (giới hạn bởi `-XX:MaxMetaspaceSize`), giảm lỗi PermGen kinh điển.

3. Loại reference nào thích hợp nhất để làm cache vì chỉ bị GC dọn khi sắp hết bộ nhớ?
   - [ ] Strong reference
   - [ ] Weak reference
   - [x] Soft reference
   - [ ] Phantom reference
   💡 Soft reference chỉ bị dọn khi JVM sắp hết bộ nhớ nên giữ object lâu nhất có thể — lý tưởng cho cache; Weak bị dọn ngay lần GC kế tiếp.

- **🧩 LeetCode:** #155 Min Stack (Medium) — Thiết kế stack hỗ trợ getMin() O(1). Dùng 2 stack hoặc lưu cặp (val, min). Liên hệ khái niệm stack frame của JVM.

- **🤖 AI Tools:** Nhờ AI giải thích GC log của bạn, chỉ ra object nào được promote. Hỏi AI cách phân biệt soft/weak reference qua ví dụ cache.

- **📚 Tài Nguyên:** Baeldung — "Soft References", "WeakHashMap", "JVM Memory Model"; Oracle — "Java HotSpot VM Memory Management".

## 💪 Ngày 3 · Garbage Collection: GC algorithms (G1, ZGC, Parallel), GC tuning, memory leaks

**15/07 — Thứ 4** · **FULL** · ⏱ 30 phút sáng + 2h tối

### 📖 Lý Thuyết Cốt Lõi

**1. GC Fundamentals — Mark, Sweep, Compact**

GC tự động thu hồi bộ nhớ của object không còn *reachable* từ GC roots (biến local, static, thread đang chạy). Thuật toán cơ bản: **Mark** (đánh dấu object còn sống bằng cách duyệt từ roots), **Sweep** (dọn object chết, giải phóng vùng nhớ), **Compact** (dồn object còn sống lại để chống phân mảnh). Dựa trên **generational hypothesis**: hầu hết object chết trẻ — nên chia thế hệ và dọn Young Gen thường xuyên. Một số pha GC cần **stop-the-world** (tạm dừng mọi thread app).

**2. GC Algorithms**

**Serial GC**: một thread, đơn giản, hợp app nhỏ/môi trường ít nhân. **Parallel GC (Throughput)**: nhiều thread dọn song song, tối ưu throughput nhưng pause dài — hợp batch processing. **G1 (Garbage-First)**: mặc định từ Java 9+, chia Heap thành region, ưu tiên dọn region nhiều rác trước, cân bằng giữa throughput và pause time. **ZGC** và **Shenandoah**: GC độ trễ cực thấp (pause < vài ms) làm việc gần như hoàn toàn concurrent, hợp Heap rất lớn (hàng TB) và app real-time.

**3. Minor GC vs Major/Full GC**

**Minor GC** dọn *Young Generation* (Eden + Survivor) — chạy thường xuyên, nhanh, pause ngắn vì đa số object đã chết. **Major GC** dọn *Old Generation*; **Full GC** dọn cả Young + Old + Metaspace — chậm và pause dài nhất, là thứ cần tránh trong app low-latency. Full GC thường xuyên là dấu hiệu Old Gen đầy nhanh (memory leak, promotion sớm, heap quá nhỏ). Mục tiêu tuning: tăng tần suất Minor GC nhẹ, giảm tối đa Full GC.

**4. GC Tuning & Memory Leaks**

Tuning bắt đầu từ kích thước heap: `-Xms` (initial), `-Xmx` (max), chọn collector (`-XX:+UseG1GC`...), bật GC log (`-Xlog:gc*`) để đo. Trong Java, memory leak xảy ra khi object vẫn còn *reachable* nhưng không bao giờ dùng nữa: **static collection** phình to mãi, **unclosed resource** (stream, connection không close), **listener/callback leak** (đăng ký mà không hủy), **ThreadLocal** không remove (đặc biệt nguy hiểm với thread pool). GC không dọn được vì chúng vẫn được tham chiếu.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```bash
# JVM flags cấu hình heap và chọn G1 GC, bật GC log
java -Xms512m -Xmx2g \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -Xlog:gc*:file=gc.log:time,level,tags \
     -jar myapp.jar

# Các collector khác:
#   -XX:+UseParallelGC     (throughput)
#   -XX:+UseZGC            (low-latency, Java 15+)
#   -XX:+UseShenandoahGC   (low-latency)

# Đọc GC log mẫu (Java 9+ unified logging):
# [2.481s][info][gc] GC(12) Pause Young (Normal) (G1 Evacuation Pause) 256M->48M(512M) 8.123ms
#   -> Minor GC: heap dùng giảm từ 256M xuống 48M, pause 8ms (tốt)
# [9.102s][info][gc] GC(40) Pause Full (G1 Compaction) 1900M->1850M(2048M) 850ms
#   -> Full GC pause 850ms, dọn được rất ít (1900->1850) => nghi memory leak
```

```java
import java.util.ArrayList;
import java.util.List;

// Ví dụ MEMORY LEAK kinh điển: static collection phình to mãi
public class LeakDemo {
    // static => sống suốt đời JVM, object thêm vào KHÔNG bao giờ bị GC dọn
    private static final List<byte[]> CACHE = new ArrayList<>();

    public static void process() {
        // mỗi lần gọi thêm 1MB vào cache nhưng KHÔNG bao giờ remove
        CACHE.add(new byte[1024 * 1024]);
        // object vẫn "reachable" qua static field -> GC bất lực -> OOM dần
    }

    public static void main(String[] args) {
        while (true) {
            process(); // chạy đủ lâu sẽ ra OutOfMemoryError: Java heap space
        }
    }
}
// FIX: dùng bounded cache (LinkedHashMap LRU / Caffeine) hoặc WeakReference,
//      và luôn remove entry khi không còn cần.
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Chạy một app Spring Boot (hoặc app tạo nhiều object) với `-XX:+UseG1GC -Xlog:gc*`. Đọc GC log, xác định Minor GC vs Full GC, đo pause time.
2. Chạy `LeakDemo` ở trên với `-Xmx64m -XX:+HeapDumpOnOutOfMemoryError`. Mở heap dump bằng Eclipse MAT hoặc VisualVM, tìm object chiếm nhiều bộ nhớ nhất (dominator tree).
3. Chỉnh `-Xms`/`-Xmx` cho cùng một app, so sánh số lần GC và pause time. Quan sát ảnh hưởng của heap quá nhỏ (GC liên tục) vs quá lớn (pause dài).
4. Chạy cùng workload với `-XX:+UseParallelGC` rồi `-XX:+UseG1GC` (và ZGC nếu Java ≥15). So sánh tổng throughput và pause time tối đa.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Garbage Collection hoạt động thế nào (mark-sweep-compact)?**

GC duyệt từ **GC roots** (biến local của thread đang chạy, static field, JNI references) để **Mark** tất cả object còn reachable là "sống". **Sweep** giải phóng những object không được mark (rác). **Compact** dồn các object còn sống lại liền nhau để chống phân mảnh và cho phép cấp phát nhanh sau này. Object không reachable từ roots = không thể truy cập = được thu hồi an toàn. Lập trình viên không cần `free()` thủ công như C/C++.

**Dễ · Generational hypothesis là gì và GC tận dụng nó ra sao?**

**Generational hypothesis**: hầu hết object "chết trẻ" — vừa tạo ra đã không còn dùng (object tạm trong vòng lặp, biến cục bộ). Một số ít sống lâu (cache, singleton). GC tận dụng bằng cách chia Heap thành **Young Gen** (dọn thường xuyên, nhanh bằng Minor GC) và **Old Gen** (dọn ít, chậm). Nhờ tập trung dọn nơi nhiều rác nhất (Young Gen), GC đạt hiệu quả cao mà không phải quét toàn bộ Heap mỗi lần.

**Trung · G1 GC và ZGC khác nhau thế nào? Khi nào chọn cái nào?**

**G1 (Garbage-First)**: collector mặc định từ Java 9, chia heap thành nhiều *region*, ưu tiên dọn region nhiều rác trước, có mục tiêu pause time (`-XX:MaxGCPauseMillis`) nhưng vẫn có stop-the-world cỡ chục đến trăm ms — cân bằng tốt cho hầu hết app. **ZGC**: collector độ trễ cực thấp, làm việc gần như hoàn toàn concurrent, pause < vài ms ngay cả với heap hàng TB, dùng colored pointers + load barriers. **Chọn:** G1 cho app web/service thông thường; ZGC (hoặc Shenandoah) cho app low-latency, heap rất lớn, yêu cầu pause cực ngắn (trading, gaming, real-time).

**Trung · Minor GC và Full GC khác nhau như thế nào?**

**Minor GC** chỉ dọn Young Gen (Eden + Survivor) — chạy rất thường xuyên, nhanh, pause ngắn (vài ms) vì đa số object đã chết. **Full GC** dọn toàn bộ heap (Young + Old) và thường cả Metaspace — chậm và pause dài nhất (hàng trăm ms tới giây), gây ảnh hưởng nặng tới latency. Full GC thường xuyên là tín hiệu xấu: Old Gen đầy nhanh do heap quá nhỏ, memory leak, hoặc promotion sớm. Trong app low-latency, mục tiêu là gần như loại bỏ Full GC.

**Trung · "Stop-the-world" nghĩa là gì? Vì sao cần?**

**Stop-the-world (STW)** là khoảnh khắc GC tạm dừng *tất cả* thread ứng dụng để thực hiện một số thao tác an toàn — ví dụ duyệt object graph hoặc di chuyển object mà không bị app sửa đổi đồng thời. Trong STW, app "đóng băng" → tăng latency. Các collector hiện đại (G1, ZGC, Shenandoah) cố gắng làm phần lớn công việc **concurrent** (song song với app) và rút ngắn STW xuống mức tối thiểu. Pause STW quá dài là nguyên nhân chính của giật/timeout trong service.

**Khó · Các memory leak phổ biến trong Java là gì?**

Memory leak trong Java = object vẫn *reachable* nên GC không dọn, dù không còn dùng: (1) **Static collection** phình to mãi (cache không giới hạn, không evict); (2) **Unclosed resource** — InputStream, Connection, Statement không close (dùng try-with-resources để fix); (3) **Listener/callback leak** — đăng ký observer/listener nhưng không hủy đăng ký khi xong; (4) **ThreadLocal** không `remove()` trong thread pool — thread sống mãi nên giá trị ThreadLocal cũng sống mãi; (5) inner class/lambda giữ reference ngầm tới object cha; (6) key mutable trong HashMap làm hashCode thay đổi. Fix: bounded cache, weak references, đóng tài nguyên đúng cách, hủy đăng ký.

**Khó · Bạn chẩn đoán một memory leak trong production như thế nào?**

Quy trình: (1) **Xác nhận triệu chứng** — theo dõi heap qua thời gian (JMX/Prometheus), nếu heap dùng tăng dần và không trở về sau Full GC → nghi leak. (2) **Bật `-XX:+HeapDumpOnOutOfMemoryError`** để có heap dump khi OOM, hoặc chụp dump thủ công bằng `jmap -dump`. (3) **Phân tích dump** bằng Eclipse MAT / VisualVM: xem *dominator tree* và *histogram* để tìm class chiếm nhiều bộ nhớ nhất và chuỗi GC roots giữ chúng sống. (4) **Đọc GC log** xác nhận Full GC dọn được rất ít. (5) Tìm "leak suspect" (thường là static collection/cache), sửa code (bounded cache, close resource, remove ThreadLocal), rồi load test lại để xác nhận heap ổn định.

### 🧠 Quiz Nhanh

1. Trong thuật toán GC cơ bản, bước "Compact" nhằm mục đích gì?
   - [ ] Đánh dấu các object còn reachable từ GC roots
   - [ ] Giải phóng vùng nhớ của object đã chết
   - [x] Dồn các object còn sống lại liền nhau để chống phân mảnh
   - [ ] Promote object từ Young Gen lên Old Gen
   💡 Mark đánh dấu object sống, Sweep dọn object chết, Compact dồn object sống lại liền nhau chống phân mảnh và cho phép cấp phát nhanh sau này.

2. Collector nào phù hợp nhất cho service low-latency cần pause cực ngắn (< vài ms) với heap rất lớn?
   - [ ] Serial GC
   - [ ] Parallel GC (Throughput)
   - [x] ZGC hoặc Shenandoah
   - [ ] Không có collector nào làm được, phải tắt GC
   💡 ZGC và Shenandoah làm gần như hoàn toàn concurrent, giữ pause ở mức vài ms ngay cả với heap hàng TB — hợp app real-time/low-latency.

3. Đâu là một memory leak phổ biến trong Java khi dùng thread pool?
   - [x] ThreadLocal không được `remove()` nên giá trị sống mãi theo thread
   - [ ] Biến local trên Stack không được dọn sau khi method trả về
   - [ ] Object trong Eden bị Minor GC dọn quá thường xuyên
   - [ ] PC Register giữ con trỏ tới lệnh bytecode đã chạy xong
   💡 Trong thread pool, thread sống mãi nên giá trị ThreadLocal cũng sống mãi nếu không `remove()` — vẫn reachable nên GC không dọn được.

- **🧩 LeetCode:** #208 Implement Trie (Medium) — Xây cây Trie với insert/search/startsWith. Chú ý cách quản lý node con để không lãng phí bộ nhớ — liên hệ object lifecycle.

- **🤖 AI Tools:** Dán GC log vào AI để phân tích pattern (Minor vs Full GC, pause time, dấu hiệu leak). Nhờ AI gợi ý flag tuning phù hợp workload.

- **📚 Tài Nguyên:** Oracle — "HotSpot GC Tuning Guide"; Baeldung — "JVM Garbage Collectors", "G1 / ZGC"; công cụ: Eclipse MAT, VisualVM, GCViewer.

## 💪 Ngày 4 · Creational Patterns: Singleton, Factory Method, Abstract Factory, Builder

**16/07 — Thứ 5** · **FULL** · ⏱ 30 phút sáng + 2h tối

### 📖 Lý Thuyết Cốt Lõi

**1. Singleton**

Đảm bảo một class chỉ có **đúng 1 instance** và cung cấp điểm truy cập toàn cục. Dùng cho tài nguyên dùng chung: config, connection pool, logger, cache. Cách triển khai thread-safe: **enum Singleton** (an toàn nhất, chống reflection & serialization tấn công), **double-checked locking** với `volatile`, hoặc **holder idiom** (lazy + thread-safe nhờ class loading). Trong Spring, mọi bean mặc định là singleton scope — framework quản lý vòng đời thay vì tự code.

**2. Factory Method**

Định nghĩa một interface/method để tạo object, nhưng **để subclass quyết định** tạo class cụ thể nào. Mục tiêu: tách (decouple) code *sử dụng* object khỏi code *khởi tạo* object — client chỉ phụ thuộc vào interface, không phụ thuộc `new ConcreteClass()`. Ví dụ: một `ShapeFactory.create(type)` trả về Circle/Square tùy tham số. Trong JDK: `Calendar.getInstance()`, `NumberFormat.getInstance()` là factory method.

**3. Abstract Factory**

Cung cấp interface để tạo **họ các object liên quan** mà không chỉ định class cụ thể — "factory của các factory". Khác Factory Method (tạo 1 sản phẩm), Abstract Factory tạo *nhiều* sản phẩm cùng họ đảm bảo chúng tương thích. Ví dụ: `GUIFactory` tạo Button + Checkbox cho cùng một theme (WindowsFactory vs MacFactory). Đảm bảo các object tạo ra "hợp bộ" với nhau. JDK: `DocumentBuilderFactory`.

**4. Builder**

Xây dựng object phức tạp **từng bước** qua API fluent (method chaining), tránh constructor có quá nhiều tham số (telescoping constructor). Cho phép tạo object **immutable**, đặt rõ field nào set, bỏ qua field optional. Ví dụ: `Pizza.builder().size("L").addTopping("cheese").build()`. Trong thực tế: Lombok `@Builder`, `StringBuilder`, `Stream.Builder`, `HttpRequest.newBuilder()` trong Java 11+ HttpClient.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// ===== Singleton: Holder idiom (lazy + thread-safe, không cần synchronized) =====
public class ConfigManager {
    private ConfigManager() { } // private constructor

    // Class Holder chỉ được nạp khi getInstance() gọi lần đầu -> lazy + thread-safe
    private static class Holder {
        private static final ConfigManager INSTANCE = new ConfigManager();
    }

    public static ConfigManager getInstance() {
        return Holder.INSTANCE;
    }
}

// ===== Singleton: enum (an toàn nhất - chống reflection & serialization) =====
public enum AppRegistry {
    INSTANCE;
    private int counter = 0;
    public synchronized int next() { return ++counter; }
}
// dùng: AppRegistry.INSTANCE.next();
```

```java
// ===== Builder pattern: object phức tạp, immutable, fluent API =====
public final class Pizza {
    private final String size;
    private final boolean cheese;
    private final java.util.List<String> toppings;

    private Pizza(Builder b) {           // chỉ Builder tạo được
        this.size = b.size;
        this.cheese = b.cheese;
        this.toppings = java.util.List.copyOf(b.toppings); // immutable
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String size = "M";
        private boolean cheese = false;
        private final java.util.List<String> toppings = new java.util.ArrayList<>();

        public Builder size(String s)        { this.size = s; return this; }
        public Builder cheese(boolean c)      { this.cheese = c; return this; }
        public Builder addTopping(String t)   { this.toppings.add(t); return this; }
        public Pizza build()                  { return new Pizza(this); }
    }

    @Override public String toString() {
        return "Pizza{size=" + size + ", cheese=" + cheese + ", toppings=" + toppings + "}";
    }

    public static void main(String[] args) {
        Pizza p = Pizza.builder()
                       .size("L")
                       .cheese(true)
                       .addTopping("mushroom")
                       .addTopping("ham")
                       .build();
        System.out.println(p);
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Triển khai Singleton thread-safe theo **2 cách**: holder idiom và enum. Viết test đa luồng tạo instance nhiều lần, xác nhận luôn cùng một object (so sánh `==`).
2. Viết Factory Method `ShapeFactory.create(String type)` trả về `Circle`, `Square`, `Triangle` (cùng implement interface `Shape` với method `area()`). Client chỉ làm việc qua interface `Shape`.
3. Viết Builder cho một object phức tạp (ví dụ `HttpRequestConfig` với url, method, headers, timeout, body). Đảm bảo object immutable và có field bắt buộc (validate trong `build()`).
4. Tìm ít nhất 3 ví dụ pattern creational trong JDK (gợi ý: `Calendar.getInstance()`, `StringBuilder`, `Stream.builder()`, `Runtime.getRuntime()`) và phân loại chúng.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Có những cách nào để làm Singleton thread-safe?**

(1) **Eager init**: tạo instance ngay khi class load (`static final INSTANCE = new ...`) — thread-safe tự nhiên nhưng không lazy. (2) **Synchronized method**: đơn giản nhưng chậm vì khóa mỗi lần gọi. (3) **Double-checked locking**: dùng `volatile` + kiểm tra null 2 lần trong/ngoài khối synchronized — lazy và nhanh. (4) **Holder idiom**: dùng inner static class, lazy và thread-safe nhờ cơ chế class loading của JVM, không cần synchronized. (5) **Enum**: ngắn gọn, an toàn nhất.

**Dễ · Vì sao enum được xem là cách làm Singleton tốt nhất?**

Enum Singleton (theo Joshua Bloch, Effective Java) có 3 ưu điểm: (1) **Thread-safe** sẵn — JVM đảm bảo enum constant được khởi tạo một lần khi class load; (2) **Chống reflection** — không thể dùng reflection để gọi constructor tạo instance thứ hai (JVM ném exception); (3) **Chống serialization tấn công** — enum tự xử lý serialization đúng, không tạo instance mới khi deserialize (các cách khác phải tự implement `readResolve()`). Code cũng ngắn gọn nhất.

**Trung · Factory Method khác Abstract Factory như thế nào?**

**Factory Method** tạo *một loại sản phẩm*, dùng kế thừa — subclass override method factory để quyết định class cụ thể (ví dụ `createShape()` trả về Circle hoặc Square). **Abstract Factory** tạo *cả họ sản phẩm liên quan*, dùng composition — một object factory có nhiều method tạo các sản phẩm hợp bộ (ví dụ `GUIFactory` tạo cả Button lẫn Checkbox cùng theme). Tóm lại: Factory Method = 1 sản phẩm/1 method; Abstract Factory = nhóm sản phẩm tương thích/1 factory.

**Trung · Builder pattern mang lại lợi ích gì?**

Builder giúp: (1) **Dễ đọc** — fluent API với tên method rõ ràng thay vì một dãy tham số khó hiểu; (2) **Linh hoạt** — set field optional theo ý, bỏ qua field không cần; (3) **Immutability** — object kết quả có thể là immutable (tất cả field `final`), an toàn đa luồng; (4) **Validation tập trung** — kiểm tra ràng buộc trong `build()` trước khi tạo object; (5) tránh tình trạng object ở "trạng thái nửa vời" trong quá trình xây dựng.

**Trung · Builder so với telescoping constructor — vì sao Builder tốt hơn?**

**Telescoping constructor** là pattern phản diện: khi object có nhiều field optional, ta tạo hàng loạt constructor chồng chất (`Pizza(size)`, `Pizza(size, cheese)`, `Pizza(size, cheese, toppings)`...). Vấn đề: khó đọc (`new Pizza("L", true, false, 3)` — số 3 là gì?), dễ truyền nhầm thứ tự tham số cùng kiểu, và bùng nổ số lượng constructor. **Builder** giải quyết bằng cách đặt tên rõ cho mỗi field qua method chaining, chỉ set field cần, dễ đọc và khó truyền nhầm. Đánh đổi: viết nhiều code hơn (có Lombok `@Builder` để tự sinh).

**Khó · Cho ví dụ các creational pattern trong JDK và Spring.**

**JDK:** Singleton — `Runtime.getRuntime()`; Factory Method — `Calendar.getInstance()`, `NumberFormat.getInstance()`, `Integer.valueOf()`; Abstract Factory — `DocumentBuilderFactory`, `SAXParserFactory`; Builder — `StringBuilder`, `Stream.builder()`, `HttpRequest.newBuilder()`. **Spring:** bean mặc định là *singleton scope* (framework quản lý); `BeanFactory`/`ApplicationContext` là factory tạo bean; `FactoryBean` là factory method tùy biến; nhiều object cấu hình dùng builder (ví dụ `RestClient.builder()`, `WebClient.builder()`).

**Khó · Singleton có những nhược điểm/cạm bẫy gì?**

Cạm bẫy của Singleton: (1) **Global state** — gây coupling ngầm, khó theo dõi ai thay đổi state; (2) **Khó test** — state toàn cục dùng chung giữa các test, không mock/thay thế dễ dàng, test phụ thuộc thứ tự chạy; (3) **Vi phạm SRP** — class vừa lo nghiệp vụ vừa lo quản lý vòng đời instance của chính nó; (4) **Ẩn dependency** — code gọi `getInstance()` bên trong thay vì nhận qua constructor, khó nhìn ra phụ thuộc; (5) vấn đề trong môi trường đa classloader (mỗi loader có thể có 1 instance). Giải pháp hiện đại: dùng **Dependency Injection** (Spring singleton bean) — vẫn 1 instance nhưng inject được, dễ test và mock.

### 🧠 Quiz Nhanh

1. Vì sao enum được xem là cách triển khai Singleton tốt nhất theo Effective Java?
   - [ ] Vì enum cho phép tạo nhiều instance khi cần
   - [x] Vì thread-safe sẵn, chống reflection và xử lý serialization đúng
   - [ ] Vì enum khởi tạo lazy mặc định và tiết kiệm bộ nhớ nhất
   - [ ] Vì enum không cần private constructor
   💡 Enum Singleton thread-safe sẵn (JVM khởi tạo một lần), chặn reflection tạo instance thứ hai, và không tạo instance mới khi deserialize — không cần tự viết `readResolve()`.

2. Điểm khác biệt cốt lõi giữa Factory Method và Abstract Factory là gì?
   - [ ] Factory Method tạo object immutable, Abstract Factory tạo object mutable
   - [ ] Cả hai đều tạo đúng một sản phẩm, chỉ khác tên gọi
   - [x] Factory Method tạo một loại sản phẩm; Abstract Factory tạo cả họ sản phẩm liên quan hợp bộ
   - [ ] Abstract Factory chỉ dùng kế thừa, Factory Method chỉ dùng composition
   💡 Factory Method tạo 1 sản phẩm (qua kế thừa, subclass quyết định); Abstract Factory tạo nhiều sản phẩm cùng họ đảm bảo tương thích (như `GUIFactory` tạo Button + Checkbox cùng theme).

3. Builder pattern giải quyết vấn đề gì của telescoping constructor?
   - [x] Tránh dãy constructor chồng chất khó đọc, dễ truyền nhầm thứ tự tham số cùng kiểu
   - [ ] Tự động làm object trở nên mutable để dễ sửa sau khi tạo
   - [ ] Loại bỏ hoàn toàn nhu cầu validate dữ liệu
   - [ ] Bắt buộc set tất cả field, không cho phép field optional
   💡 Builder đặt tên rõ cho mỗi field qua method chaining, chỉ set field cần, cho object immutable và validate tập trung trong `build()` — tránh `new Pizza("L", true, false, 3)` khó hiểu.

- **🧩 LeetCode:** #211 Design Add and Search Words (Medium) — Trie + DFS hỗ trợ ký tự '.'. Thiết kế WordDictionary — liên hệ cách Factory tạo node và Builder dựng cấu trúc.

- **🤖 AI Tools:** Nhờ AI review code Singleton xem có thread-safe không. Hỏi AI khi nào nên dùng Builder vs constructor vs setter.

- **📚 Tài Nguyên:** Refactoring.Guru — Creational Patterns; sách Gang of Four (GoF) "Design Patterns"; Effective Java (Bloch) — Item 1, 2, 3.

## ⚡ Ngày 5 · Structural + Behavioral Patterns: Adapter, Decorator, Strategy, Observer

**17/07 — Thứ 6** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

### 📖 Lý Thuyết Cốt Lõi

**1. Adapter (Structural)**

**Adapter** chuyển đổi interface của một class thành interface khác mà client mong đợi — như "ổ cắm chuyển đổi". Dùng khi cần tích hợp *code legacy* hoặc *thư viện bên thứ ba* có interface không khớp với hệ thống. Adapter bọc (wrap) object cũ và dịch lời gọi. Ví dụ JDK: `Arrays.asList()`, `InputStreamReader` (adapt byte stream sang char stream), `Collections.list()`.

**2. Decorator (Structural)**

**Decorator** thêm hành vi/trách nhiệm cho object **động lúc runtime** bằng cách bọc nó trong wrapper cùng interface — thay vì kế thừa tĩnh. Cho phép kết hợp linh hoạt nhiều behavior (composition over inheritance). Ví dụ kinh điển: `java.io` — `new BufferedReader(new InputStreamReader(new FileInputStream(...)))` mỗi lớp thêm một khả năng (buffer, decode). Tuân theo open-closed: mở rộng mà không sửa class gốc.

**3. Strategy (Behavioral)**

**Strategy** định nghĩa một họ thuật toán **hoán đổi được** sau một interface chung, cho phép chọn/đổi thuật toán lúc runtime. Tách thuật toán khỏi context dùng nó. Ví dụ: `Comparator` trong sort (đổi cách so sánh), nhiều phương thức thanh toán (`PaymentStrategy`), thuật toán nén/mã hóa. Theo open-closed: thêm thuật toán mới = thêm class mới, không sửa code cũ. Thay thế cho if-else/switch dài về loại behavior.

**4. Observer (Behavioral)**

**Observer** (publish-subscribe) định nghĩa quan hệ 1-nhiều: khi một *subject* đổi trạng thái, tất cả *observer* đăng ký được thông báo tự động. Tách rời subject và observer (loose coupling). Ví dụ: Spring `ApplicationEvent` + `@EventListener`, event listener của UI, message queue/pub-sub. JDK cũ có `java.util.Observer` (đã deprecated, nay dùng `PropertyChangeListener` hoặc reactive streams).

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// ===== Strategy pattern: thuật toán thanh toán hoán đổi runtime =====
interface PaymentStrategy {
    void pay(double amount);
}

class CreditCardStrategy implements PaymentStrategy {
    public void pay(double amount) {
        System.out.println("Thanh toán " + amount + " bằng thẻ tín dụng");
    }
}

class PayPalStrategy implements PaymentStrategy {
    public void pay(double amount) {
        System.out.println("Thanh toán " + amount + " qua PayPal");
    }
}

class ShoppingCart {
    private PaymentStrategy strategy;            // context giữ strategy
    public void setStrategy(PaymentStrategy s) { this.strategy = s; }
    public void checkout(double amount)        { strategy.pay(amount); }
}

class StrategyDemo {
    public static void main(String[] args) {
        ShoppingCart cart = new ShoppingCart();
        cart.setStrategy(new CreditCardStrategy());
        cart.checkout(100.0);
        cart.setStrategy(new PayPalStrategy());  // đổi thuật toán runtime
        cart.checkout(50.0);
    }
}
```

```java
// ===== Decorator pattern: thêm topping cho coffee runtime =====
interface Coffee {
    double cost();
    String desc();
}

class SimpleCoffee implements Coffee {
    public double cost()  { return 2.0; }
    public String desc()  { return "Cà phê"; }
}

// Decorator base: bọc một Coffee khác (composition)
abstract class CoffeeDecorator implements Coffee {
    protected final Coffee inner;
    CoffeeDecorator(Coffee c) { this.inner = c; }
}

class MilkDecorator extends CoffeeDecorator {
    MilkDecorator(Coffee c) { super(c); }
    public double cost() { return inner.cost() + 0.5; }
    public String desc() { return inner.desc() + " + sữa"; }
}

class SugarDecorator extends CoffeeDecorator {
    SugarDecorator(Coffee c) { super(c); }
    public double cost() { return inner.cost() + 0.2; }
    public String desc() { return inner.desc() + " + đường"; }
}

class DecoratorDemo {
    public static void main(String[] args) {
        Coffee c = new SugarDecorator(new MilkDecorator(new SimpleCoffee()));
        System.out.println(c.desc() + " = " + c.cost()); // Cà phê + sữa + đường = 2.7
    }
}
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Triển khai Strategy cho việc sắp xếp (sort theo tên / theo tuổi / theo lương) hoặc cho thanh toán (thẻ / PayPal / momo). Đổi strategy lúc runtime và in kết quả khác nhau.
2. Viết Decorator cho đồ uống: `SimpleCoffee` + các decorator `Milk`, `Sugar`, `Whip`. Kết hợp nhiều lớp và tính tổng giá + mô tả.
3. Trong một app Spring nhỏ, định nghĩa một `ApplicationEvent` và một `@EventListener` để minh họa Observer. Quan sát listener được gọi khi event được publish.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ · Adapter và Decorator khác nhau như thế nào?**

Cả hai đều "bọc" object, nhưng mục đích khác nhau. **Adapter** *thay đổi interface* của object để khớp với cái client cần — không thêm chức năng mới, chỉ dịch interface (kết nối hai interface không tương thích). **Decorator** *giữ nguyên interface* nhưng *thêm hành vi/trách nhiệm mới* cho object lúc runtime. Nói ngắn: Adapter = đổi hình dạng để vừa khớp; Decorator = thêm tính năng mà không đổi interface.

**Trung · Giải thích Strategy pattern kèm ví dụ thực tế.**

Strategy định nghĩa một họ thuật toán hoán đổi được sau một interface chung, cho phép chọn thuật toán lúc runtime mà không sửa code context. **Ví dụ:** hệ thống thanh toán có `PaymentStrategy` với các implementation `CreditCardStrategy`, `PayPalStrategy`, `MomoStrategy`; `ShoppingCart` chỉ giữ một `PaymentStrategy` và gọi `pay()`, không biết chi tiết. Thêm phương thức thanh toán mới = viết class mới, không đụng code cũ (open-closed). Trong Java, `Comparator` truyền vào `Collections.sort()` chính là Strategy.

**Trung · Observer pattern là gì? Spring hiện thực nó ra sao?**

Observer định nghĩa quan hệ 1-nhiều: khi subject đổi trạng thái, mọi observer đăng ký được thông báo tự động — giúp loose coupling giữa nơi phát và nơi xử lý sự kiện. **Spring** hiện thực qua cơ chế *ApplicationEvent*: publish event bằng `ApplicationEventPublisher.publishEvent(...)`, và bất kỳ bean nào có method gắn `@EventListener` (hoặc implement `ApplicationListener`) sẽ nhận và xử lý. Có thể xử lý *async* với `@Async`. Nhờ vậy module phát sự kiện không cần biết ai lắng nghe.

**Trung · Decorator pattern xuất hiện ở đâu trong java.io?**

Toàn bộ thư viện `java.io` stream là ví dụ kinh điển của Decorator. Ví dụ: `new BufferedReader(new InputStreamReader(new FileInputStream("f.txt")))` — `FileInputStream` là object gốc (đọc byte từ file), `InputStreamReader` bọc thêm khả năng decode byte → char, `BufferedReader` bọc thêm buffer + đọc theo dòng. Mỗi lớp cùng implement interface stream và thêm một khả năng, kết hợp linh hoạt lúc runtime mà không cần class con cho mọi tổ hợp.

**Khó · Khi nào nên dùng Strategy thay vì if-else/switch?**

Dùng **Strategy** khi các nhánh là những *thuật toán/behavior khác biệt* thay đổi độc lập và danh sách có xu hướng mở rộng — Strategy tuân open-closed (thêm class mới thay vì sửa code cũ), dễ test từng strategy riêng, tránh method khổng lồ. Giữ **if-else/switch** khi: chỉ vài nhánh đơn giản, ít thay đổi, logic ngắn — lúc đó Strategy là over-engineering, thêm class không đáng. Dấu hiệu nên refactor sang Strategy: cùng một khối if-else về "loại" lặp lại ở nhiều nơi, hoặc nhánh phình to. Trong Spring có thể inject một `Map<String, PaymentStrategy>` để chọn strategy theo key.

### 🧠 Quiz Nhanh

1. Adapter và Decorator đều "bọc" object, nhưng khác nhau cơ bản ở điểm nào?
   - [x] Adapter đổi interface để khớp client; Decorator giữ nguyên interface nhưng thêm hành vi
   - [ ] Adapter thêm hành vi mới; Decorator chỉ đổi interface
   - [ ] Cả hai đều thay đổi interface của object gốc
   - [ ] Adapter dùng runtime, Decorator chỉ dùng compile-time
   💡 Adapter đổi hình dạng interface để hai interface không tương thích khớp nhau; Decorator giữ nguyên interface và thêm hành vi/trách nhiệm mới lúc runtime.

2. Vì sao nên dùng Strategy thay cho chuỗi if-else/switch theo loại behavior?
   - [ ] Vì Strategy luôn chạy nhanh hơn if-else về mặt hiệu năng
   - [ ] Vì if-else không thể biên dịch được trong Java
   - [x] Vì Strategy tuân open-closed: thêm thuật toán mới = thêm class, không sửa code cũ
   - [ ] Vì Strategy loại bỏ hoàn toàn nhu cầu dùng interface
   💡 Strategy tách thuật toán ra sau interface chung, thêm behavior mới chỉ cần viết class mới (open-closed), dễ test riêng, tránh method khổng lồ — dùng khi nhánh là thuật toán khác biệt hay mở rộng.

3. Thư viện `java.io` với `new BufferedReader(new InputStreamReader(new FileInputStream(...)))` minh họa pattern nào?
   - [ ] Adapter
   - [ ] Strategy
   - [x] Decorator
   - [ ] Observer
   💡 Mỗi lớp `java.io` cùng implement interface stream và bọc thêm một khả năng (decode byte→char, buffer, đọc theo dòng) lúc runtime — đây là Decorator kinh điển.

- **🧩 LeetCode:** #380 Insert Delete GetRandom O(1) (Medium) — Kết hợp HashMap + ArrayList để mọi thao tác O(1). Thiết kế cấu trúc — liên hệ cách Strategy/Decorator tổ chức behavior.

- **🤖 AI Tools:** Nhờ AI chỉ ra một đoạn if-else dài nên refactor sang Strategy không. Hỏi AI ví dụ Decorator/Observer trong các framework phổ biến.

- **📚 Tài Nguyên:** Refactoring.Guru — Structural & Behavioral Patterns; Baeldung — "Strategy Pattern", "Decorator Pattern", "Spring Events".

## 🔥 Ngày 6 · Clean Code + SOLID applied: refactoring, code smells, naming, functions, patterns in Spring

**18/07 — Thứ 7** · **WEEKEND** · ⏱ 4h (sáng + chiều)

### 📖 Lý Thuyết Cốt Lõi

**1. Clean Code Principles**

Code sạch tối ưu cho **người đọc**, không phải máy. Nguyên tắc cốt lõi: **tên có ý nghĩa** (biến/method/class nói lên ý định, tránh viết tắt khó hiểu), **function nhỏ** làm *một việc* ở một mức trừu tượng, **Single Responsibility**, **DRY** (don't repeat yourself — tránh trùng lặp), và "comment là dấu hiệu thất bại của code" — viết code tự diễn giải thay vì dùng comment để bù cho code khó hiểu (comment-as-deodorant).

**2. Code Smells**

Code smell là dấu hiệu cảnh báo thiết kế có vấn đề (không phải bug nhưng khó bảo trì): **Long Method** (method quá dài), **Large Class / God Class** (class ôm quá nhiều trách nhiệm), **Duplicate Code** (lặp logic), **Feature Envy** (method dùng dữ liệu của class khác nhiều hơn của chính nó), **Primitive Obsession** (lạm dụng primitive thay vì tạo type riêng), **Long Parameter List**, **Shotgun Surgery** (một thay đổi phải sửa nhiều nơi).

**3. Refactoring Techniques**

Refactoring = cải thiện cấu trúc code *mà không đổi hành vi*, làm từng bước nhỏ có test bảo vệ. Kỹ thuật phổ biến: **Extract Method** (tách đoạn code thành method có tên rõ ràng), **Extract Class** (tách trách nhiệm thành class riêng), **Replace Conditional with Polymorphism** (thay if-else/switch theo type bằng đa hình), **Introduce Parameter Object** (gom nhiều tham số liên quan thành một object), **Rename**, **Inline**. Luôn chạy test sau mỗi bước.

**4. SOLID & Patterns trong Spring**

**SOLID**: SRP (mỗi class một lý do thay đổi), OCP (mở rộng không sửa), LSP (con thay được cha), ISP (interface nhỏ chuyên biệt), DIP (phụ thuộc abstraction). Spring hiện thực nhiều nguyên tắc/pattern: **DI = Dependency Inversion** (inject interface, không `new` trực tiếp), inject `List`/`Map` các bean cùng interface = **Strategy**, `JdbcTemplate`/`RestTemplate` = **Template Method**, AOP proxy = **Proxy pattern**, `ApplicationEvent` = **Observer**.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// ===== BEFORE: method dài, if-else theo type, đặt tên kém, nhiều trách nhiệm =====
class OrderProcessorBefore {
    double process(String type, double amt, boolean vip) {
        double d = 0;                       // 'd' là gì? tên kém
        if (type.equals("ELECTRONIC")) {    // if-else theo type -> code smell
            d = amt * 0.05;
            if (vip) d += amt * 0.02;
        } else if (type.equals("BOOK")) {
            d = amt * 0.10;
            if (vip) d += amt * 0.03;
        } else if (type.equals("FOOD")) {
            d = amt * 0.02;
        }
        double finalPrice = amt - d;        // tính + log + format lẫn lộn
        System.out.println("Discount=" + d + " Final=" + finalPrice);
        return finalPrice;
    }
}
```

```java
// ===== AFTER: Replace Conditional with Polymorphism (Strategy) + SRP + tên rõ =====
interface DiscountPolicy {
    double discountFor(double amount, boolean vip);
}

class ElectronicDiscount implements DiscountPolicy {
    public double discountFor(double amount, boolean vip) {
        return amount * 0.05 + (vip ? amount * 0.02 : 0);
    }
}
class BookDiscount implements DiscountPolicy {
    public double discountFor(double amount, boolean vip) {
        return amount * 0.10 + (vip ? amount * 0.03 : 0);
    }
}
class FoodDiscount implements DiscountPolicy {
    public double discountFor(double amount, boolean vip) {
        return amount * 0.02;
    }
}

// Context: chỉ lo tính giá cuối, không lo chọn policy (SRP) + DIP qua interface
class OrderPricer {
    private final DiscountPolicy policy;
    OrderPricer(DiscountPolicy policy) { this.policy = policy; }

    double finalPrice(double amount, boolean vip) {
        double discount = policy.discountFor(amount, vip); // extract -> đa hình
        return amount - discount;
    }
}
// Thêm loại đơn mới = thêm 1 class DiscountPolicy, KHÔNG sửa OrderPricer (OCP).
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Cho một method dài (50+ dòng) làm nhiều việc (validate + tính toán + log + format). Áp dụng **Extract Method** tách thành các method nhỏ có tên rõ ràng, mỗi method một việc.
2. Refactor một chuỗi if-else/switch theo type (như `OrderProcessorBefore` ở trên) sang **Strategy/polymorphism**. Đảm bảo thêm type mới không phải sửa code cũ.
3. Cho một đoạn code có sẵn (lấy từ project cũ hoặc AI sinh ra), liệt kê tất cả code smell tìm thấy và đề xuất kỹ thuật refactor cho từng cái.
4. Lấy một "God Class" (class ôm quá nhiều việc) và áp dụng **SRP**: tách thành nhiều class theo trách nhiệm (ví dụ tách phần truy vấn DB, phần tính toán nghiệp vụ, phần format output).

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (8 câu)

**Dễ · Điều gì làm nên tên (naming) tốt trong clean code?**

Tên tốt **nói lên ý định**: đọc tên là hiểu nó là gì/làm gì mà không cần đọc thân hàm. Nguyên tắc: dùng tên có ý nghĩa, phát âm được, tìm kiếm được (`elapsedTimeInDays` tốt hơn `d`); method là động từ (`calculateTotal`), biến/class là danh từ; tránh viết tắt khó hiểu và "magic number"; nhất quán (cùng khái niệm dùng cùng từ). Tên tốt giảm hẳn nhu cầu comment.

**Dễ · Vì sao nên giữ function nhỏ?**

Function nhỏ làm **một việc duy nhất** ở một mức trừu tượng thì dễ đọc, dễ đặt tên, dễ test (ít nhánh), dễ tái sử dụng và dễ debug. Function lớn thường trộn nhiều mức trừu tượng và nhiều trách nhiệm → khó hiểu, khó test toàn diện, dễ phát sinh bug khi sửa. Tách function nhỏ cũng làm lộ ra cấu trúc/ý định của code rõ ràng hơn (mỗi tên method như một câu chú thích sống).

**Trung · Kể một số code smell phổ biến.**

**Long Method** (method quá dài), **Large/God Class** (class ôm quá nhiều việc), **Duplicate Code** (lặp logic — vi phạm DRY), **Long Parameter List** (quá nhiều tham số — gom thành object), **Feature Envy** (method quan tâm dữ liệu class khác hơn của mình), **Primitive Obsession** (dùng primitive thay vì tạo type miền), **Shotgun Surgery** (một thay đổi phải sửa rải rác nhiều nơi), **Data Clumps** (nhóm field luôn đi cùng nhau). Mỗi smell ứng với một kỹ thuật refactor cụ thể.

**Trung · Làm sao để refactor an toàn?**

Quy tắc vàng: **tests first**. (1) Đảm bảo có test bao quanh code; nếu chưa có, viết *characterization test* ghi lại hành vi hiện tại. (2) Refactor từng **bước nhỏ**, mỗi bước chỉ một biến đổi (extract method, rename...). (3) **Chạy test sau mỗi bước** để bắt regression ngay. (4) Commit thường xuyên để dễ rollback. (5) Không trộn refactor với thêm tính năng trong cùng một commit. Mục tiêu: cải thiện cấu trúc mà *không đổi hành vi quan sát được*.

**Trung · "Replace conditional with polymorphism" là gì? Khi nào dùng?**

Là kỹ thuật thay một khối `if-else`/`switch` phân nhánh *theo type/loại* bằng **đa hình**: tạo interface/abstract class, mỗi nhánh thành một subclass override hành vi. Thay vì `if (type == A) ... else if (type == B) ...` rải rác nhiều nơi, ta gọi `obj.doIt()` và để đa hình chọn đúng implementation. **Dùng khi**: cùng một switch theo type lặp lại ở nhiều chỗ, hoặc danh sách type mở rộng thường xuyên. Lợi: tuân open-closed (thêm type = thêm class), code gọn, dễ test. Không dùng nếu chỉ có một-hai nhánh đơn giản và ổn định.

**Khó · SOLID được áp dụng trong Spring như thế nào?**

**SRP**: Controller lo HTTP, Service lo nghiệp vụ, Repository lo dữ liệu — mỗi lớp một trách nhiệm. **OCP**: thêm implementation mới của một interface bean mà không sửa code dùng nó. **LSP**: mọi implementation của một interface service phải thay thế được cho nhau. **ISP**: tách interface repository/service nhỏ theo nhu cầu thay vì một interface khổng lồ. **DIP**: chính là *Dependency Injection* — code phụ thuộc vào interface (abstraction) và Spring inject implementation cụ thể qua constructor, không `new` trực tiếp. Spring còn dùng Strategy (inject `Map<String, Handler>`), Template Method (`JdbcTemplate`), Proxy (AOP).

**Khó · DRY và "premature abstraction" — cân bằng thế nào?**

**DRY** khuyên loại bỏ trùng lặp *kiến thức/quy tắc nghiệp vụ*. Nhưng áp dụng máy móc dẫn tới **premature abstraction**: gom hai đoạn code *trông giống nhau nhưng thay đổi vì lý do khác nhau* vào một abstraction, sau này chúng phân kỳ và abstraction trở nên rối, đầy tham số điều kiện (vi phạm "wrong abstraction còn tệ hơn duplication" — Sandi Metz). Cân bằng: theo **Rule of Three** — chấp nhận trùng lặp vài lần, chỉ trừu tượng hóa khi pattern thật sự rõ và cùng lý do thay đổi. DRY về *knowledge*, không phải về *code trông giống nhau*.

**Mock EN · "How do you handle technical debt in a fast-moving team?"**

"I treat technical debt as something to manage deliberately, not ignore. First I make it visible — I track it in the backlog with clear notes on the impact, so it's not invisible. Then I prioritize: debt that slows down frequently-changed code or causes bugs gets paid down first, while debt in stable, rarely-touched areas can wait. I follow the boy-scout rule — leave the code a little cleaner than I found it — so I refactor incrementally as part of feature work instead of asking for big rewrite projects. And I always make sure there are tests before refactoring, so cleanups don't introduce regressions. The key is communicating the trade-off to the team and the product owner in terms of delivery speed and risk."

### 🧠 Quiz Nhanh

1. Theo clean code, đâu là dấu hiệu của một tên (naming) tốt?
   - [ ] Càng ngắn càng tốt, ưu tiên viết tắt như `d`, `tmp`
   - [x] Nói lên ý định: đọc tên hiểu nó là gì/làm gì mà không cần đọc thân hàm
   - [ ] Tên phải kèm số thứ tự để dễ phân biệt
   - [ ] Tên nên giấu ý định để code ngắn gọn hơn
   💡 Tên tốt nói lên ý định, phát âm và tìm kiếm được (`elapsedTimeInDays` hơn `d`); method là động từ, biến/class là danh từ — giảm hẳn nhu cầu comment.

2. "Replace Conditional with Polymorphism" thay thế if-else/switch theo type bằng cái gì?
   - [ ] Một vòng lặp while lớn hơn
   - [ ] Nhiều biến boolean cờ điều kiện
   - [x] Interface/abstract class với mỗi nhánh là một subclass override hành vi
   - [ ] Một câu switch expression duy nhất gọn hơn
   💡 Kỹ thuật tạo interface, mỗi nhánh thành subclass override hành vi, rồi gọi `obj.doIt()` để đa hình chọn implementation — tuân open-closed, thêm type = thêm class.

3. Khi refactor, quy tắc vàng để đảm bảo an toàn (không đổi hành vi) là gì?
   - [x] Có test bao quanh trước, refactor từng bước nhỏ và chạy test sau mỗi bước
   - [ ] Refactor toàn bộ một lần rồi mới viết test ở cuối
   - [ ] Trộn refactor và thêm tính năng trong cùng một commit để tiết kiệm thời gian
   - [ ] Bỏ test đi để refactor nhanh hơn
   💡 Tests first: nếu chưa có thì viết characterization test ghi lại hành vi hiện tại, refactor từng bước nhỏ, chạy test sau mỗi bước để bắt regression ngay, commit thường xuyên.

- **🧩 LeetCode:** #348 Design Tic-Tac-Toe (Medium) — Thiết kế hiệu quả với mảng đếm theo hàng/cột/đường chéo, move() O(1). Chú ý đặt tên rõ và tách method sạch.

- **🤖 AI Tools:** Dán code "bẩn" vào AI, yêu cầu liệt kê code smell và đề xuất refactor. So sánh gợi ý của AI với phân tích của bạn để học.

- **📚 Tài Nguyên:** Sách "Clean Code" (Robert C. Martin); "Refactoring" (Martin Fowler); Refactoring.Guru — Code Smells & Refactorings; SOLID principles articles.

## 🎯 Ngày 7 · Spaced Review T1-T10 + Mini Project: Refactor code áp dụng patterns + clean code

**19/07 — CN** · **REVIEW** · ⏱ 4h (ôn tập + project)

### 📖 Lý Thuyết Cốt Lõi

**1. Recap — JVM & Memory**

**ClassLoader** nạp class theo delegation model (Bootstrap → Platform → Application). **Runtime data areas**: Heap + Metaspace chia sẻ; Stack + PC + Native stack riêng thread. **Execution Engine** dùng Interpreter + JIT (C1/C2). **Memory**: Heap chia Young Gen (Eden + Survivor) và Old Gen; object promote khi sống lâu; 4 loại reference (strong/soft/weak/phantom) điều khiển khi GC dọn.

**2. Recap — Garbage Collection**

GC: **mark-sweep-compact**, dựa generational hypothesis. Collector: Serial, Parallel (throughput), **G1** (mặc định, cân bằng), **ZGC/Shenandoah** (low-latency). **Minor GC** dọn Young nhanh; **Full GC** dọn cả heap, pause dài cần tránh. **Memory leak** phổ biến: static collection, unclosed resource, listener leak, ThreadLocal không remove. Chẩn đoán bằng heap dump (MAT/VisualVM) + GC log.

**3. Recap — Design Patterns**

**Creational:** Singleton (enum/holder/double-checked), Factory Method, Abstract Factory, Builder (object phức tạp, immutable). **Structural:** Adapter (đổi interface), Decorator (thêm behavior runtime — java.io). **Behavioral:** Strategy (thuật toán hoán đổi — thay if-else), Observer (pub-sub — Spring events). Nguyên tắc: dùng pattern để giải vấn đề thật, tránh over-engineering.

**4. Recap — Clean Code & SOLID**

**Clean Code:** tên có ý nghĩa, function nhỏ một việc, DRY, code tự diễn giải. **Code smells:** long method, god class, duplicate, feature envy. **Refactoring:** extract method/class, replace conditional with polymorphism — luôn có test trước. **SOLID** (SRP/OCP/LSP/ISP/DIP) hiện thực trong Spring qua DI (= DIP), Strategy beans, Template Method, Proxy (AOP).

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// ===== MINI PROJECT: Refactor một "service bẩn" áp dụng patterns + SOLID =====

// ----- BEFORE: NotificationService god method, if-else theo channel -----
class NotificationServiceBefore {
    String send(String channel, String to, String msg) {
        if (channel.equals("EMAIL")) {
            // ... gọi SMTP, build payload, log
            return "{\"channel\":\"EMAIL\",\"to\":\"" + to + "\",\"status\":\"SENT\"}";
        } else if (channel.equals("SMS")) {
            // ... gọi SMS gateway
            return "{\"channel\":\"SMS\",\"to\":\"" + to + "\",\"status\":\"SENT\"}";
        }
        return "{\"status\":\"FAILED\"}";
    }
}
```

```java
// ----- AFTER: Strategy (channel) + Builder (response) + Factory + clean naming -----
import java.util.Map;

// Strategy: mỗi channel là một thuật toán gửi hoán đổi được
interface NotificationChannel {
    void deliver(String recipient, String message);
    String name();
}
class EmailChannel implements NotificationChannel {
    public void deliver(String to, String msg) { /* SMTP send */ }
    public String name() { return "EMAIL"; }
}
class SmsChannel implements NotificationChannel {
    public void deliver(String to, String msg) { /* SMS gateway */ }
    public String name() { return "SMS"; }
}

// Builder: dựng response rõ ràng, immutable
final class NotificationResult {
    private final String channel, recipient, status;
    private NotificationResult(Builder b) {
        this.channel = b.channel; this.recipient = b.recipient; this.status = b.status;
    }
    static Builder builder() { return new Builder(); }
    static class Builder {
        private String channel, recipient, status;
        Builder channel(String c)   { this.channel = c; return this; }
        Builder recipient(String r) { this.recipient = r; return this; }
        Builder status(String s)    { this.status = s; return this; }
        NotificationResult build()  { return new NotificationResult(this); }
    }
    @Override public String toString() {
        return "{channel=" + channel + ", to=" + recipient + ", status=" + status + "}";
    }
}

// Factory: chọn channel theo key (DIP - phụ thuộc interface, không 'new' trực tiếp)
class ChannelFactory {
    private final Map<String, NotificationChannel> channels;
    ChannelFactory(Map<String, NotificationChannel> channels) { this.channels = channels; }
    NotificationChannel resolve(String key) {
        NotificationChannel c = channels.get(key);
        if (c == null) throw new IllegalArgumentException("Unknown channel: " + key);
        return c;
    }
}

// Service: SRP - chỉ điều phối; không chứa logic gửi cụ thể; OCP - thêm channel mới
class NotificationService {
    private final ChannelFactory factory;
    NotificationService(ChannelFactory factory) { this.factory = factory; }

    NotificationResult send(String channelKey, String recipient, String message) {
        NotificationChannel channel = factory.resolve(channelKey); // polymorphism
        channel.deliver(recipient, message);
        return NotificationResult.builder()
                .channel(channel.name())
                .recipient(recipient)
                .status("SENT")
                .build();
    }
}
// Thêm PushChannel mới = thêm 1 class + đăng ký vào map, KHÔNG sửa NotificationService.
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Hoàn thiện mini project refactor: lấy một service "bẩn" (notification/payment/order) và áp dụng Strategy cho business rules + Builder cho response + Factory chọn implementation + đặt tên sạch + SOLID. Viết test trước khi refactor.
2. Viết tài liệu so sánh **before/after**: liệt kê code smell ban đầu, pattern/kỹ thuật đã áp dụng cho từng cái, và lợi ích đạt được (dễ test hơn, OCP, ít coupling).
3. Push project lên GitHub với **README bằng tiếng Anh** giải thích các pattern đã áp dụng (Strategy, Builder, Factory), nguyên tắc SOLID, và lý do thiết kế. Đây là tài liệu để show trong phỏng vấn.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (10 câu, REVIEW T1-T10)

**Dễ · Liệt kê các runtime data areas của JVM và phân loại shared/per-thread.**

**Chia sẻ giữa thread:** Heap (object/mảng, nơi GC chạy), Method Area/Metaspace (class metadata, static, constant pool). **Riêng từng thread:** JVM Stack (stack frame, biến local), PC Register (lệnh đang chạy), Native Method Stack (method native qua JNI). Object luôn ở Heap; reference tới object nằm trên Stack.

**Dễ · GC hoạt động cơ bản thế nào và G1 khác Parallel GC ở đâu?**

GC duyệt từ GC roots để mark object sống, sweep object chết, compact chống phân mảnh; dựa generational hypothesis (đa số object chết trẻ). **Parallel GC** tối ưu throughput, dùng nhiều thread nhưng pause stop-the-world dài. **G1** chia heap thành region, ưu tiên dọn region nhiều rác trước, có mục tiêu pause time (`MaxGCPauseMillis`), cân bằng giữa throughput và độ trễ — mặc định từ Java 9.

**Trung · Làm Singleton thread-safe — cách nào và vì sao enum tốt nhất?**

Các cách: eager init, synchronized method (chậm), double-checked locking với `volatile`, holder idiom (lazy + thread-safe nhờ class loading), enum. **Enum** tốt nhất vì: thread-safe tự nhiên (JVM khởi tạo một lần), chống reflection tạo instance thứ hai, và xử lý serialization đúng (không tạo instance mới khi deserialize) — các cách khác phải tự lo `readResolve()`.

**Trung · Strategy khác Factory ở điểm nào?**

Mục đích khác nhau: **Factory** là creational — lo việc *tạo* object (trả về instance của class cụ thể qua interface, giấu logic khởi tạo). **Strategy** là behavioral — lo việc *chọn hành vi/thuật toán* để thực thi (object đã có sẵn, ta hoán đổi cách nó làm việc lúc runtime). Chúng thường dùng cùng nhau: Factory tạo ra Strategy phù hợp rồi context dùng Strategy đó. Factory trả lời "tạo cái gì", Strategy trả lời "làm như thế nào".

**Trung · Khác biệt giữa StackOverflowError và OutOfMemoryError, và memory leak phổ biến?**

**StackOverflowError**: Stack một thread tràn (đệ quy quá sâu). **OutOfMemoryError**: JVM không cấp được bộ nhớ (Heap đầy, Metaspace đầy, GC overhead). **Memory leak phổ biến trong Java** (object vẫn reachable nên GC không dọn): static collection phình to, unclosed resource, listener/callback không hủy đăng ký, ThreadLocal không remove trong thread pool. Chẩn đoán bằng heap dump + GC log.

**Khó · SOLID là gì và áp dụng trong code/Spring thế nào?**

**S**RP (một class một trách nhiệm/lý do thay đổi), **O**CP (mở rộng không sửa code cũ — qua interface/polymorphism), **L**SP (subclass thay được superclass mà không phá hành vi), **I**SP (interface nhỏ chuyên biệt thay vì một interface khổng lồ), **D**IP (phụ thuộc abstraction, không phụ thuộc chi tiết). Trong Spring: tách Controller/Service/Repository (SRP), inject interface (DIP = Dependency Injection), thêm implementation mới không sửa caller (OCP), inject `Map<String, Strategy>` (Strategy + OCP).

**Khó · Quy trình refactor một method dài, if-else theo type thành code sạch?**

(1) Viết/đảm bảo có test bao quanh hành vi hiện tại. (2) **Extract Method** tách các đoạn logic con thành method có tên rõ. (3) Nhận diện if-else/switch theo type là code smell, áp dụng **Replace Conditional with Polymorphism**: tạo interface, mỗi nhánh thành một class Strategy. (4) Dùng **Factory/DI** để chọn implementation, áp dụng **SRP** tách trách nhiệm (tính toán vs format vs log). (5) Chạy test sau mỗi bước, commit nhỏ. Kết quả: thêm type mới = thêm class (OCP), code dễ test và đọc.

**Khó · Khi nào pattern trở thành over-engineering?**

Pattern thành over-engineering khi áp dụng *không vì một vấn đề thật*: thêm tầng trừu tượng, interface, factory cho code chỉ có một implementation và không có dấu hiệu sẽ mở rộng; dùng Strategy cho hai nhánh đơn giản ổn định; premature abstraction theo DRY trên code chỉ trông giống nhau. Hệ quả: code khó đọc hơn, nhiều file/indirection, khó debug. Nguyên tắc: dùng pattern khi nó giải quyết complexity thực (mở rộng thường xuyên, nhiều biến thể, cần decouple để test) — theo YAGNI và Rule of Three, đừng trừu tượng hóa sớm.

**Mock EN · "Tell me about an important design decision you made and its trade-offs."**

"On one project we needed to support multiple payment providers, and the team initially wanted a big if-else block in the service. I proposed introducing a **Strategy** pattern with a `PaymentProvider` interface and one implementation per provider, wired through Spring as a map of beans. *(Action)* The trade-off was a bit more boilerplate up front — more classes and interfaces. But the payoff was that adding a new provider became a self-contained class with its own tests, without touching existing code, which followed the open-closed principle. *(Result)* When we onboarded two new providers later, each took a day instead of risky edits to a shared method, and we had zero regressions. I made sure not to over-abstract — we only introduced the pattern because we had a concrete, near-term need for multiple providers."

**Mock EN · "How do you grow other engineers and influence technical direction?"**

"I focus on raising the team's level rather than just shipping my own code. *(Situation/Task)* On my team several juniors were unsure about design patterns and clean code, and our reviews kept catching the same issues. *(Action)* I started doing thorough, constructive code reviews — explaining the 'why' behind suggestions, not just the 'what' — and I ran short knowledge-sharing sessions on topics like refactoring, SOLID, and how Spring uses these patterns under the hood. I also paired with engineers on tricky refactorings so they could see the small-step, test-first approach in practice. For technical direction, I bring proposals backed by concrete trade-offs and data rather than opinions, and I make space for the team to push back. *(Result)* Over a few months our review comments shifted from basic issues to higher-level design discussions, and a couple of the juniors started leading their own features confidently."

### 🧠 Quiz Nhanh

1. Trong recap JVM, Execution Engine dùng những cơ chế nào để thực thi bytecode?
   - [ ] Chỉ dùng interpreter cho mọi method
   - [ ] Chỉ dùng JIT biên dịch sẵn toàn bộ trước khi chạy
   - [x] Kết hợp Interpreter và JIT (C1/C2), compile hot methods thành native code
   - [ ] Dịch bytecode trực tiếp thành SQL để chạy
   💡 Interpreter chạy nhanh lúc khởi động; JIT (C1 compile nhanh, C2 tối ưu sâu) biên dịch hot methods thành native code được cache để tăng hiệu năng.

2. Strategy và Factory khác nhau ở mục đích cốt lõi như thế nào?
   - [x] Factory lo việc tạo object; Strategy lo việc chọn hành vi/thuật toán để thực thi
   - [ ] Cả hai đều là creational pattern với cùng mục đích
   - [ ] Strategy tạo object, Factory hoán đổi thuật toán runtime
   - [ ] Factory là behavioral, Strategy là structural
   💡 Factory (creational) trả lời "tạo cái gì"; Strategy (behavioral) trả lời "làm như thế nào" — chúng hay dùng cùng nhau: Factory tạo ra Strategy phù hợp rồi context dùng.

3. Khi nào việc áp dụng một design pattern trở thành over-engineering?
   - [ ] Khi pattern giải quyết một vấn đề mở rộng thực sự và nhiều biến thể
   - [x] Khi thêm tầng trừu tượng/factory cho code chỉ có một implementation, không dấu hiệu mở rộng
   - [ ] Khi dùng Dependency Injection trong Spring
   - [ ] Khi viết test trước lúc refactor
   💡 Pattern thành over-engineering khi áp dụng không vì vấn đề thật (một implementation, hai nhánh đơn giản ổn định) — theo YAGNI và Rule of Three, đừng trừu tượng hóa sớm.

- **🧩 LeetCode:** #707 Design Linked List (Medium) — Tự cài linked list với get/addAtHead/addAtTail/addAtIndex/deleteAtIndex. Chú ý thiết kế node sạch, đặt tên rõ — củng cố design skills.

- **🤖 AI Tools:** Nhờ AI review mini project: pattern dùng đúng chỗ chưa, có over-engineering không, README tiếng Anh có rõ ràng không.

- **📚 Tài Nguyên:** Refactoring.Guru (tổng hợp patterns); Effective Java; "Clean Code" + "Refactoring"; ôn lại GC tuning guide của Oracle.

## 🎯 Tổng Kết Tuần 10

### 📋 Ngân Hàng Câu Hỏi Phỏng Vấn

*Ôn lại cuối tuần — trả lời to ra, ghi âm, nghe lại.*

**JVM & Memory**

- **Q: Explain the JVM architecture and how the classloader works.**  
  A: The JVM runs platform-independent bytecode. The classloader subsystem loads classes using a parent-first delegation model — Bootstrap, then Platform, then Application loaders — which keeps core classes secure. Classes are loaded, linked (verify, prepare, resolve), and initialized. The execution engine then runs the bytecode, starting with an interpreter and using the JIT compiler (C1/C2) to compile hot methods into optimized native code.
- **Q: What are the JVM memory areas, and how do heap and stack differ?**  
  A: Shared areas are the heap (all objects, where GC runs) and metaspace (class metadata). Per-thread areas are the stack (stack frames, local variables, references), the PC register, and the native method stack. The heap holds objects and needs synchronization for concurrent access; the stack holds local data, is thread-safe by nature, and is freed automatically when methods return.
- **Q: How does garbage collection work in Java?**  
  A: The GC marks objects reachable from GC roots as live, sweeps the dead ones, and compacts to avoid fragmentation. It uses the generational hypothesis — most objects die young — so it collects the young generation frequently with cheap minor GCs and the old generation rarely. G1 is the balanced default; ZGC and Shenandoah give very low pause times for large heaps.

**Design Patterns**

- **Q: How do you implement a thread-safe Singleton, and which way is best?**  
  A: Options include eager init, double-checked locking with volatile, the holder idiom, and an enum. The enum is the best choice because it's thread-safe by the JVM, prevents a second instance via reflection, and handles serialization correctly without needing readResolve. In Spring I usually rely on singleton-scoped beans instead of hand-coding it.
- **Q: What's the difference between Factory Method and Abstract Factory?**  
  A: Factory Method creates a single product and uses inheritance — subclasses decide which concrete class to instantiate. Abstract Factory creates whole families of related products through one factory object, ensuring the products are compatible with each other, for example a GUIFactory that produces a matching Button and Checkbox for one theme.
- **Q: What is the Strategy pattern and when would you use it?**  
  A: Strategy defines a family of interchangeable algorithms behind a common interface so you can swap behavior at runtime, like different payment methods behind a PaymentStrategy interface. I use it instead of a long if-else chain when the branches are distinct algorithms that change independently, because it follows the open-closed principle — a new behavior is a new class, not an edit to existing code.

**Clean Code & SOLID**

- **Q: How do you identify code smells and refactor them?**  
  A: Common smells are long methods, god classes, duplicate code, and feature envy. I refactor with a safety net — tests first — and in small steps, running tests after each one. Typical techniques are extract method, extract class, and replacing conditionals with polymorphism. The goal is to improve structure without changing observable behavior.
- **Q: Can you explain the SOLID principles and how you apply them?**  
  A: SRP — one reason to change per class; OCP — extend without modifying; LSP — subtypes substitutable for their base; ISP — small focused interfaces; DIP — depend on abstractions. In Spring I apply them by separating controller/service/repository layers (SRP), injecting interfaces (DIP via dependency injection), and adding new implementations of an interface without touching callers (OCP).
- **Q: What does "replace conditional with polymorphism" mean?**  
  A: It replaces an if-else or switch that branches on a type with polymorphism — you create an interface and one subclass per branch, then call a method and let dynamic dispatch pick the right implementation. It removes repeated type-checking, follows the open-closed principle, and makes each behavior easy to test. I use it when the same type-based switch appears in many places or the set of types keeps growing.

### ✅ Checklist Cuối Tuần

- [ ] Hiểu JVM architecture + classloader (delegation model, loading/linking/init, execution engine + JIT)
- [ ] Nắm các vùng nhớ: heap (young/old gen), stack, metaspace — shared vs per-thread
- [ ] Hiểu GC algorithms (Serial/Parallel/G1/ZGC) + GC tuning (heap size, flags, GC log)
- [ ] Biết các memory leak phổ biến + cách chẩn đoán (heap dump, MAT/VisualVM, GC log)
- [ ] Triển khai thread-safe Singleton bằng 2 cách (holder idiom + enum)
- [ ] Áp dụng Factory Method/Abstract Factory + Builder cho object phức tạp, immutable
- [ ] Hiểu & code được Strategy, Observer, Decorator, Adapter (có ví dụ JDK/Spring)
- [ ] Nhận diện code smells + áp dụng clean code (naming, small functions, DRY)
- [ ] Áp dụng SOLID + refactoring (extract method, replace conditional with polymorphism)
- [ ] Hoàn thành mini project refactor (patterns + clean code) + push GitHub kèm README EN

> 💡 **Golden Rule Tuần 10:** Hiểu JVM = hiểu code mình chạy thế nào, debug memory/performance tự tin. Design Patterns không phải để "show off" — dùng đúng chỗ giải quyết vấn đề thật, lạm dụng = over-engineering. Clean Code là tôn trọng người đọc sau (kể cả chính bạn 6 tháng sau). SOLID + patterns + clean code = code sống lâu, dễ đổi. Đây là dấu hiệu senior engineer thực thụ.
