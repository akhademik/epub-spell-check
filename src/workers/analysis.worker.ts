import type { CheckSettings } from "../types/analysis"
import type { Dictionaries } from "../types/dictionary"
import type { TextContentBlock } from "../types/epub"
import type { ErrorInstance } from "../types/errors"
import {
  ANALYSIS_CHUNK_SIZE,
  getErrorType,
  WORD_REGEX
} from "../utils/analysis-core"
import { scanContextualErrors } from "../utils/context-confusion"

interface WorkerMessage {
  type?: "init" | "analyze"
  textBlocks?: TextContentBlock[]
  dictionaries?: Dictionaries
  checkSettings?: CheckSettings
  chapterStartIndex?: number
}

let cachedDictionaries: Dictionaries | null = null

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const data = event.data

  if (data.type === "init") {
    if (data.dictionaries) {
      cachedDictionaries = data.dictionaries
    }
    return
  }

  const {
    textBlocks = [],
    dictionaries = cachedDictionaries,
    checkSettings,
    chapterStartIndex = 0
  } = data

  if (dictionaries) {
    cachedDictionaries = dictionaries
  }

  if (!cachedDictionaries) {
    self.postMessage({
      type: "complete",
      errors: [],
      totalWords: 0
    })
    return
  }

  const activeDicts = cachedDictionaries
  const allErrors: ErrorInstance[] = []
  let totalWordCount = 0

  const totalParagraphs = textBlocks.length

  for (let i = 0; i < totalParagraphs; i += ANALYSIS_CHUNK_SIZE) {
    const chunk = textBlocks.slice(i, i + ANALYSIS_CHUNK_SIZE)

    for (let cIdx = 0; cIdx < chunk.length; cIdx++) {
      const paragraph = chunk[cIdx]
      const paragraphIndex = i + cIdx
      const text = (paragraph.text || "").normalize("NFC")
      let match: RegExpExecArray | null

      WORD_REGEX.lastIndex = 0
      while (true) {
        match = WORD_REGEX.exec(text)
        if (match === null) break

        const originalWord = match[0]
        totalWordCount++

        const errorInfo = getErrorType(originalWord, activeDicts, checkSettings)

        if (errorInfo) {
          const startIndex = match.index
          const endIndex = startIndex + originalWord.length
          const instanceId = `${paragraph.id || paragraphIndex}-${startIndex}-${endIndex}`

          allErrors.push({
            id: instanceId,
            word: originalWord,
            originalWord,
            context: {
              originalParagraph: text,
              startIndex,
              endIndex,
              matchIndex: startIndex,
              chapterIndex: chapterStartIndex,
              paragraphIndex,
              filePath: paragraph.filePath,
              blockId: paragraph.id
            },
            type: errorInfo.type,
            reason: errorInfo.reason
          })
        }
      }

      if (checkSettings?.vietnamese !== false) {
        const contextualErrors = scanContextualErrors(text, {
          paragraphIndex,
          chapterIndex: chapterStartIndex,
          filePath: paragraph.filePath,
          blockId: paragraph.id
        })
        if (contextualErrors.length > 0) {
          allErrors.push(...contextualErrors)
        }
      }
    }

    const progress = Math.min(
      100,
      Math.round(((i + chunk.length) / totalParagraphs) * 100)
    )
    self.postMessage({
      type: "progress",
      progress,
      message: `Đang quét từ ngữ... (${Math.min(i + chunk.length, totalParagraphs)}/${totalParagraphs} đoạn)`
    })
  }

  self.postMessage({
    type: "complete",
    errors: allErrors,
    totalWords: totalWordCount
  })
}
