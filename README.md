# Trình kiểm tra chính tả EPUB tiếng Việt

Đây là một công cụ kiểm tra chính tả dành cho sách EPUB tiếng Việt, giúp phát hiện và sửa các lỗi chính tả phổ biến, bao gồm lỗi từ điển, lỗi gõ máy, lỗi viết hoa và đặc biệt là lỗi đặt dấu thanh không đúng chuẩn.

## Tính năng chính

-   **Kiểm tra chính tả toàn diện**: Phát hiện các từ không có trong từ điển tiếng Việt (`vn-dict.txt`).
-   **Phát hiện lỗi gõ máy**: Nhận diện các lỗi gõ phím thông thường.
-   **Phát hiện lỗi viết hoa**: Cờ các từ có nhiều hơn một ký tự viết hoa không hợp lệ.
-   **Kiểm tra vị trí dấu thanh**: Phát hiện lỗi đặt dấu thanh không đúng chuẩn cho các vần `oa`, `oe` (ví dụ: "khoá" -> "khóa", "hoà" -> "hòa").
-   **Gợi ý sửa lỗi**: Đề xuất các từ đúng chính tả hoặc cách đặt dấu thanh phù hợp.
-   **Danh sách bỏ qua (Whitelist)**: Cho phép người dùng thêm các từ muốn bỏ qua (tên riêng, từ nước ngoài, từ lóng...) để tránh báo lỗi không cần thiết.
-   **Bỏ qua từ tiếng Anh/tên riêng**: Tùy chọn bỏ qua các từ tiếng Anh (từ `en-dict.txt`) hoặc các từ có vẻ là tên riêng/từ nước ngoài để tránh báo lỗi không cần thiết.
-   **Hiển thị ngữ cảnh**: Khi chọn một lỗi, hiển thị đoạn văn bản chứa lỗi để người dùng dễ dàng kiểm tra.
-   **Chỉ báo lỗi trực quan**: Các lỗi được hiển thị bằng chấm màu sắc khác nhau, mỗi màu đại diện cho một loại lỗi cụ thể, giúp dễ dàng nhận biết.
    -   **Vàng**: Sai vị trí dấu thanh
    -   **Xanh Indigo**: Không có trong từ điển
    -   **Tím**: Lỗi gõ máy (Typo)
    -   **Xanh Teal**: Từ lạ / Tiếng nước ngoài
    -   **Xanh lá cây**: Lỗi viết hoa
-   **Tra cứu Wiktionary**: Nút tra cứu nhanh trên Wiktionary cho các từ không có trong từ điển.
-   **Xử lý tệp EPUB ngoại tuyến**: Toàn bộ quá trình kiểm tra diễn ra trên trình duyệt của bạn, không gửi dữ liệu sách lên máy chủ.

## Cách sử dụng


2.  **Tải tệp EPUB**:
    *   Kéo và thả tệp `.epub` của bạn vào khu vực "Tải sách lên".
    *   Hoặc nhấp vào khu vực đó để chọn tệp `.epub` từ máy tính của bạn.
3.  **Quá trình kiểm tra**:
    *   Ứng dụng sẽ bắt đầu giải nén và phân tích nội dung sách. Một thanh tiến trình sẽ hiển thị trạng thái.
    *   Sau khi phân tích xong, danh sách các lỗi chính tả sẽ xuất hiện ở cột bên trái.
4.  **Xem và sửa lỗi**:
    *   **Danh sách lỗi**: Cột bên trái hiển thị danh sách các từ bị lỗi, kèm theo các chấm màu biểu thị loại lỗi và số lượng lỗi.
    *   **Chi tiết lỗi**: Nhấp vào một từ lỗi trong danh sách để xem chi tiết ở cột bên phải:
        *   **Ngữ cảnh**: Đoạn văn bản chứa từ lỗi được tô sáng.
        *   **Loại lỗi**: Mô tả chi tiết loại lỗi (có chấm màu).
        *   **Gợi ý**: Các từ gợi ý để sửa lỗi.
        *   **Tra cứu Wiktionary**: Nếu lỗi là "Không có trong từ điển", sẽ có nút để tra cứu từ đó trên Wiktionary.
    *   **Bỏ qua lỗi**: Nhấp vào nút bỏ qua (biểu tượng mắt gạch chéo) bên cạnh từ lỗi trong danh sách để thêm từ đó vào danh sách bỏ qua (whitelist) của bạn. Từ này sẽ không bị báo lỗi trong các lần kiểm tra sau.
5.  **Quản lý danh sách bỏ qua (Whitelist)**:
    *   Khu vực "Thêm từ bỏ qua (Whitelist - Đã lưu)" cho phép bạn xem và chỉnh sửa danh sách các từ đã bỏ qua. Các từ này sẽ tự động được lưu vào trình duyệt của bạn.

6.  **Kiểm tra tệp khác**: Nhấp vào nút "Kiểm tra tệp khác" ở góc trên bên phải để tải một tệp EPUB mới.