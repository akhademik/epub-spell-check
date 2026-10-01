import type { ErrorInstance } from "../types/errors"

export interface ConfusableRule {
  wrongPhrase: string
  correctPhrase: string
  reason: string
  severity: "always_wrong" | "context_dependent"
}

/**
 * High-accuracy curated list of classic Vietnamese confusable pairs & collocations.
 */
export const CONFUSABLE_RULES: ConfusableRule[] = [
  // ============================================================
  // 1. ALWAYS WRONG (High-Confidence Deterministic Rules)
  // ============================================================

  {
    wrongPhrase: "chuẩn đoán",
    correctPhrase: "chẩn đoán",
    reason: "Sai từ vựng: đúng chuẩn là 'chẩn đoán' (chẩn đoán bệnh, hình ảnh)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "sát nhập",
    correctPhrase: "sáp nhập",
    reason: "Sai từ vựng: đúng chuẩn là 'sáp nhập' (sáp nhập tỉnh, cơ quan)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "sáng lạng",
    correctPhrase: "xán lạn",
    reason:
      "Sai từ vựng: đúng chuẩn là 'xán lạn' hoặc 'sáng lạn' (tương lai xán lạn)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "vô hình chung",
    correctPhrase: "vô hình trung",
    reason:
      "Sai từ vựng: đúng chuẩn là 'vô hình trung' (nghĩa là tự nhiên thành ra)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "tựu chung",
    correctPhrase: "tựu trung",
    reason: "Sai từ vựng: đúng chuẩn là 'tựu trung' (nghĩa là tóm lại, quy về)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "cọ sát",
    correctPhrase: "cọ xát",
    reason: "Sai từ vựng: đúng chuẩn là 'cọ xát' (cọ xát thực tế, ma sát)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "thăm quan",
    correctPhrase: "tham quan",
    reason: "Sai từ vựng: đúng chuẩn là 'tham quan' (quan sát học hỏi)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "đường xá",
    correctPhrase: "đường sá",
    reason:
      "Sai chính tả: đúng chuẩn là 'đường sá' (sá là từ Hán-Việt chỉ đường đi)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "phố xá",
    correctPhrase: "phố sá",
    reason: "Sai chính tả: đúng chuẩn là 'phố sá'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chính chu",
    correctPhrase: "chỉnh chu",
    reason: "Sai chính tả: đúng chuẩn là 'chỉn chu' hoặc 'chỉnh chu'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "xúc tích",
    correctPhrase: "súc tích",
    reason: "Sai từ vựng: đúng chuẩn là 'súc tích' (ngắn gọn, cô đọng)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "bổ xung",
    correctPhrase: "bổ sung",
    reason: "Sai chính tả: đúng chuẩn là 'bổ sung'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "đọc giả",
    correctPhrase: "độc giả",
    reason: "Sai từ vựng: đúng chuẩn là 'độc giả' (người đọc)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chắp bút",
    correctPhrase: "chấp bút",
    reason: "Sai từ vựng: người khởi thảo văn kiện đúng là 'chấp bút'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "sơ xuất",
    correctPhrase: "sơ suất",
    reason: "Sai chính tả: đúng chuẩn là 'sơ suất'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "xơ xuất",
    correctPhrase: "sơ suất",
    reason: "Sai chính tả: đúng chuẩn là 'sơ suất'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "suôn xẻ",
    correctPhrase: "suôn sẻ",
    reason: "Sai chính tả: đúng chuẩn là 'suôn sẻ'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "suông sẻ",
    correctPhrase: "suôn sẻ",
    reason: "Sai chính tả: đúng chuẩn là 'suôn sẻ'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "dè xẻn",
    correctPhrase: "dè sẻn",
    reason: "Sai chính tả: đúng chuẩn là 'dè sẻn'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "bất chắc",
    correctPhrase: "bất trắc",
    reason: "Sai chính tả: đúng chuẩn là 'bất trắc' (tình huống bất ngờ)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "bàn dao",
    correctPhrase: "bàn giao",
    reason:
      "Sai từ vựng: đúng chuẩn là 'bàn giao' (chuyển giao công việc/tài sản)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "bảo hoà",
    correctPhrase: "bão hòa",
    reason: "Sai chính tả: đúng chuẩn là 'bão hòa'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "bêu diếu",
    correctPhrase: "bêu riếu",
    reason: "Sai chính tả: đúng chuẩn là 'bêu riếu'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chân châu",
    correctPhrase: "trân châu",
    reason: "Sai từ vựng: đúng chuẩn là 'trân châu' (hạt trân châu, ngọc quý)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chót dại",
    correctPhrase: "trót dại",
    reason: "Sai chính tả: đúng chuẩn là 'trót dại' (lỡ lầm)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chưng bày",
    correctPhrase: "trưng bày",
    reason: "Sai từ vựng: đúng chuẩn là 'trưng bày' (triển lãm)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "khoắc khoải",
    correctPhrase: "khắc khoải",
    reason: "Sai chính tả: đúng chuẩn là 'khắc khoải'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "khập khiển",
    correctPhrase: "khập khiễng",
    reason: "Sai chính tả: đúng chuẩn là 'khập khiễng'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chấp vá",
    correctPhrase: "chắp vá",
    reason: "Sai từ vựng: đúng chuẩn là 'chắp vá'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "giãy dụa",
    correctPhrase: "giãy giụa",
    reason: "Sai chính tả: đúng chuẩn là 'giãy giụa'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "dãy dụa",
    correctPhrase: "giãy giụa",
    reason: "Sai chính tả: đúng chuẩn là 'giãy giụa'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chân trọng",
    correctPhrase: "trân trọng",
    reason: "Sai chính tả: đúng chuẩn là 'trân trọng' (bày tỏ sự tôn trọng)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "trân thành",
    correctPhrase: "chân thành",
    reason: "Sai chính tả: đúng chuẩn là 'chân thành' (thật lòng)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "công hiến",
    correctPhrase: "cống hiến",
    reason: "Sai chính tả: đúng chuẩn là 'cống hiến' (đóng góp, dâng hiến)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "giữ dội",
    correctPhrase: "dữ dội",
    reason: "Sai chính tả: đúng chuẩn là 'dữ dội' (mạnh mẽ, ác liệt)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "sát xao",
    correctPhrase: "sát sao",
    reason: "Sai chính tả: đúng chuẩn là 'sát sao' (theo dõi chặt chẽ)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "sơ xài",
    correctPhrase: "sơ sài",
    reason: "Sai chính tả: đúng chuẩn là 'sơ sài' (qua loa, đại khái)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "kỹ luật",
    correctPhrase: "kỷ luật",
    reason: "Sai chính tả: đúng chuẩn là 'kỷ luật' (quy tắc, nề nếp)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "kỹ niệm",
    correctPhrase: "kỷ niệm",
    reason: "Sai chính tả: đúng chuẩn là 'kỷ niệm' (ghi nhớ, hoài niệm)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "kỷ thuật",
    correctPhrase: "kỹ thuật",
    reason: "Sai chính tả: đúng chuẩn là 'kỹ thuật' (technique)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "kỷ năng",
    correctPhrase: "kỹ năng",
    reason: "Sai chính tả: đúng chuẩn là 'kỹ năng' (skill)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "kỹ nguyên",
    correctPhrase: "kỷ nguyên",
    reason: "Sai chính tả: đúng chuẩn là 'kỷ nguyên' (era, thời đại)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "kỹ yếu",
    correctPhrase: "kỷ yếu",
    reason: "Sai chính tả: đúng chuẩn là 'kỷ yếu' (tập san lưu niệm)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "vất vã",
    correctPhrase: "vất vả",
    reason: "Sai chính tả: đúng chuẩn là 'vất vả' (khó nhọc)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "trí ân",
    correctPhrase: "tri ân",
    reason: "Sai chính tả: đúng chuẩn là 'tri ân' (bày tỏ lòng biết ơn)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "che dấu",
    correctPhrase: "che giấu",
    reason:
      "Sai từ vựng: 'giấu' (động từ, che giấu) khác với 'dấu' (danh từ, dấu vết/dấu hiệu)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "dấu diếm",
    correctPhrase: "giấu giếm",
    reason:
      "Sai từ vựng: 'giấu' (động từ, che giấu) khác với 'dấu' (danh từ, dấu vết/dấu hiệu)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chia rẻ",
    correctPhrase: "chia rẽ",
    reason: "Sai chính tả: đúng chuẩn là 'chia rẽ' (làm mất đoàn kết)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chín mùi",
    correctPhrase: "chín muồi",
    reason: "Sai chính tả: đúng chuẩn là 'chín muồi' (thời cơ chín muồi)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chính chắn",
    correctPhrase: "chín chắn",
    reason: "Sai chính tả: đúng chuẩn là 'chín chắn' (suy nghĩ chín chắn)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "chua sót",
    correctPhrase: "chua xót",
    reason: "Sai chính tả: đúng chuẩn là 'chua xót' (nỗi niềm chua xót)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "dư giả",
    correctPhrase: "dư dả",
    reason: "Sai chính tả: đúng chuẩn là 'dư dả' (tiền bạc dư dả)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "đầy ấp",
    correctPhrase: "đầy ắp",
    reason: "Sai chính tả: đúng chuẩn là 'đầy ắp' (tràn đầy)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "điểm xuyến",
    correctPhrase: "điểm xuyết",
    reason: "Sai chính tả: đúng chuẩn là 'điểm xuyết' (tô điểm, điểm xuyết)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "gian sảo",
    correctPhrase: "gian xảo",
    reason: "Sai chính tả: đúng chuẩn là 'gian xảo'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "hàm xúc",
    correctPhrase: "hàm súc",
    reason: "Sai chính tả: đúng chuẩn là 'hàm súc' (cô đọng, ý nhị)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "khắc khe",
    correctPhrase: "khắt khe",
    reason: "Sai chính tả: đúng chuẩn là 'khắt khe' (yêu cầu khắt khe)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "lãng mạng",
    correctPhrase: "lãng mạn",
    reason: "Sai chính tả: đúng chuẩn là 'lãng mạn' (romantic)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "sắc xảo",
    correctPhrase: "sắc sảo",
    reason: "Sai chính tả: đúng chuẩn là 'sắc sảo'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "trao chuốt",
    correctPhrase: "trau chuốt",
    reason: "Sai chính tả: đúng chuẩn là 'trau chuốt' (gọt giũa)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "vô vàng",
    correctPhrase: "vô vàn",
    reason: "Sai chính tả: đúng chuẩn là 'vô vàn' (vô vàn khó khăn)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "xuất xắc",
    correctPhrase: "xuất sắc",
    reason: "Sai chính tả: đúng chuẩn là 'xuất sắc'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "xúi dục",
    correctPhrase: "xúi giục",
    reason: "Sai chính tả: đúng chuẩn là 'xúi giục' (kích động)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "xoay sở",
    correctPhrase: "xoay xở",
    reason: "Sai chính tả: đúng chuẩn là 'xoay xở' (tự xoay xở)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "bánh trưng",
    correctPhrase: "bánh chưng",
    reason: "Sai chính tả: tên món ăn truyền thống đúng là 'bánh chưng'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "châm trước",
    correctPhrase: "châm chước",
    reason: "Sai từ vựng: đúng chuẩn là 'châm chước' (bỏ qua, linh động)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "liêu siêu",
    correctPhrase: "liêu xiêu",
    reason: "Sai chính tả: đúng chuẩn là 'liêu xiêu' (ngả nghiêng)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "sai xót",
    correctPhrase: "sai sót",
    reason: "Sai chính tả: đúng chuẩn là 'sai sót'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "sừng xộ",
    correctPhrase: "sừng sộ",
    reason: "Sai chính tả: đúng chuẩn là 'sừng sộ' (hung hăng, gây gổ)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "quá dang",
    correctPhrase: "quá giang",
    reason: "Sai từ vựng: đúng chuẩn là 'quá giang' (đi nhờ xe/thuyền)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "xem sét",
    correctPhrase: "xem xét",
    reason: "Sai chính tả: đúng chuẩn là 'xem xét' (nghiên cứu, đánh giá)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "vãng cảnh",
    correctPhrase: "vãn cảnh",
    reason: "Sai từ vựng: đúng chuẩn là 'vãn cảnh' (vãn cảnh chùa, ngắm cảnh)",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "lễ nhận chức",
    correctPhrase: "lễ nhậm chức",
    reason: "Sai từ vựng Hán-Việt: đúng chuẩn nghi lễ là 'lễ nhậm chức'",
    severity: "always_wrong"
  },
  {
    wrongPhrase: "tuyên thệ nhận chức",
    correctPhrase: "tuyên thệ nhậm chức",
    reason: "Sai từ vựng Hán-Việt: đúng chuẩn nghi lễ là 'tuyên thệ nhậm chức'",
    severity: "always_wrong"
  },

  // ============================================================
  // 2. COLLOCATION-DEPENDENT PAIRS (Contextual Collocations)
  // ============================================================

  {
    wrongPhrase: "dành giật",
    correctPhrase: "giành giật",
    reason: "Dùng từ theo ngữ cảnh: 'giành giật' thay vì 'dành giật'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "tranh dành",
    correctPhrase: "tranh giành",
    reason: "Dùng từ theo ngữ cảnh: 'tranh giành' thay vì 'tranh dành'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "giành dụm",
    correctPhrase: "dành dụm",
    reason: "Dùng từ theo ngữ cảnh: 'dành dụm' thay vì 'giành dụm'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "để giành",
    correctPhrase: "để dành",
    reason: "Dùng từ theo ngữ cảnh: 'để dành' thay vì 'để giành'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "giành riêng",
    correctPhrase: "dành riêng",
    reason: "Dùng từ theo ngữ cảnh: 'dành riêng' thay vì 'giành riêng'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "dành quyền",
    correctPhrase: "giành quyền",
    reason: "Dùng từ theo ngữ cảnh: 'giành quyền' thay vì 'dành quyền'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "dành độc lập",
    correctPhrase: "giành độc lập",
    reason: "Dùng từ theo ngữ cảnh: 'giành độc lập' thay vì 'dành độc lập'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "giành tình cảm",
    correctPhrase: "dành tình cảm",
    reason: "Dùng từ theo ngữ cảnh: 'dành tình cảm' thay vì 'giành tình cảm'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "xử dụng",
    correctPhrase: "sử dụng",
    reason: "Sai từ vựng: đúng chuẩn là 'sử dụng'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "sử lí",
    correctPhrase: "xử lý",
    reason: "Sai từ vựng: đúng chuẩn là 'xử lý'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "sử sự",
    correctPhrase: "xử sự",
    reason: "Sai từ vựng: đúng chuẩn là 'xử sự'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "xét sử",
    correctPhrase: "xét xử",
    reason: "Sai từ vựng: đúng chuẩn là 'xét xử'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "lịch xử",
    correctPhrase: "lịch sử",
    reason: "Sai từ vựng: đúng chuẩn là 'lịch sử'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "chia xẻ",
    correctPhrase: "chia sẻ",
    reason: "Dùng từ theo ngữ cảnh: 'chia sẻ' (tình cảm, thông tin)",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "sẻ gỗ",
    correctPhrase: "xẻ gỗ",
    reason: "Dùng từ theo ngữ cảnh: 'xẻ gỗ' thay vì 'sẻ gỗ'",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "thái độ bàng quang",
    correctPhrase: "thái độ bàng quan",
    reason:
      "Dùng từ theo ngữ cảnh: 'bàng quan' (đứng ngoài xem) khác 'bàng quang' (bọng đái)",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "nghe phong phanh",
    correctPhrase: "nghe phong thanh",
    reason:
      "Dùng từ theo ngữ cảnh: 'nghe phong thanh' (nghe tin đồn thoáng qua)",
    severity: "context_dependent"
  },
  {
    wrongPhrase: "trương mục",
    correctPhrase: "chương mục",
    reason:
      "Dùng từ theo ngữ cảnh: 'chương mục' (mục lục) hoặc 'trương mục' (tài khoản)",
    severity: "context_dependent"
  }
]

