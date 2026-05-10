import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { darkPalette, lightPalette, type ThemePalette } from './colors';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  palette: ThemePalette;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'yb-admin-theme';

function readInitial(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readInitial);

  const palette = mode === 'dark' ? darkPalette : lightPalette;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
    const root = document.documentElement;
    root.dataset.theme = mode;
    Object.entries(palette).forEach(([k, v]) => {
      root.style.setProperty(`--c-${k}`, v);
    });
    root.style.colorScheme = mode;
  }, [mode, palette]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      palette,
      toggle: () => setModeState((m) => (m === 'light' ? 'dark' : 'light')),
      setMode: setModeState,
    }),
    [mode, palette],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
