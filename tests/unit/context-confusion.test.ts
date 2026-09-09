import { describe, expect, it } from "vitest"
import {
  CONFUSABLE_RULES,
  scanContextualErrors
} from "../../src/utils/context-confusion"

describe("Context Confusion Module (N-Gram Spelling & Collocation)", () => {
  describe("CONFUSABLE_RULES Dictionary", () => {
    it("contains classic Vietnamese confusable compound phrases", () => {
      const wrongPhrases = CONFUSABLE_RULES.map((r) => r.wrongPhrase)
      expect(wrongPhrases).toContain("chuẩn đoán")
      expect(wrongPhrases).toContain("sát nhập")
      expect(wrongPhrases).toContain("sáng lạng")
      expect(wrongPhrases).toContain("vô hình chung")
      expect(wrongPhrases).toContain("tựu chung")
      expect(wrongPhrases).toContain("cọ sát")
      expect(wrongPhrases).toContain("thăm quan")
      expect(wrongPhrases).toContain("đường xá")
      expect(wrongPhrases).toContain("phố xá")
      expect(wrongPhrases).toContain("chính chu")
      expect(wrongPhrases).toContain("xúc tích")
      expect(wrongPhrases).toContain("bổ xung")
      expect(wrongPhrases).toContain("đọc giả")
    })

    it("contains classic collocation-dependent pairs", () => {
      const wrongPhrases = CONFUSABLE_RULES.map((r) => r.wrongPhrase)
      expect(wrongPhrases).toContain("dành giật")
      expect(wrongPhrases).toContain("tranh dành")
      expect(wrongPhrases).toContain("giành dụm")
      expect(wrongPhrases).toContain("để giành")
      expect(wrongPhrases).toContain("giành riêng")
      expect(wrongPhrases).toContain("dành quyền")
      expect(wrongPhrases).toContain("dành độc lập")
      expect(wrongPhrases).toContain("giành tình cảm")
      expect(wrongPhrases).toContain("xử dụng")
      expect(wrongPhrases).toContain("sử lí")
      expect(wrongPhrases).toContain("sử sự")
      expect(wrongPhrases).toContain("xét sử")
      expect(wrongPhrases).toContain("lịch xử")
      expect(wrongPhrases).toContain("chia xẻ")
      expect(wrongPhrases).toContain("sẻ gỗ")
    })
  })

  describe("scanContextualErrors", () => {
    it("accurately detects always-wrong compound phrases in sentences", () => {
      const text = "Bác sĩ đang tiến hành chuẩn đoán bệnh cho bệnh nhân."
      const errors = scanContextualErrors(text, { paragraphIndex: 0 })
      expect(errors.length).toBe(1)
      expect(errors[0].word).toBe("chuẩn đoán")
      expect(errors[0].type).toBe("ContextConfusion")
      expect(errors[0].suggestions).toEqual(["chẩn đoán"])
      expect(errors[0].reason).toContain("chẩn đoán")
    })

    it("accurately detects multiple confusable phrases across text", () => {
      const text =
        "Việc sát nhập hai xã đã tạo cơ hội cho học sinh đi thăm quan nhiều di tích."
      const errors = scanContextualErrors(text, { paragraphIndex: 1 })
      expect(errors.length).toBe(2)
      const words = errors.map((e) => e.word)
      expect(words).toContain("sát nhập")
      expect(words).toContain("thăm quan")
    })

    it("accurately detects context-dependent confusable phrases", () => {
      const text = "Họ tranh dành từng chút tiền để giành mua nhà."
      const errors = scanContextualErrors(text, { paragraphIndex: 2 })
      expect(errors.length).toBe(2)
      expect(errors[0].word).toBe("tranh dành")
      expect(errors[0].suggestions).toEqual(["tranh giành"])
      expect(errors[1].word).toBe("để giành")
      expect(errors[1].suggestions).toEqual(["để dành"])
    })

    it("respects word boundaries and avoids false substring matches", () => {
      const text =
        "Anh ấy có thái độ bàng quan và đi dạo trên các phố sá sạch đẹp."
      const errors = scanContextualErrors(text, { paragraphIndex: 3 })
      expect(errors.length).toBe(0)
    })

    it("handles empty or short input gracefully", () => {
      expect(scanContextualErrors("", { paragraphIndex: 0 })).toEqual([])
      expect(scanContextualErrors("a", { paragraphIndex: 0 })).toEqual([])
    })
  })
})
