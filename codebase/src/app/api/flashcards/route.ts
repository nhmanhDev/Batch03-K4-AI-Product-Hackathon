import { NextRequest, NextResponse } from "next/server";
import { clientKeyOf, checkRateLimit, providerChain, runChain } from "@/lib/ai-provider";
import { resolveDeck, pagesWithTextOf, outlineOf, pageTextOf } from "@/lib/decks";

/**
 * Sinh flashcard TỪ HỌC LIỆU THẬT — không phải quyết định AI mới, mà là cùng
 * một cam kết grounding của lát cắt chính (api/tutor) áp cho định dạng khác:
 * mỗi thẻ bắt buộc trích dẫn số trang có thật, server tự loại thẻ nào cite sai.
 *
 * scope "page": 2-3 thẻ cho trang đang mở. scope "deck": 10 thẻ cho cả bộ.
 */

type Card = {
  front: string;
  options: string[];
  correctIndex: number;
  back: string;
  page: number;
};
type CardSet = { cards: Card[]; note: string };

const SYSTEM = `Bạn là trợ giảng AI, tạo thẻ ôn tập dạng TRẮC NGHIỆM từ ĐÚNG nội dung học liệu được đưa.

LUẬT BẮT BUỘC:
1. Chỉ tạo thẻ từ nội dung THỰC SỰ có trong học liệu bên dưới. Tuyệt đối không thêm kiến thức ngoài.
2. Mỗi thẻ PHẢI có "page" là số trang mà nội dung của thẻ đó thực sự nằm ở đó. Không chắc thì bỏ thẻ, đừng đoán.
3. "front" là câu hỏi ngắn gọn (1 câu).
4. "options" là ĐÚNG 4 phương án trả lời. "correctIndex" là chỉ số (0-3) của phương án ĐÚNG.
   · Phương án đúng phải lấy từ nội dung học liệu.
   · 3 phương án sai phải HỢP LÝ và cùng chủ đề (gây nhiễu thật sự), không được ngớ ngẩn hay dài ngắn lệch hẳn để đoán được ngay.
   · Không dùng "Tất cả đáp án trên" hay "Không đáp án nào đúng".
   · Rải đều vị trí đáp án đúng giữa các thẻ, đừng để luôn nằm ở một chỗ.
5. "back" là giải thích ngắn (1-3 câu) vì sao phương án đó đúng, viết bằng tiếng Việt.
6. Không tạo thẻ hỏi đáp án bài tập/trắc nghiệm về nhà của học viên.
7. Nếu học liệu quá ít nội dung để tạo đủ số thẻ yêu cầu, cứ tạo ít hơn và nói rõ lý do trong "note". Thà ít thẻ đúng còn hơn nhiều thẻ bịa.
8. "note" là một câu tiếng Việt mô tả ngắn bộ thẻ vừa tạo.`;

const JSON_SHAPE = `
Chỉ trả về JSON đúng dạng sau, không thêm chữ nào ngoài JSON:
{"cards":[{"front":"string","options":["A","B","C","D"],"correctIndex":0,"back":"string","page":số trang}],"note":"string"}`;

const schema = {
  type: "object",
  properties: {
    cards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
          back: { type: "string" },
          page: { type: "integer" },
        },
        required: ["front", "options", "correctIndex", "back", "page"],
      },
    },
    note: { type: "string" },
  },
  required: ["cards", "note"],
};

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(clientKeyOf(req), 20);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Bạn tạo hơi nhanh — chờ ${limit.retryAfterSec}s rồi thử lại nhé.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  let scope: "page" | "deck" = "deck";
  let currentPage = 1;
  let deckRaw: unknown;
  try {
    const body = await req.json();
    if (body.scope === "page") scope = "page";
    currentPage = Number(body.currentPage) || 1;
    deckRaw = body.deck;
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const { deck } = resolveDeck(deckRaw);
  const pagesWithText = pagesWithTextOf(deck);

  // Trang ảnh (không trích được text) thì không có gì để tạo thẻ — nói thẳng,
  // không để model bịa từ kiến thức nền.
  if (scope === "page" && !pagesWithText.has(currentPage)) {
    return NextResponse.json({
      cards: [],
      note: `Trang ${currentPage} là slide dạng ảnh, chưa trích được text nên chưa tạo được thẻ cho riêng trang này. Bạn thử tạo cho cả bộ nhé.`,
      _meta: { scope, reason: "page_has_no_text" },
    });
  }

  const wanted = scope === "page" ? 3 : 10;
  const content =
    scope === "page"
      ? `=== NỘI DUNG TRANG ${currentPage} ===\n${pageTextOf(deck, currentPage)}`
      : `=== NỘI DUNG CẢ BỘ ===\n${outlineOf(deck)}`;

  const user = `HỌC LIỆU: ${deck.source} (${deck.totalPages} trang)

${content}

=== YÊU CẦU ===
Tạo ${wanted} thẻ ghi nhớ${
    scope === "page" ? ` chỉ từ nội dung trang ${currentPage}` : " bao quát các ý chính của cả bộ"
  }.`;

  const chain = providerChain(SYSTEM, SYSTEM + JSON_SHAPE, user, schema);
  if (!chain.length) {
    return NextResponse.json({ error: "Chưa có API key nào được cấu hình." }, { status: 500 });
  }

  try {
    const r = await runChain<CardSet>(chain, (raw) => JSON.parse(raw));

    // Chặn cứng như api/tutor: bỏ thẻ cite trang không có text; scope="page"
    // thì trích dẫn phải trỏ đúng trang đang mở.
    const dropped: number[] = [];
    const cards = (r.data.cards || []).filter((c) => {
      const opts = c.options || [];
      const valid =
        Number.isInteger(c.page) &&
        pagesWithText.has(c.page) &&
        (scope !== "page" || c.page === currentPage) &&
        !!c.front?.trim() &&
        !!c.back?.trim() &&
        // Phải đủ 4 phương án khác nhau và chỉ số đáp án đúng nằm trong khoảng —
        // thiếu là thẻ không dùng được, bỏ luôn thay vì hiện thẻ hỏng.
        opts.length === 4 &&
        opts.every((o) => !!o?.trim()) &&
        new Set(opts.map((o) => o.trim().toLowerCase())).size === 4 &&
        Number.isInteger(c.correctIndex) &&
        c.correctIndex >= 0 &&
        c.correctIndex < 4;
      if (!valid) dropped.push(c.page);
      return valid;
    });

    return NextResponse.json({
      cards,
      note: cards.length
        ? r.data.note
        : "Chưa tạo được thẻ nào có căn cứ rõ ràng trong học liệu này.",
      _meta: {
        scope,
        provider: r.provider,
        model: r.model,
        latencyMs: r.latencyMs,
        fellBackFrom: r.fellBackFrom,
        droppedCount: dropped.length,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
