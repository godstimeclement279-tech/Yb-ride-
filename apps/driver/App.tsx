import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AuthProvider } from './src/context/AuthContext';
import { TripProvider } from './src/context/TripContext';
import { RootNavigator } from './src/navigation/RootNavigator';

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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
  );
}
