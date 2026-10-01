import { MODES, type Mode } from "../lib/datamuse";

interface ModeTabsProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
  centered?: boolean;
}

export function ModeTabs({ mode, onChange, centered = false }: ModeTabsProps) {
  return (
    <div
      role="group"
      aria-label="Search type"
      className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 ${centered ? "sm:justify-center" : ""}`}
    >
      {MODES.map((m, index) => {
        const active = m.id === mode;
        return (
          <button
            key={m.id}
            type="button"
            title={`${m.description} (${index + 1})`}
            aria-pressed={active}
            onClick={() => onChange(m.id)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition duration-200 active:scale-95 ${
              active
                ? "border-transparent bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                : "border-slate-200 bg-white/70 text-slate-600 backdrop-blur hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
