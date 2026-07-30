# Roadmap nâng cấp — nguyên liệu cho spec §6 "Nếu có thêm 1 tuần"

> File này **không phải artifact chấm điểm trực tiếp** — nó là bản kế hoạch kỹ thuật cho việc mở rộng, để trích 2-3 dòng ưu tiên vào `spec.md` §6 (guide §5.1 mục 6: *"2-3 việc ưu tiên trỏ về feedback/failure chưa xử"*). Prototype hiện tại **cố tình không build** các mục dưới đây — đúng non-goal #4 đã khai từ CP1: *"Sửa retrieval production của VLearn... đóng góp nằm ở lớp quyết định"* ([cp1/impact-table.md](cp1/impact-table.md)). Roadmap này là bằng chứng nhóm **đã nghĩ tới** production, không phải không biết.

## Nguyên tắc chọn ưu tiên

Xếp theo cost-of-error và bằng chứng đã có, không xếp theo độ "ngầu" kỹ thuật:

1. **Việc nào có bằng chứng đau nhất** trong data đã mining → làm trước.
2. **Việc nào đổi hành vi người dùng thấy được** → làm trước việc chỉ đổi hạ tầng bên trong.
3. **Việc nào rủi ro cao nếu làm sai** (bảo mật, sai kiến thức) → cần review kỹ hơn, không vội.

## 1 · OCR cho slide dạng ảnh — ưu tiên trung bình

**Vấn đề thật:** `cp1/impact-table.md` giả thuyết #3 đã kiểm: *"88/160 = 55% ca thất bại nằm trên trang đã chứng minh có text"* → loại trừ "do ảnh" làm nguyên nhân chính, nhưng **không loại trừ hoàn toàn** — 45% còn lại chưa chứng minh được. Corpus hackathon hiện tại (`d1`/`d2-slide-hackathon.pdf`) **mọi trang đều có text trích xuất được** (min 132-145 ký tự/trang, kiểm bằng `extract-pdf.mjs`), nên không phải chỗ đau trong prototype — nhưng slide gốc VLearn (83 trang/bộ, không phải bản rút gọn 29 trang) nhiều khả năng có trang dạng ảnh/scan thật.

**Đề xuất:** pipeline 2 tầng — `pdfjs-dist` trích text trước (rẻ, đã có); trang trả về `chars === 0` thì fallback OCR (Tesseract.js hoặc Google Cloud Vision API). Không OCR toàn bộ ngay từ đầu vì tốn — chỉ chạy cho trang xác định là ảnh.

**Effort:** trung bình (1 API mới + 1 nhánh xử lý trong `extract-pdf.mjs`). **Rủi ro:** OCR tiếng Việt có dấu sai sót nhiều hơn tiếng Anh — cần review tay bản OCR trước khi dùng làm căn cứ cite, không tự động tin.

## 2 · Vector DB + cache theo học liệu — ưu tiên cao nếu mở rộng nhiều buổi

**Vấn đề thật:** cách làm hiện tại (nhét toàn bộ outline + 1 trang vào prompt mỗi request) chỉ chạy được vì corpus nhỏ (29 trang/bộ, ~17-24K ký tự). Đề bài nói khoá có ~1.000 học viên và nhiều buổi học — nếu mỗi buổi đều làm theo kiểu "nhét cả outline vào context", chi phí token và độ trễ tăng tuyến tính theo số trang, và không scale khi có hàng chục bộ slide.

**Đề xuất kiến trúc:**
- Khi giảng viên upload PDF (hoặc lúc build cho slide có sẵn): chạy `extract-pdf.mjs` → chunk theo trang (đã làm) hoặc theo đoạn ngữ nghĩa nhỏ hơn nếu trang dài → embed từng chunk (`text-embedding-3-small` hoặc Gemini embedding) → lưu vào vector DB (pgvector trên Postgres có sẵn, hoặc Pinecone/Qdrant nếu cần managed).
- **Build một lần, cache mãi** — giống nguyên tắc `extract-pdf.mjs` hiện tại ("cố ý KHÔNG parse PDF lúc runtime"), chỉ khác là thêm bước embed + lưu vector thay vì JSON tĩnh.
- Runtime: câu hỏi học viên → embed → similarity search lấy top-k chunk liên quan (thay vì nhét cả outline) → đưa vào prompt cùng nội dung trang đang mở.

