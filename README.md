# AI Thực Chiến: Venture Arena — Nhóm AI42E · Zone D304

**Hướng A — VLearn · tối ưu AI tutor có sẵn**

> **Lát cắt:** Học viên trong buổi học hỏi một câu về học liệu của buổi → AI quyết định nó có căn cứ ở phạm vi nào (trang đang mở / cả bộ slide) và có đủ để trả lời hay không → trả về câu trả lời kèm trích dẫn đúng phạm vi đó, hoặc nói rõ thiếu gì và chỉ sang chỗ có, không đòi học viên tự cung cấp nội dung.

Chi tiết bài toán, bằng chứng và bảng impact: **[cp1/canvas.md](cp1/canvas.md)** · **[cp1/impact-table.md](cp1/impact-table.md)**

## Thành viên & phân công

Leader: **Nguyễn Hùng Mạnh** — `2A202601256`

Bốn luồng chạy song song theo [02-guide.md](02-guide.md) §3.5.

| Mã HV | Tên | Luồng | Phần phụ trách | Artifact có tên |
|---|---|---|---|---|
| `2A202601256` | Nguyễn Hùng Mạnh | spec + validation | AI Spec 8 mục theo `03-template-ai-spec.md` · hẹn trước willing users, chủ trì vòng validation | `spec.md` · `validation/` |
| `2A202601102` | Nguyễn Văn Trọng | prompt + golden set | Prompt ở quyết định trung tâm · golden set ≥20 case · vòng lặp `chạy trọn bộ → % → sửa 1 failure → chạy lại` | `eval/` · phần prompt trong `codebase/` |
| `2A202601194` | Nguyễn Tuấn Hùng | evidence | Vòng hỏi 10 người · giữ `verify.py` và mọi con số mining · **người thứ 2 của build flow sau CP2** | `cp1/` · `spec.md` §1-§2 |
| `2A202601568` | Trần Trọng Thịnh | build flow | Flow chính bấm đi hết được, không can thiệp tay · lời gọi AI thật · demo CP6 | `codebase/` · `demo-slides.pdf` |

**Vibe-coding rule:** mỗi người phải giải thích được phần có tên mình — TA hỏi ngẫu nhiên **một** người tại CP5, không giải thích được thì phần cá nhân liên quan 0 điểm ([04-rubric.md](04-rubric.md) mục Reflection).

**Giao diện giữa các luồng** — chỗ dễ tắc nhất, chốt trước:

| Từ | Sang | Bàn giao cái gì | Trước mốc |
|---|---|---|---|
| Mạnh | Trọng | 4 lớp chỗ khó (①②③④) + ≥8 kịch bản trong `spec.md` §5-§6 → đây là xương của golden set | CP3 |
| Mạnh | Trọng | Định nghĩa từng chiều chất lượng + quality bar bằng số | 23:59 N1 (chốt, không đổi sau) |
| Thịnh | Trọng | Điểm cắm prompt trong code + cách chạy 1 case ngoài UI | CP2 |
| Tuấn Hùng | Trọng | Case lấy từ chatlog: mã turn + trang + `day_code` | CP3 |
| Tuấn Hùng | Mạnh | 3 dòng tổng hợp vòng hỏi 10 người → ô hậu quả trong `spec.md` §1 | trước 23:59 N1 |
| Trọng | Mạnh | Bảng kết quả có % để đối chiếu quality bar | CP3 |

## Bằng chứng — chạy lại được

```bash
python cp1/scripts/verify.py
```

Một lệnh in ra mọi con số được trích trong canvas và bảng impact. Chỉ dùng thư viện chuẩn của Python 3.7+, không cần cài gì. Map từng con số về chỗ nó được trích: [cp1/scripts/README.md](cp1/scripts/README.md).

Số chính, mining **1.261 lượt hỏi-đáp thật** (369 user, 585 hội thoại, 22–29/07/2026):

- Đường **gõ câu hỏi tự do** hỏng **21,1%** (160/757) so với **2,0%** (10/495) khi có **bôi đen** — chênh 10 lần, và độ dài đoạn bôi đen không phải biến giải thích
- **62,5%** câu hỏi bị từ chối không bao giờ được trả lời · **49%** là câu hỏi cuối cùng học viên hỏi trong ngày
- Nhóm lỗi này **15/15 lượt được rate đều là 👎**, không một lượt 👍
- Đã loại trừ giả thuyết "do slide là ảnh" từ hai phía: 55% ca thất bại nằm trên trang đã chứng minh có text, và cả 58 trang slide trong pack đều extract được text

