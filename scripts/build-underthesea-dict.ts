import fs from "node:fs"
import path from "node:path"

async function main() {
  const url =
    "https://raw.githubusercontent.com/undertheseanlp/dictionary/master/dictionary/words.txt"
  console.log("Fetching underthesea dictionary from:", url)

  let rawContent: string
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    rawContent = await res.text()
  } catch (err) {
    console.error(
      "Failed to fetch from remote, checking local fallback...",
      err
    )
    const tmpPath = "/tmp/underthesea-words.txt"
    if (fs.existsSync(tmpPath)) {
      rawContent = fs.readFileSync(tmpPath, "utf8")
    } else {
      throw err
    }
  }

  const lines = rawContent.split(/\r?\n/)
  const compoundWords = new Set<string>()

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const parsed = JSON.parse(trimmed) as { text?: string }
      if (parsed.text) {
        const text = parsed.text.trim().normalize("NFC")
        // Filter valid Vietnamese compound phrases (at least 2 words, without punctuation/numbers)
        if (
          text.includes(" ") &&
          !/[\d@#$%^&*()_+=[\]{};:'",.<>?/\\|~`]/.test(text)
        ) {
          compoundWords.add(text.toLowerCase())
        }
      }
    } catch {
      // plain text line fallback
      if (
        trimmed.includes(" ") &&
        !/[\d@#$%^&*()_+=[\]{};:'",.<>?/\\|~`]/.test(trimmed)
      ) {
        compoundWords.add(trimmed.toLowerCase().normalize("NFC"))
      }
    }
  }

  const sortedList = Array.from(compoundWords).sort((a, b) =>
    a.localeCompare(b, "vi")
  )
  console.log(
    `Extracted ${sortedList.length} unique Vietnamese compound words.`
  )

  const outPath = path.resolve(process.cwd(), "public/underthesea-words.txt")
  fs.writeFileSync(outPath, `${sortedList.join("\n")}\n`, "utf8")
  console.log("Wrote to:", outPath)
}

main().catch((err) => {
  console.error("Error building underthesea dictionary:", err)
  process.exit(1)
})
