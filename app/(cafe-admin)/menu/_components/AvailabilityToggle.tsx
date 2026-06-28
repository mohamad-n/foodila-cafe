"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { toggleItemAvailability } from "../actions";

/** Availability switch shared by the desktop row + mobile card. */
export function AvailabilityToggle({
  cafeId,
  id,
  isAvailable,
  showLabel = true,
}: {
  cafeId: string;
  id: string;
  isAvailable: boolean;
  showLabel?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function onToggle(checked: boolean) {
    startTransition(async () => {
      const res = await toggleItemAvailability({ cafeId, id, isAvailable: checked });
      if (!res.ok) toast.error(res.error ?? "خطا رخ داد.");
    });
  }

  return (
    <label className="flex items-center gap-2">
      <Switch checked={isAvailable} onCheckedChange={onToggle} disabled={pending} />
      {showLabel ? (
        <span className="text-xs text-muted-foreground">{isAvailable ? "موجود" : "ناموجود"}</span>
      ) : null}
    </label>
  );
}
