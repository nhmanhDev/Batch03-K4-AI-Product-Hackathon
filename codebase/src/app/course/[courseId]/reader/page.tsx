"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ReaderSidebar } from "@/components/ReaderSidebar";
import { ReaderToolbar, ReaderTool } from "@/components/ReaderToolbar";
import { PDFViewerCanvas, PEN_COLORS } from "@/components/PDFViewerCanvas";
import { ReaderTabs } from "@/components/ReaderTabs";
import { ConfusionModal } from "@/components/ConfusionModal";
import { BootSplash } from "@/components/BootSplash";
import { StuckNudge } from "@/components/StuckNudge";
import { DayCurriculum, MaterialItem, StudyNote } from "@/types/vlearn";

// Sample curriculum data based on VLearn API response for COMP2010
const SAMPLE_CURRICULUM: DayCurriculum[] = [
  {
    // Deck demo chính: slide PDF THẬT (pdf.js render nguyên file, không chuyển
    // HTML) — mô phỏng đúng luồng "giảng viên upload slide PDF lên VLearn".
    id: "Lecture_material_law_demo01",
    public_code: "DEMO",
    title: "Bài giảng demo: Chatbot tư vấn pháp luật (PDF thật)",
    status: "published",
    position: 0,
    material_count: 1,
    completed_material_count: 0,
    reading_completed: false,
    reading_progress_percent: 0,
    items: [
      {
        id: "material_law_demo01",
        public_code: "DEMO-S01",
        type: "pdf",
        title: "ChatbotAI - Law.pdf",
        status: "studying",
        lecture_id: "Lecture_material_law_demo01",
        position: 1,
        page_count: 20,
        file_name: "chatbot-law.pdf",
        deck: "law",
        pdf_url: "/slides/chatbot-law.pdf"
      }
    ]
  },
  {
    id: "Lecture_material_ms2044ey_k6uor3",
    public_code: "D01",
    title: "Day 01: Document-Level Knowledge Graph cho RAG",
    status: "published",
    position: 1,
    material_count: 1,
    completed_material_count: 0,
    reading_completed: false,
    reading_progress_percent: 0,
    items: [
      {
        id: "material_ms2044ey_k6uor3",
        public_code: "D01-S01",
        type: "pdf",
        title: "rag-01-document-level-knowledge-graph.pdf",
        status: "published",
        lecture_id: "Lecture_material_ms2044ey_k6uor3",
        position: 1,
        page_count: 9,
        file_name: "rag-01-document-level-knowledge-graph.pdf",
        deck: "rag1"
      }
    ]
  },
  {
    id: "Lecture_material_ms2lb2ke_c1je8j",
    public_code: "D02",
    title: "Day 02: Đánh giá RAG vs GraphRAG",
    status: "published",
    position: 2,
    material_count: 1,
    completed_material_count: 0,
    reading_completed: false,
    reading_progress_percent: 0,
    items: [
      {
        id: "material_ms2lb2ke_c1je8j",
        public_code: "D02-S01",
        type: "pdf",
        title: "rag-02-ragvsgraphrag-eval.pdf",
        status: "published",
        lecture_id: "Lecture_material_ms2lb2ke_c1je8j",
        position: 1,
        page_count: 20,
        file_name: "rag-02-ragvsgraphrag-eval.pdf",
        deck: "rag2"
      }
    ]
  },
  {
    id: "Lecture_material_ms204i6x_gqwyya",
    public_code: "D03",
    title: "Day 03: Reasoning & Agentic RAG",
    status: "published",
    position: 3,
    material_count: 1,
    completed_material_count: 0,
    reading_completed: false,
    reading_progress_percent: 0,
    items: [
      {
        id: "material_ms204i6x_gqwyya",
        public_code: "D03-S01",
        type: "pdf",
        title: "rag-03-reasoning-rag-survey.pdf",
        status: "published",
        lecture_id: "Lecture_material_ms204i6x_gqwyya",
        position: 1,
        page_count: 11,
        file_name: "rag-03-reasoning-rag-survey.pdf",
        deck: "rag3"
      }
    ]
  },
  {
    id: "Lecture_material_ms204v3b_r9mo78",
    public_code: "D04",
    title: "Day 04: Corrective RAG — Tự sửa lỗi truy xuất",
    status: "published",
    position: 4,
    material_count: 1,
    completed_material_count: 0,
    reading_completed: false,
    reading_progress_percent: 0,
    items: [
      {
        id: "material_ms204v3b_r9mo78",
        public_code: "D04-S01",
        type: "pdf",
        title: "rag-04-corrective-rag.pdf",
        status: "published",
        lecture_id: "Lecture_material_ms204v3b_r9mo78",
        position: 1,
        page_count: 16,
        file_name: "rag-04-corrective-rag.pdf",
        deck: "rag4"
      }
    ]
  },
  {
    id: "Lecture_material_ms5r18w1_oe5xlz",
    public_code: "D05",
    title: "Day 05: Self-RAG — Tự phản biện & Reflection",
    status: "published",
    position: 5,
    material_count: 1,
    completed_material_count: 0,
    reading_completed: false,
    reading_progress_percent: 0,
    items: [
      {
        id: "material_ms5r18w1_oe5xlz",
        public_code: "D05-S01",
        type: "pdf",
        title: "rag-05-self-rag.pdf",
        status: "published",
        lecture_id: "Lecture_material_ms5r18w1_oe5xlz",
        position: 1,
        page_count: 30,
        file_name: "rag-05-self-rag.pdf",
        deck: "rag5"
      }
    ]
  }
];

