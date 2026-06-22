# 📗 Tuần 1 · Java Core: OOP + Generics + Collections · 11/05–17/05/2025

## 📅 Lịch Học Tuần 1 — Tổng Quan 7 Ngày

| Ngày | Thứ | Chế độ | Thời gian | Chủ đề |
| --- | --- | --- | --- | --- |
| 11/05 | Thứ 2 | LIGHT | 1.5h | OOP 4 tính chất: Encapsulation, Inheritance, Polymorphism, Abstraction |
| 12/05 | Thứ 3 | FULL | 2.5h | Interface vs Abstract. Default/Static methods Java 8. Functional Interface |
| 13/05 | Thứ 4 | FULL | 2.5h | equals/hashCode contract. Comparable vs Comparator. Immutability |
| 14/05 | Thứ 5 | FULL | 2.5h | Generics: type param, wildcard, bounded type, PECS. Type erasure |
| 15/05 | Thứ 6 | LIGHT | 1.5h | Exception: checked/unchecked, try-with-resources, custom exception |
| 16/05 | Thứ 7 | WEEKEND | 4h | Collections P1: ArrayList, LinkedList, HashSet, TreeSet, Iterator, Big-O |
| 17/05 | CN | REVIEW | 4h | Spaced Review + Mini Project: Quản lý sinh viên hoàn chỉnh |

## ⚡ Ngày 1 · OOP – 4 Tính Chất: Encapsulation, Inheritance, Polymorphism, Abstraction

**11/05 — Thứ 2** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

### 📖 Lý Thuyết Cốt Lõi

**Encapsulation (Đóng gói)**

Ẩn dữ liệu nội bộ bằng `private` fields + public getter/setter. Mục đích: kiểm soát truy cập, dễ validate.
**Ví dụ thực tế:** `class BankAccount { private double balance; public double getBalance() {...} }`

**Inheritance (Kế thừa)**

Lớp con (subclass) kế thừa thuộc tính + method từ lớp cha. Keyword: `extends`. Java chỉ hỗ trợ **single inheritance**.
**Ví dụ:** `class Dog extends Animal { ... }`

**Polymorphism (Đa hình)**

**Overriding:** lớp con ghi đè method lớp cha (`@Override`).
**Overloading:** nhiều method cùng tên, khác tham số.
**Ví dụ:** `Animal a = new Dog(); a.makeSound();` → gọi method của Dog

**Abstraction (Trừu tượng)**

