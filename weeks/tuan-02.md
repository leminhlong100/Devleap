# 📘 Tuần 2 · Java Core: Exception + Collections · 18/05–24/05/2025

## 📋 Tổng quan Tuần 2 — Exception + Collections

| Ngày | Thứ | Chế độ | Giờ | Chủ đề |
| --- | --- | --- | --- | --- |
| 18/05 | Thứ 2 | LIGHT | 1.5h | Exception Hierarchy: Checked vs Unchecked, try-catch-finally |
| 19/05 | Thứ 3 | FULL | 2.5h | Custom Exception, try-with-resources, Multi-catch, Chained Exception |
| 20/05 | Thứ 4 | FULL | 2.5h | ArrayList vs LinkedList, Iterator, Big-O complexity |
| 21/05 | Thứ 5 | FULL | 2.5h | HashMap internals, HashSet, TreeMap, TreeSet |
| 22/05 | Thứ 6 | LIGHT | 1.5h | Stream API: filter, map, collect, reduce |
| 23/05 | Thứ 7 | WEEKEND | 4h | Stream Advanced: Collectors, flatMap, groupingBy + Thread-safe Collections |
| 24/05 | CN | REVIEW | 4h | Spaced Review + Mini Project: Student Grade Manager |

## ⚡ Ngày 1 · Exception Hierarchy: Checked vs Unchecked, try-catch-finally

**18/05/2025 — Thứ 2** · **LIGHT** · 1.5h

### 📚 Lý thuyết — Exception Hierarchy & try-catch-finally

**Exception Hierarchy**

**Throwable** là gốc của mọi lỗi trong Java.
 ├── **Error**: lỗi hệ thống, không nên catch (OutOfMemoryError, StackOverflowError)
 └── **Exception**:
 ├── **Checked**: IOException, SQLException — phải xử lý
 └── **Unchecked (RuntimeException)**: NullPointerException, ArrayIndexOutOfBoundsException — tùy chọn xử lý

**Checked vs Unchecked**

**Checked Exception:**
 • Compiler bắt buộc phải try-catch hoặc throws
 • Dùng cho lỗi có thể phục hồi (file not found, network error)

 **Unchecked Exception (RuntimeException):**
 • Không bắt buộc xử lý
 • Thường do lỗi lập trình (null pointer, bad index)
 • Nên fix code, không nên catch

**try-catch-finally Syntax**

