Nhưng còn 1 việc mình vẫn khuyên làm
⚠️ Integration test cho URL encoded path

Bạn đã implement fix, nhưng mình chưa thấy evidence đủ mạnh rằng regression test đã khóa case này.

Mình muốn có test kiểu:

resolveZipPath(
"OEBPS/Text",
"../Images/My%20Cover.jpg"
)
===
"Images/My Cover.jpg"

và:

resolveZipPath(
"",
"Text/Ch%C6%B0%C6%A1ng%201.xhtml"
)
===
"Text/Chương 1.xhtml"

Tương tự test:

malformed % encoding

không được throw.

Implementation: ✅

## Regression test: mình chưa thể xác nhận là đã có.

Một vấn đề mới mình muốn bạn chú ý

Không phải blocker, nhưng khá đáng kiểm tra:

Trong parser:

const doc = parser.parseFromString(html, "text/html")

nhưng trong writer:

const isXhtml =
filePath.endsWith(".xhtml") ||
filePath.endsWith(".xml")

parser.parseFromString(
content,
isXhtml ? "application/xhtml+xml" : "text/html"
)

Tức là parser và writer đang parse cùng XHTML bằng hai parsing mode khác nhau.

Điều này có thể tạo discrepancy:

parseEpub()
↓
textBlocks / blockId

nhưng khi write:

parse XHTML differently
↓
extractLeafTextElements()
↓
block ordering

Trong phần lớn EPUB bình thường thì không sao, nhưng với malformed XHTML hoặc XML-specific structure thì có thể lệch.

Mình đề xuất đơn giản nhất:

Parser cũng nên detect XHTML/XML và dùng:

application/xhtml+xml

giống writer.

Sau đó fallback HTML nếu XML parse error.

Như vậy:

       PARSER
         │
         │ same parsing mode
         ▼
       WRITER

sẽ deterministic hơn.
