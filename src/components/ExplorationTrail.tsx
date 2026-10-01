import { ChevronRightIcon } from "./icons";

interface ExplorationTrailProps {
  trail: string[];
  onSelect: (index: number) => void;
}

/** Breadcrumb of the words visited by clicking through results. */
export function ExplorationTrail({ trail, onSelect }: ExplorationTrailProps) {
  if (trail.length < 2) return null;
  return (
    <nav aria-label="Exploration path" className="animate-fade-in">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        <li className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Path</li>
        {trail.map((word, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={`${word}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRightIcon className="text-slate-300 dark:text-slate-600" />}
              {last ? (
                <span aria-current="page" className="rounded-lg bg-indigo-600/10 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
                  {word}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className="rounded-lg px-2 py-0.5 text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  {word}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
