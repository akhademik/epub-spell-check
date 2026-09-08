# 📋 DANH SÁCH CÁC SUB-TASK: ADMIN DASHBOARD QUẢN TRỊ TỪ ĐIỂN ĐỘNG

Tài liệu ghi nhận toàn bộ các công việc cần thực hiện để nâng cấp hệ thống quản lý từ điển của **Ebook Spell Check** với Admin Dashboard trực quan, xác thực Cloudflare Zero Trust (Gmail/Email OTP) và tích hợp bộ phân tích kiểm tra từ sai / cảnh báo thông minh.

---

## 🏗️ GIAI ĐOẠN 1: BACKEND & API (Cloudflare Pages Functions)

- [x] **Task 1.1: Nâng cấp xác thực Cloudflare Zero Trust (Access) trong API**
  - Cập nhật [`functions/api/dict/[name].ts`](file:///home/hajtran/dev/epub-spell-check/functions/api/dict/%5Bname%5D.ts).
  - Hỗ trợ xác thực qua các HTTP Headers của Cloudflare Access:
    - `Cf-Access-Jwt-Assertion`
    - `Cf-Access-Authenticated-User-Email`
  - Vẫn duy trì fallback xác thực qua header `Authorization: Bearer <ADMIN_TOKEN>` để phục vụ script/cURL khi cần.
  - Thêm endpoint `GET /api/admin/auth-status` để frontend kiểm tra trạng thái đăng nhập/quyền truy cập của người dùng.

- [x] **Task 1.2: Bổ sung API hỗ trợ lấy danh sách từ theo định dạng JSON & Metadata**
  - Mở rộng API `GET /api/dict/:name` hỗ trợ query `format=json` hoặc content-negotiation để trả về metadata (tổng số từ, ngày cập nhật, danh sách array từ đã sort alphabet).

---

## 🧠 GIAI ĐOẠN 2: VALIDATION ENGINE (Kiểm tra từ sai & Cảnh báo)

- [x] **Task 2.1: Tạo module kiểm tra lỗi từ vựng chia sẻ (`src/utils/dict-validator.ts`)**
  - Kế thừa và chuẩn hóa logic từ [`scripts/merge-dicts.ts`](file:///home/hajtran/dev/epub-spell-check/scripts/merge-dicts.ts) và [`src/utils/analysis-core.ts`](file:///home/hajtran/dev/epub-spell-check/src/utils/analysis-core.ts):
    1. **Lỗi gõ máy / Typo patterns**: Bắt các đuôi phím lỗi `aa`, `ee`, `oo`, `uu`, `ii`, `dd`, `js`, `kx`, `wt` hoặc từ lặp ký tự đôi đơn độc.
    2. **Lỗi dính chữ OCR / Dịch thuật**: Phát hiện nối chữ `TitleCase` dính từ tiếng Việt (vd `SignorThưa`, `BonjourChào`).
    3. **Lỗi sai danh mục từ điển**:
       - Từ chứa ký tự độc quyền tiếng Việt (`đ`, `ư`, `ơ`, dấu hỏi/ngã/nặng...) nhập vào `NON-VN`.
       - Thán từ/tiếng cười (`Hahaha`, `Hừhừhừhừ`) nhập vào `NAMES`.
    4. **Cảnh báo từ có dấu thanh bất thường / Từ quá ngắn hoặc quá dài**.
  - Phân loại kết quả rõ ràng:
    - 🔴 **Reject (Chặn hoàn toàn)**: Các từ chắc chắn gây hại hoặc làm tê liệt bộ bắt lỗi.
    - 🟡 **Warning (Cảnh báo tiềm ẩn)**: Yêu cầu admin xác nhận thủ công trước khi thêm.

- [x] **Task 2.2: Viết Unit Tests cho `dict-validator.ts`**
  - Đảm bảo độ chính xác tuyệt đối, bao phủ 100% các trường hợp biên và kiểm thử tiếng Việt Unicode (`tests/unit/dict-validator.test.ts`).

---

## 🎨 GIAI ĐOẠN 3: GIAO DIỆN ADMIN DASHBOARD (Frontend UI)

- [x] **Task 3.1: Quản lý Route / Chế độ xem Admin**
  - Thêm state chuyển đổi giao diện giữa `App Main View` (Soát lỗi sách) và `Admin Dashboard View` (Quản trị từ điển) trong [`src/state.svelte.ts`](file:///home/hajtran/dev/epub-spell-check/src/state.svelte.ts).
  - Cập nhật [`src/components/Header.svelte`](file:///home/hajtran/dev/epub-spell-check/src/components/Header.svelte) với nút chuyển đổi nhanh (Tab/Link "Quản trị từ điển").

- [x] **Task 3.2: Xây dựng Admin Dashboard Component (`src/components/admin/AdminDashboard.svelte`)**
  - **Tabs chọn 4 từ điển**: `Tiếng Việt (vn)`, `Tên riêng (names)`, `Ngoại ngữ (non-vn)`, `Viết tắt (custom)`.
  - **Thống kê nhanh**: Số lượng từ, thời gian cập nhật gần nhất.
  - **Bộ lọc & Tìm kiếm từ (Live Search)**:
    - Ô tìm kiếm từ nhanh (instant filter).
    - Danh sách từ hiển thị dạng bảng/thẻ trực quan, luôn tự động sắp xếp theo chuẩn Alphabet tiếng Việt (`Intl.Collator("vi")`).
    - Nút xóa nhanh từng từ (1-click delete với confirm) và xóa hàng loạt (bulk select).

- [x] **Task 3.3: Xây dựng Form Nhập Liệu Thông Minh (`src/components/admin/AddWordsForm.svelte`)**
  - Khung nhập văn bản đa dòng (hỗ trợ copy-paste hàng nghìn từ).
  - **Phân tích trước khi lưu (Pre-save Linting/Validation)**:
    - Tự động hiển thị danh sách từ hợp lệ (Xanh).
    - Tự động cảnh báo từ nghi vấn (Vàng) kèm lý do.
    - Tự động bóc tách từ bị từ chối/lỗi (Đỏ).
  - Nút **"Lưu vào từ điển"**: Tự động sort, merge, cập nhật lên KV và đồng bộ hot-reload lại ứng dụng.

---

## 🔄 GIAI ĐOẠN 4: KIỂM THỬ TỔNG THỂ & QUALITY GATES

- [x] **Task 4.1: Chạy toàn bộ Test Suites & Quality Gates**
  - `pnpm check`: 0 errors, 0 warnings.
  - `pnpm lint`: Pass Biome checks.
  - `pnpm test:smoke`: Pass toàn bộ smoke tests.
  - `pnpm test`: Pass toàn bộ 14 test suites (89 tests).
  - `pnpm build`: Đảm bảo bundle production tối ưu.

- [x] **Task 4.2: Cập nhật tài liệu hướng dẫn**
  - Cập nhật `README.md` hướng dẫn chi tiết cách cấu hình Cloudflare Zero Trust (Access) Application bảo vệ trang admin và các endpoints.
