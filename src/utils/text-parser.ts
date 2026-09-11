import type { EpubContent, TextContentBlock } from "../types/epub"
import type { FixInstruction } from "./epub-writer"

/**
 * Detects whether line endings are CRLF (\r\n) or LF (\n).
 */
export function detectLineEnding(text: string): string {
  const crlfCount = (text.match(/\r\n/g) || []).length
  const lfCount = (text.match(/[^\r]\n/g) || []).length
  return crlfCount > lfCount ? "\r\n" : "\n"
}

/**
 * Parses a plain text (.txt) or Markdown (.md) file into an EpubContent-compatible structure.
 * Each non-empty line becomes a TextContentBlock.
 */
export async function parseTextOrMarkdown(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<EpubContent> {
  onProgress?.(10, `Đang đọc tệp ${file.name}...`)
  const rawText = await file.text()

  onProgress?.(30, "Đang phân tích cấu trúc dòng...")
  const rawLines = rawText.split(/\r?\n/)

  const isMarkdown =
    file.name.endsWith(".md") || file.name.endsWith(".markdown")
  const fileExtLabel = isMarkdown ? "Markdown (.md)" : "Văn bản (.txt)"

  const title = file.name.replace(/\.[^/.]+$/, "").trim() || "Văn bản"
  const textBlocks: TextContentBlock[] = []

  let processedCount = 0
  const total = rawLines.length

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i]
    const trimmed = rawLine.trim()

    // Always create a block for non-empty lines
    if (trimmed.length > 0) {
      textBlocks.push({
        id: `line_${i + 1}`,
        filePath: file.name,
        text: trimmed
      })
    }

    processedCount++
    if (processedCount % 1000 === 0 || processedCount === total) {
      const pct = Math.round(30 + (processedCount / total) * 30)
      onProgress?.(pct, `Đang xử lý dòng ${processedCount}/${total}...`)
    }
  }

  onProgress?.(60, "Hoàn tất nạp tệp văn bản.")

  return {
    metadata: {
      title,
      author: fileExtLabel,
      coverUrl: null
    },
    textBlocks
  }
}

/**
 * Applies word fix instructions to a plain text or Markdown file and returns a downloadable Blob.
 * Preserves original line endings, indentation, and markdown formatting.
 */
export async function applyFixesToTextOrMarkdown(
  originalFile: File,
  fixInstructions: FixInstruction[]
): Promise<Blob> {
  const rawText = await originalFile.text()
  const lineEnding = detectLineEnding(rawText)
  const rawLines = rawText.split(/\r?\n/)

  // Group instructions by blockId (line_X)
  const fixesByBlockId = new Map<string, FixInstruction[]>()
  for (const fix of fixInstructions) {
    let list = fixesByBlockId.get(fix.blockId)
    if (!list) {
      list = []
      fixesByBlockId.set(fix.blockId, list)
    }
    list.push(fix)
  }

  const modifiedLines: string[] = []

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i]
    const blockId = `line_${i + 1}`
    const fixes = fixesByBlockId.get(blockId)

    if (!fixes || fixes.length === 0) {
      modifiedLines.push(rawLine)
      continue
    }

    const trimmed = rawLine.trim()
    const leadingSpaces = rawLine.slice(0, rawLine.indexOf(trimmed))
    const trailingSpaces = rawLine.slice(
      rawLine.indexOf(trimmed) + trimmed.length
    )

    // Sort fixes descending by startIndex so replacing earlier words doesn't shift later indices
    const sortedFixes = [...fixes].sort((a, b) => b.startIndex - a.startIndex)

    let fixedTrimmed = trimmed
    for (const fix of sortedFixes) {
      if (
        fix.startIndex >= 0 &&
        fix.endIndex <= fixedTrimmed.length &&
        fix.startIndex <= fix.endIndex
      ) {
        fixedTrimmed =
          fixedTrimmed.slice(0, fix.startIndex) +
          fix.newWord +
          fixedTrimmed.slice(fix.endIndex)
      }
    }

    modifiedLines.push(`${leadingSpaces}${fixedTrimmed}${trailingSpaces}`)
  }

  const isMarkdown =
    originalFile.name.endsWith(".md") || originalFile.name.endsWith(".markdown")
  const mimeType = isMarkdown
    ? "text/markdown;charset=utf-8"
    : "text/plain;charset=utf-8"

  const finalOutput = modifiedLines.join(lineEnding)
  return new Blob([finalOutput], { type: mimeType })
}
