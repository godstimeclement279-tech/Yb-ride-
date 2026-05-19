import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

// Gates every admin route behind a /login redirect. Shows a neutral loading
// state while the persisted Firebase Auth session resolves on first render.
export function PrivateRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--c-background)',
          color: 'var(--c-textMuted)',
          fontSize: 13,
        }}
      >
        Loading…
      </div>
    );
  }

  if (status === 'signed_in') return <>{children}</>;

  return <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
