import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { formatNaira, type CarType, type FareBreakdown } from '@yb/shared';

interface CarTypeCardProps {
  carType: CarType;
  fare: FareBreakdown | undefined;
  selected: boolean;
  onPress: () => void;
  etaSeconds?: number;
}

const ICONS: Record<string, string> = {
  standard: '🚗',
  premium: '🚙',
  suv: '🚐',
};

export function CarTypeCard({
  carType,
  fare,
  selected,
  onPress,
  etaSeconds,
}: CarTypeCardProps) {
  const { colors, radius, spacing } = useTheme();

  const eta = etaSeconds
    ? etaSeconds < 60
      ? `${etaSeconds}s away`
      : `${Math.round(etaSeconds / 60)} min away`
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 110,
        backgroundColor: selected ? colors.primary : colors.surface,
        borderColor: selected ? colors.primary : colors.border,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing.md,
        opacity: pressed ? 0.8 : 1,
        alignItems: 'center',
        gap: 4,
      })}
    >
      <Text style={{ fontSize: 28 }}>{ICONS[carType.id] ?? '🚕'}</Text>
      <Text
        variant="bodyStrong"
        style={{ color: selected ? colors.textInverse : colors.text }}
      >
        {carType.name}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
        <Text
          variant="caption"
          style={{ color: selected ? colors.textInverse : colors.textMuted }}
        >
          {carType.seats} seats
        </Text>
      </View>
      {fare ? (
        <Text
          variant="bodyStrong"
          style={{ color: selected ? colors.textInverse : colors.text, marginTop: 2 }}
        >
          {formatNaira(fare.total)}
        </Text>
      ) : (
        <Text
          variant="small"
          style={{ color: selected ? colors.textInverse : colors.textMuted }}
        >
          —
        </Text>
      )}
      {eta && (
        <Text
          variant="caption"
          style={{ color: selected ? colors.textInverse : colors.textMuted }}
        >
          {eta}
        </Text>
      )}
    </Pressable>
  );
}
