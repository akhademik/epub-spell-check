# Instruction: Dọn rác & phát hiện trùng lặp mờ cho hệ thống từ điển (epub-spell-check)

> Đưa nguyên file này cho AI/dev thực hiện trên nhánh `develop` của repo
> `akhademik/epub-spell-check`. Bối cảnh & quyết định thiết kế đã chốt nằm ở
> mục 0. Các mục 1-4 là yêu cầu triển khai cụ thể.

---

## 0. Bối cảnh & các quyết định đã chốt

- Dự án có 4 từ điển: `vn`, `names`, `non-vn`, `custom`. Nguồn dữ liệu **chính
  thức (source of truth) là Cloudflare KV**, key `dict:{name}:content`
  (xem `functions/api/dict/[name].ts`, `scripts/seed-kv.sh`).
- File `public/{name}-dict.txt` **vẫn giữ lại**, không xoá. Vai trò của nó đổi
  thành: (a) fallback khi chạy `vite dev` thuần không có KV, (b) bản snapshot
  có version-control để `git diff`/`git blame` tra được lịch sử thay đổi từ
  điển — thứ mà KV tự nó không cho ta free (KV không có diff/history).
  → File `.txt` phải được coi là **generated artifact**, luôn đồng bộ *sau*
  khi KV thay đổi, không sửa tay trực tiếp nữa (ngoại trừ seed lần đầu).
- Việc xoá từ "rác" phải **an toàn**: không có script nào tự động ghi đè KV mà
  không có bản backup + chế độ dry-run trước.
- Việc gợi ý "từ nào đúng, từ nào sai" trong các cặp gần giống (vd
  `MacArthur` vs `Macathur`) **không tự động xoá** — chỉ gợi ý (suggest) trên
  Admin Dashboard để người quản trị bấm xác nhận. Đây là quyết định sản phẩm
  quan trọng: không có nguồn dữ liệu ngoài (không internet lookup) nên độ
  chính xác của heuristic không đạt 100%, tự động xoá là rủi ro mất dữ liệu
  đúng.

---

## 1. Module dùng chung: `src/utils/dict-quality.ts` (mới)

Tạo 1 module logic thuần (không phụ thuộc DOM/Cloudflare) để cả 3 nơi dùng
chung: script CLI dọn KV, script CLI dọn `public/*.txt`, và Admin Dashboard
UI (gọi qua API mới ở mục 4). Tránh lặp logic ở nhiều chỗ (bài học từ vụ bug
`getErrorType` vs `filter.ts` bị lệch nhau).

Tái sử dụng tối đa hàm đã có sẵn:
- `levenshteinDistance` và `getBaseWord` từ `src/utils/analysis-core.ts`
- `isRepeatedUnit`, `TITLECASE_MERGE_RE`, `VN_EXCLUSIVE_RE`,
  `validateDictionaryWord` từ `src/utils/dict-validator.ts`

### 1.1 Phát hiện rác (garbage detection) — chia 2 tier theo độ tin cậy

**Tier A — auto-flag độ tin cậy rất cao** (gần như chắc chắn là rác, an toàn
để đưa vào danh sách "xoá hàng loạt" cho admin duyệt 1 click):

| Rule | Regex / logic | Lý do |
|---|---|---|
| Chứa số | `/\d/.test(word)` | Tên riêng/từ vựng thật không chứa chữ số |
| Chứa chuỗi liên quan file/URL | `/pdf|http|www\.|\.com|\.net|\.org/i.test(word)` | Rò rỉ artifact từ OCR/scrape (vd đã thấy `HresponseMKpdf`) |
| Chuỗi phụ âm liên tiếp ≥ 5 ký tự, loại trừ `y` | `/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{5,}/.test(word)` | Không ngôn ngữ nào có 5 phụ âm liền không nguyên âm (vd `KLwnN`, `Phbcnt`, `QKtsq`, `SVPSh`) |
| `isRepeatedUnit(word)` = true | dùng lại hàm có sẵn | Chuỗi lặp âm kiểu "Hahaha", "hehehe" |
| Độ dài bất thường | `word.length > 30` (names/vn/non-vn) hoặc `> 30` (custom, đã có sẵn trong validator) | Không có tên/từ thật dài vậy |
| Tỉ lệ nguyên âm quá thấp trên toàn từ | số nguyên âm (bao gồm `y`) / độ dài < 0.2 và `word.length >= 6` | Bổ sung, bắt các trường hợp phụ âm rải rác không liền nhau nhưng vẫn vô nghĩa |