try { // code có thể throw exception } catch (SpecificException e) { // xử lý exception cụ thể } catch (Exception e) { // fallback - bắt mọi exception } finally { // LUÔN chạy: đóng resource, cleanup } *finally chạy kể cả khi return trong try.*

**throws keyword**

Khai báo method có thể throw checked exception:
 public void readFile(String path) throws IOException { // có thể throw IOException FileReader fr = new FileReader(path); } *throws = "tôi có thể ném, bạn tự lo". throw = "tôi ném ngay bây giờ".*

### 💻 Code — BasicExceptionDemo.java

```
import java.io.IOException;

public class BasicExceptionDemo {

    // Checked exception — phải khai báo throws
    public static int readAge(String input) throws IOException {
        if (input == null) {
            throw new IOException("Input cannot be null");
        }
        return Integer.parseInt(input); // có thể throw NumberFormatException (unchecked)
    }

    // Multiple catch blocks
    public static void demonstrateMultiCatch(String value) {
        try {
            int number = Integer.parseInt(value);   // NumberFormatException
            int result = 100 / number;              // ArithmeticException
            System.out.println("Result: " + result);
        } catch (NumberFormatException e) {
            System.err.println("Invalid number format: " + e.getMessage());
        } catch (ArithmeticException e) {
            System.err.println("Arithmetic error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
        } finally {
            System.out.println("finally block always runs!");
        }
    }

    // finally guarantees cleanup
    public static void demonstrateFinally() {
        System.out.println("=== finally demo ===");
        try {
            System.out.println("In try block");
            if (true) throw new RuntimeException("test exception");
            System.out.println("This line never runs");
        } catch (RuntimeException e) {
            System.out.println("Caught: " + e.getMessage());
            return; // even with return, finally still runs!
        } finally {
            System.out.println("finally runs ALWAYS — perfect for cleanup");
        }
    }

    public static void main(String[] args) {
        // Test 1: normal flow
        demonstrateMultiCatch("5");

        // Test 2: bad format
        demonstrateMultiCatch("abc");

        // Test 3: division by zero
        demonstrateMultiCatch("0");

        // Test 4: finally with return
        demonstrateFinally();

        // Test 5: checked exception with try-catch
        try {
            int age = readAge("25");
            System.out.println("Age: " + age);

            int badAge = readAge(null); // throws IOException
        } catch (IOException e) {
            System.err.println("IOException caught: " + e.getMessage());
        }
    }
}
```

### ✏️ Bài tập thực hành

1. **Checked IOException:** Viết method `validateAge(int age)` throw `IllegalArgumentException` nếu age < 0 hoặc age > 150. Viết thêm method `loadConfig(String filename) throws IOException` — nếu filename không kết thúc ".properties" thì throw IOException. Test cả hai.
2. **NumberFormatException:** Viết method `safeParseInt(String s, int defaultValue)` — dùng try-catch để bắt NumberFormatException, nếu parse thất bại thì trả về defaultValue. Test với "123", "abc", null, "".
3. **finally always runs:** Viết demo chứng minh finally chạy trong 3 tình huống: (a) try thành công, (b) exception bị catch, (c) exception không bị catch (dùng method riêng). In ra thứ tự thực thi để quan sát.

### ❓ Q&A — 5 câu hỏi phỏng vấn

- Dễ Exception hierarchy trong Java là gì? Throwable, Error, Exception khác nhau thế nào? ▼

  **Throwable** là class gốc của mọi lỗi có thể throw/catch. Có 2 nhánh con:
   • **Error**: lỗi nghiêm trọng từ JVM (OutOfMemoryError, StackOverflowError) — thường không nên catch, chứng tỏ môi trường bị hỏng.
   • **Exception**: lỗi trong logic ứng dụng — có thể và nên xử lý. Tiếp tục chia thành Checked và Unchecked (RuntimeException).
- Dễ Checked Exception và Unchecked Exception khác nhau thế nào? Cho ví dụ? ▼

  **Checked Exception:** Compiler kiểm tra tại compile-time — bạn PHẢI try-catch hoặc khai báo throws. Ví dụ: IOException, SQLException, ClassNotFoundException.

   **Unchecked Exception (extends RuntimeException):** Compiler không bắt buộc xử lý. Ví dụ: NullPointerException, ArrayIndexOutOfBoundsException, NumberFormatException.

   Rule of thumb: Checked = lỗi ngoài tầm kiểm soát của bạn (file, network). Unchecked = lỗi do code sai (null, bad index).
- Trung Khi nào nên dùng Checked Exception, khi nào dùng Unchecked Exception? ▼

  **Dùng Checked Exception** khi: caller CÓ THỂ phục hồi từ lỗi (file không tìm thấy → thử file khác; network timeout → retry). Forced handling đảm bảo caller biết và xử lý.

   **Dùng Unchecked Exception** khi: lỗi do vi phạm contract/programming bug (null argument, illegal state). Caller không thể "phục hồi" — cần fix code. Ví dụ: `IllegalArgumentException`, `IllegalStateException`.

   Modern Java (và Spring) thường prefer Unchecked Exception để giảm boilerplate và checked exception pollution.
- Trung finally block có chạy không nếu có return statement trong try block? ▼

  **Có** — finally LUÔN chạy, kể cả khi có return trong try hoặc catch. Ngoại lệ duy nhất: `System.exit()` được gọi, hoặc JVM crash.

   Thứ tự: try body → (nếu exception: catch body) → finally → sau đó mới return.

   Lưu ý: Nếu finally cũng có return statement, nó sẽ ghi đè return của try/catch — đây là pattern nguy hiểm, tránh dùng.
- Khó Sự khác biệt giữa Error và Exception? Có nên catch Error không? ▼

  **Error:** Đại diện cho các điều kiện nghiêm trọng mà ứng dụng không nên cố recover (OutOfMemoryError, StackOverflowError, VirtualMachineError). JVM ở trạng thái không ổn định.

   **Exception:** Điều kiện bất thường trong logic ứng dụng — có thể xử lý và tiếp tục.

   **Có nên catch Error?** Thường là KHÔNG. Nhưng có ngoại lệ: một số framework (test frameworks, application servers) catch Throwable để log trước khi shutdown. Nếu bạn catch OutOfMemoryError, code của bạn trong catch block có thể không đủ memory để chạy. Best practice: catch Exception (không phải Throwable) ở top-level handlers.

### 🧠 Quiz Nhanh

1. Trong cây phân cấp exception của Java, class nào là gốc của mọi lỗi có thể throw/catch?
   - [ ] Exception
   - [ ] RuntimeException
   - [x] Throwable
   - [ ] Error
   💡 Throwable là class gốc, có 2 nhánh con là Error và Exception.

2. Loại exception nào bắt buộc compiler kiểm tra tại compile-time, buộc phải try-catch hoặc khai báo throws?
   - [x] Checked Exception (ví dụ IOException)
   - [ ] Unchecked Exception (ví dụ NullPointerException)
   - [ ] RuntimeException
   - [ ] Error
   💡 Checked Exception (IOException, SQLException) bị compiler bắt buộc xử lý; Unchecked thì không.

3. Khi có `return` trong try block, finally block xử lý thế nào?
   - [ ] finally bị bỏ qua vì đã return
   - [ ] finally chỉ chạy nếu không có exception
   - [x] finally vẫn LUÔN chạy trước khi return thực sự xảy ra
   - [ ] finally chạy sau khi method đã return
   💡 finally luôn chạy kể cả khi có return; ngoại lệ duy nhất là System.exit() hoặc JVM crash.

- **🟢 LeetCode:** #20 Valid Parentheses — Độ khó: Easy · Dùng Stack — kiến thức nền tảng cho Collections tuần này — Dùng `Deque<Character>` làm stack. Push mỗi opening bracket, pop và check khi gặp closing bracket. Return true nếu stack empty cuối cùng.

- **🤖 AI Tool:** GitHub Copilot — Exception Snippets — Prompt: *"Generate a try-catch-finally block for reading a file with IOException and NumberFormatException handling, including resource cleanup in finally"*. Quan sát code Copilot tạo ra, so sánh với code bạn tự viết.

- **📖 Resource:** Baeldung — Exception Handling — Đọc: **baeldung.com/java-exceptions** — phần "Exception Hierarchy" và "Checked vs Unchecked". Bookmark để ôn lại. Đọc thêm "baeldung.com/java-finally-keyword" cho chi tiết finally behavior.

## 💪 Ngày 2 · Custom Exception, try-with-resources, Multi-catch, Chained Exception

**19/05/2025 — Thứ 3** · **FULL** · 2.5h

### 📚 Lý thuyết — Custom Exception, try-with-resources, Multi-catch, Chained

**Custom Exception**

Tạo exception riêng bằng cách extend RuntimeException (unchecked) hoặc Exception (checked):
 public class InsufficientFundsException extends RuntimeException { private final double amount; public InsufficientFundsException(double amount) { super("Insufficient funds: need " + amount); this.amount = amount; } public double getAmount() { return amount; } } Luôn cung cấp constructor nhận String message và constructor nhận message + cause.

**try-with-resources**

Java 7+ — tự động đóng resource implement **AutoCloseable**:
 try (FileReader fr = new FileReader(path); BufferedReader br = new BufferedReader(fr)) { return br.readLine(); } // fr và br tự đóng, ngay cả khi có exception close() được gọi theo thứ tự ngược lại (br trước, fr sau). Nếu cả exception trong body và close() đều xảy ra: exception body được giữ, exception close() là "suppressed".

**Multi-catch (Java 7+)**

Bắt nhiều exception type trong 1 catch block bằng dấu **|**:
 try { // ... } catch (IOException | SQLException e) { // xử lý chung cả hai logger.error("Data access error", e); } Lưu ý: Các exception trong multi-catch không được có quan hệ thừa kế (compile error). Biến e là effectively final.

**Chained Exception**

Wrap exception gốc vào domain exception để preserve context:
 try { // low-level operation } catch (SQLException e) { // wrap với cause throw new DataAccessException("DB error", e); } Dùng `getCause()` để lấy exception gốc. Stack trace sẽ show "Caused by: SQLException..." — rất hữu ích khi debug.

### 💻 Code — CustomException.java + ResourceManager.java

```
// ===== CustomException.java =====
// Base domain exception
public class AppException extends RuntimeException {
    private final String errorCode;

    public AppException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public AppException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}

// Specific business exception
public class InsufficientFundsException extends AppException {
    private final double required;
    private final double available;

    public InsufficientFundsException(double required, double available) {
        super("INSUFFICIENT_FUNDS",
              String.format("Required %.2f but only %.2f available", required, available));
        this.required = required;
        this.available = available;
    }

    public double getRequired() { return required; }
    public double getAvailable() { return available; }
}

// Usage demo
public class BankAccount {
    private double balance;

    public BankAccount(double initialBalance) {
        this.balance = initialBalance;
    }

    public void withdraw(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive: " + amount);
        }
        if (amount > balance) {
            throw new InsufficientFundsException(amount, balance);
        }
        balance -= amount;
        System.out.printf("Withdrew %.2f, balance now %.2f%n", amount, balance);
    }
}

// ===== ResourceManager.java — AutoCloseable + try-with-resources =====
import java.io.*;

public class ResourceManager implements AutoCloseable {
    private final String name;
    private boolean closed = false;

    public ResourceManager(String name) {
        this.name = name;
        System.out.println("[" + name + "] Resource opened");
    }

    public String readData() throws IOException {
        if (closed) throw new IOException("Resource already closed: " + name);
        return "data from " + name;
    }

    @Override
    public void close() {
        if (!closed) {
            closed = true;
            System.out.println("[" + name + "] Resource closed (auto)");
        }
    }

    public static void main(String[] args) {
        // try-with-resources: multiple resources, closed in reverse order
        try (ResourceManager r1 = new ResourceManager("DB-Connection");
             ResourceManager r2 = new ResourceManager("File-Stream")) {

            String data1 = r1.readData();
            String data2 = r2.readData();
            System.out.println("Got: " + data1 + ", " + data2);

        } catch (IOException e) {
            System.err.println("Failed to read: " + e.getMessage());
        }
        // Both r1, r2 are now closed

        // Multi-catch demo
        String[] values = {"42", "not-a-number", null};
        for (String v : values) {
            try {
                int n = Integer.parseInt(v);       // NumberFormatException or NPE
                System.out.println("Parsed: " + n);
            } catch (NumberFormatException | NullPointerException e) {
                System.err.println("Parse failed for [" + v + "]: " + e.getClass().getSimpleName());
            }
        }

        // Chained exception
        try {
            simulateLowLevelError();
        } catch (AppException e) {
            System.err.println("Domain error: " + e.getMessage());
            System.err.println("Root cause: " + e.getCause().getMessage());
        }
    }

    private static void simulateLowLevelError() {
        try {
            throw new SQLException("Connection timeout");
        } catch (Exception e) {
            throw new AppException("DB_ERROR", "Failed to fetch user data", e);
        }
    }
}
```

### ✏️ Bài tập thực hành

1. **InsufficientFundsException:** Implement lớp `BankAccount` đầy đủ với `deposit(double)`, `withdraw(double)`, `transfer(BankAccount target, double amount)`. Đảm bảo mỗi method throw đúng exception với message có nghĩa. Viết main() test 5 scenarios: rút đủ, rút quá, deposit âm, transfer, chain of transfers.
2. **FileProcessor với try-with-resources:** Tạo class `CsvParser implements AutoCloseable` đọc file CSV (dùng `BufferedReader`). Method `parseLines()` trả về `List<String[]>`. Dùng try-with-resources ở nơi gọi. Test với file thật và file không tồn tại.
3. **Multi-catch demo:** Viết method `riskyOperation(String input)` có thể throw `NumberFormatException`, `ArithmeticException`, `ArrayIndexOutOfBoundsException`. Dùng multi-catch để bắt NFE và AIE chung, ArithmeticException riêng. In loại exception nào được bắt.
4. **Domain Exception Hierarchy:** Thiết kế hierarchy: `AppException` → `BusinessException` → {`ValidationException`, `AuthorizationException`}. Mỗi exception có errorCode. Viết `UserService` với method `createUser()` throw ValidationException khi email sai format, AuthorizationException khi không có quyền.

### ❓ Q&A — 7 câu hỏi phỏng vấn

- Dễ try-with-resources là gì và tại sao nên dùng thay vì finally? ▼

  try-with-resources (Java 7+) tự động gọi `close()` trên các resource sau khi try block hoàn thành, kể cả khi có exception. Resource phải implement `AutoCloseable`.

   **Tại sao tốt hơn finally:** (1) Code ngắn gọn hơn, (2) Xử lý đúng "suppressed exceptions" — nếu cả exception chính và exception trong close() xảy ra, close() exception được suppressed (không bị nuốt mất như với finally), (3) Nhiều resource được đóng theo đúng thứ tự ngược.
- Dễ Khi tạo Custom Exception, nên extend Exception hay RuntimeException? ▼

  Phụ thuộc vào use case:
   • **extend RuntimeException (unchecked)**: Dùng cho business logic exceptions (InsufficientFundsException, UserNotFoundException). Modern Spring apps thường dùng unchecked để tránh checked exception pollution.
   • **extend Exception (checked)**: Dùng khi caller BẮT BUỘC phải xử lý và có thể phục hồi (ví dụ framework/library code).

   Best practice: Luôn cung cấp 2 constructor: `(String message)` và `(String message, Throwable cause)` để support chaining.
- Trung Multi-catch có hạn chế gì? Tại sao không thể catch (IOException | FileNotFoundException)? ▼

  **Hạn chế:** Các exception types trong multi-catch không được có quan hệ thừa kế (inheritance). `FileNotFoundException extends IOException`, nên compiler báo lỗi: "FileNotFoundException is a subclass of IOException" — catch IOException đã bao gồm FileNotFoundException rồi.

   **Lý do:** Nếu cho phép, type của `e` sẽ không xác định (ambiguous). Trong multi-catch, biến e có type là "common supertype" của các exception types, và là effectively final (không thể reassign).

   Chỉ dùng multi-catch cho các exception types không liên quan nhau.
- Trung Chained Exception là gì? Tại sao quan trọng trong production? ▼

  Chained Exception (Exception chaining) = wrap low-level exception vào high-level domain exception, giữ nguyên original cause.

  ```
  throw new ServiceException("User save failed", sqlException);
  ```

  **Tại sao quan trọng:**
   • Layer abstraction: caller thấy domain error, không phải database error
   • Debug: log stack trace vẫn show "Caused by: SQLException" để tìm root cause
   • Không mất thông tin lỗi gốc (anti-pattern: catch và throw new Exception mà không truyền cause)
   Dùng `getCause()` để navigate chain. Log tools như Logback tự in cả chain.
- Khó Suppressed Exception trong try-with-resources là gì? ▼

  Khi try-with-resources block throw exception VÀ resource.close() cũng throw exception:
   • Exception từ try body là "primary exception" — được propagate bình thường
   • Exception từ close() là "suppressed exception" — được đính kèm vào primary exception

   Có thể truy cập: `e.getSuppressed()` trả về array các suppressed exceptions.

   **Tại sao tốt hơn finally cũ?** Với finally thủ công, nếu finally cũng throw exception, nó sẽ nuốt mất exception gốc từ try block — mất thông tin! try-with-resources giải quyết đúng cả hai cases.
- Khó Anti-patterns phổ biến nhất khi xử lý exception trong Java? ▼

  **Top 5 anti-patterns:**
   1. **Swallowing exception:** `catch(Exception e) {}` — im lặng nuốt lỗi, không log, không rethrow → nightmare khi debug
   2. **Catching Exception/Throwable quá rộng:** catch Exception ở tầng sâu khi chỉ cần catch IOException
   3. **Exception để control flow:** dùng exception thay vì if-else → chậm, code khó đọc
   4. **Lost cause khi chaining:** `throw new AppException(e.getMessage())` không truyền cause → mất stack trace gốc
   5. **Không đóng resource trong finally/try-with-resources:** resource leak
- Mock EN EN: "Can you walk me through how you would design exception handling for a REST API service?" ▼

  **Sample answer (luyện nói):**
   "Sure. I would define a base `AppException` extending `RuntimeException` with an error code and HTTP status. Then I'd create specific subclasses like `ResourceNotFoundException` for 404 and `ValidationException` for 400. At the controller layer, I'd use a `@RestControllerAdvice` with `@ExceptionHandler` methods to catch these domain exceptions and convert them to consistent JSON error responses. For unexpected exceptions, I'd have a catch-all handler that returns 500 and logs the full stack trace. This way, business logic throws meaningful exceptions, and the global handler translates them to appropriate HTTP responses."

### 🧠 Quiz Nhanh

1. Để một resource có thể dùng được trong try-with-resources, nó phải implement interface nào?
   - [ ] Closeable duy nhất
   - [x] AutoCloseable
   - [ ] Serializable
   - [ ] Comparable
   💡 try-with-resources tự gọi close() trên resource implement AutoCloseable; nhiều resource đóng theo thứ tự ngược.

2. Tại sao `catch (IOException | FileNotFoundException e)` gây compile error?
   - [ ] Vì multi-catch chỉ cho phép tối đa 1 type
   - [ ] Vì biến e không được effectively final
   - [x] Vì FileNotFoundException là subclass của IOException (có quan hệ thừa kế)
   - [ ] Vì IOException là checked exception
   💡 Multi-catch không cho phép các type có quan hệ thừa kế; catch IOException đã bao gồm FileNotFoundException rồi.

3. Khi cả try body và close() đều throw exception trong try-with-resources, điều gì xảy ra?
   - [ ] Exception từ close() được propagate, exception body bị nuốt mất
   - [ ] Cả hai exception đều bị nuốt mất
   - [x] Exception body là primary, exception close() trở thành suppressed
   - [ ] JVM crash
   💡 Exception từ body được giữ làm primary; exception close() được đính kèm dưới dạng suppressed (truy cập qua getSuppressed()).

- **🟡 LeetCode:** #739 Daily Temperatures — Độ khó: Medium · Monotonic Stack — Dùng stack lưu index. Với mỗi ngày, pop stack khi nhiệt độ hiện tại > nhiệt độ ngày ở top. Kết quả = current index - popped index. Liên quan: Deque/Stack từ Collections.

- **🤖 AI Tool:** GitHub Copilot — Exception Hierarchy — Prompt: *"Generate a domain exception hierarchy for an e-commerce application with AppException as base, and specific exceptions for Payment, Inventory, and Order domains. Include error codes."* Đánh giá design của Copilot.

- **📖 Resource:** Oracle Docs — try-with-resources — Đọc: **docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html** — phần "Suppressed Exceptions" đặc biệt quan trọng. Đọc thêm: Baeldung "java-try-with-resources".

## 💪 Ngày 3 · ArrayList vs LinkedList, Iterator, Big-O complexity

**20/05/2025 — Thứ 4** · **FULL** · 2.5h

### 📚 Lý thuyết — ArrayList vs LinkedList, Iterator, Big-O

**ArrayList — Dynamic Array**

Backed bởi **Object[]** nội bộ. Default capacity = 10, tự grow ×1.5 khi đầy.

 **Big-O:**
 • get(i): **O(1)** — truy cập trực tiếp qua index
 • add (cuối): **O(1) amortized**
 • add/remove (giữa): **O(n)** — phải shift elements
 • contains: **O(n)** — linear scan

 *Phù hợp:* Đọc nhiều, thêm cuối nhiều. Cache-friendly.

**LinkedList — Doubly Linked**

Mỗi node: `data + prev + next`. Giữ reference đến head và tail.

 **Big-O:**
 • get(i): **O(n)** — phải traverse từ head
 • add đầu/cuối: **O(1)** — chỉ update pointer
 • add/remove (giữa biết node): **O(1)**
 • add/remove (giữa theo index): **O(n)** để tìm node

 *Phù hợp:* Insert/delete đầu/cuối nhiều. Dùng làm Stack, Deque, Queue.

**Iterator Pattern**

Iterator cung cấp cách duyệt collection mà không expose cấu trúc nội bộ:
 Iterator<String> it = list.iterator(); while (it.hasNext()) { String s = it.next(); if (s.isEmpty()) { it.remove(); // SAFE removal! } } **Fail-fast:** ArrayList/LinkedList throw `ConcurrentModificationException` nếu collection bị modify trong khi duyệt.

**Big-O So sánh**

OpArrayListLinkedList get(i)**O(1)**O(n) add (end)**O(1)*****O(1)** add (mid)O(n)O(n)** remove(i)O(n)O(n)** memoryCompact+overhead/node  ** amortized; ** O(1) nếu đã có node reference*

### 💻 Code — ListOperations.java

```
import java.util.*;

public class ListOperations {

    public static void benchmarkMiddleInsert(int n) {
        List<Integer> arrayList = new ArrayList<>();
        List<Integer> linkedList = new LinkedList<>();
        for (int i = 0; i < n; i++) { arrayList.add(i); linkedList.add(i); }

        long start = System.nanoTime();
        for (int i = 0; i < 1000; i++) arrayList.add(n / 2, 999);
        long alTime = System.nanoTime() - start;

        start = System.nanoTime();
        for (int i = 0; i < 1000; i++) linkedList.add(n / 2, 999);
        long llTime = System.nanoTime() - start;

        System.out.printf("Middle insert x1000 (n=%d):%n  ArrayList:  %,d ns%n  LinkedList: %,d ns%n", n, alTime, llTime);
    }

    // Safe remove using iterator
    public static List<String> removeShortWords(List<String> words, int minLength) {
        List<String> result = new ArrayList<>(words);
        Iterator<String> it = result.iterator();
        while (it.hasNext()) {
            if (it.next().length() < minLength) it.remove();
        }
        return result;
    }

    // Demonstrate ConcurrentModificationException
    public static void showCME() {
        List<String> list = new ArrayList<>(Arrays.asList("a", "bb", "ccc"));
        try {
            for (String s : list) {
                if (s.equals("a")) list.remove(s); // WRONG — causes CME
            }
        } catch (ConcurrentModificationException e) {
            System.out.println("CME caught! Use iterator.remove() or removeIf() instead.");
        }
    }

    // LinkedList as Deque
    public static void dequeDemo() {
        Deque<String> deque = new LinkedList<>();
        deque.addFirst("middle");
        deque.addFirst("first");
        deque.addLast("last");
        System.out.println("Deque: " + deque);
        System.out.println("Poll first: " + deque.pollFirst());
        System.out.println("Poll last:  " + deque.pollLast());
        System.out.println("Remaining:  " + deque);
    }

    public static void main(String[] args) {
        System.out.println("=== Benchmark ===");
        benchmarkMiddleInsert(10_000);

        System.out.println("\n=== Iterator safe remove ===");
        List<String> words = Arrays.asList("hi", "hello", "hey", "world", "ok");
        System.out.println("Remove words shorter than 4: " + removeShortWords(words, 4));

        System.out.println("\n=== CME Demo ===");
        showCME();

        System.out.println("\n=== Deque Demo ===");
        dequeDemo();
    }
}
```

### ✏️ Bài tập thực hành

1. **Mini Dynamic Array:** Implement `DynamicArray<T>` dùng Object[]. Methods: add(T), get(int), remove(int), size(). Tự resize() ×2 khi đầy. Test thêm 20 phần tử và remove một vài cái.
2. **Benchmark:** So sánh ArrayList vs LinkedList cho 3 ops: (a) add 50k elements vào giữa, (b) get random index 10k lần, (c) remove từ đầu 1k lần. In kết quả nanoseconds.
3. **Iterator đúng cách (tránh CME):** Cho `List<Integer>` chứa 1–20. Dùng Iterator để remove tất cả số chẵn. Sau đó demo cách sai (for-each + remove) và observe CME.
4. **LRU Cache:** Implement `LRUCache<K,V>` bằng LinkedHashMap (accessOrder=true), override removeEldestEntry(). Capacity=3, add 5 items, get 1 item, add 1 more. Observe eviction order.

### ❓ Q&A — 7 câu hỏi phỏng vấn

- Dễ ArrayList và LinkedList khác nhau về cấu trúc dữ liệu nội bộ thế nào? ▼

  **ArrayList:** Backed bởi `Object[]`. Elements lưu liên tiếp trong bộ nhớ. Default capacity = 10, grow 1.5x khi full. Random access O(1) vì địa chỉ = base + index × element_size.

   **LinkedList:** Doubly-linked list — mỗi `Node` chứa `item, prev, next`. Không liên tiếp trong memory. Giữ `first` và `last` node. Cũng implement `Deque`.
- Dễ Khi nào nên chọn LinkedList thay vì ArrayList? ▼

  Thực tế: **Rất hiếm** — cache miss penalty của LinkedList thường lớn hơn lợi ích O(1) insert.

   Nên dùng LinkedList khi: cần Queue/Deque semantics (addFirst, pollFirst); rất nhiều insert/delete ở đầu list.

   Rule of thumb: Dùng ArrayList làm default, switch sang LinkedList chỉ sau khi benchmark chứng minh cần.
- Trung ConcurrentModificationException là gì? Tại sao xảy ra và cách tránh? ▼

  CME xảy ra khi modify collection (add/remove) trong khi đang duyệt bằng iterator (kể cả for-each).

   **Cơ chế:** ArrayList dùng `modCount` — mỗi lần add/remove tăng. Iterator lưu `expectedModCount` khi tạo. Mỗi next() check: modCount != expectedModCount → throw CME.

   **Cách tránh:** (1) `iterator.remove()`; (2) `list.removeIf()`; (3) `list.removeAll(toRemove)`; (4) `CopyOnWriteArrayList`.
- Trung Fail-fast vs fail-safe iterator là gì? ▼

  **Fail-fast:** Throw CME ngay khi phát hiện structural modification. ArrayList, LinkedList, HashMap dùng fail-fast.

   **Fail-safe:** Hoạt động trên bản sao của collection. Không throw CME. Ví dụ: `CopyOnWriteArrayList`, `ConcurrentHashMap`.

   Đánh đổi: fail-safe có thể return stale data và tốn thêm memory cho bản sao.
- Khó ArrayList.add() có O(1) không? Giải thích amortized analysis? ▼

  Không hoàn toàn O(1) mọi lúc — nhưng **O(1) amortized**.

   Khi add phần tử thứ n+1 vào capacity n: tạo mảng mới (×1.5), copy n elements → O(n). Nhưng resize chỉ xảy ra log₁.₅(n) lần trong n thao tác.

   Amortized cost: Tổng = O(n) ops + O(n) copy = O(n). Mỗi op amortized = O(1).

   Nếu biết trước size: `new ArrayList<>(expectedSize)` để tránh resize.
- Khó ListIterator vs Iterator khác nhau thế nào? ▼

  **Iterator:** Chỉ duyệt forward, chỉ có hasNext()/next()/remove().

   **ListIterator** (chỉ cho List): Duyệt cả forward và backward. Thêm: hasPrevious()/previous(), nextIndex()/previousIndex(), add(E), set(E).

   Dùng ListIterator khi cần bidirectional traversal hoặc replace elements in-place.
- Mock EN EN: "What would you use to implement browser history (back/forward navigation) in Java?" ▼

  "I would use two `Deque` instances backed by `LinkedList` — one for back history and one for forward. When navigating to a new page, push current page onto the back stack and clear the forward stack. On back: pop from back stack, push current page to forward. On forward: pop from forward stack, push current page to back. LinkedList is ideal here because all operations are O(1) at the ends, with no need for index-based access."

### 🧠 Quiz Nhanh

1. Độ phức tạp của `get(i)` trên ArrayList và LinkedList lần lượt là gì?
   - [x] ArrayList O(1), LinkedList O(n)
   - [ ] ArrayList O(n), LinkedList O(1)
   - [ ] Cả hai đều O(1)
   - [ ] Cả hai đều O(n)
   💡 ArrayList truy cập trực tiếp qua index nên O(1); LinkedList phải traverse từ head nên O(n).

2. Cơ chế nào giúp iterator phát hiện và ném ConcurrentModificationException?
   - [ ] capacity
   - [ ] load factor
   - [x] modCount so với expectedModCount
   - [ ] hashCode của collection
   💡 Mỗi add/remove tăng modCount; iterator lưu expectedModCount, mỗi next() so sánh, nếu khác thì throw CME.

3. Cách nào an toàn để xóa phần tử khi đang duyệt một List?
   - [ ] Dùng for-each rồi gọi list.remove(s)
   - [ ] Dùng for-each rồi gọi list.clear()
   - [x] Dùng iterator.remove() hoặc list.removeIf()
   - [ ] Không thể xóa khi duyệt
   💡 iterator.remove() và removeIf() cập nhật đúng modCount nên không gây CME, khác với việc gọi trực tiếp list.remove() trong for-each.

- **🟢 LeetCode:** #206 Reverse Linked List · #21 Merge Two Sorted Lists — Easy — pointer manipulation — #206: Iterative với prev/curr/next pointers. #21: Compare heads, link smaller node, advance pointer. Cả hai giúp hiểu LinkedList internals sâu hơn lý thuyết.

- **🤖 AI Tool:** Copilot — Benchmark Code — Prompt: *"Write a Java benchmark comparing ArrayList vs LinkedList for: adding 100k elements to middle, random access 100k times, removing from front 10k times. Use System.nanoTime()."*

- **📖 Resource:** Baeldung — ArrayList vs LinkedList — Đọc: **baeldung.com/java-arraylist-linkedlist** — benchmark thực tế. Thêm: **baeldung.com/java-iterator** cho Iterator pattern chi tiết.

## 💪 Ngày 4 · HashMap internals, HashSet, TreeMap, TreeSet

**21/05/2025 — Thứ 5** · **FULL** · 2.5h

### 📚 Lý thuyết — HashMap, HashSet, TreeMap, TreeSet

**HashMap Internals**

Cấu trúc: **Node[] table** (bucket array, default 16 buckets).

 **put(key, value) flow:**
 1. hash(key) → index = hash & (capacity-1)
 2. Nếu bucket empty → insert node
 3. Nếu collision → chain (linked list hoặc tree nếu >8 entries)
 4. Nếu key đã tồn tại → replace value

 **Java 8+:** Bucket dùng TreeNode khi chain >8 → O(log n) worst case.

**Load Factor & Rehashing**

**Load factor** = size / capacity. Default: **0.75**.
 Khi 75% buckets bị dùng, **rehash** xảy ra:
 • Tạo table mới (capacity × 2)
 • Re-insert tất cả entries (O(n))

 **Tại sao 0.75?** Cân bằng giữa:
 • Load thấp → ít collision, tốn nhiều memory
 • Load cao → nhiều collision, chậm hơn

 **Tip:** Biết trước size → `new HashMap<>(expectedSize * 2)`.

**HashSet**

HashSet là **wrapper của HashMap** — element là key, value luôn là `PRESENT` singleton.

 **Big-O:** add, remove, contains: O(1) average.

 **Uniqueness:** Dùng hashCode() + equals() để check duplicate.

 **Không có thứ tự.** Dùng `LinkedHashSet` nếu cần insertion order. Dùng `TreeSet` nếu cần sorted.

**TreeMap & TreeSet — Sorted**

Backed bởi **Red-Black Tree** (self-balancing BST).

 **TreeMap:** Keys luôn sorted (natural order hoặc Comparator).
 **TreeSet:** Sorted unique elements.

 **Big-O:** get, put, remove: **O(log n)**.

 **Khi nào dùng:** Cần key/element theo thứ tự. Range query: firstKey(), lastKey(), headMap(), tailMap(), floorKey(), ceilingKey().

### 💻 Code — MapOperations.java

```
import java.util.*;
import java.util.stream.*;

public class MapOperations {

    // Word frequency counter
    public static Map<String, Integer> wordFrequency(String text) {
        Map<String, Integer> freq = new HashMap<>();
        for (String word : text.toLowerCase().split("\\s+")) {
            freq.merge(word, 1, Integer::sum);
        }
        return freq;
    }

    // Group by first letter
    public static Map<Character, List<String>> groupByFirstLetter(List<String> words) {
        Map<Character, List<String>> groups = new HashMap<>();
        for (String word : words) {
            groups.computeIfAbsent(word.charAt(0), k -> new ArrayList<>()).add(word);
        }
        return groups;
    }

    // Remove duplicates preserving insertion order
    public static <T> List<T> removeDuplicates(List<T> list) {
        return new ArrayList<>(new LinkedHashSet<>(list));
    }

    // Top N most frequent words
    public static List<Map.Entry<String, Integer>> topN(Map<String, Integer> freq, int n) {
        return freq.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(n)
                .collect(Collectors.toList());
    }

    // TreeMap — sorted phone book with range queries
    public static void treeMapDemo() {
        TreeMap<String, String> phoneBook = new TreeMap<>();
        phoneBook.put("Minh", "0901-234-567");
        phoneBook.put("An",   "0912-345-678");
        phoneBook.put("Lan",  "0923-456-789");
        phoneBook.put("Duc",  "0934-567-890");
        phoneBook.put("Binh", "0945-678-901");

        System.out.println("All contacts (sorted): " + phoneBook);
        System.out.println("First: " + phoneBook.firstKey());
        System.out.println("Names A–L: " + phoneBook.subMap("A", "L"));
        System.out.println("Floor of 'D': " + phoneBook.floorKey("D"));
        System.out.println("Ceiling of 'D': " + phoneBook.ceilingKey("D"));
    }

    public static void main(String[] args) {
        String text = "the quick brown fox jumps over the lazy dog the fox";
        Map<String, Integer> freq = wordFrequency(text);
        System.out.println("Word frequencies: " + freq);

        System.out.println("Top 3:");
        topN(freq, 3).forEach(e -> System.out.println("  " + e.getKey() + ": " + e.getValue()));

        List<String> words = Arrays.asList("banana","apple","avocado","cherry","blueberry","apricot");
        System.out.println("\nGrouped by first letter: " + groupByFirstLetter(words));

        List<Integer> nums = Arrays.asList(1, 2, 3, 2, 1, 4, 3, 5);
        System.out.println("De-duplicated (order preserved): " + removeDuplicates(nums));

        System.out.println("\n=== TreeMap Demo ===");
        treeMapDemo();

        // TreeSet
        TreeSet<Integer> scores = new TreeSet<>(Arrays.asList(85, 92, 78, 95, 88, 72));
        System.out.println("\nScores sorted: " + scores);
        System.out.println("Highest: " + scores.last());
        System.out.println("Scores above 85 (exclusive): " + scores.tailSet(85, false));
    }
}
```

### ✏️ Bài tập thực hành

1. **Word frequency counter:** Đọc đoạn văn 50+ words từ String. Đếm tần suất mỗi từ (lowercase, bỏ punctuation). In top 5 từ thường xuyên nhất. Sau đó dùng TreeMap để in frequency map theo thứ tự alphabet.
2. **Remove duplicates với HashSet:** Cho `List<Student>` (Student có id, name). Dùng HashSet để tìm duplicate IDs. Override equals() và hashCode() trong Student dựa trên id. So sánh HashSet vs TreeSet (cần implement Comparable).
3. **Phone book với TreeMap:** Implement `PhoneBook` dùng `TreeMap<String, List<String>>`. Methods: addContact(name, phone), findContact(name), listAll(), findByPrefix(String prefix) dùng subMap().
4. **Top 3 most frequent words:** Từ word frequency map, tìm top 3 mà không dùng Stream — dùng PriorityQueue (min-heap size 3). So sánh approach với Stream version.

### ❓ Q&A — 7 câu hỏi phỏng vấn

- Dễ HashMap get() có độ phức tạp O(1) không? ▼

  **O(1) average case**, không phải tuyệt đối.

   Flow: hash(key) → index → access bucket O(1) → search trong bucket.
   • Không collision: bucket có 1 entry → O(1).
   • Có collision (linked list): O(k) với k = entries trong bucket.
   • Java 8+ treeification khi k > 8 → O(log k) worst.

   O(1) average với hashCode() tốt và load factor hợp lý.
- Dễ Tại sao phải override cả hashCode() và equals() khi dùng làm key trong HashMap? ▼

  **Contract:** Nếu `a.equals(b)` là true thì `a.hashCode() == b.hashCode()` phải đúng.

   • Chỉ override equals(): Hai objects "equal" nhưng khác hashCode → HashMap không tìm đúng bucket → get() trả null.
   • Chỉ override hashCode(): Cùng bucket nhưng equals() dùng object identity → không nhận ra duplicate key.

   IDE tip: Generate cả hai cùng lúc. Dùng `Objects.hash()` và `Objects.equals()`. Java 16+ record tự generate cả hai.
- Trung Hash collision được xử lý thế nào trong HashMap Java 8+? ▼

  **Java 7:** Collision → linked list trong bucket. Worst case O(n).

   **Java 8+:** Hybrid approach:
   • ≤8 entries trong bucket: dùng **linked list**
   • >8 entries AND table capacity ≥64: convert sang **Red-Black Tree** → O(log n)
   • Nếu tree shrinks xuống ≤6: convert lại về linked list

   Tại sao threshold 8? Poisson distribution cho thấy xác suất bucket có 8+ entries là cực thấp với load factor 0.75.
- Trung HashMap vs TreeMap — khi nào dùng cái nào? ▼

  | Tiêu chí | HashMap | TreeMap |
  | --- | --- | --- |
  | Thứ tự | Không đảm bảo | Sorted by key |
  | get/put/remove | O(1) avg | O(log n) |
  | null key | Cho phép 1 null | Không (NPE) |
  | Range queries | Không hỗ trợ | headMap/tailMap/subMap |

  Dùng HashMap khi cần lookup nhanh. Dùng TreeMap khi cần sorted keys hoặc range queries.
- Khó Tại sao HashMap không thread-safe? ConcurrentHashMap giải quyết thế nào? ▼

  HashMap không thread-safe: đồng thời 2 threads resize → race conditions (lost updates, incomplete puts). Java 7 còn có infinite loop do circular reference.

   **ConcurrentHashMap Java 8+:**
   • Dùng **CAS** cho empty bucket inserts
   • **synchronized** chỉ trên bucket head node (không lock toàn bộ map)
   • Nhiều readers + N writers ở khác bucket song song
   • Không cho phép null key/value

   Alternatives: `Collections.synchronizedMap()` (toàn bộ map lock, chậm hơn), `Hashtable` (legacy, tránh dùng).
- Khó Mutable object có an toàn dùng làm HashSet element không? ▼

  **Rất nguy hiểm!**
   1. Add object vào HashSet → tính hashCode → lưu vào bucket
   2. Thay đổi field ảnh hưởng hashCode → hashCode mới khác bucket cũ
   3. `contains(obj)` → tính hashCode mới → sai bucket → return false
   4. Object vẫn trong set nhưng không tìm được (orphaned entry)!

   Best practice: Dùng immutable objects (String, Integer, record) làm key/element. Nếu mutable, đảm bảo fields dùng trong hashCode/equals không thay đổi sau khi add.
- Mock EN EN: "Explain how HashMap works internally, from put() to get()." ▼

  "When you call put(key, value), HashMap computes the hash of the key using hashCode(), applies a mixing function, and uses the result modulo capacity to find the bucket index. If the bucket is empty, it inserts a new Node. If there's a collision, it walks the linked list comparing with equals(). If a match is found, it replaces the value; otherwise it appends a new node. In Java 8+, if a bucket exceeds 8 entries, it converts to a balanced tree for O(log n) lookup. For get(), the same hash and index computation is done, then the bucket is searched with equals(). Average case is O(1), but requires a correct hashCode() and equals() contract."

### 🧠 Quiz Nhanh

1. Load factor mặc định của HashMap là bao nhiêu và điều gì xảy ra khi vượt ngưỡng?
   - [ ] 0.5 — table giữ nguyên capacity
   - [x] 0.75 — rehash, tạo table mới capacity × 2 và re-insert tất cả
   - [ ] 1.0 — chỉ thêm bucket mới
   - [ ] 0.75 — chuyển toàn bộ sang Red-Black Tree
   💡 Default load factor 0.75; khi 75% buckets bị dùng, HashMap rehash bằng cách double capacity và re-insert (O(n)).

2. Trong Java 8+, một bucket của HashMap chuyển từ linked list sang Red-Black Tree khi nào?
   - [ ] Khi bucket có >2 entries
   - [ ] Ngay khi xảy ra collision đầu tiên
   - [x] Khi bucket có >8 entries và table capacity ≥ 64
   - [ ] Khi load factor đạt 0.75
   💡 Java 8+ treeify bucket khi chain >8 entries (và capacity ≥64) để đạt O(log n) worst case thay vì O(n).

3. Tại sao phải override cả hashCode() và equals() khi dùng object làm key trong HashMap?
   - [ ] Để tăng performance của get()
   - [ ] Vì compiler bắt buộc
   - [ ] Để tránh ConcurrentModificationException
   - [x] Vì nếu hai object equals nhưng khác hashCode, HashMap không tìm đúng bucket → get() trả null
   💡 Contract: a.equals(b) true thì a.hashCode() == b.hashCode(); vi phạm khiến key bị "lạc" sang bucket sai.

- **🟢 LeetCode:** #1 Two Sum · #49 Group Anagrams — Easy + Medium — HashMap patterns cổ điển — #1: HashMap lưu complement → O(n). #49: Sort mỗi string làm key, group anagrams → O(n·k·log k). Hai bài xuất hiện trong 90% phỏng vấn Java.

- **🤖 AI Tool:** Copilot — HashMap Optimization — Prompt: *"Optimize this word frequency counter using HashMap with initial capacity to avoid rehashing. Add a method to find top-K frequent words efficiently using a min-heap."*

- **📖 Resource:** Baeldung — HashMap Internals — Đọc: **baeldung.com/java-hashmap** — phần "Collision Handling" và "Java 8 Improvements". Vẽ sơ đồ bucket array + linked list + tree bằng tay để ghi nhớ.

## ⚡ Ngày 5 · Stream API: filter, map, collect, reduce

**22/05/2025 — Thứ 6** · **LIGHT** · 1.5h

### 📚 Lý thuyết — Stream API Basics

**Stream Pipeline**

3 phần:
 **1. Source:** collection.stream(), Arrays.stream(), Stream.of()
 **2. Intermediate (lazy):** filter(), map(), sorted(), distinct(), limit(), skip()
 **3. Terminal (eager):** collect(), count(), reduce(), forEach(), findFirst(), anyMatch()

 list.stream() .filter(x -> x > 0) // intermediate .map(x -> x * 2) // intermediate .collect(toList()); // terminal

**Common Intermediate Ops**

**filter(Predicate):** Giữ elements thỏa điều kiện.
 `.filter(s -> s.startsWith("A"))`

 **map(Function):** Transform mỗi element.
 `.map(String::toUpperCase)`

 **sorted():** Sắp xếp (có thể truyền Comparator).
 **distinct():** Loại duplicate (dùng equals/hashCode).
 **limit(n):** Giữ tối đa n elements.
 **peek(Consumer):** Debug mà không thay đổi stream.

**Common Terminal Ops**

**collect(Collector):** Gom vào collection.
 `.collect(Collectors.toList())`

 **count():** Đếm số elements.
 **reduce(identity, BinaryOp):** Gộp thành 1 giá trị.
 `.reduce(0, Integer::sum)`

 **forEach(Consumer):** Thực thi action (no return).
 **findFirst():** Trả về `Optional<T>`.
 **anyMatch/allMatch/noneMatch:** Trả về boolean.

**Lazy Evaluation**

Intermediate ops không thực thi cho đến khi terminal op được gọi. Cho phép **short-circuit**:

 list.stream() .filter(x -> expensive(x)) .findFirst(); // dừng khi tìm thấy 1 **Stream không thể reuse:** Sau khi terminal op chạy, stream đã "consumed". Gọi lại → `IllegalStateException`.

### 💻 Code — StreamBasics.java

```
import java.util.*;
import java.util.stream.*;

public class StreamBasics {

    record Student(String name, double gpa, int age, String major) {}

    public static void main(String[] args) {
        List<Student> students = List.of(
            new Student("An",   3.8, 20, "CS"),
            new Student("Binh", 2.5, 22, "Math"),
            new Student("Chau", 3.5, 19, "CS"),
            new Student("Duc",  3.2, 21, "Physics"),
            new Student("Em",   3.9, 20, "CS"),
            new Student("Fong", 2.8, 23, "Math")
        );

        // filter + sorted + map + collect
        List<String> highAchieverNames = students.stream()
                .filter(s -> s.gpa() >= 3.5)
                .sorted(Comparator.comparingDouble(Student::gpa).reversed())
                .map(Student::name)
                .collect(Collectors.toList());
        System.out.println("High achievers (GPA ≥ 3.5): " + highAchieverNames);

        // count
        long csCount = students.stream()
                .filter(s -> "CS".equals(s.major()))
                .count();
        System.out.println("CS students: " + csCount);

        // mapToDouble + reduce for average GPA
        double totalGPA = students.stream()
                .mapToDouble(Student::gpa)
                .reduce(0.0, Double::sum);
        System.out.printf("Average GPA: %.2f%n", totalGPA / students.size());

        // findFirst + Optional
        Optional<Student> firstCS = students.stream()
                .filter(s -> "CS".equals(s.major()))
                .findFirst();
        firstCS.ifPresent(s -> System.out.println("First CS student: " + s.name()));

        // anyMatch / allMatch / noneMatch
        boolean anyFailing = students.stream().anyMatch(s -> s.gpa() < 2.0);
        boolean allAdults  = students.stream().allMatch(s -> s.age() >= 18);
        System.out.println("Any failing (GPA < 2.0): " + anyFailing);
        System.out.println("All adults: " + allAdults);

        // Method reference: String::toUpperCase
        List<String> names = List.of("alice", "bob", "charlie");
        List<String> upper = names.stream()
                .map(String::toUpperCase)
                .sorted()
                .collect(Collectors.toList());
        System.out.println("Uppercase sorted: " + upper);

        // IntSummaryStatistics
        IntSummaryStatistics ageStats = students.stream()
                .mapToInt(Student::age)
                .summaryStatistics();
        System.out.printf("Age — min:%d max:%d avg:%.1f%n",
                ageStats.getMin(), ageStats.getMax(), ageStats.getAverage());
    }
}
```

### ✏️ Bài tập thực hành

1. **Filter & sum với Stream:** Cho `List<Integer>` chứa 1–20. Dùng Stream: (a) lọc số chẵn và tính tổng bằng reduce, (b) lọc số nguyên tố và collect thành list, (c) tìm số lớn nhất bằng max(). So sánh với vòng lặp thông thường.
2. **List<String> transformations:** Cho list tên sản phẩm. Dùng Stream: convert sang uppercase và sort, lọc tên có độ dài > 5, join thành 1 String ngăn cách bởi ", ". Tất cả trong một pipeline nếu có thể.
3. **findFirst() với Optional:** Cho `List<Person>` (name, age). Tìm người đầu tiên trên 18 tuổi. Xử lý Optional 3 cách: ifPresent(), orElse(), orElseThrow(). Viết hàm trả về tên hoặc "Unknown" nếu không tìm thấy.

### ❓ Q&A — 5 câu hỏi phỏng vấn

- Dễ Stream API khác gì so với vòng lặp for thông thường? ▼

  **For loop (imperative):** Nói "làm thế nào" — bạn viết từng bước, quản lý index, mutable state.

   **Stream (declarative):** Nói "muốn gì" — filter, map, collect. JVM tự tối ưu.

   Ưu điểm Stream: Code ngắn gọn, lazy evaluation, dễ parallelism (thay .stream() bằng .parallelStream()), composable.
   Ưu điểm for loop: Debug dễ hơn, performance tốt hơn cho simple iterations, không có Stream overhead.
- Dễ Intermediate operation và Terminal operation trong Stream là gì? ▼

  **Intermediate (lazy):** Trả về Stream, không thực thi ngay. Ví dụ: filter(), map(), sorted(), distinct(), limit(), flatMap().

   **Terminal (eager):** Tiêu thụ stream, trả về non-Stream. Kích hoạt toàn bộ pipeline. Ví dụ: collect(), count(), reduce(), forEach(), findFirst(), anyMatch().

   Tại sao lazy? Cho phép optimization: findFirst() chỉ cần process đủ elements để tìm thấy cái đầu tiên.
- Trung Tại sao Stream không thể reuse sau khi terminal op đã chạy? ▼

  Stream là "single-use pipeline" — không lưu data, chỉ là processing pipeline trên data source. Sau terminal op, stream ở trạng thái "consumed".

   Gọi lại bất kỳ op nào → `IllegalStateException: stream has already been operated upon or closed`.

   Giải pháp: Tạo stream mới từ collection: `list.stream()`. Hoặc dùng `Supplier<Stream<T>> s = list::stream` để tạo nhiều lần.
- Trung Method reference là gì? 4 loại method reference trong Java? ▼

  Method reference là cú pháp ngắn gọn cho lambda khi lambda chỉ gọi một method:

   1. **Static:** `Integer::parseInt` thay cho `s -> Integer.parseInt(s)`
   2. **Instance (object cụ thể):** `myObj::myMethod` thay cho `x -> myObj.myMethod(x)`
   3. **Instance (arbitrary object of type):** `String::toUpperCase` thay cho `s -> s.toUpperCase()`
   4. **Constructor:** `ArrayList::new` thay cho `() -> new ArrayList<>()`
- Khó reduce() hoạt động thế nào? Identity value là gì? ▼

  `reduce(identity, accumulator)` gộp tất cả elements bằng BinaryOperator, bắt đầu từ identity.

  ```
  int sum  = list.stream().reduce(0, Integer::sum);
  int prod = list.stream().reduce(1, (a,b) -> a*b);
  ```

  **Identity value:** Giá trị khi combine với bất kỳ element nào vẫn cho ra element đó. Sum → 0. Product → 1. Concat → "".

   Nếu stream empty: `reduce(identity, op)` trả về identity. `reduce(op)` không có identity trả về `Optional`.

### 🧠 Quiz Nhanh

1. Operation nào sau đây là terminal operation trong Stream pipeline?
   - [ ] filter()
   - [ ] map()
   - [x] collect()
   - [ ] sorted()
   💡 collect() là terminal (eager) — kích hoạt toàn bộ pipeline; filter/map/sorted là intermediate (lazy).

2. Điều gì xảy ra khi gọi lại một operation trên Stream đã chạy terminal op?
   - [x] Ném IllegalStateException vì stream đã consumed
   - [ ] Trả về kết quả cũ được cache
   - [ ] Tự động tạo stream mới
   - [ ] Trả về Optional.empty()
   💡 Stream là single-use pipeline; sau terminal op, gọi lại bất kỳ op nào → IllegalStateException: stream has already been operated upon or closed.

3. Với `reduce(identity, accumulator)`, identity value cho phép tính tổng (sum) nên là bao nhiêu?
   - [ ] 1
   - [ ] null
   - [x] 0
   - [ ] Integer.MAX_VALUE
   💡 Identity là giá trị mà combine với bất kỳ element nào vẫn ra chính element đó: sum → 0, product → 1, concat → "".

- **🟢 LeetCode:** #1672 Richest Customer Wealth — Easy — Arrays + Stream practice — `Arrays.stream(accounts).mapToInt(row -> Arrays.stream(row).sum()).max().getAsInt()` — 1 dòng Stream solution. Luyện mapToInt và nested streams.

- **🤖 AI Tool:** Copilot — Convert Loops to Streams — Paste một đoạn code có 3-4 for loops, prompt: *"Convert these imperative loops to Java Stream API, using method references where possible."* So sánh readability và đo performance.

- **📖 Resource:** Baeldung — Java 8 Streams — Đọc: **baeldung.com/java-8-streams** — phần "Lazy Invocation" và "Short-circuiting". Bookmark "Stream vs Collection" để ôn khi phỏng vấn.

## 🔥 Ngày 6 · Stream Advanced: Collectors, flatMap, groupingBy + Thread-safe Collections

**23/05/2025 — Thứ 7** · **WEEKEND** · 4h

### 📚 Lý thuyết — Advanced Streams + Thread-safe Collections

**Collectors**

**toList() / toSet():** Gom vào List/Set.
 **toMap(keyFn, valueFn):** Gom vào Map.
 **groupingBy(classifier):** Group elements thành `Map<K, List<T>>`.
 **groupingBy(classifier, downstream):** Group với downstream collector.
 **counting():** Đếm trong mỗi group.
 **joining(delimiter):** Nối strings.
 **summarizingInt/toMap:** Statistics.

 students.stream().collect( Collectors.groupingBy(Student::major, Collectors.counting()) );

**flatMap — Flatten Nested**

`map()` → `Stream<Stream<T>>` (nested)
 `flatMap()` → `Stream<T>` (flattened)

 List<List<Integer>> nested = ...; List<Integer> flat = nested.stream() .flatMap(Collection::stream) .collect(toList()); // Words from sentences: List<String> words = sentences.stream() .flatMap(s -> Arrays.stream(s.split(" "))) .collect(toList());

**Parallel Streams**

`list.parallelStream()` hoặc `stream.parallel()` — dùng **ForkJoinPool.commonPool()** để chia nhỏ và xử lý song song.

 **Khi nào nên dùng:**
 • Tập dữ liệu lớn (100k+)
 • Mỗi element xử lý tốn thời gian
 • Stateless, independent operations

 **Khi nào KHÔNG nên:**
 • List nhỏ (overhead > benefit)
 • Operations có side effects
 • Ordered operations (findFirst có thể chậm hơn)

**Thread-safe Collections**

**ConcurrentHashMap:** Segment-level lock, O(1) avg. Không cho null key/value. Best choice cho concurrent map.

 **CopyOnWriteArrayList:** Mỗi write tạo bản sao mới. Reads lock-free, writes expensive. Phù hợp read-heavy, write-rare (event listeners).

 **Collections.synchronizedList(list):** Wrapper toàn bộ map lock. Iteration vẫn cần synchronized block thủ công.

 **BlockingQueue:** LinkedBlockingQueue, ArrayBlockingQueue — producer-consumer pattern.

### 💻 Code — StreamAdvanced.java + ThreadSafeDemo.java

```
// ===== StreamAdvanced.java =====
import java.util.*;
import java.util.stream.*;

public class StreamAdvanced {

    record Student(String name, double gpa, String major, String faculty) {}

    public static void main(String[] args) {
        List<Student> students = List.of(
            new Student("An",    3.8, "CS",      "Engineering"),
            new Student("Binh",  2.5, "Math",    "Science"),
            new Student("Chau",  3.5, "CS",      "Engineering"),
            new Student("Duc",   3.2, "Physics", "Science"),
            new Student("Em",    3.9, "CS",      "Engineering"),
            new Student("Fong",  2.8, "Math",    "Science"),
            new Student("Giang", 3.6, "CS",      "Engineering"),
            new Student("Hai",   3.1, "Physics", "Science")
        );

        // groupingBy major + counting
        Map<String, Long> countByMajor = students.stream()
                .collect(Collectors.groupingBy(Student::major, Collectors.counting()));
        System.out.println("Count by major: " + countByMajor);

        // groupingBy faculty → list of names
        Map<String, List<String>> namesByFaculty = students.stream()
                .collect(Collectors.groupingBy(
                        Student::faculty,
                        Collectors.mapping(Student::name, Collectors.toList())
                ));
        System.out.println("Names by faculty: " + namesByFaculty);

        // groupingBy major → average GPA
        Map<String, Double> avgGpaByMajor = students.stream()
                .collect(Collectors.groupingBy(Student::major,
                        Collectors.averagingDouble(Student::gpa)));
        System.out.println("Avg GPA by major: " + avgGpaByMajor);

        // Collectors.joining
        String nameList = students.stream()
                .filter(s -> s.gpa() >= 3.5)
                .map(Student::name)
                .collect(Collectors.joining(", ", "[", "]"));
        System.out.println("Top students: " + nameList);

        // flatMap — flatten list of lists
        List<List<Integer>> nested = List.of(
                List.of(1, 2, 3),
                List.of(4, 5),
                List.of(6, 7, 8, 9)
        );
        List<Integer> flat = nested.stream()
                .flatMap(Collection::stream)
                .sorted()
                .collect(Collectors.toList());
        System.out.println("Flattened: " + flat);

        // flatMap — extract all words from sentences
        List<String> sentences = List.of("hello world", "java stream api", "flat map example");
        List<String> uniqueWords = sentences.stream()
                .flatMap(s -> Arrays.stream(s.split(" ")))
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        System.out.println("Unique words: " + uniqueWords);

        // Parallel stream — sum of 1 to 1_000_000
        long sum = LongStream.rangeClosed(1, 1_000_000)
                .parallel()
                .sum();
        System.out.println("Sum 1..1M (parallel): " + sum);
    }
}

// ===== ThreadSafeDemo.java =====
import java.util.*;
import java.util.concurrent.*;

public class ThreadSafeDemo {

    public static void main(String[] args) throws InterruptedException {
        // ConcurrentHashMap — safe for concurrent reads and writes
        ConcurrentHashMap<String, Integer> concurrentMap = new ConcurrentHashMap<>();

        // 10 threads each increment 1000 times
        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            threads.add(new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    concurrentMap.merge("counter", 1, Integer::sum);
                }
            }));
        }
        threads.forEach(Thread::start);
        for (Thread t : threads) t.join();
        System.out.println("ConcurrentHashMap counter: " + concurrentMap.get("counter")); // Always 10000

        // CopyOnWriteArrayList — safe iteration while writing
        CopyOnWriteArrayList<String> cowList = new CopyOnWriteArrayList<>();
        cowList.add("initial");
        Thread reader = new Thread(() -> {
            for (String s : cowList) { // snapshot iteration — no CME
                System.out.print(s + " ");
            }
        });
        Thread writer = new Thread(() -> cowList.add("added-concurrently"));
        reader.start(); writer.start();
        reader.join(); writer.join();
        System.out.println("\nCOW list: " + cowList);
    }
}
```

### ✏️ Bài tập thực hành

1. **Group students by grade level:** Cho List<Student> (name, gpa). Dùng `groupingBy` để group thành: "Xuất sắc" (GPA ≥ 3.6), "Giỏi" (3.2–3.6), "Khá" (2.5–3.2), "Trung bình" (dưới 2.5). Đếm số sinh viên mỗi nhóm bằng `Collectors.counting()`.
2. **Flatten với flatMap:** Cho `List<Order>`, mỗi Order có `List<Item>`. Dùng flatMap để lấy tất cả Item từ mọi Order. Tính tổng giá trị tất cả items. Tìm item đắt nhất.
3. **Collectors.joining:** Cho List<String> tên sinh viên. Tạo: (a) String phân cách bằng ", ", (b) String dạng "[name1, name2, ...]", (c) HTML list "<li>name</li>" dùng joining với prefix/suffix.
4. **ConcurrentHashMap vs HashMap:** Tạo 20 threads, mỗi thread thêm 500 entries vào HashMap và ConcurrentHashMap song song. So sánh final size. HashMap thường cho kết quả sai (lost updates). Giải thích.

### ❓ Q&A — 8 câu hỏi phỏng vấn

- Dễ groupingBy() trả về loại Map nào? ▼

  `Collectors.groupingBy(classifier)` trả về `Map<K, List<T>>` — mặc định dùng HashMap, value là ArrayList.

   Với downstream collector: `groupingBy(classifier, Collectors.counting())` → `Map<K, Long>`.

   Có thể chỉ định Map type: `groupingBy(classifier, TreeMap::new, toList())` → `TreeMap<K, List<T>>` (sorted keys).

   Tương tự: `partitioningBy(Predicate)` → `Map<Boolean, List<T>>` (2 nhóm: true/false).
- Dễ flatMap khác map thế nào? Cho ví dụ? ▼

  **map(f):** Mỗi element T → 1 element R → `Stream<R>`.
   **flatMap(f):** Mỗi element T → Stream<R> → flatten tất cả → `Stream<R>`.

   Ví dụ: Nếu mỗi người có List<String> phone numbers:

  ```
  // map: Stream<List<String>> — nested
  people.stream().map(Person::getPhones)

  // flatMap: Stream<String> — flat
  people.stream().flatMap(p -> p.getPhones().stream())
  ```

  Dùng flatMap khi mapper function trả về Collection/Stream và bạn muốn một stream phẳng.
- Trung Collectors.toMap() khi nào bị exception? Cách fix? ▼

  `Collectors.toMap(keyMapper, valueMapper)` throw `IllegalStateException: Duplicate key` khi 2 elements có cùng key.

   **Fix 1:** Truyền merge function:

  ```
  Collectors.toMap(
    Student::getId,
    Student::getName,
    (existing, newVal) -> existing // giữ cái cũ
  )
  ```

  **Fix 2:** Dùng `groupingBy` nếu muốn giữ tất cả duplicates.
   **Lưu ý thêm:** toMap() không cho phép null value — sẽ throw NPE. Dùng `toUnmodifiableMap()` cho immutable map.
- Trung Khi nào nên dùng parallelStream()? Khi nào không nên? ▼

  **Nên dùng khi:** Tập dữ liệu lớn (100k+ elements), mỗi element xử lý nặng (CPU-bound), stateless và independent operations, ArrayList (splittable tốt).

   **Không nên dùng khi:** List nhỏ (thread overhead > benefit), operations có shared mutable state, I/O-bound operations, cần ordering (findFirst với parallel chậm hơn findAny), LinkedList (splittable kém).

   Parallel stream dùng `ForkJoinPool.commonPool()` — shared với toàn bộ JVM. Nếu pool bị saturate bởi parallel stream của bạn, code khác bị ảnh hưởng. Benchmark trước khi dùng.
- Khó ConcurrentHashMap vs Collections.synchronizedMap() — khác nhau thế nào? ▼

  | Tiêu chí | ConcurrentHashMap | synchronizedMap |
  | --- | --- | --- |
  | Locking | Bucket-level (fine) | Whole map (coarse) |
  | Throughput | High concurrency | One thread at a time |
  | Null key/val | Không cho phép | Cho phép (tùy map) |
  | Iteration | Weakly consistent | Phải sync thủ công |
  | Atomic ops | computeIfAbsent, merge | Không có sẵn |

  Kết luận: Luôn ưu tiên ConcurrentHashMap. synchronizedMap chỉ dùng khi cần wrap một map existing.
- Khó CopyOnWriteArrayList hoạt động thế nào? Trade-off của nó? ▼

  **Cơ chế:** Mỗi write operation (add, set, remove) tạo một bản sao mới của underlying array. Readers luôn thấy snapshot tại thời điểm họ bắt đầu iterate — không bao giờ thấy half-written state. Không có CME.

   **Trade-offs:**
   • Reads: O(1), lock-free, rất nhanh
   • Writes: O(n) — copy toàn bộ array → tốn memory và CPU
   • Iteration: Có thể stale (không reflect writes xảy ra sau khi bắt đầu iterate)

   **Use case lý tưởng:** Danh sách event listeners, observer patterns — ít thay đổi nhưng rất nhiều reads và iterates.
- Mock EN EN: "How would you group a list of orders by customer and calculate total value per customer?" ▼

  "I would use `Collectors.groupingBy` with a downstream `Collectors.summingDouble`:

  ```
  Map<String, Double> totalByCustomer = orders.stream()
    .collect(Collectors.groupingBy(
      Order::getCustomerId,
      Collectors.summingDouble(Order::getValue)
    ));
  ```

  This gives a Map where keys are customer IDs and values are total order amounts. If I also need the top customer, I'd chain a max() on the entry set, or use toMap with a merge function."
- Mock EN EN: "What is the difference between thread-safe and concurrent? Give examples." ▼

  "Thread-safe means an object can be safely used from multiple threads without data corruption. Concurrent typically implies a higher level of parallelism — multiple operations can proceed simultaneously without blocking each other.

   For example, `synchronizedMap` is thread-safe but not concurrent — only one thread can access it at a time. `ConcurrentHashMap` is both — multiple threads can read and write to different buckets simultaneously, improving throughput significantly under high concurrency. In practice, I always prefer ConcurrentHashMap when multiple threads need to access a shared map."

### 🧠 Quiz Nhanh

1. `Collectors.groupingBy(classifier)` (không có downstream) trả về Map loại gì?
   - [x] Map<K, List<T>>
   - [ ] Map<K, Long>
   - [ ] Map<Boolean, List<T>>
   - [ ] Map<K, T>
   💡 groupingBy không downstream trả về Map<K, List<T>> (mặc định HashMap, value ArrayList); thêm Collectors.counting() mới ra Map<K, Long>.

2. Khác biệt cốt lõi giữa map() và flatMap() là gì?
   - [ ] map() lazy còn flatMap() eager
   - [ ] flatMap() chỉ dùng cho số, map() dùng cho String
   - [x] flatMap() flatten Stream<Stream<R>> thành Stream<R>, còn map() giữ nguyên cấu trúc lồng nhau
   - [ ] map() có thể đổi type, flatMap() thì không
   💡 map(f) cho mỗi element → 1 element; flatMap(f) cho mỗi element → một Stream rồi flatten tất cả thành 1 stream phẳng.

3. Đặc điểm nào đúng về CopyOnWriteArrayList?
   - [ ] Write nhanh O(1), read chậm
   - [ ] Không cho phép null element
   - [x] Mỗi write tạo bản sao mới của array; read lock-free, phù hợp read-heavy write-rare
   - [ ] Dùng bucket-level lock như ConcurrentHashMap
   💡 CopyOnWriteArrayList copy toàn bộ array mỗi lần write (O(n)) nhưng read lock-free và iterate trên snapshot — lý tưởng cho event listeners.

- **🟡 LeetCode:** #347 Top K Frequent Elements · #128 Longest Consecutive Sequence — Medium — HashMap + Stream — #347: Dùng HashMap frequency + min-heap size K, hoặc bucket sort. #128: HashSet để O(1) lookup, chỉ bắt đầu count từ sequence start. Cả hai luyện HashMap mastery.

- **🤖 AI Tool:** Copilot — groupingBy Examples — Prompt: *"Generate 5 different Java Stream groupingBy examples: by string length, by enum value, with counting, with averagingDouble, and with TreeMap as map supplier."* Học từ variety.

- **📖 Resource:** Baeldung — Java Collectors — Đọc: **baeldung.com/java-8-collectors** — tất cả các Collectors ít biết: teeing(), filtering(), flatMapping(). Đọc thêm: **baeldung.com/java-concurrent-hashmap**.

## 🎯 Ngày 7 · Spaced Review + Mini Project: Student Grade Manager

**24/05/2025 — CN** · **REVIEW** · 4h

### 📚 Review — Compact Summary: Exception / Collections / Streams

**Exception — Quick Review**

**Hierarchy:** Throwable → Error / Exception → RuntimeException
 **Checked:** Phải xử lý (IOException, SQLException)
 **Unchecked:** Optional (NPE, IllegalArgument)
 **try-with-resources:** AutoCloseable, suppressed exceptions
 **Multi-catch:** `catch (A | B e)` — không có inheritance
 **Chaining:** `new AppException("msg", cause)`
 **Anti-patterns:** Swallowing, catching too broad, lost cause

**Collections — Quick Review**

**ArrayList:** O(1) get, O(1)* add end, O(n) insert mid
 **LinkedList:** O(n) get, O(1) add head/tail, Deque
 **HashMap:** O(1) avg, bucket array, hashCode+equals, 0.75 LF
 **TreeMap:** O(log n), Red-Black Tree, sorted, range queries
 **HashSet:** HashMap wrapper, uniqueness via hashCode+equals
 **Concurrent:** ConcurrentHashMap, CopyOnWriteArrayList
 **Iterator:** fail-fast (modCount), iterator.remove() safe

**Streams — Quick Review**

**Pipeline:** source → intermediate (lazy) → terminal (eager)
 **Key ops:** filter, map, flatMap, sorted, distinct, limit
 **Terminal:** collect, count, reduce, findFirst, anyMatch
 **Collectors:** toList, toMap, groupingBy, joining, counting
 **Lazy:** short-circuit optimization
 **Single-use:** Cannot reuse after terminal op
 **Parallel:** parallelStream(), ForkJoinPool, use wisely

**Mini Project Overview**

**StudentGradeManager:**
 • Student record: id, name, gpa, faculty
 • Add/remove students
 • Sort by GPA (Comparator)
 • Filter by passing grade (≥ 2.0)
 • Group by faculty (groupingBy)
 • Average GPA per faculty (averagingDouble)
 • Top 3 students (sorted + limit)
 • Print formatted report
 • Push to GitHub với README

### 💻 Code — StudentGradeManager.java (Mini Project)

```
import java.util.*;
import java.util.stream.*;

public class StudentGradeManager {

    record Student(String id, String name, double gpa, String faculty) {
        boolean isPassing() { return gpa >= 2.0; }
        String gradeLevel() {
            if (gpa >= 3.6) return "Xuất sắc";
            if (gpa >= 3.2) return "Giỏi";
            if (gpa >= 2.5) return "Khá";
            if (gpa >= 2.0) return "Trung bình";
            return "Yếu";
        }
    }

    private final List<Student> students = new ArrayList<>();

    public void addStudent(Student s) {
        Objects.requireNonNull(s, "Student cannot be null");
        if (students.stream().anyMatch(existing -> existing.id().equals(s.id()))) {
            throw new IllegalArgumentException("Student with ID " + s.id() + " already exists");
        }
        students.add(s);
    }

    public boolean removeStudent(String id) {
        return students.removeIf(s -> s.id().equals(id));
    }

    public List<Student> getAllSortedByGPA() {
        return students.stream()
                .sorted(Comparator.comparingDouble(Student::gpa).reversed())
                .collect(Collectors.toList());
    }

    public List<Student> getPassingStudents() {
        return students.stream()
                .filter(Student::isPassing)
                .collect(Collectors.toList());
    }

    public Map<String, List<Student>> groupByFaculty() {
        return students.stream()
                .collect(Collectors.groupingBy(Student::faculty));
    }

    public Map<String, Double> averageGPAByFaculty() {
        return students.stream()
                .collect(Collectors.groupingBy(Student::faculty,
                        Collectors.averagingDouble(Student::gpa)));
    }

    public Map<String, Long> countByGradeLevel() {
        return students.stream()
                .collect(Collectors.groupingBy(Student::gradeLevel, Collectors.counting()));
    }

    public List<Student> getTopN(int n) {
        return students.stream()
                .sorted(Comparator.comparingDouble(Student::gpa).reversed())
                .limit(n)
                .collect(Collectors.toList());
    }

    public void printReport() {
        System.out.println("=".repeat(60));
        System.out.println("         STUDENT GRADE MANAGER — REPORT");
        System.out.println("=".repeat(60));
        System.out.printf("Total students: %d | Passing: %d%n",
                students.size(), getPassingStudents().size());
        System.out.printf("Overall average GPA: %.2f%n",
                students.stream().mapToDouble(Student::gpa).average().orElse(0));

        System.out.println("\n📊 GPA Distribution:");
        countByGradeLevel().entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(e -> System.out.printf("  %-12s : %d students%n", e.getKey(), e.getValue()));

        System.out.println("\n🏫 Average GPA by Faculty:");
        averageGPAByFaculty().entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .forEach(e -> System.out.printf("  %-15s : %.2f%n", e.getKey(), e.getValue()));

        System.out.println("\n🏆 Top 3 Students:");
        getTopN(3).forEach(s -> System.out.printf(
                "  [%s] %-12s | GPA: %.1f | %s | %s%n",
                s.id(), s.name(), s.gpa(), s.faculty(), s.gradeLevel()));

        System.out.println("\n⚠️  Failing Students:");
        students.stream()
                .filter(s -> !s.isPassing())
                .forEach(s -> System.out.printf("  [%s] %s — GPA %.1f%n", s.id(), s.name(), s.gpa()));

        System.out.println("=".repeat(60));
    }

    public static void main(String[] args) {
        StudentGradeManager mgr = new StudentGradeManager();

        // Add students
        mgr.addStudent(new Student("S001", "Nguyen An",     3.8, "Engineering"));
        mgr.addStudent(new Student("S002", "Tran Binh",     2.5, "Science"));
        mgr.addStudent(new Student("S003", "Le Chau",       3.5, "Engineering"));
        mgr.addStudent(new Student("S004", "Pham Duc",      1.8, "Business"));
        mgr.addStudent(new Student("S005", "Hoang Em",      3.9, "Engineering"));
        mgr.addStudent(new Student("S006", "Vu Fong",       2.8, "Science"));
        mgr.addStudent(new Student("S007", "Do Giang",      3.6, "Business"));
        mgr.addStudent(new Student("S008", "Bui Hai",       3.1, "Science"));
        mgr.addStudent(new Student("S009", "Ly Iris",       2.2, "Business"));
        mgr.addStudent(new Student("S010", "Ngo Jade",      3.3, "Engineering"));

        // Remove one
        mgr.removeStudent("S004");

        // Print full report
        mgr.printReport();

        // Test: custom exception on duplicate
        try {
            mgr.addStudent(new Student("S001", "Duplicate", 3.0, "X"));
        } catch (IllegalArgumentException e) {
            System.out.println("\n✓ Caught duplicate: " + e.getMessage());
        }
    }
}
```

### ✏️ Bài tập thực hành

1. **Complete StudentGradeManager:** Thêm các methods: `findById(String id)` trả về Optional<Student>, `updateGPA(String id, double newGPA)` throw StudentNotFoundException nếu không tìm thấy, `getStatsByFaculty(String faculty)` trả về DoubleSummaryStatistics. Test đầy đủ.
2. **Manual JUnit-style assertions:** Viết class `GradeManagerTest` với 5 test methods thủ công (không dùng JUnit): testAddStudent_success(), testAddStudent_duplicate_throws(), testRemoveStudent(), testGetPassingStudents(), testGroupByFaculty(). Mỗi method dùng assert bằng if + throw AssertionError.
3. **Push to GitHub:** Init git repo, commit StudentGradeManager.java và test file. Viết README.md mô tả: project overview, features (dùng bullet list), how to run, ví dụ output. Push lên GitHub.

### ❓ Q&A — 10 câu hỏi tổng hợp cả tuần

- Dễ finally block có chạy khi có return trong try không? ▼

  Có — finally LUÔN chạy, kể cả khi có return trong try hoặc catch. Ngoại lệ duy nhất: System.exit() hoặc JVM crash. Thứ tự: try body → catch (nếu exception) → finally → sau đó mới return. Nếu finally cũng có return, nó ghi đè return của try — anti-pattern nguy hiểm.
- Dễ ArrayList.get(i) có độ phức tạp O(?) ? ▼

  **O(1)** — ArrayList backed bởi Object[]. get(i) truy cập trực tiếp qua index: địa chỉ = base_address + i × element_size. Không cần traverse. Khác với LinkedList.get(i) = O(n) phải traverse từ head.
- Dễ Stream.filter() và Stream.map() return gì? ▼

  Cả hai đều trả về **Stream** — đây là intermediate operations. filter() giữ lại elements thỏa Predicate, trả về Stream<T> cùng type. map() transform mỗi element qua Function, có thể thay đổi type: map(Function<T, R>) → Stream<R>. Cả hai đều lazy — không thực thi cho đến khi có terminal op.
- Trung HashMap và Hashtable khác nhau thế nào? ▼

  **HashMap** (Java 2): Không synchronized, cho phép 1 null key và null values, hiệu năng cao hơn.

   **Hashtable** (Java 1): Synchronized toàn bộ (mọi method), không cho phép null key/value, legacy class.

   **Không nên dùng Hashtable** trong code mới. Nếu cần thread-safety: dùng `ConcurrentHashMap` (hiệu năng tốt hơn nhiều). Hashtable tồn tại chỉ để backward compatibility.
- Trung Optional là gì? Tại sao tốt hơn return null? ▼

  `Optional<T>` là wrapper có thể chứa giá trị hoặc không (empty). Giải quyết vấn đề null:

   • Return null → caller có thể quên check → NPE
   • Return Optional → caller PHẢI xử lý empty case rõ ràng

   Các method: `isPresent()`, `get()`, `ifPresent(Consumer)`, `orElse(default)`, `orElseGet(Supplier)`, `orElseThrow()`, `map(Function)`, `filter(Predicate)`.

   Best practice: Dùng Optional làm return type của method, KHÔNG dùng làm field hay parameter type.
- Trung Custom Exception nên extend RuntimeException hay Exception? ▼

  Modern Java: Hầu hết prefer **extend RuntimeException (unchecked)**:
   • Không bắt buộc caller phải try-catch hoặc khai báo throws
   • Tránh checked exception pollution qua nhiều layers
   • Spring và nhiều framework chỉ rollback transaction với unchecked

   Dùng **extend Exception (checked)** khi: library/framework API mà caller cần biết có thể fail và phải handle, lỗi có thể phục hồi.

   Rule: Business/domain exceptions → RuntimeException. Infrastructure/config exceptions có thể là checked.
- Khó Giải thích Comparator.comparing() và thenComparing() chain? ▼

  `Comparator.comparing(keyExtractor)` tạo Comparator so sánh theo một field:

  ```
  // Sort by GPA desc, then by name asc
  Comparator<Student> comp = Comparator
      .comparingDouble(Student::gpa).reversed()
      .thenComparing(Student::name);

  students.sort(comp);
  // Hoặc trong Stream:
  students.stream().sorted(comp).collect(toList());
  ```

  `thenComparing()` là tie-breaker — chỉ dùng khi primary key bằng nhau. Có thể chain nhiều cấp. Immutable — mỗi method trả về Comparator mới.
- Khó Collectors.teeing() là gì và khi nào dùng? ▼

  `Collectors.teeing(c1, c2, merger)` (Java 12+) — thu thập stream vào 2 collectors đồng thời, sau đó merge kết quả:

  ```
  // Tính cả min và max trong 1 pass
  Map.Entry<Optional<Student>, Optional<Student>> minMax =
    students.stream().collect(
      Collectors.teeing(
        Collectors.minBy(Comparator.comparingDouble(Student::gpa)),
        Collectors.maxBy(Comparator.comparingDouble(Student::gpa)),
        Map::entry
      ));
  ```

  Hữu ích khi cần 2 kết quả khác nhau mà không muốn iterate 2 lần. Trước Java 12 phải dùng 2 stream riêng hoặc custom Collector.
- Mock EN EN: "Walk me through the StudentGradeManager design. What patterns did you use?" ▼

  "StudentGradeManager is a simple domain service that manages a collection of Student records. I used Java records for the Student type — they provide immutability, auto-generated equals/hashCode, and compact syntax. The manager class encapsulates an ArrayList for ordered storage.

   For querying, I leveraged the Stream API throughout: filter for passing students, sorted with a Comparator for GPA ranking, groupingBy with a downstream averagingDouble for faculty statistics, and limit for top-N queries. For error handling, I used IllegalArgumentException for duplicate IDs and threw custom StudentNotFoundException from update methods.

   The design follows single responsibility — the manager handles only CRUD and queries, while the Student record handles its own domain logic like isPassing() and gradeLevel()."
- Mock EN EN: "What would you change about the StudentGradeManager if it needed to support 10 million students?" ▼

  "For 10 million students, I would make several changes. First, replace the in-memory ArrayList with a proper database — likely with indexed columns on faculty and GPA for efficient grouping and sorting queries. Second, use pagination for list queries instead of loading all students at once — JPA's Pageable or JDBC offset/limit. Third, move expensive aggregations like faculty statistics to the database layer using GROUP BY queries rather than in-memory streams.

   If some in-memory processing is still needed, I'd use parallel streams for CPU-bound operations, and consider batched loading. I'd also add caching (Redis or Caffeine) for frequently-accessed aggregations like top students. Finally, I'd make the service stateless so it can scale horizontally behind a load balancer."

### 🧠 Quiz Nhanh

1. `Optional<T>` nên được dùng làm gì theo best practice?
   - [x] Làm return type của method
   - [ ] Làm field trong class
   - [ ] Làm parameter type của method
   - [ ] Thay thế mọi biến local
   💡 Optional buộc caller xử lý empty case rõ ràng; best practice dùng làm return type, KHÔNG dùng làm field hay parameter.

2. Trong chuỗi Comparator, `thenComparing()` được dùng để làm gì?
   - [ ] Đảo ngược thứ tự sắp xếp
   - [x] Làm tie-breaker khi primary key bằng nhau
   - [ ] Lọc bỏ phần tử trùng
   - [ ] Chuyển sang sort song song
   💡 thenComparing() chỉ áp dụng khi key chính bằng nhau; có thể chain nhiều cấp và mỗi method trả về Comparator mới (immutable).

3. Tại sao không nên dùng Hashtable trong code mới khi cần thread-safety?
   - [ ] Vì Hashtable không synchronized
   - [ ] Vì Hashtable cho phép null key/value gây lỗi
   - [x] Vì nó lock toàn bộ map (chậm); nên dùng ConcurrentHashMap hiệu năng tốt hơn nhiều
   - [ ] Vì Hashtable không hỗ trợ generics
   💡 Hashtable synchronized toàn bộ mọi method (legacy); ConcurrentHashMap dùng bucket-level lock nên throughput cao hơn nhiều.

- **🟡 LeetCode:** #56 Merge Intervals (Review) — Medium — Sort + Greedy — Sort intervals by start. Merge overlapping bằng cách compare current start với last merged end. Dùng ArrayList để build kết quả. Ôn lại sort với Comparator và ArrayList operations.

- **🤖 AI Tool:** Copilot — Generate Tests — Prompt: *"Generate JUnit 5 test cases for StudentGradeManager covering: add duplicate, remove non-existent, getPassingStudents with edge cases, groupByFaculty empty list, getTopN when N > size."*

- **📖 Resource:** Ôn tập tổng hợp Tuần 2 — Review tất cả Baeldung links: java-exceptions, java-arraylist-linkedlist, java-hashmap, java-8-streams, java-8-collectors, java-concurrent-hashmap. Đọc lại Q&A các ngày mà bạn chưa trả lời được thành thạo.

## 📝 Tổng kết Tuần 2 — Interview Question Bank + Checklist

### 🔴 Exception Handling

**3 câu hỏi phỏng vấn EN**

- **Q: What is the difference between checked and unchecked exceptions?**  
  A: Checked exceptions (e.g. IOException) are verified at compile time — the compiler forces you to either catch them or declare them with throws. Unchecked exceptions (extending RuntimeException, e.g. NullPointerException) are not checked at compile time. Use checked when the caller can reasonably recover; use unchecked for programming errors or when propagating through many layers would be noisy.
- **Q: How does try-with-resources work and what problem does it solve?**  
  A: try-with-resources automatically calls close() on any resource that implements AutoCloseable after the try block completes, whether normally or exceptionally. It solves the resource leak problem that occurs when developers forget to close resources in finally blocks. It also properly handles suppressed exceptions — if both the body and close() throw, the close() exception is suppressed rather than swallowing the primary one.
- **Q: How do you design a custom exception hierarchy?**  
  A: I start with a base AppException extending RuntimeException, with an errorCode field and constructors for (message) and (message, cause). Then I create domain-specific subclasses like ValidationException, NotFoundException, and AuthorizationException. Each carries relevant context. At the REST layer, a global @ExceptionHandler maps exception types to HTTP status codes. This way business logic throws meaningful exceptions and the HTTP translation is centralized.

### 🟠 Collections

**4 câu hỏi phỏng vấn EN**

- **Q: How does HashMap work internally?**  
  A: HashMap uses a bucket array (default 16 slots). On put(key, value), it computes hashCode(), mixes the bits, then indexes into the array. Collisions are handled by a linked list per bucket; in Java 8+, buckets with more than 8 entries convert to a Red-Black Tree for O(log n) worst-case. The map rehashes when size exceeds capacity × loadFactor (default 0.75), doubling the table. get() follows the same index computation then searches the bucket using equals().
- **Q: When would you choose LinkedList over ArrayList?**  
  A: In practice, almost never — ArrayList is almost always faster due to better cache locality. I would choose LinkedList when I need Deque semantics (efficient addFirst/pollFirst) without the overhead of ArrayDeque's fixed-capacity resizing, or when I need O(1) insertions at the head of a large list that I've profiled as a bottleneck. For random access or iteration, ArrayList wins.
- **Q: What is ConcurrentModificationException and how do you avoid it?**  
  A: CME is thrown when you modify a collection while iterating over it with a fail-fast iterator. It works via a modCount counter — if it changes during iteration, the iterator throws. To avoid it: use iterator.remove() for safe removal during iteration, use list.removeIf() (Java 8+), collect items to remove then call removeAll(), or use a concurrent collection like CopyOnWriteArrayList which iterates over a snapshot.
- **Q: TreeMap vs HashMap — which to choose?**  
  A: HashMap gives O(1) average for get/put, no ordering guarantee. TreeMap gives O(log n) but keeps keys sorted (natural order or Comparator) and supports range queries — firstKey(), lastKey(), subMap(), floorKey(), ceilingKey(). Choose HashMap for pure lookup performance. Choose TreeMap when you need sorted iteration or range-based queries. LinkedHashMap is a middle ground — O(1) operations with insertion-order iteration.

### 🟢 Stream API

**3 câu hỏi phỏng vấn EN**

- **Q: What is the difference between map() and flatMap()?**  
  A: map() applies a function to each element and wraps the result — if the function returns a collection, you get a Stream of collections. flatMap() applies a function that returns a Stream per element, then flattens all those streams into one. Use flatMap when your mapper produces a one-to-many relationship, like extracting all words from a list of sentences, or all items from a list of orders.
- **Q: How does groupingBy() work? Give a practical example.**  
  A: Collectors.groupingBy(classifier) partitions stream elements into a Map where keys are the classifier's return values and values are Lists of matching elements. With a downstream collector you can aggregate within each group — for example groupingBy(Student::faculty, averagingDouble(Student::gpa)) produces a Map<String, Double> of average GPA per faculty. You can also supply a specific Map implementation as the second argument to get a TreeMap for sorted keys.
- **Q: When should you use parallelStream()? What are the risks?**  
  A: Use parallelStream() for large datasets (100k+ elements) with CPU-intensive, stateless, independent per-element processing — for example, computing a cryptographic hash for each record in a batch. Risks: it uses ForkJoinPool.commonPool() shared across the JVM, so heavy parallel stream use starves other tasks. It also adds overhead that makes it slower for small lists or I/O-bound work. Always benchmark before switching; incorrect use of shared mutable state in parallel streams causes race conditions.

### ✅ Checklist hoàn thành Tuần 2

- [ ] Giải thích được Exception hierarchy: Throwable → Error / Exception → Checked / Unchecked
- [ ] Tạo được Custom Exception extend RuntimeException với errorCode và chaining constructor
- [ ] Dùng try-with-resources với AutoCloseable resource, hiểu suppressed exceptions
- [ ] So sánh ArrayList vs LinkedList với Big-O table, biết khi nào dùng cái nào
- [ ] Giải thích HashMap: hash → bucket → collision → load factor → rehashing
- [ ] Dùng Stream filter/map/collect fluently, hiểu lazy evaluation
- [ ] groupingBy, Collectors.counting(), flatMap, Collectors.joining() thành thạo
- [ ] LeetCode AC: #1 Two Sum, #49 Group Anagrams, #347 Top K Frequent, #206 Reverse LL — 4 bài
- [ ] StudentGradeManager hoàn chỉnh với đủ features, đã push lên GitHub với README
- [ ] Mock interview 5 câu EN về Collections không ấp úng quá 3 giây mỗi câu

> 💡 **Golden Rule Tuần 2:** Exception = signal, không phải flow control. Collection = chọn đúng cấu trúc cho đúng use case. Stream = nói "muốn gì", không phải "làm thế nào". Ba kỹ năng này xuất hiện trong mọi phỏng vấn Java — nắm chắc = tự tin.
