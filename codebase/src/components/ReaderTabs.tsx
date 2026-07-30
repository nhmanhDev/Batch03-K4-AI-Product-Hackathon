"use client";

import React, { useEffect, useState } from "react";
import {
  BrainCircuit,
  CreditCard,
  NotebookPen,
  Sparkles,
  Send,
  Plus,
  X,
  Bot,
  Clock3,
  MessageSquarePlus
} from "lucide-react";

interface ReaderTabsProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "mindmap" | "flashcards" | "notes" | "tutor";
  currentPage?: number;
  totalPages?: number;
  materialTitle?: string;
  /** Deck có corpus thật (xem src/data/). Không có = tài liệu này chưa có học liệu thật, AI Tutor tắt. */
  deck?: "d1" | "d2";
}

function buildGreeting(
  materialTitle: string,
  currentPage: number,
  totalPages: number,
  deck?: "d1" | "d2"
) {
  return deck
    ? `Xin chào! Mình là AI Tutor VLearn. Bạn đang xem tài liệu "${materialTitle}" (Trang ${currentPage}/${totalPages}). Bạn có thắc mắc gì cần giải đáp không?`
    : `Tài liệu "${materialTitle}" chưa có học liệu thật trong bản demo này — AI Tutor hiện chỉ ground được vào Day 01 và Day 02. Bạn thử chuyển sang một trong hai tài liệu đó nhé.`;
}

