"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { faNum, faToman } from "../core/faNum";
import { MenuPhoto } from "../core/MenuPhoto";
import { ItemDetailContent } from "../core/ItemDetailContent";
import { DrawerHeader } from "../core/DrawerHeader";
import type { MenuItem, MenuTemplateProps } from "../types";

/** EDITORIAL (Étude 3): chips + full-bleed vertical snap feed + slide-up takeover detail. */
export default function Editorial({ cafe, categories }: MenuTemplateProps) {
  const [cat, setCat] = useState(0);
  const [active, setActive] = useState<MenuItem | null>(null);
  const [open, setOpen] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const takeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0 });
  }, [cat]);

  useEffect(() => {
    if (open) closeRef.current?.focus(); // keyboard focus into the takeover
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function openItem(item: MenuItem) {
    setActive(item);
    requestAnimationFrame(() => setOpen(true));
  }
  function close() {
    setOpen(false);
    window.setTimeout(() => setActive(null), 350);
  }

  return (
    <>
      <div className="top">
        <div className="brand">
          <span className="n">{cafe.name}</span>
          {cafe.logoSrc ? (
            <img className="menu-logo" src={cafe.logoSrc} alt={cafe.name} />
          ) : null}
        </div>
        <div className="chips">
          {categories.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              aria-current={i === cat}
              onClick={() => setCat(i)}
            >
              {c.name.fa}
            </button>
          ))}
        </div>
      </div>

      {/* Every category stays mounted (hidden when inactive) so photos load once and never re-flash
          when you switch chips and come back. */}
      <div className="feed" ref={feedRef}>
        {categories.map((c, ci) => (
          <div key={c.id} className="ed-cat" hidden={ci !== cat}>
            {c.items.map((item, i) => (
              <section className="slideItem" key={item.id} onClick={() => openItem(item)}>
                <div className="bgimg">
                  {item.images[0] ? (
                    <MenuPhoto image={item.images[0]} alt={item.name.fa} sizes="100vw" />
                  ) : (
                    <div className="ph" />
                  )}
                </div>
                <div className="scrim" />
                <div className="num">{faNum(String(i + 1).padStart(2, "0"))}</div>
                <div className="meta">
                  <div className="cat-eyebrow">{c.name.fa}</div>
                  <h2>{item.name.fa}</h2>
                  {item.ingredients.length > 0 ? (
                    <p className="ing">{item.ingredients.join(" · ")}</p>
                  ) : null}
                  <div className="rowmeta">
                    {typeof item.price === "number" ? (
                      <span className="pill pill-price">{faToman(item.price)}</span>
                    ) : null}
                    {typeof item.calories === "number" ? (
                      <span className="pill">
                        <span className="g">●</span> {faNum(item.calories)} کالری
                      </span>
                    ) : null}
                    {!item.isAvailable ? <span className="pill">ناموجود</span> : null}
                  </div>
                  <button
                    type="button"
                    className="cta"
                    onClick={(e) => {
                      e.stopPropagation();
                      openItem(item);
                    }}
                  >
                    مشاهدهٔ جزئیات ←
                  </button>
                </div>
                <div className="hairline" />
                {i === 0 ? (
                  <div className="scrollhint">برای دیدن موارد بعدی بکشید ↑</div>
                ) : null}
              </section>
            ))}
            {c.items.length === 0 ? (
              <div className="empty">موردی برای نمایش نیست.</div>
            ) : null}
          </div>
        ))}
      </div>

      {active ? (
        <div
          className={cn("take", open && "on")}
          role="dialog"
          aria-modal="true"
          aria-label={active.name.fa}
          ref={takeRef}
        >
          <DrawerHeader ref={closeRef} onClose={close} panelRef={takeRef} />
          <div className="tpad">
            <ItemDetailContent item={active} />
          </div>
        </div>
      ) : null}
    </>
  );
}
