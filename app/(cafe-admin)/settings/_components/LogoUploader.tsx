"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { setCafeLogo, removeCafeLogo } from "../actions";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function LogoUploader({ cafeId, logoSrc }: { cafeId: string; logoSrc: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      toast.error("فقط JPEG/PNG/WebP/AVIF.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cafeId, kind: "logo", contentType: file.type }),
      });
      if (!res.ok) throw new Error("presign");
      const { url, key } = (await res.json()) as { url: string; key: string };

      const put = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error("upload");

      const saved = await setCafeLogo({ cafeId, objectKey: key });
      if (!saved.ok) throw new Error(saved.error ?? "save");
      toast.success("لوگو ذخیره شد.");
      router.refresh();
    } catch {
      toast.error("بارگذاری ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoSrc} alt="لوگوی کافه" className="size-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">بدون لوگو</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
          <ImagePlus className="size-4" />
          {busy ? "در حال بارگذاری…" : logoSrc ? "تغییر لوگو" : "آپلود لوگو"}
          <input
            type="file"
            accept={ALLOWED.join(",")}
            className="hidden"
            disabled={busy}
            onChange={onPick}
          />
        </label>

        {logoSrc ? (
          <ConfirmDialog
            title="حذف لوگو؟"
            successMessage="لوگو حذف شد."
            onConfirm={async () => {
              const res = await removeCafeLogo({ cafeId });
              if (res.ok) router.refresh();
              return res;
            }}
            trigger={
              <Button variant="ghost" size="sm" className="text-destructive">
                <Trash2 className="size-4" /> حذف
              </Button>
            }
          />
        ) : null}
      </div>
    </div>
  );
}
