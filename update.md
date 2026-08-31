6. Có một vấn đề EPUB mình vẫn muốn bạn sửa

Đây là điểm kỹ thuật quan trọng nhất còn lại.

Trong writer:

const serializer = new XMLSerializer()

sau đó:

serializer.serializeToString(doc)

Bạn đang parse XHTML rồi serialize toàn bộ document lại.

Điều này có nguy cơ làm thay đổi những thứ không liên quan đến spelling fix:

namespace formatting
attribute representation
empty elements
entity representation
HTML/XHTML serialization
casing/formatting
một số metadata trong XHTML

Bạn đã cố giữ XML declaration, nhưng vẫn chưa đảm bảo:

EPUB input → sửa một vài chữ → mọi thứ khác byte/semantic-preserving tối đa

Đặc biệt EPUB thực tế có thể rất "dị".

Mình khuyên

Nếu muốn project đạt mức production-grade:

Không serialize lại toàn bộ XHTML nếu không cần.

Thay vào đó nên có chiến lược:

parse DOM
↓
locate exact text range
↓
modify text
↓
serialize

hoặc tốt hơn nữa, nếu có thể:

original XHTML string
↓
calculate offsets
↓
patch exact text ranges
↓
keep everything else unchanged

Cách thứ hai khó hơn nhưng cực kỳ phù hợp với một EPUB spell checker.

---

7. EPUB parser còn một vấn đề khá đáng chú ý

Hiện tại bạn lấy:

doc.querySelectorAll(
"p, h1, h2, h3, h4, h5, h6, li, div"
)

Điều này có một edge case:

<div>
  <p>Hello</p>
  <p>World</p>
</div>

Bạn sẽ lấy cả:

div → Hello World
p → Hello
p → World

Tức là nested container có thể tạo duplicate text blocks.

Với EPUB được tạo sạch thì thường không gây lỗi trực tiếp vì spell checking chỉ đánh từng block, nhưng:

div có thể chứa toàn bộ chapter
nested <div>

<section>
<article>
<blockquote>

có thể khiến textBlocks phình rất mạnh.

Mình đề xuất

Thay vì lấy cả div, nên xác định leaf text blocks.

Ví dụ ưu tiên:

p
h1-h6
li
blockquote
pre
...

và chỉ dùng div nếu nó thực sự chứa text trực tiếp mà không có block children.

Đây là thứ mình sẽ ưu tiên sửa trước khi tối ưu thêm performance.

--

8. Một vấn đề khác: path resolution

Bạn đang:

const opfDir = rootPath.substring(0, rootPath.lastIndexOf("/"))

const resolvePath = (p: string) =>
opfDir ? `${opfDir}/${p}` : p

Cách này không xử lý chuẩn relative path.

Ví dụ OPF:

OEBPS/content.opf

và:

href="../Images/cover.jpg"

thì bạn tạo:

OEBPS/../Images/cover.jpg

Trong khi ZIP entry thực tế có thể là:

Images/cover.jpg

JSZip.file() không phải filesystem resolver.

Nên có một resolveZipPath()

Normalize:

OEBPS/../Images/cover.jpg
↓
Images/cover.jpg

## Đây là edge case EPUB rất đáng xử lý.

Dictionary loading: tốt nhưng vẫn có một bottleneck

Bạn đang load:

Promise.all([
getDictionary("vn"),
getDictionary("non-vn"),
getDictionary("custom"),
getDictionary("names")
])

sau đó build 4 indexed dictionaries:

dictionaries.indexed = {
vietnamese: buildIndexedDictionary(...),
nonVietnamese: buildIndexedDictionary(...),
custom: buildIndexedDictionary(...),
names: buildIndexedDictionary(...)
}

Điều này rất hợp lý về runtime lookup nhưng tốn RAM.

Đặc biệt:

wordsArr
byLength
baseWordCache
Set

có thể khiến cùng một vocabulary tồn tại qua nhiều structure.

Với dictionary 100k–500k words, memory footprint có thể đáng kể.

Nhưng:

Hiện tại mình chưa khuyên tối ưu chỗ này.

Nếu thực tế EPUB 1–2 MB → vài chục nghìn words thì chưa đáng.

## Đừng premature optimize.

10. state.svelte.ts đang hơi quá lớn

Đây là architectural issue mình vẫn thấy.

AppStateModel hiện đang quản:

dictionaries
dictionary status
check settings
reader settings
whitelist
EPUB data
errors
fixes
navigation
UI state
toast
storage
EPUB parsing
EPUB writing
exporting
whitelist import/export

Nó đang trở thành một kiểu:

God Object

Chưa phải vấn đề ngay lập tức, nhưng project sẽ khó maintain khi thêm feature.

Mình sẽ chia dần thành:

state/
├── app-state.svelte.ts
├── book-state.svelte.ts
├── analysis-state.svelte.ts
├── whitelist-state.svelte.ts
└── ui-state.svelte.ts

hoặc giữ một AppStateModel nhưng delegate:

AppStateModel
├── DictionaryService
├── AnalysisService
├── EpubService
├── WhitelistService
└── StorageService

## Không cần refactor ngay. Nhưng đây là technical debt lớn nhất về architecture hiện tại.

11. Một điểm nhỏ nhưng đáng sửa: localStorage

Bạn đang:

localStorage.getItem()
JSON.parse()

và:

localStorage.setItem()

cho settings/whitelist.

Cái này ổn.

Nhưng whitelist có:

WHITELIST_WORD_COUNT_LIMIT
WHITELIST_WORD_LENGTH_LIMIT

nên bạn đã có guard khá tốt.

Mình chỉ muốn thêm:

schema version

cho persisted settings.

Ví dụ:

{
version: 2,
data: ...
}

Sau này đổi structure sẽ dễ migrate hơn.
