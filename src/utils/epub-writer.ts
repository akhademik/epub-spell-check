import JSZip from "jszip"
import { extractLeafTextElements } from "./epub-parser"
import { logger } from "./logger"

export interface FixInstruction {
  filePath: string
  blockId: string
  startIndex: number
  endIndex: number
  newWord: string
}

/**
 * Locate the specific text node and local offset within a block element
 * corresponding to a global text character offset in the block's textContent.
 */
export function locateOffsetInBlock(
  blockElement: Element,
  globalOffset: number
): { textNode: Text; localOffset: number } | null {
  const rawText = (blockElement.textContent || "").normalize("NFC")
  const trimmed = rawText.trim()
  if (!trimmed) return null

  // Calculate leading whitespace count trimmed by epub-parser
  const leadingTrimCount = rawText.indexOf(trimmed)
  const actualRawOffset = globalOffset + leadingTrimCount

  const doc = blockElement.ownerDocument || document
  const walker = doc.createTreeWalker(blockElement, NodeFilter.SHOW_TEXT, null)

  const textNodes: Text[] = []
  let n = walker.nextNode()
  while (n) {
    // Normalize text node value to NFC in DOM if needed
    const textNode = n as Text
    if (textNode.nodeValue) {
      textNode.nodeValue = textNode.nodeValue.normalize("NFC")
    }
    textNodes.push(textNode)
    n = walker.nextNode()
  }

  let accumulated = 0
  for (let i = 0; i < textNodes.length; i++) {
    const textNode = textNodes[i]
    const nodeLen = textNode.nodeValue?.length || 0
    const nextAccumulated = accumulated + nodeLen

    // If offset falls strictly inside this node, or if it lands on the end of this node and it's the last node
    if (
      actualRawOffset < nextAccumulated ||
      (actualRawOffset === nextAccumulated && i === textNodes.length - 1)
    ) {
      return {
        textNode,
        localOffset: actualRawOffset - accumulated
      }
    }
    accumulated = nextAccumulated
  }

  return null
}

/**
 * Apply fixes to a single XHTML document in place.
 * Fixes targeting the same block must be applied in reverse offset order (highest startIndex first)
 * so that length differences do not shift the unapplied earlier offsets.
 */
export function applyFixesToDocument(
  doc: Document,
  filePath: string,
  fixes: FixInstruction[]
): void {
  // Query all candidate container elements with the exact same selector/extractor as epub-parser
  const elements = extractLeafTextElements(doc)

  // Map blockId -> Element
  const blockMap = new Map<string, Element>()
  elements.forEach((el, nodeIndex) => {
    const id = `${filePath}#${nodeIndex}`
    blockMap.set(id, el)
  })

  // Group fixes by blockId
  const fixesByBlock = new Map<string, FixInstruction[]>()
  for (const fix of fixes) {
    let list = fixesByBlock.get(fix.blockId)
    if (!list) {
      list = []
      fixesByBlock.set(fix.blockId, list)
    }
    list.push(fix)
  }

  // For each block, sort fixes descending by startIndex so earlier offsets aren't invalidated
  for (const [blockId, blockFixes] of fixesByBlock.entries()) {
    const blockEl = blockMap.get(blockId)
    if (!blockEl) {
      logger.warn(
        `Could not find block element with id "${blockId}" in ${filePath}`
      )
      continue
    }

    blockFixes.sort((a, b) => b.startIndex - a.startIndex)

    for (const fix of blockFixes) {
      const locStart = locateOffsetInBlock(blockEl, fix.startIndex)
      const locEnd = locateOffsetInBlock(blockEl, fix.endIndex)

      if (!locStart || !locEnd) {
        logger.warn(
          `Could not locate offset [${fix.startIndex}, ${fix.endIndex}] in block ${blockId}`
        )
        continue
      }

      if (locStart.textNode === locEnd.textNode) {
        // Simple case: start and end are in the same Text node
        const val = locStart.textNode.nodeValue || ""
        const before = val.substring(0, locStart.localOffset)
        const after = val.substring(locEnd.localOffset)
        locStart.textNode.nodeValue = before + fix.newWord + after
      } else {
        // Complex case: spans multiple text nodes (e.g. bold/italic in middle)
        const startVal = locStart.textNode.nodeValue || ""
        locStart.textNode.nodeValue =
          startVal.substring(0, locStart.localOffset) + fix.newWord

        const endVal = locEnd.textNode.nodeValue || ""
        locEnd.textNode.nodeValue = endVal.substring(locEnd.localOffset)

        // Clear any text nodes strictly between start and end
        const doc = blockEl.ownerDocument || document
        const walker = doc.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT, null)
        let n = walker.nextNode()
        let insideRange = false
        while (n) {
          if (n === locStart.textNode) {
            insideRange = true
          } else if (n === locEnd.textNode) {
            insideRange = false
            break
          } else if (insideRange) {
            ;(n as Text).nodeValue = ""
          }
          n = walker.nextNode()
        }
      }
    }
  }
}

