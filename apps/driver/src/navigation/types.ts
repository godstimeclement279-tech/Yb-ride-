import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  BrandSplash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Main: undefined;
  TripDetails: { bookingId: string };
  ActiveTrip: undefined;
  Earnings: undefined;
  Settings: undefined;
  Profile: undefined;
  Vehicle: undefined;
  Documents: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Trips: undefined;
  EarningsTab: undefined;
  ProfileTab: undefined;
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
