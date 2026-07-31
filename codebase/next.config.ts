import type { NextConfig } from "next";

// Không bật output: "standalone" — chế độ đó đóng gói cho self-host/Docker
// (.next/standalone/server.js). Vercel cần cấu trúc build mặc định để map
// route sang serverless function; bật standalone thì mọi route trả 404.
const nextConfig: NextConfig = {
  /* config options here */
  // Tắt badge "N" debug (Route/Bundler/Preferences) Next.js tự hiện lúc
  // `next dev` — chỉ gây rối khi demo, không phải lỗi hay tính năng của nhóm.
  devIndicators: false,
};

export default nextConfig;
