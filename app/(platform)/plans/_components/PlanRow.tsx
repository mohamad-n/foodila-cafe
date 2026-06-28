"use client";

import { Pencil, Trash2 } from "lucide-react";
import { faNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { deletePlan } from "../actions";
import { PlanSheet } from "./PlanSheet";

export function PlanRow({ plan }: { plan: { id: string; name: string; cafeCount: number } }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{plan.name}</TableCell>
      <TableCell>{faNum(plan.cafeCount)}</TableCell>
      <TableCell className="text-end">
        <div className="flex items-center justify-end gap-1">
          <PlanSheet
            plan={{ id: plan.id, name: plan.name }}
            title="ویرایش پلن"
            trigger={
              <Button variant="ghost" size="sm">
                <Pencil className="size-4" /> ویرایش
              </Button>
            }
          />
          <ConfirmDialog
            title="حذف پلن؟"
            description="کافه‌های این پلن بدون پلن می‌شوند."
            successMessage="پلن حذف شد."
            onConfirm={() => deletePlan({ id: plan.id })}
            trigger={
              <Button variant="ghost" size="sm" className="text-destructive">
                <Trash2 className="size-4" /> حذف
              </Button>
            }
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