**Tier B — review-required** (độ tin cậy trung bình, liệt kê ra để admin coi
qua chứ không gợi ý xoá hàng loạt):

- `TITLECASE_MERGE_RE.test(word)` mà **không** dính `VN_EXCLUSIVE_RE` (2 cụm
  TitleCase dính liền, kiểu `MacArthur` — nhưng đây cũng là pattern hợp lệ
  của rất nhiều họ nước ngoài, nên KHÔNG được xếp Tier A).
- Với `dictName === "vn"`: kết quả `validateDictionaryWord("vn", word).status
  !== "valid"` (dùng lại nguyên bộ luật warning đã có: đuôi typo aa/ee/oo,
  chứa f/j/w/z).
- Với `dictName === "non-vn"`: chứa ký tự tiếng Việt độc quyền
  (`VN_EXCLUSIVE_RE`) — logic y hệt rule reject đã có trong
  `validateDictionaryWord`, chỉ khác là áp lên **dữ liệu đang tồn tại** thay
  vì lúc thêm mới.

> Lưu ý quan trọng khi viết rule: **không đụng vào các entry có 2+ chữ hoa
> hoặc hoa-giữa-từ chỉ vì lý do "trông lạ"** — đó là việc của bug
> `getErrorType` (đã note ở lượt trước, sửa riêng trong `analysis-core.ts`,
> không liên quan tới việc dọn dữ liệu).

### 1.2 Output chuẩn của module

```ts
export interface GarbageFinding {
  word: string
  dictName: "vn" | "names" | "non-vn" | "custom"
  tier: "A" | "B"
  reasons: string[] // có thể match nhiều rule cùng lúc
}

export function scanDictionaryForGarbage(
  dictName: "vn" | "names" | "non-vn" | "custom",
  words: string[]
): GarbageFinding[]
```

---

## 2. Phát hiện trùng lặp mờ (fuzzy near-duplicate detection)

Mục tiêu: bắt các cặp như `MacArthur` / `Macathur`, `Sangreal` / `SanGreal`
trong CÙNG một dict.

### 2.1 Thuật toán

1. Chuẩn hoá mỗi từ: `lower = word.toLowerCase().normalize("NFC")`,
   `base = getBaseWord(lower)` (bỏ dấu, cho riêng dict `vn`).
2. Bucket theo độ dài (giống cách `analyzer.ts` đang làm với
   `buildIndexedDictionary`) để tránh so sánh O(n²) toàn bộ — chỉ so trong
   cùng dict, độ dài lệch nhau ≤ 2.
3. Với mỗi cặp trong cùng bucket: tính
   `levenshteinDistance(lowA, lowB, 2)`.
   - Nếu `distance` trong khoảng `[1, 2]` VÀ hai từ **không giống hệt nhau
     sau khi bỏ dấu/hoa thường** → coi là **candidate cluster**.
4. Loại trừ false-positive rõ ràng: nếu cả 2 từ đều "hợp lệ" theo nghĩa
   không dính rule Tier A/B nào ở mục 1, **và** độ dài ≥ 8, thì hạ độ ưu
   tiên hiển thị xuống (vẫn liệt kê nhưng đánh dấu `confidence: "low"`) —
   vì với tên riêng nước ngoài dài, 2 tên khác nhau nhưng gần giống là chuyện
   bình thường (`Johnson` / `Johnston` là 2 người khác nhau chẳng hạn).
5. Gom các cặp chồng nhau thành cluster (union-find đơn giản) để hiển thị 1
   nhóm thay vì nhiều cặp rời rạc.

### 2.2 Heuristic "suggest giữ / suggest xoá" trong 1 cluster

Không thể chắc chắn 100% nếu không có nguồn tra cứu ngoài, nên chỉ **xếp
hạng gợi ý**, luôn hiển thị cả cụm để admin tự quyết:

Tính `garbageScore` cho từng từ trong cluster (dựa trên mục 1):
- Dính Tier A → điểm rác = 100 (gần như chắc chắn nên xoá)
- Dính Tier B → điểm rác = 40
- Không dính rule nào → điểm rác = 0

