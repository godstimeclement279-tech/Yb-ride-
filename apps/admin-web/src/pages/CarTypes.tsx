import { useEffect, useRef, useState } from 'react';
import type { CarType, Driver } from '@yb/shared';
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
import { mockDrivers } from '../data/mock';
import {
  formatNaira,
  formatNairaExact,
  KOBO_PER_NAIRA,
  koboToNaira,
  nairaToKobo,
} from '../utils/format';
import {
  deleteCarType,
  deleteCarTypeIcon,
  saveCarType,
  subscribeCarTypes,
  uploadCarTypeIcon,
} from '../services/firebase/carTypesService';
import { subscribeDrivers } from '../services/firebase/driversService';
import { FIREBASE_CONFIGURED } from '../services/firebase/index';

export function CarTypes() {
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>(
    FIREBASE_CONFIGURED ? [] : mockDrivers,
  );
  const [editing, setEditing] = useState<CarType | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) {
      setLoading(false);
      return;
    }
    const unsub = subscribeCarTypes(list => {
      setCarTypes(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    return subscribeDrivers(setDrivers);
  }, []);

  function driverCountFor(carTypeId: string): number {
    return drivers.filter(d => d.carTypeId === carTypeId).length;
  }

  return (
    <>
      <PageHeader
        title="Car types"
        subtitle="Pricing tiers passengers see when booking. Money is stored as integer kobo."
        actions={<Button onClick={() => setCreating(true)}>+ New car type</Button>}
      />

      {loading ? (
        <Card>
          <div style={{ padding: 24, color: 'var(--c-textMuted)' }}>Loading…</div>
        </Card>
      ) : carTypes.length === 0 ? (
        <Card>
          <div style={{ padding: 24, color: 'var(--c-textMuted)' }}>
            No car types yet. Click <strong>+ New car type</strong> to add one.
          </div>
        </Card>
      ) : (
        <Table
          rows={[...carTypes].sort((a, b) => a.sortOrder - b.sortOrder)}
          rowKey={r => r.id}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: c => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {c.iconUrl ? (
                    <img
                      src={c.iconUrl}
                      alt={c.name}
                      style={{
                        width: 40,
                        height: 28,
                        objectFit: 'contain',
                        borderRadius: 6,
                        background: 'var(--c-divider)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 28,
                        borderRadius: 6,
                        background: 'var(--c-divider)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                      }}
                    >
                      🚗
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>{c.id}</div>
                  </div>
                </div>
              ),
            },
            {
              key: 'baseFare',
              header: 'Base fare',
              render: c => formatNaira(c.baseFare),
              align: 'right',
            },
            {
              key: 'perKm',
              header: 'Per km',
              render: c => formatNairaExact(c.pricePerKm),
              align: 'right',
            },
            {
              key: 'seats',
              header: 'Seats',
              render: c => c.seats,
              align: 'right',
            },
            {
              key: 'drivers',
              header: 'Drivers assigned',
              render: c => driverCountFor(c.id),
              align: 'right',
            },
            {
              key: 'status',
              header: 'Status',
              render: c =>
                c.isActive ? (
                  <Pill tone="success">Active</Pill>
                ) : (
                  <Pill tone="neutral">Hidden</Pill>
                ),
            },
            {
              key: 'order',
              header: 'Order',
              render: c => c.sortOrder,
              align: 'right',
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: c => (
                <Button size="sm" variant="secondary" onClick={() => setEditing(c)}>
                  Edit
                </Button>
              ),
            },
          ]}
        />
      )}

      <Card style={{ marginTop: 24 }}>
        <SectionTitle>Pricing reference</SectionTitle>
        <p style={{ fontSize: 13, color: 'var(--c-textMuted)', marginBottom: 8 }}>
          Total fare = <strong>base fare + (km × price per km) + applicable zone
          surcharges</strong>. A 6 km Standard ride costs:
        </p>
        <code
          style={{
            display: 'block',
            background: 'var(--c-divider)',
            padding: 12,
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          ₦500 (base) + 6 × ₦100/km = {formatNaira(50_000 + 6 * 10_000)}
        </code>
      </Card>

      <CarTypeModal
        open={!!editing || creating}
        carType={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
    </>
  );
}

function CarTypeModal({
  open,
  carType,
  onClose,
}: {
  open: boolean;
  carType: CarType | null;
  onClose: () => void;
}) {
  const [id, setId] = useState(carType?.id ?? '');
  const [name, setName] = useState(carType?.name ?? '');
  const [baseFare, setBaseFare] = useState(
    carType ? String(koboToNaira(carType.baseFare)) : '',
  );
  const [pricePerKm, setPricePerKm] = useState(
    carType ? String(koboToNaira(carType.pricePerKm)) : '',
  );
  const [seats, setSeats] = useState(carType?.seats ?? 4);
  const [sortOrder, setSortOrder] = useState(carType?.sortOrder ?? 1);
  const [isActive, setIsActive] = useState(carType?.isActive ?? true);
  const [iconUrl, setIconUrl] = useState(carType?.iconUrl ?? '');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset when carType changes
  useEffect(() => {
    setId(carType?.id ?? '');
    setName(carType?.name ?? '');
    setBaseFare(carType ? String(koboToNaira(carType.baseFare)) : '');
    setPricePerKm(carType ? String(koboToNaira(carType.pricePerKm)) : '');
    setSeats(carType?.seats ?? 4);
    setSortOrder(carType?.sortOrder ?? 1);
    setIsActive(carType?.isActive ?? true);
    setIconUrl(carType?.iconUrl ?? '');
    setError(null);
  }, [carType, open]);

  const slug = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const derivedId = id || slug(name);
  const uploadAllowed = derivedId.length > 0;

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!uploadAllowed) {
      setError('Enter a name before uploading an image.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCarTypeIcon(derivedId, file);
      setIconUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onSave() {
    setError(null);
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    const finalId = id || slug(name);
    if (!finalId) {
      setError('Could not derive an ID from the name');
      return;
    }
    setSaving(true);
    try {
      await saveCarType({
        id: finalId,
        name: name.trim(),
        baseFare: nairaToKobo(Number(baseFare) || 0),
        pricePerKm: nairaToKobo(Number(pricePerKm) || 0),
        seats: Number(seats) || 1,
        sortOrder: Number(sortOrder) || 1,
        isActive,
        iconUrl: iconUrl || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!carType) return;
    if (!confirm(`Delete "${carType.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCarType(carType.id);
      // Cascade: remove the stored icon so we don't orphan it in Storage.
      if (carType.iconUrl) {
        await deleteCarTypeIcon(carType.iconUrl);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={carType ? `Edit ${carType.name}` : 'New car type'}
      width={560}
      footer={
        <>
          {carType && (
            <Button
              variant="ghost"
              onClick={onDelete}
              disabled={deleting || saving}
              style={{ marginRight: 'auto', color: 'var(--c-error)' }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={saving || deleting}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || deleting || uploading}>
            {saving ? 'Saving…' : carType ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      {/* Image preview + picker */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: 14,
          border: '1px dashed var(--c-border)',
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 96,
            height: 64,
            borderRadius: 8,
            background: 'var(--c-divider)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {iconUrl ? (
            <img
              src={iconUrl}
              alt="Car icon"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <span style={{ fontSize: 32 }}>🚗</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Car image</div>
          <div style={{ fontSize: 12, color: 'var(--c-textMuted)', marginBottom: 8 }}>
            PNG / JPG with transparent background works best. Stored in Firebase Storage.
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickImage}
            style={{ display: 'none' }}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !uploadAllowed}
            title={!uploadAllowed ? 'Enter a name first' : undefined}
          >
            {uploading ? 'Uploading…' : iconUrl ? 'Replace image' : 'Upload image'}
          </Button>
          {iconUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIconUrl('')}
              style={{ marginLeft: 8 }}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        <Field label="Name">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Standard"
          />
        </Field>
        <Field label="ID (slug)" hint={carType ? 'Cannot change.' : 'Auto-generated from name.'}>
          <Input
            value={id || slug(name)}
            onChange={e => setId(slug(e.target.value))}
            placeholder="standard"
            disabled={!!carType}
          />
        </Field>
        <Field label="Base fare (₦)">
          <Input
            type="number"
            min={0}
            value={baseFare}
            onChange={e => setBaseFare(e.target.value)}
            placeholder="500"
          />
        </Field>
        <Field label="Price per km (₦)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={pricePerKm}
            onChange={e => setPricePerKm(e.target.value)}
            placeholder="100"
          />
        </Field>
        <Field label="Seats">
          <Input
            type="number"
            min={1}
            value={seats}
            onChange={e => setSeats(Number(e.target.value))}
          />
        </Field>
        <Field label="Sort order" hint="Lowest shows first.">
          <Input
            type="number"
            min={1}
            value={sortOrder}
            onChange={e => setSortOrder(Number(e.target.value))}
          />
        </Field>
        <Field label="Visibility">
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              border: '1px solid var(--c-border)',
              borderRadius: 8,
            }}
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
            />
            <span>Active &amp; visible to passengers</span>
          </label>
        </Field>
      </div>

      {error && (
        <div
          style={{
            marginTop: 14,
            padding: 10,
            background: 'var(--c-errorSoft, #FEE2E2)',
            color: 'var(--c-error, #B91C1C)',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

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
        Stored values: base ={' '}
        <strong>
          {baseFare ? nairaToKobo(Number(baseFare)).toLocaleString() : 0} kobo
        </strong>
        , per km ={' '}
        <strong>
          {pricePerKm ? nairaToKobo(Number(pricePerKm)).toLocaleString() : 0} kobo
        </strong>
        . 1 NGN = {KOBO_PER_NAIRA} kobo.
      </div>
    </Modal>
  );
}
