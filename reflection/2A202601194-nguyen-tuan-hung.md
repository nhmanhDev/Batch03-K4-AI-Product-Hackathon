# Reflection — Nguyễn Tuấn Hùng · 2A202601194

## 1. Vai trò

Phụ trách **evidence và narrative cho demo**: kiểm tra số liệu từ chatlog/khảo sát, làm Slide 2 (quyết định chọn lát cắt) và Slide 5 (phản hồi từ user test).

## 2. Phần mình làm

- Kiểm tra các chỉ số trong chatlog bằng `cp1/scripts/verify.py`, đặc biệt là chênh lệch giữa gõ tự do (`160/757 = 21,1%` bị từ chối) và có bôi đen (`10/495 = 2,0%`). Tôi dùng kết quả này để giải thích vì sao nhóm tập trung vào quyết định AI về phạm vi căn cứ: trang đang mở hay cả bộ slide.
- Đối chiếu evidence cho Slide 2: `14/23` yêu cầu tóm tắt một trang bị từ chối trực tiếp; `23/67` yêu cầu tóm tắt cả bộ/buổi bị từ chối trực tiếp; đồng thời kiểm lại tín hiệu khảo sát mở Mindmap `7/24` và Flashcard `9/24`. Chi tiết truy vết ở `analysis/slide2_chatlog_evidence.md` và `cp1/impact-table.md`.
- Làm giao diện/nội dung cho `analysis/slide2.html`: giữ các con số có thể tái lập, tách rõ tín hiệu khảo sát mở với bằng chứng từ chatlog, và nêu lý do không tách citation hay độ dài câu trả lời thành tính năng riêng.
- Tổng hợp 6 phản hồi user test cho `analysis/slide5.html`. Slide dùng quote nguyên văn về độ tin cậy nhờ citation, giá trị của tóm tắt/flashcard, và nhu cầu cải thiện hướng dẫn ban đầu/tìm kiếm mở rộng.

## 3. AI hỗ trợ như thế nào

Tôi dùng AI để hỗ trợ viết script truy vấn CSV và gợi ý cách diễn đạt ngắn cho phần thuyết trình. Tôi không dùng kết quả AI trực tiếp làm bằng chứng: mọi số trên Slide 2 được chạy lại bằng `python cp1/scripts/verify.py` hoặc đếm lại từ `cp1/traloi2.csv`; các quote trên Slide 5 được lấy từ phản hồi khảo sát, không tự tạo. 

## 4. Bài học từ case fail của nhóm

`C02` từng không đạt ở `eval/run-08.md` và `eval/run-09.md`: học viên hỏi số bước RLHF **ở trang đang mở 21**, nhưng hệ thống trả lời theo phạm vi **cả bộ**, cite trang 19 và vẫn đánh dấu `sufficient=true`. Case này đã được sửa từ run-10 và vẫn pass đến lượt mới nhất.

Ở lượt mới nhất `eval/run-18.md`, case chưa đạt là `C03`: với input mơ hồ chỉ có “tóm tắt”, hệ thống tự chọn phạm vi cả bộ, trả lời dài có citation và đặt `sufficient=true`. Kỳ vọng của golden set là `sufficient=false` và hỏi lại để người học chọn “trang đang mở” hay “cả bộ slide”. Lượt này đạt `19/20 = 95%`, vượt quality bar `≥85%`, đồng thời vẫn giữ 0 vi phạm hai điều kiện cứng; tuy nhiên C03 lặp lại từ run-10 đến run-18 nên chưa thể coi là đã xử lý xong.

Bài học của tôi là không được chỉ đưa tỷ lệ pass đẹp lên slide. Khi trình bày evidence và kết quả đo, tôi phải nói rõ định nghĩa chất lượng là *đúng phạm vi + có citation + xử lý mơ hồ đúng cách*, không chỉ là câu trả lời nghe hợp lý. Citation đúng không bù được việc hệ thống tự đoán ý định. Vì vậy, khi demo tôi sẽ nêu C03 là failure hiện tại và C02 là failure đã được sửa, để thể hiện nhóm ghi nhận trung thực giới hạn của sản phẩm.