/**
 * Apply verified fix instructions to original EPUB File and return a repacked EPUB Blob.
 */
export async function applyFixesAndRepack(
  originalFile: File | Blob,
  fixes: FixInstruction[]
): Promise<Blob> {
  if (fixes.length === 0) {
    if (originalFile instanceof Blob && !(originalFile instanceof File)) {
      return originalFile
    }
    return new Blob([await originalFile.arrayBuffer()], {
      type: "application/epub+zip"
    })
  }

  const zip = await JSZip.loadAsync(originalFile)

  // Group fixes by filePath
  const fixesByFile = new Map<string, FixInstruction[]>()
  for (const fix of fixes) {
    if (!fix.filePath) continue
    let list = fixesByFile.get(fix.filePath)
    if (!list) {
      list = []
      fixesByFile.set(fix.filePath, list)
    }
    list.push(fix)
  }

  const parser = new DOMParser()
  const serializer = new XMLSerializer()

  for (const [filePath, fileFixes] of fixesByFile.entries()) {
    const fileEntry = zip.file(filePath)
    if (!fileEntry) {
      logger.warn(`File ${filePath} not found in zip archive during repack.`)
      continue
    }

    const content = await fileEntry.async("string")
    const isXhtml = filePath.endsWith(".xhtml") || filePath.endsWith(".xml")

    let doc = parser.parseFromString(
      content,
      isXhtml ? "application/xhtml+xml" : "text/html"
    )

    // Check if XML parser failed on non-standard/unclosed HTML entities
    const hasParserError = doc.querySelector("parsererror")
    if (hasParserError) {
      logger.warn(
        `XML parse error in ${filePath}. Falling back to tolerant HTML parser.`
      )
      doc = parser.parseFromString(content, "text/html")
    }

    // Apply fixes
    applyFixesToDocument(doc, filePath, fileFixes)

    // Serialize back
    let updatedContent = serializer.serializeToString(doc)

    // If original content had XML declaration or doctype that XMLSerializer may omit
    if (content.startsWith("<?xml") && !updatedContent.startsWith("<?xml")) {
      const xmlHeader =
        content.match(/^<\?xml[^>]*\?>\s*/)?.[0] ||
        '<?xml version="1.0" encoding="utf-8"?>\n'
      updatedContent = xmlHeader + updatedContent
    }

    zip.file(filePath, updatedContent)
  }

  // Ensure mimetype file is explicitly STORED (uncompressed) as required by EPUB specification
  const mimetypeEntry = zip.file("mimetype")
  if (mimetypeEntry) {
    const mimetypeContent = await mimetypeEntry.async("string")
    zip.file("mimetype", mimetypeContent.trim(), { compression: "STORE" })
  }

  // Repack to Blob with DEFLATE level 9 compression for optimal file size
  return await zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9
    }
  })
}
