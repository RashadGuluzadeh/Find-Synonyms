import { useEffect, useRef } from "react";
import { MODES } from "../lib/datamuse";
import { CloseIcon } from "./icons";

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: [string[], string][] = [
  [["/"], "Focus the search box"],
  [["1", "–", String(MODES.length)], "Switch search type"],
  [["F"], "Add / remove favorite"],
  [["R"], "Surprise me (random word)"],
  [["T"], "Toggle light / dark theme"],
  [["↑", "↓", "Enter"], "Pick a suggestion"],
  [["Esc"], "Close suggestions / clear search"],
  [["?"], "Show this help"],
];

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="shortcuts-title"
      onClose={onClose}
      // Clicking the backdrop (the dialog element itself) closes it.
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="m-auto w-[min(92vw,440px)] rounded-3xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl open:animate-pop-in dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="shortcuts-title" className="text-lg font-semibold">
            Keyboard shortcuts
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <CloseIcon />
          </button>
        </div>
        <dl className="divide-y divide-slate-100 dark:divide-slate-800">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-slate-600 dark:text-slate-300">{label}</dt>
              <dd className="flex shrink-0 gap-1">
                {keys.map((key) =>
                  key === "–" ? (
                    <span key={key} className="text-slate-400">–</span>
                  ) : (
                    <kbd key={key} className="min-w-7 rounded-md border border-b-2 border-slate-200 bg-slate-50 px-1.5 py-0.5 text-center font-mono text-xs dark:border-slate-700 dark:bg-slate-800">
                      {key}
                    </kbd>
                  ),
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </dialog>
  );
}
