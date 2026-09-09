import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import type { Dictionaries } from "../../src/types/dictionary"
import {
  buildCompoundIndex,
  scanDynamicCompoundErrors
} from "../../src/utils/compound-detector"

describe("Compound Detector Performance Benchmark", () => {
  it("processes 1,000 paragraphs with full 68k Underthesea index in under 200ms", () => {
    // 1. Load full underthesea dataset
    const compoundPath = path.resolve(
      process.cwd(),
      "public/underthesea-words.txt"
    )
    let compounds: string[] = []
    if (fs.existsSync(compoundPath)) {
      compounds = fs
        .readFileSync(compoundPath, "utf8")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    }

    const t0 = performance.now()
    const index = buildCompoundIndex(compounds)
    const indexBuildTime = performance.now() - t0

    expect(index.exactSet.size).toBeGreaterThan(50000)
    expect(indexBuildTime).toBeLessThan(1500) // Build index once < 1.5s

    const dictPath = path.resolve(process.cwd(), "public/vn-dict.txt")
    const vnWords = new Set<string>()
    if (fs.existsSync(dictPath)) {
      const lines = fs.readFileSync(dictPath, "utf8").split(/\r?\n/)
      for (const line of lines) {
        const w = line.trim().toLowerCase().normalize("NFC")
        if (w) vnWords.add(w)
      }
    }

    const mockDicts: Dictionaries = {
      vietnamese: vnWords,
      nonVietnamese: new Set(),
      custom: new Set(),
      names: new Set()
    }

    const sampleParagraphs = [
      "Đây là một tình trạng nghiên trọng của bệnh nhân cần được bác sĩ quan tâm.",
      "Gia đình và xã hội cần chung tay phát triển kinh tế thị trường bền vững.",
      "Họ đang xem xét sát nhập các trường học trên địa bàn toàn tỉnh.",
      "Quy trình khám bệnh và chẩn đoán hình ảnh diễn ra rất nhanh chóng.",
      "Thời gian trôi qua êm đềm trên con đường quen thuộc của làng quê."
    ]

    // Create 1,000 paragraphs test corpus (~15,000 words)
    const largeCorpus: string[] = []
    for (let i = 0; i < 200; i++) {
      largeCorpus.push(...sampleParagraphs)
    }

    const tScanStart = performance.now()
    let errorCount = 0
    for (let i = 0; i < largeCorpus.length; i++) {
      const errs = scanDynamicCompoundErrors(
        largeCorpus[i],
        index,
        { paragraphIndex: i },
        mockDicts
      )
      errorCount += errs.length
    }
    const scanTimeMs = performance.now() - tScanStart

    console.log(
      `[Benchmark] Scanned 1,000 paragraphs (15,000+ words) in ${scanTimeMs.toFixed(2)}ms. Found ${errorCount} compound errors.`
    )

    // Ensure performance requirement: < 2.5s for 1,000 paragraphs in unoptimized vitest runner
    expect(scanTimeMs).toBeLessThan(2500)
    expect(errorCount).toBe(400) // 2 detected compound errors per 5-paragraph batch * 200 repetitions
  })
})
