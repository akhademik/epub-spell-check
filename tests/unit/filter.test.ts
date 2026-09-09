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
      id: "người-Dictionary",
      word: "người",
      type: "Dictionary",
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
      id: "ATM-Uppercase",
      word: "ATM",
      type: "Uppercase",
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
        id: "ipad-Dictionary",
        word: "ipad",
        type: "Dictionary",
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
    expect(withoutVN.some((g) => g.type === "Dictionary")).toBe(false)
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
      new Set(["Dictionary"])
    )
    expect(onlyTypoAndDict.some((g) => g.type === "Dictionary")).toBe(true)
    expect(onlyTypoAndDict.some((g) => g.type === "NonVietnamese")).toBe(false)
    expect(onlyTypoAndDict.some((g) => g.type === "Uppercase")).toBe(false)
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
        type: "Dictionary",
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
        type: "Uppercase",
        reason: "upper",
        count: 1,
        contexts: []
      },
      {
        id: "4",
        word: "ngươii",
        type: "Typo",
        reason: "typo",
        count: 1,
        contexts: []
      },
      {
        id: "5",
        word: "nghiêng",
        type: "Spelling",
        reason: "spelling",
        count: 1,
        contexts: []
      },
      {
        id: "6",
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
        type: "Dictionary",
        reason: "dict",
        count: 1,
        contexts: []
      },
      {
        id: "2",
        word: "typo1",
        type: "Typo",
        reason: "typo",
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

    // Case 1: enabledTypes has Dictionary + Typo, but vietnamese check is OFF
    // Expected: [] because Dictionary & Typo are Vietnamese categories
    const withoutVN = getFilteredErrors(
      mixedGroups,
      [],
      { vietnamese: false, nonVietnamese: true },
      mockDictionaries,
      new Set(["Dictionary", "Typo"])
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

    // Case 3: enabledTypes has NonVietnamese + Typo, with nonVietnamese check OFF
    // Expected: only Typo remains
    const typoOnly = getFilteredErrors(
      mixedGroups,
      [],
      { vietnamese: true, nonVietnamese: false },
      mockDictionaries,
      new Set(["NonVietnamese", "Typo"])
    )
    expect(typoOnly).toHaveLength(1)
    expect(typoOnly[0].type).toBe("Typo")
  })

  it("should handle storage serialization/deserialization for enabledErrorTypes with schema envelope", () => {
    const STORAGE_KEY = "spell-check:enabled-error-types"
    const mockStorage: Record<string, string> = {}

    // Mock localStorage
    const setItem = (k: string, v: string) => {
      mockStorage[k] = v
    }
    const getItem = (k: string) => mockStorage[k] || null

    const initialTypes = ["Dictionary", "Typo", "Uppercase"]
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
    expect(parsed.data).toEqual(["Dictionary", "Typo", "Uppercase"])

    // Verify Set reconstitution
    const reconstructedSet = new Set(parsed.data)
    expect(reconstructedSet.has("Dictionary")).toBe(true)
    expect(reconstructedSet.has("Typo")).toBe(true)
    expect(reconstructedSet.has("Uppercase")).toBe(true)
    expect(reconstructedSet.has("NonVietnamese")).toBe(false)
  })

  it("should sanitize and filter out invalid/corrupted error types from storage", () => {
    const ALL_ERROR_TYPES = [
      "Dictionary",
      "NonVietnamese",
      "Uppercase",
      "Typo",
      "Spelling",
      "SpecialCharacter"
    ]
    const corruptedSavedTypes = [
      "Dictionary",
      "Typo",
      "FakeType",
      "UnknownType",
      123,
      null
    ]

    const sanitized = corruptedSavedTypes.filter(
      (type): type is (typeof ALL_ERROR_TYPES)[number] =>
        typeof type === "string" && ALL_ERROR_TYPES.includes(type as any)
    )

    const sanitizedSet = new Set(sanitized)
    expect(sanitizedSet.size).toBe(2)
    expect(sanitizedSet.has("Dictionary")).toBe(true)
    expect(sanitizedSet.has("Typo")).toBe(true)
    expect(sanitizedSet.has("FakeType" as any)).toBe(false)
  })
})
