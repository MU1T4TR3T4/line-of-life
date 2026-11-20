"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useState } from "react";
import type { Moment } from "@/lib/types";
import { ageLabel, parseDate } from "@/lib/dates";
import { PhotoArt } from "./PhotoArt";

interface Props {
  m: Moment;
  size: number;
  tilt: number;
  /** Balanço compartilhado: a linha passa rápido e as polaroids balançam */
  swing: MotionValue<number>;
  hangFrom: "top" | "bottom";
  dimmed?: boolean;
  highlighted?: boolean;
  onOpen: (id: string) => void;
}

/** Polaroid do Rio da vida: balança com o movimento e inclina em 3D sob o mouse. */
export function Polaroid({ m, size, tilt, swing, hangFrom, dimmed, highlighted, onOpen }: Props) {
  const [hovered, setHovered] = useState(false);
  const hover = useMotionValue(0);
  const h = useSpring(hover, { stiffness: 260, damping: 22 });
  const rotate = useTransform([swing, h], ([s, hv]: number[]) => (tilt + s * (hangFrom === "top" ? 1 : -1)) * (1 - hv));

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [11, -11]), { stiffness: 220, damping: 18 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-13, 13]), { stiffness: 220, damping: 18 });
  const gx = useTransform(px, [0, 1], [10, 90]);
  const gy = useTransform(py, [0, 1], [5, 80]);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,.5), rgba(255,255,255,0) 55%)`;

  const d = parseDate(m.date);

  return (
    <motion.div
      className="pola-hang"
      style={{ rotate, transformOrigin: hangFrom === "top" ? "50% 0%" : "50% 100%", zIndex: hovered ? 30 : undefined }}
      animate={{ opacity: dimmed ? 0.14 : 1, filter: dimmed ? "grayscale(1)" : "grayscale(0)" }}
    >
      <motion.button
        type="button"
        className={`pola${m.milestone ? " is-marco" : ""}${highlighted ? " is-lit" : ""}`}
        style={{ width: size, rotateX, rotateY, transformPerspective: 900 }}
        whileHover={{ scale: 1.12, y: hangFrom === "top" ? 6 : -6 }}
        whileTap={{ scale: 1.04 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onPointerEnter={() => {
          setHovered(true);
          hover.set(1);
        }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          setHovered(false);
          hover.set(0);
          px.set(0.5);
          py.set(0.5);
        }}
        onClick={() => onOpen(m.id)}
        tabIndex={dimmed ? -1 : 0}
        aria-label={`${m.caption}, ${ageLabel(d)}`}
      >
        {m.milestone && <span className="tape" aria-hidden />}
        <motion.div className="pola-photo" layoutId={`photo-${m.id}`}>
          <PhotoArt m={m} />
          {m.type === "video" && m.url && hovered && (
            <video className="art art-img" src={m.url} muted autoPlay loop playsInline />
          )}
        </motion.div>
        <div className="pola-cap">{m.caption}</div>
        <div className="pola-age">{ageLabel(d)}</div>
        <motion.span className="glare" style={{ background: glare, opacity: hovered ? 1 : 0 }} aria-hidden />
      </motion.button>
    </motion.div>
  );
}
