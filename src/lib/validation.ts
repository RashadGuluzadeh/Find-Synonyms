export const MAX_QUERY_LENGTH = 50;

// Letters (any script), combining marks, spaces, hyphens and apostrophes.
// Wildcards such as `*` or `?` are rejected because Datamuse treats them as patterns.
const ALLOWED_QUERY = /^\p{L}[\p{L}\p{M}' -]*$/u;

export type ValidationResult = { ok: true; value: string } | { ok: false; error: string };

export function normalizeQuery(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function validateQuery(raw: string): ValidationResult {
  const value = normalizeQuery(raw);
  if (!value) return { ok: false, error: "Type a word to search." };
  if (value.length > MAX_QUERY_LENGTH) {
    return { ok: false, error: `Keep it under ${MAX_QUERY_LENGTH} characters.` };
  }
  if (!ALLOWED_QUERY.test(value)) {
    return { ok: false, error: "Use letters, spaces, hyphens or apostrophes only." };
  }
  return { ok: true, value };
}

export const isValidQuery = (raw: string) => validateQuery(raw).ok;
