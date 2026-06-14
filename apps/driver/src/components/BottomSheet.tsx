import React, { useEffect, useRef, type PropsWithChildren } from 'react';
import {
  Animated,
  PanResponder,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

// Draggable bottom sheet with two snap points: expanded (translateY = 0)
// and collapsed (translateY = COLLAPSED_OFFSET, mostly hidden below screen).
// The drag area is the handle row only — touch events anywhere else inside
// the sheet are passed through to children (scroll lists, buttons, etc.).
//
// Why PanResponder instead of react-native-gesture-handler / Reanimated:
//   - No extra native deps to manage in the EAS build.
//   - The interaction is simple: one axis, two snap points, no fling-decay.
//   - PanResponder is built into React Native; ships with the runtime.

interface BottomSheetProps {
  style?: StyleProp<ViewStyle>;
  // How far (in px) the sheet slides down when collapsed. Default hides
  // most of the content but keeps the handle + first row visible so the
  // user knows the sheet is still there.
  collapsedOffset?: number;
  // Initial state. Default: expanded.
  initialExpanded?: boolean;
}

const DEFAULT_COLLAPSED_OFFSET = 280;

export function BottomSheet({
  children,
  style,
  collapsedOffset = DEFAULT_COLLAPSED_OFFSET,
  initialExpanded = true,
}: PropsWithChildren<BottomSheetProps>) {
  const { colors, radius, spacing, elevation } = useTheme();

  const translateY = useRef(
    new Animated.Value(initialExpanded ? 0 : collapsedOffset),
  ).current;
  // Snap state is tracked in a ref because PanResponder callbacks close
  // over their initial values and we need the current snap to compute the
  // drag start offset on each gesture.
  const expandedRef = useRef(initialExpanded);

  useEffect(() => {
    translateY.setValue(expandedRef.current ? 0 : collapsedOffset);
  }, [collapsedOffset, translateY]);

  const snapTo = (toExpanded: boolean) => {
    expandedRef.current = toExpanded;
    Animated.spring(translateY, {
      toValue: toExpanded ? 0 : collapsedOffset,
      friction: 9,
      tension: 70,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      // Claim the gesture only on a vertical drag of at least 4px — keeps
      // simple taps from triggering an unwanted toggle.
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        const base = expandedRef.current ? 0 : collapsedOffset;
        const next = Math.max(0, Math.min(collapsedOffset, base + g.dy));
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const base = expandedRef.current ? 0 : collapsedOffset;
        const released = base + g.dy;
        const halfway = collapsedOffset / 2;
        // Snap based on final position AND velocity — a quick flick should
        // commit the swipe direction even if the finger didn't travel past
        // the halfway mark.
        const flicked = Math.abs(g.vy) > 0.6;
        const wantsCollapse = flicked ? g.vy > 0 : released > halfway;
        snapTo(!wantsCollapse);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.card,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingTop: spacing.sm,
          paddingHorizontal: spacing.base,
          paddingBottom: spacing.lg,
          transform: [{ translateY }],
          ...elevation.sheet,
        },
        style,
      ]}
    >
      {/* Drag handle row — only this area accepts pan gestures so list
          scrolls inside `children` stay snappy. Bigger hit target than the
          visual handle so it's easy to grab. */}
      <View
        {...panResponder.panHandlers}
        style={{
          alignSelf: 'stretch',
          alignItems: 'center',
          paddingVertical: spacing.sm,
          marginBottom: spacing.sm,
        }}
      >
        <View
          style={{
            width: 44,
            height: 5,
            borderRadius: 3,
            backgroundColor: colors.border,
          }}
        />
      </View>
      {children}
    </Animated.View>
  );
}
