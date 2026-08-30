# Soát lỗi chính tả EPUB (Tiếng Việt)

Một công cụ web hiện đại, nhanh chóng và mạnh mẽ để phát hiện và sửa các lỗi chính tả trong các tệp EPUB, được thiết kế chuyên biệt cho văn bản tiếng Việt. Ứng dụng hoạt động 100% trên trình duyệt (client-side), bảo mật tuyệt đối dữ liệu sách và hỗ trợ xử lý Web Worker đa luồng.

## Tính năng chính

- **Phân tích EPUB toàn diện:**
  - Tải lên và xử lý các tệp `.epub` dung lượng lớn với tốc độ cao, trích xuất nội dung văn bản từng hồi, từng chương và siêu dữ liệu (tiêu đề, tác giả, bìa sách).
- **Hệ thống 4 tầng từ điển hoạt động đồng thời (4-Tier Dictionary):**
  - **1. Từ điển Tiếng Việt (`vn-dict.txt` - ~9.1k từ):** Đối chiếu từ vựng tiếng Việt chuẩn.
  - **2. Từ điển Tên riêng & Địa danh (`names-dict.txt` - ~10.9k từ):** Tên nhân vật lịch sử, địa lý, tác phẩm, thương hiệu quốc tế và phương Tây.
  - **3. Từ điển Ngoại ngữ & Từ mượn (`non-vn-dict.txt` - ~6.0k từ):** Tập hợp từ vựng mượn thông dụng và ngôn ngữ quốc tế (Anh, Pháp, Nga, Ý, Tây Ban Nha,...).
  - **4. Từ điển Viết tắt & Tuỳ chỉnh (`custom-dict.txt` - ~260 từ):** Nhận diện các từ viết tắt kỹ thuật, tổ chức, số La Mã (VIP, ATM, DNA, FBI, CIA, NKVD, GPU, XIX, XXI,...).
- **Cơ chế kiểm tra thông minh & Khử trùng tuyệt đối:**
  - **Soát lỗi Case-Insensitive:** Tên riêng (`Jeans`, `Olive`, `Alexander`) hay chữ thường (`jeans`, `olive`, `alexander`) đều được nhận diện hợp lệ không phân biệt hoa thường.
  - **Quy tắc bắt lỗi viết hoa (≥ 2 chữ in hoa):** Các từ viết hoa bất thường (do gõ nhầm CapsLock `tÔi`, `sÁch`) sẽ được phát hiện chính xác, trừ khi nằm trong từ điển viết tắt (`custom-dict.txt`).
  - **Miễn nhiễm dấu thanh mới & cũ:** Hỗ trợ song song cả 2 phong cách đặt dấu thanh (`hòa`/`hoà`, `hóa`/`hoá`, `thủy`/`thuỷ`, `khỏe`/`khoẻ`,...) mà không báo lỗi giả.
  - **Lỗi Tiếng Việt:** Phân loại rõ ràng từ không có trong từ điển tiếng Việt, lỗi gõ máy typo (`aa`, `ee`, `oo`), lỗi sai quy tắc phụ âm chính tả (`ngh`/`ng`, `gh`/`g`, `k`/`c`).
- **Giao diện trực quan & Trải nghiệm đọc sách tối ưu:**
  - Giao diện Responsive hoàn hảo cho cả thiết bị di động và máy tính để bàn.
  - Khung xem trước ngữ cảnh (Preview Context) mở rộng, hiển thị thoáng mắt với độ giãn dòng `1.8`, làm nổi bật từ lỗi.
  - Tích hợp công cụ tra cứu tức thì 1-click trên **Wiktionary** và **Google Search**.
  - Bảng gợi ý từ đúng thông minh với khoảng cách Levenshtein (nhấp để sao chép vào bộ nhớ tạm).
  - Xuất toàn bộ danh sách từ lỗi sạch ra tệp văn bản nhanh chóng.
- **Quản lý danh sách bỏ qua (Whitelist):**
  - Thêm/xóa từ bỏ qua bằng nhãn màu sinh động.
  - Hỗ trợ nhập và xuất danh sách từ tệp `.txt`, `.md`.
  - Phím tắt bàn phím tiện lợi: di chuyển giữa các lỗi (`⬆️`, `⬇️`), chọn vị trí (`⬅️`, `➡️`) và bỏ qua từ (`Delete` / `I`).

## Cấu trúc từ điển (`public/`)

- `public/vn-dict.txt`: Từ điển từ vựng tiếng Việt chuẩn.
- `public/names-dict.txt`: Từ điển tên riêng, nhân danh, địa danh lịch sử.
- `public/non-vn-dict.txt`: Từ điển từ ngữ ngoại ngữ và từ mượn quốc tế.
- `public/custom-dict.txt`: Từ điển từ viết tắt và chữ số La Mã.

## Phát triển & Kiểm thử

Dự án sử dụng **Svelte 5 (Runes)**, **Vite**, **TypeScript**, **Tailwind CSS**, **Biome** và **Vitest**:

```bash
# Cài đặt dependencies
pnpm install

# Khởi chạy máy chủ phát triển
pnpm dev

# Kiểm tra kiểu TypeScript & Svelte
pnpm check

# Kiểm tra Linter & Format
pnpm lint
pnpm format:check

# Quét mã rác / Dead code audit
pnpm knip

# Chạy toàn bộ bộ kiểm thử tự động
pnpm test

# Đóng gói Production
pnpm build
```
