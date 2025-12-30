# Soát lỗi chính tả EPUB (Tiếng Việt)

Một công cụ web mạnh mẽ và tiện dụng để phát hiện và sửa các lỗi chính tả trong các tệp EPUB, được thiết kế chuyên biệt cho văn bản tiếng Việt. Ứng dụng này giúp người dùng dễ dàng nâng cao chất lượng văn bản sách điện tử của mình.

## Tính năng chính

- **Phân tích EPUB toàn diện:**
  - Tải lên và xử lý các tệp `.epub` một cách hiệu quả, trích xuất nội dung văn bản và siêu dữ liệu (tiêu đề, tác giả, bìa sách).
- **Phát hiện lỗi chính tả đa dạng:**
  - **Lỗi từ điển:** Xác định các từ không có trong từ điển tiếng Việt tích hợp sẵn (`vn-dict.txt`). Hỗ trợ tải từ điển từ tệp cục bộ hoặc từ xa (GitHub) để linh hoạt.
  - **Lỗi viết hoa:** Phát hiện các trường hợp viết hoa không đúng quy tắc (ví dụ: "tÔi").
  - **Lỗi dấu thanh:** Tìm các từ có vị trí dấu thanh không chính xác (ví dụ: "Hòa" thay vì "Hoà").
  - **Lỗi cấu trúc/Ký tự lạ:** Xác định các từ chứa ký tự bất thường (như 'f', 'j', 'w', 'z' trong tiếng Việt) hoặc vi phạm quy tắc ngữ âm tiếng Việt (ví dụ: "ngh" đứng trước nguyên âm không phải "i, e, ê").
- **Giao diện trực quan:**
  - Hiển thị danh sách các lỗi được nhóm lại (từ bị lỗi, loại lỗi, số lần xuất hiện).
  - Xem ngữ cảnh của từng lỗi, giúp người dùng dễ dàng xác định và đưa ra quyết định sửa lỗi.
  - Cung cấp gợi ý sửa lỗi dựa trên các quy tắc ngữ âm và khoảng cách Levenshtein.
- **Quản lý lỗi linh hoạt:**
  - **Danh sách trắng (Whitelist):** Cho phép người dùng thêm các từ muốn bỏ qua vào danh sách trắng để không bị báo lỗi. Hỗ trợ nhập/xuất danh sách trắng từ tệp `.txt`.
  - **Lọc từ tiếng Anh:** Tùy chọn bỏ qua các từ tiếng Anh chuẩn để tập trung vào lỗi tiếng Việt.
  - **Tùy chỉnh kiểm tra:** Bật/tắt các loại kiểm tra lỗi khác nhau (từ điển, viết hoa, dấu thanh, cấu trúc) thông qua cài đặt.
- **Điều hướng và thao tác nhanh:**
  - Phím tắt tiện lợi để di chuyển giữa các lỗi (`⬆️`, `⬇️`) và bỏ qua từ (`Delete` / `I`).
  - Nút xuất lỗi để tải xuống báo cáo lỗi ở nhiều định dạng.
  - Tùy chỉnh cài đặt hiển thị văn bản (font chữ, cỡ chữ) trong phần xem ngữ cảnh.
- **Hỗ trợ đa ngôn ngữ:** Giao diện người dùng hoàn toàn bằng tiếng Việt.

## Cách sử dụng

1.  **Mở ứng dụng:** Mở tệp `index.htm` trong trình duyệt web hiện đại của bạn (Chrome, Firefox, Edge, Safari...).
2.  **Tải tệp EPUB:**
    - Kéo và thả tệp `.epub` vào vùng được chỉ định.
    - Hoặc nhấp vào vùng tải lên để chọn tệp `.epub` từ máy tính của bạn.
3.  **Xem và sửa lỗi:**
    - Ứng dụng sẽ tự động phân tích tệp và hiển thị danh sách các lỗi ở cột bên trái.
    - Nhấp vào một lỗi trong danh sách để xem từ bị lỗi được đánh dấu trong ngữ cảnh ở cột bên phải.
    - Sử dụng các nút điều hướng hoặc phím tắt để di chuyển qua lại giữa các lỗi.
    - Nếu có gợi ý sửa lỗi, chúng sẽ hiển thị bên dưới ngữ cảnh.
4.  **Quản lý Danh sách trắng:**
    - Nhập các từ bạn muốn bỏ qua vào ô "Danh sách từ bỏ soát lỗi".
    - Sử dụng nút "Import Whitelist" để tải danh sách từ tệp `.txt` và "Export Whitelist" để lưu danh sách hiện tại.
    - Để bỏ qua nhanh một từ, nhấp vào biểu tượng bỏ qua bên cạnh lỗi hoặc sử dụng phím tắt `Delete` / `I` khi lỗi đó đang được chọn.
5.  **Tùy chỉnh cài đặt:**
    - Nhấp vào biểu tượng cài đặt (bánh răng cưa) để bật/tắt các loại kiểm tra lỗi hoặc điều chỉnh cài đặt hiển thị văn bản.
6.  **Xuất lỗi:**
    - Nhấp vào nút "Xuất lỗi" để tải xuống danh sách các lỗi đã được phát hiện ở định dạng mong muốn.

## Cấu trúc dự án

- `index.htm`: Tệp HTML chính chứa toàn bộ giao diện người dùng, logic xử lý EPUB và thuật toán kiểm tra chính tả.
- `vn-dict.txt`: Từ điển chính cho tiếng Việt.
- `en-dict.txt`: Từ điển tiếng Anh, được sử dụng để lọc các từ tiếng Anh.
- `custom-dict.txt`: Từ điển bổ sung cho các từ đặc biệt hoặc tên riêng mà bạn muốn bao gồm.
- `README.md`: Tệp tài liệu này.
