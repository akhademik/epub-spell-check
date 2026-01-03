import { ErrorInstance, ErrorType } from "../types/errors";

import {
  WORD_REGEX,
  ANALYSIS_CHUNK_SIZE,
  getErrorType,
} from "../utils/analysis-core";

import type { TextContentBlock } from "../types/epub";
import type { Dictionaries } from "../types/dictionary";
import type { CheckSettings } from "../utils/analysis-core";

/**
 * Handles incoming messages from the main thread to start the analysis process.
 * @param event - The message event containing the data needed for analysis.
 */
self.onmessage = async (
  event: MessageEvent<{
    textBlocks: TextContentBlock[];
    dictionaries: Dictionaries;
    settings: CheckSettings;
    chapterStartIndex: number;
  }>
) => {
  const { textBlocks, dictionaries, settings, chapterStartIndex } = event.data;

  let totalWords = 0;
  const allErrors: ErrorInstance[] = [];
  const totalBlocks = textBlocks.length;
  const analysisCache = new Map<string, { type: ErrorType; reason: string } | null>();

  const checkWord = (word: string): { type: ErrorType; reason: string } | null => {
    if (analysisCache.has(word)) {
      return analysisCache.get(word)!;
    }

    if (word.length < 2 || dictionaries.custom.has(word)) {
      analysisCache.set(word, null);
      return null;
    }

    const error = getErrorType(word, dictionaries, settings);
    analysisCache.set(word, error);
    return error;
  };

  for (let i = 0; i < totalBlocks; i++) {
    const block = textBlocks[i];
    let match;
    WORD_REGEX.lastIndex = 0;
    while ((match = WORD_REGEX.exec(block.text)) !== null) {
      const word = match[0];
      totalWords++;

      const error = checkWord(word);

      if (error) {
        allErrors.push({
          word,
          originalWord: word,
          type: error.type,
          reason: error.reason,
          context: {
            originalParagraph: block.text,
            startIndex: match.index,
            endIndex: match.index + word.length,
            chapterIndex: chapterStartIndex + i,
            paragraphIndex: i,
            matchIndex: match.index,
          },
        });
      }
    }

    if (i % ANALYSIS_CHUNK_SIZE === 0) {
      self.postMessage({
        type: 'progress',
        progress: (i / totalBlocks) * 100,
        message: 'Đang kiểm tra chính tả...',
      });
    }
  }

  self.postMessage({
    type: 'complete',
    errors: allErrors,
    totalWords: totalWords,
  });
};