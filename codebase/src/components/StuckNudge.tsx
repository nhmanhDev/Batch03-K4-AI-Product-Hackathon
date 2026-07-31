"use client";

import React, { useEffect, useRef, useState } from "react";
import { Lightbulb, X } from "lucide-react";

/**
 * Nhắc nhẹ khi học viên dừng quá lâu ở một trang mà không hỏi gì.
 *
 * Đây là tín hiệu "có thể đang mắc" rẻ nhất đo được ở client: cùng một trang,
 * không thao tác gì trong N giây. Cố ý giữ ở mức GỢI Ý, không tự động hỏi AI
 * thay học viên — tự ý gửi câu hỏi là đoán bừa ý định, và tốn lượt gọi model.
 *
 * Quy tắc chống phiền:
 *  - mỗi trang chỉ nhắc MỘT lần trong cả phiên
 *  - mọi thao tác thật (cuộn, gõ, bấm, hỏi AI) đều reset đồng hồ
 *  - bấm "Không sao" thì im hẳn cho tới khi đổi trang
 */
interface StuckNudgeProps {
  page: number;
  /** Reset đồng hồ khi giá trị này đổi — dùng cho các thao tác ngoài component. */
  activityToken?: number;
  /** Học viên bấm "Giải quyết vấn đề" -> mở Tutor và hỏi hộ về trang này. */
  onAskHelp: (page: number) => void;
  /** Số giây đứng yên trước khi nhắc. */
  idleSeconds?: number;
}

export function StuckNudge({
  page,
  activityToken = 0,
  onAskHelp,
  idleSeconds = 75,
}: StuckNudgeProps) {
  const [visible, setVisible] = useState(false);
  const shownForRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Đổi trang -> ẩn nhắc cũ, bắt đầu đếm lại cho trang mới.
    setVisible(false);
    if (shownForRef.current.has(page)) return;

    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!shownForRef.current.has(page)) {
          shownForRef.current.add(page);
          setVisible(true);
        }
      }, idleSeconds * 1000);
    };

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "wheel",
      "touchstart",
    ];
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [page, activityToken, idleSeconds]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed bottom-5 right-5 z-[90] w-80 rounded-2xl border border-amber-200 bg-white p-4 shadow-2xl dark:border-amber-900 dark:bg-slate-900"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <Lightbulb className="h-4 w-4" />
          </span>
          <p className="text-xs font-extrabold text-slate-900 dark:text-white">VLearn Tutor</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          aria-label="Đóng gợi ý"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        Mình thấy bạn đang ở <strong className="font-bold">trang {page}</strong> khá lâu rồi. Có
        chỗ nào trong trang này khó hiểu không?
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setVisible(false);
            onAskHelp(page);
          }}
          className="flex-1 rounded-xl bg-[#124f8c] px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-[#0b355f] dark:bg-sky-500 dark:text-slate-950"
        >
          Giải quyết vấn đề
        </button>
        <button
          onClick={() => setVisible(false)}
          className="rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Không sao
        </button>
      </div>
    </div>
  );
}
