import { useCallback, useEffect, useRef, useState } from "react";
import { getMode, isMode, MODES, type Mode } from "./lib/datamuse";
import { validateQuery } from "./lib/validation";
import { randomWord } from "./lib/words";
import { useWordSearch, type SearchTarget } from "./hooks/useWordSearch";
import { useWordList } from "./hooks/useWordList";
import { useTheme } from "./hooks/useTheme";
import { SearchBox } from "./components/SearchBox";
import { ModeTabs } from "./components/ModeTabs";
import { WordOverview } from "./components/WordOverview";
import { ResultsPanel } from "./components/ResultsPanel";
import { SidePanel } from "./components/SidePanel";
import { ExplorationTrail } from "./components/ExplorationTrail";
import { ShortcutsDialog } from "./components/ShortcutsDialog";
import { WordOfTheDay } from "./components/WordOfTheDay";
import { CheckIcon, DiceIcon, KeyboardIcon, LogoMark, MoonIcon, SunIcon } from "./components/icons";

const EXAMPLES = ["happy", "beautiful", "fast", "important", "smart", "ocean"];
const MAX_TRAIL = 12;

/** How a search affects the exploration path: start over, go one step deeper, or leave it alone. */
type TrailAction = "reset" | "push" | "keep";

/** Reads `?q=word&mode=syn` from the URL, ignoring anything that fails validation. */
function readUrlState(): { target: SearchTarget | null; mode: Mode } {
  const params = new URLSearchParams(window.location.search);
  const rawMode = params.get("mode");
  const mode: Mode = isMode(rawMode) ? rawMode : "syn";
  const check = validateQuery(params.get("q") ?? "");
  return { target: check.ok ? { word: check.value, mode } : null, mode };
}

function writeUrlState(target: SearchTarget | null) {
  const url = new URL(window.location.href);
  url.search = "";
  if (target) {
    url.searchParams.set("q", target.word);
    if (target.mode !== "syn") url.searchParams.set("mode", target.mode);
  }
  if (url.href !== window.location.href) window.history.pushState(null, "", url);
}

const isTypingTarget = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

