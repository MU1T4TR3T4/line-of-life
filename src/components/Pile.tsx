"use client";

import { motion, type MotionValue } from "motion/react";
import { useState } from "react";
import type { Moment } from "@/lib/types";
import { Polaroid } from "./Polaroid";

interface Props {
  items: Moment[];
  size: number;
  swing: MotionValue<number>;
  hangFrom: "top" | "bottom";
  baseTilt: number;
  isDimmed: (m: Moment) => boolean;
  highlightId: string | null;
  onOpen: (id: string) => void;
}

/** Várias fotos próximas viram uma pilha; ao passar o mouse, a pilha abre em leque. */
export function Pile({ items, size, swing, hangFrom, baseTilt, isDimmed, highlightId, onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const shown = items.slice(0, open ? 7 : 3);
  const n = shown.length;
  const extra = items.length - shown.length;

  if (items.length === 1) {
    const m = items[0];
    return (
      <Polaroid m={m} size={size} tilt={baseTilt} swing={swing} hangFrom={hangFrom} dimmed={isDimmed(m)} highlighted={highlightId === m.id} onOpen={onOpen} />
    );
  }

  return (
    <div
      className="pile"
      style={{ width: size, zIndex: open ? 40 : undefined }}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      {shown
        .map((m, i) => {
          const c = i - (n - 1) / 2;
          return (
            <motion.div
              key={m.id}
              className={`pile-item${i === 0 ? " first" : ""}`}
              style={{ zIndex: n - i }}
              initial={false}
              animate={
                open
                  ? { x: c * size * 0.86, y: Math.abs(c) * 10 * (hangFrom === "top" ? 1 : -1), rotate: c * 4 }
                  : { x: i * 7, y: i * -4 * (hangFrom === "top" ? -1 : 1), rotate: (i % 2 ? 1 : -1) * (3 + i * 2) }
              }
              transition={{ type: "spring", stiffness: 260, damping: 24, delay: open ? i * 0.03 : 0 }}
            >
              <Polaroid
                m={m}
                size={size}
                tilt={i === 0 ? baseTilt : 0}
                swing={swing}
                hangFrom={hangFrom}
                dimmed={isDimmed(m)}
                highlighted={highlightId === m.id}
                onOpen={onOpen}
              />
            </motion.div>
          );
        })
        .reverse()}
      {!open && <span className="pile-count">{items.length} fotos</span>}
      {open && extra > 0 && <span className="pile-count">+{extra}</span>}
    </div>
  );
}
