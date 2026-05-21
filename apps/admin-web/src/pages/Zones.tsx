import { useEffect, useState } from 'react';
import type { GeoPoint, Zone } from '@yb/shared';
import { useAuth } from '../context/AuthContext';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Pill,
  SectionTitle,
  Table,
} from '../components/ui';
import { ZoneMapEditor } from '../components/ZoneMapEditor';
import {
  createZone,
  deleteZone,
  subscribeZones,
  updateZone,
} from '../services/firebase/zonesService';
import { formatNaira, formatRelative, koboToNaira, nairaToKobo } from '../utils/format';

export function Zones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsub = subscribeZones((next) => {
      setZones(next);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <>
      <PageHeader
        title="Zones"
        subtitle="Polygon surcharges. Applied when pickup OR dropoff falls inside a zone."
        actions={<Button onClick={() => setCreating(true)}>+ New zone</Button>}
      />

      {zones.length === 0 && !loading ? (
        <EmptyState
          title="No zones yet"
          description="Create your first zone. Draw a polygon on the map and set a flat NGN surcharge — it gets added to fares for any trip whose pickup or dropoff falls inside it."
          action={<Button onClick={() => setCreating(true)}>Create zone</Button>}
        />
      ) : (
        <Table
          rows={zones}
          rowKey={(r) => r.id}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (z) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{z.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
                    {z.id}
                  </div>
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
      )}

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
          <li>Draw or edit polygons directly on the map in the edit dialog.</li>
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
  const { admin } = useAuth();
  const [name, setName] = useState(zone?.name ?? '');
  const [surcharge, setSurcharge] = useState(
    zone ? String(koboToNaira(zone.surcharge)) : '',
  );
  const [polygon, setPolygon] = useState<GeoPoint[]>(zone?.polygon ?? []);
  const [isActive, setIsActive] = useState(zone?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset form whenever the parent reopens the modal with a different zone.
  useEffect(() => {
    if (open) {
      setName(zone?.name ?? '');
      setSurcharge(zone ? String(koboToNaira(zone.surcharge)) : '');
      setPolygon(zone?.polygon ?? []);
      setIsActive(zone?.isActive ?? true);
      setError(null);
    }
  }, [open, zone]);

  function validate(): boolean {
    if (!name.trim()) {
      setError('Zone name is required.');
      return false;
    }
    if (polygon.length < 3) {
      setError('Draw a polygon with at least 3 points on the map.');
      return false;
    }
    const surchargeNum = Number(surcharge);
    if (Number.isNaN(surchargeNum) || surchargeNum < 0) {
      setError('Surcharge must be a number ≥ 0.');
      return false;
    }
    setError(null);
    return true;
  }

  async function save(): Promise<void> {
    if (!validate()) return;
    setSaving(true);
    try {
      const surchargeKobo = nairaToKobo(Number(surcharge));
      if (zone) {
        await updateZone(zone.id, {
          name: name.trim(),
          surcharge: surchargeKobo,
          polygon,
          isActive,
        });
      } else {
        await createZone({
          name: name.trim(),
          surcharge: surchargeKobo,
          polygon,
          isActive,
          createdBy: admin?.id ?? 'admin',
          createdAt: Date.now(),
        });
      }
      onClose();
    } catch (e) {
      console.warn(e);
      setError('Could not save zone. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(): Promise<void> {
    if (!zone) return;
    if (!window.confirm(`Delete "${zone.name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteZone(zone.id);
      onClose();
    } catch (e) {
      console.warn(e);
      setError('Could not delete zone.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={zone ? `Edit ${zone.name}` : 'New zone'}
      width={760}
      footer={
        <>
          {zone && (
            <Button variant="ghost" onClick={remove} disabled={saving}>
              Delete
            </Button>
          )}
          <div style={{ flex: 1 }} />
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : zone ? 'Save changes' : 'Create zone'}
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
        label="Polygon"
        hint="Use the polygon tool (top-left of the map) to draw the zone outline. Click each corner, double-click to finish, drag corners to adjust."
      >
        <ZoneMapEditor polygon={polygon} onChange={setPolygon} height={360} />
      </Field>

      <div style={{ fontSize: 12, color: 'var(--c-textMuted)', marginTop: 6 }}>
        {polygon.length === 0
          ? 'No polygon drawn yet.'
          : `${polygon.length} point${polygon.length === 1 ? '' : 's'} captured.`}
      </div>

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
        Stored as kobo:{' '}
        <strong>
          {surcharge ? nairaToKobo(Number(surcharge)).toLocaleString() : 0}
        </strong>
      </div>
    </Modal>
  );
}
