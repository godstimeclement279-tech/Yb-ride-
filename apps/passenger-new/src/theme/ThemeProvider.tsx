import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette, type ThemePalette } from './colors';
import { spacing, radius, elevation } from './spacing';
import { typography } from './typography';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: ThemePalette;
  spacing: typeof spacing;
  radius: typeof radius;
  elevation: typeof elevation;
  typography: typeof typography;
  setMode: (mode: ThemeMode | 'system') => void;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<ThemeMode | 'system'>('system');

  const mode: ThemeMode =
    override === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : override;

  const value = useMemo<Theme>(
    () => ({
      mode,
      colors: mode === 'dark' ? darkPalette : lightPalette,
      spacing,
      radius,
      elevation,
      typography,
      setMode: setOverride,
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
