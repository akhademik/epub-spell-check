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
  const singleWords = new Set<string>()

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let wordText: string | undefined

    try {
      const parsed = JSON.parse(trimmed) as { text?: string }
      if (parsed.text) {
        wordText = parsed.text.trim().normalize("NFC")
      }
    } catch {
      wordText = trimmed.normalize("NFC")
    }

    if (!wordText || /[\d@#$%^&*()_+=[\]{};:'",.<>?/\\|~`]/.test(wordText)) {
      continue
    }

    const lower = wordText.toLowerCase()
    if (lower.includes(" ")) {
      compoundWords.add(lower)
    } else {
      singleWords.add(lower)
    }
  }

  const sortedCompoundList = Array.from(compoundWords).sort((a, b) =>
    a.localeCompare(b, "vi")
  )
  const sortedSingleList = Array.from(singleWords).sort((a, b) =>
    a.localeCompare(b, "vi")
  )

  console.log(
    `Extracted ${sortedCompoundList.length} unique Vietnamese compound words.`
  )
  console.log(
    `Extracted ${sortedSingleList.length} unique Vietnamese single words.`
  )

  const outCompoundPath = path.resolve(
    process.cwd(),
    "scripts/data/underthesea-words.txt"
  )
  fs.writeFileSync(
    outCompoundPath,
    `${sortedCompoundList.join("\n")}\n`,
    "utf8"
  )
  console.log("Wrote compounds to:", outCompoundPath)

  const outSingleTxtPath = path.resolve(
    process.cwd(),
    "src/data/underthesea-single-words.txt"
  )
  fs.writeFileSync(outSingleTxtPath, `${sortedSingleList.join("\n")}\n`, "utf8")
  console.log("Wrote single words TXT to:", outSingleTxtPath)

  const outSingleJsonPath = path.resolve(
    process.cwd(),
    "src/data/underthesea-single-words.json"
  )
  fs.writeFileSync(
    outSingleJsonPath,
    JSON.stringify(sortedSingleList, null, 2),
    "utf8"
  )
  console.log("Wrote single words JSON to:", outSingleJsonPath)
}

main().catch((err) => {
  console.error("Error building underthesea dictionary:", err)
  process.exit(1)
})
