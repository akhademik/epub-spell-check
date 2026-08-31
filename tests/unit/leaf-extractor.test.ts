// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { extractLeafTextElements } from "../../src/utils/epub-parser"

describe("Leaf Text Elements Extractor", () => {
  it("extracts leaf blocks without duplicating container text", () => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(
      `<html><body>
        <div class="chapter-container">
          <h1>Chương 1</h1>
          <p>Đoạn văn 1.</p>
          <div class="inner-container">
            <p>Đoạn văn 2.</p>
          </div>
          <blockquote>Trích dẫn.</blockquote>
        </div>
      </body></html>`,
      "text/html"
    )

    const elements = extractLeafTextElements(doc)
    const texts = elements.map((el) => el.textContent?.trim())

    // Must NOT contain "chapter-container" text ("Chương 1 Đoạn văn 1...")
    expect(texts).toEqual([
      "Chương 1",
      "Đoạn văn 1.",
      "Đoạn văn 2.",
      "Trích dẫn."
    ])
    expect(elements.length).toBe(4)
  })

  it("includes div if it is a standalone leaf element containing direct text", () => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(
      `<html><body>
        <div class="header-text">Tiêu đề đứng một mình trong div</div>
        <p>Đoạn văn.</p>
      </body></html>`,
      "text/html"
    )

    const elements = extractLeafTextElements(doc)
    const texts = elements.map((el) => el.textContent?.trim())

    expect(texts).toEqual(["Tiêu đề đứng một mình trong div", "Đoạn văn."])
    expect(elements.length).toBe(2)
  })
})
