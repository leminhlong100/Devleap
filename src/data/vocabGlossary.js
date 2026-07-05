/**
 * Glossary từ vựng IELTS nền tảng — biên soạn tay cho mọi từ trong
 * Base_English/NenTang_TuanN.md (mục "🗂️ Phòng từ vựng → Từ chính: …").
 *
 * MD nguồn chỉ liệt kê *danh sách từ* (không IPA / nghĩa / ví dụ), nên file này
 * bổ sung phần còn thiếu để VocabCard và Flashcard hiển thị đầy đủ:
 *   - ipa   : phiên âm
 *   - vi    : nghĩa tiếng Việt
 *   - ex    : câu ví dụ tiếng Anh, dùng `{w}` làm chỗ đặt từ (VocabCard tô đậm)
 *   - exVi  : nghĩa câu ví dụ
 *   - emoji : ảnh minh họa dự phòng khi không tra được ảnh thật (Wikipedia) —
 *             dùng để KHÔNG hiện icon 🗂️ chung chung cho mọi từ trừu tượng.
 *
 * Khóa tra cứu = từ viết thường (khớp với cách decorateVocab / cardsFromTerms tra).
 * Phát âm (nghe) do Web Speech API đọc trực tiếp từ `term`, không cần file âm thanh.
 */
