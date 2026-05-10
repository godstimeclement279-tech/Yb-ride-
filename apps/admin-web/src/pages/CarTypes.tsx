import { useState } from 'react';
import type { CarType } from '@yb/shared';
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
import { mockCarTypes, mockDrivers } from '../data/mock';
import {
  formatNaira,
  formatNairaExact,
  KOBO_PER_NAIRA,
  koboToNaira,
  nairaToKobo,
} from '../utils/format';

export function CarTypes() {
  const [editing, setEditing] = useState<CarType | null>(null);
  const [creating, setCreating] = useState(false);

  function driverCountFor(carTypeId: string): number {
    return mockDrivers.filter((d) => d.carTypeId === carTypeId).length;
  }

  return (
    <>
      <PageHeader
        title="Car types"
        subtitle="Pricing tiers passengers see when booking. Money is stored as integer kobo."
        actions={<Button onClick={() => setCreating(true)}>+ New car type</Button>}
      />

      <Table
        rows={[...mockCarTypes].sort((a, b) => a.sortOrder - b.sortOrder)}
        rowKey={(r) => r.id}
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (c) => (
              <div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>{c.id}</div>
              </div>
            ),
          },
          {
            key: 'baseFare',
            header: 'Base fare',
            render: (c) => formatNaira(c.baseFare),
            align: 'right',
          },
          {
            key: 'perKm',
            header: 'Per km',
            render: (c) => formatNairaExact(c.pricePerKm),
            align: 'right',
          },
          {
            key: 'seats',
            header: 'Seats',
            render: (c) => c.seats,
            align: 'right',
          },
          {
            key: 'drivers',
            header: 'Drivers assigned',
            render: (c) => driverCountFor(c.id),
            align: 'right',
          },
          {
            key: 'status',
            header: 'Status',
            render: (c) =>
              c.isActive ? (
                <Pill tone="success">Active</Pill>
              ) : (
                <Pill tone="neutral">Hidden</Pill>
              ),
          },
          {
            key: 'order',
            header: 'Order',
            render: (c) => c.sortOrder,
            align: 'right',
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (c) => (
              <Button size="sm" variant="secondary" onClick={() => setEditing(c)}>
                Edit
              </Button>
            ),
          },
        ]}
      />

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={carType ? `Edit ${carType.name}` : 'New car type'}
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>{carType ? 'Save changes' : 'Create'}</Button>
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
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Standard"
          />
        </Field>
        <Field label="Sort order" hint="Lowest shows first.">
          <Input
            type="number"
            min={1}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
        </Field>
        <Field label="Base fare (₦)">
          <Input
            type="number"
            min={0}
            value={baseFare}
            onChange={(e) => setBaseFare(e.target.value)}
            placeholder="500"
          />
        </Field>
        <Field label="Price per km (₦)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={pricePerKm}
            onChange={(e) => setPricePerKm(e.target.value)}
            placeholder="100"
          />
        </Field>
        <Field label="Seats">
          <Input
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
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
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Active &amp; visible to passengers</span>
          </label>
        </Field>
      </div>
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
