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
  // Default 'light' (was 'system'). YB Ride brand = yellow accent on white
  // background; we don't yet ship a dark-mode visual treatment that
  // matches the brand, so override system dark-mode to keep the brand
  // palette consistent across all phones. setMode is still exposed so a
  // future Settings toggle can opt back into system or dark.
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<ThemeMode | 'system'>('light');

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
