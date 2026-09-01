import { describe, expect, it } from "vitest"
import {
  deduplicateAndSort,
  formatMergeStats,
  mergeWords,
  parseDictMarkdown
} from "../../scripts/merge-dicts"

describe("merge-dicts utilities", () => {
  it("should parse markdown headers correctly with slash escapes and standard dashes", () => {
    const sampleMarkdown = `
\\---NAMES---
Caesar
Brutus

---NON-VN---
senatus
consul

\\---CUSTOM---
HTTPS
AI
`
    const parsed = parseDictMarkdown(sampleMarkdown)
    expect(parsed.NAMES).toEqual(["Caesar", "Brutus"])
    expect(parsed["NON-VN"]).toEqual(["senatus", "consul"])
    expect(parsed.CUSTOM).toEqual(["HTTPS", "AI"])
  })

  it("should deduplicate and sort in standard JS unicode code point order", () => {
    const words = ["Zeta", "alpha", "Beta", "alpha", "Á", "123", "Beta"]
    const sorted = deduplicateAndSort(words)
    expect(sorted).toEqual(["123", "Beta", "Zeta", "alpha", "Á"])
  })

  it("should merge words and compute accurate statistics", () => {
    const original = ["apple", "cherry"]
    const newEntries = ["banana", "cherry", "apple", "date", "banana"]

    const { result, stats } = mergeWords(
      original,
      newEntries,
      "public/test-dict.txt"
    )

    expect(result).toEqual(["apple", "banana", "cherry", "date"])
    expect(stats).toEqual({
      file: "public/test-dict.txt",
      beforeCount: 2,
      addedCount: 2, // banana, date
      duplicateRemovedCount: 3, // cherry (in orig & new), apple (in orig & new), banana (duplicate in new)
      afterCount: 4
    })
  })

  it("should format merge stats according to the MERGE_DICTS_WORKFLOW format", () => {
    const stats = [
      {
        file: "public/names-dict.txt",
        beforeCount: 100,
        addedCount: 5,
        duplicateRemovedCount: 2,
        afterCount: 103
      }
    ]

    const output = formatMergeStats(stats)
    expect(output).toBe(`public/names-dict.txt:
  - Số từ trước khi cập nhật: 100
  - Số từ mới được thêm: 5
  - Số từ trùng lặp bị loại bỏ: 2
  - Số từ sau khi cập nhật: 103`)
  })
})
