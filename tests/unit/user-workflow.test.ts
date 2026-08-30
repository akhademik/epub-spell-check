import { describe, expect, it } from "vitest"
import type { CheckSettings } from "../../src/types/analysis"
import type { Dictionaries } from "../../src/types/dictionary"
import type { ErrorInstance } from "../../src/types/errors"
import { getErrorType } from "../../src/utils/analysis-core"
import { findSuggestions, groupErrors } from "../../src/utils/analyzer"
import { getFilteredErrors } from "../../src/utils/filter"

describe("Comprehensive User Action Simulation", () => {
  const mockDictionaries: Dictionaries = {
    vietnamese: new Set([
      "tôi",
      "đi",
      "rút",
      "tiền",
      "ở",
      "cây",
      "tại",
      "người",
      "bạn",
      "mua",
      "một",
      "món",
      "quà",
      "xinh",
      "xắn",
      "này",
      "rất",
      "đẹp",
      "và",
      "ý",
      "nghĩa",
      "việt",
      "nam",
      "quê",
      "hương",
      "sách",
      "học",
      "khoa",
      "toán",
      "hòa",
      "hoà",
      "hóa",
      "hoá"
    ]),
    nonVietnamese: new Set([
      "hello",
      "world",
      "paris",
      "bonjour",
      "english",
      "french"
    ]),
    custom: new Set(["ATM", "VIP", "DNA", "GPS"])
  }

  const initialCheckSettings: CheckSettings = {
    vietnamese: true,
    nonVietnamese: true
  }

  it("Simulates User Flow: Upload, Error Exploration, Instance Navigation, Quick Ignore, Check Toggles, Export", () => {
    // 1. User loads a simulated book with multiple paragraphs (including typo 'tòong')
    const paragraphs = [
      "tÔi đi rút tiền ở cây ATM tại Paris.",
      "Người bạn mua một món quà xinh xắn.",
      "hòa bình và hoà thuận luôn đi cùng nhau.",
      "ViỆt Nam quê hương tôi.",
      "Đoạn này có từ tòong và từ lạ xyzabc."
    ]

    const rawErrors: ErrorInstance[] = []
    let totalWords = 0

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const text = paragraphs[pIdx]
      const words = text.split(/[\s,.]+/)
      for (const w of words) {
        if (!w) continue
        totalWords++
        const err = getErrorType(w, mockDictionaries, initialCheckSettings)
        if (err) {
          rawErrors.push({
            word: w,
            originalWord: w,
            type: err.type,
            reason: err.reason,
            context: {
              originalParagraph: text,
              startIndex: text.indexOf(w),
              endIndex: text.indexOf(w) + w.length,
              matchIndex: text.indexOf(w),
              chapterIndex: 0,
              paragraphIndex: pIdx
            }
          })
        }
      }
    }

    expect(totalWords).toBeGreaterThan(15)
    const allDetectedErrors = groupErrors(rawErrors)

    // "hòa" and "hoà" should NOT be flagged as tone errors
    expect(allDetectedErrors.some((g) => g.word === "hòa")).toBe(false)
    expect(allDetectedErrors.some((g) => g.word === "hoà")).toBe(false)

    // "ATM" and "Paris" are in custom & non-Vietnamese dicts, so NOT flagged
    expect(allDetectedErrors.some((g) => g.word === "ATM")).toBe(false)
    expect(allDetectedErrors.some((g) => g.word === "Paris")).toBe(false)

    // "tòong" MUST be flagged as an error (it is not in vn-dict)
    expect(allDetectedErrors.some((g) => g.word === "tòong")).toBe(true)

    // "tÔi" and "ViỆt" (Uppercase errors) and "xyzabc" (Unknown foreign/non-Vietnamese word)
    expect(allDetectedErrors.some((g) => g.word === "tÔi")).toBe(true)
    expect(allDetectedErrors.some((g) => g.word === "ViỆt")).toBe(true)
    expect(allDetectedErrors.some((g) => g.word === "xyzabc")).toBe(true)

    // 2. User inspects the error list
    const toongGroup = allDetectedErrors.find((g) => g.word === "tòong")
    expect(toongGroup).toBeDefined()
    expect(toongGroup?.type).toBe("Dictionary")

    // 3. User views suggestions
    const suggestions = findSuggestions("xyzabc", mockDictionaries)
    expect(Array.isArray(suggestions)).toBe(true)

    // 4. User adds "tÔi" to Whitelist (Quick Ignore action)
    let whitelist: string[] = []
    whitelist = [...whitelist, "tÔi"]

    const filtered = getFilteredErrors(
      allDetectedErrors,
      whitelist,
      initialCheckSettings,
      mockDictionaries
    )
    expect(filtered.some((g) => g.word === "tÔi")).toBe(false)
    expect(filtered.some((g) => g.word === "ViỆt")).toBe(true)
    expect(filtered.some((g) => g.word === "tòong")).toBe(true)

    // 5. User exports remaining errors in direct text list format
    const exportedErrors = filtered.map((g) => g.word).join("\n")
    expect(exportedErrors).toContain("tòong")
    expect(exportedErrors).toContain("ViỆt")
    expect(exportedErrors).not.toContain("tÔi")
  })
})
