# Reflection Cá Nhân — Nguyễn Văn Trọng (Mã HV: 2A202601102)

**Dự án:** VLearn AI Tutor — Trợ Lý AI Phân Định Phạm Vi Kiến Thức  
**Vai trò phân công:** Member 2 — Luồng Prompt & Golden Set Eval (`eval/`)  

---

## 1. Vai trò của tôi trong dự án
Tôi đảm nhận vai trò chủ trì luồng **Prompt Engineering và Bộ Đánh Giá Chất Lượng (Golden Set Evaluation)**. Mục tiêu cốt lõi của tôi là đảm bảo trợ lý AI Tutor phản hồi chính xác 100% theo các điều kiện cứng (không bịa trích dẫn, không đẩy việc về học viên), đồng thời xây dựng quy trình benchmark đo lường tự động qua các đợt test.

---

## 2. Phần công việc cụ thể đã hoàn thành (Files & Commits)
* **Xây dựng bộ Golden Set 20 Case (`eval/golden-set.json`):** Khai thác dữ liệu từ 1.261 log chat thật của VLearn, thiết lập 20 test case đại diện cho 4 lớp chỗ khó (case mơ hồ `C03, C04`, ngoài phạm vi `C05, C17, C18`, prompt injection `C06, C19`, slide ảnh `C02`).
* **Viết System Prompt & Định hình Schema (`codebase/src/app/api/tutor/route.ts`):** 
  * Cấu hình System Prompt `SYSTEM` (dòng 49-83) với quy trình xử lý 3 bước và luật `mustAskBack` (bắt buộc hỏi lại có dấu `?` khi học viên gõ từ cụt).
  * Định nghĩa `geminiSchema` (dòng 90-100) ép LLM trả về đúng JSON 5 trường.
* **Vận hành Vòng lặp Eval (`eval/run.mjs` & `eval/run-06.md`):** Chạy kiểm thử tự động 6 lượt test, phân tích đối chiếu trực tiếp với Quality Bar (≥85%), nâng độ chính xác từ 80% lên 100% (20/20 case).

---

## 3. AI đã hỗ trợ tôi thế nào & Những chỗ phải tự sửa tay
* **AI hỗ trợ:** 
  * Dùng AI Coding Assistant để hỗ trợ viết nhanh các Regex mẫu cho hàm `DEMANDS_CONTENT` và dựng khung script `eval/run.mjs`.
  * Dùng AI hỗ trợ phân loại 1.261 log chat thô ban đầu để tìm ra các nhóm câu hỏi thất bại phổ biến của học viên.
* **Chỗ phải tự sửa tay / Không phụ thuộc AI:**
  * AI ban đầu gợi ý phó mặc việc chặn hallucination cho Prompt (đặt `temperature=0.2`). Tuy nhiên qua kiểm thử, prompt một mình vẫn bị lọt lỗi ở case C02 (~20% rủi ro). Tôi đã tự tay cùng nhóm viết hàm Server Guardrail `validateCitations()` bằng mã nguồn TypeScript thuần để lọc triệt để trích dẫn bịa.

---

## 4. Bài học lớn nhất từ một Case Fail thực tế của nhóm
* **Case Fail cụ thể:** **Case C02 (`eval/golden-set.json`)** — Học viên đang ở Trang 21 hỏi: *"Trên slide đang mở này, RLHF gồm mấy bước?"*. Trang 21 chỉ nói về 'Model học vẹt', còn RLHF ở Trang 19. Trong đợt test đầu, LLM đã tự ý mở rộng phạm vi lấy kiến thức Trang 19 trả lời nhưng lại bảo đó là kiến thức Trang 21.
* **Bài học rút ra:** Không bao giờ được phó mặc tính chính xác của sản phẩm AI cho Prompt LLM, kể cả khi đã hạ `temperature = 0.2`. Với các tiêu chí cứng (Hard Constraints), bắt buộc phải dùng **Code-based Guardrail** tại Server để kiểm soát phạm vi và thực hiện Graceful Failure (từ chối minh bạch) khi thiếu căn cứ.