Sort trong cluster theo `garbageScore` giảm dần. Từ điểm cao nhất được gắn
nhãn **"Có khả năng là lỗi — gợi ý xoá"**, các từ còn lại (đặc biệt từ điểm
0) gắn nhãn **"Có khả năng đúng — gợi ý giữ"**. Nếu tất cả các từ trong
cluster đều điểm 0 (không dính rule rác nào) → không suggest xoá/giữ, chỉ
hiển thị trung lập "2 từ gần giống nhau, tự kiểm tra" (đúng ca `MacArthur`
vs `Macathur` nếu cả 2 đều pass hết rule rác — thực tế `Macathur` không dính
rule rác nào ở mục 1, nên với case này hệ thống sẽ hiển thị trung lập, KHÔNG
tự tin gợi ý — điều này đúng tinh thần "chỉ gợi ý khi đủ confident" bạn yêu
cầu, tránh gợi ý sai).

> Ghi chú thêm hướng nâng cấp sau này (không bắt buộc làm ngay): có thể tăng
> độ tự tin bằng cách build 1 "reference frequency list" tách biệt (ví dụ từ
> 1 nguồn tiếng Anh/tên riêng phổ biến đã biết) rồi so khớp — nhưng việc này
> cần thêm dữ liệu ngoài, để version sau.

### 2.3 Cơ chế "ignore" (đánh dấu false-positive)

Nhiều cặp gần giống là **cố ý** (2 tên khác nhau thật). Cần chỗ lưu để không
bị hỏi lại lần scan sau:

- Thêm KV key mới: `dict:{name}:ignored-pairs` — value là JSON array các
  cặp đã được admin bấm "Không phải trùng, bỏ qua", dạng
  `["macarthur|macathur", ...]` (key = 2 từ lowercase, sort alphabet, nối
  bằng `|`, để tra ngược chiều nào cũng ra).
- Khi scan, loại các cặp đã có trong `ignored-pairs` ra khỏi kết quả trả về.

---

## 3. Script CLI: `scripts/clean-dicts.ts`

Chạy bằng `pnpm tsx scripts/clean-dicts.ts [options]` (hoặc thêm script
`"dicts:clean"` vào `package.json`). Phải hỗ trợ 2 nguồn dữ liệu:

```
--source=local     # đọc/ghi public/*.txt (mặc định)
--source=kv        # đọc/ghi qua Cloudflare KV thật, cần --namespace-id
--dict=vn,names     # chỉ định dict nào (mặc định: cả 4)
--dry-run           # mặc định TRUE — chỉ in báo cáo, không ghi gì cả
--apply             # thực sự ghi thay đổi (bắt buộc gõ rõ ràng)
--tier=A            # chỉ auto-xoá Tier A; Tier B luôn chỉ report, không tự xoá
```

### 3.1 Luồng chạy

1. Đọc nội dung dict (từ file hoặc `npx wrangler kv key get
   "dict:{name}:content" --namespace-id <id> [--remote]`).
2. Chạy `scanDictionaryForGarbage` (mục 1) và thuật toán fuzzy-duplicate
   (mục 2) trên toàn bộ.
3. In ra report dạng bảng: tổng số từ, số Tier A, số Tier B, số cluster
   trùng lặp mờ tìm được, kèm ví dụ.
4. Nếu `--dry-run` (mặc định): **dừng ở đây**, không sửa gì. Xuất thêm 1
   file report `.json`/`.md` (vd `reports/dict-clean-{name}-{timestamp}.md`)
   để admin/dev đọc, review bằng mắt.
5. Nếu `--apply`:
   - **Backup trước khi ghi**: với KV, `wrangler kv key put
     "dict:{name}:content:backup:{ISO-timestamp}" --path <file-gốc>` (giữ
     nguyên bản cũ). Với file local, copy ra
     `public/.backup/{name}-dict.{timestamp}.txt` (thêm `.backup/` vào
     `.gitignore`).
   - Chỉ xoá các từ **Tier A** khỏi nội dung (Tier B và fuzzy-duplicate
     KHÔNG bao giờ tự xoá qua CLI — 2 loại này chỉ xử lý qua Admin Dashboard
     ở mục 4, cần người bấm xác nhận từng cái).
   - Ghi lại: cập nhật cả `dict:{name}:content` và `dict:{name}:updated`
     (đúng format hiện có trong `functions/api/dict/[name].ts`).

