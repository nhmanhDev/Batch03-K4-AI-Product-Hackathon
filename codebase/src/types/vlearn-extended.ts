import { Course, DayCurriculum } from './vlearn';

export interface StudentStats {
  totalCourses: number;
  completedMaterials: number;
  totalMaterials: number;
  studyTimeHours: number;
  currentStreakDays: number;
  accuracyPercent: number;
}

export interface TaskAssignment {
  id: string;
  courseId: string;
  courseCode: string;
  title: string;
  dueDate: string;
  type: 'quiz' | 'assignment' | 'reading';
  status: 'pending' | 'submitted' | 'overdue';
}

export interface KnowledgeTopic {
  id: string;
  name: string;
  masteryPercent: number;
  category: string;
  status: 'mastered' | 'learning' | 'weak';
}

export interface CourseDetail extends Course {
  description: string;
  instructorName: string;
  instructorEmail: string;
  semester: string;
  creditHours: number;
  coverImage?: string;
  curriculum: DayCurriculum[];
  knowledgeTopics: KnowledgeTopic[];
}
