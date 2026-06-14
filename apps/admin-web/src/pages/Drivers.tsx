import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CarType, Driver, DriverStatus } from '@yb/shared';
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
import { subscribeCarTypes } from '../services/firebase/carTypesService';
import {
  subscribeDrivers,
  setDriverActive,
} from '../services/firebase/driversService';
import {
  createStaffViaCallable,
  deleteAccountViaCallable,
} from '../services/firebase/functions';
import { useAuth } from '../context/AuthContext';
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
  const { admin } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [filter, setFilter] = useState<'all' | DriverStatus | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => subscribeDrivers(setDrivers), []);
  useEffect(() => subscribeCarTypes(setCarTypes), []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drivers
      .filter((d) => {
        if (filter === 'all') return true;
        if (filter === 'pending') return !d.approvedAt;
        return d.status === filter;
      })
      .filter((d) => {
        if (!q) return true;
        return (
          d.name.toLowerCase().includes(q) ||
          (d.phone ?? '').includes(q) ||
          (d.email ?? '').toLowerCase().includes(q) ||
          (d.vehicle?.plate ?? '').toLowerCase().includes(q)
        );
      });
  }, [drivers, filter, search]);

  const pendingDelete = drivers.find((d) => d.id === pendingDeleteId) ?? null;

  async function toggleActive(driver: Driver) {
    if (!admin) return;
    setActionBusyId(driver.id);
    setActionError(null);
    try {
      await setDriverActive(driver.id, !driver.isActive, admin.id);
    } catch (e: unknown) {
      setActionError(driverActionError(e));
    } finally {
      setActionBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setActionBusyId(pendingDeleteId);
    setActionError(null);
    try {
      await deleteAccountViaCallable({ role: 'driver', uid: pendingDeleteId });
      setPendingDeleteId(null);
    } catch (e: unknown) {
      setActionError(driverActionError(e));
    } finally {
      setActionBusyId(null);
    }
  }

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
          {rows.length} of {drivers.length}
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
            header: 'Driver',
            render: (d) => (
              <Link to={`/drivers/${d.id}`}>
                <div style={{ fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
                  {d.phone}
                </div>
              </Link>
            ),
          },
          {
            key: 'vehicle',
            header: 'Vehicle',
            render: (d) =>
              d.vehicle ? (
                <div>
                  <div>
                    {d.vehicle.make} {d.vehicle.model} ({d.vehicle.year})
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
                    {d.vehicle.color} · {d.vehicle.plate}
                  </div>
                </div>
              ) : (
                <span style={{ color: 'var(--c-textMuted)' }}>—</span>
              ),
          },
          {
            key: 'carType',
            header: 'Tier',
            render: (d) => {
              const ct = carTypes.find((c) => c.id === d.carTypeId);
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
            render: (d) => <ApprovalPill approved={!!d.approvedAt && d.isActive} />,
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
            render: (d) => (d.totalTrips ?? 0).toLocaleString(),
            align: 'right',
          },
          {
            key: 'earnings',
            header: 'Lifetime earnings',
            render: (d) => formatNaira(d.totalEarningsKobo ?? 0),
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
          {
            key: 'actions',
            header: '',
            render: (d) => (
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  size="sm"
                  variant={d.isActive ? 'ghost' : 'secondary'}
                  disabled={actionBusyId === d.id}
                  onClick={() => toggleActive(d)}
                >
                  {d.isActive ? 'Suspend' : 'Approve'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={actionBusyId === d.id}
                  onClick={() => setPendingDeleteId(d.id)}
                  style={{ color: 'var(--c-error)' }}
                >
                  Delete
                </Button>
              </div>
            ),
            align: 'right',
          },
        ]}
      />

      <CreateDriverModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        carTypes={carTypes}
      />

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDeleteId(null)}
        title="Delete driver?"
        width={440}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setPendingDeleteId(null)}
              disabled={actionBusyId === pendingDeleteId}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={actionBusyId === pendingDeleteId}
              style={{ background: 'var(--c-error)', color: '#fff' }}
            >
              {actionBusyId === pendingDeleteId ? 'Deleting…' : 'Delete forever'}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14 }}>
          This permanently removes <strong>{pendingDelete?.name}</strong> from
          YB Ride. They can no longer sign in. Past bookings will keep the
          driver name for the record. Use <em>Suspend</em> instead if you may
          want to restore the account later.
        </p>
      </Modal>
    </>
  );
}

