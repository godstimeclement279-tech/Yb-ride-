import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DriverStatus } from '@yb/shared';
import {
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Table,
  Toolbar,
} from '../components/ui';
import { ApprovalPill, DriverStatusPill } from '../components/status';
import { mockCarTypes, mockDrivers } from '../data/mock';
import { formatNaira, formatRelative } from '../utils/format';

const STATUS_FILTERS: ('all' | DriverStatus | 'pending')[] = [
  'all',
  'pending',
  'online',
  'on_trip',
  'offline',
  'suspended',
];

export function Drivers() {
  const [filter, setFilter] = useState<'all' | DriverStatus | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockDrivers
      .filter((d) => {
        if (filter === 'all') return true;
        if (filter === 'pending') return !d.approvedAt;
        return d.status === filter;
      })
      .filter((d) => {
        if (!q) return true;
        return (
          d.name.toLowerCase().includes(q) ||
          d.phone.includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.vehicle.plate.toLowerCase().includes(q)
        );
      });
  }, [filter, search]);

  return (
    <>
      <PageHeader
        title="Drivers"
        subtitle="Onboarded drivers, vehicle assignments, and approval state."
        actions={
          <Button onClick={() => setShowCreate(true)}>+ Add driver</Button>
        }
      />

      <Toolbar>
        <Input
          placeholder="Search name, phone, plate…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          style={{ maxWidth: 200 }}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === 'all'
                ? 'All drivers'
                : s === 'pending'
                  ? 'Pending approval'
                  : s.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
        <span style={{ marginLeft: 'auto', color: 'var(--c-textMuted)', fontSize: 13 }}>
          {rows.length} of {mockDrivers.length}
        </span>
      </Toolbar>

      <Table
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          {
            key: 'name',
            header: 'Driver',
            render: (d) => (
              <Link to={`/drivers/${d.id}`}>
                <div style={{ fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>{d.phone}</div>
              </Link>
            ),
          },
          {
            key: 'vehicle',
            header: 'Vehicle',
            render: (d) => (
              <div>
                <div>
                  {d.vehicle.make} {d.vehicle.model} ({d.vehicle.year})
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
                  {d.vehicle.color} · {d.vehicle.plate}
                </div>
              </div>
            ),
          },
          {
            key: 'carType',
            header: 'Tier',
            render: (d) => {
              const ct = mockCarTypes.find((c) => c.id === d.carTypeId);
              return ct?.name ?? '—';
            },
          },
          {
            key: 'status',
            header: 'Status',
            render: (d) => <DriverStatusPill status={d.status} />,
          },
          {
            key: 'approval',
            header: 'Approval',
            render: (d) => <ApprovalPill approved={!!d.approvedAt} />,
          },
          {
            key: 'rating',
            header: 'Rating',
            render: (d) =>
              d.averageRating !== undefined ? (
                <span>{d.averageRating.toFixed(1)} ★</span>
              ) : (
                <span style={{ color: 'var(--c-textMuted)' }}>—</span>
              ),
            align: 'right',
          },
          {
            key: 'trips',
            header: 'Trips',
            render: (d) => d.totalTrips.toLocaleString(),
            align: 'right',
          },
          {
            key: 'earnings',
            header: 'Lifetime earnings',
            render: (d) => formatNaira(d.totalEarningsKobo),
            align: 'right',
          },
          {
            key: 'updated',
            header: 'Last seen',
            render: (d) => (
              <span style={{ color: 'var(--c-textMuted)', fontSize: 13 }}>
                {formatRelative(d.lastLocationUpdate ?? d.updatedAt)}
              </span>
            ),
          },
        ]}
      />

      <CreateDriverModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

function CreateDriverModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add driver"
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Create driver</Button>
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
          <Input placeholder="e.g. Emeka Obi" />
        </Field>
        <Field label="Phone">
          <Input placeholder="+234…" />
        </Field>
        <Field label="Email">
          <Input type="email" placeholder="driver@ybride.ng" />
        </Field>
        <Field label="Car tier">
          <Select defaultValue="ct-standard">
            {mockCarTypes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Vehicle make">
          <Input placeholder="Toyota" />
        </Field>
        <Field label="Vehicle model">
          <Input placeholder="Corolla" />
        </Field>
        <Field label="Year">
          <Input type="number" placeholder="2018" />
        </Field>
        <Field label="Plate">
          <Input placeholder="AGB-XXX-XX" />
        </Field>
        <Field label="Color">
          <Input placeholder="Silver" />
        </Field>
        <Field label="Initial password" hint="Driver will be asked to change on first login.">
          <Input type="text" defaultValue="driver123" />
        </Field>
      </div>
      <p
        style={{
          marginTop: 14,
          fontSize: 12,
          color: 'var(--c-textMuted)',
        }}
      >
        New drivers start as <strong>inactive</strong>. Documents must be uploaded before
        they can be approved to take trips.
      </p>
    </Modal>
  );
}
