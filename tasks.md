# 📋 Kế hoạch thực hiện: Dọn rác, phát hiện trùng lặp mờ & Nâng cấp bộ lọc lỗi

> Kế hoạch được phân rã chi tiết từ [instruction-clean-dicts.md](file:///home/hajtran/dev/epub-spell-check/instruction-clean-dicts.md), tuân thủ nghiêm ngặt theo các tiêu chuẩn trong [DEVELOPMENT_WORKFLOW.md](file:///home/hajtran/dev/epub-spell-check/DEVELOPMENT_WORKFLOW.md), [TEST_WORKFLOW.md](file:///home/hajtran/dev/epub-spell-check/TEST_WORKFLOW.md), [MERGE_DICTS_WORKFLOW.md](file:///home/hajtran/dev/epub-spell-check/MERGE_DICTS_WORKFLOW.md) và [GRAPH_REPORT.md](file:///home/hajtran/dev/epub-spell-check/graphify-out/GRAPH_REPORT.md).

---

## 🎯 Tổng quan các nhóm công việc

- **Phase 1 (Nhóm C - Nâng cấp bộ lọc lỗi)**: Đổi bộ lọc loại lỗi từ "tab đơn" sang "toggle cộng dồn" (Multi-toggle Filter) ở mức global state `appState`.
- **Phase 2 (Nhóm A - Core Dictionary Quality & Fuzzy Duplicates)**: Xây dựng module thuần `dict-quality.ts` (Tier A / Tier B / Fuzzy Levenshtein + Union-Find clustering / Ignore pairs) + Unit tests toàn diện.
- **Phase 3 (Nhóm A - CLI & Cloudflare Admin API/UI)**: Tạo CLI `clean-dicts.ts` (hỗ trợ local / KV, dry-run, backup), route API `/audit` + `/audit/ignore`, và giao diện `DictAuditPanel.svelte` trong Admin Dashboard.
- **Phase 4 (Nhóm B - Tự động đồng bộ KV → public/*.txt qua Git Hook)**: Cài đặt `simple-git-hooks`, tạo script `pull-dicts-from-kv.ts` (non-blocking khi lỗi mạng/auth), kiểm thử pre-commit hook.
- **Phase 5 (Quality Gates & Verification)**: Chạy toàn bộ bộ kiểm thử 4 tầng (`pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm knip`, `pnpm test`, `pnpm test:regression`, `pnpm test:e2e`, cập nhật `graphify`).

---

## 📝 Danh sách Tasks chi tiết

### Phase 1: Toggle bộ lọc loại lỗi cộng dồn (Multi-select Error Filter)

- [x] **Task 1.1: Mở rộng Global State (`src/state.svelte.ts`)**
  - Khai báo hằng số danh sách toàn bộ loại lỗi hợp lệ `ALL_ERROR_TYPES: ErrorType[]`.
  - Thêm state `enabledErrorTypes = $state<Set<ErrorType>>(new Set(ALL_ERROR_TYPES))`.
  - Thêm phương thức `toggleErrorType(type: ErrorType)` và `toggleAllErrorTypes()`.
  - Persist trạng thái vào `localStorage` với key `STORAGE_KEYS.ENABLED_ERROR_TYPES`.
  - Cập nhật getter `currentFilteredErrors` truyền `this.enabledErrorTypes` vào `getFilteredErrors`.

- [x] **Task 1.2: Cập nhật hàm lọc `getFilteredErrors` (`src/utils/filter.ts`) & Unit Tests**
  - Thêm tham số `enabledTypes: Set<ErrorType>` vào `getFilteredErrors()`.
  - Short-circuit lọc theo loại: `if (!enabledTypes.has(group.type)) return false`.
  - Cập nhật toàn bộ test case hiện có trong [tests/unit/filter.test.ts](file:///home/hajtran/dev/epub-spell-check/tests/unit/filter.test.ts) tương thích với chữ ký hàm mới.
  - Viết bổ sung ít nhất 2 test cases: (1) Tắt 1 loại lỗi thì nhóm lỗi đó bị lọc bỏ; (2) `enabledTypes` rỗng thì trả về mảng rỗng.

- [x] **Task 1.3: Cải tiến UI [ErrorList.svelte](file:///home/hajtran/dev/epub-spell-check/src/components/ErrorList.svelte)**
  - Loại bỏ local state `typeFilter` và logic lọc lặp lại ở component (chỉ dùng `appState.currentFilteredErrors` làm nguồn sự thật duy nhất).
  - Chuyển đổi hàng chip/pill từ dạng radio sang multi-toggle (bật: màu sắc nhận diện; tắt: style mờ xám/grayscale).
  - Thêm nút "Tất cả" / "Bỏ chọn tất cả" 2 chiều kết nối với `appState.toggleAllErrorTypes()`.
  - Chỉ hiển thị các chip cho các `ErrorType` thực sự xuất hiện trong kết quả phát hiện hoặc danh sách chuẩn (tránh làm rối UI với `SpecialCharacter`).
  - Cập nhật empty state thông báo rõ ràng khi `enabledErrorTypes.size === 0` ("Bạn đã tắt hết các loại lỗi...").

- [x] **Task 1.4: Kiểm thử tích hợp UI, Context View & Phím tắt**
  - Xác nhận [ResultsView.svelte](file:///home/hajtran/dev/epub-spell-check/src/components/ResultsView.svelte) (tổng số lỗi) và điều hướng ⬆️⬇️ trong [ContextView.svelte](file:///home/hajtran/dev/epub-spell-check/src/components/ContextView.svelte) đồng bộ mượt mà khi bật/tắt các loại lỗi.

---

### Phase 2: Module chất lượng từ điển & Phát hiện trùng lặp mờ (`src/utils/dict-quality.ts`)

- [x] **Task 2.1: Xây dựng Module Logic thuần [src/utils/dict-quality.ts](file:///home/hajtran/dev/epub-spell-check/src/utils/dict-quality.ts)**
  - Tái sử dụng `levenshteinDistance`, `getBaseWord` từ [src/utils/analysis-core.ts](file:///home/hajtran/dev/epub-spell-check/src/utils/analysis-core.ts) và các regex/hàm kiểm tra từ [src/utils/dict-validator.ts](file:///home/hajtran/dev/epub-spell-check/src/utils/dict-validator.ts).
  - Cài đặt phát hiện rác **Tier A** (độ tin cậy rất cao: chứa số, chuỗi file/URL `.com`/`pdf`/`http`, chuỗi ≥5 phụ âm liền, `isRepeatedUnit`, độ dài >30, tỉ lệ nguyên âm < 0.2 với từ ≥ 6 ký tự).
  - Cài đặt phát hiện rác **Tier B** (cần review: TitleCase dính liền hợp lệ như `MacArthur`, warning tiếng Việt typo, ký tự tiếng Việt trong non-vn).
  - Định nghĩa interface chuẩn `GarbageFinding`, `DuplicateCluster`, hàm `scanDictionaryForGarbage(dictName, words)`.

- [x] **Task 2.2: Cài đặt thuật toán Fuzzy Near-Duplicate & Clustering**
  - Chuẩn hoá NFC, lowercase, bỏ dấu (`getBaseWord` cho VN).
  - Bucketing theo độ dài (chênh lệch ≤ 2) và tỉa nhánh nhanh theo ký tự để tối ưu thời gian so sánh.
  - Tính khoảng cách Levenshtein (1 đến 2).
  - Tính điểm rác `garbageScore` cho từng từ trong cluster (Tier A = 100, Tier B = 40, Không dính = 0) để gợi ý "khả năng đúng / khả năng lỗi / trung lập".
  - Gom cụm bằng Union-Find và lọc bỏ các cặp đã nằm trong danh sách `ignored-pairs`.

- [x] **Task 2.3: Viết Unit Tests toàn diện [tests/unit/dict-quality.test.ts](file:///home/hajtran/dev/epub-spell-check/tests/unit/dict-quality.test.ts)**
  - Kiểm tra các mẫu rác thực tế (dương tính): `HresponseMKpdf`, `KLwnN`, `QKtsq`, `Hahaha`, `dd`, `SignorThưa`...
  - Kiểm tra các tên riêng nước ngoài hợp lệ (âm tính - không bắt nhầm): `Rothschild`, `Nietzsche`, `Messerschmitt`, `MacArthur`, `LeBron`...
  - Kiểm tra thuật toán clustering, tính điểm gợi ý, cơ chế bỏ qua cặp trong danh sách ignore.

---

### Phase 3: Công cụ CLI, API Cloudflare Functions & Giao diện Admin

- [x] **Task 3.1: Viết CLI Script [scripts/clean-dicts.ts](file:///home/hajtran/dev/epub-spell-check/scripts/clean-dicts.ts)**
  - Hỗ trợ các cờ lệnh: `--source=local|kv`, `--dict=...`, `--dry-run` (mặc định true), `--apply`, `--tier=A`.
  - Tự động sao lưu trước khi apply (ghi ra `public/.backup/` đối với local hoặc KV backup key `dict:{name}:content:backup:{timestamp}`).
  - Tuyệt đối không tự động xoá Tier B hoặc fuzzy duplicate qua CLI (chỉ xóa Tier A khi `--apply`).
  - Xuất báo cáo chi tiết ra console và file markdown/json trong `reports/`.
  - Thêm script `"dicts:clean": "tsx scripts/clean-dicts.ts"` vào [package.json](file:///home/hajtran/dev/epub-spell-check/package.json).

- [x] **Task 3.2: Tạo API Cloudflare Pages Function [functions/api/dict/[name]/audit.ts](file:///home/hajtran/dev/epub-spell-check/functions/api/dict/[name]/audit.ts)**
  - Xác thực bảo mật qua `ADMIN_TOKEN`.
  - Endpoint `GET /api/dict/:name/audit`: đọc content từ KV, chạy `scanDictionaryForGarbage` và fuzzy clustering, trả về kết quả rác + clusters.
  - Endpoint `POST /api/dict/:name/audit/ignore`: nhận `pairKey`, cập nhật KV key `dict:{name}:ignored-pairs`.

- [x] **Task 3.3: Xây dựng Giao diện Admin [src/components/admin/DictAuditPanel.svelte](file:///home/hajtran/dev/epub-spell-check/src/components/admin/DictAuditPanel.svelte)**
  - Tích hợp tab "Kiểm tra chất lượng" vào [src/components/admin/AdminDashboard.svelte](file:///home/hajtran/dev/epub-spell-check/src/components/admin/AdminDashboard.svelte).
  - Khối 1 (Tier A): checkbox danh sách rác (mặc định chọn hết) + nút xoá hàng loạt (gọi API xóa hiện có).
  - Khối 2 (Tier B): danh sách xem lại thủ công kèm lý do chi tiết.
  - Khối 3 (Nghi trùng lặp): hiển thị cluster với nhãn màu viền gợi ý (xanh = khả năng đúng, đỏ = khả năng lỗi) + nút "Không phải trùng, bỏ qua".
  - Chỉ quét kiểm tra khi người dùng bấm nút kích hoạt (Lazy trigger).

---

### Phase 4: Tự động đồng bộ KV → `public/*.txt` qua Git Hook

- [x] **Task 4.1: Cài đặt và cấu hình Hook với `simple-git-hooks`**
  - Cài đặt devDependency `simple-git-hooks`.
  - Cấu hình `"postinstall": "simple-git-hooks"` và `"simple-git-hooks": { "pre-commit": "pnpm dicts:pull-from-kv" }` trong [package.json](file:///home/hajtran/dev/epub-spell-check/package.json).

- [x] **Task 4.2: Viết Script [scripts/pull-dicts-from-kv.ts](file:///home/hajtran/dev/epub-spell-check/scripts/pull-dicts-from-kv.ts)**
  - Tự động trích xuất `namespace-id` từ file [wrangler.toml](file:///home/hajtran/dev/epub-spell-check/wrangler.toml).
  - Kéo 4 từ điển qua `wrangler kv key get --remote`.
  - So sánh với `public/{name}-dict.txt`, chỉ ghi đè và `git add` khi có sự thay đổi nội dung.
  - Xử lý lỗi an toàn (Non-blocking): Bắt lỗi mạng/auth, in cảnh báo vàng và luôn exit code 0 để không chặn quá trình commit code của developer.

- [x] **Task 4.3: Kiểm thử toàn diện Git Hook**
  - Thử nghiệm pull thành công khi có thay đổi trên KV.
  - Thử nghiệm trường hợp offline / ngắt kết nối wrangler đảm bảo commit vẫn hoạt động trơn tru.

---

### Phase 5: Kiểm thử chất lượng (Quality Gates) & Đồng bộ Graphify

- [x] **Task 5.1: Thực hiện đầy đủ các bước kiểm tra chất lượng theo [DEVELOPMENT_WORKFLOW.md](file:///home/hajtran/dev/epub-spell-check/DEVELOPMENT_WORKFLOW.md)**
  - `pnpm check` (Kiểm tra kiểu TypeScript & Svelte Rune: 0 errors, 0 warnings).
  - `pnpm lint` (Kiểm tra ESLint / Biome: PASS).
  - `pnpm format:check` (Kiểm tra format code theo chuẩn Prettier / Biome: PASS).
  - `pnpm knip` (Quét dead code và unused dependencies: 0 issues).
  - `pnpm test:smoke` (Chạy smoke test luồng chính: PASS).
  - `pnpm test` & `pnpm test:regression` (Chạy toàn bộ 15 test files / 118 unit & regression tests: 100% PASS).

- [x] **Task 5.2: Cập nhật Knowledge Graph**
  - Chạy `graphify . --code-only && graphify cluster-only .` để cập nhật kiến trúc dự án và đồng bộ [GRAPH_REPORT.md](file:///home/hajtran/dev/epub-spell-check/graphify-out/GRAPH_REPORT.md).
