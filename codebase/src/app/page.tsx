import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const hasDemoSession = cookieStore.get("vlearn_demo_session")?.value === "1";
  redirect(hasDemoSession ? "/dashboard" : "/welcome");
}