### 3.2 Đồng bộ `public/*.txt` từ KV — tự động qua Git pre-commit hook ⭐

**Quyết định cuối**: chạy tự động mỗi lần dev commit code (không cần nhớ gõ
lệnh tay, không cần thêm secret GitHub PAT nào, không đụng gì tới
Cloudflare Pages/PR). Cơ chế: **git pre-commit hook chạy hoàn toàn local**,
dùng `wrangler` CLI đã login sẵn trên máy dev — mỗi lần `git commit`, hook
tự pull KV mới nhất, ghi đè `public/*.txt`, rồi tự `git add` để đổi đó nhập
luôn vào commit đang tạo. Con người vẫn là người bấm nút commit cuối cùng
(review qua `git diff`/`git status` trước khi confirm), nên vẫn an toàn,
không có gì đẩy lên production mà không qua mắt người.

#### Cài đặt: dùng `simple-git-hooks` (nhẹ, không cần Husky)

Thêm devDependency:
```bash
pnpm add -D simple-git-hooks
```

Thêm vào `package.json`:
```json
{
  "scripts": {
    "postinstall": "simple-git-hooks",
    "dicts:pull-from-kv": "tsx scripts/pull-dicts-from-kv.ts"
  },
  "simple-git-hooks": {
    "pre-commit": "pnpm dicts:pull-from-kv"
  }
}
```
`postinstall` đảm bảo **mọi dev clone repo về, chạy `pnpm install` là tự có
hook** — không ai phải setup tay riêng lẻ.

#### Script `scripts/pull-dicts-from-kv.ts`

- **Tự đọc `namespace-id` từ `wrangler.toml`** (đã có sẵn field
  `[[kv_namespaces]] id = "..."` trong repo — không cần dev truyền tay
  tham số, không cần biến môi trường mới).
- Với mỗi dict trong 4 loại, chạy `npx wrangler kv key get
  "dict:{name}:content" --namespace-id <id-đọc-từ-wrangler.toml> --remote`.
- So sánh nội dung tải về với `public/{name}-dict.txt` hiện tại:
  - Nếu **giống hệt** → bỏ qua, không đụng file, không log ồn.
  - Nếu **khác** → ghi đè file, `console.log` ngắn gọn dạng
    `"✓ Đã cập nhật public/vn-dict.txt từ KV (+12 / -3 từ)"`, và tự chạy
    `git add public/{name}-dict.txt` để đổi thay được gộp vào commit đang
    tạo.
- **Không được chặn commit khi có lỗi mạng/KV**: nếu `wrangler` lỗi (mất
  mạng, chưa `wrangler login`, KV namespace sai...), script phải **catch
  lỗi, in cảnh báo màu vàng, rồi exit code 0** (không phải exit 1) — để
  commit vẫn tiếp tục bình thường với code, không bắt dev phải có mạng/VPN
  mới commit được. Đây là điểm bắt buộc, tránh hook biến thành điểm nghẽn
  khó chịu.
- Thời gian chạy: gọi 4 lần `wrangler kv key get` mất khoảng 1-3 giây tuỳ
  mạng — chấp nhận được cho mỗi lần commit, không cần tối ưu thêm.

#### Vì sao chọn cách này thay vì "sync khi vào trang admin"

- Chạy trên máy dev, dùng credential Cloudflare **của chính dev** (đã login
  sẵn qua `wrangler login`) — không cần phát sinh thêm bất kỳ secret mới
  nào trong Cloudflare Pages hay GitHub.
- File `.txt` được cập nhật **và có người review** (qua diff trước khi
  confirm commit) trước khi lên git — không có bước "âm thầm tự push" nào.
- Không phụ thuộc việc admin có mở trang Dashboard hay không — dù admin chỉ
  sửa dict qua UI mà dev không hề biết, lần commit code tiếp theo (bất kỳ
  ai, bất kỳ lúc nào) sẽ tự kéo bản KV mới nhất về, nên `public/*.txt`
  luôn hội tụ về đúng "clone gần nhất hoạt động tốt của KV" như bạn muốn,
  mà không cần thêm hạ tầng nào ở phía Cloudflare.

---

## 4. Tích hợp vào Admin Dashboard

### 4.1 API mới

Thêm route Cloudflare Pages Function:
`functions/api/dict/[name]/audit.ts`

