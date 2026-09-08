# 📋 Danh Sách Nhiệm Vụ Phát Triển (Development & Optimization Tasks)

> Tạo dựa trên phân tích từ [update.md](file:///home/hajtran/dev/epub-spell-check/update.md), kết hợp kiến trúc từ [graphify-out/GRAPH_REPORT.md](file:///home/hajtran/dev/epub-spell-check/graphify-out/GRAPH_REPORT.md), quy trình [DEVELOPMENT_WORKFLOW.md](file:///home/hajtran/dev/epub-spell-check/DEVELOPMENT_WORKFLOW.md) và tiêu chuẩn [TEST_WORKFLOW.md](file:///home/hajtran/dev/epub-spell-check/TEST_WORKFLOW.md).

---

## 🎯 Phase 1: Performance & Suggestion Engine Optimization (Ưu tiên cao nhất)

- [x] **Task 1.1: Bounded Levenshtein Distance (Ưu tiên #1 Analyzer)**
  - **Mục tiêu**: Thay thế ma trận đầy đủ `number[][]` trong hàm `levenshteinDistance()` bằng thuật toán 2 dòng (`previous[]`, `current[]`) với ngưỡng giới hạn (early exit khi `distance > threshold`).
  - **Tác động**: Giảm thiểu cấp phát bộ nhớ (allocation) và tăng tốc độ tính toán đáng kể.
  - **Files liên quan**: `src/utils/analysis-core.ts`, `src/utils/analyzer.ts`
  - **Quality Gates & Tests**: `pnpm test:smoke`, `vitest tests/analyzer.test.ts`

- [x] **Task 1.2: Lọc ứng viên đa tầng trước Levenshtein (Candidate Pre-filtering)**
  - **Mục tiêu**: Thêm tầng lọc ứng viên (độ dài, ký tự đầu, base character signature / phonetic bucket) trước khi chạy Levenshtein, tránh so sánh với các từ không cùng nhóm (vd: từ tiếng Việt so với từ mượn/tên riêng không liên quan).
  - **Tác động**: Giảm số lượng candidate cần tính toán 2 lần Levenshtein (base distance & full distance).
  - **Files liên quan**: `src/utils/analyzer.ts`, `src/utils/analysis-core.ts`
  - **Quality Gates & Tests**: `pnpm test:smoke`, `pnpm test:unit`

- [x] **Task 1.3: Nâng cấp kiến trúc Persistent Worker (AnalysisWorkerManager)**
  - **Mục tiêu**: Chuyển từ việc truyền toàn bộ `dictionaries` mỗi lần gọi `analyze()` sang mô hình Worker sống liên tục (`init(dictionaries)` một lần, sau đó chỉ gửi `textBlocks` khi phân tích sách).
  - **Tác động**: Loại bỏ chi phí structured-clone dữ liệu từ điển (Set/Map) qua lại giữa main thread và Web Worker qua các lần kiểm tra.
  - **Files liên quan**: `src/workers/analysis.worker.ts`, `src/utils/worker-manager.ts`, `src/state.svelte.ts`
  - **Quality Gates & Tests**: Worker tests theo [TEST_WORKFLOW.md](file:///home/hajtran/dev/epub-spell-check/TEST_WORKFLOW.md) (success, error, cancellation, repeated execution).

---

## 🔒 Phase 2: Security & API Hardening

- [x] **Task 2.1: Bảo vệ Admin Token & Chuyển đổi Authentication Flow**
  - **Mục tiêu**: Loại bỏ việc lưu `ADMIN_TOKEN` trực tiếp trong `localStorage` trên trình duyệt frontend. Sử dụng Cloudflare Access làm lớp bảo vệ chính; `ADMIN_TOKEN` chỉ dùng làm fallback cho CLI/automation.
  - **Files liên quan**: `src/state.svelte.ts`, `functions/api/**`
  - **Quality Gates & Tests**: `pnpm check`, `pnpm lint`

- [x] **Task 2.2: Xác thực JWT Assertion phòng thủ đa tầng (Defense-in-depth)**
  - **Mục tiêu**: Xem xét và củng cố hàm `isAuthenticated()` tại backend/functions. Tránh chỉ dựa hoàn toàn vào plain header `cf-access-authenticated-user-email` mà cần xác thực chữ ký JWT `cf-access-jwt-assertion` khi có kết nối trực tiếp.
  - **Files liên quan**: `functions/api/dict/[name].ts`
  - **Quality Gates & Tests**: API Integration Tests.

- [x] **Task 2.3: Chuẩn hóa Response Schema cho Dictionary Actions**
  - **Mục tiêu**: Sửa API `POST /api/dict/*` khi `action === "remove"` không trả về trường `addedCount` gây nhầm lẫn, chuẩn hóa thành `{ action: "add" | "remove", affectedCount: number }` hoặc tách bạch `removedCount` / `addedCount`.
  - **Files liên quan**: `functions/api/dict/[name].ts`, `src/utils/dict-admin.ts`
  - **Quality Gates & Tests**: `pnpm check`, `pnpm test`

- [x] **Task 2.4: Ẩn thông tin nhạy cảm ở endpoint `/auth-status`**
  - **Mục tiêu**: Loại bỏ trường `hasTokenConfigured` khỏi response của `/auth-status` để tránh làm lộ trạng thái cấu hình bí mật của hạ tầng cho client.
  - **Files liên quan**: `functions/api/admin/auth-status.ts`, `src/utils/dict-admin.ts`
  - **Quality Gates & Tests**: `pnpm check`, `pnpm test`

---

## 🧱 Phase 3: EPUB Parser & Writer Resilience & Round-Trip Safety

- [x] **Task 3.1: Xử lý EPUB HTML cấu trúc lồng nhau & phi chuẩn (DOM Parsing Robustness)**
  - **Mục tiêu**: Nâng cấp `extractLeafTextElements()` để xử lý tốt hơn các cấu trúc HTML phức tạp (như inline formatting lồng nhau `<b>`, `<span>`, `div` lồng `div`, danh sách, bảng biểu) mà không làm sót từ hoặc phân mảnh sai đoạn văn.
  - **Files liên quan**: `src/utils/epub-parser.ts`
  - **Quality Gates & Tests**: `vitest tests/unit/leaf-extractor.test.ts`, `vitest tests/unit/epub-roundtrip.test.ts`.

- [x] **Task 3.2: Suite Kiểm thử Regression Bảo toàn Cấu trúc EPUB (Structural Integrity Regression)**
  - **Mục tiêu**: Xây dựng bộ test kiểm tra cấu trúc sau khi repacking với `XMLSerializer` (đảm bảo namespace, doctype, XHTML validation, entity, whitespace không bị hỏng khi sửa 1 từ).
  - **Files liên quan**: `tests/unit/epub-writer.test.ts`, `tests/unit/epub-roundtrip.test.ts`
  - **Quality Gates & Tests**: `pnpm test:regression`, `pnpm test` theo [TEST_WORKFLOW.md](file:///home/hajtran/dev/epub-spell-check/TEST_WORKFLOW.md) mục 17 & 18.

- [x] **Task 3.3: Nghiên cứu phương án Patch Text cục bộ (Architectural Improvement)**
  - **Mục tiêu**: Thiết kế cơ chế sửa trực tiếp chuỗi text/XML gốc thay vì serialize lại toàn bộ cây DOM của tài liệu để giảm thiểu diff byte-for-byte.
  - **Files liên quan**: `src/utils/epub-writer.ts`
  - **Quality Gates & Tests**: Spike & Benchmark tests.

---

## ⚡ Phase 4: UX, State Modularization & Caching

- [x] **Task 4.1: Tải Từ điển Linh hoạt với `Promise.allSettled()`**
  - **Mục tiêu**: Cải tiến `init()` nạp 4 bộ từ điển (VN, Non-VN, Names, Custom) bằng `Promise.allSettled()`. Nếu 1 từ điển (vd: Names) gặp lỗi mạng/500 thì ứng dụng vẫn tiếp tục hoạt động với các từ điển còn lại kèm thông báo cảnh báo.
  - **Files liên quan**: `src/utils/dictionary.ts`, `src/state.svelte.ts`
  - **Quality Gates & Tests**: `pnpm test:smoke`, `vitest tests/unit/dict-validator.test.ts`

- [x] **Task 4.2: Tinh giản và Mô-đun hóa `AppStateModel`**
  - **Mục tiêu**: Tách `AppStateModel` và Web Worker logic thông qua `AnalysisWorkerManager` theo kiến trúc Svelte 5 Rune mà không cần thư viện bên ngoài.
  - **Files liên quan**: `src/state.svelte.ts`, `src/utils/worker-manager.ts`
  - **Quality Gates & Tests**: `pnpm check`, `pnpm lint`, `pnpm test:regression`

- [x] **Task 4.3: Cơ chế Cache Invalidation thông minh qua Metadata (ETag / UpdatedAt)**
  - **Mục tiêu**: Sử dụng `updatedAt` từ API để phát hiện và cập nhật cache IndexedDB thay vì chỉ dựa vào `DICTIONARY_VERSION` thủ công hoặc thời gian TTL cố định.
  - **Files liên quan**: `src/utils/dictionary.ts`, `functions/api/dict/[name].ts`
  - **Quality Gates & Tests**: `pnpm test:unit`

- [x] **Task 4.4: Tài liệu hóa Thứ tự Ưu tiên Từ Điển (Dictionary Precedence Documentation)**
  - **Mục tiêu**: Cập nhật `README.md` và tài liệu mô tả chính thức thứ tự ưu tiên: `CUSTOM` → `NAMES` → `NON-VN` → `VN` → `SPELLING RULE` → `UNKNOWN`.
  - **Files liên quan**: `README.md`, `DEVELOPMENT_WORKFLOW.md`
  - **Quality Gates & Tests**: `pnpm format:check`
