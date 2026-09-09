Mình đã kiểm tra lại cách project đang định nghĩa ErrorType hiện tại. Hiện có 6 loại:

Dictionary
NonVietnamese
Uppercase
Typo
Spelling
SpecialCharacter

Theo mình, ý tưởng phân loại hiện tại đúng hướng, nhưng tên gọi và ranh giới giữa Dictionary / Typo / Spelling chưa thật sự tối ưu. Nếu project này hướng tới một spell checker dùng lâu dài, mình sẽ chỉnh classification ngay bây giờ, trước khi dữ liệu lỗi phát triển nhiều.

1. Vấn đề lớn nhất: Dictionary hơi mơ hồ

Dictionary thực chất không phải là một loại lỗi ngôn ngữ, mà là:

"Từ này không có trong Vietnamese dictionary."

Ví dụ:

Tôi đang đọc quyển sach rất hay.
^^^^

Nếu sach không có trong dictionary → Dictionary.

Nhưng:

Tôi đang đọc quyển sách rất hay.

thì không có lỗi.

Vấn đề là Dictionary có thể chứa rất nhiều nguyên nhân khác nhau:

sach → có thể là typo
thanhf → có thể là typo
abcxyz → có thể là từ nước ngoài
Nguyen → có thể là tên riêng
OpenAI → brand

Trong đó abcxyz bị bắt bởi Dictionary không có nghĩa nó là "lỗi từ điển".

Vì vậy mình đề xuất đổi:

Dictionary → UnknownWord

hoặc nếu muốn ngắn:

Unknown

Mình thích UnknownWord hơn.

Nó thể hiện chính xác:

Hệ thống không xác định được từ này trong các dictionary hiện có.

2. NonVietnamese — nên giữ

Cái này khá rõ ràng.

Ví dụ:

This is a book.
^^^^^^^^

hoặc:

Tôi thích reading sách.
^^^^^^^

→ NonVietnamese

Tuy nhiên cần phân biệt:

OpenAI
GitHub
YouTube
ChatGPT

không nên thành NonVietnamese nếu chúng nằm trong custom dictionary.

Tương tự tên riêng:

Alexander
Parmenion

→ Names, không phải NonVietnamese.

Tên NonVietnamese ổn.

Mình không đổi.

3. Uppercase — nên đổi tên

Uppercase theo nghĩa kỹ thuật chỉ có nghĩa:

chữ viết hoa.

Nhưng lỗi thực tế của bạn có vẻ là:

sử dụng chữ hoa bất thường.

Ví dụ:

TÔi
^^

hoặc:

VIệT
^^

hoặc:

NguyỄn
^^^

Trong khi:

NASA
USA
HTML
PDF

không phải lỗi.

Và:

iPhone
iPad
eBay
GitHub
OpenAI

cũng không phải lỗi.

Do đó tên tốt hơn là:

AbnormalCase

hoặc rõ nghĩa hơn:

CaseError

Mình nghiêng về CaseError.

Ví dụ UI:

Case Error
VIệT → Việt

thay vì:

Uppercase
VIệT

Uppercase dễ khiến người dùng hiểu nhầm rằng từ viết toàn chữ hoa là lỗi.

4. Typo — nên giữ, nhưng phải định nghĩa rất rõ

Typo là lỗi gõ nhầm, ví dụ:

ngườii → người
quyyển → quyển
sach → sách
đọcj → đọc

Đây là một classification rất hữu ích.

Nhưng có một vấn đề:

Typo và Spelling rất dễ chồng lên nhau.

Ví dụ:

sách → sach

là:

typo?
spelling error?
missing diacritic?

Nếu không định nghĩa rõ, sau này detection engine sẽ không biết nên đưa vào loại nào.

5. Spelling — mình nghĩ nên giữ, nhưng đổi ý nghĩa

Mình sẽ định nghĩa:

Typo

= lỗi do gõ nhầm / dư / thiếu / đảo ký tự

Ví dụ:

người → ngừoi
quyển → quyyển
thành → thnah
Spelling

= từ được viết sai chính tả theo quy tắc ngôn ngữ, không đơn thuần là lỗi keyboard.

Ví dụ:

xử lí → xử lý
kỉ niệm → kỷ niệm
sử dụng → sữ dụng

Hoặc các quy tắc chính tả tiếng Việt mà engine biết chắc.

Điểm quan trọng là:

Typo = pattern của lỗi nhập liệu
Spelling = pattern của lỗi chính tả

Nếu không có rule engine đủ mạnh để phân biệt hai loại này thì không nên cố tách.

6. SpecialCharacter — nên giữ

Loại này rất hữu ích cho EPUB/OCR.

Ví dụ:

Việt¬Nam
^

hoặc:

hello�
^

hoặc những ký tự OCR rác:

Tôi đang đọc sách¦
^

