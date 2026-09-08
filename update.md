6. Suggestion engine là nơi có khả năng trở thành bottleneck

Đây là phần tôi quan tâm nhất về performance.

Bạn đang làm Levenshtein:

candidate dictionary
↓
length bucket
↓
Levenshtein
↓
sort candidates

Đây là improvement tốt hơn rất nhiều so với brute-force toàn dictionary. analyzer.ts đã sử dụng length buckets và base-word cache.

Nhưng vẫn có vấn đề:

for (const dictWord of candidateWords) {
const baseDistance = levenshteinDistance(...)
const fullDistance = levenshteinDistance(...)
}

Tức là mỗi candidate có thể chạy 2 lần Levenshtein.

Nếu:

VN dictionary = 50k
Names = 120k
Non-VN = 48k

thì suggestion generation cho một unknown word vẫn có thể khá nặng.

Tôi đề xuất phase tiếp theo:

Dùng filter trước Levenshtein:

candidate
↓
length
↓
first character / phonetic bucket
↓
base character signature
↓
Levenshtein

Ví dụ:

"nghiên"

không cần so với:

computer
Alexander
software
...

Có thể giảm candidate set xuống rất mạnh.

---

7.  Một optimization rất đáng làm: không cần matrix đầy đủ

Hiện tại:

levenshteinDistance()

tạo:

number[][]

cho mỗi calculation.

Đây là allocation khá lớn.

Bạn chỉ cần distance <= 1 hoặc <= 2.

Có thể dùng bounded Levenshtein:

distance > threshold
→ return threshold + 1

và chỉ giữ 2 rows:

previous[]
current[]

Thay vì:

matrix[i][j]

Điều này sẽ giảm allocation đáng kể.

## Đây là optimization tôi ưu tiên #1 cho analyzer.

---

8. EPUB parser: tốt nhưng có một rủi ro lớn

extractLeafTextElements() hiện cố tránh duplicate text bằng:

p/h1/h2/.../li/blockquote/...

- leaf div

Ý tưởng tốt.

Nhưng EPUB HTML ngoài đời rất bẩn.

Có thể gặp:

<div>
  <span>Hello</span>
  <span>world</span>
</div>

hoặc:

<p>
  Hello <b>beautiful</b> world
</p>

hoặc:

<div>
  <div>
    <span>...</span>
  </div>
</div>

Bạn đang phụ thuộc vào DOM structure để xác định "paragraph".

Điều này sẽ hoạt động tốt với phần lớn EPUB nhưng không thể đảm bảo 100%.

---

9. EPUB writer có một điểm tôi muốn test cực mạnh

Đây là phần nguy hiểm nhất của app:

EPUB
↓
parse DOM
↓
modify DOM
↓
XMLSerializer
↓
EPUB

Bạn có thể làm mất hoặc thay đổi:

namespace
doctype
XML formatting
attribute representation
entity representation
whitespace
malformed XHTML tolerance
một số metadata formatting

epub-writer.ts đã cố giữ XML declaration, và cũng đảm bảo mimetype dùng STORE compression. Đây là đúng.

Nhưng tôi muốn test regression theo kiểu:

input.epub
↓
fix 1 word
↓
output.epub
↓
compare structural integrity

chứ không chỉ test:

"hello" → "world"

---

10. Đặc biệt: XMLSerializer có thể làm EPUB diff rất lớn

Ví dụ source:

<p>Hello <b>world</b></p>

sau serialize có thể không còn byte-for-byte giống source.

Không nhất thiết là bug.

Nhưng với EPUB, mục tiêu tốt hơn là:

thay đổi tối thiểu nội dung cần thay đổi.

Nếu muốn writer đạt mức production cao hơn, tôi sẽ cân nhắc:

DOM parsing

chỉ dùng để xác định location,

nhưng khi apply fix:

modify original text

thay vì serialize toàn bộ document.

Đây là một improvement kiến trúc lớn nhưng không cần làm ngay.

---

11. Security: đây là phần tôi muốn sửa trước

Có một điểm khá rõ:

dictAdminToken = $state<string>(
loadStorage(STORAGE_KEYS.DICT_ADMIN_TOKEN, "")
)

và sau đó:

saveStorage(
STORAGE_KEYS.DICT_ADMIN_TOKEN,
this.dictAdminToken
)

Tức là ADMIN_TOKEN được lưu trong localStorage.

Điều này có nghĩa:

XSS
↓
localStorage
↓
ADMIN_TOKEN
↓
attacker có quyền sửa dictionary

Nếu đây chỉ là tool cá nhân thì mức độ nghiêm trọng thấp hơn.

Nhưng nếu deploy public thì tôi không thích architecture này.

Tốt hơn:

Nếu đã dùng Cloudflare Access:

Browser
↓
Cloudflare Access
↓
/api/dict/\*
↓
KV

thì không cần expose ADMIN_TOKEN cho browser bình thường.

ADMIN_TOKEN nên là fallback dành cho:

CLI
automation
emergency admin

chứ không nên là credential được persistent vào localStorage.

---

12. Và có một vấn đề security còn quan trọng hơn

isAuthenticated() hiện coi request có:

cf-access-authenticated-user-email

hoặc:

cf-access-jwt-assertion

là authenticated.

