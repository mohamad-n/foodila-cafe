import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { email, name, platformRole } = session.user;

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">حساب کاربری</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">مشخصات حساب</CardTitle>
          <CardDescription>اطلاعات ورود شما به پنل.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">ایمیل</span>
            <span dir="ltr">{email}</span>
          </div>
          {name ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">نام</span>
              <span>{name}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">نقش</span>
            <Badge variant="secondary">
              {platformRole === "SUPER_ADMIN" ? "سوپرادمین" : "کاربر کافه"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">تغییر گذرواژه</CardTitle>
          <CardDescription>
            برای تغییر گذرواژه، ابتدا گذرواژهٔ فعلی را وارد کنید. پس از تغییر، با گذرواژهٔ جدید وارد
            شوید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </section>
  );
}
