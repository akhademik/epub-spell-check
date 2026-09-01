import fs from "node:fs"
import path from "node:path"

export interface SectionMap {
  [sectionName: string]: string[]
}

export interface MergeStats {
  file: string
  beforeCount: number
  addedCount: number
  duplicateRemovedCount: number
  afterCount: number
}

export interface ValidationIssue {
  word: string
  section: string
  reason: string
}

export const SECTION_TO_FILE: Record<string, string> = {
  NAMES: "public/names-dict.txt",
  VN: "public/vn-dict.txt",
  "NON-VN": "public/non-vn-dict.txt",
  CUSTOM: "public/custom-dict.txt"
}

/**
 * Parses markdown dictionary file(s) containing section headers like ---NAMES---, \---NAMES---, etc.
 */
export function parseDictMarkdown(content: string): SectionMap {
  const lines = content.split(/\r?\n/)
  const sections: SectionMap = {}
  let currentSection: string | null = null

  for (let line of lines) {
    line = line.trim()
    if (!line) continue

    const headerMatch = line.match(
      /(?:\\---|---)([A-Z]+(?:-[A-Z]+)*)(?:\\---|---)?/
    )
    if (headerMatch) {
      currentSection = headerMatch[1]
      if (!sections[currentSection]) {
        sections[currentSection] = []
      }
      continue
    }

    if (currentSection) {
      sections[currentSection].push(line)
    }
  }

  return sections
}

// ---------------------------------------------------------------------------
// Content validation
//
// This mirrors real pollution found in a manual audit (2026-09): translated
// footnote fragments merged without a space ("BonjourChào", "SignorThưa"),
// OCR-garbled Vietnamese fragments miscategorized as proper nouns
// ("Đúnglúc", "Tôichưa"), onomatopoeia/laughter miscategorized as names
// ("Hahaha", "Hừhừhừhừ"), gibberish strings ("Actdmpiifpwanpns"), and —
// worst of all — doubled-letter typo tokens ("aa", "ee", "oo", ...) sitting
// in vn-dict.txt, which silently defeats the app's own typo detector in
// src/utils/analysis-core.ts (that regex is duplicated below on purpose —
// keep both in sync if the app's rule ever changes).
// ---------------------------------------------------------------------------

// Same pattern the app uses to flag "Gõ máy (Typo)" in analysis-core.ts.
const APP_TYPO_ENDING_RE = /(aa|ee|oo|uu|ii|dd|js|kx|wt)$/i

// A word made of a single character repeated 2+ times, e.g. "aa", "ee".
const DOUBLED_SINGLE_CHAR_RE = /^(.)\1$/u

// Vietnamese-exclusive letters: đ/ơ/ư/ă and any vowel carrying a tone mark
// (hook-above, dot-below, or a tone combined with â/ê/ô/ơ/ư/ă). Plain
// single-diacritic vowels (à, á, â, ã, è, é, ê, ì, í, ò, ó, ô, õ, ù, ú) are
// deliberately EXCLUDED here since French/Spanish/Portuguese/Italian use
// them too — non-vn-dict.txt legitimately holds words like "café", "être".
const VN_EXCLUSIVE_CHARS =
  "đơưăĐƠƯĂảạằắẳẵặầấẩẫậẻẽẹềếểễệỉĩịỏọồốổỗộờớởỡợủũụừứửữựỳýỷỹỵ" +
  "ẢẠẰẮẲẴẶẦẤẨẪẬẺẼẸỀẾỂỄỆỈĨỊỎỌỒỐỔỖỘỜỚỞỠỢỦŨỤỪỨỬỮỰỲÝỶỸỴ"
const VN_EXCLUSIVE_RE = new RegExp(`[${VN_EXCLUSIVE_CHARS}]`)

// Two Title-Case chunks glued together, e.g. "SignorThưa", "BonjourChào".
// (Legit brand/surname compounds like "MacArthur"/"LeBron" also match this
// shape, so on its own this is only a WARN, not a hard reject — see below.)
const TITLECASE_MERGE_RE = /^\p{Lu}\p{Ll}+\p{Lu}\p{Ll}+$/u

// A short unit (1-4 chars) repeated 3+ times across the whole word, e.g.
// "Hahaha", "Hừhừhừhừ", "hehehe".
function repeatedUnitSpan(word: string): boolean {
  const lw = word.toLowerCase()
  for (let unit = 1; unit <= 4; unit++) {
    if (lw.length < unit * 3) continue
    const chunk = lw.slice(0, unit)
    let i = unit
    let reps = 1
    while (lw.slice(i, i + unit) === chunk) {
      i += unit
      reps++
    }
    if (reps >= 3 && i >= lw.length - 1) return true
  }
  return false
}

/**
 * Validates a single word for a given section. Returns:
 *  - { reject: true, reason }  → dropped automatically, never written to disk
 *  - { reject: false, reason } → kept, but surfaced as a warning for human review
 *  - null                      → no issue
 */
