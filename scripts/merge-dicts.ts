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
 */
export function mergeDictFiles(
  markdownFilePaths: string[],
  baseDir: string = process.cwd(),
  dryRun = false
): MergeStats[] {
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

  for (const [section, relativeTargetFile] of Object.entries(SECTION_TO_FILE)) {
    const newWords = aggregatedSections[section] || []
    if (newWords.length === 0) continue

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
      newWords,
      relativeTargetFile
    )
    statsList.push(stats)

    if (!dryRun) {
      fs.writeFileSync(targetPath, `${result.join("\n")}\n`, "utf8")
    }
  }

  return statsList
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
    const stats = mergeDictFiles(fileArgs)
    console.log(formatMergeStats(stats))

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