**Effort:** cao (cần chọn vector DB, viết pipeline embed, đổi route.ts từ "outline đầy đủ" sang "retrieval top-k"). **Điều phải giữ khi đổi:** hai lớp chặn cứng hiện tại (`validateCitations()`, `stripContentDemand()`) — retrieval đổi cách lấy context, không đổi luật chặn sau khi model trả lời.

### Kiến trúc tham khảo — 3 bài đối chiếu, xem [tham-khao/](tham-khao/)

*(Không phải tự nghĩ — đối chiếu với literature RAG hiện tại để chọn đúng mức độ, không over-engineer.)*

- **[rag-02-ragvsgraphrag-eval.pdf](tham-khao/rag-02-ragvsgraphrag-eval.pdf)** (Han et al.) — baseline chuẩn cho mục này chính là **dense-retrieval RAG**: *"segment documents into textual chunks and build an index by embedding each chunk into a shared vector space; at inference time, embed the query, retrieve top-ranked chunks"*. Đây đúng là pipeline mục 2 đề xuất — không cần GraphRAG ngay từ đầu, đó là baseline đã được benchmark kỹ, đủ tốt cho slide bài giảng (không phải multi-hop knowledge base phức tạp).
- **[rag-01-document-level-knowledge-graph.pdf](tham-khao/rag-01-document-level-knowledge-graph.pdf)** (RAKG) — hướng nâng cấp **nếu** dense-retrieval không đủ: trích "pre-entity" (khái niệm) từ mỗi chunk làm truy vấn trung gian, giải quyết đúng vấn đề *"long-context forgetting"* — liên hệ trực tiếp tới phát hiện thật của nhóm ở golden set case C02 (§eval/run-08.md): model trả lời đúng nội dung RLHF nhưng lấy từ trang 19 dù đang mở trang 21, vì chỉ thấy tên khái niệm trong outline rút gọn. RAKG-style: nối "RLHF" (trang 21 nhắc tới) → node "RLHF" (định nghĩa đầy đủ ở trang 19) bằng cạnh tường minh, thay vì để model tự suy luận qua outline 90 ký tự/trang.
- **[rag-03-reasoning-rag-survey.pdf](tham-khao/rag-03-reasoning-rag-survey.pdf)** — phân loại **System 1 (predefined reasoning — pipeline cố định, có thể audit)** vs **System 2 (agentic reasoning — model tự quyết khi nào retrieve/gọi tool)**. `route.ts` hiện tại **là System 1 có chủ đích**: một lời gọi, quyết định chốt, 2 lớp chặn cứng độc lập với model — đúng lựa chọn cho quyết định real-time, chi phí sai thấp, kiểm chứng được (khớp automation "Conditional" đã chọn trong spec §4, lý do cost-of-error). System 2 (agentic, đa bước) chỉ đáng đánh đổi độ trễ + chi phí khi câu hỏi cần tổng hợp nhiều nguồn — không phải use case chính của lát cắt này.

## 3 · Chunking / indexing strategy — đi kèm mục 2

**Vấn đề:** trang slide dài (VD trang 7 của d1: ~800+ ký tự) nhét nguyên trang vào context ổn ở quy mô nhỏ, nhưng chunk theo *ý* (mỗi bullet/section một chunk) sẽ cho retrieval chính xác hơn theo trang khi mở rộng — đặc biệt hữu ích cho case "cả bộ" (`scope=deck`) hiện đang nhét *toàn bộ* outline, sẽ không scale khi có >50 trang.

**Đề xuất:** heuristic đơn giản trước (chunk theo dòng trống / heading pattern đã có trong `extract-pdf.mjs` — code trích theo tọa độ y nên đã giữ được cấu trúc dòng), chưa cần NLP phức tạp ở giai đoạn này. Nếu cần chính xác hơn nữa, RAKG (trên) gợi ý bước trung gian: NER trích "pre-entity" từ mỗi chunk trước khi embed, giảm nhiễu do coreference (chunk nhắc "nó", "model đó" mà không rõ đối tượng).

