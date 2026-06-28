"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { attachImage } from "../actions";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function ImageUploader({ cafeId, itemId }: { cafeId: string; itemId: string }) {
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;

    if (!ALLOWED.includes(file.type)) {
      toast.error("فقط JPEG/PNG/WebP/AVIF.");
      return;
    }
    setBusy(true);
    try {
      // 1) presign
      const res = await fetch("/api/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cafeId, itemId, contentType: file.type }),
      });
      if (!res.ok) throw new Error("presign");
      const { url, key } = (await res.json()) as { url: string; key: string };

      // 2) PUT straight to MinIO (bytes never touch Next)
      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("upload");

      // 3) persist metadata (server computes blurhash/dimensions)
      const saved = await attachImage({ cafeId, itemId, objectKey: key });
      if (!saved.ok) throw new Error(saved.error ?? "save");
      toast.success("تصویر افزوده شد.");
    } catch {
      toast.error("بارگذاری ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
        <Upload className="size-4" />
        {busy ? "در حال بارگذاری…" : "افزودن تصویر"}
        <input
          type="file"
          accept={ALLOWED.join(",")}
          className="hidden"
          disabled={busy}
          onChange={onPick}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        تصویر مربع (۱:۱) پیشنهاد می‌شود؛ سوژه را وسط قاب بگذارید. در منو مربع و در پس‌زمینهٔ ادیتوریال
        به‌صورت عمودی نمایش داده می‌شود.
      </p>
    </div>
  );
}
