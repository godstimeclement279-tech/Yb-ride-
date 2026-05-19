import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, Field, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';

interface LocationState {
  from?: string;
}

export function Login() {
  const { status, errorMessage, signIn, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = ((location.state as LocationState | null)?.from) ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'signed_in') {
      navigate(from, { replace: true });
    }
  }, [status, from, navigate]);

  if (status === 'signed_in') {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      // Already surfaced by AuthContext.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-background)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 8px 30px var(--c-shadow)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
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
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>YB Ride</div>
            <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
              Admin console
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Sign in</h1>
        <p style={{ fontSize: 13, color: 'var(--c-textMuted)', marginBottom: 24 }}>
          Admins only. Need access? Ask another admin to add you.
        </p>

        {!configured && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--c-warning)',
              background: 'rgba(245,158,11,0.10)',
              border: '1px solid rgba(245,158,11,0.35)',
              padding: '10px 12px',
              borderRadius: 10,
              marginBottom: 16,
              lineHeight: 1.45,
            }}
          >
            <strong>Firebase not configured.</strong> Set the config in
            <code> src/services/firebase/config.ts</code> before signing in.
          </div>
        )}

        {errorMessage && (status === 'error' || status === 'unauthorized') && (
          <div
            style={{
              fontSize: 13,
              color: 'var(--c-error)',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.30)',
              padding: '10px 12px',
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14 }}>
          <Field label="Email">
            <Input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ybride.ng"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" disabled={submitting || !email || !password}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