- `GET /api/dict/:name/audit` (yêu cầu auth `ADMIN_TOKEN` giống các route
  admin khác trong `functions/api/dict/[name].ts`):
  - Lấy nội dung hiện tại từ KV, chạy `scanDictionaryForGarbage` +
    fuzzy-duplicate detection (mục 1, 2) ngay trong function (import từ
    `src/utils/dict-quality.ts` — module này thuần TS không phụ thuộc
    browser API nên dùng lại được ở Cloudflare Function).
  - Trả về JSON:
    ```json
    {
      "garbage": [ { "word": "...", "tier": "A", "reasons": [...] } ],
      "duplicateClusters": [
        {
          "id": "cluster-1",
          "words": [
            { "word": "MacArthur", "garbageScore": 0, "suggestion": "keep" },
            { "word": "Macathur", "garbageScore": 0, "suggestion": "neutral" }
          ]
        }
      ]
    }
    ```
- `POST /api/dict/:name/audit/ignore` — body `{ pairKey: string }`, ghi vào
  `dict:{name}:ignored-pairs` (mục 2.3).

### 4.2 UI: `src/components/admin/DictAuditPanel.svelte` (mới)

Thêm tab/section mới trong `AdminDashboard.svelte` hiện có (file đã tồn
tại, 383 dòng — thêm tab thứ 2 bên cạnh phần quản lý từ hiện tại), tên gợi ý
**"Kiểm tra chất lượng"**:

- **Khối 1 — Rác độ tin cậy cao (Tier A)**: danh sách checkbox (mặc định
  tick hết), nút "Xoá các mục đã chọn" → gọi lại đúng API `POST
  /api/dict/:name` hiện có với `action: "remove"`, `words: [...]` (tái dùng
  nguyên API cũ, không cần route riêng để xoá — route `/audit` chỉ dùng để
  *phát hiện*).
- **Khối 2 — Cần xem lại (Tier B)**: liệt kê kèm lý do, để admin tự quyết
  từng dòng (không có checkbox mặc định tick sẵn).
- **Khối 3 — Nghi trùng lặp**: mỗi cluster hiển thị dạng 2 nút cạnh nhau
  (từ nào cũng có thể bấm), nút được gợi ý ("khả năng đúng") có viền xanh
  nhạt, nút còn lại ("khả năng lỗi") viền đỏ nhạt — nếu cả 2 đều neutral thì
  không tô màu. Có nút thứ 3 "Không phải trùng, bỏ qua" gọi API
  `/audit/ignore`.
- Toàn bộ khối chỉ **load khi admin bấm nút "Quét kiểm tra"** (không tự
  chạy khi mở dashboard) — vì đây là thao tác nặng, không cần chạy mỗi lần
  mở trang.

---

## 5. [MỚI] Đổi bộ lọc loại lỗi từ "tab đơn" sang "toggle cộng dồn"

### 5.1 Hiện trạng (đã đọc code để xác nhận)

`src/components/ErrorList.svelte` hiện có `typeFilter =
$state<"all" | ErrorType>("all")` — **radio-style, chỉ chọn được 1 loại lỗi
tại 1 thời điểm** (hoặc "Tất cả"). Đây là state **local trong component**,
không liên quan gì tới `appState.totalErrorGroups` /
`appState.totalErrorInstances` hiển thị bên `ResultsView.svelte` — 2 số đó
luôn tính trên **toàn bộ** lỗi (không bị ảnh hưởng bởi việc đang xem tab
nào). Đây chính là lý do "chuyển tab rất mệt" bạn gặp: đổi tab chỉ đổi
*danh sách hiển thị*, không đổi *tổng số lỗi* — 2 thứ đang tách rời nhau.

### 5.2 Yêu cầu mới

- Danh sách lỗi **luôn hiển thị đầy đủ dạng 1 danh sách duy nhất** (không
  chia tab nữa).
- Có 1 hàng chip/pill cho từng loại lỗi (`Từ điển VN`, `Ngoại ngữ`,
  `Viết hoa`, `Typo`, `Chính tả` — xem 5.4 về `SpecialCharacter`), mỗi chip
  **bật/tắt độc lập** (không phải radio nữa — giống checkbox nhiều lựa
  chọn).