export function App() {
  const initial = useRef(readUrlState()).current;
  const [query, setQuery] = useState(initial.target?.word ?? "");
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [target, setTarget] = useState<SearchTarget | null>(initial.target);
  const [trail, setTrail] = useState<string[]>(initial.target ? [initial.target.word] : []);
  const [inputError, setInputError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { theme, toggleTheme } = useTheme();
  const history = useWordList("history", 20);
  const favorites = useWordList("favorites", 50);
  const search = useWordSearch(target);
  const addToHistory = history.add;

  const runSearch = useCallback(
    (raw: string, options: { mode?: Mode; trail?: TrailAction } = {}) => {
      const check = validateQuery(raw);
      if (!check.ok) {
        setInputError(check.error);
        inputRef.current?.focus();
        return;
      }
      const word = check.value;
      const next = { word, mode: options.mode ?? mode };
      const action = options.trail ?? "reset";
      setInputError(null);
      setQuery(word);
      setMode(next.mode);
      setTarget(next);
      setTrail((prev) => {
        if (action === "push") return prev.at(-1) === word ? prev : [...prev, word].slice(-MAX_TRAIL);
        if (action === "keep" && prev.length) return prev;
        return [word];
      });
      writeUrlState(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [mode],
  );

  const showToast = useCallback((text: string) => setToast({ id: Date.now(), text }), []);

  const copy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`Copied ${label}`);
      } catch {
        showToast("Couldn't access the clipboard");
      }
    },
    [showToast],
  );

  const changeMode = useCallback(
    (next: Mode) => {
      if (target) runSearch(target.word, { mode: next, trail: "keep" });
      else setMode(next);
    },
    [target, runSearch],
  );

  const toggleFavorite = useCallback(() => {
    if (!target) return;
    const adding = !favorites.words.includes(target.word);
    favorites.toggle(target.word);
    showToast(adding ? `Added “${target.word}” to favorites` : `Removed “${target.word}” from favorites`);
  }, [target, favorites, showToast]);

  const surpriseMe = useCallback(() => runSearch(randomWord(target?.word)), [runSearch, target]);

  const goHome = () => {
    setTarget(null);
    setQuery("");
    setTrail([]);
    setInputError(null);
    writeUrlState(null);
  };

  // Record successful lookups only, so typos that returned errors don't clutter history.
  useEffect(() => {
    if (search.status === "success" && search.word) addToHistory(search.word);
  }, [search.status, search.word, addToHistory]);

  // Back / forward buttons.
  useEffect(() => {
    const onPopState = () => {
      const state = readUrlState();
      setMode(state.mode);
      setTarget(state.target);
      setQuery(state.target?.word ?? "");
      setInputError(null);
      setTrail((prev) => {
        if (!state.target) return [];
        const index = prev.indexOf(state.target.word);
        return index >= 0 ? prev.slice(0, index + 1) : [state.target.word];
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Global keyboard shortcuts (ignored while typing or when a modifier is held).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey || showShortcuts) return;
      const key = event.key.toLowerCase();
      const modeIndex = Number(key) - 1;
      if (key === "/") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (key === "?") {
        setShowShortcuts(true);
      } else if (Number.isInteger(modeIndex) && modeIndex >= 0 && modeIndex < MODES.length) {
        changeMode(MODES[modeIndex]!.id);
      } else if (key === "f") {
        toggleFavorite();
      } else if (key === "r") {
        surpriseMe();
      } else if (key === "t") {
        toggleTheme();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [changeMode, toggleFavorite, surpriseMe, toggleTheme, showShortcuts]);

  // The sticky search bar only gets its frosted background once content scrolls underneath it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.title = target ? `${target.word} · ${getMode(target.mode).label} — Find Synonyms` : "Find Synonyms";
  }, [target]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const searchControls = (
    <>
      <SearchBox
        value={query}
        onChange={(v) => {
          setQuery(v);
          if (inputError) setInputError(null);
        }}
        onSearch={(word) => runSearch(word)}
        error={inputError}
        inputRef={inputRef}
      />
      <div className="mt-3">
        <ModeTabs mode={mode} onChange={changeMode} centered={!target} />
      </div>
    </>
  );

  return (
    <div className="relative flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {/* Decorative animated background. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="dot-grid absolute inset-0" />
        <div className="absolute -top-48 left-1/2 h-[520px] w-[min(1100px,140vw)] -translate-x-1/2">
          <div className="h-full w-full animate-aurora rounded-full bg-gradient-to-r from-indigo-400/30 via-purple-400/25 to-sky-300/25 blur-3xl dark:from-indigo-600/25 dark:via-purple-600/20 dark:to-sky-500/10" />
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/60 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button type="button" onClick={goHome} className="group flex items-center gap-2.5 rounded-lg" aria-label="Find Synonyms — home">
            <LogoMark className="h-8 w-8 transition duration-300 group-hover:rotate-[-8deg] group-hover:scale-110" />
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Find Synonyms</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={surpriseMe}
              title="Surprise me (R)"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <DiceIcon className="text-lg" /> <span className="hidden sm:inline">Surprise me</span>
            </button>
            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
              className="hidden rounded-xl p-2.5 text-xl text-slate-600 transition hover:bg-slate-200/60 sm:block dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <KeyboardIcon />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              title="Toggle theme (T)"
              className="rounded-xl p-2.5 text-xl text-slate-600 transition hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span key={theme} className="block animate-pop-in">
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20">
        {target ? (
          <>
            {/* Spans the full content width so it lines up with both result columns below. */}
            <div className="z-30 pt-6 lg:sticky lg:top-16">
              <section
                aria-label="Search"
                className={`border-transparent transition-all duration-300 lg:rounded-3xl lg:border ${
                  scrolled
                    ? "lg:-mx-3 lg:mt-2 lg:border-slate-200/70 lg:bg-white/75 lg:p-3 lg:shadow-xl lg:shadow-slate-900/5 lg:backdrop-blur-xl dark:lg:border-slate-800/70 dark:lg:bg-slate-900/75 dark:lg:shadow-black/30"
                    : ""
                }`}
              >
                {searchControls}
              </section>
            </div>

            <div className="mt-3">
              <ExplorationTrail
                trail={trail}
                onSelect={(index) => {
                  const word = trail[index];
                  if (!word) return;
                  setTrail(trail.slice(0, index + 1));
                  runSearch(word, { trail: "keep" });
                }}
              />
            </div>

            <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0 space-y-6">
                <WordOverview
                  key={target.word}
                  word={target.word}
                  info={search.word === target.word ? search.info : null}
                  loading={search.status === "loading" || search.word !== target.word}
                  isFavorite={favorites.words.includes(target.word)}
                  onToggleFavorite={toggleFavorite}
                  onShare={() => copy(window.location.href, "link")}
                  onCopy={copy}
                />
                <ResultsPanel
                  word={target.word}
                  mode={getMode(target.mode)}
                  status={search.word === target.word ? search.status : "loading"}
                  results={search.results}
                  error={search.error}
                  onRetry={search.retry}
                  onExplore={(word) => runSearch(word, { trail: "push" })}
                  onCopy={copy}
                />
              </div>
              <div className="lg:sticky lg:top-60">
                <SidePanel
                  favorites={favorites.words}
                  history={history.words}
                  currentWord={target.word}
                  onSelect={(word) => runSearch(word)}
                  onRemoveFavorite={favorites.remove}
                  onClearHistory={history.clear}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-3xl pt-14 sm:pt-24">
            <div className="mb-10 animate-fade-up text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-700 backdrop-blur dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                8 ways to explore · CEFR levels · examples
              </span>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                Find the{" "}
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">right word</span>
              </h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                Synonyms, antonyms, rhymes, related words, definitions and real examples — instantly.
              </p>
            </div>

            <section aria-label="Search" className="animate-fade-up [animation-delay:80ms]">
              {searchControls}
            </section>

            <div className="mt-8 animate-fade-up text-center [animation-delay:160ms]">
              <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Try one of these</p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => runSearch(word)}
                    className="rounded-full border border-slate-200 bg-white/70 px-4 py-1.5 text-sm text-slate-700 backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 animate-fade-up space-y-4 [animation-delay:240ms]">
              <WordOfTheDay onExplore={(word) => runSearch(word)} />
              {(favorites.words.length > 0 || history.words.length > 0) && (
                <SidePanel
                  layout="grid"
                  favorites={favorites.words}
                  history={history.words}
                  currentWord={null}
                  onSelect={(word) => runSearch(word)}
                  onRemoveFavorite={favorites.remove}
                  onClearHistory={history.clear}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200/70 py-6 text-center text-sm text-slate-500 dark:border-slate-800/70 dark:text-slate-400">
        Word data from{" "}
        <a href="https://www.datamuse.com/api/" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Datamuse
        </a>{" "}
        and{" "}
        <a href="https://en.wiktionary.org/" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Wiktionary
        </a>
        . Press <kbd className="rounded border border-slate-300 px-1 dark:border-slate-700">?</kbd> for shortcuts.
      </footer>

      <ShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <div
            key={toast.id}
            className="flex animate-toast-in items-center gap-2 rounded-2xl bg-slate-900/95 px-4 py-3 text-sm font-medium text-white shadow-2xl shadow-slate-900/20 backdrop-blur dark:bg-white/95 dark:text-slate-900"
          >
            <CheckIcon className="text-emerald-400 dark:text-emerald-600" /> {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}