export const VOCAB_GLOSSARY = {
  // Tuần 1 — Bản thân & sức khỏe
  name: { ipa: '/neɪm/', vi: 'tên', ex: 'My {w} is Mai and I am from Hanoi.', exVi: 'Tên tôi là Mai và tôi đến từ Hà Nội.', emoji: '🪪' },
  age: { ipa: '/eɪdʒ/', vi: 'tuổi', ex: 'At my {w}, I want to learn new skills.', exVi: 'Ở độ tuổi của tôi, tôi muốn học những kỹ năng mới.', emoji: '🎂' },
  personality: { ipa: '/ˌpɜːsəˈnæləti/', vi: 'tính cách', ex: 'She has a friendly {w}.', exVi: 'Cô ấy có tính cách thân thiện.', emoji: '🎭' },
  strength: { ipa: '/streŋθ/', vi: 'điểm mạnh', ex: 'My biggest {w} is staying calm under pressure.', exVi: 'Điểm mạnh nhất của tôi là giữ bình tĩnh khi áp lực.', emoji: '💪' },
  weakness: { ipa: '/ˈwiːknəs/', vi: 'điểm yếu', ex: 'Speaking in public is my main {w}.', exVi: 'Nói trước đám đông là điểm yếu chính của tôi.', emoji: '🪫' },
  goal: { ipa: '/ɡəʊl/', vi: 'mục tiêu', ex: 'My {w} is to get band 6.5 in IELTS.', exVi: 'Mục tiêu của tôi là đạt 6.5 IELTS.', emoji: '🎯' },
  habit: { ipa: '/ˈhæbɪt/', vi: 'thói quen', ex: 'Reading every night is a good {w}.', exVi: 'Đọc sách mỗi tối là một thói quen tốt.', emoji: '🔁' },
  confidence: { ipa: '/ˈkɒnfɪdəns/', vi: 'sự tự tin', ex: 'Practice gives me more {w}.', exVi: 'Luyện tập cho tôi thêm tự tin.', emoji: '😎' },
  background: { ipa: '/ˈbækɡraʊnd/', vi: 'xuất thân, nền tảng', ex: 'I come from a working-class {w}.', exVi: 'Tôi xuất thân từ gia đình lao động.', emoji: '🧬' },
  experience: { ipa: '/ɪkˈspɪəriəns/', vi: 'kinh nghiệm, trải nghiệm', ex: 'Travelling gave me a lot of {w}.', exVi: 'Du lịch cho tôi rất nhiều trải nghiệm.', emoji: '🧭' },
  stress: { ipa: '/stres/', vi: 'căng thẳng', ex: 'Too much work causes {w}.', exVi: 'Quá nhiều việc gây căng thẳng.', emoji: '😣' },
  sleep: { ipa: '/sliːp/', vi: 'giấc ngủ; ngủ', ex: 'I need eight hours of {w} a night.', exVi: 'Tôi cần ngủ tám tiếng mỗi đêm.', emoji: '😴' },
  energy: { ipa: '/ˈenədʒi/', vi: 'năng lượng', ex: 'A good breakfast gives me {w}.', exVi: 'Bữa sáng tốt cho tôi năng lượng.', emoji: '⚡' },
  exercise: { ipa: '/ˈeksəsaɪz/', vi: 'tập thể dục; bài tập', ex: 'I do {w} three times a week.', exVi: 'Tôi tập thể dục ba lần một tuần.', emoji: '🏋️' },
  illness: { ipa: '/ˈɪlnəs/', vi: 'bệnh tật', ex: 'Resting helps you recover from {w}.', exVi: 'Nghỉ ngơi giúp bạn hồi phục sau bệnh.', emoji: '🤒' },
  medicine: { ipa: '/ˈmedsn/', vi: 'thuốc; y học', ex: 'Take this {w} after meals.', exVi: 'Uống thuốc này sau bữa ăn.', emoji: '💊' },
  anxiety: { ipa: '/æŋˈzaɪəti/', vi: 'sự lo âu', ex: 'Exams often cause {w}.', exVi: 'Kỳ thi thường gây lo âu.', emoji: '😰' },
  motivation: { ipa: '/ˌməʊtɪˈveɪʃn/', vi: 'động lực', ex: 'A clear goal gives me {w}.', exVi: 'Một mục tiêu rõ ràng cho tôi động lực.', emoji: '🔥' },
  balance: { ipa: '/ˈbæləns/', vi: 'sự cân bằng', ex: 'Work–life {w} is important.', exVi: 'Cân bằng công việc và cuộc sống rất quan trọng.', emoji: '⚖️' },

  // Tuần 2 — Gia đình & học hành
  parents: { ipa: '/ˈpeərənts/', vi: 'bố mẹ', ex: 'My {w} support my studies.', exVi: 'Bố mẹ tôi ủng hộ việc học của tôi.', emoji: '👪' },
  siblings: { ipa: '/ˈsɪblɪŋz/', vi: 'anh chị em ruột', ex: 'I have two {w}, a brother and a sister.', exVi: 'Tôi có hai anh chị em, một anh trai và một em gái.', emoji: '👫' },
  relatives: { ipa: '/ˈrelətɪvz/', vi: 'họ hàng', ex: 'We visit our {w} at Tet.', exVi: 'Chúng tôi thăm họ hàng vào dịp Tết.', emoji: '👨‍👩‍👧‍👦' },
  support: { ipa: '/səˈpɔːt/', vi: 'sự ủng hộ; hỗ trợ', ex: 'My family gives me strong {w}.', exVi: 'Gia đình cho tôi sự ủng hộ mạnh mẽ.', emoji: '🤝' },
  argument: { ipa: '/ˈɑːɡjumənt/', vi: 'cuộc tranh cãi; lập luận', ex: 'They had a small {w} over money.', exVi: 'Họ có một cuộc tranh cãi nhỏ về tiền bạc.', emoji: '💢' },
  generation: { ipa: '/ˌdʒenəˈreɪʃn/', vi: 'thế hệ', ex: 'The older {w} prefers traditional values.', exVi: 'Thế hệ lớn tuổi thích các giá trị truyền thống.', emoji: '🕰️' },
  care: { ipa: '/keə/', vi: 'sự chăm sóc; quan tâm', ex: 'Parents take {w} of their children.', exVi: 'Bố mẹ chăm sóc con cái.', emoji: '🫶' },
  respect: { ipa: '/rɪˈspekt/', vi: 'sự tôn trọng', ex: 'We should show {w} to elders.', exVi: 'Chúng ta nên tôn trọng người lớn tuổi.', emoji: '🙏' },
  responsibility: { ipa: '/rɪˌspɒnsəˈbɪləti/', vi: 'trách nhiệm', ex: 'Doing chores is my {w}.', exVi: 'Làm việc nhà là trách nhiệm của tôi.', emoji: '📋' },
  childhood: { ipa: '/ˈtʃaɪldhʊd/', vi: 'thời thơ ấu', ex: 'I had a happy {w} in the countryside.', exVi: 'Tôi có một tuổi thơ hạnh phúc ở quê.', emoji: '🧸' },
  subject: { ipa: '/ˈsʌbdʒɪkt/', vi: 'môn học', ex: 'Maths is my favourite {w}.', exVi: 'Toán là môn học yêu thích của tôi.', emoji: '📘' },
  teacher: { ipa: '/ˈtiːtʃə/', vi: 'giáo viên', ex: 'My English {w} is very patient.', exVi: 'Giáo viên tiếng Anh của tôi rất kiên nhẫn.', emoji: '🍎' },
  classmate: { ipa: '/ˈklɑːsmeɪt/', vi: 'bạn cùng lớp', ex: 'I study with a {w} after school.', exVi: 'Tôi học cùng một bạn cùng lớp sau giờ học.', emoji: '🧑‍🤝‍🧑' },
  homework: { ipa: '/ˈhəʊmwɜːk/', vi: 'bài tập về nhà', ex: 'I finish my {w} before dinner.', exVi: 'Tôi làm xong bài tập về nhà trước bữa tối.', emoji: '📝' },
  exam: { ipa: '/ɪɡˈzæm/', vi: 'kỳ thi', ex: 'I am preparing for the final {w}.', exVi: 'Tôi đang chuẩn bị cho kỳ thi cuối kỳ.', emoji: '📄' },
  mistake: { ipa: '/mɪˈsteɪk/', vi: 'lỗi sai', ex: 'I learn from every {w}.', exVi: 'Tôi học hỏi từ mỗi lỗi sai.', emoji: '❌' },
  method: { ipa: '/ˈmeθəd/', vi: 'phương pháp', ex: 'This learning {w} works well for me.', exVi: 'Phương pháp học này hợp với tôi.', emoji: '🧩' },
  memory: { ipa: '/ˈmeməri/', vi: 'trí nhớ; kỷ niệm', ex: 'Repetition improves your {w}.', exVi: 'Lặp lại giúp cải thiện trí nhớ.', emoji: '🧠' },
  skill: { ipa: '/skɪl/', vi: 'kỹ năng', ex: 'Speaking is a {w} you build by practice.', exVi: 'Nói là kỹ năng bạn xây dựng bằng luyện tập.', emoji: '🛠️' },
  improvement: { ipa: '/ɪmˈpruːvmənt/', vi: 'sự cải thiện', ex: 'I see clear {w} in my writing.', exVi: 'Tôi thấy rõ sự cải thiện trong bài viết.', emoji: '📈' },

  // Tuần 3 — Sinh hoạt, ăn uống, sở thích
  'wake up': { ipa: '/weɪk ʌp/', vi: 'thức dậy', ex: 'I {w} at six every morning.', exVi: 'Tôi thức dậy lúc sáu giờ mỗi sáng.', emoji: '⏰' },
  breakfast: { ipa: '/ˈbrekfəst/', vi: 'bữa sáng', ex: 'I never skip {w}.', exVi: 'Tôi không bao giờ bỏ bữa sáng.', emoji: '🍳' },
  commute: { ipa: '/kəˈmjuːt/', vi: 'việc đi lại (đến chỗ làm/học)', ex: 'My {w} takes thirty minutes.', exVi: 'Quãng đường đi làm của tôi mất ba mươi phút.', emoji: '🚌' },
  schedule: { ipa: '/ˈʃedjuːl/', vi: 'lịch trình', ex: 'I keep a daily {w}.', exVi: 'Tôi duy trì một lịch trình hằng ngày.', emoji: '🗓️' },
  break: { ipa: '/breɪk/', vi: 'giờ nghỉ', ex: 'I take a short {w} every hour.', exVi: 'Tôi nghỉ ngắn mỗi giờ.', emoji: '☕' },
  nap: { ipa: '/næp/', vi: 'giấc ngủ ngắn', ex: 'A short {w} helps me focus.', exVi: 'Một giấc ngủ ngắn giúp tôi tập trung.', emoji: '💤' },
  chores: { ipa: '/tʃɔːz/', vi: 'việc vặt trong nhà', ex: 'I do the {w} on weekends.', exVi: 'Tôi làm việc nhà vào cuối tuần.', emoji: '🧹' },
  relax: { ipa: '/rɪˈlæks/', vi: 'thư giãn', ex: 'I {w} by listening to music.', exVi: 'Tôi thư giãn bằng cách nghe nhạc.', emoji: '🛀' },
  bedtime: { ipa: '/ˈbedtaɪm/', vi: 'giờ đi ngủ', ex: 'My {w} is around eleven.', exVi: 'Giờ đi ngủ của tôi khoảng mười một giờ.', emoji: '🛏️' },
  meal: { ipa: '/miːl/', vi: 'bữa ăn', ex: 'Dinner is my biggest {w}.', exVi: 'Bữa tối là bữa ăn lớn nhất của tôi.', emoji: '🍽️' },
  snack: { ipa: '/snæk/', vi: 'đồ ăn vặt', ex: 'I eat fruit as a {w}.', exVi: 'Tôi ăn trái cây làm đồ ăn vặt.', emoji: '🍪' },
  vegetables: { ipa: '/ˈvedʒtəblz/', vi: 'rau củ', ex: 'I add {w} to every meal.', exVi: 'Tôi thêm rau củ vào mỗi bữa ăn.', emoji: '🥦' },
  'junk food': { ipa: '/dʒʌŋk fuːd/', vi: 'đồ ăn vặt không lành mạnh', ex: 'I try to avoid {w}.', exVi: 'Tôi cố tránh đồ ăn vặt không lành mạnh.', emoji: '🍟' },
  taste: { ipa: '/teɪst/', vi: 'vị; hương vị', ex: 'This soup has a rich {w}.', exVi: 'Món súp này có hương vị đậm đà.', emoji: '👅' },
  ingredient: { ipa: '/ɪnˈɡriːdiənt/', vi: 'nguyên liệu', ex: 'Rice is the main {w}.', exVi: 'Gạo là nguyên liệu chính.', emoji: '🧂' },
  restaurant: { ipa: '/ˈrestrɒnt/', vi: 'nhà hàng', ex: 'We eat at a local {w} on Fridays.', exVi: 'Chúng tôi ăn ở một nhà hàng địa phương vào thứ Sáu.', emoji: '🍴' },
  diet: { ipa: '/ˈdaɪət/', vi: 'chế độ ăn', ex: 'A balanced {w} keeps you healthy.', exVi: 'Chế độ ăn cân bằng giúp bạn khỏe mạnh.', emoji: '🥗' },
  balanced: { ipa: '/ˈbælənst/', vi: 'cân bằng', ex: 'I try to eat a {w} diet.', exVi: 'Tôi cố ăn một chế độ ăn cân bằng.', emoji: '⚖️' },
  homemade: { ipa: '/ˌhəʊmˈmeɪd/', vi: 'tự làm tại nhà', ex: 'I prefer {w} food to fast food.', exVi: 'Tôi thích đồ ăn tự làm hơn đồ ăn nhanh.', emoji: '🍲' },
  music: { ipa: '/ˈmjuːzɪk/', vi: 'âm nhạc', ex: 'I listen to {w} while studying.', exVi: 'Tôi nghe nhạc khi học.', emoji: '🎵' },
  movie: { ipa: '/ˈmuːvi/', vi: 'phim', ex: 'We watch a {w} every weekend.', exVi: 'Chúng tôi xem phim mỗi cuối tuần.', emoji: '🎬' },
  sport: { ipa: '/spɔːt/', vi: 'thể thao', ex: 'Football is my favourite {w}.', exVi: 'Bóng đá là môn thể thao yêu thích của tôi.', emoji: '⚽' },
  game: { ipa: '/ɡeɪm/', vi: 'trò chơi', ex: 'I play a video {w} to relax.', exVi: 'Tôi chơi điện tử để thư giãn.', emoji: '🎮' },
  drawing: { ipa: '/ˈdrɔːɪŋ/', vi: 'vẽ', ex: '{w} is a relaxing hobby.', exVi: 'Vẽ là một sở thích thư giãn.', emoji: '🎨' },
  reading: { ipa: '/ˈriːdɪŋ/', vi: 'việc đọc sách', ex: '{w} improves my vocabulary.', exVi: 'Đọc sách giúp tăng vốn từ của tôi.', emoji: '📖' },
  photography: { ipa: '/fəˈtɒɡrəfi/', vi: 'nhiếp ảnh', ex: 'I enjoy {w} when I travel.', exVi: 'Tôi thích nhiếp ảnh khi đi du lịch.', emoji: '📷' },
  travel: { ipa: '/ˈtrævl/', vi: 'du lịch; đi lại', ex: 'I love to {w} to new places.', exVi: 'Tôi thích đi du lịch đến những nơi mới.', emoji: '✈️' },
  collection: { ipa: '/kəˈlekʃn/', vi: 'bộ sưu tập', ex: 'I have a stamp {w}.', exVi: 'Tôi có một bộ sưu tập tem.', emoji: '🗃️' },
  relaxation: { ipa: '/ˌriːlækˈseɪʃn/', vi: 'sự thư giãn', ex: 'Music is a form of {w} for me.', exVi: 'Âm nhạc là một cách thư giãn với tôi.', emoji: '🧘' },

  // Tuần 4 — Giao thông & du lịch
  bus: { ipa: '/bʌs/', vi: 'xe buýt', ex: 'I take the {w} to school.', exVi: 'Tôi đi xe buýt đến trường.', emoji: '🚌' },
  motorbike: { ipa: '/ˈməʊtəbaɪk/', vi: 'xe máy', ex: 'Most people ride a {w} in Vietnam.', exVi: 'Hầu hết mọi người đi xe máy ở Việt Nam.', emoji: '🏍️' },
  train: { ipa: '/treɪn/', vi: 'tàu hỏa', ex: 'The {w} to Hue takes twelve hours.', exVi: 'Tàu đi Huế mất mười hai tiếng.', emoji: '🚆' },
  airport: { ipa: '/ˈeəpɔːt/', vi: 'sân bay', ex: 'We arrived at the {w} early.', exVi: 'Chúng tôi đến sân bay sớm.', emoji: '🛫' },
  journey: { ipa: '/ˈdʒɜːni/', vi: 'chuyến đi, hành trình', ex: 'It was a long but pleasant {w}.', exVi: 'Đó là một hành trình dài nhưng dễ chịu.', emoji: '🗺️' },
  ticket: { ipa: '/ˈtɪkɪt/', vi: 'vé', ex: 'I booked a return {w} online.', exVi: 'Tôi đặt vé khứ hồi trực tuyến.', emoji: '🎫' },
  delay: { ipa: '/dɪˈleɪ/', vi: 'sự trễ, hoãn', ex: 'There was a two-hour {w}.', exVi: 'Có một sự trễ hai tiếng.', emoji: '⏳' },
  destination: { ipa: '/ˌdestɪˈneɪʃn/', vi: 'điểm đến', ex: 'Da Nang is a popular {w}.', exVi: 'Đà Nẵng là một điểm đến nổi tiếng.', emoji: '📍' },
  tourist: { ipa: '/ˈtʊərɪst/', vi: 'khách du lịch', ex: 'The city is full of {w} in summer.', exVi: 'Thành phố đầy khách du lịch vào mùa hè.', emoji: '🧳' },

  // Tuần 5 — Nơi ở & văn hóa
  neighbourhood: { ipa: '/ˈneɪbəhʊd/', vi: 'khu phố, hàng xóm', ex: 'I live in a quiet {w}.', exVi: 'Tôi sống ở một khu phố yên tĩnh.', emoji: '🏘️' },
  traffic: { ipa: '/ˈtræfɪk/', vi: 'giao thông', ex: 'The {w} is heavy at rush hour.', exVi: 'Giao thông đông đúc vào giờ cao điểm.', emoji: '🚦' },
  pollution: { ipa: '/pəˈluːʃn/', vi: 'ô nhiễm', ex: 'Air {w} is a serious problem.', exVi: 'Ô nhiễm không khí là một vấn đề nghiêm trọng.', emoji: '🏭' },
  park: { ipa: '/pɑːk/', vi: 'công viên', ex: 'I walk in the {w} every evening.', exVi: 'Tôi đi dạo trong công viên mỗi tối.', emoji: '🌳' },
  building: { ipa: '/ˈbɪldɪŋ/', vi: 'tòa nhà', ex: 'There is a tall {w} downtown.', exVi: 'Có một tòa nhà cao ở trung tâm.', emoji: '🏢' },
  crowded: { ipa: '/ˈkraʊdɪd/', vi: 'đông đúc', ex: 'The market is very {w} on weekends.', exVi: 'Khu chợ rất đông đúc vào cuối tuần.', emoji: '👥' },
  peaceful: { ipa: '/ˈpiːsfl/', vi: 'yên bình', ex: 'The countryside is quiet and {w}.', exVi: 'Vùng quê yên tĩnh và yên bình.', emoji: '🕊️' },
  modern: { ipa: '/ˈmɒdn/', vi: 'hiện đại', ex: 'They live in a {w} apartment.', exVi: 'Họ sống trong một căn hộ hiện đại.', emoji: '🏙️' },
  local: { ipa: '/ˈləʊkl/', vi: 'địa phương', ex: 'I shop at the {w} market.', exVi: 'Tôi mua sắm ở chợ địa phương.', emoji: '🏪' },
  facility: { ipa: '/fəˈsɪləti/', vi: 'cơ sở vật chất, tiện ích', ex: 'The gym has good {w}.', exVi: 'Phòng gym có cơ sở vật chất tốt.', emoji: '🏬' },
  tradition: { ipa: '/trəˈdɪʃn/', vi: 'truyền thống', ex: 'Tet is an important {w}.', exVi: 'Tết là một truyền thống quan trọng.', emoji: '🏮' },
  festival: { ipa: '/ˈfestɪvl/', vi: 'lễ hội', ex: 'The spring {w} lasts a week.', exVi: 'Lễ hội mùa xuân kéo dài một tuần.', emoji: '🎉' },
  film: { ipa: '/fɪlm/', vi: 'phim', ex: 'We saw a great {w} last night.', exVi: 'Tối qua chúng tôi xem một bộ phim hay.', emoji: '🎥' },
  news: { ipa: '/njuːz/', vi: 'tin tức', ex: 'I read the {w} every morning.', exVi: 'Tôi đọc tin tức mỗi sáng.', emoji: '📰' },
  'social media': { ipa: '/ˈsəʊʃl ˈmiːdiə/', vi: 'mạng xã hội', ex: 'Many people spend hours on {w}.', exVi: 'Nhiều người dành hàng giờ trên mạng xã hội.', emoji: '📱' },
  celebrity: { ipa: '/səˈlebrəti/', vi: 'người nổi tiếng', ex: 'The {w} has millions of fans.', exVi: 'Người nổi tiếng đó có hàng triệu người hâm mộ.', emoji: '🌟' },
  language: { ipa: '/ˈlæŋɡwɪdʒ/', vi: 'ngôn ngữ', ex: 'English is a global {w}.', exVi: 'Tiếng Anh là một ngôn ngữ toàn cầu.', emoji: '🗣️' },
  custom: { ipa: '/ˈkʌstəm/', vi: 'phong tục', ex: 'Giving lucky money is a {w}.', exVi: 'Lì xì là một phong tục.', emoji: '🎎' },
  audience: { ipa: '/ˈɔːdiəns/', vi: 'khán giả', ex: 'The {w} clapped loudly.', exVi: 'Khán giả vỗ tay lớn.', emoji: '👏' },

  // Tuần 6 — Công nghệ & công việc
  device: { ipa: '/dɪˈvaɪs/', vi: 'thiết bị', ex: 'My phone is my main {w}.', exVi: 'Điện thoại là thiết bị chính của tôi.', emoji: '🖥️' },
  screen: { ipa: '/skriːn/', vi: 'màn hình', ex: 'I look at a {w} all day at work.', exVi: 'Tôi nhìn màn hình cả ngày khi làm việc.', emoji: '📺' },
  app: { ipa: '/æp/', vi: 'ứng dụng', ex: 'This {w} helps me learn words.', exVi: 'Ứng dụng này giúp tôi học từ.', emoji: '📲' },
  online: { ipa: '/ˌɒnˈlaɪn/', vi: 'trực tuyến', ex: 'I take classes {w}.', exVi: 'Tôi học các lớp trực tuyến.', emoji: '🌐' },
  internet: { ipa: '/ˈɪntənet/', vi: 'mạng internet', ex: 'The {w} connects the whole world.', exVi: 'Internet kết nối cả thế giới.', emoji: '📡' },
  notification: { ipa: '/ˌnəʊtɪfɪˈkeɪʃn/', vi: 'thông báo', ex: 'I turn off every {w} at night.', exVi: 'Tôi tắt mọi thông báo vào ban đêm.', emoji: '🔔' },
  privacy: { ipa: '/ˈprɪvəsi/', vi: 'sự riêng tư', ex: 'Online {w} matters to me.', exVi: 'Sự riêng tư trực tuyến quan trọng với tôi.', emoji: '🔒' },
  digital: { ipa: '/ˈdɪdʒɪtl/', vi: 'kỹ thuật số', ex: 'We live in a {w} world.', exVi: 'Chúng ta sống trong thế giới kỹ thuật số.', emoji: '💾' },
  convenient: { ipa: '/kənˈviːniənt/', vi: 'tiện lợi', ex: 'Online shopping is very {w}.', exVi: 'Mua sắm trực tuyến rất tiện lợi.', emoji: '👍' },
  addicted: { ipa: '/əˈdɪktɪd/', vi: 'nghiện', ex: 'Some teens are {w} to games.', exVi: 'Một số thiếu niên nghiện trò chơi.', emoji: '😵‍💫' },
  job: { ipa: '/dʒɒb/', vi: 'công việc', ex: 'She has a stable {w}.', exVi: 'Cô ấy có một công việc ổn định.', emoji: '💼' },
  salary: { ipa: '/ˈsæləri/', vi: 'lương', ex: 'He earns a good {w}.', exVi: 'Anh ấy kiếm được mức lương tốt.', emoji: '💰' },
  career: { ipa: '/kəˈrɪə/', vi: 'sự nghiệp', ex: 'I want a {w} in IT.', exVi: 'Tôi muốn theo sự nghiệp trong ngành IT.', emoji: '🪜' },
  boss: { ipa: '/bɒs/', vi: 'sếp', ex: 'My {w} is fair and kind.', exVi: 'Sếp của tôi công bằng và tử tế.', emoji: '👔' },
  colleague: { ipa: '/ˈkɒliːɡ/', vi: 'đồng nghiệp', ex: 'I get along with my {w}.', exVi: 'Tôi hòa hợp với đồng nghiệp.', emoji: '🧑‍💼' },
  customer: { ipa: '/ˈkʌstəmə/', vi: 'khách hàng', ex: 'A happy {w} comes back.', exVi: 'Một khách hàng hài lòng sẽ quay lại.', emoji: '🛍️' },
  income: { ipa: '/ˈɪnkʌm/', vi: 'thu nhập', ex: 'A part-time job gives extra {w}.', exVi: 'Việc làm bán thời gian cho thêm thu nhập.', emoji: '💵' },
  budget: { ipa: '/ˈbʌdʒɪt/', vi: 'ngân sách', ex: 'I keep a monthly {w}.', exVi: 'Tôi duy trì một ngân sách hằng tháng.', emoji: '📊' },
  saving: { ipa: '/ˈseɪvɪŋ/', vi: 'khoản tiết kiệm', ex: 'I put part of my salary into {w}.', exVi: 'Tôi để một phần lương vào tiết kiệm.', emoji: '🐖' },

  // Tuần 7 — Môi trường
  plastic: { ipa: '/ˈplæstɪk/', vi: 'nhựa', ex: 'We should use less {w}.', exVi: 'Chúng ta nên dùng ít nhựa hơn.', emoji: '🥤' },
  waste: { ipa: '/weɪst/', vi: 'rác thải; lãng phí', ex: 'Cities produce a lot of {w}.', exVi: 'Các thành phố tạo ra nhiều rác thải.', emoji: '🗑️' },
  recycling: { ipa: '/ˌriːˈsaɪklɪŋ/', vi: 'việc tái chế', ex: '{w} reduces pollution.', exVi: 'Tái chế làm giảm ô nhiễm.', emoji: '♻️' },
  climate: { ipa: '/ˈklaɪmət/', vi: 'khí hậu', ex: '{w} change affects everyone.', exVi: 'Biến đổi khí hậu ảnh hưởng đến tất cả mọi người.', emoji: '🌡️' },
  nature: { ipa: '/ˈneɪtʃə/', vi: 'thiên nhiên', ex: 'I enjoy being close to {w}.', exVi: 'Tôi thích được gần gũi thiên nhiên.', emoji: '🌿' },
  river: { ipa: '/ˈrɪvə/', vi: 'dòng sông', ex: 'The {w} runs through the city.', exVi: 'Dòng sông chảy qua thành phố.', emoji: '🏞️' },
  clean: { ipa: '/kliːn/', vi: 'sạch; làm sạch', ex: 'We must keep the beach {w}.', exVi: 'Chúng ta phải giữ bãi biển sạch.', emoji: '🧼' },
  protect: { ipa: '/prəˈtekt/', vi: 'bảo vệ', ex: 'We need to {w} the forest.', exVi: 'Chúng ta cần bảo vệ rừng.', emoji: '🛡️' },

  // Tuần 8 — Ngôn ngữ học thuật (biểu đồ / lập luận)
  increase: { ipa: '/ɪnˈkriːs/', vi: 'tăng lên', ex: 'Sales {w} sharply in summer.', exVi: 'Doanh số tăng mạnh vào mùa hè.', emoji: '📈' },
  decrease: { ipa: '/dɪˈkriːs/', vi: 'giảm xuống', ex: 'Prices {w} after the holiday.', exVi: 'Giá giảm sau kỳ nghỉ.', emoji: '📉' },
  compare: { ipa: '/kəmˈpeə/', vi: 'so sánh', ex: 'The chart lets us {w} two years.', exVi: 'Biểu đồ cho phép ta so sánh hai năm.', emoji: '⚖️' },
  reason: { ipa: '/ˈriːzn/', vi: 'lý do', ex: 'There is a clear {w} for this trend.', exVi: 'Có một lý do rõ ràng cho xu hướng này.', emoji: '❓' },
  effect: { ipa: '/ɪˈfekt/', vi: 'ảnh hưởng, hệ quả', ex: 'Pollution has a bad {w} on health.', exVi: 'Ô nhiễm có ảnh hưởng xấu đến sức khỏe.', emoji: '💥' },
  solution: { ipa: '/səˈluːʃn/', vi: 'giải pháp', ex: 'Recycling is one {w} to waste.', exVi: 'Tái chế là một giải pháp cho rác thải.', emoji: '💡' },
  benefit: { ipa: '/ˈbenɪfɪt/', vi: 'lợi ích', ex: 'Exercise brings a clear {w}.', exVi: 'Tập thể dục mang lại lợi ích rõ ràng.', emoji: '✅' },
  drawback: { ipa: '/ˈdrɔːbæk/', vi: 'hạn chế, bất lợi', ex: 'The main {w} is the high cost.', exVi: 'Hạn chế chính là chi phí cao.', emoji: '⚠️' },
  trend: { ipa: '/trend/', vi: 'xu hướng', ex: 'There is an upward {w} in the data.', exVi: 'Có một xu hướng tăng trong dữ liệu.', emoji: '📶' },
  evidence: { ipa: '/ˈevɪdəns/', vi: 'bằng chứng', ex: 'The chart provides clear {w}.', exVi: 'Biểu đồ cung cấp bằng chứng rõ ràng.', emoji: '🔍' },
}

/** Tra glossary theo từ (không phân biệt hoa thường). Trả về null nếu không có. */
export function lookupVocab(term) {
  if (!term) return null
  return VOCAB_GLOSSARY[String(term).trim().toLowerCase()] || null
}
