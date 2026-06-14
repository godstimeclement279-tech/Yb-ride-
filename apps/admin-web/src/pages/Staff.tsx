import { useEffect, useMemo, useState } from 'react';
import type { Staff as StaffRow, StaffPermission } from '@yb/shared';
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
import { formatRelative } from '../utils/format';
import {
  createStaffViaCallable,
  deleteAccountViaCallable,
} from '../services/firebase/functions';
import {
  setStaffActive,
  subscribeStaff,
  updateStaffPermissions,
} from '../services/firebase/staffService';

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
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editTarget, setEditTarget] = useState<StaffRow | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => subscribeStaff(setStaff), []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff
      .filter((s) => {
        if (filter === 'active') return s.isActive;
        if (filter === 'inactive') return !s.isActive;
        return true;
      })
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          (s.email ?? '').toLowerCase().includes(q) ||
          (s.phone ?? '').includes(q)
        );
      });
  }, [staff, search, filter]);

  const pendingDelete = staff.find((s) => s.id === pendingDeleteId) ?? null;

  async function toggleActive(row: StaffRow) {
    setActionBusyId(row.id);
    setActionError(null);
    try {
      await setStaffActive(row.id, !row.isActive);
    } catch (e: unknown) {
      setActionError(toFriendlyError(e));
    } finally {
      setActionBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setActionBusyId(pendingDeleteId);
    setActionError(null);
    try {
      await deleteAccountViaCallable({ role: 'staff', uid: pendingDeleteId });
      setPendingDeleteId(null);
    } catch (e: unknown) {
      setActionError(toFriendlyError(e));
    } finally {
      setActionBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle="Internal users who handle booking-to-driver assignments."
        actions={<Button onClick={() => setShowCreate(true)}>+ Add staff</Button>}
      />

      <Toolbar>
        <Input
          placeholder="Search staff…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          style={{ maxWidth: 180 }}
        >
          <option value="all">All staff</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <span style={{ marginLeft: 'auto', color: 'var(--c-textMuted)', fontSize: 13 }}>
          {rows.length} of {staff.length}
        </span>
      </Toolbar>

      {actionError && (
        <div
          style={{
            margin: '0 0 12px',
            padding: 10,
            background: 'var(--c-errorSoft)',
            color: 'var(--c-error)',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      )}

      <Table
        rows={rows}
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
                {(s.permissions ?? []).map((p) => (
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
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button size="sm" variant="secondary" onClick={() => setEditTarget(s)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleActive(s)}
                  disabled={actionBusyId === s.id}
                >
                  {s.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPendingDeleteId(s.id)}
                  disabled={actionBusyId === s.id}
                  style={{ color: 'var(--c-error)' }}
                >
                  Delete
                </Button>
              </div>
            ),
            align: 'right',
          },
        ]}
      />

      <CreateStaffModal open={showCreate} onClose={() => setShowCreate(false)} />

      <EditStaffModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onError={setActionError}
      />

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDeleteId(null)}
        title="Delete staff?"
        width={440}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setPendingDeleteId(null)}
              disabled={actionBusyId === pendingDeleteId}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={actionBusyId === pendingDeleteId}
            >
              {actionBusyId === pendingDeleteId ? 'Deleting…' : 'Delete forever'}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14 }}>
          This permanently removes <strong>{pendingDelete?.name}</strong> from
          YB Ride. They can no longer sign in to the staff dashboard. Use{' '}
          <em>Disable</em> instead if you may want to restore the account.
        </p>
      </Modal>

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

function EditStaffModal({
  target,
  onClose,
  onError,
}: {
  target: StaffRow | null;
  onClose: () => void;
  onError: (msg: string) => void;
}) {
  const [permissions, setPermissions] = useState<Set<StaffPermission>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (target) setPermissions(new Set(target.permissions ?? []));
  }, [target]);

  function toggle(p: StaffPermission) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  async function save() {
    if (!target) return;
    setSubmitting(true);
    try {
      await updateStaffPermissions(target.id, Array.from(permissions));
      onClose();
    } catch (e: unknown) {
      onError(toFriendlyError(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={target ? `Edit ${target.name}` : 'Edit staff'}
      width={500}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={save} disabled={submitting}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div style={{ fontSize: 13, color: 'var(--c-textMuted)', marginBottom: 8 }}>
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
    </Modal>
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
      setError(toFriendlyError(e));
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

function generateTempPassword(length = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function toFriendlyError(e: unknown): string {
  const msg =
    typeof e === 'object' && e && 'message' in e
      ? String((e as { message: unknown }).message)
      : 'Something went wrong.';
  const lower = msg.toLowerCase();
  if (lower.includes('unauthenticated') || lower.includes('not authenticated')) {
    return 'Sign in as an admin first.';
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
  if (lower.includes('failed-precondition')) {
    return msg.replace(/^.*?:\s*/, '');
  }
  return msg;
}
