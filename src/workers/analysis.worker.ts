// src/workers/analysis.worker.ts

// @ts-expect-error: Used for type annotation in onmessage event.data
import type { Dictionaries } from "../types/dictionary"; // Explicit type import
import { ErrorInstance, ErrorType } from "../types/errors";
// @ts-expect-error: Used for type annotation in onmessage event.data
import type { TextContentBlock } from "../types/epub"; // Explicit type import

// Import from analysis-core
import {
  WORD_REGEX,
  ANALYSIS_CHUNK_SIZE,
  getErrorType, // Used by checkWord function
} from "../utils/analysis-core";
// @ts-expect-error: Used for type annotation in onmessage event.data
import type { CheckSettings } from "../utils/analysis-core"; // Explicit type import




// The analyzeText function will be triggered by messages from the main thread
self.onmessage = async (event: MessageEvent) => {
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
    WORD_REGEX.lastIndex = 0; // Reset regex lastIndex for consistent results
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
            chapterIndex: chapterStartIndex + i, // Adjust chapterIndex for worker
            paragraphIndex: i, // Relative to the block list sent to worker
            matchIndex: match.index,
          },
        });
      }
    }

    if (i % ANALYSIS_CHUNK_SIZE === 0) {
      // Post progress back to the main thread
      self.postMessage({
        type: 'progress',
        progress: (i / totalBlocks) * 100, // Progress of this worker
        message: `Đang phân tích chương ${chapterStartIndex + i + 1}...`,
      });
    }
  }

  // Post results back to the main thread
  self.postMessage({
    type: 'complete',
    errors: allErrors,
    totalWords: totalWords,
  });
};
