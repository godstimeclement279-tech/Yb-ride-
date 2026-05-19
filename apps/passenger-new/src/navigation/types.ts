import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type LocationSearchMode = 'pickup' | 'dropoff';

// Pre-auth screens. Mounted instead of RootStack while status='signed_out'.
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  LocationSearch: { mode: LocationSearchMode };
  MapPicker: { mode: LocationSearchMode } | undefined;
  FareBreakdown: undefined;
  Payment: { bookingId: string };
  TripTracking: { bookingId: string };
  Rating: { bookingId: string };
  Receipt: { bookingId: string };
  SavedAddresses: undefined;
  AddAddress: { addressId?: string } | undefined;
  PromoCodes: undefined;
  PaymentMethods: undefined;
  Notifications: undefined;
  EditProfile: undefined;
  HelpCenter: undefined;
  Privacy: undefined;
  Legal: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
