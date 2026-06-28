"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setActiveCafe } from "@/app/(cafe-admin)/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CafeOption = { id: string; name: string };

/**
 * Café switcher (shadcn Select). The choice is ALWAYS re-validated server-side in
 * `setActiveCafe` against the session memberships — never trusted from the client.
 * On change it persists the preference cookie then refreshes the route.
 */
export function CafeSwitcher({ current, options }: { current: string; options: CafeOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function onChange(cafeId: string) {
    if (cafeId === current) return;
    const fd = new FormData();
    fd.set("cafeId", cafeId);
    startTransition(async () => {
      await setActiveCafe(fd);
      router.refresh();
    });
  }

  return (
    <Select value={current} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="h-8 w-40 text-sm" aria-label="انتخاب کافه">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
