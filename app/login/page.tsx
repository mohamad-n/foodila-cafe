import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.platformRole === "SUPER_ADMIN" ? "/cafes" : "/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">ورود به پنل مدیریت</h1>
        <p className="mt-1 text-sm text-ink/60">منوی کافه</p>
      </div>
      <LoginForm />
    </main>
  );
}
