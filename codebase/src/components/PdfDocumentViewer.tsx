"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
// CSS chính thức của pdf.js — BẮT BUỘC cho text layer: đặt font-size/scaleX
// từng span theo các CSS var (--font-height, --scale-x, --total-scale-factor)
// mà TextLayer ghi vào inline style. Tự viết CSS thay thế sẽ lệch chữ.
import "pdfjs-dist/web/pdf_viewer.css";

/**
 * Render PDF THẬT bằng pdf.js (đúng engine VLearn/Chrome dùng), dạng CUỘN DỌC:
 * mọi trang xếp chồng, học viên cuộn tự nhiên thay vì bấm chuyển từng trang.
 *
 *  - canvas mỗi trang: giữ nguyên 100% layout/font/hình file gốc — không chuyển HTML
 *  - text layer trong suốt phủ trên từng canvas: bôi đen/khoanh được text thật
 *  - trang render lười (gần viewport mới vẽ) để 20+ trang không nghẽn máy
 *  - cuộn tới đâu báo trang đó qua onVisiblePageChange -> AI Tutor luôn biết
 *    đúng "trang đang xem"; đổi pageNumber từ ngoài (pager) thì cuộn tới trang
 *
 * Hiển thị và AI grounding là 2 pipeline tách biệt: component này chỉ lo hiển
 * thị từ file dưới public/; corpus cho AI vẫn là JSON tĩnh (extract-pdf.mjs).
 */

// pdf.js nạp lười 1 lần cho cả app; worker là file tĩnh copy sẵn vào public/
// (cùng version với package) để không phụ thuộc cách bundler xử lý worker.
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((m) => {
      m.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return m;
    });
  }
  return pdfjsPromise;
}

type PdfDoc = import("pdfjs-dist").PDFDocumentProxy;

interface PdfDocumentViewerProps {
  fileUrl: string;
  /** Trang đang chọn từ ngoài (pager/toolbar) — đổi giá trị sẽ cuộn tới trang đó. */
  pageNumber: number;
  /** Báo tổng số trang thật của file sau khi nạp xong. */
  onLoaded?: (numPages: number) => void;
  /** Cuộn tới trang nào thì báo trang đó — giữ ngữ cảnh "trang đang xem" cho AI Tutor. */
  onVisiblePageChange?: (page: number) => void;
  /** Nội dung cột ghi chú NẰM TRONG mỗi tờ, bên phải slide — note riêng của từng trang. */
  renderNoteColumn?: (pageNum: number) => React.ReactNode;
}

/** 1 trang: placeholder giữ chỗ theo tỉ lệ thật, chỉ render khi cuộn tới gần.
 *  `layoutWidth` đổi (đóng/mở sidebar/panel làm khung co giãn) -> render lại
 *  đúng bề rộng mới, không để canvas cũ tràn/hụt khung. */
