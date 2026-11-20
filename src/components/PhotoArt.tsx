import type { Moment } from "@/lib/types";
import { gestationWeek, parseDate } from "@/lib/dates";

/** A imagem da foto. Enquanto não há foto real, desenha uma arte de exemplo. */
export function PhotoArt({ m, big = false }: { m: Moment; big?: boolean }) {
  if (m.thumbUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="art art-img" src={big && m.url && m.type !== "video" ? m.url : m.thumbUrl} alt={m.caption} draggable={false} />;
  }
  const d = parseDate(m.date);
  if (m.type === "ultrassom") {
    return (
      <div className="art art-us" role="img" aria-label={m.caption}>
        <span className="art-stamp">
          {gestationWeek(d)}s · {d.toLocaleDateString("pt-BR")}
        </span>
      </div>
    );
  }
  const h = m.hue ?? 210;
  const background = m.milestone
    ? `radial-gradient(circle at 30% 25%, hsl(${h + 8} 95% 78%), hsl(${h - 12} 85% 56%))`
    : `linear-gradient(135deg, hsl(${h} 62% 76%), hsl(${h + 40} 52% 52%))`;
  return (
    <div className="art" style={{ background }} role="img" aria-label={m.caption}>
      <span className="art-icon">{m.type === "video" ? <PlayIcon /> : m.milestone ? <StarIcon /> : <CameraIcon />}</span>
    </div>
  );
}

export const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="3" y="6" width="18" height="14" rx="3" />
    <circle cx="12" cy="13" r="3.5" />
    <path d="M8 6l1.5-2.5h5L16 6" />
  </svg>
);
export const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,.3)" />
    <path d="M10 8l6 4-6 4z" />
  </svg>
);
export const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" />
  </svg>
);
export const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <path d="M12 20s-7-4.4-9.2-8.6C1.2 8.2 3.2 4.5 6.8 4.5c2.1 0 3.5 1.2 5.2 3 1.7-1.8 3.1-3 5.2-3 3.6 0 5.6 3.7 4 6.9C19 15.6 12 20 12 20z" />
  </svg>
);
