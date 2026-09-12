EPUB Spell Check — Stabilization Tasklist

Branch: develop
Mục tiêu: ổn định độ chính xác, dictionary, EPUB integrity và security trước khi tiếp tục thêm feature.

Quy tắc chung
Không rewrite project.
Không thay đổi UI nếu task không yêu cầu.
Không thay đổi public behavior ngoài phạm vi task.
Không tự ý thêm dependency nếu chưa thật sự cần.
Ưu tiên sửa nhỏ, có test bảo vệ.
Trước khi sửa phải đọc code và test hiện tại để hiểu architecture.
Không suy đoán bug khi chưa có evidence.
Mỗi bug/behavior mới phát hiện phải cân nhắc thêm regression test.
Không sửa dictionary chỉ để làm test pass nếu nguyên nhân thực sự nằm ở engine.
Không xóa test cũ chỉ vì test đang fail.
Sau mỗi nhóm thay đổi phải chạy test liên quan.
Cuối mỗi task phải báo cáo:
Đã kiểm tra gì
Đã sửa file nào
Vì sao sửa
Test nào đã chạy
Kết quả
Vấn đề còn lại
Nếu phát hiện vấn đề ngoài scope, ghi lại và không tự ý xử lý.
TASK 1 — Accuracy Audit & Regression Protection
Mục tiêu

Đánh giá và củng cố độ chính xác của spell-check engine trước khi thay đổi architecture hoặc thêm thuật toán mới.

Công việc
Đọc và hiểu toàn bộ flow:
EPUB
→ parser
→ text blocks
→ worker
→ WORD_REGEX
→ dictionary lookup
→ error classification
→ contextual check
→ overlap resolution
→ UI
Audit các function chính liên quan đến:
word extraction
normalization
dictionary lookup
error classification
contextual errors
overlap resolution
suggestion generation
Kiểm tra các nhóm case:
Word boundary
từ đơn
từ có dấu câu
quotation
parentheses
hyphen
apostrophe
Unicode
Vietnamese diacritics
NFC/NFD nếu có liên quan

Ví dụ:

isn't
it's
don't
Kiểm tra dictionary precedence.
Kiểm tra false positive:
từ đúng → không được báo lỗi
Kiểm tra false negative:
từ sai → phải được phát hiện
Kiểm tra contextual confusion:
chuẩn đoán → chẩn đoán
sát nhập → sáp nhập
vô hình chung → vô hình trung
tựu chung → tựu trung
cọ sát → cọ xát

và các rule context_dependent.

Không thay đổi rule chỉ vì một test đơn lẻ nếu chưa xác định behavior mong muốn.
Test

Review và mở rộng nếu cần:

tests/unit/analysis-core.test.ts
tests/analyzer.test.ts
tests/context-confusion.test.ts
tests/filter.test.ts
tests/regression.test.ts

Mỗi bug thực sự được xác nhận phải có regression test.

Acceptance criteria
Không có regression trong test suite hiện tại.
Các boundary/Unicode/apostrophe cases quan trọng được test.
Contextual confusion được test rõ ràng.
Không thêm fuzzy matching/phonetic matching trong task này.
Không rewrite analysis engine nếu không có evidence cần thiết.
Output

Báo cáo:

Accuracy Audit

- Findings:
- Confirmed bugs:
- False positives:
- False negatives:
- Changes:
- New regression tests:
- Tests passed:
- Remaining issues:
  TASK 2 — Dictionary Quality & Precedence
  Mục tiêu

Đảm bảo dictionary là nguồn dữ liệu đáng tin cậy, không trở thành nơi che giấu bug của spell engine.

Công việc

Audit:

vn
non-vn
custom
names

Kiểm tra:

duplicate
cross-dictionary duplicate
casing
Unicode normalization
empty lines
whitespace
multi-word entries
invalid entries
brand/styling exceptions
names
dictionary precedence.
Đặc biệt kiểm tra

custom-dict không được biến thành danh sách “từ đúng vì engine báo sai”.

vn-dict chỉ chứa từ tiếng Việt hợp lệ.

non-vn-dict chỉ chứa các từ non-Vietnamese thực sự cần thiết.

names phải có behavior rõ ràng.

Audit code

Kiểm tra:

src/utils/dictionary.ts
functions/api/dict/[name].ts

và các test:

tests/cross-dict-audit.test.ts
tests/dict-quality.test.ts
tests/dict-validator.test.ts
tests/merge-dicts.test.ts
Kiểm tra dictionary lifecycle

Đảm bảo flow vẫn nhất quán:

KV canonical dictionary
↓
API
↓
validation
↓
local dictionary
↓
IndexedDB cache
↓
Web Worker
Không được làm
Không tự ý xóa hàng loạt dictionary entries.
Không thay đổi hàng nghìn entries chỉ để giảm số lỗi.
Không chuyển từ này sang dictionary khác nếu chưa có lý do rõ ràng.
Không thay đổi dictionary precedence nếu behavior hiện tại chưa được test.
Acceptance criteria
Dictionary validation rõ ràng.
Cross-dictionary conflicts được phát hiện.
Precedence có test bảo vệ.
Casing/Unicode behavior được test.
Không làm tăng false positive.
TASK 3 — EPUB Round-trip Integrity
Mục tiêu

Đảm bảo:

Spell checker sửa đúng text nhưng không làm hỏng cấu trúc EPUB.

Audit

Đọc:

src/utils/epub-parser.ts
src/utils/epub-writer.ts

và toàn bộ:

tests/epub-roundtrip.test.ts
tests/epub-writer.test.ts
Test các trường hợp
Basic

<p>Hello world</p>
Nested elements
<p>xin <strong>chào</strong> bạn</p>
Multiple text nodes
<p>xin <em>chào</em> <strong>bạn</strong></p>
Multiple fixes

Một paragraph có nhiều lỗi.

Unicode

Vietnamese NFC characters.

EPUB structure

Kiểm tra:

container.xml
OPF
metadata
manifest
spine
cover
XHTML
namespaces
XML declaration
DOCTYPE nếu có
EPUB2
EPUB3
Special structures

Nếu project hỗ trợ:

footnote
endnote
ruby
inline elements
Đặc biệt audit

XMLSerializer có gây thay đổi ngoài ý muốn không.

mimetype phải tiếp tục:

uncompressed

và EPUB sau khi repack phải mở được.

Acceptance criteria
EPUB trước/sau vẫn hợp lệ.
Chỉ thay đổi text được yêu cầu.
Multiple fixes không làm sai offsets.
Nested TextNode hoạt động.
Không regression parser/writer.
Round-trip tests pass.
TASK 4 — Admin/API Security
Mục tiêu

Sửa các vấn đề security rõ ràng nhưng không over-engineer authentication.

1. login.ts

Audit:

functions/api/admin/login.ts

Kiểm tra redirect.

Không cho phép redirect tới:

https://evil.com
//evil.com

Chỉ cho phép local/internal paths phù hợp.

Ví dụ hợp lệ:

/?view=admin 2. Dictionary API

Audit:

functions/api/dict/[name].ts

Kiểm tra:

authentication
authorization
allowed dictionary names
malformed request
invalid action
empty words
duplicate words
oversized request
error handling
secret handling. 3. Admin token

Đảm bảo:

không hard-code token
không expose token phía client
không log token
không đưa token vào repository. 4. Rate limiting

Chỉ đề xuất nếu thật sự cần trong Cloudflare environment.

Không tự thêm hệ thống rate limit phức tạp nếu app cá nhân không cần.

Acceptance criteria
Không còn open redirect.
Admin endpoint không thể sử dụng trái phép.
Input validation rõ ràng.
Secret không xuất hiện trong client bundle/log.
Existing admin workflow vẫn hoạt động.
TASK 5 — Architecture & Maintainability Cleanup
Mục tiêu

Chỉ refactor sau khi 4 task trên ổn định.

Audit các file lớn

Đặc biệt:

CrossDictAuditPanel.svelte
DictAuditPanel.svelte
AdminDashboard.svelte
ContextView.svelte
state.svelte.ts
src/utils/dictionary.ts
Nguyên tắc

Không tách file chỉ vì file dài.

Chỉ refactor khi:

một module có nhiều responsibility rõ ràng
code khó test
dependency direction không rõ
duplication đáng kể
thay đổi một behavior gây ảnh hưởng nhiều phần không liên quan.
dictionary.ts

Nếu audit xác nhận cần tách, có thể cân nhắc:

dictionary/
├── repository.ts
├── loader.ts
├── normalizer.ts
├── index.ts
└── cache.ts

Nhưng chỉ làm nếu có lợi ích thực tế.

Svelte components

Tách theo responsibility:

container
├── state
├── data
├── actions
└── presentational components

Không tạo abstraction chỉ để giảm số dòng.

Tooling

Review:

lint
typecheck
tests
formatting
knip
git hooks.

Đặc biệt kiểm tra:

pre-commit

nếu đang tự động pull dictionary từ KV.

Không để git commit bất ngờ mutate working tree nếu không cần thiết.

Acceptance criteria
Behavior không thay đổi.
Test suite vẫn pass.
Không tăng complexity không cần thiết.
Module boundaries rõ hơn.
Không có large-scale rewrite.
FINAL TASK — Full Verification

Sau khi hoàn thành 5 task:

Chạy đầy đủ
pnpm check
pnpm lint
pnpm test
pnpm test:unit
pnpm test:smoke
pnpm test:regression
pnpm knip

Nếu project hiện tại dùng script khác thì đọc package.json và dùng đúng scripts hiện có, không tự tạo command mới.

Kiểm tra Git
git status
git diff
git diff --stat

AI phải kiểm tra:

không có file ngoài scope
không có debug code
không có console.log ngoài nơi được phép
không có secret
không có dictionary thay đổi ngoài ý muốn
không có dependency không cần thiết.
Thứ tự giao việc cho AI

Tôi khuyên đừng paste cả 5 task một lúc.

Giao lần lượt:

TASK 1
Accuracy Audit
↓
review kết quả
↓
TASK 2
Dictionary
↓
review kết quả
↓
TASK 3
EPUB Integrity
↓
review kết quả
↓
TASK 4
Security
↓
review kết quả
↓
TASK 5
Architecture
↓
FINAL Verification

Quan trọng: với project này, tôi đặc biệt khuyên AI không được tự động “sửa mọi thứ nó tìm thấy”. Task 1 nên có pha audit trước → report findings → mới sửa confirmed issues. Điều này sẽ tránh đúng vấn đề mà bạn từng gặp với các userscript: AI đoán nguyên nhân rồi sửa lung tung, cuối cùng code phức tạp hơn nhưng bug vẫn còn.
