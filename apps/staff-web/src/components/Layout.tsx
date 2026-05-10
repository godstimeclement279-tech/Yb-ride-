import { NavLink, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { FIREBASE_CONFIGURED } from '../services/firebase';

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
      { to: '/fleet', label: 'Live fleet', icon: '◬' },
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
        <div style={{ fontSize: 11, color: 'var(--c-textMuted)' }}>Staff console</div>
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
      <span style={{ width: 18, textAlign: 'center', fontSize: 14, opacity: 0.85 }}>
        {icon}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

function StaffCard() {
  const { staff, signOutNow } = useAuth();
  if (!staff) return null;
  return (
    <div
      style={{
        margin: 12,
        padding: 12,
        borderRadius: 10,
        background: 'var(--c-divider)',
        fontSize: 12,
      }}
    >
      <div
        style={{
          color: 'var(--c-text)',
          fontWeight: 600,
          marginBottom: 2,
          fontSize: 13,
        }}
      >
        {staff.name}
      </div>
      <div style={{ color: 'var(--c-textMuted)', marginBottom: 8 }}>{staff.email}</div>
      <div
        style={{
          color: 'var(--c-textMuted)',
          marginBottom: 10,
          fontSize: 11,
          lineHeight: 1.35,
        }}
      >
        {staff.permissions.length} permission{staff.permissions.length === 1 ? '' : 's'}
      </div>
      <button
        onClick={() => {
          void signOutNow();
        }}
        style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid var(--c-border)',
          borderRadius: 8,
          padding: '6px 10px',
          color: 'var(--c-text)',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Sign out
      </button>
    </div>
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
      <StaffCard />
    </aside>
  );
}

function Topbar({ children }: { children?: ReactNode }) {
  const { mode, toggle } = useTheme();
  const { staff } = useAuth();
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
        {!FIREBASE_CONFIGURED && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(245,158,11,0.15)',
              color: 'var(--c-warning)',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            Demo mode · backend not connected
          </span>
        )}
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
        {staff && (
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
              {initialsOf(staff.name)}
            </div>
            <div style={{ fontSize: 13 }}>
              <div style={{ fontWeight: 600 }}>{staff.name}</div>
              <div style={{ fontSize: 11, color: 'var(--c-textMuted)' }}>Staff</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
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
