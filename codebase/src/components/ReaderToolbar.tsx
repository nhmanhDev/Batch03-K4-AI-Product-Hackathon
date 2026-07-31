"use client";

import React, { useState } from "react";
import {
  Circle,
  Download,
  Eraser,
  Highlighter,
  ImagePlus,
  Minus,
  MoreHorizontal,
  MousePointer2,
  Pencil,
  Plus,
  ShieldAlert,
  Type,
} from "lucide-react";
import { PEN_COLORS } from "@/components/PDFViewerCanvas";

export type ReaderTool = "read" | "draw" | "highlight" | "circle" | "text" | "image";

interface ReaderToolbarProps {
  title: string;
  publicCode?: string;
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onOpenConfusionModal: () => void;
  activeTool: ReaderTool;
  onToolChange: (tool: ReaderTool) => void;
  penColor: string;
  onPenColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onErase: () => void;
  /** Số ghi chú lề đang có trên trang — đếm thật, không hardcode. */
  noteCount?: number;
}

export function ReaderToolbar({
  currentPage,
  totalPages,
  zoomLevel,
  onZoomChange,
  activeTool,
  onToolChange,
  penColor,
  onPenColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onErase,
  noteCount = 0,
}: ReaderToolbarProps) {
  const [showDownloadNotice, setShowDownloadNotice] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);

  const toolButtonClass = (tool: ReaderTool) =>
    `flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors ${
      activeTool === tool
        ? "border border-[#155493]/25 bg-sky-50 text-[#155493] shadow-sm dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  const showPenSettings = activeTool === "draw" || activeTool === "circle" || activeTool === "text";

  return (
    <div className="shrink-0 border-b border-slate-200 bg-[#f3f7fb] px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => onToolChange("read")} className={toolButtonClass("read")}>
              <MousePointer2 className="h-4 w-4" />
              <span className="hidden sm:inline">Đọc</span>
            </button>
            <button type="button" onClick={() => onToolChange("draw")} className={toolButtonClass("draw")}>
              <Pencil className="h-4 w-4" />
              <span className="hidden md:inline">Bút</span>
            </button>
            <button type="button" onClick={() => onToolChange("highlight")} className={toolButtonClass("highlight")}>
              <Highlighter className="h-4 w-4" />
              <span className="hidden lg:inline">Highlight</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMoreTools((v) => !v)}
              aria-pressed={showMoreTools}
              aria-label="Thêm công cụ"
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                showMoreTools
                  ? "border border-[#155493]/25 bg-sky-50 text-[#155493] dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden items-center gap-3 xl:flex">
            <span className="rounded-xl bg-sky-50 px-3 py-2 text-[11px] font-bold text-[#155493] dark:bg-sky-950/60 dark:text-sky-300">
              Trang {currentPage} · {noteCount} note
            </span>
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => onZoomChange(Math.max(50, zoomLevel - 10))} className="flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800" aria-label="Thu nhỏ">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-14 text-center text-xs font-bold text-slate-700 dark:text-slate-200">{zoomLevel}%</span>
              <button type="button" onClick={() => onZoomChange(Math.min(200, zoomLevel + 10))} className="flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800" aria-label="Phóng to">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setShowDownloadNotice(true);
                setTimeout(() => setShowDownloadNotice(false), 3000);
                // Không tải file gốc — chỉ in đúng trang đang xem (có watermark
                // bám theo vì watermark là DOM thật). Xem @media print trong
                // globals.css và #print-slide-area trong PDFViewerCanvas.tsx.
                window.print();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              aria-label="In trang này"
            >
              <Download className="h-4 w-4" />
            </button>

            {showDownloadNotice && (
              <div className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 shadow-lg dark:border-amber-900 dark:bg-amber-950/80 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    Vì lý do bảo mật, không tải file gốc — chỉ in được đúng trang đang xem (kèm watermark).
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 1 hàng gộp chung: công cụ mở rộng từ "..." (khoanh/text/ảnh/tẩy) + màu/độ dày nét —
            hễ cái nào cần hiện (showMoreTools hoặc đang Bút/Khoanh) thì render chung 1 hàng,
            không tách 2 hàng riêng để đỡ nhảy layout khi cả 2 điều kiện cùng đúng. */}
        {(showMoreTools || showPenSettings) && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
            {showMoreTools && (
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onToolChange("circle");
                    // Khoanh mặc định màu vàng, đúng cảm giác bút dạ quang tô vùng đang đọc.
                    onPenColorChange(PEN_COLORS[3]);
                  }}
                  className={toolButtonClass("circle")}
                >
                  <Circle className="h-4 w-4" />
                  <span>Khoanh</span>
                </button>
                <button type="button" onClick={() => onToolChange("text")} className={toolButtonClass("text")}>
                  <Type className="h-4 w-4" />
                  <span>Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToolChange(activeTool === "image" ? "read" : "image")}
                  className={toolButtonClass("image")}
                >
                  <ImagePlus className="h-4 w-4" />
                  <span>Ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={onErase}
                  className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Eraser className="h-4 w-4" />
                  <span>Tẩy</span>
                </button>
              </div>
            )}

            {showPenSettings && (
              <div className="flex flex-wrap items-center gap-3 px-1.5">
                <div className="flex items-center gap-2">
                  {PEN_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Chọn màu ${c}`}
                      onClick={() => onPenColorChange(c)}
                      className={`h-5 w-5 rounded-full transition-transform ${
                        penColor === c ? "scale-110 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-950" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">Nét</span>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={0.5}
                    value={strokeWidth}
                    onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                    className="h-1.5 w-24 accent-[#155493]"
                    aria-label="Độ dày nét"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <span className="sr-only">Trang {currentPage} trên {totalPages}</span>
    </div>
  );
}
