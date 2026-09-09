# TASKLIST — Điều chỉnh Vietnamese Compound Detector

## Mục tiêu: Precision > Recall, loại bỏ false positive do sai phrase boundary / context

### Bối cảnh

Phase 0 → Phase 6 hiện đã được implement và toàn bộ test hiện tại pass.

Tuy nhiên, testing thực tế phát hiện các false positive nghiêm trọng:

```text
Huyền Như cũng đã nhận ra tâm trạng bất an ở Tín.
                              ^^^^^
                              bị đề xuất → ăn ở

trước khi ánh mặt trời soi rọi những...
          ^^^^^^^^^
          bị đề xuất → ánh mắt

từ những món ăn do ông thầy Tàu này tự tay làm ra.
              ^^^^^
              bị đề xuất → ăn dở
```

Các lỗi này cho thấy detector hiện tại vẫn quá phụ thuộc vào:

- phonetic similarity
- Levenshtein distance
- shared token
- candidate compound tồn tại trong Underthesea

Trong khi chưa đánh giá đầy đủ:

- phrase boundary
- grammatical structure
- validity của original phrase
- validity/frequency của candidate phrase
- context trước/sau phrase
- ambiguity giữa hai cách diễn giải

### Nguyên tắc bắt buộc

> **Precision > Recall**

Không được cố bắt thêm lỗi nếu điều đó làm tăng false positive.

Underthesea chỉ là:

> lexical resource / candidate source

Không được coi:

```text
phrase không có trong Underthesea = sai
```

và cũng không được coi:

```text
candidate có trong Underthesea + distance <= threshold = sai
```

---

# PHASE 0 — Audit implementation hiện tại

Trước khi sửa code:

1. Đọc toàn bộ:
   - `analysis.worker.ts`
   - `analyzer.ts`
   - `compound-detector.ts`
   - `context-confusion.ts`
   - dictionary/index/frequency utilities liên quan.

2. Trace chính xác pipeline của 3 false positive:

```text
bất an ở → ăn ở
ánh mặt → ánh mắt
ăn do → ăn dở
```

3. Với mỗi candidate phải log được:

```text
Original phrase
Candidate phrase
Token distance
Character distance
Shared tokens
Phonetic similarity
Original phrase validity
Candidate validity
Frequency
Context score
Boundary score
Final score
Reject/Accept reason
```

4. Không sửa bằng blacklist riêng:

```ts
if (phrase === "ăn do") return;
if (phrase === "ánh mặt") return;
```

Các trường hợp này phải được giải quyết bằng generic logic.

---

# PHASE 1 — Xác định rõ semantic model

Compound detector phải phân biệt 3 trường hợp:

### Case A — Compound typo thực sự

```text
nghiên trọng
→ nghiêm trọng
```

Đặc điểm:

- candidate là compound hợp lệ
- original không phải compound phổ biến
- chỉ một token thay đổi
- mutation có cơ sở phonetic/spelling
- candidate phổ biến hơn rõ rệt
- context phù hợp với candidate

→ có thể HIGH confidence.

---

### Case B — Hai từ riêng biệt tạo thành grammatical phrase

Ví dụ:

```text
ăn do ông...
bạn là người...
tôi là...
ở Tín
```

Không được coi chúng là typo compound chỉ vì một candidate compound gần đó tồn tại.

→ IGNORE.

---

### Case C — Original và candidate đều là phrase hợp lệ

Ví dụ:

```text
ánh mặt trời
→ ánh mắt
```

hoặc các trường hợp tương tự.

Nếu cả original và candidate đều có lexical/grammatical plausibility:

→ mặc định IGNORE.

Chỉ được flag nếu context evidence cực kỳ mạnh.

---

# PHASE 2 — Phrase Boundary Detection

Đây là phần quan trọng nhất.

Không được coi mọi N-token sliding window là một compound candidate thực sự.

Tạo một lớp/module riêng, ví dụ:

```text
src/utils/phrase-boundary.ts
```