export function validateEntry(
  section: string,
  word: string
): { reject: boolean; reason: string } | null {
  // 1. Doubled-letter typo tokens must never enter vn-dict.txt — they
  //    silently disable the app's typo detector for that exact pattern.
  if (section === "VN" && DOUBLED_SINGLE_CHAR_RE.test(word)) {
    return {
      reject: true,
      reason:
        "Chuỗi 1 ký tự lặp đôi (vd 'aa','ee') — vô hiệu hoá bộ dò lỗi gõ máy"
    }
  }
  if (section === "VN" && APP_TYPO_ENDING_RE.test(word.toLowerCase())) {
    return {
      reject: false,
      reason:
        "Kết thúc bằng pattern trùng với rule bắt lỗi gõ máy của app — kiểm tra lại có đúng là từ thật không"
    }
  }

  // 2. Vietnamese-exclusive characters have no place in the foreign-word dict.
  if (section === "NON-VN" && VN_EXCLUSIVE_RE.test(word)) {
    return {
      reject: true,
      reason: "Chứa ký tự/dấu chỉ có trong tiếng Việt — không phải từ ngoại ngữ"
    }
  }

  // 3. Onomatopoeia / laughter / stutter patterns are not proper names.
  if (section === "NAMES" && repeatedUnitSpan(word)) {
    return {
      reject: true,
      reason: "Chuỗi lặp lại (tiếng cười/thán từ) — không phải tên riêng"
    }
  }

  // 4. Two capitalized chunks glued together, AND containing a Vietnamese
  //    diacritic → near-certain translation/footnote merge artifact
  //    (e.g. "SignorThưa" = "Signor" + Vietnamese "thưa" stuck together).
  if (section === "NAMES" && TITLECASE_MERGE_RE.test(word)) {
    if (VN_EXCLUSIVE_RE.test(word)) {
      return {
        reject: true,
        reason:
          "Hai cụm viết hoa dính liền, lẫn dấu tiếng Việt — khả năng cao là lỗi merge 2 từ khi trích xuất"
      }
    }
    return {
      reject: false,
      reason:
        "Hai cụm viết hoa dính liền (vd tên+họ, hoặc 2 từ khác nhau) — xác nhận đây là 1 từ/tên hợp lệ (không phải lỗi merge, kiểu MacArthur/LeBron) trước khi giữ lại"
    }
  }

  // 5. Suspiciously long single tokens are worth a second look in any section
  //    except VN (Vietnamese words are essentially never this long).
  if (section === "VN" && [...word].length >= 12) {
    return {
      reject: false,
      reason:
        "Từ tiếng Việt dài bất thường (>=12 ký tự) — kiểm tra có phải bị dính 2 từ không"
    }
  }
  if (section !== "VN" && [...word].length >= 20) {
    return {
      reject: false,
      reason:
        "Từ dài bất thường (>=20 ký tự) — kiểm tra có phải bị dính nhiều từ không"
    }
  }

  return null
}

/**
 * Runs validateEntry over a batch of words for a section, splitting them
 * into words that pass straight through, words that are auto-rejected, and
 * words that pass but are flagged for human review.
 */
export function validateSection(
  section: string,
  words: string[]
): {
  clean: string[]
  rejected: ValidationIssue[]
  warnings: ValidationIssue[]
} {
  const clean: string[] = []
  const rejected: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  for (const word of words) {
    const result = validateEntry(section, word)
    if (!result) {
      clean.push(word)
    } else if (result.reject) {
      rejected.push({ word, section, reason: result.reason })
    } else {
      clean.push(word)
      warnings.push({ word, section, reason: result.reason })
    }
  }

  return { clean, rejected, warnings }
}

/**
 * Deduplicates and sorts entries in standard JavaScript Unicode code-point order.
 */
export function deduplicateAndSort(entries: string[]): string[] {
  const unique = Array.from(
    new Set(entries.filter((entry) => entry.length > 0))
  )
  unique.sort()
  return unique
}

/**
 * Merges new words into an existing dictionary array, returning sorted unique entries and statistics.
 */
export function mergeWords(
  originalEntries: string[],
  newEntries: string[],
  filePath = ""
): { result: string[]; stats: MergeStats } {
  const beforeCount = originalEntries.length
  const originalSet = new Set(originalEntries)

  let addedCount = 0
  const newSeen = new Set<string>()

  for (const word of newEntries) {
    if (word && !newSeen.has(word)) {
      newSeen.add(word)
      if (!originalSet.has(word)) {
        addedCount++
      }
    }
  }

  const combined = [...originalEntries, ...newEntries]
  const result = deduplicateAndSort(combined)
  const afterCount = result.length
  const duplicateRemovedCount = combined.length - afterCount

  return {
    result,
    stats: {
      file: filePath,
      beforeCount,
      addedCount,
      duplicateRemovedCount,
      afterCount
    }
  }
}

