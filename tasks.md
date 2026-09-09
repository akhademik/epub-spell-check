# Task List v2: Cải thiện logic soát lỗi tiếng Việt — epub-spell-check

Cập nhật sau khi review nhánh `develop` (commit `5d8622f`). P0, P2, P3 và phần lớn P1 đã xong.
Chi tiết hoá phần còn lại (2.2 / 2.3) theo hướng: fetch từ điển tham chiếu → đối chiếu chéo → gắn flag trong Admin.

---

## ✅ Đã hoàn thành (verify bằng test + probe thực tế, 134/134 test pass)

- [x] 1.1 — Sửa hard filter loại nhầm ứng viên đúng (`analyzer.ts`)
- [x] 1.2 — Tách tier điểm rõ ràng, không chồng lấn (`analyzer.ts`)
- [x] 1.3 — Test hồi quy nhóm lỗi mất dấu toàn bộ (`hoc`, `truong`, `nguoi`... đã pass)
- [x] 2.1 — Xoá entry rác `nhửng` khỏi `vn-dict.txt`
- [x] 3.1 / 3.2 / 3.3 — `context-confusion.ts` + `ErrorType: ContextConfusion` + 24 cặp/cụm dễ nhầm đã curate
- [x] 4.1 / 4.2 — `vn-frequency.ts` + dùng tần suất tie-break trong sort

### ⚠️ Việc còn sót lại từ P0 (edge case nhỏ)

- [x] **1.4 — Fix case "đ bị gõ thành d" kèm nhiều dấu thanh cùng lúc**
  - Ví dụ: `duong` → `đường` vẫn chưa lọt top gợi ý (dù `truong`→`trường` đã đúng).
  - Nguyên nhân: `đ` không bị NFD strip nên `fullDistance` vẫn cao (=3), trong khi các từ base-distance=1 khác (khác phụ âm đầu, vd `buông`, `cuồng`) có `fullDistance` thấp hơn (=2) nên thắng điểm dù kém liên quan hơn.
  - Đề xuất: khi tính điểm cho nhóm `baseDistance <= 1`, coi cặp `đ<->d` là 1 phép thế "rẻ" hơn thay vì tính full cost như phép thế ký tự thường (tương tự cách đang ưu ái `VI_TONE_PAIRS`), hoặc dùng riêng `getBaseWord` biến thể thứ 2 có strip cả `đ`→`d` để tính baseDistance chính xác hơn cho case này.
  - Test cần thêm: `findTieredSuggestions("duong", ...)` phải chứa `"đường"` trong top 5 (primary hoặc secondary).

---

## 🟠 P1 (còn lại) — Đối chiếu chéo với từ điển tham chiếu + tích hợp Admin

### Từ điển tham chiếu đề xuất: `hunspell-vi` (1ec5/hunspell-vi)

- Nguồn: `https://github.com/1ec5/hunspell-vi` — kế thừa Free Vietnamese Dictionary Project (Hồ Ngọc Đức), license GPL.
- File cần lấy:
  - `https://raw.githubusercontent.com/1ec5/hunspell-vi/main/dictionaries/vi-DauCu.dic` (kiểu dấu cũ)
  - `https://raw.githubusercontent.com/1ec5/hunspell-vi/main/dictionaries/vi-DauMoi.dic` (kiểu dấu mới)
- Lý do chọn: chỉ chứa từ đơn âm (monosyllabic) — khớp đúng cách project đang tách token theo từng "tiếng"; có sẵn 2 bản dấu cũ/mới khớp với `TONE_STYLE_PAIRS` đang có.
- Lưu ý parse: format `.dic` của Hunspell — dòng đầu là số lượng từ, các dòng sau là `từ/flags`, cần cắt phần sau dấu `/`.

- [x] **2.2a — Viết script fetch từ điển tham chiếu**
  - File mới: `scripts/fetch-reference-dict.ts` (theo pattern có sẵn của `scripts/pull-dicts-from-kv.ts`).
  - Tải cả 2 file `vi-DauCu.dic` / `vi-DauMoi.dic`, strip affix flag, normalize NFC, merge 2 bản dấu thành 1 set.
  - Output: `src/data/reference-vn.json` và `src/data/reference-vn.txt` để giữ tách biệt nguồn dữ liệu chính khỏi nguồn đối chiếu.

- [x] **2.2b — Viết logic đối chiếu chéo (cross-reference audit)**
  - File mới hoặc thêm vào `dict-quality.ts`: với mỗi từ trong `vn-dict.txt`, check có mặt trong `reference-vn.txt` không (case-insensitive, hỗ trợ cả 2 kiểu dấu qua `getAlternateToneStyle` đã có sẵn).
  - Không tìm thấy → gắn **Tier C mới**: "Không có trong từ điển tham chiếu" — đây là tín hiệu để **review thủ công, không tự động xoá** (khác Tier A/B hiện tại vốn để auto-clean), vì có thể là từ hiếm/địa phương thật mà reference thiếu.
  - Với mỗi từ Tier C, tính thêm: có ứng viên nào trong `reference-vn.txt` cách nó ≤2 edit distance không (dùng lại `levenshteinDistance` có sẵn) → nếu có, đây chính là gợi ý "từ đúng nên thay vào".

