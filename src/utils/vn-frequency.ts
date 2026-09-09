/**
 * Vietnamese Word Frequency module
 * Provides word frequency ranks/scores to serve as tie-breakers in suggestion sorting.
 */

// Top high-frequency Vietnamese words corpus dictionary
const TOP_VN_FREQUENCIES: Record<string, number> = {
  // Ultra-high frequency function & core words (weight 1000 - 900)
  và: 1000,
  là: 990,
  của: 980,
  có: 970,
  những: 960,
  được: 950,
  trong: 940,
  một: 930,
  người: 920,
  đã: 910,
  không: 900,
  cho: 890,
  các: 880,
  với: 870,
  về: 860,
  như: 850,
  này: 840,
  khi: 830,
  cũng: 820,
  từ: 810,
  để: 800,
  đến: 790,
  tại: 780,
  sẽ: 770,
  ra: 760,
  vào: 750,
  lại: 740,
  thấy: 730,
  phải: 720,
  biết: 710,
  làm: 700,
  nói: 690,
  mình: 680,
  theo: 670,
  qua: 660,
  nhưng: 650,
  anh: 640,
  em: 630,
  ông: 620,
  bà: 610,
  cô: 600,
  chú: 590,
  đi: 580,
  đang: 570,
  nhiều: 560,
  rất: 550,
  thì: 540,
  mà: 530,
  ở: 520,
  nó: 510,
  họ: 500,

  // Common nouns & verbs (weight 490 - 200)
  học: 490,
  trường: 480,
  đường: 470,
  chuyện: 460,
  thương: 450,
  nhà: 440,
  ngày: 430,
  năm: 420,
  thời: 410,
  gian: 400,
  việc: 390,
  tiếng: 380,
  sách: 370,
  bạn: 360,
  con: 350,
  mẹ: 340,
  cha: 330,
  tiền: 320,
  tâm: 310,
  lòng: 300,
  đời: 290,
  mắt: 280,
  tay: 270,
  chân: 260,
  đầu: 250,
  nước: 240,
  nơi: 230,
  cuộc: 220,
  bước: 210,
  nghe: 200,

  // Common tone variants
  hộp: 180,
  họp: 175,
  khoán: 170,
  chỗ: 165,
  chó: 160,
  trưởng: 150,
  trương: 140,
  trượng: 130,
  dương: 140,
  đương: 130
}

/**
 * Returns the frequency weight of a word (higher number = more frequent).
 * Defaults to 0 for rare/unindexed words.
 */
export function getWordFrequency(word: string): number {
  if (!word) return 0
  const norm = word.toLowerCase().normalize("NFC")
  return TOP_VN_FREQUENCIES[norm] ?? 0
}
