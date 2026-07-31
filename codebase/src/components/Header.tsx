"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Menu,
  Moon,
  Sun,
  GraduationCap,
  ChevronDown,
  User,
  LogOut,
  Bell,
  ExternalLink,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

interface HeaderProps {
  materialTitle?: string;
  materialCode?: string;
  userEmail?: string;
  userName?: string;
  onToggleSidebar?: () => void;
}

export function Header({
  materialTitle,
  materialCode = "COMP2010",
  userEmail = "demo@vlearn.local",
  userName = "Học viên Demo",
  onToggleSidebar,
}: HeaderProps) {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lang, setLang] = useState<"VI" | "EN">("VI");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const toggleDarkMode = () => {
    const nextValue = !isDarkMode;
    setIsDarkMode(nextValue);
    document.documentElement.classList.toggle("dark", nextValue);
  };

  const isReaderMode = Boolean(materialTitle);

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex min-w-0 items-center gap-3">
        {isReaderMode ? (
          <button
            type="button"
            onClick={() => window.history.back()}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:flex dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : null}

        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
            aria-label="Mở danh sách học liệu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5 font-black tracking-tight">
          <BrandMark className="h-9 w-9" />
          <span className="text-xl font-extrabold tracking-tight text-[#155493] dark:text-sky-300">
            <span className="text-[#cf202f]">V</span>Learn
          </span>
        </Link>

        {isReaderMode ? (
          <>
            <div className="mx-1 hidden h-9 w-px bg-slate-200 md:block dark:bg-slate-700" />
            <div className="hidden min-w-0 items-center gap-2.5 md:flex">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[#155493] dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300">
                <BookOpen className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="max-w-[44vw] truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                  {materialTitle}
                </p>
                <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {materialCode} · Học liệu bài giảng
                </p>
              </div>
            </div>
          </>
        ) : (
          <nav className="hidden items-center gap-1.5 md:flex ml-6">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                pathname === "/dashboard" || pathname === "/"
                  ? "bg-[#f0f6fc] text-[#155493] border border-[#155493]/20 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <BookOpen className="h-4 w-4 text-[#155493] dark:text-sky-400" />
              Trang chủ
            </Link>
            <Link
              href="/my-courses"
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                pathname === "/my-courses" || (pathname?.startsWith("/course") && !isReaderMode)
                  ? "bg-[#f0f6fc] text-[#155493] border border-[#155493]/20 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <GraduationCap className="h-4 w-4 text-[#155493] dark:text-sky-400" />
              Khóa học của tôi
            </Link>
          </nav>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!isReaderMode && (
          <a
            href="https://codelabs.vlearn.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 md:flex dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            Mở Codelabs
          </a>
        )}

        <button
          type="button"
          onClick={() => setLang(lang === "VI" ? "EN" : "VI")}
          className="flex h-9 min-w-10 items-center justify-center rounded-xl border border-slate-200 px-2 text-xs font-bold text-[#155493] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-sky-300 dark:hover:bg-slate-800"
          aria-label="Đổi ngôn ngữ"
        >
          {lang}
        </button>

        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-[#155493] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-sky-300 dark:hover:bg-slate-800"
          aria-label="Đổi giao diện sáng tối"
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {!isReaderMode && (
          <>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Thông báo"
            >
              <Bell className="h-4 w-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#155493] text-[11px] font-bold text-white">
                  {userName ? userName.charAt(0) : "U"}
                </div>
                <span className="hidden max-w-[140px] truncate text-xs font-medium text-slate-700 sm:inline dark:text-slate-200">
                  {userEmail}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{userName}</p>
                    <p className="truncate text-[11px] text-slate-500">{userEmail}</p>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      Hồ sơ cá nhân
                    </button>
                    <Link
                      href="/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
