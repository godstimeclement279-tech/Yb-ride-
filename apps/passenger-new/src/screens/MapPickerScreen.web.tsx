import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { useTheme } from '../theme/ThemeProvider';

// Web fallback. The native picker uses @rnmapbox/maps which is iOS/Android only.
// On web preview, point the user back to address search.
export function MapPickerScreen() {
  const navigation = useNavigation();
  const { spacing } = useTheme();

  return (
    <Screen scroll>
      <Header title="Set on Map" back />
      <Card variant="soft">
        <View style={{ gap: spacing.sm }}>
          <Text variant="h4">Mobile only</Text>
          <Text variant="body" color="muted">
            The map picker uses native maps and only runs on the iOS or Android app.
            Use the search field to type or pick a saved place instead.
          </Text>
        </View>
      </Card>
      <Button label="Back to search" onPress={() => navigation.goBack()} size="lg" />
    </Screen>
  );
}
