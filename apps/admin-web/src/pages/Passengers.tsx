import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Passenger } from '@yb/shared';
import { Button, Input, PageHeader, Pill, Select, Table, Toolbar } from '../components/ui';
import { formatRelative } from '../utils/format';
import {
  setPassengerActive,
  subscribePassengers,
} from '../services/firebase/passengersService';

export function Passengers() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => subscribePassengers(setPassengers), []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return passengers
      .filter((p) => {
        if (filter === 'active') return p.isActive;
        if (filter === 'inactive') return !p.isActive;
        return true;
      })
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.phone ?? '').includes(q) ||
          (p.email ?? '').toLowerCase().includes(q)
        );
      });
  }, [passengers, search, filter]);

  async function toggleActive(p: Passenger) {
    setBusyId(p.id);
    setActionError(null);
    try {
      await setPassengerActive(p.id, !p.isActive);
    } catch (e: unknown) {
      const msg = typeof e === 'object' && e && 'message' in e
        ? String((e as { message: unknown }).message)
        : 'Could not update passenger.';
      setActionError(msg);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Passengers"
        subtitle="Riders who have signed up. Suspend if you need to block a problematic account."
      />

      <Toolbar>
        <Input
          placeholder="Search name, phone, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          style={{ maxWidth: 180 }}
        >
          <option value="all">All passengers</option>
          <option value="active">Active</option>
          <option value="inactive">Suspended</option>
        </Select>
        <span style={{ marginLeft: 'auto', color: 'var(--c-textMuted)', fontSize: 13 }}>
          {rows.length} of {passengers.length}
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
            render: (p) => (
              <Link to={`/passengers/${p.id}`}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>{p.email}</div>
              </Link>
            ),
          },
          { key: 'phone', header: 'Phone', render: (p) => p.phone ?? '—' },
          {
            key: 'trips',
            header: 'Trips',
            render: (p) => (p.totalTrips ?? 0).toLocaleString(),
            align: 'right',
          },
          {
            key: 'rating',
            header: 'Rating',
            render: (p) =>
              p.averageRating !== undefined
                ? `${p.averageRating.toFixed(1)} ★`
                : '—',
            align: 'right',
          },
          {
            key: 'status',
            header: 'Status',
            render: (p) =>
              p.isActive ? (
                <Pill tone="success">Active</Pill>
              ) : (
                <Pill tone="neutral">Suspended</Pill>
              ),
          },
          {
            key: 'created',
            header: 'Joined',
            render: (p) => (
              <span style={{ color: 'var(--c-textMuted)', fontSize: 13 }}>
                {formatRelative(p.createdAt)}
              </span>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (p) => (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleActive(p)}
                disabled={busyId === p.id}
              >
                {p.isActive ? 'Suspend' : 'Reactivate'}
              </Button>
            ),
            align: 'right',
          },
        ]}
      />
    </>
  );
}
