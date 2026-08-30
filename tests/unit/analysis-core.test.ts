import { describe, expect, it } from "vitest"
import type { CheckSettings } from "../../src/types/analysis"
import type { Dictionaries } from "../../src/types/dictionary"
import {
  getBaseWord,
  getErrorType,
  isFrontVowel,
  isY,
  levenshteinDistance
} from "../../src/utils/analysis-core"

describe("Analysis Core", () => {
  const mockDictionaries: Dictionaries = {
    vietnamese: new Set([
      "người",
      "sách",
      "tiếng",
      "việt",
      "quà",
      "học",
      "nghiêm",
      "ghe",
      "kinh",
      "hòa",
      "hoà",
      "hóa",
      "hoá",
      "thủy",
      "thuỷ",
      "khỏe",
      "khoẻ",
      "toán"
    ]),
    nonVietnamese: new Set([
      "hello",
      "world",
      "bonjour",
      "paris",
      "english",
      "french"
    ]),
    custom: new Set(["ATM", "VIP", "DNA", "FBI", "GPS", "BBQ"])
  }

  const defaultCheckSettings: CheckSettings = {
    vietnamese: true,
    nonVietnamese: true
  }

  describe("Tone Placement Style (New vs Old tone style)", () => {
    it("accepts both new and old tone styles without false positive errors", () => {
      expect(
        getErrorType("hòa", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("hoà", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("hóa", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("hoá", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("thủy", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("thuỷ", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("khỏe", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("khoẻ", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
    })
  })

  describe("Spelling & Typo Rules", () => {
    it("should identify front vowels", () => {
      expect(isFrontVowel("i")).toBe(true)
      expect(isFrontVowel("e")).toBe(true)
      expect(isFrontVowel("ê")).toBe(true)
      expect(isFrontVowel("a")).toBe(false)
    })

    it("should identify y", () => {
      expect(isY("y")).toBe(true)
      expect(isY("ý")).toBe(true)
      expect(isY("i")).toBe(false)
    })

    it("should flag ngh when not before front vowel as Spelling error", () => {
      const error = getErrorType("ngha", mockDictionaries, defaultCheckSettings)
      expect(error?.type).toBe("Spelling")
      expect(error?.reason).toBe("Sai quy tắc ngh")
    })

    it("should flag ng when before front vowel as Spelling error", () => {
      const error = getErrorType(
        "ngiêm",
        mockDictionaries,
        defaultCheckSettings
      )
      expect(error?.type).toBe("Spelling")
      expect(error?.reason).toBe("Sai quy tắc ng")
    })

    it("should flag typo patterns as Typo error", () => {
      const error = getErrorType(
        "nghiênaa",
        mockDictionaries,
        defaultCheckSettings
      )
      expect(error?.type).toBe("Typo")
      expect(error?.reason).toBe("Lỗi gõ máy (Typo)")
    })

    it("should flag tòong as Dictionary error", () => {
      const error = getErrorType(
        "tòong",
        mockDictionaries,
        defaultCheckSettings
      )
      expect(error?.type).toBe("Dictionary")
      expect(error?.reason).toBe("Không có trong từ điển tiếng Việt")
    })
  })

  describe("Categorized Error Toggles Functionality", () => {
    it("should recognize Vietnamese words when Vietnamese check is ON", () => {
      expect(
        getErrorType("người", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
    })

    it("should ignore Vietnamese unknown words when Vietnamese check is OFF", () => {
      const error = getErrorType("từLạNàoĐó", mockDictionaries, {
        vietnamese: false,
        nonVietnamese: true
      })
      expect(error).toBeNull()
    })

    it("should recognize known Non-Vietnamese words without error", () => {
      expect(
        getErrorType("hello", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("bonjour", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
    })

    it("should flag unknown foreign words when Non-Vietnamese check is ON", () => {
      const error = getErrorType("fxyzabc", mockDictionaries, {
        vietnamese: true,
        nonVietnamese: true
      })
      expect(error?.type).toBe("NonVietnamese")
    })

    it("should ignore foreign words when Non-Vietnamese check is OFF", () => {
      const error = getErrorType("fxyzabc", mockDictionaries, {
        vietnamese: true,
        nonVietnamese: false
      })
      expect(error).toBeNull()
    })

    it("should always accept Custom Abbreviations (ATM, VIP, DNA) without errors", () => {
      expect(
        getErrorType("ATM", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("VIP", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("DNA", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
    })
  })

  describe("Levenshtein Distance & Base Word", () => {
    it("should calculate correct edit distance", () => {
      expect(levenshteinDistance("sách", "sách")).toBe(0)
      expect(levenshteinDistance("sách", "sác")).toBe(1)
      expect(levenshteinDistance("sách", "sạch")).toBe(1)
    })

    it("should extract base unaccented word", () => {
      expect(getBaseWord("Tiếng")).toBe("Tieng")
      expect(getBaseWord("Việt")).toBe("Viet")
    })
  })
})
