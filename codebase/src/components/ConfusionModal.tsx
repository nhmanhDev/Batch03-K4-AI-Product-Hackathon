"use client";

import React, { useState } from "react";
import { HelpCircle, Check, X } from "lucide-react";

interface ConfusionModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialTitle: string;
  currentPage: number;
}

export function ConfusionModal({
  isOpen,
  onClose,
  materialTitle,
  currentPage
}: ConfusionModalProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const topics = [
    "Cơ chế Self-Attention / Multi-Head Attention",
    "Công thức Scaled Dot-Product",
    "Quy trình Pre-training & Fine-tuning",
    "Mã nguồn Python / PyTorch ví dụ",
    "Khái niệm Next Token Prediction"
  ];

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedTopics([]);
      setFeedbackText("");
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Báo phần kiến thức mông lung
              </h3>
              <p className="text-[11px] text-slate-500">
                {materialTitle} · Trang {currentPage}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="my-8 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Đã ghi nhận phản hồi!
            </h4>
            <p className="text-xs text-slate-500">
              VLearn AI Tutor sẽ điều chỉnh nội dung gợi ý luyện tập định hướng cho bạn.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Bạn đang chưa hiểu rõ phần kiến thức nào ở slide này?
            </p>

            <div className="space-y-2">
              {topics.map((t, idx) => {
                const isSelected = selectedTopics.includes(t);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleTopic(t)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-[#124f8c] bg-sky-50/60 text-[#124f8c] dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-400"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <span>{t}</span>
                    {isSelected && <Check className="h-4 w-4 text-[#124f8c] dark:text-sky-400" />}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Ghi chú thêm thắc mắc (Tùy chọn):
              </label>
              <textarea
                rows={2}
                spellCheck={false}
                placeholder="Nhập câu hỏi hoặc phần cụ thể bạn muốn giảng chi tiết hơn..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-[#124f8c] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-xl bg-[#124f8c] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0b355f] dark:bg-sky-500 dark:text-slate-950"
              >
                Gửi phản hồi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
