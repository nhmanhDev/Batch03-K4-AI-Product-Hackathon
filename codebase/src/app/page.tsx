import { redirect } from "next/navigation";

/**
 * Trang gốc luôn là landing page công khai (/welcome), kể cả khi đã đăng nhập.
 *
 * Trước đây root tự nhảy vào /dashboard nếu còn cookie phiên (max-age 24h),
 * nên người vào lần đầu sau khi ai đó từng đăng nhập trên cùng máy sẽ bị đẩy
 * thẳng vào trong, không kịp thấy trang giới thiệu. Luồng đúng:
 * /welcome -> bấm "Đăng nhập" -> /login -> /dashboard.
 */
export default function Home() {
  redirect("/welcome");
}
