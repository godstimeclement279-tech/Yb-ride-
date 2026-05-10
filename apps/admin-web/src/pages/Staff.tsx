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
  const [permissions, setPermissions] = useState<Set<StaffPermission>>(
    new Set(['view_bookings', 'assign_drivers']),
  );

  function toggle(p: StaffPermission) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add staff member"
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Create staff</Button>
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
          <Input placeholder="Ngozi Eze" />
        </Field>
        <Field label="Phone">
          <Input placeholder="+234…" />
        </Field>
        <Field label="Email">
          <Input type="email" placeholder="staff@ybride.ng" />
        </Field>
        <Field label="Initial password">
          <Input type="text" defaultValue="staff123" />
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
    </Modal>
  );
}
