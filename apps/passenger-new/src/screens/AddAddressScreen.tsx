import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Pill } from '../components/Pill';
import { Header } from '../components/Header';
import { useTheme } from '../theme/ThemeProvider';
import { MOCK_SAVED_ADDRESSES } from '../data/mockData';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'AddAddress'>;
type AddressType = 'home' | 'work' | 'other';

export function AddAddressScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const editingId = route.params?.addressId;
  const editing = editingId ? MOCK_SAVED_ADDRESSES.find(a => a.id === editingId) : undefined;

  const { colors, spacing, radius, typography } = useTheme();

  const [type, setType] = useState<AddressType>(editing?.type ?? 'home');
  const [label, setLabel] = useState(editing?.label ?? '');
  const [address, setAddress] = useState(editing?.formatted ?? '');

  const fieldBox = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen scroll>
      <Header title={editing ? 'Edit Address' : 'Add Address'} back />

      <Card variant="soft">
        <Text variant="caption" color="muted" style={{ marginBottom: spacing.sm }}>
          TYPE
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pill label="Home" leading={<Text>🏠</Text>} active={type === 'home'} onPress={() => setType('home')} />
          <Pill label="Work" leading={<Text>💼</Text>} active={type === 'work'} onPress={() => setType('work')} />
          <Pill label="Other" leading={<Text>📍</Text>} active={type === 'other'} onPress={() => setType('other')} />
        </View>
      </Card>

      <Card variant="soft">
        <Text variant="caption" color="muted" style={{ marginBottom: spacing.xs }}>
          LABEL
        </Text>
        <View style={fieldBox}>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder={type === 'home' ? 'Home' : type === 'work' ? 'Work' : 'My place'}
            placeholderTextColor={colors.textMuted}
            style={{ color: colors.text, ...typography.body, padding: 0 }}
          />
        </View>

        <View style={{ marginTop: spacing.md }}>
          <Text variant="caption" color="muted" style={{ marginBottom: spacing.xs }}>
            ADDRESS
          </Text>
          <View style={[fieldBox, { minHeight: 90 }]}>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="123 Old Lagos Rd, Agbor, Delta State"
              placeholderTextColor={colors.textMuted}
              multiline
              style={{
                color: colors.text,
                ...typography.body,
                padding: 0,
                textAlignVertical: 'top',
              }}
            />
          </View>
        </View>
      </Card>

      <Button
        label={editing ? 'Save Changes' : 'Add Address'}
        onPress={() => navigation.goBack()}
        size="lg"
        disabled={!label.trim() || !address.trim()}
      />
      {editing && (
        <Button label="Delete" variant="danger" onPress={() => navigation.goBack()} />
      )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
