import { NextRequest, NextResponse } from "next/server";
import { clientKeyOf, checkRateLimit } from "@/lib/ai-provider";

/**
 * Gửi ghi chú/câu trả lời sang Telegram.
 *
 * NGUYÊN TẮC AN TOÀN — đây là hành động đi RA NGOÀI hệ thống, không rút lại được:
 *
 * 1. AI KHÔNG BAO GIỜ tự gọi endpoint này. AI chỉ soạn nháp hiển thị trong hộp
 *    xác nhận; chỉ khi học viên đọc và bấm "Gửi" thì client mới gọi tới đây.
 *    Nhờ vậy prompt injection trong câu hỏi không thể biến thành tin nhắn gửi đi.
 * 2. Người nhận LẤY TỪ BIẾN MÔI TRƯỜNG (`TELE_ID`), tuyệt đối không nhận
 *    `chat_id` từ client — nếu không, ai mở được web cũng gửi tin qua bot này
 *    tới người bất kỳ.
 * 3. Token chỉ tồn tại ở server, không bao giờ lộ ra client.
 * 4. Giới hạn độ dài và số lần gửi để không biến bot thành công cụ spam.
 */

const MAX_LEN = 3000;

export async function POST(req: NextRequest) {
  // Chặt hơn các endpoint AI nhiều: gửi ra ngoài là hành động hiếm, 6 lần/phút
  // đã quá đủ cho người dùng thật, nhưng chặn được kịch bản bấm liên tục.
  const limit = checkRateLimit(`tele:${clientKeyOf(req)}`, 6);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Bạn gửi hơi nhanh — chờ ${limit.retryAfterSec}s rồi thử lại nhé.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const token = process.env.TELE_BOT_TOKEN;
  const chatId = process.env.TELE_ID;
  if (!token || !chatId) {
    return NextResponse.json(
      { error: "Chưa cấu hình TELE_BOT_TOKEN / TELE_ID ở biến môi trường." },
      { status: 500 }
    );
  }

  let text = "";
  let source = "";
  try {
    const body = await req.json();
    text = String(body.text ?? "").trim().slice(0, MAX_LEN);
    source = String(body.source ?? "").trim().slice(0, 200);
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Nội dung trống." }, { status: 400 });
  }

  // Nhãn nguồn để người nhận biết tin đến từ đâu, không phải bot bị lợi dụng.
  const message = `📚 <b>VLearn Tutor</b>${source ? `\n<i>${escapeHtml(source)}</i>` : ""}\n\n${escapeHtml(text)}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      // Không trả nguyên văn lỗi Telegram ra client (có thể lộ chi tiết cấu hình).
      console.error("Telegram sendMessage failed:", data?.description);
      return NextResponse.json({ error: "Telegram từ chối tin nhắn này." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, messageId: data.result?.message_id });
  } catch (e) {
    console.error("Telegram network error:", (e as Error).message);
    return NextResponse.json({ error: "Không gọi được Telegram." }, { status: 502 });
  }
}

/** parse_mode=HTML nên phải thoát ký tự, tránh nội dung học liệu phá vỡ markup. */
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
