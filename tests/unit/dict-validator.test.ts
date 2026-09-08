import { describe, expect, it } from "vitest"
import {
  isRepeatedUnit,
  validateBatchWords,
  validateDictionaryWord
} from "../../src/utils/dict-validator"

describe("Dictionary Validator (dict-validator.ts)", () => {
  describe("Vietnamese Dictionary (vn)", () => {
    it("rejects doubled single-char typos", () => {
      expect(validateDictionaryWord("vn", "aa").status).toBe("reject")
      expect(validateDictionaryWord("vn", "ee").status).toBe("reject")
      expect(validateDictionaryWord("vn", "ooo").status).toBe("reject")
    })

    it("warns on typo-ending patterns", () => {
      const res = validateDictionaryWord("vn", "quaa")
      expect(res.status).toBe("warning")
      expect(res.reason).toContain("dễ trùng lỗi gõ máy")
    })

    it("warns on foreign consonant in VN dict", () => {
      const res = validateDictionaryWord("vn", "wifi")
      expect(res.status).toBe("warning")
      expect(res.reason).toContain("phụ âm ngoại lai")
    })

    it("accepts valid Vietnamese words", () => {
      expect(validateDictionaryWord("vn", "chằng chịt").status).toBe("valid")
      expect(validateDictionaryWord("vn", "ngoằn ngoèo").status).toBe("valid")
      expect(validateDictionaryWord("vn", "yêu thương").status).toBe("valid")
    })
  })

  describe("Non-Vietnamese Dictionary (non-vn)", () => {
    it("rejects words with exclusive Vietnamese diacritics", () => {
      expect(validateDictionaryWord("non-vn", "tiếng").status).toBe("reject")
      expect(validateDictionaryWord("non-vn", "đường").status).toBe("reject")
      expect(validateDictionaryWord("non-vn", "bưởi").status).toBe("reject")
    })

    it("accepts standard foreign words and western loanwords", () => {
      expect(validateDictionaryWord("non-vn", "internet").status).toBe("valid")
      expect(validateDictionaryWord("non-vn", "smartphone").status).toBe(
        "valid"
      )
      expect(validateDictionaryWord("non-vn", "café").status).toBe("valid")
    })
  })

  describe("Names Dictionary (names)", () => {
    it("detects repeated units (onomatopoeia/laughter)", () => {
      expect(isRepeatedUnit("Hahaha")).toBe(true)
      expect(isRepeatedUnit("Hừhừhừhừ")).toBe(true)
      expect(validateDictionaryWord("names", "Hahaha").status).toBe("reject")
      expect(validateDictionaryWord("names", "Hừhừhừhừ").status).toBe("reject")
    })

    it("rejects merged footnote translation strings with VN diacritics", () => {
      const res = validateDictionaryWord("names", "SignorThưa")
      expect(res.status).toBe("reject")
      expect(res.reason).toContain("dịch thuật")
    })

    it("warns on standard TitleCase compound names (MacArthur)", () => {
      const res = validateDictionaryWord("names", "MacArthur")
      expect(res.status).toBe("warning")
    })

    it("accepts valid proper names", () => {
      expect(validateDictionaryWord("names", "Alexander").status).toBe("valid")
      expect(validateDictionaryWord("names", "Hà Nội").status).toBe("valid")
      expect(validateDictionaryWord("names", "Trần Hưng Đạo").status).toBe(
        "valid"
      )
    })
  })

  describe("validateBatchWords", () => {
    it("correctly separates valid, warning, and rejected words", () => {
      const input = [
        "chằng chịt",
        "aa",
        "quaa",
        "chằng chịt", // duplicate
        "ngoằn ngoèo"
      ]
      const result = validateBatchWords("vn", input)

      expect(result.valid).toEqual(["chằng chịt", "quaa", "ngoằn ngoèo"])
      expect(result.warnings.length).toBe(1)
      expect(result.warnings[0].word).toBe("quaa")
      expect(result.rejected.length).toBe(1)
      expect(result.rejected[0].word).toBe("aa")
    })
  })
})
