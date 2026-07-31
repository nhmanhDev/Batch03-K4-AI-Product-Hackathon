export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  department_id: string | null;
}

export interface MaterialItem {
  id: string;
  public_code: string;
  type: 'pdf' | 'video' | 'doc';
  title: string;
  status: 'active' | 'published' | 'studying';
  lecture_id: string;
  position: number;
  page_count?: number;
  file_name?: string;
  /** Deck có corpus thật để AI ground vào (xem codebase/src/data/). Không có = chưa có học liệu thật, AI Tutor tắt cho tài liệu này. */
  deck?: 'd1' | 'd2' | 'rag1' | 'rag2' | 'rag3' | 'rag4' | 'rag5' | 'law';
  /** Có = viewer render file PDF thật bằng pdf.js (đường dẫn dưới public/). Không có = fallback mock HTML trang trí. */
  pdf_url?: string;
}

export interface DayCurriculum {
  id: string;
  public_code: string;
  title: string;
  status: 'published' | 'draft';
  position: number;
  items: MaterialItem[];
  material_count: number;
  completed_material_count: number;
  reading_completed: boolean;
  reading_progress_percent: number;
}

export interface Course {
  course_id: string;
  course_name: string;
  department_id: string;
  lecturer_id: number;
  enrolled_student_count: number;
  open_material_count: number;
  completed_material_count: number;
  ingested_document_count: number;
  completed_day_count: number;
  total_day_count: number;
  reading_progress_percent: number;
  tutor_question_count: number;
}

export interface Note {
  id: string;
  content: string;
  page: number;
  created_at: string;
}

/**
 * Ghi chú cá nhân — MỘT kho duy nhất dùng chung cho cả note viết ở lề slide
 * (PDFViewerCanvas) và tab "Ghi chú" trong panel Tutor (ReaderTabs). Trước đây
 * hai nơi giữ state riêng nên viết bên này không thấy bên kia.
 */
export interface StudyNote {
  id: string;
  page: number;
  /** Đoạn được bôi đen khi tạo note từ slide. Note gõ thẳng ở tab thì không có. */
  quote?: string;
  text: string;
  time: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  status: 'mastered' | 'learning' | 'new';
}