- Mặc định: **tất cả chip đều ON** (select all).
- Tắt 1 chip (vd "Viết hoa") → toàn bộ lỗi loại đó **biến mất khỏi danh
  sách VÀ trừ khỏi tổng số lỗi hiển thị ở mọi nơi trong app** (không chỉ
  trong panel ErrorList) — vì tổng số lỗi (`ResultsView.svelte`, dùng
  `appState.totalErrorGroups`/`totalErrorInstances`) và cả điều hướng bằng
  phím tắt (⬆️⬇️ chuyển lỗi, xem README) đều phải đồng nhất với những gì
  đang được lọc, không được lệch nhau.
- Có nút "Tất cả" hoạt động như **select-all / clear-all 2 chiều**: nếu
  chưa chọn hết → bấm để chọn hết; nếu đang chọn hết → bấm để bỏ chọn hết
  (giúp user bắt đầu từ rỗng rồi tự chọn vài loại muốn xem, thay vì phải
  tắt tay từng chip).

### 5.3 Vị trí cần sửa (đường dẫn cụ thể)

Để tránh lặp lại đúng lỗi kiến trúc "2 nguồn sự thật" đã gặp ở phần trước
của cuộc trao đổi này (bug `getErrorType` vs `filter.ts`), **state bộ lọc
loại lỗi phải nằm ở `appState` (global), không nằm local trong
`ErrorList.svelte`**, để mọi nơi trong app (danh sách, tổng số, điều
hướng phím tắt, context view...) đọc chung 1 nguồn.

1. **`src/state.svelte.ts`**:
   - Thêm hằng số (hoặc import từ `types/errors.ts`):
     `export const ALL_ERROR_TYPES: ErrorType[] = ["Dictionary",
     "NonVietnamese", "Uppercase", "Typo", "Spelling", "SpecialCharacter"]`
   - Thêm state mới:
     `enabledErrorTypes = $state<Set<ErrorType>>(new Set(ALL_ERROR_TYPES))`
   - Thêm method:
     ```ts
     toggleErrorType(type: ErrorType) {
       const next = new Set(this.enabledErrorTypes)
       next.has(type) ? next.delete(type) : next.add(type)
       this.enabledErrorTypes = next
       saveStorage(STORAGE_KEYS.ENABLED_ERROR_TYPES, Array.from(next))
     }
     toggleAllErrorTypes() {
       this.enabledErrorTypes =
         this.enabledErrorTypes.size >= ALL_ERROR_TYPES.length
           ? new Set()
           : new Set(ALL_ERROR_TYPES)
       saveStorage(STORAGE_KEYS.ENABLED_ERROR_TYPES, Array.from(this.enabledErrorTypes))
     }
     ```
   - Nên persist vào `localStorage` (thêm key mới `ENABLED_ERROR_TYPES` vào
     `STORAGE_KEYS`, load lúc khởi tạo giống cách `whitelist`/
     `checkSettings` đang làm) để lựa chọn của user không mất khi reload.
   - Sửa `currentFilteredErrors` (dòng ~154) truyền thêm
     `this.enabledErrorTypes` vào `getFilteredErrors(...)`.

2. **`src/utils/filter.ts`**:
   - Thêm tham số `enabledTypes: Set<ErrorType>` vào `getFilteredErrors()`.
   - Thêm bước lọc (đặt sớm để short-circuit):
     ```ts
     if (!enabledTypes.has(group.type)) return false
     ```
   - **Cập nhật `tests/unit/filter.test.ts`** — file test đã tồn tại, hiện
     gọi `getFilteredErrors` với 4 tham số, cần thêm tham số thứ 5 vào tất
     cả các case đang có, cộng thêm ≥ 2 test case mới: (a) tắt 1 loại lỗi
     → nhóm loại đó biến mất; (b) `enabledTypes` rỗng → trả về mảng rỗng.

