"use client";

import { ImageIcon } from "lucide-react";
import { faNum, faToman } from "@/lib/format";
import type { CategoryOption, MenuItemDTO } from "../schema";
import { AvailabilityToggle } from "./AvailabilityToggle";
import { ItemActions } from "./ItemActions";

/** Compact item box used on mobile (the table is hidden below md). */
export function ItemCard({
  item,
  cafeId,
  categories,
}: {
  item: MenuItemDTO;
  cafeId: string;
  categories: CategoryOption[];
}) {
  const thumb = item.images[0];

  return (
    <div className="flex items-center gap-3 rounded-lg border p-2.5">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb.thumbUrl}
          alt={item.name.fa}
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-md object-cover"
          style={{ backgroundColor: "hsl(var(--muted))" }}
        />
      ) : (
        <div className="grid size-12 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <ImageIcon className="size-4" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{item.name.fa}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>{item.price != null ? faToman(item.price) : "—"}</span>
          {item.calories != null ? <span>· {faNum(item.calories)} کالری</span> : null}
        </div>
      </div>

      <AvailabilityToggle cafeId={cafeId} id={item.id} isAvailable={item.isAvailable} showLabel={false} />
      <ItemActions item={item} cafeId={cafeId} categories={categories} />
    </div>
  );
}
