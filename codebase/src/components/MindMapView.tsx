"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Maximize2, X } from "lucide-react";

/**
 * Sơ đồ tư duy vẽ bằng SVG thật (cây ngang: gốc trái -> nhánh chính -> nhánh con),
 * KHÔNG phải danh sách lồng nhau — panel bên phải quá hẹp để đọc dạng list.
 *
 * Panel chỉ hiện bản thu nhỏ; bấm vào mở popup toàn màn hình để quan sát,
 * và tải được ra PNG để dán vào slide/ghi chép.
 */

export type MindNode = { title: string; page?: number; children?: MindNode[] };

const ROW_H = 40;
const PAD_Y = 24;
const COL_ROOT_W = 200;
const COL_BRANCH_W = 260;
const COL_LEAF_W = 300;
const GAP = 48;

type Placed = { node: MindNode; x: number; y: number; w: number; depth: number };

/** Xếp chỗ: mỗi nút lá chiếm 1 hàng, nút cha nằm giữa các con của nó. */
function layout(root: MindNode) {
  const placed: Placed[] = [];
  const edges: Array<{ from: Placed; to: Placed }> = [];
  let row = 0;

  const rootP: Placed = { node: root, x: 0, y: 0, w: COL_ROOT_W, depth: 0 };
  placed.push(rootP);

  for (const branch of root.children || []) {
    const leaves = branch.children || [];
    const startRow = row;

    const leafPlaced: Placed[] = leaves.map((leaf) => {
      const p: Placed = {
        node: leaf,
        x: COL_ROOT_W + GAP + COL_BRANCH_W + GAP,
        y: PAD_Y + row * ROW_H,
        w: COL_LEAF_W,
        depth: 2,
      };
      row++;
      return p;
    });

    // Nhánh không có con vẫn chiếm 1 hàng để không chồng lên nhánh kế tiếp.
    if (!leaves.length) row++;

    const branchY = leafPlaced.length
      ? (leafPlaced[0].y + leafPlaced[leafPlaced.length - 1].y) / 2
      : PAD_Y + startRow * ROW_H;

    const branchP: Placed = {
      node: branch,
      x: COL_ROOT_W + GAP,
      y: branchY,
      w: COL_BRANCH_W,
      depth: 1,
    };
    placed.push(branchP, ...leafPlaced);
    edges.push({ from: rootP, to: branchP });
    leafPlaced.forEach((lp) => edges.push({ from: branchP, to: lp }));
  }

  const totalRows = Math.max(row, 1);
  const height = PAD_Y * 2 + totalRows * ROW_H;
  rootP.y = height / 2 - ROW_H / 2;

  const width = COL_ROOT_W + GAP + COL_BRANCH_W + GAP + COL_LEAF_W + PAD_Y;
  return { placed, edges, width, height };
}

const COLORS = ["#124f8c", "#0f766e", "#b45309", "#7c3aed", "#be123c", "#0369a1"];

