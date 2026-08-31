# Spec triển khai: Tối ưu tìm kiếm gợi ý + Chức năng sửa từ lỗi & xuất lại EPUB

> Tài liệu này viết cho một AI coding agent (Claude Code hoặc tương đương) thực thi trực tiếp trên repo `epub-spell-check`. Mỗi mục có: file đích, thay đổi cụ thể, và tiêu chí chấp nhận (acceptance criteria). Thực hiện theo đúng thứ tự Phase 1 → 2 → 3 vì Phase 2 và 3 phụ thuộc dữ liệu do Phase 1 tạo ra.

---

## Bối cảnh bắt buộc đọc trước khi sửa

- `src/utils/epub-parser.ts`: parse EPUB bằng JSZip, hiện chỉ trích `textContent` thuần từ mỗi phần tử `p, h1-h6, li, div` rồi bỏ luôn tham chiếu tới file gốc trong zip và tới DOM node. Kết quả trả về type `TextContentBlock = { text: string }` — **không có `path`, không có DOM reference**.
- `src/workers/analysis.worker.ts`: chạy `getErrorType` trên từng `textBlocks[i].text`, sinh `ErrorInstance.context` chỉ có `paragraphIndex`, `chapterIndex`, `startIndex`, `endIndex` (offset tính trên `text.normalize("NFC")`) — không có `filePath` hay `blockId` để trace ngược về đúng file/đúng node trong zip.
- `src/utils/analyzer.ts`: `findSuggestions()` duyệt tuyến tính (`for...of dictionary`) qua từng Set trong 4 từ điển (~26k từ tổng), tính `getBaseWord()` (bỏ dấu, NFD strip) cho **mỗi ứng viên trong mỗi lần gọi**, không cache.
- `src/state.svelte.ts` (`AppStateModel`): quản lý toàn bộ state bằng Svelte 5 runes (`$state`), không có khái niệm "pending fix" hay "applied fix" nào cả — hiện tại app là read-only/report-only.
- `src/components/ContextView.svelte`: dòng ~255-262, render danh sách gợi ý, `onclick={() => appState.copyText(sugg)}` — click gợi ý hiện tại chỉ **copy vào clipboard**, không thay thế gì trong nội dung.

---

## Phase 1 — Tối ưu logic tìm kiếm gợi ý (`analyzer.ts`)

### 1.1. Tiền xử lý từ điển một lần (loại bỏ tính toán lặp lại)

File đích: `src/utils/dictionary.ts`, `src/types/dictionary.ts`, `src/utils/analyzer.ts`.

Vấn đề: mỗi lần `findSuggestions()` chạy, với mỗi ứng viên trong dictionary, `getBaseWord(dictWord)` bị tính lại từ đầu (NFD normalize + regex strip dấu) dù nội dung từ điển không đổi trong suốt phiên làm việc.

Thay đổi:

- Đổi cấu trúc `Dictionaries` từ `Set<string>` thuần sang một cấu trúc chỉ-mục sẵn, ví dụ:
  ```ts
  interface IndexedDictionary {
    words: string[]; // danh sách gốc
    byLength: Map<number, string[]>; // bucket theo độ dài để lọc nhanh
    baseWordCache: Map<string, string>; // dictWord -> baseWord (không dấu)
  }
  ```
- Trong `loadDictionaries()` (dictionary.ts), sau khi build xong mỗi `Set`, build luôn `byLength` map và `baseWordCache` map — chỉ tính 1 lần khi app khởi động, không tính lại trong worker mỗi lần phân tích.
- Giữ nguyên `Set<string>` gốc cho các chỗ cần `.has()` O(1) (đã dùng trong `analysis-core.ts`), chỉ bổ sung index mới cho phần suggestion, không phá vỡ API hiện có.

Acceptance: `getBaseWord()` không còn được gọi bên trong vòng lặp `for (const dictWord of dictionary)` của `getTopSuggestions()`; chỉ tra `baseWordCache.get(dictWord)`.

### 1.2. Lọc theo bucket độ dài thay vì quét toàn bộ Set

File đích: `src/utils/analyzer.ts`, hàm `findSuggestions` / `getTopSuggestions`.

Vấn đề: điều kiện `Math.abs(dictWord.length - low.length) <= LEVEN_MAX_DIST` hiện vẫn phải duyệt **toàn bộ** Set trước khi loại.

Thay đổi:

