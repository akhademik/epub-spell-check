# DESIGN_SYSTEM.md — Hệ Thống Thiết Kế Giao Diện (Design System)

Tài liệu quy chuẩn về phong cách thiết kế, màu sắc, typography, components và layout cho dự án **Soát lỗi chính tả EPUB (epub-spell-check)**.

---

## 1. Bảng Màu (Color Palette)

Giao diện sử dụng bảng màu **Dark Mode** mặc định với nền Slate cao cấp:

- **Nền chính (Background):** `bg-slate-950` (#020617), `bg-slate-900` (#0f172a), `bg-slate-850` (#1e293b).
- **Đường viền (Borders):** `border-slate-800`, `border-slate-700/60`.
- **Chữ (Typography):**
  - Tiêu đề & chữ nhấn mạnh: `text-slate-100`, `text-white`
  - Nội dung thường: `text-slate-200`, `text-slate-300`
  - Chữ mờ / Thứ cấp: `text-slate-400`, `text-slate-500`

### Nhóm Màu Lỗi & Phân Loại (Error Category Colors)

| Loại lỗi | Ý nghĩa | Dot Color | Badge Style |
| :--- | :--- | :--- | :--- |
| **UnknownWord / Dictionary** | Từ lạ (Unknown) | `bg-rose-500 shadow-[0_0_8px_#f43f5e]` | `bg-rose-900/60 text-rose-300 border-rose-700/60` |
| **NonVietnamese** | Ngoại ngữ / từ mượn | `bg-blue-500 shadow-[0_0_8px_#3b82f6]` | `bg-blue-900/60 text-blue-300 border-blue-700/60` |
| **CaseError / Uppercase** | Lỗi viết hoa | `bg-amber-500 shadow-[0_0_8px_#f59e0b]` | `bg-amber-900/60 text-amber-300 border-amber-700/60` |
| **Spelling / Typo** | Chính tả / lỗi gõ | `bg-purple-500 shadow-[0_0_8px_#a855f7]` | `bg-purple-900/60 text-purple-300 border-purple-700/60` |
| **ContextConfusion** | Lỗi ngữ cảnh | `bg-cyan-500 shadow-[0_0_8px_#06b6d4]` | `bg-cyan-900/60 text-cyan-300 border-cyan-700/60` |
| **SpecialCharacter** | Ký tự lạ | `bg-pink-500 shadow-[0_0_8px_#ec4899]` | `bg-pink-900/60 text-pink-300 border-pink-700/60` |

---

## 2. Typography

- **Phông Không Chân (Sans-serif):** `"Noto Sans", sans-serif` — dùng cho UI, controls, tiêu đề, badge.
- **Phông Có Chân (Serif):** `"Noto Serif", serif` — dùng cho khung đọc ngữ cảnh (Context Reader).
- **Line height:** `1.8` cho văn bản ngữ cảnh dài để mắt người dùng dễ đọc.

---

## 3. Quy Chuẩn Thành Phần (Component Guidelines)

- **Bo góc (Border Radius):** `rounded-xl` (12px) cho items/inputs, `rounded-2xl` (16px) cho cards lớn và containers, `rounded-lg` cho nút bấm nhỏ.
- **Shadows:** Sử dụng glow shadow tinh tế (`shadow-lg`, `shadow-xl`, `shadow-blue-950/80`).
- **Interactive States:** Luôn có `transition-colors` / `transition-all duration-150` cùng `hover:border-slate-700` và `focus:ring`.
