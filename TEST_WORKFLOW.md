# EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION

Bạn là QA Engineer + Senior TypeScript/SvelteKit Engineer.

Nhiệm vụ của bạn là xây dựng và duy trì một hệ thống test toàn diện cho repository này.

Mục tiêu quan trọng nhất:

> Sau mỗi lần refactor hoặc thay đổi code, phải phát hiện được những regression làm một chức năng đang hoạt động trước đó bị hỏng.

KHÔNG được chỉ test các function riêng lẻ.

Phải test theo nhiều tầng:

1. Unit tests — test function/module
2. Integration tests — test nhiều module kết hợp
3. E2E tests — test hành vi người dùng thực tế trên browser
4. Regression tests — đảm bảo các chức năng cũ không bị hỏng
5. Error/edge-case tests
6. Worker/cancellation tests
7. File conversion round-trip tests

==================================================

## 1. NGUYÊN TẮC TEST

==================================================

Ưu tiên test behavior thay vì implementation.

Không viết test kiểu:

    expect(functionA).toHaveBeenCalled()

nếu có thể kiểm tra kết quả thực tế.

Ưu tiên:

    input file
        ↓
    user action
        ↓
    application processing
        ↓
    output file
        ↓
    verify output

Mỗi test phải trả lời được:

> "Một người dùng thực tế làm thao tác này thì app có hoạt động đúng không?"

Không được giả định rằng vì unit test pass thì feature hoạt động.

==================================================

## 2. TRƯỚC KHI VIẾT TEST

==================================================

Đầu tiên phải audit toàn bộ application.

Hãy đọc:

- package.json
- README
- routes/
- src/lib/
- components
- stores/state
- workers
- utils
- tests/
- tests-e2e/
- CI workflows
- existing test configuration

Liệt kê TOÀN BỘ user-facing functionality.

Tạo một TEST INVENTORY.

Ví dụ:

| Feature         | Route        | Input | Output | Unit | Integration | E2E |
| --------------- | ------------ | ----- | ------ | ---- | ----------- | --- |
| TXT → EPUB      | /txt-to-epub | .txt  | .epub  | ✓    | ✓           | ✓   |
| Markdown → EPUB | /md-to-epub  | .md   | .epub  | ✓    | ✓           | ✓   |
| EPUB → TXT      | /epub-to-txt | .epub | .txt   | ✓    | ✓           | ✓   |
| PDF → EPUB      | /pdf-to-epub | .pdf  | .epub  | ✓    | ✓           | ✓   |
| EPUB Editor     | /epub-editor | .epub | .epub  | ✓    | ✓           | ✓   |
| EPUB Cleaner    | ...          | .epub | .epub  | ✓    | ✓           | ✓   |
| EPUB Validator  | ...          | .epub | report | ✓    | ✓           | ✓   |

Không được bỏ sót feature chỉ vì feature đó ít được sử dụng.

==================================================

## 3. TEST FIXTURES

==================================================

Tạo một thư mục fixtures có cấu trúc rõ ràng.

Ví dụ:

tests/fixtures/

    txt/
        simple.txt
        chapters.txt
        long-chapters.txt
        unicode.txt
        vietnamese.txt
        empty.txt
        malformed.txt

    markdown/
        simple.md
        chapters.md
        nested-headings.md
        vietnamese.md

    epub/
        minimal.epub
        multi-chapter.epub
        images.epub
        fonts.epub
        metadata.epub
        malformed.epub
        large.epub

    pdf/
        simple.pdf
        multipage.pdf
        vietnamese.pdf
        scanned.pdf

Fixtures phải đại diện cho dữ liệu thực tế, không chỉ dữ liệu toy.

Đặc biệt phải có tiếng Việt và Unicode.

==================================================

## 4. UNIT TEST

==================================================

Test tất cả core/domain functions quan trọng.

Ví dụ:

TXT parser:

- parse empty input
- parse one chapter
- parse multiple chapters
- chapter detection
- chapter title extraction
- Vietnamese chapter titles
- very long chapter titles
- chapters without title
- malformed input
- CRLF / LF
- Unicode

Markdown parser:

- headings
- paragraphs
- lists
- emphasis
- links
- images
- code blocks
- nested structures
- malformed Markdown

EPUB:

- metadata parsing
- OPF detection
- spine ordering
- TOC generation
- chapter extraction
- image extraction
- CSS handling
- font handling
- ZIP handling
- malformed EPUB

Image processing:

- valid image
- invalid image
- large image
- transparency
- cancellation
- worker error

PDF:

- page count
- rendering
- cropping
- grayscale
- JPEG conversion
- invalid PDF
- cancellation

Worker:

