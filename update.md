Nhưng mình phát hiện thêm 2 vấn đề

Và một cái trong số đó mình đánh giá là khá quan trọng.

⚠️ 1. resolveZipPath() chưa decode URL-encoded href

EPUB manifest hoàn toàn có thể có:

href="Text/Ch%C6%B0%C6%A1ng%201.xhtml"

hoặc:

href="../Images/my%20cover.jpg"

Hiện tại:

const cleanRelative = relativePath.trim().replace(/\\/g, "/")

chưa có:

decodeURIComponent(...)

nên ZIP lookup có thể tìm:

Text/Ch%C6%B0%C6%A1ng%201.xhtml

thay vì:

Text/Chương 1.xhtml
Mình khuyên sửa

Trong resolveZipPath():

let cleanRelative = relativePath.trim().replace(/\\/g, "/")

try {
cleanRelative = decodeURIComponent(cleanRelative)
} catch {
// Keep original path if malformed URI encoding
}

## Priority: P1

---

⚠️ 2. extractLeafTextElements() vẫn có khả năng sai với nested inline/block structure

Bạn đang kiểm tra:

!div.querySelector(LEAF_BLOCK_SELECTOR) &&
!div.querySelector("div")

Cái này xử lý tốt div > p.

Nhưng hãy chú ý trường hợp EPUB kiểu:

<div>
  <span>Hello</span>
  <span>world</span>
</div>

→ được coi là một block, điều này tốt.

Nhưng:

<div>
  Hello
  <section>
    <p>World</p>
  </section>
</div>

thì div không có p trực tiếp nhưng querySelector(LEAF_BLOCK_SELECTOR) vẫn bắt được p, nên loại div.

Cũng tốt.

Tuy nhiên các block element khác chưa nằm trong selector, ví dụ:

<section>
<article>
<main>
<table>
<tr>
<td>

có thể tạo structure hơi bất ngờ.

Nhưng:

Mình không muốn bạn tiếp tục mở rộng selector vô hạn.

Với spell checker, tốt hơn là định nghĩa rõ:

"Những element nào là text block mà spell checker cần kiểm tra?"

Hiện tại danh sách của bạn đã khá hợp lý.

## Không cần sửa ngay.

⚠️ 3. Mình vẫn giữ nguyên cảnh báo lớn về XMLSerializer

Writer hiện vẫn:

const serializer = new XMLSerializer()

rồi:

serializer.serializeToString(doc)

Tức là:

EPUB XHTML
↓
DOM
↓
modify
↓
serialize EVERYTHING

Thay vì:

EPUB XHTML
↓
DOM
↓
modify exact text
↓
serialize

Vấn đề không phải là output không hợp lệ.

Vấn đề là bạn có thể làm thay đổi formatting/serialization của XHTML mà user không hề yêu cầu.

Ví dụ:

<br />

có thể thành representation khác.

Namespace/attribute ordering/entity representation cũng có thể thay đổi.

Tuy nhiên

Sau khi xem bản mới, mình hạ mức độ nghiêm trọng của vấn đề này.

Nếu mục tiêu của app là:

sửa EPUB rồi đọc bình thường trên Kobo/Calibre/Apple Books

thì XMLSerializer có thể hoàn toàn chấp nhận được, miễn là integration tests xác nhận EPUB output vẫn hợp lệ.

Nếu mục tiêu là:

preserve EPUB source càng nguyên vẹn càng tốt

## thì mới cần làm surgical string patch.

Việc mình khuyên làm tiếp

Đừng refactor architecture lúc này.

Mình sẽ khóa các phần hiện tại bằng integration tests trước.

Test matrix mình muốn có:

1. plain <p>
2. <p>Hello <b>world</b></p>
3. <p>Hello <i>world</i></p>
4. multiple fixes in one paragraph
5. multiple fixes across paragraphs
6. same word appearing multiple times
7. fix crossing text nodes
8. nested div/p
9. ../ path
10. ./ path
11. URL-encoded path
12. EPUB with XHTML namespace
13. EPUB with XML declaration
14. EPUB with cover
15. repack → reopen with JSZip

Đặc biệt test cuối:

original EPUB
↓
parse
↓
detect errors
↓
apply fixes
↓
repack
↓
parse output EPUB again
↓
assert:
✓ container exists
✓ OPF exists
✓ spine works
✓ chapters exist
✓ fixed words exist
✓ EPUB remains readable

Nếu bộ này pass thì mình sẽ coi phần EPUB core của project đã khá chắc.
-Một việc nhỏ nên sửa ngay

Chỉ còn:

decodeURIComponent() trong resolveZipPath().

Sau đó mình nghĩ không cần tiếp tục chase các edge case nhỏ nữa, mà nên chuyển sang integration testing với EPUB thực tế. Đây sẽ mang lại giá trị lớn hơn nhiều so với tiếp tục soi từng utility function.
