export type ErrorType =
  | "Dictionary"
  | "NonVietnamese"
  | "Uppercase"
  | "Typo"
  | "Spelling"
  | "SpecialCharacter"

export interface ErrorInstance {
  id?: string
  word: string
  originalWord: string
  context: {
    originalParagraph: string
    startIndex: number
    endIndex: number
    matchIndex: number
    chapterIndex: number
    paragraphIndex: number
    filePath?: string
    blockId?: string
  }
  type: ErrorType
  reason?: string
  suggestions?: string[]
  resolved?: boolean
}

export interface TieredSuggestions {
  primary: string[]
  secondary: string[]
}

export interface ErrorGroup {
  id: string
  word: string
  type: ErrorType
  reason: string
  count: number
  contexts: ErrorInstance[]
  suggestions?: string[]
  resolved?: boolean
}
