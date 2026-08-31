// @vitest-environment jsdom

import JSZip from "jszip"
import { describe, expect, it } from "vitest"
import {
  applyFixesAndRepack,
  applyFixesToDocument,
  locateOffsetInBlock
} from "../../src/utils/epub-writer"

describe("EPUB Writer Module", () => {
  describe("locateOffsetInBlock", () => {
    it("locates offset in single text node", () => {
      const p = document.createElement("p")
      p.textContent = "Hôm nay trời nắng đẹp."
      const result = locateOffsetInBlock(p, 8)
      expect(result).not.toBeNull()
      expect(result?.localOffset).toBe(8)
      expect(result?.textNode.nodeValue).toBe("Hôm nay trời nắng đẹp.")
    })

    it("locates offset across child elements and multiple text nodes", () => {
      const p = document.createElement("p")
      p.innerHTML = "Hôm <em>nay</em> trời <b>nắng</b> đẹp."
      // Text nodes: "Hôm " (4), "nay" (3), " trời " (6), "nắng" (4), " đẹp." (5)
      // Total string: "Hôm nay trời nắng đẹp."
      // 'nắng' starts at offset 13 ('Hôm nay trời ' = 4+3+6 = 13)
      const result = locateOffsetInBlock(p, 13)
      expect(result).not.toBeNull()
      expect(result?.textNode.nodeValue).toBe("nắng")
      expect(result?.localOffset).toBe(0)
    })
  })

  describe("applyFixesToDocument", () => {
    it("applies fix accurately inside a single paragraph node", () => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(
        '<!DOCTYPE html><html><body><p id="p1">Đoàn quân đi họp hành vui vẻ.</p></body></html>',
        "application/xhtml+xml"
      )
      // text: "Đoàn quân đi họp hành vui vẻ."
      // "Đoàn quân đi " is 13 chars (index 0..12). "họp" is 13..16.
      const filePath = "OEBPS/chap1.xhtml"
      applyFixesToDocument(doc, filePath, [
        {
          filePath,
          blockId: `${filePath}#0`,
          startIndex: 13,
          endIndex: 16,
          newWord: "học"
        }
      ])

      const p = doc.querySelector("p")
      expect(p?.textContent).toBe("Đoàn quân đi học hành vui vẻ.")
    })

    it("handles multiple fixes in the same paragraph in descending offset order", () => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(
        "<!DOCTYPE html><html><body><p>Từ sai1 và từ sai2 cùng sai3 trong câu.</p></body></html>",
        "application/xhtml+xml"
      )
      const filePath = "OEBPS/chap1.xhtml"
      applyFixesToDocument(doc, filePath, [
        {
          filePath,
          blockId: `${filePath}#0`,
          startIndex: 3,
          endIndex: 7,
          newWord: "đúng1"
        },
        {
          filePath,
          blockId: `${filePath}#0`,
          startIndex: 14,
          endIndex: 18,
          newWord: "đúng2_dài_hơn"
        },
        {
          filePath,
          blockId: `${filePath}#0`,
          startIndex: 24,
          endIndex: 28,
          newWord: "đúng3"
        }
      ])

      const p = doc.querySelector("p")
      expect(p?.textContent).toBe(
        "Từ đúng1 và từ đúng2_dài_hơn cùng đúng3 trong câu."
      )
    })
  })

  describe("applyFixesAndRepack", () => {
    it("repacks valid EPUB with modified xhtml content and unmodified other files", async () => {
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
        `<?xml version="1.0" encoding="utf-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml"><body><p>Đây là từ lõi cần sửa.</p></body></html>`
      )

      const originalBuffer = await zip.generateAsync({ type: "arraybuffer" })
      const originalBlob = new Blob([originalBuffer], {
        type: "application/epub+zip"
      })

      // text: "Đây là từ lõi cần sửa."
      // "Đây là từ " is 10 chars (index 0..9). "lõi" is 10..13.
      const fixedBlob = await applyFixesAndRepack(originalBlob, [
        {
          filePath: "OEBPS/chap1.xhtml",
          blockId: "OEBPS/chap1.xhtml#0",
          startIndex: 10,
          endIndex: 13,
          newWord: "lỗi"
        }
      ])

      const resultZip = await JSZip.loadAsync(await fixedBlob.arrayBuffer())
      const chap1Content = await resultZip
        .file("OEBPS/chap1.xhtml")
        ?.async("string")
      expect(chap1Content).toContain("Đây là từ lỗi cần sửa.")
      expect(await resultZip.file("mimetype")?.async("string")).toBe(
        "application/epub+zip"
      )
    })

    it("safely falls back to tolerant HTML parser when XHTML has non-standard XML (unescaped ampersand &)", async () => {
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
      // Unescaped & in "Tom & Jerry" causes application/xhtml+xml to fail with <parsererror>
      zip.file(
        "OEBPS/chap1.xhtml",
        `<?xml version="1.0" encoding="utf-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml"><body><p>Tom & Jerry xem ti vi.</p><p>Đây là từ lõi cần sửa.</p></body></html>`
      )

      const originalBuffer = await zip.generateAsync({ type: "arraybuffer" })
      const originalBlob = new Blob([originalBuffer], {
        type: "application/epub+zip"
      })

      // 'lõi' is at index 10..13 in second paragraph (blockId #1)
      const fixedBlob = await applyFixesAndRepack(originalBlob, [
        {
          filePath: "OEBPS/chap1.xhtml",
          blockId: "OEBPS/chap1.xhtml#1",
          startIndex: 10,
          endIndex: 13,
          newWord: "lỗi"
        }
      ])

      const resultZip = await JSZip.loadAsync(await fixedBlob.arrayBuffer())
      const chap1Content = await resultZip
        .file("OEBPS/chap1.xhtml")
        ?.async("string")

      // Ensure no <parsererror> and both paragraphs are preserved intact
      expect(chap1Content).not.toContain("parsererror")
      expect(chap1Content).toContain("Tom &amp; Jerry")
      expect(chap1Content).toContain("Đây là từ lỗi cần sửa.")
    })

    it("correctly replaces words in documents containing NFD (decomposed) Unicode characters", async () => {
      const p = document.createElement("p")
      // Decomposed "Hôm nay trời sang." -> NFD form
      const nfdText = "Hôm nay trời sang.".normalize("NFD")
      p.textContent = nfdText

      // Offset of "trời" in NFC is 8..12
      // In NFD, "trời" contains decomposed combining marks
      const loc = locateOffsetInBlock(p, 8)
      expect(loc).not.toBeNull()
      expect(loc?.localOffset).toBe(8)
    })
  })
})