hoặc tích hợp vào `compound-detector.ts` nếu architecture hiện tại phù hợp.

Module phải đánh giá:

```text
previous token
current phrase
next token
```

### 2.1 Detect grammatical boundaries

Xây dựng lightweight lexical categories:

```text
FUNCTION_WORDS
PRONOUNS
PREPOSITIONS
CONJUNCTIONS
AUXILIARY_WORDS
DETERMINERS
```

Ví dụ:

```text
là
ở
của
cho
với
do
để
đã
đang
sẽ
bị
được
một
những
các
trong
ngoài
trên
dưới
...
```

Không được hardcode từng câu.

---

### 2.2 Detect prepositional / grammatical patterns

Ví dụ:

```text
ở + [proper noun]
ở Tín

ăn + do + ...
ăn do ông...

bạn + là + ...
bạn là người...

tôi + là + ...
```

Nếu phrase boundary có khả năng cao nằm ở giữa hai token đang được detector coi là compound:

→ giảm mạnh confidence hoặc reject.

---

### 2.3 Boundary score

Tạo score riêng:

```text
boundaryScore
```

Ví dụ:

```text
GOOD_COMPOUND_BOUNDARY
    → positive

GRAMMATICAL_BOUNDARY
    → strong negative

FUNCTION_WORD_BOUNDARY
    → strong negative

PREPOSITIONAL_BOUNDARY
    → strong negative
```

Không nhất thiết phải dùng NLP/Transformer ở phase này.

---

# PHASE 3 — Original Phrase Validity

Hiện tại detector đang quá tập trung vào candidate.

Phải đánh giá cả **original phrase**.

Tạo concept:

```ts
isKnownCompound(originalPhrase);
```

và nếu có thể:

```ts
getPhraseFrequency(originalPhrase);
```

### Quy tắc

Nếu:

```text
originalPhrase ∈ compound dictionary
```

→ mặc định không sửa.

Ví dụ:

```text
bàn đầu
ánh mặt trời
mặt trời
```

Nếu là phrase hợp lệ → bảo vệ.

---

### Quan trọng

Nếu original không có trong Underthesea cũng **không đồng nghĩa với sai**.

Do đó:

```text
not in dictionary
```

chỉ là:

```text
weak negative evidence
```

không phải hard failure.

---

# PHASE 4 — Candidate Validity

Candidate phải là phrase hợp lệ từ lexical resource.

Ví dụ:

```text
ăn dở
ánh mắt
bàn là
nghiêm trọng
```

Nhưng candidate tồn tại không có nghĩa là candidate đúng trong context.

Cần tách:

```text
candidateLexicalValidity
```

khỏi:

```text
candidateContextValidity
```

---

# PHASE 5 — Frequency Asymmetry

Nếu có dữ liệu frequency hiện tại thì tận dụng.

Nếu chưa có phrase-frequency database thì thiết kế abstraction để có thể bổ sung sau.

Cần tính:

```text
originalFrequency
candidateFrequency
frequencyRatio
```

### Ví dụ

```text
nghiên trọng
frequency ≈ 0

nghiêm trọng
frequency = very high
```

→ strong evidence.

Trong khi:

```text
ánh mặt trời
frequency = high

ánh mắt
frequency = high
```

→ ambiguity cao.

Vì vậy không được chỉ tính:

```text
candidateFrequency
```

mà phải tính:

```text
candidateFrequency - originalFrequency
```

hoặc ratio/log-ratio tương ứng.

---

# PHASE 6 — Ambiguity Detection

Thêm:

```text
ambiguityScore
```

Nếu original và candidate đều hợp lệ/common:

```text
original valid = true
candidate valid = true
original frequency = high
candidate frequency = high
```

→ ambiguity cao.

Mặc định:

```text
IGNORE
```

trừ khi context score đủ mạnh.

### Không được làm:

```ts
if (candidateFrequency > originalFrequency) {
  flag();
}
```

