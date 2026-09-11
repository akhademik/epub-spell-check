import { describe, expect, it } from "vitest"
import {
  createCrossDictPairKey,
  type DictName,
  detectCrossDictDuplicates
} from "../../src/utils/dict-quality"

describe("Cross-Dictionary Duplicate & Overlap Audit", () => {
  it("detects exact duplicate words across multiple dictionaries", () => {
    const dictMap: Record<DictName, string[]> = {
      vn: ["sách", "bút", "anh"],
      names: ["Alexander", "Paris"],
      "non-vn": ["book", "pen", "anh"],
      custom: ["NASA", "UNESCO"]
    }

    const result = detectCrossDictDuplicates(dictMap)

    expect(result.findings.length).toBe(1)
    const finding = result.findings[0]
    expect(finding.lowerWord).toBe("anh")
    expect(finding.matchType).toBe("exact")
    expect(finding.occurrences.length).toBe(2)
    expect(finding.occurrences.map((o) => o.dictName)).toContain("vn")
    expect(finding.occurrences.map((o) => o.dictName)).toContain("non-vn")
    expect(finding.suggestion?.recommendedDict).toBe("vn")
  })

  it("detects case variation duplicates (e.g. AI vs ai, Oreo vs oreo)", () => {
    const dictMap: Record<DictName, string[]> = {
      vn: ["ai", "người"],
      names: ["John"],
      "non-vn": ["oreo", "apple"],
      custom: ["AI", "Oreo"]
    }

    const result = detectCrossDictDuplicates(dictMap)

    expect(result.findings.length).toBe(2)

    const aiFinding = result.findings.find((f) => f.lowerWord === "ai")
    expect(aiFinding).toBeDefined()
    expect(aiFinding?.matchType).toBe("case_variation")
    expect(aiFinding?.occurrences.map((o) => o.exactWord)).toContain("ai")
    expect(aiFinding?.occurrences.map((o) => o.exactWord)).toContain("AI")

    const oreoFinding = result.findings.find((f) => f.lowerWord === "oreo")
    expect(oreoFinding).toBeDefined()
    expect(oreoFinding?.matchType).toBe("case_variation")
    expect(oreoFinding?.occurrences.map((o) => o.exactWord)).toContain("oreo")
    expect(oreoFinding?.occurrences.map((o) => o.exactWord)).toContain("Oreo")
  })

  it("recommends VN dictionary when word contains Vietnamese diacritics", () => {
    const dictMap: Record<DictName, string[]> = {
      vn: ["cà-phê"],
      names: ["Cà-phê"],
      "non-vn": [],
      custom: []
    }

    const result = detectCrossDictDuplicates(dictMap)
    expect(result.findings.length).toBe(1)
    expect(result.findings[0].suggestion?.recommendedDict).toBe("vn")
    expect(result.findings[0].suggestion?.reason).toContain("tiếng Việt")
  })

  it("recommends Custom dictionary for uppercase acronyms", () => {
    const dictMap: Record<DictName, string[]> = {
      vn: [],
      names: ["Nasa"],
      "non-vn": ["nasa"],
      custom: ["NASA"]
    }

    const result = detectCrossDictDuplicates(dictMap)
    expect(result.findings.length).toBe(1)
    expect(result.findings[0].suggestion?.recommendedDict).toBe("custom")
    expect(result.findings[0].suggestion?.reason).toContain("viết tắt")
  })

  it("recommends Non-VN dictionary for lowercase common words overlapping with names", () => {
    const dictMap: Record<DictName, string[]> = {
      vn: [],
      names: ["Caterpillar"],
      "non-vn": ["caterpillar"],
      custom: []
    }

    const result = detectCrossDictDuplicates(dictMap)
    expect(result.findings.length).toBe(1)
    expect(result.findings[0].suggestion?.recommendedDict).toBe("non-vn")
  })

  it("ignores pairs when present in ignoredKeys set", () => {
    const dictMap: Record<DictName, string[]> = {
      vn: ["ai"],
      names: [],
      "non-vn": [],
      custom: ["AI"]
    }

    const ignoredKey = createCrossDictPairKey("ai", "vn", "custom")
    const ignored = new Set([ignoredKey])

    const result = detectCrossDictDuplicates(dictMap, ignored)
    expect(result.findings.length).toBe(0)
  })

  it("computes timing and dictionary stats properly", () => {
    const dictMap: Record<DictName, string[]> = {
      vn: ["từ1", "từ2"],
      names: ["Name1"],
      "non-vn": ["word1", "word2", "word3"],
      custom: ["Custom1"]
    }

    const result = detectCrossDictDuplicates(dictMap)
    expect(result.totalWordsScanned).toBe(7)
    expect(result.dictCounts.vn).toBe(2)
    expect(result.dictCounts.names).toBe(1)
    expect(result.dictCounts["non-vn"]).toBe(3)
    expect(result.dictCounts.custom).toBe(1)
    expect(result.timingMs).toBeGreaterThanOrEqual(0)
  })
})
