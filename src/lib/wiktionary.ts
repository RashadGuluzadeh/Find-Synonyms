import { ApiError, isRecord, requestJson } from "./http";

const API_ORIGIN = "https://en.wiktionary.org";
const MAX_EXAMPLES = 5;
const MAX_EXAMPLE_LENGTH = 280;

export interface Example {
  pos: string;
  text: string;
}

/**
 * Wiktionary returns examples as HTML fragments. They are parsed into an inert
 * document (DOMParser never runs scripts or loads resources) and only the plain
 * text is kept, so no markup from the API ever reaches the page.
 */
function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

export async function fetchExamples(word: string, signal?: AbortSignal): Promise<Example[]> {
  // encodeURIComponent keeps the word inside a single path segment.
  const url = new URL(`/api/rest_v1/page/definition/${encodeURIComponent(word)}`, API_ORIGIN);

  let data: unknown;
  try {
    data = await requestJson(url, {
      signal,
      maxBytes: 2 * 1024 * 1024,
      // Wikimedia asks API clients to identify themselves.
      headers: { "Api-User-Agent": "FindSynonyms/2.0 (https://github.com/RashadGuluzadeh/Find-Synonyms)" },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return [];
    throw error;
  }

  if (!isRecord(data) || !Array.isArray(data.en)) return [];

  const seen = new Set<string>();
  const examples: Example[] = [];
  for (const entry of data.en) {
    if (!isRecord(entry) || !Array.isArray(entry.definitions)) continue;
    const pos = typeof entry.partOfSpeech === "string" ? entry.partOfSpeech.slice(0, 30) : "";
    for (const def of entry.definitions) {
      if (!isRecord(def) || !Array.isArray(def.examples)) continue;
      for (const raw of def.examples) {
        if (typeof raw !== "string" || raw.length > 5_000) continue;
        const text = htmlToText(raw);
        const key = text.toLowerCase();
        if (text.length < 8 || text.length > MAX_EXAMPLE_LENGTH || seen.has(key)) continue;
        seen.add(key);
        examples.push({ pos, text });
        if (examples.length >= MAX_EXAMPLES) return examples;
      }
    }
  }
  return examples;
}
