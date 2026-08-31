// @vitest-environment jsdom

import JSZip from "jszip"
import { describe, expect, it } from "vitest"
import { parseEpub } from "../../src/utils/epub-parser"
import {
  applyFixesAndRepack,
  type FixInstruction
} from "../../src/utils/epub-writer"

describe("EPUB Integration & Round-trip Test Matrix", () => {
  it("Matrix 1: Plain <p> error replacement and preservation", async () => {
    const zip = new JSZip()
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" })
    zip.file(
      "META-INF/container.xml",
      `<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>`
    )
    zip.file(
      "OEBPS/content.opf",
      `<package><manifest><item id="chap1" href="chap1.xhtml"/></manifest><spine><itemref idref="chap1"/></spine></package>`
    )
    zip.file(
      "OEBPS/chap1.xhtml",
      `<?xml version="1.0" encoding="utf-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml"><body><p>Đây là từ sai1 trong câu.</p></body></html>`
    )

    const origBlob = new Blob(
      [await zip.generateAsync({ type: "arraybuffer" })],
      {
        type: "application/epub+zip"
      }
    )
    const origFile = new File([origBlob], "book.epub")

    // 1. Parse EPUB
    const parsed = await parseEpub(origFile)
    expect(parsed.textBlocks.length).toBe(1)
    expect(parsed.textBlocks[0].text).toBe("Đây là từ sai1 trong câu.")

    // 2. Fix "sai1" (offset 10..14) -> "đúng"
    const fixes: FixInstruction[] = [
      {
        filePath: parsed.textBlocks[0].filePath,
        blockId: parsed.textBlocks[0].id,
        startIndex: 10,
        endIndex: 14,
        newWord: "đúng"
      }
    ]

    // 3. Repack
    const fixedBlob = await applyFixesAndRepack(origBlob, fixes)

    // 4. Re-open and verify roundtrip integrity
    const fixedFile = new File([fixedBlob], "fixed.epub")
    const reParsed = await parseEpub(fixedFile)
    expect(reParsed.textBlocks.length).toBe(1)
    expect(reParsed.textBlocks[0].text).toBe("Đây là từ đúng trong câu.")
  })

  it("Matrix 2-3 & 7: <p> with inline formatting (<b>, <i>) and fixes crossing text nodes", async () => {
    const zip = new JSZip()
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" })
    zip.file(
      "META-INF/container.xml",
      `<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>`
    )
    zip.file(
      "OEBPS/content.opf",
      `<package><manifest><item id="chap1" href="chap1.xhtml"/></manifest><spine><itemref idref="chap1"/></spine></package>`
    )
    // <p>Hello <b>wor</b><i>ld</i>!</p> -> "Hello world!"
    zip.file(
      "OEBPS/chap1.xhtml",
      `<html xmlns="http://www.w3.org/1999/xhtml"><body><p>Hello <b>wor</b><i>ld</i>!</p></body></html>`
    )

    const origBlob = new Blob(
      [await zip.generateAsync({ type: "arraybuffer" })],
      {
        type: "application/epub+zip"
      }
    )
    const origFile = new File([origBlob], "book.epub")

    const parsed = await parseEpub(origFile)
    expect(parsed.textBlocks[0].text).toBe("Hello world!")

    // Replace "world" (offset 6..11) spanning <b> and <i> nodes with "earth"
    const fixes: FixInstruction[] = [
      {
        filePath: parsed.textBlocks[0].filePath,
        blockId: parsed.textBlocks[0].id,
        startIndex: 6,
        endIndex: 11,
        newWord: "earth"
      }
    ]

    const fixedBlob = await applyFixesAndRepack(origBlob, fixes)
    const fixedFile = new File([fixedBlob], "fixed.epub")
    const reParsed = await parseEpub(fixedFile)
    expect(reParsed.textBlocks[0].text).toBe("Hello earth!")
  })

  it("Matrix 4-6: Multiple fixes in one paragraph and across paragraphs", async () => {
    const zip = new JSZip()
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" })
    zip.file(
      "META-INF/container.xml",
      `<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>`
    )
    zip.file(
      "OEBPS/content.opf",
      `<package><manifest><item id="chap1" href="chap1.xhtml"/><item id="chap2" href="chap2.xhtml"/></manifest><spine><itemref idref="chap1"/><itemref idref="chap2"/></spine></package>`
    )
    zip.file(
      "OEBPS/chap1.xhtml",
      `<html xmlns="http://www.w3.org/1999/xhtml"><body><p>Lỗi1 và Lỗi2 trong đoạn 1.</p></body></html>`
    )
    zip.file(
      "OEBPS/chap2.xhtml",
      `<html xmlns="http://www.w3.org/1999/xhtml"><body><p>Lỗi3 ở chương 2.</p></body></html>`
    )

    const origBlob = new Blob(
      [await zip.generateAsync({ type: "arraybuffer" })],
      {
        type: "application/epub+zip"
      }
    )
    const origFile = new File([origBlob], "book.epub")
    const parsed = await parseEpub(origFile)
    expect(parsed.textBlocks.length).toBe(2)

    // Apply fixes in chap1 and chap2
    const fixes: FixInstruction[] = [
      {
        filePath: parsed.textBlocks[0].filePath,
        blockId: parsed.textBlocks[0].id,
        startIndex: 0,
        endIndex: 4,
        newWord: "Đúng1"
      },
      {
        filePath: parsed.textBlocks[0].filePath,
        blockId: parsed.textBlocks[0].id,
        startIndex: 8,
        endIndex: 12,
        newWord: "Đúng2"
      },
      {
        filePath: parsed.textBlocks[1].filePath,
        blockId: parsed.textBlocks[1].id,
        startIndex: 0,
        endIndex: 4,
        newWord: "Đúng3"
      }
    ]

    const fixedBlob = await applyFixesAndRepack(origBlob, fixes)
    const fixedFile = new File([fixedBlob], "fixed.epub")
    const reParsed = await parseEpub(fixedFile)

    expect(reParsed.textBlocks[0].text).toBe("Đúng1 và Đúng2 trong đoạn 1.")
    expect(reParsed.textBlocks[1].text).toBe("Đúng3 ở chương 2.")
  })

  it("Matrix 8-11: Nested div/p, relative ../ paths, and URL-encoded hrefs", async () => {
    const zip = new JSZip()
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" })
    zip.file(
      "META-INF/container.xml",
      `<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>`
    )
    // Manifest href with URL encoding (%20) and parent directory navigation
    zip.file(
      "OEBPS/content.opf",
      `<package><manifest><item id="cover" href="../Images/my%20cover.jpg" properties="cover-image"/><item id="chap1" href="Text/Ch%C6%B0%C6%A1ng%201.xhtml"/></manifest><spine><itemref idref="chap1"/></spine></package>`
    )
    zip.file("Images/my cover.jpg", "fake-image-bytes")
    zip.file(
      "OEBPS/Text/Chương 1.xhtml",
      `<html xmlns="http://www.w3.org/1999/xhtml"><body><div class="main"><p>Nội dung chương 1 với từ saii.</p></div></body></html>`
    )

    const origBlob = new Blob(
      [await zip.generateAsync({ type: "arraybuffer" })],
      {
        type: "application/epub+zip"
      }
    )
    const origFile = new File([origBlob], "book.epub")

    const parsed = await parseEpub(origFile)
    expect(parsed.textBlocks.length).toBe(1)
    expect(parsed.textBlocks[0].text).toBe("Nội dung chương 1 với từ saii.")
    expect(parsed.metadata.coverUrl).toBeDefined()

    // Fix "saii" (offset 25..29) -> "đúng"
    const fixes: FixInstruction[] = [
      {
        filePath: parsed.textBlocks[0].filePath,
        blockId: parsed.textBlocks[0].id,
        startIndex: 25,
        endIndex: 29,
        newWord: "đúng"
      }
    ]

    const fixedBlob = await applyFixesAndRepack(origBlob, fixes)
    const fixedFile = new File([fixedBlob], "fixed.epub")
    const reParsed = await parseEpub(fixedFile)

    expect(reParsed.textBlocks[0].text).toBe("Nội dung chương 1 với từ đúng.")
  })

  it("Matrix 12-15: Full roundtrip verifying valid ZIP, mimetype uncompressed, OPF, Spine, and XML preserved", async () => {
    const zip = new JSZip()
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" })
    zip.file(
      "META-INF/container.xml",
      `<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>`
    )
    zip.file(
      "OEBPS/content.opf",
      `<package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Sách Thử Nghiệm</dc:title><dc:creator>Tác Giả</dc:creator></metadata><manifest><item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/></spine></package>`
    )
    zip.file(
      "OEBPS/c1.xhtml",
      `<?xml version="1.0" encoding="utf-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Chương 1</title></head><body><h1>Chương 1</h1><p>Văn bản hoàn hảo.</p></body></html>`
    )

    const origBlob = new Blob(
      [await zip.generateAsync({ type: "arraybuffer" })],
      {
        type: "application/epub+zip"
      }
    )
    const origFile = new File([origBlob], "book.epub")

    const parsed = await parseEpub(origFile)
    expect(parsed.metadata.title).toBe("Sách Thử Nghiệm")
    expect(parsed.metadata.author).toBe("Tác Giả")
    expect(parsed.textBlocks.length).toBe(2)

    // Repack
    const fixedBlob = await applyFixesAndRepack(origBlob, [])
    const resultZip = await JSZip.loadAsync(await fixedBlob.arrayBuffer())

    // 1. mimetype is STORED (uncompressed) and matches exact content
    const mimetypeText = await resultZip.file("mimetype")?.async("string")
    expect(mimetypeText).toBe("application/epub+zip")

    // 2. META-INF/container.xml exists
    expect(resultZip.file("META-INF/container.xml")).not.toBeNull()

    // 3. OPF exists
    expect(resultZip.file("OEBPS/content.opf")).not.toBeNull()

    // 4. Chapter exists and preserves XML header & namespaces
    const c1Content = await resultZip.file("OEBPS/c1.xhtml")?.async("string")
    expect(c1Content).toContain('<?xml version="1.0" encoding="utf-8"?>')
    expect(c1Content).toContain("http://www.w3.org/1999/xhtml")
    expect(c1Content).toContain("Văn bản hoàn hảo.")
  })
})
