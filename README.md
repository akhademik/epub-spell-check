# Trình kiểm tra chính tả EPUB tiếng Việt

Đây là một công cụ kiểm tra chính tả dành cho sách EPUB tiếng Việt, giúp phát hiện và sửa các lỗi chính tả phổ biến, bao gồm lỗi từ điển, lỗi gõ máy, lỗi viết hoa, lỗi đặt dấu thanh và các lỗi quy tắc ngữ pháp cơ bản.

## Tính năng chính

-   **Kiểm tra chính tả toàn diện**: Phát hiện các từ không có trong từ điển tiếng Việt (`vn-dict.txt`).
-   **Kiểm tra quy tắc ngữ pháp**: Phát hiện lỗi sử dụng `ng/ngh`, `g/gh`, `c/k` không đúng ngữ cảnh.
-   **Phát hiện lỗi gõ máy**: Nhận diện các lỗi gõ phím thông thường (ví dụ: `aa`, `ee`, `wt`).
-   **Phát hiện lỗi viết hoa**: Cờ các từ có nhiều hơn một ký tự viết hoa không hợp lệ.
-   **Kiểm tra vị trí dấu thanh**: Phát hiện lỗi đặt dấu thanh không đúng chuẩn cho các vần `oa`, `oe` (ví dụ: "khoá" -> "khóa", "hoà" -> "hòa").
-   **Gợi ý sửa lỗi**: Đề xuất các từ đúng chính tả hoặc cách đặt dấu thanh phù hợp.
-   **Quản lý danh sách bỏ qua (Whitelist) nâng cao**:
    -   Cho phép người dùng thêm các từ muốn bỏ qua (tên riêng, từ nước ngoài, từ lóng...).
    -   **Nhập (Import)** danh sách từ tệp `.txt`.
    -   **Xuất (Export)** danh sách hiện tại ra tệp `.txt` để lưu trữ hoặc chia sẻ.
-   **Bỏ qua từ tiếng Anh**: Tùy chọn bỏ qua các từ tiếng Anh chuẩn để tránh báo lỗi không cần thiết.
-   **Cấu hình kiểm tra linh hoạt**: Cho phép bật/tắt các loại kiểm tra lỗi cụ thể:
    -   Lỗi không có trong từ điển
    -   Lỗi viết hoa
    -   Lỗi đặt dấu
    -   Lỗi ký tự lạ / Cấu trúc
-   **Xuất danh sách lỗi**: Cho phép tải về danh sách các lỗi đã phát hiện dưới dạng tệp `.txt` với hai định dạng: danh sách thông thường hoặc định dạng cho VCTVEGROUP.
-   **Phím tắt tiện lợi**: Sử dụng phím mũi tên `⬆️` `⬇️` để duyệt qua danh sách lỗi và phím `Delete` hoặc `I` để thêm từ vào danh sách bỏ qua.
-   **Hiển thị ngữ cảnh**: Khi chọn một lỗi, hiển thị đoạn văn bản chứa lỗi để người dùng dễ dàng kiểm tra, đồng thời có thể duyệt qua lại giữa các vị trí của cùng một lỗi.
-   **Chỉ báo lỗi trực quan**: Các lỗi được hiển thị bằng các chấm màu sắc khác nhau, giúp dễ dàng nhận biết loại lỗi.
-   **Tra cứu Wiktionary**: Nút tra cứu nhanh trên Wiktionary cho các từ không có trong từ điển.
-   **Xử lý tệp EPUB ngoại tuyến**: Toàn bộ quá trình kiểm tra diễn ra trên trình duyệt của bạn, không gửi dữ liệu sách lên máy chủ.

## Cách sử dụng

1.  **Tải tệp EPUB**:
    *   Kéo và thả tệp `.epub` của bạn vào khu vực "Tải sách lên".
    *   Hoặc nhấp vào khu vực đó để chọn tệp `.epub` từ máy tính của bạn.
2.  **Quá trình kiểm tra**:
    *   Ứng dụng sẽ bắt đầu giải nén và phân tích nội dung sách. Một thanh tiến trình sẽ hiển thị trạng thái.
    *   Sau khi phân tích xong, danh sách các lỗi chính tả sẽ xuất hiện ở cột bên trái.
3.  **Xem và sửa lỗi**:
    *   **Danh sách lỗi**: Cột bên trái hiển thị danh sách các từ bị lỗi. Sử dụng phím mũi tên `⬆️` `⬇️` để di chuyển nhanh.
    *   **Chi tiết lỗi**: Nhấp vào một từ lỗi trong danh sách để xem chi tiết ở cột bên phải:
        *   **Ngữ cảnh**: Đoạn văn bản chứa từ lỗi được tô sáng. Nếu một lỗi xuất hiện nhiều lần, bạn có thể dùng nút điều hướng để xem các ngữ cảnh khác nhau.
        *   **Loại lỗi**: Mô tả chi tiết loại lỗi.
        *   **Gợi ý**: Các từ gợi ý để sửa lỗi.
        *   **Tra cứu Wiktionary**: Nút tra cứu từ bị lỗi trên Wiktionary.
    *   **Bỏ qua lỗi**: Nhấp vào nút bỏ qua (biểu tượng mắt gạch chéo) hoặc nhấn phím `Delete` / `I` để thêm từ đó vào danh sách bỏ qua.
4.  **Quản lý danh sách bỏ qua (Whitelist)**:
    *   Khu vực "Danh sách từ bỏ soát lỗi" cho phép bạn xem và chỉnh sửa danh sách các từ đã bỏ qua.
    *   Sử dụng nút **Import Whitelist** và **Export Whitelist** để nhập hoặc xuất danh sách từ tệp `.txt`.
5.  **Cấu hình và các tính năng khác**:
    *   **Cấu hình**: Nhấp vào biểu tượng bánh răng ở góc trên bên phải để bật/tắt các loại lỗi bạn muốn kiểm tra.
    *   **Xuất lỗi**: Nhấp vào nút "Xuất lỗi" để tải về danh sách các từ sai dưới dạng tệp văn bản.
    *   **Bỏ qua tiếng Anh**: Tích vào ô "Kích hoạt từ tiếng Anh" để ẩn các từ tiếng Anh hợp lệ khỏi danh sách lỗi.
6.  **Kiểm tra tệp khác**: Nhấp vào nút "Kiểm tra tệp khác" ở góc trên bên phải để tải một tệp EPUB mới.