/**
 * Scan a text paragraph for contextual confusion errors (confusable n-grams).
 */
export function scanContextualErrors(
  text: string,
  meta: {
    paragraphIndex: number
    chapterIndex?: number
    filePath?: string
    blockId?: string
  }
): ErrorInstance[] {
  if (!text || text.length < 3) return []

  const errors: ErrorInstance[] = []
  const normText = text.normalize("NFC")
  const lowerText = normText.toLowerCase()

  for (const rule of CONFUSABLE_RULES) {
    const targetLow = rule.wrongPhrase.toLowerCase()
    let searchStart = 0

    while (true) {
      const matchIndex = lowerText.indexOf(targetLow, searchStart)
      if (matchIndex === -1) break

      // Verify word boundary before and after match
      const beforeChar = matchIndex > 0 ? lowerText[matchIndex - 1] : " "
      const afterIndex = matchIndex + targetLow.length
      const afterChar =
        afterIndex < lowerText.length ? lowerText[afterIndex] : " "

      const isWordBoundaryBefore = /[\s.,!?;:()[\]{}"'“”‘’<>\-\\/]/.test(
        beforeChar
      )
      const isWordBoundaryAfter = /[\s.,!?;:()[\]{}"'“”‘’<>\-\\/]/.test(
        afterChar
      )

      if (isWordBoundaryBefore && isWordBoundaryAfter) {
        const matchedText = normText.substring(matchIndex, afterIndex)
        const instanceId = `${meta.blockId || meta.paragraphIndex}-${matchIndex}-${afterIndex}-ctx`

        errors.push({
          id: instanceId,
          word: matchedText,
          originalWord: matchedText,
          type: "ContextConfusion",
          reason: rule.reason,
          suggestions: [rule.correctPhrase],
          context: {
            originalParagraph: normText,
            startIndex: matchIndex,
            endIndex: afterIndex,
            matchIndex,
            chapterIndex: meta.chapterIndex ?? 0,
            paragraphIndex: meta.paragraphIndex,
            filePath: meta.filePath,
            blockId: meta.blockId
          }
        })
      }

      searchStart = matchIndex + targetLow.length
    }
  }

  return errors
}

