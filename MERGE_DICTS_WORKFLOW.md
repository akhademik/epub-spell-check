Bạn được giao 1 hoặc nhiều files `[book-name]-corrected-dict.md` (kết quả từ bước phân loại trước đó, có các header `---NAMES---`, `---VN---`, `---NON-VN---`, `---CUSTOM---`) và repo `epub-spell-check` với 4 file dict thật tại thư mục `public/`: `names-dict.txt`, `vn-dict.txt`, `non-vn-dict.txt`, `custom-dict.txt`.

Nhiệm vụ của bạn là gộp (merge), khử trùng lặp (dedup), sắp xếp (sort theo Unicode code point chuẩn của JavaScript) và cập nhật 4 file dict thật.

---

## 1. Công cụ tiện ích tự động (Automated Script)

Dự án đã có script tiện ích chuẩn hóa tại `scripts/merge-dicts.ts` (và unit tests đi kèm tại `tests/unit/merge-dicts.test.ts`).

### Lệnh chạy:

Chạy trực tiếp bằng Node.js:

```bash
# Tự động đọc file, gộp từ, dedup, sort, ghi đè public/*-dict.txt, in báo cáo và tự xóa file tạm sau khi xong:
node scripts/merge-dicts.ts --delete <file1.md> [file2.md ...]
```

Ví dụ nếu có `book1-corrected-dict.md` và `book2-corrected-dict.md`:
```bash
node scripts/merge-dicts.ts --delete book1-corrected-dict.md book2-corrected-dict.md
```

> **Lưu ý**: Flag `--delete` sẽ tự động xóa các file markdown đầu vào sau khi merge thành công. Nếu muốn giữ lại file để kiểm tra thủ công trước thì bỏ qua flag `--delete`.

---

## 2. Quy tắc xử lý chi tiết (Implementation Rules)

Nếu cần gọi qua code / import function trong TypeScript:
```typescript
import {
  parseDictMarkdown,
  deduplicateAndSort,
  mergeWords,
  mergeDictFiles,
  formatMergeStats
} from "./scripts/merge-dicts";
```

### Các bước thực thi:
1. **Phân tích section**:
   - Header `---NAMES---` (hoặc `\---NAMES---`) → `public/names-dict.txt`
   - Header `---VN---` (hoặc `\---VN---`) → `public/vn-dict.txt`
   - Header `---NON-VN---` (hoặc `\---NON-VN---`) → `public/non-vn-dict.txt`
   - Header `---CUSTOM---` (hoặc `\---CUSTOM---`) → `public/custom-dict.txt`
2. **Khử trùng & sắp xếp (Deduplicate & Sort)**:
   - Case-sensitive deduplication.
   - Sắp xếp tăng dần theo Unicode code point chuẩn (`Array.prototype.sort()`).
   - Giữ format: mỗi từ 1 dòng, kết thúc bằng newline `\n`.
3. **Phạm vi an toàn**:
   - Không tự ý thêm bớt từ ngoài file input.
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

---

## 4. Commit

Sau khi hoàn tất và báo cáo xong, xóa các file markdown tạm (nếu chưa dùng `--delete`), chạy `git add` đúng các file dict đã thay đổi, rồi commit với message:

```bash
git add public/names-dict.txt public/vn-dict.txt public/non-vn-dict.txt public/custom-dict.txt
git commit -m "dict update"
```

*Chỉ add đúng những file dict thực sự có thay đổi.*