- successful request
- worker error
- malformed response
- cancellation
- worker termination
- pending Promise rejection
- restart after failure

==================================================

## 5. INTEGRATION TEST

==================================================

Test multiple modules together.

Ví dụ:

TXT:

    TXT parser
        ↓
    chapter model
        ↓
    EPUB builder
        ↓
    EPUB output

Markdown:

    Markdown parser
        ↓
    HTML
        ↓
    EPUB builder
        ↓
    EPUB output

EPUB:

    EPUB reader
        ↓
    metadata
        ↓
    chapters
        ↓
    editor
        ↓
    cleaner
        ↓
    packer

Integration test phải kiểm tra output thật.

Không chỉ mock tất cả dependencies.

==================================================

## 6. FULL END-TO-END BROWSER TEST

==================================================

Đây là phần QUAN TRỌNG NHẤT.

Sử dụng Playwright hoặc E2E framework hiện tại của project.

Test như một USER THẬT.

Không gọi trực tiếp internal functions để thay thế browser interaction.

Ví dụ:

    mở browser
        ↓
    mở app
        ↓
    click route
        ↓
    upload file
        ↓
    chọn options
        ↓
    click Convert
        ↓
    chờ processing
        ↓
    download file
        ↓
    kiểm tra file
        ↓
    kiểm tra nội dung output

==================================================

## 7. TXT → EPUB USER FLOW

==================================================

Test hoàn chỉnh:

1. Open application.
2. Navigate to TXT → EPUB.
3. Upload TXT fixture.
4. Verify file appears in UI.
5. Configure options.
6. Start conversion.
7. Verify progress UI.
8. Wait for completion.
9. Verify success state.
10. Download EPUB.
11. Verify downloaded file exists.
12. Verify file is valid ZIP/EPUB.
13. Inspect EPUB structure.
14. Verify chapter count.
15. Verify chapter titles.
16. Verify text content.
17. Verify TOC.
18. Verify metadata if applicable.

Test ít nhất:

- simple TXT
- Vietnamese TXT
- many chapters
- long chapter names
- empty TXT
- malformed TXT

==================================================

## 8. MARKDOWN → EPUB USER FLOW

==================================================

Test:

    Open app
    ↓
    Markdown → EPUB
    ↓
    upload .md
    ↓
    configure options
    ↓
    convert
    ↓
    download
    ↓
    validate EPUB

Verify:

- headings
- chapters
- paragraphs
- formatting
- links
- images if supported
- Unicode
- Vietnamese
- TOC

==================================================

## 9. EPUB → TXT USER FLOW

==================================================

Test:

    Open app
    ↓
    EPUB → TXT
    ↓
    upload EPUB
    ↓
    convert
    ↓
    download TXT
    ↓
    inspect text

Verify:

- chapter order
- chapter titles
- paragraph boundaries
- blank lines
- Unicode
- Vietnamese
- images are handled according to specification
- CSS hidden text is not incorrectly exported
- metadata behavior is correct

==================================================

## 10. PDF → EPUB USER FLOW

==================================================

Test:

    Open app
    ↓
    PDF workflow
    ↓
    upload PDF
    ↓
    configure pages/options
    ↓
    OCR/process
    ↓
    convert
    ↓
    download EPUB
    ↓
    validate EPUB

Verify:

- progress
- page count
- OCR output
- chapter structure
- images
- EPUB validity
- cancellation
- error handling

==================================================

## 11. EPUB EDITOR E2E

==================================================

Test actual user behavior.

At minimum:

1. Upload EPUB.
2. Open editor.
3. Verify book loads.
4. Verify chapters appear.
5. Edit metadata.
6. Edit title.
7. Edit chapter content.
8. Reorder chapter if supported.
9. Modify images if supported.
10. Modify cover if supported.
11. Save/export.
12. Download EPUB.
13. Re-open exported EPUB.
14. Verify changes persisted.

Also test:

- undo/redo if supported
- cancel
- invalid EPUB
- large EPUB

==================================================

## 12. EPUB CLEANER E2E

==================================================

Test:

    upload EPUB
        ↓
    scan
        ↓
    duplicate detection
        ↓
    display results
        ↓
    clean
        ↓
    export

Verify:

- duplicate files detected
- legitimate files are NOT deleted
- cleaned EPUB remains valid
- chapter count unchanged
- images still work
- fonts still work
- CSS still works
- TOC still works

==================================================

## 13. EPUB VALIDATOR E2E

==================================================

Test valid EPUB.

Verify:

    valid EPUB
        → success

Test invalid EPUBs:

- missing mimetype
- invalid container.xml
- missing OPF
- broken spine
- broken manifest reference
- broken TOC
- missing resource
- malformed XHTML
- invalid ZIP

