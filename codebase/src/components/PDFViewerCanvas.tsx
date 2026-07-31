"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Circle,
  Code,
  CheckCircle,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  MessageCircleQuestion,
  StickyNote,
  Trash2
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { PdfDocumentViewer } from "@/components/PdfDocumentViewer";
import type { StudyNote } from "@/types/vlearn";

interface SlideSection {
  type: "hero" | "text" | "highlights" | "code" | "formula" | "note" | "diagram";
  content?: string;
  items?: string[];
  language?: string;
  code?: string;
  formula?: string;
  title?: string;
}

interface SlideContent {
  title: string;
  subtitle?: string;
  author?: string;
  badge: string;
  sections: SlideSection[];
}

interface PDFViewerCanvasProps {
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  materialTitle: string;
  onPageChange: (page: number) => void;
  /** Học viên bôi đen một đoạn trên slide -> gửi đoạn đó cho AI Tutor hỏi. */
  onAskAboutSelection?: (text: string) => void;
  /** "highlight" = bôi đen đổi màu vàng thật, gửi AI hỏi; "draw" = bút vẽ tự do chọn màu, thuần annotation;
   *  "circle" = khoanh vùng tự do -> hiện thẻ xác nhận, bấm "Hỏi VLearn Tutor" mới gửi;
   *  "text" = bấm vào slide để đặt 1 ô chữ, gõ trực tiếp; "image" = chèn ảnh từ máy vào slide. */
  activeTool?: "read" | "draw" | "highlight" | "circle" | "text" | "image";
  /** Màu + độ dày nét hiện chọn ở toolbar — dùng chung cho tool "Bút" và "Khoanh". */
  penColor?: string;
  strokeWidth?: number;
  /** Đổi giá trị này (vd tăng dần) để xoá hết nét đã vẽ trên trang — nút "Tẩy" ở toolbar. */
  eraseToken?: number;
  /** Cho phép PDFViewerCanvas tự chuyển tool về "read" sau khi hoàn tất 1 thao tác chèn (vd xong việc chọn ảnh). */
  onToolChange?: (tool: "read" | "draw" | "highlight" | "circle" | "text" | "image") => void;
  /** Có = render file PDF THẬT bằng pdf.js (canvas + text layer) thay cho mock HTML. Đường dẫn dưới public/. */
  pdfUrl?: string;
  /** Kho ghi chú cá nhân dùng CHUNG với tab "Ghi chú" ở panel Tutor. */
  notes?: StudyNote[];
  onAddNote?: (n: { page: number; quote?: string; text: string }) => void;
  onUpdateNote?: (id: string, text: string) => void;
  onRemoveNote?: (id: string) => void;
}

type Point = { x: number; y: number };
type Stroke = { points: Point[]; color: string; width: number };

export const PEN_COLORS = ["#d6222f", "#2563eb", "#16a34a", "#eab308", "#ea580c", "#0f172a"];

