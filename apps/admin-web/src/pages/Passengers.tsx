import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Input, PageHeader, Pill, Select, Table, Toolbar } from '../components/ui';
import { mockPassengers } from '../data/mock';
import { formatRelative } from '../utils/format';

export function Passengers() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockPassengers
      .filter((p) => {
        if (filter === 'active') return p.isActive;
        if (filter === 'inactive') return !p.isActive;
        return true;
      })
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.email.toLowerCase().includes(q)
        );
      });
  }, [search, filter]);

  return (
    <>
      <PageHeader
        title="Passengers"
        subtitle="Riders who have signed up. Read-only — passengers self-register from the app."
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
          <option value="inactive">Inactive</option>
        </Select>
        <span style={{ marginLeft: 'auto', color: 'var(--c-textMuted)', fontSize: 13 }}>
          {rows.length} of {mockPassengers.length}
        </span>
      </Toolbar>

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
          { key: 'phone', header: 'Phone', render: (p) => p.phone },
          {
            key: 'trips',
            header: 'Trips',
            render: (p) => p.totalTrips.toLocaleString(),
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
                <Pill tone="neutral">Inactive</Pill>
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
        ]}
      />
    </>
  );
}
