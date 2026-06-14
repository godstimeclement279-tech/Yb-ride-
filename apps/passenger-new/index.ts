// Boot-time crash trap. Runs before any heavy side-effect imports so any
// module-load failure (Firebase init, native module register, etc.) shows
// up as visible text instead of a silent crash. ErrorBoundary inside
// App.tsx covers render + effect errors; this catches anything that fires
// before that boundary can mount.

import 'react-native-gesture-handler';
import '@expo/metro-runtime';
import { enableScreens } from 'react-native-screens';
// Enable native screens before any navigator mounts. Default-on since v3,
// but the explicit call is the RN-Navigation team's production guidance
// for Hermes/Android builds where the default sometimes isn't honored.
enableScreens(true);

import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';

interface BootError {
  where: string;
  message: string;
  stack: string;
}

interface ErrorUtilsShim {
  setGlobalHandler: (h: (e: Error, fatal: boolean) => void) => void;
  getGlobalHandler: () => (e: Error, fatal: boolean) => void;
}

let bootError: BootError | null = null;

function capture(where: string, e: unknown): void {
  if (bootError) return;
  const err = e as { message?: string; stack?: string } | undefined;
  bootError = {
    where,
    message: String(err?.message ?? e),
    stack: String(err?.stack ?? ''),
  };
}

const errorUtils = (globalThis as unknown as { ErrorUtils?: ErrorUtilsShim }).ErrorUtils;
if (errorUtils) {
  const prev = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    capture('global', error);
    try {
      registerRootComponent(RootShell);
    } catch {
      /* ignore */
    }
    prev(error, isFatal);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RealApp: any = null;
try {
  RealApp = require('./App').default;
} catch (e) {
  capture('App', e);
}

function BootErrorScreen(): React.ReactElement {
  const err = bootError ?? { where: 'unknown', message: 'No error captured', stack: '' };
  return React.createElement(
    View,
    { style: { flex: 1, backgroundColor: '#0A0A0A', paddingTop: 60, paddingHorizontal: 16 } },
    React.createElement(
      Text,
      { style: { color: '#FACC15', fontSize: 22, fontWeight: '900', marginBottom: 4 } },
      'Boot crash',
    ),
    React.createElement(
      Text,
      { style: { color: '#FACC15', fontSize: 13, marginBottom: 8 } },
      'where: ' + err.where,
    ),
    React.createElement(
      Text,
      { style: { color: '#FFFFFF', fontSize: 13, marginBottom: 12 } },
      'Screenshot this screen and send it to the developer.',
    ),
    React.createElement(
      ScrollView,
      { style: { flex: 1 } },
      React.createElement(
        Text,
        {
          selectable: true,
          style: { color: '#FF7B7B', fontSize: 13, marginBottom: 12 },
        },
        err.message,
      ),
      React.createElement(
        Text,
        { selectable: true, style: { color: '#CCCCCC', fontSize: 11 } },
        err.stack,
      ),
    ),
  );
}

function RootShell(): React.ReactElement | null {
  if (bootError || !RealApp) return React.createElement(BootErrorScreen);
  return React.createElement(RealApp);
}

registerRootComponent(RootShell);
