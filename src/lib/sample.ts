import type { Moment } from "./types";

/**
 * Momentos de EXEMPLO para desenvolver o visual.
 * Na etapa 2 eles serão substituídos pelo índice sincronizado do Google Drive.
 */
type Row = [date: string, type: Moment["type"], caption: string, hue: number, milestone?: boolean, place?: string];

const rows: Row[] = [
  ["2023-02-20", "ultrassom", "Primeiro ultrassom", 200, true],
  ["2023-04-18", "ultrassom", "Ultrassom morfológico", 200],
  ["2023-05-02", "foto", "Contando para os avós", 30],
  ["2023-06-03", "foto", "Barriga de 6 meses", 300],
  ["2023-07-15", "video", "Os primeiros chutes", 340],
  ["2023-08-10", "ultrassom", "Ultrassom 3D", 200],
  ["2023-09-02", "foto", "Chá de bebê", 20, false, "Casa da vó"],
  ["2023-09-28", "foto", "Quarto pronto", 160],
  ["2023-10-12", "foto", "Nascimento", 40, true, "Maternidade"],
  ["2023-10-12", "foto", "Primeiro colo do pai", 210],
  ["2023-10-12", "video", "Primeiro choro", 350],
  ["2023-10-13", "foto", "Mãozinha", 25],
  ["2023-10-14", "foto", "Chegando em casa", 190],
  ["2023-11-20", "foto", "Primeiro sorriso", 45, true],
  ["2023-12-24", "foto", "Primeiro Natal", 0],
  ["2024-01-05", "video", "Primeira risada", 330],
  ["2024-03-10", "foto", "Primeira papinha", 95],
  ["2024-04-22", "foto", "Sentou sozinho", 50, true],
  ["2024-06-15", "foto", "Festa junina", 15],
  ["2024-07-08", "video", "Engatinhando pela sala", 320],
  ["2024-10-12", "foto", "Festa de 1 ano", 40, true],
  ["2024-11-30", "video", "Primeiros passos", 45, true],
  ["2024-12-24", "foto", "Natal com a família", 5],
  ["2025-02-14", "foto", "Primeira vez na praia", 195, false, "Praia"],
  ["2025-02-15", "foto", "Castelo de areia", 40, false, "Praia"],
  ["2025-02-16", "video", "Correndo das ondas", 190, false, "Praia"],
  ["2025-05-03", "video", "Primeira palavra: \"água\"", 205, true],
  ["2025-08-19", "foto", "Primeiro dia na escolinha", 150],
  ["2025-10-12", "foto", "Aniversário de 2 anos", 10, true],
  ["2025-12-24", "foto", "Natal de pijama", 355],
  ["2026-01-10", "video", "Bicicleta sem pedal", 345],
  ["2026-04-05", "foto", "Caça aos ovos de Páscoa", 110],
  ["2026-07-20", "foto", "Férias com os avós", 170, false, "Sítio"],
  ["2026-09-07", "foto", "Desfile da escola", 220],
  ["2026-10-12", "foto", "3 anos", 40, true],
  ["2026-11-15", "foto", "Desenho da família", 230],
];

export const sampleMoments: Moment[] = rows.map(([date, type, caption, hue, milestone, place], i) => ({
  id: `m${String(i + 1).padStart(3, "0")}`,
  date,
  type,
  caption,
  hue,
  milestone: milestone ?? false,
  place,
  dateSource: type === "ultrassom" ? "gestacao" : "exif",
}));
