import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, Field, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { FIREBASE_CONFIGURED } from '../services/firebase';

interface LocationState {
  from?: string;
}

export function Login() {
  const { status, errorMessage, signIn } = useAuth();
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
      // Error message is already rendered from auth context.
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
              Staff console
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Sign in</h1>
        <p style={{ fontSize: 13, color: 'var(--c-textMuted)', marginBottom: 24 }}>
          Use the email + password an admin set up for you.
        </p>

        {!FIREBASE_CONFIGURED && (
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
            <strong>Demo mode.</strong> Use a seeded staff email
            (e.g. <code>ngozi.eze@ybride.ng</code>) with password{' '}
            <code>demo</code>.
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
              placeholder="you@ybride.ng"
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
          <Button
            type="submit"
            disabled={submitting || !email || !password}
            style={{ width: '100%', padding: '11px 16px', marginTop: 4 }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--c-divider)',
            fontSize: 12,
            color: 'var(--c-textMuted)',
            lineHeight: 1.5,
          }}
        >
          Forgot your password? Ask an admin to reset it from the admin
          console.
        </div>
      </div>
    </div>
  );
}
