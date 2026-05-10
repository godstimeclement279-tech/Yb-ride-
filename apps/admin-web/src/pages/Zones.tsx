import { useState } from 'react';
import type { Zone } from '@yb/shared';
import {
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  Pill,
  SectionTitle,
  Table,
} from '../components/ui';
import { mockZones } from '../data/mock';
import { formatNaira, formatRelative, koboToNaira, nairaToKobo } from '../utils/format';

export function Zones() {
  const [editing, setEditing] = useState<Zone | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Zones"
        subtitle="Polygon-based surcharges. Applied when pickup OR dropoff falls inside a zone."
        actions={<Button onClick={() => setCreating(true)}>+ New zone</Button>}
      />

      <Table
        rows={mockZones}
        rowKey={(r) => r.id}
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (z) => (
              <div>
                <div style={{ fontWeight: 600 }}>{z.name}</div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>{z.id}</div>
              </div>
            ),
          },
          {
            key: 'surcharge',
            header: 'Surcharge',
            render: (z) => formatNaira(z.surcharge),
            align: 'right',
          },
          {
            key: 'points',
            header: 'Polygon points',
            render: (z) => z.polygon.length,
            align: 'right',
          },
          {
            key: 'status',
            header: 'Status',
            render: (z) =>
              z.isActive ? (
                <Pill tone="success">Active</Pill>
              ) : (
                <Pill tone="neutral">Paused</Pill>
              ),
          },
          {
            key: 'created',
            header: 'Created',
            render: (z) => (
              <span style={{ color: 'var(--c-textMuted)', fontSize: 13 }}>
                {formatRelative(z.createdAt)}
              </span>
            ),
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (z) => (
              <Button size="sm" variant="secondary" onClick={() => setEditing(z)}>
                Edit
              </Button>
            ),
          },
        ]}
      />

      <Card style={{ marginTop: 24 }}>
        <SectionTitle>How zones work</SectionTitle>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            color: 'var(--c-textMuted)',
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          <li>
            A surcharge applies when <strong>either pickup or dropoff</strong> falls
            inside the polygon (point-in-polygon test).
          </li>
          <li>
            Multiple zones can stack — surcharges are summed in{' '}
            <code>fare.zoneSurcharge</code>.
          </li>
          <li>Pause a zone instead of deleting it to preserve history.</li>
          <li>
            Polygon editing in the MVP is JSON-only. A map-based editor is a fast
            follow-up.
          </li>
        </ul>
      </Card>

      <ZoneModal
        open={!!editing || creating}
        zone={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
    </>
  );
}

function ZoneModal({
  open,
  zone,
  onClose,
}: {
  open: boolean;
  zone: Zone | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(zone?.name ?? '');
  const [surcharge, setSurcharge] = useState(
    zone ? String(koboToNaira(zone.surcharge)) : '',
  );
  const [polygonJson, setPolygonJson] = useState(
    zone ? JSON.stringify(zone.polygon, null, 2) : '[\n  { "latitude": 6.215, "longitude": 6.198 }\n]',
  );
  const [isActive, setIsActive] = useState(zone?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  function validate(): boolean {
    try {
      const parsed = JSON.parse(polygonJson);
      if (!Array.isArray(parsed) || parsed.length < 3) {
        setError('Polygon needs at least 3 points.');
        return false;
      }
      for (const p of parsed) {
        if (typeof p?.latitude !== 'number' || typeof p?.longitude !== 'number') {
          setError('Each point needs a numeric latitude and longitude.');
          return false;
        }
      }
      setError(null);
      return true;
    } catch {
      setError('Polygon JSON is invalid.');
      return false;
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={zone ? `Edit ${zone.name}` : 'New zone'}
      width={620}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (validate()) onClose();
            }}
          >
            {zone ? 'Save changes' : 'Create zone'}
          </Button>
        </>
      }
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginBottom: 14,
        }}
      >
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Airport corridor"
          />
        </Field>
        <Field label="Surcharge (₦)">
          <Input
            type="number"
            min={0}
            value={surcharge}
            onChange={(e) => setSurcharge(e.target.value)}
            placeholder="300"
          />
        </Field>
      </div>

      <Field
        label="Polygon (JSON)"
        hint="Ordered ring of GeoPoints. Stored values are integer kobo for surcharge; coordinates are decimal degrees."
      >
        <textarea
          value={polygonJson}
          onChange={(e) => setPolygonJson(e.target.value)}
          rows={10}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--c-border)',
            background: 'var(--c-surface)',
            color: 'var(--c-text)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            outline: 'none',
            resize: 'vertical',
          }}
        />
      </Field>
      {error && (
        <div
          style={{
            color: 'var(--c-error)',
            fontSize: 13,
            marginTop: 8,
          }}
        >
          {error}
        </div>
      )}

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 14,
        }}
      >
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <span>Active — surcharge applies to new bookings</span>
      </label>

      <div
        style={{
          marginTop: 14,
          padding: 12,
          background: 'var(--c-divider)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--c-textMuted)',
        }}
      >
        Surcharge in kobo:{' '}
        <strong>
          {surcharge ? nairaToKobo(Number(surcharge)).toLocaleString() : 0}
        </strong>
      </div>
    </Modal>
  );
}
