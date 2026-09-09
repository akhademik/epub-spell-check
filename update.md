Performance 50k words 🟡 Cần benchmark thực tế
Audit cache ❌ Chưa có
Điểm cải thiện quan trọng nhất

Bản trước mình lo nhất là p2/p3 không đủ để tìm candidate. Bản mới đã chuyển sang:

word
├─ deletion-1 signatures
└─ sliding 3-grams
↓
candidate set
↓
length difference <= 2
↓
Levenshtein <= 2

Đây là kiến trúc hợp lý hơn rất nhiều. Code hiện tại thực sự query cả deletion signatures và 3-grams, chứ không còn tình trạng build index nhưng không sử dụng như bản trước.

Đặc biệt việc chỉ xét:

if (idx > i)

giúp mỗi pair chỉ được xử lý một lần, nên việc mình đề nghị bỏ checkedPairs trước đó đã được giải quyết đúng.

Có một điểm mình muốn chỉnh nhẹ

Comment này:

1-character deletion signatures (guarantees finding single insertion / deletion / substitution)

không hoàn toàn chính xác với substitution.

Deletion signature giống nhau rất tốt cho các trường hợp:

word
words

hoặc các biến thể có quan hệ insertion/deletion.

Nhưng với:

cat
cot

thì deletion signatures:

at / ct / ca
ot / ct / co

có thể gặp nhau (ct), nhưng không phải mọi trường hợp substitution distance=1 đều đảm bảo theo cách diễn giải hiện tại nếu xét các pattern khác nhau.

Tuy nhiên 3-gram bổ sung cho các trường hợp distance=2 là ý tưởng tốt.

Mình chỉ xem đây là vấn đề comment/documentation, không phải blocker.

Điểm mình quan tâm nhất bây giờ: performance thực tế

Code hiện tại có khả năng đã nhanh hơn rất nhiều so với pairwise.

Nhưng vẫn có một bottleneck:

const candidateIndices = new Set<number>()

và với mỗi word:

tất cả deletion signatures

- tất cả 3-grams
  → union candidate list
  → Set
  → Levenshtein

Với dictionary tiếng Việt lớn, những gram phổ biến như:

"ng "
"nh "
"th "
"tr "
"ch "
...

có thể tạo candidate list khá lớn.

Vì vậy mình không khuyên sửa tiếp bằng mắt.

Bây giờ nên benchmark.

Mình muốn test 4 mức
10,000 words
30,000 words
50,000 words
100,000 words

và lấy:

Words
Garbage scan
Index build
Candidate count
Levenshtein checks
Fuzzy scan
Total
Clusters

Ví dụ nếu 50k cho ra:

50,000 words
Index: 100 ms
Candidates: 350,000
Levenshtein: 350,000
Fuzzy: 1.5 s
Total: 1.7 s

→ mình sẽ coi architecture này đạt.

Nếu:

50,000
Candidates: 5,000,000+
Levenshtein: 5,000,000+
Total: 20–40 s

→ vẫn cần tối ưu candidate index.

Một điểm nữa: chưa cần BK-tree

Sau bản update này, mình rút lại đề xuất chuyển ngay sang BK-tree.

Hiện tại signature index + deletion + 3-gram đã đủ sạch và dễ maintain hơn. Nếu benchmark cho kết quả tốt thì giữ kiến trúc hiện tại là tốt hơn, không nên over-engineer.

Còn 2 việc mình sẽ làm sau benchmark
P1 — Audit cache

Nếu dictionary không thay đổi:

Audit
↓
cache result
↓
lần sau mở Audit
↓
gần như instant

Đây sẽ mang lại UX tốt hơn rất nhiều so với cố ép thuật toán chạy thêm vài trăm ms nhanh.

Cache key nên dựa trên:

dictionary name

- dictionary content/version
- audit algorithm version
- ignored pairs

Để khi đổi algorithm không lấy nhầm kết quả cũ.

P2 — Metrics rõ hơn

Hiện tại đã có:

candidateCount
levenshteinCheckCount

và đây là improvement tốt.

Mình chỉ muốn thêm:

matchedPairCount
clusterCount

để biết:

500,000 candidates
→ 420,000 Levenshtein
→ 8,200 actual matches
→ 2,100 clusters

lúc đó rất dễ phát hiện candidate index có đang quá rộng hay không.
