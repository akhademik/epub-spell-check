# 📋 Danh Sách Nhiệm Vụ Phát Triển & Tối Ưu Hóa (Development Tasks)

> Chuyển đổi từ phân tích mới nhất trong [update.md](file:///home/hajtran/dev/epub-spell-check/update.md), kết hợp kiến trúc từ [graphify-out/GRAPH_REPORT.md](file:///home/hajtran/dev/epub-spell-check/graphify-out/GRAPH_REPORT.md), quy trình [DEVELOPMENT_WORKFLOW.md](file:///home/hajtran/dev/epub-spell-check/DEVELOPMENT_WORKFLOW.md) và tiêu chuẩn kiểm thử [TEST_WORKFLOW.md](file:///home/hajtran/dev/epub-spell-check/TEST_WORKFLOW.md).

---

## 🔴 P0: Security & Authentication Hardening (Bắt buộc / Ưu tiên cao nhất)

- [x] **Task P0.1: Phân định ranh giới & Xác thực Cloudflare Access (Zero Trust Security)**
  - **Mục tiêu**: Nâng cấp cơ chế xác thực trong [functions/api/dict/[name].ts](file:///home/hajtran/dev/epub-spell-check/functions/api/dict/[name].ts). Xác định rõ ranh giới: Cloudflare Access là lớp xác thực chính (chặn unauthenticated ở edge/ingress); `ADMIN_TOKEN` chỉ dùng làm emergency fallback khi cần thiết qua header `Authorization: Bearer <TOKEN>`.
  - **Tác động**: Ngăn ngừa rủi ro giả mạo header và củng cố bảo mật cho application layer.
  - **Files liên quan**: `functions/api/dict/[name].ts`, `functions/api/admin/auth-status.ts`
  - **Quality Gates & Tests**: `pnpm check`, `pnpm lint`, API Integration Tests.

---

## 🟡 P1: Token Security, UX & Round-Trip Fixtures Testing (Ưu tiên cao)

- [x] **Task P1.1: Chuyển ADMIN_TOKEN thành In-Memory State (Bỏ lưu localStorage)**
  - **Mục tiêu**: Xóa bỏ `STORAGE_KEYS.DICT_ADMIN_TOKEN` và không lưu `ADMIN_TOKEN` vào `localStorage` trong [src/state.svelte.ts](file:///home/hajtran/dev/epub-spell-check/src/state.svelte.ts). Token chỉ được giữ tạm thời trong memory khi người dùng nhập vào phiên làm việc hiện tại và tự động mất khi refresh/đóng trình duyệt.
  - **Tác động**: Triệt tiêu hoàn toàn rủi ro bị đánh cắp secret token nếu có lỗ hổng XSS.
  - **Files liên quan**: `src/state.svelte.ts`
  - **Quality Gates & Tests**: `pnpm check`, `pnpm lint`, `pnpm test:smoke`

- [x] **Task P1.2: Sửa Bug UX Hiển thị Số Từ Xóa/Thêm (affectedCount Fix)**
  - **Mục tiêu**: Sửa logic hiển thị toast trong `addWordsToDictionary()` tại [src/state.svelte.ts](file:///home/hajtran/dev/epub-spell-check/src/state.svelte.ts). Sử dụng trực tiếp `result.affectedCount` thay vì `result.addedCount` (vốn bằng 0 khi thực hiện action `remove`).
  - **Tác động**: Thông báo hiển thị đúng số lượng từ đã xóa (`Đã xóa X từ...` thay vì `Đã xóa 0 từ...`).
  - **Files liên quan**: `src/state.svelte.ts`, `src/utils/dict-admin.ts`
  - **Quality Gates & Tests**: `pnpm check`, `pnpm test:smoke`

- [x] **Task P1.3: Mở rộng Bộ Test Fixture EPUB Round-Trip (4 Fixtures Standard)**
  - **Mục tiêu**: Bổ sung/chuẩn hóa 4 kịch bản fixture kiểm thử toàn diện quy trình: `parse` → `fix` → `repack` → `re-parse` → `verify output`:
    1. `simple.epub`: Văn bản chuẩn đơn giản.
    2. `nested-formatting.epub`: Thẻ lồng nhau `<b>`, `<i>`, `<span>`.
    3. `multiple-text-nodes.epub`: Sửa từ xuyên qua nhiều text nodes và nhiều vị trí trong 1 block.
    4. `malformed-xhtml.epub`: XHTML dị dạng / không chuẩn (unescaped `&`, lỗi parser XML).
  - **Files liên quan**: `tests/unit/epub-roundtrip.test.ts`, `tests/unit/epub-writer.test.ts`
  - **Quality Gates & Tests**: `pnpm test:regression`, `pnpm test`

---

## 🟢 P2: Worker Architecture & Concurrency Optimization (Tối ưu hóa)

- [x] **Task P2.1: Tối ưu truyền dữ liệu sang Worker (Zero Clone on Re-analysis)**
  - **Mục tiêu**: Khi gọi `analyze()` trong `AnalysisWorkerManager`, chỉ truyền `textBlocks` và `checkSettings` nếu từ điển đã được khởi tạo trước đó qua `init(dictionaries)` trên Worker, tránh structured-clone lại toàn bộ 4 Set từ điển qua mỗi lần phân tích.
  - **Files liên quan**: `src/utils/worker-manager.ts`, `src/workers/analysis.worker.ts`, `src/state.svelte.ts`
  - **Quality Gates & Tests**: `pnpm test:smoke`, `pnpm test:unit`

- [x] **Task P2.2: Ngăn ngừa xung đột tác vụ song song trong Worker (Concurrency Guard)**
  - **Mục tiêu**: Bổ sung cờ bảo vệ `activeAnalysis` hoặc `requestId` trong `AnalysisWorkerManager` để đảm bảo handler `onmessage` không bị ghi đè nếu xảy ra nhiều request phân tích cùng lúc.
  - **Files liên quan**: `src/utils/worker-manager.ts`
  - **Quality Gates & Tests**: `pnpm test:unit`
