Nhưng mình vẫn còn 3 đề xuất nhỏ

Không cái nào là blocker.

P1 — thêm matches vào timing

Hiện tại bạn đã có:

candidateCount
levenshteinCheckCount

Mình muốn thêm:

matchCount
clusterCount

để Admin có thể hiển thị/debug:

16,301 words
1,337,516 candidates
1,337,515 Levenshtein
75,203 matches
480 clusters
1,080 ms

Điều này rất hữu ích nếu sau này performance regression.

P1 — benchmark 50k / 100k

Hiện workload lớn nhất mới ~16k.

Mình sẽ không sửa algorithm nữa trước khi có test 50k.

Có thể tạo synthetic dictionary:

16k
30k
50k
100k

và kiểm tra:

N
index time
candidate count
Levenshtein count
total time

Nếu 100k vẫn ở mức vài giây thì mình coi phần này done.

P2 — cache

Mình thấy commit trước đã có audit cache:

dict:{name}:audit:cache
dict:{name}:audit:version
dict:{name}:updated

và endpoint kiểm tra version trước khi chạy full audit.

Đây là một improvement rất đáng giữ.

Nó tạo ra UX:

dictionary unchanged
↓
cached audit
↓
instant

thay vì mỗi lần mở Admin lại chạy 1 giây.

Một lưu ý nhỏ về cache

Mình muốn bạn kiểm tra một case:

audit A
↓
cache A

dictionary update
↓
updated version changes
↓
audit B

Nếu updated luôn được cập nhật atomic/đồng bộ với dictionary content, cache hiện tại ổn.

Nếu có khả năng:

content updated
nhưng updated key chưa update

thì có thể trả cache cũ.

Không phải vấn đề performance, chỉ là correctness của cache.

Còn một điểm về kiến trúc

Graph analysis của commit mới báo dict-quality.ts là một community khá lớn/cohesion thấp (~0.10).

Mình chưa khuyên tách file lúc này.

Hiện tại:

dict-quality.ts
├─ garbage detection
├─ signature index
├─ fuzzy matching
├─ union-find
├─ scoring
└─ audit orchestration

vẫn là một module có cùng domain: dictionary quality/audit.

Tách chỉ để làm graph đẹp hơn sẽ không mang lại lợi ích thực tế.

Nếu sau này file lên 600–800 lines thì có thể tách:

dict-quality.ts
dict-quality-index.ts
dict-quality-fuzzy.ts

nhưng hiện tại chưa cần.
