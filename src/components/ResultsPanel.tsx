import { useMemo, useState } from "react";
import { PART_OF_SPEECH_LABELS, type ModeInfo, type PartOfSpeech, type WordResult } from "../lib/datamuse";
import { CEFR_LEVELS, LEVEL_DISCLAIMER, LEVEL_INFO, levelRank, type CefrLevel } from "../lib/level";
import type { SearchStatus } from "../hooks/useWordSearch";
import { downloadFile, toCsv, toText } from "../lib/export";
import { LevelBadge } from "./LevelBadge";
import { AlertIcon, CopyIcon, DownloadIcon } from "./icons";

type Sort = "relevance" | "level" | "alpha" | "length";
type PosFilter = PartOfSpeech | "all";
type LevelFilter = CefrLevel | "all";

interface ResultsPanelProps {
  word: string;
  mode: ModeInfo;
  status: SearchStatus;
  results: WordResult[];
  error: string | null;
  onRetry: () => void;
  onExplore: (word: string) => void;
  onCopy: (text: string, label: string) => void;
}

const POS_ORDER: PartOfSpeech[] = ["noun", "verb", "adj", "adv"];

const exportButton =
  "flex items-center gap-1.5 px-3 py-2 transition hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300";

export function ResultsPanel({ word, mode, status, results, error, onRetry, onExplore, onCopy }: ResultsPanelProps) {
  const [filter, setFilter] = useState<PosFilter>("all");
  const [sort, setSort] = useState<Sort>("relevance");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  const availablePos = useMemo(
    () => POS_ORDER.filter((p) => results.some((r) => r.pos.includes(p))),
    [results],
  );
  const activeFilter = filter !== "all" && availablePos.includes(filter) ? filter : "all";
  const availableLevels = useMemo(
    () => CEFR_LEVELS.filter((level) => results.some((r) => r.level === level)),
    [results],
  );
  const activeLevel = levelFilter !== "all" && availableLevels.includes(levelFilter) ? levelFilter : "all";

  const shown = useMemo(() => {
    const list = results.filter(
      (r) =>
        (activeFilter === "all" || r.pos.includes(activeFilter)) &&
        (activeLevel === "all" || r.level === activeLevel),
    );
    if (sort === "level") list.sort((a, b) => levelRank(a.level) - levelRank(b.level) || b.score - a.score);
    else if (sort === "alpha") list.sort((a, b) => a.word.localeCompare(b.word));
    else if (sort === "length") list.sort((a, b) => a.word.length - b.word.length || b.score - a.score);
    else list.sort((a, b) => b.score - a.score);
    return list;
  }, [results, activeFilter, activeLevel, sort]);

  const maxScore = useMemo(() => Math.max(1, ...results.map((r) => r.score)), [results]);

  return (
    <section
      aria-labelledby="results-heading"
      aria-busy={status === "loading"}
      className="surface animate-fade-up p-5 [animation-delay:80ms] sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="results-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
            {mode.label}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
            {status === "loading"
              ? "Searching…"
              : status === "success"
                ? `${shown.length} ${shown.length === 1 ? "word" : "words"} · ${mode.description.toLowerCase()}`
                : mode.description}
          </p>
        </div>
        {status === "success" && results.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="sort-select">
              Sort results
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="relevance">Most relevant</option>
              <option value="level">Easiest first</option>
              <option value="alpha">A → Z</option>
              <option value="length">Shortest first</option>
            </select>
            <div role="group" aria-label="Export results" className="flex overflow-hidden rounded-xl border border-slate-200 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <button
                type="button"
                title="Copy all shown words"
                onClick={() => onCopy(shown.map((r) => r.word).join(", "), `${shown.length} words`)}
                className={exportButton}
              >
                <CopyIcon /> Copy
              </button>
              <button
                type="button"
                title="Download as a text file"
                onClick={() => downloadFile(`${word}-${mode.id}.txt`, toText(shown), "text/plain")}
                className={`${exportButton} border-l border-slate-200 dark:border-slate-700`}
              >
                <DownloadIcon /> TXT
              </button>
              <button
                type="button"
                title="Download as a spreadsheet (CSV) with levels and parts of speech"
                onClick={() => downloadFile(`${word}-${mode.id}.csv`, toCsv(shown), "text/csv")}
                className={`${exportButton} border-l border-slate-200 dark:border-slate-700`}
              >
                <DownloadIcon /> CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {status === "success" && availablePos.length > 1 && (
        <div role="group" aria-label="Filter by part of speech" className="mt-4 flex flex-wrap gap-2">
          {(["all", ...availablePos] as PosFilter[]).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={activeFilter === p}
              onClick={() => setFilter(p)}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                activeFilter === p
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {p === "all" ? "All" : PART_OF_SPEECH_LABELS[p]}
            </button>
          ))}
        </div>
      )}

      {status === "success" && availableLevels.length > 1 && (
        <div role="group" aria-label="Filter by English level" className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400" title={LEVEL_DISCLAIMER}>
            Level ≈
          </span>
          {(["all", ...availableLevels] as LevelFilter[]).map((level) => {
            const active = activeLevel === level;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={active}
                title={level === "all" ? "All levels" : `${level} · ${LEVEL_INFO[level].name}`}
                onClick={() => setLevelFilter(level)}
                className={`rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums transition ${
                  active
                    ? "bg-slate-900 text-white ring-2 ring-slate-900 dark:bg-white dark:text-slate-900 dark:ring-white"
                    : level === "all"
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      : `${LEVEL_INFO[level].badge} hover:opacity-80`
                }`}
              >
                {level === "all" ? "All" : level}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5">
        {status === "loading" && <SkeletonGrid />}

        {status === "error" && (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl bg-rose-50 px-6 py-10 text-center dark:bg-rose-500/10">
            <AlertIcon className="text-3xl text-rose-500" />
            <p className="text-rose-700 dark:text-rose-300">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Try again
            </button>
          </div>
        )}

        {status === "success" && shown.length === 0 && (
          <div className="rounded-2xl bg-slate-50 px-6 py-10 text-center dark:bg-slate-800/50">
            <p className="font-medium text-slate-700 dark:text-slate-200">
              No {mode.label.toLowerCase()} found for “{word}”.
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try another search type above, such as <strong>Similar</strong> or <strong>Related</strong>.
            </p>
          </div>
        )}

        {status === "success" && shown.length > 0 && (
          // Re-keying the list replays the entrance animation whenever the selection changes.
          <ul key={`${word}|${mode.id}|${activeFilter}|${activeLevel}|${sort}`} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {shown.map((result, index) => {
              const strength = result.score / maxScore;
              return (
                <li
                  key={result.word}
                  className="group relative animate-pop-in"
                  style={{ animationDelay: `${Math.min(index, 30) * 18}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => onExplore(result.word)}
                    title={`Explore “${result.word}”`}
                    className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 px-3 py-2.5 pr-10 text-left shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 active:translate-y-0 active:scale-[0.98] dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900/60 dark:hover:border-indigo-500"
                  >
                    <span className="block truncate font-medium text-slate-800 transition group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-300">{result.word}</span>
                    <span className="mt-2 flex items-center gap-2">
                      <span className="block h-1 flex-1 rounded-full bg-slate-200 dark:bg-slate-700" aria-hidden="true">
                        <span
                          className={`block h-full rounded-full bg-gradient-to-r ${strength > 0.66 ? "from-indigo-500 to-purple-500" : strength > 0.33 ? "from-indigo-400 to-indigo-500" : "from-indigo-300 to-indigo-400"}`}
                          style={{ width: `${Math.max(6, Math.round(strength * 100))}%` }}
                        />
                      </span>
                      {result.level && <LevelBadge level={result.level} frequency={result.frequency} />}
                    </span>
                    <span className="sr-only">, relevance {Math.round(strength * 100)} percent</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Copy ${result.word}`}
                    onClick={() => onCopy(result.word, `“${result.word}”`)}
                    className="absolute right-1.5 top-1.5 rounded-lg p-1.5 text-slate-400 opacity-100 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    <CopyIcon />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {status === "success" && availableLevels.length > 0 && (
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">≈ {LEVEL_DISCLAIMER}</p>
        )}
      </div>
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="skeleton h-[62px]" style={{ animationDelay: `${i * 40}ms` }} />
      ))}
    </div>
  );
}