Ẩn chi tiết cài đặt, chỉ lộ interface cần thiết. Dùng `abstract class` hoặc `interface`.
**Ví dụ:** `interface Shape { double area(); }` → Circle, Rectangle tự implement

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// Polymorphism demo
abstract class Animal {
    abstract void makeSound();
    void breathe() { System.out.println("Breathing..."); }
}
class Dog extends Animal {
    @Override
    void makeSound() { System.out.println("Woof!"); }
}
class Cat extends Animal {
    @Override
    void makeSound() { System.out.println("Meow!"); }
}
// Main
Animal[] animals = { new Dog(), new Cat() };
for (Animal a : animals) {
    a.makeSound(); // Woof! sau đó Meow!
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Tạo class `Animal` (abstract) với method `makeSound()`. Tạo `Dog` và `Cat` extends Animal.
2. Tạo class `BankAccount` với `private balance`. Viết `deposit()`, `withdraw()` (có validation), `getBalance()`.
3. Tạo interface `Drawable` với method `draw()`. Implement cho `Circle` và `Rectangle`.
4. Demo Polymorphism: `Animal[] arr = {new Dog(), new Cat()};` loop gọi `makeSound()`. Quan sát runtime binding.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ 1 · OOP là gì? Kể tên 4 tính chất và giải thích ngắn gọn từng tính chất.**

OOP (Object-Oriented Programming) là lập trình hướng đối tượng — tổ chức code thành các object có dữ liệu và hành vi.

**4 tính chất:**
① **Encapsulation:** ẩn dữ liệu nội bộ bằng `private`, chỉ expose qua getter/setter.
② **Inheritance:** lớp con kế thừa field + method từ lớp cha bằng `extends`.
③ **Polymorphism:** cùng method, hành vi khác nhau tùy object (override/overload).
④ **Abstraction:** ẩn chi tiết cài đặt, chỉ lộ interface cần thiết qua `abstract class` hoặc `interface`.

**Dễ 2 · Encapsulation có lợi gì trong thực tế?**

① **Kiểm soát validation:** `BankAccount.withdraw()` có thể check balance trước khi cho rút.
② **Dễ thay đổi implementation** bên trong mà không ảnh hưởng code bên ngoài (chỉ cần giữ public API).
③ **Tránh dữ liệu bị sửa trực tiếp** từ bên ngoài gây lỗi không mong muốn.

**Trung 3 · Sự khác nhau giữa @Override (Overriding) và Overloading?**

**Overriding:** lớp con tái định nghĩa method của lớp cha với **cùng signature**. Quyết định lúc *runtime* (dynamic dispatch).
**Overloading:** cùng tên method, **khác tham số** (số lượng/kiểu). Quyết định lúc *compile time*.

Ví dụ:
• `print(String s)` vs `print(int n)` → overloading
• `Dog.makeSound()` ghi đè `Animal.makeSound()` → overriding

**Trung 4 · Constructor có được kế thừa không? `super()` hoạt động thế nào trong Inheritance?**

**Constructor không được kế thừa.** Mỗi class có constructor riêng.

`super()` gọi constructor của lớp cha. Nếu không gọi tường minh, Java tự chèn `super()` không tham số vào dòng đầu constructor lớp con.

**Ví dụ:**
`class Animal { Animal(String name) {...} }`
`class Dog extends Animal { Dog(String name) { super(name); ... } }`

⚠️ Nếu lớp cha không có no-arg constructor mà lớp con không gọi `super(args)` → compile error.

**Khó 5 · Tại sao Java không hỗ trợ multiple inheritance với class nhưng lại hỗ trợ với interface?**

**Diamond Problem** là lý do chính. Nếu class B và C đều extend A và override `greet()`, thì class D extends B, C không biết dùng method nào.

Interface giải quyết được vì:
① Trước Java 8: interface chỉ có abstract methods, không có implementation → không conflict.
② Từ Java 8: có default methods, nhưng nếu conflict, class **bắt buộc** phải `@Override` để resolve.

**Ví dụ thực tế Spring:** `class ArrayList implements List, Serializable, Cloneable, RandomAccess` — implement 4 interface cùng lúc OK.

### 🧠 Quiz Nhanh

1. Tính chất OOP nào ẩn dữ liệu nội bộ bằng `private` và chỉ cho truy cập qua getter/setter?
   - [ ] Inheritance
   - [x] Encapsulation
   - [ ] Polymorphism
   - [ ] Abstraction
   💡 Encapsulation = đóng gói: ẩn field `private`, expose qua getter/setter để kiểm soát truy cập.

2. Keyword nào dùng để một class kế thừa class khác trong Java?
   - [x] extends
   - [ ] implements
   - [ ] inherits
   - [ ] super
   💡 `extends` để kế thừa class; `implements` dành cho interface.

3. `Animal a = new Dog(); a.makeSound();` gọi đúng method của `Dog` — đây là biểu hiện của tính chất nào?
   - [ ] Encapsulation
   - [ ] Abstraction
   - [x] Polymorphism
   - [ ] Inheritance
   💡 Đa hình qua overriding — quyết định lúc runtime (dynamic dispatch).

- **🧩 LeetCode:** Two Sum (LC #1) – Easy — Dùng HashMap lưu `{value: index}`. Với mỗi phần tử kiểm tra `complement = target - nums[i]` đã có trong map chưa. O(n) time, O(n) space.

- **🤖 AI Tools:** Cài **Cursor IDE** + **GitHub Copilot**. Thử prompt: *"Generate a Java class with encapsulation for a BankAccount"*

- **📚 Tài Nguyên:** Baeldung: OOP in Java · NeetCode: Two Sum

## 💪 Ngày 2 · Interface vs Abstract Class · Default/Static Methods Java 8 · Functional Interface

**12/05 — Thứ 3** · **FULL** · ⏱ 30 phút sáng + 2h tối (Pomo 1: Lý thuyết · Pomo 2: Code)

### 📖 Lý Thuyết Cốt Lõi

**Interface**

Chỉ chứa method signatures (Java 7). Java 8+: có `default` và `static` method.
Một class có thể implement **nhiều** interface.
Dùng khi: muốn định nghĩa *behavior* cho các class không liên quan.

**Abstract Class**

Có thể có cả abstract method và concrete method. Có constructor, fields, state.
Một class chỉ extend được **1** abstract class.
Dùng khi: muốn chia sẻ code chung giữa các lớp con có quan hệ IS-A.

**Default Method (Java 8)**

Interface có thể có method với body, dùng keyword `default`.
Mục đích: thêm method mới vào interface mà **không break** các class đã implement.
Ví dụ: `List.sort()` là default method thêm vào Java 8.

**Functional Interface**

Interface có đúng **1 abstract method**. Annotation `@FunctionalInterface`.
Dùng với Lambda Expression.
Built-in: `Runnable, Comparator, Predicate<T>, Function<T,R>, Consumer<T>`

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// Interface với default method
interface Printable {
    void print();                              // abstract
    default void printTwice() { print(); print(); }  // default
    static void info() { System.out.println("v2"); } // static
}

// Functional Interface + Lambda
@FunctionalInterface
interface Transformer<T> {
    T transform(T input);
}

// Sử dụng Lambda
Transformer<String> upper = s -> s.toUpperCase();
System.out.println(upper.transform("hello")); // HELLO

// Comparator với Lambda (Functional Interface có sẵn)
List<String> names = Arrays.asList("Bình", "An", "Dung");
names.sort((a, b) -> a.compareTo(b)); // sort alphabetically
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Tạo interface `Flyable` với method `fly()`. Tạo `Bird` và `Airplane` implement Flyable.
2. Tạo abstract class `Vehicle` với abstract method `start()` và concrete method `stop()`.
3. Viết `Comparator<Student>` bằng Lambda: sort by GPA descending.
4. Tạo `@FunctionalInterface Validator<T>` với method `boolean validate(T t)`. Dùng Lambda để validate email.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (6 câu)

**Dễ 1 · Interface là gì? Tất cả method trong interface có bắt buộc là abstract không?**

Interface là bản hợp đồng (contract) định nghĩa *class có thể làm gì* — chỉ có method signatures, không có implementation.

**Java 7 trở về trước:** tất cả method đều là abstract (ngầm định).
**Java 8+:** cho phép thêm `default` method (có body) và `static` method.
**Java 9+:** cho phép thêm `private` method để tái dùng code trong default methods.

→ Không còn bắt buộc 100% abstract, nhưng các abstract methods vẫn là phần chính.

**Dễ 2 · Functional Interface là gì và tại sao quan trọng trong Java 8?**

Là interface có đúng 1 abstract method. `@FunctionalInterface` giúp compiler kiểm tra.

Quan trọng vì cho phép dùng **Lambda Expression** — code ngắn hơn, readable hơn:
Trước Java 8: `list.sort(new Comparator<String>() { public int compare(String a, String b) { return a.compareTo(b); } });`
Java 8+: `list.sort((a, b) -> a.compareTo(b));`

**Trung 3 · Liệt kê 3 điểm khác biệt chính giữa Interface và Abstract Class.**

| Tiêu chí | Interface | Abstract Class |
| --- | --- | --- |
| Kế thừa | Implement nhiều | Extend 1 |
| Constructor | Không có | Có |
| Fields | Chỉ constants | Bất kỳ field |
| Mục đích | CAN-DO (capability) | IS-A (relationship) |

**Trung 4 · Default method trong Java 8 giải quyết vấn đề gì? Nhược điểm?**

**Giải quyết:** backward compatibility — thêm method vào interface mà không cần sửa tất cả class đã implement. Java 8 thêm `forEach()` vào Iterable, `sort()` vào List mà không break code cũ.

**Nhược điểm — Diamond Problem với default methods:**
Nếu 2 interface có cùng default method, class phải `@Override` để resolve:
`interface A { default void greet() {...} }`
`interface B { default void greet() {...} }`
`class C implements A, B { @Override void greet() { A.super.greet(); } }`

**Trung 5 · Khi nào dùng Interface, khi nào dùng Abstract Class? Cho ví dụ thực tế.**

**Dùng Interface khi:**
• Cần định nghĩa "CÓ THỂ LÀM GÌ" (capability): Serializable, Comparable, Runnable
• Các class không liên quan cần chung một behavior
• Cần multiple type: `ArrayList implements List, Serializable, Cloneable, RandomAccess`

**Dùng Abstract Class khi:**
• Cần chia sẻ CODE CHUNG: `class AbstractDAO` có template method
• Có common state (fields): `class AbstractAnimal { String name; int age; }`
• IS-A relationship rõ ràng: Dog IS-A Animal

**Ví dụ Spring:** JpaRepository là interface, AbstractJpaQuery là abstract class.

**Khó 6 · Nếu 2 interface cùng có default method trùng tên, class implement phải làm gì? Giải thích quy tắc ưu tiên.**

**Class bắt buộc phải @Override** để resolve conflict, ngược lại sẽ compile error.

**Quy tắc ưu tiên (thứ tự giảm dần):**
① Class/instance methods wins over interface defaults.
② Interface gần nhất trong cây kế thừa được ưu tiên.
③ Nếu vẫn conflict → bắt buộc override + chỉ định rõ dùng method nào:

`class C implements A, B {`
`@Override public void greet() { A.super.greet(); } // chọn A`
`}`

**Ví dụ thực tế:** Hibernate implements nhiều interface JPA — phải resolve một số default method conflicts trong phiên bản mới.

### 🧠 Quiz Nhanh

1. Về kế thừa, phát biểu nào ĐÚNG trong Java?
   - [x] Một class implement được nhiều interface nhưng chỉ extend 1 abstract class
   - [ ] Một class extend được nhiều abstract class
   - [ ] Một class chỉ implement được đúng 1 interface
   - [ ] Một class vừa extend nhiều class vừa implement nhiều interface
   💡 Java đơn kế thừa class (single inheritance), nhưng đa kế thừa interface.

2. Functional Interface có bao nhiêu abstract method?
   - [ ] 0
   - [x] Đúng 1
   - [ ] 2
   - [ ] Không giới hạn
   💡 Đúng 1 abstract method → dùng được với Lambda. Đánh dấu `@FunctionalInterface`.

3. `default` method (Java 8) ra đời để giải quyết vấn đề gì?
   - [ ] Tăng tốc độ chạy
   - [x] Thêm method mới vào interface mà không break các class đã implement
   - [ ] Cho phép đa kế thừa class
   - [ ] Thay thế hoàn toàn abstract class
   💡 Backward compatibility — ví dụ `List.sort()` được thêm vào Java 8.

- **🧩 LeetCode:** Valid Parentheses (LC #20) – Easy — Dùng Stack. Push `'({['`, pop khi gặp `')]}'`. Cuối cùng stack phải rỗng.

- **🤖 AI Tools:** AI prompt: *"Explain Java Interface vs Abstract Class with examples"*. So sánh kết quả AI với hiểu biết của mình.

- **📚 Tài Nguyên:** Baeldung: Interface vs Abstract · NeetCode: Valid Parentheses

## 💪 Ngày 3 · equals/hashCode Contract · Comparable vs Comparator · Immutability

**13/05 — Thứ 4** · **FULL** · ⏱ 30 phút sáng + 2h tối (Pomo 1: Lý thuyết · Pomo 2: Code)

### 📖 Lý Thuyết Cốt Lõi

**equals() và hashCode() Contract**

3 quy tắc bắt buộc:
① Nếu `a.equals(b) == true` thì `a.hashCode() == b.hashCode()`
② Ngược lại không cần đúng (hash collision OK)
③ `equals()` phải: reflexive, symmetric, transitive, consistent

⚠️ Vi phạm → HashMap/HashSet hoạt động sai!

**Comparable vs Comparator**

`Comparable` (java.lang): class tự define thứ tự 'tự nhiên'. Implement `compareTo(T other)`. String, Integer đã implement sẵn.

`Comparator` (java.util): define thứ tự bên ngoài class, linh hoạt hơn. Dùng khi cần nhiều cách sort.
Lambda: `Comparator<Student> byGpa = (a,b) -> Double.compare(b.gpa, a.gpa)`

**Immutability (Tính bất biến)**

Object không thể thay đổi sau khi tạo.
Cách tạo: `final class`, `final fields`, không có setter, **deep copy** trong constructor/getter.
Lợi ích: thread-safe, dễ reason about, có thể cache hashCode.
Ví dụ: `String, Integer, LocalDate` trong Java đều immutable.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// Immutable class với defensive copy
public final class ImmutablePerson {
    private final String name;
    private final List<String> hobbies;

    public ImmutablePerson(String name, List<String> hobbies) {
        this.name = name;
        this.hobbies = List.copyOf(hobbies); // defensive copy
    }
    public String getName() { return name; }
    public List<String> getHobbies() { return hobbies; } // unmodifiable
}

// equals + hashCode (IntelliJ có thể generate)
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Point p)) return false;
    return x == p.x && y == p.y;
}
@Override
public int hashCode() { return Objects.hash(x, y); }