function MindMapSvg({ root, svgRef }: { root: MindNode; svgRef?: React.Ref<SVGSVGElement> }) {
  const { placed, edges, width, height } = useMemo(() => layout(root), [root]);

  // Màu theo nhánh chính để mắt bám được nhóm nào thuộc nhánh nào.
  const colorOf = (p: Placed) => {
    if (p.depth === 0) return "#0f172a";
    const branches = root.children || [];
    const idx = branches.findIndex(
      (b) => b === p.node || (b.children || []).some((c) => c === p.node)
    );
    return COLORS[(idx < 0 ? 0 : idx) % COLORS.length];
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-full"
    >
      <rect width={width} height={height} fill="#ffffff" />

      {edges.map((e, i) => {
        const x1 = e.from.x + e.from.w;
        const y1 = e.from.y + ROW_H / 2 - 6;
        const x2 = e.to.x;
        const y2 = e.to.y + ROW_H / 2 - 6;
        const mid = (x1 + x2) / 2;
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke={colorOf(e.to)}
            strokeOpacity={0.35}
            strokeWidth={1.6}
          />
        );
      })}

      {placed.map((p, i) => {
        const c = colorOf(p);
        const boxH = ROW_H - 12;
        const fontSize = p.depth === 0 ? 12.5 : p.depth === 1 ? 11.5 : 10.5;
        // Cắt chữ theo bề rộng THẬT của hộp (ước ~0,54em/ký tự) + chừa chỗ cho
        // nhãn "tr.N" — nếu không, tiêu đề dài tràn ra ngoài khung.
        const reserve = p.node.page != null ? 34 : 0;
        const maxChars = Math.max(6, Math.floor((p.w - 20 - reserve) / (fontSize * 0.54)));
        const label =
          p.node.title.length > maxChars ? p.node.title.slice(0, maxChars - 1) + "…" : p.node.title;
        return (
          <g key={i} transform={`translate(${p.x}, ${p.y})`}>
            <rect
              width={p.w}
              height={boxH}
              rx={8}
              fill={p.depth === 0 ? c : "#ffffff"}
              stroke={c}
              strokeWidth={p.depth === 0 ? 0 : 1.4}
              strokeOpacity={p.depth === 2 ? 0.45 : 1}
            />
            <text
              x={10}
              y={boxH / 2 + 4}
              fontSize={fontSize}
              fontWeight={p.depth === 2 ? 500 : 700}
              fill={p.depth === 0 ? "#ffffff" : "#0f172a"}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              <title>{p.node.title}</title>
              {label}
            </text>
            {p.node.page != null && (
              <text
                x={p.w - 10}
                y={boxH / 2 + 4}
                textAnchor="end"
                fontSize={9}
                fontWeight={700}
                fill={c}
                fillOpacity={0.75}
                fontFamily="ui-monospace, monospace"
              >
                tr.{p.node.page}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function MindMapView({ root, title }: { root: MindNode; title: string }) {
  const [open, setOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  /**
   * Cổng render riêng gắn vào <body>.
   *
   * Không portal thẳng vào document.body: ở Next.js App Router chính <body> do
   * React quản lý, chèn node vào đó gây xung đột reconcile và xoá sạch DOM.
   * Tạo một div trung gian React không đụng tới thì an toàn.
   *
   * Cần portal vì popup nằm trong <aside z-40> của panel Tutor — aside tạo
   * ngăn xếp riêng nên z-[120] bên trong vẫn kẹt ở mức 40, thua header z-50,
   * khiến nút "Tải PNG"/"Đóng" bị header che và bấm không được.
   */
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("data-mindmap-portal", "");
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      el.remove();
    };
  }, []);

  /**
   * Mở popup thì đẩy thêm một mốc lịch sử, để nút Back của trình duyệt ĐÓNG
   * popup thay vì rời hẳn trang reader (trước đây Back nhảy về /my-courses,
   * mất luôn tài liệu đang đọc). Đóng bằng nút X thì tự lùi lại mốc đó.
   */
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ mindmap: true }, "");
    const onPop = () => setOpen(false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  const close = () => {
    if (window.history.state?.mindmap) window.history.back();
    else setOpen(false);
  };

  // Đang mở popup thì khoá cuộn nền cho khỏi trôi trang phía sau.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc cũng đóng — thói quen chung của mọi modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** Xuất PNG: serialize SVG -> vẽ lên canvas (x2 cho nét) -> tải về. */
  const downloadPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `so-do-tu-duy-${title.replace(/\.[^.]+$/, "")}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  };

  return (
    <>
      {/* Bản thu nhỏ trong panel — bấm để mở to */}
      <button
        onClick={() => setOpen(true)}
        title="Bấm để xem toàn màn hình"
        className="group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-2 transition-shadow hover:shadow-md dark:border-slate-700"
      >
        <div className="pointer-events-none overflow-hidden">
          <MindMapSvg root={root} />
        </div>
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors group-hover:bg-slate-900/40">
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-slate-800 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-3.5 w-3.5" />
            Xem toàn màn hình
          </span>
        </span>
      </button>

      {/* Popup toàn màn hình — xem ghi chú ở portalEl phía trên. */}
      {open && portalEl && createPortal(
        <div
          className="fixed inset-0 z-[120] flex flex-col bg-slate-900/80 backdrop-blur-sm"
          onClick={close}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 px-6 pb-3 pt-5">
            <p className="min-w-0 truncate text-sm font-bold text-white">Sơ đồ tư duy · {title}</p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadPng();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25"
              >
                <Download className="h-3.5 w-3.5" />
                Tải PNG
              </button>
              <button
                onClick={close}
                aria-label="Đóng sơ đồ"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            // pb-8 để cuộn hết vẫn còn khoảng thở dưới đáy; trước đây pt-0
            // khiến thẻ sơ đồ dính sát header, nhìn rất chật.
            className="min-h-0 flex-1 overflow-auto px-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-fit rounded-2xl bg-white p-8 shadow-2xl">
              <MindMapSvg root={root} svgRef={svgRef} />
            </div>
          </div>
        </div>,
        portalEl
      )}
    </>
  );
}
