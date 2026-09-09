import type { ErrorInstance } from "../types/errors"

export interface ConfusableRule {
  wrongPhrase: string
  correctPhrase: string
  reason: string
  severity: "always_wrong" | "context_dependent"
}

/**
 * High-accuracy curated list of classic Vietnamese confusable pairs & collocations.
 */
export const CONFUSABLE_RULES: ConfusableRule[] = [
  // 1. Always wrong compound phrases
  {
    wrongPhrase: "chuẩn đoán",
    correctPhrase: "chẩn đoán",
    reason: "Sai từ vựng: đúng chuẩn là 'chẩn đoán' (chẩn đoán bệnh, hình ảnh)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "sát nhập",
    correctPhrase: "sáp nhập",
    reason: "Sai từ vựng: đúng chuẩn là 'sáp nhập' (sáp nhập tỉnh, cơ quan)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "sáng lạng",
    correctPhrase: "sáng lạn",
    reason:
      "Sai từ vựng: đúng chuẩn là 'xán lạn' hoặc 'sáng lạn' (tương lai sáng lạn)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "vô hình chung",
    correctPhrase: "vô hình trung",
    reason:
      "Sai từ vựng: đúng chuẩn là 'vô hình trung' (nghĩa là tự nhiên thành ra)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "tựu chung",
    correctPhrase: "tựu trung",
    reason: "Sai từ vựng: đúng chuẩn là 'tựu trung' (nghĩa là tóm lại, quy về)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "cọ sát",
    correctPhrase: "cọ xát",
    reason: "Sai từ vựng: đúng chuẩn là 'cọ xát' (cọ xát thực tế, ma sát)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "thăm quan",
    correctPhrase: "tham quan",
    reason: "Sai từ vựng: đúng chuẩn là 'tham quan' (quan sát học hỏi)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "đường xá",
    correctPhrase: "đường sá",
    reason:
      "Sai chính tả: đúng chuẩn là 'đường sá' (sá là từ Hán-Việt chỉ đường đi)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "phố xá",
    correctPhrase: "phố sá",
    reason: "Sai chính tả: đúng chuẩn là 'phố sá'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chính chu",
    correctPhrase: "chỉnh chu",
    reason: "Sai chính tả: đúng chuẩn là 'chỉnh chu'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "xúc tích",
    correctPhrase: "súc tích",
    reason: "Sai từ vựng: đúng chuẩn là 'súc tích' (ngắn gọn, cô đọng)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "bổ xung",
    correctPhrase: "bổ sung",
    reason: "Sai chính tả: đúng chuẩn là 'bổ sung'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "đọc giả",
    correctPhrase: "độc giả",
    reason: "Sai từ vựng: đúng chuẩn là 'độc giả' (người đọc)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chắp bút",
    correctPhrase: "chấp bút",
    reason: "Sai từ vựng: người khởi thảo văn kiện đúng là 'chấp bút'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "sơ xuất",
    correctPhrase: "sơ suất",
    reason: "Sai chính tả: đúng chuẩn là 'sơ suất'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "xơ xuất",
    correctPhrase: "sơ suất",
    reason: "Sai chính tả: đúng chuẩn là 'sơ suất'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "suôn xẻ",
    correctPhrase: "suôn sẻ",
    reason: "Sai chính tả: đúng chuẩn là 'suôn sẻ'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "dè xẻn",
    correctPhrase: "dè sẻn",
    reason: "Sai chính tả: đúng chuẩn là 'dè sẻn'",
    severity: "always_wrong"
  },

  // 2. Collocation-dependent pairs (Contextual)
  {
    wrongPhrase: "dành giật",
    correctPhrase: "giành giật",
    reason: "Dùng từ theo ngữ cảnh: 'giành giật' thay vì 'dành giật'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "tranh dành",
    correctPhrase: "tranh giành",
    reason: "Dùng từ theo ngữ cảnh: 'tranh giành' thay vì 'tranh dành'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "giành dụm",
    correctPhrase: "dành dụm",
    reason: "Dùng từ theo ngữ cảnh: 'dành dụm' thay vì 'giành dụm'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "để giành",
    correctPhrase: "để dành",
    reason: "Dùng từ theo ngữ cảnh: 'để dành' thay vì 'để giành'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "giành riêng",
    correctPhrase: "dành riêng",
    reason: "Dùng từ theo ngữ cảnh: 'dành riêng' thay vì 'giành riêng'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "dành quyền",
    correctPhrase: "giành quyền",
    reason: "Dùng từ theo ngữ cảnh: 'giành quyền' thay vì 'dành quyền'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "dành độc lập",
    correctPhrase: "giành độc lập",
    reason: "Dùng từ theo ngữ cảnh: 'giành độc lập' thay vì 'dành độc lập'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "giành tình cảm",
    correctPhrase: "dành tình cảm",
    reason: "Dùng từ theo ngữ cảnh: 'dành tình cảm' thay vì 'giành tình cảm'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "xử dụng",
    correctPhrase: "sử dụng",
    reason: "Sai từ vựng: đúng chuẩn là 'sử dụng'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "sử lí",
    correctPhrase: "xử lý",
    reason: "Sai từ vựng: đúng chuẩn là 'xử lý'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "sử sự",
    correctPhrase: "xử sự",
    reason: "Sai từ vựng: đúng chuẩn là 'xử sự'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "xét sử",
    correctPhrase: "xét xử",
    reason: "Sai từ vựng: đúng chuẩn là 'xét xử'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "lịch xử",
    correctPhrase: "lịch sử",
    reason: "Sai từ vựng: đúng chuẩn là 'lịch sử'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "chia xẻ",
    correctPhrase: "chia sẻ",
    reason: "Dùng từ theo ngữ cảnh: 'chia sẻ' (tình cảm, thông tin)",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "sẻ gỗ",
    correctPhrase: "xẻ gỗ",
    reason: "Dùng từ theo ngữ cảnh: 'xẻ gỗ' thay vì 'sẻ gỗ'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "thái độ bàng quang",
    correctPhrase: "thái độ bàng quan",
    reason:
      "Dùng từ theo ngữ cảnh: 'bàng quan' (đứng ngoài xem) khác 'bàng quang' (bọng đái)",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "nghe phong phanh",
    correctPhrase: "nghe phong thanh",
    reason:
      "Dùng từ theo ngữ cảnh: 'nghe phong thanh' (nghe tin đồn thoáng qua)",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "bất chắc",
    correctPhrase: "bất trắc",
    reason: "Sai chính tả: đúng chuẩn là 'bất trắc' (tình huống bất ngờ)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "bàn dao",
    correctPhrase: "bàn giao",
    reason:
      "Sai từ vựng: đúng chuẩn là 'bàn giao' (chuyển giao công việc/tài sản)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "bảo hoà",
    correctPhrase: "bão hòa",
    reason: "Sai chính tả: đúng chuẩn là 'bão hòa'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "bêu diếu",
    correctPhrase: "bêu riếu",
    reason: "Sai chính tả: đúng chuẩn là 'bêu riếu'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chân châu",
    correctPhrase: "trân châu",
    reason: "Sai từ vựng: đúng chuẩn là 'trân châu' (hạt trân châu, ngọc quý)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chây lười",
    correctPhrase: "trây lười",
    reason: "Sai chính tả: đúng chuẩn là 'trây lười' (lười biếng)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chót dại",
    correctPhrase: "trót dại",
    reason: "Sai chính tả: đúng chuẩn là 'trót dại' (lỡ lầm)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chưng bày",
    correctPhrase: "trưng bày",
    reason: "Sai từ vựng: đúng chuẩn là 'trưng bày' (triển lãm)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "trương mục",
    correctPhrase: "chương mục",
    reason:
      "Dùng từ theo ngữ cảnh: 'chương mục' (mục lục) hoặc 'trương mục' (tài khoản)",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "co dãn",
    correctPhrase: "co giãn",
    reason: "Sai chính tả: đúng chuẩn là 'co giãn'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "khoắc khoải",
    correctPhrase: "khắc khoải",
    reason: "Sai chính tả: đúng chuẩn là 'khắc khoải'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "khập khiển",
    correctPhrase: "khập khiễng",
    reason: "Sai chính tả: đúng chuẩn là 'khập khiễng'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chấp vá",
    correctPhrase: "chắp vá",
    reason: "Sai từ vựng: 'chắp vá' thay vì 'chấp vá'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "giãy dụa",
    correctPhrase: "giãy giụa",
    reason: "Sai chính tả: đúng chuẩn là 'giãy giụa'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "dãy dụa",
    correctPhrase: "giãy giụa",
    reason: "Sai chính tả: đúng chuẩn là 'giãy giụa'",
    severity: "always_wrong"
  }
]

