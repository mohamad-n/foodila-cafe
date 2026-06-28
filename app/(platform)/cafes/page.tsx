import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { faNum } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/admin/DataTable";
import { CafeCreateSheet } from "./_components/CafeCreateSheet";
import { CafeRow, type CafeRowData } from "./_components/CafeRow";

export default async function PlatformCafesPage() {
  await requireSuperAdmin();

  const [cafes, plans, audit] = await Promise.all([
    db.cafe.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        template: true,
        status: true,
        planId: true,
        memberships: {
          where: { role: "OWNER" },
          take: 1,
          select: { user: { select: { email: true } } },
        },
      },
    }),
    db.plan.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        cafeId: true,
        createdAt: true,
        actor: { select: { email: true } },
      },
    }),
  ]);

  const rows: CafeRowData[] = cafes.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    template: c.template,
    status: c.status,
    planId: c.planId,
    ownerEmail: c.memberships[0]?.user.email ?? null,
  }));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">کافه‌ها</h1>
        <CafeCreateSheet />
      </div>

      <DataTable
        headers={["نام", "اسلاگ", "قالب", "مالک", "وضعیت", ""]}
        empty="هنوز کافه‌ای ساخته نشده."
      >
        {rows.map((cafe) => (
          <CafeRow key={cafe.id} cafe={cafe} plans={plans} />
        ))}
      </DataTable>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">فعالیت اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {audit.length === 0 ? <li>موردی نیست.</li> : null}
            {audit.map((a) => (
              <li key={a.id} dir="ltr" className="font-mono text-xs">
                {a.createdAt.toISOString().slice(0, 19).replace("T", " ")} · {a.actor.email} ·{" "}
                {a.action}
                {a.cafeId ? ` · cafe:${a.cafeId.slice(0, 8)}` : ""}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            مجموع رویدادها: {faNum(audit.length)}
            {audit.length === 10 ? "+" : ""}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
