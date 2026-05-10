import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Badge } from './Badge';
import { IconTile } from './IconTile';

interface OfferCardProps {
  code: string;
  description: string;
  expiresLabel?: string;
  onPress?: () => void;
}

// Promo offer row — tag icon + code + description + expires-pill, soft card.
export function OfferCard({ code, description, expiresLabel, onPress }: OfferCardProps) {
  const { colors, radius, spacing } = useTheme();

  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.base,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
      }}
    >
      <IconTile size={48} variant="card">
        <Text style={{ fontSize: 18 }}>🏷</Text>
      </IconTile>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Text variant="bodyStrong">{code}</Text>
          {expiresLabel && <Badge label={expiresLabel} tone="success" />}
        </View>
        <Text variant="small" color="muted">
          {description}
        </Text>
      </View>
      <Text variant="body" color="subtle">›</Text>
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      {inner}
    </Pressable>
  );
}
