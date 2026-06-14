import React, { useEffect } from 'react';
import { LogBox, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Suppress the Firestore "could not reach backend" / "client is offline"
// LogBox overlay in dev. The SDK logs these as console.error internally,
// which dev mode promotes to a full-screen red overlay — even when our
// AuthContext already catches the same error and surfaces a clean retry
// message on the Login screen. Production builds have no LogBox so this is
// purely a dev-mode UX fix.
LogBox.ignoreLogs([
  /Could not reach Cloud Firestore backend/,
  /Failed to get document because the client is offline/,
]);
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AuthProvider } from './src/context/AuthContext';
import { TripProvider } from './src/context/TripContext';
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
  // Preload Ionicons font at app start. Without this, the first screens to
  // render large icons (BrandSplash logo via car-sport, Onboarding hero)
  // can paint blank on Android cold-start because the font hasn't loaded
  // its TTF yet. Fire-and-forget: icons appear when ready, app doesn't
  // block on font.
  useEffect(() => {
    Font.loadAsync(Ionicons.font).catch(() => {
      /* font load failure is non-fatal */
    });
  }, []);

  return (
    <RuntimeErrorTrap>
      {/* Yellow bg matches native splash + BrandSplash so the brief gap
          between native-splash dismiss and first JS frame doesn't flash
          white. */}
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FACC15' }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <TripProvider>
                <ThemedStatusBar />
                <RootNavigator />
              </TripProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </RuntimeErrorTrap>
  );
}
