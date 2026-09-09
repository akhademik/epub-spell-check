import fs from "node:fs"
import path from "node:path"

/**
 * Phonological confusion mappings in Vietnamese:
 * 1. Initial consonants:
 *    - l <-> n
 *    - s <-> x
 *    - tr <-> ch
 *    - d <-> gi <-> r
 * 2. Vowel tones:
 *    - hỏi <-> ngã (ở/ỡ, ả/ã,...)
 */

const INITIAL_CONSONANT_PAIRS: [string, string][] = [
  ["l", "n"],
  ["s", "x"],
  ["tr", "ch"],
  ["d", "gi"],
  ["r", "d"],
  ["r", "gi"]
]

// Tone swapping for hỏi <-> ngã
const HOI_NGA_MAP: Record<string, string> = {
  ả: "ã",
  ã: "ả",
  ẳ: "ẵ",
  ẵ: "ẳ",
  ẩ: "ẫ",
  ẫ: "ẩ",
  ẻ: "ẽ",
  ẽ: "ẻ",
  ể: "ễ",
  ễ: "ể",
  ỉ: "ĩ",
  ĩ: "ỉ",
  ỏ: "õ",
  õ: "ỏ",
  ổ: "ỗ",
  ỗ: "ổ",
  ở: "ỡ",
  ỡ: "ở",
  ủ: "ũ",
  ũ: "ủ",
  ử: "ữ",
  ữ: "ử",
  ỷ: "ỹ",
  ỹ: "ỷ",
  Ả: "Ã",
  Ã: "Ả",
  Ẳ: "Ẵ",
  Ẵ: "Ẳ",
  Ẩ: "Ẫ",
  Ẫ: "Ẩ",
  Ẻ: "Ẽ",
  Ẽ: "Ẻ",
  Ể: "Ễ",
  Ễ: "Ể",
  Ỉ: "Ĩ",
  Ĩ: "Ỉ",
  Ỏ: "Õ",
  Õ: "Ỏ",
  Ổ: "Ỗ",
  Ỗ: "Ổ",
  Ở: "Ỡ",
  Ỡ: "Ở",
  Ủ: "Ũ",
  Ũ: "Ủ",
  Ử: "Ữ",
  Ữ: "Ử",
  Ỷ: "Ỹ",
  Ỹ: "Ỷ"
}

function swapHoiNga(word: string): string | null {
  let changed = false
  const chars = Array.from(word.normalize("NFC"))
  const swappedChars = chars.map((c) => {
    if (HOI_NGA_MAP[c]) {
      changed = true
      return HOI_NGA_MAP[c]
    }
    return c
  })
  return changed ? swappedChars.join("") : null
}

function generateInitialConsonantVariants(syllable: string): string[] {
  const variants: string[] = []
  const lower = syllable.toLowerCase()

  for (const [a, b] of INITIAL_CONSONANT_PAIRS) {
    if (lower.startsWith(a)) {
      variants.push(b + lower.slice(a.length))
    } else if (lower.startsWith(b)) {
      variants.push(a + lower.slice(b.length))
    }
  }

  return variants
}

async function main() {
  const compoundPath = path.resolve(
    process.cwd(),
    "public/underthesea-words.txt"
  )
  if (!fs.existsSync(compoundPath)) {
    console.error(`Not found: ${compoundPath}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(compoundPath, "utf8")
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim().toLowerCase().normalize("NFC"))
    .filter(Boolean)
  const compoundSet = new Set<string>(lines)

  console.log(`Loaded ${compoundSet.size} compounds from underthesea-words.txt`)

  const candidatePairs: {
    phraseA: string
    phraseB: string
    type: string
    diff: string
  }[] = []

  const seenPairKeys = new Set<string>()

  for (const phrase of compoundSet) {
    const syllables = phrase.split(/\s+/)
    if (syllables.length < 2 || syllables.length > 4) continue

    // 1. Check initial consonant swaps for each syllable
    for (let i = 0; i < syllables.length; i++) {
      const syl = syllables[i]
      const sylVariants = generateInitialConsonantVariants(syl)

      for (const variant of sylVariants) {
        const copy = [...syllables]
        copy[i] = variant
        const altPhrase = copy.join(" ")

        if (compoundSet.has(altPhrase) && altPhrase !== phrase) {
          const key = [phrase, altPhrase].sort().join(" <--> ")
          if (!seenPairKeys.has(key)) {
            seenPairKeys.add(key)
            candidatePairs.push({
              phraseA: phrase,
              phraseB: altPhrase,
              type: "initial_consonant",
              diff: `${syl} <-> ${variant}`
            })
          }
        }
      }

      // 2. Check hỏi <-> ngã swaps for each syllable
      const hoiNgaSyl = swapHoiNga(syl)
      if (hoiNgaSyl) {
        const copy = [...syllables]
        copy[i] = hoiNgaSyl
        const altPhrase = copy.join(" ")

        if (compoundSet.has(altPhrase) && altPhrase !== phrase) {
          const key = [phrase, altPhrase].sort().join(" <--> ")
          if (!seenPairKeys.has(key)) {
            seenPairKeys.add(key)
            candidatePairs.push({
              phraseA: phrase,
              phraseB: altPhrase,
              type: "hoi_nga",
              diff: `${syl} <-> ${hoiNgaSyl}`
            })
          }
        }
      }
    }
  }

  console.log(
    `Found ${candidatePairs.length} candidate confusable pairs that both exist in lexicon.`
  )

  const outReportPath = path.resolve(
    process.cwd(),
    "scripts/confusable-candidates-report.json"
  )
  fs.writeFileSync(
    outReportPath,
    JSON.stringify(candidatePairs, null, 2),
    "utf8"
  )
  console.log(`Saved report to: ${outReportPath}`)

  const outMdPath = path.resolve(
    process.cwd(),
    "scripts/confusable-candidates-report.md"
  )
  let md =
    "# Báo cáo các cặp từ ghép đồng âm/dễ nhầm lẫn (Tự động sinh từ underthesea)\n\n"
  md += `Tổng số cặp phát hiện: **${candidatePairs.length}**\n\n`
  md += "| STT | Cụm từ A | Cụm từ B | Loại nhầm lẫn | Khác biệt |\n"
  md += "|-----|----------|----------|---------------|-----------|\n"
  candidatePairs.slice(0, 100).forEach((p, idx) => {
    md += `| ${idx + 1} | \`${p.phraseA}\` | \`${p.phraseB}\` | ${p.type} | ${p.diff} |\n`
  })
  if (candidatePairs.length > 100) {
    md += `\n*... và ${candidatePairs.length - 100} cặp khác trong file JSON.*`
  }
  fs.writeFileSync(outMdPath, md, "utf8")
  console.log(`Saved markdown report to: ${outMdPath}`)
}

main().catch((err) => {
  console.error("Error generating confusable pairs:", err)
  process.exit(1)
})
