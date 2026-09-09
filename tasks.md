# Task List: Cải thiện logic soát lỗi tiếng Việt — epub-spell-check

Ưu tiên theo mức độ tác động thực tế (impact) và độ khó (effort). Nên làm theo thứ tự trên xuống.

---

## 🔴 P0 — Sửa bug làm gợi ý sai (impact cao, effort thấp)

File liên quan: `src/utils/analyzer.ts`

- [x] **1.1 — Sửa hard filter `fullDistance <= maxAllowedDistance` loại nhầm ứng viên đúng**
  - Vị trí: đoạn `if (fullDistance > maxAllowedDistance) { ... }` (~dòng 185-193)
  - Vấn đề: khi từ gõ sai bị mất chữ "đ" (vd `duong` → `đường`), fullDistance = 3 vượt ngưỡng, ứng viên bị loại hoàn toàn dù baseDistance chỉ = 1.
  - Việc cần làm: cho phép ứng viên đi tiếp nếu `baseDistance <= 1`, bất kể `fullDistance` bao nhiêu (không raise threshold đồng thời cho cả hai).
  - Test cần thêm: `findTieredSuggestions("duong", ...)` phải chứa `"đường"`.

- [x] **1.2 — Sửa công thức tính điểm khiến từ "khác gốc âm tiết" đè điểm từ "cùng gốc âm tiết"**
  - Vị trí: khối `if (baseDistance === 0 && fullDistance === 2) {...} else if (fullDistance <= 2) {...}` (~dòng 217-223)
  - Vấn đề: nhánh baseDistance=0 cho điểm cố định (20), trong khi nhánh baseDistance≥1 có công thức có thể ra điểm thấp hơn (tốt hơn) → từ hoàn toàn khác gốc thắng từ chỉ khác dấu thanh.
  - Việc cần làm: tách hẳn 2 tier bằng offset không chồng lấn (vd: baseDistance=0 luôn có điểm < mọi ứng viên baseDistance≥1, bất kể priorityWeight/fullDistance).
  - Test cần thêm: `findTieredSuggestions("truong", ...)` phải có `"trường"` trong **primary hoặc top secondary**, đứng trước các từ base word khác (`ruồng`, `ruộng`...).

- [x] **1.3 — Viết bộ test hồi quy cho nhóm lỗi "mất dấu toàn bộ" (no-diacritic typo)**
  - Đây là loại lỗi phổ biến nhất khi gõ nhanh/dán từ nguồn không dấu. Thêm test cho: `hoc→học`, `duong→đường`, `truong→trường`, `nguoi→người`, `chuyen→chuyện`, `thuong→thương`.
  - Chạy lại toàn bộ, xác nhận không có từ nào trong nhóm này bị rớt khỏi top gợi ý.

---

## 🟠 P1 — Làm sạch dictionary (impact cao, effort trung bình)

File liên quan: `public/vn-dict.txt`, `src/utils/dict-quality.ts`, `src/utils/dict-validator.ts`

- [x] **2.1 — Gỡ bỏ entry rác đã phát hiện**
  - Xác nhận đã thấy: `nhửng` (dòng 5376, cạnh `những`) — không phải từ thật, khiến lỗi gõ sai "những"→"nhửng" không bao giờ bị bắt.
  - Cần rà toàn bộ dictionary tìm các entry tương tự (âm tiết hợp lệ về cấu trúc nhưng không phải từ thật).

- [ ] **2.2 — Đối chiếu chéo `vn-dict.txt` với nguồn từ điển chuẩn khác**
  - Dùng Hunspell `vi_VN` (hoặc nguồn từ điển tiếng Việt mở khác) làm baseline để tìm các entry không khớp với bất kỳ từ điển chuẩn nào.
  - Xuất danh sách nghi vấn ra CSV/report để duyệt thủ công trước khi xoá hàng loạt (tránh xoá nhầm từ hiếm nhưng có thật).

