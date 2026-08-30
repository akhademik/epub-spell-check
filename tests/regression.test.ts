import { describe, expect, it } from "vitest"
import type { CheckSettings } from "../src/types/analysis"
import type { Dictionaries } from "../src/types/dictionary"
import { getErrorType } from "../src/utils/analysis-core"

describe("Regression Safety Net", () => {
  const mockDictionaries: Dictionaries = {
    vietnamese: new Set([
      "hòa",
      "họa",
      "hoà",
      "hoá",
      "học",
      "sách",
      "quà",
      "nghiên",
      "cứu",
      "phát",
      "triển",
      "khoa",
      "toán",
      "nghệ",
      "thuật",
      "thời",
      "gian",
      "không",
      "gian",
      "chương",
      "trình",
      "thủy",
      "thuỷ",
      "khỏe",
      "khoẻ"
    ]),
    nonVietnamese: new Set([
      "computer",
      "software",
      "internet",
      "network",
      "language",
      "framework",
      "javascript",
      "typescript"
    ]),
    custom: new Set([
      "AI",
      "API",
      "CLI",
      "CPU",
      "EPUB",
      "HTML",
      "JSON",
      "RAM",
      "URL",
      "VCTVE",
      "XML"
    ]),
    names: new Set(["Alexander", "Parmenion", "Persepolis", "Babylon"])
  }

  const defaultCheckSettings: CheckSettings = {
    vietnamese: true,
    nonVietnamese: true
  }

  describe("Tone Placement Style Immunity (No false positive tone errors)", () => {
    it("never flags valid Vietnamese words regardless of old or new tone placement style", () => {
      const tonePairs = [
        ["hòa", "hoà"],
        ["hóa", "hoá"],
        ["thủy", "thuỷ"],
        ["khỏe", "khoẻ"]
      ]
      for (const [newStyle, oldStyle] of tonePairs) {
        expect(
          getErrorType(newStyle, mockDictionaries, defaultCheckSettings),
          `Expected new style "${newStyle}" to pass`
        ).toBeNull()
        expect(
          getErrorType(oldStyle, mockDictionaries, defaultCheckSettings),
          `Expected old style "${oldStyle}" to pass`
        ).toBeNull()
      }
    })

    it("preserves valid Vietnamese words without false positive flags", () => {
      const validWords = [
        "nghiên",
        "cứu",
        "phát",
        "triển",
        "nghệ",
        "thuật",
        "chương",
        "trình"
      ]
      for (const w of validWords) {
        const error = getErrorType(w, mockDictionaries, defaultCheckSettings)
        expect(error, `Expected "${w}" to have no errors`).toBeNull()
      }
    })

    it("accurately detects typo patterns like aa, ee, oo at the end of word", () => {
      const typoError = getErrorType(
        "nghiênaa",
        mockDictionaries,
        defaultCheckSettings
      )
      expect(typoError?.type).toBe("Typo")
      expect(typoError?.reason).toBe("Gõ máy (Typo)")
    })

    it("accurately flags unknown words like tòong as Dictionary error", () => {
      const error = getErrorType(
        "tòong",
        mockDictionaries,
        defaultCheckSettings
      )
      expect(error?.type).toBe("Dictionary")
    })
  })

  describe("Abbreviations & Custom Dictionary Integrity", () => {
    it("handles all standard technical acronyms without errors", () => {
      const acronyms = [
        "AI",
        "API",
        "CLI",
        "CPU",
        "EPUB",
        "HTML",
        "JSON",
        "RAM",
        "URL",
        "VCTVE",
        "XML"
      ]
      for (const acr of acronyms) {
        const error = getErrorType(acr, mockDictionaries, defaultCheckSettings)
        expect(error, `Expected acronym "${acr}" to pass`).toBeNull()
      }
    })
  })

  describe("Foreign Multilingual Words Integrity", () => {
    it("passes recognized English/French words from foreign dictionary", () => {
      const foreignWords = [
        "computer",
        "software",
        "internet",
        "network",
        "typescript"
      ]
      for (const fw of foreignWords) {
        const error = getErrorType(fw, mockDictionaries, defaultCheckSettings)
        expect(error, `Expected foreign word "${fw}" to pass`).toBeNull()
      }
    })

    it("flags unrecognized foreign words when Non-Vietnamese check is enabled", () => {
      const error = getErrorType("unknownwordz", mockDictionaries, {
        vietnamese: true,
        nonVietnamese: true
      })
      expect(error?.type).toBe("NonVietnamese")
    })

    it("ignores unrecognized foreign words when Non-Vietnamese check is disabled", () => {
      const error = getErrorType("unknownwordz", mockDictionaries, {
        vietnamese: true,
        nonVietnamese: false
      })
      expect(error).toBeNull()
    })
  })
})
