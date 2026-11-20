import { CHILD } from "@/config";

export const DAY = 86_400_000;

/** Converte "AAAA-MM-DD" em Date ao meio-dia local (evita pular de dia por fuso). */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export const BIRTH = parseDate(CHILD.birth);
export const DUE = parseDate(CHILD.dueDate);

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

export function monthsBetween(a: Date, b: Date): number {
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) m--;
  return m;
}

/** Semana de gestação calculada pela data prevista do parto (40 semanas). */
export function gestationWeek(d: Date): number {
  const daysToDue = daysBetween(d, DUE);
  return Math.max(1, Math.min(42, 40 - Math.floor(daysToDue / 7)));
}

/** "1 ano e 4 meses", "22ª semana de gestação", "3 dias de vida"... */
export function ageLabel(d: Date): string {
  const n = daysBetween(BIRTH, d);
  if (n < 0) return `${gestationWeek(d)}ª semana de gestação`;
  if (n === 0) return "dia em que nasceu";
  if (n < 31) return `${n} ${n === 1 ? "dia" : "dias"} de vida`;
  const m = monthsBetween(BIRTH, d);
  if (m < 12) return `${m} ${m === 1 ? "mês" : "meses"}`;
  const y = Math.floor(m / 12);
  const r = m % 12;
  return `${y} ${y === 1 ? "ano" : "anos"}${r ? ` e ${r} ${r === 1 ? "mês" : "meses"}` : ""}`;
}

/** Frase do contador: "tinha 1 ano e 4 meses", "estava na barriga"... */
export function ageSentence(d: Date, today = new Date()): string {
  const n = daysBetween(BIRTH, d);
  if (daysBetween(d, today) <= 0) return `hoje, com ${ageLabel(today)}`;
  if (n < 0) return `estava na barriga · ${gestationWeek(d)}ª semana`;
  if (n === 0) return "nasceu";
  return `tinha ${ageLabel(d)}`;
}

const fmtLong = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });
const fmtMonth = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const fmtShort = new Intl.DateTimeFormat("pt-BR", { month: "short" });

export const formatLong = (d: Date) => fmtLong.format(d);
export const formatMonth = (d: Date) => fmtMonth.format(d);
export const formatMonthShort = (d: Date) => fmtShort.format(d).replace(".", "");

export interface Chapter {
  key: string;
  title: string;
  subtitle: string;
  short: string;
  night?: boolean;
}

/** Capítulos por idade usados no Álbum. */
export function chapterOf(d: Date): Chapter {
  const n = daysBetween(BIRTH, d);
  if (n < 0) return { key: "gestacao", title: "Antes de nascer", subtitle: "a espera", short: "barriga", night: true };
  const m = monthsBetween(BIRTH, d);
  if (m < 3) return { key: "recem", title: "Recém-nascido", subtitle: "os primeiros dias", short: "0-3m" };
  if (m < 12) return { key: "ano0", title: "Primeiro ano", subtitle: "tudo pela primeira vez", short: "bebê" };
  const y = Math.floor(m / 12);
  const subs = ["andando por aí", "falando de tudo", "cheio de perguntas", "inventando histórias", "crescendo rápido"];
  return {
    key: `ano${y}`,
    title: `${y} ${y === 1 ? "ano" : "anos"}`,
    subtitle: subs[Math.min(y - 1, subs.length - 1)],
    short: `${y}a`,
  };
}