vì điều này vẫn tạo false positive.

---

# PHASE 7 — Context Compatibility

Thêm context analysis nhẹ.

Detector phải nhìn:

```text
previous 2–4 tokens
phrase
next 2–4 tokens
```

Ví dụ:

```text
... món ăn do ông thầy ...
```

Phân tích:

```text
món ăn
do ông thầy
```

`do` đang đóng vai trò giới từ/liên kết nguyên nhân/chủ thể thực hiện.

Do đó:

```text
ăn do → ăn dở
```

phải bị reject.

---

### Ví dụ:

```text
... ánh mặt trời soi rọi ...
```

`mặt trời` là một lexical phrase hoàn chỉnh.

Candidate:

```text
ánh mắt
```

không phù hợp với context:

```text
ánh mắt soi rọi
```

→ candidateContextScore thấp.

---

# PHASE 8 — Function-word Awareness không được quá mạnh

Các rule hiện tại cho:

```text
bạn là
tôi là
của tôi
đã làm
...
```

là hướng đúng nhưng cần cẩn thận.

Không biến FUNCTION_WORDS thành blacklist tuyệt đối.

Ví dụ không được:

```ts
if (tokens.includes("là")) return;
```

Mà phải:

```text
function-word pattern
        ↓
negative evidence
        ↓
combined with context
        ↓
final confidence
```

Mục tiêu là scoring, không phải hardcoded blacklist.

---

# PHASE 9 — Compound Mutation Rules

Ưu tiên các mutation rõ ràng:

### 2-word

```text
A B
A' B

A B'
A B''
```

Ví dụ:

```text
nghiên trọng
nghiêm trọng
```

### 3-word

```text
A B C
A B' C
```

### 4-word

```text
A B C D
A B C D'
```

Chỉ một token thay đổi nên được ưu tiên.

Không cho phép candidate thay đổi quá nhiều token trừ khi có evidence rất mạnh.

---

# PHASE 10 — Phonetic Similarity

Giữ `isPhoneticallyConfusable()` hiện tại nếu correctness tốt.

Nhưng phonetic similarity chỉ là:

```text
evidence
```

không phải:

```text
decision
```

Ví dụ:

```text
mặt → mắt
```

có thể là mutation hợp lệ về mặt character/phonetic.

Nhưng:

```text
ánh mặt trời
```

vẫn phải được bảo vệ bởi context.

Do đó:

```text
phoneticScore
```

không được phép tự mình đưa candidate lên HIGH.

---

# PHASE 11 — Redesign Final Score

Thiết kế score theo nhiều tín hiệu:

```text
tokenSimilarity
sharedTokenBonus
mutationBonus
phoneticScore

originalValidity
candidateValidity

originalFrequency
candidateFrequency
frequencyAsymmetry

boundaryScore
contextScore

functionWordPenalty
ambiguityPenalty
```

Ví dụ conceptual:

```text
finalScore =
    lexicalScore
  + mutationScore
  + phoneticScore
  + frequencyScore
  + contextScore
  + boundaryScore
  - functionWordPenalty
  - ambiguityPenalty
```

Không nhất thiết phải giữ đúng công thức này.

Quan trọng là:

> Không một feature đơn lẻ nào được phép quyết định HIGH confidence.

---

# PHASE 12 — Confidence Policy mới

### HIGH

Chỉ HIGH khi có nhiều bằng chứng đồng thời:

```text
candidate valid
+
original uncommon/invalid
+
one-token mutation
+
strong spelling/phonetic relation
+
candidate significantly more likely
+
boundary valid
+
context compatible
+
low ambiguity
+
not grammatical pattern
```

### MEDIUM

Có một số evidence nhưng còn ambiguity:

```text
→ IGNORE
```

Có thể log trong debug.

### LOW

```text
→ IGNORE
```

Không tạo ErrorInstance.

---

# PHASE 13 — Hard-coded CONFUSABLE_RULES vẫn có priority cao nhất

