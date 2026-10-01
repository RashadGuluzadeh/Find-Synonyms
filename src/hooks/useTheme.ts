import { useCallback, useEffect, useState } from "react";
import { writeString } from "../lib/storage";

export type Theme = "light" | "dark";

export function useTheme() {
  // public/theme-init.js has already applied the right class before React loads.
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      writeString("theme", next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
