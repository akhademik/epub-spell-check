import { describe, expect, it } from "vitest"
import type { CheckSettings } from "../../src/types/analysis"
import type { Dictionaries } from "../../src/types/dictionary"
import {
  getBaseWord,
  getErrorType,
  isDigitConnected,
  isFrontVowel,
  isHyphenConnected,
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

    it("should flag typo patterns as Spelling error with Typo reason", () => {
      const error = getErrorType(
        "nghiênaa",
        mockDictionaries,
        defaultCheckSettings
      )
      expect(error?.type).toBe("Spelling")
      expect(error?.reason).toBe("Gõ máy (Typo)")
    })

    it("should flag tòong as UnknownWord error", () => {
      const error = getErrorType(
        "tòong",
        mockDictionaries,
        defaultCheckSettings
      )
      expect(error?.type).toBe("UnknownWord")
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
      ).toBe("UnknownWord")
      // iphone is lowercase, not in VN dict
      expect(
        getErrorType("iphone", customDicts, defaultCheckSettings)?.type
      ).toBe("UnknownWord")
      // IPHONE has uppercase anomalies
      expect(
        getErrorType("IPHONE", customDicts, defaultCheckSettings)?.type
      ).toBe("CaseError")
      // weChat has internal uppercase anomaly
      expect(
        getErrorType("weChat", customDicts, defaultCheckSettings)?.type
      ).toBe("CaseError")
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

  describe("Word Extraction Boundaries & Punctuation Isolation", () => {
    it("should correctly extract words enclosed in parentheses, brackets, and quotes", () => {
      const text = `(sách) [học] "người" 'tiếng' “quà” «khoa» —toán—`
      const words = Array.from(text.matchAll(WORD_REGEX), (m) => m[0])
      expect(words).toEqual([
        "sách",
        "học",
        "người",
        "tiếng",
        "quà",
        "khoa",
        "toán"
      ])
    })

    it("should correctly handle words attached to hyphens, colons, and ellipses", () => {
      const text = "học-sinh... sách: khoa; toán! người?"
      const words = Array.from(text.matchAll(WORD_REGEX), (m) => m[0])
      expect(words).toEqual(["học", "sinh", "sách", "khoa", "toán", "người"])
    })

    it("should handle Vietnamese NFC diacritics and normalize consistently", () => {
      const nfdWord = "người" // NFD decomposed form
      const nfcWord = nfdWord.normalize("NFC") // "người"
      expect(
        getErrorType(nfdWord, mockDictionaries, defaultCheckSettings)
      ).toBeNull()
      expect(
        getErrorType(nfcWord, mockDictionaries, defaultCheckSettings)
      ).toBeNull()
    })
  })

  describe("Hyphen-connected dialogue & stuttering detection (isHyphenConnected)", () => {
    it("should accurately identify hyphen-connected stuttering, elongation, and spelling-out sequences", () => {
      const text =
        " — Đi-i đ -đâu!.. Đê-ê-ể người taa đợ-ợ-ợi m-ã-ãi?.. t-o-i-te"
      const tokens: { word: string; start: number; end: number }[] = []

      WORD_REGEX.lastIndex = 0
      let match: RegExpExecArray | null
      while (true) {
        match = WORD_REGEX.exec(text)
        if (match === null) break
        tokens.push({
          word: match[0],
          start: match.index,
          end: match.index + match[0].length
        })
      }

      // Check results for each token
      const results = tokens.map((t) => ({
        word: t.word,
        isHyphen: isHyphenConnected(text, t.start, t.end)
      }))

      // Hyphen-connected tokens should be true
      expect(results.find((r) => r.word === "Đi")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "i")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "đ")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "đâu")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "Đê")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "ê")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "ể")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "đợ")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "ợ")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "ợi")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "m")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "ã")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "ãi")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "t")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "o")?.isHyphen).toBe(true)
      expect(results.find((r) => r.word === "te")?.isHyphen).toBe(true)

      // Standalone words without hyphens should be false
      expect(results.find((r) => r.word === "người")?.isHyphen).toBe(false)
      expect(results.find((r) => r.word === "taa")?.isHyphen).toBe(false)
    })

    it("should not flag normal clause-separating dashes as hyphen connected", () => {
      const text = "Tôi thích đọc sách - một sở thích lâu năm."
      const words = Array.from(text.matchAll(WORD_REGEX), (m) => ({
        word: m[0],
        start: m.index,
        end: m.index + m[0].length
      }))

      for (const w of words) {
        expect(isHyphenConnected(text, w.start, w.end)).toBe(false)
      }
    })
  })

  describe("Digit-connected token detection (isDigitConnected)", () => {
    it("should detect letters immediately preceded by digits (e.g. 8x, 9x, 2k, 5kg, 100m, 3D, 4K)", () => {
      const text =
        "Thế hệ 8x và 9x yêu thích công nghệ 4K, 3D, đi bộ 5km hoặc 100m."
      const words = Array.from(text.matchAll(WORD_REGEX), (m) => ({
        word: m[0],
        start: m.index,
        end: m.index + m[0].length
      }))

      const results = words.map((w) => ({
        word: w.word,
        isDigit: isDigitConnected(text, w.start, w.end)
      }))

      expect(results.find((r) => r.word === "x")?.isDigit).toBe(true)
      expect(results.find((r) => r.word === "K")?.isDigit).toBe(true)
      expect(results.find((r) => r.word === "D")?.isDigit).toBe(true)
      expect(results.find((r) => r.word === "km")?.isDigit).toBe(true)
      expect(results.find((r) => r.word === "m")?.isDigit).toBe(true)

      // Regular standalone words should NOT be digit connected
      expect(results.find((r) => r.word === "Thế")?.isDigit).toBe(false)
      expect(results.find((r) => r.word === "hệ")?.isDigit).toBe(false)
      expect(results.find((r) => r.word === "và")?.isDigit).toBe(false)
      expect(results.find((r) => r.word === "yêu")?.isDigit).toBe(false)
    })

    it("should detect letters immediately followed by digits (e.g. B52, F16, A1, H2O)", () => {
      const text = "Máy bay B52, tiêm kích F16 và công thức H2O."
      const words = Array.from(text.matchAll(WORD_REGEX), (m) => ({
        word: m[0],
        start: m.index,
        end: m.index + m[0].length
      }))

      const results = words.map((w) => ({
        word: w.word,
        isDigit: isDigitConnected(text, w.start, w.end)
      }))

      expect(results.find((r) => r.word === "B")?.isDigit).toBe(true)
      expect(results.find((r) => r.word === "F")?.isDigit).toBe(true)
      expect(results.find((r) => r.word === "H")?.isDigit).toBe(true)

      // Standalone words should be false
      expect(results.find((r) => r.word === "Máy")?.isDigit).toBe(false)
      expect(results.find((r) => r.word === "bay")?.isDigit).toBe(false)
    })

    it("should not flag words separated from digits by spaces", () => {
      const text = "Năm 2026 có 12 tháng và 365 ngày."
      const words = Array.from(text.matchAll(WORD_REGEX), (m) => ({
        word: m[0],
        start: m.index,
        end: m.index + m[0].length
      }))

      for (const w of words) {
        expect(isDigitConnected(text, w.start, w.end)).toBe(false)
      }
    })
  })
})