3. **`src/components/ErrorList.svelte`**:
   - Xoá state local `typeFilter` và đoạn filter theo `typeFilter` trong
     `filteredList` (dòng 45-51) — không cần nữa vì
     `appState.currentFilteredErrors` đã lọc theo type từ trước (tránh lặp
     logic 2 lần, đúng bài học đã rút ra trong cuộc trao đổi này).
   - `filteredList` giờ chỉ còn áp thêm `searchQuery` lên trên
     `appState.currentFilteredErrors` (đã được lọc theo type + whitelist +
     checkSettings sẵn).
   - Đổi hàng pill hiện tại (dòng ~124-184) từ "click để set typeFilter =
     X" sang "click để gọi `appState.toggleErrorType(X)`", style theo
     trạng thái bật/tắt:
     - ON: giữ nguyên màu theo type như code hiện có (rose/blue/amber/
       orange/purple).
     - OFF: đổi sang style mờ/xám (vd `opacity-40 grayscale` hoặc nền
       `bg-slate-900 text-slate-600 border-slate-800`), vẫn giữ label để
       biết đang tắt cái gì, bấm lại để bật.
   - Nút "Tất cả": gọi `appState.toggleAllErrorTypes()`, label động — hiện
     "Tất cả" khi chưa chọn hết, "Bỏ chọn tất cả" khi đã chọn hết toàn bộ
     `ALL_ERROR_TYPES`.
   - Badge tổng số ở góc (`{filteredList.length} từ`, dòng ~117) tự động
     đúng theo yêu cầu "cộng dồn" mà không cần sửa gì thêm, vì nó đã tính
     trên list đã lọc theo `enabledErrorTypes` từ tầng global.

4. **Empty-state message** (dòng ~195-202 trong `ErrorList.svelte`): hiện
   khi danh sách rỗng luôn hiện "Tuyệt vời! Không tìm thấy lỗi chính tả
   nào." — cần phân biệt 2 trường hợp để không gây hiểu lầm:
   - `appState.enabledErrorTypes.size === 0` (user tự tắt hết chip) → hiện
     thông điệp khác, vd "Bạn đã tắt hết các loại lỗi — bật lại ít nhất 1
     loại để xem danh sách."
   - Thực sự không có lỗi nào (mọi loại đều bật nhưng sách sạch) → giữ
     nguyên thông điệp "Tuyệt vời!" như cũ.

5. **`src/components/ContextView.svelte`**: chỉ cần double-check khi lỗi
   đang được chọn (`appState.currentGroup`) bị tắt chip đi (type của nó
   không còn trong `enabledErrorTypes`) thì `currentGroup` derived (đã có
   logic fallback `currentFilteredErrors[0]`, xem `state.svelte.ts`
   dòng ~163-172) tự nhảy sang lỗi hợp lệ kế tiếp — verify bằng tay/test
   chứ không cần sửa code thêm vì logic fallback này đã có sẵn.

### 5.4 Lưu ý về `SpecialCharacter`

Đã kiểm tra: type `"SpecialCharacter"` có định nghĩa trong
`src/types/errors.ts` và có màu/label riêng trong `ErrorList.svelte`/
`ContextView.svelte`, nhưng **`getErrorType()` trong `analysis-core.ts`
không bao giờ thực sự trả về loại này** — tức đây là type "chết", không
phát sinh lỗi thật nào trong ứng dụng hiện tại. Khi làm hàng chip mới, có
2 lựa chọn, chọn 1:
- (a) Vẫn thêm chip cho nó (an toàn, tương lai nếu ai đó implement detect
  ký tự lạ thì chip đã có sẵn, chỉ là hiện tại sẽ luôn hiện "0" bên cạnh).
- (b) Bỏ qua, không hiện chip này (đỡ rối UI vì chip không bao giờ có tác
  dụng).

  Khuyến nghị: **(b)** cho gọn UI — chỉ lặp qua các type **thực sự đang
  xuất hiện trong `appState.allDetectedErrors` tại thời điểm hiện tại**
  thay vì hard-code cứng 5-6 type, để hàng chip tự thích ứng nếu sau này
  có thêm/bớt loại lỗi mà không cần sửa lại `ErrorList.svelte`.

---

## 6. Checklist triển khai (theo thứ tự nên làm)

**Nhóm A — Dọn rác & trùng lặp dictionary (mục 1-4):**
1. [ ] Tạo `src/utils/dict-quality.ts` với `scanDictionaryForGarbage` +
       fuzzy-duplicate clustering, kèm **unit test** riêng
       (`tests/unit/dict-quality.test.ts`) — test cả rule dương tính
       (bắt đúng rác đã biết: `HresponseMKpdf`, `KLwnN`...) lẫn âm tính
       (không bắt nhầm từ hợp lệ: `Rothschild`, `Nietzsche`,
       `Messerschmitt`...).
2. [ ] Viết `scripts/clean-dicts.ts`, test với `--source=local --dry-run`
       trước trên máy dev, review report bằng mắt.
