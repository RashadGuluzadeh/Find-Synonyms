import { isValidQuery } from "./validation";

const PREFIX = "fs:";

/**
 * Reads a list of words from localStorage. Anything that is not a valid search
 * term is dropped, so tampered storage can never feed unexpected data to the UI.
 */
export function readWordList(key: string, max: number): string[] {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw || raw.length > 20_000) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const words = parsed.filter((item): item is string => typeof item === "string" && isValidQuery(item));
    return [...new Set(words)].slice(0, max);
  } catch {
    return [];
  }
}

export function writeWordList(key: string, words: string[]) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(words));
  } catch {
    // Storage full or disabled (e.g. private mode) — persistence is best effort.
  }
}

export function readString(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string) {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // ignore
  }
}
