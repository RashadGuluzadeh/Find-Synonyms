import { useCallback, useEffect, useState } from "react";
import {
  fetchRelatedWords,
  fetchWordInfo,
  isAbortError,
  type Mode,
  type WordInfo,
  type WordResult,
} from "../lib/datamuse";

export type SearchStatus = "idle" | "loading" | "success" | "error";

export interface SearchTarget {
  word: string;
  mode: Mode;
}

interface SearchState {
  /** The word these results belong to, so callers never pair stale data with a new word. */
  word: string | null;
  status: SearchStatus;
  results: WordResult[];
  info: WordInfo | null;
  error: string | null;
}

const IDLE: SearchState = { word: null, status: "idle", results: [], info: null, error: null };

export function useWordSearch(target: SearchTarget | null) {
  const [state, setState] = useState<SearchState>(IDLE);
  const [attempt, setAttempt] = useState(0);
  const word = target?.word;
  const mode = target?.mode;

  useEffect(() => {
    if (!word || !mode) {
      setState(IDLE);
      return;
    }
    // Aborting on cleanup guarantees a slow, stale response can never overwrite a newer one.
    const controller = new AbortController();
    // Keep the definition when only the mode changes; drop it when the word changes.
    setState((prev) => ({
      word,
      status: "loading",
      results: [],
      info: prev.word === word ? prev.info : null,
      error: null,
    }));

    Promise.all([
      fetchRelatedWords(word, mode, controller.signal),
      // Definitions are a bonus: their failure must not break the main results.
      fetchWordInfo(word, controller.signal).catch((error: unknown) => {
        if (isAbortError(error)) throw error;
        return null;
      }),
    ])
      .then(([results, info]) => setState({ word, status: "success", results, info, error: null }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setState({
          word,
          status: "error",
          results: [],
          info: null,
          error: error instanceof Error ? error.message : "Something went wrong.",
        });
      });

    return () => controller.abort();
  }, [word, mode, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}