Giới hạn bằng chứng ghi nhận trung thực — gồm cả 2 giả thuyết đã kiểm và **không** đứng vững: [cp1/impact-table.md](cp1/impact-table.md) mục "Giới hạn bằng chứng".

## Chạy prototype

```bash
cd codebase
npm install
npm run dev
```

Mở `http://localhost:3000`. Cần `codebase/.env.local` với `GEMINI_API_KEY` để gọi AI thật ở quyết định trung tâm. Flow chi tiết + phần nào thật/mock: [codebase/README.md](codebase/README.md).

## Tiến độ theo checkpoint

| Đường dẫn | Nội dung | Trạng thái |
|---|---|---|
| `cp1/` | Canvas CP1 · bảng impact · kịch bản khảo sát · script đếm | ✅ CP1 |
| `codebase/` | Prototype mock — flow chính bấm đi hết được | ✅ CP2 |
| `eval/` | Golden set ≥20 case + bảng kết quả các lượt chạy | ✅ CP3 |
| `spec.md` | AI Spec theo `03-template-ai-spec.md` | ✅ CP4 — chốt 23:59 N1, quality bar không đổi sau đó |
| `validation/` | Feedback log 6 người ngoài nhóm + 4 dòng tổng hợp | ✅ CP5 |
| `demo-script.md` | Kịch bản 5 phút, mọi câu đã test trên bản deploy | ✅ CP5 |
| `demo-backup/` | Ảnh dự phòng chụp từ bản deploy khi live hỏng | ✅ CP6 |
| `demo-slides.pdf` | Slide 6 trang theo `02-guide.md` §5.1 | ✅ CP6 |
| `reflection/` | Mỗi người 1 file — **khung đã có, nội dung mỗi người tự viết** | ⬜ CP6 |

Lịch 6 mốc (khoá 4) và checklist TA xác minh từng mốc: [04-rubric.md](04-rubric.md) Phần 3.

Tài liệu ban tổ chức giữ nguyên trong repo: [01-de-bai.md](01-de-bai.md) · [02-guide.md](02-guide.md) · [03-template-ai-spec.md](03-template-ai-spec.md) · [04-rubric.md](04-rubric.md)

## Bảo mật dữ liệu được cung cấp

Dữ liệu trong `data/` là dữ liệu thật của khoá học (đã ẩn danh), cấp riêng cho hackathon này. Khi nhận data, nhóm cam kết:

1. **Chỉ dùng trong phạm vi hackathon** — tìm bằng chứng, xây golden set, build prototype. Không dùng cho mục đích khác.
2. **Không chia sẻ ra ngoài khoá học** — không đăng mạng xã hội, không gửi người ngoài, không đưa vào dataset hay repo công khai nào.
3. **Không commit data pack vào repo nộp bài** — chỉ trích dẫn ngắn để minh hoạ; golden set ghi mã đoạn/mã hội thoại thay vì dán nguyên văn dài.
4. **Cẩn trọng khi đưa data vào công cụ ngoài** — chỉ phần tối thiểu cần thiết; free tier có thể dùng dữ liệu để huấn luyện (xem [02-guide.md](02-guide.md) §3.4).
5. **Không cố suy ngược danh tính** từ dữ liệu đã ẩn danh (`[học viên]`, mã `U`/`C`/`T`/`M`).
6. Sau sự kiện, **xoá các bản sao data pack** khỏi máy cá nhân và các công cụ đã upload nếu ban tổ chức yêu cầu.

Không commit API key. Key chỉ đọc trong **server route** qua `process.env` — không đặt tên `NEXT_PUBLIC_*` cho key vì biến đó đi vào bundle JS công khai. `.gitignore` đã bắt `.env`, `.env.local` và mọi biến thể.

## Ghi nhận

Codebase khởi tạo từ template [ai-website-cloner-template](https://github.com/JCodesMore/ai-website-cloner-template) — MIT, JCodesMore.