// Comparator chain
List<Student> sorted = students.stream()
    .sorted(Comparator.comparing(Student::getName)
        .thenComparing(Comparator.comparing(Student::getGpa).reversed()))
    .toList();
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Tạo class `Point(int x, int y)`. Override `equals()` và `hashCode()` đúng contract. Test với HashSet.
2. Tạo class `Student(String name, double gpa)`. Implement `Comparable` sort by name. Tạo thêm `Comparator` sort by gpa desc.
3. Tạo class `ImmutablePerson(String name, List<String> hobbies)`. Đảm bảo immutable hoàn toàn (defensive copy).
4. Test vi phạm: tạo 2 Point(1,1), add cả 2 vào HashSet. Quan sát khi KHÔNG override hashCode vs khi có override.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ 1 · Sự khác biệt giữa `==` và `equals()` trong Java?**

`==`: so sánh **reference** (địa chỉ bộ nhớ). Hai biến có cùng trỏ vào cùng object không?
`equals()`: so sánh **nội dung** (logic). Mặc định của Object cũng là so sánh reference, nhưng String/Integer đã override để so sánh value.

**Ví dụ:**
`String a = new String("hello");`
`String b = new String("hello");`
`a == b → false` (khác object)
`a.equals(b) → true` (cùng nội dung)

**String pool:** `String a = "hello"; String b = "hello"; a == b → true` (cùng pool entry)

**Dễ 2 · Sự khác biệt giữa Comparable và Comparator, khi nào dùng cái nào?**

`Comparable`: class tự implement `compareTo()`, chỉ có 1 cách sort 'mặc định'. Dùng khi có 'natural ordering' rõ ràng (VD: String sort alphabetically).
`Comparator`: tạo bên ngoài class, linh hoạt, nhiều cách sort khác nhau.

Ví dụ:
`list.sort(Comparator.comparing(Employee::getSalary).reversed())`

**Rule of thumb:** chỉ có 1 cách sort hợp lý → Comparable. Cần nhiều cách → Comparator.

**Trung 3 · Tại sao String trong Java là immutable? Có những lợi ích gì?**

① **String Pool:** JVM cache String literals. Nếu mutable, thay đổi 1 chỗ ảnh hưởng tất cả reference.
② **Thread-safe:** không cần synchronize khi share giữa threads.
③ **Security:** HashMap keys, network connections, class loading path — không muốn bị thay đổi.
④ **hashCode caching:** String tính hashCode 1 lần, cache lại vì value không đổi.

**Bài học:** Dùng `StringBuilder` khi cần modify string trong loop!

**Trung 4 · Làm thế nào để tạo một Immutable class trong Java? Liệt kê các bước cần thiết.**

**5 bước tạo Immutable class:**
① `final class` — không thể extend
② Tất cả fields là `private final`
③ Không có setter
④ **Defensive copy** trong constructor với mutable fields (List, Date...)
⑤ **Defensive copy** trong getter nếu trả về mutable object

`public final class Person {`
`private final List<String> hobbies;`
`public Person(List<String> h) { this.hobbies = List.copyOf(h); }`
`public List<String> getHobbies() { return hobbies; } // unmodifiable`
`}`

**Khó 5 · Điều gì xảy ra nếu override `equals()` nhưng không override `hashCode()`?**

HashMap/HashSet dùng `hashCode()` để tìm bucket trước, sau đó mới dùng `equals()`.

Nếu không override hashCode(): 2 object 'equal' sẽ có hashCode khác nhau → nằm ở 2 bucket khác nhau.

