import { redirect } from "next/navigation";
import { requireActiveCafe } from "@/lib/active-cafe";
import { db } from "@/lib/db";
import { imgUrl } from "@/lib/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoUploader } from "./_components/LogoUploader";
import { FaviconUploader } from "./_components/FaviconUploader";
import { MetaSettingsForm } from "./_components/MetaSettingsForm";
import { DisplaySettingsForm } from "./_components/DisplaySettingsForm";
import { TemplateSettingsForm } from "./_components/TemplateSettingsForm";

export default async function SettingsPage() {
  const { cafe } = await requireActiveCafe();
  // Settings are OWNER/ADMIN only; the actions re-enforce this server-side.
  if (cafe.role === "STAFF") redirect("/dashboard");

  const data = await db.cafe.findUnique({
    where: { id: cafe.id },
    select: {
      logoKey: true,
      faviconKey: true,
      metaTitle: true,
      metaDescription: true,
      showCalories: true,
      showPrice: true,
      template: true,
    },
  });
  const logoSrc = data?.logoKey ? imgUrl(data.logoKey, 240, 120, "fit") : null;
  const faviconSrc = data?.faviconKey ? imgUrl(data.faviconKey, 64, 64, "fit") : null;

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">تنظیمات</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قالب منو</CardTitle>
          <CardDescription>
            ظاهر منوی عمومی کافه (گرم / اسکاندی / ادیتوریال). تغییر آن بلافاصله روی منو اعمال می‌شود.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateSettingsForm cafeId={cafe.id} template={data?.template ?? "EDITORIAL"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">لوگوی کافه</CardTitle>
          <CardDescription>
            روی منوی عمومی، گوشهٔ چپ هدر نمایش داده می‌شود. اختیاری است.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUploader cafeId={cafe.id} logoSrc={logoSrc} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">متادیتا و سئو</CardTitle>
          <CardDescription>
            عنوان و توضیحات صفحهٔ منوی عمومی برای موتورهای جستجو و پیش‌نمایش لینک (OpenGraph). تصویر
            پیش‌نمایش از لوگوی کافه ساخته می‌شود.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MetaSettingsForm
            cafeId={cafe.id}
            defaults={{
              metaTitle: data?.metaTitle ?? "",
              metaDescription: data?.metaDescription ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">فاوآیکون</CardTitle>
          <CardDescription>
            آیکونی که در تب مرورگر کنار آدرس منو دیده می‌شود. PNG مربعی توصیه می‌شود. اختیاری است.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FaviconUploader cafeId={cafe.id} faviconSrc={faviconSrc} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">نمایش روی منو</CardTitle>
          <CardDescription>کنترل نمایش کالری و قیمت آیتم‌ها روی منوی عمومی.</CardDescription>
        </CardHeader>
        <CardContent>
          <DisplaySettingsForm
            cafeId={cafe.id}
            defaults={{
              showCalories: data?.showCalories ?? true,
              showPrice: data?.showPrice ?? true,
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
