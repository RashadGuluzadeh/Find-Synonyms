/**
 * Hardened JSON fetching shared by every API client. Requests are limited to an
 * explicit origin allowlist, never send credentials or a referrer, time out,
 * can be aborted, and have their content type and size checked before parsing.
 */

// Keep in sync with `connect-src` in vite.config.ts.
const ALLOWED_ORIGINS = new Set(["https://api.datamuse.com", "https://en.wiktionary.org"]);

const REQUEST_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_BYTES = 512 * 1024;
const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_LIMIT = 200;

export class ApiError extends Error {
  override name = "ApiError";
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/* ---------------------------------------------------------------- cache -- */

const cache = new Map<string, { at: number; data: unknown }>();

function readCache(key: string): unknown {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  // Refresh insertion order so the map behaves as an LRU.
  cache.delete(key);
  cache.set(key, hit);
  return hit.data;
}

function writeCache(key: string, data: unknown) {
  cache.set(key, { at: Date.now(), data });
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/* -------------------------------------------------------------- request -- */

interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  maxBytes?: number;
}

export async function requestJson(url: URL, { signal, headers, maxBytes = DEFAULT_MAX_BYTES }: RequestOptions = {}) {
  if (url.protocol !== "https:" || !ALLOWED_ORIGINS.has(url.origin)) {
    throw new ApiError("Blocked request to an unexpected origin.");
  }

  const key = url.toString();
  const cached = readCache(key);
  if (cached !== undefined) return cached;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const forwardAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", forwardAbort, { once: true });

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      method: "GET",
      mode: "cors",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      headers,
    });
    if (response.status === 429) throw new ApiError("Too many requests. Please wait a moment.", 429);
    if (!response.ok) throw new ApiError(`The word service responded with ${response.status}.`, response.status);
    if (!(response.headers.get("content-type") ?? "").includes("application/json")) {
      throw new ApiError("The word service returned an unexpected response.");
    }
    const declared = Number(response.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > maxBytes) throw new ApiError("The response was too large.");
    const text = await response.text();
    if (text.length > maxBytes) throw new ApiError("The response was too large.");

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError("The word service returned malformed data.");
    }
    writeCache(key, data);
    return data;
  } catch (error) {
    if (isAbortError(error) || controller.signal.aborted) {
      if (timedOut) throw new ApiError("The request timed out. Check your connection and retry.");
      throw new DOMException("Aborted", "AbortError");
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError("Couldn't reach the word service. Check your connection.");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }
}
