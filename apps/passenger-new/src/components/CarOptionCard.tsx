import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Badge } from './Badge';
import { formatNaira, type CarType, type FareBreakdown } from '@yb/shared';

interface CarOptionCardProps {
  carType: CarType;
  fare: FareBreakdown | undefined;
  selected: boolean;
  onPress: () => void;
  etaSeconds?: number;
  badge?: string;
  promo?: string;
}

const ICON: Record<string, string> = {
  standard: '🚗',
  premium: '🚙',
  suv: '🚐',
};

const ICON_BG: Record<string, string> = {
  standard: '#E8EEFF',
  premium: '#1A1A1F',
  suv: '#F0F4FF',
};

// Horizontal car-option row. Image-tile thumb + name + FASTEST badge +
// ETA + price + optional Promo line. Selected state = blue 2px border.
export function CarOptionCard({
  carType,
  fare,
  selected,
  onPress,
  etaSeconds,
  badge = 'FASTEST',
  promo,
}: CarOptionCardProps) {
  const { colors, radius, spacing } = useTheme();
  const [imageBroken, setImageBroken] = useState(false);

  const eta = etaSeconds
    ? etaSeconds < 60
      ? `${etaSeconds}s away`
      : `${Math.round(etaSeconds / 60)} min away`
    : undefined;

  const tileBg = ICON_BG[carType.id] ?? colors.surface;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.base,
        borderRadius: radius.lg,
        // Selected = dark 1.5px border (premium); unselected = transparent
        // border so the row sits flush with no visual frame at rest.
        borderWidth: selected ? 1.5 : 0,
        borderColor: selected ? colors.cta : 'transparent',
        backgroundColor: colors.background,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View
        style={{
          width: 72,
          height: 56,
          borderRadius: radius.md,
          backgroundColor: tileBg,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {carType.iconUrl && !imageBroken ? (
          <Image
            source={{ uri: carType.iconUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            onError={() => setImageBroken(true)}
          />
        ) : (
          <Text style={{ fontSize: 26 }}>{ICON[carType.id] ?? '🚕'}</Text>
        )}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text variant="bodyStrong">{carType.name}</Text>
          {badge && <Badge label={badge} tone="neutral" />}
        </View>
        {eta && (
          <Text variant="small" color="muted">
            {eta}
          </Text>
        )}
      </View>

      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        {fare ? (
          <Text variant="bodyStrong">{formatNaira(fare.total)}</Text>
        ) : (
          <Text variant="bodyStrong" color="muted">—</Text>
        )}
        {promo && (
          <Text variant="caption" color="success" style={{ fontWeight: '600' }}>
            {promo}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
