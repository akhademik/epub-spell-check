Bạn được giao 1 hoặc nhiều files `[book-name]-corrected-dict.md` (kết quả từ bước phân loại trước đó, có các header `---NAMES---`, `---VN---`, `---NON-VN---`, `---CUSTOM---`) và repo `epub-spell-check` với 4 file dict thật tại thư mục `public/`: `names-dict.txt`, `vn-dict.txt`, `non-vn-dict.txt`, `custom-dict.txt`.

Nhiệm vụ của bạn là gộp (merge), khử trùng lặp (dedup), sắp xếp (sort theo Unicode code point chuẩn của JavaScript) và cập nhật 4 file dict thật.

---

## 0. Ở bước phân loại trước đó (`*-corrected-dict.md`)

Trước khi đưa từ vào file markdown này, đừng gộp 2 từ/2 cụm khác nhau thành 1 token dính liền (không có dấu cách) — kể cả khi trong sách gốc chúng nằm sát nhau (vd chú thích dịch nghĩa kiểu `Signor (thưa ông)` bị trích xuất dính thành `SignorThưa`). Mỗi dòng trong file `.md` phải là **đúng một từ/tên thật sự tồn tại** như vậy trong ngôn ngữ tương ứng. Đây chính là nguồn gốc phổ biến nhất của rác trong dict — script ở bước 1 có validate lại nhưng không thể bắt được 100% trường hợp, nên cẩn thận từ đầu vẫn quan trọng hơn.

---

## 1. Công cụ tiện ích tự động (Automated Script)

Dự án đã có script tiện ích chuẩn hóa tại `scripts/merge-dicts.ts` (và unit tests đi kèm tại `tests/unit/merge-dicts.test.ts`, `tests/unit/merge-dicts-validation.test.ts`).

Script **tự động validate nội dung** trước khi ghi đè file thật (xem mục 2b) — không còn merge mù mọi thứ trong file `.md` đầu vào.

### Lệnh chạy:

Chạy trực tiếp bằng Node.js:

```bash
# Tự động đọc file, validate, gộp từ, dedup, sort, ghi đè public/*-dict.txt, in báo cáo và tự xóa file tạm sau khi xong:
node scripts/merge-dicts.ts --delete <file1.md> [file2.md ...]
```

Ví dụ nếu có `book1-corrected-dict.md` và `book2-corrected-dict.md`:
```bash
node scripts/merge-dicts.ts --delete book1-corrected-dict.md book2-corrected-dict.md
```

> **Lưu ý**: Flag `--delete` sẽ tự động xóa các file markdown đầu vào sau khi merge thành công. Nếu muốn giữ lại file để kiểm tra thủ công trước thì bỏ qua flag `--delete`.

> **Bắt buộc**: đọc kỹ phần báo cáo `❌ Đã tự động loại bỏ...` và `⚠️  ... cần bạn xác nhận lại thủ công` in ra sau khi chạy (xem mục 3) trước khi commit — đừng chỉ nhìn số liệu ở mục "Báo cáo sau khi xử lý xong" rồi commit ngay.

---

## 2. Quy tắc xử lý chi tiết (Implementation Rules)

Nếu cần gọi qua code / import function trong TypeScript:
```typescript
import {
  parseDictMarkdown,
  deduplicateAndSort,
  mergeWords,
  mergeDictFiles,
  formatMergeStats,
  validateEntry,
  validateSection,
  formatValidationReport
} from "./scripts/merge-dicts";
```

### Các bước thực thi:
1. **Phân tích section**:
   - Header `---NAMES---` (hoặc `\---NAMES---`) → `public/names-dict.txt`
   - Header `---VN---` (hoặc `\---VN---`) → `public/vn-dict.txt`
   - Header `---NON-VN---` (hoặc `\---NON-VN---`) → `public/non-vn-dict.txt`
   - Header `---CUSTOM---` (hoặc `\---CUSTOM---`) → `public/custom-dict.txt`