- Dùng `byLength` map: chỉ lấy các bucket có độ dài trong khoảng `[low.length - LEVEN_MAX_DIST, low.length + LEVEN_MAX_DIST]`, gộp lại thành danh sách ứng viên trước khi chạy Levenshtein. Với từ điển VN ~9k từ, việc này giảm số lần tính Levenshtein đáng kể vì đa số từ trong dict lệch độ dài xa so với từ lỗi.

Acceptance: số lần gọi `levenshteinDistance()` giảm rõ rệt so với bản hiện tại (có thể log/test đếm số lần gọi trong `tests/unit` để xác nhận), kết quả gợi ý trả về **giống hệt** bản cũ (đây là tối ưu hiệu năng, không đổi hành vi).

### 1.3. Giới hạn số ứng viên trước khi sort

File đích: `src/utils/analyzer.ts`.

Vấn đề: `candidates.sort(...)` chạy trên toàn bộ mảng candidates dù cuối cùng chỉ lấy `limit` phần tử đầu (`MAX_SUGGESTION_COUNT`, xem `src/constants.ts`).

Thay đổi: thay `sort` toàn bộ rồi `slice` bằng một cấu trúc top-k (ví dụ giữ một mảng đã sort kích thước tối đa `limit`, chèn có điều kiện — insertion vào mảng nhỏ) khi số candidates lớn hơn ngưỡng (ví dụ > 200). Nếu candidates nhỏ, giữ nguyên `sort` + `slice` như cũ (không cần tối ưu sớm — premature optimization).

Acceptance: hành vi/output không đổi, chỉ giảm độ phức tạp khi tập candidates lớn.

### 1.4. Cache kết quả suggestion theo từ (memoization trong phiên)

File đích: `src/utils/analyzer.ts`, và nơi gọi nó (`src/components/ContextView.svelte` dòng ~105-107).

Vấn đề: `ContextView.svelte` gọi `findSuggestions(group.word, appState.dictionaries)` trong `$derived.by`, nghĩa là **mỗi lần** người dùng chuyển qua lại giữa các error group đã xem trước đó, suggestion bị tính lại từ đầu dù input giống hệt.

Thay đổi: thêm `Map<string, string[]>` cache ở cấp module trong `analyzer.ts` (key = `word.toLowerCase()`), reset cache khi `dictionaries` thay đổi (ví dụ khi load sách mới — có thể expose `clearSuggestionCache()` gọi từ `resetApp()` trong `state.svelte.ts`).

Acceptance: gọi `findSuggestions` 2 lần với cùng input trả về cùng reference/array mà không chạy lại vòng lặp Levenshtein lần 2 (có thể verify bằng spy trong test).

---

## Phase 2 — Điều chỉnh logic phát hiện lỗi hiện có (không đổi hành vi chính, chỉ vá lỗi/rủi ro)

File đích: `src/utils/analysis-core.ts`.

1. **Sửa đánh số comment trùng**: dòng 98 (`// 5. Vietnamese Dictionary...`) và dòng 122 (`// 5. Vietnamese Typo & Spelling Rules...`) đang cùng đánh số 5. Đổi block thứ hai (dòng 122) thành `// 6. Vietnamese Typo & Spelling Rules & Vocabulary` và dịch số của block "Foreign letters check" (hiện là `// 6.`, dòng 111) thành đúng thứ tự thực thi (nó chạy **trước** block Typo/Spelling). Chỉ sửa comment, không đổi logic runtime.
2. **Không đổi rule ngữ âm `ng/ngh/g/gh/c/k`** trong phase này — đây là rule-based heuristic đã hoạt động, việc mở rộng cần bộ ngữ liệu kiểm thử tiếng Việt riêng, để ở backlog, không nằm trong scope sửa-và-xuất-EPUB.
3. Thêm unit test mới trong `tests/unit/` cho `getAlternateToneStyle` và rule ngữ âm nếu chưa có coverage đầy đủ (kiểm tra `tests/unit` hiện có trước khi thêm để tránh trùng).

Acceptance: `pnpm test` pass, không có thay đổi hành vi được test hiện tại phát hiện.

---

## Phase 3 — Chức năng sửa từ lỗi & xuất lại EPUB

### Nguyên tắc bắt buộc (ràng buộc phạm vi sửa)

**Chỉ được phép ghi đè đúng vùng ký tự của từ đã được `getErrorType()` gắn nhãn lỗi** (tức đúng `startIndex`–`endIndex` đã ghi trong `ErrorInstance.context`, khớp với đúng `blockId`/`filePath` — xem 3.1). Tuyệt đối không cho phép:

