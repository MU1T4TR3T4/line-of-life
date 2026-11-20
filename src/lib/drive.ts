import type { Moment } from "./types";
import { getAccessToken } from "./google-auth";
import { DUE, DAY } from "./dates";

/**
 * Lê a pasta do Google Drive e transforma cada foto ou vídeo num momento da linha do tempo.
 *
 * Convenções para quem coloca as fotos no Drive:
 * - Subpasta com "ultrassom" no nome: tudo nela vira ultrassom.
 * - Descrição do arquivo no Drive vira a legenda.
 * - "#marco" (ou ⭐) na descrição: vira marco.
 * - "#data 10/03/2024" na descrição: corrige a data.
 * - "12 semanas" (ou "12s") na descrição ou no nome de um ultrassom: calcula a data pela gestação.
 */

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  modifiedTime: string;
  createdTime: string;
  imageMediaMetadata?: { time?: string };
  videoMediaMetadata?: { durationMillis?: string };
}

const FIELDS = "nextPageToken,files(id,name,mimeType,description,modifiedTime,createdTime,imageMediaMetadata(time),videoMediaMetadata(durationMillis))";

async function listChildren(folderId: string, token: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const q = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: FIELDS,
      pageSize: "1000",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) q.set("pageToken", pageToken);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${q}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Erro ao listar a pasta do Drive: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { files: DriveFile[]; nextPageToken?: string };
    out.push(...json.files);
    pageToken = json.nextPageToken;
  } while (pageToken);
  return out;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const validYear = (y: number) => y >= 2000 && y <= 2100;
const noAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function hueOf(id: string) {
  let h = 0;
  for (const c of id) h = (h * 33 + c.charCodeAt(0)) | 0;
  return Math.abs(h) % 360;
}

/** "2024:03:10 14:22:01" (EXIF) → "2024-03-10" */
function fromExif(t?: string): string | null {
  const m = t?.match(/^(\d{4})[:-](\d{2})[:-](\d{2})/);
  return m && validYear(+m[1]) ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** IMG_20240310_142201.jpg, IMG-20240310-WA0012.jpg, 2024-03-10 14.22.01.png ... */
function fromName(name: string): string | null {
  const m = name.match(/(20\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12]\d|3[01])/);
  return m && validYear(+m[1]) ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** "#data 10/03/2024" ou "#data 2024-03-10" */
function fromTag(desc: string): string | null {
  const br = desc.match(/#data\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (br) return `${br[3]}-${pad(+br[2])}-${pad(+br[1])}`;
  const is = desc.match(/#data\s+(\d{4})-(\d{2})-(\d{2})/i);
  return is ? `${is[1]}-${is[2]}-${is[3]}` : null;
}

/** "12 semanas", "12s", "#semana 12" → data pela data prevista do parto */
function fromWeek(text: string): string | null {
  const m = text.match(/(?:#semana\s*(\d{1,2}))|(?:\b(\d{1,2})\s*(?:s|sem|semanas?)\b)/i);
  const w = m ? Number(m[1] ?? m[2]) : NaN;
  if (!w || w < 4 || w > 42) return null;
  return iso(new Date(DUE.getTime() - (40 - w) * 7 * DAY));
}

function cleanCaption(desc: string) {
  return desc
    .replace(/#data\s+\S+/gi, "")
    .replace(/#semana\s*\d+/gi, "")
    .replace(/#marco|⭐/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

const fmtDay = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" });

export function toMoment(f: DriveFile, inUltrasoundFolder: boolean): Moment | null {
  const isImage = f.mimeType.startsWith("image/");
  const isVideo = f.mimeType.startsWith("video/");
  if (!isImage && !isVideo) return null;

  const desc = f.description ?? "";
  const ultrassom = inUltrasoundFolder || /#ultrassom/i.test(desc);
  const type: Moment["type"] = ultrassom ? "ultrassom" : isVideo ? "video" : "foto";

  let date: string | null = null;
  let dateSource: Moment["dateSource"] = "arquivo";
  const tagged = fromTag(desc);
  if (tagged) [date, dateSource] = [tagged, "manual"];
  if (!date && ultrassom) {
    const w = fromWeek(desc) ?? fromWeek(f.name);
    if (w) [date, dateSource] = [w, "gestacao"];
  }
  if (!date) {
    const e = fromExif(f.imageMediaMetadata?.time);
    if (e) [date, dateSource] = [e, "exif"];
  }
  if (!date) {
    const n = fromName(f.name);
    if (n) [date, dateSource] = [n, "nome-do-arquivo"];
  }
  if (!date) date = iso(new Date(f.modifiedTime));

  const [y, mo, d] = date.split("-").map(Number);
  const caption = cleanCaption(desc) || fmtDay.format(new Date(y, mo - 1, d, 12));
  const v = encodeURIComponent(f.modifiedTime);

  return {
    id: f.id,
    date,
    type,
    caption,
    milestone: /#marco|⭐/i.test(desc),
    dateSource,
    hue: hueOf(f.id),
    thumbUrl: `/api/media/${f.id}?s=thumb&v=${v}`,
    url: isVideo ? `/api/media/${f.id}?s=original&v=${v}` : `/api/media/${f.id}?s=large&v=${v}`,
  };
}

/** Lista a pasta principal e as subpastas (até 4 níveis). */
export async function loadDriveMoments(rootId: string): Promise<Moment[]> {
  const token = await getAccessToken();
  const out: Moment[] = [];
  const walk = async (folderId: string, ultra: boolean, depth: number) => {
    const files = await listChildren(folderId, token);
    const folders = files.filter((f) => f.mimeType === "application/vnd.google-apps.folder");
    for (const f of files) {
      const m = toMoment(f, ultra);
      if (m) out.push(m);
    }
    if (depth < 4) {
      await Promise.all(folders.map((f) => walk(f.id, ultra || noAccents(f.name).includes("ultrassom") || noAccents(f.name).includes("ultrasom"), depth + 1)));
    }
  };
  await walk(rootId, false, 0);
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
