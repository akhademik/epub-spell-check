import { describe, expect, it } from "vitest"
import type { CheckSettings } from "../../src/types/analysis"
import type { Dictionaries } from "../../src/types/dictionary"
import type { TextContentBlock } from "../../src/types/epub"

describe("Worker PostMessage & Structured Clone Safety", () => {
  it("should successfully clone analysis payload using structuredClone without DataCloneError", () => {
    const rawDicts: Dictionaries = {
      vietnamese: new Set(["người", "sách", "quà", "học", "hòa", "hoà"]),
      nonVietnamese: new Set(["hello", "world", "paris"]),
      custom: new Set(["ATM", "VIP", "DNA"])
    }

    const rawCheckSettings: CheckSettings = {
      vietnamese: true,
      nonVietnamese: true
    }

    const textBlocks: TextContentBlock[] = [
      { text: "Đây là một đoạn văn bản tiếng Việt kiểm tra phân tích." },
      { text: "Tôi đi rút tiền ở cây ATM và mua món quà từ Paris." }
    ]

    const payload = {
      textBlocks,
      dictionaries: rawDicts,
      checkSettings: rawCheckSettings,
      chapterStartIndex: 0
    }

    // structuredClone is the exact algorithm executed by Worker.postMessage in browser
    expect(() => {
      const cloned = structuredClone(payload)
      expect(cloned.textBlocks.length).toBe(2)
      expect(cloned.dictionaries.vietnamese.has("người")).toBe(true)
      expect(cloned.dictionaries.custom.has("ATM")).toBe(true)
      expect(cloned.dictionaries.nonVietnamese.has("hello")).toBe(true)
    }).not.toThrow()
  })
})
