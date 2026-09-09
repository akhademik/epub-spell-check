1. ⚠️ Pre-commit hook đang có một vấn đề lớn hơn bạn nghĩ

Hiện hook chạy:

pre-commit
→ pnpm dicts:pull-from-kv
→ wrangler kv key get × 4
→ git add public/\*.txt
→ commit tiếp tục

Cách này đúng về mặt workflow, nhưng script hiện tại chỉ đọc wrangler.toml và lấy id bằng regex.

Điều mình lo hơn là:

const cmd = `npx wrangler kv key get ...`

Bạn đang dùng npx trong một project mà package manager chính là pnpm.

Trong package.json, toàn bộ workflow hiện tại dùng pnpm, và tsx/Wrangler workflow cũng nên nhất quán theo hướng đó.

Mình đề xuất

Nếu Wrangler đã là dependency của project:

pnpm exec wrangler ...

Nếu chưa muốn thêm Wrangler dependency, vẫn có thể giữ npx, nhưng mình thích:

pnpm dlx wrangler ...

hơn npx trong môi trường pnpm.

Nhưng tốt nhất: kiểm tra xem Wrangler hiện được khai báo ở đâu. Nếu chưa có, mình sẽ không vội thêm dependency chỉ vì hook.

---

2. ⚠️ Non-blocking hiện tại hơi "quá im lặng"

Đây là điểm mình muốn bạn sửa.

Hiện tại:

} catch {
// Non-blocking: network timeout, offline, not logged in to wrangler
}

Tức là:

KV pull fail → commit vẫn thành công → nhưng developer không biết dictionary không được sync.

Điều này nguy hiểm hơn việc block commit.

Ví dụ:

KV:
vn-dict = 10,000 words

local:
vn-dict = 9,500 words

git commit

Nếu Wrangler login hết hạn, hook fail nhưng không báo gì.

Sau đó bạn push commit và tưởng rằng public/ đã đồng bộ KV.

Mình đề xuất behavior:
KV sync thành công
↓
✓ synced

KV không truy cập được
↓
⚠️ WARNING: KV sync skipped
commit vẫn tiếp tục

Tức là non-blocking nhưng observable.

Ví dụ:

⚠️ [dict-sync] Không thể đồng bộ vn-dict từ KV.
Commit vẫn tiếp tục.
Lý do: Wrangler authentication/network unavailable.

Không cần dump stack trace.

Đây là một thay đổi nhỏ nhưng rất đáng làm.

---

3. 🔴 Quan trọng: hook đang git add nhưng chưa bảo vệ staged state

Đây là edge case mình nghĩ nên xử lý.

Giả sử bạn đang sửa:

public/vn-dict.txt

và đã stage một phần.

Sau đó:

git commit

hook lấy KV rồi:

fs.writeFileSync(...)
git add public/vn-dict.txt

=> toàn bộ file dictionary mới có thể được stage.

Trong trường hợp dictionary là generated/synchronized artifact thì điều này có thể đè lên ý định staging của developer.

Mình nghiêng về policy:

public/\*-dict.txt là generated mirror của KV → hook có quyền cập nhật toàn bộ file.

Nếu đó là chủ đích của project thì OK, nhưng phải ghi rõ trong documentation:

public/\*-dict.txt không được manually edit; KV là source of truth.

Hiện README đã nói chúng là static/fallback data và production ưu tiên KV, nhưng chưa nhấn đủ mạnh rằng KV là canonical source.

Mình khuyên thêm:

Cloudflare KV = canonical dictionary source
public/\*-dict.txt = local/dev/fallback snapshot

Cái này sẽ làm architecture rõ ràng hơn rất nhiều.

---

4. Multi-toggle hiện tại đã đúng architecture, nhưng còn một bug UX nhỏ

Phần này mình đánh giá cao thay đổi của bạn.

Hiện tại:

enabledErrorTypes = $state<Set<ErrorType>>(...)

và:

currentFilteredErrors = $derived(
getFilteredErrors(
...
this.enabledErrorTypes
)
)

Sau đó:

totalErrorInstances
totalErrorGroups

đều derive từ currentFilteredErrors.

=> Đây chính xác là architecture nên có.

---

Nhưng isAllSelected có semantics hơi lạ

Bạn đang dùng:

ALL_ERROR_TYPES.every(
(t) => appState.enabledErrorTypes.has(t)
)

và button:

{isAllSelected ? "Bỏ chọn tất cả" : "Tất cả"}

Logic này thực ra ổn.

Nhưng UX:

[Tất cả] [Từ điển VN] [Ngoại ngữ] [Viết hoa] ...

khi chỉ bật:

VN + Ngoại ngữ + Typo

button hiện:

Tất cả

và click vào sẽ bật toàn bộ.

Đúng.

Nhưng khi tất cả đang bật, button:

Bỏ chọn tất cả

