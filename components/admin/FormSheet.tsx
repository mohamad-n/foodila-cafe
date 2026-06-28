"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Standard admin entry-form drawer. Side `Sheet` (inline-end edge → `side="left"` under dir="rtl");
 * the form renders via a render-prop that receives a `close()` to call on success. Full-screen on
 * phones, panel on ≥sm.
 *
 * Two modes: pass a `trigger` for the usual self-managed open, OR control it with `open` +
 * `onOpenChange` (e.g. to open it from a dropdown item that isn't a Sheet trigger).
 */
export function FormSheet({
  trigger,
  title,
  description,
  children,
  open: openProp,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: (close: () => void) => React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [openState, setOpenState] = React.useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;
  const setOpen = (next: boolean) => (isControlled ? onOpenChange?.(next) : setOpenState(next));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SheetContent side="left" className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="mt-2 flex-1 overflow-y-auto px-1 pb-2">{children(() => setOpen(false))}</div>
      </SheetContent>
    </Sheet>
  );
}
