import { NavLink, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Operations',
    items: [
      { to: '/', label: 'Dashboard', icon: '◈', end: true },
      { to: '/bookings', label: 'Bookings', icon: '⊕' },
      { to: '/drivers', label: 'Drivers', icon: '⌖' },
      { to: '/passengers', label: 'Passengers', icon: '◉' },
      { to: '/staff', label: 'Staff', icon: '◇' },
    ],
  },
  {
    section: 'Configuration',
    items: [
      { to: '/car-types', label: 'Car types', icon: '▤' },
      { to: '/zones', label: 'Zones', icon: '◬' },
      { to: '/promos', label: 'Promos', icon: '◎' },
    ],
  },
  {
    section: 'Insights',
    items: [
      { to: '/reports', label: 'Reports', icon: '⊞' },
      { to: '/settings', label: 'Settings', icon: '⚙' },
    ],
  },
];

function Brand() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '20px 20px 16px 20px',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'var(--c-primary)',
          color: 'var(--c-textInverse)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: 0.5,
        }}
      >
        YB
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>YB Ride</div>
        <div style={{ fontSize: 11, color: 'var(--c-textMuted)' }}>Admin</div>
      </div>
    </div>
  );
}

function NavRow({ to, label, icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        margin: '2px 8px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        color: isActive ? 'var(--c-textInverse)' : 'var(--c-text)',
        background: isActive ? 'var(--c-primary)' : 'transparent',
        textDecoration: 'none',
        transition: 'background 100ms ease',
      })}
    >
      <span
        style={{
          width: 18,
          textAlign: 'center',
          fontSize: 14,
          opacity: 0.8,
        }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

function Sidebar() {
  return (
    <aside
      style={{
        width: 240,
        background: 'var(--c-surface)',
        borderRight: '1px solid var(--c-border)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <Brand />
      <nav style={{ flex: 1, paddingBottom: 16 }}>
        {NAV.map((group) => (
          <div key={group.section} style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                color: 'var(--c-textMuted)',
                fontWeight: 600,
                padding: '0 20px 6px 20px',
              }}
            >
              {group.section}
            </div>
            {group.items.map((it) => (
              <NavRow key={it.to} {...it} />
            ))}
          </div>
        ))}
      </nav>
      <FooterCard />
    </aside>
  );
}

function FooterCard() {
  return (
    <div
      style={{
        padding: 12,
        margin: 12,
        borderRadius: 10,
        background: 'var(--c-divider)',
        fontSize: 12,
        color: 'var(--c-textMuted)',
      }}
    >
      <div style={{ color: 'var(--c-text)', fontWeight: 600, marginBottom: 4 }}>
        YB Ride · Admin
      </div>
      v0.1.0
    </div>
  );
}

function Topbar({ children }: { children?: ReactNode }) {
  const { mode, toggle } = useTheme();
  const { admin, signOutNow } = useAuth();
  const initial = (admin?.name ?? 'A').charAt(0).toUpperCase();
  const onSignOut = async () => {
    if (!window.confirm('Sign out of the admin dashboard?')) return;
    try {
      await signOutNow();
    } catch (err) {
      if (import.meta.env.DEV) console.warn('signOut failed', err);
    }
  };
  return (
    <header
      style={{
        height: 56,
        borderBottom: '1px solid var(--c-border)',
        background: 'var(--c-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
        {children}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={toggle}
          aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
          style={{
            background: 'transparent',
            border: '1px solid var(--c-border)',
            borderRadius: 8,
            padding: '6px 10px',
            color: 'var(--c-text)',
            fontSize: 13,
          }}
        >
          {mode === 'light' ? '🌙 Dark' : '☀ Light'}
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 12,
            borderLeft: '1px solid var(--c-divider)',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--c-primary)',
              color: 'var(--c-textInverse)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {initial}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600 }}>
              {admin?.name ?? 'Admin'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-textMuted)' }}>
              {admin?.email ?? 'admin'}
            </div>
          </div>
          <button
            onClick={onSignOut}
            aria-label="Sign out"
            style={{
              marginLeft: 8,
              background: 'transparent',
              border: '1px solid var(--c-border)',
              borderRadius: 8,
              padding: '6px 10px',
              color: 'var(--c-text)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

export function Layout() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--c-background)',
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px 48px 32px',
          }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
