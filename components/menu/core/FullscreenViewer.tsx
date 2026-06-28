"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { faNum } from "./faNum";
import { MenuPhoto } from "./MenuPhoto";
import type { MenuImage } from "../types";

/** Fullscreen image viewer: swipe + dots + count + close (Esc / button). object-fit: contain. */
export function FullscreenViewer({
  images,
  alt,
  startIndex,
  onClose,
}: {
  images: MenuImage[];
  alt: string;
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const idxRef = useRef(startIndex);
  const drag = useRef({ active: false, startX: 0, dx: 0, width: 0 });
  const single = images.length <= 1; // one image: no swiping

  function go(to: number, animate = true) {
    const width = wrapRef.current?.clientWidth ?? 0;
    const next = Math.max(0, Math.min(images.length - 1, to));
    idxRef.current = next;
    if (trackRef.current) {
      trackRef.current.style.transition = animate
        ? "transform .3s cubic-bezier(.22,1,.36,1)"
        : "none";
      trackRef.current.style.transform = `translateX(${-next * width}px)`;
    }
    setIdx(next);
  }

  useEffect(() => {
    go(startIndex, false);
    const onResize = () => go(idxRef.current, false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus(); // move keyboard focus into the fullscreen overlay
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (single) return; // nothing to swipe to
    drag.current = { active: true, startX: e.clientX, dx: 0, width: wrapRef.current?.clientWidth ?? 0 };
    if (trackRef.current) trackRef.current.style.transition = "none";
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d.active) return;
    d.dx = e.clientX - d.startX;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${-idxRef.current * d.width + d.dx}px)`;
    }
  }
  function onPointerUp() {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (Math.abs(d.dx) > d.width * 0.15) go(idxRef.current + (d.dx < 0 ? 1 : -1));
    else go(idxRef.current);
  }

  return (
    <div
      className="fs on"
      ref={wrapRef}
      role="dialog"
      aria-modal="true"
      aria-label="نمایش تمام‌صفحهٔ تصویر"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <button type="button" ref={closeRef} className="fs-close" aria-label="بستن" onClick={onClose}>
        ✕
      </button>
      <div className="fs-count">
        {faNum(idx + 1)} / {faNum(images.length)}
      </div>
      <div className="track" dir="ltr" ref={trackRef}>
        {images.map((image, i) => (
          <div className="slide" key={i}>
            <MenuPhoto image={image} alt={alt} sizes="100vw" />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <div className="dots">
          {images.map((_, i) => (
            <span key={i} className={cn("pd", i === idx && "on")} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