Các ký tự Unicode bất thường, control character, OCR artifact... nên được đưa vào nhóm này.

Nhưng mình sẽ định nghĩa nó rộng hơn một chút:

SpecialCharacter

Ký tự không mong muốn xuất hiện trong văn bản.

Ví dụ:

¬
�
¦
¤
□

Không nên dùng nó cho các punctuation hợp lệ:

,
.
!
?
:
;

- …
  “
  ”
  Classification mình đề xuất

Nếu làm lại từ đầu, mình sẽ dùng:

Type Ý nghĩa Ví dụ
UnknownWord Không xác định được từ abcxyz
NonVietnamese Từ/cụm từ không phải tiếng Việt reading
CaseError Viết hoa/thường bất thường VIệT
Typo Lỗi gõ nhầm ngừoi
Spelling Lỗi chính tả sữ dụng
SpecialCharacter Ký tự rác/bất thường sách�

Đây là classification mình thấy sạch nhất cho project hiện tại.

7. Nhưng mình còn đề xuất một thay đổi quan trọng hơn

Không nên cố biến mọi thứ không có trong dictionary thành một ErrorType riêng.

Ví dụ:

Alexander
OpenAI
NASA
iPhone

không phải lỗi.

Bạn đã có:

custom dictionary
names dictionary
non-vn dictionary
vn dictionary

Do đó nên xem dictionary như knowledge layer, còn ErrorType là problem layer.

Tức là:

                 Word
                  │
       ┌──────────┴──────────┐
       │                     │

Known word Unknown word
│ │
│ ┌──────┴──────┐
│ │ │
OK / valid Typo? NonVietnamese?
│
Spelling?

Đây là cách mình nghĩ architecture sẽ dễ phát triển hơn.

8. Một điểm mình đặc biệt khuyên: đừng để Dictionary = "lỗi"

Hiện tại type:

type ErrorType =
| "Dictionary"
| "NonVietnamese"
| "Uppercase"
| "Typo"
| "Spelling"
| "SpecialCharacter"

vẫn hơi mang tính implementation-oriented.

Nếu đổi thành:

type ErrorType =
| "UnknownWord"
| "NonVietnamese"
| "CaseError"
| "Typo"
| "Spelling"
| "SpecialCharacter"

thì đọc code sẽ tự nhiên hơn:

if (group.type === "UnknownWord")

người đọc lập tức hiểu:

Không xác định được từ.

Trong khi:

if (group.type === "Dictionary")

sẽ phải tự hỏi:

Dictionary error là lỗi gì? Dictionary thiếu từ? Sai dictionary? Hay từ sai?

9. Có cần tách thêm loại nào không?

Hiện tại: chưa cần.

Mình không khuyên thêm 10–15 loại kiểu:

MissingAccent
ExtraCharacter
MissingCharacter
DuplicateCharacter
WrongCharacter
OCR
ForeignName
Brand
Abbreviation
...

vào ErrorType.

Những cái đó nên là reason/subtype, không phải top-level ErrorType.

Ví dụ:

Typo
├── MissingCharacter
├── ExtraCharacter
├── Transposition
└── DuplicateCharacter

Spelling
├── WrongDiacritic
├── WrongConsonant
└── WrongVowel

SpecialCharacter
├── OCRArtifact
├── InvalidUnicode
└── ControlCharacter

Trong data model hiện tại bạn đã có reason?: string, nên rất thích hợp để chứa lớp thông tin chi tiết này.

Ví dụ:

{
word: "ngừoi",
type: "Typo",
reason: "Transposition",
suggestions: ["người"]
}

hoặc:

{
word: "sữ dụng",
type: "Spelling",
reason: "WrongDiacritic",
suggestions: ["sử dụng"]
}

Như vậy UI có thể hiển thị:

Typo
Transposition
ngừoi → người

rất đẹp.

10. Kết luận của mình

Mình sẽ không thay đổi số lượng loại, chỉ thay đổi semantics:

- Dictionary

* UnknownWord

  NonVietnamese

- Uppercase

* CaseError

  Typo
  Spelling
  SpecialCharacter

Thành:

type ErrorType =
| "UnknownWord"
| "NonVietnamese"
| "CaseError"
| "Typo"
| "Spelling"
| "SpecialCharacter"

và dùng reason làm sub-classification.

Mức độ ưu tiên

Nên làm ngay:

Dictionary → UnknownWord
Uppercase → CaseError
Chuẩn hóa định nghĩa Typo vs Spelling
Quy định reason cho từng loại

Chưa cần làm:

thêm nhiều ErrorType mới.

Theo mình đây là điểm đáng chỉnh trước khi project ổn định, vì sau này đổi tên ErrorType sẽ ảnh hưởng state, filter, UI, tests và dữ liệu đã lưu.
