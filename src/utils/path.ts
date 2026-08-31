/**
 * Resolves and normalizes a relative zip/POSIX path against a base directory.
 * Handles '.', '..', leading/trailing slashes, and redundant separators.
 *
 * Example:
 * resolveZipPath("OEBPS", "../Images/cover.jpg") -> "Images/cover.jpg"
 * resolveZipPath("OEBPS/Text", "./chap1.xhtml") -> "OEBPS/Text/chap1.xhtml"
 * resolveZipPath("", "content.opf") -> "content.opf"
 */
export function resolveZipPath(baseDir: string, relativePath: string): string {
  const cleanRelative = relativePath.trim().replace(/\\/g, "/")
  if (!cleanRelative) return baseDir

  // If path starts with leading slash, treat as root-relative in zip
  if (cleanRelative.startsWith("/")) {
    return normalizeSegments(cleanRelative.split("/"))
  }

  const combined = baseDir ? `${baseDir}/${cleanRelative}` : cleanRelative
  return normalizeSegments(combined.split("/"))
}

function normalizeSegments(segments: string[]): string {
  const stack: string[] = []

  for (const seg of segments) {
    const trimmed = seg.trim()
    if (!trimmed || trimmed === ".") {
      continue
    }
    if (trimmed === "..") {
      if (stack.length > 0) {
        stack.pop()
      }
    } else {
      stack.push(trimmed)
    }
  }

  return stack.join("/")
}