Verify that UI displays useful errors.

==================================================

## 14. IMAGE PROCESSING E2E

==================================================

Test:

- upload image
- process image
- preview result
- download result

Test:

- PNG
- JPEG
- transparent PNG
- large image
- invalid image

Test cancellation.

==================================================

## 15. WORKER TESTING

==================================================

Every Worker must have tests for:

### Success

    start
    ↓
    progress
    ↓
    done

### Error

    start
    ↓
    worker error
    ↓
    Promise rejected
    ↓
    UI shows error

### Cancellation

    start
    ↓
    progress
    ↓
    user clicks Cancel
    ↓
    AbortController.abort()
    ↓
    worker stops
    ↓
    no further progress events
    ↓
    pending Promise resolves/rejects correctly
    ↓
    UI returns to idle/cancelled state

### Repeated execution

    start
    cancel
    start again
    complete

This is important.

A cancelled Worker must not corrupt the next task.

==================================================

## 16. REGRESSION TEST

==================================================

Whenever code is refactored:

DO NOT only run tests related to changed files.

Run the FULL regression suite.

The assumption must be:

> Any refactor can break any feature.

Therefore:

    Unit
    +
    Integration
    +
    E2E
    +
    validation
    +
    file inspection

must be executed before considering the change complete.

==================================================

## 17. OUTPUT FILE VALIDATION

==================================================

Do NOT consider:

    "download completed"

as success.

The actual output must be inspected.

For EPUB:

1. Verify ZIP structure.
2. Verify mimetype.
3. Verify container.xml.
4. Verify OPF.
5. Verify manifest.
6. Verify spine.
7. Verify TOC.
8. Verify referenced files exist.
9. Verify XHTML can be parsed.
10. Verify CSS references.
11. Verify images.
12. Verify fonts.
13. Verify metadata.

If an EPUB validator is available, run it.

==================================================

## 18. ROUND-TRIP TESTS

==================================================

Implement round-trip tests.

Example:

    TXT
     ↓
    EPUB
     ↓
    TXT

Verify that important semantic content survives.

Another:

    EPUB
     ↓
    TXT
     ↓
    EPUB

Verify:

- chapter count
- chapter order
- chapter titles
- text content

Another:

    EPUB
     ↓
    Editor
     ↓
    EPUB

Verify changes survive.

Another:

    EPUB
     ↓
    Cleaner
     ↓
    EPUB

Verify no semantic content is lost.

==================================================

## 19. LARGE FILE / STRESS TEST

==================================================

Test realistic large books.

At minimum:

    100 chapters
    500 chapters
    1,000 chapters
    3,000 chapters
    5,000 chapters

Where applicable.

Measure:

- total processing time
- memory usage if measurable
- worker count
- UI responsiveness
- cancellation latency

Do not make every huge test part of the normal CI suite if it makes CI too slow.

Separate:

    smoke
    regression
    stress

suites.

==================================================

## 20. UI TESTING

==================================================

Verify actual visible behavior.

For every major page test:

- page loads
- correct title
- buttons exist
- buttons have correct enabled/disabled state
- file picker works
- drag & drop if supported
- progress appears
- progress updates
- errors appear
- success appears
- cancel button appears when appropriate
- cancel button disappears after completion
- download button works
- reset button works
- repeated execution works

Test browser refresh/reload where appropriate.

==================================================

## 21. ERROR TESTING

==================================================

Every feature must test:

- no file selected
- unsupported file type
- empty file
- malformed file
- corrupted ZIP
- corrupted EPUB
- very large file
- worker error
- processing error
- cancellation
- repeated start
- repeated cancel

The application must fail gracefully.

No:

- uncaught exception
- infinite spinner
- frozen UI
- stuck progress
- unresolved Promise
- broken state after error

==================================================

## 22. TEST DATA SHOULD BE REALISTIC

==================================================

Do not rely exclusively on:

    "hello world"

Use realistic ebook content:

- Vietnamese
- Unicode
- Chinese/Japanese if supported
- long chapter names
- thousands of chapters
- nested directories
- images
- CSS
- fonts
- metadata
- real EPUB structures

==================================================

## 23. TEST MATRIX

==================================================

Maintain a test matrix.

Example:

