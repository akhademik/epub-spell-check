import { describe, expect, it } from "vitest"
import {
  auditDictionary,
  createPairKey,
  detectFuzzyDuplicates,
  getVowelRatio,
  scanDictionaryCrossReference,
  scanDictionaryForGarbage
} from "../../src/utils/dict-quality"

describe("Dictionary Quality & Garbage Detection Module", () => {
  describe("getVowelRatio", () => {
    it("calculates ratio correctly for Vietnamese and English words", () => {
      expect(getVowelRatio("người")).toBeCloseTo(3 / 5)
      expect(getVowelRatio("apple")).toBeCloseTo(2 / 5)
      expect(getVowelRatio("rhythm")).toBeCloseTo(1 / 6) // y is counted as vowel
      expect(getVowelRatio("bcdfg")).toBe(0)
    })
  })

  describe("scanDictionaryForGarbage - Tier A", () => {
    it("flags words with digits as Tier A", () => {
      const findings = scanDictionaryForGarbage("vn", [
        "word123",
        "bình1thường"
      ])
      expect(findings.length).toBe(2)
      expect(findings[0].tier).toBe("A")
      expect(findings[0].reasons).toContain("Chứa chữ số")
    })

    it("flags file/URL artifacts as Tier A", () => {
      const findings = scanDictionaryForGarbage("names", [
        "HresponseMKpdf",
        "example.com",
        "http://test"
      ])
      expect(findings.length).toBe(3)
      for (const f of findings) {
        expect(f.tier).toBe("A")
        expect(f.reasons.some((r) => r.includes("file/URL"))).toBe(true)
      }
    })

    it("flags 5+ consecutive consonants as Tier A", () => {
      const findings = scanDictionaryForGarbage("names", [
        "KLwnN",
        "Phbcnt",
        "QKtsq",
        "SVPSh"
      ])
      expect(findings.length).toBe(4)
      for (const f of findings) {
        expect(f.tier).toBe("A")
        expect(f.reasons.some((r) => r.includes("5 phụ âm liên tiếp"))).toBe(
          true
        )
      }
    })

    it("flags repeated sound units as Tier A", () => {
      const findings = scanDictionaryForGarbage("names", [
        "Hahaha",
        "Hừhừhừhừ",
        "hehehe"
      ])
      expect(findings.length).toBe(3)
      for (const f of findings) {
        expect(f.tier).toBe("A")
        expect(
          f.reasons.some((r) => r.includes("Chuỗi âm thanh lặp lại"))
        ).toBe(true)
      }
    })

    it("flags excessively long words (>30 chars) as Tier A", () => {
      const longWord = "a".repeat(35)
      const findings = scanDictionaryForGarbage("vn", [longWord])
      expect(findings.length).toBe(1)
      expect(findings[0].tier).toBe("A")
      expect(findings[0].reasons.some((r) => r.includes("> 30 ký tự"))).toBe(
        true
      )
    })

    it("flags low vowel ratio (<0.2 with len>=6) as Tier A", () => {
      const findings = scanDictionaryForGarbage("names", ["bcdfghj"])
      expect(findings.length).toBe(1)
      expect(findings[0].tier).toBe("A")
      expect(
        findings[0].reasons.some((r) => r.includes("Tỉ lệ nguyên âm quá thấp"))
      ).toBe(true)
    })
  })

  describe("scanDictionaryForGarbage - Tier B & Negative Tests (Valid Words)", () => {
    it("flags merged TitleCase with VN exclusive chars as Tier A/B and without VN chars as Tier B", () => {
      const findings = scanDictionaryForGarbage("names", [
        "MacArthur",
        "SignorThưa"
      ])
      expect(findings.length).toBe(2)
      const mac = findings.find((f) => f.word === "MacArthur")
      const signor = findings.find((f) => f.word === "SignorThưa")
      expect(mac?.tier).toBe("B")
      expect(signor).toBeDefined()
    })

    it("flags Vietnamese exclusive chars in non-vn dictionary as Tier B", () => {
      const findings = scanDictionaryForGarbage("non-vn", ["thương", "quà"])
      expect(findings.length).toBe(2)
      expect(findings[0].tier).toBe("B")
      expect(
        findings[0].reasons.some((r) =>
          r.includes("ký tự/dấu đặc trưng tiếng Việt")
        )
      ).toBe(true)
    })

    it("does NOT falsely flag valid complex foreign words/names as Tier A", () => {
      const validNames = [
        "Rothschild",
        "Nietzsche",
        "Messerschmitt",
        "Shakespeare",
        "Tchaikovsky",
        "Dostoevsky"
      ]
      const findings = scanDictionaryForGarbage("names", validNames)
      // None should be Tier A
      const tierA = findings.filter((f) => f.tier === "A")
      expect(tierA).toEqual([])
    })
  })

  describe("Fuzzy Duplicate Detection & Clustering", () => {
    it("detects near-duplicates within Levenshtein distance [1, 2] and scores garbage", () => {
      const words = [
        "MacArthur",
        "Macathur",
        "HresponseMKpdf",
        "HresponseMKpdg"
      ]
      const clusters = detectFuzzyDuplicates("names", words)

      expect(clusters.length).toBeGreaterThanOrEqual(1)
      const macCluster = clusters.find((c) =>
        c.words.some((w) => w.word === "MacArthur")
      )
      expect(macCluster).toBeDefined()
      expect(macCluster?.words.map((w) => w.word)).toContain("Macathur")

      // HresponseMKpdf vs HresponseMKpdg are both Tier A
      const garbageCluster = clusters.find((c) =>
        c.words.some((w) => w.word === "HresponseMKpdf")
      )
      expect(garbageCluster).toBeDefined()
      expect(garbageCluster?.words.every((w) => w.garbageScore === 100)).toBe(
        true
      )
    })

    it("assigns delete suggestion to higher garbageScore and keep to lower", () => {
      // MacArthur (Tier B score 40) vs MacArthur1 (Tier A with digit score 100, length diff 1)
      const words = ["MacArthur", "MacArthur1"]
      const clusters = detectFuzzyDuplicates("names", words)
      expect(clusters.length).toBe(1)
      const cluster = clusters[0]
      const toDelete = cluster.words.find((w) => w.suggestion === "delete")
      const toKeep = cluster.words.find((w) => w.suggestion === "keep")
      expect(toDelete?.word).toBe("MacArthur1")
      expect(toKeep?.word).toBe("MacArthur")
    })

    it("ignores pairs present in ignoredPairs set", () => {
      const words = ["MacArthur", "Macathur"]
      const pairKey = createPairKey("MacArthur", "Macathur")
      const ignored = new Set([pairKey])

      const clusters = detectFuzzyDuplicates("names", words, ignored)
      expect(clusters.length).toBe(0)
    })

    it("detects 2-substitution pairs without common 2-char prefix (e.g. tran vs tron or trung vs trong)", () => {
      const words = ["trang", "trong"]
      const clusters = detectFuzzyDuplicates("vn", words)
      expect(clusters.length).toBe(1)
      expect(clusters[0].words.map((w) => w.word)).toContain("trang")
      expect(clusters[0].words.map((w) => w.word)).toContain("trong")
    })

    it("marks confidence as low for two long valid words (>=8 chars)", () => {
      const words = ["Johnston", "Johnsonx"] // Length 8, Levenshtein distance 2
      const clusters = detectFuzzyDuplicates("names", words)
      expect(clusters.length).toBe(1)
      expect(clusters[0].confidence).toBe("low")
    })
  })

  describe("auditDictionary", () => {
    it("runs both garbage and fuzzy duplicate scans together with timing metrics", () => {
      const words = ["HresponseMKpdf", "MacArthur", "Macathur", "người"]
      const result = auditDictionary("names", words)
      expect(result.garbage.length).toBeGreaterThan(0)
      expect(result.duplicateClusters.length).toBeGreaterThan(0)
      expect(result.timing).toBeDefined()
      expect(result.timing?.totalMs).toBeGreaterThanOrEqual(0)
      expect(result.timing?.garbageScanMs).toBeGreaterThanOrEqual(0)
      expect(result.timing?.candidateCount).toBeGreaterThanOrEqual(0)
    })

    it("includes Tier C cross-reference findings when referenceWords are provided", () => {
      const words = ["học", "nhửng"]
      const referenceWords = new Set(["học", "những"])
      const result = auditDictionary("vn", words, new Set(), referenceWords)
      expect(result.referenceFindings).toBeDefined()
      expect(result.referenceFindings?.length).toBe(1)
      expect(result.referenceFindings?.[0].word).toBe("nhửng")
      expect(result.referenceFindings?.[0].tier).toBe("C")
      expect(result.referenceFindings?.[0].suggestion).toBe("những")
    })
  })

  describe("scanDictionaryCrossReference (Tier C)", () => {
    it("flags words missing from reference baseline and finds closest suggestion", () => {
      const words = ["học", "nhửng", "sách"]
      const referenceWords = new Set(["học", "những", "sách"])
      const findings = scanDictionaryCrossReference("vn", words, referenceWords)

      expect(findings.length).toBe(1)
      expect(findings[0].word).toBe("nhửng")
      expect(findings[0].tier).toBe("C")
      expect(findings[0].suggestion).toBe("những")
      expect(findings[0].distance).toBe(1)
    })

    it("recognizes alternate tone style placements as valid in reference", () => {
      const words = ["hòa"]
      const referenceWords = new Set(["hoà"]) // old style
      const findings = scanDictionaryCrossReference("vn", words, referenceWords)
      expect(findings.length).toBe(0)
    })

    it("ignores words present in ignoredWords set", () => {
      const words = ["nhửng"]
      const referenceWords = new Set(["những"])
      const ignored = new Set(["nhửng"])
      const findings = scanDictionaryCrossReference(
        "vn",
        words,
        referenceWords,
        ignored
      )
      expect(findings.length).toBe(0)
    })

    it("loads and clears reference dictionary cache cleanly", async () => {
      const { loadReferenceDictionary, clearReferenceDictionaryCache } =
        await import("../../src/utils/reference-dict")
      const refDict = await loadReferenceDictionary()
      expect(refDict.size).toBeGreaterThan(0)
      clearReferenceDictionaryCache()
    })

    it("verifies transliterated loanwords (alô, cà-phê, bê-tông, sô-cô-la) are present in reference dataset", async () => {
      const { loadReferenceDictionary } = await import(
        "../../src/utils/reference-dict"
      )
      const refDict = await loadReferenceDictionary()

      const loanwords = ["alô", "cà-phê", "bê-tông", "sô-cô-la"]
      const findings = scanDictionaryCrossReference("vn", loanwords, refDict)
      expect(findings.length).toBe(0)
    })
  })
})