/**
 * Scan a text paragraph for contextual confusion errors (confusable n-grams).
 */
export function scanContextualErrors(
  text: string,
  meta: {
    paragraphIndex: number
    chapterIndex?: number
    filePath?: string
    blockId?: string
  }
): ErrorInstance[] {
  if (!text || text.length < 3) return []

  const errors: ErrorInstance[] = []
  const normText = text.normalize("NFC")
  const lowerText = normText.toLowerCase()

  for (const rule of CONFUSABLE_RULES) {
    const targetLow = rule.wrongPhrase.toLowerCase()
    let searchStart = 0

    while (true) {
      const matchIndex = lowerText.indexOf(targetLow, searchStart)
      if (matchIndex === -1) break

      // Verify word boundary before and after match
      const beforeChar = matchIndex > 0 ? lowerText[matchIndex - 1] : " "
      const afterIndex = matchIndex + targetLow.length
      const afterChar =
        afterIndex < lowerText.length ? lowerText[afterIndex] : " "

      const isWordBoundaryBefore = /[\s.,!?;:()[\]{}"'“”‘’<>\-\\/]/.test(
        beforeChar
      )
      const isWordBoundaryAfter = /[\s.,!?;:()[\]{}"'“”‘’<>\-\\/]/.test(
        afterChar
      )

      if (isWordBoundaryBefore && isWordBoundaryAfter) {
        const matchedText = normText.substring(matchIndex, afterIndex)
        const instanceId = `${meta.blockId || meta.paragraphIndex}-${matchIndex}-${afterIndex}-ctx`

        errors.push({
          id: instanceId,
          word: matchedText,
          originalWord: matchedText,
          type: "ContextConfusion",
          reason: rule.reason,
          suggestions: [rule.correctPhrase],
          context: {
            originalParagraph: normText,
            startIndex: matchIndex,
            endIndex: afterIndex,
            matchIndex,
            chapterIndex: meta.chapterIndex ?? 0,
            paragraphIndex: meta.paragraphIndex,
            filePath: meta.filePath,
            blockId: meta.blockId
          }
        })
      }

      searchStart = matchIndex + targetLow.length
    }
  }

  return errors
}

