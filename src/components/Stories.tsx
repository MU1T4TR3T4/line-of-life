"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Moment } from "@/lib/types";
import { ageLabel, formatLong, parseDate } from "@/lib/dates";
import { PhotoArt } from "./PhotoArt";

const DURATION = 4200;

/** Modo histórias: as fotos de um capítulo em tela cheia, uma por vez. */
export function Stories({ items, onClose }: { items: Moment[]; onClose: () => void; onOpen?: (id: string) => void }) {
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const paused = useRef(false);
  const downAt = useRef(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let p = 0;
    const tick = (now: number) => {
      if (!paused.current) p += (now - last) / DURATION;
      last = now;
      if (p >= 1) {
        p = 0;
        setI((v) => {
          if (v + 1 >= items.length) {
            onClose();
            return v;
          }
          return v + 1;
        });
      }
      setProgress(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i, items.length, onClose]);

  const m = items[i];
  const d = parseDate(m.date);

  return (
    <motion.div
      className="stories"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.6 }}
      onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Histórias"
    >
      <div className="st-bars">
        {items.map((it, k) => (
          <span key={it.id}>
            <i style={{ width: `${k < i ? 100 : k === i ? progress * 100 : 0}%` }} />
          </span>
        ))}
      </div>
      <button type="button" className="st-close" onClick={onClose} aria-label="Fechar">
        ✕
      </button>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={m.id}
          className="st-photo"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1.0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div className="st-kb" initial={{ scale: 1 }} animate={{ scale: 1.1 }} transition={{ duration: DURATION / 1000, ease: "linear" }}>
            <PhotoArt m={m} big />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div className="st-text">
        <div className="st-age">{ageLabel(d)}</div>
        <div className="st-cap">{m.caption}</div>
        <div className="st-date">{formatLong(d)}</div>
      </div>
      <div
        className="st-tap"
        onPointerDown={() => {
          paused.current = true;
          downAt.current = Date.now();
        }}
        onPointerUp={(e) => {
          paused.current = false;
          if (Date.now() - downAt.current > 250) return;
          const r = e.currentTarget.getBoundingClientRect();
          const left = e.clientX - r.left < r.width / 3;
          if (left) setI((v) => Math.max(0, v - 1));
          else if (i + 1 < items.length) setI(i + 1);
          else onClose();
        }}
        onPointerCancel={() => (paused.current = false)}
      />
    </motion.div>
  );
}
