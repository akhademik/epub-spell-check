import { describe, expect, it } from "vitest"
import type { CheckSettings } from "../../src/types/analysis"
import type { Dictionaries } from "../../src/types/dictionary"
import {
  getBaseWord,
  getErrorType,
  isFrontVowel,
  isY,
  levenshteinDistance,
  matchCase,
  WORD_REGEX
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
    custom: new Set(["ATM", "VIP", "DNA", "FBI", "GPS", "BBQ"]),
    names: new Set([
      "Alexander",
      "Parmenion",
      "Persepolis",
      "Babylon",
      "Cleopatra"
    ])
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
      expect(error?.reason).toBe("Gõ máy (Typo)")
    })

    it("should flag tòong as Dictionary error", () => {
      const error = getErrorType(
        "tòong",
        mockDictionaries,
        defaultCheckSettings
      )
      expect(error?.type).toBe("Dictionary")
      expect(error?.reason).toBe("Không có trong VN dict")
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

    it("should always accept Custom Abbreviations (ATM, VIP, DNA, iPad, iPhone) without errors when correctly cased", () => {
      const customDicts: Dictionaries = {
        vietnamese: new Set(),
        nonVietnamese: new Set(),
        custom: new Set(["ATM", "VIP", "DNA", "iPad", "iPhone", "WeChat"]),
        names: new Set()
      }
      expect(getErrorType("ATM", customDicts, defaultCheckSettings)).toBeNull()
      expect(getErrorType("DNA", customDicts, defaultCheckSettings)).toBeNull()
      expect(getErrorType("iPad", customDicts, defaultCheckSettings)).toBeNull()
      expect(
        getErrorType("iPhone", customDicts, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("WeChat", customDicts, defaultCheckSettings)
      ).toBeNull()
    })

    it("should flag casing mistakes of custom dictionary entries as errors", () => {
      const customDicts: Dictionaries = {
        vietnamese: new Set(),
        nonVietnamese: new Set(),
        custom: new Set(["iPad", "iPhone", "WeChat"]),
        names: new Set()
      }
      // ipad is lowercase, not in VN dict
      expect(
        getErrorType("ipad", customDicts, defaultCheckSettings)?.type
      ).toBe("Dictionary")
      // iphone is lowercase, not in VN dict
      expect(
        getErrorType("iphone", customDicts, defaultCheckSettings)?.type
      ).toBe("Dictionary")
      // IPHONE has uppercase anomalies
      expect(
        getErrorType("IPHONE", customDicts, defaultCheckSettings)?.type
      ).toBe("Uppercase")
      // weChat has internal uppercase anomaly
      expect(
        getErrorType("weChat", customDicts, defaultCheckSettings)?.type
      ).toBe("Uppercase")
    })

    it("should always accept Names Dictionary entries (Alexander, Parmenion, Persepolis) without errors", () => {
      expect(
        getErrorType("Alexander", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("Parmenion", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("Persepolis", mockDictionaries, defaultCheckSettings)
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

  describe("Contraction-aware Tokenization & Handling", () => {
    it("should tokenize contractions with straight or curly apostrophes as single words", () => {
      const text =
        "He isn't here, it’s fine, don't worry, I'm ready, you're welcome."
      const words = Array.from(text.matchAll(WORD_REGEX), (m) => m[0])
      expect(words).toContain("isn't")
      expect(words).toContain("it’s")
      expect(words).toContain("don't")
      expect(words).toContain("I'm")
      expect(words).toContain("you're")
    })

    it("should not include trailing or leading apostrophes in words (e.g. James', 'hello')", () => {
      const text = "James' book was 'awesome'."
      const words = Array.from(text.matchAll(WORD_REGEX), (m) => m[0])
      expect(words).toContain("James")
      expect(words).not.toContain("James'")
      expect(words).toContain("awesome")
      expect(words).not.toContain("'awesome'")
    })

    it("should recognize common English contractions without false positive errors", () => {
      expect(
        getErrorType("isn't", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("it's", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("it’s", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("don't", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("can't", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("I'm", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("you're", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("wasn't", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("weren't", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("I've", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("I'll", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType("I'd", mockDictionaries, defaultCheckSettings)
      ).toBeNull()
    })
  })

  describe("Smart Case Matching (matchCase)", () => {
    it("preserves TitleCase when original word is capitalized", () => {
      expect(matchCase("Alexandaer", "alexander")).toBe("Alexander")
      expect(matchCase("Việt", "việt")).toBe("Việt")
    })

    it("preserves UPPERCASE when original word is ALL CAPS", () => {
      expect(matchCase("ALEXANDAER", "alexander")).toBe("ALEXANDER")
      expect(matchCase("HELLLO", "hello")).toBe("HELLO")
    })

    it("preserves lowercase when original word is lowercase", () => {
      expect(matchCase("alexandaer", "alexander")).toBe("alexander")
      expect(matchCase("alexandaer", "Alexander")).toBe("Alexander")
    })
  })
})
