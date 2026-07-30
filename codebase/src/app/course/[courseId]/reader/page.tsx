"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { ReaderSidebar } from "@/components/ReaderSidebar";
import { ReaderToolbar } from "@/components/ReaderToolbar";
import { PDFViewerCanvas } from "@/components/PDFViewerCanvas";
import { ReaderTabs } from "@/components/ReaderTabs";
import { ConfusionModal } from "@/components/ConfusionModal";
import { DayCurriculum, MaterialItem } from "@/types/vlearn";

// Sample curriculum data based on VLearn API response for COMP2010
const SAMPLE_CURRICULUM: DayCurriculum[] = [
  {
    id: "Lecture_material_ms203mb1_squf06",
    public_code: "D01",
    title: "Day 01: AI & LLM Foundation",
    status: "published",
    position: 1,
    material_count: 2,
    completed_material_count: 0,
    reading_completed: false,
    reading_progress_percent: 0,
    items: [
      {
        id: "material_ms2039d0_hnxpxy",
        public_code: "D01-S01",
        type: "pdf",
        title: "d1-slide-hackathon.pdf",
        status: "studying",
        lecture_id: "Lecture_material_ms2039d0_hnxpxy",
        position: 1,
        page_count: 29,
        file_name: "d1-slide-hackathon.pdf",
        deck: "d1"
      },
      {
        id: "material_ms203mb1_squf06",
        public_code: "D01-S02",
        type: "pdf",
        title: "[Lab] Day 01_ LLM Foundation.pdf",
        status: "published",
        lecture_id: "Lecture_material_ms203mb1_squf06",
        position: 2,
        page_count: 23,
        file_name: "material_mrxpq9zu_t8e6xs.pdf"
      }
    ]
  },
  {
    id: "Lecture_material_ms203vsq_ob7vqp",
    public_code: "D02",
    title: "Day 02: Xác định bài toán cho AI",
    status: "published",
    position: 2,
    material_count: 1,
    completed_material_count: 0,
    reading_completed: false,
    reading_progress_percent: 0,
    items: [
      {
        id: "material_ms203vsq_ob7vqp",
        public_code: "D02-S01",
        type: "pdf",
        title: "d2-slide-hackathon.pdf",
        status: "published",
        lecture_id: "Lecture_material_ms203vsq_ob7vqp",
        position: 1,
        page_count: 29,
        file_name: "d2-slide-hackathon.pdf",
        deck: "d2"
      }
    ]
  },
  {
    id: "Lecture_material_ms2lb2ke_c1je8j",
    public_code: "D03",
    title: "Day 03: ReAct & Agentic AI Systems",
    status: "published",
    position: 3,
    material_count: 2,
    completed_material_count: 0,
    reading_completed: false,
    reading_progress_percent: 0,
    items: [
      {
        id: "material_ms2044ey_k6uor3",
        public_code: "D03-S01",
        type: "pdf",
        title: "day03-tu-chatbot-den-agentic-agent-react.pdf",
        status: "published",
        lecture_id: "Lecture_material_ms2044ey_k6uor3",
        position: 1,
        page_count: 23,
        file_name: "day03-tu-chatbot-den-agentic-agent-react.pdf"
      },
      {
        id: "material_ms2lb2ke_c1je8j",
        public_code: "D03-S02",
        type: "pdf",
        title: "Day03-D302-tu-chatbot-den-agentic-agent-react.pdf",
        status: "published",
        lecture_id: "Lecture_material_ms2lb2ke_c1je8j",
        position: 2,
        page_count: 23,
        file_name: "Day03-D302-tu-chatbot-den-agentic-agent-react.pdf"
      }
    ]
  },
  {
    id: "Lecture_material_ms4ahenz_7cpqa2",
    public_code: "D04",
    title: "Day 04: Prompt Engineering & Tool Calling",
    status: "published",
    position: 4,
    material_count: 3,
    completed_material_count: 0,
    reading_completed: false,
    reading_progress_percent: 0,
    items: [
      {
        id: "material_ms204i6x_gqwyya",
        public_code: "D04-S01",
        type: "pdf",
        title: "day04-prompt-engineering-tool-calling.pdf",
        status: "published",
        lecture_id: "Lecture_material_ms204i6x_gqwyya",
        position: 1,
        page_count: 23,
        file_name: "day04-prompt-engineering-tool-calling.pdf"
      }
    ]
  },
  {
    id: "Lecture_material_ms5r18w1_oe5xlz",
    public_code: "D05",
    title: "Day 05: AI Product Requirements & Deployment",
    status: "published",
    position: 5,
    material_count: 3,
    completed_material_count: 0,
    reading_completed: false,
    reading_progress_percent: 0,
    items: [
      {
        id: "material_ms204v3b_r9mo78",
        public_code: "D05-S01",
        type: "pdf",
        title: "day05-ai-product-thinking-requirements.pdf",
        status: "published",
        lecture_id: "Lecture_material_ms204v3b_r9mo78",
        position: 1,
        page_count: 23,
        file_name: "day05-ai-product-thinking-requirements.pdf"
      }
    ]
  }
];

export default function ReaderPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem>(SAMPLE_CURRICULUM[0].items[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isConfusionModalOpen, setIsConfusionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"mindmap" | "flashcards" | "notes" | "tutor">("tutor");

  const totalPages = selectedMaterial.page_count || 23;

  const handleSelectMaterial = (item: MaterialItem) => {
    setSelectedMaterial(item);
    setCurrentPage(1);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 overflow-hidden dark:bg-slate-950 dark:text-slate-100">
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
        />

        {/* Reader Center Canvas Area */}
        <main className="ml-0 flex min-w-0 flex-1 flex-col overflow-hidden lg:ml-[340px]">
          {/* Reader Top Action Toolbar */}
          <ReaderToolbar
            title={selectedMaterial.title}
            publicCode={selectedMaterial.public_code}
            currentPage={currentPage}
            totalPages={totalPages}
            zoomLevel={zoomLevel}
            onPageChange={setCurrentPage}
            onZoomChange={setZoomLevel}
            onToggleFullscreen={handleToggleFullscreen}
            isFullscreen={isFullscreen}
            onOpenAiTutor={() => {
              setActiveTab("tutor");
              setIsDrawerOpen(true);
            }}
            onOpenConfusionModal={() => setIsConfusionModalOpen(true)}
          />

          {/* PDF / Document Slide Viewer Canvas */}
          <PDFViewerCanvas
            currentPage={currentPage}
            totalPages={totalPages}
            zoomLevel={zoomLevel}
            materialTitle={selectedMaterial.title}
            onPageChange={setCurrentPage}
          />
        </main>

        {/* Right / Bottom Interactive Drawer (AI Tutor, Mindmap, Flashcards, Notes) */}
        <ReaderTabs
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          initialTab={activeTab}
          currentPage={currentPage}
          totalPages={totalPages}
          materialTitle={selectedMaterial.title}
          deck={selectedMaterial.deck}
        />
      </div>

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
