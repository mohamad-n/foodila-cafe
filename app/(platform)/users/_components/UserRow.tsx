"use client";

import { faNum } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { setPlatformRole } from "../actions";

export type UserRowData = {
  id: string;
  email: string;
  name: string | null;
  isSuper: boolean;
  memberships: number;
  isSelf: boolean;
};

export function UserRow({ user }: { user: UserRowData }) {
  return (
    <TableRow>
      <TableCell dir="ltr" className="text-start">
        {user.email}
      </TableCell>
      <TableCell>{user.name ?? "—"}</TableCell>
      <TableCell>
        {user.isSuper ? <Badge>SUPER_ADMIN</Badge> : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>{faNum(user.memberships)}</TableCell>
      <TableCell className="text-end">
        {user.isSelf ? (
          <span className="text-xs text-muted-foreground">شما</span>
        ) : (
          <ConfirmDialog
            title={user.isSuper ? "حذف نقش سوپرادمین؟" : "ارتقا به سوپرادمین؟"}
            description={
              user.isSuper
                ? "این کاربر دیگر به پلتفرم دسترسی نخواهد داشت."
                : "این کاربر به همهٔ کافه‌ها دسترسی کامل پیدا می‌کند."
            }
            confirmLabel={user.isSuper ? "حذف سوپرادمین" : "ارتقا"}
            successMessage="نقش به‌روزرسانی شد."
            onConfirm={() => setPlatformRole({ userId: user.id, superAdmin: !user.isSuper })}
            trigger={
              <Button variant="ghost" size="sm">
                {user.isSuper ? "حذف سوپرادمین" : "ارتقا به سوپرادمین"}
              </Button>
            }
          />
        )}
      </TableCell>
    </TableRow>
  );
}
