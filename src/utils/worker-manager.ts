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

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new AnalysisWorker()
    }
    return this.worker
  }

  public init(dictionaries: Dictionaries): void {
    const worker = this.ensureWorker()
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

    return new Promise<{ errors: ErrorInstance[]; totalWords: number }>(
      (resolve, reject) => {
        worker.onmessage = (event: MessageEvent) => {
          const { type, progress, message, errors, totalWords } = event.data
          if (type === "progress") {
            onProgress?.(progress, message)
          } else if (type === "complete") {
            resolve({ errors, totalWords })
          }
        }

        worker.onerror = (error) => {
          logger.error("Analysis worker error:", error)
          reject(new Error("Lỗi trong quá trình phân tích văn bản."))
        }

        // If not initialized in this instance or dictionaries changed, send dictionaries with request
        worker.postMessage({
          type: "analyze",
          textBlocks,
          dictionaries,
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
    }
  }
}

export const analysisWorkerManager = new AnalysisWorkerManager()
