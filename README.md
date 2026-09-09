# Soát lỗi chính tả EPUB (Tiếng Việt)

Một công cụ web hiện đại, nhanh chóng và mạnh mẽ để phát hiện và sửa các lỗi chính tả trong các tệp EPUB, được thiết kế chuyên biệt cho văn bản tiếng Việt. Ứng dụng hoạt động 100% trên trình duyệt (client-side), bảo mật tuyệt đối dữ liệu sách và hỗ trợ xử lý Web Worker đa luồng.

## Tính năng chính

- **Phân tích EPUB toàn diện:**
  - Tải lên và xử lý các tệp `.epub` dung lượng lớn với tốc độ cao, trích xuất nội dung văn bản từng hồi, từng chương và siêu dữ liệu (tiêu đề, tác giả, bìa sách).
- **Hệ thống 4 tầng từ điển hoạt động đồng thời (4-Tier Dictionary):**
  - **1. Từ điển Tiếng Việt (`vn-dict.txt` - ~9.1k từ):** Đối chiếu từ vựng tiếng Việt chuẩn.
  - **2. Từ điển Tên riêng & Địa danh (`names-dict.txt` - ~10.9k từ):** Tên nhân vật lịch sử, địa lý, tác phẩm, thương hiệu quốc tế và phương Tây.
  - **3. Từ điển Ngoại ngữ & Từ mượn (`non-vn-dict.txt` - ~6.0k từ):** Tập hợp từ vựng mượn thông dụng và ngôn ngữ quốc tế (Anh, Pháp, Nga, Ý, Tây Ban Nha,...).
  - **4. Từ điển Viết tắt & Tuỳ chỉnh (`custom-dict.txt` - ~260 từ):** Nhận diện các từ viết tắt kỹ thuật, tổ chức, số La Mã (VIP, ATM, DNA, FBI, CIA, NKVD, GPU, XIX, XXI,...).
- **Cơ chế kiểm tra thông minh & Khử trùng tuyệt đối:**
  - **Soát lỗi Case-Insensitive:** Tên riêng (`Jeans`, `Olive`, `Alexander`) hay chữ thường (`jeans`, `olive`, `alexander`) đều được nhận diện hợp lệ không phân biệt hoa thường.
  - **Quy tắc bắt lỗi viết hoa (≥ 2 chữ in hoa):** Các từ viết hoa bất thường (do gõ nhầm CapsLock `tÔi`, `sÁch`) sẽ được phát hiện chính xác, trừ khi nằm trong từ điển viết tắt (`custom-dict.txt`).
  - **Miễn nhiễm dấu thanh mới & cũ:** Hỗ trợ song song cả 2 phong cách đặt dấu thanh (`hòa`/`hoà`, `hóa`/`hoá`, `thủy`/`thuỷ`, `khỏe`/`khoẻ`,...) mà không báo lỗi giả.
  - **Lỗi Tiếng Việt:** Phân loại rõ ràng từ không có trong từ điển tiếng Việt, lỗi gõ máy typo (`aa`, `ee`, `oo`), lỗi sai quy tắc phụ âm chính tả (`ngh`/`ng`, `gh`/`g`, `k`/`c`).
- **Thứ tự Ưu tiên Phân loại & Đối chiếu (Dictionary Precedence):**
  - Quá trình kiểm tra và phân loại từ ngữ tuân theo quy tắc ưu tiên chính thức:
    $$\text{CUSTOM} \rightarrow \text{NAMES} \rightarrow \text{NON-VN} \rightarrow \text{VN} \rightarrow \text{SPELLING RULES} \rightarrow \text{UNKNOWN}$$
    1. **CUSTOM (Viết tắt/Ký hiệu):** Ưu tiên tuyệt đối, bao gồm từ viết tắt nhiều chữ hoa và thuật ngữ đặc biệt.
    2. **NAMES (Tên riêng/Địa danh):** Nhận diện tên riêng không phân biệt hoa thường.
    3. **NON-VN (Ngoại ngữ):** Nhận diện từ mượn và ngoại ngữ thông dụng.
    4. **VN (Tiếng Việt):** Đối chiếu từ vựng tiếng Việt chuẩn, hỗ trợ cả 2 phong cách đặt dấu thanh.
    5. **SPELLING RULES (Quy tắc chính tả & Typo):** Phân tích quy tắc kết hợp phụ âm (`ngh`/`ng`, `gh`/`g`, `k`/`c`) và lỗi gõ máy (`aa`, `ee`,...).
    6. **UNKNOWN (Lỗi từ điển):** Từ không thuộc bất kỳ nhóm nào trên.
