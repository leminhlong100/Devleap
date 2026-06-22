# 🧩 Tuần 11 · LeetCode + Demo Project + System Design · 20/07–26/07/2025

## 📅 Lịch Học Tuần 11 — Tổng Quan 7 Ngày

| Ngày | Thứ | Chế độ | Thời gian | Chủ đề |
| --- | --- | --- | --- | --- |
| 20/07 | Thứ 2 | LIGHT | 1.5h | Array & String patterns: Two Pointers, Sliding Window, Hashing |
| 21/07 | Thứ 3 | FULL | 2.5h | HashMap/Set + Stack/Queue problems + Big-O analysis |
| 22/07 | Thứ 4 | FULL | 2.5h | Trees & Graphs: BFS, DFS, traversals, common patterns |
| 23/07 | Thứ 5 | FULL | 2.5h | Dynamic Programming cơ bản + Binary Search + Sorting |
| 24/07 | Thứ 6 | LIGHT | 1.5h | System Design fundamentals: scalability, load balancing, caching, DB |
| 25/07 | Thứ 7 | WEEKEND | 4h | System Design case study: thiết kế URL shortener / rate limiter / news feed |
| 26/07 | CN | REVIEW | 4h | Spaced Review T1-T11 + Demo Project hoàn thiện + chuẩn bị portfolio |

## ⚡ Ngày 1 · Array & String patterns: Two Pointers, Sliding Window, Hashing

**20/07 — Thứ 2** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

### 📖 Lý Thuyết Cốt Lõi

**Two Pointers**

Dùng hai con trỏ chạy trên mảng/chuỗi để giảm độ phức tạp từ O(n²) xuống O(n). Có hai biến thể chính: hai đầu đối nhau (opposite ends — thường trên mảng đã sắp xếp, ví dụ Two Sum II, kiểm tra palindrome) và nhanh/chậm (fast/slow — xóa phần tử trùng in-place, phát hiện chu trình trong linked list). Mẹo nhận diện: bài toán trên mảng sorted hoặc cần so sánh cặp phần tử.

**Sliding Window**

Duy trì một "cửa sổ" liên tiếp trên mảng/chuỗi, mở rộng bên phải và co bên trái để thỏa điều kiện. Có cửa sổ cố định (fixed window — max sum subarray độ dài k) và cửa sổ biến đổi (variable window — longest substring without repeating). Thường kết hợp với HashMap/HashSet để theo dõi trạng thái cửa sổ. Biến O(n²) thành O(n) cho các bài substring/subarray.

**Hashing cho tra cứu O(1)**

Dùng HashMap/HashSet để đánh đổi không gian lấy thời gian: tra cứu, thêm, xóa trung bình O(1). Pattern phổ biến: lưu complement để tìm cặp (Two Sum), nhóm các phần tử cùng đặc điểm (group anagrams dùng sorted string làm key), đếm tần suất (frequency count). Khi thấy bài cần "đã gặp phần tử này chưa?" thì nghĩ ngay tới hash.

**Framework giải bài**

Quy trình chuẩn trong phỏng vấn: (1) Clarify — hỏi rõ ràng buộc, edge case; (2) Examples — chạy thử ví dụ tay; (3) Brute force — nêu giải pháp ngây thơ trước; (4) Optimize — tìm pattern để cải thiện; (5) Code — viết sạch; (6) Test — chạy lại ví dụ. Quan trọng nhất: nói to suy nghĩ (think out loud) để interviewer thấy cách bạn tư duy.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
import java.util.*;

public class ArrayPatterns {

    // Two Sum — HashMap O(n) time, O(n) space
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{ seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[]{ -1, -1 };
    }

