"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MenuPhoto } from "./MenuPhoto";
import type { MenuImage } from "../types";

/**
 * Swipeable carousel ported from the reference: pointer-drag with snap, dots, fullscreen button.
 * The track is forced dir="ltr" so translateX math stays correct under the RTL document.
 */
export function ImageCarousel({
  images,
  alt,
  onFullscreen,
}: {
  images: MenuImage[];
  alt: string;
  onFullscreen: (index: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const carRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(0);
  const drag = useRef({ active: false, startX: 0, dx: 0, width: 0 });
  const single = images.length <= 1; // one image: no sliding (still allow fullscreen)

  function go(to: number, animate = true) {
    const width = carRef.current?.clientWidth ?? 0;
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
    go(0, false);
    const onResize = () => go(idxRef.current, false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (single) return; // nothing to slide to
    drag.current = { active: true, startX: e.clientX, dx: 0, width: carRef.current?.clientWidth ?? 0 };
    if (trackRef.current) trackRef.current.style.transition = "none";
    carRef.current?.setPointerCapture(e.pointerId);
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
    if (Math.abs(d.dx) > d.width * 0.18) go(idxRef.current + (d.dx < 0 ? 1 : -1));
    else go(idxRef.current);
  }

  return (
    <div
      className="car"
      ref={carRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="track" dir="ltr" ref={trackRef}>
        {images.map((image, i) => (
          <div className="slide" key={i}>
            <MenuPhoto image={image} alt={alt} sizes="(max-width: 520px) 100vw, 520px" />
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
      <button
        type="button"
        className="fs-btn"
        aria-label="نمایش تمام‌صفحه"
        onClick={(e) => {
          e.stopPropagation();
          onFullscreen(idx);
        }}
      >
        ⛶
      </button>
    </div>
  );
}
