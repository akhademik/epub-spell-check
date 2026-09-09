🔴 Nguyên nhân chính: prefixMap được tạo nhưng không hề được sử dụng

Trong detectFuzzyDuplicates() hiện tại bạn đã thêm:

const prefixMap = new Map<string, typeof wordEntries>()

sau đó tạo index theo:

length + first character
length + first 2 characters

Đây là ý tưởng đúng. Nhưng phía dưới thuật toán không đọc prefixMap lần nào.

Thay vào đó vẫn chạy:

for lenA
for lenB
for entryA
for entryB
levenshteinDistance(...)

Tức là thực tế vẫn gần như thuật toán cũ.

Nói cách khác:

Bạn đã xây "đường cao tốc", nhưng xe vẫn chạy trên đường cũ. 😄

🔴 Đây mới là lý do vài chục nghìn từ vẫn cực chậm

Giả sử dictionary có:

50.000 từ

và rất nhiều từ có cùng độ dài.

Đoạn:

for (const lenA of sortedLengths) {
const listA = bucketMap.get(lenA)

    for (const lenB of candidateLengths) {
        const listB = bucketMap.get(lenB)

        for (...) {
            for (...) {
                ...
                levenshteinDistance(...)
            }
        }
    }

}

vẫn tạo ra một lượng pair cực lớn.

Các điều kiện:

charA0 !== charB0
charA1 !== charB1
...

chỉ giúp skip một phần, chứ chưa biến bài toán thành gần O(N).

---

🔴 Một vấn đề nữa: prefixMap hiện tại hoàn toàn vô ích

Bạn đang tốn thêm thời gian và RAM để build:

p1
p2
prefixMap.set(...)

nhưng không dùng nó trong candidate generation.

Vì vậy hiện tại:

indexBuildMs

có thể tăng,

nhưng:

fuzzyScanMs

hầu như không giảm bao nhiêu.

---

Tôi sẽ sửa thuật toán theo hướng khác

Không nên:

length bucket
↓
mọi cặp trong bucket
↓
prune bằng first 2 chars
↓
Levenshtein

Mà nên:

word
↓
length bucket
↓
prefix/ngram index
↓
chỉ lấy candidate thực sự có khả năng distance <= 2
↓
Levenshtein

Ví dụ:

50,000 words
│
▼
length index
│
▼
prefix/ngram
│
├── 49,000 loại ngay
│
▼
~5,000 candidates
│
▼
Levenshtein

thay vì hàng chục/hàng trăm triệu pair comparison.

Nhưng tôi muốn thay đổi thêm một điểm quan trọng

Hiện tại threshold là:

levenshteinDistance(a, b, 2)

và bạn muốn detect fuzzy duplicate.

Tôi nghĩ nên dùng q-gram / deletion signature để sinh candidate.

Ví dụ với distance ≤ 2:

"thành"

sinh ra các signature gần nó.

Sau đó:

index[signature]

chỉ trả về các từ có khả năng cách nhau ≤2.

Đây mới là cách phù hợp với dictionary 30k–100k từ.

⚠️ Còn một bottleneck thứ hai ít rõ hơn

Sau khi tìm được cluster, bạn lại làm:

for (let i = 0; i < entries.length; i++) {
for (let j = i + 1; j < entries.length; j++) {
...
pairMeta.get(...)
}
}

để xác định overallConfidence.

Nếu cluster lớn thì lại O(K²).

Không phải bottleneck chính hiện tại, nhưng có thể sửa luôn bằng cách lưu:

cluster confidence

ngay trong quá trình union.

Và tôi sẽ không bỏ Levenshtein

Điểm này quan trọng.

Không nên thay toàn bộ bằng prefix matching vì sẽ làm giảm accuracy.

Nên:

Cheap candidate generation
↓
Levenshtein
↓
exact verification

Levenshtein chỉ được dùng ở final verification.

Timing bạn đã thêm rất hữu ích

Bạn đã thêm:

interface AuditTiming {
garbageScanMs
indexBuildMs
candidateCount
levenshteinCheckCount
fuzzyScanMs
totalMs
}

đây là một update rất tốt.

Nhưng hiện tại:

candidateCount ≈ levenshteinCheckCount

vì candidate được đếm ngay trước khi gọi Levenshtein.

Nên khi test một dictionary lớn, tôi muốn bạn nhìn 3 con số:

Words: 50,000
Candidates: ???
Levenshtein checks: ???
Total: ??? ms

Nếu Levenshtein checks lên hàng triệu thì chúng ta đã xác định chính xác thủ phạm.
