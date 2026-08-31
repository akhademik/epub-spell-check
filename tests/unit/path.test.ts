import { describe, expect, it } from "vitest"
import { resolveZipPath } from "../../src/utils/path"

describe("Path Resolution Utility", () => {
  it("resolves relative path without baseDir", () => {
    expect(resolveZipPath("", "content.opf")).toBe("content.opf")
    expect(resolveZipPath("", "META-INF/container.xml")).toBe(
      "META-INF/container.xml"
    )
  })

  it("resolves nested relative path with base directory", () => {
    expect(resolveZipPath("OEBPS", "chap1.xhtml")).toBe("OEBPS/chap1.xhtml")
    expect(resolveZipPath("OEBPS/Text", "chap1.xhtml")).toBe(
      "OEBPS/Text/chap1.xhtml"
    )
  })

  it("handles parent directory (..) navigation correctly", () => {
    expect(resolveZipPath("OEBPS", "../Images/cover.jpg")).toBe(
      "Images/cover.jpg"
    )
    expect(resolveZipPath("OEBPS/Text/Sub", "../../Images/cover.jpg")).toBe(
      "OEBPS/Images/cover.jpg"
    )
    expect(resolveZipPath("OEBPS", "../../outside.jpg")).toBe("outside.jpg")
  })

  it("handles current directory (.) and redundant slashes", () => {
    expect(resolveZipPath("OEBPS", "./chap1.xhtml")).toBe("OEBPS/chap1.xhtml")
    expect(resolveZipPath("OEBPS//Text", ".///chap1.xhtml")).toBe(
      "OEBPS/Text/chap1.xhtml"
    )
  })

  it("handles Windows backslashes", () => {
    expect(resolveZipPath("OEBPS", "..\\Images\\cover.jpg")).toBe(
      "Images/cover.jpg"
    )
  })

  it("handles URL-encoded path characters (%20, Vietnamese characters)", () => {
    expect(resolveZipPath("OEBPS/Text", "Ch%C6%B0%C6%A1ng%201.xhtml")).toBe(
      "OEBPS/Text/Chương 1.xhtml"
    )
    expect(resolveZipPath("OEBPS", "../Images/my%20cover.jpg")).toBe(
      "Images/my cover.jpg"
    )
  })
})
