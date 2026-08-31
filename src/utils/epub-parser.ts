import JSZip from "jszip"
import type { BookMetadata, EpubContent, TextContentBlock } from "../types/epub"
import { logger } from "./logger"
import { resolveZipPath } from "./path"

export const LEAF_BLOCK_SELECTOR =
  "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, dd, dt, figcaption"

/**
 * Extracts leaf text elements from a document without duplicating nested container text.
 * Divs are only included if they contain text directly and don't contain other child block elements.
 */
export function extractLeafTextElements(doc: Document): Element[] {
  const leafCandidates = Array.from(doc.querySelectorAll(LEAF_BLOCK_SELECTOR))

  // Find divs that do not contain any nested block elements
  const allDivs = Array.from(doc.querySelectorAll("div"))
  const leafDivs = allDivs.filter((div) => {
    return !div.querySelector(LEAF_BLOCK_SELECTOR) && !div.querySelector("div")
  })

  // Combine and sort by DOM document order
  const allElements = [...leafCandidates, ...leafDivs]
  allElements.sort((a, b) => {
    const pos = a.compareDocumentPosition(b)
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
    return 0
  })

  return allElements
}

export async function parseEpub(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<EpubContent> {
  onProgress?.(10, "Đang giải nén tệp...")
  const zip = await JSZip.loadAsync(file)

  const containerFile = zip.file("META-INF/container.xml")
  if (!containerFile) {
    logger.error("Invalid EPUB: META-INF/container.xml not found.")
    throw new Error("File EPUB không hợp lệ: thiếu META-INF/container.xml")
  }
  const cData = await containerFile.async("string")

  const parser = new DOMParser()
  const cXml = parser.parseFromString(cData, "application/xml")
  const rootPath = cXml.querySelector("rootfile")?.getAttribute("full-path")

  if (!rootPath) {
    logger.error("Invalid EPUB: OPF rootfile not found in container.xml.")
    throw new Error("EPUB không hợp lệ: không tìm thấy OPF rootfile")
  }

  const normalizedRootPath = resolveZipPath("", rootPath)
  const opfData = await zip.file(normalizedRootPath)?.async("string")
  if (!opfData) {
    logger.error(`Invalid EPUB: OPF file not found at path: ${rootPath}`)
    throw new Error("EPUB không hợp lệ: không tìm thấy OPF file")
  }
  const opfXml = parser.parseFromString(opfData, "application/xml")
  const opfDir = normalizedRootPath.includes("/")
    ? normalizedRootPath.substring(0, normalizedRootPath.lastIndexOf("/"))
    : ""
  const resolvePath = (p: string) => resolveZipPath(opfDir, p)

  const metadata: BookMetadata = {
    title:
      opfXml.getElementsByTagName("dc:title")[0]?.textContent ||
      opfXml.querySelector("title")?.textContent ||
      "Không rõ tên sách",
    author:
      opfXml.getElementsByTagName("dc:creator")[0]?.textContent ||
      opfXml.querySelector("creator")?.textContent ||
      "Không rõ tác giả",
    coverUrl: null
  }

  try {
    let coverHref: string | null = null
    const coverMeta = opfXml.querySelector('meta[name="cover"]')
    if (coverMeta) {
      const coverId = coverMeta.getAttribute("content")
      const coverItem = opfXml.querySelector(`manifest item[id="${coverId}"]`)
      if (coverItem) coverHref = coverItem.getAttribute("href")
    }
    if (!coverHref) {
      const coverItem = opfXml.querySelector(
        'manifest item[properties*="cover-image"]'
      )
      if (coverItem) coverHref = coverItem.getAttribute("href")
    }
    if (coverHref) {
      const fullCoverPath = resolvePath(coverHref)
      const coverFile = zip.file(fullCoverPath)
      if (coverFile) {
        const coverBlob = await coverFile.async("blob")
        metadata.coverUrl = URL.createObjectURL(coverBlob)
      }
    }
  } catch (_e) {
    logger.warn("Could not extract cover image.", _e)
  }

  onProgress?.(30, "Đang đọc cấu trúc sách...")

  const spine = Array.from(opfXml.querySelectorAll("spine itemref")).map(
    (ref) => ref.getAttribute("idref")
  )

  const textBlocks: TextContentBlock[] = []
  for (let i = 0; i < spine.length; i++) {
    const id = spine[i]
    const item = Array.from(opfXml.querySelectorAll("manifest item")).find(
      (it) => it.getAttribute("id") === id
    )

    if (item) {
      const href = item.getAttribute("href")
      if (!href) continue

      const fullPath = resolvePath(href)
      const chapterFile = zip.file(fullPath)

      if (chapterFile) {
        const html = await chapterFile.async("string")
        const doc = parser.parseFromString(html, "text/html")
        const paras = extractLeafTextElements(doc)
          .map((el, nodeIndex) => ({
            id: `${fullPath}#${nodeIndex}`,
            filePath: fullPath,
            text: (el.textContent?.trim() || "").normalize("NFC")
          }))
          .filter((block) => block.text.length > 0)

        textBlocks.push(...paras)
      }
    }
    if (i % 5 === 0) {
      onProgress?.(
        30 + Math.round((i / spine.length) * 30),
        `Đang đọc chương ${i + 1}/${spine.length}`
      )
    }
  }

  return { metadata, textBlocks }
}
