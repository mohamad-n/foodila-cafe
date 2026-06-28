"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { faNum, faToman } from "../core/faNum";
import { MenuPhoto } from "../core/MenuPhoto";
import { DetailSheet } from "../core/DetailSheet";
import type { MenuItem, MenuTemplateProps } from "../types";

/** WARM (Étude 1): sticky category pills + vertical photo-card feed + bottom-sheet detail. */
export default function Warm({ cafe, categories }: MenuTemplateProps) {
  const [cat, setCat] = useState(0);
  const [active, setActive] = useState<MenuItem | null>(null);

  return (
    <div className="warm">
      <header className="w-top">
        <div className="menu-head">
          <div className="w-brand">{cafe.name}</div>
          {cafe.logoSrc ? (
            <img className="menu-logo" src={cafe.logoSrc} alt={cafe.name} />
          ) : null}
        </div>
        <div className="w-pills">
          {categories.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={cn("w-pill", i === cat && "on")}
              aria-current={i === cat}
              onClick={() => setCat(i)}
            >
              {c.name.fa}
            </button>
          ))}
        </div>
      </header>

      {/* Every category stays mounted (hidden when inactive) so images load once, no re-flash on switch. */}
      <main className="w-main">
        {categories.map((c, ci) => (
          <div key={c.id} className="w-feed" hidden={ci !== cat}>
            {c.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn("w-card", !item.isAvailable && "na")}
                onClick={() => setActive(item)}
              >
                <div className="w-card-img">
                  {item.images[0] ? (
                    <MenuPhoto
                      image={item.images[0]}
                      alt={item.name.fa}
                      sizes="(max-width:520px) 100vw, 520px"
                    />
                  ) : (
                    <div className="ph" />
                  )}
                </div>
                <div className="w-card-body">
                  <h3>{item.name.fa}</h3>
                  {item.ingredients.length > 0 ? <p>{item.ingredients.join(" · ")}</p> : null}
                  <div className="w-meta">
                    {typeof item.price === "number" ? (
                      <span className="w-price">{faToman(item.price)}</span>
                    ) : null}
                    {typeof item.calories === "number" ? (
                      <span>{faNum(item.calories)} کالری</span>
                    ) : null}
                    {!item.isAvailable ? <span className="w-na">ناموجود</span> : null}
                  </div>
                </div>
              </button>
            ))}
            {c.items.length === 0 ? <p className="empty">موردی برای نمایش نیست.</p> : null}
          </div>
        ))}
      </main>

      {active ? <DetailSheet item={active} onClose={() => setActive(null)} /> : null}
    </div>
  );
}
