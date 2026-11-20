"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Moment } from "@/lib/types";
import { ageLabel, formatLong, parseDate } from "@/lib/dates";
import { HeartIcon, PhotoArt } from "./PhotoArt";

const SOURCE: Record<Moment["dateSource"], string> = {
  exif: "Data lida da própria foto",
  "nome-do-arquivo": "Data tirada do nome do arquivo",
  gestacao: "Data calculada pela semana de gestação",
  manual: "Data ajustada à mão",
  arquivo: "Data do arquivo no Drive (confira se está certa)",
};

interface Props {
  moments: Moment[];
  openId: string | null;
  onChange: (id: string | null) => void;
}

/** Foto aberta: cresce a partir da polaroid, desliza para os lados e fecha puxando para baixo. */
export function Lightbox({ moments, openId, onChange }: Props) {
  const idx = openId ? moments.findIndex((m) => m.id === openId) : -1;
  const m = idx >= 0 ? moments[idx] : null;
  const [dir, setDir] = useState(0);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [bursts, setBursts] = useState<number[]>([]);
  const lastTap = useRef(0);

  const go = (d: 1 | -1) => {
    if (idx < 0) return;
    const n = (idx + d + moments.length) % moments.length;
    setDir(d);
    onChange(moments[n].id);
  };

  const like = () => {
    if (!m) return;
    setLikes((l) => ({ ...l, [m.id]: (l[m.id] ?? 0) + 1 }));
    const k = Date.now();
    setBursts((b) => [...b, k]);
    setTimeout(() => setBursts((b) => b.filter((x) => x !== k)), 900);
  };

  useEffect(() => {
    if (!m) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key.toLowerCase() === "l") like();
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  return (
    <AnimatePresence>
      {m && (
        <motion.div
          className="lb"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onChange(null)}
          role="dialog"
          aria-modal="true"
          aria-label={m.caption}
        >
          <motion.div
            key={m.id}
            className="lb-card"
            custom={dir}
            initial={dir ? { x: dir * 120, opacity: 0, rotate: dir * 4 } : false}
            animate={{ x: 0, opacity: 1, rotate: -1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            drag
            dragSnapToOrigin
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (info.offset.y > 140) onChange(null);
              else if (info.offset.x < -90) go(1);
              else if (info.offset.x > 90) go(-1);
            }}
          >
            <motion.div
              className="lb-photo"
              layoutId={`photo-${m.id}`}
              onClick={() => {
                const now = Date.now();
                if (now - lastTap.current < 300) like();
                lastTap.current = now;
              }}
            >
              {m.type === "video" && m.url ? (
                <video className="art art-img" src={m.url} controls autoPlay playsInline />
              ) : (
                <PhotoArt m={m} big />
              )}
              <AnimatePresence>
                {bursts.map((k) => (
                  <motion.span
                    key={k}
                    className="burst"
                    initial={{ scale: 0.2, opacity: 0.9 }}
                    animate={{ scale: 1.6, opacity: 0, y: -40 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <HeartIcon filled />
                  </motion.span>
                ))}
              </AnimatePresence>
            </motion.div>
            <div className="lb-meta">
              <div className="lb-age">{ageLabel(parseDate(m.date))}</div>
              <h2 className="lb-cap">{m.caption}</h2>
              <div className="lb-date">
                {formatLong(parseDate(m.date))}
                {m.place ? ` · ${m.place}` : ""}
              </div>
              <div className="lb-src">
                {SOURCE[m.dateSource]}
                {m.type === "video" && !m.url ? " · vídeo de exemplo" : ""}
              </div>
            </div>
            <div className="lb-actions">
              <button type="button" className="lb-btn" onClick={() => go(-1)} aria-label="Anterior">
                ←
              </button>
              <button type="button" className="lb-btn heart" onClick={like} aria-label="Curtir">
                <HeartIcon filled={!!likes[m.id]} /> {likes[m.id] ? likes[m.id] : ""}
              </button>
              <span className="lb-count">
                {idx + 1} de {moments.length}
              </span>
              <button type="button" className="lb-btn" onClick={() => onChange(null)} aria-label="Fechar">
                ✕
              </button>
              <button type="button" className="lb-btn" onClick={() => go(1)} aria-label="Próximo">
                →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
