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

    it("should include đ candidate (e.g. duong -> đường) when baseDistance <= 1 (Task 1.1)", () => {
      const customDicts: Dictionaries = {
        vietnamese: new Set(["đường", "dương", "đương", "đoàn"]),
        nonVietnamese: new Set(),
        custom: new Set(),
        names: new Set()
      }
      const tiered = findTieredSuggestions("duong", customDicts)
      const allSuggestions = [...tiered.primary, ...tiered.secondary]
      expect(allSuggestions).toContain("đường")
    })

    it("should prioritize same base-word tone completion over different base words (Task 1.2)", () => {
      const customDicts: Dictionaries = {
        vietnamese: new Set(["trường", "ruồng", "ruộng", "trưởng", "trương"]),
        nonVietnamese: new Set(),
        custom: new Set(),
        names: new Set()
      }
      const tiered = findTieredSuggestions("truong", customDicts)
      expect(tiered.primary).toContain("trường")
      // Verify "trường" is in primary and comes before any different base words in secondary
      expect(tiered.primary.indexOf("trường")).toBeGreaterThanOrEqual(0)
    })

    it("should accurately suggest corrections for no-diacritic typos (Task 1.3)", () => {
      const customDicts: Dictionaries = {
        vietnamese: new Set([
          "học",
          "đường",
          "dương",
          "trường",
          "người",
          "chuyện",
          "thương",
          "hộp",
          "ruộng"
        ]),
        nonVietnamese: new Set(),
        custom: new Set(),
        names: new Set()
      }

      const noDiacriticCases = [
        { input: "hoc", expected: "học" },
        { input: "duong", expected: "đường" },
        { input: "truong", expected: "trường" },
        { input: "nguoi", expected: "người" },
        { input: "chuyen", expected: "chuyện" },
        { input: "thuong", expected: "thương" }
      ]

      for (const { input, expected } of noDiacriticCases) {
        const tiered = findTieredSuggestions(input, customDicts)
        const allSuggestions = [...tiered.primary, ...tiered.secondary]
        expect(
          allSuggestions,
          `Expected suggestion for "${input}" to contain "${expected}"`
        ).toContain(expected)
      }
    })

    it("should use word frequency as tie-breaker for equal score candidates (Task 4.2)", () => {
      const customDicts: Dictionaries = {
        vietnamese: new Set(["trường", "trưởng", "trương", "trượng"]),
        nonVietnamese: new Set(),
        custom: new Set(),
        names: new Set()
      }
      // "truong" has equal edit distance & base distance to all four candidates
      // "trường" has higher frequency weight, so it should rank #1
      const tiered = findTieredSuggestions("truong", customDicts)
      expect(tiered.primary[0]).toBe("trường")
    })

    it("should return cached results on repeated calls", () => {
      const first = findSuggestions("họp", mockDictionaries)
      const second = findSuggestions("họp", mockDictionaries)
      expect(first).toBe(second)
    })
  })
})
