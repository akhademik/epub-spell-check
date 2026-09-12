import { describe, expect, it } from "vitest"
import type { CheckSettings } from "../../src/types/analysis"
import type { Dictionaries } from "../../src/types/dictionary"
import { getErrorType } from "../../src/utils/analysis-core"
import { detectCrossDictDuplicates } from "../../src/utils/dict-quality"
import { validateDictionaryWord } from "../../src/utils/dict-validator"

describe("TASK 2: Dictionary Quality, Precedence & Unicode Behavior", () => {
  const testDictionaries: Dictionaries = {
    vietnamese: new Set([
      "người",
      "sách",
      "tiếng",
      "việt",
      "hòa",
      "hoà",
      "hóa",
      "hoá",
      "cà-phê",
      "bình",
      "thường"
    ]),
    nonVietnamese: new Set([
      "hello",
      "world",
      "internet",
      "wifi",
      "caterpillar",
      "café"
    ]),
    custom: new Set([
      "ATM",
      "VIP",
      "NASA",
      "UNESCO",
      "iPad",
      "iPhone",
      "GPS",
      "UBND"
    ]),
    names: new Set([
      "Alexander",
      "alexander",
      "Jean",
      "jean",
      "Bourbon",
      "bourbon",
      "Hà Nội",
      "Trần Hưng Đạo"
    ])
  }

  const defaultSettings: CheckSettings = {
    vietnamese: true,
    nonVietnamese: true
  }

  describe("1. Dictionary Precedence Hierarchy", () => {
    it("Tier 1: Custom dictionary exempts exact acronyms and camelCase terms", () => {
      // "VIP", "ATM", "iPad" are in custom dict and must NOT be flagged as CaseError
      expect(getErrorType("VIP", testDictionaries, defaultSettings)).toBeNull()
      expect(getErrorType("ATM", testDictionaries, defaultSettings)).toBeNull()
      expect(getErrorType("iPad", testDictionaries, defaultSettings)).toBeNull()
      expect(
        getErrorType("iPhone", testDictionaries, defaultSettings)
      ).toBeNull()
      expect(getErrorType("NASA", testDictionaries, defaultSettings)).toBeNull()
    })

    it("Tier 1: Unregistered acronyms / camelCase words trigger CaseError", () => {
      const err1 = getErrorType(
        "UNKNOWN_VIP",
        testDictionaries,
        defaultSettings
      )
      expect(err1?.type).toBe("CaseError")

      const err2 = getErrorType("smartPhone", testDictionaries, defaultSettings)
      expect(err2?.type).toBe("CaseError")
    })

    it("Tier 2: Names dictionary matches case-insensitively without foreign letter error", () => {
      // Alexander and lowercase alexander both pass
      expect(
        getErrorType("Alexander", testDictionaries, defaultSettings)
      ).toBeNull()
      expect(
        getErrorType("alexander", testDictionaries, defaultSettings)
      ).toBeNull()
      expect(getErrorType("Jean", testDictionaries, defaultSettings)).toBeNull()
      expect(getErrorType("jean", testDictionaries, defaultSettings)).toBeNull()
    })

    it("Tier 3: Non-Vietnamese dictionary matches foreign words and contractions", () => {
      expect(
        getErrorType("internet", testDictionaries, defaultSettings)
      ).toBeNull()
      expect(getErrorType("wifi", testDictionaries, defaultSettings)).toBeNull()
      expect(
        getErrorType("caterpillar", testDictionaries, defaultSettings)
      ).toBeNull()
      expect(getErrorType("café", testDictionaries, defaultSettings)).toBeNull()
      // Contraction built-in
      expect(
        getErrorType("don't", testDictionaries, defaultSettings)
      ).toBeNull()
      expect(
        getErrorType("isn't", testDictionaries, defaultSettings)
      ).toBeNull()
    })

    it("Tier 4: Vietnamese dictionary matches standard words and alternate tone styles", () => {
      expect(
        getErrorType("người", testDictionaries, defaultSettings)
      ).toBeNull()
      expect(getErrorType("hòa", testDictionaries, defaultSettings)).toBeNull()
      expect(getErrorType("hoà", testDictionaries, defaultSettings)).toBeNull()
      expect(getErrorType("hóa", testDictionaries, defaultSettings)).toBeNull()
      expect(getErrorType("hoá", testDictionaries, defaultSettings)).toBeNull()
    })

    it("Tier 5: Fallback flags unknown words with foreign letters as NonVietnamese error", () => {
      const foreignErr = getErrorType(
        "unregistered_word_with_w",
        testDictionaries,
        defaultSettings
      )
      expect(foreignErr?.type).toBe("NonVietnamese")
    })
  })

  describe("2. Unicode Normalization (NFD -> NFC)", () => {
    it("correctly matches decomposed NFD Vietnamese words against NFC dictionary", () => {
      // "hòa" in NFD: "h" + "o" + \u0300 + "a"
      const nfdHoa = "ho\u0300a"
      expect(getErrorType(nfdHoa, testDictionaries, defaultSettings)).toBeNull()

      // "người" in NFD
      const nfdNguoi = "ngu\u031b\u01a1\u0300i".normalize("NFD")
      expect(
        getErrorType(nfdNguoi, testDictionaries, defaultSettings)
      ).toBeNull()
    })

    it("correctly matches accented foreign words in NFD format against non-VN dictionary", () => {
      // "café" with NFD é
      const nfdCafe = "cafe\u0301"
      expect(
        getErrorType(nfdCafe, testDictionaries, defaultSettings)
      ).toBeNull()
    })
  })

  describe("3. Dictionary Validator Strictness", () => {
    it("rejects typos and doubled chars in VN dictionary", () => {
      expect(validateDictionaryWord("vn", "aa").status).toBe("reject")
      expect(validateDictionaryWord("vn", "ee").status).toBe("reject")
      expect(validateDictionaryWord("vn", "uu").status).toBe("reject")
    })

    it("rejects Vietnamese diacritics in Non-VN dictionary", () => {
      expect(validateDictionaryWord("non-vn", "người").status).toBe("reject")
      expect(validateDictionaryWord("non-vn", "tiếng").status).toBe("reject")
      expect(validateDictionaryWord("non-vn", "đường").status).toBe("reject")
    })

    it("rejects laughter and onomatopoeia sound loops in Names dictionary", () => {
      expect(validateDictionaryWord("names", "hahaha").status).toBe("reject")
      expect(validateDictionaryWord("names", "hehehe").status).toBe("reject")
      expect(validateDictionaryWord("names", "Hừhừhừ").status).toBe("reject")
    })

    it("validates custom acronyms and terms properly", () => {
      expect(validateDictionaryWord("custom", "VIP").status).toBe("valid")
      expect(validateDictionaryWord("custom", "NASA").status).toBe("valid")
    })
  })

  describe("4. Cross-Dictionary Conflict Resolution Recommendation", () => {
    it("suggests VN dict for words with Vietnamese characters", () => {
      const conflictMap = {
        vn: ["cà-phê"],
        "non-vn": ["cà-phê"],
        names: [],
        custom: []
      }
      const res = detectCrossDictDuplicates(conflictMap)
      expect(res.findings.length).toBe(1)
      expect(res.findings[0].suggestion?.recommendedDict).toBe("vn")
    })

    it("suggests custom dict for uppercase acronyms appearing in other dicts", () => {
      const conflictMap = {
        vn: ["gps"],
        "non-vn": [],
        names: [],
        custom: ["GPS"]
      }
      const res = detectCrossDictDuplicates(conflictMap)
      expect(res.findings.length).toBe(1)
      expect(res.findings[0].suggestion?.recommendedDict).toBe("custom")
    })
  })
})
