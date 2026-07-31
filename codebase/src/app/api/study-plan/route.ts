import { NextRequest, NextResponse } from "next/server";
import { clientKeyOf, checkRateLimit, providerChain, runChain } from "@/lib/ai-provider";
import { resolveDeck, pagesWithTextOf, outlineOf } from "@/lib/decks";

/**
 * Lập kế hoạch học tập TỪ HỌC LIỆU THẬT.
 *
 * Vẫn là cùng một cam kết grounding với /api/tutor, chỉ khác định dạng đầu ra:
 * mỗi buổi trong kế hoạch bắt buộc trỏ vào những trang CÓ THẬT trong học liệu,
 * server tự loại buổi nào trỏ trang không tồn tại hoặc trang ảnh không có text.
 * Không có căn cứ thì trả rỗng kèm lý do, tuyệt đối không bịa lịch học.
 *
 * KHÔNG tự gửi đi đâu cả — endpoint này chỉ soạn. Muốn gửi Telegram thì học
 * viên phải đọc và bấm xác nhận, đi qua /api/telegram (xem ghi chú ở đó).
 */

type Session = {
  day: number;
  title: string;
  pages: number[];
  activity: string;
  minutes: number;
};
type Plan = { goal: string; sessions: Session[]; note: string };

const SYSTEM = `Bạn là trợ giảng AI, lập kế hoạch học tập từ ĐÚNG nội dung học liệu được đưa.

LUẬT BẮT BUỘC:
1. Chỉ dựa trên nội dung THỰC SỰ có trong học liệu bên dưới. Tuyệt đối không thêm chủ đề ngoài.
2. Mỗi buổi PHẢI có "pages" là danh sách số trang THỰC SỰ chứa nội dung của buổi đó. Không chắc thì bỏ buổi, đừng đoán.
3. Chia đều khối lượng: gom các trang liền mạch về chủ đề vào cùng một buổi, đừng cắt ngang một ý lớn.
4. "activity" mô tả CÁCH học buổi đó, viết theo phương pháp học chủ động — ví dụ: đọc rồi tự tóm tắt lại không nhìn tài liệu, tự đặt 3 câu hỏi rồi tự trả lời, giải thích lại bằng lời của mình. Không viết chung chung kiểu "đọc kỹ tài liệu".
5. "minutes" là thời lượng ước tính thực tế cho buổi đó (15-90 phút), dựa trên số trang và độ khó.
6. "goal" là một câu nêu rõ sau kế hoạch này học viên làm được gì.
7. "note" là một câu lưu ý ngắn (ví dụ nhắc ôn lại buổi trước trước khi vào buổi mới).
8. Nếu học liệu quá ít nội dung để chia đủ số buổi yêu cầu, cứ chia ít hơn và nói rõ lý do trong "note".`;

const JSON_SHAPE = `
Chỉ trả về JSON đúng dạng sau, không thêm chữ nào ngoài JSON:
{"goal":"string","sessions":[{"day":1,"title":"string","pages":[số trang],"activity":"string","minutes":45}],"note":"string"}`;

const schema = {
  type: "object",
  properties: {
    goal: { type: "string" },
    sessions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "integer" },
          title: { type: "string" },
          pages: { type: "array", items: { type: "integer" } },
          activity: { type: "string" },
          minutes: { type: "integer" },
        },
        required: ["day", "title", "pages", "activity", "minutes"],
      },
    },
    note: { type: "string" },
  },
  required: ["goal", "sessions", "note"],
};

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(clientKeyOf(req), 20);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Bạn tạo hơi nhanh — chờ ${limit.retryAfterSec}s rồi thử lại nhé.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  let deckRaw: unknown;
  let days = 3;
  try {
    const body = await req.json();
    deckRaw = body.deck;
    const d = Number(body.days);
    if (Number.isInteger(d) && d >= 1 && d <= 7) days = d;
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const { deck } = resolveDeck(deckRaw);
  const pagesWithText = pagesWithTextOf(deck);

  const user = `HỌC LIỆU: ${deck.source} (${deck.totalPages} trang)

=== NỘI DUNG CẢ BỘ ===
${outlineOf(deck)}

=== YÊU CẦU ===
Lập kế hoạch học ${days} buổi cho toàn bộ học liệu này, mỗi buổi một mục trong "sessions" với "day" từ 1 đến ${days}.`;

  const chain = providerChain(SYSTEM, SYSTEM + JSON_SHAPE, user, schema);
  if (!chain.length) {
    return NextResponse.json({ error: "Chưa có API key nào được cấu hình." }, { status: 500 });
  }

  try {
    const r = await runChain<Plan>(chain, (raw) => JSON.parse(raw));

    // Chặn cứng như api/tutor: loại trang không có text; buổi nào không còn
    // trang hợp lệ thì bỏ hẳn, thà kế hoạch ngắn còn hơn có buổi trỏ vào hư không.
    let dropped = 0;
    const sessions = (r.data.sessions || [])
      .map((s) => {
        const pages = (s.pages || []).filter((p) => {
          const ok = Number.isInteger(p) && pagesWithText.has(p);
          if (!ok) dropped++;
          return ok;
        });
        return { ...s, pages };
      })
      .filter((s) => s.pages.length && s.title?.trim() && s.activity?.trim())
      // Đánh số lại cho liền mạch sau khi có buổi bị loại.
      .map((s, i) => ({ ...s, day: i + 1 }));

    return NextResponse.json({
      goal: r.data.goal,
      sessions,
      note: sessions.length
        ? r.data.note
        : "Chưa lập được buổi học nào có căn cứ rõ ràng trong học liệu này.",
      _meta: {
        provider: r.provider,
        model: r.model,
        latencyMs: r.latencyMs,
        fellBackFrom: r.fellBackFrom,
        droppedCount: dropped,
        totalMinutes: sessions.reduce((sum, s) => sum + (s.minutes || 0), 0),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
