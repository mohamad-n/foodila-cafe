import { Plus } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/DataTable";
import { PlanSheet } from "./_components/PlanSheet";
import { PlanRow } from "./_components/PlanRow";

export default async function PlatformPlansPage() {
  await requireSuperAdmin();

  const plans = await db.plan.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { cafes: true } } },
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">پلن‌ها</h1>
          <p className="text-sm text-muted-foreground">
            قیمت‌گذاری فعلاً خارج از محدوده است — فقط نام پلن.
          </p>
        </div>
        <PlanSheet
          title="افزودن پلن"
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> پلن جدید
            </Button>
          }
        />
      </div>

      <DataTable headers={["نام", "کافه‌ها", ""]} empty="پلنی نیست.">
        {plans.map((p) => (
          <PlanRow key={p.id} plan={{ id: p.id, name: p.name, cafeCount: p._count.cafes }} />
        ))}
      </DataTable>
    </section>
  );
}
