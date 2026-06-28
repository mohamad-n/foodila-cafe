"use client";

import { useTransition } from "react";
import { LogIn, Pencil, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { FormSheet } from "@/components/admin/FormSheet";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { seedCafeDefaultMenu, setCafeStatus, startImpersonation } from "../actions";
import { CafeEditForm } from "./CafeEditForm";

export type CafeRowData = {
  id: string;
  name: string;
  slug: string;
  template: "WARM" | "SCANDI" | "EDITORIAL";
  status: "ACTIVE" | "SUSPENDED";
  ownerEmail: string | null;
  planId: string | null;
};

export function CafeRow({
  cafe,
  plans,
}: {
  cafe: CafeRowData;
  plans: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const active = cafe.status === "ACTIVE";

  function impersonate() {
    startTransition(() => startImpersonation(cafe.id));
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{cafe.name}</TableCell>
      <TableCell dir="ltr" className="text-start">
        /{cafe.slug}
      </TableCell>
      <TableCell>{cafe.template}</TableCell>
      <TableCell dir="ltr" className="text-start">
        {cafe.ownerEmail ?? "—"}
      </TableCell>
      <TableCell>
        <Badge variant={active ? "default" : "destructive"}>{active ? "فعال" : "معلق"}</Badge>
      </TableCell>
      <TableCell className="text-end">
        <div className="flex items-center justify-end gap-1">
          <FormSheet
            title="ویرایش کافه"
            description={cafe.name}
            trigger={
              <Button variant="ghost" size="sm">
                <Pencil className="size-4" /> ویرایش
              </Button>
            }
          >
            {(close) => <CafeEditForm cafe={cafe} plans={plans} onDone={close} />}
          </FormSheet>

          <ConfirmDialog
            title={active ? "تعلیق کافه؟" : "فعال‌سازی کافه؟"}
            description={active ? "منوی عمومی این کافه از دسترس خارج می‌شود." : undefined}
            confirmLabel={active ? "تعلیق" : "فعال‌سازی"}
            successMessage={active ? "کافه معلق شد." : "کافه فعال شد."}
            onConfirm={() =>
              setCafeStatus({ id: cafe.id, status: active ? "SUSPENDED" : "ACTIVE" })
            }
            trigger={
              <Button variant="ghost" size="sm">
                {active ? "تعلیق" : "فعال‌سازی"}
              </Button>
            }
          />

          <ConfirmDialog
            title="بارگذاری منوی پیش‌فرض؟"
            description="منوی نمونه (دسته‌ها، آیتم‌ها، قیمت‌ها و تصاویر) در این کافه ایجاد یا به‌روزرسانی می‌شود. این کار افزایشی است و چیزی حذف نمی‌شود."
            confirmLabel="بارگذاری"
            successMessage="منوی پیش‌فرض بارگذاری شد."
            destructive={false}
            onConfirm={() => seedCafeDefaultMenu(cafe.id)}
            trigger={
              <Button variant="ghost" size="sm">
                <Sprout className="size-4" /> منوی پیش‌فرض
              </Button>
            }
          />

          <Button variant="ghost" size="sm" onClick={impersonate} disabled={pending}>
            <LogIn className="size-4" /> ورود به‌جای کافه
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
