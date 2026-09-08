/**
 * Validation engine for dictionary inputs.
 * Checks for typos, garbled OCR text, footnote merging artifacts,
 * and category mismatches before saving words into Cloudflare KV.
 */

export interface WordValidationResult {
  word: string
  status: "valid" | "warning" | "reject"
  reason?: string
}

// Same pattern the app uses to flag "Gõ máy (Typo)" in analysis-core.ts
const APP_TYPO_ENDING_RE = /(aa|ee|oo|uu|ii|dd|js|kx|wt)$/i

// Single character repeated 2+ times (e.g. "aa", "ee")
const DOUBLED_SINGLE_CHAR_RE = /^(.)\1+$/u

// Vietnamese-exclusive letters & diacritics
const VN_EXCLUSIVE_CHARS =
  "đơưăĐƠƯĂảạằắẳẵặầấẩẫậẻẽẹềếểễệỉĩịỏọồốổỗộờớởỡợủũụừứửữựỳýỷỹỵ" +
  "ẢẠẰẮẲẴẶẦẤẨẪẬẺẼẸỀẾỂỄỆỈĨỊỎỌỒỐỔỖỘỜỚỞỠỢỦŨỤỪỨỬỮỰỲÝỶỸỴ"
const VN_EXCLUSIVE_RE = new RegExp(`[${VN_EXCLUSIVE_CHARS}]`)

// Two TitleCase chunks glued together (e.g. "SignorThưa", "BonjourChào")
const TITLECASE_MERGE_RE = /^\p{Lu}\p{Ll}+\p{Lu}\p{Ll}+$/u

// Check for repeated sound units (e.g. "Hahaha", "Hừhừhừhừ", "hehehe")
export function isRepeatedUnit(word: string): boolean {
  const lw = word.toLowerCase()
  for (let unit = 1; unit <= 4; unit++) {
    if (lw.length < unit * 3) continue
    const chunk = lw.slice(0, unit)
    let i = unit
    let reps = 1
    while (lw.slice(i, i + unit) === chunk) {
      i += unit
      reps++
    }
    if (reps >= 3 && i >= lw.length - 1) return true
  }
  return false
}

/**
 * Validates a single word against the chosen dictionary section.
 */
export function validateDictionaryWord(
  dictName: "vn" | "non-vn" | "custom" | "names",
  rawWord: string
): WordValidationResult {
  const word = rawWord.trim()
  if (!word) {
    return { word, status: "reject", reason: "Từ rỗng" }
  }

  // Check special characters or illegal symbols
  if (/[<>{}()[\]/\\|`~^#*=+_]/.test(word)) {
    return {
      word,
      status: "reject",
      reason: "Chứa ký tự đặc biệt không hợp lệ"
    }
  }

  // 1. Vietnamese Dictionary (vn) Rules
  if (dictName === "vn") {
    if (DOUBLED_SINGLE_CHAR_RE.test(word)) {
      return {
        word,
        status: "reject",
        reason:
          "Chuỗi ký tự lặp đôi (vd 'aa','ee') — vô hiệu hóa bộ dò lỗi gõ máy"
      }
    }
    if (APP_TYPO_ENDING_RE.test(word.toLowerCase())) {
      return {
        word,
        status: "warning",
        reason:
          "Kết thúc bằng cụm ký tự dễ trùng lỗi gõ máy (aa, ee, oo, uu, ii, dd, js...)"
      }
    }
    if (/[fjwz]/i.test(word)) {
      return {
        word,
        status: "warning",
        reason:
          "Chứa phụ âm ngoại lai (f, j, w, z) — thường nên thuộc từ điển Ngoại ngữ"
      }
    }
  }

  // 2. Non-Vietnamese Dictionary (non-vn) Rules
  if (dictName === "non-vn") {
    if (VN_EXCLUSIVE_RE.test(word)) {
      return {
        word,
        status: "reject",
        reason:
          "Chứa ký tự/dấu đặc trưng tiếng Việt (đ, ư, ơ, dấu hỏi/ngã/nặng) — không phải từ ngoại ngữ"
      }
    }
  }

  // 3. Proper Names Dictionary (names) Rules
  if (dictName === "names") {
    if (isRepeatedUnit(word)) {
      return {
        word,
        status: "reject",
        reason:
          "Chuỗi lặp lại âm thanh / tiếng cười (vd Hahaha, Hừhừ) — không phải tên riêng"
      }
    }
    if (TITLECASE_MERGE_RE.test(word)) {
      if (VN_EXCLUSIVE_RE.test(word)) {
        return {
          word,
          status: "reject",
          reason:
            "Dính chữ dịch thuật / chú thích (vd 'SignorThưa', 'BonjourChào')"
        }
      }
      return {
        word,
        status: "warning",
        reason: "Chứa nhiều chữ hoa viết liền dạng CamelCase (vd 'MacArthur')"
      }
    }
  }

  // 4. Custom Dictionary (custom) Rules
  if (dictName === "custom") {
    if (word.length > 30) {
      return {
        word,
        status: "warning",
        reason: "Từ viết tắt/tùy chỉnh dài bất thường (> 30 ký tự)"
      }
    }
  }

  return { word, status: "valid" }
}

/**
 * Batch validates a list of raw words.
 */
export function validateBatchWords(
  dictName: "vn" | "non-vn" | "custom" | "names",
  words: string[]
): {
  valid: string[]
  warnings: WordValidationResult[]
  rejected: WordValidationResult[]
} {
  const valid: string[] = []
  const warnings: WordValidationResult[] = []
  const rejected: WordValidationResult[] = []

  const seen = new Set<string>()

  for (const raw of words) {
    const w = raw.trim()
    if (!w) continue
    if (seen.has(w.toLowerCase())) continue
    seen.add(w.toLowerCase())

    const res = validateDictionaryWord(dictName, w)
    if (res.status === "reject") {
      rejected.push(res)
    } else if (res.status === "warning") {
      warnings.push(res)
      valid.push(w) // Warnings are still allowed if user confirms
    } else {
      valid.push(w)
    }
  }

  return { valid, warnings, rejected }
}