---

## 5. Trả lời 3 câu hỏi cốt lõi trước CP6 (Guide §5.2)

###  Câu 1: Augment hay Automate — Vì sao?
* **Lựa chọn:** **Conditional Automation / Augment** (AI hỗ trợ có điều kiện dựa trên bằng chứng cứng, không Automate hoàn toàn).
* **Vì sao:** 
  * **Dựa trên Cost-of-Error (Chi phí lỗi):** Trong giáo dục, chi phí của một câu trả lời sai hoặc bịa đặt (hallucination) là cực kỳ đắt — học viên tiếp thu sai kiến thức, làm sai bài tập/quiz và mất hoàn toàn niềm tin vào trợ lý học tập. 
  * **Cơ chế hoạt động:** Trợ lý VLearn AI Tutor chỉ **Automate** việc trả lời khi có **đầy đủ 100% căn cứ (Grounding)** trực tiếp trong trang slide đang mở hoặc tài liệu buổi học. Nếu câu hỏi mơ hồ, từ ngữ cụt (`C03, C04`) hoặc nằm ngoài phạm vi (`C05, C17, C18`), hệ thống chuyển sang **Augment** bằng cách: chủ động hỏi lại (`mustAskBack`) để làm rõ ý định, hoặc chỉ rõ thiếu kiến thức gì và gợi ý đúng trang slide chứa thông tin thay vì tự tiện đoán mò.

###  Câu 2: Failure nguy hiểm nhất?
* **Failure nguy hiểm nhất:** **Trích dẫn giả / Sai căn cứ phạm vi (Hallucinated Citation & False Grounding)** — điển hình là **Case C02** (`eval/golden-set.json`).
* **Biểu hiện & Hậu quả:** Học viên đang ở Trang 21 hỏi kiến thức về RLHF (vốn thuộc Trang 19). LLM tự ý lấy kiến thức Trang 19 để trả lời nhưng lại tự tin trích dẫn *"Dựa trên slide 21 đang mở..."*. Lỗi này nguy hiểm nhất vì nó tạo ra **bẫy tin tưởng giả tạo (overconfidence trap)** — học viên thấy AI trích dẫn đúng số trang mình đang xem nên tin 100%, dẫn tới học sai lệch bài giảng.
* **Giải pháp khắc phục:** Không dựa 100% vào System Prompt (kể cả khi `temperature = 0.2`), mà bổ sung **Server-side Code Guardrail (`validateCitations`)** bằng TypeScript thuần để bắt buộc đối soát trích dẫn thực tế trước khi trả về kết quả cho học viên.

###  Câu 3: Phần bạn làm là gì?
* **Nhân sự & Luồng phụ trách:** **Nguyễn Văn Trọng (Mã HV: 2A202601102)** — Phụ trách luồng **Prompt Engineering & Golden Set Evaluation (`eval/`)**.
* **Đầu ra sản phẩm cụ thể (Artifacts):**
  1. **Xây dựng bộ Golden Set 20 Cases (`eval/golden-set.json`):** Khai thác 1.261 log chat thật của VLearn, phủ đủ 4 lớp chỗ khó (mơ hồ, ngoài phạm vi, prompt injection, slide ảnh).
  2. **Thiết kế System Prompt & Schema JSON (`codebase/src/app/api/tutor/route.ts`):** Xây dựng quy trình xử lý 3 bước, luật `mustAskBack` khi học viên gõ câu cụt và ép Schema JSON 5 trường (`geminiSchema`).
  3. **Vận hành Vòng lặp Eval (`eval/run.mjs` & `eval/run-06.md`):** Chạy 6 lượt kiểm thử tự động, theo dõi Quality Bar (≥85%), giúp tối ưu chính xác từ 80% lên 100% (20/20 case).
  4. **Phối hợp phát triển Server Guardrail (`validateCitations`):** Chặn trích dẫn sai số trang ngay từ mã nguồn TypeScript trên Server.

