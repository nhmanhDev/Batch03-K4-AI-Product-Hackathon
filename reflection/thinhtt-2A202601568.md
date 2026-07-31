# Reflection — Trần Trọng Thịnh (`2A202601568`)

## 1 · Vai trò

Trong nhóm AI42E · D304, em phụ trách **build flow**: dựng prototype để người học có thể đi hết luồng từ mở học liệu, chuyển trang, mở AI Tutor, đặt câu hỏi đến nhận câu trả lời. Em đồng thời phụ trách chuẩn bị và thực hiện phần demo CP6.

Phần em trực tiếp phụ trách tập trung ở `codebase/`, đặc biệt là trang reader và các component giao diện. Phần API AI thật là kết quả phối hợp với luồng CP3 của nhóm; em không nhận là tự viết toàn bộ route AI, nhưng em chịu trách nhiệm hiểu contract giữa giao diện và API để tích hợp, kiểm thử và giải thích trong demo.

## 2 · Phần em trực tiếp làm

### Prototype CP2 — commit `417e51b`

Em dựng bản prototype VLearn đầu tiên bằng Next.js để flow chính có thể bấm đi hết được. Các phần chính gồm:

- `codebase/src/app/course/[courseId]/reader/page.tsx`: ghép toàn bộ màn hình reader và quản lý các trạng thái như tài liệu đang chọn, trang hiện tại, mức zoom và trạng thái mở Tutor.
- `codebase/src/components/ReaderSidebar.tsx`: chọn ngày học và tài liệu.
- `codebase/src/components/ReaderToolbar.tsx`: công cụ đọc, chuyển trang và zoom.
- `codebase/src/components/PDFViewerCanvas.tsx`: vùng hiển thị học liệu.
- `codebase/src/components/ReaderTabs.tsx`: các tab Tutor, sơ đồ, Flashcard và ghi chú; nhập câu hỏi và hiển thị kết quả.
- `codebase/src/components/ConfusionModal.tsx`: luồng phản hồi khi người học chưa hiểu nội dung.

Ở CP2, phản hồi Tutor được mock theo từ khóa và có độ trễ giả bằng `setTimeout`. Em làm như vậy có chủ đích vì checkpoint này yêu cầu chứng minh flow bấm được, chưa yêu cầu lời gọi AI thật. Sau CP3, phần mock được thay bằng lời gọi `POST /api/tutor` với ba dữ liệu chính:

```json
{
  "question": "Câu hỏi của học viên",
  "currentPage": 15,
  "deck": "law"
}
```

Giao diện hiện tại đọc kết quả có cấu trúc gồm `scope`, `sufficient`, `answer`, `citations` và `missing`. Nhờ đó UI có thể hiển thị rõ AI đang dùng phạm vi trang hiện tại, cả bộ tài liệu hay xác định câu hỏi ngoài phạm vi; đủ căn cứ thì trả lời kèm citation, thiếu căn cứ thì hiển thị đường lui thay vì đoán.

### Giao diện ba cột — commit `e389b34`

Ở bản đầu, Tutor là một drawer `fixed`, nên khi mở trên desktop nó che lên slide. Em sửa lại thành layout ba cột: sidebar học liệu bên trái, slide ở giữa và Tutor bên phải. Trên màn hình lớn Tutor dùng `xl:static` để chiếm một cột thật trong layout; trên màn hình nhỏ nó mới trở thành drawer. Em cũng bổ sung `BrandMark.tsx` và chỉnh header, toolbar, sidebar, màu xanh–đỏ để giao diện gần nhận diện VLearn hơn.

Phần demo em chuẩn bị gồm hai trường hợp:

1. Case đủ căn cứ: đứng ở trang 15 hỏi phương pháp đánh giá và số lượng câu hỏi; Tutor trả lời `LLM-as-a-Judge`, `100 câu hỏi` và cite trang 15.
2. Case khó về phạm vi: vẫn ở trang 15 hỏi hạn chế của Basic RAG; Tutor không lấy nội dung trang khác để trả lời như thể thuộc trang 15 mà báo chưa đủ căn cứ và chỉ sang trang 12. Khi chuyển tới trang 12 và hỏi lại, Tutor mới trả lời kèm citation trang 12.

