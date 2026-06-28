"use client";

import { useEffect, useRef } from "react";
import { DrawerHeader } from "./DrawerHeader";
import { ItemDetailContent } from "./ItemDetailContent";
import type { MenuItem } from "../types";

/** Bottom-sheet shell wrapping the shared detail body. Used by the Warm & Scandi templates. */
export function DetailSheet({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    closeRef.current?.focus(); // move keyboard focus into the overlay
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={item.name.fa}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <DrawerHeader ref={closeRef} onClose={onClose} panelRef={panelRef} />
        <div className="sheet-body">
          <ItemDetailContent item={item} />
        </div>
      </div>
    </div>
  );
}
