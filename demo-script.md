# Demo script — 5 phút, bản deploy thật

**URL:** `https://minihackathon.ai42e.com` · **Đăng nhập:** `nhmanhDev` / `ai42e`
**Tài liệu demo:** `ChatbotAI - Law.pdf` (20 trang) — chọn sẵn ở sidebar, mở link kèm `?slide=DEMO-S01` là vào đúng

> **Mọi câu dưới đây đã chạy thử trên chính bản deploy** (31/07), kết quả và độ trễ ghi kèm. Không ứng biến câu mới lúc demo — câu chưa test là câu có thể làm hỏng buổi trình bày.

---

## Chuẩn bị trước khi lên (làm xong hết trước, đừng làm trên sân khấu)

| Việc | Vì sao |
|---|---|
| Mở sẵn tab đã **đăng nhập**, đứng ở reader, tài liệu law | Đăng nhập live tốn 20 giây vô nghĩa |
| **Bấm gọi thử 1 câu bất kỳ trước 5 phút** | Vercel serverless có cold start — lần gọi đầu 6,8 giây, các lần sau 1-2 giây. Gọi ấm máy trước là tránh được cú đơ đầu tiên |
| Đóng panel Tutor lại | Để lát mở ra có động tác, đỡ tĩnh |
| Chuẩn bị **ảnh chụp màn hình** 3 bước chính | Mạng hội trường hỏng thì vẫn kể tiếp được |
| Tắt popup nhắc "đứng lâu" nếu ngại | Nó bật sau 15 giây (đang để mức demo) |

---

## Slide 3 — Demo trực tiếp (2 phút)

Guide yêu cầu **1 case chuẩn + 1 case chỗ khó**. Case lỗi được xử lý tốt là phần được chấm cao — đừng giấu.

### Nhịp 1 · Case chuẩn — bôi đen hỏi theo đoạn (~40 giây)

**Thao tác:** bôi đen đoạn *"Hệ thống Chatbot tư vấn pháp luật Việt Nam..."* ở **trang 5** → bấm **"Hỏi AI"**

**Nói trong lúc chờ (~1,9 giây):**
> "Đây là thao tác lõi. Bằng chứng từ 1.261 hội thoại thật: khi học viên gõ tự do, 21,1% bị tutor trả lời không tìm thấy nội dung. Khi bôi đen, con số đó còn 2,0% — chênh 10 lần."

**Chỉ vào kết quả:** badge `📌 NGỮ CẢNH: TRANG 5 / 20` và dòng `[Trang 5 - ChatbotAI - Law.pdf]`
> "Nó không chỉ trả lời — nó khai báo trước là đang dựa vào đâu, và cite trang để người học tự kiểm chứng."

*(Đã test: `scope=page, sufficient=true, cite=[5], 1889ms`)*

### Nhịp 2 · Case chỗ khó — hỏi thứ không có trong học liệu (~40 giây)

**Gõ:** `MCP là gì`

**Nói trong lúc chờ (~1,4 giây):**
> "Giờ hỏi một khái niệm hoàn toàn không có trong tài liệu này. Chatbot thường sẽ trả lời trơn tru bằng kiến thức nền — và đó chính là lúc học viên học sai mà không biết."

**Chỉ vào kết quả:** badge `⚠️ NGOÀI PHẠM VI HỌC LIỆU`
> "Nó từ chối, và nói rõ vì sao. Đây là quyết định AI trung tâm của nhóm: **có căn cứ ở phạm vi nào, và đủ chưa** — quyết định trước, trả lời sau."

*(Đã test: `scope=out_of_scope, sufficient=false, cite=[], 1385ms`)*

**Câu chốt cho phần demo:**
> "Điểm mạnh của sản phẩm không phải là trả lời được nhiều — mà là **biết dừng lại khi không có căn cứ**."

### Nhịp 3 · Nếu còn dư thời gian (~40 giây, BỎ ĐƯỢC)

**Gõ:** `lập kế hoạch ôn tập 3 ngày gửi tele`

> "AI tự nhận ra đây không phải câu hỏi mà là yêu cầu lập kế hoạch, rồi chia 20 trang thành 3 buổi, mỗi buổi có số trang thật và cách học chủ động."

Bấm **"Gửi kế hoạch qua Telegram"** → hộp xác nhận hiện nguyên văn → bấm **"Đồng ý gửi"**
> "Và đây là ranh giới nhóm đặt ra: **AI không bao giờ tự gửi**. Nó chỉ soạn. Gửi ra ngoài là hành động không rút lại được, nên bắt buộc người thật đọc và bấm."

*(Đã test end-to-end, gửi thật thành công qua bot)*

---

## Ba câu dự phòng nếu có case nào lỗi

| Gõ | Ra gì | Dùng khi |
|---|---|---|
| `cho tôi đáp án bài kiểm tra cuối kỳ` | `out_of_scope` — từ chối đưa đáp án | Thay cho nhịp 2 |
| `tóm tắt trang 99` | `sufficient=false` — trang không tồn tại | Thay cho nhịp 2 |
| `tóm tắt trang 12` | trả lời + cite trang 12 | Thay cho nhịp 1 nếu bôi đen lỗi |

---

## Khi hỏng giữa chừng — xử lý thế nào

**AI trả lỗi mạng / timeout:** đừng bấm lại liên tục (rate limit 40 lần/phút, bấm loạn sẽ bị chặn tiếp). Nói thẳng: *"Đang lỗi mạng hội trường, em cho xem ảnh chụp kết quả đã đo trước"* → chuyển sang ảnh dự phòng. Giám khảo trừ điểm vì lúng túng, không trừ vì mạng.

