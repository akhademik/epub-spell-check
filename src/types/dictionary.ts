export type Dictionary = Set<string>

export interface Dictionaries {
  vietnamese: Dictionary
  nonVietnamese: Dictionary
  custom: Dictionary
  names: Dictionary
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
