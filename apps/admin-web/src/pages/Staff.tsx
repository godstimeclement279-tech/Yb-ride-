import { useState } from 'react';
import type { StaffPermission } from '@yb/shared';
import {
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  Pill,
  Select,
  Table,
  Toolbar,
} from '../components/ui';
import { mockStaff } from '../data/mock';
import { formatRelative } from '../utils/format';
import { createStaffViaCallable } from '../services/firebase/functions';

const ALL_PERMISSIONS: { id: StaffPermission; label: string; description: string }[] = [
  {
    id: 'view_bookings',
    label: 'View bookings',
    description: 'See live + historical bookings.',
  },
  {
    id: 'assign_drivers',
    label: 'Assign drivers',
    description: 'Manually match paid bookings to drivers.',
  },
  {
    id: 'view_fleet',
    label: 'View fleet',
    description: 'See driver locations and statuses on the live map.',
  },
  {
    id: 'cancel_bookings',
    label: 'Cancel bookings',
    description: 'Cancel a booking on behalf of a passenger or driver.',
  },
];

function permissionLabel(p: StaffPermission): string {
  return ALL_PERMISSIONS.find((x) => x.id === p)?.label ?? p;
}

export function Staff() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle="Internal users who handle booking-to-driver assignments."
        actions={<Button onClick={() => setShowCreate(true)}>+ Add staff</Button>}
      />

      <Toolbar>
        <Input placeholder="Search staff…" style={{ maxWidth: 320 }} />
        <Select defaultValue="all" style={{ maxWidth: 180 }}>
          <option value="all">All staff</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </Toolbar>

      <Table
        rows={mockStaff}
        rowKey={(r) => r.id}
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (s) => (
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>{s.email}</div>
              </div>
            ),
          },
          {
            key: 'phone',
            header: 'Phone',
            render: (s) => s.phone,
          },
          {
            key: 'permissions',
            header: 'Permissions',
            render: (s) => (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {s.permissions.map((p) => (
                  <Pill key={p} tone="info">
                    {permissionLabel(p)}
                  </Pill>
                ))}
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (s) =>
              s.isActive ? (
                <Pill tone="success">Active</Pill>
              ) : (
                <Pill tone="neutral">Disabled</Pill>
              ),
          },
          {
            key: 'updated',
            header: 'Last activity',
            render: (s) => (
              <span style={{ color: 'var(--c-textMuted)', fontSize: 13 }}>
                {formatRelative(s.updatedAt)}
              </span>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (s) => (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Button size="sm" variant="secondary">
                  Edit
                </Button>
                {s.isActive ? (
                  <Button size="sm" variant="ghost">
                    Disable
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost">
                    Enable
                  </Button>
                )}
              </div>
            ),
            align: 'right',
          },
        ]}
      />

      <CreateStaffModal open={showCreate} onClose={() => setShowCreate(false)} />

      <div style={{ marginTop: 24 }}>
        <Card>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Permission reference</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {ALL_PERMISSIONS.map((p) => (
              <div key={p.id}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  {p.label}
                </div>
                <div style={{ color: 'var(--c-textMuted)', fontSize: 13 }}>
                  {p.description}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function CreateStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generateTempPassword());
  const [permissions, setPermissions] = useState<Set<StaffPermission>>(
    new Set(['view_bookings', 'assign_drivers']),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ email: string; password: string } | null>(null);

  function toggle(p: StaffPermission) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function reset() {
    setName('');
    setPhone('');
    setEmail('');
    setPassword(generateTempPassword());
    setPermissions(new Set(['view_bookings', 'assign_drivers']));
    setError(null);
    setSuccess(null);
    setSubmitting(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function submit() {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Name, email, and phone are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createStaffViaCallable({
        role: 'staff',
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim(),
        permissions: Array.from(permissions),
      });
      setSuccess({ email: email.trim(), password });
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Could not create staff account.';
      setError(friendlyError(msg));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Modal
        open={open}
        onClose={close}
        title="Staff account created"
        width={520}
        footer={<Button onClick={close}>Done</Button>}
      >
        <div style={{ fontSize: 14, color: 'var(--c-textMuted)', marginBottom: 12 }}>
          Share these credentials with the new staff member. They sign in at the
          staff dashboard. Ask them to change the password on first login.
        </div>
        <div
          style={{
            background: 'var(--c-divider)',
            padding: 12,
            borderRadius: 8,
            display: 'grid',
            gap: 6,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 13,
          }}
        >
          <div>
            <span style={{ color: 'var(--c-textMuted)' }}>Email:</span>{' '}
            <strong>{success.email}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--c-textMuted)' }}>Password:</span>{' '}
            <strong>{success.password}</strong>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add staff member"
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create staff'}
          </Button>
        </>
      }
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        <Field label="Full name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ngozi Eze"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234…"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@ybride.ng"
          />
        </Field>
        <Field label="Initial password">
          <Input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      </div>

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            fontSize: 13,
            color: 'var(--c-textMuted)',
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          Permissions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ALL_PERMISSIONS.map((p) => (
            <label
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                border: '1px solid var(--c-border)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={permissions.has(p.id)}
                onChange={() => toggle(p.id)}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
                  {p.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 14,
            padding: 10,
            background: 'var(--c-errorSoft)',
            color: 'var(--c-error)',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
    </Modal>
  );
}

// Generate an easy-to-read temp password (no ambiguous I / 0 / O / 1 / l).
// Operator can override before submitting.
function generateTempPassword(length = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

// Map raw Firebase callable errors into operator-readable copy.
function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('unauthenticated') || lower.includes('not authenticated')) {
    return 'Sign in as an admin first. Auth gate ships next.';
  }
  if (lower.includes('permission-denied')) {
    return 'Your account does not have admin privileges.';
  }
  if (lower.includes('already-exists') || lower.includes('email or phone')) {
    return 'Email or phone is already in use. Try another.';
  }
  if (lower.includes('invalid-argument')) {
    return 'One or more fields are invalid. Check email + phone format.';
  }
  return msg;
}
