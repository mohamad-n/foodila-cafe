import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeSwitcher } from "@/components/providers/ThemeSwitcher";
import { AdminNav, type NavItem } from "@/components/admin/AdminNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const NAV: NavItem[] = [
  { href: "/cafes", label: "کافه‌ها" },
  { href: "/users", label: "کاربران" },
  { href: "/plans", label: "پلن‌ها" },
];

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.platformRole !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <ThemeProvider>
      <div className="admin-root min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <AdminNav items={NAV} title="پلتفرم" />
            <span className="font-semibold">پلتفرم</span>
            <Badge className="hidden sm:inline-flex">SUPER ADMIN</Badge>
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
