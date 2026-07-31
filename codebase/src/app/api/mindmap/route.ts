import { NextRequest, NextResponse } from "next/server";
import { clientKeyOf, checkRateLimit, providerChain, runChain } from "@/lib/ai-provider";
import { resolveDeck, pagesWithTextOf, outlineOf } from "@/lib/decks";

/**
 * Sinh sơ đồ tư duy TỪ HỌC LIỆU THẬT — cùng cam kết grounding với api/tutor:
 * mỗi nhánh phải trích dẫn trang có thật, server loại nhánh cite sai.
 *
 * Cây tối đa 3 cấp (gốc -> nhánh chính -> nhánh con) để còn đọc được trên
 * panel hẹp; sâu hơn nữa thì sơ đồ thành danh sách lồng, mất tác dụng nhìn.
 */

type Node = { title: string; page?: number; children?: Node[] };
type MindMap = { root: Node; note: string };

const SYSTEM = `Bạn là trợ giảng AI, dựng sơ đồ tư duy từ ĐÚNG nội dung học liệu được đưa.

LUẬT BẮT BUỘC:
1. Chỉ dùng nội dung THỰC SỰ có trong học liệu bên dưới. Tuyệt đối không thêm kiến thức ngoài.
2. Cây tối đa 3 cấp: gốc (tên chủ đề cả bộ) -> 3 đến 6 nhánh chính -> mỗi nhánh 2 đến 4 nhánh con.
3. Mỗi nhánh chính và nhánh con PHẢI có "page" là số trang mà nội dung đó thực sự nằm ở đó. Không chắc thì bỏ nhánh, đừng đoán. Riêng nút gốc không cần "page".
4. "title" ngắn gọn (tối đa ~10 từ), viết bằng tiếng Việt, là một ý có nội dung — không đặt tiêu đề rỗng nghĩa như "Phần 1", "Nội dung khác".
5. "note" là một câu tiếng Việt mô tả ngắn sơ đồ vừa dựng.`;

const JSON_SHAPE = `
Chỉ trả về JSON đúng dạng sau, không thêm chữ nào ngoài JSON:
{"root":{"title":"string","children":[{"title":"string","page":số,"children":[{"title":"string","page":số}]}]},"note":"string"}`;

const leaf = {
  type: "object",
  properties: { title: { type: "string" }, page: { type: "integer" } },
  required: ["title", "page"],
};

const schema = {
  type: "object",
  properties: {
    root: {
      type: "object",
      properties: {
        title: { type: "string" },
        children: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              page: { type: "integer" },
              children: { type: "array", items: leaf },
            },
            required: ["title", "page"],
          },
        },
      },
      required: ["title", "children"],
    },
    note: { type: "string" },
  },
  required: ["root", "note"],
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
  try {
    deckRaw = (await req.json()).deck;
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const { deck } = resolveDeck(deckRaw);
  const pagesWithText = pagesWithTextOf(deck);

  const user = `HỌC LIỆU: ${deck.source} (${deck.totalPages} trang)

=== NỘI DUNG CẢ BỘ ===
${outlineOf(deck)}

=== YÊU CẦU ===
Dựng sơ đồ tư duy bao quát các ý chính của cả bộ học liệu này.`;

  const chain = providerChain(SYSTEM, SYSTEM + JSON_SHAPE, user, schema);
  if (!chain.length) {
    return NextResponse.json({ error: "Chưa có API key nào được cấu hình." }, { status: 500 });
  }

  try {
    const r = await runChain<MindMap>(chain, (raw) => JSON.parse(raw));

    // Chặn cứng: loại mọi nhánh cite trang không có text trích xuất được.
    let dropped = 0;
    const keep = (nodes: Node[] | undefined): Node[] =>
      (nodes || [])
        .filter((n) => {
          const ok = !!n.title?.trim() && Number.isInteger(n.page) && pagesWithText.has(n.page!);
          if (!ok) dropped++;
          return ok;
        })
        .map((n) => ({ title: n.title, page: n.page, children: keep(n.children) }));

    const root: Node = {
      title: r.data.root?.title?.trim() || deck.label || deck.source,
      children: keep(r.data.root?.children),
    };

    return NextResponse.json({
      root,
      note: root.children?.length
        ? r.data.note
        : "Chưa dựng được nhánh nào có căn cứ rõ ràng trong học liệu này.",
      _meta: {
        provider: r.provider,
        model: r.model,
        latencyMs: r.latencyMs,
        fellBackFrom: r.fellBackFrom,
        droppedCount: dropped,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