Giữ nguyên các rule đã được curate:

```text
sát nhập → sáp nhập
chuẩn đoán → chẩn đoán
bổ xung → bổ sung
...
```

Priority:

```text
1. Explicit curated CONFUSABLE_RULES
2. HIGH-confidence compound correction
3. Word-level spelling correction
4. MEDIUM/LOW candidate → ignore
```

Không để compound detector phá vỡ các rule hiện có.

---

# PHASE 14 — Error Span

Nếu compound correction được accept:

```text
nghiên trọng
```

phải tạo một error span cho toàn phrase.

Không tạo:

```text
nghiên
trọng
```

riêng lẻ nếu compound detector đã xác định phrase-level error.

---

# PHASE 15 — Overlap Resolution

Pipeline:

```text
word errors
context errors
compound errors
```

sau đó mới resolve overlap.

Priority:

```text
curated context/compound
        ↓
high-confidence compound
        ↓
word-level
```

Nếu:

```text
nghiên trọng
```

được flag như compound:

→ suppress các UnknownWord/Spelling error bên trong phrase nếu chúng chỉ là hậu quả của cùng lỗi đó.

---

# PHASE 16 — Regression Test bắt buộc

Thêm test chính xác cho 3 false positive mới:

```ts
it("does not flag 'bất an ở Tín'", ...)
it("does not flag 'ánh mặt trời'", ...)
it("does not flag 'ăn do ông thầy'", ...)
```

Expected:

```text
0 compound errors
```

---

# PHASE 17 — Existing Positive Tests

Không được làm regression:

```text
"Tình trạng bệnh rất nghiên trọng."
→ nghiên trọng → nghiêm trọng

"an cư lạc nghiêp"
→ an cư lạc nghiệp
```

Và:

```text
"nghiêm trọng"
→ no error

"bàn đầu"
→ no error

"bạn là người..."
→ no error
```

---

# PHASE 18 — Adversarial Test Suite

Tạo riêng:

```text
compound-detector-adversarial.test.ts
```

Test tối thiểu:

```text
bạn là
tôi là
anh là
chị là
em là
nó là
đó là
đây là
họ là
ông là
bà là

của tôi
cho tôi
với anh
ở nhà
ở Tín

đã làm
đang làm
sẽ làm
được làm

ăn do ông...
món ăn do...
ánh mặt trời
mặt trời
ánh mắt
bàn đầu
bàn là
```

Mục tiêu:

```text
false positive = 0
```

hoặc càng gần 0 càng tốt.

---

# PHASE 19 — Positive/Negative Ambiguity Tests

Thêm test nhóm:

```text
original valid + candidate valid
```

Ví dụ:

```text
ánh mặt trời
ánh mắt

bàn đầu
bàn là

...
```

Nếu context không đủ mạnh:

```text
IGNORE
```

Không được tự động sửa.

---

# PHASE 20 — Benchmark Precision

Không chỉ benchmark tốc độ.

Tạo dataset gồm:

```text
VALID_SENTENCES
KNOWN_TYPOS
ADVERSARIAL_SENTENCES
```

Report:

```text
Total valid sentences
False positives

Total typo cases
True positives
False negatives

Precision
Recall
F1
```

Trong giai đoạn này:

> Precision là metric ưu tiên số 1.

Không được tối ưu Recall bằng cách hạ threshold nếu Precision giảm đáng kể.

---

# PHASE 21 — Performance

Giữ nguyên nguyên tắc:

```text
NO O(tokens × 68,000 compounds)
```

Index hiện tại phải tiếp tục được sử dụng.

Compound dictionary/index phải:

```text
load once
normalize once
build index once
cache once
```

Không load dictionary cho từng paragraph/chapter.

Không chạy Transformer/NLP model cho từng sliding window ở phase này.

---

# PHASE 22 — Debug Mode

Trong debug mode, với mỗi rejected candidate cần có reason:

Ví dụ:

