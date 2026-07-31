"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { MOCK_COURSES, MOCK_STUDENT_STATS, MOCK_TASKS } from "@/lib/mock-data";
import {
  BookOpen,
  Clock,
  Flame,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  BarChart2,
  Calendar,
  FileText
} from "lucide-react";

export default function DashboardPage() {
  const comp2010 = MOCK_COURSES.find((c) => c.course_id === "comp2010") || MOCK_COURSES[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c3660] via-[#124f8c] to-[#1a65af] p-6 sm:p-8 text-white shadow-lg shadow-[#124f8c]/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-200 backdrop-blur-md">
                🎓 VinUni Academic Year 2026 - Fall Semester
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Chào mừng trở lại, Học viên Demo!
              </h1>
              <p className="text-sm text-sky-100/90 leading-relaxed">
                Bạn đã hoàn thành <span className="font-bold text-white">75%</span> lộ trình môn Cấu trúc dữ liệu & Thuật toán. Hãy tiếp tục duy trì chuỗi học tập nhé!
              </p>
            </div>

            <Link
              href="/course/comp2010/reader?slide=D01-S01"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#124f8c] shadow-md transition-all hover:bg-sky-50 active:scale-95 flex-shrink-0"
            >
              <PlayCircle className="h-5 w-5 text-[#124f8c]" />
              <span>Tiếp tục học COMP2010</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Khóa học đăng ký</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#124f8c] dark:bg-sky-950/50 dark:text-sky-400">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {MOCK_STUDENT_STATS.totalCourses}
              </span>
              <span className="text-xs font-medium text-slate-500">Môn học</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tài liệu đã đọc</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {MOCK_STUDENT_STATS.completedMaterials}
              </span>
              <span className="text-xs font-medium text-slate-500">/ {MOCK_STUDENT_STATS.totalMaterials} Slide</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Thời gian nghiên cứu</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {MOCK_STUDENT_STATS.studyTimeHours}
              </span>
              <span className="text-xs font-medium text-slate-500">Giờ</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Chuỗi học tập (Streak)</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-400">
                <Flame className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {MOCK_STUDENT_STATS.currentStreakDays}
              </span>
              <span className="text-xs font-medium text-slate-500">Ngày liên tiếp 🔥</span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: My Active Courses & Knowledge Map */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Courses Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#124f8c] dark:text-sky-400" />
                  Khóa học đang diễn ra
                </h2>
                <Link
                  href="/my-courses"
                  className="text-xs font-semibold text-[#124f8c] hover:underline flex items-center gap-1 dark:text-sky-400"
                >
                  Xem tất cả ({MOCK_COURSES.length}) <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_COURSES.map((course) => (
                  <div
                    key={course.course_id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-[#124f8c] dark:bg-sky-950 dark:text-sky-300">
                          {course.course_id.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">{course.semester}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {course.course_name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Giảng viên: {course.instructorName}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-600 dark:text-slate-400">Tiến độ bài học</span>
                          <span className="text-[#124f8c] dark:text-sky-400">
                            {course.reading_progress_percent}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-[#124f8c] dark:bg-sky-400 transition-all duration-500 rounded-full"
                            style={{ width: `${course.reading_progress_percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/course/${course.course_id}`}
                          className="flex-1 text-center rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Chi tiết môn
                        </Link>
                        <Link
                          href={`/course/${course.course_id}/reader?slide=D01-S01`}
                          className="flex-1 text-center rounded-lg bg-[#124f8c] py-1.5 text-xs font-semibold text-white hover:bg-[#0e4073] dark:bg-sky-500 dark:text-slate-950"
                        >
                          Đọc slide
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Analytics Section */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-sky-500" />
                    Phân tích mức độ thành thạo kĩ năng (COMP2010)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hệ thống tự động phát hiện lỗ hổng dựa trên kết quả đọc slide & tương tác
                  </p>
                </div>
                <Link
                  href="/course/comp2010/study-overview"
                  className="text-xs font-semibold text-[#124f8c] hover:underline dark:text-sky-400"
                >
                  Xem chi tiết báo cáo
                </Link>
              </div>

              <div className="space-y-3 pt-2">
                {comp2010.knowledgeTopics.slice(0, 4).map((topic) => (
                  <div key={topic.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {topic.name}
                      </span>
                      <span
                        className={`font-bold ${
                          topic.status === "mastered"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : topic.status === "learning"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-500 dark:text-red-400"
                        }`}
                      >
                        {topic.masteryPercent}% ({topic.status === "mastered" ? "Thành thạo" : topic.status === "learning" ? "Đang luyện" : "Cần ôn tập"})
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          topic.status === "mastered"
                            ? "bg-emerald-500"
                            : topic.status === "learning"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${topic.masteryPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Upcoming Tasks & Quick Reminders */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                Nhiệm vụ & Bài tập cần làm
              </h3>

              <div className="space-y-3">
                {MOCK_TASKS.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 transition-all hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-[#124f8c] dark:bg-sky-950 dark:text-sky-300">
                        {task.courseCode}
                      </span>
                      <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        Hạn: {task.dueDate}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      {task.title}
                    </p>
                    <div className="flex items-center justify-end mt-1">
                      <Link
                        href={`/course/${task.courseId}/reader?slide=D01-S01`}
                        className="text-xs font-semibold text-[#124f8c] hover:underline dark:text-sky-400 flex items-center gap-1"
                      >
                        Làm ngay <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links / Resources */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tiện ích & Liên kết VinUni
              </h3>
              <div className="space-y-2">
                <a
                  href="https://codelabs.vlearn.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sky-500" />
                    Codelabs Python/C++ IDE
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
