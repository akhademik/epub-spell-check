import { describe, expect, it } from "vitest"
import type { CheckSettings } from "../../src/types/analysis"
import type { Dictionaries } from "../../src/types/dictionary"
import type { ErrorGroup } from "../../src/types/errors"
import { getFilteredErrors } from "../../src/utils/filter"

describe("Filter Module", () => {
  const mockDictionaries: Dictionaries = {
    vietnamese: new Set(["người", "sách", "quà"]),
    nonVietnamese: new Set(["hello", "world", "paris"]),
    custom: new Set(["ATM", "VIP"]),
    names: new Set(["Alexander", "Parmenion"])
  }

  const defaultCheckSettings: CheckSettings = {
    vietnamese: true,
    nonVietnamese: true
  }

  const testGroups: ErrorGroup[] = [
    {
      id: "người-UnknownWord",
      word: "người",
      type: "UnknownWord",
      reason: "Không có trong từ điển tiếng Việt",
      count: 1,
      contexts: []
    },
    {
      id: "fjwz-NonVietnamese",
      word: "fjwz",
      type: "NonVietnamese",
      reason: "Từ lạ / Ngoại ngữ chưa có trong từ điển",
      count: 1,
      contexts: []
    },
    {
      id: "ATM-CaseError",
      word: "ATM",
      type: "CaseError",
      reason: "Lỗi viết hoa",
      count: 1,
      contexts: []
    }
  ]

  it("should filter out words present in whitelist", () => {
    const filtered = getFilteredErrors(
      testGroups,
      ["người"],
      defaultCheckSettings,
      mockDictionaries
    )
    expect(filtered.some((g) => g.word === "người")).toBe(false)
  })

  it("should filter out custom dictionary words (ATM) automatically", () => {
    const filtered = getFilteredErrors(
      testGroups,
      [],
      defaultCheckSettings,
      mockDictionaries
    )
    expect(filtered.some((g) => g.word === "ATM")).toBe(false)
  })

  it("should not filter out incorrectly cased custom words (e.g. ipad when custom is iPad)", () => {
    const customDicts: Dictionaries = {
      vietnamese: new Set(),
      nonVietnamese: new Set(),
      custom: new Set(["iPad"]),
      names: new Set()
    }
    const groups: ErrorGroup[] = [
      {
        id: "ipad-UnknownWord",
        word: "ipad",
        type: "UnknownWord",
        reason: "Không có trong VN dict",
        count: 1,
        contexts: []
      }
    ]
    const filtered = getFilteredErrors(
      groups,
      [],
      defaultCheckSettings,
      customDicts
    )
    expect(filtered.some((g) => g.word === "ipad")).toBe(true)
  })

  it("should filter out Vietnamese errors when Vietnamese check is toggled OFF", () => {
    const withoutVN = getFilteredErrors(
      testGroups,
      [],
      { vietnamese: false, nonVietnamese: true },
      mockDictionaries
    )
    expect(withoutVN.some((g) => g.type === "UnknownWord")).toBe(false)
    expect(withoutVN.some((g) => g.type === "NonVietnamese")).toBe(true)
  })

  it("should filter out Non-Vietnamese errors when Non-Vietnamese check is toggled OFF", () => {
    const withoutForeign = getFilteredErrors(
      testGroups,
      [],
      { vietnamese: true, nonVietnamese: false },
      mockDictionaries
    )
    expect(withoutForeign.some((g) => g.type === "NonVietnamese")).toBe(false)
  })

  it("should filter out errors whose type is not in enabledTypes", () => {
    const onlyTypoAndDict = getFilteredErrors(
      testGroups,
      [],
      defaultCheckSettings,
      mockDictionaries,
      new Set(["UnknownWord"])
    )
    expect(onlyTypoAndDict.some((g) => g.type === "UnknownWord")).toBe(true)
    expect(onlyTypoAndDict.some((g) => g.type === "NonVietnamese")).toBe(false)
    expect(onlyTypoAndDict.some((g) => g.type === "CaseError")).toBe(false)
  })

  it("should return empty array when enabledTypes is empty", () => {
    const noneEnabled = getFilteredErrors(
      testGroups,
      [],
      defaultCheckSettings,
      mockDictionaries,
      new Set()
    )
    expect(noneEnabled).toEqual([])
  })

  it("should filter for SpecialCharacter and all standard error types correctly", () => {
    const allTypeGroups: ErrorGroup[] = [
      {
        id: "1",
        word: "từ",
        type: "UnknownWord",
        reason: "dict",
        count: 1,
        contexts: []
      },
      {
        id: "2",
        word: "foreign",
        type: "NonVietnamese",
        reason: "non-vn",
        count: 1,
        contexts: []
      },
      {
        id: "3",
        word: "sÁch",
        type: "CaseError",
        reason: "upper",
        count: 1,
        contexts: []
      },
      {
        id: "4",
        word: "nghiêng",
        type: "Spelling",
        reason: "spelling",
        count: 1,
        contexts: []
      },
      {
        id: "5",
        word: "test@#$",
        type: "SpecialCharacter",
        reason: "spec",
        count: 1,
        contexts: []
      }
    ]

    const onlySpecial = getFilteredErrors(
      allTypeGroups,
      [],
      defaultCheckSettings,
      mockDictionaries,
      new Set(["SpecialCharacter"])
    )
    expect(onlySpecial).toHaveLength(1)
    expect(onlySpecial[0].type).toBe("SpecialCharacter")
    expect(onlySpecial[0].word).toBe("test@#$")
  })

  it("should apply enabledTypes interaction together with checkSettings correctly", () => {
    const mixedGroups: ErrorGroup[] = [
      {
        id: "1",
        word: "từ1",
        type: "UnknownWord",
        reason: "dict",
        count: 1,
        contexts: []
      },
      {
        id: "2",
        word: "spelling1",
        type: "Spelling",
        reason: "spelling",
        count: 1,
        contexts: []
      },
      {
        id: "3",
        word: "foreign1",
        type: "NonVietnamese",
        reason: "foreign",
        count: 1,
        contexts: []
      }
    ]

    // Case 1: enabledTypes has UnknownWord + Spelling, but vietnamese check is OFF
    // Expected: [] because UnknownWord & Spelling are Vietnamese categories
    const withoutVN = getFilteredErrors(
      mixedGroups,
      [],
      { vietnamese: false, nonVietnamese: true },
      mockDictionaries,
      new Set(["UnknownWord", "Spelling"])
    )
    expect(withoutVN).toEqual([])

    // Case 2: enabledTypes has NonVietnamese, but nonVietnamese check is OFF
    const withoutNonVN = getFilteredErrors(
      mixedGroups,
      [],
      { vietnamese: true, nonVietnamese: false },
      mockDictionaries,
      new Set(["NonVietnamese"])
    )
    expect(withoutNonVN).toEqual([])

    // Case 3: enabledTypes has NonVietnamese + Spelling, with nonVietnamese check OFF
    // Expected: only Spelling remains
    const spellingOnly = getFilteredErrors(
      mixedGroups,
      [],
      { vietnamese: true, nonVietnamese: false },
      mockDictionaries,
      new Set(["NonVietnamese", "Spelling"])
    )
    expect(spellingOnly).toHaveLength(1)
    expect(spellingOnly[0].type).toBe("Spelling")
  })

  it("should handle storage serialization/deserialization for enabledErrorTypes with schema envelope", () => {
    const STORAGE_KEY = "spell-check:enabled-error-types"
    const mockStorage: Record<string, string> = {}

    // Mock localStorage
    const setItem = (k: string, v: string) => {
      mockStorage[k] = v
    }
    const getItem = (k: string) => mockStorage[k] || null

    const initialTypes = ["UnknownWord", "Spelling", "CaseError"]
    const envelope = {
      version: 1,
      data: initialTypes
    }
    setItem(STORAGE_KEY, JSON.stringify(envelope))

    // Read back
    const raw = getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.version).toBe(1)
    expect(parsed.data).toEqual(["UnknownWord", "Spelling", "CaseError"])

    // Verify Set reconstitution
    const reconstructedSet = new Set(parsed.data)
    expect(reconstructedSet.has("UnknownWord")).toBe(true)
    expect(reconstructedSet.has("Spelling")).toBe(true)
    expect(reconstructedSet.has("CaseError")).toBe(true)
    expect(reconstructedSet.has("NonVietnamese")).toBe(false)
  })

  it("should sanitize and filter out invalid/corrupted error types from storage with fallback", () => {
    const ALL_ERROR_TYPES: string[] = [
      "UnknownWord",
      "NonVietnamese",
      "CaseError",
      "Spelling",
      "SpecialCharacter"
    ]
    const corruptedSavedTypes: unknown[] = [
      "UnknownWord",
      "Spelling",
      "FakeType",
      "UnknownType",
      123,
      null
    ]

    const sanitized = corruptedSavedTypes.filter(
      (type): type is string =>
        typeof type === "string" && ALL_ERROR_TYPES.includes(type)
    )

    const sanitizedSet = new Set(sanitized)
    expect(sanitizedSet.size).toBe(2)
    expect(sanitizedSet.has("UnknownWord")).toBe(true)
    expect(sanitizedSet.has("Spelling")).toBe(true)
    expect(sanitizedSet.has("FakeType")).toBe(false)

    // Test all-invalid fallback to ALL_ERROR_TYPES
    const allInvalid: unknown[] = ["FakeType1", "FakeType2", 999]
    const valid = allInvalid.filter(
      (type): type is string =>
        typeof type === "string" && ALL_ERROR_TYPES.includes(type)
    )
    const initial = valid.length > 0 ? valid : ALL_ERROR_TYPES
    expect(initial).toEqual(ALL_ERROR_TYPES)
  })
})
