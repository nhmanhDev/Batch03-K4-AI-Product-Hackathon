"use client";

import React, { useEffect, useRef, useState } from "react";
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
  MessageSquarePlus,
  ChevronsLeft,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  CalendarDays,
  Clock
} from "lucide-react";
import { MindMapView, type MindNode } from "@/components/MindMapView";
import type { StudyNote } from "@/types/vlearn";

interface ReaderTabsProps {
  isOpen: boolean;
  onClose: () => void;
  /** Mở lại từ dải thu gọn. Không truyền thì dải thu gọn không hiện (giữ hành vi cũ). */
  onOpen?: () => void;
  initialTab?: "mindmap" | "flashcards" | "notes" | "tutor";
  currentPage?: number;
  totalPages?: number;
  materialTitle?: string;
  /** Deck có corpus thật (xem src/data/). Không có = tài liệu này chưa có học liệu thật, AI Tutor tắt. */
  deck?: "d1" | "d2" | "rag1" | "rag2" | "rag3" | "rag4" | "rag5" | "law";
  /** Đoạn học viên vừa bôi đen trên slide (PDFViewerCanvas) — tự gửi thành câu hỏi. */
  highlightedText?: string | null;
  /** Gọi lại sau khi đã tiêu thụ highlightedText, để tránh gửi lặp lại khi re-render. */
  onHighlightConsumed?: () => void;
  /** Câu hỏi do popup nhắc "đứng lâu ở trang" sinh ra — tự gửi khi có giá trị. */
  pendingQuestion?: string | null;
  onPendingQuestionSent?: () => void;
  /** Kho ghi chú cá nhân dùng CHUNG với note viết ở lề slide (PDFViewerCanvas). */
  notes?: StudyNote[];
  onAddNote?: (n: { page: number; quote?: string; text: string }) => void;
  onRemoveNote?: (id: string) => void;
}

function buildGreeting(
  materialTitle: string,
  currentPage: number,
  totalPages: number,
  deck?: "d1" | "d2" | "rag1" | "rag2" | "rag3" | "rag4" | "rag5" | "law"
) {
  return deck
    ? `Xin chào! Mình là AI Tutor VLearn. Bạn đang xem tài liệu "${materialTitle}" (Trang ${currentPage}/${totalPages}). Bạn có thắc mắc gì cần giải đáp không?`
    : `Tài liệu "${materialTitle}" chưa có học liệu thật trong bản demo này — AI Tutor hiện chỉ ground được vào Day 01 và Day 02. Bạn thử chuyển sang một trong hai tài liệu đó nhé.`;
}