là hơi khác convention của UI filter.

Mình vẫn giữ nguyên, vì nó giúp thao tác nhanh.

---

5. Có một điểm mình muốn bổ sung vào test

Test hiện tại đã có:

should filter out errors whose type is not in enabledTypes

và:

should return empty array when enabledTypes is empty

=> tốt.

Nhưng còn thiếu interaction giữa các filter.

Đây mới là regression test quan trọng.

Ví dụ:

enabledTypes = Dictionary + Typo
checkSettings.vietnamese = false

Expected:

[]

vì:

enabledTypes
↓
Dictionary + Typo
↓
Vietnamese check OFF
↓
lọc tiếp
↓
[]

Nên có test:

should apply enabledTypes together with checkSettings 6. Mình cũng muốn test SpecialCharacter

Trong code bạn đã chính thức đưa:

ALL_ERROR_TYPES = [
"Dictionary",
"NonVietnamese",
"Uppercase",
"Typo",
"Spelling",
"SpecialCharacter"
]

và UI cũng dynamically thêm SpecialCharacter.

Nhưng test fixture hiện tại chưa có SpecialCharacter.

Mình sẽ thêm ít nhất:

Dictionary
NonVietnamese
Uppercase
Typo
Spelling
SpecialCharacter

rồi test:

enabledTypes = [SpecialCharacter]

Expected:

only SpecialCharacter

Điều này đảm bảo sau này thêm type mới không vô tình làm filter hỏng.

7. Một vấn đề kiến trúc nhỏ: filter.ts đang có 2 tầng filter

Hiện:

if (enabledTypes && !enabledTypes.has(group.type)) {
return false
}

sau đó lại:

if (!checkSettings.nonVietnamese && ...)

và:

if (!checkSettings.vietnamese && ...)

Tức là:

enabledErrorTypes +
checkSettings +
whitelist +
custom +
names

đều filter cùng một pipeline.

Hiện tại chưa cần refactor.

Nhưng về lâu dài mình sẽ đổi semantics documentation thành:

enabledErrorTypes
= UI visibility filter

checkSettings
= analysis-category enable/disable

Hai cái này không cùng ý nghĩa.

Ví dụ:

Vietnamese checking = ON
Dictionary filter = OFF

nghĩa là:

vẫn phân tích Dictionary nhưng UI không hiển thị Dictionary.

Trong khi:

Vietnamese checking = OFF

nghĩa là:

không coi Vietnamese errors là active.

Đây là distinction rất quan trọng.

8. Một cải tiến mình rất khuyến nghị: reset selection khi filter làm mất current group

Hiện:

currentGroup = $derived.by(() => {
if (this.currentFilteredErrors.length === 0) return null

if (this.selectedGroupId) {
const match = this.currentFilteredErrors.find(
(g) => g.id === this.selectedGroupId
)
if (match) return match
}

return this.currentFilteredErrors[0]
})

Cách này không sai.

Nhưng:

User đang chọn:
Typo → "teh"

User tắt Typo

selectedGroupId vẫn giữ:

teh-Typo

currentGroup fallback sang item đầu tiên.

Nhưng state:

selectedGroupId

vẫn là ID cũ.

Điều này có thể tạo những edge case khó debug sau này.

Mình đề xuất

Khi filter thay đổi:

selectedGroupId không còn tồn tại
↓
selectedGroupId = null
currentInstanceIndex = 0

Hoặc tốt hơn nữa, làm cho currentGroup trở thành source of truth và không phụ thuộc quá nhiều vào stale selection.

Không phải blocker, nhưng nên xử lý trước khi project lớn hơn.

9. visibleCount hiện tại xử lý khá tốt

Mình đã kiểm tra ErrorList.svelte.

Bạn đã làm:

if (searchQuery.trim()) ...

sau đó:

list.sort((a, b) => b.count - a.count)

và:

filteredList.slice(0, visibleCount)

Đồng thời mỗi lần toggle:

visibleCount = 30

và search cũng reset về 30.

Phần này mình không đề xuất sửa.

Đây là implementation đơn giản và hợp lý.

10. Một thứ nữa nên thêm: test persistence của filter

Bạn đã làm:

saveStorage(
STORAGE_KEYS.ENABLED_ERROR_TYPES,
Array.from(next)
)

và load lại bằng:

loadStorage<ErrorType[]>(
STORAGE_KEYS.ENABLED_ERROR_TYPES,
ALL_ERROR_TYPES
)

Đây là feature mới nhưng test hiện tại chủ yếu test getFilteredErrors, chưa test persistence.

Mình sẽ thêm test cho:

default
→ all enabled

toggle Typo
→ Typo disabled

reload
→ Typo remains disabled

Nếu test AppStateModel khó vì Svelte 5 state runtime thì ít nhất nên có test cho helper/storage logic nếu bạn tách được.
