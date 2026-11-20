"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Moment } from "@/lib/types";
import { ageLabel, chapterOf, parseDate, type Chapter } from "@/lib/dates";
import { CHILD } from "@/config";
import { PhotoArt } from "./PhotoArt";
import { Stories } from "./Stories";

interface Props {
  moments: Moment[];
  onOpen: (id: string) => void;
}

function tiltOf(id: string) {
  let h = 0;
  for (const c of id) h = (h * 17 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 7) - 3) * 0.9;
}

const vibrate = (ms: number) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* sem vibração */
  }
};

/** Álbum de capítulos: a linha do tempo vertical para o celular. */
export function Album({ moments, onOpen }: Props) {
  const reduce = useReducedMotion();
  const chapters = useMemo(() => {
    const sorted = [...moments].sort((a, b) => a.date.localeCompare(b.date));
    const list: { ch: Chapter; items: Moment[] }[] = [];
    for (const m of sorted) {
      const ch = chapterOf(parseDate(m.date));
      const last = list[list.length - 1];
      if (last && last.ch.key === ch.key) last.items.push(m);
      else list.push({ ch, items: [m] });
    }
    return list;
  }, [moments]);

  const [active, setActive] = useState(chapters[0]?.ch.key);
  const [story, setStory] = useState<Moment[] | null>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const key = (e.target as HTMLElement).dataset.key!;
            setActive((prev) => {
              if (prev !== key) vibrate(8);
              return key;
            });
          }
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    Object.values(refs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [chapters]);

  const jumpTo = (key: string) => {
    refs.current[key]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  /* índice lateral: deslizar o dedo pula de capítulo */
  const indexRef = useRef<HTMLDivElement>(null);
  const scrub = (clientY: number) => {
    const el = indexRef.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-key]"));
    const hit = items.find((it) => {
      const r = it.getBoundingClientRect();
      return clientY >= r.top && clientY <= r.bottom;
    });
    if (hit && hit.dataset.key !== active) {
      refs.current[hit.dataset.key!]?.scrollIntoView({ behavior: "auto", block: "start" });
    }
  };

  return (
    <div className="album">
      <header className="album-top">
        <div className="album-name">{CHILD.name}</div>
        <p className="album-sub">do primeiro ultrassom até hoje · {moments.length} momentos</p>
      </header>

      {chapters.map(({ ch, items }) => (
        <section
          key={ch.key}
          data-key={ch.key}
          ref={(el) => {
            refs.current[ch.key] = el;
          }}
          className={`chapter${ch.night ? " night" : ""}`}
        >
          <div className="chapter-head">
            <div>
              <h2 className="chapter-title">{ch.title}</h2>
              <div className="chapter-sub">{ch.subtitle}</div>
            </div>
            <button type="button" className="story-btn" onClick={() => setStory(items)}>
              ▶ história
            </button>
          </div>
          <div className="chapter-grid">
            {items.map((m) => {
              const t = tiltOf(m.id);
              return (
                <motion.button
                  key={m.id}
                  type="button"
                  className={`pola mobile${m.milestone ? " is-marco wide" : ""}`}
                  initial={reduce ? false : { opacity: 0, y: -48, rotate: t * 5, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, rotate: t, scale: 1 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ type: "spring", stiffness: 180, damping: 16 }}
                  whileTap={{ scale: 0.96, rotate: 0 }}
                  onClick={() => onOpen(m.id)}
                  aria-label={`${m.caption}, ${ageLabel(parseDate(m.date))}`}
                >
                  {m.milestone && <span className="tape" aria-hidden />}
                  <motion.div className="pola-photo" layoutId={`photo-${m.id}`}>
                    <PhotoArt m={m} />
                  </motion.div>
                  <div className="pola-cap">{m.caption}</div>
                  <div className="pola-age">{ageLabel(parseDate(m.date))}</div>
                </motion.button>
              );
            })}
          </div>
        </section>
      ))}

      <footer className="album-end">até aqui · continua amanhã</footer>

      <nav
        className="album-index"
        ref={indexRef}
        aria-label="Capítulos"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          scrub(e.clientY);
        }}
        onPointerMove={(e) => e.buttons && scrub(e.clientY)}
      >
        {chapters.map(({ ch }) => (
          <button key={ch.key} type="button" data-key={ch.key} aria-current={active === ch.key} onClick={() => jumpTo(ch.key)}>
            {ch.short}
          </button>
        ))}
      </nav>

      {story && <Stories items={story} onClose={() => setStory(null)} onOpen={onOpen} />}
    </div>
  );
}
