import type { Moment } from "./types";
import { sampleMoments } from "./sample";
import { loadDriveMoments } from "./drive";

export interface MomentsResult {
  moments: Moment[];
  source: "drive" | "exemplo";
  error?: string;
}

/** Fotos do Drive quando estiver configurado; senão, os momentos de exemplo. */
export async function getMoments(): Promise<MomentsResult> {
  const folder = process.env.DRIVE_FOLDER_ID;
  if (!folder || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return { moments: sampleMoments, source: "exemplo" };
  try {
    return { moments: await loadDriveMoments(folder), source: "drive" };
  } catch (e) {
    console.error(e);
    return { moments: [], source: "drive", error: e instanceof Error ? e.message : String(e) };
  }
}
