import type { CheckSettings } from "../types/analysis"
import type { Dictionaries } from "../types/dictionary"
import type { TextContentBlock } from "../types/epub"
import type { ErrorInstance } from "../types/errors"
import AnalysisWorker from "../workers/analysis.worker?worker"
import { logger } from "./logger"

export type AnalysisProgressCallback = (
  progress: number,
  message: string
) => void

export class AnalysisWorkerManager {
  private worker: Worker | null = null
  private isInitialized = false
  private activeAnalysis = false
  private currentRequestId = 0

  public get isAnalyzing(): boolean {
    return this.activeAnalysis
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new AnalysisWorker()
      this.isInitialized = false
    }
    return this.worker
  }

  public init(dictionaries: Dictionaries): void {
    const worker = this.ensureWorker()
    this.isInitialized = true
    worker.postMessage({
      type: "init",
      dictionaries
    })
  }

  public analyze(
    textBlocks: TextContentBlock[],
    dictionaries: Dictionaries,
    checkSettings: CheckSettings,
    onProgress?: AnalysisProgressCallback,
    chapterStartIndex = 0
  ): Promise<{ errors: ErrorInstance[]; totalWords: number }> {
    const worker = this.ensureWorker()
    const requestId = ++this.currentRequestId
    this.activeAnalysis = true

    return new Promise<{ errors: ErrorInstance[]; totalWords: number }>(
      (resolve, reject) => {
        worker.onmessage = (event: MessageEvent) => {
          if (requestId !== this.currentRequestId) return
          const { type, progress, message, errors, totalWords } = event.data
          if (type === "progress") {
            onProgress?.(progress, message)
          } else if (type === "complete") {
            this.activeAnalysis = false
            resolve({ errors, totalWords })
          }
        }

        worker.onerror = (error) => {
          if (requestId !== this.currentRequestId) return
          this.activeAnalysis = false
          logger.error("Analysis worker error:", error)
          reject(new Error("Lỗi trong quá trình phân tích văn bản."))
        }

        // Zero-clone optimization: only send full dictionaries if not initialized yet
        const dictsToSend = this.isInitialized ? undefined : dictionaries
        if (!this.isInitialized) {
          this.isInitialized = true
        }

        worker.postMessage({
          type: "analyze",
          textBlocks,
          dictionaries: dictsToSend,
          checkSettings,
          chapterStartIndex
        })
      }
    )
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.isInitialized = false
      this.activeAnalysis = false
    }
  }
}

export const analysisWorkerManager = new AnalysisWorkerManager()
