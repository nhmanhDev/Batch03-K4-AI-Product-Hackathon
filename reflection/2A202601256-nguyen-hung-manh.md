# Reflection — Nguyễn Hùng Mạnh · `2A202601256`

**Vai trò phân công:** Leader — luồng **spec + validation** ([README.md](../README.md) bảng phân công, [cp1/canvas.md](../cp1/canvas.md) mục 7)

---

## 1. Vai trò của tôi

Tôi phụ trách hai thứ: **viết `spec.md`** (tài liệu quyết định của nhóm, hạn cứng 23:59 N1) và **chủ trì vòng validation với người dùng thật** ở CP5. Nói cách khác, tôi không phải người viết code chính — việc của tôi là chốt *nhóm làm gì, không làm gì, đo bằng thước nào*, rồi đi kiểm chứng xem quyết định đó có đúng với người dùng thật không.

## 2. Phần tôi làm cụ thể

**Chốt lát cắt và phạm vi** — [cp1/canvas.md](../cp1/canvas.md) mục 5. Một câu: học viên hỏi về học liệu buổi học → AI quyết định *có căn cứ ở phạm vi nào và đủ chưa* → trả lời kèm trích dẫn, hoặc nói rõ thiếu gì. Điểm tôi phải bảo vệ nhiều nhất trong nhóm là **gộp hai phạm vi (trang đang mở / cả bộ) vào một quyết định** thay vì tách hai tính năng — vì mining cho thấy cả hai hỏng vì *cùng một nguyên nhân*: hệ thống không hề suy nghĩ về việc nó có căn cứ tới đâu.

**Viết `spec.md` 8 mục** theo [03-template-ai-spec.md](../03-template-ai-spec.md). Ba mục tôi phải cân nhắc lâu nhất:

- **§4 Non-goals** — trong đó có "không mở rộng tìm kiếm ra ngoài học liệu". Đây là chỗ tôi giữ nguyên dù có người dùng xin (xem mục 4 bên dưới).
- **§5-§6 bốn lớp chỗ khó + kịch bản** — tôi viết phần này rồi bàn giao cho Trọng làm xương của golden set, đúng bảng "giao diện giữa các luồng" trong README.
- **§7 Quality bar** — chốt **≥85% qua bộ, kèm 2 điều kiện cứng phải đạt 100%**: không bịa trích dẫn, không đẩy việc tra cứu về học viên. Chốt lúc 23:59 N1 và **không đổi** sau đó, kể cả khi có lượt chạy thấp hơn.

**Tổ chức vòng validation CP5** — [validation/feedback-log.md](../validation/feedback-log.md). 6 người thử ngoài nhóm, ngày 31/07 từ 11:40 đến 13:31, tự dùng bản deploy rồi điền form. Tôi ghi quote nguyên văn kèm tên, **giữ cả điểm chê**, và viết 4 dòng tổng hợp: chủ đề lặp nhiều nhất, thay đổi làm trước demo, chỗ giữ nguyên có lý do, chỗ đưa vào backlog.

**Giữ `spec.md` §9 Changelog** — 7 dòng, mỗi dòng nối về đúng failure hoặc feedback đã gây ra nó, không có dòng nào ghi chung chung.

## 3. AI hỗ trợ tôi thế nào — và chỗ tôi phải bác lại AI

Tôi dùng AI coding assistant gần như toàn bộ quá trình: soạn spec, viết guardrail phía server, dựng bộ eval, sửa lỗi giao diện. Tốc độ nhanh hơn hẳn tự làm.

Nhưng có ba chỗ tôi phải bác lại hoặc tự sửa, và đây mới là phần đáng nói:

**(a) AI đề xuất cắt ngữ cảnh cho gọn — và làm hỏng chính cam kết của sản phẩm.** Bản đầu cắt cụt 90 ký tự mỗi trang trong phần "dàn ý cả bộ" để tiết kiệm token. Kết quả là `C02` fail ở lượt 10: model không đọc được đủ nội dung nên **trả lời bằng kiến thức nền rồi vẫn cite số trang** — grounding giả, đúng thứ nguy hiểm nhất mà nhóm sinh ra để chống. Tôi cho bỏ hẳn việc cắt, đưa về full text. Corpus chỉ ~4-6K token nên nhét đủ vẫn thừa chỗ ([spec.md §9](../spec.md), dòng "Sau lượt chạy 10").

