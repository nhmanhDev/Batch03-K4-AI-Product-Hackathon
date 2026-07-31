/**
 * Trích text từng trang của học liệu PDF ra JSON để API route dùng làm căn cứ.
 *
 *   node scripts/extract-pdf.mjs
 *
 * Chạy một lần rồi commit file JSON. Cố ý KHÔNG parse PDF lúc runtime:
 *  - serverless function không phải tải PDF mỗi request
 *  - căn cứ trở thành dữ liệu tĩnh, xác định được -> golden set chấm lại được
 *
 * Nguồn là 2 bộ slide bản hackathon trong data pack (KHÔNG phải bản gốc
 * day01-slide-blue-v0/v1 — bản đó không thuộc data pack được cấp). Số trang
 * ở đây là số trang bản rút gọn 29 trang mà học viên thấy trong app, không
 * phải số trang bản gốc trong chatlog — xem cp1/impact-table.md giới hạn #8.
 *
 * d1/d2 dùng làm corpus cho lát cắt chính (route.ts, đúng khoá VinUni AI
 * Thực Chiến, có evidence mining từ chatlog thật — xem cp1/).
 *
 * rag1-rag5 là 5 bài báo RAG công khai (tham-khao/, không dính data VLearn)
 * — dùng làm corpus cho Day 03-05 mock trong sidebar, để AI Tutor ground
 * được thật trên cả 5 "ngày" thay vì chỉ 2. Đây là nội dung demo bổ sung,
 * KHÔNG phải học liệu thật của khoá — khai rõ trong spec.md khi demo.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const OUT_DIR = resolve(import.meta.dirname, "..", "src", "data");
const SLIDES_DIR = resolve(ROOT, "data", "vlearn-pack", "slides");
const THAM_KHAO_DIR = resolve(ROOT, "tham-khao");

const DECKS = [
  { id: "d1", dir: SLIDES_DIR, file: "d1-slide-hackathon.pdf", label: "Day 1 · AI & LLM Foundation" },
  { id: "d2", dir: SLIDES_DIR, file: "d2-slide-hackathon.pdf", label: "Day 2 · Xác định bài toán cho AI" },
  { id: "rag1", dir: THAM_KHAO_DIR, file: "rag-01-document-level-knowledge-graph.pdf", label: "RAKG — Document-level Knowledge Graph Construction" },
  { id: "rag2", dir: THAM_KHAO_DIR, file: "rag-02-ragvsgraphrag-eval.pdf", label: "RAG vs. GraphRAG — Systematic Evaluation" },
  { id: "rag3", dir: THAM_KHAO_DIR, file: "rag-03-reasoning-rag-survey.pdf", label: "Reasoning Agentic RAG — Survey" },
  { id: "rag4", dir: THAM_KHAO_DIR, file: "rag-04-corrective-rag.pdf", label: "Corrective Retrieval Augmented Generation" },
  { id: "rag5", dir: THAM_KHAO_DIR, file: "rag-05-self-rag.pdf", label: "Self-RAG — Learning to Retrieve, Generate, Critique" },
  // Slide khóa luận của chính nhóm trưởng (nguồn tự sở hữu, an toàn) — deck demo
  // chính cho viewer PDF thật: file gốc nằm ở public/slides/chatbot-law.pdf để
  // pdf.js render trực tiếp, còn JSON này là corpus cho AI ground.
  { id: "law", dir: THAM_KHAO_DIR, file: "ChatbotAI - Law.pdf", label: "Chatbot tư vấn pháp luật Việt Nam — ứng dụng RAG" },
];

const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");

async function extractOne(deck) {
  const src = resolve(deck.dir, deck.file);
  const data = new Uint8Array(await readFile(src));
  const pdf = await getDocument({ data, useSystemFonts: true }).promise;

  const pages = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();

    const lines = new Map();
    for (const item of content.items) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!lines.has(y)) lines.set(y, []);
      lines.get(y).push({ x: item.transform[4], str: item.str });
    }
    const text = [...lines.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) =>
        items
          .sort((a, b) => a.x - b.x)
          .map((i) => i.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean)
      .join("\n");

    pages.push({ page: n, text, chars: text.length });
  }

  const out = {
    source: deck.file,
    label: deck.label,
    extractedAt: new Date().toISOString(),
    totalPages: pdf.numPages,
    pages,
  };

  await mkdir(OUT_DIR, { recursive: true });
  const outPath = resolve(OUT_DIR, `${deck.id}-pages.json`);
  await writeFile(outPath, JSON.stringify(out, null, 2), "utf8");

  const empty = pages.filter((p) => p.chars === 0).map((p) => p.page);
  console.log(`[${deck.id}] ${pdf.numPages} trang -> ${outPath}`);
  console.log(
    `[${deck.id}] ký tự: tổng ${pages.reduce((s, p) => s + p.chars, 0)}, median ${
      pages.map((p) => p.chars).sort((a, b) => a - b)[Math.floor(pages.length / 2)]
    }`
  );
  console.log(
    empty.length
      ? `[${deck.id}] ⚠️  ${empty.length} trang KHÔNG có text (khả năng là ảnh): ${empty.join(", ")}`
      : `[${deck.id}] mọi trang đều có text`
  );
}

for (const deck of DECKS) {
  await extractOne(deck);
}