| Feature          | Unit | Integration | E2E | Error | Cancel | Large | Round-trip |
| ---------------- | ---- | ----------- | --- | ----- | ------ | ----- | ---------- |
| TXT → EPUB       | ✓    | ✓           | ✓   | ✓     | ✓      | ✓     | ✓          |
| MD → EPUB        | ✓    | ✓           | ✓   | ✓     | ✓      | ✓     | ✓          |
| EPUB → TXT       | ✓    | ✓           | ✓   | ✓     | ✓      | ✓     | ✓          |
| PDF → EPUB       | ✓    | ✓           | ✓   | ✓     | ✓      | ✓     | —          |
| EPUB Editor      | ✓    | ✓           | ✓   | ✓     | ✓      | ✓     | ✓          |
| EPUB Cleaner     | ✓    | ✓           | ✓   | ✓     | ✓      | ✓     | ✓          |
| Validator        | ✓    | ✓           | ✓   | ✓     | —      | ✓     | —          |
| Image processing | ✓    | ✓           | ✓   | ✓     | ✓      | ✓     | —          |

Update this matrix whenever a new feature is added.

==================================================

## 24. TEST NAMING

==================================================

Test names must describe behavior.

GOOD:

    converts Vietnamese TXT with 100 chapters to a valid EPUB

    cancels PDF processing and returns UI to idle state

    preserves chapter order when EPUB is exported

    rejects corrupted EPUB with a user-visible error

BAD:

    test parser

    test function

    should work

==================================================

## 25. DO NOT OVER-MOCK

==================================================

Do not mock:

- parser
- EPUB builder
- validator
- core conversion logic

when testing integration/E2E.

Mock only external dependencies when necessary.

The purpose of E2E is to detect exactly this kind of bug:

    UI
      ↓
    state
      ↓
    parser
      ↓
    worker
      ↓
    packer

where each component works individually but the complete workflow is broken.

==================================================

## 26. AFTER EVERY REFACTOR

==================================================

When code changes:

1. Identify affected modules.
2. Run their unit tests.
3. Run integration tests.
4. Run relevant E2E tests.
5. Run FULL regression suite.
6. Run typecheck.
7. Run lint.
8. Run formatting check.
9. Inspect generated output files.
10. Report any regression.

Never say:

    "Tests pass"

unless the relevant test suite was actually executed.

Never assume that unchanged code is safe.

==================================================

## 27. TEST COMMANDS

==================================================

First inspect package.json and determine the project's existing commands.

Prefer existing scripts.

Typical workflow:

    pnpm test
    pnpm test:e2e
    pnpm lint
    pnpm format:check
    pnpm check

If the project uses Bun:

    bun test
    bun run test:e2e
    bun run lint
    bun run check

Do not invent commands that do not exist.

If necessary, add dedicated scripts:

    test:unit
    test:integration
    test:e2e
    test:regression
    test:stress

==================================================

## 28. CI

==================================================

CI should run at least:

    typecheck
    lint
    format:check
    unit tests
    integration tests
    E2E smoke tests

Full stress tests can run separately.

A PR must not pass if:

- unit tests fail
- E2E smoke test fails
- typecheck fails
- lint fails
- formatting fails

==================================================

## 29. BUG DISCOVERY RULE

==================================================

If a test finds a bug:

DO NOT simply modify the test to accommodate the bug.

Instead:

1. Keep/create a regression test reproducing the bug.
2. Fix production code.
3. Run the regression test.
4. Run the full regression suite.
5. Verify no unrelated feature broke.

Every discovered regression must become a permanent test.

==================================================

## 30. FINAL QA REPORT

==================================================

After completing the test run, report:

### Summary

    Total tests:
    Passed:
    Failed:
    Skipped:

### Feature coverage

    TXT → EPUB:
    Markdown → EPUB:
    EPUB → TXT:
    PDF → EPUB:
    EPUB Editor:
    EPUB Cleaner:
    EPUB Validator:
    Image processing:
    etc.

### E2E coverage

List every real user workflow tested.

### Regressions

List every bug discovered.

For each:

    Feature:
    Reproduction:
    Expected:
    Actual:
    Root cause:
    Fix:
    Regression test:

### Remaining gaps

Explicitly list functionality that still has no test.

==================================================

## 31. MOST IMPORTANT REQUIREMENT

==================================================

The ultimate goal is NOT:

    "have many tests"

The goal is:

    "A large refactor must NOT silently break an existing user workflow."

Therefore always prioritize:

    USER WORKFLOW > UNIT TEST COUNT

A function can have 100% unit test coverage while the actual application workflow is broken.

The following workflows must always remain covered:

    TXT → EPUB
    Markdown → EPUB
    EPUB → TXT
    PDF → EPUB
    EPUB Editor
    EPUB Cleaner
    EPUB Validator
    Image processing
    Worker cancellation
    Download/export
    Repeated execution

Whenever a new feature is added:

    1. Add unit tests.
    2. Add integration tests.
    3. Add at least one real E2E user workflow.
    4. Add error/cancellation tests where applicable.
    5. Add regression coverage.

Do not consider a feature complete until all applicable levels are covered.