- Sửa tự do toàn bộ nội dung đoạn văn (không thêm textarea free-edit cho cả paragraph).
- Sửa các từ **không nằm trong danh sách lỗi đã phát hiện** (`allDetectedErrors` / `currentFilteredErrors`).
- Ghi đè file XHTML nào ngoài đúng file chứa lỗi đó.

Mọi hàm ghi (write) phải nhận vào đúng 1 cặp `(instanceId, newWord)` hoặc `(groupId, newWord)`, tuyệt đối không nhận raw HTML/text tự do từ UI.

### 3.1. Mở rộng dữ liệu để có thể trace ngược lỗi → đúng vị trí trong file zip

File đích: `src/types/epub.ts`, `src/utils/epub-parser.ts`.

- Đổi `TextContentBlock`:
  ```ts
  export interface TextContentBlock {
    id: string; // duy nhất, ví dụ `${filePath}#${nodeIndex}`
    filePath: string; // đường dẫn đầy đủ trong zip, ví dụ resolvePath(href) đã có sẵn biến `fullPath` trong epub-parser.ts
    text: string;
  }
  ```
- Trong `parseEpub()` (epub-parser.ts, đoạn duyệt `doc.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, div")`), khi tạo từng block, gán thêm `id` và `filePath = fullPath` (biến này đã tồn tại sẵn trong scope, chỉ cần truyền xuống, không cần logic mới để lấy path).
- **Quan trọng**: giữ nguyên thứ tự phần tử DOM (`querySelectorAll` trả về theo document order) để `id` sinh ra ổn định giữa lần parse và lần ghi lại sau này — dùng `index` tăng dần theo file, không dùng `Math.random()`.

Acceptance: `epubContent.textBlocks[i]` có đủ `{id, filePath, text}`; test hiện có (`tests/smoke.test.ts`, `tests/regression.test.ts`) không bị vỡ (rà soát xem có test nào assert shape `{text}` thuần không, nếu có thì cập nhật test).

### 3.2. Truyền `filePath`/`blockId` qua Worker vào `ErrorInstance`

File đích: `src/types/errors.ts`, `src/workers/analysis.worker.ts`.

- `ErrorInstance.context` thêm 2 field: `filePath: string`, `blockId: string`.
- Trong `analysis.worker.ts`, khi build từng `allErrors.push({...})`, lấy `paragraph.filePath` và `paragraph.id` (từ `TextContentBlock` đã mở rộng ở 3.1) gán vào context.

Acceptance: mỗi `ErrorInstance` sau khi phân tích có đủ thông tin để xác định chính xác 1 file trong zip + 1 block trong file đó + 1 offset ký tự trong block, không cần đoán.

### 3.3. Module ghi sửa lỗi vào EPUB — `src/utils/epub-writer.ts` (file mới)

Trách nhiệm: nhận danh sách các fix đã được người dùng xác nhận, áp dụng đúng vùng ký tự bị lỗi vào đúng node DOM trong đúng file XHTML, rồi trả về `Blob` EPUB mới.

Thiết kế bắt buộc:

- **Không dùng string-replace trực tiếp trên toàn bộ HTML** (rủi ro lệch offset do có thẻ con, entity HTML, khoảng trắng khác giữa `textContent` đã trim và HTML gốc — như đã nêu ở đánh giá trước).
- Dùng `DOMParser` để parse lại đúng file XHTML cần sửa, dùng `TreeWalker` (filter `NodeFilter.SHOW_TEXT`) để duyệt text node theo đúng thứ tự đã dùng khi parse ban đầu (`p, h1-h6, li, div` — cùng selector với `epub-parser.ts` để đảm bảo cùng thứ tự block), tìm đúng node ứng với `blockId`, rồi thay thế đúng substring theo `startIndex`/`endIndex` trong `node.textContent` (không phải trong toàn bộ `outerHTML`).
- Nếu 1 block có nhiều text node con (do có thẻ `<em>`, `<b>`... xen giữa), cần cộng dồn offset qua các text node con thuộc cùng block để định vị đúng node và offset cục bộ chứa ký tự lỗi — viết hàm phụ `locateOffsetInBlock(blockElement, globalOffset)` trả về `{textNode, localOffset}`.
- Sau khi sửa xong tất cả fix thuộc 1 file, serialize lại bằng `XMLSerializer` (giữ namespace/doctype EPUB, **không dùng `innerHTML` string thô** để tránh escape sai entity).
- Ghi đè vào zip: `zip.file(filePath, newSerializedContent)`.
- Khi export cuối cùng: `zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" })` — kiểm tra rằng file `mimetype` ở gốc zip **không bị nén** (EPUB spec yêu cầu STORED, không DEFLATE) trước khi generate lại; nếu JSZip instance được load từ file gốc (`JSZip.loadAsync(file)` — đã có trong `epub-parser.ts`), giữ nguyên compression setting hiện tại của entry `mimetype`, không set lại toàn zip theo 1 compression chung.