- [ ] **2.3 — Nâng cấp `dict-quality.ts` / `dict-validator.ts` thêm bước "semantic real-word check"**
  - Hiện tại chỉ check pattern rác (OCR merge, số, ký tự lặp, tỉ lệ nguyên âm) — không kiểm tra từ có tồn tại thực trong tiếng Việt.
  - Việc cần làm: thêm bước so khớp với danh sách baseline ở mục 2.2, gắn cờ Tier B nếu không tìm thấy trong baseline nào.

---

## 🟡 P2 — Bổ sung phát hiện lỗi "từ đúng nhưng sai ngữ cảnh" (impact cao nhất về lâu dài, effort cao nhất)

Đây là nhóm lỗi phổ biến nhất trong văn bản tiếng Việt thực tế nhưng **hiện công cụ hoàn toàn bỏ sót** vì kiến trúc chỉ tra từ điển đơn lẻ (unigram), không có ngữ cảnh.

- [x] **3.1 — Xây danh sách "cặp từ/cụm dễ nhầm" (confusable pairs) đã biết**
  - Gom danh sách kinh điển: `dành/giành`, `sử/xử`, `sẻ/xẻ`, `sát nhập/sáp nhập`, `chuẩn đoán/chẩn đoán`, `thăm quan/tham quan`, `sáng lạng/sáng lạn`, `vô hình chung/vô hình trung`, `tựu chung/tựu trung`, `bàng quan/bàng quang`, `cọ sát/cọ xát`...
  - Có thể mở rộng dần qua thời gian khi phát hiện thêm case thực tế từ người dùng.

- [x] **3.2 — Viết module quét theo n-gram (1-3 từ liền kề)**
  - Khác với `getErrorType` hiện tại (chạy trên từng token rời), module này cần nhận cụm từ + ngữ cảnh xung quanh để so khớp với danh sách 3.1.
  - Với các cặp 1-1 rõ ràng sai hoàn toàn (vd "chuẩn đoán" luôn sai) → gắn cờ trực tiếp.
  - Với các cặp phụ thuộc ngữ nghĩa (vd "dành"/"giành" đều đúng tùy câu) → có thể chỉ nên gợi ý xem lại (soft warning) chứ không auto-flag như lỗi, tránh false positive.

- [x] **3.3 — Thiết kế loại lỗi mới trong `ErrorType`** (vd `ContextConfusion`) để tách biệt với `UnknownWord`/`Spelling` hiện có, giúp người dùng phân biệt được đây là loại cảnh báo "nên xem lại" chứ không phải lỗi chắc chắn.

---

## 🟢 P3 — Cải thiện xếp hạng gợi ý bằng tần suất từ (impact trung bình, effort trung bình)

- [x] **4.1 — Tìm/build word-frequency list tiếng Việt**
  - Nguồn gợi ý: Vietnamese Wikipedia dump, VLSP corpus, hoặc OSCAR-vi.
  - Output: file `vn-freq.txt` dạng `từ<TAB>tần suất` hoặc rank.

- [x] **4.2 — Dùng tần suất làm tie-breaker trong `findTieredSuggestions`**
  - Hiện tại khi nhiều ứng viên đồng điểm, thứ tự phụ thuộc thứ tự trong file (gần như ngẫu nhiên).
  - Việc cần làm: thêm tần suất vào công thức sort cuối (hoặc chỉ dùng làm tie-break khi điểm bằng nhau).

---

## Gợi ý thứ tự thực hiện

1. P0 (1.1 → 1.3): fix nhanh, có thể làm trong 1 buổi, tác động ngay tới độ chính xác gợi ý.
2. P1 (2.1 → 2.3): dọn dictionary, nên làm sau P0 vì cần chạy lại test suite để đảm bảo không xoá nhầm từ đang được dùng làm gợi ý đúng ở đâu đó.
3. P2 (3.1 → 3.3): đầu tư lớn nhất nhưng giải quyết đúng nhóm lỗi phổ biến nhất — nên làm sau khi nền tảng (P0, P1) đã ổn định.
4. P3 (4.1 → 4.2): cải thiện thêm, có thể làm song song hoặc sau cùng.