function CreateDriverModal({
  open,
  onClose,
  carTypes,
}: {
  open: boolean;
  onClose: () => void;
  carTypes: CarType[];
}) {
  const firstCarType = carTypes[0]?.id ?? 'standard';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [carTypeId, setCarTypeId] = useState<string>(firstCarType);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<string>(String(new Date().getFullYear() - 5));
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [password, setPassword] = useState(generateTempPassword());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ email: string; password: string } | null>(null);

  // Keep car-type select valid as the catalog loads.
  useEffect(() => {
    if (!carTypes.find((c) => c.id === carTypeId) && carTypes[0]) {
      setCarTypeId(carTypes[0].id);
    }
  }, [carTypes, carTypeId]);

  function reset() {
    setName('');
    setPhone('');
    setEmail('');
    setCarTypeId(carTypes[0]?.id ?? 'standard');
    setMake('');
    setModel('');
    setYear(String(new Date().getFullYear() - 5));
    setPlate('');
    setColor('');
    setPassword(generateTempPassword());
    setSubmitting(false);
    setError(null);
    setSuccess(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function submit() {
    if (
      !name.trim() || !phone.trim() || !email.trim() ||
      !make.trim() || !model.trim() || !plate.trim() || !color.trim()
    ) {
      setError('Fill every field.');
      return;
    }
    const yearNum = parseInt(year, 10);
    if (Number.isNaN(yearNum) || yearNum < 1980 || yearNum > new Date().getFullYear() + 1) {
      setError('Year looks wrong.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createStaffViaCallable({
        role: 'driver',
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim(),
        carTypeId,
        vehicle: {
          make: make.trim(),
          model: model.trim(),
          year: yearNum,
          plate: plate.trim().toUpperCase(),
          color: color.trim(),
        },
      });
      setSuccess({ email: email.trim(), password });
    } catch (e: unknown) {
      setError(driverActionError(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Modal
        open={open}
        onClose={close}
        title="Driver account created"
        width={520}
        footer={<Button onClick={close}>Done</Button>}
      >
        <div style={{ fontSize: 14, color: 'var(--c-textMuted)', marginBottom: 12 }}>
          Share these credentials with the driver. They sign in at the driver
          app. The account stays <strong>inactive</strong> until you approve them
          from the Drivers list.
        </div>
        <div
          style={{
            background: 'var(--c-divider)',
            padding: 12,
            borderRadius: 8,
            display: 'grid',
            gap: 6,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 13,
          }}
        >
          <div>
            <span style={{ color: 'var(--c-textMuted)' }}>Email:</span>{' '}
            <strong>{success.email}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--c-textMuted)' }}>Password:</span>{' '}
            <strong>{success.password}</strong>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add driver"
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create driver'}
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
        <Field label="Full name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Emeka Obi"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234…"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="driver@ybride.ng"
          />
        </Field>
        <Field label="Car tier">
          <Select
            value={carTypeId}
            onChange={(e) => setCarTypeId(e.target.value)}
          >
            {carTypes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Vehicle make">
          <Input
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Toyota"
          />
        </Field>
        <Field label="Vehicle model">
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Corolla"
          />
        </Field>
        <Field label="Year">
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2018"
          />
        </Field>
        <Field label="Plate">
          <Input
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="AGB-XXX-XX"
          />
        </Field>
        <Field label="Color">
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Silver"
          />
        </Field>
        <Field label="Initial password" hint="Driver will be asked to change on first login.">
          <Input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      </div>

      {error && (
        <div
          style={{
            marginTop: 14,
            padding: 10,
            background: 'var(--c-errorSoft)',
            color: 'var(--c-error)',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <p
        style={{
          marginTop: 14,
          fontSize: 12,
          color: 'var(--c-textMuted)',
        }}
      >
        New drivers start as <strong>inactive</strong>. Approve them from the
        Drivers list once their documents are uploaded.
      </p>
    </Modal>
  );
}

function generateTempPassword(length = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function driverActionError(e: unknown): string {
  const msg =
    typeof e === 'object' && e && 'message' in e
      ? String((e as { message: unknown }).message)
      : 'Could not finish that action.';
  const lower = msg.toLowerCase();
  if (lower.includes('unauthenticated')) {
    return 'Sign in as an admin first.';
  }
  if (lower.includes('permission-denied')) {
    return 'Your account does not have admin privileges.';
  }
  if (lower.includes('already-exists') || lower.includes('email or phone')) {
    return 'Email or phone is already in use. Try another.';
  }
  if (lower.includes('invalid-argument')) {
    return 'One or more fields are invalid. Check email + phone + plate format.';
  }
  if (lower.includes('failed-precondition')) {
    return msg.replace(/^.*?:\s*/, '');
  }
  return msg;
}
