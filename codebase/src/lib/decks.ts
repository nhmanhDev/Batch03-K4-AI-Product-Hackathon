/**
 * Corpus tĩnh của mọi học liệu — trích sẵn lúc build bằng scripts/extract-pdf.mjs.
 * Dùng chung cho api/tutor, api/flashcards, api/mindmap để cả 3 ground vào
 * ĐÚNG một nguồn sự thật, không lệch nhau.
 */
import d1Deck from "@/data/d1-pages.json";
import d2Deck from "@/data/d2-pages.json";
// rag1-rag5: 5 bài báo RAG công khai (tham-khao/) — corpus demo bổ sung.
import rag1Deck from "@/data/rag1-pages.json";
import rag2Deck from "@/data/rag2-pages.json";
import rag3Deck from "@/data/rag3-pages.json";
import rag4Deck from "@/data/rag4-pages.json";
import rag5Deck from "@/data/rag5-pages.json";
// law: slide khóa luận của chính nhóm trưởng (nguồn tự sở hữu).
import lawDeck from "@/data/law-pages.json";

export type DeckId = "d1" | "d2" | "rag1" | "rag2" | "rag3" | "rag4" | "rag5" | "law";
export type Deck = typeof d1Deck;

export const DECKS: Record<DeckId, Deck> = {
  d1: d1Deck,
  d2: d2Deck,
  rag1: rag1Deck,
  rag2: rag2Deck,
  rag3: rag3Deck,
  rag4: rag4Deck,
  rag5: rag5Deck,
  law: lawDeck,
};

export function resolveDeck(raw: unknown): { id: DeckId; deck: Deck } {
  const id: DeckId = typeof raw === "string" && raw in DECKS ? (raw as DeckId) : "d1";
  return { id, deck: DECKS[id] };
}

/** Trang không có text trích xuất được (slide dạng ảnh) — không thể là nguồn trích dẫn. */
export function pagesWithTextOf(deck: Deck): Set<number> {
  return new Set(deck.pages.filter((p) => p.chars > 0).map((p) => p.page));
}

/**
 * Full text mọi trang, KHÔNG cắt cụt. Corpus mỗi deck chỉ ~4-6K token nên
 * cắt bớt chỉ làm mất căn cứ thật, khiến model trả lời bằng kiến thức nền
 * thay vì đọc đúng nội dung slide (rủi ro grounding giả).
 */
export function outlineOf(deck: Deck): string {
  return deck.pages
    .map((p) =>
      p.chars > 0
        ? `--- Trang ${p.page} ---\n${p.text}`
        : `--- Trang ${p.page} --- [KHÔNG có text trích xuất được — slide dạng ảnh]`
    )
    .join("\n\n");
}

/** Nội dung đúng một trang, dùng cho phạm vi "trang đang mở". */
export function pageTextOf(deck: Deck, page: number): string {
  const p = deck.pages.find((x) => x.page === page);
  return p?.chars ? p.text : "[Trang này KHÔNG có text trích xuất được — slide dạng ảnh]";
}
