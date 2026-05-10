import { useState } from 'react';
import type { Promo, PromoKind } from '@yb/shared';
import {
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  Pill,
  SectionTitle,
  Select,
  Table,
} from '../components/ui';
import { mockPromos } from '../data/mock';
import { formatDate, formatNaira, koboToNaira, nairaToKobo } from '../utils/format';

function promoStatus(p: Promo): { tone: 'success' | 'warning' | 'neutral'; label: string } {
  const now = Date.now();
  if (!p.isActive) return { tone: 'neutral', label: 'Disabled' };
  if (now < p.startsAt) return { tone: 'warning', label: 'Scheduled' };
  if (now > p.expiresAt) return { tone: 'neutral', label: 'Expired' };
  if (p.usageLimit && p.usageCount >= p.usageLimit)
    return { tone: 'neutral', label: 'Used up' };
  return { tone: 'success', label: 'Active' };
}

function describeValue(p: Promo): string {
  if (p.kind === 'percentage') {
    return `${p.value}% off${p.maxDiscount ? ` (max ${formatNaira(p.maxDiscount)})` : ''}`;
  }
  return `${formatNaira(p.value)} off`;
}

export function Promos() {
  const [editing, setEditing] = useState<Promo | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Promos"
        subtitle="Discount codes passengers can apply at checkout."
        actions={<Button onClick={() => setCreating(true)}>+ New promo</Button>}
      />

      <Table
        rows={mockPromos}
        rowKey={(r) => r.id}
        columns={[
          {
            key: 'code',
            header: 'Code',
            render: (p) => (
              <code
                style={{
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, monospace',
                  background: 'var(--c-divider)',
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                {p.code}
              </code>
            ),
          },
          {
            key: 'value',
            header: 'Discount',
            render: describeValue,
          },
          {
            key: 'min',
            header: 'Min trip',
            render: (p) => (p.minTripAmount ? formatNaira(p.minTripAmount) : '—'),
            align: 'right',
          },
          {
            key: 'usage',
            header: 'Usage',
            render: (p) =>
              `${p.usageCount.toLocaleString()}${p.usageLimit ? ` / ${p.usageLimit.toLocaleString()}` : ''}`,
            align: 'right',
          },
          {
            key: 'window',
            header: 'Window',
            render: (p) => (
              <span style={{ fontSize: 13 }}>
                {formatDate(p.startsAt)} → {formatDate(p.expiresAt)}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (p) => {
              const s = promoStatus(p);
              return <Pill tone={s.tone}>{s.label}</Pill>;
            },
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (p) => (
              <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>
                Edit
              </Button>
            ),
          },
        ]}
      />

      <Card style={{ marginTop: 24 }}>
        <SectionTitle>Promo math</SectionTitle>
        <p style={{ fontSize: 13, color: 'var(--c-textMuted)', lineHeight: 1.7 }}>
          A passenger applying <code>WELCOME20</code> on a ₦1,500 trip:
          <br />
          → 20% of ₦1,500 = ₦300, capped at ₦500 → final fare{' '}
          <strong>₦1,200</strong>.
          <br />
          A <code>fixed</code>-kind promo of ₦250 on the same trip → final fare{' '}
          <strong>₦1,250</strong>.
        </p>
      </Card>

      <PromoModal
        open={!!editing || creating}
        promo={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
    </>
  );
}

function PromoModal({
  open,
  promo,
  onClose,
}: {
  open: boolean;
  promo: Promo | null;
  onClose: () => void;
}) {
  const [code, setCode] = useState(promo?.code ?? '');
  const [kind, setKind] = useState<PromoKind>(promo?.kind ?? 'percentage');
  const [value, setValue] = useState(
    promo
      ? promo.kind === 'percentage'
        ? String(promo.value)
        : String(koboToNaira(promo.value))
      : '',
  );
  const [maxDiscount, setMaxDiscount] = useState(
    promo?.maxDiscount ? String(koboToNaira(promo.maxDiscount)) : '',
  );
  const [minTripAmount, setMinTripAmount] = useState(
    promo?.minTripAmount ? String(koboToNaira(promo.minTripAmount)) : '',
  );
  const [usageLimit, setUsageLimit] = useState(
    promo?.usageLimit ? String(promo.usageLimit) : '',
  );
  const [startsAt, setStartsAt] = useState(
    promo ? new Date(promo.startsAt).toISOString().slice(0, 10) : '',
  );
  const [expiresAt, setExpiresAt] = useState(
    promo ? new Date(promo.expiresAt).toISOString().slice(0, 10) : '',
  );
  const [isActive, setIsActive] = useState(promo?.isActive ?? true);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={promo ? `Edit ${promo.code}` : 'New promo'}
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>{promo ? 'Save changes' : 'Create promo'}</Button>
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
        <Field label="Code">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="WELCOME20"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
          />
        </Field>
        <Field label="Type">
          <Select
            value={kind}
            onChange={(e) => setKind(e.target.value as PromoKind)}
          >
            <option value="percentage">Percentage off</option>
            <option value="fixed">Fixed amount off</option>
          </Select>
        </Field>
        <Field label={kind === 'percentage' ? 'Value (%)' : 'Value (₦)'}>
          <Input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={kind === 'percentage' ? '20' : '300'}
          />
        </Field>
        <Field
          label="Max discount (₦)"
          hint={kind === 'fixed' ? 'Not applicable for fixed-amount promos.' : 'Caps the discount.'}
        >
          <Input
            type="number"
            min={0}
            value={maxDiscount}
            onChange={(e) => setMaxDiscount(e.target.value)}
            placeholder="500"
            disabled={kind === 'fixed'}
          />
        </Field>
        <Field label="Min trip amount (₦)">
          <Input
            type="number"
            min={0}
            value={minTripAmount}
            onChange={(e) => setMinTripAmount(e.target.value)}
            placeholder="1000"
          />
        </Field>
        <Field label="Usage limit" hint="Leave blank for unlimited.">
          <Input
            type="number"
            min={0}
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder="1000"
          />
        </Field>
        <Field label="Starts">
          <Input
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </Field>
        <Field label="Expires">
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </Field>
      </div>
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
        <span>Active — passengers can apply this code</span>
      </label>
      {kind === 'fixed' && value && (
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
          Stored as <strong>{nairaToKobo(Number(value)).toLocaleString()} kobo</strong>.
        </div>
      )}
    </Modal>
  );
}
