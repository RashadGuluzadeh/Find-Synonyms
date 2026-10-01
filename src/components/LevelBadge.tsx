import { LEVEL_DISCLAIMER, LEVEL_INFO, type CefrLevel } from "../lib/level";

interface LevelBadgeProps {
  level: CefrLevel;
  frequency?: number | null;
  /** "full" also shows the level name, e.g. "B1 · Intermediate". */
  variant?: "compact" | "full";
}

export function LevelBadge({ level, frequency, variant = "compact" }: LevelBadgeProps) {
  const { name, badge } = LEVEL_INFO[level];
  const usage = frequency != null ? ` About ${frequency < 1 ? frequency.toFixed(2) : frequency.toFixed(1)} uses per million words.` : "";
  return (
    <span
      title={`${level} · ${name}. ${LEVEL_DISCLAIMER}${usage}`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md font-semibold tabular-nums ${badge} ${
        variant === "full" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[11px] leading-none"
      }`}
    >
      <span aria-hidden="true" className="opacity-60">≈</span>
      <span className="sr-only">Estimated English level </span>
      {level}
      {variant === "full" && <span className="font-medium opacity-80">· {name}</span>}
    </span>
  );
}
