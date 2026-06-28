import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { DataTable } from "@/components/admin/DataTable";
import { UserRow, type UserRowData } from "./_components/UserRow";

export default async function PlatformUsersPage() {
  const admin = await requireSuperAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      platformRole: true,
      _count: { select: { memberships: true } },
    },
  });

  const rows: UserRowData[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    isSuper: u.platformRole === "SUPER_ADMIN",
    memberships: u._count.memberships,
    isSelf: u.id === admin.id,
  }));

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">کاربران</h1>

      <DataTable headers={["ایمیل", "نام", "نقش پلتفرم", "عضویت‌ها", ""]} empty="کاربری نیست.">
        {rows.map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
      </DataTable>
    </section>
  );
}
