import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

// ─── Card ───────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
  padding = 20,
}: {
  children: ReactNode;
  style?: CSSProperties;
  padding?: number;
}) {
  return (
    <div
      style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 12,
        padding,
        boxShadow: '0 1px 2px var(--c-shadow)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── PageHeader ─────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div>
        <h1 style={{ fontSize: 22, marginBottom: subtitle ? 4 : 0 }}>{title}</h1>
        {subtitle && (
          <p style={{ color: 'var(--c-textMuted)', fontSize: 14 }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

// ─── Button ─────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'primary',
  size = 'md',
  style,
  children,
  ...rest
}: ButtonProps) {
  const palette: Record<ButtonVariant, CSSProperties> = {
    primary: {
      background: 'var(--c-primary)',
      color: 'var(--c-textInverse)',
      border: '1px solid var(--c-primary)',
    },
    secondary: {
      background: 'var(--c-surface)',
      color: 'var(--c-text)',
      border: '1px solid var(--c-border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--c-text)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'var(--c-error)',
      color: '#fff',
      border: '1px solid var(--c-error)',
    },
  };
  const sizing: Record<ButtonSize, CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: 13 },
    md: { padding: '9px 16px', fontSize: 14 },
  };
  return (
    <button
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 8,
        fontWeight: 600,
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        opacity: rest.disabled ? 0.55 : 1,
        transition: 'transform 50ms ease, opacity 100ms ease, box-shadow 100ms ease',
        whiteSpace: 'nowrap',
        ...palette[variant],
        ...sizing[size],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Input / Select / Textarea ──────────────────────────────────────────────

const fieldBase: CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--c-border)',
  background: 'var(--c-surface)',
  color: 'var(--c-text)',
  outline: 'none',
  fontSize: 14,
};

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...fieldBase, ...props.style }} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...fieldBase, minHeight: 84, fontFamily: 'inherit', ...props.style }}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...fieldBase, ...props.style }} />;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          fontSize: 13,
          color: 'var(--c-textMuted)',
          fontWeight: 500,
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span
          style={{
            display: 'block',
            marginTop: 4,
            fontSize: 12,
            color: 'var(--c-textMuted)',
          }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

// ─── Pill ───────────────────────────────────────────────────────────────────

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

const toneColor: Record<Tone, { bg: string; text: string }> = {
  neutral: { bg: 'var(--c-divider)', text: 'var(--c-textMuted)' },
  primary: { bg: 'rgba(30,58,138,0.10)', text: 'var(--c-primary)' },
  success: { bg: 'rgba(16,185,129,0.12)', text: 'var(--c-success)' },
  warning: { bg: 'rgba(245,158,11,0.15)', text: 'var(--c-warning)' },
  error: { bg: 'rgba(239,68,68,0.12)', text: 'var(--c-error)' },
  info: { bg: 'rgba(59,130,246,0.12)', text: 'var(--c-info)' },
};

export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const c = toneColor[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: c.bg,
        color: c.text,
        fontSize: 12,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

export function KpiCard({
  label,
  value,
  delta,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: Tone;
}) {
  const c = toneColor[tone];
  return (
    <Card>
      <div
        style={{
          fontSize: 12,
          color: 'var(--c-textMuted)',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.1 }}>
        {value}
      </div>
      {delta && (
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: c.text }}>
          {delta}
        </div>
      )}
    </Card>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: 'var(--c-textMuted)',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--c-text)', marginBottom: 4 }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 13, marginBottom: action ? 16 : 0 }}>{description}</div>
      )}
      {action}
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  width = 480,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--c-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--c-surface)',
          borderRadius: 14,
          width: '100%',
          maxWidth: width,
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          border: '1px solid var(--c-border)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--c-divider)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: 16 }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--c-textMuted)',
              fontSize: 22,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 20, overflow: 'auto' }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--c-divider)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Table ──────────────────────────────────────────────────────────────────

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string | number;
  align?: 'left' | 'right' | 'center';
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
}: {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}) {
  if (rows.length === 0) {
    return <Card padding={0}>{empty ?? <EmptyState title="No results" />}</Card>;
  }
  return (
    <Card padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    textAlign: col.align ?? 'left',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--c-divider)',
                    fontSize: 12,
                    color: 'var(--c-textMuted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    width: col.width,
                    background: 'var(--c-background)',
                    position: 'sticky',
                    top: 0,
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 80ms ease',
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) e.currentTarget.style.background = 'var(--c-divider)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--c-divider)',
                      textAlign: col.align ?? 'left',
                      color: 'var(--c-text)',
                    }}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Toolbar ────────────────────────────────────────────────────────────────

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        color: 'var(--c-textMuted)',
        fontWeight: 600,
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}

export function StatRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        padding: '10px 0',
        borderBottom: '1px solid var(--c-divider)',
        fontSize: 14,
      }}
    >
      <span style={{ color: 'var(--c-textMuted)' }}>{label}</span>
      <span style={{ color: 'var(--c-text)', fontWeight: 500, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

// ─── Banner (info / warning) ────────────────────────────────────────────────

export function Banner({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warning' | 'error' | 'success';
  children: ReactNode;
}) {
  const colors: Record<typeof tone, { bg: string; bd: string; tx: string }> = {
    info: { bg: 'rgba(59,130,246,0.08)', bd: 'rgba(59,130,246,0.30)', tx: 'var(--c-info)' },
    warning: { bg: 'rgba(245,158,11,0.10)', bd: 'rgba(245,158,11,0.35)', tx: 'var(--c-warning)' },
    error: { bg: 'rgba(239,68,68,0.10)', bd: 'rgba(239,68,68,0.35)', tx: 'var(--c-error)' },
    success: { bg: 'rgba(16,185,129,0.10)', bd: 'rgba(16,185,129,0.35)', tx: 'var(--c-success)' },
  };
  const c = colors[tone];
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.bd}`,
        color: c.tx,
        padding: '10px 14px',
        borderRadius: 10,
        fontSize: 13,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}
