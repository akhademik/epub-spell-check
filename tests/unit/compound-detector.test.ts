import { describe, expect, it } from "vitest"
import type { Dictionaries } from "../../src/types/dictionary"
import type { ErrorInstance } from "../../src/types/errors"
import {
  buildCompoundIndex,
  resolveOverlappingErrors,
  scanDynamicCompoundErrors
} from "../../src/utils/compound-detector"
import { scanContextualErrors } from "../../src/utils/context-confusion"

describe("Underthesea Compound Detector & Overlap Resolution", () => {
  const sampleCompounds = [
    "nghiêm trọng",
    "phát triển",
    "an cư lạc nghiệp",
    "sáp nhập",
    "chẩn đoán",
    "kinh tế thị trường",
    "bác sĩ",
    "bệnh nhân",
    "bàn là",
    "bàn đầu"
  ]

  const compoundIndex = buildCompoundIndex(sampleCompounds)

  const mockDictionaries: Dictionaries = {
    vietnamese: new Set([
      "nghiên",
      "trọng",
      "nghiêm",
      "phát",
      "triển",
      "bệnh",
      "nhân",
      "tình",
      "trạng",
      "rất",
      "an",
      "cư",
      "lạc",
      "nghiêp",
      "nghiệp",
      "kinh",
      "tế",
      "thị",
      "trường",
      "sáp",
      "sát",
      "nhập",
      "ông",
      "trời",
      "đã",
      "chọn",
      "bạn",
      "là",
      "người",
      "may",
      "mắn",
      "lại",
      "ngồi",
      "bàn",
      "đầu"
    ]),
    nonVietnamese: new Set(["covid"]),
    custom: new Set(["AI"]),
    names: new Set(["Alexander", "Minh"])
  }

  // Case 1 — basic compound typo: "nghiên trọng" -> "nghiêm trọng"
  it("Case 1: detects basic 2-word compound typo 'nghiên trọng' -> 'nghiêm trọng'", () => {
    const text = "Tình trạng bệnh rất nghiên trọng."
    const errors = scanDynamicCompoundErrors(
      text,
      compoundIndex,
      { paragraphIndex: 0 },
      mockDictionaries
    )

    expect(errors.length).toBe(1)
    expect(errors[0].word).toBe("nghiên trọng")
    expect(errors[0].type).toBe("ContextConfusion")
    expect(errors[0].suggestions).toContain("nghiêm trọng")
  })

  // Case 2 — both individual words valid
  it("Case 2: flags compound error even though both 'nghiên' and 'trọng' exist in vietnamese dictionary", () => {
    const text = "Họ nghiên trọng vấn đề."
    const errors = scanDynamicCompoundErrors(
      text,
      compoundIndex,
      { paragraphIndex: 0 },
      mockDictionaries
    )
    expect(errors.some((e) => e.word === "nghiên trọng")).toBe(true)
  })

  // Case 3 — correctly written compound not flagged
  it("Case 3: does not flag correctly written compound 'nghiêm trọng'", () => {
    const text = "Tình trạng bệnh rất nghiêm trọng."
    const errors = scanDynamicCompoundErrors(
      text,
      compoundIndex,
      { paragraphIndex: 0 },
      mockDictionaries
    )
    expect(errors.length).toBe(0)
  })

  // Case 4 — Curated CONFUSABLE_RULES priority over dynamic compounds
  it("Case 4: skips compound detector when phrase is already handled by curated CONFUSABLE_RULES", () => {
    // "sát nhập" is in CONFUSABLE_RULES -> should not create duplicate or conflicting compound error
    const text = "Hai công ty quyết định sát nhập vào cuối năm."
    const curatedErrors = scanContextualErrors(text, { paragraphIndex: 0 })
    const compoundErrors = scanDynamicCompoundErrors(
      text,
      compoundIndex,
      { paragraphIndex: 0 },
      mockDictionaries
    )

    // Curated rules handle it
    expect(curatedErrors.length).toBeGreaterThan(0)
    expect(curatedErrors[0].suggestions).toContain("sáp nhập")
    // Dynamic compound detector yields to curated rules
    expect(compoundErrors.length).toBe(0)
  })

  // Case 5 — Exemption for custom words
  it("Case 5: does not flag phrases containing custom dictionary words", () => {
    const text = "Công nghệ AI phát triển nhanh chóng."
    const errors = scanDynamicCompoundErrors(
      text,
      compoundIndex,
      { paragraphIndex: 0 },
      mockDictionaries
    )
    expect(errors.length).toBe(0)
  })

  // Case 6 — Exemption for proper names
  it("Case 6: does not flag phrases containing proper names", () => {
    const text = "Minh phát triển ứng dụng này."
    const errors = scanDynamicCompoundErrors(
      text,
      compoundIndex,
      { paragraphIndex: 0 },
      mockDictionaries
    )
    expect(errors.length).toBe(0)
  })

  // Case 7 — Natural unknown phrases that are NOT typos should NOT be flagged
  it("Case 7: does not flag natural phrases that have no close candidate typo in lexicon", () => {
    const text = "Mặt trời mọc ở hướng đông."
    const errors = scanDynamicCompoundErrors(
      text,
      compoundIndex,
      { paragraphIndex: 0 },
      mockDictionaries
    )
    expect(errors.length).toBe(0)
  })

  // Case 8 — Overlap resolution: suppress token error inside compound error
  it("Case 8: resolves overlapping token-level errors when a compound error is detected", () => {
    const tokenError: ErrorInstance = {
      id: "0-20-25-tok",
      word: "nghiên",
      originalWord: "nghiên",
      type: "Spelling",
      reason: "Possible typo",
      suggestions: ["nghiêm"],
      context: {
        originalParagraph: "Tình trạng bệnh rất nghiên trọng.",
        startIndex: 20,
        endIndex: 25,
        matchIndex: 20,
        chapterIndex: 0,
        paragraphIndex: 0
      }
    }

    const compoundError: ErrorInstance = {
      id: "0-20-31-cmp",
      word: "nghiên trọng",
      originalWord: "nghiên trọng",
      type: "ContextConfusion",
      reason: "Gợi ý từ ghép",
      suggestions: ["nghiêm trọng"],
      context: {
        originalParagraph: "Tình trạng bệnh rất nghiên trọng.",
        startIndex: 20,
        endIndex: 31,
        matchIndex: 20,
        chapterIndex: 0,
        paragraphIndex: 0
      }
    }

    const resolved = resolveOverlappingErrors([tokenError, compoundError])
    expect(resolved.length).toBe(1)
    expect(resolved[0].type).toBe("ContextConfusion")
    expect(resolved[0].word).toBe("nghiên trọng")
  })

  // Case 9 — 4-word compound typo detection
  it("Case 9: detects 4-word compound typo sharing 3 unchanged tokens", () => {
    const text = "Gia đình muốn an cư lạc nghiêp nơi đây."
    const errors = scanDynamicCompoundErrors(
      text,
      compoundIndex,
      { paragraphIndex: 0 },
      mockDictionaries
    )
    expect(errors.length).toBe(1)
    expect(errors[0].word).toBe("an cư lạc nghiêp")
    expect(errors[0].suggestions).toContain("an cư lạc nghiệp")
  })

  // Case 10 — Unicode NFC normalization
  it("Case 10: correctly matches and normalizes Unicode decomposed NFD text", () => {
    const nfdText = "Tình trạng rất nghiên trọng.".normalize("NFD")
    const errors = scanDynamicCompoundErrors(
      nfdText,
      compoundIndex,
      { paragraphIndex: 0 },
      mockDictionaries
    )
    expect(errors.length).toBe(1)
    expect(errors[0].word.normalize("NFC")).toBe("nghiên trọng")
    expect(errors[0].suggestions).toContain("nghiêm trọng")
  })

  // Case 11 — Critical false positive prevention: "bạn là" -> "bàn là"
  it("Case 11: does NOT flag grammatical pattern 'bạn là' as 'bàn là'", () => {
    const text = "Ông trời đã chọn bạn là người may mắn."
    const errors = scanDynamicCompoundErrors(
      text,
      compoundIndex,
      { paragraphIndex: 0 },
      mockDictionaries
    )
    expect(errors.length).toBe(0)
  })

  // Case 12 — Exact compound protection: "bàn đầu"
  it("Case 12: does NOT flag valid compound 'bàn đầu'", () => {
    const text = "Minh lại ngồi bàn đầu."
    const errors = scanDynamicCompoundErrors(
      text,
      compoundIndex,
      { paragraphIndex: 0 },
      mockDictionaries
    )
    expect(errors.length).toBe(0)
  })
})
