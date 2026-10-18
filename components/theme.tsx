"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { defaultPreferences, getPreferences, savePreferences } from "@/lib/store";
import type { Preferences } from "@/lib/contracts";

interface ThemeCtx {
  prefs: Preferences;
  setTheme: (t: Preferences["theme"]) => void;
  resolvedDark: boolean;
}

const Ctx = createContext<ThemeCtx>({ prefs: defaultPreferences, setTheme: () => {}, resolvedDark: false });

export function useTheme(): ThemeCtx {
  return useContext(Ctx);
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyThemeClass(prefs: Preferences): void {
  const dark = prefs.theme === "dark" || (prefs.theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);

  useEffect(() => {
    const initial = getPreferences();
    setPrefs(initial);
    applyThemeClass(initial);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getPreferences().theme === "system") applyThemeClass(getPreferences());
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((theme: Preferences["theme"]) => {
    const next: Preferences = { ...getPreferences(), theme };
    savePreferences(next);
    setPrefs(next);
    applyThemeClass(next);
  }, []);

  const resolvedDark = useMemo(() => {
    if (typeof window === "undefined") return false;
    return prefs.theme === "dark" || (prefs.theme === "system" && systemPrefersDark());
  }, [prefs.theme]);

  return <Ctx.Provider value={{ prefs, setTheme, resolvedDark }}>{children}</Ctx.Provider>;
}
