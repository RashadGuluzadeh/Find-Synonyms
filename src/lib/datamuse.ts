import { estimateLevel, type CefrLevel } from "./level";

import { ApiError, isRecord, requestJson } from "./http";

const API_ORIGIN = "https://api.datamuse.com";
const MAX_RESULTS = 100;
const MAX_WORD_LENGTH = 80;

export type Mode = "syn" | "ml" | "ant" | "trg" | "jjb" | "jja" | "rhy" | "sl";

export interface ModeInfo {
  id: Mode;
  label: string;
  description: string;
  param: string;
}

export const MODES: readonly ModeInfo[] = [
  { id: "syn", label: "Synonyms", description: "Words with the same meaning", param: "rel_syn" },
  { id: "ml", label: "Similar", description: "Words with a similar meaning", param: "ml" },
  { id: "ant", label: "Antonyms", description: "Words with the opposite meaning", param: "rel_ant" },
  { id: "trg", label: "Related", description: "Words often associated with it", param: "rel_trg" },
  { id: "jjb", label: "Describing", description: "Adjectives used to describe it", param: "rel_jjb" },
  { id: "jja", label: "Described", description: "Nouns it is used to describe", param: "rel_jja" },
  { id: "rhy", label: "Rhymes", description: "Words that rhyme with it", param: "rel_rhy" },
  { id: "sl", label: "Sounds like", description: "Words that sound similar", param: "sl" },
];

export const isMode = (value: unknown): value is Mode =>
  typeof value === "string" && MODES.some((m) => m.id === value);

export const getMode = (id: Mode): ModeInfo => MODES.find((m) => m.id === id) ?? MODES[0]!;

export type PartOfSpeech = "noun" | "verb" | "adj" | "adv";

export const PART_OF_SPEECH_LABELS: Record<PartOfSpeech, string> = {
  noun: "Noun",
  verb: "Verb",
  adj: "Adjective",
  adv: "Adverb",
};

const POS_TAGS: Record<string, PartOfSpeech> = { n: "noun", v: "verb", adj: "adj", adv: "adv" };

export interface WordResult {
  word: string;
  score: number;
  pos: PartOfSpeech[];
  /** Occurrences per million words, when known. */
  frequency: number | null;
  level: CefrLevel | null;
}

export interface Definition {
  pos: PartOfSpeech | null;
  text: string;
}

export interface WordInfo {
  word: string;
  pos: PartOfSpeech[];
  definitions: Definition[];
  /** Occurrences per million words, when known. */
  frequency: number | null;
  level: CefrLevel | null;
}

export { ApiError, isAbortError } from "./http";

async function getJson(path: string, params: Record<string, string>, signal?: AbortSignal) {
  // URLSearchParams encodes every value, so user input can never inject extra parameters.
  const url = new URL(path, API_ORIGIN);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return requestJson(url, { signal });
}

/* -------------------------------------------------------------- parsing -- */

const isSafeWord = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= MAX_WORD_LENGTH &&
  // No control characters.
  !/[\u0000-\u001f\u007f]/.test(value);

function parseTags(tags: unknown) {
  const pos = new Set<PartOfSpeech>();
  let frequency: number | null = null;
  if (Array.isArray(tags)) {
    for (const tag of tags) {
      if (typeof tag !== "string") continue;
      const mapped = POS_TAGS[tag];
      if (mapped) pos.add(mapped);
      else if (tag.startsWith("f:")) {
        const value = Number(tag.slice(2));
        if (Number.isFinite(value) && value >= 0) frequency = value;
      }
    }
  }
  return { pos: [...pos], frequency };
}

function parseWordList(data: unknown): WordResult[] {
  if (!Array.isArray(data)) throw new ApiError("The word service returned unexpected data.");
  const seen = new Set<string>();
  const results: WordResult[] = [];
  for (const item of data.slice(0, MAX_RESULTS)) {
    if (!isRecord(item) || !isSafeWord(item.word)) continue;
    const word = item.word.toLowerCase();
    if (seen.has(word)) continue;
    seen.add(word);
    const score = typeof item.score === "number" && Number.isFinite(item.score) ? item.score : 0;
    const { pos, frequency } = parseTags(item.tags);
    results.push({ word, score, pos, frequency, level: estimateLevel(frequency) });
  }
  return results;
}

function parseDefinitions(defs: unknown): Definition[] {
  if (!Array.isArray(defs)) return [];
  const definitions: Definition[] = [];
  for (const raw of defs.slice(0, 20)) {
    if (typeof raw !== "string") continue;
    const tab = raw.indexOf("\t");
    const tag = tab > -1 ? raw.slice(0, tab) : "";
    const text = (tab > -1 ? raw.slice(tab + 1) : raw).trim().slice(0, 500);
    if (text) definitions.push({ pos: POS_TAGS[tag] ?? null, text });
  }
  return definitions;
}

/* ------------------------------------------------------------ endpoints -- */

export async function fetchRelatedWords(word: string, mode: Mode, signal?: AbortSignal) {
  const data = await getJson(
    "/words",
    { [getMode(mode).param]: word, md: "pf", max: String(MAX_RESULTS) },
    signal,
  );
  return parseWordList(data).filter((r) => r.word !== word);
}

export async function fetchWordInfo(word: string, signal?: AbortSignal): Promise<WordInfo | null> {
  const data = await getJson("/words", { sp: word, qe: "sp", md: "dpf", max: "1" }, signal);
  if (!Array.isArray(data)) return null;
  const match = data.find(
    (item): item is Record<string, unknown> =>
      isRecord(item) && isSafeWord(item.word) && item.word.toLowerCase() === word,
  );
  if (!match) return null;
  const { pos, frequency } = parseTags(match.tags);
  return { word, pos, frequency, level: estimateLevel(frequency), definitions: parseDefinitions(match.defs) };
}

export async function fetchSuggestions(prefix: string, signal?: AbortSignal) {
  const data = await getJson("/sug", { s: prefix, max: "8" }, signal);
  return parseWordList(data).map((r) => r.word);
}
