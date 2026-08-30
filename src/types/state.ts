import type { CheckSettings } from "./analysis"
import type { Dictionaries, DictionaryStatus } from "./dictionary"
import type { ErrorGroup } from "./errors"

export interface ReaderSettings {
  fontSize: number
  fontFamily: "serif" | "sans-serif"
}

export interface ToastNotification {
  id: string
  message: string
  type: "info" | "error" | "success"
}

export interface AppState {
  dictionaries: Dictionaries
  dictionaryStatus: DictionaryStatus
  checkSettings: CheckSettings
  whitelist: string[]
  readerSettings: ReaderSettings
  currentBookTitle: string
  currentCoverUrl: string | null
  loadedTextContent: { text: string }[]
  totalWords: number
  allDetectedErrors: ErrorGroup[]
}