**Hệ quả:**
• Set chứa duplicate: `set.add(p1); set.add(p2);` → 2 phần tử dù `p1.equals(p2) == true`
• Map.get() return null: `map.put(key1, val); map.get(key2) == null` dù `key1.equals(key2)`

**Bug thực tế:** Employee set trong HR system có duplicate vì thiếu hashCode override.

### 🧠 Quiz Nhanh

1. Nếu override `equals()` mà KHÔNG override `hashCode()` thì điều gì xảy ra?
   - [ ] Lỗi biên dịch (compile error)
   - [x] HashMap/HashSet hoạt động sai (chứa duplicate, `get()` trả null)
   - [ ] Không ảnh hưởng gì
   - [ ] Object không khởi tạo được
   💡 hashCode quyết định bucket; 2 object "equal" mà khác hashCode sẽ nằm ở 2 bucket khác nhau.

2. Toán tử `==` so sánh điều gì giữa hai object?
   - [x] Reference (địa chỉ bộ nhớ)
   - [ ] Nội dung logic
   - [ ] Giá trị hashCode
   - [ ] Kiểu dữ liệu
   💡 `==` so reference; `equals()` so nội dung (khi đã được override như String/Integer).

3. Bước nào KHÔNG thuộc cách tạo một immutable class?
   - [ ] Khai báo `final class`
   - [ ] Tất cả field là `private final`
   - [ ] Defensive copy với field mutable
   - [x] Thêm setter cho mỗi field
   💡 Immutable class không có setter — state không đổi sau khi tạo.

- **🧩 LeetCode:** Group Anagrams (LC #49) – Medium — Sorted string làm key trong HashMap. `'eat'` và `'tea'` đều sort thành `'aet'`.

- **🤖 AI Tools:** AI: *"Find the bug in this hashCode implementation"*. Paste code và test.

- **📚 Tài Nguyên:** Baeldung: equals & hashCode · NeetCode: Group Anagrams

## 💪 Ngày 4 · Generics: Type Parameter · Wildcard · Bounded Type · PECS · Type Erasure

**14/05 — Thứ 5** · **FULL** · ⏱ 30 phút sáng + 2h tối (Pomo 1: Lý thuyết · Pomo 2: Code)

### 📖 Lý Thuyết Cốt Lõi

**Generics cơ bản**

Type-safe collections và methods. Compile-time checking.
`class Box<T> { private T value; }`
Lợi ích: không cần cast, phát hiện lỗi sớm hơn runtime.

**Wildcard và Bounded Type**

`?` (unbounded): `List<?>` — list of any type, chỉ đọc được.
`<? extends T>`: T hoặc subtype (upper bound).
`<? super T>`: T hoặc supertype (lower bound).

**PECS: Producer Extends, Consumer Super**
• Đọc từ list (produce): dùng `? extends T`
• Ghi vào list (consume): dùng `? super T`

**Type Erasure**

Generics chỉ tồn tại lúc compile time. Lúc runtime JVM không biết T là gì.
`List<String>` và `List<Integer>` đều là `List` ở runtime.
⚠️ Không thể dùng `instanceof T`, không tạo `new T[10]` trực tiếp.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// Generic Stack
public class Stack<T> {
    private List<T> items = new ArrayList<>();
    public void push(T item) { items.add(item); }
    public T pop() {
        if (isEmpty()) throw new RuntimeException("Stack is empty");
        return items.remove(items.size() - 1);
    }
    public T peek() { return items.get(items.size() - 1); }
    public boolean isEmpty() { return items.isEmpty(); }
}

// PECS — Producer Extends, Consumer Super
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (T item : src) dest.add(item);
}

// Generic method với bounded type
public static <T extends Comparable<T>> T max(List<T> list) {
    return list.stream().max(Comparator.naturalOrder())
               .orElseThrow(() -> new NoSuchElementException());
}

// Sử dụng
List<Number> nums = new ArrayList<>();
List<Integer> ints = Arrays.asList(1, 2, 3);
copy(nums, ints); // Integer extends Number — OK
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Tạo generic class `Stack<T>` với `push()`, `pop()`, `peek()`, `isEmpty()`.
2. Viết generic method `<T extends Comparable<T>> T max(List<T> list)` trả về phần tử lớn nhất.
3. Demo PECS: viết method `copy(List<? super T> dest, List<? extends T> src)`.
4. Tạo `Pair<A, B>` generic class với `getFirst()`, `getSecond()`. Test với `Pair<String, Integer>`.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ 1 · Generics là gì? Tại sao nên dùng Generics thay vì `Object`?**

Generics cho phép viết code với **kiểu dữ liệu tham số hóa** — type được xác định lúc compile time.

**Không dùng Generics:**
`List list = new ArrayList();`
`list.add("Hello"); list.add(123);`
`String s = (String) list.get(1);` → ClassCastException lúc runtime!

**Dùng Generics:**
`List<String> list = new ArrayList<>();`
`// list.add(123);` → Compile error ngay lập tức
`String s = list.get(0);` → Không cần cast, an toàn hoàn toàn.

**Dễ 2 · Type Erasure trong Generics là gì?**

Generics chỉ tồn tại lúc **compile time**. Compiler kiểm tra type rồi xóa thông tin đó đi — lúc runtime JVM không biết T là gì.

Hệ quả:
• `List<String>` và `List<Integer>` đều là `List` ở runtime
• Không thể dùng `instanceof T` hay `new T[10]` trực tiếp

Lý do thiết kế: giữ backward compatibility với code Java cũ (pre-Java 5).

**Trung 3 · Sự khác biệt giữa `<? extends T>` và `<? super T>`? Khi nào dùng cái nào?**

`<? extends T>`: T hoặc subtype của T. Chỉ có thể **đọc** ra (produce), không ghi vào được.
`<? super T>`: T hoặc supertype của T. Có thể **ghi** vào (consume), nhưng đọc ra chỉ nhận được Object.

**Ví dụ:**
`void printAll(List<? extends Number> list)` — đọc Number từ list
`void addNumbers(List<? super Integer> list)` — ghi Integer vào list

Nếu vừa đọc vừa ghi: dùng `T` trực tiếp.

**Trung 4 · Giải thích nguyên tắc PECS với ví dụ thực tế trong Collections API.**

**PECS = Producer Extends, Consumer Super**

Producer (đọc ra) → `? extends T`:
`Collections.sort()` nhận `List<? extends T>` vì nó đọc phần tử để so sánh.

Consumer (ghi vào) → `? super T`:
`Collections.addAll(Collection<? super T> c, T... elements)` — c nhận element nên là consumer.

Khi cả đọc và ghi: dùng `T` trực tiếp (không dùng wildcard).

**Khó 5 · Type Erasure gây ra những vấn đề gì trong thực tế? Cách giải quyết từng vấn đề?**

**Vấn đề và cách giải quyết:**
① Không thể instantiate T: `new T()` → compile error.
 Fix: truyền `Class<T> clazz` vào constructor, dùng `clazz.newInstance()`.

② Không thể tạo generic array: `T[] arr = new T[10]` → error.
 Fix: `(T[]) new Object[10]` (unsafe cast, cần suppress warning).

