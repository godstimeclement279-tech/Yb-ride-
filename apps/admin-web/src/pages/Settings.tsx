import { Button, Card, Field, Input, PageHeader, Pill, SectionTitle, Select, StatRow } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { COLLECTIONS, FIREBASE_REGION, RTDB_PATHS, TEST_USERS } from '@yb/shared';

export function Settings() {
  const { mode, setMode } = useTheme();

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Operational configuration. Some values come from the shared package and are wired in code."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <Card>
          <SectionTitle>Appearance</SectionTitle>
          <Field label="Theme">
            <Select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'light' | 'dark')}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </Field>
        </Card>

        <Card>
          <SectionTitle>Operations</SectionTitle>
          <Field label="Service area">
            <Input defaultValue="Agbor, Delta State, Nigeria" />
          </Field>
          <Field label="Currency" hint="Display only — internal storage is integer kobo.">
            <Select defaultValue="NGN" disabled>
              <option value="NGN">Nigerian Naira (₦)</option>
            </Select>
          </Field>
          <Field
            label="Driver location push interval"
            hint="Frequency drivers push GPS to the realtime database. Default 5s."
          >
            <Input type="number" min={1} defaultValue={5} />
          </Field>
        </Card>

        <Card>
          <SectionTitle>Payments</SectionTitle>
          <Field label="Paystack public key" hint="Production key used by passenger checkout.">
            <Input placeholder="pk_live_…" defaultValue="pk_live_***************************" />
          </Field>
          <Field label="Paystack secret key" hint="Server-side only. Stored in Firebase Functions env.">
            <Input placeholder="sk_live_…" defaultValue="sk_live_***************************" />
          </Field>
          <Field label="Allowed payment methods">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Pill tone="success">Card</Pill>
              <Pill tone="success">Bank transfer</Pill>
              <Pill tone="neutral">Wallet (post-MVP)</Pill>
            </div>
          </Field>
        </Card>

        <Card>
          <SectionTitle>Maps</SectionTitle>
          <Field
            label="Mapbox access token"
            hint="Public token used by passenger and driver maps."
          >
            <Input placeholder="pk.eyJ…" />
          </Field>
          <Field label="Map provider">
            <Select defaultValue="mapbox">
              <option value="mapbox">Mapbox</option>
              <option value="google" disabled>
                Google Maps (post-MVP)
              </option>
            </Select>
          </Field>
        </Card>

        <Card>
          <SectionTitle>Notifications</SectionTitle>
          <Field label="Default SMS sender ID">
            <Input defaultValue="YBRide" />
          </Field>
          <Field label="Booking confirmation email">
            <Input type="email" defaultValue="bookings@ybride.ng" />
          </Field>
        </Card>

        <Card>
          <SectionTitle>System</SectionTitle>
          <StatRow label="Firebase region" value={FIREBASE_REGION} />
          <StatRow label="Bookings collection" value={COLLECTIONS.BOOKINGS} />
          <StatRow label="Drivers collection" value={COLLECTIONS.DRIVERS} />
          <StatRow label="RTDB locations" value={RTDB_PATHS.DRIVER_LOCATIONS} />
          <StatRow label="Test admin UID" value={TEST_USERS.ADMIN} />
          <StatRow label="Build" value="MVP — auth disabled" />
        </Card>
      </div>

      <Card style={{ marginTop: 24 }}>
        <SectionTitle>Danger zone</SectionTitle>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid var(--c-divider)',
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>Reset car types to defaults</div>
            <div style={{ fontSize: 13, color: 'var(--c-textMuted)' }}>
              Replaces current car types with Standard / Premium / SUV.
            </div>
          </div>
          <Button variant="secondary">Reset</Button>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: 'var(--c-error)' }}>
              Wipe seed data
            </div>
            <div style={{ fontSize: 13, color: 'var(--c-textMuted)' }}>
              Removes test bookings, drivers, and passengers. Irreversible.
            </div>
          </div>
          <Button variant="danger">Wipe</Button>
        </div>
      </Card>
    </>
  );
}