export function PDFViewerCanvas({
  currentPage,
  totalPages,
  zoomLevel,
  materialTitle,
  onPageChange,
  onAskAboutSelection,
  activeTool = "read",
  penColor = PEN_COLORS[0],
  strokeWidth = 2.5,
  eraseToken = 0,
  onToolChange,
  pdfUrl,
  notes = [],
  onAddNote,
  onUpdateNote,
  onRemoveNote
}: PDFViewerCanvasProps) {
  // Tool "Text" — ô chữ đặt tự do trên slide, gõ trực tiếp.
  const [textAnnotations, setTextAnnotations] = useState<Array<{ id: string; x: number; y: number; content: string }>>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  // Tool "Ảnh" — ảnh chèn từ máy, kéo góc dưới-phải để đổi kích thước.
  const [imageAnnotations, setImageAnnotations] = useState<Array<{ id: string; x: number; y: number; width: number; height: number; src: string }>>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const hasOpenedPickerRef = useRef(false);
  const [selectionPopup, setSelectionPopup] = useState<{ text: string; x: number; y: number; page?: number } | null>(null);
  // Thẻ xác nhận của tool "Khoanh" — khác popup nhỏ của bôi đen: hỏi lại trước khi gửi AI.
  const [circleCard, setCircleCard] = useState<{ text: string; x: number; y: number } | null>(null);
  // Mỗi đoạn bôi đen -> 1 badge ghi chú nổi cạnh đó, bấm vào mở thẻ viết/xoá note.
  const [highlights, setHighlights] = useState<Array<{ id: string; text: string; note: string; x: number; y: number }>>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  // Note viết ở lề slide lấy từ kho ghi chú dùng chung (props) — không giữ
  // state riêng nữa, để tab "Ghi chú" bên panel Tutor luôn thấy đúng cùng dữ liệu.
  const [editingMarginId, setEditingMarginId] = useState<string | null>(null);
  const highlightMarksRef = useRef<Map<string, HTMLElement>>(new Map());
  // Các nét đã vẽ xong, giữ nguyên trên slide (annotation thuần, không xử lý gì thêm).
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [drawPath, setDrawPath] = useState<Point[]>([]);
  // Nguồn dữ liệu THẬT của nét đang vẽ — state `drawPath` chỉ dùng để render polyline
  // trực quan, còn logic ở pointerUp phải đọc từ ref này vì state có thể chưa
  // kịp cập nhật (React gộp lô) tại đúng lúc buông bút.
  const drawPathRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);
  const slideContentRef = useRef<HTMLDivElement>(null);

  /** Tô màu vàng thật cho đoạn vừa bôi đen (best-effort — bỏ qua nếu selection vắt qua nhiều thẻ không đơn giản hoá được). */
  const persistHighlightColor = (range: Range): HTMLElement | null => {
    try {
      const mark = document.createElement("mark");
      mark.className = "bg-yellow-300/70 dark:bg-yellow-500/40 rounded-[2px]";
      range.surroundContents(mark);
      return mark;
    } catch {
      // Selection cắt ngang nhiều thẻ lồng nhau -> không surroundContents được, bỏ qua, vẫn giữ popup hỏi AI.
      return null;
    }
  };

  /** Gỡ 1 highlight: bỏ thẻ <mark>, giữ nguyên text bên trong, xoá cả note gắn theo. */
  const removeHighlight = (id: string) => {
    const mark = highlightMarksRef.current.get(id);
    if (mark?.parentNode) {
      const parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    }
    highlightMarksRef.current.delete(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  const handleMouseUp = () => {
    if (activeTool === "draw" || activeTool === "circle" || activeTool === "text" || activeTool === "image") return; // các tool này xử lý riêng
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (!text || !slideContentRef.current?.contains(sel?.anchorNode ?? null)) {
      setSelectionPopup(null);
      return;
    }
    const range = sel!.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = slideContentRef.current.getBoundingClientRect();
    // Trang chứa đoạn vừa bôi đen (chế độ PDF cuộn dọc) — note phải về đúng tờ
    // đó, không phải trang đang hiện trên toolbar.
    const anchorEl =
      sel?.anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (sel.anchorNode as Element)
        : sel?.anchorNode?.parentElement ?? null;
    const pageEl = anchorEl?.closest("[data-pdf-page]") as HTMLElement | null;
    setSelectionPopup({
      text,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top,
      page: pageEl ? Number(pageEl.dataset.pdfPage) : currentPage,
    });
    if (activeTool === "highlight") {
      const mark = persistHighlightColor(range.cloneRange());
      if (mark) {
        const id = `hl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        highlightMarksRef.current.set(id, mark);
        setHighlights((prev) => [
          ...prev,
          { id, text, note: "", x: rect.right - containerRect.left, y: rect.top - containerRect.top },
        ]);
      }
      window.getSelection()?.removeAllRanges();
    }
  };

  /** Tool "Bút" = vẽ tự do thuần annotation. Tool "Khoanh" = vẽ tạm để chọn vùng, không lưu nét. */
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((activeTool !== "draw" && activeTool !== "circle") || !slideContentRef.current) return;
    // Chặn browser tự bôi đen text theo đường kéo chuột trong lúc vẽ, tránh vệt
    // chọn chữ xanh chạy song song với nét vẽ SVG.
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const rect = slideContentRef.current.getBoundingClientRect();
    const start = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    drawPathRef.current = [start];
    setDrawPath([start]);
    setSelectionPopup(null);
    setCircleCard(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawingRef.current || !slideContentRef.current) return;
    e.preventDefault();
    const rect = slideContentRef.current.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    drawPathRef.current = [...drawPathRef.current, point];
    setDrawPath(drawPathRef.current);
  };

  /** Tool "Khoanh": tìm mọi DÒNG chữ nằm trong hộp bao quanh nét khoanh -> trích text để xác nhận gửi AI. */
  const captureTextInDrawnBox = (path: Point[]): string => {
    if (!slideContentRef.current || path.length < 3) return "";
    const xs = path.map((p) => p.x);
    const ys = path.map((p) => p.y);
    // Biên độ nhỏ bù trừ nét vẽ tay hụt vài px quanh rìa chữ — để nhỏ vì các
    // dòng slide (vd tiêu đề/phụ đề) có thể chỉ cách nhau 4-6px, PAD lớn sẽ
    // ăn lấn ngay sang dòng bên cạnh dù khoanh sát đúng 1 dòng.
    const PAD = 4;
    const box = {
      minX: Math.min(...xs) - PAD,
      maxX: Math.max(...xs) + PAD,
      minY: Math.min(...ys) - PAD,
      maxY: Math.max(...ys) + PAD,
    };
    const containerRect = slideContentRef.current.getBoundingClientRect();
    // Chỉ tính là "trúng" khi hộp khoanh phủ ĐA SỐ chiều cao của dòng đó (không
    // phải chỉ chạm nhẹ vài px) — tránh bắt nhầm dòng liền kề khi hộp bao chỉ
    // vừa chớm qua mép dòng đang khoanh.
    const overlaps = (r: { left: number; right: number; top: number; bottom: number }) => {
      const xOverlap = Math.min(r.right, box.maxX) - Math.max(r.left, box.minX);
      const yOverlap = Math.min(r.bottom, box.maxY) - Math.max(r.top, box.minY);
      if (xOverlap <= 0 || yOverlap <= 0) return false;
      const lineHeight = r.bottom - r.top;
      return yOverlap / lineHeight >= 0.5;
    };
    // Bỏ qua text nằm trong lớp watermark trang trí (aria-hidden) — nếu không,
    // chữ watermark lặp lại nhiều lần sẽ lẫn vào nội dung gửi cho AI bất cứ khi
    // nào nét khoanh chạm phải 1 trong các span watermark rải khắp slide.
    const walker = document.createTreeWalker(slideContentRef.current, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        n.parentElement?.closest('[aria-hidden="true"]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const captured: string[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const value = node.nodeValue?.trim();
      if (!value) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const hit = Array.from(range.getClientRects()).some((r) =>
        overlaps({
          left: r.left - containerRect.left,
          right: r.right - containerRect.left,
          top: r.top - containerRect.top,
          bottom: r.bottom - containerRect.top,
        })
      );
      if (hit) captured.push(value);
    }
    return captured.join(" ");
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const path = drawPathRef.current;

    if (activeTool === "circle") {
      const text = captureTextInDrawnBox(path);
      if (text && slideContentRef.current) {
        const xs = path.map((p) => p.x);
        const ys = path.map((p) => p.y);
        setCircleCard({ text, x: (Math.min(...xs) + Math.max(...xs)) / 2, y: Math.max(...ys) + 12 });
      }
      // Vùng khoanh chỉ tồn tại lúc thao tác + lúc thẻ xác nhận còn mở, không lưu thành nét vẽ vĩnh viễn.
    } else if (path.length >= 2) {
      setStrokes((prev) => [...prev, { points: path, color: penColor, width: strokeWidth }]);
    }

    drawPathRef.current = [];
    if (activeTool !== "circle") setDrawPath([]);
  };

  /** Tool "Text": bấm vào chỗ trống trên slide -> đặt 1 ô chữ mới, vào edit ngay. */
  const handleSlideClick = (e: React.MouseEvent) => {
    if (activeTool !== "text" || !slideContentRef.current) return;
    const rect = slideContentRef.current.getBoundingClientRect();
    const id = `txt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setTextAnnotations((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top, content: "" }]);
    setEditingTextId(id);
  };

  /** Tool "Ảnh": chọn file xong thì chèn vào giữa slide, rồi tự chuyển lại tool "Đọc". */
  const handleImageFileChosen: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại đúng file đó lần sau
    if (!file) {
      onToolChange?.("read");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setImageAnnotations((prev) => [
        ...prev,
        { id, x: 80, y: 80, width: 220, height: 160, src: reader.result as string },
      ]);
      onToolChange?.("read");
    };
    reader.readAsDataURL(file);
  };

  // Chọn tool "Ảnh" -> tự bật hộp thoại chọn file ngay (không cần bấm thêm 1 lần trên slide).
  useEffect(() => {
    if (activeTool === "image" && !hasOpenedPickerRef.current) {
      hasOpenedPickerRef.current = true;
      imageInputRef.current?.click();
    } else if (activeTool !== "image") {
      hasOpenedPickerRef.current = false;
    }
  }, [activeTool]);

  // Chế độ mock lật từng trang: đổi trang là thay nội dung -> xoá annotation.
  // Chế độ PDF cuộn dọc: currentPage đổi liên tục CHỈ vì đang cuộn (nội dung
  // vẫn nguyên trên màn), annotation phải giữ — chỉ xoá khi đổi tài liệu.
  useEffect(() => {
    if (pdfUrl) return;
    setSelectionPopup(null);
    setCircleCard(null);
    drawPathRef.current = [];
    setDrawPath([]);
    setStrokes([]);
    setHighlights([]);
    setActiveNoteId(null);
    highlightMarksRef.current.clear();
    setTextAnnotations([]);
    setEditingTextId(null);
    setImageAnnotations([]);
    setEditingMarginId(null);
  }, [currentPage, pdfUrl]);

  useEffect(() => {
    setSelectionPopup(null);
    setCircleCard(null);
    drawPathRef.current = [];
    setDrawPath([]);
    setStrokes([]);
    setHighlights([]);
    setActiveNoteId(null);
    highlightMarksRef.current.clear();
    setTextAnnotations([]);
    setEditingTextId(null);
    setImageAnnotations([]);
    setEditingMarginId(null);
  }, [pdfUrl, materialTitle]);

  // Nút "Tẩy" ở toolbar tăng eraseToken -> xoá hết nét/ô chữ/ảnh đã chèn trên trang hiện tại.
  const isFirstEraseRender = useRef(true);
  useEffect(() => {
    if (isFirstEraseRender.current) {
      isFirstEraseRender.current = false;
      return;
    }
    setStrokes([]);
    setTextAnnotations([]);
    setImageAnnotations([]);
  }, [eraseToken]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sample slide deck content simulating the actual 83-page COMP2010 Day 01 lecture slide deck
  const getSlideContent = (page: number): SlideContent => {
    switch (page) {
      case 1:
        return {
          title: "COMP2010 - VinUni AI Thực Chiến",
          subtitle: "Day 01: Generative AI, Large Language Models (LLM) Foundations & Architecture",
          author: "VinUni Faculty & AI Research Team",
          badge: "Lecture Material · D01-S01",
          sections: [
            {
              type: "hero",
              content: "Chào mừng các bạn sinh viên đến với môn học COMP2010. Trong bài học hôm nay, chúng ta sẽ bắt đầu tìm hiểu về Nền tảng Mô hình Ngôn ngữ Lớn (LLM) và Nguyên lý Kiến trúc Transformer."
            },
            {
              type: "highlights",
              items: [
                "1. Sự tiến hóa từ RNN/LSTM đến Transformer & LLM",
                "2. Cơ chế Self-Attention & Multi-Head Attention",
                "3. Quy trình Pre-training, SFT (Supervised Fine-Tuning) và RLHF",
                "4. Ứng dụng thực tiễn trong Xây dựng AI Application & Agentic System"
              ]
            }
          ]
        };
      case 2:
        return {
          title: "1. Tổng quan về Generative AI & Large Language Models",
          subtitle: "Định nghĩa, Khả năng & Giới hạn",
          badge: "Nền tảng kiến thức",
          sections: [
            {
              type: "text",
              content: "LLM (Large Language Model) là các mô hình AI dựa trên mạng Nơ-ron sâu được huấn luyện trên lượng dữ liệu văn bản khổng lồ (hàng nghìn tỷ token) để dự đoán token tiếp theo (Next Token Prediction)."
            },
            {
              type: "code",
              language: "python",
              code: `# Minh họa cơ chế Auto-regressive Next Token Generation
def generate_text(prompt, model, max_tokens=50):
    tokens = tokenize(prompt)
    for _ in range(max_tokens):
        logits = model(tokens)
        next_token = sample_next_token(logits)
        tokens.append(next_token)
        if next_token == EOS_TOKEN:
            break
    return decode(tokens)`
            },
            {
              type: "note",
              content: "💡 Lưu ý quan trọng: Mô hình LLM bản chất là dự đoán xác suất token tiếp theo (Probabilistic Next Token Predictor), không phải cơ sở dữ liệu tra cứu tĩnh."
            }
          ]
        };
      case 3:
        return {
          title: "2. Kiến trúc Transformer (Attention Is All You Need)",
          subtitle: "Encoder - Decoder & Self-Attention Mechanism",
          badge: "Kiến trúc cốt lõi",
          sections: [
            {
              type: "diagram",
              title: "Cấu trúc Encoder-Decoder Transformer",
              items: [
                "Input Embeddings + Positional Encoding",
                "Multi-Head Self-Attention Layer",
                "Layer Normalization & Residual Connections",
                "Feed Forward Neural Network (FFN)"
              ]
            },
            {
              type: "text",
              content: "Công thức toán học của Scaled Dot-Product Attention:"
            },
            {
              type: "formula",
              formula: "Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V"
            }
          ]
        };
      default:
        return {
          title: `${materialTitle} - Slide ${page}`,
          subtitle: `Chủ đề bài học Day 01 (Trang ${page} / ${totalPages})`,
          badge: `Slide ${page}`,
          sections: [
            {
              type: "text",
              content: `Nội dung chi tiết slide học phần COMP2010 trang ${page}. Bao gồm phần giảng giải lý thuyết, các ví dụ mã nguồn minh họa và bài tập luyện tập có định hướng.`
            },
            {
              type: "highlights",
              items: [
                `Khái niệm trọng tâm trang ${page}`,
                `Ví dụ thực hành lập trình Python / PyTorch liên quan`,
                `Ghi chú quan trọng cần chuẩn bị cho phần bài tập Lab`
              ]
            }
          ]
        };
    }
  };

  const slide = getSlideContent(currentPage);
  const scale = zoomLevel / 100;

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 flex-col items-center justify-start overflow-auto bg-[#edf3f8] p-4 dark:bg-slate-950"
    >
      {/* Slide Container with Scaled Zoom & Shadow */}
      <div
        className="w-full max-w-5xl transition-transform duration-200"
        style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      >
        <div
          id="print-slide-area"
          ref={slideContentRef}
          onMouseUp={handleMouseUp}
          onClick={handleSlideClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`relative transition-all ${
            // Chế độ PDF thật: mỗi trang đã tự là 1 "tờ" giấy riêng -> khung
            // ngoài phải trong suốt, nếu không sẽ thành 1 tờ to bọc tất cả.
            pdfUrl
              ? ""
              : "min-h-[580px] rounded-2xl border border-sky-300 bg-[#fffdf6] p-8 shadow-[0_8px_24px_rgba(15,56,96,0.10)] dark:border-sky-900 dark:bg-slate-900"
          } ${
            activeTool === "draw" || activeTool === "circle"
              ? "cursor-crosshair select-none touch-none"
              : activeTool === "highlight"
                ? "cursor-text"
                : activeTool === "text"
                  ? "cursor-text"
                  : ""
          }`}
        >
          {/* Input file ẩn cho tool "Ảnh" — bật tự động khi chọn tool này ở toolbar. */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChosen}
            className="hidden"
          />
          {/* Nét vẽ tool "Bút" — annotation thuần, giữ nguyên trên slide kể cả khi
              chuyển sang tool khác (giống VLearn thật), chỉ mất khi đổi trang. */}
          {(strokes.length > 0 || drawPath.length > 1) && (
            <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full">
              {strokes.map((s, i) => (
                <polyline
                  key={i}
                  points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.8}
                />
              ))}
              {drawPath.length > 1 && activeTool === "circle" && (
                // Tool "Khoanh" = vùng tô mờ (như bút dạ quang), không phải nét viền cứng.
                <polygon
                  points={drawPath.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill={penColor}
                  fillOpacity={0.22}
                  stroke={penColor}
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
              )}
              {drawPath.length > 1 && activeTool === "draw" && (
                <polyline
                  points={drawPath.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={penColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.8}
                />
              )}
            </svg>
          )}

          {/* Watermark chống chụp/tải lại — đúng mục 5 roadmap-nang-cap.md (bảo mật PDF).
              Nền SVG lặp: phủ đều bất kể container cao bao nhiêu (PDF cuộn dọc 20+
              trang vẫn kín). pointer-events-none để không cản bôi đen/copy bên dưới. */}
          <div
            aria-hidden="true"
            data-watermark
            className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl select-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
                "<svg xmlns='http://www.w3.org/2000/svg' width='260' height='170'><text x='130' y='85' font-size='14' font-weight='bold' font-family='sans-serif' fill='#475569' fill-opacity='0.08' text-anchor='middle' transform='rotate(-28 130 85)'>nhmanhai42e</text></svg>"
              )}")`,
              backgroundRepeat: "repeat",
            }}
          />

          {/* Popup bôi đen: 2 hành động — "Hỏi AI" (gửi tutor, bằng chứng CP1:
              bôi đen giảm lỗi 10 lần so với gõ tự do) và "Ghi chú" (thẻ note lề). */}
          {selectionPopup && onAskAboutSelection && (
            <div
              style={{ left: selectionPopup.x, top: selectionPopup.y - 42 }}
              className="absolute z-20 flex -translate-x-1/2 items-center overflow-hidden whitespace-nowrap rounded-full bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
            >
              <button
                onClick={() => {
                  onAskAboutSelection(selectionPopup.text);
                  window.getSelection()?.removeAllRanges();
                  setSelectionPopup(null);
                }}
                className="flex items-center gap-1.5 bg-[#124f8c] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0d3f70]"
              >
                <MessageCircleQuestion className="h-3.5 w-3.5" />
                Hỏi AI
              </button>
              <button
                onClick={() => {
                  onAddNote?.({
                    page: selectionPopup.page ?? currentPage,
                    quote: selectionPopup.text,
                    text: "",
                  });
                  // Note mới luôn là phần tử cuối kho -> mở sẵn ô nhập cho nó.
                  setEditingMarginId("__new__");
                  window.getSelection()?.removeAllRanges();
                  setSelectionPopup(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <StickyNote className="h-3.5 w-3.5" />
                Ghi chú
              </button>
            </div>
          )}

          {/* Thẻ xác nhận tool "Khoanh" — khoanh xong KHÔNG tự gửi ngay, hỏi lại trước. */}
          {circleCard && onAskAboutSelection && (
            <div
              style={{ left: circleCard.x, top: circleCard.y }}
              className="absolute z-40 w-72 -translate-x-1/2 rounded-2xl border border-amber-200 bg-white p-3.5 shadow-xl dark:border-amber-900 dark:bg-slate-900"
            >
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                <Circle className="h-3.5 w-3.5" />
                Vùng khoanh Trang {currentPage}
              </div>
              <p className="mb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Gửi đúng đoạn vừa khoanh cho AI Tutor giải thích?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onAskAboutSelection(circleCard.text);
                    setCircleCard(null);
                    setDrawPath([]);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#124f8c] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0d3f70]"
                >
                  <MessageCircleQuestion className="h-3.5 w-3.5" />
                  Hỏi VLearn Tutor
                </button>
                <button
                  onClick={() => {
                    setCircleCard(null);
                    setDrawPath([]);
                  }}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Để sau
                </button>
              </div>
            </div>
          )}

          {/* Badge ghi chú nổi cạnh mỗi đoạn đã bôi đen — bấm vào để viết/xoá note cho đúng đoạn đó. */}
          {highlights.map((h) => (
            <button
              key={h.id}
              onClick={() => setActiveNoteId(h.id === activeNoteId ? null : h.id)}
              title="Ghi chú highlight"
              style={{ left: h.x, top: h.y - 10 }}
              className={`absolute z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border shadow transition-colors ${
                h.note
                  ? "border-amber-300 bg-amber-400 text-white"
                  : "border-amber-300 bg-white text-amber-500 hover:bg-amber-50 dark:bg-slate-900"
              }`}
            >
              <StickyNote className="h-3.5 w-3.5" />
            </button>
          ))}

          {/* Thẻ ghi chú cho highlight đang mở. */}
          {activeNoteId && highlights.find((h) => h.id === activeNoteId) && (
            <div
              style={{
                left: highlights.find((h) => h.id === activeNoteId)!.x,
                top: highlights.find((h) => h.id === activeNoteId)!.y + 20,
              }}
              className="absolute z-40 w-72 rounded-2xl border border-amber-200 bg-white p-3.5 shadow-xl dark:border-amber-900 dark:bg-slate-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <StickyNote className="h-3.5 w-3.5" />
                  Ghi chú highlight
                </div>
                <button
                  onClick={() => setActiveNoteId(null)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Xong
                </button>
              </div>

              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Đoạn đã chọn</p>
              <p className="mb-3 max-h-16 overflow-y-auto rounded-lg bg-slate-50 p-2 text-xs italic text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {highlights.find((h) => h.id === activeNoteId)!.text}
              </p>

              <textarea
                autoFocus
                spellCheck={false}
                value={highlights.find((h) => h.id === activeNoteId)!.note}
                onChange={(e) => {
                  const value = e.target.value;
                  setHighlights((prev) => prev.map((h) => (h.id === activeNoteId ? { ...h, note: value } : h)));
                }}
                placeholder="Viết ghi chú cho đoạn highlight..."
                rows={3}
                className="mb-3 w-full resize-none rounded-lg border border-amber-200 p-2 text-xs text-slate-700 outline-none focus:border-amber-400 dark:border-amber-900 dark:bg-slate-800 dark:text-slate-200"
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setHighlights((prev) => prev.map((h) => (h.id === activeNoteId ? { ...h, note: "" } : h)))}
                  className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa note
                </button>
                <button
                  onClick={() => {
                    removeHighlight(activeNoteId);
                    setActiveNoteId(null);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa highlight
                </button>
              </div>
            </div>
          )}

          {/* Ô chữ tự do từ tool "Text" — bấm ra ngoài để commit, rỗng thì tự xoá. */}
          {textAnnotations.map((t) => (
            <div
              key={t.id}
              style={{ left: t.x, top: t.y }}
              className="absolute z-30"
              onClick={(e) => e.stopPropagation()}
            >
              {editingTextId === t.id ? (
                <textarea
                  autoFocus
                  spellCheck={false}
                  value={t.content}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTextAnnotations((prev) => prev.map((x) => (x.id === t.id ? { ...x, content: value } : x)));
                  }}
                  onBlur={() => {
                    setEditingTextId(null);
                    setTextAnnotations((prev) => prev.filter((x) => x.id !== t.id || x.content.trim()));
                  }}
                  placeholder="Nhập chữ..."
                  rows={2}
                  style={{ color: penColor }}
                  className="min-w-[140px] resize rounded-lg border-2 border-dashed border-current bg-white/90 p-1.5 text-sm font-semibold outline-none dark:bg-slate-900/90"
                />
              ) : (
                <p
                  onClick={() => setEditingTextId(t.id)}
                  style={{ color: penColor, pointerEvents: activeTool === "text" ? "auto" : "none" }}
                  className={`whitespace-pre-wrap text-sm font-semibold ${activeTool === "text" ? "cursor-text hover:underline" : ""}`}
                >
                  {t.content}
                </p>
              )}
            </div>
          ))}

          {/* Ảnh chèn từ tool "Ảnh" — kéo góc dưới-phải để đổi kích thước. */}
          {imageAnnotations.map((img) => (
            <div
              key={img.id}
              style={{ left: img.x, top: img.y, width: img.width, height: img.height }}
              className="group absolute z-30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt="Ảnh chèn thêm"
                className="h-full w-full rounded-lg border border-slate-300 object-cover shadow-md dark:border-slate-600"
              />
              <button
                onClick={() => setImageAnnotations((prev) => prev.filter((x) => x.id !== img.id))}
                title="Xoá ảnh"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startW = img.width;
                  const startH = img.height;
                  const onMove = (ev: PointerEvent) => {
                    const w = Math.max(80, startW + (ev.clientX - startX));
                    const h = Math.max(60, startH + (ev.clientY - startY));
                    setImageAnnotations((prev) => prev.map((x) => (x.id === img.id ? { ...x, width: w, height: h } : x)));
                  };
                  const onUp = () => {
                    window.removeEventListener("pointermove", onMove);
                    window.removeEventListener("pointerup", onUp);
                  };
                  window.addEventListener("pointermove", onMove);
                  window.addEventListener("pointerup", onUp);
                }}
                className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize rounded-tl bg-[#124f8c]/70"
              />
            </div>
          ))}
          {/* Nội dung slide: có pdfUrl -> render PDF THẬT (pdf.js canvas + text
              layer, giữ nguyên layout gốc của giảng viên — KHÔNG chuyển HTML);
              không có -> mock HTML trang trí như cũ cho các deck demo. */}
          {pdfUrl ? (
            // pr-80: chừa sẵn cột lề phải (320px) cho thẻ ghi chú — trang PDF
            // render hẹp lại tương ứng nên note không bao giờ đè lên slide,
            // kể cả khi cả sidebar lẫn panel Tutor cùng mở.
            <PdfDocumentViewer
              fileUrl={pdfUrl}
              pageNumber={currentPage}
              onVisiblePageChange={onPageChange}
              renderNoteColumn={(pageNum) => {
                const pageNotes = notes.filter((n) => n.page === pageNum);
                if (!pageNotes.length) {
                  return (
                    <p className="px-2 pt-6 text-center text-[11px] font-medium italic leading-relaxed text-slate-400/70 dark:text-slate-500">
                      Bôi đen một đoạn trên slide rồi bấm “Ghi chú” để lưu note riêng cho trang này.
                    </p>
                  );
                }
                const newest = notes[notes.length - 1];
                return (
                  <div className="space-y-2.5">
                    {pageNotes.map((n) => {
                      const editing = editingMarginId === n.id || (editingMarginId === "__new__" && n.id === newest?.id);
                      return (
                        <div
                          key={n.id}
                          className="rounded-xl border border-amber-200 bg-amber-50/95 p-3 shadow-sm dark:border-amber-900 dark:bg-amber-950/70"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                              <StickyNote className="h-3 w-3" />
                              Ghi chú
                            </span>
                            <button
                              onClick={() => onRemoveNote?.(n.id)}
                              title="Xoá ghi chú"
                              className="text-amber-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          {n.quote && (
                            <p className="mb-1.5 line-clamp-2 border-l-2 border-amber-300 pl-1.5 text-[10px] italic leading-snug text-amber-800/80 dark:text-amber-300/80">
                              “{n.quote}”
                            </p>
                          )}
                          {editing ? (
                            <textarea
                              autoFocus
                              spellCheck={false}
                              value={n.text}
                              onChange={(e) => onUpdateNote?.(n.id, e.target.value)}
                              onBlur={() => {
                                setEditingMarginId(null);
                                // Bỏ trống thì coi như huỷ tạo note.
                                if (!n.text.trim()) onRemoveNote?.(n.id);
                              }}
                              placeholder="Viết ghi chú..."
                              rows={2}
                              className="w-full resize-none rounded-lg border border-amber-300 bg-white/80 p-1.5 text-[11px] text-slate-800 outline-none focus:border-amber-500 dark:bg-slate-900/70 dark:text-slate-200"
                            />
                          ) : (
                            <p
                              onClick={() => setEditingMarginId(n.id)}
                              className="cursor-text text-[11px] font-medium leading-snug text-slate-800 hover:underline dark:text-slate-200"
                            >
                              {n.text}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
          ) : (
          <>
          {/* Slide Top Banner */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BrandMark className="h-6 w-6" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                VinUni AI Thực Chiến · COMP2010
              </span>
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#124f8c] dark:bg-sky-950 dark:text-sky-400">
              {slide.badge}
            </span>
          </div>

          {/* Slide Title */}
          <div className="mt-6">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className="mt-1 text-xs font-semibold text-[#124f8c] dark:text-sky-400">
                {slide.subtitle}
              </p>
            )}
          </div>

          {/* Slide Content Sections */}
          <div className="mt-6 space-y-4">
            {slide.sections.map((sec, idx) => {
              if (sec.type === "hero") {
                return (
                  <div key={idx} className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-sm font-medium text-slate-700 leading-relaxed dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-300">
                    {sec.content}
                  </div>
                );
              }

              if (sec.type === "text") {
                return (
                  <p key={idx} className="text-sm font-medium text-slate-700 leading-relaxed dark:text-slate-300">
                    {sec.content}
                  </p>
                );
              }

              if (sec.type === "highlights" && sec.items) {
                return (
                  <div key={idx} className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900">
                    {sec.items.map((item: string, itemIdx: number) => (
                      <div key={itemIdx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#124f8c] dark:text-sky-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                );
              }

              if (sec.type === "code" && sec.code) {
                return (
                  <div key={idx} className="overflow-hidden rounded-xl bg-slate-900 p-4 text-xs font-mono text-slate-200 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-bold text-sky-400">
                        <Code className="h-3.5 w-3.5" /> {sec.language || "python"}
                      </span>
                      <span>Next Token Sampling</span>
                    </div>
                    <pre className="mt-3 overflow-x-auto leading-relaxed">
                      <code>{sec.code}</code>
                    </pre>
                  </div>
                );
              }

              if (sec.type === "formula" && sec.formula) {
                return (
                  <div key={idx} className="flex justify-center rounded-xl bg-slate-900 p-4 text-sm font-mono font-bold text-sky-300">
                    {sec.formula}
                  </div>
                );
              }

              if (sec.type === "note" && sec.content) {
                return (
                  <div key={idx} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs font-medium text-amber-900 dark:border-amber-950 dark:bg-amber-950/40 dark:text-amber-200">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>{sec.content}</span>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* Slide Footer with Page Number */}
          <div className="absolute bottom-4 left-8 right-8 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-400 dark:border-slate-800">
            <span>VinUni VLearn Adaptive Learning</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Trang {currentPage} / {totalPages}
            </span>
          </div>
          </>
          )}
        </div>
      </div>

      {/* Floating Bottom Navigator for Quick Page Flipping */}
      <div className="sticky bottom-4 z-30 mt-5 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          Trang {currentPage} trên {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
