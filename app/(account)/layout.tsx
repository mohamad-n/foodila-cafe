import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeSwitcher } from "@/components/providers/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

/**
 * Self-service account area, reachable by ANY signed-in user (super-admin or any café role). It is
 * its own route group so `/account` exists once (a page in both admin groups would collide on the
 * same path). Themed like the admin surfaces (`admin-root` + next-themes), not the public menu.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // "Back" returns to the relevant home for the user's tier.
  const home = session.user.platformRole === "SUPER_ADMIN" ? "/cafes" : "/dashboard";

  return (
    <ThemeProvider>
      <div className="admin-root min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={home}>
                <ArrowRight className="size-4" />
                بازگشت
              </Link>
            </Button>
            <span className="font-semibold">حساب کاربری</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                خروج
              </Button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">{children}</main>
        <Toaster position="bottom-left" />
      </div>
    </ThemeProvider>
  );
}
