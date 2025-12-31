// src/types/errors.d.ts

export type ErrorType = 
  | 'Dictionary'
  | 'Uppercase'
  | 'Tone'
  | 'Structure'
  | 'Typo'
  | 'Foreign'
  | 'Spelling';

export interface ErrorContext {
  paragraphIndex: number;
  matchIndex: number;
  originalParagraph: string;
}

export interface ErrorInstance {
  word: string;
  type: ErrorType;
  reason: string;
  context: ErrorContext;
}

export interface ErrorGroup {
  id: string; // e.g., "word-type"
  word: string;
  type: ErrorType;
  reason: string;
  contexts: ErrorContext[];
}
