"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

/**
 * Đăng nhập DEMO — không xác thực với hệ thống thật nào.
 * Tài khoản seed cố định, chỉ để màn hình demo trông đúng luồng thật khi
 * trình bày với mentor/giám khảo. Không có backend auth, không gọi ra ngoài.
 */
const DEMO_ACCOUNT = "nhmanhDev";
const DEMO_PASSWORD = "ai42e";

/**
 * Đổi tên cookie sang _v2: trình duyệt nào còn giữ cookie phiên bản cũ
 * (`vlearn_demo_session`) sẽ mất quyền truy cập và phải đăng nhập lại — đúng ý
 * khi thu gọn danh sách tài khoản, tránh phiên cũ của tài khoản đã bỏ vẫn vào được.
 */
export const SESSION_COOKIE = "vlearn_demo_session_v2";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (email.trim().toLowerCase() !== DEMO_ACCOUNT.toLowerCase() || password !== DEMO_PASSWORD) {
      setError("Sai email hoặc mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    // Xoá cookie phiên bản cũ để trình duyệt không giữ lại phiên đã hết hiệu lực.
    document.cookie = "vlearn_demo_session=; path=/; max-age=0";
    document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=86400`;
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex flex-col items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <div className="text-center">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              VLearn
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Đăng nhập demo — prototype hackathon
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="text"
              spellCheck={false}
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#155493] focus:ring-1 focus:ring-[#155493] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder={DEMO_ACCOUNT}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#155493] focus:ring-1 focus:ring-[#155493] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-[#cf202f]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#155493] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0f3f6f] disabled:opacity-60"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}
