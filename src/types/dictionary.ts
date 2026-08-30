export type Dictionary = Set<string>

export interface Dictionaries {
  vietnamese: Dictionary
  nonVietnamese: Dictionary
  custom: Dictionary
}

export interface DictionaryStatus {
  isVietnameseLoaded: boolean
  isNonVietnameseLoaded: boolean
  isCustomLoaded: boolean
  vietnameseWordCount: number
  nonVietnameseWordCount: number
  customWordCount: number
}
