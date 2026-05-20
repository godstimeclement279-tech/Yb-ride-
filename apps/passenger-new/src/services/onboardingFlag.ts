import AsyncStorage from '@react-native-async-storage/async-storage';

// Single-source-of-truth for "has the user seen onboarding". Stored in
// AsyncStorage so it survives app restarts but does NOT survive uninstall —
// which is the right default: a reinstall feels like a fresh first-launch.

const KEY = 'yb-passenger:onboarding-done';

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    // On AsyncStorage failure we treat the user as new — better to show
    // onboarding twice than to gatekeep them out of the app.
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    /* swallow — worst case the next launch shows onboarding again */
  }
}

// Mainly for QA: clear the flag from a Settings screen if we ever add one.
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* swallow */
  }
}