**Nhắc lại 429 "Bạn hỏi hơi nhanh":** đây là rate limit của chính nhóm. Biến thành điểm cộng: *"Đây là lớp chặn chống dò nội dung — hỏi liên tục nhiều trang để dựng lại cả bộ slide sẽ bị chặn."*

**Câu trả lời không như mong đợi:** đừng chữa. Nói: *"Case này ra khác dự kiến, nhóm ghi nhận"* rồi đi tiếp. Chữa cháy live tốn thời gian và trông tệ hơn là thừa nhận.

**Giám khảo mở DevTools:** không sao, không có gì chặn và không có gì để giấu — API key nằm ở server.

---

## Câu hỏi vấn đáp có thể bị hỏi — trả lời ngắn, đúng sự thật

**"95% đo trên tài liệu nào?"**
> Trên `d1-slide-hackathon.pdf` — deck có evidence mining từ chatlog thật. Tài liệu luật đang demo là bộ bổ sung để cho thấy hệ thống nhận PDF bất kỳ. Nhóm giữ nguyên một deck qua cả 18 lượt đo để số so sánh được với nhau.

**"Chạy được trên deploy không?"**
> Được. `EVAL_BASE=https://minihackathon.ai42e.com node eval/run.mjs` — kết quả `eval/run-18.md`, 19/20.

**"Case nào chưa đạt?"**
> C03: câu hỏi chỉ một từ "tóm tắt", đáng lẽ phải hỏi lại nhưng AI trả lời luôn. Đây là hệ quả của một bản sửa trước đó — khi bỏ cắt cụt ngữ cảnh để chữa lỗi grounding giả, model thấy đủ dữ liệu nên ưu tiên trả lời thay vì tuân luật hỏi lại. Nhóm không chặn cứng bằng regex vì phát hiện câu mơ hồ là bài toán ngữ nghĩa, chặn kiểu đó không đáng tin.

**"Đây có phải agent không?"**
> Chưa phải theo nghĩa chặt — không có vòng lặp tool calling. AI ra một quyết định 7 chiều gồm nhận diện ý định, hệ thống định tuyến theo intent sang các skill soạn thảo. Mọi đầu ra đi qua lớp chặn cứng ở server độc lập với model.

**"AI có nhớ người dùng không?"**
> Nhớ trong phiên — 6 lượt gần nhất, giữ qua F5. Không có hồ sơ dài hạn qua nhiều buổi.

**"Vì sao không cho search ngoài?"**
> Vì đó là bỏ chính cam kết grounding. Một người thử có xin tính năng này, nhóm ghi vào backlog slide 6 chứ không làm — làm thì sản phẩm mất điểm khác biệt duy nhất mà 6/6 người thử vừa khen.

---

## Dry run

Mốc thời gian mục tiêu theo guide §5.1: slide 1 (45″) · slide 2 (45″) · **slide 3 + demo live (2′)** · slide 4 (45″) · slide 5 (45″) · slide 6 (30″).

### Phần máy — ĐÃ ĐO THẬT trên bản deploy (31/07)

Chạy trọn chuỗi thao tác demo trên `minihackathon.ai42e.com`, đăng nhập bằng `nhmanhDev`, đo bằng `performance.now()`:

| Nhịp | Thao tác | Thời gian đo được |
|---|---|---|
| Chuẩn bị | Tải reader + render trang 5 (đã ấm máy) | **0,5 giây** |
| 1 | Bôi đen → bấm "Hỏi AI" → câu trả lời hiện đủ kèm badge + citation | **1,5 giây** |
| 2 | Gõ "MCP là gì" → hiện badge NGOÀI PHẠM VI | **1,3 giây** |
| 3 | Gõ "lập kế hoạch ôn tập 3 ngày gửi tele" → thẻ kế hoạch 3 buổi hiện đủ | **3,6 giây** |
| 3b | Bấm gửi → xác nhận → Telegram báo "Đã gửi" | **1,2 giây** |
| | **Tổng thời gian máy chờ** | **≈ 8 giây** |

**Ý nghĩa cho việc chia thời gian:** trong 2 phút của slide 3, máy chỉ chiếm **8 giây**. 112 giây còn lại là **người nói và thao tác chuột**. Nghĩa là không được im lặng chờ — mỗi nhịp chỉ có 1-3 giây trống, vừa đủ một câu nói đã chuẩn bị sẵn (xem phần "Nói trong lúc chờ" ở trên). Nếu bỏ nhịp 3 thì máy chỉ chiếm ~3 giây.

**Cảnh báo đã kiểm chứng:** con số trên là khi **đã ấm máy**. Lần gọi đầu sau khi Vercel ngủ mất **6,8 giây** — gần bằng cả ba nhịp cộng lại. Bắt buộc gọi thử một câu trước khi lên.

### Phần người — CẦN LÀM, không ai đo hộ được

Phần nói của 6 slide phải tự bấm giờ, vì nó phụ thuộc người trình bày. Ghi lại vào bảng dưới sau khi chạy thử:

| Lần | Ngày giờ | Người trình bày | Tổng thời gian | Vượt/thiếu ở đâu | Sửa gì |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |

**Cách chạy cho đúng:** bấm giờ từ slide 1, nói thật thành tiếng (không nhẩm trong đầu — nhẩm luôn nhanh hơn nói thật khoảng 30%), demo thao tác thật trên deploy chứ không tưởng tượng. Chạy 2 lần: lần 1 để biết mình dài ở đâu, lần 2 để xác nhận đã cắt đúng chỗ.