let cachedCompoundWords: Set<string> | null = null

/**
 * Loads the Underthesea Vietnamese compound words dictionary from /underthesea-words.txt.
 * Cached in memory during session.
 */
export async function loadUndertheseaCompounds(): Promise<Set<string>> {
  if (cachedCompoundWords && cachedCompoundWords.size > 0) {
    return cachedCompoundWords
  }

  const set = new Set<string>()
  try {
    const res = await fetch("/underthesea-words.txt")
    if (res.ok) {
      const text = await res.text()
      const lines = text.split(/\r?\n/)
      for (const line of lines) {
        const trimmed = line.trim().toLowerCase().normalize("NFC")
        if (trimmed) set.add(trimmed)
      }
    }
  } catch {
    /* fallback */
  }

  cachedCompoundWords = set
  return set
}

/**
 * Checks whether a 2-3 word phrase is a recognized Vietnamese compound in Underthesea dictionary.
 */
export function isKnownCompound(
  phrase: string,
  compoundDict?: Set<string>
): boolean {
  const dict = compoundDict ?? cachedCompoundWords
  if (!dict || dict.size === 0) return false
  return dict.has(phrase.trim().toLowerCase().normalize("NFC"))
}

/**
 * Finds candidate compound corrections from underthesea dictionary by testing phonetic variations.
 */
export function findCompoundSuggestions(
  phrase: string,
  compoundDict?: Set<string>
): string[] {
  const dict = compoundDict ?? cachedCompoundWords
  if (!dict || dict.size === 0) return []

  const low = phrase.trim().toLowerCase().normalize("NFC")
  const suggestions: string[] = []

  // Check known confusable rule suggestions first
  for (const rule of CONFUSABLE_RULES) {
    if (rule.wrongPhrase.toLowerCase() === low) {
      suggestions.push(rule.correctPhrase)
    }
  }

  // Phonetic variant swaps (s<->x, d<->gi, tr<->ch, l<->n)
  const swapPairs: [string, string][] = [
    ["s", "x"],
    ["x", "s"],
    ["d", "gi"],
    ["gi", "d"],
    ["tr", "ch"],
    ["ch", "tr"],
    ["l", "n"],
    ["n", "l"]
  ]

  const words = low.split(/\s+/)
  if (words.length >= 2 && words.length <= 4) {
    for (const [from, to] of swapPairs) {
      // Test replacing in first word
      if (words[0].startsWith(from)) {
        const candidate = [
          to + words[0].slice(from.length),
          ...words.slice(1)
        ].join(" ")
        if (dict.has(candidate) && !suggestions.includes(candidate)) {
          suggestions.push(candidate)
        }
      }
      // Test replacing in second word
      if (words[1].startsWith(from)) {
        const candidate = [
          words[0],
          to + words[1].slice(from.length),
          ...words.slice(2)
        ].join(" ")
        if (dict.has(candidate) && !suggestions.includes(candidate)) {
          suggestions.push(candidate)
        }
      }
    }
  }

  return suggestions
}
