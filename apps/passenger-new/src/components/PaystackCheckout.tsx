import React, { useMemo } from 'react';
import { Modal, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Text } from './Text';
import { IconButton } from './IconButton';
import { useTheme } from '../theme/ThemeProvider';
import {
  buildPaystackCheckoutHtml,
  parsePaystackMessage,
  type PaystackCheckoutArgs,
  type PaystackResult,
} from '../services/paystack';

interface PaystackCheckoutProps {
  visible: boolean;
  // Required when visible=true. Hidden modal doesn't render the WebView.
  args?: PaystackCheckoutArgs;
  onClose: () => void;
  onResult: (result: PaystackResult) => void;
}

/**
 * Full-screen modal hosting Paystack's hosted checkout in a WebView.
 *
 * Stage 4a (test keys): the WebView renders an HTML page that boots
 * Paystack's inline-v2 JS and triggers `newTransaction()` with bank
 * transfer as the only channel. The page postMessages success / cancel /
 * error back to React Native; this component routes the event to its
 * parent via onResult.
 */
export function PaystackCheckout({
  visible,
  args,
  onClose,
  onResult,
}: PaystackCheckoutProps) {
  const { colors, spacing } = useTheme();

  const html = useMemo(() => {
    if (!args) return '';
    return buildPaystackCheckoutHtml(args);
  }, [args]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.base,
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <IconButton glyph="×" onPress={onClose} accessibilityLabel="Close payment" />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Secure payment</Text>
            <Text variant="caption" color="muted">
              Bank Transfer · Paystack
            </Text>
          </View>
        </View>

        {visible && args ? (
          <WebView
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://checkout.paystack.com' }}
            onMessage={(event) => {
              const parsed = parsePaystackMessage(event.nativeEvent.data);
              if (parsed) onResult(parsed);
            }}
            // Allow the inline.js script + Paystack's own iframes to load.
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            // iOS in-app browser features needed by Paystack popup.
            allowsInlineMediaPlayback
            // Reduce flicker — show a soft background while loading.
            style={{ flex: 1, backgroundColor: colors.surface }}
            // Web preview: react-native-web's WebView is partial; keep the
            // payment modal mobile-only for now. Web will use a different
            // (redirect-based) flow when we ship the Cloud Function.
            {...(Platform.OS === 'web'
              ? { onLoad: () => onResult({ type: 'error', message: 'Bank-transfer checkout is mobile-only in this preview.' }) }
              : {})}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
