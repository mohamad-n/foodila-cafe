"use client";

import * as React from "react";
import type { RefObject } from "react";
import { useSwipeDownToClose } from "./useSwipeDownToClose";

/**
 * Shared detail-drawer header: a sticky, opaque strip that always sits above the hero image
 * (own stacking context) and holds the close button. Dragging it down dismisses the drawer
 * (swipe-to-close). Used by both the Editorial takeover and the Warm/Scandi bottom sheet.
 *
 * forwardRef points at the close button so a shell can move keyboard focus onto it on open.
 */
export const DrawerHeader = React.forwardRef<
  HTMLButtonElement,
  { onClose: () => void; panelRef: RefObject<HTMLDivElement | null> }
>(function DrawerHeader({ onClose, panelRef }, ref) {
  const swipe = useSwipeDownToClose(panelRef, onClose);
  return (
    <div className="drawer-head" {...swipe}>
      <span className="drawer-grab" aria-hidden="true" />
      <button type="button" ref={ref} className="drawer-close" aria-label="بستن" onClick={onClose}>
        ✕
      </button>
    </div>
  );
});
