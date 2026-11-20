export type MomentType = "ultrassom" | "foto" | "video";

export interface Moment {
  id: string;
  /** Data local no formato AAAA-MM-DD */
  date: string;
  type: MomentType;
  caption: string;
  /** Marco importante: aparece maior e sempre visível */
  milestone?: boolean;
  /** Miniatura (no futuro, vinda do Drive/R2) */
  thumbUrl?: string;
  /** Arquivo original (foto grande ou vídeo) */
  url?: string;
  /** Onde a data foi encontrada */
  dateSource: "exif" | "nome-do-arquivo" | "gestacao" | "manual";
  place?: string;
  people?: string[];
  /** Matiz usado na arte de exemplo enquanto não há foto real */
  hue?: number;
}
