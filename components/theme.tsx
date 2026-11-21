"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { defaultPreferences, getPreferences, savePreferences } from "@/lib/store";
import type { Preferences } from "@/lib/contracts";

interface ThemeCtx {
  prefs: Preferences;
  setTheme: (t: Preferences["theme"]) => void;
  setContrast: (c: Preferences["contrast"]) => void;
  resolvedDark: boolean;
}

const Ctx = createContext<ThemeCtx>({
  prefs: defaultPreferences,
  setTheme: () => {},
  setContrast: () => {},
  resolvedDark: false,
});

export function useTheme(): ThemeCtx {
  return useContext(Ctx);
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Aplica tema y contraste al documento antes del paint (y en cambios). */
export function applyPreferences(prefs: Preferences): void {
  const dark = prefs.theme === "dark" || (prefs.theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.classList.toggle("contrast-high", prefs.contrast === "alto");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const initial = getPreferences();
    setPrefs(initial);
    applyPreferences(initial);
    setSystemDark(systemPrefersDark());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      setSystemDark(media.matches);
      if (getPreferences().theme === "system") applyPreferences(getPreferences());
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((theme: Preferences["theme"]) => {
    const next: Preferences = { ...getPreferences(), theme };
    savePreferences(next);
    setPrefs(next);
    applyPreferences(next);
  }, []);

  const setContrast = useCallback((contrast: Preferences["contrast"]) => {
    const next: Preferences = { ...getPreferences(), contrast };
    savePreferences(next);
    setPrefs(next);
    applyPreferences(next);
  }, []);

  const resolvedDark = useMemo(
    () => prefs.theme === "dark" || (prefs.theme === "system" && systemDark),
    [prefs.theme, systemDark],
  );

  return (
    <Ctx.Provider value={{ prefs, setTheme, setContrast, resolvedDark }}>{children}</Ctx.Provider>
  );
}