3. [ ] Test `--source=kv --dry-run` nhắm vào KV namespace **preview/dev**
       trước, KHÔNG chạy thẳng vào production.
4. [ ] Thêm route `functions/api/dict/[name]/audit.ts` (GET + POST ignore).
5. [ ] Thêm `DictAuditPanel.svelte` + gắn vào `AdminDashboard.svelte`.
6. [ ] Chạy thử `--apply` Tier A trên KV preview trước, rồi mới apply lên
       production KV.

**Nhóm B — Tự động đồng bộ KV → `public/*.txt` qua git hook (mục 3.2):**
7. [ ] Thêm `simple-git-hooks` vào devDependencies, cấu hình `pre-commit`
       + `postinstall` trong `package.json`.
8. [ ] Viết `scripts/pull-dicts-from-kv.ts` — tự đọc namespace id từ
       `wrangler.toml`, so sánh & ghi đè `public/*.txt`, `git add` file đổi,
       **không bao giờ throw/exit lỗi khiến commit bị chặn** khi mất mạng
       hoặc chưa `wrangler login`.
9. [ ] Test thủ công: sửa 1 từ trong KV (qua Admin Dashboard hoặc
       `wrangler kv key put` tay), sau đó `git commit` bất kỳ thay đổi code
       nào → xác nhận `public/*.txt` tương ứng tự đổi theo và được gộp vào
       commit.
10. [ ] Test edge case: rút mạng / logout wrangler → xác nhận `git commit`
        vẫn chạy được bình thường, chỉ có cảnh báo in ra, không bị chặn.

**Nhóm C — Toggle lỗi cộng dồn thay vì tab (mục 5):**
11. [ ] Thêm `enabledErrorTypes`, `toggleErrorType`, `toggleAllErrorTypes`
        vào `src/state.svelte.ts` (+ persist localStorage).
12. [ ] Sửa `getFilteredErrors()` trong `src/utils/filter.ts` nhận thêm
        `enabledTypes`, cập nhật toàn bộ `tests/unit/filter.test.ts` cho
        khớp signature mới + thêm test case toggle.
13. [ ] Sửa `ErrorList.svelte`: bỏ `typeFilter` local, đổi pill sang
        multi-toggle gọi `appState.toggleErrorType`, thêm nút chọn/bỏ chọn
        tất cả, sửa empty-state khi `enabledErrorTypes.size === 0`.
14. [ ] Verify `ResultsView.svelte` (tổng lỗi) và điều hướng phím tắt
        (⬆️⬇️ trong `ContextView.svelte`) phản ứng đúng khi tắt/bật chip —
        test tay hoặc thêm test tương ứng nếu có sẵn khung test cho luồng
        này.

**Chung:**
15. [ ] Chạy `pnpm check && pnpm lint && pnpm test` sau khi làm xong cả 3
        nhóm — đảm bảo không phá vỡ gì hiện có trước khi mở PR.

## 7. Nguyên tắc an toàn — bắt buộc tuân thủ

- Không script nào được xoá dữ liệu KV production mà không có backup key
  ghi trước đó trong cùng lần chạy.
- Tier B và fuzzy-duplicate **không bao giờ tự xoá** qua CLI, chỉ qua Admin
  Dashboard với xác nhận thủ công từng dòng.
- Mọi thay đổi vào `public/*.txt` chỉ được ghi bởi
  `scripts/pull-dicts-from-kv.ts` (chạy qua git pre-commit hook) — **không
  sửa tay trực tiếp file `.txt` nữa** kể từ khi tính năng này được triển
  khai, tránh 2 nguồn dữ liệu lệch nhau (KV vs file local).
- Git pre-commit hook **tuyệt đối không được chặn commit** khi gặp lỗi
  mạng/auth — chỉ cảnh báo rồi cho qua, để không biến việc dọn dict thành
  điểm nghẽn cho công việc code hàng ngày.
- Bộ lọc `enabledErrorTypes` phải nằm ở **1 nơi duy nhất** (`appState`
  global) — không tạo thêm state lọc loại lỗi ở component khác, tránh lặp
  lại lỗi kiến trúc "2 nguồn sự thật" đã phát hiện trước đó trong dự án
  (bug `getErrorType` bị patch ngầm bởi `filter.ts`).
