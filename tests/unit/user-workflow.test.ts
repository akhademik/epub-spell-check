import { describe, expect, it } from "vitest"
import type { CheckSettings } from "../../src/types/analysis"
import type { Dictionaries } from "../../src/types/dictionary"
import type { ErrorInstance } from "../../src/types/errors"
import { getErrorType } from "../../src/utils/analysis-core"
import { findSuggestions, groupErrors } from "../../src/utils/analyzer"
import { getFilteredErrors } from "../../src/utils/filter"

describe("Comprehensive User Action Simulation", () => {
  const mockDictionaries: Dictionaries = {
    vietnamese: new Set([
      "tôi",
      "đi",
      "rút",
      "tiền",
      "ở",
      "cây",
      "tại",
      "người",
      "bạn",
      "mua",
      "một",
      "món",
      "quà",
      "xinh",
      "xắn",
      "này",
      "rất",
      "đẹp",
      "và",
      "ý",
      "nghĩa",
      "việt",
      "nam",
      "quê",
      "hương",
      "sách",
      "học",
      "khoa",
      "toán",
      "hòa",
      "hoà",
      "hóa",
      "hoá"
    ]),
    nonVietnamese: new Set([
      "hello",
      "world",
      "paris",
      "bonjour",
      "english",
      "french"
    ]),
    custom: new Set(["ATM", "VIP", "DNA", "GPS"]),
    names: new Set(["Alexander", "Parmenion", "Persepolis", "Babylon"])
  }

  const initialCheckSettings: CheckSettings = {
    vietnamese: true,
    nonVietnamese: true
  }

  it("Simulates User Flow: Upload, Error Exploration, Instance Navigation, Quick Ignore, Check Toggles, Export", () => {
    // 1. User loads a simulated book with multiple paragraphs (including typo 'tòong')
    const paragraphs = [
      "tÔi đi rút tiền ở cây ATM tại Paris.",
      "Người bạn mua một món quà xinh xắn.",
      "hòa bình và hoà thuận luôn đi cùng nhau.",
      "ViỆt Nam quê hương tôi.",
      "Đoạn này có từ tòong và từ lạ xyzabc."
    ]

    const rawErrors: ErrorInstance[] = []
    let totalWords = 0

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const text = paragraphs[pIdx]
      const words = text.split(/[\s,.]+/)
      for (const w of words) {
        if (!w) continue
        totalWords++
        const err = getErrorType(w, mockDictionaries, initialCheckSettings)
        if (err) {
          rawErrors.push({
            word: w,
            originalWord: w,
            type: err.type,
            reason: err.reason,
            context: {
              originalParagraph: text,
              startIndex: text.indexOf(w),
              endIndex: text.indexOf(w) + w.length,
              matchIndex: text.indexOf(w),
              chapterIndex: 0,
              paragraphIndex: pIdx
            }
          })
        }
      }
    }

    expect(totalWords).toBeGreaterThan(15)
    const allDetectedErrors = groupErrors(rawErrors)

    // "hòa" and "hoà" should NOT be flagged as tone errors
    expect(allDetectedErrors.some((g) => g.word === "hòa")).toBe(false)
    expect(allDetectedErrors.some((g) => g.word === "hoà")).toBe(false)

    // "ATM" and "Paris" are in custom & non-Vietnamese dicts, so NOT flagged
    expect(allDetectedErrors.some((g) => g.word === "ATM")).toBe(false)
    expect(allDetectedErrors.some((g) => g.word === "Paris")).toBe(false)

    // "tòong" MUST be flagged as an error (it is not in vn-dict)
    expect(allDetectedErrors.some((g) => g.word === "tòong")).toBe(true)

    // "tÔi" and "ViỆt" (Uppercase errors) and "xyzabc" (Unknown foreign/non-Vietnamese word)
    expect(allDetectedErrors.some((g) => g.word === "tÔi")).toBe(true)
    expect(allDetectedErrors.some((g) => g.word === "ViỆt")).toBe(true)
    expect(allDetectedErrors.some((g) => g.word === "xyzabc")).toBe(true)

    // 2. User inspects the error list
    const toongGroup = allDetectedErrors.find((g) => g.word === "tòong")
    expect(toongGroup).toBeDefined()
    expect(toongGroup?.type).toBe("UnknownWord")

    // 3. User views suggestions
    const suggestions = findSuggestions("xyzabc", mockDictionaries)
    expect(Array.isArray(suggestions)).toBe(true)

    // 4. User adds "tÔi" to Whitelist (Quick Ignore action)
    let whitelist: string[] = []
    whitelist = [...whitelist, "tÔi"]

    const filtered = getFilteredErrors(
      allDetectedErrors,
      whitelist,
      initialCheckSettings,
      mockDictionaries
    )
    expect(filtered.some((g) => g.word === "tÔi")).toBe(false)
    expect(filtered.some((g) => g.word === "ViỆt")).toBe(true)
    expect(filtered.some((g) => g.word === "tòong")).toBe(true)

    // 5. User exports remaining errors in direct text list format
    const exportedErrors = filtered.map((g) => g.word).join("\n")
    expect(exportedErrors).toContain("tòong")
    expect(exportedErrors).toContain("ViỆt")
    expect(exportedErrors).not.toContain("tÔi")
  })

  it("Advances selection to the next error on replace / replace all, or to previous if last item", async () => {
    const { AppStateModel } = await import("../../src/state.svelte")
    const appState = new AppStateModel()
    appState.dictionaries = mockDictionaries

    const groupA: import("../../src/types/errors").ErrorGroup = {
      id: "group-a",
      word: "aaa",
      type: "UnknownWord",
      reason: "Unknown word",
      count: 2,
      contexts: [
        {
          id: "inst-a1",
          word: "aaa",
          originalWord: "aaa",
          type: "UnknownWord",
          reason: "Unknown word",
          context: {
            originalParagraph: "aaa test",
            startIndex: 0,
            endIndex: 3,
            matchIndex: 0,
            chapterIndex: 0,
            paragraphIndex: 0
          }
        },
        {
          id: "inst-a2",
          word: "aaa",
          originalWord: "aaa",
          type: "UnknownWord",
          reason: "Unknown word",
          context: {
            originalParagraph: "another aaa test",
            startIndex: 8,
            endIndex: 11,
            matchIndex: 8,
            chapterIndex: 0,
            paragraphIndex: 1
          }
        }
      ]
    }

    const groupB: import("../../src/types/errors").ErrorGroup = {
      id: "group-b",
      word: "bbb",
      type: "UnknownWord",
      reason: "Unknown word",
      count: 1,
      contexts: [
        {
          id: "inst-b1",
          word: "bbb",
          originalWord: "bbb",
          type: "UnknownWord",
          reason: "Unknown word",
          context: {
            originalParagraph: "bbb test",
            startIndex: 0,
            endIndex: 3,
            matchIndex: 0,
            chapterIndex: 0,
            paragraphIndex: 2
          }
        }
      ]
    }

    const groupC: import("../../src/types/errors").ErrorGroup = {
      id: "group-c",
      word: "ccc",
      type: "UnknownWord",
      reason: "Unknown word",
      count: 1,
      contexts: [
        {
          id: "inst-c1",
          word: "ccc",
          originalWord: "ccc",
          type: "UnknownWord",
          reason: "Unknown word",
          context: {
            originalParagraph: "ccc test",
            startIndex: 0,
            endIndex: 3,
            matchIndex: 0,
            chapterIndex: 0,
            paragraphIndex: 3
          }
        }
      ]
    }

    // Set initial errors: [groupA, groupB, groupC]
    appState.allDetectedErrors = [groupA, groupB, groupC]
    appState.selectedGroupId = groupA.id
    appState.currentInstanceIndex = 0

    expect(appState.currentFilteredErrors.map((g) => g.id)).toEqual([
      "group-a",
      "group-b",
      "group-c"
    ])
    expect(appState.currentGroup?.id).toBe("group-a")

    // 1. In groupA, replace first instance inst-a1 -> should stay on groupA, move to inst-a2
    appState.applyFixToInstance(groupA.contexts[0], "tôi")
    expect(appState.selectedGroupId).toBe("group-a")
    expect(appState.currentInstanceIndex).toBe(1)

    // 2. Replace second instance inst-a2 -> groupA fully resolved -> should advance to NEXT error (groupB)
    appState.applyFixToInstance(groupA.contexts[1], "tôi")
    expect(appState.selectedGroupId).toBe("group-b")
    expect(appState.currentInstanceIndex).toBe(0)

    // Current remaining errors: [groupB, groupC]
    // 3. Select last error (groupC) and click replace all -> should move to PREVIOUS error (groupB)
    appState.selectedGroupId = groupC.id
    expect(appState.currentGroup?.id).toBe("group-c")

    appState.applyFixToAllInstances(groupC, "đi")
    expect(appState.selectedGroupId).toBe("group-b")
    expect(appState.currentInstanceIndex).toBe(0)

    // 4. Replace all on the only remaining error (groupB) -> should clear selection (null)
    appState.applyFixToAllInstances(groupB, "sách")
    expect(appState.selectedGroupId).toBeNull()
    expect(appState.currentFilteredErrors.length).toBe(0)
  })
})
