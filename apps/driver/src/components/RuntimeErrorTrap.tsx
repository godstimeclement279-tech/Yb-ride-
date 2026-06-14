import React from 'react';
import { ScrollView, Text, View } from 'react-native';

// Render-error boundary + global JS error handler. Catches:
//   - render errors via getDerivedStateFromError
//   - async / setTimeout / unhandled-promise errors via ErrorUtils
// Both render their message + stack onscreen so a user without USB debugging
// can screenshot what broke. Pair with the boot-time trap in index.ts to
// catch module-load failures (which happen before this component mounts).

interface State {
  error: Error | null;
  globalError: { message: string; stack?: string; isFatal?: boolean } | null;
}

interface ErrorUtilsShim {
  setGlobalHandler: (h: (e: Error, fatal: boolean) => void) => void;
  getGlobalHandler: () => (e: Error, fatal: boolean) => void;
}

export class RuntimeErrorTrap extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null, globalError: null };

  constructor(props: { children: React.ReactNode }) {
    super(props);
    // Install the global handler in the constructor (runs BEFORE children
    // mount + their effects fire) so an early useEffect throw is captured.
    const errorUtils = (globalThis as unknown as { ErrorUtils?: ErrorUtilsShim }).ErrorUtils;
    if (errorUtils) {
      const prev = errorUtils.getGlobalHandler();
      errorUtils.setGlobalHandler((error, isFatal) => {
        this.setState({
          globalError: {
            message: String(error?.message ?? error),
            stack: String(error?.stack ?? ''),
            isFatal,
          },
        });
        prev(error, isFatal);
      });
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[RuntimeErrorTrap]', error, info.componentStack);
  }

  render(): React.ReactNode {
    const { error, globalError } = this.state;
    if (!error && !globalError) return this.props.children;

    const title = error ? 'Render crash' : 'Runtime crash';
    const msg = error?.message ?? globalError?.message ?? 'unknown';
    const stack = error?.stack ?? globalError?.stack ?? '';

    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', paddingTop: 60, paddingHorizontal: 16 }}>
        <Text style={{ color: '#FACC15', fontSize: 22, fontWeight: '900', marginBottom: 8 }}>
          {title}
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 14, marginBottom: 12 }}>
          Screenshot this screen and send it to the developer.
        </Text>
        <ScrollView style={{ flex: 1 }}>
          <Text selectable style={{ color: '#FF7B7B', fontSize: 13, fontFamily: 'monospace', marginBottom: 12 }}>
            {msg}
          </Text>
          <Text selectable style={{ color: '#CCCCCC', fontSize: 11, fontFamily: 'monospace' }}>
            {stack}
          </Text>
        </ScrollView>
      </View>
    );
  }
}