- [x] **2.2c — Cơ chế lưu quyết định review (persist, tránh flag lặp lại)**
  - Tái dùng pattern `ignoredPairs` / `createPairKey` đang có cho fuzzy-duplicate cluster.
  - Khi admin bấm "Giữ" cho 1 từ Tier C → lưu vào danh sách đã review (KV/state), lần audit sau không flag lại.

- [x] **2.3 — Tích hợp vào Admin Dashboard**
  - Thêm Khối 4 "Đối chiếu từ điển tham chiếu (Tier C)" trong tab Dict Audit Panel.
  - Mỗi dòng flagged word hiển thị 3 hành động:
    1. **Giữ** — đánh dấu đã review, bỏ qua lần sau.
    2. **Xoá** — xoá khỏi `vn-dict.txt` (dùng lại flow xoá đã có).
    3. **Thay bằng gợi ý đúng** — 1-click swap sang từ đúng lấy từ kết quả 2.2b (ví dụ tự tìm ra `nhửng` gần `những` và đề xuất thay thế thay vì phải xoá rồi gõ tay lại).
  - Hiển thị kèm gợi ý từ đúng và khoảng cách Levenshtein để admin ra quyết định chính xác hơn.

---

## 🟡 P2 (mở rộng) — Nguồn từ ghép cho việc mở rộng confusable-pairs

Lưu ý quan trọng: `hunspell-vi` (mục 2.2a ở trên) **chỉ có từ đơn âm, không giải quyết được phần này**. Cần nguồn riêng.

### Nguồn đề xuất: `undertheseanlp/dictionary`

- Repo: `https://github.com/undertheseanlp/dictionary`, file: `dictionary/words.txt`
- Tổng hợp Hồ Ngọc Đức dictionary (~29k mục) + Wiktionary tiếng Việt + tudientv, có chứa cả từ ghép 2-3 âm tiết (khác hunspell-vi vốn chỉ đơn âm).
- ⚠️ Cần kiểm tra license cụ thể của repo này (khác license của toolkit `underthesea`) trước khi tích hợp vào pipeline chính thức.

- [x] **3.4 — Fetch `words.txt` làm nguồn "existence check" cho cụm từ**
  - Tải và xử lý lưu vào `public/underthesea-words.txt` phục vụ tra cứu từ ghép thực tế và gợi ý ngữ cảnh.

- [x] **3.5 — Viết script sinh confusable-pairs bán tự động** (`scripts/generate-confusable-pairs.ts`)
  - Với mỗi entry compound trong `words.txt`, sinh biến thể theo quy tắc nhầm lẫn phổ biến: hoán đổi l/n, s/x, tr/ch, d/gi/r ở đầu âm tiết; hoán đổi dấu hỏi/ngã.
  - Nếu biến thể cũng tồn tại độc lập trong `words.txt` → ứng viên cặp confusable mới, xuất ra file/report để duyệt tay.
  - Không auto-merge thẳng vào `CONFUSABLE_RULES` — cần review thủ công từng cặp trước khi thêm (tránh false positive khi 2 từ tồn tại nhưng không ai thực sự nhầm).

- [x] **3.6 — Duyệt & merge kết quả 3.5 vào `context-confusion.ts`**
  - Mở rộng `CONFUSABLE_RULES` từ 24 cặp hiện tại lên một danh sách lớn hơn, có kiểm soát chất lượng qua bước duyệt tay.

---

## 🟢 Việc mở rộng sau (không gấp)

- [x] **5.1 — Dùng `reference-vn.txt` làm nguồn ứng viên thứ 5 trong `findTieredSuggestions`**
  - Sau khi vòng audit/flag ở Admin đã ổn định, có thể tận dụng thêm để tăng recall gợi ý (không chỉ dùng để audit dictionary mà còn giúp bắt được nhiều từ đúng hơn mà `vn-dict.txt` hiện tại (8.8k từ) còn thiếu).

---

## Gợi ý thứ tự thực hiện

1. **1.4** trước (fix nhỏ, còn sót lại từ đợt trước).
2. **2.2a → 2.2b → 2.2c → 2.3** theo đúng thứ tự (fetch trước, audit logic sau, rồi mới lên UI) để có thể test logic đối chiếu bằng script/CLI trước khi build UI.
3. **5.1** làm sau cùng, không chặn các mục còn lại.