③ Overloading bị giới hạn: `method(List<String>)` và `method(List<Integer>)` không thể cùng tồn tại — cùng erasure.

**Thực tế Spring:** Dùng `ParameterizedTypeReference` để giữ generic info khi gọi REST API:
`new ParameterizedTypeReference<List<User>>(){}`

### 🧠 Quiz Nhanh

1. PECS trong Generics là viết tắt của?
   - [x] Producer Extends, Consumer Super
   - [ ] Producer Super, Consumer Extends
   - [ ] Parent Extends, Child Super
   - [ ] Public Extends, Class Super
   💡 Đọc ra (produce) → `? extends T`; ghi vào (consume) → `? super T`.

2. Type Erasure nghĩa là gì?
   - [ ] Generics tồn tại đầy đủ lúc runtime
   - [x] Thông tin generic bị xóa sau compile, runtime không biết `T`
   - [ ] Xóa các biến không dùng tới
   - [ ] Xóa kiểu của mảng
   💡 `List<String>` và `List<Integer>` đều chỉ là `List` ở runtime.

3. `List<? extends Number>` cho phép thao tác nào?
   - [x] Đọc phần tử ra dưới dạng Number (producer)
   - [ ] Ghi bất kỳ Number nào vào list
   - [ ] Vừa đọc vừa ghi tự do
   - [ ] Không đọc cũng không ghi được
   💡 Upper bound (`extends`) là producer — chỉ đọc an toàn, không add được.

