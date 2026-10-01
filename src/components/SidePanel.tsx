import type { ReactNode } from "react";
import { CloseIcon, HistoryIcon, StarIcon } from "./icons";

interface SidePanelProps {
  favorites: string[];
  history: string[];
  currentWord: string | null;
  onSelect: (word: string) => void;
  onRemoveFavorite: (word: string) => void;
  onClearHistory: () => void;
  /** "stack" for the sidebar, "grid" for side-by-side cards on the home page. */
  layout?: "stack" | "grid";
}

export function SidePanel({ favorites, history, currentWord, onSelect, onRemoveFavorite, onClearHistory, layout = "stack" }: SidePanelProps) {
  return (
    <aside
      className={layout === "grid" ? "grid gap-4 sm:grid-cols-2" : "animate-fade-up space-y-4 [animation-delay:140ms]"}
      aria-label="Saved words"
    >
      <Card
        title="Favorites"
        icon={<StarIcon className="text-amber-500" />}
        empty="Star a word to keep it here."
        count={favorites.length}
      >
        {favorites.map((word) => (
          <Chip key={word} word={word} active={word === currentWord} onSelect={onSelect} onRemove={onRemoveFavorite} />
        ))}
      </Card>

      <Card
        title="Recent"
        icon={<HistoryIcon className="text-slate-400" />}
        empty="Your searches will appear here."
        count={history.length}
        action={
          history.length > 0 && (
            <button type="button" onClick={onClearHistory} className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400">
              Clear
            </button>
          )
        }
      >
        {history.map((word) => (
          <Chip key={word} word={word} active={word === currentWord} onSelect={onSelect} />
        ))}
      </Card>
    </aside>
  );
}

interface CardProps {
  title: string;
  icon: ReactNode;
  empty: string;
  count: number;
  action?: ReactNode;
  children: ReactNode;
}

function Card({ title, icon, empty, count, action, children }: CardProps) {
  return (
    <section className="surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          {icon} {title}
          {count > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {count}
            </span>
          )}
        </h2>
        {action}
      </div>
      {count === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{empty}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">{children}</ul>
      )}
    </section>
  );
}

interface ChipProps {
  word: string;
  active: boolean;
  onSelect: (word: string) => void;
  onRemove?: (word: string) => void;
}

function Chip({ word, active, onSelect, onRemove }: ChipProps) {
  return (
    <li
      className={`flex animate-pop-in items-center rounded-lg text-sm transition ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      }`}
    >
      <button type="button" onClick={() => onSelect(word)} aria-current={active || undefined} className={`max-w-[12rem] truncate py-1 pl-3 ${onRemove ? "pr-1" : "pr-3"}`}>
        {word}
      </button>
      {onRemove && (
        <button type="button" aria-label={`Remove ${word} from favorites`} onClick={() => onRemove(word)} className="rounded-md p-1 pr-2 opacity-60 hover:opacity-100">
          <CloseIcon className="text-xs" />
        </button>
      )}
    </li>
  );
}