const ALL_MATERIALS = SAMPLE_CURRICULUM.flatMap((d) => d.items);

function ReaderPageInner() {
  const searchParams = useSearchParams();
  // ?slide=<public_code> giữ đúng tài liệu đang đọc trong URL, để chia sẻ link
  // hoặc bấm Back/Refresh vẫn quay lại đúng chỗ thay vì nhảy về tài liệu đầu.
  const initialMaterial =
    ALL_MATERIALS.find((m) => m.public_code === searchParams.get("slide")) ?? ALL_MATERIALS[0];
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem>(initialMaterial);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isConfusionModalOpen, setIsConfusionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"mindmap" | "flashcards" | "notes" | "tutor">("tutor");
  const [highlightedText, setHighlightedText] = useState<string | null>(null);
  // Câu hỏi do popup nhắc sinh ra — đi cùng đường với highlightedText để
  // ReaderTabs tự gửi, khỏi phải nhân đôi logic gọi AI.
  const [nudgeAsk, setNudgeAsk] = useState<string | null>(null);
  // Tăng mỗi lần học viên hỏi AI -> reset đồng hồ "đứng yên" của popup nhắc.
  const [askCount, setAskCount] = useState(0);
  const [activeTool, setActiveTool] = useState<ReaderTool>("read");
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(2.5);
  const [eraseToken, setEraseToken] = useState(0);

  // MỘT kho ghi chú cá nhân duy nhất: note viết ở lề slide và note gõ ở tab
  // "Ghi chú" cùng đọc/ghi vào đây, nên hai nơi luôn khớp nhau.
  const [notes, setNotes] = useState<StudyNote[]>([]);

  // Giữ ghi chú qua F5 trong cùng phiên (đóng tab là hết) — bản demo chưa có
  // backend lưu trữ, nhưng mất sạch note chỉ vì lỡ refresh thì quá khó chịu.
  const notesKey = `vlearn_notes_${selectedMaterial.id}`;
  const notesRestoredRef = React.useRef<string | null>(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(notesKey);
      setNotes(saved ? (JSON.parse(saved) as StudyNote[]) : []);
    } catch {
      setNotes([]);
    }
    notesRestoredRef.current = notesKey;
  }, [notesKey]);

  useEffect(() => {
    // Chỉ ghi sau khi đã khôi phục xong cho đúng tài liệu, tránh ghi đè rỗng
    // lên note cũ ngay lúc vừa đổi tài liệu.
    if (notesRestoredRef.current !== notesKey) return;
    try {
      sessionStorage.setItem(notesKey, JSON.stringify(notes));
    } catch {
      // Bị chặn hoặc đầy -> bỏ qua.
    }
  }, [notes, notesKey]);

  const addNote = (n: Omit<StudyNote, "id" | "time">) =>
    setNotes((prev) => [
      ...prev,
      {
        ...n,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  const updateNote = (id: string, text: string) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  const removeNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id));


  const totalPages = selectedMaterial.page_count || 23;

  const handleSelectMaterial = (item: MaterialItem) => {
    setSelectedMaterial(item);
    setCurrentPage(1);
    // Ghi vào URL nhưng KHÔNG thêm mốc lịch sử mới (replace): đổi tài liệu là
    // đổi ngữ cảnh đang đọc, không phải một trang mới để bấm Back quay lại.
    const url = new URL(window.location.href);
    url.searchParams.set("slide", item.public_code);
    window.history.replaceState(null, "", url);
  };

  // Đồng bộ lần đầu: URL chưa có ?slide thì ghi tài liệu đang mở vào cho khớp.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("slide") !== selectedMaterial.public_code) {
      url.searchParams.set("slide", selectedMaterial.public_code);
      window.history.replaceState(null, "", url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 overflow-hidden dark:bg-slate-950 dark:text-slate-100">
      {/* Màn hình khởi động — hiện ở mọi lần tải trang (kể cả F5), tự tắt sau ~1,6s */}
      <BootSplash />

      {/* Top Main Navigation Header */}
      <Header
        materialTitle={selectedMaterial.title}
        materialCode="COMP2010"
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Reader Layout Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Curriculum Navigation */}
        <ReaderSidebar
          curriculum={SAMPLE_CURRICULUM}
          selectedMaterialId={selectedMaterial.id}
          onSelectMaterial={handleSelectMaterial}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
        />

        {/* Reader Center Canvas Area */}
        <main
          className={`ml-0 flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 ${
            isSidebarCollapsed ? "lg:ml-14" : "lg:ml-[340px]"
          }`}
        >
          {/* Reader Top Action Toolbar */}
          <ReaderToolbar
            title={selectedMaterial.title}
            publicCode={selectedMaterial.public_code}
            currentPage={currentPage}
            totalPages={totalPages}
            zoomLevel={zoomLevel}
            onPageChange={setCurrentPage}
            onZoomChange={setZoomLevel}
            onOpenConfusionModal={() => setIsConfusionModalOpen(true)}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            penColor={penColor}
            onPenColorChange={setPenColor}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={setStrokeWidth}
            onErase={() => setEraseToken((t) => t + 1)}
            noteCount={notes.filter((n) => n.page === currentPage).length}
          />

          {/* PDF / Document Slide Viewer Canvas */}
          <PDFViewerCanvas
            currentPage={currentPage}
            totalPages={totalPages}
            zoomLevel={zoomLevel}
            materialTitle={selectedMaterial.title}
            onPageChange={setCurrentPage}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            penColor={penColor}
            strokeWidth={strokeWidth}
            eraseToken={eraseToken}
            pdfUrl={selectedMaterial.pdf_url}
            notes={notes}
            onAddNote={addNote}
            onUpdateNote={updateNote}
            onRemoveNote={removeNote}
            onAskAboutSelection={(text) => {
              setActiveTab("tutor");
              setIsDrawerOpen(true);
              setHighlightedText(text);
            }}
          />
        </main>

        {/* Right / Bottom Interactive Drawer (AI Tutor, Mindmap, Flashcards, Notes) */}
        <ReaderTabs
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onOpen={() => setIsDrawerOpen(true)}
          initialTab={activeTab}
          highlightedText={highlightedText}
          onHighlightConsumed={() => setHighlightedText(null)}
          pendingQuestion={nudgeAsk}
          onPendingQuestionSent={() => {
            setNudgeAsk(null);
            setAskCount((n) => n + 1);
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          materialTitle={selectedMaterial.title}
          deck={selectedMaterial.deck}
          notes={notes}
          onAddNote={addNote}
          onRemoveNote={removeNote}
        />
      </div>

      {/* Nhắc nhẹ khi đứng lâu ở một trang mà chưa hỏi gì */}
      <StuckNudge
        page={currentPage}
        activityToken={askCount}
        onAskHelp={(p) => {
          setActiveTab("tutor");
          setIsDrawerOpen(true);
          setHighlightedText(null);
          setNudgeAsk(`Mình chưa hiểu rõ nội dung trang ${p}, bạn giải thích lại giúp mình nhé?`);
        }}
      />

      {/* Confusion Feedback Modal */}
      <ConfusionModal
        isOpen={isConfusionModalOpen}
        onClose={() => setIsConfusionModalOpen(false)}
        materialTitle={selectedMaterial.title}
        currentPage={currentPage}
      />
    </div>
  );
}

/** useSearchParams bắt buộc nằm trong Suspense (Next.js App Router). */
export default function ReaderPage() {
  return (
    <Suspense fallback={null}>
      <ReaderPageInner />
    </Suspense>
  );
}
