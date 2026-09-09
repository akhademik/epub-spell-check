Có. Tôi vừa audit trực tiếp nhánh develop, và đúng là Audit Words hiện tại có một bottleneck khá lớn khi dictionary lên vài chục nghìn từ.

1. Bottleneck lớn nhất: fuzzy duplicate

Trong auditDictionary() hiện tại:

scanDictionaryForGarbage(name, words)
detectFuzzyDuplicates(name, words, ignoredPairs)

Nhưng detectFuzzyDuplicates() lại gọi scanDictionaryForGarbage() lần nữa. Tức là toàn bộ dictionary bị scan garbage 2 lần trong mỗi lần Audit.

Đây là tối ưu rất dễ làm và nên sửa ngay:

auditDictionary()
│
├── scanDictionaryForGarbage() ← 1 lần
│
└── detectFuzzyDuplicates(..., garbageFindings)

Thay vì:

auditDictionary()
├── scanDictionaryForGarbage()
└── detectFuzzyDuplicates()
└── scanDictionaryForGarbage() ← dư 2. Fuzzy matching vẫn có thể rất nặng

Code hiện tại đã có length bucket, đây là hướng đúng:

candidateLengths = [lenA, lenA + 1, lenA + 2]

nhưng sau đó vẫn có thể tạo rất nhiều cặp ứng viên, rồi gọi:

levenshteinDistance(entryA.lower, entryB.lower, 2)

Với 30k–50k từ, đây vẫn là phần tôi nghi ngờ chiếm phần lớn thời gian. Code hiện tại mới prune bằng:

độ dài
1–2 ký tự đầu

nhưng chưa có index theo prefix/ngram đủ mạnh.

Tôi đề xuất đổi Audit thành 3 tầng
Tier 1 — cực rẻ

Chạy toàn bộ dictionary:

30,000–100,000 words
↓
digit
URL
length
consonant
repeated unit
vowel ratio
TitleCase
VN-specific chars
validator

Các check này đều O(N), rất nhanh.

Tier 2 — tạo candidate index

Không chạy Levenshtein trên mọi cặp có cùng độ dài.

Ví dụ:

"thanh"
"thành"
"thạnh"
"thanhh"

được đưa vào bucket dựa trên:

length
prefix
trigram

Ví dụ:

tha
han
anh

Chỉ những từ chia sẻ đủ n-gram mới được đưa vào fuzzy comparison.

Tier 3 — Levenshtein

Chỉ:

candidate → levenshteinDistance(..., 2)

Như vậy thay vì:

30,000 × rất nhiều candidates

có thể giảm xuống vài trăm / vài nghìn phép so sánh thực tế.

3. Tôi còn thấy một điểm có thể tối ưu rất đáng kể

Đoạn này:

const base = dictName === "vn" ? getBaseWord(lower) : lower

được tính cho mọi word, nhưng trong đoạn code hiện tại base không được sử dụng để prune candidate trước khi fuzzy matching.

Nếu getBaseWord() tương đối đắt thì đây là CPU bị bỏ phí.

Tôi sẽ hoặc:

A. Bỏ hoàn toàn base

nếu thực sự không dùng.

Hoặc tốt hơn:

B. Dùng base làm một tầng grouping

Ví dụ:

word
↓
normalize
↓
base word
↓
candidate bucket
↓
Levenshtein

Nhưng phải benchmark trước vì tiếng Việt có tone/biến thể khiến grouping quá mạnh có thể bỏ sót lỗi.

4. Có một vấn đề kiến trúc quan trọng hơn: server đang làm toàn bộ audit trong một request

DictAuditPanel gọi:

fetchDictionaryAudit(activeDict, ...)

và endpoint:

GET /api/dict/:name/audit

sau đó server:

const words = ...
const auditResult = auditDictionary(name, words, ignoredPairs)

tức là Cloudflare Worker/Pages Function thực hiện toàn bộ fuzzy audit synchronously trong một HTTP request.

Với vài chục nghìn từ thì UX sẽ là:

Click Audit
↓
request
↓
KV GET
↓
parse 30k–50k words
↓
garbage scan
↓
fuzzy scan
↓
Levenshtein rất nhiều lần
↓
JSON stringify
↓
response

Đây là lý do cảm giác "treo" sẽ rõ khi dictionary lớn.

5. Có một tối ưu rất hay: cache Audit

Dictionary của bạn không thay đổi liên tục.

Ví dụ:

VN dictionary
50,000 words

Audit xong:

content hash = ABC123
audit result = ...

Nếu user bấm:

Quét lại

mà dictionary chưa thay đổi thì không cần audit lại.

Có thể lưu:

dict:vn:audit:{contentHash}

hoặc đơn giản hơn:

dict:vn:audit
dict:vn:audit:version

Khi POST add/remove dictionary:

dictionary changed
↓
invalidate audit cache

Lần sau:

Audit
↓
dictionary unchanged?
↓ YES
return cached result

Đây sẽ làm lần Audit thứ 2 gần như tức thì.

6. Tôi cũng muốn sửa ignoredPairs

Hiện tại mỗi Audit:

KV.get("dict:${name}:ignored-pairs")
JSON.parse(...)
new Set(...)

Không phải bottleneck lớn, nhưng nếu ignored pair ngày càng nhiều thì cũng có thể trở thành overhead.

Quan trọng hơn là POST ignore hiện đang:

GET ignored list
↓
modify array
↓
PUT entire JSON

Nên sau này nếu có nhiều admin cùng thao tác có thể gặp lost update. Đây là vấn đề concurrency hơn là performance.

7. Tôi sẽ ưu tiên sửa theo thứ tự này
   Ưu tiên Thay đổi Hiệu quả
   🔴 P0 Không scan garbage 2 lần Dễ + chắc chắn
   🔴 P0 Candidate index cho fuzzy Hiệu quả lớn nhất
   🟠 P1 Bỏ getBaseWord() nếu không dùng CPU giảm
   🟠 P1 Cache audit theo dictionary version/hash Audit lần 2 cực nhanh
   🟡 P2 Tối ưu ignored-pairs nhỏ
   🟡 P2 Instrument timing Biết chính xác bottleneck
8. Và tôi đặc biệt khuyên thêm benchmark

Đừng tối ưu "mù". Audit nên trả/log:

Dictionary: vn
Words: 48,392

Garbage scan: 18 ms
Index building: 31 ms
Fuzzy candidates: 8,421
Levenshtein checks: 8,421
Fuzzy matching: 143 ms
Total: 196 ms

Nếu sau này lên:

100,000 words

ta sẽ biết ngay cái gì bắt đầu trở thành bottleneck.

Kết luận

Logic hiện tại đã tốt về mặt correctness, nhưng chưa tối ưu cho quy mô vài chục nghìn từ.

Điểm đáng sửa nhất là:

đừng dùng Levenshtein như bước tìm candidate; hãy dùng index/bucket để thu hẹp candidate trước, rồi mới Levenshtein.

Và có một bug hiệu năng rất rõ:

scanDictionaryForGarbage() đang chạy 2 lần trong một Audit.

Nếu bạn muốn tối ưu thật sự, tôi sẽ chọn kiến trúc:

Dictionary
↓
Normalize + metadata (1 lần)
↓
Garbage scan (1 lần)
↓
Length + prefix/ngram index
↓
Candidate generation
↓
Levenshtein threshold=2
↓
Union-Find
↓
Audit result
↓
Cache theo dictionary version

Cách này vẫn giữ nguyên logic phát hiện hiện tại nhưng sẽ scale tốt hơn rất nhiều so với việc chỉ "tối ưu vài vòng for".
