import { BrandMark } from "@/components/BrandMark";

/**
 * Next.js tự hiện file này khi route đang tải (chuyển trang từ dashboard/
 * my-courses vào reader). Giao diện khớp với BootSplash để 2 trạng thái chờ
 * (điều hướng và tải lại trang) nhìn liền mạch như một.
 */
export default function ReaderLoading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-5 bg-white dark:bg-slate-950">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-[#155493]/20" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          <BrandMark className="h-10 w-10" />
        </span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-base font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          VLearn · Trợ lý học theo ngữ cảnh
        </p>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
          Đang chuẩn bị học liệu và AI Tutor…
        </p>
      </div>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-[#155493] dark:bg-sky-500" />
      </div>
    </div>
  );
}