- **🧩 LeetCode:** Reverse Linked List (LC #206) – Easy — Dùng 3 con trỏ: `prev=null, curr=head, next`. Loop: `next=curr.next → curr.next=prev → prev=curr → curr=next`.

- **🤖 AI Tools:** AI: *"Explain what this wildcard does"* — paste code Generics phức tạp và hỏi AI giải thích.

- **📚 Tài Nguyên:** Baeldung: Java Generics · NeetCode: Reverse Linked List

## ⚡ Ngày 5 · Exception Handling: Checked/Unchecked · try-with-resources · Custom Exception

**15/05 — Thứ 6** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

### 📖 Lý Thuyết Cốt Lõi

**Exception Hierarchy**

`Throwable`
├── `Error` — JVM-level, không nên catch (`OutOfMemoryError`)
└── `Exception`
 ├── **Checked** — compile-time: `IOException, SQLException`
 └── `RuntimeException` → **Unchecked**: `NPE, IndexOutOfBoundsException`

**Checked vs Unchecked**

**Checked:** compiler bắt phải handle hoặc declare với `throws`. Dùng khi lỗi có thể recover được.
**Unchecked (RuntimeException):** không bắt buộc handle. Dùng khi là lỗi lập trình, không nên tiếp tục.

**try-with-resources**

Java 7+: tự động `close()` resource sau khi dùng xong. Resource phải implement `AutoCloseable`.
`try (FileReader fr = new FileReader("file.txt")) { ... }`
Không cần `finally { fr.close(); }` nữa.

**Custom Exception**

Tạo exception riêng cho business logic.
Checked: `class InsufficientFundsException extends Exception`
Unchecked: `class UserNotFoundException extends RuntimeException`
Best practice: thêm context + exception chaining.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// Custom exception với context
public class InsufficientFundsException extends Exception {
    private final double requested;
    private final double available;

    public InsufficientFundsException(double req, double avail) {
        super(String.format(
            "Cannot withdraw %.2f, only %.2f available", req, avail));
        this.requested = req;
        this.available = avail;
    }
}

// try-with-resources — tự động đóng
try (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    // Exception chaining — giữ stack trace gốc
    throw new DataProcessingException("Failed to read file", e);
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Viết method `readFile(String path)` ném `FileNotFoundException` nếu file không tồn tại.
2. Tạo class `InsufficientFundsException` (checked). Dùng trong `BankAccount.withdraw()`.
3. Dùng try-with-resources để đọc file và tự động đóng stream. So sánh với cách dùng finally.
4. Viết global exception handler với multi-catch: `catch (IOException | SQLException e)`.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ 1 · NullPointerException xảy ra khi nào? Cách phòng tránh?**

NPE xảy ra khi gọi method/access field trên `null` reference.

**Phòng tránh:**
① `Optional<T>`: `Optional.ofNullable(val).ifPresent(v -> process(v))`
② Null check trước khi dùng: `if (user != null) { ... }`
③ `Objects.requireNonNull(param, "message")`: fail-fast với message rõ ràng
④ Không trả về `null` từ method — trả về `Optional` hoặc empty collection
⑤ Java 14+: Helpful NPE message chỉ rõ biến nào null.

**Dễ 2 · Checked Exception và Unchecked Exception khác nhau thế nào? Cho ví dụ mỗi loại.**

**Checked Exception:** compiler bắt phải handle (try-catch) hoặc declare (`throws`). Dùng khi lỗi có thể recover được.
Ví dụ: `IOException, SQLException, FileNotFoundException`

**Unchecked Exception (RuntimeException):** không bắt buộc handle. Dùng khi là lỗi lập trình, không nên tiếp tục.
Ví dụ: `NullPointerException, IllegalArgumentException, IndexOutOfBoundsException`

**Rule of thumb:** Caller có thể xử lý hợp lý? → Checked. Lỗi lập trình? → Unchecked.

**Trung 3 · try-with-resources là gì? Tại sao tốt hơn try-finally để đóng resource?**

Java 7+: tự động `close()` resource sau khi khối try kết thúc. Resource phải implement `AutoCloseable`.

**Trước đây (try-finally):**
`FileReader fr = null; try { fr = new FileReader("f"); ... } finally { if (fr != null) fr.close(); }`

**Với try-with-resources:**
`try (FileReader fr = new FileReader("f")) { ... }`
→ Ngắn hơn, an toàn hơn, đóng đúng thứ tự (nhiều resource), không bỏ sót close.

⚠️ Nếu exception xảy ra ở cả try và close(), exception trong close() bị *suppressed*.

**Trung 4 · Khi nào nên dùng `finally` thay vì try-with-resources?**

**try-with-resources (ưu tiên hơn):**
• Đơn giản, ít code, tự động close đúng thứ tự.
• Dùng khi resource implement AutoCloseable: Connection, Stream, Reader.

**finally vẫn cần thiết khi:**
• Cần run code không liên quan đến AutoCloseable.
• Ví dụ: `finally { lock.unlock(); }` khi dùng `ReentrantLock`.
• Cần đảm bảo một đoạn code chạy dù có exception hay không (ví dụ: update metrics, log).

⚠️ **Gotcha:** Nếu exception xảy ra trong cả try và finally, exception trong finally sẽ suppress exception trong try!

**Khó 5 · Exception chaining là gì và tại sao quan trọng trong production?**

Exception chaining = bọc exception gốc khi ném exception mới, giữ nguyên stack trace gốc để debug.

**Ví dụ xấu:**
`catch (SQLException e) { throw new ServiceException("DB error"); }`
→ Mất stack trace gốc! Log chỉ thấy ServiceException.

**Ví dụ tốt:**
`catch (SQLException e) { throw new ServiceException("DB error", e); }`
→ Giữ cause, `getCause()` trả về SQLException gốc với detail message.

**Thực tế Spring:** Khi `@Transactional` method ném checked exception, Spring wrap vào `TransactionSystemException`. Nếu không chain, mất thông tin gốc — on-call engineer sẽ không biết root cause.

### 🧠 Quiz Nhanh

1. `IOException` thuộc loại exception nào?
   - [x] Checked exception
   - [ ] Unchecked exception
   - [ ] Error
   - [ ] RuntimeException
   💡 Checked → compiler bắt buộc handle hoặc khai báo `throws`.

2. `try-with-resources` yêu cầu resource implement interface nào?
   - [ ] Serializable
   - [x] AutoCloseable
   - [ ] Comparable
   - [ ] Runnable
   💡 Resource implement `AutoCloseable` sẽ được tự động `close()` khi rời khối try.

3. Vì sao exception chaining `throw new X("msg", e)` quan trọng?
   - [ ] Giúp code ngắn hơn
   - [x] Giữ lại stack trace gốc để truy nguyên nhân (root cause)
   - [ ] Giúp chương trình chạy nhanh hơn
   - [ ] Bị compiler bắt buộc
   💡 Không chain (`new X("msg")`) sẽ mất nguyên nhân gốc khi debug production.

- **🧩 LeetCode:** Merge Two Sorted Lists (LC #21) – Easy — Dùng dummy head node. So sánh `l1.val` và `l2.val`, attach node nhỏ hơn vào kết quả.

- **🤖 AI Tools:** AI: *"Write unit test for this exception handling code"*. Dùng JUnit 5 + `assertThrows()`.

- **📚 Tài Nguyên:** Baeldung: Exception Handling · NeetCode: Merge Sorted Lists

## 🔥 Ngày 6 · Collections P1: ArrayList vs LinkedList · HashSet/TreeSet · Iterator · Big-O

**16/05 — Thứ 7** · **WEEKEND** · ⏱ 4 giờ (sáng 3h học nặng · chiều 1h Tiếng Anh + review)

### 📖 Lý Thuyết Cốt Lõi

**ArrayList vs LinkedList**

**ArrayList:** backed by dynamic array. O(1) get(i), O(n) add/remove giữa.
**LinkedList:** doubly linked. O(n) get(i), O(1) add/remove đầu/cuối.

Chọn ArrayList khi thường xuyên đọc theo index. Chọn LinkedList khi implement Queue/Deque.
*Thực tế: ArrayList được dùng 95% trường hợp.*

**HashSet vs TreeSet vs LinkedHashSet**

**HashSet:** O(1) add/remove/contains. Không đảm bảo thứ tự.
**TreeSet:** O(log n). Luôn sorted (Red-Black Tree). Element phải Comparable.
**LinkedHashSet:** O(1) + giữ insertion order.

→ Cần tốc độ: HashSet · Cần sorted: TreeSet · Cần insertion order: LinkedHashSet

**Iterator Pattern**

`Iterator<T>`: `hasNext()`, `next()`, `remove()`.
Enhanced for-loop dùng Iterator bên dưới.

⚠️ **ConcurrentModificationException:** xảy ra khi modify collection trong khi đang iterate.
Fix: dùng `Iterator.remove()` hoặc `removeIf()`.

**Big-O tổng hợp**

ArrayList: get O(1), add-end O(1)*, add-middle O(n)
LinkedList: get O(n), add/remove head/tail O(1)
HashMap/HashSet: O(1) average, O(n) worst
TreeMap/TreeSet: O(log n) tất cả
** amortized*

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// Iterator safe remove — tránh ConcurrentModificationException
List<Student> students = new ArrayList<>(Arrays.asList(...));
Iterator<Student> it = students.iterator();
while (it.hasNext()) {
    if (it.next().getGpa() < 2.0) it.remove(); // safe!
}
// Java 8+ — cleaner
students.removeIf(s -> s.getGpa() < 2.0);

// Sort với Comparator chain
List<Student> sorted = students.stream()
    .sorted(Comparator.comparing(Student::getName)
        .thenComparing(
            Comparator.comparing(Student::getGpa).reversed()))
    .toList();

// Benchmark ArrayList vs LinkedList
long start = System.nanoTime();
List<Integer> list = new ArrayList<>(); // đổi sang LinkedList để so sánh
for (int i = 0; i < 10000; i++) list.add(5000, i); // insert giữa
System.out.println((System.nanoTime() - start) / 1_000_000 + "ms");
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Benchmark: đo thời gian add 10.000 phần tử vào giữa `ArrayList` vs `LinkedList`. So sánh kết quả.
2. Tạo Student set bằng `HashSet`. Kiểm tra duplicate detection. Test với equals/hashCode override.
3. Implement safe iteration: xóa student có gpa < 2.0 từ ArrayList dùng `Iterator.remove()` rồi dùng `removeIf()`.
4. Tạo `TreeSet<String>` và thêm tên sinh viên. Kiểm tra tự động sorted alphabetically.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (6 câu)

**Dễ 1 · Khi nào dùng `List.of()` thay vì `new ArrayList()`?**

**List.of(1, 2, 3):** immutable list (Java 9+). Không thể add/remove/set.
→ Dùng khi: list không cần thay đổi, config data, test data.
→ Ném `UnsupportedOperationException` nếu cố modify.

**new ArrayList<>():** mutable list.
→ Dùng khi: cần add/remove sau này.

**Best practice:** Prefer immutable unless you need to modify.

**Dễ 2 · HashSet, TreeSet, LinkedHashSet khác nhau thế nào? Khi nào dùng cái nào?**

**HashSet:** O(1) add/remove/contains. Không đảm bảo thứ tự. Dùng khi chỉ cần kiểm tra tồn tại.
**TreeSet:** O(log n). Luôn sorted (Red-Black Tree). Element phải Comparable. Dùng khi cần dữ liệu có thứ tự.
**LinkedHashSet:** O(1) + giữ insertion order. Dùng khi cần thứ tự thêm vào + no duplicate.

**Rule of thumb:**
→ Cần tốc độ: HashSet · Cần sorted: TreeSet · Cần insertion order: LinkedHashSet

**Trung 3 · ArrayList vs LinkedList — so sánh Big-O và khi nào dùng cái nào?**

| Operation | ArrayList | LinkedList |
| --- | --- | --- |
| get(i) | O(1) ✅ | O(n) |
| add cuối | O(1) amortized | O(1) |
| add/remove giữa | O(n) | O(1) (nếu có node) |

Thực tế: ArrayList được dùng 95%+ trường hợp. Chọn LinkedList khi implement Queue/Deque với thao tác thêm/xóa đầu/cuối liên tục.

**Trung 4 · ConcurrentModificationException xảy ra khi nào? Các giải pháp?**

Xảy ra khi structural modification (add/remove) collection trong khi đang iterate nó.

**Ví dụ bug:**
`for (String s : list) { if (s.startsWith("A")) list.remove(s); }` → CME!

**Giải pháp:**
① `Iterator.remove()`: an toàn nhất
② `removeIf()`: Java 8, cleanest
③ Copy list trước: `new ArrayList<>(list).forEach(...)`
④ `CopyOnWriteArrayList`: thread-safe, iterate trên snapshot (cost cao)
⑤ Collect rồi remove: `list.removeAll(toRemove)`

**Trung 5 · HashMap hoạt động thế nào bên trong? Điều gì xảy ra khi có hash collision?**

HashMap dùng **array of buckets**. Mỗi bucket là linked list (Java 7) hoặc balanced tree khi >8 entries (Java 8+).

**put(key, value):**
① Tính `hash = key.hashCode()`
② Tìm bucket: `index = hash % capacity`
③ Nếu bucket trống: thêm entry. Nếu có collision: duyệt linked list, dùng `equals()` để tìm đúng key.

**Load factor (0.75 mặc định):** khi fill > 75%, resize x2 và rehash.

→ O(1) average, O(n) worst case khi tất cả keys vào cùng 1 bucket.

**Khó 6 · ArrayList resize như thế nào? Tại sao `add()` là O(1) amortized?**

ArrayList bắt đầu với `capacity=10` (default). Khi đầy: tạo array mới `capacity × 1.5`, copy tất cả element sang.

Resize cost = O(n). Nhưng xảy ra ít dần: sau 10 add, sau 15 add, sau 22 add...

**Amortized analysis:** Sau n lần add, tổng cost = n + (n/10 + n/15 + n/22 + ...) ≈ 2n = O(n).
Per operation = O(n)/n = **O(1) amortized**.

**Optimization:** Nếu biết trước size:
`new ArrayList<>(1000)` → tránh multiple resizes, cải thiện performance đáng kể.

### 🧠 Quiz Nhanh

1. `get(i)` của `ArrayList` và `LinkedList` có Big-O lần lượt là?
   - [x] O(1) và O(n)
   - [ ] O(n) và O(1)
   - [ ] O(1) và O(1)
   - [ ] O(log n) và O(n)
   💡 ArrayList dùng mảng động → truy cập theo index O(1); LinkedList phải duyệt → O(n).

2. Cần một tập hợp KHÔNG trùng lặp và LUÔN sorted, nên chọn?
   - [ ] HashSet
   - [x] TreeSet
   - [ ] LinkedHashSet
   - [ ] ArrayList
   💡 TreeSet (Red-Black Tree) O(log n), luôn giữ thứ tự sorted.

3. `ConcurrentModificationException` xảy ra khi nào?
   - [x] Sửa cấu trúc (add/remove) collection trong khi đang iterate nó
   - [ ] Hai thread cùng đọc một lúc
   - [ ] Collection rỗng
   - [ ] Gọi `get()` vượt quá kích thước
   💡 Khắc phục: dùng `Iterator.remove()` hoặc `removeIf()`.

- **🧩 LeetCode:** Contains Duplicate (LC #217) + Valid Anagram (LC #242) — #217: Add vào HashSet, nếu `add()` return `false` = duplicate. #242: Dùng `int[26]` đếm frequency hoặc sort 2 string rồi so sánh.

- **🤖 AI Tools:** AI: *"Which collection should I use for X use case?"* với các case: unique emails, sorted leaderboard, LRU cache.

- **📚 Tài Nguyên:** Baeldung: Java Collections Guide · NeetCode: Contains Duplicate

## 🔁 Ngày 7 · 🔁 Spaced Review T1: OOP + Interface + Generics + Exception · Mini Project: Quản Lý Sinh Viên

**17/05 — CN** · **REVIEW** · ⏱ 4 giờ (sáng 2h review · chiều 2h project + GitHub)

### 📖 Lý Thuyết Cốt Lõi

**Spaced Review: OOP**

✍️ Không xem notes. Tự viết lại:
□ 4 tính chất OOP + 1 ví dụ mỗi cái
□ equals/hashCode contract (3 quy tắc)
□ Interface vs Abstract — 3 điểm khác biệt

**Spaced Review: Java Core**

✍️ Không xem notes. Tự trả lời:
□ PECS là gì? Viết 1 ví dụ
□ Checked vs Unchecked exception — khi nào dùng cái nào?
□ ArrayList vs LinkedList — Big-O so sánh

**Mini Project: Student Management**

Yêu cầu tối thiểu:
• `Student` class (OOP, Comparable, equals/hashCode)
• `StudentManager` với CRUD + filter/sort
• Custom exceptions: `StudentNotFoundException`
• Generic `Repository<T>` interface
• README.md bằng tiếng Anh (5+ câu)
• Push lên GitHub với commit message rõ ràng

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
// Student Management — Final Structure
public class StudentManager {
    private final List<Student> students = new ArrayList<>();

    public void add(Student s) {
        if (students.stream().anyMatch(x -> x.getId().equals(s.getId())))
            throw new DuplicateStudentException(s.getId());
        students.add(s);
    }

    public Student findById(String id) {
        return students.stream()
            .filter(s -> s.getId().equals(id))
            .findFirst()
            .orElseThrow(() -> new StudentNotFoundException(id));
    }

    public List<Student> getTopStudents(double minGpa) {
        return students.stream()
            .filter(s -> s.getGpa() >= minGpa)
            .sorted(Comparator.comparing(Student::getGpa).reversed())
            .toList();
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Self-quiz: viết ra giấy 10 câu Java Core không xem notes. Chấm điểm thật sự.
2. Build `StudentManager` với CRUD đầy đủ, filter by GPA, sort by name/gpa.
3. Push code lên GitHub: `feat: add student management with OOP and collections`
4. Viết README.md tiếng Anh 5+ câu: mô tả project, tech stack, cách chạy, features.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (6 câu)

**Dễ 1 · Tại sao throw `StudentNotFoundException` thay vì return `null`?**

Return null gây ra 2 vấn đề:
① Caller có thể quên check null → NPE sau đó → khó debug.
② Null không mang thông tin — không biết tại sao không tìm thấy.

Throw exception:
• Explicit contract: method này PHẢI tìm thấy, nếu không = exceptional case.
• Stack trace đầy đủ. Caller buộc phải handle.

Alternative: return `Optional<Student>` khi 'không tìm thấy' là normal case.

**Dễ 2 · Generic `Repository<T>` interface trong mini project có lợi gì so với class cụ thể?**

① **Tái sử dụng code:** viết `Repository<Student>`, `Repository<Teacher>` từ cùng 1 interface — không duplicate CRUD logic.
② **Type-safe:** compiler kiểm tra đúng type, không cần cast.
③ **Dễ mock trong test:** implement interface bằng in-memory mock thay vì DB thật.
④ **Open/Closed Principle:** thêm entity mới không cần sửa code CRUD cũ.

`interface Repository<T, ID> { T findById(ID id); void save(T entity); ... }`

**Trung 3 · Tại sao nên thiết kế `Student` class là immutable trong mini project?**

① **Thread-safe mặc định:** không cần synchronize khi share Student object giữa nhiều threads.
② **Dễ reason about:** biết Student không thay đổi → không cần trace tất cả chỗ dùng.
③ **Safe in collections:** nếu Student mutable và dùng làm key trong HashMap, hashCode có thể thay đổi → HashMap bị broken.
④ **Value semantics:** pass Student vào method không lo bị modify ngoài ý muốn.

Trade-off: cần tạo object mới khi "update" → dùng Builder pattern hoặc copy-constructor.

**Trung 4 · Nếu cần store 10 triệu sinh viên, bạn thay đổi gì trong thiết kế?**

① Thay ArrayList bằng database (JPA + PostgreSQL) — không load hết vào memory.
② Thêm pagination: `findAll(Pageable pageable)` thay vì trả về toàn bộ List.
③ Index trên các field thường query: id, department, gpa.
④ Dùng cache (Redis) cho frequent queries: top students, department stats.
⑤ Không dùng `Stream().filter()` trên toàn bộ list — thay bằng WHERE clause trong SQL.

**Mock EN 5 · Tell me about your mini project. What design decisions did you make?**

**Template trả lời tiếng Anh (học thuộc + tùy chỉnh):**
*"I built a Student Management system to practice Java OOP and Collections. I designed the Student class as immutable — all fields final, no setters — to avoid accidental state changes. For storage, I chose ArrayList because most operations are random access. I added custom checked exceptions — StudentNotFoundException — because callers need to handle the case where a student does not exist. I used Stream API for filtering and sorting, which made the code more declarative."*

**Khó 6 · Nếu `StudentManager` cần thread-safe để dùng trong multi-threaded API, bạn thay đổi gì?**

**Các lựa chọn từ đơn giản đến phức tạp:**

① `synchronized` methods: đơn giản nhất nhưng lock toàn bộ — bottleneck với nhiều thread đọc.

② `Collections.synchronizedList(new ArrayList<>())`: wrapper đồng bộ nhưng vẫn cần sync khi iterate.

③ `CopyOnWriteArrayList`: read không cần lock, write tạo copy mới. Tốt khi read nhiều hơn write.

④ `ReadWriteLock` với `ReentrantReadWriteLock`: nhiều thread đọc đồng thời, chỉ 1 thread ghi.

⑤ Database + transaction: giải pháp production thực tế — DB xử lý concurrency thay vì in-memory.

**Rule:** Đừng tự viết concurrent code — dùng `ConcurrentHashMap`, DB, hoặc framework đã tested.

### 🧠 Quiz Nhanh

1. Vì sao nên `throw StudentNotFoundException` thay vì `return null`?
   - [x] Tránh NPE ngầm và mang thông tin lỗi rõ ràng cho caller
   - [ ] Chạy nhanh hơn
   - [ ] Bị Java bắt buộc
   - [ ] Để trả về nhiều giá trị cùng lúc
   💡 Hoặc trả `Optional<Student>` khi "không tìm thấy" là trường hợp bình thường.

2. Generic `Repository<T>` mang lại lợi ích chính nào?
   - [ ] Chạy nhanh hơn class cụ thể
   - [x] Tái sử dụng CRUD type-safe cho nhiều entity, không duplicate logic
   - [ ] Giảm dung lượng file
   - [ ] Tự động kết nối database
   💡 Compiler kiểm tra đúng type, dễ mock khi test.

3. Cần lưu 10 triệu sinh viên — thay đổi hợp lý nhất trong thiết kế?
   - [ ] Tăng RAM rồi giữ nguyên ArrayList
   - [x] Dùng database + pagination + index trên field hay query
   - [ ] Đổi sang LinkedList
   - [ ] Lưu tất cả vào một file text
   💡 Không load hết vào memory; lọc bằng `WHERE` trong SQL thay vì `stream().filter()`.

- **🧩 LeetCode:** Top K Frequent Elements (LC #347) – Medium — HashMap đếm frequency, sau đó dùng bucket sort (array of lists, index = frequency) để tìm top K. O(n) time.

- **🤖 AI Tools:** Push GitHub. AI: *"Review my README. Is the English natural?"* Feynman test: giải thích OOP cho bạn bè.

- **📚 Tài Nguyên:** Baeldung: HashMap Internals · NeetCode: Top K Frequent

## 🎯 Tổng Kết Tuần 1

### 📋 Ngân Hàng Câu Hỏi Phỏng Vấn

*Ôn lại cuối tuần — trả lời to ra, ghi âm, nghe lại.*

**OOP**

- **Q: What are the four pillars of OOP?**  
  A: Encapsulation (private fields + getters/setters), Inheritance (extends), Polymorphism (override/overload), Abstraction (interface/abstract class).
- **Q: Difference between interface and abstract class?**  
  A: Interface: contract only, multiple implementation. Abstract class: can have state + concrete methods, single inheritance. Interface for 'can-do', abstract for 'is-a'.
- **Q: Can an abstract class have a constructor?**  
  A: Yes. Called via super() in subclass. Cannot be instantiated directly.

**Java Core**

- **Q: What is the equals/hashCode contract?**  
  A: If a.equals(b) then a.hashCode() == b.hashCode(). Violating this breaks HashMap/HashSet. Always override both together.
- **Q: What is type erasure in Java Generics?**  
  A: Generic type params removed at compile time. At runtime List<String> == List<Integer> == List. Cannot do instanceof T or new T[].
- **Q: Checked vs unchecked exceptions?**  
  A: Checked: compile-time, must handle (IOException). Unchecked: runtime, extends RuntimeException (NPE). Checked for recoverable errors, unchecked for programming bugs.

**Collections**

- **Q: When use LinkedList over ArrayList?**  
  A: When frequently inserting/removing at head (O(1) vs O(n)). Examples: Queue, Deque, LRU Cache. ArrayList preferred for random access.
- **Q: What is ConcurrentModificationException?**  
  A: Thrown when modifying collection while iterating. Fix: Iterator.remove(), removeIf(), or collect then remove.

### ✅ Checklist Cuối Tuần

- [ ] Code được cả 4 tính chất OOP từ đầu không xem notes
- [ ] Giải thích được Interface vs Abstract Class cho người mới (Feynman test)
- [ ] Override equals() và hashCode() đúng contract, test với HashSet
- [ ] Viết Generic Stack<T> hoàn chỉnh
- [ ] Mini project Student Management chạy được, push GitHub
- [ ] README.md tiếng Anh đã viết (5+ câu)
- [ ] LeetCode: Two Sum, Valid Parentheses, Group Anagrams, Reverse LL, Contains Duplicate = 5 bài AC
- [ ] Vocalmax streak 7 ngày, học được 20+ từ IT
- [ ] Parroto Shadowing/Dictation 7 ngày liên tiếp
- [ ] GitHub có ít nhất 5 commits tuần này

> 💡 **Quy tắc vàng:** Dù bận thế nào, tối thiểu 30 phút Vocalmax/Parroto + 1 câu Tiếng Anh + 1 LeetCode Easy = giữ streak. Đừng bỏ ngày!
