"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { faNum, faToman } from "../core/faNum";
import { MenuPhoto } from "../core/MenuPhoto";
import { DetailSheet } from "../core/DetailSheet";
import type { MenuItem, MenuTemplateProps } from "../types";

/** SCANDI (Étude 2): sticky tab bar + 2-col grid + bottom-sheet detail. White, airy, minimal. */
export default function Scandi({ cafe, categories }: MenuTemplateProps) {
  const [cat, setCat] = useState(0);
  const [active, setActive] = useState<MenuItem | null>(null);
  const current = categories[cat];

  return (
    <div className="scandi">
      <header className="s-top">
        <div className="menu-head">
          <div className="s-brand">{cafe.name}</div>
          {cafe.logoSrc ? (
            <img className="menu-logo" src={cafe.logoSrc} alt={cafe.name} />
          ) : null}
        </div>
        <div className="s-tabs">
          {categories.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={cn("s-tab", i === cat && "on")}
              aria-current={i === cat}
              onClick={() => setCat(i)}
            >
              {c.name.fa}
            </button>
          ))}
        </div>
      </header>

      <main className="s-grid">
        {current?.items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn("s-card", !item.isAvailable && "na")}
            onClick={() => setActive(item)}
          >
            <div className="s-card-img">
              {item.images[0] ? (
                <MenuPhoto image={item.images[0]} alt={item.name.fa} sizes="(max-width:520px) 50vw, 260px" />
              ) : (
                <div className="ph" />
              )}
            </div>
            <h3>{item.name.fa}</h3>
            {typeof item.price === "number" ? (
              <span className="s-price">{faToman(item.price)}</span>
            ) : null}
            {typeof item.calories === "number" ? (
              <span className="s-cal">{faNum(item.calories)} کالری</span>
            ) : null}
            {!item.isAvailable ? <span className="s-na">ناموجود</span> : null}
          </button>
        ))}
        {!current || current.items.length === 0 ? (
          <p className="empty">موردی برای نمایش نیست.</p>
        ) : null}
      </main>

      {active ? <DetailSheet item={active} onClose={() => setActive(null)} /> : null}
    </div>
  );
}
