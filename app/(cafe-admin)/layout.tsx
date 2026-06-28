import { requireActiveCafe } from "@/lib/active-cafe";
import { db } from "@/lib/db";
import { imgUrl } from "@/lib/image";
import { logout } from "@/app/login/actions";
import { stopImpersonation } from "@/app/(platform)/cafes/actions";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeSwitcher } from "@/components/providers/ThemeSwitcher";
import { AdminNavLinks, AdminNavMobile, type NavItem } from "@/components/admin/AdminNav";
import { CafeSwitcher, type CafeOption } from "@/components/admin/CafeSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const BASE_NAV: NavItem[] = [
  { href: "/dashboard", label: "داشبورد" },
  { href: "/menu", label: "منو" },
];
const SETTINGS_NAV: NavItem = { href: "/settings", label: "تنظیمات" };
// Account (self-service profile + password) — available to every role, including STAFF.
const ACCOUNT_NAV: NavItem = { href: "/account", label: "حساب کاربری" };

export default async function CafeAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, cafe, impersonating } = await requireActiveCafe();
  // Settings (branding + display) are OWNER/ADMIN only; account is for everyone.
  const NAV: NavItem[] =
    cafe.role === "STAFF"
      ? [...BASE_NAV, ACCOUNT_NAV]
      : [...BASE_NAV, SETTINGS_NAV, ACCOUNT_NAV];

  // Names for the café switcher (the user belongs to each — legitimate read).
  const ids = user.memberships.map((m) => m.cafeId);
  const switcherOptions: CafeOption[] =
    ids.length > 1
      ? (await db.cafe.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }))
          .map((c) => ({ id: c.id, name: c.name }))
      : [];

  // Café logo for the header (signed server-side; null = no logo).
  const branding = await db.cafe.findUnique({
    where: { id: cafe.id },
    select: { logoKey: true },
  });
  const logoSrc = branding?.logoKey ? imgUrl(branding.logoKey, 160, 64, "fit") : null;

  return (
    <ThemeProvider>
      <div className="admin-root min-h-screen bg-background text-foreground">
        {impersonating ? (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:px-6">
            <span>شما به‌عنوان «{cafe.name}» وارد شده‌اید (حالت جانشینی سوپرادمین).</span>
            <form action={stopImpersonation}>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="h-7 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25"
              >
                پایان جانشینی
              </Button>
            </form>
          </div>
        ) : null}

        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
          {/* Row 1: café identity (logo + name) · account controls (switcher / theme / exit). */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <AdminNavMobile items={NAV} title={cafe.name} />
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt={cafe.name}
                  className="h-7 w-auto max-w-[120px] object-contain"
                />
              ) : null}
              <span className="font-semibold">{cafe.name}</span>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {cafe.role}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {switcherOptions.length > 1 ? (
                <CafeSwitcher current={cafe.id} options={switcherOptions} />
              ) : null}
              <ThemeSwitcher />
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm">
                  خروج
                </Button>
              </form>
            </div>
          </div>

          {/* Row 2: navigation (desktop). On mobile the nav lives in the hamburger Sheet above. */}
          <div className="hidden border-t px-4 py-1.5 sm:px-6 md:block">
            <AdminNavLinks items={NAV} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">{children}</main>
        <Toaster position="bottom-left" />
      </div>
    </ThemeProvider>
  );
}