function PdfPage({
  doc,
  pageNum,
  totalPages,
  fileLabel,
  aspect,
  onAspect,
  layoutWidth,
  noteColumn,
  isActive,
}: {
  doc: PdfDoc;
  pageNum: number;
  totalPages: number;
  fileLabel: string;
  aspect: number;
  onAspect?: (a: number) => void;
  layoutWidth: number;
  noteColumn?: React.ReactNode;
  isActive: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const renderedRef = useRef(false);
  const lastRenderWidthRef = useRef(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldRender(true);
          io.disconnect();
        }
      },
      // Vẽ trước khi trang thật sự vào màn hình 1 khoảng — cuộn tới là có sẵn.
      { rootMargin: "900px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldRender) return;
    const canvas = canvasRef.current;
    const textLayerDiv = textLayerRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !textLayerDiv || !wrap) return;
    // Bỏ khoá maxWidth cũ TRƯỚC khi đo, để đo được đúng bề rộng khung mới.
    const measuredWidth = (() => {
      wrap.style.maxWidth = "";
      return wrap.clientWidth || 900;
    })();
    // Đã render đúng bề rộng này rồi thì thôi (tránh render lặp vô ích).
    if (renderedRef.current && Math.abs(measuredWidth - lastRenderWidthRef.current) < 8) {
      wrap.style.maxWidth = `${lastRenderWidthRef.current}px`;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const page = await doc.getPage(pageNum);
        if (cancelled) return;

        const containerWidth = measuredWidth;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const dpr = window.devicePixelRatio || 1;
        onAspect?.(baseViewport.height / baseViewport.width);

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        // Khoá bề rộng wrapper theo cỡ đã render: khung chứa có rộng ra sau đó
        // (đóng sidebar/panel) thì trang vẫn giữ bên trái, phần dư bên phải
        // thành cột trống cho ghi chú lề (margin notes) neo vào.
        wrap.style.maxWidth = `${viewport.width}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({
          canvas,
          canvasContext: ctx,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        }).promise;
        if (cancelled) return;

        // Text layer: span trong suốt đè đúng vị trí từng dòng chữ của PDF.
        // CSS chính thức chỉ định nghĩa --total-scale-factor trong selector
        // ".pdfViewer .page" (wrapper của viewer đầy đủ) — mình không dùng
        // wrapper đó nên phải tự set đủ các var, thiếu là font-size của span
        // rơi về 16px mặc định và chữ lệch khỏi canvas.
        const userUnit = (page as unknown as { userUnit?: number }).userUnit ?? 1;
        textLayerDiv.innerHTML = "";
        textLayerDiv.style.setProperty("--scale-factor", String(viewport.scale));
        textLayerDiv.style.setProperty("--user-unit", String(userUnit));
        textLayerDiv.style.setProperty("--total-scale-factor", String(viewport.scale * userUnit));
        textLayerDiv.style.setProperty("--scale-round-x", "1px");
        textLayerDiv.style.setProperty("--scale-round-y", "1px");
        const textLayer = new pdfjs.TextLayer({
          textContentSource: page.streamTextContent(),
          container: textLayerDiv,
          viewport,
        });
        await textLayer.render();
        renderedRef.current = true;
        lastRenderWidthRef.current = containerWidth;
      } catch (e) {
        if ((e as Error)?.name !== "RenderingCancelledException") {
          // Trang lỗi lẻ: giữ placeholder, không phá cả danh sách.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shouldRender, doc, pageNum, onAspect, layoutWidth]);

  return (
    // Mỗi trang PDF = 1 "tờ" giấy kẻ ngang riêng: slide bên trái, cột ghi chú
    // của CHÍNH trang đó bên phải — giống sổ ghi chép cạnh slide.
    <div
      data-pdf-page={pageNum}
      className={`overflow-hidden rounded-xl bg-[#fffdf6] transition-shadow dark:bg-slate-800 ${
        isActive
          ? "shadow-md ring-2 ring-sky-400/70 dark:ring-sky-500/60"
          : "shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
      }`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(148,163,184,0.18) 27px, rgba(148,163,184,0.18) 28px)",
      }}
    >
      <div className="flex items-center justify-between px-4 pt-2.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
        <span>
          Trang {pageNum} / {totalPages}
        </span>
        <span className="truncate pl-3">{fileLabel}</span>
      </div>
      <div className="flex items-start gap-3 p-4 pt-2">
        <div
          ref={wrapRef}
          className="relative shrink-0 overflow-hidden rounded-lg bg-white shadow-sm print:w-full"
          style={{
            width: "78%",
            minHeight: renderedRef.current ? undefined : `${Math.round(aspect * 700)}px`,
          }}
        >
          <canvas ref={canvasRef} className="block w-full" />
          <div ref={textLayerRef} className="textLayer" />
        </div>
        {/* Cột note riêng của trang này — nằm trong tờ, không đè lên slide. */}
        <div className="min-w-0 flex-1 self-stretch print:hidden">{noteColumn}</div>
      </div>
    </div>
  );
}

export function PdfDocumentViewer({
  fileUrl,
  pageNumber,
  onLoaded,
  onVisiblePageChange,
  renderNoteColumn,
}: PdfDocumentViewerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [aspect, setAspect] = useState(0.5625);
  // Bề rộng khung hiện tại (debounce sau khi sidebar/panel đóng-mở xong
  // animation) — đổi giá trị là mọi trang render lại đúng cỡ mới.
  const [layoutWidth, setLayoutWidth] = useState(0);
  // Trang đang thấy do CHÍNH việc cuộn báo về — để phân biệt với pageNumber
  // đổi từ ngoài (pager): chỉ trường hợp ngoài mới cần tự cuộn tới trang.
  const lastReportedRef = useRef(pageNumber);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setDoc(null);
    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const d = await pdfjs.getDocument({ url: fileUrl }).promise;
        if (cancelled) {
          d.loadingTask.destroy();
          return;
        }
        setDoc(d);
        setStatus("ready");
        onLoaded?.(d.numPages);
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  // Hủy document cũ khi thay file/unmount.
  useEffect(() => {
    return () => {
      doc?.loadingTask.destroy();
    };
  }, [doc]);

  // Theo dõi trang nào đang chiếm nhiều màn hình nhất -> báo ra ngoài.
  useEffect(() => {
    const list = listRef.current;
    if (!list || status !== "ready" || !doc) return;
    const ratios = new Map<number, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const n = Number((e.target as HTMLElement).dataset.pdfPage);
          ratios.set(n, e.intersectionRatio);
        }
        let best = lastReportedRef.current;
        let bestRatio = 0;
        for (const [n, r] of ratios) {
          if (r > bestRatio) {
            bestRatio = r;
            best = n;
          }
        }
        if (bestRatio > 0 && best !== lastReportedRef.current) {
          lastReportedRef.current = best;
          onVisiblePageChange?.(best);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    list.querySelectorAll("[data-pdf-page]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [status, doc, onVisiblePageChange]);

  // pageNumber đổi từ ngoài (pager bấm) -> cuộn mượt tới trang đó.
  useEffect(() => {
    if (pageNumber === lastReportedRef.current) return;
    const target = listRef.current?.querySelector(`[data-pdf-page="${pageNumber}"]`);
    if (target) {
      lastReportedRef.current = pageNumber;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [pageNumber]);

  // Đánh dấu trang đang xem cho luồng IN: @media print (globals.css) ẩn mọi
  // trang trừ trang mang data-print-current -> "tải về" chỉ ra đúng 1 trang.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.querySelectorAll<HTMLElement>("[data-pdf-page]").forEach((el) => {
      el.toggleAttribute("data-print-current", Number(el.dataset.pdfPage) === pageNumber);
    });
  }, [pageNumber, status]);

  // Khung co giãn (đóng/mở sidebar/panel Tutor) -> đo lại bề rộng sau khi
  // animation xong (debounce 250ms) -> các trang render lại đúng cỡ mới.
  useEffect(() => {
    const el = listRef.current;
    if (!el || status !== "ready") return;
    let timer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => setLayoutWidth(el.clientWidth), 250);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  }, [status]);

  const handleAspect = useCallback((a: number) => setAspect(a), []);

  return (
    <div className="relative w-full">
      {status === "loading" && (
        <div className="flex h-[520px] items-center justify-center text-sm font-semibold text-slate-400">
          Đang nạp tài liệu PDF…
        </div>
      )}
      {status === "error" && (
        <div className="flex h-[520px] items-center justify-center text-sm font-semibold text-red-500">
          Không nạp được file PDF ({fileUrl})
        </div>
      )}
      {status === "ready" && doc && (
        <div ref={listRef} className="flex w-full flex-col gap-8">
          {Array.from({ length: doc.numPages }, (_, i) => (
            <PdfPage
              key={i + 1}
              doc={doc}
              pageNum={i + 1}
              totalPages={doc.numPages}
              fileLabel={fileUrl.split("/").pop() || ""}
              aspect={aspect}
              onAspect={i === 0 ? handleAspect : undefined}
              layoutWidth={layoutWidth}
              noteColumn={renderNoteColumn?.(i + 1)}
              isActive={pageNumber === i + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
