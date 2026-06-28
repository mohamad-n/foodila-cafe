"use client";

import { useState } from "react";
import { faNum, faToman } from "./faNum";
import { ImageCarousel } from "./ImageCarousel";
import { FullscreenViewer } from "./FullscreenViewer";
import type { MenuItem } from "../types";

/**
 * Shared item-detail body used by every template's shell (takeover / sheet). Owns the carousel +
 * fullscreen; templates never re-implement these.
 */
export function ItemDetailContent({ item }: { item: MenuItem }) {
  const [fsStart, setFsStart] = useState<number | null>(null);

  return (
    <div className="detail">
      {item.images.length > 0 ? (
        <ImageCarousel images={item.images} alt={item.name.fa} onFullscreen={setFsStart} />
      ) : null}

      <div className="detail-head">
        <h1 className="detail-title">{item.name.fa}</h1>
        {typeof item.price === "number" ? (
          <span className="badge badge-price">{faToman(item.price)}</span>
        ) : null}
      </div>

      {typeof item.calories === "number" || item.images.length > 1 || !item.isAvailable ? (
        <div className="badges">
          {typeof item.calories === "number" ? (
            <span className="badge">
              <span className="g">●</span> {faNum(item.calories)} کالری
            </span>
          ) : null}
          {/* image-count tag only when there's more than one image */}
          {item.images.length > 1 ? (
            <span className="badge">{faNum(item.images.length)} تصویر</span>
          ) : null}
          {!item.isAvailable ? <span className="badge">ناموجود</span> : null}
        </div>
      ) : null}

      {item.description?.fa ? <p className="detail-desc">{item.description.fa}</p> : null}

      {item.ingredients.length > 0 ? (
        <>
          <p className="lbl">ترکیبات</p>
          <p className="ings">{item.ingredients.join(" - ")}</p>
        </>
      ) : null}

      {fsStart !== null ? (
        <FullscreenViewer
          images={item.images}
          alt={item.name.fa}
          startIndex={fsStart}
          onClose={() => setFsStart(null)}
        />
      ) : null}
    </div>
  );
}