API đề xuất:

```ts
export interface FixInstruction {
  filePath: string;
  blockId: string;
  startIndex: number;
  endIndex: number;
  newWord: string;
}

export async function applyFixesAndRepack(
  originalFile: File,
  fixes: FixInstruction[],
): Promise<Blob>;
```

Acceptance: viết test trong `tests/unit/` dùng 1 EPUB mẫu nhỏ (tạo fixture trong `tests/unit/fixtures` nếu thư mục này chưa có — kiểm tra cấu trúc `tests/unit` hiện tại trước), assert rằng sau khi `applyFixesAndRepack`, giải nén lại blob mới ra và đúng vị trí ký tự đã đổi thành `newWord`, các phần còn lại của file XHTML **không đổi byte nào**.

### 3.4. State: quản lý fix theo từng instance/group, không cho sửa tự do

File đích: `src/state.svelte.ts`.

Thêm vào `AppStateModel`:

```ts
// Map<instanceId, newWord> — chỉ chứa các fix đã áp dụng, key sinh từ context (filePath+blockId+startIndex)
appliedFixes = $state<Map<string, string>>(new Map());
```

Thêm 2 method, **đây là 2 điểm vào duy nhất được phép ghi sửa**:

```ts
// Sửa 1 lần xuất hiện cụ thể của lỗi (1 instance trong 1 group)
applyFixToInstance(instance: ErrorInstance, newWord: string): void

// Sửa toàn bộ các lần xuất hiện của 1 group lỗi (tất cả contexts cùng word+type)
applyFixToAllInstances(group: ErrorGroup, newWord: string): void
```

Ràng buộc bên trong 2 hàm này:

- `newWord` chỉ được set từ danh sách gợi ý (`findSuggestions`) hoặc từ input do người dùng gõ **để thay thế đúng 1 từ lỗi** — không nhận block text tự do.
- Instance/group truyền vào **phải** đang tồn tại trong `this.currentFilteredErrors` tại thời điểm gọi (validate, throw/log nếu không tìm thấy — tránh sửa nhầm lỗi đã bị whitelist hoặc đã sửa trước đó).
- Sau khi set vào `appliedFixes`, cập nhật lại `allDetectedErrors`/`currentFilteredErrors` để group/instance đó được đánh dấu "đã sửa" (thêm field `resolved: boolean` vào `ErrorInstance`/`ErrorGroup`, không xóa khỏi danh sách ngay để người dùng còn xem lại được, ẩn khỏi danh sách "còn lỗi" qua `getFilteredErrors` — thêm điều kiện lọc `resolved !== true`).
- Thêm `undoFix(instanceId)` để bỏ 1 fix đã áp dụng nhầm.

Thêm method xuất EPUB:

```ts
async exportFixedEpub(): Promise<void>
```

- Build danh sách `FixInstruction[]` từ `appliedFixes` (map ngược qua `context` của từng instance đã sửa).
- Gọi `applyFixesAndRepack(this.originalFile, fixes)` (cần lưu `originalFile: File` gốc vào state khi `handleFile()` chạy — hiện `handleFile` không giữ lại reference `file` gốc, cần bổ sung `this.originalFile = file` ở đầu `handleFile()`).
- Tải blob kết quả xuống bằng cùng pattern `a.download` đã dùng trong `exportWhitelist()`/`exportErrors()`, đặt tên `<sanitizeFilename(currentBookTitle)>-da-sua.epub`.

Acceptance: gọi `applyFixToInstance` với 1 instance không có trong danh sách lỗi hiện tại phải bị từ chối (no-op + log cảnh báo), không được silently sửa bậy.

### 3.5. UI: click gợi ý để sửa — 2 hành động rõ ràng, không được gộp mơ hồ

File đích: `src/components/ContextView.svelte` (khu vực render suggestions, dòng ~255-262).

Thay đổi hành vi click:

