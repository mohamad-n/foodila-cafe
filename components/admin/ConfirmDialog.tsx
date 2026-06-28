"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

/**
 * Destructive-action confirm. Wraps a trigger in an `AlertDialog`; on confirm it runs
 * `onConfirm` in a transition, toasts the outcome, and closes. `onConfirm` returns the
 * Server Action's `ActionResult` (or void) — the server stays authoritative.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "حذف",
  successMessage = "انجام شد.",
  destructive = true,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  successMessage?: string;
  /** Red confirm button + destructive framing. Set false for non-destructive confirms (e.g. seeding). */
  destructive?: boolean;
  onConfirm: () => Promise<ActionResult | void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function run() {
    startTransition(async () => {
      try {
        const res = await onConfirm();
        if (res && res.ok === false) {
          toast.error(res.error ?? "خطا رخ داد.");
          return;
        }
        toast.success(successMessage);
        setOpen(false);
      } catch {
        toast.error("خطا رخ داد.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>انصراف</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              run();
            }}
            className={cn(
              destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