Điều này chỉ an toàn nếu endpoint thực sự luôn nằm sau Cloudflare Access.

Nếu có đường truy cập trực tiếp bypass Access tới Pages Function thì header-based trust cần được xem xét lại.

Tôi khuyên production setup nên có:

Cloudflare Access
↓
admin path
↓
Function

và function nên validate JWT nếu bạn muốn defense-in-depth.

---

13. Một bug nhỏ trong API response naming

POST:

action === "remove"

nhưng response vẫn trả:

addedCount: affectedCount

Cho remove thì nó thực chất là:

removedCount

Đây là API design smell.

Tốt hơn:

{
action: "add",
affectedCount: 10
}

hoặc:

{
action: "remove",
affectedCount: 10
}

Thay vì:

addedCount

cho cả hai operation.

-----14. auth-status hiện có thể đơn giản hóa

Bạn có:

/auth-status
/dict/:name

Trong đó auth-status trả:

authenticated
authType
email
hasTokenConfigured

Đây là UX-friendly.

Tuy nhiên hasTokenConfigured có thể leak thông tin:

ADMIN_TOKEN có tồn tại hay không

Không phải vulnerability nghiêm trọng, nhưng tôi không thấy frontend cần phải biết secret infrastructure có configured hay không.

Có thể trả:

{
authenticated: true,
authType: "cloudflare-access",
email: "..."
}

là đủ.

---

15. State model đang hơi phình

AppStateModel hiện đang quản:

dictionary
auth
reader
whitelist
EPUB
analysis
selection
UI
toast
fixes

và file đã khá lớn.

Hiện tại vẫn đọc được.

Nhưng nếu tiếp tục thêm feature, tôi sẽ tách:

AppStateModel
├── DictionaryState
├── ReaderState
├── AnalysisState
├── BookState
└── UIState

Không cần Svelte store phức tạp.

Chỉ cần module hóa logic. 6. Nhưng tôi không khuyên bạn rewrite state management

Không cần:

Redux
Zustand
XState
...

Svelte 5 $state hiện tại phù hợp với app này.

Tôi sẽ giữ:

class AppStateModel

và chỉ chia nhỏ implementation.

---

20. Performance architecture hiện tại

Tôi đánh giá:

EPUB unzip good
DOM parsing acceptable
dictionary loading good
dictionary cache very good
analysis worker very good
suggestions needs optimization
repack acceptable

Điểm yếu chính:

A. Worker nhận toàn bộ dictionaries

Worker message chứa:

dictionaries: Dictionaries

Nếu dictionaries rất lớn, browser phải structured-clone toàn bộ Set/Map sang Worker.

Bạn đang phải trả cost:

main thread
↓ structured clone
worker

Mỗi lần analysis.

Nếu chỉ analyze một EPUB mỗi lần thì chấp nhận được.

Nhưng nếu user liên tục analyze nhiều book, đây sẽ là bottleneck.

---

21. Có thể nâng architecture Worker lên

Thay vì:

main
↓
send dictionaries
↓
worker

có thể:

worker starts
↓
load dictionaries once
↓
analyze book #1
↓
analyze book #2
↓
analyze book #3

Worker persistent.

Ví dụ:

AnalysisWorkerManager
│
├── init(dictionaries)
├── analyze(textBlocks)
└── terminate()

Đây sẽ tránh clone dictionary liên tục.

Tôi đánh giá đây là optimization đáng làm nếu EPUB lớn.

22. Một vấn đề UX nhỏ nhưng đáng sửa

init() load cả 4 dictionary bằng:

Promise.all(...)

đây là đúng về performance.

Nhưng UX hiện tại nếu một dictionary fail thì cả:

Promise.all()

fail.

Ví dụ:

VN OK
Non-VN OK
Custom OK
Names 500

thì toàn bộ dictionary load coi như failure.

Tôi thích:

Promise.allSettled()

hơn ở đây.

Bạn có thể cho:

VN ✓
Non-VN ✓
Custom ✓
Names ✗

## và app vẫn hoạt động.

23. Một vấn đề nữa: cache invalidation

TTL:

10 minutes

là reasonable.

Nhưng dictionary version:

dict-${dictName}-${DICTIONARY_VERSION}

có nghĩa khi bạn bump version thì cache bị invalidate.

Tôi khuyên thay vì phải nhớ bump version thủ công, API đã có:

updatedAt

Bạn có thể dùng:

ETag
Last-Modified

hoặc API metadata:

{
"version": "...",
"updatedAt": "..."
}

để cache invalidation chính xác hơn.

Không cần làm ngay, nhưng đây là hướng tốt.

24. Có một architectural distinction tôi khuyên bạn giữ rất rõ

Bạn thực tế đang có 3 loại dictionary khác nhau về bản chất:

VN
ngữ liệu spell-check
Non-VN
foreign vocabulary
Names
proper nouns
Custom
explicit whitelist / technical / brand / acronym

Trong đó Custom đang có priority rất cao.

Tôi nghĩ nên document rõ precedence:

CUSTOM
↓
NAMES
↓
NON-VN
↓
VN
↓
SPELLING RULE
↓
UNKNOWN

Hiện code đã phản ánh phần lớn precedence này, nhưng README/documentation nên mô tả chính thức.
