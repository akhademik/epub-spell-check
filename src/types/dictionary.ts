export type Dictionary = Set<string>

export interface IndexedDictionary {
  words: string[]
  byLength: Map<number, string[]>
  baseWordCache: Map<string, string>
}

export interface Dictionaries {
  vietnamese: Dictionary
  nonVietnamese: Dictionary
  custom: Dictionary
  names: Dictionary
  indexed?: {
    vietnamese: IndexedDictionary
    nonVietnamese: IndexedDictionary
    custom: IndexedDictionary
    names: IndexedDictionary
  }
}

export interface DictionaryStatus {
  isVietnameseLoaded: boolean
  isNonVietnameseLoaded: boolean
  isCustomLoaded: boolean
  isNamesLoaded: boolean
  vietnameseWordCount: number
  nonVietnameseWordCount: number
  customWordCount: number
  namesWordCount: number
}
