import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Button } from './Button';

// Brand-styled confirm dialog. Replaces the native `Alert.alert` two-button
// pattern with a card that uses the app's theme. Mirrors the driver-side
// ConfirmDialog so the two apps feel like one product family.
//
// Use for any "are you sure?" prompt — sign out, cancel ride, remove card,
// etc. For an info-only "OK" dialog, pass cancelLabel="" so only the
// confirm button renders.

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // 'danger' uses red tone; 'primary' uses brand yellow.
  confirmTone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors, spacing, radius } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(lift, {
          toValue: 0,
          friction: 9,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fade.setValue(0);
      lift.setValue(20);
    }
  }, [visible, fade, lift]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          opacity: fade,
        }}
      >
        {/* Tap outside to cancel. */}
        <Pressable
          onPress={onCancel}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <Animated.View
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
            transform: [{ translateY: lift }],
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text variant="h4" style={{ marginBottom: message ? spacing.xs : spacing.md }}>
            {title}
          </Text>

          {message ? (
            <Text variant="body" color="muted" style={{ marginBottom: spacing.lg, lineHeight: 22 }}>
              {message}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {cancelLabel ? (
              <View style={{ flex: 1 }}>
                <Button label={cancelLabel} variant="secondary" onPress={onCancel} />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Button
                label={confirmLabel}
                variant={confirmTone === 'danger' ? 'danger' : 'primary'}
                onPress={onConfirm}
              />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
