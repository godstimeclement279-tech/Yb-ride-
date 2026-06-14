import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'yb-driver:onboarding-done';

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    /* swallow */
  }
}
