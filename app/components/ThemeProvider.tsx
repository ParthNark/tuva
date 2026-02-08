"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_THEME, THEMES, ThemeKey } from "@/app/theme/themes";

const THEME_STORAGE_KEY = "tuva-theme";

type ThemeContextValue = {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  themes: typeof THEMES;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

function isThemeKey(value: string | null): value is ThemeKey {
  return THEMES.some((theme) => theme.id === value);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeKey>(DEFAULT_THEME);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeKey(storedTheme)) {
      setTheme(storedTheme);
      return;
    }
    setTheme(DEFAULT_THEME);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      themes: THEMES,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
