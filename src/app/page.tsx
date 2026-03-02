import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      redirect("/dashboard");
    }
  } catch {
    // Fall through to login on auth error
  }
  redirect("/login");
}