export function ReaderTabs({
  isOpen,
  onClose,
  onOpen,
  initialTab = "tutor",
  currentPage = 1,
  totalPages = 29,
  materialTitle = "d1-slide-hackathon.pdf",
  deck,
  highlightedText,
  onHighlightConsumed,
  pendingQuestion,
  onPendingQuestionSent,
  notes = [],
  onAddNote,
  onRemoveNote
}: ReaderTabsProps) {
  const [activeTab, setActiveTab] = useState<"mindmap" | "flashcards" | "notes" | "tutor">(initialTab);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  type ChatMessage = {
    sender: "ai" | "user";
    text: string;
    badge?: string;
    citation?: string;
    meta?: string;
  };
  /**
   * Nhiều cuộc trò chuyện SONG SONG, mỗi cuộc là một mục độc lập trong danh
   * sách; `activeId` chỉ ra cuộc đang hiển thị. Mở một cuộc cũ chỉ là đổi
   * activeId — không gộp, không xoá cuộc nào, nên hội thoại không lẫn vào nhau.
   *
   * Lưu bằng sessionStorage (không phải localStorage): hội thoại thuộc về phiên
   * học, đóng tab là hết — đúng với việc bản demo chưa có backend, và không để
   * lại dấu vết lâu dài trên máy dùng chung.
   */
  type Convo = { id: string; title: string; at: string; messages: ChatMessage[] };
  const convosKey = `vlearn_convos_${deck ?? "none"}`;

  const newConvo = (): Convo => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "Cuộc trò chuyện mới",
    at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    messages: [{ sender: "ai", text: buildGreeting(materialTitle, currentPage, totalPages, deck) }],
  });

  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);

  // Đổi tài liệu -> nạp đúng bộ hội thoại của tài liệu đó (mỗi deck một kho).
  useEffect(() => {
    let list: Convo[] = [];
    try {
      const raw = sessionStorage.getItem(convosKey);
      const parsed = raw ? (JSON.parse(raw) as Convo[]) : [];
      if (Array.isArray(parsed)) list = parsed.filter((c) => c?.id && Array.isArray(c.messages));
    } catch {
      // sessionStorage bị chặn (chế độ riêng tư) -> chạy không lưu.
    }
    if (!list.length) list = [newConvo()];
    setConvos(list);
    setActiveId(list[0].id);
    setShowHistory(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convosKey]);

  const persistConvos = (list: Convo[]) => {
    setConvos(list);
    try {
      sessionStorage.setItem(convosKey, JSON.stringify(list));
    } catch {
      // Vượt hạn mức hoặc bị chặn -> bỏ qua, không làm hỏng luồng chat.
    }
  };

  const active = convos.find((c) => c.id === activeId);
  const chatMessages = active?.messages ?? [];

  /** Ghi tin nhắn vào ĐÚNG cuộc đang mở; tiêu đề lấy từ câu hỏi đầu tiên. */
  const setChatMessages = (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setConvos((prev) => {
      const next = prev.map((c) => {
        if (c.id !== activeId) return c;
        const messages = typeof updater === "function" ? updater(c.messages) : updater;
        const firstAsk = messages.find((m) => m.sender === "user")?.text;
        return {
          ...c,
          messages,
          title: firstAsk
            ? firstAsk.length > 60
              ? firstAsk.slice(0, 58) + "…"
              : firstAsk
            : "Cuộc trò chuyện mới",
        };
      });
      try {
        sessionStorage.setItem(convosKey, JSON.stringify(next));
      } catch {
        // bỏ qua
      }
      return next;
    });
  };

  const startNewConversation = () => {
    const c = newConvo();
    persistConvos([c, ...convos].slice(0, 20));
    setActiveId(c.id);
    setShowHistory(false);
    setActiveTab("tutor");
  };

  /** Mở cuộc cũ = chỉ đổi cuộc đang hiển thị. Không đụng vào cuộc nào cả. */
  const openConversation = (id: string) => {
    setActiveId(id);
    setShowHistory(false);
    setActiveTab("tutor");
  };

  const deleteConversation = (id: string) => {
    const rest = convos.filter((c) => c.id !== id);
    const list = rest.length ? rest : [newConvo()];
    persistConvos(list);
    if (id === activeId) setActiveId(list[0].id);
  };
  const [newNoteText, setNewNoteText] = useState("");

  // ---- Kế hoạch học tập sinh thật từ /api/study-plan ----
  type Session = { day: number; title: string; pages: number[]; activity: string; minutes: number };
  type Plan = { goal: string; sessions: Session[]; note: string };
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planMeta, setPlanMeta] = useState<string>("");
  const [planDays, setPlanDays] = useState(3);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const generatePlan = async (days: number) => {
    if (!deck || planLoading) return;
    setPlanLoading(true);
    setPlanError(null);
    setPlanDays(days);
    try {
      const res = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck, days }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Không lập được kế hoạch.");
      setPlan({ goal: d.goal, sessions: d.sessions || [], note: d.note });
      setPlanMeta(metaLine(d._meta || {}));
    } catch (e) {
      setPlanError((e as Error).message);
    } finally {
      setPlanLoading(false);
    }
  };

  /** Kế hoạch -> văn bản gọn để gửi Telegram. Người dùng đọc bản này trước khi gửi. */
  const planAsText = (p: Plan) =>
    [
      `Kế hoạch học: ${materialTitle}`,
      `Mục tiêu: ${p.goal}`,
      "",
      ...p.sessions.map(
        (s) =>
          `Buổi ${s.day} — ${s.title} (${s.minutes} phút)\n  Trang: ${s.pages.join(", ")}\n  Cách học: ${s.activity}`
      ),
      "",
      p.note,
    ].join("\n");

  // ---- Gửi qua Telegram: AI chỉ soạn nháp, học viên xác nhận mới gửi ----
  const [teleDraft, setTeleDraft] = useState<{ text: string; source: string } | null>(null);
  const [teleState, setTeleState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [teleError, setTeleError] = useState("");

  const sendTelegram = async () => {
    if (!teleDraft || teleState === "sending") return;
    setTeleState("sending");
    setTeleError("");
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teleDraft),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Không gửi được.");
      setTeleState("sent");
      setTimeout(() => {
        setTeleDraft(null);
        setTeleState("idle");
      }, 1400);
    } catch (e) {
      setTeleState("error");
      setTeleError((e as Error).message);
    }
  };

  // ---- Flashcard sinh thật từ /api/flashcards ----
  type Card = { front: string; options: string[]; correctIndex: number; back: string; page: number };
  const [cards, setCards] = useState<Card[] | null>(null);
  const [cardsMeta, setCardsMeta] = useState<{ note?: string; meta?: string } | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  // Đáp án học viên đã chọn cho từng thẻ — chọn rồi mới lộ đáp án đúng.
  const [answers, setAnswers] = useState<Record<number, number>>({});
  // Phạm vi của bộ thẻ ĐANG hiển thị — để tô đúng nút nào đang được chọn.
  const [cardsScope, setCardsScope] = useState<"page" | "deck" | null>(null);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);

  // ---- Sơ đồ tư duy sinh thật từ /api/mindmap ----
  const [mindmap, setMindmap] = useState<MindNode | null>(null);
  const [mindmapMeta, setMindmapMeta] = useState<{ note?: string; meta?: string } | null>(null);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [mindmapError, setMindmapError] = useState<string | null>(null);

  // Đổi tài liệu -> bỏ kết quả cũ, tránh hiện sơ đồ/thẻ của tài liệu trước.
  useEffect(() => {
    setCards(null);
    setCardsMeta(null);
    setCardsError(null);
    setCardsScope(null);
    setCardIndex(0);
    setAnswers({});
    setPlan(null);
    setPlanError(null);
    setMindmap(null);
    setMindmapMeta(null);
    setMindmapError(null);
  }, [materialTitle, deck]);

  const metaLine = (m: { provider?: string; model?: string; latencyMs?: number; droppedCount?: number }) =>
    [
      m.provider && m.model ? `${m.provider}/${m.model}` : null,
      m.latencyMs ? `${m.latencyMs}ms` : null,
      m.droppedCount ? `bỏ ${m.droppedCount} mục không đủ căn cứ` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  const generateCards = async (scope: "page" | "deck") => {
    if (!deck || cardsLoading) return;
    setCardsLoading(true);
    setCardsError(null);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck, scope, currentPage }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Không tạo được thẻ.");
      setCards(d.cards || []);
      setCardsMeta({ note: d.note, meta: metaLine(d._meta || {}) });
      setCardsScope(scope);
      setCardIndex(0);
      setAnswers({});
    } catch (e) {
      setCardsError((e as Error).message);
    } finally {
      setCardsLoading(false);
    }
  };

  const generateMindmap = async () => {
    if (!deck || mindmapLoading) return;
    setMindmapLoading(true);
    setMindmapError(null);
    try {
      const res = await fetch("/api/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Không dựng được sơ đồ.");
      setMindmap(d.root || null);
      setMindmapMeta({ note: d.note, meta: metaLine(d._meta || {}) });
    } catch (e) {
      setMindmapError((e as Error).message);
    } finally {
      setMindmapLoading(false);
    }
  };

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
      // Gửi kèm vài lượt gần nhất để AI nối được mạch ("còn cái kia thì sao?").
      // Bỏ lời chào mở đầu vì nó không mang thông tin hội thoại.
      const history = chatMessages
        .filter((m) => !(m.sender === "ai" && m.text.startsWith("Xin chào!")))
        .slice(-6)
        .map((m) => ({ role: m.sender === "user" ? "user" : "ai", text: m.text }));

      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, currentPage, deck, history }),
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
      // Trang được hỏi có thể khác trang đang mở ("tóm tắt trang 5" khi đang ở
      // trang 1) — badge phải nói đúng trang AI dựa vào, không phải trang đang xem.
      const answeredPage = d.targetPage || currentPage;
      const badge =
        d.scope === "out_of_scope"
          ? "⚠️ NGỮ CẢNH: NGOÀI PHẠM VI HỌC LIỆU"
          : !d.sufficient
            ? `⚠️ CHƯA ĐỦ CĂN CỨ${d.scope === "page" ? ` Ở TRANG ${answeredPage}` : ""}`
            : d.scope === "deck"
              ? `📚 NGỮ CẢNH: CẢ BỘ SLIDE (${d._meta?.totalPages ?? totalPages} TRANG)`
              : `📌 NGỮ CẢNH: TRANG ${answeredPage} / ${totalPages}`;

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

  // Học viên bôi đen một đoạn trên slide -> tự mở tab Tutor + gửi câu hỏi.
  // Đúng bằng chứng CP1: bôi đen giảm lỗi 10 lần so với gõ tự do (2,0% vs 21,1%).
  useEffect(() => {
    if (!highlightedText) return;
    setActiveTab("tutor");
    handleSendAiMessage(`Giải thích đoạn được bôi đen: "${highlightedText}"`);
    onHighlightConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedText]);

  // Câu hỏi từ popup nhắc "đứng lâu ở trang" — đi cùng đường với bôi đen.
  useEffect(() => {
    if (!pendingQuestion) return;
    setActiveTab("tutor");
    handleSendAiMessage(pendingQuestion);
    onPendingQuestionSent?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion]);

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    // Ghi vào kho chung -> note hiện luôn ở lề trang tương ứng bên slide.
    onAddNote?.({ page: currentPage, text: newNoteText.trim() });
    setNewNoteText("");
  };

  if (!isOpen && !onOpen) return null;

  return (
    // 1 aside duy nhất, animate width mượt giữa rail (w-14) và panel (420px) —
    // trước đây early-return swap 2 khối DOM riêng nên đổi trạng thái bị giật.
    <aside
      className={`fixed bottom-0 right-0 top-16 z-40 flex flex-col overflow-hidden bg-white transition-all duration-300 ease-in-out xl:static xl:h-full xl:shrink-0 dark:bg-slate-950 ${
        isOpen
          ? "w-full border-l border-slate-200 shadow-2xl sm:w-[420px] xl:w-[420px] xl:shadow-none dark:border-slate-800"
          : "w-0 xl:w-14 xl:border-l xl:border-slate-200 dark:xl:border-slate-800"
      }`}
    >
      {/* Rail đóng — luôn render (desktop), crossfade với panel đầy đủ. */}
      {onOpen && (
        <button
          onClick={onOpen}
          title="Mở VLearn Tutor"
          className={`absolute inset-y-0 right-0 hidden w-14 flex-col items-center gap-3 py-4 transition-opacity duration-200 hover:bg-slate-50 xl:flex dark:hover:bg-slate-900 ${
            isOpen ? "pointer-events-none opacity-0" : "opacity-100 delay-150"
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400">
            <ChevronsLeft className="h-4 w-4" />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#155493] dark:bg-sky-950/70 dark:text-sky-300">
            <Bot className="h-4 w-4" />
          </span>
          <span
            className="mt-1 text-[10px] font-bold tracking-wide text-slate-400 dark:text-slate-500"
            style={{ writingMode: "vertical-rl" }}
          >
            VLearn Tutor
          </span>
        </button>
      )}

      {/* Panel đầy đủ — fade out trong lúc khung co về rail, fade in khi mở. */}
      <div
        className={`flex h-full w-full shrink-0 flex-col transition-opacity duration-200 sm:w-[420px] ${
          isOpen ? "opacity-100 delay-100" : "pointer-events-none opacity-0"
        }`}
      >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#155493] dark:bg-sky-950/70 dark:text-sky-300">
            <Bot className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">VLearn Tutor</p>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Trợ lý học theo ngữ cảnh
            </p>
          </div>
        </div>
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            title="Lịch sử trò chuyện"
            aria-label="Lịch sử trò chuyện"
            aria-expanded={showHistory}
            className={`relative flex h-8 w-8 items-center justify-center rounded-xl border transition-colors ${
              showHistory
                ? "border-[#124f8c] bg-sky-50 text-[#124f8c] dark:border-sky-600 dark:bg-sky-950 dark:text-sky-300"
                : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            }`}
          >
            <Clock3 className="h-4 w-4" />
            {convos.length > 1 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#124f8c] px-1 text-[9px] font-bold text-white dark:bg-sky-500 dark:text-slate-950">
                {convos.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={startNewConversation}
            title="Cuộc trò chuyện mới"
            aria-label="Cuộc trò chuyện mới"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
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

          {/* Danh sách hội thoại đã lưu trong phiên */}
          {showHistory && (
            <div className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                  Lịch sử trò chuyện
                </p>
                <p className="text-[10px] text-slate-400">
                  {convos.length} cuộc · lưu trong phiên, đóng tab là hết
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {convos.map((c) => {
                  const isActive = c.id === activeId;
                  const asked = c.messages.filter((m) => m.sender === "user").length;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-start gap-2 border-b border-slate-50 px-3 py-2 last:border-0 dark:border-slate-800 ${
                        isActive
                          ? "bg-sky-50 dark:bg-sky-950/40"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <button onClick={() => openConversation(c.id)} className="min-w-0 flex-1 text-left">
                        <p
                          className={`truncate text-[11px] font-semibold ${
                            isActive
                              ? "text-[#124f8c] dark:text-sky-300"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {c.title}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {asked ? `${asked} câu hỏi` : "Chưa hỏi gì"} · {c.at}
                          {isActive && " · đang mở"}
                        </p>
                      </button>
                      <button
                        onClick={() => deleteConversation(c.id)}
                        title="Xoá cuộc trò chuyện"
                        className="mt-0.5 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
        <div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
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
                      {/* Chỉ câu trả lời của AI mới có nút gửi. AI KHÔNG tự gửi —
                          bấm vào đây chỉ mở hộp xác nhận, học viên đọc rồi mới chốt. */}
                      {msg.sender === "ai" && msg.citation && (
                        <button
                          onClick={() =>
                            setTeleDraft({
                              text: msg.text,
                              source: `${materialTitle}${msg.citation ? ` · ${msg.citation}` : ""}`,
                            })
                          }
                          className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400 transition-colors hover:text-[#124f8c] dark:hover:text-sky-400"
                        >
                          <Send className="h-3 w-3" />
                          Gửi qua Telegram
                        </button>
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

            {/* Chat Input */}
            <div className="relative">
              <input
                type="text"
                spellCheck={false}
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

        {/* Tab 2: Sơ đồ tư duy — sinh thật từ /api/mindmap, mỗi nhánh cite trang */}
        {activeTab === "mindmap" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="min-w-0 truncate text-xs font-bold text-slate-900 dark:text-white">
                Sơ đồ tư duy · {materialTitle}
              </h3>
              {mindmap && (
                <button
                  onClick={generateMindmap}
                  disabled={mindmapLoading}
                  className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-[#124f8c] hover:bg-sky-50 disabled:opacity-50 dark:text-sky-400 dark:hover:bg-sky-950/50"
                >
                  <RefreshCw className={`h-3 w-3 ${mindmapLoading ? "animate-spin" : ""}`} />
                  Tạo lại
                </button>
              )}
            </div>

            {!deck && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                Tài liệu này chưa có học liệu thật trong bản demo nên chưa dựng được sơ đồ.
              </p>
            )}

            {deck && !mindmap && !mindmapLoading && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50">
                <BrainCircuit className="mx-auto h-8 w-8 text-[#124f8c] dark:text-sky-400" />
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  Dựng sơ đồ tư duy cho toàn bộ {totalPages} trang của tài liệu này. Mỗi nhánh đều
                  kèm số trang để bạn kiểm chứng lại được.
                </p>
                <button
                  onClick={generateMindmap}
                  className="w-full rounded-xl bg-[#124f8c] px-3 py-2 text-xs font-bold text-white hover:bg-[#0b355f] dark:bg-sky-500 dark:text-slate-950"
                >
                  Tạo sơ đồ tư duy
                </button>
              </div>
            )}

            {mindmapLoading && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-6 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang đọc {totalPages} trang và dựng sơ đồ…
              </div>
            )}

            {mindmapError && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {mindmapError}
              </p>
            )}

            {mindmap && (
              <div className="space-y-2">
                <MindMapView root={mindmap} title={materialTitle} />
                {mindmapMeta?.note && (
                  <p className="text-[11px] italic text-slate-500 dark:text-slate-400">
                    {mindmapMeta.note}
                  </p>
                )}
                {mindmapMeta?.meta && (
                  <p className="text-[10px] font-mono text-slate-400">{mindmapMeta.meta}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Flashcards — sinh thật từ /api/flashcards, mỗi thẻ cite trang */}
        {activeTab === "flashcards" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="min-w-0 truncate text-xs font-bold text-slate-900 dark:text-white">
                Thẻ ghi nhớ{cards?.length ? ` · ${cards.length} thẻ` : ""}
              </h3>
              {!!cards?.length && (
                <span className="shrink-0 text-[11px] font-semibold text-[#124f8c] dark:text-sky-400">
                  {cardIndex + 1} / {cards.length}
                </span>
              )}
            </div>

            {!deck && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                Tài liệu này chưa có học liệu thật trong bản demo nên chưa tạo được thẻ.
              </p>
            )}

            {/* Hai phạm vi tạo thẻ — đúng ý: cả bộ thì nhiều thẻ, 1 trang thì vài thẻ */}
            {deck && (() => {
              // Nút nào ứng với bộ thẻ ĐANG hiển thị thì tô đậm — trước đây
              // "Cả bộ" luôn xanh nên bấm "Trang N" xong không thấy gì đổi.
              const scopeBtn = (active: boolean) =>
                `rounded-xl px-2 py-2 text-[11px] font-bold transition-colors disabled:opacity-50 ${
                  active
                    ? "bg-[#124f8c] text-white hover:bg-[#0b355f] dark:bg-sky-500 dark:text-slate-950"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`;
              return (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => generateCards("deck")}
                    disabled={cardsLoading}
                    aria-pressed={cardsScope === "deck"}
                    className={scopeBtn(cardsScope === "deck")}
                  >
                    Cả bộ ({totalPages} trang) · 10 thẻ
                  </button>
                  <button
                    onClick={() => generateCards("page")}
                    disabled={cardsLoading}
                    aria-pressed={cardsScope === "page"}
                    className={scopeBtn(cardsScope === "page")}
                  >
                    Trang {currentPage} · 3 thẻ
                  </button>
                </div>
              );
            })()}

            {cardsLoading && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-6 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang đọc học liệu và soạn thẻ…
              </div>
            )}

            {cardsError && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {cardsError}
              </p>
            )}

            {cards && !cards.length && !cardsLoading && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                {cardsMeta?.note || "Chưa tạo được thẻ nào có căn cứ trong học liệu này."}
              </p>
            )}

            {!!cards?.length && (() => {
              const card = cards[cardIndex];
              const picked = answers[cardIndex];
              const answered = picked !== undefined;
              const correct = answered && picked === card.correctIndex;
              const doneCount = Object.keys(answers).length;
              const rightCount = Object.entries(answers).filter(
                ([i, a]) => cards[Number(i)]?.correctIndex === a
              ).length;

              return (
                <>
                  {doneCount > 0 && (
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Đã làm {doneCount}/{cards.length} · đúng {rightCount}
                    </p>
                  )}

                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                    <div className="flex items-center justify-center gap-2">
                      <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#124f8c] dark:bg-sky-950 dark:text-sky-400">
                        Câu {cardIndex + 1} / {cards.length}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                        tr.{card.page}
                      </span>
                    </div>

                    <p className="text-xs font-bold leading-relaxed text-slate-900 dark:text-white">
                      {card.front}
                    </p>

                    {/* Chọn xong mới lộ đáp án đúng — trước đó không gợi ý gì. */}
                    <div className="space-y-1.5">
                      {card.options.map((opt, i) => {
                        const isCorrect = i === card.correctIndex;
                        const isPicked = picked === i;
                        const style = !answered
                          ? "border-slate-200 bg-white hover:border-[#124f8c] hover:bg-sky-50/60 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                          : isCorrect
                            ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/50"
                            : isPicked
                              ? "border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950/50"
                              : "border-slate-200 bg-white opacity-60 dark:border-slate-700 dark:bg-slate-800";
                        return (
                          <button
                            key={i}
                            disabled={answered}
                            onClick={() => setAnswers((prev) => ({ ...prev, [cardIndex]: i }))}
                            className={`flex w-full items-start gap-2 rounded-xl border px-2.5 py-2 text-left text-[11px] font-medium leading-snug transition-colors ${style}`}
                          >
                            <span className="mt-px shrink-0 font-bold text-slate-400">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <span className="flex-1 text-slate-800 dark:text-slate-200">{opt}</span>
                            {answered && isCorrect && (
                              <Check className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {answered && isPicked && !isCorrect && (
                              <X className="mt-px h-3.5 w-3.5 shrink-0 text-red-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {answered && (
                      <div
                        className={`rounded-xl border p-2.5 text-left ${
                          correct
                            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                            : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
                        }`}
                      >
                        <p
                          className={`mb-1 text-[11px] font-bold ${
                            correct
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-amber-800 dark:text-amber-400"
                          }`}
                        >
                          {correct
                            ? "Chính xác!"
                            : `Chưa đúng — đáp án là ${String.fromCharCode(65 + card.correctIndex)}.`}
                        </p>
                        <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                          {card.back}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCardIndex((i) => Math.max(0, i - 1))}
                      disabled={cardIndex === 0}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Trước
                    </button>
                    <button
                      onClick={() => setCardIndex((i) => Math.min(cards.length - 1, i + 1))}
                      disabled={cardIndex >= cards.length - 1}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                    >
                      Sau
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {cardsMeta?.meta && (
                    <p className="text-[10px] font-mono text-slate-400">{cardsMeta.meta}</p>
                  )}
                </>
              );
            })()}
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
                spellCheck={false}
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

            {!notes.length && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] italic leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                Chưa có ghi chú nào. Gõ ở ô trên, hoặc bôi đen một đoạn trên slide rồi bấm “Ghi chú” —
                cả hai cách đều lưu vào chung một chỗ này.
              </p>
            )}

            <div className="space-y-2">
              {[...notes]
                .sort((a, b) => a.page - b.page)
                .map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-[#124f8c] dark:text-sky-400">
                        Trang {n.page}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{n.time}</span>
                        <button
                          onClick={() => onRemoveNote?.(n.id)}
                          title="Xoá ghi chú"
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {n.quote && (
                      <p className="mt-1 line-clamp-2 border-l-2 border-amber-300 pl-1.5 text-[10px] italic leading-snug text-slate-500 dark:text-slate-400">
                        “{n.quote}”
                      </p>
                    )}
                    <p className="mt-1 text-xs font-medium text-slate-800 dark:text-slate-200">
                      {n.text}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Hộp xác nhận gửi Telegram — hiện NGUYÊN VĂN nội dung sắp gửi để học
          viên đọc trước. AI không có đường nào tự bấm nút này. */}
      {teleDraft && (
        <div
          className="absolute inset-0 z-50 flex items-end bg-slate-900/50 backdrop-blur-[2px]"
          onClick={() => teleState !== "sending" && setTeleDraft(null)}
        >
          <div
            className="w-full rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-[#124f8c] dark:bg-sky-950 dark:text-sky-300">
                <Send className="h-3.5 w-3.5" />
              </span>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                Gửi nội dung này qua Telegram?
              </p>
            </div>

            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {teleDraft.source}
            </p>
            <p className="mb-3 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {teleDraft.text}
            </p>

            {teleState === "error" && (
              <p className="mb-2 rounded-lg bg-red-50 p-2 text-[11px] font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {teleError}
              </p>
            )}

            {teleState === "sent" ? (
              <p className="flex items-center gap-1.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                Đã gửi
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={sendTelegram}
                  disabled={teleState === "sending"}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#124f8c] px-3 py-2 text-xs font-bold text-white hover:bg-[#0b355f] disabled:opacity-60 dark:bg-sky-500 dark:text-slate-950"
                >
                  {teleState === "sending" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang gửi…
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Đồng ý gửi
                    </>
                  )}
                </button>
                <button
                  onClick={() => setTeleDraft(null)}
                  disabled={teleState === "sending"}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Huỷ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