- **Giao diện trực quan & Trải nghiệm soát lỗi tối ưu:**
  - **Bộ lọc loại lỗi đa chọn (Multi-select Error Types Filter):** Cho phép bật/tắt linh hoạt từng nhóm lỗi (`Lỗi Tiếng Việt`, `Lỗi Viết hoa`, `Từ Ngoại ngữ/Mượn`, `Từ không xác định`) hoặc chọn nhanh "Tất cả / Bỏ chọn tất cả", tự động lưu tuỳ chọn vào `localStorage`.
  - Giao diện Responsive hoàn hảo cho cả thiết bị di động và máy tính để bàn.
  - Khung xem trước ngữ cảnh (Preview Context) mở rộng, hiển thị thoáng mắt với độ giãn dòng `1.8`, làm nổi bật từ lỗi.
  - Tích hợp công cụ tra cứu tức thì 1-click trên **Wiktionary** và **Google Search**.
  - Bảng gợi ý từ đúng thông minh với khoảng cách Levenshtein (nhấp để sao chép vào bộ nhớ tạm).
  - Xuất toàn bộ danh sách từ lỗi sạch ra tệp văn bản nhanh chóng.
- **Quản lý danh sách bỏ qua (Whitelist):**
  - Thêm/xóa từ bỏ qua bằng nhãn màu sinh động.
  - Hỗ trợ nhập và xuất danh sách từ tệp `.txt`, `.md`.
  - Phím tắt bàn phím tiện lợi: di chuyển giữa các lỗi (`⬆️`, `⬇️`), chọn vị trí (`⬅️`, `➡️`) và bỏ qua từ (`Delete` / `I`).

## Cấu trúc từ điển (`public/`)

- `public/vn-dict.txt`: Từ điển từ vựng tiếng Việt chuẩn (~9.1k từ).
- `public/names-dict.txt`: Từ điển tên riêng, nhân danh, địa danh lịch sử (~16.8k từ).
- `public/non-vn-dict.txt`: Từ điển từ ngữ ngoại ngữ và từ mượn quốc tế (~7.0k từ).
- `public/custom-dict.txt`: Từ điển từ viết tắt và chữ số La Mã (~600 từ).

Các file trên là **nguồn dữ liệu tĩnh và fallback** (dùng khi chạy dev độc lập không có KV). Ở môi trường production, ứng dụng ưu tiên đọc/ghi từ điển qua Cloudflare KV API.

## Quản trị từ điển động (Admin Dashboard & Quality Audit)

Ứng dụng cung cấp **Admin Dashboard** trực quan và API động trên Cloudflare Pages + KV:

- **Admin Dashboard**: Bấm nút **"Quản Trị Từ Điển"** trên Header để mở giao diện quản trị:
  - Xem danh sách từ của 4 từ điển (`Tiếng Việt`, `Tên riêng`, `Ngoại ngữ`, `Viết tắt`), tự động sắp xếp theo chuẩn Alphabet tiếng Việt (`vi`).
  - Ô tìm kiếm từ tức thì (Live search & filter).
  - Xóa từ nhanh với 1-click hoặc chọn xóa hàng loạt (Bulk remove).
  - Thêm từ mới với **bộ phân tích cảnh báo thông minh**: Tự động phát hiện lỗi gõ máy (typo), dính chữ OCR, hoặc từ sai danh mục trước khi lưu.
- **Tab Kiểm toán chất lượng từ điển (Quality Audit Panel):**
  - **Tier A (Rác độ tin cậy cao):** Phát hiện tức thì các từ dính OCR, lỗi lặp ký tự gõ máy, hoặc ký tự lạ để dọn dẹp sạch chỉ với 1 click ("Dọn dẹp rác Tier A").
  - **Tier B (Cần duyệt thủ công):** Cảnh báo các từ nghi ngờ để người quản trị chủ động kiểm tra.
  - **Near-duplicate Clustering:** Tự động gom nhóm các cặp từ gần giống nhau (Levenshtein distance $\le 1$ hoặc $\le 2$) kèm điểm rác heuristic, gợi ý giữ từ chuẩn và xóa từ lỗi, hoặc chọn "Bỏ qua cặp này" (lưu vào danh sách `ignoredPairs`).
- **Xác thực bảo mật qua Token bí mật (ADMIN_TOKEN)**:
  - Nhập mã `ADMIN_TOKEN` để mở khóa bảng điều khiển và thực hiện thao tác thêm/xóa/dọn dẹp từ điển.
  - Token được lưu tạm trong bộ nhớ (In-Memory) của phiên làm việc hiện tại, tự động xóa sạch khi tải lại trang hoặc đóng trình duyệt để chống tấn công XSS.

## Công cụ dòng lệnh (CLI Tools) & Git Hook

