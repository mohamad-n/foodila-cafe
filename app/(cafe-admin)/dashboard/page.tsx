import Link from "next/link";
import { requireActiveCafe } from "@/lib/active-cafe";
import { getTenantPrisma } from "@/lib/tenant";
import { faNum } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Authenticated, per-request. The (cafe-admin) layout already guards + redirects.
export default async function DashboardPage() {
  const { cafe } = await requireActiveCafe();
  const db = getTenantPrisma(cafe.id);
  const [categories, items] = await Promise.all([db.category.count(), db.item.count()]);

  const stats = [
    { label: "دسته‌ها", value: categories },
    { label: "آیتم‌ها", value: items },
  ];

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">داشبورد</h1>
      <dl className="grid grid-cols-2 gap-4 sm:max-w-sm">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dd className="text-2xl font-bold">{faNum(s.value)}</dd>
            </CardContent>
          </Card>
        ))}
      </dl>
      <Link href="/menu" className="inline-block text-sm text-primary hover:underline">
        مدیریت منو ←
      </Link>
    </section>
  );
}