```text
[Compound skipped]

Original: ăn do
Candidate: ăn dở

Reasons:
- grammatical boundary detected
- "do" is a function/preposition word
- context strongly supports original
- candidate context compatibility: low
- ambiguity: high

Decision: IGNORE
```

Với positive:

```text
[Compound accepted]

Original: nghiên trọng
Candidate: nghiêm trọng

Reasons:
- one-token mutation
- shared token: 1/2
- strong phonetic similarity
- original frequency: very low
- candidate frequency: high
- boundary: valid
- context: compatible
- ambiguity: low

Confidence: HIGH
```

---

# PHASE 23 — Không thêm Hugging Face ở phase này

Chưa được thêm Transformer/Hugging Face chỉ để chữa 3 false positive.

Trước tiên phải hoàn thiện:

```text
lexical validity
+
phrase boundary
+
frequency
+
context
+
ambiguity
+
confidence
```

Nếu sau benchmark vẫn còn nhiều ambiguity khó giải quyết:

```text
THEN investigate Vietnamese NLP / Hugging Face
```

ML/NLP nếu được thêm sau này chỉ nên hỗ trợ:

```text
Vietnamese segmentation
POS/context features
phrase boundary
semantic compatibility
```

Không dùng model như một spell-correction oracle tuyệt đối.

---

# PHASE 24 — Definition of Done

Phase này chỉ được coi là hoàn thành khi:

### Correctness

```text
nghiên trọng → nghiêm trọng       ✓

an cư lạc nghiêp → an cư lạc nghiệp ✓

bất an ở Tín                     ✓ no error
ánh mặt trời                     ✓ no error
ăn do ông thầy                   ✓ no error
bạn là                            ✓ no error
bàn đầu                           ✓ no error
nghiêm trọng                      ✓ no error
```

### Architecture

```text
✓ Underthesea không phải absolute correctness source
✓ Exact valid compound protection
✓ Phrase boundary detection
✓ Original phrase validity
✓ Candidate validity
✓ Frequency asymmetry
✓ Context compatibility
✓ Ambiguity detection
✓ Function-word awareness
✓ Confidence threshold
✓ No blacklist riêng cho từng phrase
✓ No brute-force 68k compounds/window
✓ Worker cache/index
✓ Compound errors dùng whole phrase span
✓ Overlap resolution
✓ Existing CONFUSABLE_RULES preserved
```

### Quality

```text
✓ adversarial tests pass
✓ regression tests pass
✓ precision benchmark documented
✓ performance benchmark không regression đáng kể
✓ svelte-check pass
✓ biome check/format pass
✓ knip pass
✓ vitest pass
✓ typecheck pass
```

---

# IMPORTANT — Không được làm theo các cách sau

Không được fix bằng:

```ts
if (phrase === "ăn do") return;
if (phrase === "ánh mặt") return;
if (phrase === "bất an ở") return;
```

Không được:

```text
phrase không tồn tại trong Underthesea
→ coi là typo
```

Không được:

```text
candidate tồn tại
+
Levenshtein <= 1
→ auto correction
```

Không được:

```text
candidate frequency > original frequency
→ auto correction
```

Không được hạ threshold chỉ để bắt thêm typo.

Không được thêm Hugging Face/Transformer trước khi chứng minh heuristic/index/context hiện tại không đủ.

---

# Final objective

Detector phải chuyển từ:

```text
"tìm một compound gần giống"
```

sang:

```text
"chứng minh rằng phrase hiện tại có khả năng là một compound typo"
```

Đây là sự khác biệt quan trọng.

Một candidate chỉ được flag khi:

```text
TYPO EVIDENCE
+
LEXICAL EVIDENCE
+
PHONETIC/SPELLING EVIDENCE
+
CONTEXT EVIDENCE
+
BOUNDARY EVIDENCE
```

đủ mạnh.

Nếu evidence không đủ:

```text
IGNORE
```

**False positive nghiêm trọng hơn false negative trong spell-checker này.**
