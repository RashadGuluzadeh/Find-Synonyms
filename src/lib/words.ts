/** Hand-picked words that are interesting to explore, used for "Word of the day" and "Surprise me". */
export const CURATED_WORDS = [
  "serendipity", "eloquent", "resilient", "ephemeral", "candid", "meticulous", "vivid", "tenacious",
  "benevolent", "curious", "luminous", "pragmatic", "nostalgia", "whimsical", "diligent", "profound",
  "subtle", "vibrant", "humble", "brave", "gentle", "clever", "graceful", "fierce", "serene", "bold",
  "wander", "flourish", "ponder", "embrace", "inspire", "cherish", "thrive", "glimmer", "harmony",
  "journey", "wisdom", "courage", "freedom", "wonder", "delight", "radiant", "steadfast", "zealous",
  "ambiguous", "articulate", "authentic", "compassion", "elegant", "genuine", "intricate", "jubilant",
  "lucid", "mellow", "nimble", "optimistic", "placid", "quaint", "robust", "tranquil", "versatile",
] as const;

/** The same word for everyone on a given (local) day. */
export function wordOfTheDay(date = new Date()): string {
  const day = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return CURATED_WORDS[day % CURATED_WORDS.length]!;
}

export function randomWord(exclude?: string): string {
  const pool = CURATED_WORDS.filter((w) => w !== exclude);
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return pool[values[0]! % pool.length]!;
}
