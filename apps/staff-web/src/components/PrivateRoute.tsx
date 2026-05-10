import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Gate any route behind a signed-in staff session. Renders a full-screen
 * splash while the auth state is being resolved; redirects to /login otherwise.
 */
export function PrivateRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <SplashLoader />;

  if (status !== 'signed_in') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

function SplashLoader() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-background)',
        color: 'var(--c-textMuted)',
        fontSize: 14,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            margin: '0 auto 12px',
            borderRadius: 10,
            background: 'var(--c-primary)',
            color: 'var(--c-textInverse)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 0.5,
          }}
        >
          YB
        </div>
        Loading…
      </div>
    </div>
  );
}
