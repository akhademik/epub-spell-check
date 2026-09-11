import { describe, expect, it } from "vitest"
import type { Dictionaries } from "../../src/types/dictionary"
import { getErrorType } from "../../src/utils/analysis-core"
import type { FixInstruction } from "../../src/utils/epub-writer"
import {
  applyFixesToTextOrMarkdown,
  detectLineEnding,
  parseTextOrMarkdown
} from "../../src/utils/text-parser"

describe("Text & Markdown Parser & Writer", () => {
  it("detects line endings accurately", () => {
    expect(detectLineEnding("line1\r\nline2\r\nline3")).toBe("\r\n")
    expect(detectLineEnding("line1\nline2\nline3")).toBe("\n")
  })

  it("parses a plain text file into TextContentBlocks", async () => {
    const textContent = "Dòng thứ nhất.\n\nDòng thứ hai có lỗi.\nDòng thứ ba."
    const file = new File([textContent], "sample-book.txt", {
      type: "text/plain"
    })

    const parsed = await parseTextOrMarkdown(file)
    expect(parsed.metadata.title).toBe("sample-book")
    expect(parsed.metadata.author).toBe("Văn bản (.txt)")
    expect(parsed.textBlocks).toHaveLength(3)
    expect(parsed.textBlocks[0]).toEqual({
      id: "line_1",
      filePath: "sample-book.txt",
      text: "Dòng thứ nhất."
    })
    expect(parsed.textBlocks[1]).toEqual({
      id: "line_3",
      filePath: "sample-book.txt",
      text: "Dòng thứ hai có lỗi."
    })
    expect(parsed.textBlocks[2]).toEqual({
      id: "line_4",
      filePath: "sample-book.txt",
      text: "Dòng thứ ba."
    })
  })

  it("parses a Markdown file preserving structure", async () => {
    const mdContent = `# Chương 1: Mở đầu

Đây là đoạn văn bản markdown.
- Mục danh sách 1
- Mục danh sách 2

> Trích dẫn một câu nói hay.`

    const file = new File([mdContent], "truyen-ngan.md", {
      type: "text/markdown"
    })

    const parsed = await parseTextOrMarkdown(file)
    expect(parsed.metadata.title).toBe("truyen-ngan")
    expect(parsed.metadata.author).toBe("Markdown (.md)")
    expect(parsed.textBlocks.length).toBe(5)
    expect(parsed.textBlocks[0].text).toBe("# Chương 1: Mở đầu")
    expect(parsed.textBlocks[1].text).toBe("Đây là đoạn văn bản markdown.")
    expect(parsed.textBlocks[2].text).toBe("- Mục danh sách 1")
    expect(parsed.textBlocks[3].text).toBe("- Mục danh sách 2")
    expect(parsed.textBlocks[4].text).toBe("> Trích dẫn một câu nói hay.")
  })

  it("applies fix instructions to plain text file and preserves indentation and empty lines", async () => {
    const raw = "  Hôm nay toi di hoc.\n\n   Troi rat dep."
    const file = new File([raw], "test.txt", { type: "text/plain" })

    // "Hôm nay toi di hoc."
    // 0123456789012345678
    // "toi": startIndex = 8, endIndex = 11
    // "di": startIndex = 12, endIndex = 14
    // "hoc": startIndex = 15, endIndex = 18
    const fixes: FixInstruction[] = [
      {
        filePath: "test.txt",
        blockId: "line_1",
        startIndex: 8,
        endIndex: 11,
        newWord: "tôi"
      },
      {
        filePath: "test.txt",
        blockId: "line_1",
        startIndex: 12,
        endIndex: 14,
        newWord: "đi"
      },
      {
        filePath: "test.txt",
        blockId: "line_1",
        startIndex: 15,
        endIndex: 18,
        newWord: "học"
      },
      {
        filePath: "test.txt",
        blockId: "line_3",
        startIndex: 0,
        endIndex: 4,
        newWord: "Trời"
      }
    ]

    const blob = await applyFixesToTextOrMarkdown(file, fixes)
    const resultText = await blob.text()

    expect(resultText).toBe("  Hôm nay tôi đi học.\n\n   Trời rat dep.")
  })

  it("applies fix instructions to Markdown file with CRLF line endings", async () => {
    const raw = "# Chuong 1\r\n\r\n- Mot con meo nho."
    const file = new File([raw], "chapter.md", { type: "text/markdown" })

    const fixes: FixInstruction[] = [
      {
        filePath: "chapter.md",
        blockId: "line_1",
        startIndex: 2,
        endIndex: 8,
        newWord: "Chương"
      },
      {
        filePath: "chapter.md",
        blockId: "line_3",
        startIndex: 2,
        endIndex: 5,
        newWord: "Một"
      },
      {
        filePath: "chapter.md",
        blockId: "line_3",
        startIndex: 10,
        endIndex: 13,
        newWord: "mèo"
      }
    ]

    const blob = await applyFixesToTextOrMarkdown(file, fixes)
    const resultText = await blob.text()

    expect(resultText).toBe("# Chương 1\r\n\r\n- Một con mèo nho.")
  })

  it("integrates seamlessly with spelling analysis and fix application", async () => {
    const file = new File(["Hôm nay tôi di hoc tai truong."], "hoc-sinh.txt", {
      type: "text/plain"
    })
    const parsed = await parseTextOrMarkdown(file)

    const dicts: Dictionaries = {
      vietnamese: new Set(["hôm", "nay", "tôi", "đi", "học", "tại", "trường"]),
      nonVietnamese: new Set(),
      custom: new Set(),
      names: new Set()
    }

    const words = parsed.textBlocks[0].text.split(/\s+/)
    expect(words).toHaveLength(7)

    const foundErrors: { word: string; start: number; end: number }[] = []
    let cursor = 0
    for (const w of words) {
      const start = parsed.textBlocks[0].text.indexOf(w, cursor)
      const end = start + w.length
      cursor = end

      const err = getErrorType(w, dicts, {
        vietnamese: true,
        nonVietnamese: true
      })
      if (err) {
        foundErrors.push({ word: w, start, end })
      }
    }

    expect(foundErrors.map((e) => e.word)).toEqual([
      "di",
      "hoc",
      "tai",
      "truong."
    ])

    const fixes: FixInstruction[] = [
      {
        filePath: "hoc-sinh.txt",
        blockId: "line_1",
        startIndex: foundErrors[0].start,
        endIndex: foundErrors[0].end,
        newWord: "đi"
      }
    ]

    const fixedBlob = await applyFixesToTextOrMarkdown(file, fixes)
    const fixedText = await fixedBlob.text()
    expect(fixedText).toBe("Hôm nay tôi đi hoc tai truong.")
  })
})
