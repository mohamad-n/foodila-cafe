"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { setCafeFavicon, removeCafeFavicon } from "../actions";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function FaviconUploader({
  cafeId,
  faviconSrc,
}: {
  cafeId: string;
  faviconSrc: string | null;
}) {
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
        body: JSON.stringify({ cafeId, kind: "favicon", contentType: file.type }),
      });
      if (!res.ok) throw new Error("presign");
      const { url, key } = (await res.json()) as { url: string; key: string };

      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("upload");

      const saved = await setCafeFavicon({ cafeId, objectKey: key });
      if (!saved.ok) throw new Error(saved.error ?? "save");
      toast.success("فاوآیکون ذخیره شد.");
      router.refresh();
    } catch {
      toast.error("بارگذاری ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex size-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {faviconSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={faviconSrc} alt="فاوآیکون کافه" className="size-full object-contain" />
        ) : (
          <span className="text-[10px] text-muted-foreground">پیش‌فرض</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
          <ImagePlus className="size-4" />
          {busy ? "در حال بارگذاری…" : faviconSrc ? "تغییر فاوآیکون" : "آپلود فاوآیکون"}
          <input
            type="file"
            accept={ALLOWED.join(",")}
            className="hidden"
            disabled={busy}
            onChange={onPick}
          />
        </label>

        {faviconSrc ? (
          <ConfirmDialog
            title="حذف فاوآیکون؟"
            successMessage="فاوآیکون حذف شد."
            onConfirm={async () => {
              const res = await removeCafeFavicon({ cafeId });
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