/**
 * Resolves overlaps between token-level errors and curated ContextConfusion errors.
 * A longer / earlier-sorted curated match wins, and any token-level error whose span
 * is fully covered by a kept curated match is suppressed (it's the same mistake,
 * already explained by the curated rule).
 */
export function resolveOverlappingErrors(
  errors: ErrorInstance[]
): ErrorInstance[] {
  if (errors.length <= 1) return errors

  // Separate curated contextual errors vs token-level errors
  const contextErrors = errors.filter((e) => e.type === "ContextConfusion")
  const otherErrors = errors.filter((e) => e.type !== "ContextConfusion")

  if (contextErrors.length === 0) return errors

  // Deduplicate overlapping context errors (longer span wins)
  const sortedContext = [...contextErrors].sort((a, b) => {
    const lenA = a.context.endIndex - a.context.startIndex
    const lenB = b.context.endIndex - b.context.startIndex
    return lenB - lenA
  })

  const keptContext: ErrorInstance[] = []
  for (const c of sortedContext) {
    const overlaps = keptContext.some((existing) => {
      if (
        c.context.paragraphIndex !== existing.context.paragraphIndex ||
        c.context.filePath !== existing.context.filePath
      ) {
        return false
      }
      return (
        c.context.startIndex < existing.context.endIndex &&
        c.context.endIndex > existing.context.startIndex
      )
    })
    if (!overlaps) {
      keptContext.push(c)
    }
  }

  // Filter other errors that overlap with any keptContext error
  const keptOther = otherErrors.filter((tok) => {
    const isCovered = keptContext.some((ctx) => {
      if (
        tok.context.paragraphIndex !== ctx.context.paragraphIndex ||
        tok.context.filePath !== ctx.context.filePath
      ) {
        return false
      }
      return (
        tok.context.startIndex >= ctx.context.startIndex &&
        tok.context.endIndex <= ctx.context.endIndex
      )
    })
    return !isCovered
  })

  // Return combined errors sorted by paragraph and startIndex
  return [...keptContext, ...keptOther].sort((a, b) => {
    if (a.context.paragraphIndex !== b.context.paragraphIndex) {
      return a.context.paragraphIndex - b.context.paragraphIndex
    }
    return a.context.startIndex - b.context.startIndex
  })
}
