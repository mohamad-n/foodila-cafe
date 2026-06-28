"use client";

import { useRef } from "react";
import type { PointerEvent, RefObject } from "react";

const CLOSE_THRESHOLD = 110; // px dragged down before the drawer dismisses

/**
 * Bottom-sheet style "drag the header down to dismiss" gesture. Returns pointer handlers to
 * spread on the drawer header; while dragging it translates `panelRef` down, then either closes
 * (past the threshold) or snaps back. Shared by every detail-drawer shell.
 */
export function useSwipeDownToClose(panelRef: RefObject<HTMLDivElement | null>, onClose: () => void) {
  const drag = useRef({ active: false, startY: 0, dy: 0 });

  function onPointerDown(e: PointerEvent) {
    drag.current = { active: true, startY: e.clientY, dy: 0 };
    // Capture so the drag keeps tracking once the finger leaves the small header strip.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const el = panelRef.current;
    if (el) el.style.transition = "none";
  }

  function onPointerMove(e: PointerEvent) {
    const d = drag.current;
    if (!d.active) return;
    d.dy = Math.max(0, e.clientY - d.startY);
    const el = panelRef.current;
    if (el) el.style.transform = `translateY(${d.dy}px)`;
  }

  function end() {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    const el = panelRef.current;
    if (d.dy > CLOSE_THRESHOLD) {
      // Hand off to the shell's own close (it may run a slide-out animation).
      if (el) {
        el.style.transition = "";
        el.style.transform = "";
      }
      onClose();
    } else if (el) {
      el.style.transition = "transform .25s cubic-bezier(.22,1,.36,1)";
      el.style.transform = "";
    }
  }

  return { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end };
}
