import { describe, expect, it } from "vitest"
import type { CheckSettings } from "../../src/types/analysis"
import type { Dictionaries } from "../../src/types/dictionary"
import type { ErrorGroup } from "../../src/types/errors"
import { getFilteredErrors } from "../../src/utils/filter"

describe("Filter Module", () => {
  const mockDictionaries: Dictionaries = {
    vietnamese: new Set(["người", "sách", "quà"]),
    nonVietnamese: new Set(["hello", "world", "paris"]),
    custom: new Set(["ATM", "VIP"])
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
})