- **Kiểm toán & Dọn dẹp từ điển qua CLI (`pnpm dicts:clean`):**
  - Chạy audit hoặc dọn dẹp trực tiếp trên local files hoặc Cloudflare KV:
    ```bash
    # Chạy kiểm tra không thay đổi dữ liệu (Dry Run)
    pnpm dicts:clean --source=local --dry-run
    pnpm dicts:clean --source=kv --dry-run

    # Tự động dọn dẹp rác Tier A và tạo bản sao lưu (.bak)
    pnpm dicts:clean --source=local --apply --tier=A
    ```
- **Tự động đồng bộ từ điển từ Cloudflare KV khi Git Commit:**
  - Tích hợp Git hook qua `simple-git-hooks`: Tự động chạy `pnpm dicts:pull-from-kv` trước mỗi commit để kéo dữ liệu mới nhất từ KV về thư mục `public/`. Quá trình chạy an toàn ở chế độ non-blocking (tự bỏ qua nếu chưa cấu hình `CLOUDFLARE_API_TOKEN`).

### Hướng dẫn thiết lập từng bước trên Cloudflare

#### Bước 1: Tạo Cloudflare KV Namespace
Chạy lệnh sau tại terminal máy tính của bạn:
```bash
npx wrangler kv namespace create DICT_KV
```
Copy chuỗi `id` được in ra và dán vào file `wrangler.toml` (mục `id = "..."`).

#### Bước 2: Cấu hình KV Binding trên Cloudflare Pages Dashboard
1. Truy cập [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → Chọn dự án Pages của bạn (`epub-spell-check`).
2. Vào tab **Settings** → **Functions** → mục **KV namespace bindings**.
3. Bấm **Add binding**:
   - **Variable name**: `DICT_KV`
   - **KV namespace**: Chọn namespace `DICT_KV` vừa tạo ở Bước 1.
   - *(Thực hiện cho cả môi trường Production và Preview)*.

#### Bước 3: Cấu hình Secret ADMIN_TOKEN (Dự phòng)
1. Trong trang dự án Pages → **Settings** → **Environment variables**.
2. Bấm **Add variable** / **Add secret**:
   - Tên biến: `ADMIN_TOKEN`
   - Giá trị: Nhập một chuỗi mật mã bí mật tự chọn (vd: `my-super-secret-key-2026`).

#### Bước 4: Seed dữ liệu ban đầu vào Cloudflare KV
Chạy script sau một lần duy nhất để nạp sẵn dữ liệu từ các file `.txt` hiện có vào KV:
```bash
./scripts/seed-kv.sh <KV_NAMESPACE_ID> --remote
```

#### Bước 5: Cấu hình Cloudflare Zero Trust (Access) để đăng nhập bằng Gmail
1. Trên Cloudflare Dashboard, menu bên trái chọn **Zero Trust** (hoặc truy cập `one.dash.cloudflare.com`).
2. Vào **Access** → **Applications** → Bấm **Add an application** → Chọn **Self-hosted**.
3. **Application Configuration**:
   - **Application name**: `Ebook Spell Check Admin`
   - **Session Duration**: Chọn `24 hours` hoặc `1 month`.
   - **Application domain**:
     - Subdomain / Path: Nhập domain Pages của bạn (vd: `your-app.pages.dev`).
     - Path: Nhập `/api/dict/*` (hoặc bảo vệ toàn bộ `your-app.pages.dev`).
4. Bấm **Next** để tạo **Policy**:
   - **Policy name**: `Admin Only`
   - **Action**: `Allow`
   - **Configure rules**: Chọn Selector: **Emails** → Nhập địa chỉ **Gmail** của bạn (vd: `your-email@gmail.com`).
5. Bấm **Save application**.

Từ lúc này, khi bạn mở Web App, Cloudflare sẽ tự nhận diện đăng nhập của bạn và bạn có thể thêm/xóa từ trực tiếp trên Admin Dashboard mà không cần gõ bất kỳ token nào!

## Phát triển & Kiểm thử

Dự án sử dụng **Svelte 5 (Runes)**, **Vite**, **TypeScript**, **Tailwind CSS**, **Biome** và **Vitest**:

```bash
# Cài đặt dependencies và kích hoạt Git Hooks
pnpm install

# Khởi chạy máy chủ phát triển
pnpm dev

# Kiểm tra kiểu TypeScript & Svelte Runes
pnpm check

# Kiểm tra Linter & Format (Biome)
pnpm lint
pnpm format:check

# Tự động định dạng mã nguồn (Biome)
pnpm format

# Quét mã rác & phụ thuộc thừa (Knip)
pnpm knip

# Chạy toàn bộ bộ kiểm thử tự động (15 suites / 118+ tests)
pnpm test

# Chạy bộ kiểm thử nhanh Smoke Tests
pnpm test:smoke

# Chạy bộ kiểm thử an toàn chống Regression
pnpm test:regression

# Đóng gói bản phát hành Production
pnpm build
```
