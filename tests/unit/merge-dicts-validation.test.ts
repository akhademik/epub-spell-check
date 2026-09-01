import { describe, expect, it } from "vitest"
import { validateEntry, validateSection } from "../../scripts/merge-dicts"

// Regression fixtures: real pollution found during the 2026-09 dict audit.
// If any of these ever stop being rejected, that's a silent regression in
// the validator, not a sign the rule should be loosened.

describe("validateEntry — VN section", () => {
  it("rejects doubled-single-character tokens (defeats the app's typo detector)", () => {
    for (const w of [
      "aa",
      "ee",
      "oo",
      "dd",
      "ii",
      "uu",
      "ăă",
      "đđ",
      "ơơ",
      "ưư"
    ]) {
      const result = validateEntry("VN", w)
      expect(result?.reject).toBe(true)
    }
  })

  it("does not reject ordinary short Vietnamese words", () => {
    for (const w of ["chào", "là", "được", "à", "ừ"]) {
      expect(validateEntry("VN", w)).toBeNull()
    }
  })

  it("warns (but does not reject) real words that happen to match the typo-ending shape", () => {
    // "free" and "shopee" are real loanwords already living in vn-dict.txt;
    // the validator should surface them for a human to confirm, not silently
    // drop legitimate words.
    const result = validateEntry("VN", "shopee")
    expect(result).not.toBeNull()
    expect(result?.reject).toBe(false)
  })
})

describe("validateEntry — NON-VN section", () => {
  it("rejects entries containing Vietnamese-exclusive diacritics", () => {
    for (const w of ["brừm", "tĩnhở", "ờm", "rađiô"]) {
      const result = validateEntry("NON-VN", w)
      expect(result?.reject).toBe(true)
    }
  })

  it("does not reject genuine foreign words, including ones with shared French diacritics", () => {
    for (const w of ["hello", "être", "grâce", "café"]) {
      expect(validateEntry("NON-VN", w)).toBeNull()
    }
  })
})

describe("validateEntry — NAMES section", () => {
  it("rejects Title-Case-merge artifacts that mix in Vietnamese fragments", () => {
    for (const w of [
      "BienĐược",
      "BonTốt",
      "SignorThưa",
      "MessieursThưa",
      "VoilàThế",
      "ĐiệnCapitol"
    ]) {
      const result = validateEntry("NAMES", w)
      expect(result?.reject).toBe(true)
    }
  })

  it("rejects onomatopoeia / repeated-unit patterns miscategorized as names", () => {
    for (const w of ["Hahaha", "Hàhàhà", "Hừhừhừhừ"]) {
      const result = validateEntry("NAMES", w)
      expect(result?.reject).toBe(true)
    }
  })

  it("keeps legitimate Title-Case compound names, but flags them for human review", () => {
    for (const w of ["MacArthur", "LeBron", "McCartney", "GoPro", "FaceTime"]) {
      const result = validateEntry("NAMES", w)
      expect(result).not.toBeNull()
      expect(result?.reject).toBe(false)
    }
  })

  it("does not touch ordinary single-word names", () => {
    for (const w of ["Paris", "Nguyễn", "Einstein"]) {
      expect(validateEntry("NAMES", w)).toBeNull()
    }
  })
})

describe("validateSection", () => {
  it("splits a batch into clean / rejected / warnings and keeps all warned words in `clean`", () => {
    const { clean, rejected, warnings } = validateSection("NAMES", [
      "Paris",
      "BienĐược",
      "MacArthur",
      "Hahaha"
    ])
    expect(clean.sort()).toEqual(["MacArthur", "Paris"].sort())
    expect(rejected.map((r) => r.word)).toEqual(
      expect.arrayContaining(["BienĐược", "Hahaha"])
    )
    expect(warnings.map((w) => w.word)).toEqual(["MacArthur"])
  })
})
