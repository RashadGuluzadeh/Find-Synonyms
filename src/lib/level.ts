export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const CEFR_LEVELS: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const LEVEL_INFO: Record<CefrLevel, { name: string; badge: string }> = {
  A1: { name: "Beginner", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" },
  A2: { name: "Elementary", badge: "bg-lime-100 text-lime-800 dark:bg-lime-500/15 dark:text-lime-300" },
  B1: { name: "Intermediate", badge: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" },
  B2: { name: "Upper intermediate", badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  C1: { name: "Advanced", badge: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300" },
  C2: { name: "Proficient", badge: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300" },
};

export const LEVEL_DISCLAIMER =
  "Estimated CEFR level, based on how often the word appears in English texts. Rarer words are usually learned later.";

/**
 * Minimum frequency (occurrences per million words) for each level, calibrated
 * against words with a known CEFR level, e.g. house/friend → A1, journey/bright → A2,
 * cheerful → B1, joyful → B2, elated/blissful → C1, halcyon/felicitous → C2.
 */
const THRESHOLDS: readonly [CefrLevel, number][] = [
  ["A1", 40],
  ["A2", 15],
  ["B1", 5],
  ["B2", 1.5],
  ["C1", 0.5],
];

export function estimateLevel(frequency: number | null): CefrLevel | null {
  if (frequency == null) return null;
  for (const [level, min] of THRESHOLDS) if (frequency >= min) return level;
  return "C2";
}

export const levelRank = (level: CefrLevel | null) => (level ? CEFR_LEVELS.indexOf(level) : CEFR_LEVELS.length);