- Đổi `onclick={() => appState.copyText(sugg)}` (copy) thành mở 1 lựa chọn hành động, không giữ default là copy nữa vì mục tiêu chính giờ là sửa — nhưng **giữ lại copy như 1 lựa chọn phụ** (không phá tính năng cũ), ví dụ mỗi item gợi ý hiển thị:
  - Nút chính "Thay từ này" → gọi `appState.applyFixToInstance(currentInstance, sugg)` — chỉ sửa **đúng 1 lần xuất hiện** đang xem (dùng `appState.currentGroup.contexts[appState.currentInstanceIndex]`).
  - Nút phụ "Thay tất cả (N lần)" (N = `group.contexts.length`) → gọi `appState.applyFixToAllInstances(group, sugg)`, chỉ hiện nút này khi `N > 1`.
  - Icon nhỏ "copy" riêng biệt để giữ hành vi copy-to-clipboard cũ, không gộp chung với action sửa.
- Sau khi sửa, hiển thị trạng thái "Đã sửa" cho group/instance đó (dựa vào field `resolved` ở 3.4), có nút "Hoàn tác" gọi `undoFix`.
- Nếu người dùng muốn nhập từ thay thế **không nằm trong danh sách gợi ý**, cho phép 1 ô input riêng cạnh danh sách suggestion, nhưng input này **chỉ được submit vào đúng 2 hàm `applyFixToInstance`/`applyFixToAllInstances`** — không có route nào khác để ghi text tự do vào nội dung sách.

File đích thứ 2: `src/components/ErrorList.svelte` — thêm chỉ báo (badge/checkmark) cho các group đã có fix áp dụng (dựa `resolved`), để người dùng thấy tổng quan đã sửa bao nhiêu / còn lại bao nhiêu.

File đích thứ 3: `src/components/Header.svelte` hoặc `ResultsView.svelte` — thêm nút "Xuất EPUB đã sửa" gọi `appState.exportFixedEpub()`, chỉ enable khi `appliedFixes.size > 0`.

Acceptance: trên UI, không có bất kỳ ô nhập liệu nào cho phép sửa nội dung paragraph ngoài phạm vi từ lỗi đang chọn; thao tác "Thay tất cả" phải hiện rõ số lượng lần sẽ bị thay trước khi người dùng bấm (tránh sửa nhầm hàng loạt).

### 3.6. Trường hợp biên cần xử lý

- Một từ lỗi xuất hiện nhiều lần **trong cùng 1 paragraph/block**: khi "Thay tất cả", phải duyệt và thay theo đúng từng `startIndex` ghi nhận trong từng `ErrorInstance` riêng biệt (không dùng `String.replaceAll` theo từ, vì có thể thay nhầm một từ trùng chữ nhưng khác ngữ cảnh/đã có offset khác) — áp dụng lần lượt từ **cuối văn bản về đầu** trong cùng 1 block để offset các fix chưa áp dụng không bị lệch sau khi 1 fix trước đó làm thay đổi độ dài chuỗi (nếu `newWord` khác độ dài `originalWord`).
- Hai lỗi cùng nhóm nhưng khác `filePath`: `applyFixToAllInstances` phải gom fix theo `filePath` trước khi gọi `applyFixesAndRepack`, đảm bảo mỗi file zip chỉ bị parse/serialize lại đúng 1 lần dù có nhiều fix trong cùng file.
- Người dùng sửa 1 từ rồi sau đó thêm chính từ gốc đó vào whitelist (hoặc ngược lại): 3.4 cần đảm bảo 2 cơ chế (`whitelist` và `appliedFixes`) không xung đột khi lọc — `getFilteredErrors` (filter.ts) hiện lọc theo `whitelist`/`checkSettings`, cần bổ sung thêm điều kiện lọc theo `resolved` mà không đổi logic whitelist hiện có.

---

## Thứ tự thực thi đề xuất cho AI agent

1. Phase 1 (1.1 → 1.4) — không phụ thuộc gì, an toàn, có thể làm và test độc lập trước.
2. Phase 2 — nhỏ, làm song song hoặc trước Phase 3.
3. Phase 3.1 → 3.2 (đổi data model, chạy `pnpm test`/`pnpm check` để đảm bảo không vỡ type ở nơi khác dùng `TextContentBlock`/`ErrorInstance`).
4. Phase 3.3 (epub-writer.ts) — viết kèm test ngay, đây là phần rủi ro cao nhất (dễ làm hỏng file EPUB nếu sai offset/serialize).
5. Phase 3.4 → 3.5 — nối state vào UI.
6. Phase 3.6 — chạy qua các test case biên bằng tay với 1 EPUB thật có lỗi lặp nhiều lần trong cùng đoạn.

Sau mỗi phase: chạy `pnpm check`, `pnpm lint`, `pnpm test` (đã định nghĩa sẵn trong `package.json`) trước khi sang phase kế tiếp.