export function ReaderTabs({
  isOpen,
  onClose,
  initialTab = "tutor",
  currentPage = 1,
  totalPages = 29,
  materialTitle = "d1-slide-hackathon.pdf",
  deck
}: ReaderTabsProps) {
  const [activeTab, setActiveTab] = useState<"mindmap" | "flashcards" | "notes" | "tutor">(initialTab);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    sender: "ai" | "user";
    text: string;
    badge?: string;
    citation?: string;
    meta?: string;
  }>>([
    { sender: "ai", text: buildGreeting(materialTitle, currentPage, totalPages, deck) }
  ]);

  // Đổi tài liệu (đổi materialTitle/deck) -> reset hội thoại, lời chào phải
  // khớp tài liệu đang xem. Không reset khi chỉ đổi trang (currentPage).
  useEffect(() => {
    setChatMessages([
      { sender: "ai", text: buildGreeting(materialTitle, currentPage, totalPages, deck) }
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialTitle, deck]);
  const [notes, setNotes] = useState([
    { id: "1", page: currentPage, text: "Ghi chú: Cần ôn lại các khái niệm LLM Foundations ở slide Day 01.", time: "10:24 AM" }
  ]);
  const [newNoteText, setNewNoteText] = useState("");

  /**
   * Gọi /api/tutor — quyết định trung tâm của lát cắt nằm ở đó (spec.md §4):
   * AI tự quyết có căn cứ ở phạm vi nào (trang đang mở / cả bộ) và đủ chưa.
   * Không còn so khớp từ khoá ở client.
   */
  const handleSendAiMessage = async (textToSend?: string) => {
    const query = textToSend || aiPrompt;
    if (!query.trim() || isThinking) return;

    setChatMessages(prev => [...prev, { sender: "user", text: query }]);
    if (!textToSend) setAiPrompt("");

    if (!deck) {
      setChatMessages(prev => [...prev, {
        sender: "ai",
        badge: "⚠️ CHƯA CÓ HỌC LIỆU THẬT",
        text: "Tài liệu này chưa có corpus thật để AI ground vào trong bản demo — chuyển sang Day 01 hoặc Day 02 để hỏi AI Tutor.",
      }]);
      return;
    }

    setIsThinking(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, currentPage, deck }),
      });
      const d = await res.json();

      if (!res.ok) {
        setChatMessages(prev => [...prev, {
          sender: "ai",
          badge: res.status === 429 ? "⏳ HỎI HƠI NHANH" : "🔌 LỖI GỌI AI",
          text: `${d.error ?? "Không gọi được model."}${
            d.attempts?.length
              ? `\n\nĐã thử: ${d.attempts.map((a: { provider: string; error: string }) => `${a.provider} (${a.error})`).join(" → ")}`
              : ""
          }`,
        }]);
        return;
      }

      // Badge = quyết định phạm vi của AI, hiện TRƯỚC nội dung (HAX G2)
      const badge =
        d.scope === "out_of_scope"
          ? "⚠️ NGỮ CẢNH: NGOÀI PHẠM VI HỌC LIỆU"
          : !d.sufficient
            ? `⚠️ CHƯA ĐỦ CĂN CỨ${d.scope === "page" ? ` Ở TRANG ${currentPage}` : ""}`
            : d.scope === "deck"
              ? `📚 NGỮ CẢNH: CẢ BỘ SLIDE (${d._meta?.totalPages ?? totalPages} TRANG)`
              : `📌 NGỮ CẢNH: TRANG ${currentPage} / ${totalPages}`;

      const citation = d.citations?.length
        ? `[Trang ${d.citations.join(", ")} - ${materialTitle}]`
        : "[Không tìm thấy trích dẫn hợp lệ]";

      // Hiện dấu vết lời gọi thật: provider nào trả lời, có phải fallback, và
      // lớp chặn cứng ở server có kích hoạt hay không.
      const guard = [
        d._guardrail?.dropped?.length ? `bỏ ${d._guardrail.dropped.length} trích dẫn không hợp lệ` : null,
        d._guardrail2 ? "chặn câu đòi học viên tự cung cấp nội dung" : null,
      ].filter(Boolean);

      setChatMessages(prev => [...prev, {
        sender: "ai",
        badge,
        text: d.sufficient ? d.answer : d.missing || d.answer,
        citation,
        meta: [
          `${d._meta?.provider}/${d._meta?.model}`,
          `${d._meta?.latencyMs}ms`,
          d._meta?.fellBackFrom?.length ? `fallback từ ${d._meta.fellBackFrom.join(",")}` : null,
          guard.length ? `guardrail: ${guard.join(" · ")}` : null,
        ].filter(Boolean).join(" · "),
      }]);
    } catch (e) {
      setChatMessages(prev => [...prev, {
        sender: "ai",
        badge: "🔌 LỖI MẠNG",
        text: (e as Error).message,
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    setNotes(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        page: currentPage,
        text: newNoteText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setNewNoteText("");
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed bottom-0 right-0 top-16 z-40 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl transition-all sm:w-[420px] xl:static xl:h-full xl:w-[420px] xl:shrink-0 xl:shadow-none dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#155493] dark:bg-sky-950/70 dark:text-sky-300">
            <Bot className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">VLearn Tutor</p>
            <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Trợ lý học theo ngữ cảnh
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Lịch sử trò chuyện">
            <Clock3 className="h-4 w-4" />
          </button>
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Cuộc trò chuyện mới">
            <MessageSquarePlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="Đóng VLearn Tutor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="shrink-0 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("tutor")}
            className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all ${
              activeTab === "tutor"
                ? "bg-white text-[#124f8c] shadow-sm dark:bg-slate-700 dark:text-sky-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Tutor
          </button>
          <button
            onClick={() => setActiveTab("mindmap")}
            className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all ${
              activeTab === "mindmap"
                ? "bg-white text-[#124f8c] shadow-sm dark:bg-slate-700 dark:text-sky-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            Sơ đồ
          </button>
          <button
            onClick={() => setActiveTab("flashcards")}
            className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all ${
              activeTab === "flashcards"
                ? "bg-white text-[#124f8c] shadow-sm dark:bg-slate-700 dark:text-sky-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Flashcard
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all ${
              activeTab === "notes"
                ? "bg-white text-[#124f8c] shadow-sm dark:bg-slate-700 dark:text-sky-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <NotebookPen className="h-3.5 w-3.5" />
            Ghi chú
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        {/* Tab 1: AI Tutor Chat */}
        {activeTab === "tutor" && (
          <div className="flex h-full flex-col justify-between space-y-4">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "ai" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#124f8c] text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[88%]">
                    {msg.badge && (
                      <span className="inline-block self-start rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-[#124f8c] dark:bg-sky-950 dark:text-sky-300">
                        {msg.badge}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-line ${
                        msg.sender === "user"
                          ? "bg-[#124f8c] font-medium text-white dark:bg-sky-500 dark:text-slate-950"
                          : "border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {msg.text}
                      {msg.citation && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                          {msg.citation}
                        </div>
                      )}
                      {msg.meta && (
                        <div className="mt-1 font-mono text-[9px] text-slate-400 dark:text-slate-500">
                          {msg.meta}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex gap-2.5 justify-start">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#124f8c] text-white">
                    <Bot className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                    Đang tra học liệu để kiểm có đủ căn cứ…
                  </div>
                </div>
              )}
            </div>

            {/* Quick suggested prompts */}
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-bold text-slate-400">Gợi ý thắc mắc mẫu (Lát cắt Demo):</p>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => handleSendAiMessage(`Tóm tắt nội dung slide trang ${currentPage} này`)}
                  className="rounded-lg border border-sky-200 bg-sky-50/70 px-2.5 py-1.5 text-left text-[11px] font-semibold text-[#124f8c] transition-colors hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
                >
                  📌 <strong>[Trang đang xem]</strong> Tóm tắt slide trang {currentPage} này
                </button>
                <button
                  onClick={() => handleSendAiMessage(`Tóm tắt toàn bộ tài liệu này (${totalPages} trang)`)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  📚 <strong>[Cả bộ slide]</strong> Tóm tắt toàn bộ tài liệu này ({totalPages} trang)
                </button>
                <button
                  onClick={() => handleSendAiMessage("Cho mình xin đáp án bài tập về nhà buổi này")}
                  className="rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1.5 text-left text-[11px] font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
                >
                  ⚠️ <strong>[Thiếu căn cứ]</strong> Hỏi đáp án bài tập về nhà
                </button>
              </div>
            </div>

            {/* Chat Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Đặt câu hỏi cho AI Tutor VLearn..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendAiMessage()}
                disabled={isThinking}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:border-[#124f8c] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={() => handleSendAiMessage()}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[#124f8c] text-white hover:bg-[#0b355f] dark:bg-sky-500 dark:text-slate-950"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Mindmap Sơ đồ tư duy */}
        {activeTab === "mindmap" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Sơ đồ tư duy học liệu ({materialTitle})
            </h3>
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                <span className="font-bold text-[#124f8c] dark:text-sky-400 text-xs">📌 1. LLM Foundations</span>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  Next Token Prediction, Auto-regressive Models, Tokenization.
                </p>
              </div>
              <div className="ml-4 border-l-2 border-[#124f8c]/30 pl-3 space-y-2">
                <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">🔹 2. Transformer Architecture</span>
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                    Encoder-Decoder, Positional Encoding, Multi-Head Attention.
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">🔹 3. Training Phases</span>
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                    Pre-training → SFT → RLHF Alignment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Flashcards */}
        {activeTab === "flashcards" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Thẻ ghi nhớ Flashcards (3 thẻ)
              </h3>
              <span className="text-[11px] font-semibold text-[#124f8c] dark:text-sky-400">
                Đã thuộc: 1/3
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center space-y-3 dark:border-slate-800 dark:bg-slate-800">
              <span className="inline-block rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#124f8c] dark:bg-sky-950 dark:text-sky-400">
                Câu hỏi 1 / 3
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                Self-Attention trong Transformer có công dụng chính là gì?
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Trả lời: Tính toán mức độ liên quan giữa tất cả các token trong cùng một câu văn bản.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Ghi chú */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Ghi chú cá nhân bài học
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Thêm ghi chú bài học..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#124f8c] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={handleAddNote}
                className="flex items-center gap-1 rounded-xl bg-[#124f8c] px-3 py-2 text-xs font-bold text-white hover:bg-[#0b355f] dark:bg-sky-500 dark:text-slate-950"
              >
                <Plus className="h-4 w-4" />
                Lưu
              </button>
            </div>

            <div className="space-y-2">
              {notes.map((n) => (
                <div key={n.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-[#124f8c] dark:text-sky-400">Trang {n.page}</span>
                    <span>{n.time}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 font-medium">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

