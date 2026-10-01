# AI_WORKFLOW.md — Quy trình làm việc bắt buộc cho AI Coding Agent

> File này là **bộ não quy trình** của AI khi làm việc trên dự án này.
> Đọc file này **mỗi lần bắt đầu phiên làm việc mới**, trước khi viết bất kỳ dòng code nào.

---

## 0. Thứ tự đọc khi mở lại project (BẮT BUỘC, không được bỏ qua bước nào)

Khi được giao việc trên project này, AI phải đọc theo đúng thứ tự sau trước khi code:

1. **`./graphify-out/GRAPH_REPORT.md`** (file report do `/graphiphy` tự sinh ra mỗi lần chạy)
   → Hiểu cấu trúc phụ thuộc hiện tại, phát hiện vòng lặp import, file mồ côi, node quá lớn (god node).
2. **`README.md`**
   → Đọc mục _"Trạng thái hệ thống"_ và _"Changelog"_ để biết lần cuối đã làm gì, cái gì đang dở, cái gì đã xong.
3. **`AI_WORKFLOW.md`** (chính file này)
   → Nhắc lại quy tắc, pipeline kiểm tra, cách cập nhật tài liệu.
4. **`DESIGN_SYSTEM.md`**
   → Bắt buộc đọc trước khi đụng vào bất kỳ UI/component nào (màu sắc, spacing, modal, typography...).

Nếu 1 trong 4 file trên chưa tồn tại → AI phải **khởi tạo trước** theo template ở cuối file này, rồi mới bắt đầu việc chính.

Sau khi đọc xong 4 file, AI tóm tắt ngắn gọn lại cho người dùng:

- Project đang ở trạng thái nào
- Việc dở dang gần nhất là gì
- Kế hoạch tiếp theo là gì

Chỉ sau khi xác nhận (hoặc người dùng đồng ý) mới bắt đầu code.

---

## 1. Ngăn xếp công nghệ & quy tắc code bắt buộc

- **SvelteKit 5 / Svelte 5** — dùng **Runes** (`$state`, `$derived`, `$effect`, `$props`), KHÔNG dùng cú pháp `export let`, `$:` reactive cũ.
- **TypeScript strict mode** — không dùng `any` trừ khi có comment `// TODO(reason)` giải thích rõ tại sao.
- **Tailwind CSS** — không viết inline style tùy tiện, không tạo class trùng lặp ý nghĩa với token đã có trong `DESIGN_SYSTEM.md`.
- **Tách type riêng file**: mọi `interface`/`type` dùng chung từ 2 nơi trở lên phải nằm trong `src/types/*.ts` (hoặc `src/lib/types/*.ts`), KHÔNG khai báo type ngay trong file component.
- **Tránh "God Component/Node"**:
  - 1 component không vượt quá ~200 dòng logic (không tính markup thuần).
  - Nếu 1 file đảm nhiệm > 1 trách nhiệm rõ rệt (fetch data + render + xử lý form...) → tách thành:
    - component con (`ComponentName.svelte`)
    - logic riêng (`componentName.svelte.ts` dùng runes ngoài component nếu cần state chia sẻ)
    - type riêng (`types/componentName.ts`)
  - Ưu tiên composition (slot/snippet) thay vì nhồi nhét props/logic vào 1 chỗ.
- Đặt tên nhất quán: `PascalCase` cho component, `camelCase` cho biến/hàm, `kebab-case` cho route folder.

---

## 2. Pipeline bắt buộc sau MỌI lần chỉnh sửa code

> **Package manager: chỉ dùng `pnpm`.** Không dùng `npm`/`yarn`/`npx` dưới bất kỳ hình thức nào (kể cả khi gõ nhanh). Chạy binary chưa cài thì dùng `pnpm dlx ...`, không dùng `npx ...`.

Sau khi AI edit xong 1 tác vụ (dù nhỏ), **PHẢI** chạy tuần tự, dừng lại và sửa nếu bước nào fail trước khi qua bước kế:

```bash
# 1. Format
pnpm format          # biome format --write .

# 2. Lint
pnpm lint            # biome check .

# 3. Type check
pnpm check           # svelte-check --tsconfig ./tsconfig.json

# 4. Test
pnpm test

# 5. Phát hiện code thừa / export không dùng / dependency chết
pnpm knip

# 6. Phân tích cấu trúc / dependency graph (graphify)
```

---

## 3. Cập nhật tài liệu sau khi pipeline pass

### 3.1 Cập nhật `README.md`
Cập nhật mục "Trạng thái hệ thống" và "Changelog" trong README.md.

### 3.2 Cập nhật `DESIGN_SYSTEM.md`
Chỉ cập nhật khi có quyết định thiết kế mới.
