"use client";

import {
  animate,
  motion,
  transform,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type AnimationPlaybackControls,
} from "motion/react";
import confetti from "canvas-confetti";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Moment } from "@/lib/types";
import { BIRTH, DAY, ageSentence, daysBetween, formatMonth, formatMonthShort, parseDate } from "@/lib/dates";
import { CHILD } from "@/config";
import { Pile } from "./Pile";

type Filter = "tudo" | "marcos" | "fotos" | "videos" | "ultrassom";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "tudo", label: "Tudo" },
  { key: "marcos", label: "Marcos" },
  { key: "fotos", label: "Fotos" },
  { key: "videos", label: "Vídeos" },
  { key: "ultrassom", label: "Ultrassom" },
];

const MIN_SCALE = 0.35;
const MAX_SCALE = 7;
const GAP = 26;

interface PileT {
  x: number;
  side: "up" | "down";
  items: Moment[];
  tilt: number;
}

function hashTilt(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 90) / 10 - 4.5) * 0.9;
}

const clamp = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v));

interface Props {
  moments: Moment[];
  onOpen: (id: string) => void;
  paused: boolean;
}

/** Rio da vida: a linha do tempo horizontal para telas grandes. */
export function River({ moments, onOpen, paused }: Props) {
  const reduce = useReducedMotion();
  const [vp, setVp] = useState({ w: 1280, h: 800, ok: false });
  const [scale, setScale] = useState(1.5);
  const [filter, setFilter] = useState<Filter>("tudo");
  const [hud, setHud] = useState({ line: "", month: "" });
  const [filming, setFilming] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useLayoutEffect(() => {
    const f = () => setVp({ w: window.innerWidth, h: window.innerHeight, ok: true });
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  /* ---------- geometria ---------- */
  const sorted = useMemo(() => [...moments].sort((a, b) => a.date.localeCompare(b.date)), [moments]);
  const today = useMemo(() => new Date(), []);
  const start = useMemo(() => new Date(parseDate(sorted[0].date).getTime() - 25 * DAY), [sorted]);
  const end = useMemo(() => {
    const last = parseDate(sorted[sorted.length - 1].date);
    return new Date(Math.max(today.getTime(), last.getTime()) + 35 * DAY);
  }, [sorted, today]);

  const PAD = vp.w / 2;
  const X = useCallback((d: Date) => PAD + daysBetween(start, d) * scale, [PAD, start, scale]);
  const W = X(end) + PAD;
  const riverY = Math.round(vp.h * 0.53);
  const size = clamp(108, Math.round((vp.h * 0.5 - 150) * 0.8), 178);
  const waveY = useCallback((x: number) => riverY + 12 * Math.sin(x / 240), [riverY]);
  const Xb = X(BIRTH);

  const piles = useMemo<PileT[]>(() => {
    const out: PileT[] = [];
    const lastRight = { up: -1e9, down: -1e9 };
    const lastPile: Record<"up" | "down", PileT | null> = { up: null, down: null };
    let prefer: "up" | "down" = "up";
    for (const m of sorted) {
      const x = X(parseDate(m.date));
      const left = x - size / 2;
      let placed = false;
      const order: ("up" | "down")[] = prefer === "up" ? ["up", "down"] : ["down", "up"];
      for (const side of order) {
        if (lastRight[side] + GAP <= left) {
          const p: PileT = { x, side, items: [m], tilt: hashTilt(m.id) };
          out.push(p);
          lastPile[side] = p;
          lastRight[side] = x + size / 2;
          prefer = side === "up" ? "down" : "up";
          placed = true;
          break;
        }
      }
      if (!placed) {
        const cands = [lastPile.up, lastPile.down].filter(Boolean) as PileT[];
        const best = cands.reduce((a, b) => (Math.abs(a.x - x) <= Math.abs(b.x - x) ? a : b));
        best.items.push(m);
      }
    }
    for (const p of out) p.items.sort((a, b) => Number(!!b.milestone) - Number(!!a.milestone));
    return out;
  }, [sorted, X, size]);

  const birthdays = useMemo(() => {
    const list: { x: number; label: string; date: Date }[] = [];
    for (let y = 0; ; y++) {
      const d = new Date(BIRTH.getFullYear() + y, BIRTH.getMonth(), BIRTH.getDate(), 12);
      if (d > end) break;
      list.push({ x: X(d), label: y === 0 ? "nasceu" : `${y} ${y === 1 ? "ano" : "anos"}`, date: d });
    }
    return list;
  }, [X, end]);

  const years = useMemo(() => {
    const list: { year: number; x: number }[] = [];
    for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
      const d = new Date(y, 0, 1, 12);
      list.push({ year: y, x: X(d < start ? start : d) });
    }
    return list;
  }, [X, start, end]);

  const months = useMemo(() => {
    const pxPerMonth = scale * 30.4;
    const step = pxPerMonth > 70 ? 1 : pxPerMonth > 30 ? 3 : 6;
    const list: { x: number; label: string; key: string }[] = [];
    for (let d = new Date(start.getFullYear(), start.getMonth() + 1, 1, 12); d < end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1, 12)) {
      if (d.getMonth() % step !== 0) continue;
      const label = d.getMonth() === 0 ? `${formatMonthShort(d)} ${d.getFullYear()}` : formatMonthShort(d);
      list.push({ x: X(d), label, key: d.toISOString() });
    }
    return list;
  }, [X, start, end, scale]);

  const riverPath = useMemo(() => {
    let p = `M0 ${waveY(0).toFixed(1)}`;
    for (let x = 24; x <= W + 24; x += 24) p += `L${x} ${waveY(x).toFixed(1)}`;
    return p;
  }, [W, waveY]);

  const minimap = useMemo(() => {
    const total = daysBetween(start, end);
    const buckets = Math.max(12, Math.round(total / 30.4));
    const counts = new Array(buckets).fill(0) as number[];
    for (const m of sorted) {
      const i = Math.min(buckets - 1, Math.floor((daysBetween(start, parseDate(m.date)) / total) * buckets));
      counts[i] += m.milestone ? 2 : 1;
    }
    const max = Math.max(...counts, 1);
    return { counts, max, total };
  }, [sorted, start, end]);

  /* ---------- movimento ---------- */
  const tx = useMotionValue(0);
  const x = useSpring(tx, { stiffness: 140, damping: 26, mass: 0.9 });
  const velocity = useVelocity(x);
  const swingRaw = useTransform(velocity, [-3200, 0, 3200], [9, 0, -9], { clamp: true });
  const swing = useSpring(swingRaw, { stiffness: 170, damping: 7 });
  const parallax = useTransform(x, (v) => v * 0.85);

  const sky = useMotionValue("#0A0F1D");
  const ink = useMotionValue("#EEF2FB");
  const inkSoft = useMotionValue("rgba(238,242,251,.6)");
  const winLeft = useMotionValue(0);
  const [mapW, setMapW] = useState(600);
  const mapRef = useRef<HTMLDivElement>(null);
  const filmCtl = useRef<{ stop: boolean; anim: AnimationPlaybackControls | null }>({ stop: false, anim: null });
  const prevCenter = useRef<number | null>(null);

  const geo = useRef({ scale, PAD, W, vw: vp.w, start });
  geo.current = { scale, PAD, W, vw: vp.w, start };

  const clampX = useCallback((v: number, w = geo.current.W) => clamp(-(w - geo.current.vw), v, 0), []);

  const skyMap = useMemo(() => {
    const world = [0, Xb - 240, Xb - 40, Xb + 60, Xb + 260, Xb + 720, W];
    const colors = ["#0A0F1D", "#121B38", "#4A3F86", "#F2A98B", "#FBE2CB", "#E8EFFA", "#F3F6FC"];
    const toX = (wx: number) => vp.w / 2 - wx;
    return {
      sky: transform(world.map(toX).reverse(), [...colors].reverse()),
      ink: transform([toX(Xb + 50), toX(Xb - 50)], ["#1A2238", "#EEF2FB"]),
      soft: transform([toX(Xb + 50), toX(Xb - 50)], ["rgba(26,34,56,.62)", "rgba(238,242,251,.62)"]),
    };
  }, [Xb, W, vp.w]);

  const sync = useCallback(
    (v: number) => {
      const g = geo.current;
      const cw = -v + g.vw / 2;
      const raw = new Date(g.start.getTime() + ((cw - g.PAD) / g.scale) * DAY);
      const d = raw > today ? today : raw;
      const line = ageSentence(d, today);
      const month = formatMonth(d);
      setHud((p) => (p.line === line && p.month === month ? p : { line, month }));
      sky.set(skyMap.sky(v) as string);
      ink.set(skyMap.ink(v) as string);
      inkSoft.set(skyMap.soft(v) as string);
      winLeft.set((-v / g.W) * mapW);
      const prev = prevCenter.current;
      if (prev !== null && !reduce) {
        for (const b of birthdays) {
          if (prev < b.x && cw >= b.x) {
            confetti({ particleCount: 90, spread: 75, origin: { x: 0.5, y: 0.42 }, colors: ["#F4B54A", "#F27A63", "#86A2FF", "#4CC8C1", "#FFFFFF"], scalar: 0.9 });
          }
        }
      }
      prevCenter.current = cw;
    },
    [today, skyMap, mapW, birthdays, reduce, sky, ink, inkSoft, winLeft],
  );

  useMotionValueEvent(x, "change", sync);

  /* começa no primeiro momento, centralizado */
  const started = useRef(false);
  useLayoutEffect(() => {
    if (started.current || !vp.ok) return;
    started.current = true;
    const first = clampX(vp.w / 2 - X(parseDate(sorted[0].date)));
    tx.jump(first);
    x.jump(first);
  }, [vp.ok, vp.w, X, sorted, tx, x, clampX]);
  useEffect(() => {
    prevCenter.current = null;
    sync(x.get());
  }, [sync, x]);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMapW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stopFilm = useCallback(() => {
    filmCtl.current.stop = true;
    filmCtl.current.anim?.stop();
    setFilming(false);
    setHighlightId(null);
  }, []);

  const goTo = useCallback(
    (target: number, duration = 0.9) => {
      const c = animate(tx, clampX(target), { duration, ease: [0.3, 0.7, 0.2, 1] });
      return c;
    },
    [tx, clampX],
  );

  const zoomAt = useCallback(
    (clientX: number, factor: number) => {
      const g = geo.current;
      const next = clamp(MIN_SCALE, g.scale * factor, MAX_SCALE);
      if (next === g.scale) return;
      const days = (clientX - x.get() - g.PAD) / g.scale;
      const newW = g.W - (g.W - 2 * g.PAD) + (g.W - 2 * g.PAD) * (next / g.scale);
      const nx = clamp(-(newW - g.vw), clientX - g.PAD - days * next, 0);
      setScale(next);
      geo.current = { ...g, scale: next, W: newW };
      x.jump(nx);
      tx.jump(nx);
    },
    [x, tx],
  );

  /* roda do mouse e trackpad */
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (filmCtl.current.anim) stopFilm();
      if (e.ctrlKey || e.metaKey) {
        zoomAt(e.clientX, Math.exp(-e.deltaY * 0.004));
      } else {
        const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        tx.set(clampX(tx.get() - d * 1.3));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt, tx, clampX, stopFilm]);

  /* arrastar com inércia */
  const drag = useRef({ active: false, startX: 0, startTx: 0, lastX: 0, lastT: 0, v: 0, moved: false });
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (filmCtl.current.anim) stopFilm();
    drag.current = { active: true, startX: e.clientX, startTx: tx.get(), lastX: e.clientX, lastT: performance.now(), v: 0, moved: false };
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const s = drag.current;
      if (!s.active) return;
      const dx = e.clientX - s.startX;
      if (Math.abs(dx) > 6) s.moved = true;
      const now = performance.now();
      const dt = Math.max(1, now - s.lastT);
      s.v = 0.8 * ((e.clientX - s.lastX) / dt) * 1000 + 0.2 * s.v;
      s.lastX = e.clientX;
      s.lastT = now;
      if (s.moved) tx.set(clampX(s.startTx + dx));
    };
    const up = () => {
      const s = drag.current;
      if (!s.active) return;
      s.active = false;
      if (s.moved && Math.abs(s.v) > 80) goTo(tx.get() + s.v * 0.32, 1.1);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [tx, clampX, goTo]);

  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      drag.current.moved = false;
    }
  };

  const centerOn = useCallback((wx: number, duration = 0.9) => goTo(geo.current.vw / 2 - wx, duration), [goTo]);

  const milestones = useMemo(() => sorted.filter((m) => m.milestone), [sorted]);

  const nextMilestone = useCallback(
    (dir: 1 | -1) => {
      const cw = -tx.get() + geo.current.vw / 2;
      const xs = milestones.map((m) => X(parseDate(m.date)));
      const target = dir > 0 ? xs.find((v) => v > cw + 4) : [...xs].reverse().find((v) => v < cw - 4);
      if (target !== undefined) centerOn(target);
    },
    [milestones, X, tx, centerOn],
  );

  /* modo filme: a câmera percorre os marcos sozinha */
  const playFilm = useCallback(async () => {
    if (filmCtl.current.anim) return stopFilm();
    filmCtl.current.stop = false;
    setFilming(true);
    const run = (target: number, duration: number) => {
      const a = animate(tx, clampX(geo.current.vw / 2 - target), { duration, ease: [0.45, 0, 0.2, 1] });
      filmCtl.current.anim = a;
      return a;
    };
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await run(X(parseDate(sorted[0].date)), 1.4);
    for (const m of milestones) {
      if (filmCtl.current.stop) break;
      await run(X(parseDate(m.date)), 2.6);
      if (filmCtl.current.stop) break;
      setHighlightId(m.id);
      await wait(1500);
      setHighlightId(null);
    }
    if (!filmCtl.current.stop) await run(X(today), 2.2);
    filmCtl.current.anim = null;
    setFilming(false);
  }, [milestones, X, sorted, today, tx, clampX, stopFilm]);

  /* teclado */
  useEffect(() => {
    if (paused) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const step = geo.current.vw * 0.4;
      if (e.key === "ArrowRight") goTo(tx.get() - step, 0.6);
      else if (e.key === "ArrowLeft") goTo(tx.get() + step, 0.6);
      else if (e.key === "Home") goTo(0, 1.2);
      else if (e.key === "End") goTo(-1e9, 1.2);
      else if (e.key.toLowerCase() === "m") nextMilestone(e.shiftKey ? -1 : 1);
      else if (e.key === "+" || e.key === "=") zoomAt(geo.current.vw / 2, 1.35);
      else if (e.key === "-") zoomAt(geo.current.vw / 2, 1 / 1.35);
      else if (e.key.toLowerCase() === "f") playFilm();
      else if (e.key === "Escape") stopFilm();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused, goTo, tx, nextMilestone, zoomAt, playFilm, stopFilm]);

  /* minimapa */
  const seek = (clientX: number, smooth: boolean) => {
    const r = mapRef.current!.getBoundingClientRect();
    const ratio = clamp(0, (clientX - r.left) / r.width, 1);
    const target = geo.current.vw / 2 - ratio * geo.current.W;
    if (smooth) goTo(target, 0.6);
    else tx.set(clampX(target));
  };
  const mapDrag = useRef(false);

  const isDimmed = useCallback(
    (m: Moment) => {
      if (filter === "tudo") return false;
      if (filter === "marcos") return !m.milestone;
      if (filter === "fotos") return m.type !== "foto";
      if (filter === "videos") return m.type !== "video";
      return m.type !== "ultrassom";
    },
    [filter],
  );

  const todayX = X(today);
  const winW = (vp.w / W) * mapW;

  return (
    <motion.div className="river-stage" style={{ background: sky }} ref={stageRef}>
      {/* anos gigantes ao fundo, em paralaxe */}
      <motion.div className="years-layer" style={{ x: parallax }} aria-hidden>
        {years.map((y) => (
          <motion.span key={y.year} className="year-ghost" style={{ left: 0.85 * y.x + 0.075 * vp.w, color: ink }}>
            {y.year}
          </motion.span>
        ))}
      </motion.div>

      <motion.div
        className="world"
        style={{ x, width: W }}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
      >
        <svg className="river-svg" width={W} height={vp.h} aria-hidden>
          <defs>
            <linearGradient id="riverGrad" gradientUnits="userSpaceOnUse" x1="0" x2={W} y1="0" y2="0">
              <stop offset="0" stopColor="#4CC8C1" />
              <stop offset={Math.max(0, (Xb - 120) / W)} stopColor="#6FA8E8" />
              <stop offset={Math.min(1, (Xb + 120) / W)} stopColor="#F4B54A" />
              <stop offset="1" stopColor="#7C9BFF" />
            </linearGradient>
          </defs>
          <path d={riverPath} fill="none" stroke="url(#riverGrad)" strokeOpacity="0.22" strokeWidth="26" strokeLinecap="round" />
          <path d={riverPath} fill="none" stroke="url(#riverGrad)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        {months.map((mo) => (
          <motion.span key={mo.key} className="month-tick" style={{ left: mo.x, top: waveY(mo.x) + 20, color: inkSoft }}>
            {mo.label}
          </motion.span>
        ))}

        {birthdays.map((b) => (
          <div key={b.label} className="bday" style={{ left: b.x, top: waveY(b.x) }}>
            <span className="bday-dot" />
            <span className="bday-label">{b.label}</span>
          </div>
        ))}

        <div className="today-flag" style={{ left: todayX, top: waveY(todayX) }}>
          <span>hoje</span>
        </div>

        {piles.map((p) => {
          const wy = waveY(p.x);
          const lead = p.items[0];
          const dotColor = lead.milestone ? "var(--sun)" : lead.type === "video" ? "var(--coral)" : lead.type === "ultrassom" ? "var(--teal)" : "var(--sky)";
          return (
            <div key={lead.id}>
              <span className={`stem stem-${p.side}`} style={{ left: p.x, top: p.side === "up" ? wy - 34 : wy, height: 34 }} />
              <button
                type="button"
                className={`river-dot${lead.milestone ? " big" : ""}`}
                style={{ left: p.x, top: wy, background: dotColor }}
                onClick={() => onOpen(lead.id)}
                aria-label={lead.caption}
                tabIndex={-1}
              />
              <div
                className="pile-anchor"
                style={
                  p.side === "up"
                    ? { left: p.x - size / 2, bottom: vp.h - (wy - 32) }
                    : { left: p.x - size / 2, top: wy + 32 }
                }
              >
                <Pile
                  items={p.items}
                  size={lead.milestone ? Math.round(size * 1.08) : size}
                  swing={swing}
                  hangFrom={p.side === "up" ? "bottom" : "top"}
                  baseTilt={p.tilt}
                  isDimmed={isDimmed}
                  highlightId={highlightId}
                  onOpen={onOpen}
                />
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* contador de idade */}
      <motion.header className="hud" style={{ color: ink }}>
        <div className="hud-name">{CHILD.name}</div>
        <motion.div key={hud.line} className="hud-line" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {hud.line}
        </motion.div>
        <motion.div className="hud-month" style={{ color: inkSoft }}>
          {hud.month}
        </motion.div>
      </motion.header>

      <div className="controls">
        <div className="chips" role="group" aria-label="Filtrar">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className="chip" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="chips">
          <button type="button" className="chip icon" onClick={() => zoomAt(vp.w / 2, 1 / 1.4)} aria-label="Afastar">
            −
          </button>
          <button type="button" className="chip icon" onClick={() => zoomAt(vp.w / 2, 1.4)} aria-label="Aproximar">
            +
          </button>
          <button type="button" className="chip film" aria-pressed={filming} onClick={playFilm}>
            {filming ? "■ Parar filme" : "▶ Modo filme"}
          </button>
        </div>
      </div>

      <div className="bottom">
        <div
          className="minimap"
          ref={mapRef}
          onPointerDown={(e) => {
            mapDrag.current = true;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            if (filmCtl.current.anim) stopFilm();
            seek(e.clientX, true);
          }}
          onPointerMove={(e) => mapDrag.current && seek(e.clientX, false)}
          onPointerUp={() => (mapDrag.current = false)}
          role="slider"
          aria-label="Ir para uma data"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        >
          <div className="mm-bars">
            {minimap.counts.map((c, i) => (
              <span key={i} style={{ height: `${12 + (c / minimap.max) * 88}%`, opacity: c ? 1 : 0.25 }} />
            ))}
          </div>
          {birthdays.map((b) => (
            <span key={b.label} className="mm-bday" style={{ left: `${(b.x / W) * 100}%` }} />
          ))}
          <motion.span className="mm-window" style={{ x: winLeft, width: winW }} />
        </div>
        <motion.p className="hint" style={{ color: inkSoft }}>
          Role ou arraste para andar · Ctrl + roda para zoom · M pula para o próximo marco · F liga o modo filme
        </motion.p>
      </div>
    </motion.div>
  );
}
