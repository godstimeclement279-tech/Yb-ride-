// Boot-time crash trap. Runs before any heavy side-effect imports so any
// module-load failure (Firebase init, native module register, etc.) shows
// up as visible text instead of a silent crash. ErrorBoundary inside
// App.tsx covers render + effect errors; this catches anything that fires
// before that boundary can mount.
//
// Keep imports minimal at the top — if these fail, nothing renders. The
// expensive imports (App, locationTask) are wrapped in require() so we can
// try/catch around them and degrade to a visible Boot Error screen.

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

// Install a global handler as early as possible. ErrorUtils is a RN global
// that fires for uncaught JS errors (including ones that escape promise
// chains once the runtime patches Promise to report unhandled rejections).
const errorUtils = (globalThis as unknown as { ErrorUtils?: ErrorUtilsShim }).ErrorUtils;
if (errorUtils) {
  const prev = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    capture('global', error);
    try {
      // Best-effort re-register the root with the error screen — the bridge
      // ignores duplicate registrations once attached, so this is no-op
      // after first mount; the on-screen text shows via the RuntimeErrorTrap
      // ErrorBoundary in App.tsx instead.
      registerRootComponent(RootShell);
    } catch {
      /* ignore */
    }
    prev(error, isFatal);
  });
}

// Driver-specific: register background-location TaskManager task at boot.
// Wrap in try/catch — if expo-task-manager native module isn't registered
// yet, the throw lands in the Boot Error screen instead of killing the app.
try {
  require('./src/services/locationTask');
} catch (e) {
  capture('locationTask', e);
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
