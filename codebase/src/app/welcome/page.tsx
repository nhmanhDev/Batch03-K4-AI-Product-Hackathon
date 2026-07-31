"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Moon,
  Sun,
  BookOpenCheck,
  MessageCircleQuestion,
  ClipboardCheck,
  Radar,
  BrainCircuit,
  Sparkles,
  ShieldCheck
} from "lucide-react";

export default function WelcomePage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lang, setLang] = useState<"VI" | "EN">("VI");

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#d6222f]/20 selection:text-[#d6222f] dark:bg-slate-950 dark:text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d6222f] font-black text-white shadow-sm">
              <span className="text-xl">V</span>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              <span className="text-[#d6222f] dark:text-red-400">V</span>Learn
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex dark:text-slate-300">
            <a href="#vision" className="transition-colors hover:text-[#d6222f] dark:hover:text-red-400">Tầm nhìn</a>
            <a href="#daily-loop" className="transition-colors hover:text-[#d6222f] dark:hover:text-red-400">Cách học</a>
            <a href="#features" className="transition-colors hover:text-[#d6222f] dark:hover:text-red-400">Tính năng</a>
            <a href="#for-instructors" className="transition-colors hover:text-[#d6222f] dark:hover:text-red-400">Giảng viên</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Đăng nhập
            </Link>

            <a
              href="#daily-loop"
              className="inline-flex rounded-xl bg-[#d6222f] px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-[#b81b26] active:scale-95"
            >
              Khám phá VLearn
            </a>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setLang(lang === "VI" ? "EN" : "VI")}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {lang}
              </button>
              <button
                onClick={toggleDarkMode}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="main-content" className="relative overflow-hidden py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Left Copy */}
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold tracking-wide text-[#d6222f] dark:bg-red-950/50 dark:text-red-400">
                NỀN TẢNG HỌC THÍCH ỨNG · VINUNI AI THỰC CHIẾN
              </span>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-slate-900 dark:text-white leading-[1.15]">
                Chỗ nào em yếu, <br />
                <span className="text-[#d6222f] dark:text-red-400">VLearn biết đúng chỗ đó.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Học theo từng ngày, hỏi tutor ngay trên tài liệu và luyện đúng knowledge component còn thiếu — thay vì nhận một đáp án nhanh rồi bỏ qua cách suy luận.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#d6222f] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#d6222f]/25 transition-all hover:bg-[#b81b26] active:scale-95"
                >
                  <span>Bắt đầu học ngay</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#daily-loop"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Xem cách hoạt động
                </a>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Đăng nhập bằng tài khoản VinUni AI Thực Chiến được cấp
              </div>
            </div>

            {/* Right Tutor Preview Box */}
            <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">VLEARN TUTOR</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Thích ứng
                </span>
              </div>

              <div className="space-y-4 py-6 text-xs sm:text-sm">
                <div className="ml-auto max-w-[85%] rounded-2xl bg-slate-100 p-3.5 font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  Em chưa hiểu vì sao learning rate quá lớn lại làm mô hình khó hội tụ.
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d6222f] text-xs font-black text-white flex-shrink-0">
                    V
                  </div>
                  <div className="max-w-[85%] rounded-2xl bg-red-50 p-3.5 font-medium text-[#8c121d] dark:bg-red-950/40 dark:text-red-200">
                    Nếu mỗi bước cập nhật vượt qua điểm tối ưu, em nghĩ loss sẽ thay đổi như thế nào?
                  </div>
                </div>

                <div className="ml-auto max-w-[85%] rounded-2xl bg-slate-100 p-3.5 font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  Loss có thể dao động thay vì giảm dần?
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d6222f] text-xs font-black text-white flex-shrink-0">
                    V
                  </div>
                  <div className="max-w-[85%] rounded-2xl bg-red-50 p-3.5 font-medium text-[#8c121d] dark:bg-red-950/40 dark:text-red-200">
                    Đúng rồi. Hãy thử liên hệ điều đó với độ dài của vector gradient nhé.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-950">
                <span>Tiếp tục hỏi…</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="border-t border-slate-200/80 bg-white py-16 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#d6222f] dark:text-red-400">
                TẦM NHÌN SẢN PHẨM
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
                Không chỉ trả lời. <br />
                <span className="text-[#d6222f] dark:text-red-400">VLearn giúp bạn học.</span>
              </h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Một công cụ học tốt không làm thay phần suy nghĩ. Nó giúp người học thấy mình đang hiểu đến đâu, vì sao còn vướng và bước tiếp theo nên là gì.
              </p>
              <p>
                Placement Assessment đầu khóa là tùy chọn; quiz hằng ngày là bài đánh giá sau buổi học. Không có gate cứng ngăn sinh viên đi tiếp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Loop Section */}
      <section id="daily-loop" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d6222f] dark:text-red-400">
              MỘT VÒNG HỌC CÓ ĐỊNH HƯỚNG
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
              Đo vừa đủ. Dạy đúng lúc. <span className="text-[#d6222f] dark:text-red-400">Luyện đúng chỗ.</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              VLearn bám theo nhịp học thật của sinh viên: trong buổi học, sau buổi học và khi cần ôn lại.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: "01",
                icon: BookOpenCheck,
                title: "Học theo ngày",
                desc: "Slide, ghi chú giảng viên và tài liệu bổ sung nằm trong cùng một không gian học tập.",
              },
              {
                num: "02",
                icon: MessageCircleQuestion,
                title: "Tutor thích ứng",
                desc: "Giải thích, gợi mở hoặc kiểm tra lại tùy mức độ hiểu và trạng thái của người học.",
              },
              {
                num: "03",
                icon: ClipboardCheck,
                title: "Đánh giá sau buổi",
                desc: "Một bài quiz ngắn giúp xác định knowledge component nào đã vững hoặc cần luyện thêm.",
              },
              {
                num: "04",
                icon: Radar,
                title: "Mastery rõ ràng",
                desc: "Tiến độ được cập nhật theo từng đơn vị kiến thức, có lý do và có đường luyện tiếp theo.",
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
              >
                <span className="text-3xl font-black text-red-100 dark:text-red-950">{step.num}</span>
                <step.icon className="h-7 w-7 text-[#d6222f] dark:text-red-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="border-t border-slate-200/80 bg-white py-16 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d6222f] dark:text-red-400">
              TÍNH NĂNG CỐT LÕI
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
              Thiết kế cho tiến bộ thật, <span className="text-[#d6222f] dark:text-red-400">không phô diễn AI.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 space-y-3 dark:border-slate-800 dark:bg-slate-800">
              <BrainCircuit className="h-8 w-8 text-[#d6222f] dark:text-red-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Biết đúng chỗ còn yếu</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                VLearn neo câu hỏi, bài luyện và tiến độ vào knowledge component thay vì đưa ra một điểm số chung chung.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 space-y-3 dark:border-slate-800 dark:bg-slate-800">
              <Sparkles className="h-8 w-8 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Hướng dẫn vừa đủ</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Người mới được giải thích rõ; người đang tiến bộ được gợi mở; khi bế tắc, tutor chuyển sang hỗ trợ trực tiếp.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 space-y-3 dark:border-slate-800 dark:bg-slate-800">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Dữ liệu học tập có trách nhiệm</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tín hiệu học tập được dùng có giới hạn, có consent và không biến một hành vi đơn lẻ thành kết luận về sinh viên.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Instructors */}
      <section id="for-instructors" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#d6222f] dark:text-red-400">
                DÀNH CHO GIẢNG VIÊN
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
                Một màn hình để biết lớp đang cần gì hôm nay.
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Theo dõi ai đã vào học, knowledge component nào đang là điểm nghẽn, câu hỏi nào cần trả lời và sinh viên nào cần được hỗ trợ thêm — với diễn giải thay vì nhãn kết luận.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span>Vào cổng giảng viên</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Hôm nay · Day 10</span>
                <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-[#124f8c] dark:bg-sky-950 dark:text-sky-300">
                  Dữ liệu minh họa
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Gradient descent</p>
                  <p className="text-xs text-red-500 font-semibold">KC cần giảng lại</p>
                </div>
                <span className="text-2xl font-black text-red-500">68%</span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-red-500 w-[68%] rounded-full" />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
                <span>12 sinh viên cần chú ý</span>
                <span>8 câu hỏi đang chờ</span>
                <span>3 KC dưới ngưỡng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#d6222f] text-white font-bold text-xs">
              V
            </div>
            <span className="font-bold text-slate-900 dark:text-white">VLearn</span>
            <span>• Nền tảng học thích ứng VinUni AI Thực Chiến</span>
          </div>

          <div>© 2026 VLearn · VinUni AI Thực Chiến. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
