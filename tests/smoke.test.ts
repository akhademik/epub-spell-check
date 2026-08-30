import { describe, expect, it } from "vitest"
import type { CheckSettings } from "../src/types/analysis"
import type { Dictionaries } from "../src/types/dictionary"
import type { ErrorInstance } from "../src/types/errors"
import { getErrorType } from "../src/utils/analysis-core"
import { findSuggestions, groupErrors } from "../src/utils/analyzer"
import { getFilteredErrors } from "../src/utils/filter"

describe("Smoke Tests — Critical Path Workflows", () => {
  const mockDictionaries: Dictionaries = {
    vietnamese: new Set([
      "tôi",
      "đi",
      "rút",
      "tiền",
      "ở",
      "cây",
      "và",
      "mua",
      "món",
      "quà",
      "từ",
      "người",
      "việt",
      "sách",
      "học",
      "trường",
      "đọc",
      "viết",
      "hòa",
      "hoà"
    ]),
    nonVietnamese: new Set([
      "english",
      "french",
      "hello",
      "bonjour",
      "world",
      "book",
      "paris"
    ]),
    custom: new Set(["ATM", "VIP", "DNA", "GPS", "NASA"])
  }

  const defaultCheckSettings: CheckSettings = {
    vietnamese: true,
    nonVietnamese: true
  }

  it("Smoke 1: Text analysis with simultaneous dictionaries and categorized check rules", () => {
    const sampleText =
      "tÔi đi rút tiền ở cây ATM và mua món quà từ Paris hello hòa bình hoà thuận fqzw tòong"
    const words = sampleText.split(/\s+/)
    const errors: ErrorInstance[] = []

    for (const w of words) {
      const err = getErrorType(w, mockDictionaries, defaultCheckSettings)
      if (err) {
        errors.push({
          word: w,
          originalWord: w,
          type: err.type,
          reason: err.reason,
          context: {
            originalParagraph: sampleText,
            startIndex: sampleText.indexOf(w),
            endIndex: sampleText.indexOf(w) + w.length,
            matchIndex: sampleText.indexOf(w),
            chapterIndex: 0,
            paragraphIndex: 0
          }
        })
      }
    }

    const grouped = groupErrors(errors)

    // ATM, Paris, hello are known in custom & non-Vietnamese dicts -> NOT errors
    expect(grouped.some((g) => g.word === "ATM")).toBe(false)
    expect(grouped.some((g) => g.word === "Paris")).toBe(false)
    expect(grouped.some((g) => g.word === "hello")).toBe(false)

    // hòa and hoà are both valid Vietnamese words -> NOT errors
    expect(grouped.some((g) => g.word === "hòa")).toBe(false)
    expect(grouped.some((g) => g.word === "hoà")).toBe(false)

    // tòong should be flagged as Dictionary error
    expect(
      grouped.some((g) => g.word === "tòong" && g.type === "Dictionary")
    ).toBe(true)

    // tÔi should be flagged as Uppercase error
    expect(
      grouped.some((g) => g.word === "tÔi" && g.type === "Uppercase")
    ).toBe(true)

    // fqzw should be flagged as NonVietnamese error
    expect(
      grouped.some((g) => g.word === "fqzw" && g.type === "NonVietnamese")
    ).toBe(true)
  })

  it("Smoke 2: Check toggles dynamic re-filtering", () => {
    const sampleErrors: ErrorInstance[] = [
      {
        word: "tòong",
        originalWord: "tòong",
        type: "Dictionary",
        reason: "Không có trong từ điển tiếng Việt",
        context: {
          originalParagraph: "tòong",
          startIndex: 0,
          endIndex: 5,
          matchIndex: 0,
          chapterIndex: 0,
          paragraphIndex: 0
        }
      },
      {
        word: "fqzw",
        originalWord: "fqzw",
        type: "NonVietnamese",
        reason: "Từ lạ / Ngoại ngữ",
        context: {
          originalParagraph: "fqzw",
          startIndex: 0,
          endIndex: 4,
          matchIndex: 0,
          chapterIndex: 0,
          paragraphIndex: 0
        }
      }
    ]

    const grouped = groupErrors(sampleErrors)

    // Both on:
    const filteredAllOn = getFilteredErrors(
      grouped,
      [],
      { vietnamese: true, nonVietnamese: true },
      mockDictionaries
    )
    expect(filteredAllOn.length).toBe(2)

    // Vietnamese check toggled OFF:
    const filteredVnOff = getFilteredErrors(
      grouped,
      [],
      { vietnamese: false, nonVietnamese: true },
      mockDictionaries
    )
    expect(filteredVnOff.some((g) => g.type === "Dictionary")).toBe(false)
    expect(filteredVnOff.some((g) => g.type === "NonVietnamese")).toBe(true)

    // Non-Vietnamese check toggled OFF:
    const filteredNonVnOff = getFilteredErrors(
      grouped,
      [],
      { vietnamese: true, nonVietnamese: false },
      mockDictionaries
    )
    expect(filteredNonVnOff.some((g) => g.type === "NonVietnamese")).toBe(false)
    expect(filteredNonVnOff.some((g) => g.type === "Dictionary")).toBe(true)
  })

  it("Smoke 3: Whitelist addition and removal flow", () => {
    const grouped = groupErrors([
      {
        word: "tòong",
        originalWord: "tòong",
        type: "Dictionary",
        reason: "Không có trong từ điển tiếng Việt",
        context: {
          originalParagraph: "tòong",
          startIndex: 0,
          endIndex: 5,
          matchIndex: 0,
          chapterIndex: 0,
          paragraphIndex: 0
        }
      }
    ])

    // Before whitelist
    let filtered = getFilteredErrors(
      grouped,
      [],
      defaultCheckSettings,
      mockDictionaries
    )
    expect(filtered.length).toBe(1)

    // After adding to whitelist
    filtered = getFilteredErrors(
      grouped,
      ["tòong"],
      defaultCheckSettings,
      mockDictionaries
    )
    expect(filtered.length).toBe(0)
  })

  it("Smoke 4: Suggestions generation", () => {
    const suggs = findSuggestions("sách", mockDictionaries)
    expect(Array.isArray(suggs)).toBe(true)
  })
})
