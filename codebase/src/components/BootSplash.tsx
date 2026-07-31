"use client";

import React, { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";

/**
 * Màn hình khởi động của reader.
 *
 * Khác `loading.tsx`: file đó là loading UI của Next.js, chỉ hiện trong lúc
 * server render route — F5 khi build đã cache thì server trả gần như tức thì
 * nên gần như không kịp thấy. Component này render ngay trong HTML đầu tiên
 * (state khởi tạo = hiện) nên xuất hiện ở MỌI lần tải, kể cả F5, và giữ đủ lâu
 * để người xem kịp nhận diện thương hiệu trước khi vào bài.
 */
export function BootSplash({ minDurationMs = 1600 }: { minDurationMs?: number }) {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

  useEffect(() => {
    const fadeAt = setTimeout(() => setPhase("fading"), minDurationMs);
    const goneAt = setTimeout(() => setPhase("gone"), minDurationMs + 450);
    return () => {
      clearTimeout(fadeAt);
      clearTimeout(goneAt);
    };
  }, [minDurationMs]);

  if (phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-white transition-opacity duration-[450ms] dark:bg-slate-950 ${
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-[#155493]/20" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          <BrandMark className="h-10 w-10" />
        </span>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-base font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          VLearn · Trợ lý học theo ngữ cảnh
        </p>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
          Đang chuẩn bị học liệu và AI Tutor…
        </p>
      </div>

      {/* Thanh tiến trình chạy theo đúng thời lượng splash. */}
      <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-[#155493] dark:bg-sky-500"
          style={{ animation: `bootbar ${minDurationMs}ms ease-out forwards` }}
        />
      </div>

      <style>{`@keyframes bootbar { from { width: 8% } to { width: 100% } }`}</style>
    </div>
  );
}
