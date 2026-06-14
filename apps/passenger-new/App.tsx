import React, { useEffect } from 'react';
import { LogBox, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Suppress the Firestore "could not reach backend" / "client is offline"
// LogBox overlay in dev. The SDK logs these as console.error internally,
// which dev mode promotes to a full-screen red overlay — even when our auth
// listener already catches the same error and surfaces a clean retry
// message on the Login screen. Production builds have no LogBox so this is
// purely a dev-mode UX fix.
LogBox.ignoreLogs([
  /Could not reach Cloud Firestore backend/,
  /Failed to get document because the client is offline/,
  // expo-location's native module ("ExpoLocation") is only present once the
  // next EAS build with the expo-location dependency lands. Until then the
  // require() falls back gracefully (see deviceLocation.ts), but the loader
  // still bubbles an uncaught error to LogBox. Suppress that noise in dev.
  /Cannot find native module 'ExpoLocation'/,
]);
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { RuntimeErrorTrap } from './src/components/RuntimeErrorTrap';

function ThemedStatusBar() {
  const { mode, colors } = useTheme();
  return (
    <StatusBar
      barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
      backgroundColor={colors.background}
    />
  );
}

export default function App() {
  useEffect(() => {
    // Preload Ionicons font so the first screen to use vector icons doesn't
    // flash empty boxes on Android cold-start.
    Font.loadAsync(Ionicons.font).catch(() => {
      /* font load failure is non-fatal — icons fall back to system */
    });
  }, []);

  return (
    <RuntimeErrorTrap>
      {/* Yellow bg matches native splash + BrandSplash so the brief gap
          between native-splash dismiss and first JS frame doesn't flash
          white. Was visible as a "yellow → white blink → yellow" jolt on
          cold start. */}
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FACC15' }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <ThemedStatusBar />
              <RootNavigator />
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </RuntimeErrorTrap>
  );
}
