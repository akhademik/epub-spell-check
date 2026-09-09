import { beforeEach, describe, expect, it } from "vitest"
import type { Dictionaries } from "../../src/types/dictionary"
import type { ErrorInstance } from "../../src/types/errors"
import {
  clearSuggestionCache,
  findSuggestions,
  findTieredSuggestions,
  groupErrors
} from "../../src/utils/analyzer"

describe("Analyzer Module", () => {
  const mockDictionaries: Dictionaries = {
    vietnamese: new Set(["người", "sách", "quà", "học", "khoa", "toán"]),
    nonVietnamese: new Set(["book", "school", "science"]),
    custom: new Set(["ATM", "VIP"]),
    names: new Set(["Alexander", "Parmenion"])
  }

  describe("Error Grouping", () => {
    it("should group identical errors and sort by count descending", () => {
      const errors: ErrorInstance[] = [
        {
          word: "họp",
          originalWord: "họp",
          type: "UnknownWord",
          reason: "Không có trong từ điển tiếng Việt",
          context: {
            originalParagraph: "họp hành",
            startIndex: 0,
            endIndex: 3,
            matchIndex: 0,
            chapterIndex: 0,
            paragraphIndex: 0
          }
        },
        {
          word: "tÔi",
          originalWord: "tÔi",
          type: "CaseError",
          reason: "Lỗi viết hoa",
          context: {
            originalParagraph: "tÔi đi học",
            startIndex: 0,
            endIndex: 3,
            matchIndex: 0,
            chapterIndex: 0,
            paragraphIndex: 1
          }
        },
        {
          word: "họp",
          originalWord: "họp",
          type: "UnknownWord",
          reason: "Không có trong từ điển tiếng Việt",
          context: {
            originalParagraph: "đi họp",
            startIndex: 3,
            endIndex: 6,
            matchIndex: 3,
            chapterIndex: 0,
            paragraphIndex: 2
          }
        }
      ]

      const grouped = groupErrors(errors)
      expect(grouped.length).toBe(2)
      expect(grouped[0].word).toBe("họp")
      expect(grouped[0].count).toBe(2)
      expect(grouped[1].word).toBe("tÔi")
      expect(grouped[1].count).toBe(1)
    })
  })

  describe("Suggestions Generation", () => {
    beforeEach(() => {
      clearSuggestionCache()
    })
    it("should suggest close words from Vietnamese dictionary", () => {
      const suggestions = findSuggestions("họp", mockDictionaries)
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it("should find suggestions for foreign words", () => {
      const suggestions = findSuggestions("sciense", mockDictionaries)
      expect(suggestions).toContain("science")
    })

    it("should prioritize exact Vietnamese tone swaps in primary suggestions (e.g. chổ -> chỗ)", () => {
      const customDicts: Dictionaries = {
        vietnamese: new Set(["chỗ", "cho", "chó", "chò"]),
        nonVietnamese: new Set(),
        custom: new Set(),
        names: new Set()
      }
      const tiered = findTieredSuggestions("chổ", customDicts)
      expect(tiered.primary[0]).toBe("chỗ")
    })

    it("should suggest names with edit distance <= 2 in secondary suggestions (e.g. Hymalya -> Himalaya)", () => {
      const customDicts: Dictionaries = {
        vietnamese: new Set(),
        nonVietnamese: new Set(),
        custom: new Set(),
        names: new Set(["Himalaya"])
      }
      const tiered = findTieredSuggestions("Hymalya", customDicts)
      expect(tiered.secondary).toContain("Himalaya")
    })

    it("should prioritize canonical casing from custom dictionary (e.g. ipad -> iPad, iphone/IPHONE -> iPhone, wechat -> WeChat)", () => {
      const customDicts: Dictionaries = {
        vietnamese: new Set(),
        nonVietnamese: new Set(),
        custom: new Set(["iPad", "iPhone", "WeChat"]),
        names: new Set()
      }
      expect(findTieredSuggestions("ipad", customDicts).primary[0]).toBe("iPad")
      expect(findTieredSuggestions("iphone", customDicts).primary[0]).toBe(
        "iPhone"
      )
      expect(findTieredSuggestions("IPHONE", customDicts).primary[0]).toBe(
        "iPhone"
      )
      expect(findTieredSuggestions("wechat", customDicts).primary[0]).toBe(
        "WeChat"
      )
      expect(findTieredSuggestions("weChat", customDicts).primary[0]).toBe(
        "WeChat"
      )
    })

    it("should suggest canonical casing for names (e.g. alexander -> Alexander)", () => {
      const customDicts: Dictionaries = {
        vietnamese: new Set(),
        nonVietnamese: new Set(),
        custom: new Set(),
        names: new Set(["Alexander"])
      }
      expect(findTieredSuggestions("alexander", customDicts).primary[0]).toBe(
        "Alexander"
      )
    })

    it("should strictly limit edit distance to 1 for short words (length <= 3) to prevent garbage suggestions", () => {
      const customDicts: Dictionaries = {
        vietnamese: new Set(["học", "hộp", "hoa", "hạ", "hạc"]),
        nonVietnamese: new Set(),
        custom: new Set(),
        names: new Set()
      }
      // "họp" (len 3) -> distance 1: "học" (dist 1), "hộp" (dist 1). Distance 2 words like "hạ", "hạc" should not be suggested
      const tiered = findTieredSuggestions("họp", customDicts)
      expect(tiered.primary).toContain("học")
      expect(tiered.primary).toContain("hộp")
      expect(tiered.primary).not.toContain("hạ")
      expect(tiered.secondary).not.toContain("hạ")
    })

    it("should prioritize same base-word tone matches over random edit-distance words in structured scoring", () => {
      const customDicts: Dictionaries = {
        vietnamese: new Set(["khoán", "khoang", "khó"]),
        nonVietnamese: new Set(),
        custom: new Set(),
        names: new Set()
      }
      // "khoan" -> same base word "khoán" should rank above generic edit distance words
      const tiered = findTieredSuggestions("khoan", customDicts)
      expect(tiered.primary[0]).toBe("khoán")
    })

    it("should return cached results on repeated calls", () => {
      const first = findSuggestions("họp", mockDictionaries)
      const second = findSuggestions("họp", mockDictionaries)
      expect(first).toBe(second)
    })
  })
})