    // Longest Substring Without Repeating Characters — sliding window O(n)
    public static int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> lastIndex = new HashMap<>();
        int left = 0, maxLen = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (lastIndex.containsKey(c) && lastIndex.get(c) >= left) {
                left = lastIndex.get(c) + 1; // co cửa sổ qua ký tự trùng
            }
            lastIndex.put(c, right);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9))); // [0, 1]
        System.out.println(lengthOfLongestSubstring("abcabcbb")); // 3 ("abc")
    }
}
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Giải **Two Sum** (LeetCode #1) bằng HashMap. Giải thích vì sao đạt O(n) time, O(n) space.
2. Giải **Valid Palindrome** (LeetCode #125) bằng two pointers hai đầu đối nhau, bỏ qua ký tự không phải chữ/số. Phân tích O(n) time, O(1) space.
3. Giải **Longest Substring Without Repeating Characters** (LeetCode #3) bằng sliding window. Giải thích cách cửa sổ co/mở và độ phức tạp O(n).

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ · Khi nào nên dùng kỹ thuật Two Pointers?**

Two Pointers phù hợp khi: (1) mảng đã được sắp xếp và cần tìm cặp/bộ ba thỏa điều kiện tổng (Two Sum II, 3Sum); (2) cần so sánh phần tử từ hai đầu vào trong (kiểm tra palindrome); (3) xử lý in-place như xóa phần tử trùng, đảo mảng; (4) fast/slow pointer để phát hiện chu trình hoặc tìm điểm giữa linked list. Lợi ích chính là giảm O(n²) xuống O(n) mà không tốn thêm bộ nhớ.

**Dễ · Sliding Window dùng cho dạng bài nào?**

Sliding Window dùng cho các bài về dãy con/chuỗi con liên tiếp (contiguous subarray/substring): tìm độ dài lớn nhất/nhỏ nhất thỏa điều kiện, tổng/tích trong cửa sổ, đếm cửa sổ hợp lệ. Hai loại: cửa sổ cố định (fixed size k) và cửa sổ biến đổi (mở rộng right, co left khi vi phạm điều kiện). Ví dụ: longest substring without repeat, max sum subarray of size k, minimum window substring. Đạt O(n) vì mỗi phần tử vào/ra cửa sổ tối đa một lần.

**Trung · Tại sao dùng HashMap giúp Two Sum đạt O(n)?**

Giải pháp brute force kiểm tra mọi cặp bằng hai vòng lặp lồng nhau → O(n²). HashMap cho phép tra cứu trung bình O(1): khi duyệt qua phần tử nums[i], ta tính complement = target - nums[i] và kiểm tra ngay trong map xem complement đã xuất hiện chưa. Nếu có thì trả về luôn, nếu không thì lưu nums[i] vào map. Mỗi phần tử duyệt một lần với tra cứu O(1) → tổng O(n) time, đánh đổi O(n) space. Đây là pattern "đánh đổi không gian lấy thời gian" kinh điển.

**Trung · Cách tiếp cận một bài LeetCode hoàn toàn mới?**

Theo framework 6 bước: (1) Clarify — hỏi rõ ràng buộc đầu vào, kích thước, kiểu dữ liệu, edge case (mảng rỗng, trùng lặp, số âm); (2) Examples — chạy ví dụ bằng tay để hiểu bài; (3) Brute force — nêu giải pháp ngây thơ kèm độ phức tạp; (4) Optimize — nhận diện pattern (sorted → two pointers, "đã gặp chưa" → hash, subarray liên tiếp → sliding window); (5) Code — viết sạch, đặt tên rõ; (6) Test — chạy lại ví dụ + edge case. Luôn nói to suy nghĩ trong suốt quá trình.

**Khó · Phân tích trade-off giữa time và space complexity?**

Thường có thể đổi không gian lấy thời gian và ngược lại. Ví dụ Two Sum: dùng HashMap → O(n) time nhưng O(n) space; nếu mảng đã sort thì two pointers → O(n) time, O(1) space nhưng tốn O(n log n) để sort trước. Khi RAM hạn chế (embedded, dữ liệu khổng lồ) thì ưu tiên tiết kiệm space, chấp nhận chậm hơn. Khi cần phản hồi nhanh (real-time API) thì cache/precompute để đổi space lấy time. Trong phỏng vấn nên nêu cả hai hướng và giải thích vì sao chọn hướng nào tùy ràng buộc bài toán.

### 🧠 Quiz Nhanh

1. Trong giải pháp Two Sum bằng HashMap, với mỗi phần tử `nums[i]` ta kiểm tra điều gì trong map?
   - [ ] Xem `nums[i]` đã có trong map chưa
   - [x] Xem `complement = target - nums[i]` đã có trong map chưa
   - [ ] Xem `target` đã có trong map chưa
   - [ ] Xem `nums[i] + i` đã có trong map chưa
   💡 Ta lưu complement để tìm cặp: nếu `target - nums[i]` đã xuất hiện thì tìm được cặp, đạt O(n) time.

2. Kỹ thuật Two Pointers phù hợp nhất với dạng bài nào sau đây?
   - [x] Mảng đã được sắp xếp, cần tìm cặp thỏa điều kiện tổng
   - [ ] Đồ thị không trọng số cần đường đi ngắn nhất
   - [ ] Bài đếm số cách với overlapping subproblems
   - [ ] Tra cứu tần suất phần tử bất kỳ
   💡 Two Pointers giảm O(n²) xuống O(n) trên mảng sorted hoặc khi so sánh hai đầu (palindrome, fast/slow).

3. Vì sao Sliding Window đạt độ phức tạp O(n) cho các bài subarray/substring liên tiếp?
   - [ ] Vì luôn sắp xếp lại mảng trước khi duyệt
   - [ ] Vì dùng đệ quy chia đôi không gian mỗi bước
   - [x] Vì mỗi phần tử vào và ra khỏi cửa sổ tối đa một lần
   - [ ] Vì kiểm tra mọi cặp phần tử bằng hai vòng lồng
   💡 Cửa sổ mở rộng right và co left, mỗi phần tử được xử lý tối đa một lần nên tổng là O(n).

- **🧩 LeetCode:** #1 Two Sum · #125 Valid Palindrome · #3 Longest Substring Without Repeating Characters — Giải mỗi bài bằng pattern tương ứng (hash / two pointers / sliding window) và nói rõ độ phức tạp.

- **🤖 AI Tools:** Dán lời giải của bạn vào AI và hỏi: "Phân tích time/space complexity của code này và gợi ý cách tối ưu hơn nếu có."

- **📚 Tài Nguyên:** NeetCode 150 (lộ trình theo pattern), bài viết "LeetCode Patterns" — học theo nhóm dạng thay vì giải ngẫu nhiên.

## 💪 Ngày 2 · HashMap/Set + Stack/Queue problems + Big-O analysis

**21/07 — Thứ 3** · **FULL** · ⏱ 30 phút sáng + 2h tối

### 📖 Lý Thuyết Cốt Lõi

**HashMap / HashSet Patterns**

Bốn pattern hay gặp: đếm tần suất (frequency map cho top-K, anagram), loại trùng (HashSet để dedup hoặc phát hiện phần tử lặp), nhóm (grouping — dùng key đại diện như sorted string), và tra complement (lookup bù như Two Sum). Tất cả tận dụng tra cứu/thêm/xóa trung bình O(1) của bảng băm. Khi thấy "đã gặp chưa", "đếm số lần", "nhóm theo đặc điểm" thì nghĩ tới hash.

**Stack Problems**

Stack (LIFO) giải các bài: valid parentheses (đẩy mở, khớp đóng), monotonic stack (giữ stack tăng/giảm để tìm next greater/smaller element), đánh giá biểu thức (postfix/infix), undo/history. Monotonic stack là pattern mạnh: duyệt một lần O(n), pop các phần tử không còn hữu ích, dùng cho "phần tử lớn hơn tiếp theo" hay "diện tích hình chữ nhật lớn nhất".

**Queue / Deque**

Queue (FIFO) là nền tảng cho BFS và xử lý theo thứ tự đến. Deque (hàng đợi hai đầu) linh hoạt hơn: dùng cho sliding window maximum (giữ deque giảm dần các chỉ số, đầu là max của cửa sổ), level-order traversal, hoặc làm cả stack lẫn queue. Trong Java dùng ArrayDeque thay vì Stack/LinkedList vì nhanh và hiện đại hơn.

**Big-O Analysis**

Phân tích cả time và space. Các bậc thường gặp: O(1) hằng số, O(log n) chia đôi (binary search), O(n) tuyến tính, O(n log n) sort, O(n²) hai vòng lồng, O(2ⁿ) đệ quy mũ. Hiểu amortized (chi phí trung bình trên nhiều thao tác, ví dụ ArrayList add là O(1) amortized dù đôi lúc resize tốn O(n)). Luôn xét worst case và bỏ hằng số/bậc thấp.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
import java.util.*;

public class HashStackPatterns {

    // Valid Parentheses — stack O(n)
    public static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
        for (char c : s.toCharArray()) {
            if (pairs.containsValue(c)) {
                stack.push(c);
            } else if (pairs.containsKey(c)) {
                if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;
            }
        }
        return stack.isEmpty();
    }

    // Group Anagrams — HashMap, sorted string làm key O(n * k log k)
    public static List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String word : strs) {
            char[] chars = word.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
        }
        return new ArrayList<>(groups.values());
    }

    // Daily Temperatures — monotonic decreasing stack O(n)
    public static int[] dailyTemperatures(int[] temps) {
        int n = temps.length;
        int[] answer = new int[n];
        Deque<Integer> stack = new ArrayDeque<>(); // lưu chỉ số
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temps[i] > temps[stack.peek()]) {
                int prev = stack.pop();
                answer[prev] = i - prev;
            }
            stack.push(i);
        }
        return answer;
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. **Valid Parentheses** (#20) — dùng stack, phân tích O(n) time, O(n) space.
2. **Group Anagrams** (#49) — dùng HashMap với sorted key, phân tích O(n·k log k).
3. **Daily Temperatures** (#739) — monotonic stack, giải thích vì sao đạt O(n) dù có vòng while bên trong.
4. **Top K Frequent Elements** (#347) — frequency map + heap hoặc bucket sort, phân tích độ phức tạp.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Vì sao dùng Stack để kiểm tra dấu ngoặc hợp lệ?**

Dấu ngoặc tuân theo nguyên tắc LIFO: dấu mở gần nhất phải được đóng trước. Stack hoàn hảo cho việc này — gặp dấu mở thì push, gặp dấu đóng thì pop và kiểm tra có khớp loại không. Cuối cùng stack phải rỗng (mọi dấu đã được đóng). Nếu pop ra rỗng giữa chừng hoặc còn dư thì không hợp lệ. Độ phức tạp O(n) time, O(n) space.

**Dễ · Big-O của các thao tác HashMap là gì?**

Trung bình (average case): get, put, remove, containsKey đều O(1) nhờ hàm băm phân tán đều. Worst case khi nhiều key va chạm (collision) cùng một bucket thì O(n) với danh sách liên kết, nhưng từ Java 8 bucket chuyển sang cây đỏ-đen khi quá tải nên worst case là O(log n). Trong thực tế với hashCode tốt thì coi như O(1). Cần phân biệt rõ average vs worst case khi trả lời phỏng vấn.

**Trung · Monotonic stack là gì và giải bài nào?**

Monotonic stack là stack mà các phần tử luôn theo thứ tự tăng hoặc giảm. Khi push phần tử mới, ta pop hết các phần tử vi phạm thứ tự. Pattern này giải các bài "next greater/smaller element", "daily temperatures", "largest rectangle in histogram", "trapping rain water". Dù có vòng while bên trong, tổng thể vẫn O(n) vì mỗi phần tử được push và pop tối đa một lần (amortized O(1) mỗi phần tử).

**Trung · Cách dùng HashMap để nhóm (grouping) như Group Anagrams?**

Ý tưởng là tạo một "key chuẩn hóa" (canonical key) đại diện cho cả nhóm. Với anagrams, các từ có cùng tập chữ cái sắp xếp giống nhau, nên dùng sorted string làm key (ví dụ "eat" và "tea" đều thành "aet"). Dùng map từ key tới danh sách các từ; computeIfAbsent để khởi tạo list khi cần. Cuối cùng trả về tất cả values. Có thể tối ưu key bằng mảng đếm 26 ký tự thay vì sort để giảm xuống O(n·k).

**Trung · Dùng Deque cho Sliding Window Maximum thế nào?**

Giữ một deque chứa các chỉ số theo thứ tự giảm dần của giá trị. Khi duyệt: (1) loại các chỉ số đã ra khỏi cửa sổ ở đầu deque; (2) pop từ cuối các phần tử nhỏ hơn phần tử mới (vì chúng không bao giờ là max nữa); (3) push chỉ số mới vào cuối; (4) đầu deque luôn là max của cửa sổ hiện tại. Mỗi phần tử vào/ra deque tối đa một lần → O(n) tổng, vượt trội so với O(n·k) nếu quét lại cả cửa sổ.

**Khó · Amortized complexity là gì? Giải thích qua ArrayList resize.**

Amortized là chi phí trung bình trên một chuỗi thao tác, dù một số thao tác đơn lẻ có thể đắt. ArrayList add thường O(1), nhưng khi đầy phải cấp mảng lớn hơn (thường gấp đôi) và copy toàn bộ → O(n) cho lần đó. Tuy nhiên các lần resize ngày càng thưa: copy 1+2+4+...+n ≈ 2n cho n lần add. Chia đều → O(1) amortized mỗi lần add. Phải phân biệt rõ với worst case đơn lẻ O(n): trong phỏng vấn nói "amortized O(1), worst case một thao tác là O(n)".

**Khó · Làm sao tối ưu một thuật toán O(n²) xuống O(n)?**

Các kỹ thuật chính: (1) Hashing — thay vì quét lại tìm phần tử, lưu vào HashMap/Set để tra O(1) (Two Sum); (2) Two pointers — nếu mảng sorted, dùng hai con trỏ thay vì hai vòng lồng (3Sum); (3) Sliding window — với subarray liên tiếp, tái sử dụng kết quả cửa sổ trước thay vì tính lại; (4) Precompute/prefix sum — tính trước tổng tích lũy để truy vấn range O(1); (5) Monotonic stack — tránh quét lại để tìm next greater. Mấu chốt là loại bỏ công việc lặp lại bằng cách lưu/tái dùng thông tin đã tính.

### 🧠 Quiz Nhanh

1. Vì sao Stack là cấu trúc phù hợp để kiểm tra dấu ngoặc hợp lệ (Valid Parentheses)?
   - [ ] Vì stack cho phép tra cứu tần suất O(1)
   - [x] Vì dấu ngoặc tuân theo nguyên tắc LIFO: dấu mở gần nhất phải đóng trước
   - [ ] Vì stack tự sắp xếp các dấu ngoặc theo thứ tự
   - [ ] Vì stack đảm bảo đường đi ngắn nhất
   💡 Gặp dấu mở thì push, gặp dấu đóng thì pop và kiểm tra khớp; cuối cùng stack phải rỗng.

2. Big-O trung bình (average case) của các thao tác get/put/remove trên HashMap là gì?
   - [x] O(1)
   - [ ] O(log n)
   - [ ] O(n)
   - [ ] O(n log n)
   💡 Trung bình O(1) nhờ hàm băm phân tán đều; worst case O(log n) từ Java 8 khi bucket chuyển sang cây đỏ-đen.

3. Vì sao thuật toán Daily Temperatures dùng monotonic stack vẫn đạt O(n) dù có vòng `while` bên trong?
   - [ ] Vì mảng đã được sắp xếp sẵn
   - [ ] Vì vòng while chỉ chạy tối đa log n lần
   - [x] Vì mỗi phần tử được push và pop tối đa một lần (amortized O(1) mỗi phần tử)
   - [ ] Vì stack giới hạn kích thước cố định
   💡 Tổng số lần push/pop trên toàn bộ quá trình là O(n), nên dù có while lồng trong, tổng thể vẫn tuyến tính.

- **🧩 LeetCode:** #20 Valid Parentheses · #49 Group Anagrams · #739 Daily Temperatures — Mỗi bài nêu rõ data structure chọn dùng và phân tích Big-O time + space.

- **🤖 AI Tools:** Hỏi AI: "Giải thích amortized complexity của ArrayList add và cho ví dụ minh họa toán học." Đối chiếu với hiểu biết của bạn.

- **📚 Tài Nguyên:** NeetCode (Stack & HashMap playlist), Big-O Cheat Sheet (bigocheatsheet.com) để tra độ phức tạp các cấu trúc dữ liệu.

## 💪 Ngày 3 · Trees & Graphs: BFS, DFS, traversals, common patterns

**22/07 — Thứ 4** · **FULL** · ⏱ 30 phút sáng + 2h tối

### 📖 Lý Thuyết Cốt Lõi

**Binary Tree Traversals**

Ba kiểu duyệt theo chiều sâu: inorder (trái → gốc → phải, cho ra dãy tăng dần trên BST), preorder (gốc → trái → phải, dùng để sao chép/serialize cây), postorder (trái → phải → gốc, dùng để xóa cây hoặc tính từ dưới lên). Có thể viết đệ quy ngắn gọn hoặc lặp dùng stack. Ngoài ra level-order (theo từng tầng) dùng BFS với queue.

**DFS (Depth-First Search)**

Đi sâu nhất có thể rồi quay lui (backtrack). Cài bằng đệ quy (dùng call stack) hoặc lặp với stack tường minh. Giải các bài: max depth, path sum, validate BST (truyền khoảng min/max xuống), tìm tất cả đường đi, đếm thành phần liên thông. Ưu điểm: tốn bộ nhớ O(h) với h là chiều cao; nhược điểm: dễ tràn stack với cây/đồ thị quá sâu.

**BFS (Breadth-First Search)**

Duyệt theo từng tầng dùng queue (FIFO). Đảm bảo tìm đường đi ngắn nhất trong đồ thị không trọng số vì luôn xét các node gần nguồn trước. Giải các bài: level-order traversal, number of islands, rotting oranges (lan truyền đa nguồn), shortest path in grid. Tốn bộ nhớ O(w) với w là độ rộng tầng lớn nhất.

**Graph: Biểu diễn & Duyệt**

Hai cách biểu diễn: adjacency list (Map/mảng danh sách kề — tiết kiệm cho đồ thị thưa) và adjacency matrix (mảng 2 chiều — nhanh để kiểm tra cạnh nhưng tốn O(V²) bộ nhớ). Luôn cần visited set để tránh lặp vô hạn trên đồ thị có chu trình. Pattern quan trọng: phát hiện chu trình (DFS với trạng thái đang-thăm/đã-thăm), topological sort (sắp xếp DAG theo phụ thuộc).

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
import java.util.*;

public class TreeGraphPatterns {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    // Binary Tree Level Order Traversal — BFS O(n)
    public static List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int size = queue.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            result.add(level);
        }
        return result;
    }

    // Number of Islands — DFS trên lưới O(m * n)
    public static int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int count = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == '1') {
                    count++;
                    dfs(grid, r, c);
                }
            }
        }
        return count;
    }

    private static void dfs(char[][] grid, int r, int c) {
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') return;
        grid[r][c] = '0'; // đánh dấu đã thăm (nhấn chìm đảo)
        dfs(grid, r + 1, c);
        dfs(grid, r - 1, c);
        dfs(grid, r, c + 1);
        dfs(grid, r, c - 1);
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. **Maximum Depth of Binary Tree** (#104) — DFS đệ quy, O(n) time, O(h) space.
2. **Binary Tree Level Order Traversal** (#102) — BFS với queue, theo từng tầng.
3. **Number of Islands** (#200) — DFS hoặc BFS trên lưới, đánh dấu visited.
4. **Validate Binary Search Tree** (#98) — DFS truyền khoảng (min, max) hợp lệ xuống.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · BFS vs DFS — khi nào dùng cái nào?**

BFS (queue) khi cần đường đi ngắn nhất trong đồ thị không trọng số, hoặc xử lý theo tầng (level-order). DFS (đệ quy/stack) khi cần khám phá toàn bộ đường đi, phát hiện chu trình, topological sort, hoặc bài toán cây đi từ dưới lên. BFS tốn bộ nhớ theo độ rộng đồ thị, DFS tốn theo độ sâu. DFS thường code ngắn gọn hơn bằng đệ quy.

**Dễ · Ba kiểu duyệt cây nhị phân khác nhau thế nào?**

Inorder (trái-gốc-phải): trên BST cho ra dãy tăng dần, hữu ích để kiểm tra/sắp xếp. Preorder (gốc-trái-phải): thăm gốc trước, dùng để serialize/sao chép cấu trúc cây. Postorder (trái-phải-gốc): xử lý con trước gốc, dùng để xóa cây hoặc tính toán phụ thuộc con (như chiều cao, tổng cây con). Khác biệt chỉ ở thứ tự "thăm gốc" so với việc đệ quy hai con.

**Trung · DFS lặp (iterative) vs DFS đệ quy (recursive)?**

DFS đệ quy dùng ngầm call stack của hệ thống — code ngắn, dễ đọc, nhưng rủi ro tràn stack (StackOverflowError) khi cây/đồ thị quá sâu (hàng chục nghìn tầng). DFS lặp dùng stack tường minh (ArrayDeque) — dài hơn nhưng kiểm soát được bộ nhớ heap và tránh tràn. Cả hai cùng độ phức tạp O(V+E). Với dữ liệu sâu hoặc không rõ độ sâu, ưu tiên bản lặp.

**Trung · Làm sao phát hiện chu trình trong đồ thị?**

Đồ thị vô hướng: dùng DFS với visited set, nếu gặp lại một node đã thăm mà không phải node cha (parent) thì có chu trình; hoặc dùng Union-Find, nếu hai đầu cạnh đã cùng tập thì có chu trình. Đồ thị có hướng: dùng DFS với ba màu/trạng thái — chưa thăm, đang trong ngăn xếp đệ quy (gray), đã hoàn tất (black); nếu gặp node đang gray (back edge) thì có chu trình. Trạng thái "đang thăm" là chìa khóa cho đồ thị có hướng.

**Trung · Topological sort là gì và dùng để làm gì?**

Topological sort sắp xếp các đỉnh của một DAG (đồ thị có hướng không chu trình) sao cho mọi cạnh u→v thì u đứng trước v. Dùng cho lập lịch theo phụ thuộc: course schedule (môn tiên quyết), build system (thứ tự biên dịch), task scheduling. Hai cách: Kahn's algorithm (BFS dựa trên in-degree, lần lượt lấy node có in-degree 0) hoặc DFS (đẩy node vào stack khi hoàn tất postorder rồi đảo ngược). Nếu không sắp xếp được toàn bộ thì đồ thị có chu trình.

**Khó · Tại sao BFS đảm bảo đường đi ngắn nhất trong đồ thị không trọng số?**

BFS khám phá các node theo thứ tự khoảng cách tăng dần từ nguồn: tầng 0 (nguồn), rồi tất cả node cách 1 cạnh, rồi cách 2 cạnh... Vì mỗi cạnh có "trọng số" như nhau (=1), lần đầu tiên BFS chạm tới một node chính là qua đường đi ngắn nhất có thể — không có đường nào ngắn hơn vì các tầng gần hơn đã được xét hết trước đó. Với đồ thị có trọng số khác nhau thì phải dùng Dijkstra thay vì BFS, vì khoảng cách không còn tỉ lệ với số cạnh.

**Khó · Độ sâu đệ quy (recursion stack) ảnh hưởng thế nào tới space complexity?**

Mỗi lần gọi đệ quy tạo một stack frame chiếm bộ nhớ. Với DFS trên cây, độ sâu đệ quy tối đa = chiều cao cây h, nên space là O(h): cây cân bằng O(log n), cây lệch (skewed) thành O(n). Đây là phần space ẩn dễ bị bỏ sót khi phân tích. Trên đồ thị, độ sâu có thể tới O(V). Nếu đệ quy quá sâu sẽ tràn stack — khi đó cần chuyển sang dùng stack tường minh trên heap. Khi trả lời phỏng vấn nhớ tính cả recursion stack vào space complexity.

### 🧠 Quiz Nhanh

1. Vì sao BFS đảm bảo tìm được đường đi ngắn nhất trong đồ thị không trọng số?
   - [ ] Vì BFS luôn sắp xếp các node theo giá trị tăng dần
   - [ ] Vì BFS dùng đệ quy đi sâu nhất trước
   - [x] Vì BFS khám phá node theo thứ tự khoảng cách tăng dần từ nguồn, mỗi cạnh có trọng số như nhau
   - [ ] Vì BFS dùng visited set nên không lặp
   💡 Lần đầu BFS chạm tới một node chính là qua đường ngắn nhất; với trọng số khác nhau phải dùng Dijkstra.

2. Kiểu duyệt cây nào cho ra dãy tăng dần khi áp dụng trên một Binary Search Tree (BST)?
   - [x] Inorder (trái → gốc → phải)
   - [ ] Preorder (gốc → trái → phải)
   - [ ] Postorder (trái → phải → gốc)
   - [ ] Level-order (theo tầng)
   💡 Inorder trên BST cho dãy tăng dần, hữu ích để kiểm tra/sắp xếp; preorder dùng serialize, postorder dùng xóa cây.

3. Trong giải Number of Islands bằng DFS, vì sao ta đặt `grid[r][c] = '0'` sau khi thăm một ô?
   - [ ] Để đếm lại số đảo từ đầu
   - [ ] Để chuyển ô đó thành nước thật trong dữ liệu gốc
   - [x] Để đánh dấu ô đã thăm, tránh duyệt lặp vô hạn
   - [ ] Để giảm độ phức tạp xuống O(log n)
   💡 "Nhấn chìm đảo" là cách đánh dấu visited ngay trên lưới, ngăn DFS quay lại ô đã xử lý.

- **🧩 LeetCode:** #102 Binary Tree Level Order · #200 Number of Islands · #98 Validate BST — Mỗi bài xác định rõ dùng BFS hay DFS và lý do, kèm độ phức tạp time/space.

- **🤖 AI Tools:** Hỏi AI vẽ ASCII một cây nhị phân nhỏ rồi tự duyệt inorder/preorder/postorder bằng tay, sau đó nhờ AI chấm.

- **📚 Tài Nguyên:** NeetCode (Trees & Graphs playlist), VisuAlgo.net để xem hoạt hình BFS/DFS trực quan.

## 💪 Ngày 4 · Dynamic Programming cơ bản + Binary Search + Sorting

**23/07 — Thứ 5** · **FULL** · ⏱ 30 phút sáng + 2h tối

### 📖 Lý Thuyết Cốt Lõi

**Dynamic Programming**

DP áp dụng khi bài toán có hai đặc tính: overlapping subproblems (các bài con lặp lại) và optimal substructure (lời giải tối ưu xây từ lời giải con tối ưu). Hai cách triển khai: top-down memoization (đệ quy + cache để khỏi tính lại) và bottom-up tabulation (điền bảng từ trạng thái nhỏ tới lớn theo vòng lặp). Ví dụ kinh điển: climbing stairs, house robber, coin change, longest common subsequence.

**Binary Search**

Tìm kiếm trên dữ liệu đã sắp xếp bằng cách chia đôi không gian mỗi bước → O(log n). Cẩn thận với tính toán mid (dùng left + (right - left) / 2 để tránh tràn số). Các biến thể quan trọng: tìm vị trí trái nhất/phải nhất (leftmost/rightmost), tìm trong mảng xoay (rotated sorted array), tìm trên "không gian đáp án" (binary search on answer). Cốt lõi là xác định điều kiện thu hẹp khoảng tìm kiếm.

**Sorting Algorithms**

Các thuật toán O(n log n): quicksort (chia để trị quanh pivot, nhanh thực tế nhưng worst case O(n²)), mergesort (chia đôi rồi trộn, ổn định, worst case O(n log n) nhưng tốn O(n) bộ nhớ). Java: Arrays.sort cho primitive dùng dual-pivot quicksort, còn Arrays.sort/Collections.sort cho object dùng Timsort (ổn định, kết hợp merge + insertion). Chọn theo nhu cầu ổn định và bộ nhớ.

**Nhận diện bài DP**

Các tín hiệu của bài DP: "đếm số cách" (count ways to...), "giá trị nhỏ nhất/lớn nhất" (min/max), "có thể đạt tới không" (can reach / is possible), hoặc bài tối ưu trên dãy/lưới có lựa chọn lặp lại. Bước giải: (1) định nghĩa state (dp[i] nghĩa là gì); (2) tìm transition (công thức truy hồi từ state nhỏ hơn); (3) xác định base case; (4) thứ tự điền bảng. Định nghĩa state đúng là khó nhất.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```java
import java.util.*;

public class DpSearchSort {

    // Climbing Stairs — DP bottom-up, O(n) time, O(1) space
    public static int climbStairs(int n) {
        if (n <= 2) return n;
        int prev2 = 1, prev1 = 2;
        for (int i = 3; i <= n; i++) {
            int current = prev1 + prev2; // cách tới bậc i = i-1 + i-2
            prev2 = prev1;
            prev1 = current;
        }
        return prev1;
    }

    // Binary Search — O(log n)
    public static int binarySearch(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2; // tránh tràn số
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    // Coin Change — DP, số đồng tối thiểu để đủ amount, O(amount * coins)
    public static int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1); // "vô cực"
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int coin : coins) {
                if (coin <= a) {
                    dp[a] = Math.min(dp[a], dp[a - coin] + 1);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. **Climbing Stairs** (#70) — xác định state dp[i] = số cách lên bậc i, transition dp[i]=dp[i-1]+dp[i-2].
2. **House Robber** (#198) — state dp[i] = số tiền tối đa tới nhà i, transition max(dp[i-1], dp[i-2]+nums[i]).
3. **Binary Search** (#704) — viết đúng template, cẩn thận điều kiện left <= right.
4. **Coin Change** (#322) — state dp[a] = số đồng tối thiểu cho amount a, xử lý trường hợp không khả thi.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (7 câu)

**Dễ · Memoization vs Tabulation khác nhau thế nào?**

Memoization (top-down) là đệ quy có cache: bắt đầu từ bài lớn, đệ quy xuống bài con và lưu kết quả để khỏi tính lại. Code gần với cách tư duy tự nhiên, chỉ tính các state thực sự cần, nhưng tốn recursion stack. Tabulation (bottom-up) điền bảng bằng vòng lặp từ base case lên, tránh đệ quy nên không lo tràn stack và thường nhanh hơn chút, nhưng phải tính mọi state. Cả hai cùng độ phức tạp; chọn theo độ rõ ràng và rủi ro tràn stack.

**Dễ · Time complexity của các thuật toán sort phổ biến?**

Quicksort: trung bình O(n log n), worst case O(n²) khi pivot chọn tệ. Mergesort: luôn O(n log n), ổn định, tốn O(n) bộ nhớ. Heapsort: O(n log n), tại chỗ nhưng không ổn định. Insertion/Bubble/Selection sort: O(n²), chỉ tốt cho mảng nhỏ hoặc gần như đã sắp. Counting/Radix sort: O(n+k) khi giá trị trong khoảng hẹp. Timsort (Java object sort): O(n log n), tận dụng đoạn đã sắp sẵn nên rất nhanh trên dữ liệu thực.

**Trung · Làm sao nhận diện một bài là bài DP?**

Tìm các tín hiệu: bài hỏi "số cách" (count ways), "giá trị tối ưu" (min/max), "có khả thi không", hoặc tối ưu trên dãy/lưới với lựa chọn lặp lại. Kiểm tra hai điều kiện: overlapping subproblems (cùng bài con xuất hiện nhiều lần — nếu vẽ cây đệ quy thấy nhánh trùng) và optimal substructure (lời giải tối ưu cấu thành từ lời giải con tối ưu). Nếu chỉ cần lựa chọn greedy mà không cần xét lại thì có thể là greedy chứ không phải DP.

**Trung · Template chuẩn cho Binary Search là gì?**

Template phổ biến: left = 0, right = n-1; while (left <= right) { mid = left + (right-left)/2; nếu nums[mid] == target trả về mid; nếu nhỏ hơn target thì left = mid+1; ngược lại right = mid-1 }. Lưu ý: dùng left + (right-left)/2 thay vì (left+right)/2 để tránh tràn int; điều kiện vòng lặp là <= khi tìm chính xác. Với tìm biên trái/phải thì biến thể dùng < và thu hẹp khác để tìm ranh giới đầu tiên thỏa điều kiện.

**Trung · Cách tìm kiếm trong mảng đã sắp xếp bị xoay (rotated sorted array)?**

Vẫn dùng binary search O(log n) nhưng mỗi bước xác định nửa nào đang sắp đúng thứ tự. Tính mid, so sánh nums[left] với nums[mid]: nếu nums[left] <= nums[mid] thì nửa trái sorted, kiểm tra target có nằm trong [left, mid] không để quyết định đi trái hay phải; ngược lại nửa phải sorted, làm tương tự. Mấu chốt: luôn có ít nhất một nửa được sắp đúng tại mỗi bước, dùng nửa đó để loại trừ một nửa không gian tìm kiếm.

**Khó · Quicksort vs Mergesort — chọn cái nào?**

Quicksort thường nhanh hơn thực tế (cache-friendly, sort tại chỗ O(log n) space), nhưng worst case O(n²) và không ổn định — tốt cho sort mảng primitive trong bộ nhớ. Mergesort luôn O(n log n), ổn định (giữ thứ tự phần tử bằng nhau), nhưng tốn O(n) bộ nhớ phụ — tốt cho sort linked list, external sort (dữ liệu lớn hơn RAM), và khi cần tính ổn định. Java dùng dual-pivot quicksort cho primitive (không cần ổn định) và Timsort (biến thể mergesort) cho object (cần ổn định).

**Khó · Java sort hoạt động bên trong thế nào? Vì sao primitive và object khác nhau?**

Arrays.sort cho mảng primitive (int[], long[]...) dùng dual-pivot quicksort vì primitive không phân biệt được các giá trị bằng nhau → không cần ổn định, và quicksort nhanh, tại chỗ. Arrays.sort cho mảng object và Collections.sort dùng Timsort — biến thể mergesort kết hợp insertion sort, ổn định (quan trọng vì object có thể bằng nhau theo comparator nhưng khác identity, cần giữ thứ tự ban đầu). Timsort cũng tận dụng các "run" đã sắp sẵn trong dữ liệu thực để chạy gần O(n) khi dữ liệu gần như đã sắp.

### 🧠 Quiz Nhanh

1. Một bài toán phù hợp với Dynamic Programming khi nó có hai đặc tính nào?
   - [x] Overlapping subproblems và optimal substructure
   - [ ] Mảng đã sắp xếp và không trùng lặp
   - [ ] Đồ thị không trọng số và không chu trình
   - [ ] Dữ liệu tĩnh và truy vấn range
   💡 DP áp dụng khi các bài con lặp lại (overlapping) và lời giải tối ưu xây từ lời giải con tối ưu (optimal substructure).

2. Trong code Binary Search, vì sao tính `mid = left + (right - left) / 2` thay vì `(left + right) / 2`?
   - [ ] Để vòng lặp chạy nhanh hơn
   - [x] Để tránh tràn số (integer overflow) khi left + right quá lớn
   - [ ] Để kết quả luôn làm tròn lên
   - [ ] Để hỗ trợ mảng chưa sắp xếp
   💡 `left + right` có thể vượt giới hạn int; công thức `left + (right - left)/2` cho cùng kết quả mà an toàn.

3. Khác biệt chính giữa Memoization (top-down) và Tabulation (bottom-up) là gì?
   - [ ] Memoization luôn nhanh hơn và tốn ít bộ nhớ hơn
   - [ ] Tabulation dùng đệ quy, memoization dùng vòng lặp
   - [x] Memoization là đệ quy có cache; tabulation điền bảng bằng vòng lặp từ base case lên
   - [ ] Hai cách có độ phức tạp khác nhau hoàn toàn
   💡 Cả hai cùng độ phức tạp; memoization chỉ tính state thực sự cần nhưng tốn recursion stack, tabulation tránh tràn stack.

- **🧩 LeetCode:** #70 Climbing Stairs · #198 House Robber · #322 Coin Change · #704 Binary Search — Với mỗi bài DP, viết rõ định nghĩa state và công thức transition trước khi code.

- **🤖 AI Tools:** Nhờ AI "đố" bạn nhận diện một bài có phải DP không, rồi yêu cầu giải thích state + transition để AI chấm.

- **📚 Tài Nguyên:** NeetCode (1-D DP playlist), bài "Dynamic Programming Patterns" trên LeetCode Discuss để học theo dạng.

## ⚡ Ngày 5 · System Design fundamentals: scalability, load balancing, caching, DB

**24/07 — Thứ 6** · **LIGHT** · ⏱ 30 phút sáng + 1h tối

### 📖 Lý Thuyết Cốt Lõi

**Scalability**

Vertical scaling (scale up) là tăng tài nguyên một máy (CPU, RAM) — đơn giản nhưng có giới hạn vật lý và là single point of failure. Horizontal scaling (scale out) là thêm nhiều máy — gần như vô hạn, chịu lỗi tốt hơn, nhưng cần dịch vụ stateless (không lưu trạng thái phiên trên server) để request nào đi vào server nào cũng được. Load balancer phân phối request theo round-robin, least-connections, hoặc IP-hash.

**Caching**

Cache lưu kết quả hay dùng để giảm latency và tải lên DB. Các tầng: CDN (cache nội dung tĩnh gần người dùng), application cache (Redis/Memcached cho dữ liệu nóng), browser cache. Chiến lược: cache-aside (app tự đọc cache, miss thì query DB rồi nạp lại), read-through, write-through/write-back. Quan trọng: cache invalidation (làm mới/xóa khi dữ liệu đổi) và đặt TTL hợp lý để tránh phục vụ dữ liệu cũ.

**Database Scaling**

Replication (master-slave): ghi vào master, đọc từ nhiều replica → tăng throughput đọc và sẵn sàng cao. Sharding/partitioning: chia dữ liệu theo key (hash hoặc range) sang nhiều DB để vượt giới hạn một máy. SQL (ACID, quan hệ chặt, join mạnh) vs NoSQL (linh hoạt schema, scale ngang dễ, eventual consistency). Indexing tăng tốc đọc nhưng làm chậm ghi và tốn bộ nhớ — cần cân nhắc.

**Cách tiếp cận System Design**

Quy trình chuẩn: (1) Làm rõ yêu cầu — functional (chức năng) và non-functional (scale, latency, availability); (2) Ước lượng quy mô — QPS, dung lượng lưu trữ, băng thông; (3) Thiết kế high-level — vẽ các thành phần chính (client, LB, app, cache, DB, queue); (4) Đi sâu vào điểm quan trọng (API, schema, thuật toán); (5) Xác định bottleneck và bàn trade-off. Không có đáp án đúng tuyệt đối — quan trọng là lập luận trade-off rõ ràng.

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```text
Kiến trúc một web app có khả năng mở rộng (read-heavy)

                         [ Clients / Browsers / Mobile ]
                                      |
                                 (HTTPS)
                                      |
                         +------------------------+
                         |     Load Balancer      |   round-robin / least-conn
                         +------------------------+
                            /         |          \
                           /          |           \
                  [App Server 1] [App Server 2] [App Server 3]   <-- stateless
                           \          |           /
                            \         |          /
                          +------------------------+
                          |   Cache (Redis)        |   <-- cache-aside, TTL
                          +------------------------+
                                      | (cache miss)
                          +------------------------+
                          |   Primary DB (master)  |   <-- nhận ghi (writes)
                          +------------------------+
                            /                    \
                  [Read Replica 1]        [Read Replica 2]   <-- phục vụ đọc

Luồng đọc: Client -> LB -> App -> Cache (hit? trả ngay) -> miss -> Read Replica -> nạp cache
Luồng ghi: Client -> LB -> App -> Primary DB -> replicate sang replicas -> invalidate cache
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Vẽ kiến trúc cho một ứng dụng đọc nhiều (read-heavy): chỉ rõ load balancer, app server stateless, cache, primary DB + read replicas.
2. Liệt kê các tầng caching từ client tới DB (browser cache, CDN, application cache, DB query cache) và vai trò từng tầng.
3. Giải thích trade-off giữa horizontal và vertical scaling, kèm ví dụ khi nào chọn cái nào.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (5 câu)

**Dễ · Horizontal vs Vertical scaling khác nhau thế nào?**

Vertical scaling (scale up) là nâng cấp tài nguyên một máy (CPU, RAM, đĩa) — triển khai đơn giản, không cần đổi kiến trúc, nhưng có trần phần cứng và là single point of failure. Horizontal scaling (scale out) là thêm nhiều máy chạy song song sau load balancer — gần như mở rộng vô hạn, chịu lỗi tốt (một máy chết vẫn còn máy khác), nhưng phức tạp hơn vì cần dịch vụ stateless và đồng bộ dữ liệu. Hệ thống lớn thường kết hợp cả hai nhưng ưu tiên scale ngang.

**Dễ · Vì sao dịch vụ nên stateless để scale ngang?**

Stateless nghĩa là server không lưu trạng thái phiên (session) cục bộ giữa các request. Nhờ đó load balancer có thể gửi request bất kỳ tới server bất kỳ mà không cần "dính" người dùng vào một server (sticky session). Điều này cho phép thêm/bớt server tự do, phục hồi nhanh khi một máy chết, và phân tải đều. Trạng thái cần lưu (session, giỏ hàng) được đẩy ra kho dùng chung như Redis hoặc DB, không nằm trên app server.

**Trung · Các chiến lược caching phổ biến là gì?**

Cache-aside (lazy loading): app kiểm tra cache, miss thì query DB rồi tự nạp vào cache — phổ biến nhất, đơn giản nhưng lần miss đầu chậm. Read-through: cache tự load từ DB khi miss. Write-through: ghi đồng thời vào cache và DB → nhất quán nhưng chậm ghi. Write-back: ghi vào cache trước, đồng bộ DB sau → nhanh nhưng rủi ro mất dữ liệu. Mọi chiến lược đều phải giải quyết cache invalidation và đặt TTL để cân bằng giữa độ tươi của dữ liệu và hiệu năng.

**Trung · SQL vs NoSQL — chọn loại nào và khi nào?**

SQL (PostgreSQL, MySQL): schema cố định, quan hệ chặt, giao dịch ACID, join mạnh — phù hợp dữ liệu có cấu trúc rõ, cần nhất quán mạnh (ngân hàng, đặt vé). NoSQL (MongoDB, Cassandra, DynamoDB): schema linh hoạt, scale ngang dễ, throughput cao, thường eventual consistency — phù hợp dữ liệu lớn, đa dạng, cần ghi nhanh (log, feed, IoT). Chọn dựa vào: tính nhất quán cần thiết, mô hình truy vấn, và yêu cầu scale. Nhiều hệ thống dùng cả hai (polyglot persistence).

**Khó · Tiếp cận một câu hỏi System Design trong phỏng vấn thế nào?**

Theo khung 5 bước: (1) Làm rõ yêu cầu — hỏi chức năng cốt lõi và non-functional (số người dùng, tỉ lệ đọc/ghi, latency, availability); (2) Ước lượng quy mô — tính QPS, dung lượng lưu trữ, băng thông để định cỡ hệ thống; (3) Thiết kế high-level — vẽ các khối chính (client, LB, app stateless, cache, DB, queue, CDN); (4) Đi sâu — chi tiết API, schema DB, thuật toán key (encoding, sharding); (5) Bàn bottleneck & trade-off — single point of failure, consistency vs availability, cách mở rộng tiếp. Luôn nói rõ giả định và đánh đổi, đừng cố tìm "đáp án đúng duy nhất".

### 🧠 Quiz Nhanh

1. Vì sao dịch vụ (service) nên stateless để hỗ trợ horizontal scaling?
   - [ ] Vì stateless server tự động sắp xếp dữ liệu nhanh hơn
   - [x] Vì load balancer có thể gửi request bất kỳ tới server bất kỳ mà không cần sticky session
   - [ ] Vì stateless giúp DB ghi nhanh hơn
   - [ ] Vì stateless loại bỏ nhu cầu dùng cache
   💡 Không lưu trạng thái cục bộ nên có thể thêm/bớt server tự do; trạng thái cần lưu được đẩy ra Redis/DB dùng chung.

2. Chiến lược caching nào được mô tả là phổ biến nhất: app kiểm tra cache, nếu miss thì query DB rồi tự nạp lại vào cache?
   - [ ] Write-through
   - [ ] Write-back
   - [x] Cache-aside (lazy loading)
   - [ ] Read-through
   💡 Cache-aside đơn giản và phổ biến nhất, chỉ có lần miss đầu là chậm; vẫn phải xử lý cache invalidation và TTL.

3. Đặc điểm nào sau đây đúng với horizontal scaling (scale out) so với vertical scaling?
   - [x] Thêm nhiều máy chạy song song, chịu lỗi tốt hơn nhưng cần dịch vụ stateless
   - [ ] Nâng cấp CPU/RAM của một máy, đơn giản nhưng là single point of failure
   - [ ] Luôn rẻ hơn và không cần load balancer
   - [ ] Chỉ áp dụng được cho database, không cho app server
   💡 Scale out mở rộng gần như vô hạn và chịu lỗi tốt; scale up (vertical) tăng tài nguyên một máy nhưng có trần phần cứng.

- **🧩 LeetCode:** #155 Min Stack · #146 LRU Cache (ôn lại — liên quan caching) — LRU Cache là nền tảng của application cache — hiểu HashMap + doubly linked list để đạt O(1).

- **🤖 AI Tools:** Nhờ AI đóng vai interviewer hỏi "Design a scalable read-heavy service" rồi phản biện thiết kế của bạn từng bước.

- **📚 Tài Nguyên:** System Design Primer (GitHub donnemartin), kênh ByteByteGo (Alex Xu) — sơ đồ trực quan, dễ nhớ.

## 🔥 Ngày 6 · System Design case study: URL shortener / rate limiter / news feed

**25/07 — Thứ 7** · **WEEKEND** · ⏱ 4h (sáng + chiều)

### 📖 Lý Thuyết Cốt Lõi

**Design URL Shortener**

Chuyển URL dài thành mã ngắn: sinh ID duy nhất rồi mã hóa base62 (a-z, A-Z, 0-9) cho mã gọn (7 ký tự ≈ 3.5 nghìn tỉ tổ hợp). Schema: bảng map short_code → long_url. Hệ thống read-heavy → đặt Redis cache trước DB. Xử lý va chạm (collision) bằng counter toàn cục hoặc kiểm tra tồn tại. Khi redirect: dùng 301 (permanent, cache mạnh nhưng khó đổi) hay 302 (temporary, dễ đổi và đếm click).

**Design Rate Limiter**

Giới hạn số request mỗi client trong khoảng thời gian. Thuật toán: token bucket (nạp token đều, mỗi request tiêu một token, cho phép burst), leaky bucket (xử lý đều như rò rỉ), fixed/sliding window counter. Triển khai phân tán dùng Redis (lưu counter/token theo key client, atomic với INCR/Lua script). Đặt ở API gateway hoặc middleware. Trả về HTTP 429 Too Many Requests khi vượt hạn.

**Design News Feed**

Hai mô hình: push (fanout-on-write — khi user đăng, đẩy ngay vào feed của tất cả follower; đọc nhanh nhưng tốn ghi, kém với người nổi tiếng nhiều follower) và pull (fanout-on-read — gom bài khi user mở feed; ghi nhẹ nhưng đọc chậm). Thực tế dùng hybrid: push cho user thường, pull cho celebrity. Cần cache feed, phân trang (pagination bằng cursor), và xếp hạng nội dung.

**Building Blocks Chung**

Các khối lặp lại trong mọi thiết kế: load balancer (phân tải, health check), message queue như Kafka/RabbitMQ (tách xử lý bất đồng bộ, đệm tải, decouple service), cache Redis (giảm latency), CDN (nội dung tĩnh gần người dùng), DB sharding (chia dữ liệu), và consistent hashing (phân phối key sang node sao cho thêm/bớt node ít phải di chuyển dữ liệu — quan trọng cho cache và sharding phân tán).

### 💻 Code Mẫu — Gõ Tay, Không Copy-Paste

```text
THIẾT KẾ URL SHORTENER

API:
  POST /shorten   body: { longUrl }        -> { shortUrl }
  GET  /{code}                              -> 302 redirect to longUrl

Schema (urls):
  id          BIGINT  PK AUTO_INCREMENT
  short_code  VARCHAR(7) UNIQUE  (base62 của id)
  long_url    TEXT
  created_at  TIMESTAMP
  click_count BIGINT

Luồng tạo (write):
  1. Nhận longUrl -> sinh id duy nhất (auto increment / counter dịch vụ)
  2. short_code = base62Encode(id)
  3. Lưu (id, short_code, long_url) vào DB
  4. Trả về domain + short_code

Luồng truy cập (read, chiếm đa số):
  1. GET /{code} -> kiểm tra Redis cache
  2. Cache hit  -> 302 redirect ngay
  3. Cache miss -> query DB theo short_code -> nạp cache (TTL) -> redirect

Mở rộng: Load Balancer -> app stateless -> Redis cache -> DB (replica đọc).
Trade-off: 301 (cache mạnh, không đếm được click) vs 302 (đếm được click).

RATE LIMITER — TOKEN BUCKET (pseudo-logic)
  Mỗi client có 1 bucket: { tokens, lastRefill }
  Khi request đến:
    now = currentTime
    tokensToAdd = (now - lastRefill) * refillRatePerSecond
    tokens = min(capacity, tokens + tokensToAdd)
    lastRefill = now
    nếu tokens >= 1: tokens -= 1; CHO PHÉP
    ngược lại:        TỪ CHỐI (HTTP 429)
  Phân tán: lưu bucket trong Redis theo key = clientId, dùng Lua script atomic.
```

```java
// Token Bucket Rate Limiter đơn giản (single-node, thread-safe)
public class TokenBucketRateLimiter {

    private final long capacity;        // số token tối đa
    private final double refillPerSec;  // token nạp mỗi giây
    private double tokens;
    private long lastRefillNanos;

    public TokenBucketRateLimiter(long capacity, double refillPerSec) {
        this.capacity = capacity;
        this.refillPerSec = refillPerSec;
        this.tokens = capacity;
        this.lastRefillNanos = System.nanoTime();
    }

    public synchronized boolean allowRequest() {
        refill();
        if (tokens >= 1.0) {
            tokens -= 1.0;
            return true;   // cho phép
        }
        return false;      // từ chối -> HTTP 429
    }

    private void refill() {
        long now = System.nanoTime();
        double elapsedSec = (now - lastRefillNanos) / 1_000_000_000.0;
        double added = elapsedSec * refillPerSec;
        if (added > 0) {
            tokens = Math.min(capacity, tokens + added);
            lastRefillNanos = now;
        }
    }
}
```

### ✍️ Bài Tập Thực Hành (4 bài)

1. Thiết kế URL shortener end-to-end: API, schema, mã hóa base62, cache, redirect 301/302 — viết ra giấy hoặc gõ.
2. Thiết kế rate limiter dùng token bucket: nêu cấu trúc bucket, công thức refill, cách phân tán bằng Redis.
3. Ước lượng quy mô: giả sử 100 triệu URL mới/ngày, tính QPS write, QPS read (read:write = 100:1), dung lượng lưu trữ 5 năm.
4. Vẽ kiến trúc tổng cho URL shortener: client → LB → app → cache → DB + replica, chú thích luồng đọc/ghi.

### 🎤 Câu Hỏi Phỏng Vấn — Dễ → Khó (8 câu)

**Dễ · Hãy thiết kế tổng quan một URL shortener.**

Hai API chính: POST /shorten (nhận URL dài, trả mã ngắn) và GET /{code} (redirect về URL gốc). Sinh ID duy nhất rồi mã hóa base62 thành mã ngắn ~7 ký tự. Lưu map short_code → long_url trong DB. Vì hệ thống read-heavy (truy cập nhiều hơn tạo), đặt Redis cache trước DB và dùng read replica. Front bằng load balancer + app server stateless. Quyết định 301 (permanent) hay 302 (temporary) cho redirect tùy nhu cầu đếm click.

**Dễ · Tại sao dùng base62 encoding cho mã ngắn?**

Base62 dùng 62 ký tự an toàn cho URL: a-z (26) + A-Z (26) + 0-9 (10). So với base10 (chỉ số), base62 cho mã ngắn hơn nhiều cho cùng một dải giá trị — chỉ 7 ký tự đã biểu diễn được ~62⁷ ≈ 3.5 nghìn tỉ URL khác nhau. Ngắn gọn, dễ gõ, không chứa ký tự đặc biệt cần escape trong URL. Có thể mã hóa trực tiếp từ ID tự tăng của DB, đảm bảo duy nhất và tránh va chạm.

**Trung · Các thuật toán rate limiting phổ biến?**

Token bucket: nạp token đều, mỗi request tiêu một token, cho phép burst tới dung lượng bucket — linh hoạt, phổ biến nhất. Leaky bucket: xử lý request đều như nước rò rỉ, làm mượt traffic nhưng không cho burst. Fixed window counter: đếm request trong cửa sổ cố định (mỗi phút) — đơn giản nhưng có vấn đề biên (burst gấp đôi ở ranh giới cửa sổ). Sliding window log/counter: theo dõi mượt hơn theo cửa sổ trượt, chính xác hơn nhưng tốn bộ nhớ hơn.

**Trung · Token bucket vs sliding window — khác nhau thế nào?**

Token bucket cho phép burst: nếu client không dùng hết token tích lũy, có thể gửi một loạt request liền cho tới khi cạn token — tốt khi muốn cho phép spike ngắn. Sliding window counter giới hạn chặt theo cửa sổ thời gian trượt, không cho burst vượt mức, mượt và chính xác hơn ở biên so với fixed window. Token bucket nhẹ và phổ biến trong API gateway; sliding window chính xác hơn nhưng tốn bộ nhớ lưu timestamp/counter nhiều cửa sổ con.

**Trung · News feed: push vs pull model?**

Push (fanout-on-write): khi user đăng bài, đẩy ngay vào feed (cache) của mọi follower — đọc feed cực nhanh, nhưng tốn ghi và bùng nổ với người có hàng triệu follower (celebrity problem). Pull (fanout-on-read): gom bài từ những người được follow khi user mở feed — ghi nhẹ, nhưng đọc chậm và tốn tính toán mỗi lần. Giải pháp hybrid: push cho user thường, pull cho celebrity, rồi trộn khi hiển thị — cân bằng giữa tốc độ đọc và chi phí ghi.

**Khó · Consistent hashing là gì và giải quyết vấn đề gì?**

Với modulo hashing thông thường (hash(key) % N), khi thêm/bớt một node thì N đổi, làm hầu hết key bị ánh xạ lại → di chuyển dữ liệu khổng lồ. Consistent hashing đặt cả node và key lên một vòng tròn băm (hash ring); key thuộc về node đầu tiên theo chiều kim đồng hồ. Khi thêm/bớt node, chỉ các key giữa node đó và node kế bị di chuyển — trung bình K/N key thay vì gần như toàn bộ. Dùng virtual nodes để phân phối đều hơn. Cốt lõi cho phân tán cache (Redis cluster) và sharding DB.

**Mock EN · Explain a key trade-off in your URL shortener design (in English).**

*"One major trade-off is between 301 and 302 redirects. A 301 permanent redirect lets browsers and CDNs cache the mapping aggressively, which reduces load on our servers and gives the fastest redirect — but it means we lose visibility into click analytics because subsequent requests never reach our backend. A 302 temporary redirect forces every request to hit our service, so we can count clicks and update the destination, but it adds load and latency. If analytics matter, I'd choose 302 and put a Redis cache in front to keep the backend fast. Otherwise 301 is better for pure performance."*

**Mock EN · When would you introduce a message queue, and what trade-offs does it bring? (in English)**

*"I'd introduce a message queue like Kafka when I need to decouple producers from consumers and process work asynchronously — for example, sending notifications, processing uploads, or fanning out a post to millions of feeds. The queue absorbs traffic spikes, so a slow downstream service doesn't block the user-facing request, and it improves resilience because messages persist if a consumer is down. The trade-offs are added operational complexity, eventual consistency instead of immediate results, and the need to handle duplicate or out-of-order messages with idempotent consumers. So I'd only add it when the asynchronous decoupling clearly outweighs that extra complexity."*

### 🧠 Quiz Nhanh

1. Vì sao dùng base62 encoding cho mã ngắn trong thiết kế URL shortener?
   - [ ] Vì base62 cho phép lưu trữ URL không giới hạn độ dài
   - [ ] Vì base62 tự động chống va chạm (collision)
   - [x] Vì 62 ký tự (a-z, A-Z, 0-9) cho mã ngắn hơn nhiều cho cùng dải giá trị và an toàn trong URL
   - [ ] Vì base62 mã hóa được cả ký tự đặc biệt cần escape
   💡 Chỉ 7 ký tự base62 đã biểu diễn ~62⁷ ≈ 3.5 nghìn tỉ URL; ngắn gọn, dễ gõ, không cần escape.

2. Trong thuật toán token bucket cho rate limiter, điều gì xảy ra khi bucket không còn token?
   - [ ] Request được xếp hàng đợi xử lý sau
   - [x] Request bị từ chối, trả về HTTP 429 Too Many Requests
   - [ ] Bucket tự động tăng gấp đôi dung lượng
   - [ ] Request được chuyển sang server khác
   💡 Mỗi request tiêu một token; hết token thì từ chối với 429, cho tới khi token được nạp lại theo refill rate.

3. Đặc điểm nào đúng với mô hình push (fanout-on-write) trong thiết kế News Feed?
   - [ ] Đọc feed chậm, ghi nhẹ, tốt cho celebrity nhiều follower
   - [x] Đọc feed cực nhanh nhưng tốn ghi và bùng nổ với người có hàng triệu follower
   - [ ] Gom bài khi user mở feed, không cần cache
   - [ ] Không bao giờ dùng kết hợp với pull
   💡 Push đẩy bài vào feed mọi follower khi đăng (đọc nhanh, ghi nặng); thực tế dùng hybrid: push cho user thường, pull cho celebrity.

- **🧩 LeetCode:** #359 Logger Rate Limiter · #1146 Snapshot Array (Medium) — Logger Rate Limiter luyện tư duy giới hạn theo thời gian — liên hệ thẳng tới thiết kế rate limiter.

- **🤖 AI Tools:** Cho AI đóng vai system design interviewer: yêu cầu nó hỏi follow-up và phản biện trade-off thiết kế của bạn theo thời gian thực.

- **📚 Tài Nguyên:** ByteByteGo (Alex Xu — System Design Interview vol.1 & 2), Grokking the System Design Interview.

## 🎯 Ngày 7 · Spaced Review T1-T11 + Demo Project hoàn thiện + chuẩn bị portfolio

**26/07 — CN** · **REVIEW** · ⏱ 4h (ôn tập + project)

### 📖 Lý Thuyết Cốt Lõi (Review T1-T11)

**Recap Algorithm Patterns**

Ôn lại các pattern cốt lõi đã học tuần này: two pointers (mảng sorted, palindrome), sliding window (subarray/substring liên tiếp), BFS/DFS (cây và đồ thị — shortest path vs khám phá sâu), dynamic programming (overlapping subproblems + optimal substructure). Với mỗi pattern, nhớ tín hiệu nhận diện và một bài đại diện để gợi nhớ nhanh trong phỏng vấn.

**Big-O Analysis**

Tự tin phân tích cả time và space cho mọi lời giải. Nhớ các bậc: O(1), O(log n) chia đôi, O(n) duyệt một lần, O(n log n) sort, O(n²) hai vòng lồng, O(2ⁿ) đệ quy mũ. Đừng quên recursion stack vào space, và phân biệt average vs worst case (HashMap), amortized (ArrayList add). Luôn nêu độ phức tạp sau khi code xong.

**System Design Fundamentals**

Ôn khung tiếp cận: làm rõ yêu cầu → ước lượng quy mô → high-level design → đi sâu → bàn trade-off. Nhớ các khối: load balancer, app stateless, cache (Redis, cache-aside), DB (replication, sharding), message queue, CDN, consistent hashing. Nắm trade-off chính: SQL vs NoSQL, push vs pull feed, vertical vs horizontal scaling, consistency vs availability.

**Portfolio Preparation**

Chuẩn bị bằng chứng năng lực: GitHub README chuyên nghiệp (mô tả, kiến trúc, tính năng, hướng dẫn cài đặt, ảnh chụp màn hình), showcase demo project nổi bật ngay đầu profile, và CV/LinkedIn cập nhật với từ khóa kỹ thuật khớp JD (Spring Boot, REST API, JPA, Redis, Docker, JWT). Demo project chạy được là tài sản mạnh nhất khi nộp đơn.

### 💻 Code Mẫu — Demo Project Capstone (Portfolio Centerpiece)

```java
/*
 * DEMO PROJECT CAPSTONE — Full-stack Spring Boot (tổng hợp tuần 4-9)
 * Stack: Spring Boot REST + Spring Data JPA + Redis cache + Spring AI
 *        + Spring Security (JWT) + Docker. Đây là tâm điểm portfolio.
 *
 * Kiến trúc: Controller -> Service -> Repository (JPA) + RedisCache + AiClient
 */
import org.springframework.web.bind.annotation.*;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    // JWT-secured endpoint: chỉ user đã xác thực mới gọi được
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ArticleResponse getArticle(@PathVariable Long id) {
        return articleService.getById(id);
    }

    @PreAuthorize("hasRole('AUTHOR')")
    @PostMapping
    public ArticleResponse create(@RequestBody @jakarta.validation.Valid CreateArticleRequest req) {
        return articleService.create(req);
    }

    // Tóm tắt bài viết bằng Spring AI (tính năng AI nổi bật của project)
    @GetMapping("/{id}/summary")
    public String summarize(@PathVariable Long id) {
        return articleService.summarizeWithAi(id);
    }
}

@org.springframework.stereotype.Service
class ArticleService {

    private final ArticleRepository repository;   // Spring Data JPA
    private final AiSummarizer aiSummarizer;       // Spring AI client

    ArticleService(ArticleRepository repository, AiSummarizer aiSummarizer) {
        this.repository = repository;
        this.aiSummarizer = aiSummarizer;
    }

    // Redis cache: lần đầu query DB, các lần sau lấy từ cache (cache-aside)
    @Cacheable(value = "articles", key = "#id")
    public ArticleResponse getById(Long id) {
        Article entity = repository.findById(id)
                .orElseThrow(() -> new ArticleNotFoundException(id));
        return ArticleResponse.from(entity);
    }

    public ArticleResponse create(CreateArticleRequest req) {
        Article saved = repository.save(req.toEntity());
        return ArticleResponse.from(saved);
    }

    public String summarizeWithAi(Long id) {
        ArticleResponse article = getById(id);
        return aiSummarizer.summarize(article.content()); // gọi LLM tóm tắt
    }
}
```

### ✍️ Bài Tập Thực Hành (3 bài)

1. Hoàn thiện demo project + viết README tiếng Anh đầy đủ: kiến trúc (diagram), danh sách tính năng, hướng dẫn setup (Docker compose), và ảnh chụp màn hình demo.
2. Chuẩn bị 3 câu chuyện STAR (Situation–Task–Action–Result): một về thử thách kỹ thuật, một về làm việc nhóm, một về học công nghệ mới — viết ra và tập kể bằng tiếng Anh.
3. Cập nhật CV và LinkedIn: thêm demo project, liệt kê skills khớp JD (Java, Spring Boot, REST, JPA, Redis, Docker, JWT, SQL), và link GitHub.

### 🎤 Câu Hỏi Phỏng Vấn — REVIEW: Algorithms + System Design + Portfolio (10 câu)

**Dễ · Khi nào dùng Two Pointers?**

Dùng khi mảng đã sắp xếp và cần tìm cặp/bộ thỏa điều kiện tổng, khi cần so sánh từ hai đầu vào trong (palindrome), hoặc xử lý in-place với fast/slow pointer (xóa trùng, phát hiện chu trình linked list). Giảm O(n²) xuống O(n) mà không tốn thêm bộ nhớ đáng kể.

**Dễ · BFS vs DFS — chọn cái nào?**

BFS (queue) cho đường đi ngắn nhất trong đồ thị không trọng số và xử lý theo tầng. DFS (đệ quy/stack) cho khám phá toàn bộ đường đi, phát hiện chu trình, topological sort, bài toán cây từ dưới lên. BFS tốn bộ nhớ theo độ rộng, DFS theo độ sâu.

**Trung · Làm sao nhận diện một bài DP?**

Tìm tín hiệu "đếm số cách", "tối ưu min/max", "có khả thi không", và kiểm tra hai điều kiện: overlapping subproblems (bài con lặp lại) + optimal substructure (lời giải tối ưu xây từ con tối ưu). Sau đó định nghĩa state, tìm transition, xác định base case rồi điền bảng (tabulation) hoặc cache đệ quy (memoization).

**Trung · Phân tích Big-O cần lưu ý gì?**

Phân tích cả time và space, xét worst case, bỏ hằng số/bậc thấp. Đừng quên recursion stack vào space (O(h) cho DFS). Phân biệt average vs worst case (HashMap O(1) trung bình, O(log n) worst từ Java 8) và amortized (ArrayList add O(1) amortized dù resize O(n)). Luôn nêu độ phức tạp ngay sau khi trình bày lời giải.

**Trung · Cách tiếp cận một câu hỏi System Design?**

Theo 5 bước: làm rõ yêu cầu (functional + non-functional) → ước lượng quy mô (QPS, storage) → thiết kế high-level (LB, app stateless, cache, DB, queue) → đi sâu (API, schema, thuật toán) → bàn bottleneck & trade-off. Không tìm đáp án đúng duy nhất, mà trình bày trade-off và giả định rõ ràng.

**Trung · Caching giúp gì và có rủi ro gì?**

Cache giảm latency và tải lên DB bằng cách lưu dữ liệu nóng (Redis, CDN). Chiến lược phổ biến: cache-aside. Rủi ro chính là cache invalidation — dữ liệu cũ (stale) khi nguồn thay đổi; giải quyết bằng TTL hợp lý, xóa/cập nhật cache khi ghi, và chấp nhận eventual consistency cho dữ liệu ít nhạy cảm. Cũng cần xử lý cache stampede khi nhiều request cùng miss một lúc.

**Khó · Scalability: vì sao stateless services quan trọng cho horizontal scaling?**

Khi server stateless, mọi request có thể đi tới bất kỳ server nào mà không cần sticky session. Điều này cho phép load balancer phân tải đều, thêm/bớt server tự do (auto-scaling), và phục hồi nhanh khi một máy chết vì không mất trạng thái cục bộ. Trạng thái cần lưu (session, cache) được đẩy ra kho dùng chung như Redis hay DB. Nếu server giữ state cục bộ thì không thể scale ngang an toàn vì request phải dính vào đúng máy chứa state đó.

**Khó · Demo project của bạn xử lý concurrency và caching ra sao?**

Project dùng Redis làm application cache theo mô hình cache-aside qua @Cacheable: lần đầu query DB rồi nạp cache, các lần sau đọc từ cache O(1). Khi ghi/cập nhật thì evict cache (@CacheEvict) để tránh dữ liệu cũ. Về concurrency, Spring quản lý connection pool tới DB, JPA dùng optimistic locking (@Version) để xử lý cập nhật đồng thời, và các endpoint stateless cho phép scale ngang sau load balancer. JWT lưu state xác thực ở client nên server không giữ session, phù hợp scale-out.

**Mock EN · Tell me about your demo project (in English).**

*"I built a full-stack REST API with Spring Boot. It uses Spring Data JPA for persistence, Redis as a cache-aside layer to cut database load on hot reads, and Spring Security with JWT for stateless authentication. I also integrated Spring AI to summarize content using an LLM. The whole thing is containerized with Docker so it runs with a single compose command. The most interesting challenge was managing cache invalidation — I used @CacheEvict on writes and a sensible TTL so users never see stale data while still getting fast reads. The code is on my GitHub with a detailed README and architecture diagram."*

**Mock EN · How would you design a rate limiter for your API? (in English)**

*"I'd use a token bucket algorithm. Each client gets a bucket with a fixed capacity that refills at a steady rate; every request consumes one token, and when the bucket is empty I return HTTP 429. This allows short bursts while enforcing an average limit. For a distributed setup across multiple app servers, I'd store each client's bucket state in Redis and update it atomically with a Lua script so concurrent requests don't race. I'd put the limiter at the API gateway layer so it protects all downstream services. The main trade-off is between allowing bursts — which token bucket handles well — versus the stricter smoothing of a sliding window, which I'd pick if I needed tighter control."*

### 🧠 Quiz Nhanh

1. Khi phân tích Big-O space của một thuật toán DFS đệ quy trên cây, ta KHÔNG được quên yếu tố nào?
   - [ ] Kích thước mảng đầu vào
   - [x] Recursion stack — O(h) với h là chiều cao cây
   - [ ] Số cạnh của đồ thị
   - [ ] Hằng số nhân bậc cao nhất
   💡 Recursion stack là phần space ẩn dễ bị bỏ sót: O(log n) cho cây cân bằng, O(n) cho cây lệch.

2. Theo khung tiếp cận System Design 5 bước, bước nào đến NGAY SAU khi đã làm rõ yêu cầu?
   - [ ] Bàn bottleneck và trade-off
   - [ ] Thiết kế high-level (vẽ các khối)
   - [x] Ước lượng quy mô (QPS, storage, băng thông)
   - [ ] Đi sâu vào API và schema
   💡 Thứ tự: làm rõ yêu cầu → ước lượng quy mô → high-level design → đi sâu → bàn trade-off.

3. Trong demo project, kỹ thuật nào được dùng để tránh phục vụ dữ liệu cũ (stale) khi có ghi/cập nhật?
   - [ ] Tăng TTL cache lên vô hạn
   - [ ] Tắt cache hoàn toàn khi ghi
   - [x] Evict cache bằng `@CacheEvict` khi ghi/cập nhật, kết hợp TTL hợp lý
   - [ ] Lưu session trên app server thay vì client
   💡 Mô hình cache-aside qua `@Cacheable` đọc nhanh, còn `@CacheEvict` khi ghi đảm bảo dữ liệu không bị cũ.

- **🧩 LeetCode:** Mixed review set — làm lại 3 bài khó nhất trong tuần (DP / graph / monotonic stack) — Giải lại không nhìn lời giải cũ, nói to approach, đo thời gian như phỏng vấn thật.

- **🤖 AI Tools:** Nhờ AI review README và CV của bạn: hỏi "JD này yêu cầu skill gì, CV của tôi còn thiếu từ khóa nào?" để tinh chỉnh.

- **📚 Tài Nguyên:** Bài viết "How to write a great GitHub README", mẫu resume cho dev (resume.io), và checklist portfolio software engineer.

## 🎯 Tổng Kết Tuần 11

### 📋 Ngân Hàng Câu Hỏi Phỏng Vấn

*Ôn lại cuối tuần — trả lời to ra, ghi âm, nghe lại.*

**Algorithm Patterns**

- **Q: When do you use two pointers versus a sliding window?**  
  A: I use two pointers on a sorted array or when comparing elements from both ends — like Two Sum II or checking a palindrome. I use a sliding window for problems about a contiguous subarray or substring, where I expand the right edge and shrink the left to keep a condition valid — like the longest substring without repeating characters. Both turn an O(n squared) brute force into O(n).
- **Q: When do you choose BFS over DFS?**  
  A: I choose BFS with a queue when I need the shortest path in an unweighted graph or level-by-level processing, because it explores the closest nodes first. I choose DFS — recursive or with a stack — when I need to explore all paths, detect cycles, or do a topological sort. BFS uses memory proportional to the graph's width; DFS to its depth.
- **Q: How do you recognize a dynamic programming problem?**  
  A: I look for signals like counting the number of ways, optimizing a min or max, or asking whether something is reachable. Then I check two properties: overlapping subproblems and optimal substructure. If both hold, I define the state, find the transition from smaller states, set the base case, and either memoize the recursion or fill a table bottom-up.

**Complexity & Data Structures**

- **Q: How do you analyze the Big-O of a solution?**  
  A: I analyze both time and space for the worst case, drop constants and lower-order terms, and remember to include the recursion stack in space — that's O(h) for a tree DFS. I also distinguish average versus worst case, like HashMap being O(1) on average, and amortized cost, like ArrayList add being O(1) amortized even though a resize is O(n).
- **Q: Why are HashMap operations O(1) on average?**  
  A: A hash function maps each key to a bucket, so get, put, and remove go straight to that bucket in constant time when keys are well distributed. The worst case is O(n) if many keys collide into one bucket, but since Java 8 a heavily loaded bucket converts to a balanced tree, making the worst case O(log n). With a good hashCode, we treat it as O(1) in practice.
- **Q: How do you choose the right data structure for a problem?**  
  A: I match the access pattern to the structure. If I need fast lookups or membership checks, I use a HashMap or HashSet. If I need LIFO order — like matching parentheses — I use a stack; for FIFO or BFS, a queue. For ordered data with range queries I use a sorted structure or TreeMap, and for priority access I use a heap. I pick based on which operations dominate and their complexity.

**System Design**

- **Q: How do you approach a system design interview?**  
  A: I follow five steps: clarify functional and non-functional requirements, estimate scale like QPS and storage, sketch a high-level design with load balancer, stateless app servers, cache, database, and queue, then dive into the key parts like the API and data schema, and finally discuss bottlenecks and trade-offs. There's no single right answer — what matters is reasoning clearly about the trade-offs.
- **Q: What caching strategies do you know?**  
  A: The most common is cache-aside, where the app checks the cache, and on a miss queries the database and loads the result back. There's also read-through, write-through, and write-back. The hard part is cache invalidation — I use a sensible TTL and evict or update the cache on writes to avoid serving stale data, accepting eventual consistency where it's acceptable.
- **Q: Why are stateless services important for horizontal scaling?**  
  A: When servers are stateless, any request can go to any server without sticky sessions, so the load balancer spreads traffic evenly and I can add or remove servers freely for auto-scaling. If a server dies, no local state is lost. I push shared state like sessions into Redis or the database. Stateful servers can't scale out safely because requests would have to stick to the one machine holding their state.

### ✅ Checklist Cuối Tuần

- [ ] Thành thạo Two Pointers + Sliding Window (nhận diện và áp dụng đúng dạng bài).
- [ ] Nắm vững các pattern HashMap/HashSet + Stack/Queue (frequency, grouping, parentheses, monotonic stack).
- [ ] Giải được bài Trees & Graphs bằng BFS/DFS (traversal, number of islands, validate BST).
- [ ] Hiểu Dynamic Programming cơ bản (state + transition) và Binary Search (template chuẩn).
- [ ] Tự tin phân tích Big-O time + space cho mọi lời giải (kể cả recursion stack, amortized).
- [ ] Nắm System Design fundamentals: scalability, load balancing, caching, database scaling.
- [ ] Làm được System Design case study: URL shortener / rate limiter (API, schema, trade-off).
- [ ] Demo project hoàn thiện full-stack (Spring Boot + JPA + Redis + JWT + Docker), chạy được.
- [ ] Portfolio sẵn sàng: README tiếng Anh đầy đủ + 3 câu chuyện STAR + CV/LinkedIn cập nhật.
- [ ] Hoàn thành Mock Interview EN (coding + system design + behavioral) — đã giải 30+ bài LeetCode.

> 💡 **Golden Rule Tuần 11:** LeetCode không phải học thuộc — là nhận diện pattern (two pointers, sliding window, BFS/DFS, DP) rồi áp dụng. Nói to suy nghĩ khi giải = kỹ năng phỏng vấn quan trọng nhất. System Design không có đáp án đúng tuyệt đối — quan trọng là trao đổi trade-off rõ ràng. Demo project = bằng chứng sống động hơn mọi dòng CV. Sẵn sàng cho tuần cuối nộp đơn!
