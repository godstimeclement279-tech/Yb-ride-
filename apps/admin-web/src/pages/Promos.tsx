import { useEffect, useState } from 'react';
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
import { formatDate, formatNaira, koboToNaira, nairaToKobo } from '../utils/format';
import {
  deletePromo,
  savePromo,
  subscribePromos,
} from '../services/firebase/promosService';
import { FIREBASE_CONFIGURED } from '../services/firebase/index';

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
  const [promos, setPromos] = useState<Promo[]>([]);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) {
      setLoading(false);
      return;
    }
    const unsub = subscribePromos(list => {
      setPromos(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <>
      <PageHeader
        title="Promos"
        subtitle="Discount codes passengers can apply at checkout."
        actions={<Button onClick={() => setCreating(true)}>+ New promo</Button>}
      />

      {loading ? (
        <Card>
          <div style={{ padding: 24, color: 'var(--c-textMuted)' }}>Loading…</div>
        </Card>
      ) : promos.length === 0 ? (
        <Card>
          <div style={{ padding: 24, color: 'var(--c-textMuted)' }}>
            No promos yet. Click <strong>+ New promo</strong> to add one.
          </div>
        </Card>
      ) : (
        <Table
          rows={promos}
          rowKey={r => r.id}
          columns={[
            {
              key: 'code',
              header: 'Code',
              render: p => (
                <code
                  style={{
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
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
              render: p => (p.minTripAmount ? formatNaira(p.minTripAmount) : '—'),
              align: 'right',
            },
            {
              key: 'usage',
              header: 'Usage',
              render: p =>
                `${p.usageCount.toLocaleString()}${p.usageLimit ? ` / ${p.usageLimit.toLocaleString()}` : ''}`,
              align: 'right',
            },
            {
              key: 'window',
              header: 'Window',
              render: p => (
                <span style={{ fontSize: 13 }}>
                  {formatDate(p.startsAt)} → {formatDate(p.expiresAt)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: p => {
                const s = promoStatus(p);
                return <Pill tone={s.tone}>{s.label}</Pill>;
              },
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: p => (
                <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>
                  Edit
                </Button>
              ),
            },
          ]}
        />
      )}

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

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when editing target changes
  useEffect(() => {
    setCode(promo?.code ?? '');
    setKind(promo?.kind ?? 'percentage');
    setValue(
      promo
        ? promo.kind === 'percentage'
          ? String(promo.value)
          : String(koboToNaira(promo.value))
        : '',
    );
    setMaxDiscount(promo?.maxDiscount ? String(koboToNaira(promo.maxDiscount)) : '');
    setMinTripAmount(promo?.minTripAmount ? String(koboToNaira(promo.minTripAmount)) : '');
    setUsageLimit(promo?.usageLimit ? String(promo.usageLimit) : '');
    setStartsAt(promo ? new Date(promo.startsAt).toISOString().slice(0, 10) : '');
    setExpiresAt(promo ? new Date(promo.expiresAt).toISOString().slice(0, 10) : '');
    setIsActive(promo?.isActive ?? true);
    setError(null);
  }, [promo, open]);

  async function onSave() {
    setError(null);
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Code is required');
      return;
    }
    if (!value) {
      setError('Value is required');
      return;
    }
    const startTs = startsAt ? new Date(startsAt).getTime() : Date.now();
    const endTs = expiresAt ? new Date(expiresAt).getTime() : startTs + 30 * 86400000;
    if (endTs <= startTs) {
      setError('Expires must be after Starts');
      return;
    }

    setSaving(true);
    try {
      const numericValue =
        kind === 'percentage' ? Number(value) : nairaToKobo(Number(value));
      await savePromo({
        id: trimmedCode,
        code: trimmedCode,
        kind,
        value: numericValue,
        maxDiscount:
          kind === 'percentage' && maxDiscount
            ? nairaToKobo(Number(maxDiscount))
            : undefined,
        minTripAmount: minTripAmount ? nairaToKobo(Number(minTripAmount)) : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        usageCount: promo?.usageCount ?? 0,
        startsAt: startTs,
        expiresAt: endTs,
        isActive,
        createdBy: promo?.createdBy ?? 'test-admin-123',
        createdAt: promo?.createdAt ?? Date.now(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!promo) return;
    if (!confirm(`Delete "${promo.code}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await deletePromo(promo.id);
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
      title={promo ? `Edit ${promo.code}` : 'New promo'}
      width={560}
      footer={
        <>
          {promo && (
            <Button
              variant="ghost"
              onClick={onDelete}
              disabled={saving || deleting}
              style={{ marginRight: 'auto', color: 'var(--c-error)' }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={saving || deleting}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || deleting}>
            {saving ? 'Saving…' : promo ? 'Save changes' : 'Create promo'}
          </Button>
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
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="WELCOME20"
            disabled={!!promo}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
          />
        </Field>
        <Field label="Type">
          <Select value={kind} onChange={e => setKind(e.target.value as PromoKind)}>
            <option value="percentage">Percentage off</option>
            <option value="fixed">Fixed amount off</option>
          </Select>
        </Field>
        <Field label={kind === 'percentage' ? 'Value (%)' : 'Value (₦)'}>
          <Input
            type="number"
            min={0}
            value={value}
            onChange={e => setValue(e.target.value)}
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
            onChange={e => setMaxDiscount(e.target.value)}
            placeholder="500"
            disabled={kind === 'fixed'}
          />
        </Field>
        <Field label="Min trip amount (₦)">
          <Input
            type="number"
            min={0}
            value={minTripAmount}
            onChange={e => setMinTripAmount(e.target.value)}
            placeholder="1000"
          />
        </Field>
        <Field label="Usage limit" hint="Leave blank for unlimited.">
          <Input
            type="number"
            min={0}
            value={usageLimit}
            onChange={e => setUsageLimit(e.target.value)}
            placeholder="1000"
          />
        </Field>
        <Field label="Starts">
          <Input
            type="date"
            value={startsAt}
            onChange={e => setStartsAt(e.target.value)}
          />
        </Field>
        <Field label="Expires">
          <Input
            type="date"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
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
          onChange={e => setIsActive(e.target.checked)}
        />
        <span>Active — passengers can apply this code</span>
      </label>

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
