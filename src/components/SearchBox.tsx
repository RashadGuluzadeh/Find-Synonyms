import { useEffect, useId, useState, type KeyboardEvent, type RefObject } from "react";
import { fetchSuggestions, isAbortError } from "../lib/datamuse";
import { MAX_QUERY_LENGTH, validateQuery } from "../lib/validation";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { CloseIcon, SearchIcon } from "./icons";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (word: string) => void;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function SearchBox({ value, onChange, onSearch, error, inputRef }: SearchBoxProps) {
  const id = useId();
  const listId = `${id}-suggestions`;
  const errorId = `${id}-error`;
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounced = useDebouncedValue(value, 180);

  useEffect(() => {
    const check = validateQuery(debounced);
    if (!open || !check.ok || check.value.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    fetchSuggestions(check.value, controller.signal)
      .then((words) => {
        setSuggestions(words.filter((w) => w !== check.value));
        setActiveIndex(-1);
      })
      .catch((err: unknown) => {
        if (!isAbortError(err)) setSuggestions([]);
      });
    return () => controller.abort();
  }, [debounced, open]);

  const showList = open && suggestions.length > 0;

  const choose = (word: string) => {
    setOpen(false);
    setSuggestions([]);
    onSearch(word);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const picked = showList && activeIndex >= 0 ? suggestions[activeIndex] : undefined;
      choose(picked ?? value);
    } else if (event.key === "Escape") {
      if (showList) setOpen(false);
      else onChange("");
    }
  };

  return (
    <form
      role="search"
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        choose(value);
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search for a word
      </label>
      <div
        className={`flex items-center gap-2 rounded-2xl border bg-white/90 px-4 shadow-[0_2px_4px_rgb(15_23_42/0.04),0_12px_32px_-16px_rgb(79_70_229/0.35)] backdrop-blur-xl transition duration-300 focus-within:shadow-[0_0_0_4px_rgb(99_102_241/0.15),0_16px_40px_-12px_rgb(79_70_229/0.45)] dark:bg-slate-900/80 ${
          error
            ? "animate-shake border-rose-400"
            : "border-slate-200 focus-within:border-indigo-400 dark:border-slate-700 dark:focus-within:border-indigo-500"
        }`}
      >
        <SearchIcon className="shrink-0 text-xl text-slate-400" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={value}
          maxLength={MAX_QUERY_LENGTH}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder="Type a word, e.g. happy"
          className="h-14 min-w-0 flex-1 bg-transparent text-lg text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
          >
            <CloseIcon />
          </button>
        )}
        <kbd className="hidden rounded-md border border-slate-200 px-1.5 text-xs text-slate-400 sm:block dark:border-slate-700">
          /
        </kbd>
        <button
          type="submit"
          className="hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:shadow-lg hover:shadow-indigo-500/40 hover:brightness-110 active:scale-95 sm:block"
        >
          Search
        </button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-2 animate-fade-in px-1 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}

      <ul
        id={listId}
        role="listbox"
        aria-label="Suggestions"
        hidden={!showList}
        className="absolute inset-x-0 top-full z-40 mt-2 origin-top animate-pop-in overflow-hidden rounded-2xl border border-slate-200 bg-white/95 py-1 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
      >
        {suggestions.map((word, index) => (
          <li
            key={word}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            // mousedown fires before blur, so the list is still there when the click lands.
            onMouseDown={(event) => {
              event.preventDefault();
              choose(word);
            }}
            onMouseEnter={() => setActiveIndex(index)}
            className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-200 ${
              index === activeIndex ? "bg-indigo-50 dark:bg-indigo-500/15" : ""
            }`}
          >
            <SearchIcon className="text-slate-400" />
            {word}
          </li>
        ))}
      </ul>
    </form>
  );
}