/**
 * Merges one or more markdown dictionary files into target dictionaries on disk.
 * New words are validated first: entries matching high-confidence pollution
 * patterns are dropped automatically (see `rejected` in the return value),
 * and medium-confidence ones are kept but reported for human review
 * (`warnings`) — never silently merged without a trace.
 */
export function mergeDictFiles(
  markdownFilePaths: string[],
  baseDir: string = process.cwd(),
  dryRun = false
): {
  statsList: MergeStats[]
  rejected: ValidationIssue[]
  warnings: ValidationIssue[]
} {
  const aggregatedSections: SectionMap = {}

  for (const filePath of markdownFilePaths) {
    const fullPath = path.resolve(baseDir, filePath)
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Input dictionary file not found: ${filePath}`)
    }
    const content = fs.readFileSync(fullPath, "utf8")
    const parsed = parseDictMarkdown(content)

    for (const [sec, words] of Object.entries(parsed)) {
      if (!aggregatedSections[sec]) {
        aggregatedSections[sec] = []
      }
      aggregatedSections[sec].push(...words)
    }
  }

  const statsList: MergeStats[] = []
  const allRejected: ValidationIssue[] = []
  const allWarnings: ValidationIssue[] = []

  for (const [section, relativeTargetFile] of Object.entries(SECTION_TO_FILE)) {
    const rawWords = aggregatedSections[section] || []
    if (rawWords.length === 0) continue

    const { clean, rejected, warnings } = validateSection(section, rawWords)
    allRejected.push(...rejected)
    allWarnings.push(...warnings)

    if (clean.length === 0) continue

    const targetPath = path.resolve(baseDir, relativeTargetFile)
    let originalEntries: string[] = []

    if (fs.existsSync(targetPath)) {
      const targetContent = fs.readFileSync(targetPath, "utf8")
      originalEntries = targetContent
        .split("\n")
        .filter((line) => line.length > 0)
    }

    const { result, stats } = mergeWords(
      originalEntries,
      clean,
      relativeTargetFile
    )
    statsList.push(stats)

    if (!dryRun) {
      fs.writeFileSync(targetPath, `${result.join("\n")}\n`, "utf8")
    }
  }

  return { statsList, rejected: allRejected, warnings: allWarnings }
}

/**
 * Formats statistics for console or markdown reporting as defined in MERGE_DICTS_WORKFLOW.md.
 */
export function formatMergeStats(statsList: MergeStats[]): string {
  if (statsList.length === 0) {
    return "Không có từ mới nào được thêm vào các file từ điển."
  }

  return statsList
    .map((stats) => {
      return `${stats.file}:
  - Số từ trước khi cập nhật: ${stats.beforeCount}
  - Số từ mới được thêm: ${stats.addedCount}
  - Số từ trùng lặp bị loại bỏ: ${stats.duplicateRemovedCount}
  - Số từ sau khi cập nhật: ${stats.afterCount}`
    })
    .join("\n\n")
}

/**
 * Formats rejected/warning validation issues for console reporting.
 */
export function formatValidationReport(
  rejected: ValidationIssue[],
  warnings: ValidationIssue[]
): string {
  const lines: string[] = []

  if (rejected.length > 0) {
    lines.push(`❌ Đã tự động loại bỏ ${rejected.length} từ nghi ngờ là rác:`)
    for (const { word, section, reason } of rejected) {
      lines.push(`  - [${section}] "${word}" — ${reason}`)
    }
  }

  if (warnings.length > 0) {
    lines.push(
      `${rejected.length > 0 ? "\n" : ""}⚠️  ${warnings.length} từ đã được thêm vào nhưng cần bạn xác nhận lại thủ công:`
    )
    for (const { word, section, reason } of warnings) {
      lines.push(`  - [${section}] "${word}" — ${reason}`)
    }
  }

  if (lines.length === 0) {
    return "✅ Không có cảnh báo nào từ bước validate nội dung."
  }

  return lines.join("\n")
}

// CLI entry point
const isDirectExecution =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("merge-dicts.ts") ||
    process.argv[1].endsWith("merge-dicts.js"))

if (isDirectExecution) {
  const args = process.argv.slice(2)
  const deleteAfter = args.includes("--delete")
  const fileArgs = args.filter((arg) => !arg.startsWith("--"))

  if (fileArgs.length === 0) {
    console.error(
      "Usage: node scripts/merge-dicts.ts [--delete] <file1.md> [file2.md ...]"
    )
    process.exit(1)
  }

  try {
    const { statsList, rejected, warnings } = mergeDictFiles(fileArgs)
    console.log(formatMergeStats(statsList))
    console.log("\n" + formatValidationReport(rejected, warnings))

    if (deleteAfter) {
      for (const file of fileArgs) {
        const fullPath = path.resolve(process.cwd(), file)
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
          console.log(`\nĐã xóa file: ${file}`)
        }
      }
    }
  } catch (error: any) {
    console.error("Error merging dictionaries:", error.message)
    process.exit(1)
  }
}
