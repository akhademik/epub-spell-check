# Soát lỗi chính tả EPUB (Tiếng Việt)

Một công cụ web mạnh mẽ và tiện dụng để phát hiện và sửa các lỗi chính tả trong các tệp EPUB, được thiết kế chuyên biệt cho văn bản tiếng Việt. Ứng dụng này giúp người dùng dễ dàng nâng cao chất lượng văn bản sách điện tử của mình.

## Tính năng chính

- **Phân tích EPUB toàn diện:**
  - Tải lên và xử lý các tệp `.epub` một cách hiệu quả, trích xuất nội dung văn bản và siêu dữ liệu (tiêu đề, tác giả, bìa sách).
- **Hệ thống 3 tầng từ điển đồng thời:**
  - **Từ điển tiếng Việt (`vn-dict.txt`):** Đối chiếu từ vựng tiếng Việt chuẩn.
  - **Từ điển ngoại ngữ (`non-vn-dict.txt`):** Tập hợp từ vựng và tên riêng phổ biến quốc tế (tiếng Anh, tiếng Pháp, tiếng Ý, tiếng Tây Ban Nha, tiếng Đức).
  - **Từ điển viết tắt & tuỳ chỉnh (`custom-dict.txt`):** Nhận diện các từ viết tắt chuyên ngành (ATM, VIP, DNA, FBI, GPS, BBQ,...).
- **Phát hiện lỗi chính tả tinh gọn:**
  - **Miễn nhiễm dấu thanh:** Hỗ trợ đồng thời cả 2 kiểu đặt dấu thanh mới và cũ (hòa/hoà, hóa/hoá, thủy/thuỷ, khỏe/khoẻ,...) mà không báo lỗi giả.
  - **Lỗi Tiếng Việt:** Xác định các từ không có trong từ điển tiếng Việt, viết hoa bất thường (tÔi, ViỆt), lỗi gõ máy typo (aa, ee), sai quy tắc ngữ âm (ngh/ng, gh/g, k/c).
  - **Lỗi Ngoại ngữ / Từ lạ:** Phát hiện các từ lạ hoặc từ ngoại ngữ chưa có trong từ điển ngoại ngữ.
- **Giao diện trực quan & Tiện ích tab:**
  - Tab "Từ bỏ qua" (Ignore Words / Whitelist) đặt ngay trên tab "Xem ngữ cảnh" (Preview) để quản lý danh sách bỏ qua tức thì.
  - Xem ngữ cảnh của từng lỗi với trích xuất đoạn văn, số thứ tự xuất hiện (1/N).
  - Cung cấp gợi ý sửa lỗi (nhấp để copy) và liên kết tra cứu Wiktionary, Google.
- **Quản lý danh sách bỏ qua (Whitelist):**
  - Thêm/xóa từ bỏ qua bằng nhãn màu sinh động.
  - Hỗ trợ nhập và xuất danh sách từ tệp `.txt`, `.md`.
  - Phím tắt tiện lợi để di chuyển giữa các lỗi (`⬆️`, `⬇️`) và bỏ qua từ (`Delete` / `I`).

## Cấu trúc từ điển

- `public/vn-dict.txt`: Từ điển chính cho tiếng Việt.
- `public/non-vn-dict.txt`: Từ điển ngoại ngữ (Anh, Pháp, Ý, Tây Ban Nha, Đức, địa danh, tên riêng quốc tế).
- `public/custom-dict.txt`: Từ điển viết tắt và thuật ngữ đặc biệt.
