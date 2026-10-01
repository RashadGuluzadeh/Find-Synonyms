import { useEffect, useState } from "react";
import { fetchWordInfo, type WordInfo } from "../lib/datamuse";
import { wordOfTheDay } from "../lib/words";
import { LevelBadge } from "./LevelBadge";
import { ChevronRightIcon, SparklesIcon } from "./icons";

interface WordOfTheDayProps {
  onExplore: (word: string) => void;
}

export function WordOfTheDay({ onExplore }: WordOfTheDayProps) {
  const word = wordOfTheDay();
  // null = loading, false = unavailable.
  const [info, setInfo] = useState<WordInfo | null | false>(null);

  useEffect(() => {
    const controller = new AbortController();
    // Purely decorative extra: failures simply leave the definition out.
    fetchWordInfo(word, controller.signal).then(
      (result) => setInfo(result ?? false),
      () => setInfo(false),
    );
    return () => controller.abort();
  }, [word]);

  const definition = info ? info.definitions[0]?.text : undefined;

  return (
    <button
      type="button"
      onClick={() => onExplore(word)}
      className="surface group relative block w-full overflow-hidden p-6 text-left transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <span aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/25 to-purple-500/25 blur-2xl transition group-hover:scale-125" />
      <span className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
        <SparklesIcon /> Word of the day
      </span>
      <span className="relative mt-2 flex flex-wrap items-center gap-3">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{word}</span>
        {info && info.level && <LevelBadge level={info.level} frequency={info.frequency} variant="full" />}
      </span>
      <span className="relative mt-2 block min-h-[3rem] text-slate-600 dark:text-slate-400">
        {definition ? (
          <span className="line-clamp-2">{definition}</span>
        ) : (
          info === null && <span className="skeleton block h-4 w-3/4" />
        )}
      </span>
      <span className="relative mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition group-hover:gap-2 dark:text-indigo-400">
        Explore <ChevronRightIcon />
      </span>
    </button>
  );
}
