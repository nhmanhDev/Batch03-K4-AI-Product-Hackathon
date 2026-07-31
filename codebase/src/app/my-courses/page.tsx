"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { MOCK_COURSES } from "@/lib/mock-data";
import { Search, Filter, BookOpen, Clock, User, CheckCircle2, ChevronRight } from "lucide-react";

export default function MyCoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "completed">("all");

  const filteredCourses = MOCK_COURSES.filter((course) => {
    const matchesSearch =
      course.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.course_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSemester = selectedSemester === "All" || course.semester === selectedSemester;
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "in_progress" && course.reading_progress_percent < 100) ||
      (activeTab === "completed" && course.reading_progress_percent === 100);

    return matchesSearch && matchesSemester && matchesTab;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Title & Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Khóa học của tôi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Quản lý danh sách các môn học đã đăng ký trong học kỳ
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm môn học, mã môn..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs font-medium text-slate-900 shadow-sm transition-colors focus:border-[#124f8c] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-sky-400"
            />
          </div>
        </div>

        {/* Tabs & Filter row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "Tất cả môn" },
              { id: "in_progress", label: "Đang học" },
              { id: "completed", label: "Đã hoàn thành" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "all" | "in_progress" | "completed")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#124f8c] text-white dark:bg-sky-500 dark:text-slate-950"
                    : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="All">Tất cả học kỳ</option>
              <option value="Fall 2026">Fall 2026</option>
              <option value="Spring 2026">Spring 2026</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Không tìm thấy khóa học nào</h3>
            <p className="text-xs text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc học kỳ.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.course_id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-[#124f8c] dark:bg-sky-950 dark:text-sky-300">
                      {course.course_id.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{course.semester}</span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {course.course_name}
                  </h2>

                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Giảng viên: <span className="font-medium text-slate-700 dark:text-slate-300">{course.instructorName}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                      Khoa: {course.department_id} • {course.creditHours} tín chỉ
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Tiến độ hoàn thành</span>
                      <span className="text-[#124f8c] dark:text-sky-400">{course.reading_progress_percent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-[#124f8c] dark:bg-sky-400 transition-all duration-500 rounded-full"
                        style={{ width: `${course.reading_progress_percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/course/${course.course_id}`}
                      className="flex-1 text-center rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Tổng quan môn
                    </Link>
                    <Link
                      href={`/course/${course.course_id}/reader?slide=D01-S01`}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-[#124f8c] py-2 text-xs font-bold text-white transition-colors hover:bg-[#0e4073] dark:bg-sky-500 dark:text-slate-950"
                    >
                      <span>Vào học</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
