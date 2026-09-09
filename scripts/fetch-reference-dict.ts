import fs from "node:fs"
import path from "node:path"

const HUNSPELL_VI_DAUCU_URL =
  "https://raw.githubusercontent.com/1ec5/hunspell-vi/main/dictionaries/vi-DauCu.dic"
const HUNSPELL_VI_DAUMOI_URL =
  "https://raw.githubusercontent.com/1ec5/hunspell-vi/main/dictionaries/vi-DauMoi.dic"

async function fetchDicFile(url: string): Promise<string> {
  console.log(`Fetching from: ${url}`)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} fetching ${url}`)
  }
  return await res.text()
}

function parseHunspellDic(content: string): Set<string> {
  const words = new Set<string>()
  const lines = content.split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    // Skip first line if it's the entry count
    if (i === 0 && /^\d+$/.test(line)) continue

    // Hunspell format: word/flags -> strip /flags
    const word = line.split("/")[0].trim().normalize("NFC")
    if (word) {
      words.add(word)
    }
  }

  return words
}

async function main() {
  console.log(
    "=== Fetching Vietnamese Reference Dictionaries (Hunspell vi) ==="
  )

  const [dauCuContent, dauMoiContent] = await Promise.all([
    fetchDicFile(HUNSPELL_VI_DAUCU_URL),
    fetchDicFile(HUNSPELL_VI_DAUMOI_URL)
  ])

  const dauCuWords = parseHunspellDic(dauCuContent)
  const dauMoiWords = parseHunspellDic(dauMoiContent)

  const mergedSet = new Set<string>()
  for (const w of dauCuWords) mergedSet.add(w)
  for (const w of dauMoiWords) mergedSet.add(w)

  // Also include underthesea single words if available
  const undertheseaSinglePath = path.resolve(
    process.cwd(),
    "src/data/underthesea-single-words.json"
  )
  if (fs.existsSync(undertheseaSinglePath)) {
    try {
      const undertheseaWords = JSON.parse(
        fs.readFileSync(undertheseaSinglePath, "utf8")
      ) as string[]
      for (const w of undertheseaWords) {
        if (typeof w === "string" && w.trim()) {
          mergedSet.add(w.trim().normalize("NFC"))
        }
      }
      console.log(`- underthesea-single: ${undertheseaWords.length}`)
    } catch (err) {
      console.warn("Could not read underthesea-single-words.json:", err)
    }
  }

  const sortedList = Array.from(mergedSet).sort((a, b) =>
    a.localeCompare(b, "vi")
  )

  console.log(`Total unique reference words: ${sortedList.length}`)
  console.log(`- vi-DauCu: ${dauCuWords.size}`)
  console.log(`- vi-DauMoi: ${dauMoiWords.size}`)

  // Ensure src/data directory exists
  const dataDir = path.resolve(process.cwd(), "src/data")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const outJsonPath = path.resolve(dataDir, "reference-vn.json")
  fs.writeFileSync(outJsonPath, JSON.stringify(sortedList, null, 2), "utf8")
  console.log(`Saved reference dictionary JSON to: ${outJsonPath}`)

  const outTxtPath = path.resolve(dataDir, "reference-vn.txt")
  fs.writeFileSync(outTxtPath, `${sortedList.join("\n")}\n`, "utf8")
  console.log(`Saved reference dictionary TXT to: ${outTxtPath}`)
}

main().catch((err) => {
  console.error("Error fetching reference dictionary:", err)
  process.exit(1)
})
