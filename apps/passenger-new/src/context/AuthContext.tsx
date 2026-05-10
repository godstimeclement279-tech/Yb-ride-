import React, {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { TEST_USERS, type Passenger } from '@yb/shared';

// MVP: hardcoded test passenger. Real Firebase Auth ships in the post-MVP pass.
const TEST_PASSENGER: Passenger = {
  id: TEST_USERS.PASSENGER,
  role: 'passenger',
  name: 'Test Passenger',
  phone: '+2348000000000',
  email: 'passenger@yb-ride.test',
  isActive: true,
  totalTrips: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

interface AuthContextValue {
  user: Passenger;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const value = useMemo<AuthContextValue>(() => ({ user: TEST_PASSENGER }), []);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