2. **Validate nội dung** (`validateEntry` / `validateSection`, chạy trước khi merge):
   - Bị **loại bỏ tự động** (không bao giờ ghi vào file thật) nếu:
     - `VN`: từ là 1 ký tự lặp đôi kiểu `aa`, `ee`, `oo`, `đđ`... — pattern này trùng với rule bắt lỗi gõ máy `/(aa|ee|oo|uu|ii|dd|js|kx|wt)$/i` trong `src/utils/analysis-core.ts`, nếu lọt vào dict sẽ vô hiệu hoá luôn tính năng bắt lỗi gõ máy cho đúng pattern đó.
     - `NON-VN`: từ chứa ký tự chỉ có trong tiếng Việt (đ, ơ, ư, ă, hoặc nguyên âm có dấu thanh) — không thể là từ tiếng Anh/Pháp/Ý/Tây Ban Nha thật.
     - `NAMES`: từ là chuỗi lặp lại kiểu tiếng cười/thán từ (`Hahaha`, `Hừhừhừhừ`), hoặc là 2 cụm viết hoa dính liền có lẫn dấu tiếng Việt (dấu hiệu gần như chắc chắn của lỗi merge 2 từ khi trích xuất, vd `SignorThưa`, `BienĐược`).
   - Được **giữ lại nhưng in cảnh báo** (cần người xác nhận thủ công) nếu nghi ngờ ở mức thấp hơn — ví dụ 2 cụm viết hoa dính liền không lẫn tiếng Việt (có thể là tên/thương hiệu hợp lệ như `MacArthur`, `LeBron`, cũng có thể là lỗi merge tên+họ như `KatherineSolomon`), từ dài bất thường, hoặc từ khớp đúng pattern lỗi gõ máy của app nhưng không phải dạng lặp đôi đơn giản (vd `shopee`).
   - Không tự thêm quy tắc mới vào validator mà không cập nhật `tests/unit/merge-dicts-validation.test.ts` tương ứng — các rule hiện tại được rút ra từ rác thật đã tìm thấy trong đợt audit tháng 9/2026, thêm rule mới cần fixture tương tự để tránh false positive.
3. **Khử trùng & sắp xếp (Deduplicate & Sort)**:
   - Case-sensitive deduplication.
   - Sắp xếp tăng dần theo Unicode code point chuẩn (`Array.prototype.sort()`).
   - Giữ format: mỗi từ 1 dòng, kết thúc bằng newline `\n`.
4. **Phạm vi an toàn**:
   - Không tự ý thêm từ ngoài file input, và không tự ý bớt từ đã có sẵn trong 4 file dict thật ngoài những gì validator ở bước 2 tự động loại bỏ.
   - Không thay đổi các file khác trong repo ngoài 4 file dict trên (trừ khi có yêu cầu riêng).

---

## 3. Báo cáo sau khi xử lý xong

Sau khi chạy lệnh, output sẽ được in ra theo đúng format chuẩn:

```
<tên file>:
  - Số từ trước khi cập nhật: <số lượng>
  - Số từ mới được thêm: <số lượng>
  - Số từ trùng lặp bị loại bỏ: <số lượng>
  - Số từ sau khi cập nhật: <số lượng>
```

*(File dict nào không có thay đổi sẽ không xuất hiện trong báo cáo)*

Ngay sau đó là báo cáo validate nội dung:

```
❌ Đã tự động loại bỏ <N> từ nghi ngờ là rác:
  - [SECTION] "từ" — lý do

⚠️  <N> từ đã được thêm vào nhưng cần bạn xác nhận lại thủ công:
  - [SECTION] "từ" — lý do
```

- Danh sách `❌` không cần làm gì thêm — các từ này đã không được ghi vào file thật.
- Danh sách `⚠️` **phải được xem lại bằng mắt** trước khi commit. Nếu xác nhận là rác/lỗi merge → xoá dòng đó khỏi file dict tương ứng bằng tay trước khi commit. Nếu là từ/tên hợp lệ → không cần làm gì, từ đã nằm sẵn trong file.

---

## 4. Commit

Sau khi hoàn tất, đọc báo cáo mục 3, xử lý xong danh sách `⚠️` (nếu có), xóa các file markdown tạm (nếu chưa dùng `--delete`), chạy `git add` đúng các file dict đã thay đổi, rồi commit với message:

```bash
git add public/names-dict.txt public/vn-dict.txt public/non-vn-dict.txt public/custom-dict.txt
git commit -m "dict update"
```

*Chỉ add đúng những file dict thực sự có thay đổi.*
