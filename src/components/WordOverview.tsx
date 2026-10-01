import { useEffect, useState } from "react";
import { isAbortError, PART_OF_SPEECH_LABELS, type WordInfo } from "../lib/datamuse";
import { fetchExamples, type Example } from "../lib/wiktionary";
import { LevelBadge } from "./LevelBadge";
import { CopyIcon, QuoteIcon, ShareIcon, SpeakerIcon, StarIcon } from "./icons";

interface WordOverviewProps {
  word: string;
  info: WordInfo | null;
  loading: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onCopy: (text: string, label: string) => void;
}

const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
const PREVIEW_COUNT = 3;

function speak(text: string) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Wraps the searched word (and inflections like "happier") in <mark>, rendered by React, so it stays escaped. */
function Highlighted({ text, word }: { text: string; word: string }) {
  const stem = word.length > 4 ? word.slice(0, -1) : word;
  const parts = text.split(new RegExp(`(\\b${escapeRegExp(stem)}[\\p{L}'-]*)`, "giu"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-indigo-500/15 px-0.5 font-semibold text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-200">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

function useExamples(word: string) {
  const [examples, setExamples] = useState<Example[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setExamples(null);
    fetchExamples(word, controller.signal).then(setExamples, (error: unknown) => {
      if (!isAbortError(error)) setExamples([]);
    });
    return () => controller.abort();
  }, [word]);
  return examples;
}

const iconButton =
  "rounded-xl border border-slate-200 bg-white/60 p-2.5 text-lg text-slate-500 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md active:translate-y-0 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-300";

export function WordOverview({ word, info, loading, isFavorite, onToggleFavorite, onShare, onCopy }: WordOverviewProps) {
  const [expanded, setExpanded] = useState(false);
  const examples = useExamples(word);
  const definitions = info?.definitions ?? [];
  const visible = expanded ? definitions : definitions.slice(0, PREVIEW_COUNT);

  return (
    <section aria-labelledby="word-heading" className="surface relative animate-fade-up overflow-hidden p-5 sm:p-7">
      <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent blur-2xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="word-heading" className="break-words text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              {word}
            </h2>
            {info?.level && (
              <span className="animate-pop-in">
                <LevelBadge level={info.level} frequency={info.frequency} variant="full" />
              </span>
            )}
          </div>
          <div className="mt-3 flex min-h-6 flex-wrap gap-2 text-xs font-medium">
            {info?.pos.map((p) => (
              <span key={p} className="animate-fade-in rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                {PART_OF_SPEECH_LABELS[p]}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {canSpeak && (
            <button type="button" className={iconButton} aria-label={`Pronounce ${word}`} title="Pronounce" onClick={() => speak(word)}>
              <SpeakerIcon />
            </button>
          )}
          <button type="button" className={iconButton} aria-label={`Copy ${word}`} title="Copy word" onClick={() => onCopy(word, `“${word}”`)}>
            <CopyIcon />
          </button>
          <button type="button" className={iconButton} aria-label="Copy link to this search" title="Copy link" onClick={onShare}>
            <ShareIcon />
          </button>
          <button
            type="button"
            className={`${iconButton} ${isFavorite ? "!border-amber-300 !bg-amber-50 !text-amber-500 dark:!border-amber-500/50 dark:!bg-amber-500/10" : ""}`}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            title={`${isFavorite ? "Remove from" : "Add to"} favorites (F)`}
            onClick={onToggleFavorite}
          >
            <StarIcon filled={isFavorite} className={isFavorite ? "animate-pop-in" : ""} />
          </button>
        </div>
      </div>

      <div className="relative">
        {loading && !info ? (
          <div className="mt-6 space-y-3" aria-hidden="true">
            <div className="skeleton h-4 w-11/12" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        ) : definitions.length > 0 ? (
          <>
            <ol className="mt-6 space-y-3">
              {visible.map((def, index) => (
                <li
                  key={index}
                  className="flex animate-fade-up gap-3 text-slate-700 dark:text-slate-300"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <span className="mt-0.5 w-6 shrink-0 text-sm font-semibold tabular-nums text-slate-400">{index + 1}.</span>
                  <p className="leading-relaxed">
                    {def.pos && (
                      <em className="mr-2 text-sm font-medium not-italic text-indigo-600 dark:text-indigo-400">
                        {PART_OF_SPEECH_LABELS[def.pos].toLowerCase()}
                      </em>
                    )}
                    {def.text}
                  </p>
                </li>
              ))}
            </ol>
            {definitions.length > PREVIEW_COUNT && (
              <button
                type="button"
                aria-expanded={expanded}
                className="mt-3 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Show fewer definitions" : `Show all ${definitions.length} definitions`}
              </button>
            )}
          </>
        ) : (
          !loading && <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">No definition available for this word.</p>
        )}

        {examples === null ? (
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800" aria-hidden="true">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton mt-3 h-4 w-4/5" />
          </div>
        ) : (
          examples.length > 0 && (
            <div className="mt-6 animate-fade-in border-t border-slate-100 pt-5 dark:border-slate-800">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <QuoteIcon /> Examples
              </h3>
              <ul className="mt-3 space-y-2">
                {examples.map((example, index) => (
                  <li
                    key={index}
                    className="group flex animate-fade-up items-start gap-3 rounded-xl border-l-2 border-indigo-400/60 bg-slate-50/80 py-2 pl-3 pr-2 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <p className="flex-1 italic leading-relaxed">
                      <Highlighted text={example.text} word={word} />
                      {example.pos && <span className="ml-2 text-xs not-italic text-slate-400">{example.pos.toLowerCase()}</span>}
                    </p>
                    {canSpeak && (
                      <button
                        type="button"
                        aria-label="Read example aloud"
                        title="Read aloud"
                        onClick={() => speak(example.text)}
                        className="rounded-lg p-1.5 text-slate-400 opacity-100 transition hover:bg-white hover:text-indigo-600 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-slate-700"
                      >
                        <SpeakerIcon />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-slate-400">
                Examples from{" "}
                <a
                  href={`https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-indigo-600"
                >
                  Wiktionary
                </a>{" "}
                (CC BY-SA)
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
