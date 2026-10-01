import { useCallback, useEffect, useState } from "react";
import { readWordList, writeWordList } from "../lib/storage";

/** A small, de-duplicated list of words persisted to localStorage (newest first). */
export function useWordList(key: string, max: number) {
  const [words, setWords] = useState(() => readWordList(key, max));

  useEffect(() => writeWordList(key, words), [key, words]);

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === `fs:${key}`) setWords(readWordList(key, max));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, max]);

  const add = useCallback(
    (word: string) => setWords((prev) => [word, ...prev.filter((w) => w !== word)].slice(0, max)),
    [max],
  );
  const remove = useCallback((word: string) => setWords((prev) => prev.filter((w) => w !== word)), []);
  const toggle = useCallback(
    (word: string) =>
      setWords((prev) =>
        prev.includes(word) ? prev.filter((w) => w !== word) : [word, ...prev].slice(0, max),
      ),
    [max],
  );
  const clear = useCallback(() => setWords([]), []);

  return { words, add, remove, toggle, clear };
}
