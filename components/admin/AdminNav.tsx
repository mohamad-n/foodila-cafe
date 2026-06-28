"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/");
}

/** Desktop inline nav links (hidden below md). Use as a standalone header row, or inside `AdminNav`. */
export function AdminNavLinks({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();
  return (
    <nav className="hidden items-center gap-1 text-sm md:flex">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={cn(
            "rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground",
            isActive(it.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground",
          )}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

/** Mobile hamburger → Sheet nav (hidden at md+). */
export function AdminNavMobile({ items, title }: { items: NavItem[]; title: string }) {
  const [open, setOpen] = React.useState(false);
  const isActive = useIsActive();
  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="باز کردن منوی ناوبری">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <nav className="mt-4 flex flex-col gap-1">
            {items.map((it) => (
              <SheetClose asChild key={it.href}>
                <Link
                  href={it.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive(it.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  )}
                >
                  {it.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Single-row admin nav: desktop inline links + mobile hamburger together. Used by the platform
 * header. (The café header places the two pieces on separate rows.)
 */
export function AdminNav({ items, title }: { items: NavItem[]; title: string }) {
  return (
    <>
      <AdminNavLinks items={items} />
      <AdminNavMobile items={items} title={title} />
    </>
  );
}