## 4 · Worker pool / xử lý nhiều học viên đồng thời — ưu tiên thấp cho hackathon, cao cho production thật

**Vấn đề thật:** giờ giải lao hoặc đầu buổi, nhiều học viên cùng hỏi tutor cùng lúc → nếu route.ts hiện tại (serverless function, mỗi request tự làm hết từ đầu: đọc corpus tĩnh + gọi model) chạy trên Vercel, **Vercel tự động scale serverless function theo request** — đây là điểm khác biệt quan trọng: không cần tự dựng worker pool, vì nền tảng đã lo phần đó. Cái cần lo là **rate limit của Gemini API** (free tier ~1.500 req/ngày theo `02-guide.md` §3.4) và **cost** khi scale thật.

**Đề xuất:** không tự xây worker pool (Vercel đã làm), thay vào đó thêm hàng đợi mềm (soft queue) hoặc rate-limit theo user ở tầng ứng dụng nếu vượt free tier, và cache câu trả lời cho câu hỏi giống hệt nhau trong cùng khung giờ ngắn (nhiều học viên hỏi cùng một câu phổ biến về cùng một trang).

**Effort:** thấp nếu chỉ thêm cache; cao nếu cần dựng hạ tầng riêng (không khuyến nghị cho quy mô 1.000 học viên — chưa cần).

## 5 · Bảo mật PDF — ưu tiên cao trước khi đưa cho user thật ngoài nhóm

**Vấn đề:** hiện `data/vlearn-pack/` không commit lên repo public (đã tuân luật bảo mật), nhưng nếu deploy Vercel công khai, endpoint `/api/tutor` trả về nội dung trích từ PDF qua `outline`/`missing` — học viên có thể dò ra gần hết nội dung slide qua nhiều lượt hỏi mà không cần quyền truy cập file gốc.

**Đề xuất:** xác thực học viên (biết học viên nào đang hỏi, giới hạn theo lớp/buổi họ đăng ký) trước khi trả về nội dung — hiện tại prototype không có tầng auth vì ngoài phạm vi CP1-CP3, nhưng đây là việc **bắt buộc** trước khi coi là sản phẩm thật.

**Effort:** trung bình (NextAuth hoặc tích hợp SSO có sẵn của VLearn).

## 6 · Flashcard / mindmap tự sinh — ưu tiên thấp, không liên quan lát cắt đã chọn

**Đã loại ở CP1** — non-goal #3: nhu cầu ôn tập được phục vụ bằng chính bản tóm tắt có trích dẫn, không phải tính năng riêng. Hai tab Flashcard/Mindmap trong UI hiện là mock trang trí (`ReaderTabs.tsx`), không nằm trong lát cắt đã chọn. Nếu làm thật, đây là **quyết định AI thứ hai** (chọn gì để đưa vào thẻ/nhánh sơ đồ) — đúng tinh thần "1 quyết định AI" đã cam kết ở CP1, nên xứng đáng là **lát cắt độc lập của một team khác**, không phải mở rộng của lát cắt này.

## 7 · Hạ tầng/deploy (domain, CI, multi-env) — ưu tiên thấp cho hackathon

Không cần cho 5 tiêu chí nghiệm thu ([01-de-bai.md](01-de-bai.md)) — *"không yêu cầu deploy"*. Vercel hiện đã chạy được (`k4-hackathon-ai-42-e-d304.vercel.app`), đủ cho demo CP6. CI/CD, multi-environment (staging/prod tách biệt) chỉ cần khi có nhiều người maintain lâu dài — chưa cấp thiết cho 1,5 ngày sự kiện.

---

## Tóm tắt cho spec §6 — chọn 2-3 dòng khi viết slide 6

Ưu tiên theo evidence + cost-of-error, không theo độ khó kỹ thuật:

1. **Vector DB + cache theo học liệu (mục 2)** — mở khoá được việc nhân rộng ra tất cả các buổi học, không chỉ Day 1/Day 2 hackathon.
2. **Bảo mật/xác thực học viên (mục 5)** — bắt buộc trước khi đưa cho user thật ngoài phạm vi thử nghiệm nội bộ.
3. **OCR cho slide ảnh (mục 1)** — vá nốt 45% chưa loại trừ được của giả thuyết "do ảnh".
