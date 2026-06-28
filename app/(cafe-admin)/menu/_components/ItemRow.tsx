"use client";

import { ImageIcon } from "lucide-react";
import { faNum, faToman } from "@/lib/format";
import { TableCell, TableRow } from "@/components/ui/table";
import type { CategoryOption, MenuItemDTO } from "../schema";
import { AvailabilityToggle } from "./AvailabilityToggle";
import { ItemActions } from "./ItemActions";

/** Desktop table row (md+). On mobile the menu renders `ItemCard` instead. */
export function ItemRow({
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
    <TableRow>
      <TableCell className="w-12">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb.thumbUrl}
            alt={item.name.fa}
            width={40}
            height={40}
            className="size-10 rounded-md object-cover"
            style={{ backgroundColor: "hsl(var(--muted))" }}
          />
        ) : (
          <div className="grid size-10 place-items-center rounded-md bg-muted text-muted-foreground">
            <ImageIcon className="size-4" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{item.name.fa}</TableCell>
      <TableCell className="whitespace-nowrap">
        {item.price != null ? faToman(item.price) : "—"}
      </TableCell>
      <TableCell>{item.calories != null ? faNum(item.calories) : "—"}</TableCell>
      <TableCell>
        <AvailabilityToggle cafeId={cafeId} id={item.id} isAvailable={item.isAvailable} />
      </TableCell>
      <TableCell className="text-end">
        <ItemActions item={item} cafeId={cafeId} categories={categories} />
      </TableCell>
    </TableRow>
  );
}
