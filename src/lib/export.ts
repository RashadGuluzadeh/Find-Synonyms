import { PART_OF_SPEECH_LABELS, type WordResult } from "./datamuse";

/**
 * Quotes a CSV cell and neutralises spreadsheet formulas (CSV injection):
 * cells starting with = + - @ or a control character are prefixed with '.
 */
function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(results: WordResult[]): string {
  const header = ["word", "estimated_level", "part_of_speech", "relevance", "uses_per_million"];
  const rows = results.map((r) => [
    r.word,
    r.level ?? "",
    r.pos.map((p) => PART_OF_SPEECH_LABELS[p]).join(" / "),
    r.score,
    r.frequency == null ? "" : r.frequency.toFixed(3),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function toText(results: WordResult[]): string {
  return results.map((r) => (r.level ? `${r.word} (${r.level})` : r.word)).join("\n");
}

/** Only allow plain file names: letters, digits, dot, dash and underscore. */
export function safeFileName(name: string): string {
  return name.replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "words";
}

export function downloadFile(fileName: string, content: string, mime: string) {
  // The BOM makes Excel open UTF-8 CSV files correctly.
  const blob = new Blob(["﻿", content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFileName(fileName);
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