## 3 · AI hỗ trợ em thế nào

Em dùng Codex trong VS Code để hỗ trợ scaffold component React, gợi ý cách chia component và viết nhanh các class Tailwind theo giao diện tham chiếu. AI giúp em giảm thời gian tạo khung trang và thử các phương án trình bày.

Tuy nhiên, em không thể dùng nguyên đầu ra mà không kiểm tra. Ví dụ rõ nhất là panel Tutor ban đầu dùng vị trí `fixed`: giao diện nhìn đúng khi đóng panel nhưng khi mở lại che slide, làm hỏng tác vụ chính của người học. Sau khi chạy thử, em xác định vấn đề nằm ở cách bố trí chứ không phải `z-index`, rồi sửa thành `xl:static`, để vùng reader dùng `flex-1` và `min-w-0`, còn màn hình nhỏ vẫn giữ drawer để phù hợp diện tích.

Một điểm khác em phải tự phân biệt là mock và AI thật. CP2 dùng nhánh từ khóa chỉ để chứng minh tương tác, nhưng bản demo cuối phải gọi model ở quyết định trung tâm. Vì vậy em phải hiểu payload gửi từ client, kiểm tra badge phạm vi, citation và fallback trên giao diện; không được gọi một câu trả lời hardcode là AI thật.

## 4 · Bài học từ một case fail thật của nhóm

Case em chọn nằm trong `validation/feedback-log.md`: **2/6 người thử không tự tìm ra thao tác bôi đen hoặc cần onboarding rõ hơn**. Nguyễn Xuân Hải nói cần thêm hướng dẫn bôi đen cho người mới; Bùi Xuân Hoà lúng túng trong lần đầu và là người duy nhất chưa cam kết dùng thật nếu giao diện không được hướng dẫn rõ hơn.

Đây là failure liên quan trực tiếp đến build flow. Trước validation, em tập trung vào việc mọi nút có thể bấm và luồng kỹ thuật chạy hết. Tuy nhiên, “bấm được” không có nghĩa là người dùng tự khám phá được thao tác. Bôi đen là hành vi lõi của lát cắt vì evidence CP1 cho thấy có ngữ cảnh bôi đen làm tỷ lệ lỗi giảm từ **21,1% xuống 2,0%**, xấp xỉ 10 lần. Nếu người mới không biết thao tác này tồn tại thì lợi ích chính của sản phẩm gần như không được sử dụng.

Từ feedback đó, nhóm thêm onboarding ngay trong lời chào Tutor để hướng dẫn người học bôi đen một đoạn rồi chọn “Hỏi AI”. Bài học em rút ra là không nên đánh giá flow chỉ bằng việc developer tự bấm thành công. Với thao tác mới, cần cho người ngoài nhóm dùng mà không gợi ý, quan sát họ có tự tìm ra hay không, rồi ưu tiên khả năng khám phá trước khi bổ sung thêm tính năng.

## Tự kiểm trước Q&A

**Phần em làm là gì?** Em trực tiếp dựng prototype CP2 và sửa layout reader ba cột; em phụ trách tích hợp phía giao diện, kiểm thử flow và demo. API AI thật là phần phối hợp của nhóm, nhưng em hiểu đường đi từ `question/currentPage/deck` đến badge, câu trả lời, citation hoặc fallback.

**Augment hay automate?** Đây là conditional automation nhưng mục tiêu là augment người học. AI tự động tìm căn cứ và quyết định phạm vi; khi thiếu căn cứ, hệ thống không đoán mà trả quyền kiểm soát cho người học bằng cách nói rõ giới hạn và cho phép chuyển trang hoặc hỏi lại.

**Failure nguy hiểm nhất?** Failure nguy hiểm nhất từng gặp là trả lời đúng kiến thức nhưng sai phạm vi, như case C02 từng lấy thông tin RLHF ở trang 19 để trả lời khi người học đang hỏi riêng trang 21. Loại lỗi này nguy hiểm vì câu trả lời nghe hợp lý nên người học dễ tin nhầm. Bản hiện tại phải giữ scope trang, không đủ căn cứ thì dừng và chỉ sang đúng trang.
