import { useMemo, useState } from 'react';
import {
  Card,
  KpiCard,
  PageHeader,
  SectionTitle,
  Select,
  Toolbar,
} from '../components/ui';
import { mockBookings, mockCarTypes, mockDrivers } from '../data/mock';
import { formatNaira } from '../utils/format';

const day = 24 * 60 * 60 * 1000;
const RANGES = [
  { id: '24h', label: 'Last 24 hours', ms: 1 * day },
  { id: '7d', label: 'Last 7 days', ms: 7 * day },
  { id: '30d', label: 'Last 30 days', ms: 30 * day },
  { id: 'all', label: 'All time', ms: Number.MAX_SAFE_INTEGER },
] as const;

type RangeId = (typeof RANGES)[number]['id'];

export function Reports() {
  const [range, setRange] = useState<RangeId>('30d');
  const cutoff = useMemo(() => {
    const r = RANGES.find((x) => x.id === range)!;
    return Date.now() - r.ms;
  }, [range]);

  const bookings = mockBookings.filter((b) => b.createdAt >= cutoff);
  const completed = bookings.filter((b) => b.status === 'completed');
  const cancelled = bookings.filter((b) => b.status === 'cancelled');
  const revenue = completed.reduce((sum, b) => sum + b.fare.total, 0);
  const avgFare = completed.length ? Math.round(revenue / completed.length) : 0;

  // bookings per day buckets
  const buckets = useMemo(() => {
    const days: { day: number; count: number; revenue: number }[] = [];
    const buckets = new Map<number, { count: number; revenue: number }>();
    for (const b of bookings) {
      const d = new Date(b.createdAt);
      d.setHours(0, 0, 0, 0);
      const key = d.getTime();
      const cur = buckets.get(key) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      if (b.status === 'completed') cur.revenue += b.fare.total;
      buckets.set(key, cur);
    }
    const sorted = [...buckets.entries()].sort(([a], [b]) => a - b);
    for (const [day, v] of sorted) days.push({ day, ...v });
    return days;
  }, [bookings]);

  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  // breakdown by car type
  const byCarType = useMemo(() => {
    return mockCarTypes.map((ct) => {
      const matching = completed.filter((b) => b.carTypeId === ct.id);
      const total = matching.reduce((sum, b) => sum + b.fare.total, 0);
      return { id: ct.id, name: ct.name, count: matching.length, total };
    });
  }, [completed]);

  // top drivers
  const topDrivers = useMemo(() => {
    const totals = new Map<string, { trips: number; revenue: number }>();
    for (const b of completed) {
      if (!b.driverId) continue;
      const cur = totals.get(b.driverId) ?? { trips: 0, revenue: 0 };
      cur.trips += 1;
      cur.revenue += b.fare.total;
      totals.set(b.driverId, cur);
    }
    return [...totals.entries()]
      .map(([driverId, v]) => {
        const driver = mockDrivers.find((d) => d.id === driverId);
        return { driverId, name: driver?.name ?? driverId, ...v };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [completed]);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Bookings, revenue, and driver performance over time."
      />

      <Toolbar>
        <Select
          value={range}
          onChange={(e) => setRange(e.target.value as RangeId)}
          style={{ maxWidth: 220 }}
        >
          {RANGES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </Select>
      </Toolbar>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <KpiCard
          label="Bookings"
          value={String(bookings.length)}
          delta={`${completed.length} completed`}
          tone="primary"
        />
        <KpiCard
          label="Revenue"
          value={formatNaira(revenue)}
          delta="Completed trips only"
          tone="success"
        />
        <KpiCard
          label="Avg fare"
          value={avgFare ? formatNaira(avgFare) : '—'}
          tone="info"
        />
        <KpiCard
          label="Cancellations"
          value={String(cancelled.length)}
          delta={
            bookings.length
              ? `${Math.round((cancelled.length / bookings.length) * 100)}% of total`
              : '—'
          }
          tone="warning"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <Card>
          <SectionTitle>Bookings per day</SectionTitle>
          {buckets.length === 0 ? (
            <div style={{ color: 'var(--c-textMuted)', fontSize: 13 }}>
              No bookings in this range.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'flex-end',
                height: 180,
                paddingTop: 12,
                paddingBottom: 24,
                position: 'relative',
              }}
            >
              {buckets.map((b) => (
                <div
                  key={b.day}
                  title={`${new Date(b.day).toDateString()} — ${b.count} bookings, ${formatNaira(b.revenue)}`}
                  style={{
                    flex: 1,
                    minWidth: 8,
                    height: `${(b.count / maxBucket) * 100}%`,
                    background:
                      'linear-gradient(180deg, var(--c-primary), var(--c-primaryDim))',
                    borderRadius: '4px 4px 0 0',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: -18,
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      fontSize: 10,
                      color: 'var(--c-textMuted)',
                    }}
                  >
                    {b.count}
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -20,
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      fontSize: 10,
                      color: 'var(--c-textMuted)',
                    }}
                  >
                    {new Date(b.day).getDate()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>Revenue by car type</SectionTitle>
          {byCarType.map((row) => {
            const pct = revenue
              ? Math.round((row.total / revenue) * 100)
              : 0;
            return (
              <div key={row.id} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{row.name}</span>
                  <span style={{ color: 'var(--c-textMuted)' }}>
                    {formatNaira(row.total)} · {row.count} trips
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: 'var(--c-divider)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'var(--c-primary)',
                    }}
                  />
                </div>
              </div>
            );
          })}
          {byCarType.every((r) => r.count === 0) && (
            <div style={{ color: 'var(--c-textMuted)', fontSize: 13 }}>
              No completed trips in this range.
            </div>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card>
          <SectionTitle>Top drivers</SectionTitle>
          {topDrivers.length === 0 ? (
            <div style={{ color: 'var(--c-textMuted)', fontSize: 13 }}>
              No completed trips yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Driver', 'Trips', 'Revenue'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === 'Driver' ? 'left' : 'right',
                        padding: '8px 0',
                        borderBottom: '1px solid var(--c-divider)',
                        fontSize: 12,
                        color: 'var(--c-textMuted)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topDrivers.map((d) => (
                  <tr key={d.driverId}>
                    <td
                      style={{
                        padding: '10px 0',
                        borderBottom: '1px solid var(--c-divider)',
                      }}
                    >
                      {d.name}
                    </td>
                    <td
                      style={{
                        padding: '10px 0',
                        textAlign: 'right',
                        borderBottom: '1px solid var(--c-divider)',
                      }}
                    >
                      {d.trips}
                    </td>
                    <td
                      style={{
                        padding: '10px 0',
                        textAlign: 'right',
                        borderBottom: '1px solid var(--c-divider)',
                        fontWeight: 600,
                      }}
                    >
                      {formatNaira(d.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