**(b) Cả AI lẫn bộ eval đều không bắt được một lỗi thật — tôi bắt bằng cách tự ngồi bấm.** Đứng ở trang 1 gõ "tóm tắt trang 5" thì hệ thống báo không đủ căn cứ, dù trang 5 có nội dung. Nguyên nhân là lớp chặn cứng ngầm giả định `scope="page"` **luôn** có nghĩa là trang đang mở, nên lọc sạch mọi trích dẫn trỏ sang trang khác. 20 case golden set không phủ tình huống này. Sửa bằng cách thêm trường `targetPage` vào quyết định AI ([spec.md §9](../spec.md), dòng "Sau lượt chạy 16"). Bài học: **bộ đo tự động chỉ bắt được thứ nó được viết ra để bắt.**

**(c) Tôi từ chối đề xuất biến sản phẩm thành agent có tool search.** Có lúc tôi định lắp thêm skill và tool để AI đi tra cứu bên ngoài khi thiếu căn cứ. Nghĩ lại thì đó là bỏ chính lát cắt: **việc "không đi tìm" mới là tính năng**, không phải thiếu sót. Ghi vào backlog slide 6 chứ không làm.

## 4. Bài học từ một case fail của chính nhóm

Case tôi chọn là **lỗi của chính tôi**, không phải lỗi kỹ thuật.

**Chuyện gì hỏng:** Ở CP1 tôi khai 3 willing users — Tống Nguyễn Minh Khang, Hoàng Văn Linh, Nguyễn Mạnh Hùng. Cột "Đã hỏi chưa" tôi ghi thẳng là *chưa*. Đến CP5 đi mời thì **không ai tham gia được**. Rubric R6 yêu cầu feedback log phải có **≥2 người trong số tên đã khai ở CP1** — nhóm **không đạt** điều kiện đó.

**Tìm ra nguyên nhân thế nào:** Không phải người ta từ chối. Là tôi **chưa từng liên hệ ai**. Việc "hẹn trước willing users" nằm đúng trong luồng của tôi ([cp1/canvas.md](../cp1/canvas.md) mục 7), tôi khai tên xong rồi để đó, coi như xong việc CP1.

**Sửa gì:** Tôi đi mời được 6 học viên khác ngoài nhóm, vượt yêu cầu ≥5 người. Nhưng tôi **cố ý không sửa 3 tên gốc thành 6 tên mới** — viết đè lên sẽ thành khai khống rằng nhóm đã hẹn trước đúng những người đó từ đầu. Tôi ghi đính chính ở cả 3 chỗ: [cp1/canvas.md](../cp1/canvas.md) mục 6, [spec.md](../spec.md) §8, và [validation/feedback-log.md](../validation/feedback-log.md).

**Rút ra gì:** Trong bản khai CP1 có hai loại ô — ô *mô tả* (pain, evidence, lát cắt) và ô *cam kết* (willing users, phân công). Tôi điền cả hai với cùng một tâm thế "cho đủ form", trong khi ô cam kết là **lời hứa có hạn chót**, điền xong là phải đi làm ngay. Một dòng tên không mất gì để viết, nhưng đến lúc cần thì không có người, và **không có cách nào bù lại vào phút chót**. Lần sau nhắn xin xác nhận ngay tại thời điểm khai, không để đến lúc cần.

Điểm tôi giữ lại cho mình: thà mất điểm R6 vì ghi nhận trung thực, còn hơn viết đè tên cho đẹp hồ sơ. Rubric ghi rõ *"số liệu bị chỉnh sửa hoặc che giấu sẽ không được tính"* — và kể cả không có dòng đó thì đây vẫn là chỗ tôi không muốn đánh đổi.

## 5. Ba câu guide §5.2

**Augment hay automate — vì sao?** **Conditional.** Theo cost-of-error: trả lời sai mà nghe có căn cứ thì học viên học sai ngay trong buổi và mang vào quiz — đắt, phát hiện muộn. Thận trọng quá thì học viên mất một lượt hỏi — rẻ, thấy ngay. Nên: đủ căn cứ thì tự trả lời kèm trích dẫn, không đủ thì **không đoán**.

**Failure nguy hiểm nhất?** **Grounding giả** — câu trả lời lấy từ kiến thức nền của model nhưng vẫn gắn một số trang hợp lệ. Nguy hiểm vì nó *nhìn giống hệt* câu trả lời đúng: học viên thấy badge số trang nên tin, mà nội dung lại không nằm ở trang đó. Đã xảy ra thật ở lượt chạy 10. Chặn cứng hiện tại loại được trích dẫn trỏ vào trang không tồn tại, nhưng **chưa kiểm được nội dung có thật sự nằm trong trang đã cite hay không** — đó là giới hạn nhóm biết và ghi nhận, không giấu.

**Phần bạn làm là gì?** `spec.md` 8 mục (gồm lát cắt, 4 lớp chỗ khó, quality bar chốt 23:59 N1) và `validation/` (vòng thử 6 người ngoài nhóm, feedback log, changelog §9).
