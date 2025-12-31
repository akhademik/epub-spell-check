// src/types/dictionary.d.ts

export type Dictionary = Set<string>;

export interface Dictionaries {
  vietnamese: Dictionary;
  english: Dictionary;
  custom: Dictionary;
}

export interface DictionaryStatus {
  isVietnameseLoaded: boolean;
  isEnglishLoaded: boolean;
  isCustomLoaded: boolean;
  vietnameseWordCount: number;
  englishWordCount: number;
  customWordCount: number;
}
