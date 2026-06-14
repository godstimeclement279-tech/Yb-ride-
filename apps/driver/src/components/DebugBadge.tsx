import React from 'react';
import { Text, View } from 'react-native';

// withDebugBadge wraps any screen so it:
//   1. Renders a small red "MOUNTED: <name>" badge top-left, proving the
//      component actually mounted. If a screen renders blank, the badge
//      still shows — tells us the screen mounted but its content didn't
//      render. If even the badge is missing, the screen never mounted.
//   2. Catches render-time errors with a per-screen ErrorBoundary and
//      shows "<name> crashed" + message + stack.
//
// Temporary diagnostic — strip before launch.

interface State {
  error: Error | null;
}

export function withDebugBadge<P extends object>(
  name: string,
  Inner: React.ComponentType<P>,
): React.ComponentType<P> {
  class DebugBoundary extends React.Component<P, State> {
    state: State = { error: null };
    static getDerivedStateFromError(error: Error): Partial<State> {
      return { error };
    }
    componentDidCatch(error: Error): void {
      // eslint-disable-next-line no-console
      console.error(`[DebugBadge:${name}]`, error);
    }
    render(): React.ReactNode {
      const { error } = this.state;
      return (
        <View style={{ flex: 1 }}>
          <View
            style={{
              position: 'absolute',
              top: 40,
              left: 8,
              zIndex: 99999,
              backgroundColor: '#FF1744',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>
              {name}
            </Text>
          </View>
          {error ? (
            <View
              style={{
                flex: 1,
                padding: 16,
                paddingTop: 80,
                backgroundColor: '#0A0A0A',
              }}
            >
              <Text style={{ color: '#FACC15', fontWeight: '900', fontSize: 18 }}>
                {name} crashed
              </Text>
              <Text
                selectable
                style={{ color: '#FF7B7B', fontSize: 12, marginTop: 8 }}
              >
                {String(error?.message ?? error)}
              </Text>
              <Text
                selectable
                style={{ color: '#CCCCCC', fontSize: 10, marginTop: 12 }}
              >
                {String(error?.stack ?? '')}
              </Text>
            </View>
          ) : (
            <Inner {...this.props} />
          )}
        </View>
      );
    }
  }
  (DebugBoundary as unknown as { displayName: string }).displayName = `DebugBadge(${name})`;
  return DebugBoundary;
}
